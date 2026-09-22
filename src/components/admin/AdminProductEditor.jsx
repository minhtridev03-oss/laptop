import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { ImageOff, LoaderCircle, Save, X } from "lucide-react";
import { PRODUCT_STATUSES, saveProduct } from "../../services/adminService";

const EMPTY_PRODUCT = {
  id: "",
  name: "",
  sku: "",
  brand: "",
  category_id: "",
  price: "",
  original_price: "",
  discount: 0,
  stock_quantity: "",
  status: "draft",
  image_url: "",
  spec_cpu: "",
  spec_ram: "",
  spec_storage: "",
  spec_gpu: "",
  sort_order: 0,
  is_hot: false,
  is_flash_sale: false,
  is_best_seller: false,
  is_new: true,
  specifications: "{}",
};

const createFormState = (product) => {
  if (!product) return { ...EMPTY_PRODUCT };
  return {
    ...EMPTY_PRODUCT,
    ...product,
    price: product.price ?? "",
    original_price: product.original_price ?? product.price ?? "",
    stock_quantity: product.stock_quantity ?? "",
    specifications: JSON.stringify(product.specifications ?? {}, null, 2),
  };
};

function Field({ label, className = "", ...props }) {
  return (
    <label className={className}>
      <span className="mb-2 block text-[11px] font-semibold text-text-muted">
        {label}
      </span>
      <input
        {...props}
        className="luxury-search min-h-11 w-full rounded-md px-3 text-sm text-text-main outline-none"
      />
    </label>
  );
}

export default function AdminProductEditor({
  categories,
  onClose,
  onSaved,
  product,
}) {
  const [form, setForm] = useState(() => createFormState(product));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const title = product ? "Chỉnh sửa sản phẩm" : "Thêm sản phẩm";
  const imageUrl = useMemo(
    () => String(form.image_url || "").trim(),
    [form.image_url],
  );

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event) =>
      event.key === "Escape" && !saving && onClose();
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose, saving]);

  const update = (event) => {
    const { checked, name, type, value } = event.target;
    setForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    let specifications;
    try {
      specifications = JSON.parse(form.specifications || "{}");
      if (
        !specifications ||
        Array.isArray(specifications) ||
        typeof specifications !== "object"
      )
        throw new Error("invalid");
    } catch {
      setError("Thông số mở rộng phải là một JSON object hợp lệ.");
      return;
    }

    setSaving(true);
    try {
      const saved = await saveProduct({
        ...form,
        price: Number(form.price),
        original_price: Number(form.original_price || form.price),
        discount: Number(form.discount || 0),
        stock_quantity:
          form.stock_quantity === "" ? null : Number(form.stock_quantity),
        sort_order: Number(form.sort_order || 0),
        specifications,
      });
      onSaved(saved);
    } catch (saveError) {
      console.error("Admin product save failed:", saveError);
      setError(
        "Không thể lưu sản phẩm. Hãy kiểm tra dữ liệu, SKU và quyền nhân viên.",
      );
    } finally {
      setSaving(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[220] grid place-items-center bg-black/80 p-3 backdrop-blur-sm"
      onMouseDown={(event) =>
        event.target === event.currentTarget && !saving && onClose()
      }
    >
      <section
        className="luxury-panel flex max-h-[calc(100dvh-1.5rem)] w-full max-w-5xl flex-col overflow-hidden rounded-[14px]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-product-editor-title"
      >
        <header className="flex items-start justify-between border-b border-border-subtle p-5 sm:px-7">
          <div>
            <p className="luxury-eyebrow mb-2">QUẢN LÝ DANH MỤC</p>
            <h2
              id="admin-product-editor-title"
              className="luxury-heading text-xl"
            >
              {title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="luxury-icon-button grid h-10 w-10 place-items-center rounded-lg disabled:opacity-40"
            aria-label="Đóng trình chỉnh sửa"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </header>

        <form
          onSubmit={handleSubmit}
          className="custom-scrollbar min-h-0 flex-1 overflow-y-auto p-5 sm:p-7"
        >
          <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
            <div>
              <div className="grid aspect-square place-items-center overflow-hidden rounded-lg border border-border-subtle bg-[#f3f0e8] p-3">
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt="Xem trước sản phẩm"
                    className="max-h-full max-w-full object-contain"
                  />
                ) : (
                  <ImageOff
                    size={32}
                    className="text-[#6f6a5f]"
                    aria-hidden="true"
                  />
                )}
              </div>
              <Field
                label="URL hình ảnh"
                name="image_url"
                value={form.image_url}
                onChange={update}
                className="mt-4 block"
                placeholder="https://..."
              />
              {product?.id && (
                <p className="mt-3 break-all font-['JetBrains_Mono'] text-[10px] leading-5 text-text-muted">
                  ID: {product.id}
                </p>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Tên sản phẩm"
                name="name"
                value={form.name}
                onChange={update}
                required
                minLength="2"
                className="sm:col-span-2"
              />
              <Field
                label="SKU"
                name="sku"
                value={form.sku}
                onChange={update}
              />
              <Field
                label="Thương hiệu"
                name="brand"
                value={form.brand}
                onChange={update}
              />
              <label>
                <span className="mb-2 block text-[11px] font-semibold text-text-muted">
                  Danh mục
                </span>
                <select
                  name="category_id"
                  value={form.category_id}
                  onChange={update}
                  required
                  className="luxury-search min-h-11 w-full rounded-md px-3 text-sm text-text-main outline-none"
                >
                  <option value="">Chọn danh mục</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span className="mb-2 block text-[11px] font-semibold text-text-muted">
                  Trạng thái
                </span>
                <select
                  name="status"
                  value={form.status}
                  onChange={update}
                  className="luxury-search min-h-11 w-full rounded-md px-3 text-sm text-text-main outline-none"
                >
                  {PRODUCT_STATUSES.map((status) => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </label>
              <Field
                label="Giá bán"
                name="price"
                value={form.price}
                onChange={update}
                required
                type="number"
                min="1"
                step="1000"
              />
              <Field
                label="Giá gốc"
                name="original_price"
                value={form.original_price}
                onChange={update}
                type="number"
                min="1"
                step="1000"
              />
              <Field
                label="Giảm giá (%)"
                name="discount"
                value={form.discount}
                onChange={update}
                type="number"
                min="0"
                max="100"
                step="0.1"
              />
              <Field
                label="Tồn kho (để trống nếu chưa quản lý)"
                name="stock_quantity"
                value={form.stock_quantity}
                onChange={update}
                type="number"
                min="0"
                step="1"
              />
              <Field
                label="CPU"
                name="spec_cpu"
                value={form.spec_cpu}
                onChange={update}
              />
              <Field
                label="RAM"
                name="spec_ram"
                value={form.spec_ram}
                onChange={update}
              />
              <Field
                label="Lưu trữ"
                name="spec_storage"
                value={form.spec_storage}
                onChange={update}
              />
              <Field
                label="GPU"
                name="spec_gpu"
                value={form.spec_gpu}
                onChange={update}
              />
              <Field
                label="Thứ tự hiển thị"
                name="sort_order"
                value={form.sort_order}
                onChange={update}
                type="number"
                step="1"
              />

              <fieldset className="grid grid-cols-2 gap-3 rounded-lg border border-border-subtle p-4 sm:col-span-2 sm:grid-cols-4">
                <legend className="px-2 text-[10px] font-bold uppercase tracking-[0.08em] text-text-muted">
                  Nhãn bán hàng
                </legend>
                {[
                  ["is_new", "Sản phẩm mới"],
                  ["is_hot", "Nổi bật"],
                  ["is_best_seller", "Bán chạy"],
                  ["is_flash_sale", "Flash sale"],
                ].map(([name, label]) => (
                  <label
                    key={name}
                    className="flex items-center gap-2 text-xs text-text-main"
                  >
                    <input
                      type="checkbox"
                      name={name}
                      checked={Boolean(form[name])}
                      onChange={update}
                      className="accent-[#d6b873]"
                    />{" "}
                    {label}
                  </label>
                ))}
              </fieldset>

              <label className="sm:col-span-2">
                <span className="mb-2 block text-[11px] font-semibold text-text-muted">
                  Thông số mở rộng (JSON)
                </span>
                <textarea
                  name="specifications"
                  value={form.specifications}
                  onChange={update}
                  rows="9"
                  spellCheck="false"
                  className="luxury-search custom-scrollbar w-full rounded-md px-4 py-3 font-['JetBrains_Mono'] text-xs leading-6 text-text-main outline-none"
                />
              </label>
            </div>
          </div>

          {error && (
            <p
              className="mt-5 rounded-md border border-[#d56f66]/30 bg-[#d56f66]/10 px-4 py-3 text-sm text-[#e8a49e]"
              role="alert"
            >
              {error}
            </p>
          )}
          <footer className="mt-6 flex justify-end gap-3 border-t border-border-subtle pt-5">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="min-h-11 rounded-md border border-border-subtle px-5 text-xs font-bold uppercase tracking-[0.06em] text-text-muted hover:text-text-main disabled:opacity-40"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={saving}
              className="luxury-primary-button flex min-h-11 items-center gap-2 rounded-md px-6 text-xs font-bold uppercase tracking-[0.08em] disabled:opacity-50"
            >
              {saving ? (
                <LoaderCircle
                  size={16}
                  className="animate-spin"
                  aria-hidden="true"
                />
              ) : (
                <Save size={16} aria-hidden="true" />
              )}{" "}
              {saving ? "Đang lưu" : "Lưu sản phẩm"}
            </button>
          </footer>
        </form>
      </section>
    </div>,
    document.body,
  );
}
