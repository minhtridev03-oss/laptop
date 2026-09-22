import { useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  LoaderCircle,
  PackageCheck,
  Save,
  Search,
  Truck,
} from "lucide-react";
import { formatCommercePrice } from "../../lib/commerce";
import {
  ORDER_STATUSES,
  PAYMENT_STATUSES,
  updateOrder,
} from "../../services/adminService";

const PAGE_SIZE = 20;
const orderStatusLabel = new Map(
  ORDER_STATUSES.map((item) => [item.value, item.label]),
);
const paymentStatusLabel = new Map(
  PAYMENT_STATUSES.map((item) => [item.value, item.label]),
);
const NEXT_STATUSES = {
  pending: ["pending", "confirmed", "cancelled"],
  confirmed: ["confirmed", "processing", "cancelled"],
  processing: ["processing", "shipping", "cancelled"],
  shipping: ["shipping", "completed", "cancelled"],
  completed: ["completed"],
  cancelled: ["cancelled"],
};

const formatDateTime = (value) =>
  new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));

function OrderCard({ onUpdated, order }) {
  const [status, setStatus] = useState(order.status);
  const [paymentStatus, setPaymentStatus] = useState(order.payment_status);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const changed =
    status !== order.status ||
    paymentStatus !== order.payment_status ||
    note.trim();
  const allowedStatuses = NEXT_STATUSES[order.status] || [order.status];

  const save = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const updated = await updateOrder({
        orderId: order.id,
        status,
        paymentStatus,
        note: note.trim(),
      });
      onUpdated(updated);
      setNote("");
      setMessage({ tone: "success", text: "Đã cập nhật đơn hàng." });
    } catch (error) {
      console.error("Admin order update failed:", error);
      setMessage({
        tone: "error",
        text: "Không thể cập nhật. Hãy kiểm tra bước chuyển trạng thái và quyền nhân viên.",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <article className="luxury-panel rounded-[10px] p-4 sm:p-5">
      <div className="flex flex-col justify-between gap-4 border-b border-border-subtle pb-4 lg:flex-row lg:items-start">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-['JetBrains_Mono'] text-sm font-bold text-primary-hover">
              {order.order_code}
            </h3>
            <span className="rounded border border-primary/20 bg-primary/[0.06] px-2 py-1 text-[9px] font-bold uppercase tracking-[0.06em] text-primary">
              {orderStatusLabel.get(order.status) || order.status}
            </span>
          </div>
          <p className="mt-2 text-sm font-semibold text-text-main">
            {order.customer_name} · {order.customer_phone}
          </p>
          <p className="mt-1 text-xs text-text-muted">
            {formatDateTime(order.created_at)} · {order.shipping_province}
          </p>
        </div>
        <div className="text-left lg:text-right">
          <p className="font-['Be_Vietnam_Pro'] text-lg font-bold text-primary-hover">
            {formatCommercePrice(order.total)}
          </p>
          <p className="mt-1 text-[10px] uppercase tracking-[0.07em] text-text-muted">
            {paymentStatusLabel.get(order.payment_status) ||
              order.payment_status}{" "}
            · {order.payment_method}
          </p>
        </div>
      </div>

      <details className="border-b border-border-subtle py-4">
        <summary className="cursor-pointer text-xs font-semibold text-text-main hover:text-primary-hover">
          {order.order_items?.length || 0} dòng sản phẩm · Xem chi tiết
        </summary>
        <div className="mt-3 grid gap-2">
          {(order.order_items || []).map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-3 rounded-md border border-border-subtle bg-bg-main/55 p-2.5"
            >
              <span className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded border border-border-subtle bg-[#f3f0e8] p-1">
                {item.product_image && (
                  <img
                    src={item.product_image}
                    alt=""
                    className="max-h-full max-w-full object-contain"
                  />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <p className="line-clamp-1 text-xs font-semibold text-text-main">
                  {item.product_name}
                </p>
                <p className="mt-1 text-[10px] text-text-muted">
                  {item.quantity} × {formatCommercePrice(item.unit_price)}
                </p>
              </div>
              <strong className="shrink-0 text-xs text-primary-hover">
                {formatCommercePrice(item.line_total)}
              </strong>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs leading-5 text-text-muted">
          <Truck
            size={13}
            className="mr-1 inline text-primary"
            aria-hidden="true"
          />{" "}
          {order.shipping_address}, {order.shipping_province}
        </p>
      </details>

      <div className="mt-4 grid gap-3 lg:grid-cols-[180px_180px_minmax(0,1fr)_auto] lg:items-end">
        <label>
          <span className="mb-2 block text-[10px] font-bold uppercase tracking-[0.07em] text-text-muted">
            Trạng thái đơn
          </span>
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className="luxury-search min-h-11 w-full rounded-md px-3 text-xs text-text-main outline-none"
          >
            {ORDER_STATUSES.filter((item) =>
              allowedStatuses.includes(item.value),
            ).map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="mb-2 block text-[10px] font-bold uppercase tracking-[0.07em] text-text-muted">
            Thanh toán
          </span>
          <select
            value={paymentStatus}
            onChange={(event) => setPaymentStatus(event.target.value)}
            className="luxury-search min-h-11 w-full rounded-md px-3 text-xs text-text-main outline-none"
          >
            {PAYMENT_STATUSES.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="mb-2 block text-[10px] font-bold uppercase tracking-[0.07em] text-text-muted">
            Ghi chú nội bộ
          </span>
          <input
            value={note}
            onChange={(event) => setNote(event.target.value)}
            className="luxury-search min-h-11 w-full rounded-md px-3 text-xs text-text-main outline-none"
            placeholder="Lý do cập nhật hoặc hủy đơn..."
          />
        </label>
        <button
          type="button"
          onClick={save}
          disabled={!changed || saving}
          className="luxury-primary-button flex min-h-11 items-center justify-center gap-2 rounded-md px-4 text-xs font-bold uppercase tracking-[0.06em] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {saving ? (
            <LoaderCircle
              size={15}
              className="animate-spin"
              aria-hidden="true"
            />
          ) : (
            <Save size={15} aria-hidden="true" />
          )}{" "}
          Lưu
        </button>
      </div>
      {message && (
        <p
          className={`mt-3 text-xs ${message.tone === "success" ? "text-[#9ed1ad]" : "text-[#e7958d]"}`}
          role="status"
        >
          {message.text}
        </p>
      )}
    </article>
  );
}

export default function AdminOrdersPanel({ onOrderUpdated, orders }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const normalizedQuery = query.trim().toLocaleLowerCase("vi");
  const filtered = useMemo(
    () =>
      orders.filter((order) => {
        if (status !== "all" && order.status !== status) return false;
        if (!normalizedQuery) return true;
        return [
          order.order_code,
          order.customer_name,
          order.customer_phone,
          order.customer_email,
        ]
          .filter(Boolean)
          .some((value) =>
            String(value).toLocaleLowerCase("vi").includes(normalizedQuery),
          );
      }),
    [normalizedQuery, orders, status],
  );
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const visibleOrders = filtered.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  );

  return (
    <section aria-labelledby="admin-orders-title">
      <div className="mb-5">
        <p className="luxury-eyebrow mb-2">ORDER OPERATIONS</p>
        <h2 id="admin-orders-title" className="luxury-heading text-xl">
          Đơn hàng
        </h2>
        <p className="mt-2 text-sm text-text-muted">
          Xử lý theo luồng xác nhận → chuẩn bị → giao hàng → hoàn thành.
        </p>
      </div>
      <div className="luxury-panel mb-4 grid gap-3 rounded-[10px] p-4 sm:grid-cols-[minmax(0,1fr)_220px]">
        <label className="luxury-search relative rounded-md">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-primary"
            aria-hidden="true"
          />
          <input
            type="search"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setPage(1);
            }}
            placeholder="Tìm mã đơn, khách hàng, số điện thoại..."
            className="min-h-11 w-full bg-transparent pl-10 pr-3 text-sm text-text-main outline-none"
          />
        </label>
        <select
          value={status}
          onChange={(event) => {
            setStatus(event.target.value);
            setPage(1);
          }}
          className="luxury-search min-h-11 rounded-md px-3 text-sm text-text-main outline-none"
        >
          <option value="all">Tất cả trạng thái</option>
          {ORDER_STATUSES.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-3">
        {visibleOrders.map((order) => (
          <OrderCard
            key={`${order.id}-${order.updated_at}`}
            order={order}
            onUpdated={onOrderUpdated}
          />
        ))}
      </div>
      {visibleOrders.length === 0 && (
        <div className="luxury-panel grid min-h-56 place-items-center rounded-[10px] text-center text-sm text-text-muted">
          <div>
            <PackageCheck
              size={30}
              className="mx-auto mb-3 text-primary"
              aria-hidden="true"
            />
            Không có đơn hàng phù hợp.
          </div>
        </div>
      )}
      <div className="mt-4 flex items-center justify-between text-xs text-text-muted">
        <span>
          {filtered.length} đơn · Trang {safePage}/{pageCount}
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            disabled={safePage <= 1}
            className="grid h-9 w-9 place-items-center rounded-md border border-border-subtle disabled:opacity-35"
            aria-label="Trang trước"
          >
            <ChevronLeft size={15} />
          </button>
          <button
            type="button"
            onClick={() =>
              setPage((current) => Math.min(pageCount, current + 1))
            }
            disabled={safePage >= pageCount}
            className="grid h-9 w-9 place-items-center rounded-md border border-border-subtle disabled:opacity-35"
            aria-label="Trang sau"
          >
            <ChevronRight size={15} />
          </button>
        </div>
      </div>
    </section>
  );
}
