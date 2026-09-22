import { useCallback, useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useNavigate } from "react-router-dom";
import {
  ClipboardList,
  Cpu,
  Heart,
  LoaderCircle,
  LockKeyhole,
  LogOut,
  MapPin,
  PackageCheck,
  RefreshCw,
  Settings,
  ShoppingBag,
  UserRound,
  ShieldCheck,
} from "lucide-react";
import AccountAddresses from "../components/account/AccountAddresses";
import AccountOrders from "../components/account/AccountOrders";
import AccountProfile from "../components/account/AccountProfile";
import AccountPcBuilds from "../components/account/AccountPcBuilds";
import AccountWarranties from "../components/account/AccountWarranties";
import { useAuth } from "../context/AuthContext";
import { useCommerce } from "../context/CommerceContext";
import { formatCommercePrice } from "../lib/commerce";
import { loadCustomerAccount } from "../services/customerService";
import { useTranslation } from "react-i18next";

const TABS = [
  { id: "overview", label: "Tổng quan", Icon: UserRound },
  { id: "orders", label: "Đơn hàng", Icon: ClipboardList },
  { id: "addresses", label: "Địa chỉ", Icon: MapPin },
  { id: "builds", label: "Cấu hình PC", Icon: Cpu },
  { id: "warranties", label: "Bảo hành", Icon: ShieldCheck },
  { id: "profile", label: "Hồ sơ & bảo mật", Icon: Settings },
];

function AccountOverview({
  addresses,
  cartCount,
  orders,
  profile,
  setTab,
  user,
  wishlistCount,
}) {
  const recentOrder = orders[0];
  const defaultAddress = addresses.find((address) => address.is_default);
  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
      <div className="grid gap-4 sm:grid-cols-2">
        {[
          ["Đơn hàng", orders.length, ClipboardList, "orders"],
          ["Đang trong giỏ", cartCount, ShoppingBag, null],
          ["Sản phẩm yêu thích", wishlistCount, Heart, null],
          ["Địa chỉ đã lưu", addresses.length, MapPin, "addresses"],
        ].map(([label, value, Icon, target]) => (
          <button
            key={label}
            type="button"
            onClick={() => target && setTab(target)}
            className="luxury-panel rounded-[10px] p-5 text-left hover:border-primary/35"
          >
            <span className="grid h-10 w-10 place-items-center rounded-lg border border-primary/20 bg-primary/[0.07] text-primary">
              <Icon size={18} />
            </span>
            <p className="mt-5 text-xs uppercase tracking-[0.08em] text-text-muted">
              {label}
            </p>
            <p className="mt-2 font-['Be_Vietnam_Pro'] text-2xl font-bold text-text-main">
              {value}
            </p>
          </button>
        ))}
      </div>
      <aside className="luxury-panel rounded-[10px] p-5 sm:p-6">
        <p className="luxury-eyebrow mb-2">THÔNG TIN NHANH</p>
        <h2 className="luxury-heading text-lg">
          Xin chào,{" "}
          {profile?.full_name ||
            user.user_metadata?.full_name ||
            user.email?.split("@")[0]}
        </h2>
        <dl className="mt-5 space-y-4 text-sm">
          <div>
            <dt className="text-xs text-text-muted">Email</dt>
            <dd className="mt-1 break-all text-text-main">{user.email}</dd>
          </div>
          <div>
            <dt className="text-xs text-text-muted">Địa chỉ mặc định</dt>
            <dd className="mt-1 text-xs leading-5 text-text-main">
              {defaultAddress
                ? [
                    defaultAddress.address_line,
                    defaultAddress.ward,
                    defaultAddress.district,
                    defaultAddress.province,
                  ]
                    .filter(Boolean)
                    .join(", ")
                : "Chưa thiết lập"}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-text-muted">Đơn gần nhất</dt>
            <dd className="mt-1 text-text-main">
              {recentOrder ? (
                <button
                  type="button"
                  onClick={() => setTab("orders")}
                  className="flex w-full items-center justify-between gap-3 text-left"
                >
                  <span className="font-['JetBrains_Mono'] text-xs text-primary-hover">
                    {recentOrder.order_code}
                  </span>
                  <strong>{formatCommercePrice(recentOrder.total)}</strong>
                </button>
              ) : (
                "Chưa có đơn hàng"
              )}
            </dd>
          </div>
          <div className="mt-4 border-t border-border-subtle pt-4">
            <dt className="text-[10px] font-bold uppercase tracking-[0.08em] text-primary/80">
              Hạng thành viên
            </dt>
            <dd className="mt-2 flex items-end justify-between">
              <span className="font-['Be_Vietnam_Pro'] text-lg font-bold text-primary">
                {profile?.membership_tier || "Thành viên"}
              </span>
              <div className="text-right">
                <span className="block font-['JetBrains_Mono'] text-sm font-bold text-text-main">
                  {profile?.loyalty_points || 0}
                </span>
                <span className="text-[9px] uppercase tracking-wider text-text-muted">
                  Điểm tích lũy
                </span>
              </div>
            </dd>
          </div>
        </dl>
      </aside>
    </div>
  );
}

export default function Account() {
  const navigate = useNavigate();
  const { loading: authLoading, signOut, user } = useAuth();
  const { cartCount, commerceSyncError, commerceSyncing, wishlist } =
    useCommerce();
  const { t } = useTranslation();
  const [tab, setTab] = useState("overview");
  const [workspace, setWorkspace] = useState({
    profile: null,
    addresses: [],
    orders: [],
    savedBuilds: [],
    warranties: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    setError("");
    try {
      setWorkspace(await loadCustomerAccount(user.id));
    } catch (loadError) {
      console.error("Customer account load failed:", loadError);
      setError(
        "Chưa thể tải dữ liệu tài khoản. Hãy kiểm tra migration Supabase mới.",
      );
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (user?.id) refresh();
    else setLoading(false);
  }, [refresh, user?.id]);

  if (authLoading)
    return (
      <div className="luxury-page-section grid min-h-[65vh] place-items-center text-primary">
        <LoaderCircle
          className="animate-spin"
          aria-label="Đang tải tài khoản"
        />
      </div>
    );
  if (!user)
    return (
      <section className="luxury-page-section mx-auto grid min-h-[65vh] max-w-2xl place-items-center px-4">
        <div className="luxury-panel w-full rounded-[10px] p-8 text-center">
          <LockKeyhole size={38} className="mx-auto mb-5 text-primary" />
          <h1 className="luxury-heading text-2xl">Đăng nhập để mở tài khoản</h1>
          <p className="mt-3 text-sm text-text-muted">
            Sử dụng nút Đăng nhập trên thanh đầu trang, sau đó quay lại đây.
          </p>
          <Link
            to="/"
            className="luxury-primary-button mt-6 inline-flex min-h-11 items-center rounded-md px-5 text-xs font-bold uppercase"
          >
            Về trang chủ
          </Link>
        </div>
      </section>
    );

  return (
    <>
      <Helmet>
        <title>{t('account.title')} | Laptop World</title>
      </Helmet>
      <section className="luxury-page-section mx-auto min-h-[75vh] w-full max-w-[1240px] px-4 py-9 lg:px-6 lg:py-12">
        <header className="mb-7 flex flex-col justify-between gap-5 border-b border-border-subtle pb-7 sm:flex-row sm:items-end">
          <div>
            <p className="luxury-eyebrow mb-3">{t('account.eyebrow')}</p>
            <h1 className="luxury-heading text-3xl">{t('account.title')}</h1>
            <p className="mt-3 text-sm text-text-muted">
              {t('account.subtitle')}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={refresh}
              disabled={loading}
              className="flex min-h-11 items-center justify-center gap-2 rounded-md border border-primary/25 px-4 text-xs font-bold uppercase tracking-[0.07em] text-primary-hover disabled:opacity-40"
            >
              <RefreshCw size={15} className={loading ? "animate-spin" : ""} />{" "}
              Làm mới
            </button>
            <button
              type="button"
              onClick={async () => {
                await signOut();
                navigate("/");
              }}
              className="flex min-h-11 items-center justify-center gap-2 rounded-md border border-border-subtle px-4 text-xs font-bold uppercase tracking-[0.07em] text-text-muted hover:text-[#e7958d]"
            >
              <LogOut size={15} /> Đăng xuất
            </button>
          </div>
        </header>

        {(commerceSyncing || commerceSyncError) && (
          <div
            className={`mb-5 rounded-md border px-4 py-3 text-xs ${commerceSyncError ? "border-[#d56f66]/25 bg-[#d56f66]/[0.07] text-[#e7958d]" : "border-primary/20 bg-primary/[0.05] text-text-muted"}`}
          >
            {commerceSyncError
              ? "Giỏ hàng chưa thể đồng bộ; dữ liệu trên thiết bị vẫn được giữ lại."
              : "Đang đồng bộ giỏ hàng và yêu thích..."}
          </div>
        )}

        <nav
          className="mb-6 flex gap-2 overflow-x-auto border-b border-border-subtle pb-3"
          aria-label="Khu vực tài khoản"
        >
          {TABS.map(({ id, label, Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`flex min-h-11 shrink-0 items-center gap-2 rounded-md border px-4 text-xs font-bold uppercase tracking-[0.06em] ${tab === id ? "border-primary/45 bg-primary/[0.08] text-primary-hover" : "border-border-subtle bg-bg-card text-text-muted"}`}
            >
              <Icon size={15} /> {label}
            </button>
          ))}
        </nav>

        {loading ? (
          <div className="luxury-panel grid min-h-72 place-items-center rounded-[10px] text-primary">
            <LoaderCircle size={27} className="animate-spin" />
          </div>
        ) : error ? (
          <div className="luxury-panel rounded-[10px] p-8 text-center">
            <PackageCheck size={34} className="mx-auto mb-4 text-primary" />
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
              <AccountOverview
                addresses={workspace.addresses}
                cartCount={cartCount}
                orders={workspace.orders}
                profile={workspace.profile}
                setTab={setTab}
                user={user}
                wishlistCount={wishlist.length}
              />
            )}
            {tab === "orders" && <AccountOrders orders={workspace.orders} />}
            {tab === "addresses" && (
              <AccountAddresses
                addresses={workspace.addresses}
                onChanged={refresh}
              />
            )}
            {tab === "builds" && (
              <AccountPcBuilds
                builds={workspace.savedBuilds}
                onChanged={refresh}
              />
            )}
            {tab === "warranties" && (
              <AccountWarranties warranties={workspace.warranties} refresh={refresh} />
            )}
            {tab === "profile" && (
              <AccountProfile
                profile={workspace.profile}
                onProfileSaved={(profile) =>
                  setWorkspace((current) => ({ ...current, profile }))
                }
              />
            )}
          </>
        )}
      </section>
    </>
  );
}
