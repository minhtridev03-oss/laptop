import { supabase } from "../lib/supabase";

const unwrap = ({ data, error }) => {
  if (error) throw error;
  return data;
};

export async function getCheckoutConfiguration(province, subtotal) {
  const response = await supabase.rpc("get_checkout_configuration", {
    p_province: province?.trim() || "",
    p_subtotal: Number(subtotal || 0),
  });
  if (response.error?.code === "PGRST202") return null;
  return unwrap(response);
}

export async function createCheckoutOrder({
  cart,
  couponCode,
  customer,
  notes,
  paymentMethod,
}) {
  const parameters = {
    p_customer: customer,
    p_items: cart.map((item) => ({
      product_id: item.product.id,
      quantity: item.quantity,
    })),
    p_payment_method: paymentMethod,
    p_notes: notes?.trim() || null,
  };
  const response = await supabase.rpc("create_checkout_order_v2", {
    ...parameters,
    p_coupon_code: couponCode?.trim() || null,
  });
  if (response.error?.code !== "PGRST202") return unwrap(response);
  const legacyCheckout = await supabase.rpc(
    "create_checkout_order",
    parameters,
  );
  if (!legacyCheckout.error || legacyCheckout.error?.code !== "PGRST202")
    return unwrap(legacyCheckout);
  return unwrap(await supabase.rpc("create_guest_order", parameters));
}

export async function validateCoupon(code, subtotal) {
  return unwrap(
    await supabase.rpc("validate_coupon", {
      p_code: code.trim(),
      p_subtotal: Number(subtotal || 0),
    }),
  );
}

export function createVietQrImageUrl(paymentConfig, amount, reference) {
  const bankBin = String(paymentConfig?.bank_bin || "").trim();
  const accountNumber = String(paymentConfig?.account_number || "").trim();
  if (!bankBin || !accountNumber || !Number(amount)) return null;
  const params = new URLSearchParams({
    amount: String(Math.round(Number(amount))),
    addInfo: reference || "",
    accountName: paymentConfig?.account_name || "",
  });
  return `https://img.vietqr.io/image/${encodeURIComponent(bankBin)}-${encodeURIComponent(accountNumber)}-compact2.png?${params.toString()}`;
}
