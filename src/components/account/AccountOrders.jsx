import { ChevronRight, PackageCheck, Truck } from "lucide-react";
import { Link } from "react-router-dom";
import { formatCommercePrice } from "../../lib/commerce";

const STATUS_LABELS = {
  pending: "Chờ xác nhận",
  confirmed: "Đã xác nhận",
  processing: "Đang chuẩn bị",
  shipping: "Đang giao hàng",
  completed: "Đã hoàn thành",
  cancelled: "Đã hủy",
};

const formatDate = (value) =>
  new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));

export default function AccountOrders({ orders }) {
  return (
    <section>
      <div className="mb-5">
        <p className="luxury-eyebrow mb-2">LỊCH SỬ MUA HÀNG</p>
        <h2 className="luxury-heading text-xl">Đơn hàng của tôi</h2>
        <p className="mt-2 text-sm text-text-muted">
          Theo dõi trạng thái và xem lại sản phẩm trong từng đơn.
        </p>
      </div>
      <div className="space-y-4">
        {orders.map((order) => (
          <article
            key={order.id}
            className="luxury-panel rounded-[10px] p-5 sm:p-6"
          >
            <div className="flex flex-col justify-between gap-4 border-b border-border-subtle pb-4 sm:flex-row sm:items-start">
              <div>
                <p className="font-['JetBrains_Mono'] text-sm font-bold text-primary-hover">
                  {order.order_code}
                </p>
                <p className="mt-2 text-xs text-text-muted">
                  Đặt lúc {formatDate(order.created_at)}
                </p>
              </div>
              <div className="sm:text-right">
                <span
                  className={`inline-flex min-h-8 items-center rounded border px-2.5 text-[10px] font-bold uppercase tracking-[0.06em] ${order.status === "cancelled" ? "border-[#d56f66]/25 bg-[#d56f66]/[0.07] text-[#e7958d]" : order.status === "completed" ? "border-[#79b88d]/25 bg-[#79b88d]/[0.07] text-[#9ed1ad]" : "border-primary/25 bg-primary/[0.07] text-primary-hover"}`}
                >
                  {STATUS_LABELS[order.status] || order.status}
                </span>
                <p className="mt-2 font-['Sora'] text-lg font-bold text-text-main">
                  {formatCommercePrice(order.total)}
                </p>
              </div>
            </div>

            <div className="my-4 grid gap-2">
              {(order.order_items || []).map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 rounded-md border border-border-subtle bg-bg-main/55 p-3"
                >
                  <span className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded border border-border-subtle bg-[#f3f0e8] p-1">
                    {item.product_image && (
                      <img
                        src={item.product_image}
                        alt=""
                        className="max-h-full max-w-full object-contain"
                      />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-xs font-semibold leading-5 text-text-main">
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

            {(order.order_status_history || []).length > 0 && (
              <details className="border-t border-border-subtle pt-4">
                <summary className="cursor-pointer text-xs font-semibold text-text-main hover:text-primary-hover">
                  Lịch sử trạng thái
                </summary>
                <ol className="mt-4 space-y-3">
                  {[...order.order_status_history]
                    .sort(
                      (a, b) => new Date(b.created_at) - new Date(a.created_at),
                    )
                    .map((entry) => (
                      <li key={entry.id} className="flex gap-3 text-xs">
                        <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
                        <span>
                          <strong className="text-text-main">
                            {STATUS_LABELS[entry.to_status] || entry.to_status}
                          </strong>
                          <span className="mt-1 block text-text-muted">
                            {formatDate(entry.created_at)}
                            {entry.note ? ` · ${entry.note}` : ""}
                          </span>
                        </span>
                      </li>
                    ))}
                </ol>
              </details>
            )}
            <p className="mt-4 flex items-start gap-2 border-t border-border-subtle pt-4 text-xs leading-5 text-text-muted">
              <Truck size={14} className="mt-0.5 shrink-0 text-primary" />{" "}
              {order.shipping_address}, {order.shipping_province}
            </p>
          </article>
        ))}
      </div>
      {orders.length === 0 && (
        <div className="luxury-panel grid min-h-64 place-items-center rounded-[10px] text-center">
          <div>
            <PackageCheck size={38} className="mx-auto mb-4 text-primary" />
            <p className="font-semibold text-text-main">
              Bạn chưa có đơn hàng nào
            </p>
            <Link
              to="/products"
              className="mt-4 inline-flex items-center gap-1 text-xs font-bold uppercase text-primary-hover"
            >
              Khám phá sản phẩm <ChevronRight size={14} />
            </Link>
          </div>
        </div>
      )}
    </section>
  );
}
