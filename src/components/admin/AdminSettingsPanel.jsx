import { useState } from "react";
import {
  BellRing,
  CreditCard,
  LoaderCircle,
  Plus,
  Save,
  Truck,
} from "lucide-react";
import { formatCommercePrice } from "../../lib/commerce";
import {
  saveShippingZone,
  updatePaymentMethod,
} from "../../services/adminService";

function PaymentMethodCard({ method, onSaved }) {
  const [form, setForm] = useState(() => ({
    ...method,
    configText: JSON.stringify(method.config || {}, null, 2),
  }));
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const save = async () => {
    setMessage(null);
    let config;
    try {
      config = JSON.parse(form.configText || "{}");
    } catch {
      setMessage({ tone: "error", text: "Cấu hình JSON chưa hợp lệ." });
      return;
    }
    setSaving(true);
    try {
      await updatePaymentMethod({ ...form, config });
      setMessage({ tone: "success", text: "Đã lưu phương thức thanh toán." });
      onSaved();
    } catch (error) {
      console.error("Payment method update failed:", error);
      setMessage({
        tone: "error",
        text: "Chưa thể lưu phương thức thanh toán.",
      });
    } finally {
      setSaving(false);
    }
  };
  return (
    <article className="luxury-panel rounded-[10px] p-5">
      <div className="flex items-start justify-between gap-4">
        <span className="grid h-11 w-11 place-items-center rounded-lg border border-primary/20 bg-primary/[0.07] text-primary">
          <CreditCard size={19} />
        </span>
        <label className="flex items-center gap-2 text-xs text-text-main">
          <input
            type="checkbox"
            checked={form.is_active}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                is_active: event.target.checked,
              }))
            }
            className="accent-[#d6b873]"
          />{" "}
          Đang bật
        </label>
      </div>
      <div className="mt-4 grid gap-3">
        <label>
          <span className="mb-2 block text-[10px] uppercase tracking-[0.07em] text-text-muted">
            Tên hiển thị
          </span>
          <input
            value={form.display_name}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                display_name: event.target.value,
              }))
            }
            className="luxury-search min-h-11 w-full rounded-md px-3 text-sm text-text-main outline-none"
          />
        </label>
        <label>
          <span className="mb-2 block text-[10px] uppercase tracking-[0.07em] text-text-muted">
            Mô tả
          </span>
          <textarea
            value={form.description || ""}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                description: event.target.value,
              }))
            }
            rows="2"
            className="luxury-search w-full rounded-md px-3 py-2 text-xs leading-5 text-text-main outline-none"
          />
        </label>
        <label>
          <span className="mb-2 block text-[10px] uppercase tracking-[0.07em] text-text-muted">
            Cấu hình JSON
          </span>
          <textarea
            value={form.configText}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                configText: event.target.value,
              }))
            }
            rows="7"
            spellCheck="false"
            className="luxury-search custom-scrollbar w-full rounded-md px-3 py-2 font-['JetBrains_Mono'] text-[10px] leading-5 text-text-main outline-none"
          />
        </label>
      </div>
      {message && (
        <p
          className={`mt-3 text-xs ${message.tone === "success" ? "text-[#9ed1ad]" : "text-[#e7958d]"}`}
        >
          {message.text}
        </p>
      )}
      <button
        type="button"
        onClick={save}
        disabled={saving}
        className="luxury-primary-button mt-4 flex min-h-10 items-center gap-2 rounded-md px-4 text-xs font-bold uppercase disabled:opacity-50"
      >
        {saving ? (
          <LoaderCircle size={14} className="animate-spin" />
        ) : (
          <Save size={14} />
        )}{" "}
        Lưu
      </button>
    </article>
  );
}

const EMPTY_ZONE = {
  id: "",
  code: "",
  name: "",
  provincesText: "",
  base_fee: 0,
  free_shipping_threshold: "",
  estimated_days_min: 1,
  estimated_days_max: 3,
  is_active: true,
  sort_order: 0,
};

function ShippingZoneEditor({ onCancel, onSaved, zone }) {
  const [form, setForm] = useState(() =>
    zone
      ? { ...zone, provincesText: (zone.provinces || []).join(", ") }
      : { ...EMPTY_ZONE },
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const update = (event) => {
    const { checked, name, type, value } = event.target;
    setForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  };
  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      await saveShippingZone({
        ...form,
        provinces: form.provincesText
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
        base_fee: Number(form.base_fee),
        free_shipping_threshold:
          form.free_shipping_threshold === ""
            ? null
            : Number(form.free_shipping_threshold),
        estimated_days_min: Number(form.estimated_days_min),
        estimated_days_max: Number(form.estimated_days_max),
        sort_order: Number(form.sort_order),
      });
      onSaved();
    } catch (saveError) {
      console.error("Shipping zone update failed:", saveError);
      setError("Chưa thể lưu vùng giao hàng. Kiểm tra mã vùng và các mức phí.");
    } finally {
      setSaving(false);
    }
  };
  return (
    <form
      onSubmit={submit}
      className="luxury-panel rounded-[10px] border-primary/25 p-5"
    >
      <h3 className="luxury-heading text-lg">
        {zone ? "Chỉnh sửa vùng giao hàng" : "Thêm vùng giao hàng"}
      </h3>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        {[
          ["code", "Mã vùng"],
          ["name", "Tên vùng"],
          ["provincesText", "Tỉnh/thành, cách nhau bởi dấu phẩy"],
          ["base_fee", "Phí cơ bản"],
          ["free_shipping_threshold", "Miễn phí từ"],
          ["estimated_days_min", "Số ngày tối thiểu"],
          ["estimated_days_max", "Số ngày tối đa"],
          ["sort_order", "Thứ tự"],
        ].map(([name, label]) => (
          <label
            key={name}
            className={name === "provincesText" ? "sm:col-span-2" : ""}
          >
            <span className="mb-2 block text-[10px] uppercase tracking-[0.07em] text-text-muted">
              {label}
            </span>
            <input
              name={name}
              value={form[name]}
              onChange={update}
              required={["code", "name", "base_fee"].includes(name)}
              type={
                [
                  "base_fee",
                  "free_shipping_threshold",
                  "estimated_days_min",
                  "estimated_days_max",
                  "sort_order",
                ].includes(name)
                  ? "number"
                  : "text"
              }
              min={
                ["base_fee", "free_shipping_threshold", "sort_order"].includes(
                  name,
                )
                  ? "0"
                  : undefined
              }
              className="luxury-search min-h-11 w-full rounded-md px-3 text-sm text-text-main outline-none"
            />
          </label>
        ))}
        <label className="flex items-center gap-2 text-xs text-text-main sm:col-span-2">
          <input
            type="checkbox"
            name="is_active"
            checked={form.is_active}
            onChange={update}
            className="accent-[#d6b873]"
          />{" "}
          Đang áp dụng
        </label>
      </div>
      {error && <p className="mt-3 text-xs text-[#e7958d]">{error}</p>}
      <div className="mt-5 flex gap-3">
        <button
          type="submit"
          disabled={saving}
          className="luxury-primary-button flex min-h-10 items-center gap-2 rounded-md px-4 text-xs font-bold uppercase"
        >
          {saving ? (
            <LoaderCircle size={14} className="animate-spin" />
          ) : (
            <Save size={14} />
          )}{" "}
          Lưu vùng
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="min-h-10 rounded-md border border-border-subtle px-4 text-xs text-text-muted"
        >
          Hủy
        </button>
      </div>
    </form>
  );
}

export default function AdminSettingsPanel({
  notifications,
  onRefresh,
  paymentMethods,
  shippingZones,
}) {
  const [editingZone, setEditingZone] = useState(undefined);
  return (
    <section>
      <div className="mb-5">
        <p className="luxury-eyebrow mb-2">STORE CONFIGURATION</p>
        <h2 className="luxury-heading text-xl">Thanh toán và vận chuyển</h2>
        <p className="mt-2 text-sm text-text-muted">
          Các thay đổi được áp dụng trực tiếp cho checkout sau khi lưu.
        </p>
      </div>
      <div className="mb-8 grid gap-4 lg:grid-cols-3">
        {paymentMethods.map((method) => (
          <PaymentMethodCard
            key={`${method.code}-${method.updated_at}`}
            method={method}
            onSaved={onRefresh}
          />
        ))}
      </div>

      <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="luxury-eyebrow mb-2">SHIPPING ZONES</p>
          <h2 className="luxury-heading text-lg">Vùng giao hàng</h2>
        </div>
        <button
          type="button"
          onClick={() => setEditingZone(null)}
          className="flex min-h-10 items-center gap-2 rounded-md border border-primary/25 px-4 text-xs font-bold uppercase text-primary-hover"
        >
          <Plus size={14} /> Thêm vùng
        </button>
      </div>
      {editingZone !== undefined ? (
        <ShippingZoneEditor
          zone={editingZone}
          onCancel={() => setEditingZone(undefined)}
          onSaved={async () => {
            await onRefresh();
            setEditingZone(undefined);
          }}
        />
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {shippingZones.map((zone) => (
            <button
              key={zone.id}
              type="button"
              onClick={() => setEditingZone(zone)}
              className="luxury-panel rounded-[10px] p-5 text-left hover:border-primary/35"
            >
              <div className="flex items-start justify-between gap-4">
                <span className="grid h-10 w-10 place-items-center rounded-lg border border-primary/20 bg-primary/[0.07] text-primary">
                  <Truck size={18} />
                </span>
                <span
                  className={`rounded px-2 py-1 text-[9px] font-bold uppercase ${zone.is_active ? "bg-[#79b88d]/[0.08] text-[#9ed1ad]" : "bg-bg-main text-text-muted"}`}
                >
                  {zone.is_active ? "Đang bật" : "Đã tắt"}
                </span>
              </div>
              <h3 className="mt-4 font-['Be_Vietnam_Pro'] text-sm font-bold text-text-main">
                {zone.name}
              </h3>
              <p className="mt-2 text-xs text-text-muted">
                {zone.provinces?.length
                  ? zone.provinces.join(", ")
                  : "Mặc định toàn quốc"}
              </p>
              <p className="mt-3 font-['JetBrains_Mono'] text-xs text-primary-hover">
                {formatCommercePrice(zone.base_fee)} · {zone.estimated_days_min}
                –{zone.estimated_days_max} ngày
              </p>
            </button>
          ))}
        </div>
      )}

      <section className="luxury-panel mt-8 rounded-[10px] p-5 sm:p-6">
        <div className="flex items-start gap-4">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg border border-primary/20 bg-primary/[0.07] text-primary">
            <BellRing size={19} />
          </span>
          <div>
            <p className="luxury-eyebrow mb-2">NOTIFICATION OUTBOX</p>
            <h2 className="luxury-heading text-lg">Hàng đợi thông báo</h2>
            <p className="mt-2 text-xs leading-5 text-text-muted">
              Database đã tạo sự kiện email/nội bộ khi đơn được tạo hoặc đổi
              trạng thái. Việc gửi thật cần kết nối nhà cung cấp email/SMS ở
              giai đoạn tích hợp khóa dịch vụ.
            </p>
          </div>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {["pending", "processing", "sent", "failed"].map((status) => (
            <div
              key={status}
              className="rounded-md border border-border-subtle bg-bg-main/55 p-3 text-center"
            >
              <strong className="font-['JetBrains_Mono'] text-lg text-primary-hover">
                {notifications.filter((item) => item.status === status).length}
              </strong>
              <span className="mt-1 block text-[9px] uppercase tracking-[0.07em] text-text-muted">
                {status}
              </span>
            </div>
          ))}
        </div>
      </section>
    </section>
  );
}
