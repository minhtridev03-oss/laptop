begin;

-- Demo component catalog for the data-driven PC Builder.
-- All compatibility attributes live in products.specifications.
with component_seed (
  id, sku, name, price, brand, spec_cpu, spec_ram, spec_storage, spec_gpu, sort_order, specifications
) as (
  values
    (
      'build-demo-cpu-entry', 'BUILD-DEMO-CPU-ENTRY',
      'AMD Ryzen 5 5600 — Dữ liệu mẫu', 2490000, 'AMD', 'AMD Ryzen 5 5600', null, null, null, 2001,
      '{"component_type":"cpu","builder_tier":"entry","socket":"AM4","tdp_w":65,"cores":6,"threads":12,"performance_score":68}'::jsonb
    ),
    (
      'build-demo-cpu-balanced', 'BUILD-DEMO-CPU-BALANCED',
      'AMD Ryzen 5 7600 — Dữ liệu mẫu', 5190000, 'AMD', 'AMD Ryzen 5 7600', null, null, null, 2002,
      '{"component_type":"cpu","builder_tier":"balanced","socket":"AM5","tdp_w":65,"cores":6,"threads":12,"performance_score":82}'::jsonb
    ),
    (
      'build-demo-cpu-premium', 'BUILD-DEMO-CPU-PREMIUM',
      'Intel Core i7-14700K — Dữ liệu mẫu', 10190000, 'Intel', 'Intel Core i7-14700K', null, null, null, 2003,
      '{"component_type":"cpu","builder_tier":"premium","socket":"LGA1700","tdp_w":253,"cores":20,"threads":28,"performance_score":96}'::jsonb
    ),
    (
      'build-demo-mainboard-entry', 'BUILD-DEMO-MB-ENTRY',
      'Gigabyte B550M DS3H — Dữ liệu mẫu', 2290000, 'Gigabyte', null, null, null, null, 2011,
      '{"component_type":"mainboard","builder_tier":"entry","socket":"AM4","ram_type":"DDR4","form_factor":"mATX","memory_slots":4}'::jsonb
    ),
    (
      'build-demo-mainboard-balanced', 'BUILD-DEMO-MB-BALANCED',
      'MSI PRO B650-S WIFI — Dữ liệu mẫu', 4190000, 'MSI', null, null, null, null, 2012,
      '{"component_type":"mainboard","builder_tier":"balanced","socket":"AM5","ram_type":"DDR5","form_factor":"ATX","memory_slots":4}'::jsonb
    ),
    (
      'build-demo-mainboard-premium', 'BUILD-DEMO-MB-PREMIUM',
      'ASUS ROG Strix Z790-F Gaming WiFi — Dữ liệu mẫu', 9190000, 'Asus', null, null, null, null, 2013,
      '{"component_type":"mainboard","builder_tier":"premium","socket":"LGA1700","ram_type":"DDR5","form_factor":"ATX","memory_slots":4}'::jsonb
    ),
    (
      'build-demo-ram-entry', 'BUILD-DEMO-RAM-ENTRY',
      'Kingston Fury Beast 16GB DDR4 3200 — Dữ liệu mẫu', 990000, 'Kingston', null, '16GB DDR4', null, null, 2021,
      '{"component_type":"ram","builder_tier":"entry","ram_type":"DDR4","capacity_gb":16,"modules":2,"speed_mhz":3200}'::jsonb
    ),
    (
      'build-demo-ram-balanced', 'BUILD-DEMO-RAM-BALANCED',
      'G.Skill Flare X5 32GB DDR5 6000 — Dữ liệu mẫu', 2390000, 'G.Skill', null, '32GB DDR5', null, null, 2022,
      '{"component_type":"ram","builder_tier":"balanced","ram_type":"DDR5","capacity_gb":32,"modules":2,"speed_mhz":6000}'::jsonb
    ),
    (
      'build-demo-ram-premium', 'BUILD-DEMO-RAM-PREMIUM',
      'Corsair Dominator Titanium 64GB DDR5 6400 — Dữ liệu mẫu', 5190000, 'Corsair', null, '64GB DDR5', null, null, 2023,
      '{"component_type":"ram","builder_tier":"premium","ram_type":"DDR5","capacity_gb":64,"modules":2,"speed_mhz":6400}'::jsonb
    ),
    (
      'build-demo-gpu-entry', 'BUILD-DEMO-GPU-ENTRY',
      'Gigabyte GeForce RTX 4060 Windforce OC 8GB — Dữ liệu mẫu', 8290000, 'Gigabyte', null, null, null, 'RTX 4060 8GB', 2031,
      '{"component_type":"gpu","builder_tier":"entry","tdp_w":115,"length_mm":250,"vram_gb":8,"performance_score":74}'::jsonb
    ),
    (
      'build-demo-gpu-balanced', 'BUILD-DEMO-GPU-BALANCED',
      'MSI GeForce RTX 4070 SUPER Ventus 3X 12GB — Dữ liệu mẫu', 16890000, 'MSI', null, null, null, 'RTX 4070 SUPER 12GB', 2032,
      '{"component_type":"gpu","builder_tier":"balanced","tdp_w":220,"length_mm":308,"vram_gb":12,"performance_score":90}'::jsonb
    ),
    (
      'build-demo-gpu-premium', 'BUILD-DEMO-GPU-PREMIUM',
      'ASUS TUF Gaming GeForce RTX 4080 SUPER 16GB — Dữ liệu mẫu', 33890000, 'Asus', null, null, null, 'RTX 4080 SUPER 16GB', 2033,
      '{"component_type":"gpu","builder_tier":"premium","tdp_w":320,"length_mm":348,"vram_gb":16,"performance_score":98}'::jsonb
    ),
    (
      'build-demo-storage-entry', 'BUILD-DEMO-SSD-ENTRY',
      'Kingston NV2 500GB NVMe — Dữ liệu mẫu', 990000, 'Kingston', null, null, '500GB NVMe SSD', null, 2041,
      '{"component_type":"storage","builder_tier":"entry","storage_type":"NVMe","capacity_gb":500,"interface":"PCIe 4.0"}'::jsonb
    ),
    (
      'build-demo-storage-balanced', 'BUILD-DEMO-SSD-BALANCED',
      'Samsung 990 EVO Plus 1TB NVMe — Dữ liệu mẫu', 1790000, 'Samsung', null, null, '1TB NVMe SSD', null, 2042,
      '{"component_type":"storage","builder_tier":"balanced","storage_type":"NVMe","capacity_gb":1024,"interface":"PCIe 4.0"}'::jsonb
    ),
    (
      'build-demo-storage-premium', 'BUILD-DEMO-SSD-PREMIUM',
      'Samsung 990 PRO 2TB NVMe — Dữ liệu mẫu', 3490000, 'Samsung', null, null, '2TB NVMe SSD', null, 2043,
      '{"component_type":"storage","builder_tier":"premium","storage_type":"NVMe","capacity_gb":2048,"interface":"PCIe 4.0"}'::jsonb
    ),
    (
      'build-demo-psu-entry', 'BUILD-DEMO-PSU-ENTRY',
      'Corsair CX650 650W Bronze — Dữ liệu mẫu', 1490000, 'Corsair', null, null, null, null, 2051,
      '{"component_type":"psu","builder_tier":"entry","wattage":650,"efficiency":"80 Plus Bronze","modular":false}'::jsonb
    ),
    (
      'build-demo-psu-balanced', 'BUILD-DEMO-PSU-BALANCED',
      'Seasonic Focus GX-750 750W Gold — Dữ liệu mẫu', 2790000, 'Seasonic', null, null, null, null, 2052,
      '{"component_type":"psu","builder_tier":"balanced","wattage":750,"efficiency":"80 Plus Gold","modular":true}'::jsonb
    ),
    (
      'build-demo-psu-premium', 'BUILD-DEMO-PSU-PREMIUM',
      'MSI MPG A1000G PCIE5 1000W Gold — Dữ liệu mẫu', 4190000, 'MSI', null, null, null, null, 2053,
      '{"component_type":"psu","builder_tier":"premium","wattage":1000,"efficiency":"80 Plus Gold","modular":true}'::jsonb
    ),
    (
      'build-demo-case-entry', 'BUILD-DEMO-CASE-ENTRY',
      'Corsair 3000D Airflow — Dữ liệu mẫu', 1390000, 'Corsair', null, null, null, null, 2061,
      '{"component_type":"case","builder_tier":"entry","supported_form_factors":["ATX","mATX","ITX"],"max_gpu_length_mm":360}'::jsonb
    ),
    (
      'build-demo-case-balanced', 'BUILD-DEMO-CASE-BALANCED',
      'NZXT H5 Flow — Dữ liệu mẫu', 2190000, 'NZXT', null, null, null, null, 2062,
      '{"component_type":"case","builder_tier":"balanced","supported_form_factors":["ATX","mATX","ITX"],"max_gpu_length_mm":365}'::jsonb
    ),
    (
      'build-demo-case-premium', 'BUILD-DEMO-CASE-PREMIUM',
      'Lian Li O11D EVO RGB — Dữ liệu mẫu', 4190000, 'Lian Li', null, null, null, null, 2063,
      '{"component_type":"case","builder_tier":"premium","supported_form_factors":["E-ATX","ATX","mATX","ITX"],"max_gpu_length_mm":455}'::jsonb
    ),
    (
      'build-demo-cooler-entry', 'BUILD-DEMO-COOLER-ENTRY',
      'DeepCool AK400 — Dữ liệu mẫu', 590000, 'DeepCool', null, null, null, null, 2071,
      '{"component_type":"cooler","builder_tier":"entry","cooler_type":"Air","supported_sockets":["AM4","AM5","LGA1700"],"cooling_capacity_w":180}'::jsonb
    ),
    (
      'build-demo-cooler-balanced', 'BUILD-DEMO-COOLER-BALANCED',
      'Thermalright Peerless Assassin 120 SE — Dữ liệu mẫu', 1090000, 'Thermalright', null, null, null, null, 2072,
      '{"component_type":"cooler","builder_tier":"balanced","cooler_type":"Air","supported_sockets":["AM4","AM5","LGA1700"],"cooling_capacity_w":245}'::jsonb
    ),
    (
      'build-demo-cooler-premium', 'BUILD-DEMO-COOLER-PREMIUM',
      'Arctic Liquid Freezer III 360 — Dữ liệu mẫu', 3590000, 'Arctic', null, null, null, null, 2073,
      '{"component_type":"cooler","builder_tier":"premium","cooler_type":"AIO 360","supported_sockets":["AM4","AM5","LGA1700"],"cooling_capacity_w":300}'::jsonb
    )
)
insert into public.products (
  id, name, price, original_price, discount, category_id, image_url,
  spec_cpu, spec_ram, spec_storage, spec_gpu,
  is_hot, is_flash_sale, is_best_seller, is_new, flash_sale_end_time,
  sort_order, sku, brand, status, stock_quantity, sold_count, specifications
)
select
  id, name, price, price, 0, 'linh-kien', null,
  spec_cpu, spec_ram, spec_storage, spec_gpu,
  false, false, false, true, null,
  sort_order, sku, brand, 'active', 20, 0, specifications
from component_seed
on conflict (id) do update set
  name = excluded.name,
  price = excluded.price,
  original_price = excluded.original_price,
  discount = excluded.discount,
  category_id = excluded.category_id,
  spec_cpu = excluded.spec_cpu,
  spec_ram = excluded.spec_ram,
  spec_storage = excluded.spec_storage,
  spec_gpu = excluded.spec_gpu,
  sort_order = excluded.sort_order,
  sku = excluded.sku,
  brand = excluded.brand,
  status = excluded.status,
  stock_quantity = excluded.stock_quantity,
  specifications = excluded.specifications,
  updated_at = now();

-- Make the seeded products discoverable from the existing component submenu data.
with item_links(product_id, item_name) as (
  values
    ('build-demo-cpu-entry', 'CPU AMD Ryzen'),
    ('build-demo-cpu-balanced', 'CPU AMD Ryzen'),
    ('build-demo-cpu-premium', 'CPU Intel Core i'),
    ('build-demo-mainboard-entry', 'Mainboard Gigabyte'),
    ('build-demo-mainboard-balanced', 'Mainboard MSI'),
    ('build-demo-mainboard-premium', 'Mainboard Asus'),
    ('build-demo-ram-entry', 'RAM DDR4'),
    ('build-demo-ram-balanced', 'RAM DDR5'),
    ('build-demo-ram-premium', 'RAM DDR5'),
    ('build-demo-gpu-entry', 'VGA NVIDIA GeForce'),
    ('build-demo-gpu-balanced', 'VGA NVIDIA GeForce'),
    ('build-demo-gpu-premium', 'VGA NVIDIA GeForce'),
    ('build-demo-storage-entry', 'SSD NVMe M.2'),
    ('build-demo-storage-balanced', 'SSD NVMe M.2'),
    ('build-demo-storage-premium', 'SSD NVMe M.2'),
    ('build-demo-psu-entry', 'Nguồn Corsair'),
    ('build-demo-psu-balanced', 'Nguồn Seasonic'),
    ('build-demo-psu-premium', 'Nguồn MSI / NZXT'),
    ('build-demo-case-entry', 'Case Corsair'),
    ('build-demo-case-balanced', 'Case NZXT'),
    ('build-demo-case-premium', 'Case Lian Li')
)
insert into public.product_category_items (product_id, category_item_id)
select item_links.product_id, category_item.id
from item_links
join public.category_groups as category_group on category_group.category_id = 'linh-kien'
join public.category_items as category_item
  on category_item.group_id = category_group.id
 and category_item.name = item_links.item_name
on conflict (product_id, category_item_id) do nothing;

commit;

-- Optional cleanup:
-- delete from public.products where id like 'build-demo-%';
