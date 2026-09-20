import { useMemo, useState } from "react";
import {
  BadgePercent,
  CheckCircle2,
  Copy,
  Edit2,
  LoaderCircle,
  Plus,
  Save,
  Tag,
  Trash2,
  XCircle,
} from "lucide-react";
import { formatCommercePrice } from "../../lib/commerce";
import { saveCoupon, toggleCoupon, deleteCoupon } from "../../services/adminService";

const dateTimeValue = (value) =>
  value ? new Date(value).toISOString().slice(0, 16) : "";

const newCouponDefaults = () => {
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

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-wide text-text-muted">
        {label}
      </span>
      {children}
    </label>
  );
}

const inputCls = "min-h-11 w-full rounded-md border border-border-subtle bg-bg-main px-3 text-sm text-text-main outline-none focus:border-primary/45 transition-colors";

function CouponForm({ coupon, onCancel, onSaved }) {
  const [form, setForm] = useState({
    ...coupon,
    starts_at: dateTimeValue(coupon.starts_at),
    ends_at: dateTimeValue(coupon.ends_at),
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const field = (name, value) => setForm((prev) => ({ ...prev, [name]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await saveCoupon({
        ...form,
        starts_at: new Date(form.starts_at).toISOString(),
        ends_at: new Date(form.ends_at).toISOString(),
      });
      await onSaved();
    } catch (err) {
      console.error("Coupon save failed:", err);
      setError("Luu that bai. Kiem tra ma trung, gia tri va thoi gian.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="luxury-panel w-full max-w-2xl rounded-xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="mb-5 flex items-start justify-between">
          <div>
            <p className="luxury-eyebrow mb-1">COUPON EDITOR</p>
            <h3 className="luxury-heading text-lg">
              {form.id ? `Chinh sua: ${form.code}` : "Tao ma giam gia moi"}
            </h3>
          </div>
          <button type="button" onClick={onCancel} className="text-text-muted hover:text-text-main">
            <XCircle size={22} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
          <Field label="Ma giam gia">
            <input
              required
              value={form.code}
              onChange={(e) => field("code", e.target.value.toUpperCase().replace(/\s/g, ""))}
              className={inputCls + " font-mono font-bold uppercase"}
              placeholder="VD: SUMMER2026"
            />
          </Field>

          <Field label="Ten chuong trinh">
            <input
              required
              value={form.name}
              onChange={(e) => field("name", e.target.value)}
              className={inputCls}
              placeholder="VD: Khuyen mai He 2026"
            />
          </Field>

          <Field label="Loai giam gia">
            <select
              value={form.discount_type}
              onChange={(e) => field("discount_type", e.target.value)}
              className={inputCls}
            >
              <option value="percentage">Phan tram (%)</option>
              <option value="amount">So tien cu the</option>
            </select>
          </Field>

          <Field label={form.discount_type === "percentage" ? "Gia tri (%)" : "So tien giam"}>
            <input
              required
              min="1"
              max={form.discount_type === "percentage" ? 100 : undefined}
              type="number"
              value={form.discount_value}
              onChange={(e) => field("discount_value", e.target.value)}
              className={inputCls}
            />
          </Field>

          <Field label="Don hang toi thieu (VND)">
            <input
              min="0"
              type="number"
              value={form.minimum_order_value}
              onChange={(e) => field("minimum_order_value", e.target.value)}
              className={inputCls}
              placeholder="0 = khong gioi han"
            />
          </Field>

          <Field label="Giam toi da (VND)">
            <input
              min="1"
              type="number"
              value={form.maximum_discount ?? ""}
              onChange={(e) => field("maximum_discount", e.target.value)}
              className={inputCls}
              placeholder="De trong = khong gioi han"
            />
          </Field>

          <Field label="Luot su dung toi da">
            <input
              min="1"
              type="number"
              value={form.usage_limit ?? ""}
              onChange={(e) => field("usage_limit", e.target.value)}
              className={inputCls}
              placeholder="De trong = khong gioi han"
            />
          </Field>

          <Field label="Bat dau">
            <input
              required
              type="datetime-local"
              value={form.starts_at}
              onChange={(e) => field("starts_at", e.target.value)}
              className={inputCls + " text-xs"}
            />
          </Field>

          <Field label="Ket thuc">
            <input
              required
              type="datetime-local"
              value={form.ends_at}
              onChange={(e) => field("ends_at", e.target.value)}
              className={inputCls + " text-xs"}
            />
          </Field>

          <Field label="Mo ta">
            <input
              value={form.description || ""}
              onChange={(e) => field("description", e.target.value)}
              className={inputCls}
              placeholder="Mo ta ngan (hien thi cho khach hang)"
            />
          </Field>

          <div className="sm:col-span-2 flex items-center justify-between pt-2 border-t border-border-subtle">
            <label className="flex items-center gap-2 text-sm text-text-main cursor-pointer">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e) => field("is_active", e.target.checked)}
                className="accent-primary w-4 h-4"
              />
              Kich hoat ngay
            </label>
            {error && <p className="text-xs text-red-400">{error}</p>}
            <button
              type="submit"
              disabled={saving}
              className="luxury-primary-button flex items-center gap-2 min-h-11 rounded-md px-6 text-xs font-bold uppercase disabled:opacity-50"
            >
              {saving ? <LoaderCircle size={15} className="animate-spin" /> : <Save size={15} />}
              Luu ma
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function CouponStatusBadge({ coupon }) {
  const now = new Date();
  const start = new Date(coupon.starts_at);
  const end = new Date(coupon.ends_at);
  const isExpired = end < now;
  const isNotStarted = start > now;
  const isExhausted = coupon.usage_limit && coupon.used_count >= coupon.usage_limit;

  if (!coupon.is_active) return <span className="rounded px-2 py-1 text-[9px] font-bold uppercase bg-bg-card text-text-muted">Da tat</span>;
  if (isExpired) return <span className="rounded px-2 py-1 text-[9px] font-bold uppercase bg-red-500/10 text-red-400">Het han</span>;
  if (isNotStarted) return <span className="rounded px-2 py-1 text-[9px] font-bold uppercase bg-yellow-500/10 text-yellow-400">Chua bat dau</span>;
  if (isExhausted) return <span className="rounded px-2 py-1 text-[9px] font-bold uppercase bg-orange-500/10 text-orange-400">Het luot</span>;
  return <span className="rounded px-2 py-1 text-[9px] font-bold uppercase bg-green-500/10 text-green-400">Dang hoat dong</span>;
}

export default function AdminCouponsPanel({ coupons, onRefresh }) {
  const [editing, setEditing] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [search, setSearch] = useState("");

  const stats = useMemo(() => {
    const now = new Date();
    const active = coupons.filter((c) => c.is_active && new Date(c.ends_at) > now && new Date(c.starts_at) <= now);
    const totalUsed = coupons.reduce((sum, c) => sum + (c.used_count || 0), 0);
    return { total: coupons.length, active: active.length, totalUsed };
  }, [coupons]);

  const filtered = useMemo(() => {
    if (!search.trim()) return coupons;
    const q = search.toLowerCase();
    return coupons.filter(
      (c) => c.code?.toLowerCase().includes(q) || c.name?.toLowerCase().includes(q)
    );
  }, [coupons, search]);

  const handleToggle = async (coupon) => {
    setBusyId(coupon.id);
    try {
      await toggleCoupon(coupon.id, !coupon.is_active);
      await onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (id) => {
    setBusyId(id);
    try {
      await deleteCoupon(id);
      setConfirmDelete(null);
      await onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setBusyId(null);
    }
  };

  const copyCode = (code) => navigator.clipboard?.writeText(code);

  return (
    <div>
      {editing && (
        <CouponForm
          coupon={editing}
          onCancel={() => setEditing(null)}
          onSaved={async () => { setEditing(null); await onRefresh(); }}
        />
      )}

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="luxury-panel rounded-xl p-6 w-full max-w-sm text-center">
            <Trash2 size={32} className="mx-auto mb-3 text-red-400" />
            <h3 className="luxury-heading text-base mb-2">Xoa ma giam gia?</h3>
            <p className="text-sm text-text-muted mb-5">
              Ma <strong className="text-primary-hover font-mono">{confirmDelete.code}</strong> se bi xoa vinh vien va khong the khoi phuc.
            </p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => setConfirmDelete(null)} className="min-h-10 px-5 rounded-md border border-border-subtle text-xs font-bold uppercase text-text-muted hover:text-text-main">
                Huy
              </button>
              <button
                onClick={() => handleDelete(confirmDelete.id)}
                disabled={busyId === confirmDelete.id}
                className="min-h-10 px-5 rounded-md bg-red-500/15 border border-red-500/30 text-xs font-bold uppercase text-red-400 hover:bg-red-500/25 disabled:opacity-50"
              >
                {busyId === confirmDelete.id ? <LoaderCircle size={14} className="animate-spin" /> : "Xoa"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="luxury-eyebrow mb-2">VOUCHER ENGINE</p>
          <h2 className="luxury-heading text-xl">Quan ly ma giam gia</h2>
          <p className="mt-1 text-xs text-text-muted">{stats.active} ma dang hoat dong / {stats.total} tong cong · {stats.totalUsed} luot da dung</p>
        </div>
        <button
          type="button"
          onClick={() => setEditing(newCouponDefaults())}
          className="luxury-primary-button flex min-h-11 items-center gap-2 rounded-md px-4 text-xs font-bold uppercase"
        >
          <Plus size={15} /> Tao ma moi
        </button>
      </div>

      {/* Stats cards */}
      <div className="mb-6 grid grid-cols-3 gap-4">
        {[
          { label: "Tong ma", value: stats.total, Icon: Tag, color: "text-primary-hover" },
          { label: "Dang kich hoat", value: stats.active, Icon: CheckCircle2, color: "text-green-400" },
          { label: "Tong luot dung", value: stats.totalUsed, Icon: BadgePercent, color: "text-yellow-400" },
        ].map(({ label, value, Icon, color }) => (
          <div key={label} className="luxury-panel rounded-[10px] p-4 flex items-center gap-4">
            <Icon size={22} className={color} />
            <div>
              <p className="text-xs text-text-muted">{label}</p>
              <p className="text-xl font-bold text-text-main">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="mb-4">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tim ma giam gia..."
          className="min-h-11 w-full max-w-xs rounded-md border border-border-subtle bg-bg-card px-4 text-sm text-text-main outline-none focus:border-primary/45"
        />
      </div>

      {/* Coupon list */}
      <div className="luxury-panel rounded-[10px] overflow-hidden">
        {filtered.length === 0 ? (
          <div className="py-16 text-center">
            <Tag size={32} className="mx-auto mb-3 text-primary" />
            <p className="text-sm text-text-muted">Chua co ma giam gia nao.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-subtle bg-bg-main/60 text-[10px] font-bold uppercase tracking-wider text-text-muted">
                  <th className="px-4 py-3 text-left">Ma / Ten</th>
                  <th className="px-4 py-3 text-left">Giam gia</th>
                  <th className="px-4 py-3 text-left">Dieu kien</th>
                  <th className="px-4 py-3 text-left">Thoi gian</th>
                  <th className="px-4 py-3 text-left">Luot dung</th>
                  <th className="px-4 py-3 text-left">Trang thai</th>
                  <th className="px-4 py-3 text-right">Hanh dong</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {filtered.map((coupon) => (
                  <tr key={coupon.id} className="hover:bg-bg-card/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => copyCode(coupon.code)}
                          title="Sao chep ma"
                          className="text-text-muted hover:text-primary-hover transition-colors"
                        >
                          <Copy size={13} />
                        </button>
                        <span className="font-mono text-sm font-bold text-primary-hover">{coupon.code}</span>
                      </div>
                      <p className="text-xs text-text-muted mt-0.5 truncate max-w-[160px]">{coupon.name}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-text-main">
                      {coupon.discount_type === "percentage"
                        ? `${coupon.discount_value}%`
                        : formatCommercePrice(coupon.discount_value)}
                      {coupon.maximum_discount && (
                        <p className="text-text-muted">Toi da: {formatCommercePrice(coupon.maximum_discount)}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-text-muted">
                      {Number(coupon.minimum_order_value) > 0
                        ? `Don tu ${formatCommercePrice(coupon.minimum_order_value)}`
                        : "Khong gioi han"}
                    </td>
                    <td className="px-4 py-3 text-xs text-text-muted">
                      <p>{new Date(coupon.starts_at).toLocaleDateString("vi-VN")}</p>
                      <p>den {new Date(coupon.ends_at).toLocaleDateString("vi-VN")}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-text-main">
                      {coupon.used_count ?? 0} / {coupon.usage_limit ?? "∞"}
                    </td>
                    <td className="px-4 py-3">
                      <CouponStatusBadge coupon={coupon} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 justify-end">
                        <button
                          type="button"
                          onClick={() => handleToggle(coupon)}
                          disabled={busyId === coupon.id}
                          title={coupon.is_active ? "Tat ma" : "Bat ma"}
                          className={`grid h-8 w-8 place-items-center rounded-md border transition-colors disabled:opacity-40 ${coupon.is_active ? "border-green-500/30 bg-green-500/10 text-green-400 hover:bg-green-500/20" : "border-border-subtle bg-bg-main text-text-muted hover:text-text-main"}`}
                        >
                          {busyId === coupon.id ? <LoaderCircle size={13} className="animate-spin" /> : coupon.is_active ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditing(coupon)}
                          title="Chinh sua"
                          className="grid h-8 w-8 place-items-center rounded-md border border-border-subtle bg-bg-main text-text-muted hover:text-primary-hover hover:border-primary/30 transition-colors"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDelete(coupon)}
                          title="Xoa"
                          className="grid h-8 w-8 place-items-center rounded-md border border-border-subtle bg-bg-main text-text-muted hover:text-red-400 hover:border-red-500/30 transition-colors"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
