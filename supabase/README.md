# Supabase commerce setup

Run the migrations once, in filename order, in the Supabase SQL Editor using an owner/admin connection:

1. `migrations/202608220001_commerce_foundation.sql`
2. `migrations/202608220002_product_category_item_links.sql`

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
