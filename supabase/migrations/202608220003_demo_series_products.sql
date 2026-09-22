begin;

-- Generate two deterministic demo products for every office/gaming laptop series.
-- The IDs and pseudo-random values are stable, so this migration is safe to run again.
with generated as (
  select
    'demo-series-' || replace(item.id::text, '-', '') || '-' || variant.variant_no::text as product_id,
    'DEMO-' || upper(replace(item.id::text, '-', '')) || '-' || variant.variant_no::text as sku,
    item.name,
    category_group.category_id,
    split_part(item.name, ' ', 1) as brand,
    template.image_url,
    template.spec_cpu,
    template.spec_ram,
    template.spec_storage,
    template.spec_gpu,
    template.specifications,
    variant.variant_no,
    12990000 + get_byte(decode(md5(item.id::text || ':' || variant.variant_no::text), 'hex'), 0) * 70000 as price,
    8 + get_byte(decode(md5(item.id::text || ':' || variant.variant_no::text), 'hex'), 1) % 13 as discount,
    5 + get_byte(decode(md5(item.id::text || ':' || variant.variant_no::text), 'hex'), 2) % 36 as stock_quantity,
    get_byte(decode(md5(item.id::text || ':' || variant.variant_no::text), 'hex'), 3) * 3 as sold_count,
    get_byte(decode(md5(item.id::text || ':' || variant.variant_no::text), 'hex'), 4) as flag_seed,
    1000 + row_number() over (
      partition by category_group.category_id
      order by category_group.sort_order, item.sort_order, variant.variant_no
    ) as sort_order
  from public.category_groups as category_group
  join public.category_items as item on item.group_id = category_group.id
  cross join generate_series(1, 2) as variant(variant_no)
  join lateral (
    select product.*
    from public.products as product
    where product.category_id = category_group.category_id
      and product.id not like 'demo-series-%'
    order by md5(product.id || ':' || item.id::text || ':' || variant.variant_no::text)
    limit 1
  ) as template on true
  where category_group.category_id in ('laptop-van-phong', 'laptop-gaming')
), demo_products as (
  select
    product_id,
    sku,
    name || ' Demo ' || variant_no::text || ' (' ||
      concat_ws('/ ', spec_cpu, spec_ram, spec_storage, spec_gpu) || ') – Dữ liệu mẫu' as product_name,
    category_id,
    brand,
    image_url,
    spec_cpu,
    spec_ram,
    spec_storage,
    spec_gpu,
    specifications,
    price,
    discount,
    round(price / (1 - discount / 100.0) / 10000) * 10000 as original_price,
    stock_quantity,
    sold_count,
    flag_seed,
    sort_order::integer
  from generated
)
insert into public.products (
  id,
  name,
  price,
  original_price,
  discount,
  category_id,
  image_url,
  spec_cpu,
  spec_ram,
  spec_storage,
  spec_gpu,
  is_hot,
  is_flash_sale,
  is_best_seller,
  is_new,
  flash_sale_end_time,
  sort_order,
  sku,
  brand,
  status,
  stock_quantity,
  sold_count,
  specifications
)
select
  product_id,
  product_name,
  price,
  original_price,
  discount,
  category_id,
  image_url,
  spec_cpu,
  spec_ram,
  spec_storage,
  spec_gpu,
  flag_seed % 3 = 0,
  flag_seed % 4 = 0,
  flag_seed % 5 = 0,
  flag_seed % 2 = 0,
  null,
  sort_order,
  sku,
  brand,
  'active',
  stock_quantity,
  sold_count,
  specifications
from demo_products
on conflict (id) do nothing;

-- Connect each generated product to the exact submenu series it was created for.
insert into public.product_category_items (product_id, category_item_id)
select
  'demo-series-' || replace(item.id::text, '-', '') || '-' || variant.variant_no::text,
  item.id
from public.category_groups as category_group
join public.category_items as item on item.group_id = category_group.id
cross join generate_series(1, 2) as variant(variant_no)
join public.products as product
  on product.id = 'demo-series-' || replace(item.id::text, '-', '') || '-' || variant.variant_no::text
where category_group.category_id in ('laptop-van-phong', 'laptop-gaming')
on conflict (product_id, category_item_id) do nothing;

commit;

-- Optional cleanup after reviewing the demo catalog:
-- delete from public.products where id like 'demo-series-%';
