import { useEffect, useState } from "react";
import { KeyRound, LoaderCircle, Save, ShieldCheck } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { saveCustomerProfile } from "../../services/customerService";

export default function AccountProfile({ onProfileSaved, profile }) {
  const { sendPasswordReset, updatePassword, user } = useAuth();
  const [form, setForm] = useState({ full_name: "", phone: "" });
  const [newPassword, setNewPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const isRecovery =
    new URLSearchParams(window.location.search).get("reset") === "1";

  useEffect(() => {
    setForm({
      full_name: profile?.full_name || user?.user_metadata?.full_name || "",
      phone: profile?.phone || "",
    });
  }, [profile, user]);

  const save = async (event) => {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      const saved = await saveCustomerProfile(user.id, form);
      onProfileSaved(saved);
      setMessage({ tone: "success", text: "Đã cập nhật thông tin tài khoản." });
    } catch (error) {
      console.error("Customer profile save failed:", error);
      setMessage({ tone: "error", text: "Chưa thể cập nhật thông tin." });
    } finally {
      setSaving(false);
    }
  };

  const requestReset = async () => {
    setMessage(null);
    const { error } = await sendPasswordReset(user.email);
    setMessage(
      error
        ? { tone: "error", text: "Chưa thể gửi email đổi mật khẩu." }
        : {
            tone: "success",
            text: "Đã gửi liên kết đổi mật khẩu tới email của bạn.",
          },
    );
  };

  const changePassword = async (event) => {
    event.preventDefault();
    setMessage(null);
    if (newPassword.length < 6) {
      setMessage({ tone: "error", text: "Mật khẩu mới cần ít nhất 6 ký tự." });
      return;
    }
    setSaving(true);
    const { error } = await updatePassword(newPassword);
    setSaving(false);
    if (error) setMessage({ tone: "error", text: "Chưa thể đổi mật khẩu." });
    else {
      setNewPassword("");
      setMessage({ tone: "success", text: "Đã đổi mật khẩu thành công." });
      window.history.replaceState({}, "", "/account");
    }
  };

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <form onSubmit={save} className="luxury-panel rounded-[10px] p-5 sm:p-6">
        <p className="luxury-eyebrow mb-2">HỒ SƠ</p>
        <h2 className="luxury-heading text-lg">Thông tin cá nhân</h2>
        <div className="mt-5 grid gap-4">
          <label>
            <span className="mb-2 block text-xs font-semibold text-text-muted">
              Họ và tên
            </span>
            <input
              value={form.full_name}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  full_name: event.target.value,
                }))
              }
              required
              minLength="2"
              className="luxury-search min-h-12 w-full rounded-md px-4 text-sm text-text-main outline-none"
            />
          </label>
          <label>
            <span className="mb-2 block text-xs font-semibold text-text-muted">
              Số điện thoại
            </span>
            <input
              value={form.phone}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  phone: event.target.value,
                }))
              }
              inputMode="tel"
              pattern="[0-9+ .-]{8,15}"
              className="luxury-search min-h-12 w-full rounded-md px-4 text-sm text-text-main outline-none"
            />
          </label>
          <label>
            <span className="mb-2 block text-xs font-semibold text-text-muted">
              Email
            </span>
            <input
              value={user.email || ""}
              disabled
              className="luxury-search min-h-12 w-full rounded-md px-4 text-sm text-text-muted opacity-70"
            />
          </label>
        </div>
        <button
          type="submit"
          disabled={saving}
          className="luxury-primary-button mt-5 flex min-h-11 items-center gap-2 rounded-md px-5 text-xs font-bold uppercase tracking-[0.07em] disabled:opacity-50"
        >
          {saving ? (
            <LoaderCircle size={15} className="animate-spin" />
          ) : (
            <Save size={15} />
          )}{" "}
          Lưu thông tin
        </button>
      </form>

      <section className="luxury-panel rounded-[10px] p-5 sm:p-6">
        <p className="luxury-eyebrow mb-2">BẢO MẬT</p>
        <h2 className="luxury-heading text-lg">Mật khẩu</h2>
        <p className="mt-3 flex items-start gap-2 text-xs leading-5 text-text-muted">
          <ShieldCheck size={15} className="mt-0.5 shrink-0 text-primary" /> Mật
          khẩu được Supabase Auth xử lý và không lưu trong giao diện.
        </p>
        {isRecovery ? (
          <form onSubmit={changePassword} className="mt-5">
            <label>
              <span className="mb-2 block text-xs font-semibold text-text-muted">
                Mật khẩu mới
              </span>
              <input
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                minLength="6"
                required
                autoComplete="new-password"
                className="luxury-search min-h-12 w-full rounded-md px-4 text-sm text-text-main outline-none"
              />
            </label>
            <button
              type="submit"
              disabled={saving}
              className="luxury-primary-button mt-4 flex min-h-11 items-center gap-2 rounded-md px-5 text-xs font-bold uppercase"
            >
              <KeyRound size={15} /> Cập nhật mật khẩu
            </button>
          </form>
        ) : (
          <button
            type="button"
            onClick={requestReset}
            className="mt-5 flex min-h-11 items-center gap-2 rounded-md border border-primary/30 px-5 text-xs font-bold uppercase tracking-[0.07em] text-primary-hover hover:bg-primary/10"
          >
            <KeyRound size={15} /> Gửi email đổi mật khẩu
          </button>
        )}
        {message && (
          <p
            className={`mt-4 rounded-md border px-4 py-3 text-xs ${message.tone === "success" ? "border-[#79b88d]/25 bg-[#79b88d]/[0.07] text-[#9ed1ad]" : "border-[#d56f66]/25 bg-[#d56f66]/[0.08] text-[#e7958d]"}`}
            role="status"
          >
            {message.text}
          </p>
        )}
      </section>
    </div>
  );
}
