import { useState } from "react";
import {
  Check,
  LoaderCircle,
  MapPin,
  Pencil,
  Plus,
  Save,
  Star,
  Trash2,
  X,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import {
  removeCustomerAddress,
  saveCustomerAddress,
  setDefaultCustomerAddress,
} from "../../services/customerService";

const EMPTY_ADDRESS = {
  label: "Địa chỉ nhận hàng",
  recipient_name: "",
  phone: "",
  address_line: "",
  ward: "",
  district: "",
  province: "",
  is_default: false,
};

function AddressForm({ address, onCancel, onSaved }) {
  const { user } = useAuth();
  const [form, setForm] = useState(() => ({ ...EMPTY_ADDRESS, ...address }));
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
      await saveCustomerAddress(user.id, form);
      onSaved();
    } catch (saveError) {
      console.error("Customer address save failed:", saveError);
      setError("Chưa thể lưu địa chỉ. Hãy kiểm tra lại thông tin.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form
      onSubmit={submit}
      className="luxury-panel rounded-[10px] border-primary/25 p-5 sm:p-6"
    >
      <div className="mb-5 flex items-center justify-between">
        <div>
          <p className="luxury-eyebrow mb-2">ĐỊA CHỈ</p>
          <h3 className="luxury-heading text-lg">
            {address?.id ? "Chỉnh sửa địa chỉ" : "Thêm địa chỉ mới"}
          </h3>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="luxury-icon-button grid h-10 w-10 place-items-center rounded-lg"
          aria-label="Đóng biểu mẫu"
        >
          <X size={17} />
        </button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {[
          ["label", "Tên gợi nhớ", "Nhà riêng, Văn phòng..."],
          ["recipient_name", "Người nhận", "Nguyễn Văn An"],
          ["phone", "Số điện thoại", "0961 560 888"],
          ["province", "Tỉnh / thành phố", "Hà Nội"],
          ["district", "Quận / huyện", "Đống Đa"],
          ["ward", "Phường / xã", "Láng Hạ"],
        ].map(([name, label, placeholder]) => (
          <label key={name}>
            <span className="mb-2 block text-xs font-semibold text-text-muted">
              {label}
            </span>
            <input
              name={name}
              value={form[name]}
              onChange={update}
              required={[
                "label",
                "recipient_name",
                "phone",
                "province",
              ].includes(name)}
              placeholder={placeholder}
              className="luxury-search min-h-11 w-full rounded-md px-3 text-sm text-text-main outline-none"
            />
          </label>
        ))}
        <label className="sm:col-span-2">
          <span className="mb-2 block text-xs font-semibold text-text-muted">
            Địa chỉ chi tiết
          </span>
          <input
            name="address_line"
            value={form.address_line}
            onChange={update}
            required
            minLength="5"
            className="luxury-search min-h-11 w-full rounded-md px-3 text-sm text-text-main outline-none"
            placeholder="Số nhà, tên đường..."
          />
        </label>
        <label className="flex items-center gap-2 text-xs font-semibold text-text-main sm:col-span-2">
          <input
            type="checkbox"
            name="is_default"
            checked={form.is_default}
            onChange={update}
            className="accent-[#d6b873]"
          />{" "}
          Đặt làm địa chỉ mặc định
        </label>
      </div>
      {error && (
        <p className="mt-4 text-xs text-[#e7958d]" role="alert">
          {error}
        </p>
      )}
      <div className="mt-5 flex gap-3">
        <button
          type="submit"
          disabled={saving}
          className="luxury-primary-button flex min-h-11 items-center gap-2 rounded-md px-5 text-xs font-bold uppercase tracking-[0.07em] disabled:opacity-50"
        >
          {saving ? (
            <LoaderCircle size={15} className="animate-spin" />
          ) : (
            <Save size={15} />
          )}{" "}
          Lưu địa chỉ
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="min-h-11 rounded-md border border-border-subtle px-5 text-xs font-semibold text-text-muted"
        >
          Hủy
        </button>
      </div>
    </form>
  );
}

export default function AccountAddresses({ addresses, onChanged }) {
  const { user } = useAuth();
  const [editing, setEditing] = useState(undefined);
  const [busyId, setBusyId] = useState(null);

  const remove = async (address) => {
    if (!window.confirm(`Xóa địa chỉ “${address.label}”?`)) return;
    setBusyId(address.id);
    try {
      await removeCustomerAddress(user.id, address.id);
      await onChanged();
    } finally {
      setBusyId(null);
    }
  };

  const makeDefault = async (address) => {
    setBusyId(address.id);
    try {
      await setDefaultCustomerAddress(user.id, address.id);
      await onChanged();
    } finally {
      setBusyId(null);
    }
  };

  if (editing !== undefined)
    return (
      <AddressForm
        address={editing}
        onCancel={() => setEditing(undefined)}
        onSaved={async () => {
          await onChanged();
          setEditing(undefined);
        }}
      />
    );

  return (
    <section>
      <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="luxury-eyebrow mb-2">GIAO HÀNG</p>
          <h2 className="luxury-heading text-xl">Sổ địa chỉ</h2>
          <p className="mt-2 text-sm text-text-muted">
            Địa chỉ mặc định sẽ tự điền khi thanh toán.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setEditing(null)}
          className="luxury-primary-button flex min-h-11 items-center justify-center gap-2 rounded-md px-5 text-xs font-bold uppercase tracking-[0.07em]"
        >
          <Plus size={15} /> Thêm địa chỉ
        </button>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {addresses.map((address) => (
          <article
            key={address.id}
            className={`luxury-panel rounded-[10px] p-5 ${address.is_default ? "border-primary/35" : ""}`}
          >
            <div className="flex items-start justify-between gap-4">
              <span className="grid h-11 w-11 place-items-center rounded-lg border border-primary/20 bg-primary/[0.07] text-primary">
                <MapPin size={19} />
              </span>
              {address.is_default && (
                <span className="flex items-center gap-1 rounded bg-primary/10 px-2 py-1 text-[9px] font-bold uppercase tracking-[0.06em] text-primary-hover">
                  <Star size={11} fill="currentColor" /> Mặc định
                </span>
              )}
            </div>
            <h3 className="mt-4 font-['Be_Vietnam_Pro'] text-sm font-bold text-text-main">
              {address.label}
            </h3>
            <p className="mt-2 text-sm text-text-main">
              {address.recipient_name} · {address.phone}
            </p>
            <p className="mt-2 text-xs leading-6 text-text-muted">
              {[
                address.address_line,
                address.ward,
                address.district,
                address.province,
              ]
                .filter(Boolean)
                .join(", ")}
            </p>
            <div className="mt-5 flex flex-wrap gap-2 border-t border-border-subtle pt-4">
              <button
                type="button"
                onClick={() => setEditing(address)}
                className="flex min-h-9 items-center gap-2 rounded-md border border-border-subtle px-3 text-xs text-text-main hover:text-primary-hover"
              >
                <Pencil size={13} /> Sửa
              </button>
              {!address.is_default && (
                <button
                  type="button"
                  onClick={() => makeDefault(address)}
                  disabled={busyId === address.id}
                  className="flex min-h-9 items-center gap-2 rounded-md border border-primary/20 px-3 text-xs text-primary-hover disabled:opacity-40"
                >
                  <Check size={13} /> Đặt mặc định
                </button>
              )}
              <button
                type="button"
                onClick={() => remove(address)}
                disabled={busyId === address.id}
                className="flex min-h-9 items-center gap-2 rounded-md border border-[#d56f66]/20 px-3 text-xs text-[#e7958d] disabled:opacity-40"
              >
                <Trash2 size={13} /> Xóa
              </button>
            </div>
          </article>
        ))}
      </div>
      {addresses.length === 0 && (
        <div className="luxury-panel grid min-h-60 place-items-center rounded-[10px] text-center">
          <div>
            <MapPin size={34} className="mx-auto mb-4 text-primary" />
            <p className="text-sm font-semibold text-text-main">
              Bạn chưa lưu địa chỉ nào
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
