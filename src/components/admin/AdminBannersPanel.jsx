import { useState, useMemo } from "react";
import { Plus, Save, Trash2, Edit2, LoaderCircle, Image as ImageIcon, XCircle } from "lucide-react";
import { saveBanner, deleteBanner, uploadProductImage } from "../../services/adminService";

const emptyBanner = () => ({
  type: "main",
  title1: "",
  title2: "",
  description: "",
  link_url: "",
  button_text: "Khám phá ngay",
  image_url: "",
  tag: "",
  hidden_on_mobile: false,
});

function BannerForm({ banner, onCancel, onSaved }) {
  const [form, setForm] = useState(banner);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const field = (name, value) => setForm((prev) => ({ ...prev, [name]: value }));

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const url = await uploadProductImage(file);
      field("image_url", url);
    } catch (err) {
      setError(err.message || "Lỗi tải ảnh lên");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.image_url) {
      setError("Vui lòng tải lên hoặc nhập URL ảnh Banner");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await saveBanner(form);
      await onSaved();
    } catch (err) {
      setError(err.message || "Lỗi khi lưu banner");
    } finally {
      setSaving(false);
    }
  };

  const inputCls = "min-h-11 w-full rounded-md border border-border-subtle bg-bg-main px-3 text-sm text-text-main outline-none focus:border-primary/45 transition-colors";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="luxury-panel max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl p-6">
        <div className="mb-5 flex items-start justify-between">
          <div>
            <p className="luxury-eyebrow mb-1">BANNER EDITOR</p>
            <h3 className="luxury-heading text-lg">{form.id ? "Chỉnh sửa Banner" : "Thêm Banner mới"}</h3>
          </div>
          <button type="button" onClick={onCancel} className="text-text-muted hover:text-text-main">
            <XCircle size={22} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-wide text-text-muted">Loại Banner</span>
            <select value={form.type} onChange={(e) => field("type", e.target.value)} className={inputCls}>
              <option value="main">Banner Chính (Trang Chủ Slider)</option>
              <option value="sub">Banner Phụ (Trang Chủ Nhỏ)</option>
            </select>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-wide text-text-muted">Tiêu đề dòng 1</span>
            <input value={form.title1 || ""} onChange={(e) => field("title1", e.target.value)} className={inputCls} placeholder="VD: Laptop Gaming" />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-wide text-text-muted">Tiêu đề dòng 2 (Màu vàng)</span>
            <input value={form.title2 || ""} onChange={(e) => field("title2", e.target.value)} className={inputCls} placeholder="VD: Sức mạnh vượt trội" />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-wide text-text-muted">Nhãn (Tag)</span>
            <input value={form.tag || ""} onChange={(e) => field("tag", e.target.value)} className={inputCls} placeholder="VD: SIÊU ƯU ĐÃI" />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-wide text-text-muted">Nút bấm (Button Text)</span>
            <input value={form.button_text || ""} onChange={(e) => field("button_text", e.target.value)} className={inputCls} placeholder="VD: Khám phá ngay" />
          </label>

          <label className="block sm:col-span-2">
            <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-wide text-text-muted">Đường dẫn khi click (URL)</span>
            <input value={form.link_url || ""} onChange={(e) => field("link_url", e.target.value)} className={inputCls} placeholder="VD: /category/laptop-gaming" />
          </label>

          <label className="block sm:col-span-2">
            <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-wide text-text-muted">Mô tả</span>
            <textarea value={form.description || ""} onChange={(e) => field("description", e.target.value)} className={inputCls + " min-h-[80px] py-2 resize-none"} placeholder="Mô tả ngắn..." />
          </label>

          <div className="sm:col-span-2">
            <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-wide text-text-muted">Hình ảnh Banner *</span>
            <div className="flex items-center gap-3">
              {form.image_url && (
                <div className="h-16 w-32 shrink-0 overflow-hidden rounded border border-border-subtle">
                  <img src={form.image_url} alt="Preview" className="h-full w-full object-cover" />
                </div>
              )}
              <input type="text" value={form.image_url || ""} onChange={(e) => field("image_url", e.target.value)} className={inputCls} placeholder="URL hình ảnh" />
              <label className="luxury-primary-button flex min-h-11 shrink-0 cursor-pointer items-center gap-2 rounded-md px-4 text-xs font-bold uppercase">
                {uploading ? <LoaderCircle size={15} className="animate-spin" /> : <ImageIcon size={15} />}
                Tải lên
                <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />
              </label>
            </div>
          </div>

          <label className="block sm:col-span-2">
            <label className="flex cursor-pointer items-center gap-2 text-sm text-text-main">
              <input type="checkbox" checked={form.hidden_on_mobile} onChange={(e) => field("hidden_on_mobile", e.target.checked)} className="h-4 w-4 accent-primary" />
              Ẩn trên giao diện Mobile (Được khuyên dùng cho Sub-banner ngang)
            </label>
          </label>

          <div className="flex items-center justify-between border-t border-border-subtle pt-4 sm:col-span-2">
            <div className="text-xs text-red-400">{error}</div>
            <button type="submit" disabled={saving || uploading} className="luxury-primary-button flex min-h-11 items-center gap-2 rounded-md px-6 text-xs font-bold uppercase disabled:opacity-50">
              {saving ? <LoaderCircle size={15} className="animate-spin" /> : <Save size={15} />}
              Lưu Banner
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminBannersPanel({ banners, onRefresh }) {
  const [editing, setEditing] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const mainBanners = useMemo(() => banners.filter(b => b.type === 'main'), [banners]);
  const subBanners = useMemo(() => banners.filter(b => b.type === 'sub'), [banners]);

  const handleDelete = async (id) => {
    setBusyId(id);
    try {
      await deleteBanner(id);
      setDeletingId(null);
      await onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setBusyId(null);
    }
  };

  const renderBannerList = (title, items) => (
    <div className="luxury-panel mb-6 overflow-hidden rounded-[10px]">
      <div className="border-b border-border-subtle bg-bg-main/60 p-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-text-main">{title}</h3>
      </div>
      {items.length === 0 ? (
        <p className="p-6 text-center text-sm text-text-muted">Chưa có banner nào.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-subtle bg-bg-main/40 text-[10px] font-bold uppercase tracking-wider text-text-muted">
                <th className="px-4 py-3 text-left">Hình ảnh</th>
                <th className="px-4 py-3 text-left">Thông tin</th>
                <th className="px-4 py-3 text-left">Liên kết</th>
                <th className="px-4 py-3 text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle">
              {items.map((b) => (
                <tr key={b.id} className="transition-colors hover:bg-bg-card/50">
                  <td className="px-4 py-3">
                    <div className="h-14 w-28 overflow-hidden rounded border border-border-subtle">
                      <img src={b.image_url} alt="" className="h-full w-full object-cover" />
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-bold text-text-main">{b.title1} <span className="text-primary-hover">{b.title2}</span></p>
                    {b.tag && <p className="text-[10px] uppercase text-primary">{b.tag}</p>}
                  </td>
                  <td className="px-4 py-3 text-xs text-text-muted">{b.link_url}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setEditing(b)}
                        className="grid h-8 w-8 place-items-center rounded-md border border-border-subtle text-text-muted transition-colors hover:border-primary/30 hover:text-primary-hover"
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        onClick={() => setDeletingId(b)}
                        className="grid h-8 w-8 place-items-center rounded-md border border-border-subtle text-text-muted transition-colors hover:border-red-500/30 hover:text-red-400"
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
  );

  return (
    <div>
      {editing && (
        <BannerForm banner={editing} onCancel={() => setEditing(null)} onSaved={async () => { setEditing(null); await onRefresh(); }} />
      )}

      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="luxury-panel w-full max-w-sm rounded-xl p-6 text-center">
            <Trash2 size={32} className="mx-auto mb-3 text-red-400" />
            <h3 className="luxury-heading mb-2 text-base">Xóa Banner?</h3>
            <p className="mb-5 text-sm text-text-muted">
              Banner này sẽ bị xóa khỏi trang chủ và không thể khôi phục.
            </p>
            <div className="flex justify-center gap-3">
              <button onClick={() => setDeletingId(null)} className="min-h-10 rounded-md border border-border-subtle px-5 text-xs font-bold uppercase text-text-muted hover:text-text-main">Hủy</button>
              <button
                onClick={() => handleDelete(deletingId.id)}
                disabled={busyId === deletingId.id}
                className="min-h-10 rounded-md border border-red-500/30 bg-red-500/15 px-5 text-xs font-bold uppercase text-red-400 hover:bg-red-500/25 disabled:opacity-50"
              >
                {busyId === deletingId.id ? <LoaderCircle size={14} className="animate-spin" /> : "Xóa"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="luxury-eyebrow mb-2">STOREFRONT</p>
          <h2 className="luxury-heading text-xl">Quản lý Banner</h2>
          <p className="mt-1 text-xs text-text-muted">Cập nhật hình ảnh banner lớn và banner phụ trên trang chủ.</p>
        </div>
        <button
          onClick={() => setEditing(emptyBanner())}
          className="luxury-primary-button flex min-h-11 items-center gap-2 rounded-md px-4 text-xs font-bold uppercase"
        >
          <Plus size={15} /> Thêm Banner
        </button>
      </div>

      {renderBannerList("Banner Chính (Slider Trang Chủ)", mainBanners)}
      {renderBannerList("Banner Phụ (Dưới Slider)", subBanners)}
    </div>
  );
}
