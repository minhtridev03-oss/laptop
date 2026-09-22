import { useCallback, useEffect, useMemo, useState } from "react";
import {
  BadgeCheck,
  LoaderCircle,
  MessageSquareText,
  Send,
  Star,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import {
  loadProductReviews,
  submitProductReview,
} from "../../services/reviewService";

const REVIEW_ERRORS = {
  VERIFIED_PURCHASE_REQUIRED:
    "Bạn chỉ có thể đánh giá sản phẩm đã mua trong một đơn hoàn thành.",
  INVALID_REVIEW_CONTENT: "Nội dung đánh giá cần từ 10 đến 2.000 ký tự.",
  AUTH_REQUIRED: "Vui lòng đăng nhập trước khi gửi đánh giá.",
};

function Stars({ interactive = false, onChange, value }) {
  return (
    <span className="flex gap-1" aria-label={`${value} trên 5 sao`}>
      {[1, 2, 3, 4, 5].map((star) =>
        interactive ? (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className="p-0.5 text-primary"
            aria-label={`Chọn ${star} sao`}
          >
            <Star size={19} fill={star <= value ? "currentColor" : "none"} />
          </button>
        ) : (
          <Star
            key={star}
            size={14}
            className="text-primary"
            fill={star <= Math.round(value) ? "currentColor" : "none"}
            aria-hidden="true"
          />
        ),
      )}
    </span>
  );
}

export default function ProductReviews({ productId }) {
  const { user } = useAuth();
  const [reviewState, setReviewState] = useState({
    average: 0,
    published: [],
    rows: [],
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({ rating: 5, title: "", content: "" });

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setReviewState(await loadProductReviews(productId));
    } catch (error) {
      console.error("Product reviews load failed:", error);
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const ownReview = useMemo(
    () => reviewState.rows.find((review) => review.user_id === user?.id),
    [reviewState.rows, user?.id],
  );

  useEffect(() => {
    if (!ownReview) return;
    setForm({
      rating: ownReview.rating,
      title: ownReview.title || "",
      content: ownReview.content || "",
    });
  }, [ownReview]);

  const submit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setMessage("");
    try {
      await submitProductReview({ ...form, productId });
      setMessage("Đánh giá đã được gửi và đang chờ kiểm duyệt.");
      await refresh();
    } catch (error) {
      console.error("Product review submit failed:", error);
      const errorKey = Object.keys(REVIEW_ERRORS).find((key) =>
        error.message?.includes(key),
      );
      setMessage(
        REVIEW_ERRORS[errorKey] ||
          "Chưa thể gửi đánh giá. Vui lòng thử lại sau.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section
      className="luxury-panel mt-7 rounded-[10px] p-5 sm:p-7"
      aria-labelledby="product-reviews-title"
    >
      <div className="flex flex-col justify-between gap-4 border-b border-border-subtle pb-5 sm:flex-row sm:items-end">
        <div>
          <p className="luxury-eyebrow mb-2">TRẢI NGHIỆM THỰC TẾ</p>
          <h2 id="product-reviews-title" className="luxury-heading text-xl">
            Đánh giá từ khách hàng
          </h2>
        </div>
        <div className="flex items-center gap-3">
          <strong className="font-['Sora'] text-2xl text-primary-hover">
            {reviewState.published.length
              ? reviewState.average.toFixed(1)
              : "—"}
          </strong>
          <div>
            <Stars value={reviewState.average} />
            <p className="mt-1 text-[10px] text-text-muted">
              {reviewState.published.length} đánh giá đã duyệt
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_390px]">
        <div className="space-y-3">
          {loading ? (
            <div className="grid min-h-32 place-items-center text-primary">
              <LoaderCircle
                className="animate-spin"
                aria-label="Đang tải đánh giá"
              />
            </div>
          ) : reviewState.published.length ? (
            reviewState.published.map((review) => (
              <article
                key={review.id}
                className="rounded-lg border border-border-subtle bg-bg-main/55 p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <strong className="text-sm text-text-main">
                      {review.reviewer_name}
                    </strong>
                    {review.is_verified_purchase && (
                      <span className="flex items-center gap-1 text-[9px] font-bold uppercase text-[#9ed1ad]">
                        <BadgeCheck size={13} /> Đã mua hàng
                      </span>
                    )}
                  </div>
                  <time className="text-[10px] text-text-muted">
                    {new Date(review.created_at).toLocaleDateString("vi-VN")}
                  </time>
                </div>
                <div className="mt-2">
                  <Stars value={review.rating} />
                </div>
                {review.title && (
                  <h3 className="mt-3 text-sm font-semibold text-text-main">
                    {review.title}
                  </h3>
                )}
                <p className="mt-2 whitespace-pre-line text-xs leading-6 text-text-muted">
                  {review.content}
                </p>
              </article>
            ))
          ) : (
            <div className="grid min-h-40 place-items-center rounded-lg border border-dashed border-border-subtle text-center">
              <div>
                <MessageSquareText
                  size={28}
                  className="mx-auto mb-3 text-primary"
                />
                <p className="text-sm font-semibold text-text-main">
                  Chưa có đánh giá đã duyệt
                </p>
                <p className="mt-1 text-xs text-text-muted">
                  Khách đã mua hàng có thể gửi trải nghiệm đầu tiên.
                </p>
              </div>
            </div>
          )}
        </div>

        <form
          onSubmit={submit}
          className="h-fit rounded-lg border border-primary/20 bg-primary/[0.04] p-4 sm:p-5"
        >
          <h3 className="font-['Sora'] text-sm font-bold text-text-main">
            {ownReview ? "Cập nhật đánh giá" : "Viết đánh giá"}
          </h3>
          {!user ? (
            <p className="mt-3 text-xs leading-5 text-text-muted">
              Đăng nhập bằng nút trên thanh đầu trang. Hệ thống chỉ nhận đánh
              giá từ tài khoản có đơn hàng hoàn thành.
            </p>
          ) : (
            <>
              {ownReview && (
                <p className="mt-2 text-[10px] text-primary-hover">
                  Trạng thái:{" "}
                  {ownReview.status === "published"
                    ? "Đã đăng"
                    : ownReview.status === "rejected"
                      ? "Cần chỉnh sửa"
                      : "Đang chờ duyệt"}
                </p>
              )}
              <div className="mt-4">
                <span className="mb-2 block text-[10px] font-bold uppercase tracking-[0.08em] text-text-muted">
                  Mức hài lòng
                </span>
                <Stars
                  interactive
                  value={form.rating}
                  onChange={(rating) =>
                    setForm((current) => ({ ...current, rating }))
                  }
                />
              </div>
              <label className="mt-4 block">
                <span className="mb-2 block text-[10px] font-bold uppercase tracking-[0.08em] text-text-muted">
                  Tiêu đề
                </span>
                <input
                  value={form.title}
                  maxLength={120}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      title: event.target.value,
                    }))
                  }
                  className="min-h-11 w-full rounded-md border border-border-subtle bg-bg-main px-3 text-sm text-text-main outline-none focus:border-primary/45"
                  placeholder="Điểm nổi bật của sản phẩm"
                />
              </label>
              <label className="mt-4 block">
                <span className="mb-2 block text-[10px] font-bold uppercase tracking-[0.08em] text-text-muted">
                  Nội dung
                </span>
                <textarea
                  required
                  minLength={10}
                  maxLength={2000}
                  rows={5}
                  value={form.content}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      content: event.target.value,
                    }))
                  }
                  className="w-full resize-y rounded-md border border-border-subtle bg-bg-main p-3 text-sm leading-6 text-text-main outline-none focus:border-primary/45"
                  placeholder="Chia sẻ trải nghiệm sử dụng thực tế..."
                />
              </label>
              {message && (
                <p className="mt-3 text-xs leading-5 text-primary-hover">
                  {message}
                </p>
              )}
              <button
                type="submit"
                disabled={submitting || form.content.trim().length < 10}
                className="luxury-primary-button mt-4 flex min-h-11 w-full items-center justify-center gap-2 rounded-md text-xs font-bold uppercase disabled:opacity-40"
              >
                {submitting ? (
                  <LoaderCircle size={15} className="animate-spin" />
                ) : (
                  <Send size={15} />
                )}{" "}
                Gửi đánh giá
              </button>
            </>
          )}
        </form>
      </div>
    </section>
  );
}
