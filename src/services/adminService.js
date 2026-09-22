import { supabase } from "../lib/supabase";

const unwrap = ({ data, error }) => {
  if (error) throw error;
  return data;
};

export const ORDER_STATUSES = [
  { value: "pending", label: "Chờ xác nhận" },
  { value: "confirmed", label: "Đã xác nhận" },
  { value: "processing", label: "Đang chuẩn bị" },
  { value: "shipping", label: "Đang giao hàng" },
  { value: "completed", label: "Đã hoàn thành" },
  { value: "cancelled", label: "Đã hủy" },
];

export const PAYMENT_STATUSES = [
  { value: "unpaid", label: "Chưa thanh toán" },
  { value: "pending", label: "Chờ xác nhận" },
  { value: "paid", label: "Đã thanh toán" },
  { value: "refunded", label: "Đã hoàn tiền" },
];

export const PRODUCT_STATUSES = [
  { value: "draft", label: "Bản nháp" },
  { value: "active", label: "Đang bán" },
  { value: "inactive", label: "Tạm ngừng" },
  { value: "discontinued", label: "Ngừng kinh doanh" },
];

export async function getStaffMembership(userId) {
  if (!userId) return null;
  const data = await unwrap(
    await supabase
      .from("staff_members")
      .select("user_id, role, display_name, is_active")
      .eq("user_id", userId)
      .eq("is_active", true)
      .maybeSingle(),
  );
  return data ?? null;
}

export async function loadAdminWorkspace() {
  const [
    productsResult,
    ordersResult,
    categoriesResult,
    movementsResult,
    paymentMethodsResult,
    shippingZonesResult,
    notificationsResult,
    couponsResult,
    reviewsResult,
    alertsResult,
  ] = await Promise.all([
    supabase
      .from("products")
      .select("*")
      .order("updated_at", { ascending: false })
      .limit(500),
    supabase
      .from("orders")
      .select(
        "*, order_items(id, product_id, product_name, product_image, unit_price, quantity, line_total)",
      )
      .order("created_at", { ascending: false })
      .limit(200),
    supabase
      .from("categories")
      .select("id, name")
      .order("name", { ascending: true }),
    supabase
      .from("inventory_movements")
      .select(
        "id, product_id, order_id, movement_type, quantity_delta, stock_after, note, created_at",
      )
      .order("created_at", { ascending: false })
      .limit(100),
    supabase
      .from("payment_methods")
      .select("*")
      .order("sort_order", { ascending: true }),
    supabase
      .from("shipping_zones")
      .select("*")
      .order("sort_order", { ascending: true }),
    supabase
      .from("notification_outbox")
      .select(
        "id, event_type, channel, recipient, order_id, status, attempt_count, last_error, created_at",
      )
      .order("created_at", { ascending: false })
      .limit(100),
    supabase
      .from("coupons")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200),
    supabase
      .from("product_reviews")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200),
    supabase
      .from("product_alert_subscriptions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200),
  ]);

  return {
    products: unwrap(productsResult) ?? [],
    orders: unwrap(ordersResult) ?? [],
    categories: unwrap(categoriesResult) ?? [],
    movements: unwrap(movementsResult) ?? [],
    paymentMethods: unwrap(paymentMethodsResult) ?? [],
    shippingZones: unwrap(shippingZonesResult) ?? [],
    notifications: unwrap(notificationsResult) ?? [],
    coupons: unwrap(couponsResult) ?? [],
    reviews: unwrap(reviewsResult) ?? [],
    alerts: unwrap(alertsResult) ?? [],
  };
}

export async function saveProduct(product) {
  return unwrap(
    await supabase.rpc("admin_upsert_product", { p_product: product }),
  );
}

export async function adjustInventory(productId, stockQuantity, note) {
  return unwrap(
    await supabase.rpc("admin_adjust_inventory", {
      p_product_id: productId,
      p_stock_quantity: stockQuantity,
      p_note: note || null,
    }),
  );
}

export async function updateOrder({ orderId, status, paymentStatus, note }) {
  return unwrap(
    await supabase.rpc("admin_update_order", {
      p_order_id: orderId,
      p_status: status,
      p_payment_status: paymentStatus,
      p_note: note || null,
    }),
  );
}

export async function updatePaymentMethod(method) {
  return unwrap(
    await supabase.rpc("admin_update_payment_method", {
      p_code: method.code,
      p_display_name: method.display_name,
      p_description: method.description || null,
      p_config: method.config || {},
      p_is_active: Boolean(method.is_active),
    }),
  );
}

export async function saveShippingZone(zone) {
  return unwrap(
    await supabase.rpc("admin_upsert_shipping_zone", { p_zone: zone }),
  );
}

export async function saveCoupon(coupon) {
  return unwrap(
    await supabase.rpc("admin_upsert_coupon", { p_coupon: coupon }),
  );
}

export async function moderateReview(reviewId, status) {
  return unwrap(
    await supabase.rpc("admin_moderate_review", {
      p_review_id: reviewId,
      p_status: status,
    }),
  );
}
