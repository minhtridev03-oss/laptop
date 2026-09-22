# Supabase commerce setup

Run `migrations/202608220001_commerce_foundation.sql` once in the Supabase SQL Editor using an owner/admin connection.

The migration:

- extends `products` with SKU, brand, status, inventory and structured specifications;
- migrates the existing CPU/RAM/storage/GPU fields into `products.specifications`;
- creates customer profiles, addresses, authenticated carts and wishlists;
- creates campaigns, orders and immutable order-item snapshots;
- enables RLS and owner-only policies for customer data;
- exposes `create_guest_order` and `lookup_guest_order` as narrow RPC functions for guest checkout.

`products.stock_quantity = null` means inventory is not managed yet. Set an integer when stock control is enabled. The checkout RPC always reloads product price, status and inventory from PostgreSQL and never trusts totals submitted by the browser.
