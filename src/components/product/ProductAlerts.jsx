import { useState } from "react";
import { BellRing, LoaderCircle } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { subscribeProductAlert } from "../../services/productAlertService";

export default function ProductAlerts({
  currentPrice,
  productId,
  stockAvailable,
}) {
  const { user } = useAuth();
  const [email, setEmail] = useState(user?.email || "");
  const [targetPrice, setTargetPrice] = useState(
    currentPrice ? Math.round((currentPrice * 0.9) / 1000) * 1000 : "",
  );
  const [notifyStock, setNotifyStock] = useState(!stockAvailable);
  const [state, setState] = useState({
    loading: false,
    message: "",
    success: false,
  });
  const submit = async (event) => {
    event.preventDefault();
    setState({ loading: true, message: "", success: false });
    try {
      await subscribeProductAlert({
        email,
        notifyBackInStock: notifyStock,
        productId,
        targetPrice,
      });
      setState({
        loading: false,
        message:
          "Đã đăng ký. Hệ thống sẽ tạo thông báo khi điều kiện được đáp ứng.",
        success: true,
      });
    } catch (error) {
      console.error("Product alert subscription failed:", error);
      setState({
        loading: false,
        message:
          "Chưa thể đăng ký. Kiểm tra email và chọn ít nhất một điều kiện.",
        success: false,
      });
    }
  };
  return (
    <section className="luxury-panel mt-7 rounded-[10px] p-5 sm:p-6">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(420px,0.9fr)] lg:items-center">
        <div>
          <span className="mb-4 grid h-11 w-11 place-items-center rounded-lg border border-primary/25 bg-primary/[0.07] text-primary">
            <BellRing size={20} />
          </span>
          <p className="luxury-eyebrow mb-2">SMART ALERT</p>
          <h2 className="luxury-heading text-lg">Theo dõi giá và tồn kho</h2>
          <p className="mt-2 max-w-xl text-xs leading-6 text-text-muted">
            Đăng ký theo đúng điều kiện bạn quan tâm. Khi giá hoặc tồn kho thay
            đổi trong hệ thống quản trị, yêu cầu gửi email được tự động đưa vào
            hàng đợi thông báo.
          </p>
        </div>
        <form
          onSubmit={submit}
          className="grid gap-3 rounded-lg border border-border-subtle bg-bg-main/55 p-4 sm:grid-cols-2"
        >
          <label className="block sm:col-span-2">
            <span className="mb-2 block text-[10px] font-bold uppercase text-text-muted">
              Email nhận thông báo
            </span>
            <input
              required
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="min-h-11 w-full rounded-md border border-border-subtle bg-bg-card px-3 text-sm text-text-main outline-none focus:border-primary/45"
              placeholder="email@example.com"
            />
          </label>
          <label className="block">
            <span className="mb-2 block text-[10px] font-bold uppercase text-text-muted">
              Báo khi giá còn
            </span>
            <input
              min="1000"
              step="1000"
              type="number"
              value={targetPrice}
              onChange={(event) => setTargetPrice(event.target.value)}
              className="min-h-11 w-full rounded-md border border-border-subtle bg-bg-card px-3 text-sm text-text-main outline-none"
              placeholder="Bỏ trống nếu không theo dõi"
            />
          </label>
          <label className="flex min-h-11 items-center gap-3 self-end rounded-md border border-border-subtle bg-bg-card px-3 text-xs text-text-main">
            <input
              type="checkbox"
              checked={notifyStock}
              onChange={(event) => setNotifyStock(event.target.checked)}
            />{" "}
            Báo khi có hàng
          </label>
          {state.message && (
            <p
              className={`sm:col-span-2 text-xs leading-5 ${state.success ? "text-[#9ed1ad]" : "text-[#e7958d]"}`}
            >
              {state.message}
            </p>
          )}
          <button
            type="submit"
            disabled={state.loading || (!targetPrice && !notifyStock)}
            className="luxury-primary-button flex min-h-11 items-center justify-center gap-2 rounded-md text-xs font-bold uppercase disabled:opacity-40 sm:col-span-2"
          >
            {state.loading ? (
              <LoaderCircle size={15} className="animate-spin" />
            ) : (
              <BellRing size={15} />
            )}{" "}
            Đăng ký thông báo
          </button>
        </form>
      </div>
    </section>
  );
}
