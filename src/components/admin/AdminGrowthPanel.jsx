import { useMemo, useState } from "react";
import {
  BadgeCheck,
  MessageSquareText,
  Star,
} from "lucide-react";
import { moderateReview } from "../../services/adminService";

function Reviews({ onRefresh, reviews }) {
  const [busyId, setBusyId] = useState(null);
  const changeStatus = async (id, status) => {
    setBusyId(id);
    try {
      await moderateReview(id, status);
      await onRefresh();
    } catch (error) {
      console.error("Review moderation failed:", error);
    } finally {
      setBusyId(null);
    }
  };
  return (
    <section className="luxury-panel rounded-[10px] p-5 sm:p-6">
      <div className="mb-4">
        <p className="luxury-eyebrow mb-2">XAC THUC NGUOI MUA</p>
        <h2 className="luxury-heading text-lg">Kiem duyet danh gia</h2>
      </div>
      <div className="custom-scrollbar max-h-[680px] space-y-3 overflow-y-auto pr-1">
        {reviews.map((review) => (
          <article
            key={review.id}
            className="rounded-lg border border-border-subtle bg-bg-main/55 p-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="flex items-center gap-2 text-xs font-semibold text-text-main">
                {review.reviewer_name}
                {review.is_verified_purchase && (
                  <BadgeCheck size={14} className="text-[#9ed1ad]" />
                )}
              </span>
              <span
                className={`rounded px-2 py-1 text-[9px] font-bold uppercase ${review.status === "published" ? "bg-[#9ed1ad]/10 text-[#9ed1ad]" : review.status === "rejected" ? "bg-[#e7958d]/10 text-[#e7958d]" : "bg-primary/10 text-primary-hover"}`}
              >
                {review.status}
              </span>
            </div>
            <div className="mt-2 flex gap-0.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  size={12}
                  className="text-primary"
                  fill={star <= review.rating ? "currentColor" : "none"}
                />
              ))}
            </div>
            {review.title && (
              <h3 className="mt-3 text-sm font-semibold text-text-main">
                {review.title}
              </h3>
            )}
            <p className="mt-2 text-xs leading-5 text-text-muted">
              {review.content}
            </p>
            <p className="mt-2 font-['JetBrains_Mono'] text-[9px] text-text-muted">
              Product: {review.product_id}
            </p>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                disabled={busyId === review.id}
                onClick={() => changeStatus(review.id, "published")}
                className="min-h-9 rounded-md border border-[#9ed1ad]/25 px-3 text-[10px] font-bold uppercase text-[#9ed1ad] disabled:opacity-40"
              >
                Dang
              </button>
              <button
                type="button"
                disabled={busyId === review.id}
                onClick={() => changeStatus(review.id, "rejected")}
                className="min-h-9 rounded-md border border-[#e7958d]/25 px-3 text-[10px] font-bold uppercase text-[#e7958d] disabled:opacity-40"
              >
                Tu choi
              </button>
            </div>
          </article>
        ))}
        {reviews.length === 0 && (
          <div className="py-12 text-center">
            <MessageSquareText
              size={28}
              className="mx-auto mb-3 text-primary"
            />
            <p className="text-sm text-text-muted">Chua co danh gia.</p>
          </div>
        )}
      </div>
    </section>
  );
}

export default function AdminGrowthPanel({ alerts, onRefresh, reviews }) {
  const sortedReviews = useMemo(
    () =>
      [...reviews].sort(
        (a, b) =>
          (a.status === "pending" ? -1 : 1) - (b.status === "pending" ? -1 : 1),
      ),
    [reviews],
  );
  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="luxury-eyebrow mb-2">GROWTH OPERATIONS</p>
          <h2 className="luxury-heading text-xl">
            Uy tin san pham & canh bao
          </h2>
          <p className="mt-2 text-xs text-text-muted">
            {alerts.filter((alert) => alert.is_active).length} yeu cau theo doi
            gia/ton kho dang hoat dong
          </p>
        </div>
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <Reviews onRefresh={onRefresh} reviews={sortedReviews} />
      </div>
    </div>
  );
}
