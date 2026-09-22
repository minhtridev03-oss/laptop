import { supabase } from "../lib/supabase";

export async function subscribeProductAlert({
  email,
  notifyBackInStock,
  productId,
  targetPrice,
}) {
  const { data, error } = await supabase.rpc("subscribe_product_alert", {
    p_product_id: productId,
    p_email: email.trim(),
    p_target_price: targetPrice ? Number(targetPrice) : null,
    p_notify_back_in_stock: Boolean(notifyBackInStock),
  });
  if (error) throw error;
  return data;
}
