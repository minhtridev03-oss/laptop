import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import ProductCard from '../components/ui/ProductCard';
import { ChevronRight, Laptop, Gamepad2, Monitor, Tablet, MonitorDot, Cpu, Server, CircuitBoard, LayoutGrid, MonitorSmartphone, Joystick, Printer, HardDrive, Cable, Wifi, Zap, TrendingUp, Sparkles } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useState, useEffect } from 'react';

const iconMap = { Laptop, Gamepad2, Monitor, Tablet, MonitorDot, Cpu, Server, CircuitBoard, LayoutGrid, MonitorSmartphone, Joystick, Printer, HardDrive, Cable, Wifi };

export default function Home() {
  const [mainBanners, setMainBanners] = useState([]);
  const [subBanners, setSubBanners] = useState([]);
  const [loadingBanners, setLoadingBanners] = useState(true);
  const [currentSlide, setCurrentSlide] = useState(0);
  const SLIDE_INTERVAL = 4000;
  
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState(null);

  const [flashSaleProducts, setFlashSaleProducts] = useState([]);
  const [bestSellerProducts, setBestSellerProducts] = useState([]);
  const [newestProducts, setNewestProducts] = useState([]);

  // Countdown timer state
  const [countdown, setCountdown] = useState({ hours: 2, minutes: 30, seconds: 0 });

  useEffect(() => {
    async function fetchData() {
      try {
        const [bannersRes, categoriesRes, productsRes] = await Promise.all([
          supabase.from('banners').select('*').order('id', { ascending: true }),
          supabase.from('categories').select('*, category_groups(*, category_items(*))').order('sort_order', { ascending: true }),
          supabase.from('products').select('*').order('sort_order', { ascending: true })
        ]);
        
        if (bannersRes.error) throw bannersRes.error;
        if (categoriesRes.error) throw categoriesRes.error;
        if (productsRes.error) throw productsRes.error;
        
        if (bannersRes.data) {
          setMainBanners(bannersRes.data.filter(b => b.type === 'main'));
          setSubBanners(bannersRes.data.filter(b => b.type === 'sub'));
        }

        if (categoriesRes.data) {
          const sortedCats = categoriesRes.data.map(cat => ({
            ...cat,
            category_groups: cat.category_groups
              .sort((a, b) => a.sort_order - b.sort_order)
              .map(group => ({
                ...group,
                category_items: group.category_items.sort((a, b) => a.sort_order - b.sort_order)
              }))
          }));
          setCategories(sortedCats);
        }

        if (productsRes.data) {
          setFlashSaleProducts(productsRes.data.filter(p => p.is_flash_sale));
          setBestSellerProducts(productsRes.data.filter(p => p.is_best_seller));
          setNewestProducts(productsRes.data.filter(p => p.is_new));
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoadingBanners(false);
      }
    }
    fetchData();
  }, []);

  // Auto-play slider
  useEffect(() => {
    if (mainBanners.length <= 1) return;
    const intervalId = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % mainBanners.length);
    }, SLIDE_INTERVAL);
    return () => clearInterval(intervalId);
  }, [mainBanners.length]);

  // Flash Sale countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev.hours === 0 && prev.minutes === 0 && prev.seconds === 0) {
          return { hours: 2, minutes: 30, seconds: 0 }; // Reset
        }
        let { hours, minutes, seconds } = prev;
        if (seconds > 0) { seconds--; }
        else if (minutes > 0) { minutes--; seconds = 59; }
        else if (hours > 0) { hours--; minutes = 59; seconds = 59; }
        return { hours, minutes, seconds };
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatProductForCard = (product) => ({
    id: product.id,
    name: product.name,
    price: product.price,
    originalPrice: product.original_price,
    discount: product.discount,
    category: product.category_id,
    image: product.image_url,
    specs: { cpu: product.spec_cpu, ram: product.spec_ram, storage: product.spec_storage, gpu: product.spec_gpu },
    isHot: product.is_hot
  });

  return (
    <>
      <Helmet>
        <title>Laptop World - Linh Kiện & Máy Tính Cao Cấp | Home</title>
        <meta name="description" content="Chuyên cung cấp laptop, PC, linh kiện điện tử chính hãng. Giá tốt nhất, bảo hành uy tín." />
      </Helmet>

      <div className="w-full px-[10px] py-6">
        {/* Hero Section */}
        <div className="flex flex-col lg:flex-row gap-[10px] mb-12 relative z-40">
          {/* Sidebar Menu */}
          <div 
            className="w-full lg:w-[260px] xl:w-[280px] flex-shrink-0 bg-bg-card rounded-sm shadow-sm hidden lg:flex flex-col border border-border-subtle relative z-50"
            onMouseLeave={() => setActiveCategory(null)}
          >
            <div className="bg-bg-card text-text-main font-bold p-4 text-sm border-b border-border-subtle uppercase tracking-widest flex items-center gap-2">
              Danh mục
            </div>
            <ul className="text-[13px] flex flex-col py-1 overflow-y-auto custom-scrollbar">
              {categories.map((cat) => {
                const IconComp = iconMap[cat.icon];
                const hasMegaMenu = cat.category_groups && cat.category_groups.length > 0;
                return (
                <li 
                  key={cat.id} 
                  className="px-2 py-0.5"
                  onMouseEnter={() => setActiveCategory(cat.id)}
                >
                  <Link 
                    to={`/category/${cat.id}`} 
                    className={`flex items-center justify-between p-2 rounded transition-colors font-medium group ${activeCategory === cat.id ? 'bg-bg-main text-primary' : 'hover:bg-bg-main hover:text-primary text-text-muted'}`}
                  >
                    <span className="flex items-center gap-3">
                      {IconComp && <IconComp size={16} strokeWidth={1.8} className={`shrink-0 transition-colors ${activeCategory === cat.id ? 'text-primary' : 'text-text-muted group-hover:text-primary'}`} />}
                      {cat.name}
                    </span>
                    <ChevronRight size={14} className={`transition-colors ${activeCategory === cat.id ? 'text-primary' : 'text-text-muted group-hover:text-primary'}`} />
                  </Link>
                </li>
                );
              })}
            </ul>

            {/* Mega Menu Panel */}
            {activeCategory && categories.find(c => c.id === activeCategory)?.category_groups?.length > 0 && (
              <div 
                className="absolute top-0 left-full ml-[2px] w-[800px] min-h-[420px] bg-bg-main border border-border-subtle shadow-2xl rounded-sm p-6 z-[100] animate-in fade-in slide-in-from-left-2 duration-200"
              >
                <div className="grid grid-cols-3 gap-8">
                  {categories.find(c => c.id === activeCategory).category_groups.map((group) => (
                    <div key={group.id} className="flex flex-col gap-3">
                      <h3 className="text-primary font-bold text-sm uppercase tracking-wider border-b border-border-subtle pb-2">
                        {group.name}
                      </h3>
                      <ul className="flex flex-col gap-2">
                        {group.category_items?.map((item) => (
                          <li key={item.id}>
                            <Link 
                              to={item.link_url} 
                              className="text-text-muted hover:text-text-main hover:translate-x-1 inline-block transition-all text-[13px]"
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
          </div>

          
          {/* Main Banners */}
          <div className="flex-1 flex flex-col gap-[10px] min-w-0">
            {loadingBanners ? (
              <div className="bg-bg-card w-full h-[320px] md:h-[420px] rounded-sm flex items-center justify-center border border-border-subtle animate-pulse">
                <span className="text-text-muted">Đang tải...</span>
              </div>
            ) : mainBanners.length > 0 ? (
              <div className="bg-bg-card w-full h-[320px] md:h-[420px] rounded-sm relative overflow-hidden flex items-center justify-center group shadow-sm border border-border-subtle hover-lift">
                {mainBanners.map((banner, index) => (
                  <div 
                    key={banner.id}
                    className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
                  >
                    <img 
                      src={banner.image_url} 
                      alt="Main Banner" 
                      className={`w-full h-full object-cover opacity-50 transition-transform duration-[4000ms] ease-out ${index === currentSlide ? 'scale-105' : 'scale-100'}`} 
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-bg-main/90 via-bg-main/50 to-transparent flex items-center p-8 md:p-12">
                       <div className="text-text-main max-w-lg">
                         {banner.tag && <div className="inline-block px-3 py-1 bg-transparent border border-primary text-primary text-[10px] font-bold rounded-sm mb-6 uppercase tracking-widest">{banner.tag}</div>}
                         <h2 className="text-4xl md:text-5xl font-black mb-4 leading-tight tracking-tight text-text-main">{banner.title1} <br/><span className="text-primary">{banner.title2}</span></h2>
                         <p className="text-text-muted text-sm md:text-base mb-8 font-normal tracking-wide whitespace-pre-line">{banner.description}</p>
                         <Link to={banner.link_url} className="inline-block bg-primary hover:bg-primary-hover text-bg-main font-bold py-3 px-8 rounded-sm transition-colors text-sm uppercase tracking-wider">
                           {banner.button_text}
                         </Link>
                       </div>
                    </div>
                  </div>
                ))}
                
                {/* Dots Indicator */}
                {mainBanners.length > 1 && (
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20">
                    {mainBanners.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentSlide(index)}
                        className={`w-2 h-2 rounded-full transition-all duration-300 ${
                          index === currentSlide 
                            ? 'bg-primary w-6' 
                            : 'bg-text-muted/50 hover:bg-text-muted'
                        }`}
                        aria-label={`Go to slide ${index + 1}`}
                      />
                    ))}
                  </div>
                )}
              </div>
            ) : null}
            
            {/* Sub Banners Dynamic */}
            {!loadingBanners && subBanners.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-[10px]">
                {subBanners.map((banner) => (
                 <Link key={banner.id} to={banner.link_url} className={`h-[150px] rounded-sm overflow-hidden relative group hover-lift border border-border-subtle ${banner.hidden_on_mobile ? 'hidden md:block' : ''}`}>
                    <img src={banner.image_url} alt={banner.title1} className="w-full h-full object-cover opacity-60 group-hover:scale-110 transition-transform duration-500" />
                    <div className="absolute inset-0 bg-gradient-to-t from-bg-main/90 via-bg-main/20 to-transparent flex flex-col justify-end p-4">
                      <span className={`${banner.tag_color} text-[10px] font-bold uppercase tracking-widest mb-1`}>{banner.tag}</span>
                      <span className="text-text-main font-bold text-base leading-tight group-hover:text-primary transition-colors">{banner.title1}</span>
                    </div>
                 </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Flash Sale Products */}
      {flashSaleProducts.length > 0 && (
      <div className="w-full px-[10px] mb-16">
        <div className="container mx-auto px-4 max-w-[1400px]">
          <div className="flex justify-between items-end mb-6 border-b border-border-subtle pb-3">
            <h2 className="text-xl font-bold uppercase text-text-main tracking-tight flex items-center gap-3">
              Flash <span className="text-primary">Sale</span>
              <div className="flex gap-2 items-center ml-4">
                <div className="bg-bg-main border border-border-subtle px-2 py-1 rounded text-primary font-mono font-bold text-sm">
                  {String(countdown.hours).padStart(2, '0')}
                </div>
                <span className="text-text-muted font-bold">:</span>
                <div className="bg-bg-main border border-border-subtle px-2 py-1 rounded text-primary font-mono font-bold text-sm">
                  {String(countdown.minutes).padStart(2, '0')}
                </div>
                <span className="text-text-muted font-bold">:</span>
                <div className="bg-bg-main border border-border-subtle px-2 py-1 rounded text-primary font-mono font-bold text-sm">
                  {String(countdown.seconds).padStart(2, '0')}
                </div>
              </div>
            </h2>
            <Link to="/products?sort=flash-sale" className="text-text-muted hover:text-primary font-medium text-xs flex items-center gap-1 transition-colors group uppercase tracking-widest">
              Xem tất cả <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-4">
            {flashSaleProducts.slice(0, 10).map((product) => (
              <ProductCard key={product.id} product={formatProductForCard(product)} />
            ))}
          </div>
        </div>
      </div>
      )}

      {/* Best Seller Products */}
      {bestSellerProducts.length > 0 && (
      <div className="w-full px-[10px] mb-16">
        <div className="container mx-auto px-4 max-w-[1400px]">
          <div className="flex justify-between items-end mb-6 border-b border-border-subtle pb-3">
            <h2 className="text-xl font-bold uppercase text-text-main tracking-tight flex items-center gap-3">
              Bán Chạy <span className="text-primary">Nhất</span>
            </h2>
            <Link to="/products?sort=best-seller" className="text-text-muted hover:text-primary font-medium text-xs flex items-center gap-1 transition-colors group uppercase tracking-widest">
              Xem tất cả <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-4">
            {bestSellerProducts.slice(0, 10).map((product) => (
              <ProductCard key={product.id} product={formatProductForCard(product)} />
            ))}
          </div>
        </div>
      </div>
      )}

      {/* Newest Products */}
      {newestProducts.length > 0 && (
      <div className="w-full px-[10px] mb-16">
        <div className="container mx-auto px-4 max-w-[1400px]">
          <div className="flex justify-between items-end mb-6 border-b border-border-subtle pb-3">
            <h2 className="text-xl font-bold uppercase text-text-main tracking-tight flex items-center gap-3">
              Sản Phẩm <span className="text-primary">Mới Nhất</span>
            </h2>
            <Link to="/products?sort=newest" className="text-text-muted hover:text-primary font-medium text-xs flex items-center gap-1 transition-colors group uppercase tracking-widest">
              Xem tất cả <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-4">
            {newestProducts.slice(0, 10).map((product) => (
              <ProductCard key={product.id} product={formatProductForCard(product)} />
            ))}
          </div>
        </div>
      </div>
      )}
    </>
  );
}
