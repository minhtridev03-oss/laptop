import { useState, useMemo } from "react";
import { Plus, Save, Trash2, Edit2, LoaderCircle, XCircle } from "lucide-react";
import { saveCategory, deleteCategory } from "../../services/adminService";

const emptyCategory = () => ({
  name: "",
  slug: "",
  icon: "Monitor",
  sort_order: 0,
});

function CategoryForm({ category, onCancel, onSaved }) {
  const [form, setForm] = useState(category);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const field = (name, value) => setForm((prev) => ({ ...prev, [name]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.slug) {
      setError("Vui lòng nhập tên và đường dẫn (slug)");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await saveCategory(form);
      await onSaved();
    } catch (err) {
      setError(err.message || "Lỗi khi lưu danh mục");
    } finally {
      setSaving(false);
    }
  };

  const inputCls = "min-h-11 w-full rounded-md border border-border-subtle bg-bg-main px-3 text-sm text-text-main outline-none focus:border-primary/45 transition-colors";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="luxury-panel max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl p-6">
        <div className="mb-5 flex items-start justify-between">
          <div>
            <p className="luxury-eyebrow mb-1">CATEGORY EDITOR</p>
            <h3 className="luxury-heading text-lg">{form.id ? "Chỉnh sửa danh mục" : "Thêm danh mục"}</h3>
          </div>
          <button type="button" onClick={onCancel} className="text-text-muted hover:text-text-main">
            <XCircle size={22} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-4">
          <label className="block">
            <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-wide text-text-muted">Tên danh mục</span>
            <input value={form.name || ""} onChange={(e) => field("name", e.target.value)} className={inputCls} placeholder="VD: Laptop văn phòng" />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-wide text-text-muted">Đường dẫn (Slug)</span>
            <input value={form.slug || ""} onChange={(e) => field("slug", e.target.value)} className={inputCls} placeholder="VD: laptop-van-phong" />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-wide text-text-muted">Tên Icon (Lucide)</span>
            <input value={form.icon || ""} onChange={(e) => field("icon", e.target.value)} className={inputCls} placeholder="VD: Monitor, Laptop, Cpu..." />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-wide text-text-muted">Thứ tự hiển thị</span>
            <input type="number" value={form.sort_order} onChange={(e) => field("sort_order", Number(e.target.value))} className={inputCls} />
          </label>

          <div className="flex items-center justify-between border-t border-border-subtle pt-4">
            <div className="text-xs text-red-400">{error}</div>
            <button type="submit" disabled={saving} className="luxury-primary-button flex min-h-11 items-center gap-2 rounded-md px-6 text-xs font-bold uppercase disabled:opacity-50">
              {saving ? <LoaderCircle size={15} className="animate-spin" /> : <Save size={15} />}
              Lưu Danh Mục
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminCategoriesPanel({ categories, onRefresh }) {
  const [editing, setEditing] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const handleDelete = async (id) => {
    setBusyId(id);
    try {
      await deleteCategory(id);
      setDeletingId(null);
      await onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      {editing && (
        <CategoryForm category={editing} onCancel={() => setEditing(null)} onSaved={async () => { setEditing(null); await onRefresh(); }} />
      )}

      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="luxury-panel w-full max-w-sm rounded-xl p-6 text-center">
            <Trash2 size={32} className="mx-auto mb-3 text-red-400" />
            <h3 className="luxury-heading mb-2 text-base">Xóa Danh Mục?</h3>
            <p className="mb-5 text-sm text-text-muted">
              Xóa danh mục chính có thể ảnh hưởng đến giao diện nếu có menu con.
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
          <h2 className="luxury-heading text-xl">Quản lý Danh Mục</h2>
          <p className="mt-1 text-xs text-text-muted">Chỉnh sửa danh mục chính trên mega-menu.</p>
        </div>
        <button
          onClick={() => setEditing(emptyCategory())}
          className="luxury-primary-button flex min-h-11 items-center gap-2 rounded-md px-4 text-xs font-bold uppercase"
        >
          <Plus size={15} /> Thêm Danh mục
        </button>
      </div>

      <div className="luxury-panel overflow-hidden rounded-[10px]">
        {categories.length === 0 ? (
          <p className="p-6 text-center text-sm text-text-muted">Chưa có danh mục nào.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border-subtle bg-bg-main/40 text-[10px] font-bold uppercase tracking-wider text-text-muted">
                  <th className="px-4 py-3 text-left">Tên danh mục</th>
                  <th className="px-4 py-3 text-left">Slug</th>
                  <th className="px-4 py-3 text-left">Icon</th>
                  <th className="px-4 py-3 text-left">Thứ tự</th>
                  <th className="px-4 py-3 text-right">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {categories.map((c) => (
                  <tr key={c.id} className="transition-colors hover:bg-bg-card/50">
                    <td className="px-4 py-3 font-bold text-text-main">{c.name}</td>
                    <td className="px-4 py-3 text-xs text-text-muted">{c.slug}</td>
                    <td className="px-4 py-3 text-xs text-text-muted">{c.icon}</td>
                    <td className="px-4 py-3 text-xs font-bold text-text-main">{c.sort_order}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setEditing(c)}
                          className="grid h-8 w-8 place-items-center rounded-md border border-border-subtle text-text-muted transition-colors hover:border-primary/30 hover:text-primary-hover"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          onClick={() => setDeletingId(c)}
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
    </div>
  );
}
