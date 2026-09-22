import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { ImageOff, LoaderCircle, Save, X, Sparkles, Upload } from "lucide-react";
import { PRODUCT_STATUSES, saveProduct, uploadProductImage } from "../../services/adminService";
import { extractSpecsWithGemini } from "../../services/aiService";

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
  spec_display: "",
  spec_ports: "",
  spec_network: "",
  spec_material: "",
  spec_gallery: [],
  sort_order: 0,
  is_hot: false,
  is_flash_sale: false,
  is_best_seller: false,
  is_new: true,
  description: "",
  specifications: "{}",
};

const createFormState = (product) => {
  if (!product) return { ...EMPTY_PRODUCT };
  const specs = product.specifications || {};
  return {
    ...EMPTY_PRODUCT,
    ...product,
    spec_display: specs.display || "",
    spec_ports: specs.ports || "",
    spec_network: specs.network || "",
    spec_material: specs.material || "",
    spec_gallery: Array.isArray(specs.gallery) ? specs.gallery : [],
    price: product.price ?? "",
    original_price: product.original_price ?? product.price ?? "",
    stock_quantity: product.stock_quantity ?? "",
    specifications: JSON.stringify(product.specifications ?? {}, null, 2),
  };
};

function Field({ label, className = "", value, ...props }) {
  return (
    <label className={className}>
      <span className="mb-2 block text-[11px] font-semibold text-text-muted">
        {label}
      </span>
      <input
        value={value ?? ""}
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
  const [extracting, setExtracting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [error, setError] = useState("");
  const title = product ? "Chỉnh sửa sản phẩm" : "Thêm sản phẩm";
  
  const images = useMemo(() => {
    const urls = [form.image_url, ...(form.spec_gallery || [])].filter(Boolean);
    return urls.map(u => String(u).trim()).filter(Boolean);
  }, [form.image_url, form.spec_gallery]);

  useEffect(() => {
    setImageError(false);
  }, [images]);

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
    setForm((current) => {
      const nextValue = type === "checkbox" ? checked : value;
      const nextForm = { ...current, [name]: nextValue };
      
      // Tự động tính Giá bán (price) nếu Giá gốc (original_price) hoặc Giảm giá (discount) thay đổi
      if (name === "original_price" || name === "discount") {
        const originalPrice = Number(nextForm.original_price) || 0;
        const discountPercent = Number(nextForm.discount) || 0;
        
        if (originalPrice > 0 && discountPercent >= 0 && discountPercent <= 100) {
          // Tính giá sau giảm và làm tròn (vd: 3.790.000)
          nextForm.price = Math.round(originalPrice * (1 - discountPercent / 100)).toString();
        }
      }
      
      return nextForm;
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    let specifications;
    try {
      specifications = JSON.parse(form.specifications || "{}");
      if (form.spec_display) specifications.display = form.spec_display;
      if (form.spec_ports) specifications.ports = form.spec_ports;
      if (form.spec_network) specifications.network = form.spec_network;
      if (form.spec_material) specifications.material = form.spec_material;
      if (form.spec_gallery?.length > 0) specifications.gallery = form.spec_gallery;
      else delete specifications.gallery;

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
      // Note: description is intentionally ignored for saving as requested
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

  const handleExtractAI = async () => {
    let apiKey = localStorage.getItem("GEMINI_API_KEY");
    if (!apiKey) {
      apiKey = window.prompt("Tính năng AI cần Gemini API Key. Vui lòng nhập Key của bạn (Key sẽ được lưu cục bộ trên trình duyệt này):");
      if (!apiKey) return;
      localStorage.setItem("GEMINI_API_KEY", apiKey);
    }

    if (!form.name || !form.description) {
      setError("Vui lòng nhập Tên sản phẩm và Mô tả trước khi dùng AI.");
      return;
    }

    const categoryName = categories.find((c) => c.id === form.category_id)?.name || form.category_id;
    if (!categoryName) {
      setError("Vui lòng chọn Danh mục sản phẩm.");
      return;
    }

    setExtracting(true);
    setError("");
    try {
      const specs = await extractSpecsWithGemini(apiKey, categoryName, form.name, form.description);
      
      const extractedBrand = specs.brand || specs.Brand || specs.BRAND;
      const extractedSku = specs.sku || specs.Sku || specs.SKU;
      
      // Remove them from JSON so they don't pollute the specifications block
      delete specs.brand;
      delete specs.Brand;
      delete specs.BRAND;
      delete specs.sku;
      delete specs.Sku;
      delete specs.SKU;
      
      const specCpu = specs.spec_cpu || specs.cpu || specs.CPU;
      const specRam = specs.spec_ram || specs.ram || specs.RAM;
      const specStorage = specs.spec_storage || specs.storage || specs.Storage;
      const specGpu = specs.spec_gpu || specs.gpu || specs.GPU || specs.VGA;
      const specDisplay = specs.display || specs.Display || specs.screen || specs.Screen || specs.spec_display;
      const specPorts = specs.ports || specs.Ports || specs.port || specs.Port || specs.spec_ports;
      const specNetwork = specs.network || specs.Network || specs.wifi || specs.bluetooth || specs.spec_network;
      const specMaterial = specs.material || specs.Material || specs.design || specs.spec_material;

      delete specs.spec_cpu;
      delete specs.cpu;
      delete specs.CPU;
      delete specs.spec_ram;
      delete specs.ram;
      delete specs.RAM;
      delete specs.spec_storage;
      delete specs.storage;
      delete specs.Storage;
      delete specs.spec_gpu;
      delete specs.gpu;
      delete specs.GPU;
      delete specs.VGA;
      delete specs.display;
      delete specs.Display;
      delete specs.screen;
      delete specs.Screen;
      delete specs.spec_display;
      delete specs.ports;
      delete specs.Ports;
      delete specs.spec_ports;
      delete specs.network;
      delete specs.Network;
      delete specs.spec_network;
      delete specs.material;
      delete specs.Material;
      delete specs.spec_material;

      // Merge with existing specs if any, or overwrite
      let currentSpecs = {};
      try { currentSpecs = JSON.parse(form.specifications || "{}"); } catch (e) {}

      const newSpecs = { ...currentSpecs, ...specs };
      // Clean up null values
      Object.keys(newSpecs).forEach(key => newSpecs[key] === null && delete newSpecs[key]);
      
      setForm(prev => ({
        ...prev,
        brand: extractedBrand || prev.brand,
        sku: extractedSku || prev.sku,
        spec_cpu: specCpu || prev.spec_cpu,
        spec_ram: specRam || prev.spec_ram,
        spec_storage: specStorage || prev.spec_storage,
        spec_gpu: specGpu || prev.spec_gpu,
        spec_display: specDisplay || prev.spec_display,
        spec_ports: specPorts || prev.spec_ports,
        spec_network: specNetwork || prev.spec_network,
        spec_material: specMaterial || prev.spec_material,
        specifications: JSON.stringify(newSpecs, null, 2)
      }));
    } catch (err) {
      console.error("AI extraction error:", err);
      if (err.message.includes("API Key")) localStorage.removeItem("GEMINI_API_KEY");
      setError("Lỗi khi trích xuất AI: " + err.message);
    } finally {
      setExtracting(false);
    }
  };

  const handleImageUpload = async (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    setUploadingImage(true);
    setError("");
    try {
      const uploadPromises = files.map(file => uploadProductImage(file));
      const urls = await Promise.all(uploadPromises);
      
      setForm((prev) => {
        const currentImages = [prev.image_url, ...(prev.spec_gallery || [])].filter(Boolean);
        const newImages = [...currentImages, ...urls].slice(0, 5); // Max 5 images
        return {
          ...prev,
          image_url: newImages[0] || "",
          spec_gallery: newImages.slice(1)
        };
      });
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleRemoveImage = (indexToRemove) => {
    setForm((prev) => {
      const currentImages = [prev.image_url, ...(prev.spec_gallery || [])].filter(Boolean);
      const newImages = currentImages.filter((_, idx) => idx !== indexToRemove);
      return {
        ...prev,
        image_url: newImages[0] || "",
        spec_gallery: newImages.slice(1)
      };
    });
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
              <div className="flex flex-col gap-2">
                <div className="group relative grid aspect-square place-items-center overflow-hidden rounded-lg border border-border-subtle bg-[#f3f0e8] p-3">
                  {images[0] && !imageError ? (
                    <>
                      <img
                        src={images[0]}
                        alt="Xem trước sản phẩm"
                        className="max-h-full max-w-full object-contain"
                        onError={() => setImageError(true)}
                      />
                      <button type="button" onClick={() => handleRemoveImage(0)} className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full bg-black/50 text-white opacity-0 hover:bg-black/80 group-hover:opacity-100 transition-opacity"><X size={16} /></button>
                    </>
                  ) : (
                    <ImageOff size={32} className="text-[#6f6a5f]" aria-hidden="true" />
                  )}
                </div>
                {images.length > 1 && (
                  <div className="grid grid-cols-4 gap-2">
                    {images.slice(1).map((img, idx) => (
                      <div key={idx} className="group relative grid aspect-square place-items-center overflow-hidden rounded-md border border-border-subtle bg-[#f3f0e8] p-1">
                        <img src={img} alt={`Preview ${idx+1}`} className="max-h-full max-w-full object-contain" />
                        <button type="button" onClick={() => handleRemoveImage(idx + 1)} className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-black/50 text-white opacity-0 hover:bg-black/80 group-hover:opacity-100 transition-opacity"><X size={12} /></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <label className="mt-3 flex cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed border-border-subtle bg-primary/5 py-2.5 text-xs font-semibold text-primary-hover hover:bg-primary/10">
                {uploadingImage ? (
                  <LoaderCircle size={14} className="animate-spin" />
                ) : (
                  <Upload size={14} />
                )}
                {uploadingImage ? "Đang tải ảnh lên..." : `Tải ảnh lên (${images.length}/5)`}
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  disabled={uploadingImage || images.length >= 5}
                  className="hidden"
                />
              </label>
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
                value={form.sku || ""}
                onChange={update}
              />
              <Field
                label="Thương hiệu"
                name="brand"
                value={form.brand || ""}
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
                min="0"
                step="1000"
              />
              <Field
                label="Giá gốc"
                name="original_price"
                value={form.original_price}
                onChange={update}
                type="number"
                min="0"
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
                value={form.spec_cpu || ""}
                onChange={update}
              />
              <Field
                label="RAM"
                name="spec_ram"
                value={form.spec_ram || ""}
                onChange={update}
              />
              <Field
                label="Lưu trữ"
                name="spec_storage"
                value={form.spec_storage || ""}
                onChange={update}
              />
              <Field
                label="GPU"
                name="spec_gpu"
                value={form.spec_gpu || ""}
                onChange={update}
              />
              <Field
                label="Màn hình"
                name="spec_display"
                value={form.spec_display || ""}
                onChange={update}
              />
              <Field
                label="Cổng kết nối"
                name="spec_ports"
                value={form.spec_ports || ""}
                onChange={update}
              />
              <Field
                label="Lan / Wifi / Bluetooth"
                name="spec_network"
                value={form.spec_network || ""}
                onChange={update}
              />
              <Field
                label="Chất liệu"
                name="spec_material"
                value={form.spec_material || ""}
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
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-text-muted">
                    Mô tả (Dùng cho AI phân tích)
                  </span>
                </div>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={update}
                  rows="4"
                  placeholder="Copy nội dung giới thiệu của hãng paste vào đây để AI đọc..."
                  className="luxury-search custom-scrollbar w-full rounded-md px-4 py-3 text-sm text-text-main outline-none"
                />
              </label>

              <label className="sm:col-span-2">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-text-muted">
                    Thông số mở rộng (JSON)
                  </span>
                  <button
                    type="button"
                    onClick={handleExtractAI}
                    disabled={extracting}
                    className="flex items-center gap-1.5 rounded bg-primary/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.06em] text-primary-hover hover:bg-primary/20 disabled:opacity-50"
                  >
                    {extracting ? (
                      <LoaderCircle size={13} className="animate-spin" />
                    ) : (
                      <Sparkles size={13} />
                    )}
                    {extracting ? "Đang quét..." : "AI Điền Thông Số"}
                  </button>
                </div>
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
