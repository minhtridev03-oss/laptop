import { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { ChevronRight, Filter, PackageSearch, SlidersHorizontal } from 'lucide-react';
import ProductCard from '../components/ui/ProductCard';
import { supabase } from '../lib/supabase';

const priceRanges = [
  { id: 'all', label: 'Tất cả mức giá', test: () => true },
  { id: 'under-10', label: 'Dưới 10 triệu', test: (price) => price < 10_000_000 },
  { id: '10-15', label: '10 – 15 triệu', test: (price) => price >= 10_000_000 && price < 15_000_000 },
  { id: '15-20', label: '15 – 20 triệu', test: (price) => price >= 15_000_000 && price < 20_000_000 },
  { id: 'over-20', label: 'Trên 20 triệu', test: (price) => price >= 20_000_000 },
];

const sortOptions = [
  { id: 'featured', label: 'Nổi bật' },
  { id: 'newest', label: 'Mới nhất' },
  { id: 'best-seller', label: 'Bán chạy' },
  { id: 'flash-sale', label: 'Đang ưu đãi' },
  { id: 'price-asc', label: 'Giá thấp đến cao' },
  { id: 'price-desc', label: 'Giá cao đến thấp' },
];

const formatProductForCard = (product) => {
  const legacySpecs = {
    cpu: product.spec_cpu,
    ram: product.spec_ram,
    storage: product.spec_storage,
    gpu: product.spec_gpu,
  };
  const highlights = Array.isArray(product.specifications?.card_highlights)
    ? product.specifications.card_highlights.filter(Boolean).slice(0, 3)
    : [];
  const specs = Object.values(legacySpecs).some(Boolean)
    ? legacySpecs
    : Object.fromEntries(highlights.map((value, index) => [`highlight_${index + 1}`, value]));

  return {
    id: product.id,
    name: product.name,
    price: product.price,
    originalPrice: product.original_price,
    discount: product.discount,
    category: product.category_id,
    image: product.image_url,
    specs,
    isHot: product.is_hot,
    stockQuantity: product.stock_quantity,
    status: product.status,
  };
};

export default function ProductList() {
  const { categoryId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [productSeriesLinks, setProductSeriesLinks] = useState([]);
  const [seriesLinksError, setSeriesLinksError] = useState(null);
  const [priceRange, setPriceRange] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const query = (searchParams.get('q') ?? '').trim();
  const requestedSeriesId = searchParams.get('series');
  const requestedSort = searchParams.get('sort') ?? 'featured';
  const sort = sortOptions.some((option) => option.id === requestedSort) ? requestedSort : 'featured';

  useEffect(() => {
    let ignore = false;

    async function fetchCatalog() {
      setLoading(true);
      setError(null);
      try {
        const [productsResponse, categoriesResponse, productSeriesResponse] = await Promise.all([
          supabase.from('products').select('*').order('sort_order', { ascending: true }),
          supabase
            .from('categories')
            .select('id, name, sort_order, category_groups(id, name, sort_order, category_items(id, name, sort_order, link_url))')
            .order('sort_order', { ascending: true }),
          supabase.from('product_category_items').select('product_id, category_item_id'),
        ]);

        if (productsResponse.error) throw productsResponse.error;
        if (categoriesResponse.error) throw categoriesResponse.error;
        if (!ignore) {
          setProducts(productsResponse.data ?? []);
          setCategories(categoriesResponse.data ?? []);
          setProductSeriesLinks(productSeriesResponse.data ?? []);
          setSeriesLinksError(productSeriesResponse.error ?? null);
        }
      } catch (fetchError) {
        if (!ignore) setError(fetchError);
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    fetchCatalog();
    return () => { ignore = true; };
  }, []);

  const seriesEntries = useMemo(() => categories.flatMap((categoryItem) => (
    (categoryItem.category_groups ?? []).flatMap((group) => (
      (group.category_items ?? []).map((item) => ({
        ...item,
        categoryId: categoryItem.id,
        categoryName: categoryItem.name,
        groupName: group.name,
      }))
    ))
  )), [categories]);

  const legacySeries = useMemo(() => {
    if (requestedSeriesId || !categoryId) return null;
    return seriesEntries.find((item) => {
      const itemLink = item.link_url?.trim();
      if (!itemLink || itemLink.includes('series=')) return false;
      const legacyPath = itemLink.split('?')[0].replace(/\/$/, '');
      return legacyPath === `/category/${categoryId}`;
    }) ?? null;
  }, [categoryId, requestedSeriesId, seriesEntries]);

  const activeSeriesId = requestedSeriesId ?? legacySeries?.id ?? null;
  const selectedSeries = seriesEntries.find((item) => String(item.id) === String(activeSeriesId));
  const resolvedCategoryId = selectedSeries?.categoryId ?? legacySeries?.categoryId ?? categoryId;
  const category = categories.find((item) => String(item.id) === String(resolvedCategoryId));
  const pageTitle = selectedSeries?.name ?? legacySeries?.name ?? category?.name ?? (query ? `Kết quả cho “${query}”` : 'Tất cả sản phẩm');
  const relatedProductIds = useMemo(() => new Set(
    productSeriesLinks
      .filter((link) => String(link.category_item_id) === String(activeSeriesId))
      .map((link) => String(link.product_id)),
  ), [activeSeriesId, productSeriesLinks]);

  const filteredProducts = useMemo(() => {
    const activeRange = priceRanges.find((range) => range.id === priceRange) ?? priceRanges[0];
    const normalizedQuery = query.toLocaleLowerCase('vi');
    let result = products.filter((product) => {
      const matchesCategory = !resolvedCategoryId || String(product.category_id) === String(resolvedCategoryId);
      const matchesSeries = !activeSeriesId || relatedProductIds.has(String(product.id));
      const matchesQuery = !normalizedQuery || product.name?.toLocaleLowerCase('vi').includes(normalizedQuery);
      const matchesPrice = activeRange.test(Number(product.price) || 0);
      return matchesCategory && matchesSeries && matchesQuery && matchesPrice;
    });

    if (sort === 'flash-sale') result = result.filter((product) => product.is_flash_sale);
    if (sort === 'best-seller') result = result.filter((product) => product.is_best_seller);
    if (sort === 'newest') result = result.filter((product) => product.is_new);
    if (sort === 'price-asc') result = [...result].sort((a, b) => Number(a.price) - Number(b.price));
    if (sort === 'price-desc') result = [...result].sort((a, b) => Number(b.price) - Number(a.price));

    return result;
  }, [activeSeriesId, priceRange, products, query, relatedProductIds, resolvedCategoryId, sort]);

  const handleSortChange = (event) => {
    const nextParams = new URLSearchParams(searchParams);
    if (event.target.value === 'featured') nextParams.delete('sort');
    else nextParams.set('sort', event.target.value);
    setSearchParams(nextParams);
  };

  return (
    <>
      <Helmet>
        <title>{pageTitle} | Laptop World</title>
        <meta name="description" content={`Khám phá ${pageTitle.toLocaleLowerCase('vi')} chính hãng, cấu hình minh bạch và tư vấn chuyên sâu tại Laptop World.`} />
      </Helmet>

      <section className="luxury-page-section mx-auto min-h-[70vh] w-full max-w-[1440px] px-4 py-9 lg:px-6 lg:py-12">
        <div className="mb-8">
          <p className="luxury-eyebrow mb-3">DANH MỤC SẢN PHẨM</p>
          <div className="flex flex-col justify-between gap-5 border-b border-border-subtle pb-6 sm:flex-row sm:items-end">
            <div>
              <h1 className="luxury-heading text-2xl sm:text-3xl">{pageTitle}</h1>
              {selectedSeries && category && (
                <p className="mt-2 flex flex-wrap items-center gap-2 text-xs text-text-muted">
                  <Link to={`/category/${category.id}`} className="transition-colors hover:text-primary-hover">{category.name}</Link>
                  <ChevronRight size={13} aria-hidden="true" />
                  <span className="text-primary-hover">{selectedSeries.name}</span>
                  <span aria-hidden="true">·</span>
                  <Link to={`/category/${category.id}`} className="underline decoration-primary/40 underline-offset-4 transition-colors hover:text-text-main">
                    Xem tất cả
                  </Link>
                </p>
              )}
              <p className="mt-2 text-sm text-text-muted">
                {loading ? 'Đang cập nhật danh mục...' : `${filteredProducts.length} sản phẩm phù hợp`}
              </p>
            </div>
            <label className="flex min-h-11 items-center gap-3 rounded-md border border-border-subtle bg-bg-card/80 px-3 text-xs text-text-muted">
              <SlidersHorizontal size={16} className="text-primary" aria-hidden="true" />
              <span className="sr-only sm:not-sr-only">Sắp xếp</span>
              <select
                value={sort}
                onChange={handleSortChange}
                className="min-w-[155px] bg-transparent py-2 font-semibold text-text-main outline-none"
                aria-label="Sắp xếp sản phẩm"
              >
                {sortOptions.map((option) => <option key={option.id} value={option.id} className="bg-bg-card">{option.label}</option>)}
              </select>
            </label>
          </div>
        </div>

        <div className="grid items-start gap-6 md:grid-cols-[250px_minmax(0,1fr)] lg:gap-8">
          <details className="group md:block">
            <summary className="luxury-panel flex min-h-12 cursor-pointer list-none items-center justify-between rounded-[10px] px-4 text-sm font-semibold text-text-main md:hidden">
              <span className="flex items-center gap-2"><Filter size={17} className="text-primary" aria-hidden="true" /> Bộ lọc sản phẩm</span>
              <ChevronRight size={16} className="transition-transform group-open:rotate-90" aria-hidden="true" />
            </summary>
            <aside className="luxury-panel mt-3 hidden rounded-[10px] p-5 group-open:block md:mt-0 md:block" aria-label="Bộ lọc sản phẩm">
              <div className="mb-5 border-b border-border-subtle pb-4">
                <p className="luxury-eyebrow mb-1">BỘ LỌC</p>
                <h2 className="font-['Sora'] text-sm font-bold text-text-main">Tinh chỉnh lựa chọn</h2>
              </div>

              <fieldset className="mb-7">
                <legend className="mb-3 text-xs font-bold uppercase tracking-[0.08em] text-text-main">Mức giá</legend>
                <div className="space-y-1">
                  {priceRanges.map((range) => (
                    <button
                      key={range.id}
                      type="button"
                      onClick={() => setPriceRange(range.id)}
                      aria-pressed={priceRange === range.id}
                      className={`flex min-h-10 w-full items-center rounded-md px-3 text-left text-sm transition-colors ${
                        priceRange === range.id ? 'bg-primary/[0.09] text-primary-hover' : 'text-text-muted hover:bg-primary/[0.05] hover:text-text-main'
                      }`}
                    >
                      <span className={`mr-3 h-1.5 w-1.5 rounded-full ${priceRange === range.id ? 'bg-primary-hover' : 'bg-border-subtle'}`} />
                      {range.label}
                    </button>
                  ))}
                </div>
              </fieldset>

              <div>
                <h2 className="mb-3 text-xs font-bold uppercase tracking-[0.08em] text-text-main">Danh mục</h2>
                <nav className="custom-scrollbar max-h-64 space-y-1 overflow-y-auto pr-1" aria-label="Lọc theo danh mục">
                  <Link to="/products" className={`flex min-h-10 items-center rounded-md px-3 text-sm transition-colors ${!resolvedCategoryId ? 'bg-primary/[0.09] text-primary-hover' : 'text-text-muted hover:text-text-main'}`}>
                    Tất cả sản phẩm
                  </Link>
                  {categories.map((item) => (
                    <Link
                      key={item.id}
                      to={`/category/${item.id}`}
                      className={`flex min-h-10 items-center rounded-md px-3 text-sm transition-colors ${
                        String(item.id) === String(resolvedCategoryId) ? 'bg-primary/[0.09] text-primary-hover' : 'text-text-muted hover:text-text-main'
                      }`}
                    >
                      {item.name}
                    </Link>
                  ))}
                </nav>
              </div>
            </aside>
          </details>

          <div className="min-w-0">
            {loading ? (
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 lg:gap-5" role="status" aria-label="Đang tải sản phẩm">
                {[0, 1, 2, 3, 4, 5].map((item) => <div key={item} className="luxury-panel h-[390px] animate-pulse rounded-[10px]" />)}
              </div>
            ) : error ? (
              <div className="luxury-panel rounded-[10px] px-6 py-16 text-center">
                <PackageSearch size={34} className="mx-auto mb-4 text-primary" aria-hidden="true" />
                <h2 className="luxury-heading mb-2 text-lg">Chưa thể tải danh mục</h2>
                <p className="text-sm text-text-muted">Dữ liệu đang gián đoạn. Vui lòng tải lại trang sau ít phút.</p>
              </div>
            ) : activeSeriesId && seriesLinksError ? (
              <div className="luxury-panel rounded-[10px] px-6 py-16 text-center">
                <PackageSearch size={34} className="mx-auto mb-4 text-primary" aria-hidden="true" />
                <h2 className="luxury-heading mb-2 text-lg">Chưa thể lọc theo dòng sản phẩm</h2>
                <p className="mb-6 text-sm text-text-muted">Bảng liên kết dòng sản phẩm chưa được đồng bộ. Hãy chạy migration SQL mới rồi tải lại trang.</p>
                {category && (
                  <Link to={`/category/${category.id}`} className="luxury-primary-button inline-flex min-h-11 items-center rounded-md px-5 text-xs font-bold uppercase tracking-[0.08em]">
                    Xem toàn bộ {category.name}
                  </Link>
                )}
              </div>
            ) : filteredProducts.length > 0 ? (
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 lg:gap-5">
                {filteredProducts.map((product) => <ProductCard key={product.id} product={formatProductForCard(product)} />)}
              </div>
            ) : (
              <div className="luxury-panel rounded-[10px] px-6 py-16 text-center">
                <PackageSearch size={34} className="mx-auto mb-4 text-primary" aria-hidden="true" />
                <h2 className="luxury-heading mb-2 text-lg">Chưa tìm thấy lựa chọn phù hợp</h2>
                <p className="mb-6 text-sm text-text-muted">Thử đổi mức giá, danh mục hoặc từ khóa tìm kiếm.</p>
                <Link to="/products" className="luxury-primary-button inline-flex min-h-11 items-center rounded-md px-5 text-xs font-bold uppercase tracking-[0.08em]">
                  Xem toàn bộ sản phẩm
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
