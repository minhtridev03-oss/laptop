import { useEffect, useRef, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import {
  Cable,
  ChevronRight,
  CircuitBoard,
  Cpu,
  Gamepad2,
  HardDrive,
  Joystick,
  Laptop,
  LayoutGrid,
  Monitor,
  MonitorDot,
  MonitorSmartphone,
  Printer,
  Server,
  Tablet,
  Wifi,
} from 'lucide-react';
import ProductCard from '../components/ui/ProductCard';
import { supabase } from '../lib/supabase';

const SLIDE_INTERVAL = 5000;
const iconMap = {
  Laptop,
  Gamepad2,
  Monitor,
  Tablet,
  MonitorDot,
  Cpu,
  Server,
  CircuitBoard,
  LayoutGrid,
  MonitorSmartphone,
  Printer,
  HardDrive,
  Cable,
  Wifi,
  Joystick,
};

const formatProductForCard = (product) => ({
  id: product.id,
  name: product.name,
  price: product.price,
  originalPrice: product.original_price,
  discount: product.discount,
  category: product.category_id,
  image: product.image_url,
  specs: {
    cpu: product.spec_cpu,
    ram: product.spec_ram,
    storage: product.spec_storage,
    gpu: product.spec_gpu,
  },
  isHot: product.is_hot,
  stockQuantity: product.stock_quantity,
  status: product.status,
});

function SectionHeading({ eyebrow, title, accent, href }) {
  return (
    <div className="mb-6 flex items-end justify-between gap-5 border-b border-border-subtle pb-4">
      <div>
        <p className="luxury-eyebrow mb-2">{eyebrow}</p>
        <h2 className="luxury-heading text-xl uppercase sm:text-2xl">
          {title} <span className="luxury-gold-text">{accent}</span>
        </h2>
      </div>
      <Link
        to={href}
        className="group flex min-h-11 shrink-0 items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.13em] text-text-muted transition-colors hover:text-primary-hover"
      >
        Xem tất cả
        <ChevronRight size={15} className="transition-transform group-hover:translate-x-1" aria-hidden="true" />
      </Link>
    </div>
  );
}

function ProductSection({ eyebrow, title, accent, href, products }) {
  if (products.length === 0) return null;

  return (
    <section className="luxury-page-section mx-auto mb-16 w-full max-w-[1440px] px-4 lg:px-6">
      <SectionHeading eyebrow={eyebrow} title={title} accent={accent} href={href} />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 lg:grid-cols-4 xl:grid-cols-5">
        {products.slice(0, 10).map((product) => (
          <ProductCard key={product.id} product={formatProductForCard(product)} />
        ))}
      </div>
    </section>
  );
}

export default function Home() {
  const [mainBanners, setMainBanners] = useState([]);
  const [subBanners, setSubBanners] = useState([]);
  const [loadingBanners, setLoadingBanners] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [carouselPaused, setCarouselPaused] = useState(false);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState(null);
  const [flashSaleProducts, setFlashSaleProducts] = useState([]);
  const [bestSellerProducts, setBestSellerProducts] = useState([]);
  const [newestProducts, setNewestProducts] = useState([]);
  const categoryCloseTimer = useRef(null);

  const cancelCategoryClose = () => window.clearTimeout(categoryCloseTimer.current);
  const openCategory = (categoryId) => {
    cancelCategoryClose();
    setActiveCategory(categoryId);
  };
  const scheduleCategoryClose = () => {
    cancelCategoryClose();
    categoryCloseTimer.current = window.setTimeout(() => setActiveCategory(null), 220);
  };

  useEffect(() => {
    let ignore = false;

    async function fetchData() {
      try {
        const [bannersRes, categoriesRes, productsRes] = await Promise.all([
          supabase.from('banners').select('*').order('id', { ascending: true }),
          supabase
            .from('categories')
            .select('*, category_groups(*, category_items(*))')
            .order('sort_order', { ascending: true }),
          supabase.from('products').select('*').order('sort_order', { ascending: true }),
        ]);

        if (bannersRes.error) throw bannersRes.error;
        if (categoriesRes.error) throw categoriesRes.error;
        if (productsRes.error) throw productsRes.error;
        if (ignore) return;

        setMainBanners((bannersRes.data ?? []).filter((banner) => banner.type === 'main'));
        setSubBanners((bannersRes.data ?? []).filter((banner) => banner.type === 'sub'));
        setCategories((categoriesRes.data ?? []).map((category) => ({
          ...category,
          category_groups: [...(category.category_groups ?? [])]
            .sort((a, b) => a.sort_order - b.sort_order)
            .map((group) => ({
              ...group,
              category_items: [...(group.category_items ?? [])].sort((a, b) => a.sort_order - b.sort_order),
            })),
        })));
        setFlashSaleProducts((productsRes.data ?? []).filter((product) => product.is_flash_sale));
        setBestSellerProducts((productsRes.data ?? []).filter((product) => product.is_best_seller));
        setNewestProducts((productsRes.data ?? []).filter((product) => product.is_new));
      } catch (error) {
        console.error('Error fetching home data:', error);
      } finally {
        if (!ignore) setLoadingBanners(false);
      }
    }

    fetchData();
    return () => { ignore = true; };
  }, []);

  useEffect(() => {
    if (mainBanners.length <= 1 || carouselPaused) return undefined;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) return undefined;

    const intervalId = window.setInterval(() => {
      setCurrentSlide((current) => (current + 1) % mainBanners.length);
    }, SLIDE_INTERVAL);
    return () => window.clearInterval(intervalId);
  }, [carouselPaused, mainBanners.length]);

  useEffect(() => () => window.clearTimeout(categoryCloseTimer.current), []);

  const activeBanner = mainBanners[currentSlide] ?? mainBanners[0];
  const activeCategoryData = categories.find((category) => category.id === activeCategory);

  return (
    <>
      <Helmet>
        <title>Laptop World | Laptop, PC & linh kiện cao cấp</title>
        <meta
          name="description"
          content="Laptop, PC và linh kiện chính hãng tuyển chọn. Cấu hình minh bạch, tư vấn chuyên sâu và bảo hành uy tín tại Laptop World."
        />
      </Helmet>

      <section className="luxury-page-section mx-auto w-full max-w-[1440px] px-4 pb-14 pt-6 lg:px-6 lg:pt-8">
        <div className="relative z-30 flex flex-col gap-3 lg:flex-row">
          <nav
            className="luxury-panel relative z-40 hidden h-[420px] w-[280px] shrink-0 self-start flex-col rounded-[10px] lg:flex"
            aria-label="Danh mục sản phẩm"
            onMouseEnter={cancelCategoryClose}
            onMouseLeave={scheduleCategoryClose}
            onBlur={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget)) setActiveCategory(null);
            }}
            onKeyDown={(event) => {
              if (event.key === 'Escape') setActiveCategory(null);
            }}
          >
            <div className="border-b border-border-subtle p-5">
              <p className="luxury-eyebrow mb-1">BỘ SƯU TẬP</p>
              <strong className="font-['Sora'] text-sm uppercase tracking-[0.06em] text-text-main">Danh mục sản phẩm</strong>
            </div>
            <ul className="custom-scrollbar flex max-h-[346px] flex-col overflow-y-auto px-2 py-2 text-[13px]">
              {categories.map((category) => {
                const Icon = iconMap[category.icon];
                const isActive = activeCategory === category.id;
                return (
                  <li key={category.id} onMouseEnter={() => openCategory(category.id)}>
                    <Link
                      to={`/category/${category.id}`}
                      onFocus={() => openCategory(category.id)}
                      className={`group flex min-h-10 items-center justify-between rounded-md px-3 py-2 font-medium transition-colors ${
                        isActive ? 'bg-primary/[0.08] text-primary-hover' : 'text-text-muted hover:bg-primary/[0.05] hover:text-primary-hover'
                      }`}
                    >
                      <span className="flex min-w-0 items-center gap-3">
                        {Icon && <Icon size={16} strokeWidth={1.7} className="shrink-0 text-primary/75" aria-hidden="true" />}
                        <span className="truncate">{category.name}</span>
                      </span>
                      <ChevronRight size={14} className="shrink-0 opacity-60 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                    </Link>
                  </li>
                );
              })}
            </ul>

            {activeCategoryData?.category_groups?.length > 0 && (
              <div className="luxury-panel luxury-mega-menu top-0 z-50 h-[420px] w-[min(860px,calc(100vw-350px))] overflow-y-auto rounded-[10px] p-7" onMouseEnter={cancelCategoryClose}>
                <div className="grid grid-cols-3 gap-x-8 gap-y-7">
                  {activeCategoryData.category_groups.map((group) => (
                    <div key={group.id}>
                      <h3 className="mb-3 border-b border-border-subtle pb-2 text-xs font-bold uppercase tracking-[0.1em] text-primary-hover">
                        {group.name}
                      </h3>
                      <ul className="space-y-2.5">
                        {group.category_items?.map((item) => (
                          <li key={item.id}>
                            <Link
                              to={item.link_url || '/products'}
                              className="inline-flex min-h-6 items-center text-[13px] text-text-muted transition-all hover:translate-x-1 hover:text-text-main"
                            >
                              {item.name}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </nav>

          <div className="min-w-0 flex-1 space-y-3">
            {loadingBanners ? (
              <div className="luxury-hero flex h-[340px] w-full animate-pulse items-center justify-center rounded-[10px] md:h-[420px]" role="status">
                <span className="luxury-eyebrow">Đang chuẩn bị bộ sưu tập...</span>
              </div>
            ) : activeBanner ? (
              <div
                className="luxury-hero group relative h-[340px] w-full overflow-hidden rounded-[10px] md:h-[420px]"
                onMouseEnter={() => setCarouselPaused(true)}
                onMouseLeave={() => setCarouselPaused(false)}
                onFocus={() => setCarouselPaused(true)}
                onBlur={(event) => {
                  if (!event.currentTarget.contains(event.relatedTarget)) setCarouselPaused(false);
                }}
                aria-roledescription="carousel"
                aria-label="Bộ sưu tập nổi bật"
              >
                <div key={activeBanner.id} className="absolute inset-0">
                  <img
                    src={activeBanner.image_url}
                    alt={`${activeBanner.title1 ?? ''} ${activeBanner.title2 ?? ''}`.trim()}
                    className="h-full w-full object-cover opacity-55 transition-transform duration-[5000ms] ease-out group-hover:scale-[1.035]"
                  />
                  <div className="absolute inset-0 flex items-center bg-gradient-to-r from-[#090907]/95 via-[#090907]/65 to-transparent p-7 md:p-12">
                    <div className="max-w-xl">
                      {activeBanner.tag && <span className="luxury-eyebrow mb-6 inline-flex rounded border border-primary/40 bg-bg-main/55 px-3 py-2 backdrop-blur">{activeBanner.tag}</span>}
                      <h1 className="luxury-heading mb-5 text-3xl leading-[1.12] sm:text-4xl md:text-5xl">
                        {activeBanner.title1}<br />
                        <span className="luxury-gold-text">{activeBanner.title2}</span>
                      </h1>
                      {activeBanner.description && <p className="mb-8 max-w-lg whitespace-pre-line text-sm leading-7 text-text-muted md:text-base">{activeBanner.description}</p>}
                      <Link
                        to={activeBanner.link_url || '/products'}
                        className="luxury-primary-button inline-flex min-h-11 items-center gap-2 rounded-md px-6 text-xs font-bold uppercase tracking-[0.1em]"
                      >
                        {activeBanner.button_text || 'Khám phá ngay'}
                        <ChevronRight size={16} aria-hidden="true" />
                      </Link>
                    </div>
                  </div>
                </div>

                {mainBanners.length > 1 && (
                  <div className="absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 items-center rounded-full border border-border-subtle bg-bg-main/70 px-1 backdrop-blur">
                    {mainBanners.map((banner, index) => (
                      <button
                        key={banner.id}
                        type="button"
                        onClick={() => setCurrentSlide(index)}
                        className="grid h-11 w-11 place-items-center rounded-full"
                        aria-label={`Xem banner ${index + 1}: ${banner.title1}`}
                        aria-pressed={index === currentSlide}
                      >
                        <span className={`h-1.5 rounded-full transition-all ${index === currentSlide ? 'w-6 bg-primary-hover' : 'w-1.5 bg-text-muted/60'}`} />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="luxury-hero flex h-[340px] items-center justify-center rounded-[10px] md:h-[420px]">
                <div className="text-center">
                  <p className="luxury-eyebrow mb-3">Laptop World</p>
                  <p className="luxury-heading text-xl">Phần cứng tuyển chọn cho cấu hình xứng tầm</p>
                </div>
              </div>
            )}

            {!loadingBanners && subBanners.length > 0 && (
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                {subBanners.map((banner) => (
                  <Link
                    key={banner.id}
                    to={banner.link_url || '/products'}
                    className={`luxury-panel hover-lift group relative h-[150px] overflow-hidden rounded-[10px] ${banner.hidden_on_mobile ? 'hidden md:block' : ''}`}
                  >
                    <img src={banner.image_url} alt={banner.title1 || banner.tag || 'Bộ sưu tập sản phẩm'} loading="lazy" decoding="async" className="h-full w-full object-cover opacity-55 transition-transform duration-500 group-hover:scale-105" />
                    <span className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-bg-main via-bg-main/25 to-transparent p-4">
                      {banner.tag && <span className="luxury-eyebrow mb-1">{banner.tag}</span>}
                      <strong className="font-['Sora'] text-sm leading-snug text-text-main transition-colors group-hover:text-primary-hover sm:text-base">{banner.title1}</strong>
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <ProductSection eyebrow="Ưu đãi tuyển chọn" title="Flash" accent="Sale" href="/products?sort=flash-sale" products={flashSaleProducts} />
      <ProductSection eyebrow="Được tin chọn" title="Bán chạy" accent="nhất" href="/products?sort=best-seller" products={bestSellerProducts} />
      <ProductSection eyebrow="Vừa cập nhật" title="Sản phẩm" accent="mới nhất" href="/products?sort=newest" products={newestProducts} />
    </>
  );
}
