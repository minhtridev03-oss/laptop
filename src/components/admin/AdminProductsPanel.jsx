import { useMemo, useState } from "react";
import {
  AlertTriangle,
  Boxes,
  ChevronLeft,
  ChevronRight,
  PackagePlus,
  Pencil,
  Search,
} from "lucide-react";
import { formatCommercePrice } from "../../lib/commerce";
import { PRODUCT_STATUSES } from "../../services/adminService";
import AdminProductEditor from "./AdminProductEditor";

const PAGE_SIZE = 20;
const statusLabel = new Map(
  PRODUCT_STATUSES.map((item) => [item.value, item.label]),
);

const stockPresentation = (stock) => {
  if (stock === null || stock === undefined)
    return { label: "Không quản lý", tone: "text-text-muted" };
  if (Number(stock) === 0) return { label: "Hết hàng", tone: "text-[#e7958d]" };
  if (Number(stock) <= 5)
    return { label: `Còn ${stock}`, tone: "text-[#d8bd7b]" };
  return { label: `Còn ${stock}`, tone: "text-[#9ed1ad]" };
};

export default function AdminProductsPanel({
  categories,
  movements,
  onProductSaved,
  products,
}) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [editingProduct, setEditingProduct] = useState(undefined);
  const normalizedQuery = query.trim().toLocaleLowerCase("vi");

  const filtered = useMemo(
    () =>
      products.filter((product) => {
        if (status !== "all" && product.status !== status) return false;
        if (!normalizedQuery) return true;
        return [product.name, product.sku, product.brand, product.id]
          .filter(Boolean)
          .some((value) =>
            String(value).toLocaleLowerCase("vi").includes(normalizedQuery),
          );
      }),
    [normalizedQuery, products, status],
  );

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount);
  const visibleProducts = filtered.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  );
  const recentMovementByProduct = useMemo(() => {
    const result = new Map();
    movements.forEach((movement) => {
      if (!result.has(movement.product_id))
        result.set(movement.product_id, movement);
    });
    return result;
  }, [movements]);

  const changeFilter = (setter) => (event) => {
    setter(event.target.value);
    setPage(1);
  };

  return (
    <section aria-labelledby="admin-products-title">
      <div className="mb-5 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <p className="luxury-eyebrow mb-2">CATALOG OPERATIONS</p>
          <h2 id="admin-products-title" className="luxury-heading text-xl">
            Sản phẩm và tồn kho
          </h2>
          <p className="mt-2 text-sm text-text-muted">
            {filtered.length} sản phẩm phù hợp bộ lọc.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setEditingProduct(null)}
          className="luxury-primary-button flex min-h-11 items-center justify-center gap-2 rounded-md px-5 text-xs font-bold uppercase tracking-[0.08em]"
        >
          <PackagePlus size={16} aria-hidden="true" /> Thêm sản phẩm
        </button>
      </div>

      <div className="luxury-panel mb-4 grid gap-3 rounded-[10px] p-4 sm:grid-cols-[minmax(0,1fr)_220px]">
        <label className="luxury-search relative rounded-md">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-primary"
            aria-hidden="true"
          />
          <input
            type="search"
            value={query}
            onChange={changeFilter(setQuery)}
            placeholder="Tìm tên, SKU, hãng hoặc ID..."
            className="min-h-11 w-full bg-transparent pl-10 pr-3 text-sm text-text-main outline-none"
            aria-label="Tìm sản phẩm trong trang quản trị"
          />
        </label>
        <select
          value={status}
          onChange={changeFilter(setStatus)}
          className="luxury-search min-h-11 rounded-md px-3 text-sm text-text-main outline-none"
          aria-label="Lọc trạng thái sản phẩm"
        >
          <option value="all">Tất cả trạng thái</option>
          {PRODUCT_STATUSES.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-hidden rounded-[10px] border border-border-subtle">
        <div className="custom-scrollbar overflow-x-auto">
          <table className="w-full min-w-[900px] border-collapse bg-bg-card/70 text-left text-sm">
            <thead className="bg-bg-main/80 text-[10px] uppercase tracking-[0.08em] text-text-muted">
              <tr>
                <th className="p-4">Sản phẩm</th>
                <th className="p-4">Danh mục</th>
                <th className="p-4">Giá bán</th>
                <th className="p-4">Tồn kho</th>
                <th className="p-4">Trạng thái</th>
                <th className="p-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {visibleProducts.map((product) => {
                const stock = stockPresentation(product.stock_quantity);
                const recentMovement = recentMovementByProduct.get(product.id);
                return (
                  <tr
                    key={product.id}
                    className="border-t border-border-subtle align-middle hover:bg-primary/[0.035]"
                  >
                    <td className="p-4">
                      <div className="flex min-w-[280px] items-center gap-3">
                        <span className="grid h-14 w-16 shrink-0 place-items-center overflow-hidden rounded border border-border-subtle bg-[#f3f0e8] p-1">
                          {product.image_url ? (
                            <img
                              src={product.image_url}
                              alt=""
                              className="max-h-full max-w-full object-contain"
                            />
                          ) : (
                            <Boxes
                              size={20}
                              className="text-[#6f6a5f]"
                              aria-hidden="true"
                            />
                          )}
                        </span>
                        <div className="min-w-0">
                          <p className="line-clamp-2 font-semibold leading-5 text-text-main">
                            {product.name}
                          </p>
                          <p className="mt-1 font-['JetBrains_Mono'] text-[10px] text-text-muted">
                            {product.sku || product.id}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-xs text-text-muted">
                      {categories.find(
                        (category) => category.id === product.category_id,
                      )?.name || product.category_id}
                    </td>
                    <td className="p-4">
                      <strong className="font-['Be_Vietnam_Pro'] text-sm text-primary-hover">
                        {formatCommercePrice(product.price)}
                      </strong>
                      {Number(product.original_price) >
                        Number(product.price) && (
                        <del className="mt-1 block text-[10px] text-text-muted">
                          {formatCommercePrice(product.original_price)}
                        </del>
                      )}
                    </td>
                    <td className="p-4">
                      <p
                        className={`flex items-center gap-1.5 text-xs font-semibold ${stock.tone}`}
                      >
                        {Number(product.stock_quantity) <= 5 &&
                          product.stock_quantity !== null && (
                            <AlertTriangle size={13} aria-hidden="true" />
                          )}
                        {stock.label}
                      </p>
                      {recentMovement && (
                        <p className="mt-1 max-w-40 truncate text-[9px] text-text-muted">
                          Gần nhất:{" "}
                          {recentMovement.quantity_delta > 0 ? "+" : ""}
                          {recentMovement.quantity_delta ?? "—"}
                        </p>
                      )}
                    </td>
                    <td className="p-4">
                      <span
                        className={`rounded border px-2 py-1 text-[10px] font-bold uppercase tracking-[0.06em] ${product.status === "active" ? "border-[#79b88d]/25 bg-[#79b88d]/[0.07] text-[#9ed1ad]" : "border-border-subtle bg-bg-main text-text-muted"}`}
                      >
                        {statusLabel.get(product.status) || product.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button
                        type="button"
                        onClick={() => setEditingProduct(product)}
                        className="inline-flex min-h-10 items-center gap-2 rounded-md border border-primary/25 px-3 text-xs font-semibold text-primary-hover hover:bg-primary/10"
                      >
                        <Pencil size={14} aria-hidden="true" /> Chỉnh sửa
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {visibleProducts.length === 0 && (
          <div className="grid min-h-52 place-items-center bg-bg-card/70 text-sm text-text-muted">
            Không có sản phẩm phù hợp.
          </div>
        )}
        <div className="flex items-center justify-between border-t border-border-subtle bg-bg-main/65 px-4 py-3 text-xs text-text-muted">
          <span>
            Trang {safePage}/{pageCount}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={safePage <= 1}
              className="grid h-9 w-9 place-items-center rounded-md border border-border-subtle hover:text-primary-hover disabled:opacity-35"
              aria-label="Trang trước"
            >
              <ChevronLeft size={15} aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() =>
                setPage((current) => Math.min(pageCount, current + 1))
              }
              disabled={safePage >= pageCount}
              className="grid h-9 w-9 place-items-center rounded-md border border-border-subtle hover:text-primary-hover disabled:opacity-35"
              aria-label="Trang sau"
            >
              <ChevronRight size={15} aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>

      {editingProduct !== undefined && (
        <AdminProductEditor
          categories={categories}
          product={editingProduct}
          onClose={() => setEditingProduct(undefined)}
          onSaved={(saved) => {
            onProductSaved(saved);
            setEditingProduct(undefined);
          }}
        />
      )}
    </section>
  );
}
