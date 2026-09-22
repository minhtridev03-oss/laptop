begin;

create table if not exists public.product_alert_subscriptions (
  id uuid primary key default gen_random_uuid(),
  product_id text not null references public.products(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  email text not null,
  target_price numeric(14, 2) check (target_price is null or target_price > 0),
  notify_back_in_stock boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (product_id, email),
  constraint product_alert_condition check (is_active = false or target_price is not null or notify_back_in_stock = true)
);
create index if not exists product_alerts_active_idx
  on public.product_alert_subscriptions (product_id, is_active) where is_active = true;

alter table public.product_alert_subscriptions enable row level security;
drop policy if exists "product_alerts_owner_read" on public.product_alert_subscriptions;
create policy "product_alerts_owner_read" on public.product_alert_subscriptions for select to authenticated using (user_id = auth.uid());
drop policy if exists "product_alerts_staff_read" on public.product_alert_subscriptions;
create policy "product_alerts_staff_read" on public.product_alert_subscriptions for select to authenticated using (public.is_staff());
revoke all on public.product_alert_subscriptions from anon, authenticated;
grant select on public.product_alert_subscriptions to authenticated;
drop trigger if exists product_alerts_set_updated_at on public.product_alert_subscriptions;
create trigger product_alerts_set_updated_at before update on public.product_alert_subscriptions
for each row execute function public.set_updated_at();

create or replace function public.subscribe_product_alert(
  p_product_id text,
  p_email text,
  p_target_price numeric default null,
  p_notify_back_in_stock boolean default false
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_email text := lower(btrim(coalesce(p_email, '')));
  v_result public.product_alert_subscriptions%rowtype;
begin
  if v_email !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$' then raise exception 'INVALID_EMAIL'; end if;
  if p_target_price is null and not p_notify_back_in_stock then raise exception 'ALERT_CONDITION_REQUIRED'; end if;
  if p_target_price is not null and p_target_price <= 0 then raise exception 'INVALID_TARGET_PRICE'; end if;
  if not exists (select 1 from public.products where id = p_product_id and status = 'active') then raise exception 'PRODUCT_NOT_FOUND'; end if;

  insert into public.product_alert_subscriptions (product_id, user_id, email, target_price, notify_back_in_stock, is_active)
  values (p_product_id, auth.uid(), v_email, p_target_price, p_notify_back_in_stock, true)
  on conflict (product_id, email) do update set
    user_id = coalesce(public.product_alert_subscriptions.user_id, auth.uid()),
    target_price = excluded.target_price,
    notify_back_in_stock = excluded.notify_back_in_stock,
    is_active = true,
    updated_at = now()
  returning * into v_result;
  return jsonb_build_object('id', v_result.id, 'email', v_result.email, 'is_active', v_result.is_active);
end;
$$;
revoke all on function public.subscribe_product_alert(text, text, numeric, boolean) from public;
grant execute on function public.subscribe_product_alert(text, text, numeric, boolean) to anon, authenticated;

create or replace function public.enqueue_product_alerts()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.price is distinct from old.price then
    insert into public.notification_outbox (event_type, channel, recipient, payload)
    select 'product_price_target_reached', 'email', a.email,
      jsonb_build_object('product_id', new.id, 'product_name', new.name, 'price', new.price, 'target_price', a.target_price)
    from public.product_alert_subscriptions a
    where a.product_id = new.id and a.is_active = true and a.target_price is not null
      and new.price <= a.target_price and (old.price is null or old.price > a.target_price);

    update public.product_alert_subscriptions
    set target_price = null, is_active = notify_back_in_stock, updated_at = now()
    where product_id = new.id and is_active = true and target_price is not null
      and new.price <= target_price and (old.price is null or old.price > target_price);
  end if;

  if coalesce(new.stock_quantity, 0) > 0 and coalesce(old.stock_quantity, 0) <= 0 then
    insert into public.notification_outbox (event_type, channel, recipient, payload)
    select 'product_back_in_stock', 'email', a.email,
      jsonb_build_object('product_id', new.id, 'product_name', new.name, 'stock_quantity', new.stock_quantity)
    from public.product_alert_subscriptions a
    where a.product_id = new.id and a.is_active = true and a.notify_back_in_stock = true;

    update public.product_alert_subscriptions
    set notify_back_in_stock = false, is_active = (target_price is not null), updated_at = now()
    where product_id = new.id and is_active = true and notify_back_in_stock = true;
  end if;

  update public.product_alert_subscriptions
  set is_active = false, updated_at = now()
  where product_id = new.id and is_active = true and target_price is null and notify_back_in_stock = false;
  return new;
end;
$$;
drop trigger if exists products_enqueue_alerts on public.products;
create trigger products_enqueue_alerts after update of price, stock_quantity on public.products
for each row execute function public.enqueue_product_alerts();

commit;
