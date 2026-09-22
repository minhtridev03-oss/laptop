import { useMemo, useState } from "react";
import {
  BadgeCheck,
  LoaderCircle,
  MessageSquareText,
  Plus,
  Save,
  Star,
  Tags,
} from "lucide-react";
import { formatCommercePrice } from "../../lib/commerce";
import { moderateReview, saveCoupon } from "../../services/adminService";

const dateTimeValue = (value) =>
  value ? new Date(value).toISOString().slice(0, 16) : "";
const newCoupon = () => {
  const start = new Date();
  const end = new Date(start);
  end.setDate(end.getDate() + 30);
  return {
    code: "",
    name: "",
    description: "",
    discount_type: "percentage",
    discount_value: 10,
    minimum_order_value: 0,
    maximum_discount: "",
    usage_limit: "",
    starts_at: dateTimeValue(start),
    ends_at: dateTimeValue(end),
    is_active: true,
  };
};

function CouponEditor({ coupon, onCancel, onSaved }) {
  const [form, setForm] = useState({
    ...coupon,
    starts_at: dateTimeValue(coupon.starts_at),
    ends_at: dateTimeValue(coupon.ends_at),
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const field = (name, value) =>
    setForm((current) => ({ ...current, [name]: value }));
  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      await saveCoupon({
        ...form,
        starts_at: new Date(form.starts_at).toISOString(),
        ends_at: new Date(form.ends_at).toISOString(),
      });
      await onSaved();
    } catch (saveError) {
      console.error("Coupon save failed:", saveError);
      setError(
        "Không thể lưu mã. Kiểm tra mã trùng, giá trị và thời gian áp dụng.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <form
      onSubmit={submit}
      className="mb-5 rounded-lg border border-primary/30 bg-primary/[0.04] p-4 sm:p-5"
    >
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="luxury-eyebrow mb-1">COUPON EDITOR</p>
          <h3 className="luxury-heading text-base">
            {form.id ? `Chỉnh sửa ${form.code}` : "Tạo mã mới"}
          </h3>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="text-xs text-text-muted hover:text-text-main"
        >
          Đóng
        </button>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <label className="block">
          <span className="mb-2 block text-[10px] font-bold uppercase text-text-muted">
            Mã
          </span>
          <input
            required
            value={form.code}
            onChange={(event) =>
              field("code", event.target.value.toUpperCase().replace(/\s/g, ""))
            }
            className="min-h-11 w-full rounded-md border border-border-subtle bg-bg-main px-3 font-['JetBrains_Mono'] text-xs uppercase text-text-main outline-none focus:border-primary/45"
          />
        </label>
        <label className="block md:col-span-1 xl:col-span-2">
          <span className="mb-2 block text-[10px] font-bold uppercase text-text-muted">
            Tên chương trình
          </span>
          <input
            required
            value={form.name}
            onChange={(event) => field("name", event.target.value)}
            className="min-h-11 w-full rounded-md border border-border-subtle bg-bg-main px-3 text-sm text-text-main outline-none focus:border-primary/45"
          />
        </label>
        <label className="block">
          <span className="mb-2 block text-[10px] font-bold uppercase text-text-muted">
            Loại giảm
          </span>
          <select
            value={form.discount_type}
            onChange={(event) => field("discount_type", event.target.value)}
            className="min-h-11 w-full rounded-md border border-border-subtle bg-bg-main px-3 text-xs text-text-main outline-none"
          >
            <option value="percentage">Phần trăm</option>
            <option value="amount">Số tiền</option>
          </select>
        </label>
        <label className="block">
          <span className="mb-2 block text-[10px] font-bold uppercase text-text-muted">
            Giá trị
          </span>
          <input
            required
            min="1"
            max={form.discount_type === "percentage" ? 100 : undefined}
            type="number"
            value={form.discount_value}
            onChange={(event) => field("discount_value", event.target.value)}
            className="min-h-11 w-full rounded-md border border-border-subtle bg-bg-main px-3 text-sm text-text-main outline-none"
          />
        </label>
        <label className="block">
          <span className="mb-2 block text-[10px] font-bold uppercase text-text-muted">
            Đơn tối thiểu
          </span>
          <input
            min="0"
            type="number"
            value={form.minimum_order_value}
            onChange={(event) =>
              field("minimum_order_value", event.target.value)
            }
            className="min-h-11 w-full rounded-md border border-border-subtle bg-bg-main px-3 text-sm text-text-main outline-none"
          />
        </label>
        <label className="block">
          <span className="mb-2 block text-[10px] font-bold uppercase text-text-muted">
            Giảm tối đa
          </span>
          <input
            min="1"
            type="number"
            value={form.maximum_discount ?? ""}
            onChange={(event) => field("maximum_discount", event.target.value)}
            className="min-h-11 w-full rounded-md border border-border-subtle bg-bg-main px-3 text-sm text-text-main outline-none"
            placeholder="Không giới hạn"
          />
        </label>
        <label className="block">
          <span className="mb-2 block text-[10px] font-bold uppercase text-text-muted">
            Lượt sử dụng
          </span>
          <input
            min="1"
            type="number"
            value={form.usage_limit ?? ""}
            onChange={(event) => field("usage_limit", event.target.value)}
            className="min-h-11 w-full rounded-md border border-border-subtle bg-bg-main px-3 text-sm text-text-main outline-none"
            placeholder="Không giới hạn"
          />
        </label>
        <label className="block">
          <span className="mb-2 block text-[10px] font-bold uppercase text-text-muted">
            Bắt đầu
          </span>
          <input
            required
            type="datetime-local"
            value={form.starts_at}
            onChange={(event) => field("starts_at", event.target.value)}
            className="min-h-11 w-full rounded-md border border-border-subtle bg-bg-main px-3 text-xs text-text-main outline-none"
          />
        </label>
        <label className="block">
          <span className="mb-2 block text-[10px] font-bold uppercase text-text-muted">
            Kết thúc
          </span>
          <input
            required
            type="datetime-local"
            value={form.ends_at}
            onChange={(event) => field("ends_at", event.target.value)}
            className="min-h-11 w-full rounded-md border border-border-subtle bg-bg-main px-3 text-xs text-text-main outline-none"
          />
        </label>
        <label className="flex min-h-11 items-center gap-3 self-end rounded-md border border-border-subtle bg-bg-main px-3 text-xs text-text-main">
          <input
            type="checkbox"
            checked={form.is_active}
            onChange={(event) => field("is_active", event.target.checked)}
          />{" "}
          Đang hoạt động
        </label>
      </div>
      <label className="mt-4 block">
        <span className="mb-2 block text-[10px] font-bold uppercase text-text-muted">
          Mô tả
        </span>
        <input
          value={form.description || ""}
          onChange={(event) => field("description", event.target.value)}
          className="min-h-11 w-full rounded-md border border-border-subtle bg-bg-main px-3 text-sm text-text-main outline-none"
        />
      </label>
      {error && <p className="mt-3 text-xs text-[#e7958d]">{error}</p>}
      <button
        type="submit"
        disabled={saving}
        className="luxury-primary-button mt-4 flex min-h-11 items-center gap-2 rounded-md px-5 text-xs font-bold uppercase disabled:opacity-50"
      >
        {saving ? (
          <LoaderCircle size={15} className="animate-spin" />
        ) : (
          <Save size={15} />
        )}{" "}
        Lưu mã
      </button>
    </form>
  );
}

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
        <p className="luxury-eyebrow mb-2">XÁC THỰC NGƯỜI MUA</p>
        <h2 className="luxury-heading text-lg">Kiểm duyệt đánh giá</h2>
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
                Đăng
              </button>
              <button
                type="button"
                disabled={busyId === review.id}
                onClick={() => changeStatus(review.id, "rejected")}
                className="min-h-9 rounded-md border border-[#e7958d]/25 px-3 text-[10px] font-bold uppercase text-[#e7958d] disabled:opacity-40"
              >
                Từ chối
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
            <p className="text-sm text-text-muted">Chưa có đánh giá.</p>
          </div>
        )}
      </div>
    </section>
  );
}

export default function AdminGrowthPanel({ alerts, coupons, onRefresh, reviews }) {
  const [editing, setEditing] = useState(null);
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
            Khuyến mãi & uy tín sản phẩm
          </h2>
          <p className="mt-2 text-xs text-text-muted">
            {alerts.filter((alert) => alert.is_active).length} yêu cầu theo dõi
            giá/tồn kho đang hoạt động
          </p>
        </div>
        <button
          type="button"
          onClick={() => setEditing(newCoupon())}
          className="luxury-primary-button flex min-h-11 items-center gap-2 rounded-md px-4 text-xs font-bold uppercase"
        >
          <Plus size={15} /> Tạo mã giảm giá
        </button>
      </div>
      {editing && (
        <CouponEditor
          coupon={editing}
          onCancel={() => setEditing(null)}
          onSaved={async () => {
            setEditing(null);
            await onRefresh();
          }}
        />
      )}
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)]">
        <section className="luxury-panel rounded-[10px] p-5 sm:p-6">
          <div className="mb-4 flex items-center gap-3">
            <Tags size={20} className="text-primary" />
            <div>
              <p className="luxury-eyebrow mb-1">VOUCHER ENGINE</p>
              <h2 className="luxury-heading text-lg">Mã giảm giá</h2>
            </div>
          </div>
          <div className="space-y-3">
            {coupons.map((coupon) => (
              <button
                key={coupon.id}
                type="button"
                onClick={() => setEditing(coupon)}
                className="grid w-full gap-3 rounded-lg border border-border-subtle bg-bg-main/55 p-4 text-left hover:border-primary/35 sm:grid-cols-[1fr_auto]"
              >
                <span>
                  <span className="font-['JetBrains_Mono'] text-sm font-bold text-primary-hover">
                    {coupon.code}
                  </span>
                  <strong className="ml-3 text-sm text-text-main">
                    {coupon.name}
                  </strong>
                  <span className="mt-2 block text-xs text-text-muted">
                    {coupon.discount_type === "percentage"
                      ? `${coupon.discount_value}%${coupon.maximum_discount ? ` · tối đa ${formatCommercePrice(coupon.maximum_discount)}` : ""}`
                      : formatCommercePrice(coupon.discount_value)}{" "}
                    · Đã dùng {coupon.used_count}/{coupon.usage_limit || "∞"}
                  </span>
                </span>
                <span
                  className={`h-fit rounded px-2 py-1 text-[9px] font-bold uppercase ${coupon.is_active ? "bg-[#9ed1ad]/10 text-[#9ed1ad]" : "bg-bg-card text-text-muted"}`}
                >
                  {coupon.is_active ? "Hoạt động" : "Đã tắt"}
                </span>
              </button>
            ))}
            {coupons.length === 0 && (
              <p className="py-12 text-center text-sm text-text-muted">
                Chưa có mã giảm giá.
              </p>
            )}
          </div>
        </section>
        <Reviews onRefresh={onRefresh} reviews={sortedReviews} />
      </div>
    </div>
  );
}
