-- Laptop World commerce foundation for Supabase/PostgreSQL.
-- Run this migration once in the Supabase SQL editor or through Supabase CLI.

create extension if not exists pgcrypto;

alter table public.products
  add column if not exists sku text,
  add column if not exists brand text,
  add column if not exists status text not null default 'active',
  add column if not exists stock_quantity integer,
  add column if not exists sold_count integer not null default 0,
  add column if not exists specifications jsonb not null default '{}'::jsonb,
  add column if not exists updated_at timestamptz not null default now();

create unique index if not exists products_sku_unique_idx
  on public.products (sku)
  where sku is not null;
create index if not exists products_status_idx on public.products (status);
create index if not exists products_brand_idx on public.products (brand);

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'products_status_check') then
    alter table public.products add constraint products_status_check
      check (status in ('draft', 'active', 'inactive', 'discontinued'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'products_stock_quantity_check') then
    alter table public.products add constraint products_stock_quantity_check
      check (stock_quantity is null or stock_quantity >= 0);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'products_sold_count_check') then
    alter table public.products add constraint products_sold_count_check
      check (sold_count >= 0);
  end if;
end $$;

-- Keep the current flat specification columns while also exposing one structured field.
update public.products
set specifications = jsonb_strip_nulls(jsonb_build_object(
  'cpu', spec_cpu,
  'ram', spec_ram,
  'storage', spec_storage,
  'gpu', spec_gpu
))
where specifications = '{}'::jsonb;

create table if not exists public.customer_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.customer_addresses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  label text not null default 'Địa chỉ nhận hàng',
  recipient_name text not null,
  phone text not null,
  address_line text not null,
  ward text,
  district text,
  province text not null,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists customer_addresses_user_idx on public.customer_addresses (user_id);

create table if not exists public.wishlist_items (
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id text not null references public.products(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, product_id)
);

create table if not exists public.shopping_carts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.cart_items (
  cart_id uuid not null references public.shopping_carts(id) on delete cascade,
  product_id text not null references public.products(id) on delete cascade,
  quantity integer not null check (quantity between 1 and 10),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (cart_id, product_id)
);

create table if not exists public.campaigns (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  status text not null default 'draft' check (status in ('draft', 'active', 'paused', 'ended')),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  discount_type text not null default 'fixed_price' check (discount_type in ('fixed_price', 'percentage', 'amount')),
  discount_value numeric(14, 2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at > starts_at)
);

create table if not exists public.campaign_products (
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  product_id text not null references public.products(id) on delete cascade,
  campaign_price numeric(14, 2) check (campaign_price is null or campaign_price >= 0),
  purchase_limit integer check (purchase_limit is null or purchase_limit > 0),
  primary key (campaign_id, product_id)
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_code text not null unique,
  user_id uuid references auth.users(id) on delete set null,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'processing', 'shipping', 'completed', 'cancelled')),
  customer_name text not null,
  customer_phone text not null,
  customer_email text,
  shipping_address text not null,
  shipping_province text not null,
  payment_method text not null check (payment_method in ('cod', 'bank_transfer', 'showroom')),
  payment_status text not null default 'unpaid' check (payment_status in ('unpaid', 'pending', 'paid', 'refunded')),
  subtotal numeric(14, 2) not null default 0 check (subtotal >= 0),
  shipping_fee numeric(14, 2) not null default 0 check (shipping_fee >= 0),
  discount_total numeric(14, 2) not null default 0 check (discount_total >= 0),
  total numeric(14, 2) not null default 0 check (total >= 0),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists orders_user_idx on public.orders (user_id, created_at desc);
create index if not exists orders_phone_code_idx on public.orders (customer_phone, order_code);
create index if not exists orders_status_idx on public.orders (status, created_at desc);

create table if not exists public.order_items (
  id bigint generated by default as identity primary key,
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id text not null references public.products(id) on delete restrict,
  product_name text not null,
  product_image text,
  unit_price numeric(14, 2) not null check (unit_price >= 0),
  quantity integer not null check (quantity between 1 and 10),
  line_total numeric(14, 2) generated always as (unit_price * quantity) stored,
  product_snapshot jsonb not null default '{}'::jsonb
);
create index if not exists order_items_order_idx on public.order_items (order_id);

alter table public.customer_profiles enable row level security;
alter table public.customer_addresses enable row level security;
alter table public.wishlist_items enable row level security;
alter table public.shopping_carts enable row level security;
alter table public.cart_items enable row level security;
alter table public.campaigns enable row level security;
alter table public.campaign_products enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

drop policy if exists "profiles_read_own" on public.customer_profiles;
create policy "profiles_read_own" on public.customer_profiles for select using (auth.uid() = user_id);
drop policy if exists "profiles_insert_own" on public.customer_profiles;
create policy "profiles_insert_own" on public.customer_profiles for insert with check (auth.uid() = user_id);
drop policy if exists "profiles_update_own" on public.customer_profiles;
create policy "profiles_update_own" on public.customer_profiles for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "addresses_manage_own" on public.customer_addresses;
create policy "addresses_manage_own" on public.customer_addresses for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "wishlist_manage_own" on public.wishlist_items;
create policy "wishlist_manage_own" on public.wishlist_items for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "carts_manage_own" on public.shopping_carts;
create policy "carts_manage_own" on public.shopping_carts for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "cart_items_manage_own" on public.cart_items;
create policy "cart_items_manage_own" on public.cart_items for all
using (exists (select 1 from public.shopping_carts c where c.id = cart_id and c.user_id = auth.uid()))
with check (exists (select 1 from public.shopping_carts c where c.id = cart_id and c.user_id = auth.uid()));

drop policy if exists "campaigns_public_active" on public.campaigns;
create policy "campaigns_public_active" on public.campaigns for select
using (status = 'active' and now() between starts_at and ends_at);
drop policy if exists "campaign_products_public_active" on public.campaign_products;
create policy "campaign_products_public_active" on public.campaign_products for select
using (exists (
  select 1 from public.campaigns c
  where c.id = campaign_id and c.status = 'active' and now() between c.starts_at and c.ends_at
));

drop policy if exists "orders_read_own" on public.orders;
create policy "orders_read_own" on public.orders for select using (auth.uid() = user_id);
drop policy if exists "order_items_read_own" on public.order_items;
create policy "order_items_read_own" on public.order_items for select
using (exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid()));

grant select on public.campaigns, public.campaign_products to anon, authenticated;
grant select, insert, update, delete on public.customer_profiles, public.customer_addresses, public.wishlist_items, public.shopping_carts, public.cart_items to authenticated;
grant select on public.orders, public.order_items to authenticated;
revoke insert, update, delete on public.orders, public.order_items from anon, authenticated;

create or replace function public.create_guest_order(
  p_customer jsonb,
  p_items jsonb,
  p_payment_method text default 'cod',
  p_notes text default null
) returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_order_id uuid;
  v_order_code text;
  v_item jsonb;
  v_product public.products%rowtype;
  v_product_id text;
  v_quantity integer;
  v_subtotal numeric(14, 2) := 0;
  v_shipping_fee numeric(14, 2) := 0;
  v_total numeric(14, 2) := 0;
  v_name text := btrim(coalesce(p_customer->>'full_name', ''));
  v_phone text := btrim(coalesce(p_customer->>'phone', ''));
  v_email text := nullif(btrim(coalesce(p_customer->>'email', '')), '');
  v_address text := btrim(coalesce(p_customer->>'address', ''));
  v_province text := btrim(coalesce(p_customer->>'province', ''));
begin
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 or jsonb_array_length(p_items) > 30 then
    raise exception 'INVALID_CART';
  end if;
  if char_length(v_name) < 2 or char_length(v_name) > 120 then raise exception 'INVALID_CUSTOMER_NAME'; end if;
  if v_phone !~ '^[0-9+ .-]{8,15}$' then raise exception 'INVALID_PHONE'; end if;
  if char_length(v_address) < 5 or char_length(v_address) > 300 then raise exception 'INVALID_ADDRESS'; end if;
  if char_length(v_province) < 2 or char_length(v_province) > 100 then raise exception 'INVALID_PROVINCE'; end if;
  if p_payment_method not in ('cod', 'bank_transfer', 'showroom') then raise exception 'INVALID_PAYMENT_METHOD'; end if;

  v_order_code := 'LW' || to_char(clock_timestamp(), 'YYMMDD') || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));
  insert into public.orders (
    order_code, user_id, customer_name, customer_phone, customer_email,
    shipping_address, shipping_province, payment_method, notes
  ) values (
    v_order_code, auth.uid(), v_name, v_phone, v_email,
    v_address, v_province, p_payment_method, nullif(btrim(coalesce(p_notes, '')), '')
  ) returning id into v_order_id;

  for v_item in select value from jsonb_array_elements(p_items)
  loop
    v_product_id := btrim(coalesce(v_item->>'product_id', ''));
    if v_product_id = '' or coalesce(v_item->>'quantity', '') !~ '^[0-9]+$' then raise exception 'INVALID_CART_ITEM'; end if;
    v_quantity := (v_item->>'quantity')::integer;
    if v_quantity < 1 or v_quantity > 10 then raise exception 'INVALID_QUANTITY'; end if;

    select * into v_product from public.products where id = v_product_id for share;
    if not found or v_product.status <> 'active' then raise exception 'PRODUCT_UNAVAILABLE: %', v_product_id; end if;
    if v_product.price is null or v_product.price < 0 then raise exception 'INVALID_PRODUCT_PRICE: %', v_product_id; end if;
    if v_product.stock_quantity is not null and v_product.stock_quantity < v_quantity then raise exception 'INSUFFICIENT_STOCK: %', v_product_id; end if;

    insert into public.order_items (
      order_id, product_id, product_name, product_image, unit_price, quantity, product_snapshot
    ) values (
      v_order_id, v_product.id, v_product.name, v_product.image_url, v_product.price, v_quantity,
      jsonb_build_object('sku', v_product.sku, 'brand', v_product.brand, 'specifications', v_product.specifications)
    );
    v_subtotal := v_subtotal + (v_product.price * v_quantity);
  end loop;

  v_shipping_fee := case when v_subtotal >= 20000000 then 0 else 30000 end;
  v_total := v_subtotal + v_shipping_fee;
  update public.orders set subtotal = v_subtotal, shipping_fee = v_shipping_fee, total = v_total where id = v_order_id;

  return jsonb_build_object(
    'order_id', v_order_id,
    'order_code', v_order_code,
    'subtotal', v_subtotal,
    'shipping_fee', v_shipping_fee,
    'total', v_total,
    'status', 'pending'
  );
end;
$$;

revoke all on function public.create_guest_order(jsonb, jsonb, text, text) from public;
grant execute on function public.create_guest_order(jsonb, jsonb, text, text) to anon, authenticated;

create or replace function public.lookup_guest_order(p_order_code text, p_phone text)
returns jsonb
language sql
security definer
set search_path = public, pg_temp
as $$
  select jsonb_build_object(
    'order_code', o.order_code,
    'status', o.status,
    'payment_status', o.payment_status,
    'customer_name', o.customer_name,
    'subtotal', o.subtotal,
    'shipping_fee', o.shipping_fee,
    'total', o.total,
    'created_at', o.created_at,
    'items', coalesce((
      select jsonb_agg(jsonb_build_object(
        'product_id', oi.product_id,
        'product_name', oi.product_name,
        'product_image', oi.product_image,
        'unit_price', oi.unit_price,
        'quantity', oi.quantity,
        'line_total', oi.line_total
      ) order by oi.id)
      from public.order_items oi where oi.order_id = o.id
    ), '[]'::jsonb)
  )
  from public.orders o
  where upper(o.order_code) = upper(btrim(p_order_code))
    and regexp_replace(o.customer_phone, '[^0-9]', '', 'g') = regexp_replace(p_phone, '[^0-9]', '', 'g')
  limit 1;
$$;

revoke all on function public.lookup_guest_order(text, text) from public;
grant execute on function public.lookup_guest_order(text, text) to anon, authenticated;

create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = public, pg_temp as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists products_set_updated_at on public.products;
create trigger products_set_updated_at before update on public.products for each row execute function public.set_updated_at();
drop trigger if exists customer_profiles_set_updated_at on public.customer_profiles;
create trigger customer_profiles_set_updated_at before update on public.customer_profiles for each row execute function public.set_updated_at();
drop trigger if exists customer_addresses_set_updated_at on public.customer_addresses;
create trigger customer_addresses_set_updated_at before update on public.customer_addresses for each row execute function public.set_updated_at();
drop trigger if exists shopping_carts_set_updated_at on public.shopping_carts;
create trigger shopping_carts_set_updated_at before update on public.shopping_carts for each row execute function public.set_updated_at();
drop trigger if exists cart_items_set_updated_at on public.cart_items;
create trigger cart_items_set_updated_at before update on public.cart_items for each row execute function public.set_updated_at();
drop trigger if exists campaigns_set_updated_at on public.campaigns;
create trigger campaigns_set_updated_at before update on public.campaigns for each row execute function public.set_updated_at();
drop trigger if exists orders_set_updated_at on public.orders;
create trigger orders_set_updated_at before update on public.orders for each row execute function public.set_updated_at();
