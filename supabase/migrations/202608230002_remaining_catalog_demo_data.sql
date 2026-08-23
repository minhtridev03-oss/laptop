begin;

-- Decode category labels that were imported with literal JSON unicode escapes.
-- The JSON cast converts text such as "Ph\u1ee5 ki\u1ec7n" into readable Vietnamese.
update public.category_groups
set name = (('"' || replace(name, '"', '\"') || '"')::jsonb #>> '{}')
where position(E'\\u' in name) > 0;

update public.category_items
set name = (('"' || replace(name, '"', '\"') || '"')::jsonb #>> '{}')
where position(E'\\u' in name) > 0;

-- Keep every submenu URL canonical: main category + exact category item id.
update public.category_items as item
set link_url = '/category/' || category_group.category_id || '?series=' || item.id::text
from public.category_groups as category_group
where category_group.id = item.group_id
  and item.link_url is distinct from '/category/' || category_group.category_id || '?series=' || item.id::text;

-- Generate two deterministic sample products for every submenu in the eight empty categories.
-- IDs, prices and inventory are stable, so the migration can be safely run again.
with target_items as (
  select
    item.id as item_id,
    item.name as item_name,
    item.sort_order as item_sort_order,
    category_group.name as group_name,
    category_group.sort_order as group_sort_order,
    category_group.category_id
  from public.category_groups as category_group
  join public.category_items as item on item.group_id = category_group.id
  where category_group.category_id in (
    'may-tinh-bang',
    'san-pham-apple',
    'pc-dong-bo',
    'pc-lap-rap',
    'pc-workstation',
    'man-hinh',
    'gaming-gear',
    'thiet-bi-mang'
  )
), generated as (
  select
    target_items.*,
    variant.variant_no,
    get_byte(decode(md5(target_items.item_id::text || ':' || variant.variant_no::text), 'hex'), 0) as price_seed,
    get_byte(decode(md5(target_items.item_id::text || ':' || variant.variant_no::text), 'hex'), 1) as discount_seed,
    get_byte(decode(md5(target_items.item_id::text || ':' || variant.variant_no::text), 'hex'), 2) as stock_seed,
    get_byte(decode(md5(target_items.item_id::text || ':' || variant.variant_no::text), 'hex'), 3) as sold_seed,
    get_byte(decode(md5(target_items.item_id::text || ':' || variant.variant_no::text), 'hex'), 4) as flag_seed,
    'demo-catalog-' || replace(target_items.item_id::text, '-', '') || '-' || variant.variant_no::text as product_id,
    'CAT-' || upper(substr(replace(target_items.item_id::text, '-', ''), 1, 12)) || '-' || variant.variant_no::text as sku
  from target_items
  cross join generate_series(1, 2) as variant(variant_no)
), priced as (
  select
    generated.*,
    case category_id
      when 'may-tinh-bang' then
        case when group_sort_order = 3 then 1190000 else 7990000 end
        + (price_seed % 10) * case when group_sort_order = 3 then 180000 else 550000 end
        + (variant_no - 1) * case when group_sort_order = 3 then 600000 else 2500000 end
      when 'san-pham-apple' then
        case when group_sort_order = 3 then 2490000 else 18990000 end
        + (price_seed % 10) * case when group_sort_order = 3 then 280000 else 1600000 end
        + (variant_no - 1) * case when group_sort_order = 3 then 900000 else 5000000 end
      when 'pc-dong-bo' then 9990000 + (price_seed % 12) * 850000 + (variant_no - 1) * 4500000
      when 'pc-lap-rap' then 12990000 + (price_seed % 14) * 1250000 + (variant_no - 1) * 6500000
      when 'pc-workstation' then 32990000 + (price_seed % 14) * 3500000 + (variant_no - 1) * 12000000
      when 'man-hinh' then 2990000 + (price_seed % 12) * 850000 + (variant_no - 1) * 2300000
      when 'gaming-gear' then
        case group_sort_order when 1 then 890000 when 2 then 1490000 when 3 then 1190000 when 4 then 3990000 else 390000 end
        + (price_seed % 8) * case when group_sort_order = 4 then 450000 else 180000 end
        + (variant_no - 1) * case when group_sort_order = 4 then 1200000 else 550000 end
      when 'thiet-bi-mang' then
        case group_sort_order when 1 then 1090000 when 2 then 1390000 else 1890000 end
        + (price_seed % 10) * 320000 + (variant_no - 1) * 900000
    end::numeric as price,
    5 + discount_seed % 14 as discount
  from generated
), catalog as (
  select
    priced.*,
    case
      when item_name ilike '%Dell%' then 'Dell'
      when item_name ilike '%HP%' then 'HP'
      when item_name ilike '%Lenovo%' then 'Lenovo'
      when item_name ilike '%Asus%' then 'Asus'
      when item_name ilike '%MSI%' then 'MSI'
      when item_name ilike '%LG%' then 'LG'
      when item_name ilike '%Samsung%' or item_name ilike '%Galaxy%' then 'Samsung'
      when item_name ilike '%Logitech%' then 'Logitech'
      when item_name ilike '%Razer%' then 'Razer'
      when item_name ilike '%SteelSeries%' then 'SteelSeries'
      when item_name ilike '%HyperX%' then 'HyperX'
      when item_name ilike '%Corsair%' then 'Corsair'
      when item_name ilike '%DXRacer%' then 'DXRacer'
      when item_name ilike '%Anda Seat%' then 'Anda Seat'
      when item_name ilike '%TP-Link%' then 'TP-Link'
      when item_name ilike '%Cisco%' then 'Cisco'
      when item_name ilike '%UniFi%' then 'Ubiquiti'
      when item_name ilike '%Apple%' or item_name ilike '%iPad%' or item_name ilike '%Mac%' or item_name ilike '%AirPods%' or item_name ilike '%Magic%' then 'Apple'
      else 'Laptop World'
    end as brand,
    case category_id
      when 'may-tinh-bang' then item_name || case when group_sort_order = 3 then case variant_no when 1 then ' Wireless' else ' Pro Edition' end else case variant_no when 1 then ' Wi-Fi 128GB' else ' 5G 256GB' end end
      when 'san-pham-apple' then item_name || case when group_sort_order = 3 then case variant_no when 1 then ' USB-C' else ' Premium Edition' end else case variant_no when 1 then ' 16GB/512GB' else ' 24GB/1TB' end end
      when 'pc-dong-bo' then item_name || case variant_no when 1 then ' Core i5 16GB 512GB' else ' Core i7 32GB 1TB' end
      when 'pc-lap-rap' then item_name || case variant_no when 1 then ' RTX 4060 Edition' else ' RTX 4070 SUPER Edition' end
      when 'pc-workstation' then item_name || case variant_no when 1 then ' RTX A2000 32GB' else ' RTX A4000 64GB' end
      when 'man-hinh' then item_name || case variant_no when 1 then ' 27 inch QHD' else ' 32 inch 4K' end
      when 'gaming-gear' then item_name || case variant_no when 1 then ' Wireless' else ' Pro Edition' end
      when 'thiet-bi-mang' then item_name || case variant_no when 1 then ' AX3000' else ' BE6500' end
    end || ' — Dữ liệu mẫu' as product_name,
    case category_id
      when 'may-tinh-bang' then case when group_sort_order = 3 then 'https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/MXCL3_AV1?.v=VWFFa0JQNTFHSVM3SUJHR0U0YjEwdFZhbkJla2d5Z2JVMy9NUHpmYTJ5YmFGdlZQSnlMS1RoWnpwU1RVVlFLWVlpQnZqVVQxeG1ibFBnY0JicjBsNnc&fmt=jpeg&hei=890&qlt=90&wid=890' else 'https://www.pittuniversitystore.com/storeimages/275-1026894-1.jpg' end
      when 'san-pham-apple' then case when group_sort_order = 3 then 'https://cdn0.it4profit.com/s3/cms/category/bf/4a/bf4ac1d15a428650f7230dece0236166/250910160020664746.webp' else 'https://www.jbhifi.com.au/cdn/shop/files/791801-Product-0-I-638768080824907497.jpg?v=1741211358' end
      when 'pc-dong-bo' then 'https://d2e6ccujb3mkqf.cloudfront.net/6b5020e2-c1bf-4e55-b54e-bf6590fcd242-1_7e5b72c2-8d39-4a8e-8f90-42fed0e7914a.jpg'
      when 'pc-lap-rap' then 'https://www.medion.com/erazer/int/images/071f372b46da7611db4a7bbbe9d8d5de_erazer_2025_NVIDIA-Kampagne_Landing-Page_Hero-Asset__Desktop_3024x1592-p-2000.jpg'
      when 'pc-workstation' then 'https://m.media-amazon.com/images/I/41tFKQ7i98L._SS1000_.jpg'
      when 'man-hinh' then 'https://cdn.dsmcdn.com/mnresize/400/-/ty1773/prod/QC_PREP/20251015/16/2c42c465-51a0-37ee-9374-51fd6877b248/1_org_zoom.jpg'
      when 'gaming-gear' then case group_sort_order
        when 1 then 'https://media.materiel.net/r900/products/MN0005762352_1.jpg'
        when 2 then 'https://image1280.macovi.de/images/product_images/1280/1339972_1__8949527-1.jpg'
        when 3 then 'https://www.hp.com/it-it/shop/media/catalog/product/h/y/hyperx_cloud_iii_white_b96mxaa_angle_3_6025613_cus.jpg?image-type=image&store=it-it'
        when 4 then 'https://media.adeo.com/mkp/d70e11c34ed234a0f1ae9595508e793f/media.jpg'
        else 'https://item-shopping.c.yimg.jp/i/n/tsukumo-y_5707119066365_1_d_20251027135116'
      end
      when 'thiet-bi-mang' then case group_sort_order
        when 2 then 'https://i5.walmartimages.cl/asr/1b7c4734-374e-48bb-8fdc-d26ad6c7902f.9422fa74c9511488a1fc51d9e2f47da1.jpeg?odnBg=ffffff&odnHeight=2000&odnWidth=2000'
        when 3 then 'https://cdn.wisp.net.au/1-thickbox_default/unifi-uap-ac-hd.jpg'
        else 'https://cdn.dsmcdn.com/ty1742/prod/QC_ENRICHMENT/20250901/11/ab9c309a-862d-3543-ac60-a3ed2ab20b0c/1_org_zoom.jpg'
      end
    end as image_url,
    jsonb_strip_nulls(jsonb_build_object(
      'description', 'Sản phẩm mẫu thuộc ' || group_name || ' / ' || item_name || '. Thông tin giá, tồn kho và cấu hình được tạo để hoàn thiện luồng danh mục và có thể thay thế bằng dữ liệu bán hàng thực tế.',
      'card_highlights', case category_id
        when 'may-tinh-bang' then case when group_sort_order = 3 then jsonb_build_array('Bluetooth / USB-C', 'Thiết kế mỏng nhẹ', 'Bảo hành 12 tháng') else jsonb_build_array(case variant_no when 1 then '128GB' else '256GB' end, case variant_no when 1 then 'Wi-Fi 6E' else 'Wi-Fi + 5G' end, 'Màn hình sắc nét') end
        when 'san-pham-apple' then case when group_sort_order = 3 then jsonb_build_array('Hệ sinh thái Apple', 'Kết nối nhanh', 'Bảo hành 12 tháng') else jsonb_build_array(case variant_no when 1 then '16GB RAM' else '24GB RAM' end, case variant_no when 1 then '512GB SSD' else '1TB SSD' end, 'Apple Silicon') end
        when 'pc-dong-bo' then jsonb_build_array(case variant_no when 1 then 'Core i5 / Ryzen 5' else 'Core i7 / Ryzen 7' end, case variant_no when 1 then '16GB RAM' else '32GB RAM' end, case variant_no when 1 then '512GB SSD' else '1TB SSD' end)
        when 'pc-lap-rap' then jsonb_build_array(case variant_no when 1 then 'RTX 4060' else 'RTX 4070 SUPER' end, case variant_no when 1 then '16GB DDR5' else '32GB DDR5' end, 'SSD NVMe Gen4')
        when 'pc-workstation' then jsonb_build_array(case variant_no when 1 then 'RTX A2000' else 'RTX A4000' end, case variant_no when 1 then '32GB ECC' else '64GB ECC' end, 'Workstation chuyên dụng')
        when 'man-hinh' then jsonb_build_array(case variant_no when 1 then '27 inch QHD' else '32 inch 4K' end, case variant_no when 1 then '165Hz' else '240Hz' end, 'Adaptive Sync')
        when 'gaming-gear' then jsonb_build_array(case variant_no when 1 then 'Wireless' else 'Pro Edition' end, 'RGB tùy chỉnh', 'Bảo hành 24 tháng')
        when 'thiet-bi-mang' then jsonb_build_array(case variant_no when 1 then 'Wi-Fi 6' else 'Wi-Fi 7' end, case variant_no when 1 then 'AX3000' else 'BE6500' end, 'Quản lý thông minh')
      end,
      'processor', case
        when category_id = 'may-tinh-bang' and group_sort_order < 3 then case when item_name ilike 'iPad%' then 'Apple M-series / A-series' else 'Snapdragon / Exynos' end
        when category_id = 'san-pham-apple' and group_sort_order < 3 then case variant_no when 1 then 'Apple M4' else 'Apple M4 Pro' end
        when category_id in ('pc-dong-bo', 'pc-lap-rap') then case variant_no when 1 then 'Intel Core i5-14400 / AMD Ryzen 5 7600' else 'Intel Core i7-14700 / AMD Ryzen 7 7700' end
        when category_id = 'pc-workstation' then case variant_no when 1 then 'Intel Core i9 / Xeon E' else 'Intel Xeon W' end
      end,
      'memory', case
        when category_id in ('pc-dong-bo', 'pc-lap-rap') then case variant_no when 1 then '16GB DDR5' else '32GB DDR5' end
        when category_id = 'pc-workstation' then case variant_no when 1 then '32GB ECC' else '64GB ECC' end
        when category_id = 'san-pham-apple' and group_sort_order < 3 then case variant_no when 1 then '16GB unified memory' else '24GB unified memory' end
      end,
      'storage', case
        when category_id in ('pc-dong-bo', 'pc-lap-rap') then case variant_no when 1 then '512GB NVMe SSD' else '1TB NVMe SSD' end
        when category_id = 'pc-workstation' then case variant_no when 1 then '1TB NVMe SSD' else '2TB NVMe SSD' end
        when category_id in ('may-tinh-bang', 'san-pham-apple') and group_sort_order < 3 then case variant_no when 1 then '128GB / 512GB' else '256GB / 1TB' end
      end,
      'graphics', case
        when category_id = 'pc-lap-rap' then case variant_no when 1 then 'NVIDIA GeForce RTX 4060' else 'NVIDIA GeForce RTX 4070 SUPER' end
        when category_id = 'pc-workstation' then case variant_no when 1 then 'NVIDIA RTX A2000' else 'NVIDIA RTX A4000' end
        when category_id = 'pc-dong-bo' then case variant_no when 1 then 'Intel UHD / Radeon Graphics' else 'NVIDIA GeForce RTX 4060' end
      end,
      'display', case
        when category_id = 'man-hinh' then case variant_no when 1 then '27 inch IPS QHD' else '32 inch IPS/OLED 4K' end
        when category_id = 'may-tinh-bang' and group_sort_order < 3 then case variant_no when 1 then '11 inch' else '13 inch' end
      end,
      'resolution', case when category_id = 'man-hinh' then case variant_no when 1 then '2560 x 1440' else '3840 x 2160' end end,
      'refresh_rate', case when category_id = 'man-hinh' then case variant_no when 1 then '165Hz' else '240Hz' end end,
      'connectivity', case
        when category_id = 'gaming-gear' then case variant_no when 1 then '2.4GHz / Bluetooth' else 'USB-C / 2.4GHz' end
        when category_id = 'thiet-bi-mang' then case variant_no when 1 then 'Wi-Fi 6 / Gigabit LAN' else 'Wi-Fi 7 / 2.5GbE' end
        when category_id in ('may-tinh-bang', 'san-pham-apple') then 'Wi-Fi 6E / Bluetooth / USB-C'
      end,
      'warranty', case when category_id in ('gaming-gear', 'thiet-bi-mang', 'man-hinh') then '24 tháng' else '12 tháng' end,
      'category_path', group_name || ' / ' || item_name,
      'sample_data', true
    )) as specifications
  from priced
)
insert into public.products (
  id, name, price, original_price, discount, category_id, image_url,
  spec_cpu, spec_ram, spec_storage, spec_gpu,
  is_hot, is_flash_sale, is_best_seller, is_new, flash_sale_end_time,
  sort_order, sku, brand, status, stock_quantity, sold_count, specifications
)
select
  product_id,
  product_name,
  price,
  round(price / (1 - discount / 100.0) / 10000) * 10000,
  discount,
  category_id,
  image_url,
  specifications->>'processor',
  specifications->>'memory',
  specifications->>'storage',
  specifications->>'graphics',
  flag_seed % 3 = 0,
  flag_seed % 5 = 0,
  flag_seed % 4 = 0,
  variant_no = 2,
  null,
  (3000 + row_number() over (partition by category_id order by group_sort_order, item_sort_order, variant_no))::integer,
  sku,
  brand,
  'active',
  8 + stock_seed % 43,
  sold_seed * 2,
  specifications
from catalog
on conflict (id) do update set
  name = excluded.name,
  price = excluded.price,
  original_price = excluded.original_price,
  discount = excluded.discount,
  category_id = excluded.category_id,
  image_url = excluded.image_url,
  spec_cpu = excluded.spec_cpu,
  spec_ram = excluded.spec_ram,
  spec_storage = excluded.spec_storage,
  spec_gpu = excluded.spec_gpu,
  is_hot = excluded.is_hot,
  is_flash_sale = excluded.is_flash_sale,
  is_best_seller = excluded.is_best_seller,
  is_new = excluded.is_new,
  sort_order = excluded.sort_order,
  sku = excluded.sku,
  brand = excluded.brand,
  status = excluded.status,
  stock_quantity = excluded.stock_quantity,
  sold_count = excluded.sold_count,
  specifications = excluded.specifications,
  updated_at = now();

-- Link every generated product to its exact submenu item.
insert into public.product_category_items (product_id, category_item_id)
select
  'demo-catalog-' || replace(item.id::text, '-', '') || '-' || variant.variant_no::text,
  item.id
from public.category_groups as category_group
join public.category_items as item on item.group_id = category_group.id
cross join generate_series(1, 2) as variant(variant_no)
join public.products as product
  on product.id = 'demo-catalog-' || replace(item.id::text, '-', '') || '-' || variant.variant_no::text
where category_group.category_id in (
  'may-tinh-bang',
  'san-pham-apple',
  'pc-dong-bo',
  'pc-lap-rap',
  'pc-workstation',
  'man-hinh',
  'gaming-gear',
  'thiet-bi-mang'
)
on conflict (product_id, category_item_id) do nothing;

commit;

-- Optional cleanup after reviewing the demo catalog:
-- delete from public.products where id like 'demo-catalog-%';
