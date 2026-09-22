import { useCallback, useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { 
  ChevronRight, Filter, PackageSearch, SlidersHorizontal, 
  Laptop, Gamepad2, Tablet, Monitor, Cpu, Server, HardDrive, 
  Mouse, Headphones, Apple, Component, ChevronDown 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import ProductCard from '../components/ui/ProductCard';
import { supabase } from '../lib/supabase';

const getCategoryIcon = (name) => {
  if (!name) return <Component size={18} />;
  const lowerName = name.toLowerCase();
  if (lowerName.includes('laptop') && lowerName.includes('game')) return <Gamepad2 size={18} />;
  if (lowerName.includes('laptop') || lowerName.includes('macbook')) return <Laptop size={18} />;
  if (lowerName.includes('bảng') || lowerName.includes('tablet')) return <Tablet size={18} />;
  if (lowerName.includes('màn hình')) return <Monitor size={18} />;
  if (lowerName.includes('pc') || lowerName.includes('máy tính để bàn')) return <Server size={18} />;
  if (lowerName.includes('linh kiện') || lowerName.includes('cpu') || lowerName.includes('vga') || lowerName.includes('main')) return <Cpu size={18} />;
  if (lowerName.includes('chuột') || lowerName.includes('phím')) return <Mouse size={18} />;
  if (lowerName.includes('tai nghe') || lowerName.includes('loa')) return <Headphones size={18} />;
  if (lowerName.includes('apple')) return <Apple size={18} />;
  return <Component size={18} />;
};

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

// Columns needed for Product Cards - excludes heavy columns like specifications JSON
const PRODUCT_COLUMNS = 'id,name,price,original_price,discount,category_id,image_url,spec_cpu,spec_ram,spec_storage,spec_gpu,is_hot,is_new,is_best_seller,is_flash_sale,stock_quantity,status,sort_order';
const PAGE_SIZE = 24;

export default function ProductList() {
  const { t } = useTranslation();
  const { categoryId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [productSeriesLinks, setProductSeriesLinks] = useState([]);
  const [seriesLinksError, setSeriesLinksError] = useState(null);
  const [priceRange, setPriceRange] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const query = (searchParams.get('q') ?? '').trim();
  const requestedSeriesId = searchParams.get('series');
  const requestedSort = searchParams.get('sort') ?? 'featured';
  const sort = sortOptions.some((option) => option.id === requestedSort) ? requestedSort : 'featured';

  // Fetch catalog metadata (categories + series links) — runs once
  useEffect(() => {
    let ignore = false;
    async function fetchMeta() {
      try {
        const [categoriesRes, seriesRes] = await Promise.all([
          supabase.from('categories')
            .select('id, name, sort_order, category_groups(id, name, sort_order, category_items(id, name, sort_order, link_url))')
            .order('sort_order', { ascending: true }),
          supabase.from('product_category_items').select('product_id, category_item_id'),
        ]);
        if (ignore) return;
        if (!categoriesRes.error) setCategories(categoriesRes.data ?? []);
        setProductSeriesLinks(seriesRes.data ?? []);
        setSeriesLinksError(seriesRes.error ?? null);
      } catch (err) {
        console.error('Meta fetch error:', err);
      }
    }
    fetchMeta();
    return () => { ignore = true; };
  }, []);

  // Fetch all active products (up to 1000) — re-runs only when route changes
  const fetchPage = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fetchError } = await supabase
        .from('products')
        .select(PRODUCT_COLUMNS)
        .eq('status', 'active')
        .order('sort_order', { ascending: true })
        .limit(1000);
      if (fetchError) throw fetchError;
      setProducts(data ?? []);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Only refetch when ROUTE changes (category/series) — NOT when sort/price/query change
  useEffect(() => {
    setProducts([]);
    fetchPage();
  }, [categoryId, requestedSeriesId, fetchPage]);



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
      const matchesQuery = !normalizedQuery ||
        product.name?.toLocaleLowerCase('vi').includes(normalizedQuery) ||
        product.spec_cpu?.toLocaleLowerCase('vi').includes(normalizedQuery) ||
        product.spec_ram?.toLocaleLowerCase('vi').includes(normalizedQuery) ||
        product.spec_gpu?.toLocaleLowerCase('vi').includes(normalizedQuery) ||
        product.spec_storage?.toLocaleLowerCase('vi').includes(normalizedQuery);
      const matchesPrice = activeRange.test(Number(product.price) || 0);
      return matchesCategory && matchesSeries && matchesQuery && matchesPrice;
    });

    // Sort — does NOT remove products, just reorders them
    if (sort === 'price-asc')
      return [...result].sort((a, b) => Number(a.price) - Number(b.price));
    if (sort === 'price-desc')
      return [...result].sort((a, b) => Number(b.price) - Number(a.price));
    if (sort === 'newest')
      return [...result].sort((a, b) => (b.is_new ? 1 : 0) - (a.is_new ? 1 : 0));
    if (sort === 'best-seller')
      return [...result].sort((a, b) => (b.is_best_seller ? 1 : 0) - (a.is_best_seller ? 1 : 0));
    if (sort === 'flash-sale')
      return [...result].sort((a, b) => (b.is_flash_sale ? 1 : 0) - (a.is_flash_sale ? 1 : 0));

    // 'featured' — keep server order (sort_order)
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
          <p className="luxury-eyebrow mb-3">{t('products.eyebrow')}</p>
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
            <div className="relative">
              <button 
                type="button" 
                onClick={() => setSortDropdownOpen(!sortDropdownOpen)}
                onBlur={() => setTimeout(() => setSortDropdownOpen(false), 200)}
                className="flex min-h-11 items-center gap-3 rounded-md border border-border-subtle bg-bg-card/80 px-4 text-xs font-semibold text-text-main transition-colors hover:border-primary/50 focus:border-primary/50 focus:outline-none"
              >
                <SlidersHorizontal size={16} className="text-primary" aria-hidden="true" />
                <span className="sr-only sm:not-sr-only">{t('common.sort')}:</span>
                {sort === 'featured' && t('products.sort_relevance')}
                {sort === 'newest' && t('products.sort_newest')}
                {sort === 'price-asc' && t('products.sort_price_asc')}
                {sort === 'price-desc' && t('products.sort_price_desc')}
                {sort === 'best-seller' && 'Bán chạy'}
                {sort === 'flash-sale' && 'Đang ưu đãi'}
                <ChevronDown size={14} className={`ml-1 text-text-muted transition-transform ${sortDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              
              <div className={`absolute right-0 top-full z-50 mt-2 w-52 origin-top-right flex-col overflow-hidden rounded-md border border-border-subtle bg-[#141412] shadow-2xl transition-all ${sortDropdownOpen ? 'flex opacity-100 scale-100' : 'pointer-events-none hidden opacity-0 scale-95'}`}>
                {sortOptions.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => {
                      const event = { target: { value: option.id } };
                      handleSortChange(event);
                      setSortDropdownOpen(false);
                    }}
                    className={`px-4 py-3 text-left text-sm font-medium transition-colors ${
                      sort === option.id ? 'bg-primary/[0.08] text-primary-hover border-l-2 border-primary' : 'border-l-2 border-transparent text-text-muted hover:bg-bg-main/50 hover:text-text-main'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="grid items-start gap-6 md:grid-cols-[250px_minmax(0,1fr)] lg:gap-8">
          <div className="group md:block">
            <button 
              type="button"
              className="luxury-panel flex w-full min-h-12 cursor-pointer list-none items-center justify-between rounded-[10px] px-4 text-sm font-semibold text-text-main md:hidden"
              onClick={(e) => {
                const aside = e.currentTarget.nextElementSibling;
                aside.classList.toggle('hidden');
                e.currentTarget.querySelector('.chevron-icon').classList.toggle('rotate-90');
              }}
            >
              <span className="flex items-center gap-2"><Filter size={17} className="text-primary" aria-hidden="true" /> Bộ lọc sản phẩm</span>
              <ChevronRight size={16} className="chevron-icon transition-transform" aria-hidden="true" />
            </button>
            <aside className="luxury-panel mt-3 hidden rounded-[10px] p-5 md:mt-0 md:block" aria-label="Bộ lọc sản phẩm">
              <div className="mb-5 border-b border-border-subtle pb-4">
                <p className="luxury-eyebrow mb-1">BỘ LỌC</p>
                <h2 className="font-['Be_Vietnam_Pro'] text-sm font-bold text-text-main">{t('products.filter_status')}</h2>
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

              <div className="bg-bg-card/40 border border-border-subtle rounded-xl p-3">
                <nav className="custom-scrollbar max-h-[600px] space-y-1 overflow-y-auto pr-1" aria-label="Lọc theo danh mục">
                  <Link to="/products" className={`group flex min-h-12 items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors ${!resolvedCategoryId ? 'bg-[#1a1914] text-primary-hover' : 'text-text-muted hover:bg-bg-main/50 hover:text-text-main'}`}>
                    <div className="flex items-center gap-3">
                      <span className={!resolvedCategoryId ? 'text-primary-hover' : 'text-text-muted group-hover:text-text-main'}><PackageSearch size={18} /></span>
                      Tất cả sản phẩm
                    </div>
                  </Link>
                  {categories.map((item) => {
                    const isActive = String(item.id) === String(resolvedCategoryId);
                    const hasGroups = item.category_groups && item.category_groups.length > 0;
                    
                    return (
                      <details key={item.id} className="group" open={isActive}>
                        <summary 
                          className={`flex min-h-12 cursor-pointer list-none items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors ${isActive ? 'bg-[#1a1914] text-primary-hover' : 'text-text-muted hover:bg-bg-main/50 hover:text-text-main'}`}
                        >
                          <Link to={`/category/${item.id}`} className="flex flex-1 items-center gap-3" onClick={(e) => hasGroups && e.stopPropagation()}>
                            <span className={isActive ? 'text-primary-hover' : 'text-text-muted group-hover:text-text-main'}>
                              {getCategoryIcon(item.name)}
                            </span>
                            {item.name}
                          </Link>
                          {hasGroups ? (
                            <ChevronDown size={16} className={`transition-transform duration-200 ${isActive ? 'text-primary-hover' : 'text-text-muted group-hover:text-text-main'} group-open:rotate-180`} aria-hidden="true" />
                          ) : (
                            <ChevronRight size={16} className={isActive ? 'text-primary-hover' : 'text-text-muted group-hover:text-text-main'} aria-hidden="true" />
                          )}
                        </summary>
                        {hasGroups && (
                          <div className="mt-1 flex flex-col space-y-1 pl-10 pr-2 pb-2">
                             {item.category_groups.map(group => (
                                <div key={group.id} className="text-xs">
                                  {group.name && <div className="py-1.5 font-semibold text-text-muted/60 uppercase tracking-wider">{group.name}</div>}
                                  {group.category_items && group.category_items.length > 0 && (
                                     <div className="flex flex-col space-y-0.5">
                                        {group.category_items.map(subItem => {
                                           const isSubActive = String(activeSeriesId) === String(subItem.id);
                                           return (
                                             <Link 
                                               key={subItem.id} 
                                               to={`/products?series=${subItem.id}`}
                                               className={`py-2 px-2 rounded-md transition-colors ${isSubActive ? 'bg-primary/10 font-semibold text-primary-hover' : 'text-text-muted hover:bg-bg-main/40 hover:text-text-main'}`}
                                             >
                                                {subItem.name}
                                             </Link>
                                           );
                                        })}
                                     </div>
                                  )}
                                </div>
                             ))}
                          </div>
                        )}
                      </details>
                    );
                  })}
                </nav>
              </div>
            </aside>
          </div>

          <div className="min-w-0">
            {/* Lọc nhanh section removed as requested */}

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
              <>
                <motion.div
                  className="grid grid-cols-2 gap-3 lg:grid-cols-3 lg:gap-5"
                  initial="hidden"
                  animate="visible"
                  variants={{
                    hidden: {},
                    visible: { transition: { staggerChildren: 0.045 } },
                  }}
                >
                  <AnimatePresence>
                    {filteredProducts.map((product) => (
                      <motion.div
                        key={product.id}
                        variants={{
                          hidden: { opacity: 0, y: 20 },
                          visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
                        }}
                      >
                        <ProductCard product={formatProductForCard(product)} />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </motion.div>

              </>
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
