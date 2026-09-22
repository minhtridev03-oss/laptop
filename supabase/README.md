# Supabase commerce setup

Run the migrations once, in filename order, in the Supabase SQL Editor using an owner/admin connection:

1. `migrations/202608220001_commerce_foundation.sql`
2. `migrations/202608220002_product_category_item_links.sql`
3. `migrations/202608220003_demo_series_products.sql` (optional demo catalog)
4. `migrations/202608220004_pc_builder_catalog.sql` (PC Builder component catalog)
5. `migrations/202608230001_pc_builder_product_images.sql` (demo component images)
6. `migrations/202608230002_remaining_catalog_demo_data.sql` (optional remaining category demo catalog)
7. `migrations/202608230003_pc_builder_profiles.sql` (data-driven PC recommendation profiles)

The migration:

- extends `products` with SKU, brand, status, inventory and structured specifications;
- migrates the existing CPU/RAM/storage/GPU fields into `products.specifications`;
- creates customer profiles, addresses, authenticated carts and wishlists;
- creates campaigns, orders and immutable order-item snapshots;
- enables RLS and owner-only policies for customer data;
- exposes `create_guest_order` and `lookup_guest_order` as narrow RPC functions for guest checkout.
- creates `product_category_items`, changes submenu URLs to canonical category + series links, and seeds the current products into their matching series.

`products.stock_quantity = null` means inventory is not managed yet. Set an integer when stock control is enabled. The checkout RPC always reloads product price, status and inventory from PostgreSQL and never trusts totals submitted by the browser.

To assign another product to a submenu series later, insert its `product_id` and the matching `category_items.id` into `product_category_items`. Main category pages continue to use `products.category_id`, so they always show every product in that category.

The optional demo migration creates two deterministic sample products for every office and gaming laptop submenu. It clones images and specifications from a real product in the same main category, then varies price, discount, stock, sales count and merchandising flags. Running it again does not duplicate records. To remove every generated record, run `delete from public.products where id like 'demo-series-%';`; linked submenu rows are removed automatically through `on delete cascade`.

The PC Builder migration seeds three complete component tiers and stores compatibility fields in `products.specifications`: component type, socket, RAM generation, form factor, GPU length, PSU wattage and supported cooler sockets. It is idempotent and may be rerun after editing sample prices.

The recommendation-profile migration moves use cases, budget ranges, component budget weights and scoring weights into `pc_build_profiles`. The storefront only reads active profiles; changes are made with an owner/admin connection. Real products join the recommender when `specifications.component_type` is present, price/status are valid and inventory is greater than zero (or `stock_quantity` is `null`). Set `specifications.builder_enabled` to `false` to exclude a product. CPU/GPU recommendations are most accurate when `performance_score` is maintained alongside the compatibility fields.
