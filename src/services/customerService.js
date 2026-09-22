import { toCommerceProduct } from "../lib/commerce";
import { supabase } from "../lib/supabase";

const unwrap = ({ data, error }) => {
  if (error) throw error;
  return data;
};

export async function loadCustomerCommerce(userId) {
  if (!userId) return { cart: [], wishlist: [] };
  const [cartRecord, wishlistRows] = await Promise.all([
    unwrap(
      await supabase
        .from("shopping_carts")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle(),
    ),
    unwrap(
      await supabase
        .from("wishlist_items")
        .select("product:products(*)")
        .eq("user_id", userId)
        .order("created_at", { ascending: false }),
    ),
  ]);

  const cartRows = cartRecord?.id
    ? unwrap(
        await supabase
          .from("cart_items")
          .select("quantity, product:products(*)")
          .eq("cart_id", cartRecord.id)
          .order("created_at", { ascending: true }),
      )
    : [];

  return {
    cart: (cartRows ?? [])
      .filter((row) => row.product)
      .map((row) => ({
        product: toCommerceProduct(row.product),
        quantity: Number(row.quantity) || 1,
      })),
    wishlist: (wishlistRows ?? [])
      .filter((row) => row.product)
      .map((row) => toCommerceProduct(row.product)),
  };
}

export const mergeCustomerCart = (localCart, remoteCart) => {
  const merged = new Map(remoteCart.map((item) => [item.product.id, item]));
  localCart.forEach((item) => {
    const remote = merged.get(item.product.id);
    merged.set(item.product.id, {
      product: toCommerceProduct(item.product),
      quantity: Math.min(
        10,
        Math.max(Number(item.quantity) || 1, Number(remote?.quantity) || 0),
      ),
    });
  });
  return [...merged.values()];
};

export const mergeCustomerWishlist = (localWishlist, remoteWishlist) => {
  const merged = new Map(
    remoteWishlist.map((product) => [product.id, toCommerceProduct(product)]),
  );
  localWishlist.forEach((product) =>
    merged.set(product.id, toCommerceProduct(product)),
  );
  return [...merged.values()];
};

export async function syncCustomerCart(cart) {
  return unwrap(
    await supabase.rpc("sync_customer_cart", {
      p_items: cart.map((item) => ({
        product_id: item.product.id,
        quantity: item.quantity,
      })),
    }),
  );
}

export async function syncCustomerWishlist(wishlist) {
  return unwrap(
    await supabase.rpc("sync_customer_wishlist", {
      p_product_ids: wishlist.map((product) => product.id),
    }),
  );
}

export async function loadCustomerAccount(userId) {
  if (!userId)
    return { profile: null, addresses: [], orders: [], savedBuilds: [] };
  const [profileResult, addressesResult, ordersResult, savedBuildsResult] =
    await Promise.all([
      supabase
        .from("customer_profiles")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle(),
      supabase
        .from("customer_addresses")
        .select("*")
        .eq("user_id", userId)
        .order("is_default", { ascending: false })
        .order("created_at", { ascending: false }),
      supabase
        .from("orders")
        .select(
          "*, order_items(id, product_id, product_name, product_image, unit_price, quantity, line_total), order_status_history(id, from_status, to_status, note, created_at)",
        )
        .eq("user_id", userId)
        .order("created_at", { ascending: false }),
      supabase
        .from("saved_pc_builds")
        .select("*")
        .eq("user_id", userId)
        .order("updated_at", { ascending: false }),
    ]);
  return {
    profile: unwrap(profileResult),
    addresses: unwrap(addressesResult) ?? [],
    orders: unwrap(ordersResult) ?? [],
    savedBuilds: unwrap(savedBuildsResult) ?? [],
  };
}

export async function saveCustomerProfile(userId, profile) {
  return unwrap(
    await supabase
      .from("customer_profiles")
      .upsert(
        {
          user_id: userId,
          full_name: profile.full_name?.trim() || null,
          phone: profile.phone?.trim() || null,
        },
        { onConflict: "user_id" },
      )
      .select()
      .single(),
  );
}

export async function saveCustomerAddress(userId, address) {
  const payload = {
    user_id: userId,
    label: address.label.trim(),
    recipient_name: address.recipient_name.trim(),
    phone: address.phone.trim(),
    address_line: address.address_line.trim(),
    ward: address.ward?.trim() || null,
    district: address.district?.trim() || null,
    province: address.province.trim(),
    is_default: Boolean(address.is_default),
  };
  const query = address.id
    ? supabase
        .from("customer_addresses")
        .update(payload)
        .eq("id", address.id)
        .eq("user_id", userId)
    : supabase.from("customer_addresses").insert(payload);
  return unwrap(await query.select().single());
}

export async function removeCustomerAddress(userId, addressId) {
  return unwrap(
    await supabase
      .from("customer_addresses")
      .delete()
      .eq("id", addressId)
      .eq("user_id", userId),
  );
}

export async function setDefaultCustomerAddress(userId, addressId) {
  return unwrap(
    await supabase
      .from("customer_addresses")
      .update({ is_default: true })
      .eq("id", addressId)
      .eq("user_id", userId)
      .select()
      .single(),
  );
}

export async function loadCheckoutDefaults(userId) {
  if (!userId) return null;
  const [profile, address] = await Promise.all([
    unwrap(
      await supabase
        .from("customer_profiles")
        .select("full_name, phone")
        .eq("user_id", userId)
        .maybeSingle(),
    ),
    unwrap(
      await supabase
        .from("customer_addresses")
        .select("*")
        .eq("user_id", userId)
        .eq("is_default", true)
        .maybeSingle(),
    ),
  ]);
  return { profile, address };
}
