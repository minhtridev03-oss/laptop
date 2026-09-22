import { useCallback, useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import {
  AlertTriangle,
  Boxes,
  ClipboardList,
  LayoutDashboard,
  LoaderCircle,
  PackageCheck,
  RefreshCw,
  Settings2,
  ShieldCheck,
  Sparkles,
  WalletCards,
} from "lucide-react";
import AdminGuard from "../../components/admin/AdminGuard";
import AdminOrdersPanel from "../../components/admin/AdminOrdersPanel";
import AdminProductsPanel from "../../components/admin/AdminProductsPanel";
import AdminSettingsPanel from "../../components/admin/AdminSettingsPanel";
import AdminGrowthPanel from "../../components/admin/AdminGrowthPanel";
import { useAuth } from "../../context/AuthContext";
import { formatCommercePrice } from "../../lib/commerce";
import { loadAdminWorkspace } from "../../services/adminService";

const TABS = [
  { id: "overview", label: "Tổng quan", Icon: LayoutDashboard },
  { id: "products", label: "Sản phẩm & kho", Icon: Boxes },
  { id: "orders", label: "Đơn hàng", Icon: ClipboardList },
  { id: "growth", label: "Khuyến mãi & đánh giá", Icon: Sparkles },
  { id: "settings", label: "Thanh toán & giao hàng", Icon: Settings2 },
];

const MOVEMENT_LABELS = {
  initial: "Khởi tạo",
  sale: "Giữ cho đơn",
  restock: "Nhập kho",
  correction: "Điều chỉnh",
  cancellation: "Hoàn do hủy",
};

function MetricCard({ hint, icon: Icon, label, value, warning = false }) {
  return (
    <article className="luxury-panel rounded-[10px] p-5">
      <div className="flex items-start justify-between gap-3">
        <span
          className={`grid h-11 w-11 place-items-center rounded-lg border ${warning ? "border-[#d6b873]/30 bg-[#d6b873]/10 text-[#e2c77f]" : "border-primary/25 bg-primary/[0.07] text-primary-hover"}`}
        >
          <Icon size={20} aria-hidden="true" />
        </span>
        <span className="luxury-eyebrow">LIVE DATA</span>
      </div>
      <p className="mt-5 text-xs font-semibold uppercase tracking-[0.08em] text-text-muted">
        {label}
      </p>
      <p className="mt-2 font-['Sora'] text-2xl font-bold text-text-main">
        {value}
      </p>
      <p className="mt-2 text-[10px] leading-5 text-text-muted">{hint}</p>
    </article>
  );
}

function Overview({ movements, orders, products, setTab }) {
  const activeProducts = products.filter(
    (product) => product.status === "active",
  ).length;
  const lowStock = products.filter(
    (product) =>
      product.stock_quantity !== null && Number(product.stock_quantity) <= 5,
  ).length;
  const openOrders = orders.filter(
    (order) => !["completed", "cancelled"].includes(order.status),
  ).length;
  const completedRevenue = orders
    .filter((order) => order.status === "completed")
    .reduce((sum, order) => sum + Number(order.total || 0), 0);
  const productById = useMemo(
    () => new Map(products.map((product) => [product.id, product])),
    [products],
  );

  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={Boxes}
          label="Sản phẩm đang bán"
          value={activeProducts}
          hint={`${products.length} sản phẩm trong toàn bộ danh mục`}
        />
        <MetricCard
          icon={AlertTriangle}
          label="Sắp hết / hết hàng"
          value={lowStock}
          hint="Tồn kho từ 5 sản phẩm trở xuống"
          warning={lowStock > 0}
        />
        <MetricCard
          icon={PackageCheck}
          label="Đơn đang xử lý"
          value={openOrders}
          hint="Không gồm đơn hoàn thành và đã hủy"
        />
        <MetricCard
          icon={WalletCards}
          label="Doanh thu hoàn thành"
          value={formatCommercePrice(completedRevenue)}
          hint="Chỉ tính đơn đã hoàn thành"
        />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <section className="luxury-panel rounded-[10px] p-5 sm:p-6">
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <p className="luxury-eyebrow mb-2">ĐƠN MỚI NHẤT</p>
              <h2 className="luxury-heading text-lg">Cần xử lý</h2>
            </div>
            <button
              type="button"
              onClick={() => setTab("orders")}
              className="text-xs font-semibold text-primary-hover"
            >
              Xem tất cả
            </button>
          </div>
          <div className="space-y-2">
            {orders.slice(0, 7).map((order) => (
              <button
                key={order.id}
                type="button"
                onClick={() => setTab("orders")}
                className="grid w-full grid-cols-[1fr_auto] gap-3 rounded-md border border-border-subtle bg-bg-main/55 p-3 text-left hover:border-primary/30"
              >
                <span>
                  <strong className="font-['JetBrains_Mono'] text-xs text-primary-hover">
                    {order.order_code}
                  </strong>
                  <span className="mt-1 block text-xs text-text-muted">
                    {order.customer_name} · {order.status}
                  </span>
                </span>
                <strong className="text-xs text-text-main">
                  {formatCommercePrice(order.total)}
                </strong>
              </button>
            ))}
            {orders.length === 0 && (
              <p className="py-10 text-center text-sm text-text-muted">
                Chưa có đơn hàng.
              </p>
            )}
          </div>
        </section>

        <section className="luxury-panel rounded-[10px] p-5 sm:p-6">
          <div className="mb-4">
            <p className="luxury-eyebrow mb-2">AUDIT KHO</p>
            <h2 className="luxury-heading text-lg">Biến động gần đây</h2>
          </div>
          <div className="custom-scrollbar max-h-[430px] space-y-2 overflow-y-auto pr-1">
            {movements.slice(0, 15).map((movement) => (
              <div
                key={movement.id}
                className="rounded-md border border-border-subtle bg-bg-main/55 p-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[10px] font-bold uppercase tracking-[0.07em] text-primary">
                    {MOVEMENT_LABELS[movement.movement_type] ||
                      movement.movement_type}
                  </span>
                  <strong
                    className={`font-['JetBrains_Mono'] text-xs ${Number(movement.quantity_delta) < 0 ? "text-[#e7958d]" : "text-[#9ed1ad]"}`}
                  >
                    {movement.quantity_delta > 0 ? "+" : ""}
                    {movement.quantity_delta ?? "—"}
                  </strong>
                </div>
                <p className="mt-1 line-clamp-1 text-xs font-semibold text-text-main">
                  {productById.get(movement.product_id)?.name ||
                    movement.product_id}
                </p>
                <p className="mt-1 text-[9px] text-text-muted">
                  Tồn sau thay đổi: {movement.stock_after ?? "không quản lý"}
                </p>
              </div>
            ))}
            {movements.length === 0 && (
              <p className="py-10 text-center text-sm text-text-muted">
                Chưa có lịch sử kho.
              </p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function AdminWorkspace() {
  const { staffMembership } = useAuth();
  const [tab, setTab] = useState("overview");
  const [workspace, setWorkspace] = useState({
    products: [],
    orders: [],
    categories: [],
    movements: [],
    paymentMethods: [],
    shippingZones: [],
    notifications: [],
    coupons: [],
    reviews: [],
    alerts: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setWorkspace(await loadAdminWorkspace());
    } catch (loadError) {
      console.error("Admin workspace load failed:", loadError);
      setError(
        "Không thể tải dữ liệu quản trị. Hãy kiểm tra migration và quyền của tài khoản.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const onOrderUpdated = (updated) =>
    setWorkspace((current) => ({
      ...current,
      orders: current.orders.map((order) =>
        order.id === updated.id ? { ...order, ...updated } : order,
      ),
    }));

  return (
    <>
      <Helmet>
        <title>Quản trị vận hành | Laptop World</title>
      </Helmet>
      <section className="luxury-page-section mx-auto min-h-[75vh] w-full max-w-[1440px] px-4 py-9 lg:px-6 lg:py-12">
        <header className="mb-7 flex flex-col justify-between gap-5 border-b border-border-subtle pb-7 lg:flex-row lg:items-end">
          <div>
            <p className="luxury-eyebrow mb-3">LAPTOP WORLD OPERATIONS</p>
            <h1 className="luxury-heading text-3xl sm:text-4xl">
              Trung tâm quản trị
            </h1>
            <p className="mt-3 text-sm text-text-muted">
              Xin chào {staffMembership?.display_name || "nhân viên"} · Quyền{" "}
              {staffMembership?.role === "admin"
                ? "quản trị viên"
                : "nhân viên"}
              .
            </p>
          </div>
          <button
            type="button"
            onClick={refresh}
            disabled={loading}
            className="flex min-h-11 items-center justify-center gap-2 rounded-md border border-primary/25 px-4 text-xs font-bold uppercase tracking-[0.07em] text-primary-hover hover:bg-primary/10 disabled:opacity-50"
          >
            <RefreshCw
              size={15}
              className={loading ? "animate-spin" : ""}
              aria-hidden="true"
            />{" "}
            Làm mới dữ liệu
          </button>
        </header>

        <nav
          className="mb-6 flex gap-2 overflow-x-auto border-b border-border-subtle pb-3"
          aria-label="Khu vực quản trị"
        >
          {TABS.map(({ id, label, Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              aria-pressed={tab === id}
              className={`flex min-h-11 shrink-0 items-center gap-2 rounded-md border px-4 text-xs font-bold uppercase tracking-[0.06em] ${tab === id ? "border-primary/45 bg-primary/[0.09] text-primary-hover" : "border-border-subtle bg-bg-card text-text-muted hover:text-text-main"}`}
            >
              <Icon size={15} aria-hidden="true" /> {label}
            </button>
          ))}
        </nav>

        {loading ? (
          <div className="luxury-panel grid min-h-80 place-items-center rounded-[10px] text-primary">
            <LoaderCircle
              size={28}
              className="animate-spin"
              aria-label="Đang tải dữ liệu quản trị"
            />
          </div>
        ) : error ? (
          <div className="luxury-panel rounded-[10px] p-7 text-center">
            <ShieldCheck
              size={34}
              className="mx-auto mb-4 text-primary"
              aria-hidden="true"
            />
            <p className="text-sm text-[#e7958d]">{error}</p>
            <button
              type="button"
              onClick={refresh}
              className="luxury-primary-button mt-5 min-h-11 rounded-md px-5 text-xs font-bold uppercase"
            >
              Thử lại
            </button>
          </div>
        ) : (
          <>
            {tab === "overview" && (
              <Overview
                movements={workspace.movements}
                orders={workspace.orders}
                products={workspace.products}
                setTab={setTab}
              />
            )}
            {tab === "products" && (
              <AdminProductsPanel
                categories={workspace.categories}
                movements={workspace.movements}
                products={workspace.products}
                onProductSaved={refresh}
              />
            )}
            {tab === "orders" && (
              <AdminOrdersPanel
                orders={workspace.orders}
                onOrderUpdated={onOrderUpdated}
              />
            )}
            {tab === "growth" && (
              <AdminGrowthPanel
                alerts={workspace.alerts}
                coupons={workspace.coupons}
                onRefresh={refresh}
                reviews={workspace.reviews}
              />
            )}
            {tab === "settings" && (
              <AdminSettingsPanel
                notifications={workspace.notifications}
                onRefresh={refresh}
                paymentMethods={workspace.paymentMethods}
                shippingZones={workspace.shippingZones}
              />
            )}
          </>
        )}
      </section>
    </>
  );
}

export default function AdminDashboard() {
  return (
    <AdminGuard>
      <AdminWorkspace />
    </AdminGuard>
  );
}
