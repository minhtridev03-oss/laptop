import { supabase } from "../lib/supabase";

const unwrap = ({ data, error }) => {
  if (error) throw error;
  return data;
};

export async function loadProductReviews(productId) {
  const rows =
    unwrap(
      await supabase
        .from("product_reviews")
        .select(
          "id, user_id, reviewer_name, rating, title, content, status, is_verified_purchase, helpful_count, created_at, updated_at",
        )
        .eq("product_id", productId)
        .order("created_at", { ascending: false }),
    ) ?? [];

  const published = rows.filter((review) => review.status === "published");
  const average = published.length
    ? published.reduce((sum, review) => sum + Number(review.rating || 0), 0) /
      published.length
    : 0;

  return { average, published, rows };
}

export async function submitProductReview({
  content,
  productId,
  rating,
  title,
}) {
  return unwrap(
    await supabase.rpc("submit_product_review", {
      p_product_id: productId,
      p_rating: Number(rating),
      p_title: title?.trim() || null,
      p_content: content.trim(),
    }),
  );
}
