import { Helmet } from 'react-helmet-async';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  BadgeCheck,
  Check,
  ChevronLeft,
  ChevronRight,
  CircuitBoard,
  Cpu,
  ExternalLink,
  Gift,
  HardDrive,
  Heart,
  ImageOff,
  MemoryStick,
  Minus,
  PackageCheck,
  Play,
  Plus,
  RefreshCw,
  Scale,
  ShoppingCart,
  Sparkles,
  Star,
  Tag,
  Zap,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useCommerce } from '../context/CommerceContext';
import { isCommerceProductPurchasable } from '../lib/commerce';
import './ProductDetail.css';

const SPEC_LABELS = {
  cpu: 'Bộ xử lý', processor: 'Bộ xử lý', ram: 'Bộ nhớ RAM', memory: 'Bộ nhớ RAM',
  storage: 'Lưu trữ', ssd: 'Ổ cứng SSD', hdd: 'Ổ cứng HDD', gpu: 'Card đồ họa',
  graphics: 'Card đồ họa', vga: 'Card đồ họa', screen: 'Màn hình', display: 'Màn hình',
  resolution: 'Độ phân giải', refresh_rate: 'Tần số quét', motherboard: 'Bo mạch chủ',
  mainboard: 'Bo mạch chủ', chipset: 'Chipset', socket: 'Socket', psu: 'Nguồn',
  power: 'Công suất', cooling: 'Tản nhiệt', interface: 'Chuẩn kết nối',
  connectivity: 'Kết nối', ports: 'Cổng kết nối', color: 'Màu sắc', weight: 'Khối lượng',
  dimensions: 'Kích thước', os: 'Hệ điều hành', warranty: 'Bảo hành', category_path: 'Nhóm sản phẩm',
};

const SPEC_ORDER = [
  'cpu', 'processor', 'gpu', 'graphics', 'ram', 'memory', 'storage', 'ssd', 'hdd',
  'screen', 'display', 'resolution', 'refresh_rate', 'motherboard', 'mainboard',
  'chipset', 'socket', 'psu', 'power', 'cooling', 'interface', 'connectivity',
  'ports', 'color', 'weight', 'dimensions', 'os',
];

const SPEC_ICONS = {
  cpu: Cpu, processor: Cpu, ram: MemoryStick, memory: MemoryStick,
  storage: HardDrive, ssd: HardDrive, hdd: HardDrive,
  gpu: CircuitBoard, graphics: CircuitBoard, vga: CircuitBoard,
};

const isDisplayValue = (value) => {
  if (value === null || value === undefined || value === '') return false;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    return !['', '--', '-', 'n/a', 'null', 'undefined'].includes(normalized);
  }
  return true;
};

const parseJsonValue = (value) => {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  if (!trimmed || (!trimmed.startsWith('[') && !trimmed.startsWith('{'))) return value;
  try {
    return JSON.parse(trimmed);
  } catch {
    return value;
  }
};

const toNumber = (value) => {
  if (!isDisplayValue(value)) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const formatPrice = (value) => {
  const amount = toNumber(value);
  if (amount === null || amount <= 0) return null;
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency', currency: 'VND', maximumFractionDigits: 0,
  }).format(amount);
};

const formatCount = (value) => {
  const amount = toNumber(value);
  if (amount === null) return null;
  return new Intl.NumberFormat('vi-VN').format(Math.max(0, amount));
};

const humanizeKey = (key = '') => {
  const normalized = key.replace(/^spec_/, '').replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase();
  if (SPEC_LABELS[normalized]) return SPEC_LABELS[normalized];
  return normalized.split('_').filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ');
};

const normalizeTextValue = (value) => {
  if (!isDisplayValue(value)) return null;
  if (typeof value === 'boolean') return value ? 'Có' : 'Không';
  if (Array.isArray(value)) return value.filter(isDisplayValue).join(', ');
  if (typeof value === 'object') {
    return Object.entries(value).filter(([, item]) => isDisplayValue(item))
      .map(([key, item]) => `${humanizeKey(key)}: ${item}`).join(' · ');
  }
  return String(value).trim();
};

const normalizeImages = (product) => {
  if (!product) return [];
  const imageFields = [product.images, product.gallery, product.image_urls, product.imageUrls, product.image_url, product.image];
  const images = imageFields.flatMap((field) => {
    const parsed = parseJsonValue(field);
    if (Array.isArray(parsed)) return parsed;
    return isDisplayValue(parsed) ? [parsed] : [];
  });
  return [...new Set(images.filter((image) => typeof image === 'string' && image.trim()).map((image) => image.trim()))];
};

const normalizePromotions = (product) => {
  const raw = parseJsonValue(product?.promotions ?? product?.promotion ?? product?.gifts);
  if (!isDisplayValue(raw)) return [];
  const items = Array.isArray(raw) ? raw : [raw];
  return items.map((item, index) => {
    if (typeof item === 'string') return { id: `promotion-${index}`, title: item };
    if (!item || typeof item !== 'object') return null;
    const title = item.title ?? item.name ?? item.label ?? item.description ?? item.value;
    if (!isDisplayValue(title)) return null;
    return {
      id: item.id ?? `promotion-${index}`,
      title: normalizeTextValue(title),
      description: normalizeTextValue(item.description !== title ? item.description : null),
      code: normalizeTextValue(item.code),
      link: typeof item.link === 'string' ? item.link : null,
    };
  }).filter(Boolean);
};

const normalizeDescription = (product) => {
  const structured = parseJsonValue(product?.specifications);
  const raw = product?.description ?? product?.long_description ?? product?.short_description ?? structured?.description;
  const parsed = parseJsonValue(raw);
  if (!isDisplayValue(parsed)) return [];
  if (Array.isArray(parsed)) return parsed.map(normalizeTextValue).filter(Boolean);
  if (typeof parsed === 'object') return Object.values(parsed).map(normalizeTextValue).filter(Boolean);
  return String(parsed).split(/\n{2,}/).map((paragraph) => paragraph.trim()).filter(Boolean);
};

const normalizeSpecs = (product) => {
  if (!product) return [];
  const items = [];
  const seen = new Set();
  const addSpec = (key, label, value) => {
    const normalizedValue = normalizeTextValue(value);
    if (!normalizedValue) return;
    const normalizedKey = String(key || label).replace(/^spec_/, '').trim().toLowerCase();
    const signature = normalizedKey.replace(/[^a-z0-9À-ỹ]/gi, '');
    if (seen.has(signature)) return;
    seen.add(signature);
    items.push({
      key: normalizedKey || `spec-${items.length}`,
      label: normalizeTextValue(label) || humanizeKey(normalizedKey),
      value: normalizedValue,
    });
  };

  const detailed = parseJsonValue(product.detailed_specs ?? product.detailedSpecs);
  if (Array.isArray(detailed)) {
    detailed.forEach((item, index) => {
      if (typeof item === 'string') addSpec(`detail-${index}`, `Thông tin ${index + 1}`, item);
      else if (item && typeof item === 'object') {
        const label = item.label ?? item.name ?? item.key ?? item.title;
        const value = item.value ?? item.description ?? item.content;
        addSpec(item.key ?? label ?? `detail-${index}`, label, value);
      }
    });
  } else if (detailed && typeof detailed === 'object') {
    Object.entries(detailed).forEach(([key, value]) => addSpec(key, humanizeKey(key), value));
  }

  const groupedSpecs = parseJsonValue(product.specs);
  if (groupedSpecs && typeof groupedSpecs === 'object' && !Array.isArray(groupedSpecs)) {
    Object.entries(groupedSpecs).forEach(([key, value]) => addSpec(key, humanizeKey(key), value));
  }

  const structuredSpecs = parseJsonValue(product.specifications);
  const hiddenStructuredKeys = new Set(['builder_tier', 'card_highlights', 'component_type', 'description', 'performance_score', 'sample_data']);
  const legacySpecAliases = { processor: 'spec_cpu', memory: 'spec_ram', storage: 'spec_storage', graphics: 'spec_gpu' };
  if (structuredSpecs && typeof structuredSpecs === 'object' && !Array.isArray(structuredSpecs)) {
    Object.entries(structuredSpecs)
      .filter(([key]) => !hiddenStructuredKeys.has(key) && !isDisplayValue(product[legacySpecAliases[key]]))
      .forEach(([key, value]) => addSpec(key, humanizeKey(key), value));
  }

  Object.entries(product).filter(([key]) => key.startsWith('spec_'))
    .sort(([keyA], [keyB]) => {
      const a = keyA.replace(/^spec_/, '');
      const b = keyB.replace(/^spec_/, '');
      const indexA = SPEC_ORDER.indexOf(a);
      const indexB = SPEC_ORDER.indexOf(b);
      if (indexA === -1 && indexB === -1) return a.localeCompare(b, 'vi');
      if (indexA === -1) return 1;
      if (indexB === -1) return -1;
      return indexA - indexB;
    })
    .forEach(([key, value]) => {
      const normalizedKey = key.replace(/^spec_/, '');
      addSpec(normalizedKey, humanizeKey(normalizedKey), value);
    });

  [
    ['os', 'Hệ điều hành'], ['operating_system', 'Hệ điều hành'], ['screen', 'Màn hình'],
    ['display', 'Màn hình'], ['resolution', 'Độ phân giải'], ['refresh_rate', 'Tần số quét'],
    ['color', 'Màu sắc'], ['weight', 'Khối lượng'], ['dimensions', 'Kích thước'],
  ].forEach(([key, label]) => addSpec(key, label, product[key]));
  return items;
};

const getCategoryName = (product, category) => {
  const relation = Array.isArray(product?.categories) ? product.categories[0] : product?.categories;
  const name = category?.name ?? relation?.name ?? product?.category_name;
  if (isDisplayValue(name)) return String(name);
  if (!isDisplayValue(product?.category_id)) return null;
  return String(product.category_id).replaceAll('-', ' ').replace(/(^|\s)\S/g, (letter) => letter.toUpperCase());
};

const getStockState = (stock) => {
  if (!isDisplayValue(stock)) return null;
  const numericStock = toNumber(stock);
  if (numericStock !== null) {
    if (numericStock <= 0) return { available: false, label: 'Hết hàng', count: 0 };
    return { available: true, label: `Còn ${formatCount(numericStock)} sản phẩm`, count: numericStock };
  }
  const normalized = String(stock).trim().toLowerCase();
  const unavailable = ['out', 'out of stock', 'sold out', 'hết hàng', 'unavailable'].includes(normalized);
  return { available: !unavailable, label: String(stock).trim(), count: null };
};

const getProductBadges = (product, discount) => {
  const badges = [];
  if (discount > 0) badges.push({ label: `Giảm ${Math.round(discount)}%`, tone: 'cyan', Icon: Tag });
  if (product?.is_flash_sale ?? product?.isFlashSale) badges.push({ label: 'Flash sale', tone: 'purple', Icon: Zap });
  if (product?.is_hot ?? product?.isHot) badges.push({ label: 'Nổi bật', tone: 'orange', Icon: Sparkles });
  if (product?.is_best_seller ?? product?.isBestSeller) badges.push({ label: 'Bán chạy', tone: 'purple', Icon: BadgeCheck });
  if (product?.is_new ?? product?.isNew) badges.push({ label: 'Sản phẩm mới', tone: 'cyan', Icon: Sparkles });
  return badges;
};

const createSeoDescription = (product, specs, description) => {
  if (description.length > 0) return description.join(' ').slice(0, 160);
  const specSummary = specs.slice(0, 4).map((spec) => `${spec.label}: ${spec.value}`).join(', ');
  return [product.name, specSummary].filter(Boolean).join(' — ').slice(0, 160);
};

function ProductDetailSkeleton() {
  return (
    <div className="pd-page pd-page--state" role="status" aria-live="polite">
      <span className="sr-only">Đang tải thông tin sản phẩm...</span>
      <div className="pd-container">
        <div className="pd-skeleton pd-skeleton--crumb" />
        <div className="pd-skeleton-grid">
          <div className="pd-skeleton pd-skeleton--media" />
          <div className="pd-skeleton-panel">
            <div className="pd-skeleton pd-skeleton--eyebrow" />
            <div className="pd-skeleton pd-skeleton--title" />
            <div className="pd-skeleton pd-skeleton--title-short" />
            <div className="pd-skeleton pd-skeleton--price" />
            <div className="pd-skeleton-specs">
              {[0, 1, 2, 3].map((item) => <div className="pd-skeleton pd-skeleton--spec" key={item} />)}
            </div>
            <div className="pd-skeleton pd-skeleton--button" />
          </div>
        </div>
      </div>
    </div>
  );
}

function ProductDetailError({ notFound, onRetry }) {
  return (
    <div className="pd-page pd-page--state">
      <div className="pd-container pd-state-wrap">
        <div className="pd-state-card" role="alert">
          <span className="pd-state-icon"><AlertTriangle aria-hidden="true" /></span>
          <p className="pd-kicker">{notFound ? 'KHÔNG TÌM THẤY' : 'KẾT NỐI GIÁN ĐOẠN'}</p>
          <h1>{notFound ? 'Không tìm thấy sản phẩm' : 'Chưa thể tải dữ liệu'}</h1>
          <p>{notFound
            ? 'Sản phẩm này có thể đã ngừng kinh doanh hoặc đường dẫn không còn chính xác.'
            : 'Dữ liệu sản phẩm chưa phản hồi. Bạn có thể thử tải lại trang.'}</p>
          <div className="pd-state-actions">
            <Link to="/products" className="pd-button pd-button--primary">
              <ArrowLeft size={18} aria-hidden="true" /> Xem danh sách sản phẩm
            </Link>
            {!notFound && (
              <button type="button" className="pd-button pd-button--ghost" onClick={onRetry}>
                <RefreshCw size={18} aria-hidden="true" /> Thử lại
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ProductGallery({ images, name, discount }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [failedImages, setFailedImages] = useState(() => new Set());
  const activeImage = images[activeIndex];
  const activeImageFailed = activeImage ? failedImages.has(activeImage) : true;
  const goToPrevious = () => setActiveIndex((current) => (current === 0 ? images.length - 1 : current - 1));
  const goToNext = () => setActiveIndex((current) => (current === images.length - 1 ? 0 : current + 1));
  const handleKeyDown = (event) => {
    if (images.length <= 1) return;
    if (event.key === 'ArrowLeft') { event.preventDefault(); goToPrevious(); }
    if (event.key === 'ArrowRight') { event.preventDefault(); goToNext(); }
  };
  const markImageFailed = (image) => setFailedImages((current) => new Set(current).add(image));

  return (
    <section className="pd-panel pd-gallery" aria-label="Hình ảnh sản phẩm">
      <div className="pd-gallery-head">
        <span className="pd-kicker">HÌNH ẢNH SẢN PHẨM</span>
        {images.length > 0 && <span className="pd-image-counter" aria-live="polite">
          {String(activeIndex + 1).padStart(2, '0')} / {String(images.length).padStart(2, '0')}
        </span>}
      </div>
      <div className="pd-media-frame" tabIndex={images.length > 1 ? 0 : undefined} onKeyDown={handleKeyDown}>
        {discount > 0 && <span className="pd-discount-corner">-{Math.round(discount)}%</span>}
        {!activeImage || activeImageFailed ? (
          <div className="pd-image-empty"><ImageOff size={42} aria-hidden="true" /><span>Chưa có hình ảnh</span></div>
        ) : (
          <img key={activeImage} src={activeImage} alt={`${name} — ảnh ${activeIndex + 1}`}
            className="pd-main-image" onError={() => markImageFailed(activeImage)} />
        )}
        {images.length > 1 && <>
          <button type="button" className="pd-gallery-arrow pd-gallery-arrow--left" onClick={goToPrevious} aria-label="Xem ảnh trước">
            <ChevronLeft aria-hidden="true" />
          </button>
          <button type="button" className="pd-gallery-arrow pd-gallery-arrow--right" onClick={goToNext} aria-label="Xem ảnh tiếp theo">
            <ChevronRight aria-hidden="true" />
          </button>
        </>}
      </div>
      {images.length > 1 && <div className="pd-thumbnails" aria-label="Chọn ảnh sản phẩm">
        {images.map((image, index) => <button type="button" key={image}
          className={`pd-thumbnail ${index === activeIndex ? 'is-active' : ''}`}
          onClick={() => setActiveIndex(index)} aria-label={`Xem ảnh ${index + 1} của ${name}`}
          aria-pressed={index === activeIndex}>
          {failedImages.has(image) ? <ImageOff size={18} aria-hidden="true" />
            : <img src={image} alt="" onError={() => markImageFailed(image)} />}
        </button>)}
      </div>}
    </section>
  );
}

function Rating({ rating, reviewCount }) {
  const normalizedRating = Math.min(5, Math.max(0, toNumber(rating) ?? 0));
  const count = formatCount(reviewCount);
  if (!isDisplayValue(rating) && !isDisplayValue(reviewCount)) return null;
  return (
    <div className="pd-rating" aria-label={`Đánh giá ${normalizedRating} trên 5${count ? ` từ ${count} lượt` : ''}`}>
      <span className="pd-rating-stars" aria-hidden="true">
        {[1, 2, 3, 4, 5].map((star) => <Star key={star} size={15} fill={star <= Math.round(normalizedRating) ? 'currentColor' : 'none'} />)}
      </span>
      <span>{normalizedRating.toFixed(1)}</span>
      {count && <span className="pd-meta-muted">({count} đánh giá)</span>}
    </div>
  );
}

function SpecIcon({ specKey }) {
  const Icon = SPEC_ICONS[specKey.replace(/^spec_/, '')] ?? CircuitBoard;
  return <Icon size={20} aria-hidden="true" />;
}

function QuickSpecs({ specs }) {
  if (specs.length === 0) return null;
  return <div className="pd-quick-specs" aria-label="Thông số nổi bật">
    {specs.slice(0, 4).map((spec) => <div className="pd-quick-spec" key={`${spec.key}-${spec.label}`}>
      <span className="pd-quick-spec-icon"><SpecIcon specKey={spec.key} /></span>
      <span className="pd-quick-spec-copy"><span>{spec.label}</span><strong>{spec.value}</strong></span>
    </div>)}
  </div>;
}

function PromotionList({ promotions }) {
  if (promotions.length === 0) return null;
  return (
    <section className="pd-promotions" aria-labelledby="promotion-title">
      <div className="pd-promotions-title" id="promotion-title"><Gift size={18} aria-hidden="true" /><span>Ưu đãi kèm theo</span></div>
      <ul>{promotions.map((promotion) => <li key={promotion.id}>
        <span className="pd-promotion-check"><Check size={13} aria-hidden="true" /></span>
        <span><strong>{promotion.title}</strong>
          {promotion.description && <small>{promotion.description}</small>}
          {promotion.code && <code>{promotion.code}</code>}
          {promotion.link && <a href={promotion.link} target="_blank" rel="noreferrer">Chi tiết <ExternalLink size={13} aria-hidden="true" /></a>}
        </span>
      </li>)}</ul>
    </section>
  );
}

function ProductInformation({ description, specs, warranty, youtubeLink }) {
  if (description.length === 0 && specs.length === 0 && !isDisplayValue(warranty) && !isDisplayValue(youtubeLink)) return null;
  return (
    <section className="pd-panel pd-information" id="product-information" aria-labelledby="information-heading">
      <div className="pd-section-heading"><div><p className="pd-kicker">THÔNG SỐ CHI TIẾT</p><h2 id="information-heading">Thông tin sản phẩm</h2></div><span className="pd-section-line" aria-hidden="true" /></div>
      {description.length > 0 && <div className="pd-description"><h3>Mô tả</h3>
        {description.map((paragraph, index) => <p key={`${paragraph.slice(0, 24)}-${index}`}>{paragraph}</p>)}
      </div>}
      {isDisplayValue(warranty) && <div className="pd-warranty-row"><PackageCheck size={20} aria-hidden="true" /><span>Bảo hành</span><strong>{normalizeTextValue(warranty)}</strong></div>}
      {specs.length > 0 && <div className="pd-spec-table-wrap"><table className="pd-spec-table">
        <caption>Thông số kỹ thuật của sản phẩm</caption><tbody>
          {specs.map((spec) => <tr key={`${spec.key}-${spec.label}`}><th scope="row">{spec.label}</th><td>{spec.value}</td></tr>)}
        </tbody></table></div>}
      {isDisplayValue(youtubeLink) && <a className="pd-video-link" href={youtubeLink} target="_blank" rel="noreferrer">
        <span className="pd-video-icon"><Play size={18} fill="currentColor" aria-hidden="true" /></span>
        <span><small>VIDEO SẢN PHẨM</small><strong>Xem nội dung trên YouTube</strong></span><ExternalLink size={17} aria-hidden="true" />
      </a>}
    </section>
  );
}

function RelatedProductCard({ product }) {
  const image = normalizeImages(product)[0];
  const price = formatPrice(product.price);
  const originalPriceValue = toNumber(product.original_price ?? product.originalPrice);
  const originalPrice = formatPrice(originalPriceValue);
  const discount = toNumber(product.discount) ?? 0;
  const specs = normalizeSpecs(product).slice(0, 2);
  return <Link to={`/product/${product.id}`} className="pd-related-card">
    <div className="pd-related-image">{discount > 0 && <span>-{Math.round(discount)}%</span>}
      {image ? <img src={image} alt={product.name} loading="lazy" decoding="async" /> : <ImageOff size={24} aria-hidden="true" />}
    </div>
    <div className="pd-related-copy"><h3>{product.name}</h3>
      {specs.length > 0 && <div className="pd-related-specs">{specs.map((spec) => <span key={`${product.id}-${spec.key}`}>{spec.value}</span>)}</div>}
      <div className="pd-related-price"><strong>{price ?? 'Liên hệ'}</strong>
        {originalPrice && originalPriceValue > toNumber(product.price) && <del>{originalPrice}</del>}
      </div>
    </div><ChevronRight className="pd-related-arrow" size={18} aria-hidden="true" />
  </Link>;
}

function RelatedProducts({ products }) {
  if (products.length === 0) return null;
  return <aside className="pd-panel pd-related" aria-labelledby="related-heading">
    <div className="pd-section-heading pd-section-heading--compact"><div><p className="pd-kicker">CÙNG PHÂN KHÚC</p><h2 id="related-heading">Sản phẩm tương tự</h2></div></div>
    <div className="pd-related-list">{products.map((product) => <RelatedProductCard product={product} key={product.id} />)}</div>
  </aside>;
}

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addRecentlyViewed, addToCart, isCompared, isWishlisted, toggleCompare, toggleWishlist } = useCommerce();
  const [product, setProduct] = useState(null);
  const [category, setCategory] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [retryKey, setRetryKey] = useState(0);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    let ignore = false;
    async function fetchProduct() {
      setLoading(true); setFetchError(null); setNotFound(false); setProduct(null);
      setCategory(null); setRelatedProducts([]); setQuantity(1);
      try {
        const { data: productData, error: productError } = await supabase.from('products').select('*').eq('id', id).maybeSingle();
        if (productError) throw productError;
        if (!productData) { if (!ignore) setNotFound(true); return; }
        if (!ignore) setProduct(productData);
        const categoryPromise = productData.category_id
          ? supabase.from('categories').select('*').eq('id', productData.category_id).maybeSingle()
          : Promise.resolve({ data: null, error: null });
        const relatedPromise = productData.category_id
          ? supabase.from('products').select('*').eq('category_id', productData.category_id)
            .neq('id', productData.id).order('sort_order', { ascending: true }).limit(4)
          : Promise.resolve({ data: [], error: null });
        const [categoryResult, relatedResult] = await Promise.all([categoryPromise, relatedPromise]);
        if (ignore) return;
        if (!categoryResult.error) setCategory(categoryResult.data);
        if (!relatedResult.error) setRelatedProducts(relatedResult.data ?? []);
      } catch (error) {
        if (!ignore) { console.error('Error fetching product:', error); setFetchError(error); }
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    fetchProduct();
    return () => { ignore = true; };
  }, [id, retryKey]);

  useEffect(() => {
    if (product) addRecentlyViewed(product);
  }, [addRecentlyViewed, product]);

  const images = useMemo(() => normalizeImages(product), [product]);
  const specs = useMemo(() => normalizeSpecs(product), [product]);
  const promotions = useMemo(() => normalizePromotions(product), [product]);
  const description = useMemo(() => normalizeDescription(product), [product]);

  if (loading) return <ProductDetailSkeleton />;
  if (fetchError || notFound || !product) {
    return <ProductDetailError notFound={notFound || (!fetchError && !product)} onRetry={() => setRetryKey((value) => value + 1)} />;
  }

  const priceValue = toNumber(product.price);
  const originalPriceValue = toNumber(product.original_price ?? product.originalPrice);
  const computedDiscount = priceValue !== null && originalPriceValue !== null && originalPriceValue > priceValue
    ? ((originalPriceValue - priceValue) / originalPriceValue) * 100 : 0;
  const discount = Math.max(0, toNumber(product.discount) ?? computedDiscount);
  const price = formatPrice(priceValue);
  const originalPrice = originalPriceValue !== null && priceValue !== null && originalPriceValue > priceValue ? formatPrice(originalPriceValue) : null;
  const saving = originalPriceValue !== null && priceValue !== null && originalPriceValue > priceValue ? formatPrice(originalPriceValue - priceValue) : null;
  const stockState = getStockState(product.stock_quantity ?? product.stock ?? product.inventory ?? product.quantity);
  const categoryName = getCategoryName(product, category);
  const productBadges = getProductBadges(product, discount);
  const rating = product.rating ?? product.average_rating;
  const reviewCount = product.review_count ?? product.reviews_count;
  const views = formatCount(product.views ?? product.view_count);
  const warranty = product.warranty ?? (isDisplayValue(product.warranty_months) ? `${product.warranty_months} tháng` : null);
  const sku = product.sku ?? product.code ?? product.id;
  const identifierLabel = product.sku ? 'SKU' : product.code ? 'CODE' : 'ID';
  const canPurchase = isCommerceProductPurchasable(product) && stockState?.available !== false;
  const maxQuantity = stockState?.count && stockState.count > 0 ? stockState.count : Number.POSITIVE_INFINITY;
  const seoDescription = createSeoDescription(product, specs, description);
  const primaryImage = images[0];
  const wished = isWishlisted(product.id);
  const compared = isCompared(product.id);

  const buyNow = () => {
    addToCart(product, quantity);
    navigate('/checkout');
  };

  return <>
    <Helmet>
      <title>{product.name} | Laptop World</title>
      <meta name="description" content={seoDescription} />
      <meta property="og:title" content={`${product.name} | Laptop World`} />
      <meta property="og:description" content={seoDescription} />
      {primaryImage && <meta property="og:image" content={primaryImage} />}
    </Helmet>
    <div className="pd-page">
      <div className="pd-grid-overlay" aria-hidden="true" />
      <div className="pd-container">
        <nav className="pd-breadcrumb" aria-label="Đường dẫn điều hướng">
          <Link to="/">Trang chủ</Link><ChevronRight size={14} aria-hidden="true" />
          {product.category_id ? <Link to={`/category/${product.category_id}`}>{categoryName ?? product.category_id}</Link>
            : categoryName && <span>{categoryName}</span>}
          <ChevronRight size={14} aria-hidden="true" /><span aria-current="page">{product.name}</span>
        </nav>

        <div className="pd-hero">
          <ProductGallery key={product.id} images={images} name={product.name} discount={discount} />
          <section className="pd-panel pd-purchase" aria-labelledby="product-title">
            <div className="pd-eyebrow-row">
              {categoryName && <Link to={product.category_id ? `/category/${product.category_id}` : '/products'} className="pd-category-pill">
                <CircuitBoard size={14} aria-hidden="true" /> {categoryName}
              </Link>}
              {stockState && <span className={`pd-stock ${stockState.available ? 'is-available' : 'is-unavailable'}`}>
                <span aria-hidden="true" /> {stockState.label}
              </span>}
            </div>
            {productBadges.length > 0 && <div className="pd-badges" aria-label="Nhãn sản phẩm">
              {productBadges.map(({ label, tone, Icon }) => <span className={`pd-badge pd-badge--${tone}`} key={label}>
                <Icon size={13} aria-hidden="true" /> {label}
              </span>)}
            </div>}
            <div className="pd-save-actions" aria-label="Lưu và so sánh sản phẩm">
              <button type="button" className={`pd-button pd-button--ghost ${wished ? 'is-active' : ''}`} onClick={() => toggleWishlist(product)} aria-pressed={wished}>
                <Heart size={16} fill={wished ? 'currentColor' : 'none'} aria-hidden="true" /> {wished ? 'Đã yêu thích' : 'Yêu thích'}
              </button>
              <button type="button" className={`pd-button pd-button--ghost ${compared ? 'is-active' : ''}`} onClick={() => toggleCompare(product)} aria-pressed={compared}>
                <Scale size={16} aria-hidden="true" /> {compared ? 'Đang so sánh' : 'So sánh'}
              </button>
            </div>
            <h1 id="product-title">{product.name}</h1>
            <div className="pd-meta-row">
              {isDisplayValue(sku) && <span className="pd-sku">{identifierLabel} // {sku}</span>}
              <Rating rating={rating} reviewCount={reviewCount} />
              {views && <span className="pd-views">{views} lượt xem</span>}
            </div>
            <QuickSpecs specs={specs} />
            <div className="pd-price-panel"><div><span className="pd-price-label">Giá sản phẩm</span>
              <div className="pd-price-line"><strong>{price ?? 'Liên hệ'}</strong>{originalPrice && <del>{originalPrice}</del>}</div>
            </div>{saving && <div className="pd-saving"><span>Tiết kiệm</span><strong>{saving}</strong></div>}</div>
            {isDisplayValue(warranty) && <div className="pd-inline-info"><PackageCheck size={18} aria-hidden="true" /><span>Bảo hành</span><strong>{normalizeTextValue(warranty)}</strong></div>}
            <PromotionList promotions={promotions} />
            <div className="pd-purchase-actions">
              <div className="pd-quantity" aria-label="Số lượng sản phẩm">
                <button type="button" onClick={() => setQuantity((value) => Math.max(1, value - 1))}
                  disabled={quantity <= 1 || !canPurchase} aria-label="Giảm số lượng"><Minus size={17} aria-hidden="true" /></button>
                <span aria-live="polite">{quantity}</span>
                <button type="button" onClick={() => setQuantity((value) => Math.min(maxQuantity, value + 1))}
                  disabled={quantity >= maxQuantity || !canPurchase} aria-label="Tăng số lượng"><Plus size={17} aria-hidden="true" /></button>
              </div>
              <button type="button" className="pd-button pd-button--primary pd-add-cart" disabled={!canPurchase} onClick={() => addToCart(product, quantity)}>
                <ShoppingCart size={19} aria-hidden="true" /><span>{canPurchase ? 'Thêm vào giỏ' : 'Hết hàng'}</span>
              </button>
            </div>
            <button type="button" className="pd-button pd-button--buy" disabled={!canPurchase} onClick={buyNow}>
              <Zap size={19} fill="currentColor" aria-hidden="true" /><span>{canPurchase ? 'Mua ngay' : 'Sản phẩm đang hết hàng'}</span>
            </button>
            {specs.length > 0 && <a href="#product-information" className="pd-spec-link">Xem toàn bộ thông số <ChevronRight size={15} aria-hidden="true" /></a>}
          </section>
        </div>

        <div className={`pd-detail-layout ${relatedProducts.length === 0 ? 'pd-detail-layout--single' : ''}`}>
          <ProductInformation description={description} specs={specs} warranty={warranty}
            youtubeLink={product.youtube_link ?? product.youtubeUrl} />
          <RelatedProducts products={relatedProducts} />
        </div>
      </div>
      <div className="pd-mobile-bar"><div><span>Giá sản phẩm</span><strong>{price ?? 'Liên hệ'}</strong></div>
        <button type="button" className="pd-button pd-button--primary" disabled={!canPurchase} onClick={() => addToCart(product, quantity)}>
          <ShoppingCart size={18} aria-hidden="true" /> {canPurchase ? 'Thêm vào giỏ' : 'Hết hàng'}
        </button>
      </div>
    </div>
  </>;
}
