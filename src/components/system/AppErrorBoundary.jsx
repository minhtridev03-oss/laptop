import { Component } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default class AppErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("Uncaught storefront error:", error, info);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <main className="luxury-page-section grid min-h-screen place-items-center px-4">
        <section className="luxury-panel w-full max-w-xl rounded-[10px] p-8 text-center">
          <AlertTriangle size={38} className="mx-auto mb-5 text-primary" />
          <p className="luxury-eyebrow mb-2">RECOVERY MODE</p>
          <h1 className="luxury-heading text-2xl">Trang vừa gặp sự cố</h1>
          <p className="mt-3 text-sm leading-6 text-text-muted">
            Dữ liệu mua sắm trên thiết bị vẫn được giữ. Hãy tải lại trang; nếu
            lỗi lặp lại, gửi thời điểm xảy ra lỗi cho quản trị viên.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="luxury-primary-button mx-auto mt-6 flex min-h-11 items-center gap-2 rounded-md px-5 text-xs font-bold uppercase"
          >
            <RefreshCw size={15} /> Tải lại trang
          </button>
        </section>
      </main>
    );
  }
}
