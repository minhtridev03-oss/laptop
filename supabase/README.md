# Supabase commerce setup

Run the migrations once, in filename order, in the Supabase SQL Editor using an owner/admin connection:

1. `migrations/202608220001_commerce_foundation.sql`
2. `migrations/202608220002_product_category_item_links.sql`
3. `migrations/202608220003_demo_series_products.sql` (optional demo catalog)
4. `migrations/202608220004_pc_builder_catalog.sql` (PC Builder component catalog)
5. `migrations/202608230001_pc_builder_product_images.sql` (demo component images)
6. `migrations/202608230002_remaining_catalog_demo_data.sql` (optional remaining category demo catalog)
7. `migrations/202608230003_pc_builder_profiles.sql` (data-driven PC recommendation profiles)
8. `migrations/202608230004_admin_inventory_orders.sql` (staff roles, admin operations and transactional inventory)
9. `migrations/202608230005_customer_account_sync.sql` (account profile bootstrap and cart/wishlist sync)
10. `migrations/202608230006_checkout_fulfillment.sql` (payment methods, shipping zones and notification outbox)
11. `migrations/202608230007_reviews_coupons.sql` (verified reviews and transactional coupons)
12. `migrations/202608230008_saved_pc_builds.sql` (account-owned saved PC configurations)
13. `migrations/202608230009_product_alerts.sql` (price/stock subscriptions and outbox events)

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

After running the admin migration, bootstrap the first administrator once in the SQL Editor. Replace the email with the Supabase Auth account that should manage the store:

```sql
insert into public.staff_members (user_id, role, display_name)
select id, 'admin', coalesce(raw_user_meta_data->>'full_name', email)
from auth.users
where email = 'admin@example.com'
on conflict (user_id) do update
set role = 'admin', is_active = true;
```

The `/admin` route appears in the header only for active `admin` or `staff` accounts. Product writes and order transitions go through guarded database functions; the frontend never needs a service-role key. Checkout reserves managed inventory with row locks, cancellation restores it once, and completion increments `sold_count` once. `inventory_movements` and `order_status_history` retain the operational audit trail.

Migrations 005–009 complete the production data paths used by the storefront. Signed-in carts and wishlists merge with local browser data, customer profiles and addresses drive checkout defaults, shipping/payment options are database-configured, coupons are revalidated inside the checkout transaction, and only completed purchasers can submit reviews. Saved PC builds are owner-protected with RLS. Price and restock subscriptions enqueue email jobs in `notification_outbox` when an administrator changes product data.

`notification_outbox` is intentionally provider-neutral. Connect a trusted server/Edge Function worker to claim pending rows, call your email/SMS provider, then mark each row `sent` or `failed`; never put provider secret keys in Vite variables or browser code. Keep bank transfer disabled until real bank/VietQR settings are saved in `/admin`, and add a payment-gateway webhook before enabling an online payment method in production.
