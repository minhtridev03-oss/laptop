begin;

-- Keep every authenticated customer backed by a durable profile row.
create or replace function public.handle_new_customer_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.customer_profiles (user_id, full_name)
  values (new.id, nullif(btrim(coalesce(new.raw_user_meta_data->>'full_name', '')), ''))
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists auth_user_create_customer_profile on auth.users;
create trigger auth_user_create_customer_profile
  after insert on auth.users
  for each row execute function public.handle_new_customer_user();

insert into public.customer_profiles (user_id, full_name)
select id, nullif(btrim(coalesce(raw_user_meta_data->>'full_name', '')), '')
from auth.users
on conflict (user_id) do nothing;

-- Exactly one default address per customer. The trigger also makes the first
-- address default automatically.
with ranked_defaults as (
  select id, row_number() over (partition by user_id order by updated_at desc, created_at desc) as position
  from public.customer_addresses
  where is_default = true
)
update public.customer_addresses
set is_default = false
where id in (select id from ranked_defaults where position > 1);

create unique index if not exists customer_addresses_one_default_idx
  on public.customer_addresses (user_id)
  where is_default = true;

create or replace function public.manage_customer_default_address()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if not exists (
    select 1 from public.customer_addresses
    where user_id = new.user_id and id is distinct from new.id
  ) then
    new.is_default := true;
  end if;

  if new.is_default then
    update public.customer_addresses
    set is_default = false, updated_at = now()
    where user_id = new.user_id
      and id is distinct from new.id
      and is_default = true;
  end if;
  return new;
end;
$$;

drop trigger if exists customer_addresses_manage_default on public.customer_addresses;
create trigger customer_addresses_manage_default
  before insert or update of is_default on public.customer_addresses
  for each row execute function public.manage_customer_default_address();

create or replace function public.promote_customer_default_address()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if old.is_default then
    update public.customer_addresses
    set is_default = true, updated_at = now()
    where id = (
      select id from public.customer_addresses
      where user_id = old.user_id
      order by updated_at desc, created_at desc
      limit 1
    );
  end if;
  return old;
end;
$$;

drop trigger if exists customer_addresses_promote_default on public.customer_addresses;
create trigger customer_addresses_promote_default
  after delete on public.customer_addresses
  for each row execute function public.promote_customer_default_address();

-- Atomically replace the signed-in customer's cart. Product price is never
-- accepted here; the storefront reloads authoritative products by foreign key.
create or replace function public.sync_customer_cart(p_items jsonb)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_cart_id uuid;
  v_item jsonb;
  v_product_ids text[] := array[]::text[];
  v_product_id text;
  v_quantity integer;
begin
  if v_user_id is null then raise exception 'AUTH_REQUIRED'; end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) > 30 then raise exception 'INVALID_CART'; end if;

  insert into public.shopping_carts (user_id)
  values (v_user_id)
  on conflict (user_id) do update set updated_at = now()
  returning id into v_cart_id;

  for v_item in select value from jsonb_array_elements(p_items)
  loop
    v_product_id := btrim(coalesce(v_item->>'product_id', ''));
    if v_product_id = '' or coalesce(v_item->>'quantity', '') !~ '^[0-9]+$' then raise exception 'INVALID_CART_ITEM'; end if;
    v_quantity := (v_item->>'quantity')::integer;
    if v_quantity < 1 or v_quantity > 10 then raise exception 'INVALID_QUANTITY'; end if;
    if not exists (select 1 from public.products where id = v_product_id and status = 'active') then raise exception 'PRODUCT_UNAVAILABLE'; end if;
    if v_product_id = any(v_product_ids) then raise exception 'DUPLICATE_CART_ITEM'; end if;
    v_product_ids := array_append(v_product_ids, v_product_id);

    insert into public.cart_items (cart_id, product_id, quantity)
    values (v_cart_id, v_product_id, v_quantity)
    on conflict (cart_id, product_id) do update
    set quantity = excluded.quantity, updated_at = now();
  end loop;

  delete from public.cart_items
  where cart_id = v_cart_id
    and not (product_id = any(v_product_ids));
end;
$$;

revoke all on function public.sync_customer_cart(jsonb) from public;
grant execute on function public.sync_customer_cart(jsonb) to authenticated;

create or replace function public.sync_customer_wishlist(p_product_ids jsonb)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user_id uuid := auth.uid();
  v_value jsonb;
  v_product_ids text[] := array[]::text[];
  v_product_id text;
begin
  if v_user_id is null then raise exception 'AUTH_REQUIRED'; end if;
  if jsonb_typeof(p_product_ids) <> 'array' or jsonb_array_length(p_product_ids) > 100 then raise exception 'INVALID_WISHLIST'; end if;

  for v_value in select value from jsonb_array_elements(p_product_ids)
  loop
    v_product_id := btrim(coalesce(v_value#>>'{}', ''));
    if v_product_id = '' then raise exception 'INVALID_PRODUCT_ID'; end if;
    if not exists (select 1 from public.products where id = v_product_id and status = 'active') then continue; end if;
    if not (v_product_id = any(v_product_ids)) then
      v_product_ids := array_append(v_product_ids, v_product_id);
      insert into public.wishlist_items (user_id, product_id)
      values (v_user_id, v_product_id)
      on conflict (user_id, product_id) do nothing;
    end if;
  end loop;

  delete from public.wishlist_items
  where user_id = v_user_id
    and not (product_id = any(v_product_ids));
end;
$$;

revoke all on function public.sync_customer_wishlist(jsonb) from public;
grant execute on function public.sync_customer_wishlist(jsonb) to authenticated;

commit;
