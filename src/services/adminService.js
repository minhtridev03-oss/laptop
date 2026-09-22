import { supabase } from "../lib/supabase";

const unwrap = ({ data, error }) => {
  if (error) throw error;
  return data;
};

export async function uploadProductImage(file) {
  if (!file) throw new Error("Vui lòng chọn file ảnh");

  const fileExt = file.name.split('.').pop();
  const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
  const filePath = `products/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('product-images')
    .upload(filePath, file, { cacheControl: '3600', upsert: false });

  if (uploadError) {
    console.error("Upload error:", uploadError);
    throw new Error("Lỗi tải ảnh lên Supabase: " + uploadError.message);
  }

  const { data: publicUrlData } = supabase.storage
    .from('product-images')
    .getPublicUrl(filePath);

  return publicUrlData.publicUrl;
}

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
      .from("customer_profiles")
      .select("user_id, role, full_name")
      .eq("user_id", userId)
      .maybeSingle(),
  );
  
  if (data && data.role === 'admin') {
    return {
      user_id: data.user_id,
      role: 'admin',
      display_name: data.full_name || 'Admin',
      is_active: true
    };
  }
  return null;
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
    bannersResult,
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
      .select("*, category_groups(*, category_items(*))")
      .order("sort_order", { ascending: true }),
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
    supabase
      .from("banners")
      .select("*")
      .order("id", { ascending: true }),
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
    banners: unwrap(bannersResult) ?? [],
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

export async function toggleCoupon(couponId, isActive) {
  const { error } = await supabase
    .from("coupons")
    .update({ is_active: isActive })
    .eq("id", couponId);
  if (error) throw error;
}

export async function deleteCoupon(couponId) {
  const { error } = await supabase
    .from("coupons")
    .delete()
    .eq("id", couponId);
  if (error) throw error;
}

export async function moderateReview(reviewId, status) {
  return unwrap(
    await supabase.rpc("admin_moderate_review", {
      p_review_id: reviewId,
      p_status: status,
    }),
  );
}

export async function saveBanner(banner) {
  return unwrap(
    await supabase.rpc("admin_upsert_banner", { p_banner: banner })
  );
}

export async function deleteBanner(id) {
  return unwrap(
    await supabase.rpc("admin_delete_banner", { p_id: id })
  );
}

export async function saveCategory(category) {
  return unwrap(
    await supabase.rpc("admin_upsert_category", { p_category: category })
  );
}

export async function deleteCategory(id) {
  return unwrap(
    await supabase.rpc("admin_delete_category", { p_id: id })
  );
}
