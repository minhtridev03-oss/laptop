import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  Box,
  Check,
  CheckCircle2,
  ChevronRight,
  CircuitBoard,
  Copy,
  Cpu,
  Fan,
  HardDrive,
  LoaderCircle,
  MemoryStick,
  MonitorCog,
  PackagePlus,
  RotateCcw,
  Search,
  ShieldCheck,
  ShoppingCart,
  Sparkles,
  WalletCards,
  X,
  Zap,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { formatCommercePrice, toCommerceProduct } from '../lib/commerce';
import { useCommerce } from '../context/CommerceContext';
import {
  BUILDER_PRESETS,
  getBuilderSpec,
  getCandidateConflict,
  getCompatibilityIssues,
  getPartHighlights,
  PC_BUILD_SLOTS,
  PC_BUILD_STORAGE_KEY,
  recommendedPsuWattage,
  estimateSystemPower,
} from '../lib/pcBuilder';

const SLOT_ICONS = {
  cpu: Cpu,
  mainboard: CircuitBoard,
  ram: MemoryStick,
  gpu: MonitorCog,
  storage: HardDrive,
  psu: Zap,
  case: Box,
  cooler: Fan,
};

const readSavedBuild = () => {
  try {
    const shared = new URLSearchParams(window.location.search).get('build');
    if (shared) return JSON.parse(window.atob(shared));
    const saved = JSON.parse(window.localStorage.getItem(PC_BUILD_STORAGE_KEY));
    return saved && typeof saved === 'object' ? saved : {};
  } catch {
    return {};
  }
};

function ProductVisual({ className, icon: Icon, iconSize = 22, product }) {
  const [imageFailed, setImageFailed] = useState(false);
  const imageUrl = product?.image_url?.trim();

  useEffect(() => {
    setImageFailed(false);
  }, [imageUrl]);

  return (
    <span className={`grid shrink-0 place-items-center overflow-hidden rounded-lg border ${imageUrl && !imageFailed ? 'border-primary/20 bg-[#f3f0e8]' : 'border-primary/20 bg-primary/[0.06] text-primary'} ${className}`}>
      {imageUrl && !imageFailed ? (
        <img
          src={imageUrl}
          alt={product.name}
          className="h-full w-full object-contain p-2"
          loading="lazy"
          decoding="async"
          onError={() => setImageFailed(true)}
        />
      ) : (
        <Icon size={iconSize} strokeWidth={1.6} aria-hidden="true" />
      )}
    </span>
  );
}

function PartPicker({ catalog, onClose, onSelect, openSlot, selections }) {
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (!openSlot) return undefined;
    setQuery('');
    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event) => event.key === 'Escape' && onClose();
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose, openSlot]);

  if (!openSlot) return null;
  const SlotIcon = SLOT_ICONS[openSlot.id];
  const normalizedQuery = query.trim().toLocaleLowerCase('vi');
  const products = catalog
    .filter((product) => product.specifications?.component_type === openSlot.id)
    .filter((product) => !normalizedQuery || product.name.toLocaleLowerCase('vi').includes(normalizedQuery))
    .sort((a, b) => Number(a.price) - Number(b.price));

  return createPortal(
    <div className="fixed inset-0 z-[210] flex justify-end bg-black/75 backdrop-blur-sm" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="flex h-full w-full max-w-2xl flex-col border-l border-primary/20 bg-[#0d0c0a] shadow-[-30px_0_80px_rgba(0,0,0,0.55)]" role="dialog" aria-modal="true" aria-labelledby="part-picker-title">
        <div className="flex items-start justify-between border-b border-border-subtle p-5 sm:p-6">
          <div className="flex gap-4">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg border border-primary/30 bg-primary/[0.08] text-primary-hover"><SlotIcon size={21} aria-hidden="true" /></span>
            <div><p className="luxury-eyebrow mb-1">CHỌN LINH KIỆN</p><h2 id="part-picker-title" className="luxury-heading text-xl">{openSlot.label}</h2></div>
          </div>
          <button type="button" onClick={onClose} className="luxury-icon-button grid h-10 w-10 place-items-center rounded-lg" aria-label="Đóng danh sách linh kiện"><X size={18} aria-hidden="true" /></button>
        </div>

        <div className="border-b border-border-subtle p-4 sm:px-6">
          <label className="luxury-search relative block rounded-lg">
            <Search size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/70" aria-hidden="true" />
            <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} autoFocus placeholder={`Tìm ${openSlot.shortLabel.toLocaleLowerCase('vi')}...`} className="min-h-12 w-full bg-transparent pl-11 pr-4 text-sm text-text-main outline-none placeholder:text-text-muted/65" aria-label={`Tìm ${openSlot.label}`} />
          </label>
        </div>

        <div className="custom-scrollbar flex-1 space-y-3 overflow-y-auto p-4 sm:p-6">
          {products.length === 0 ? (
            <div className="grid min-h-56 place-items-center rounded-lg border border-dashed border-border-subtle text-center"><div><PackagePlus size={32} className="mx-auto mb-3 text-primary" aria-hidden="true" /><p className="font-semibold text-text-main">Chưa có linh kiện phù hợp</p><p className="mt-1 text-sm text-text-muted">Hãy kiểm tra dữ liệu sản phẩm hoặc thử từ khóa khác.</p></div></div>
          ) : products.map((product) => {
            const conflict = getCandidateConflict(openSlot.id, product, selections);
            const selected = selections[openSlot.id]?.id === product.id;
            return (
              <article key={product.id} className={`rounded-lg border p-4 transition-colors ${selected ? 'border-primary/55 bg-primary/[0.08]' : conflict ? 'border-border-subtle bg-bg-card/45 opacity-65' : 'border-border-subtle bg-bg-card/70 hover:border-primary/35'}`}>
                <div className="flex gap-4">
                  <ProductVisual className="h-20 w-24" icon={SlotIcon} iconSize={24} product={product} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
                      <div><p className="text-[10px] font-bold uppercase tracking-[0.08em] text-primary/80">{product.brand || 'Linh kiện'} · {getBuilderSpec(product, 'builder_tier', 'custom')}</p><h3 className="mt-1 font-['Sora'] text-sm font-semibold leading-6 text-text-main">{product.name}</h3></div>
                      <p className="shrink-0 font-['Sora'] text-sm font-bold text-primary-hover">{formatCommercePrice(product.price)}</p>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">{getPartHighlights(product).map((item) => <span key={item} className="luxury-chip rounded px-2 py-1 text-[10px]">{item}</span>)}</div>
                    {conflict && <p className="mt-3 flex items-start gap-2 text-xs leading-5 text-[#e7958d]"><AlertTriangle size={14} className="mt-0.5 shrink-0" aria-hidden="true" />{conflict}</p>}
                    <button type="button" disabled={Boolean(conflict)} onClick={() => onSelect(openSlot.id, product)} className={`mt-4 inline-flex min-h-10 items-center gap-2 rounded-md px-4 text-xs font-bold uppercase tracking-[0.06em] ${selected ? 'border border-primary/35 text-primary-hover' : 'luxury-primary-button disabled:cursor-not-allowed disabled:opacity-40'}`}>{selected ? <Check size={15} aria-hidden="true" /> : <ChevronRight size={15} aria-hidden="true" />}{selected ? 'Đang chọn' : 'Chọn linh kiện'}</button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>,
    document.body,
  );
}

export default function PcBuilder() {
  const navigate = useNavigate();
  const { addToCart } = useCommerce();
  const [catalog, setCatalog] = useState([]);
  const [selectedIds, setSelectedIds] = useState({});
  const [openSlot, setOpenSlot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hydrated, setHydrated] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let ignore = false;
    supabase
      .from('products')
      .select('*')
      .eq('category_id', 'linh-kien')
      .eq('status', 'active')
      .order('sort_order', { ascending: true })
      .then(({ data, error: fetchError }) => {
        if (ignore) return;
        if (fetchError) setError(fetchError);
        const builderProducts = (data ?? []).filter((product) => product.specifications?.component_type);
        setCatalog(builderProducts);
        const availableIds = new Set(builderProducts.map((product) => product.id));
        const saved = readSavedBuild();
        setSelectedIds(Object.fromEntries(Object.entries(saved).filter(([, id]) => availableIds.has(id))));
        setHydrated(true);
        setLoading(false);
      });
    return () => { ignore = true; };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(PC_BUILD_STORAGE_KEY, JSON.stringify(selectedIds));
  }, [hydrated, selectedIds]);

  const productMap = useMemo(() => new Map(catalog.map((product) => [product.id, product])), [catalog]);
  const selections = useMemo(() => Object.fromEntries(PC_BUILD_SLOTS.map((slot) => [slot.id, productMap.get(selectedIds[slot.id]) ?? null])), [productMap, selectedIds]);
  const selectedProducts = useMemo(() => PC_BUILD_SLOTS.map((slot) => selections[slot.id]).filter(Boolean), [selections]);
  const total = selectedProducts.reduce((sum, product) => sum + Number(product.price || 0), 0);
  const issues = useMemo(() => getCompatibilityIssues(selections), [selections]);
  const errors = issues.filter((issue) => issue.tone === 'error');
  const selectedRequired = PC_BUILD_SLOTS.filter((slot) => slot.required && selections[slot.id]).length;
  const requiredCount = PC_BUILD_SLOTS.filter((slot) => slot.required).length;
  const isReady = selectedRequired === requiredCount && errors.length === 0;
  const estimatedPower = estimateSystemPower(selections);
  const recommendedPower = recommendedPsuWattage(selections);

  const selectPart = (slotId, product) => {
    setSelectedIds((current) => ({ ...current, [slotId]: product.id }));
    setOpenSlot(null);
  };

  const removePart = (slotId) => setSelectedIds((current) => {
    const next = { ...current };
    delete next[slotId];
    return next;
  });

  const applyPreset = (tier) => {
    const next = {};
    PC_BUILD_SLOTS.forEach((slot) => {
      const product = catalog.find((item) => item.specifications?.component_type === slot.id && item.specifications?.builder_tier === tier);
      if (product) next[slot.id] = product.id;
    });
    setSelectedIds(next);
  };

  const presetTotal = (tier) => catalog
    .filter((product) => product.specifications?.builder_tier === tier)
    .reduce((sum, product) => sum + Number(product.price || 0), 0);

  const copyBuild = async () => {
    const url = new URL(window.location.href);
    url.searchParams.set('build', window.btoa(JSON.stringify(selectedIds)));
    try {
      await navigator.clipboard.writeText(url.toString());
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      setCopied(false);
    }
  };

  const addBuildToCart = () => {
    selectedProducts.forEach((product) => addToCart(toCommerceProduct(product), 1));
    navigate('/cart');
  };

  return (
    <>
      <Helmet><title>Build PC theo nhu cầu | Laptop World</title><meta name="description" content="Tự chọn linh kiện, kiểm tra tương thích và dự toán cấu hình PC tại Laptop World." /></Helmet>
      <section className="luxury-page-section mx-auto min-h-[75vh] w-full max-w-[1440px] px-4 py-9 lg:px-6 lg:py-12">
        <div className="mb-8 grid gap-5 border-b border-border-subtle pb-7 lg:grid-cols-[1fr_auto] lg:items-end">
          <div><p className="luxury-eyebrow mb-3">PC CONFIGURATOR</p><h1 className="luxury-heading text-3xl sm:text-4xl">Tự build PC của bạn</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-text-muted">Chọn từng linh kiện, hệ thống tự kiểm tra tương thích và dự toán công suất trước khi thêm toàn bộ cấu hình vào giỏ hàng.</p></div>
          <div className="flex flex-wrap gap-2"><button type="button" onClick={copyBuild} disabled={selectedProducts.length === 0} className="flex min-h-11 items-center gap-2 rounded-md border border-border-subtle bg-bg-card px-4 text-xs font-bold uppercase tracking-[0.06em] text-text-main hover:border-primary/40 hover:text-primary-hover disabled:opacity-40">{copied ? <Check size={16} className="text-[#9ed1ad]" aria-hidden="true" /> : <Copy size={16} className="text-primary" aria-hidden="true" />}{copied ? 'Đã sao chép' : 'Chia sẻ cấu hình'}</button><button type="button" onClick={() => setSelectedIds({})} disabled={selectedProducts.length === 0} className="flex min-h-11 items-center gap-2 rounded-md border border-border-subtle bg-bg-card px-4 text-xs font-bold uppercase tracking-[0.06em] text-text-main hover:border-primary/40 hover:text-primary-hover disabled:opacity-40"><RotateCcw size={16} className="text-primary" aria-hidden="true" /> Làm mới</button></div>
        </div>

        <div className="luxury-panel mb-7 rounded-[10px] p-5 lg:p-6">
          <div className="mb-5"><p className="luxury-eyebrow mb-2">CẤU HÌNH GỢI Ý</p><h2 className="luxury-heading text-lg">Chọn nhanh theo phân khúc</h2></div>
          <div className="grid gap-3 md:grid-cols-3">
            {BUILDER_PRESETS.map((preset) => (
              <button key={preset.id} type="button" onClick={() => applyPreset(preset.id)} disabled={!catalog.some((product) => product.specifications?.builder_tier === preset.id)} className="group rounded-lg border border-border-subtle bg-bg-main/60 p-4 text-left transition-all hover:-translate-y-0.5 hover:border-primary/45 disabled:opacity-45">
                <span className="flex items-center justify-between"><span className="font-['Sora'] text-sm font-bold text-text-main group-hover:text-primary-hover">{preset.label}</span><Sparkles size={16} className="text-primary" aria-hidden="true" /></span>
                <span className="mt-2 block text-xs leading-5 text-text-muted">{preset.description}</span>
                <span className="mt-3 block font-['JetBrains_Mono'] text-xs font-bold text-primary-hover">{presetTotal(preset.id) ? formatCommercePrice(presetTotal(preset.id)) : 'Chờ dữ liệu'}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="grid items-start gap-7 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-3">
            {loading ? [0, 1, 2, 3, 4, 5, 6].map((item) => <div key={item} className="luxury-panel h-32 animate-pulse rounded-[10px]" />) : PC_BUILD_SLOTS.map((slot, index) => {
              const product = selections[slot.id];
              const SlotIcon = SLOT_ICONS[slot.id];
              return (
                <article key={slot.id} className={`luxury-panel rounded-[10px] p-4 sm:p-5 ${product ? 'border-primary/25' : ''}`}>
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                    <div className="flex min-w-0 flex-1 items-center gap-4">
                      <span className="font-['JetBrains_Mono'] text-xs text-primary/65">{String(index + 1).padStart(2, '0')}</span>
                      <ProductVisual className={product ? 'h-20 w-24 sm:h-24 sm:w-28' : 'h-12 w-12'} icon={SlotIcon} product={product} />
                      <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h2 className="font-['Sora'] text-sm font-bold text-text-main">{slot.label}</h2><span className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.06em] ${slot.required ? 'bg-primary/10 text-primary' : 'bg-bg-main text-text-muted'}`}>{slot.required ? 'Bắt buộc' : 'Tùy chọn'}</span></div>{product ? <><p className="mt-2 line-clamp-2 text-sm font-semibold leading-6 text-text-main">{product.name}</p><div className="mt-2 flex flex-wrap gap-2">{getPartHighlights(product).map((item) => <span key={item} className="luxury-chip rounded px-2 py-1 text-[9px]">{item}</span>)}</div></> : <p className="mt-1 text-sm text-text-muted">Chưa chọn {slot.shortLabel.toLocaleLowerCase('vi')}</p>}</div>
                    </div>
                    <div className="flex shrink-0 items-center justify-between gap-3 sm:justify-end">{product && <p className="font-['Sora'] text-sm font-bold text-primary-hover">{formatCommercePrice(product.price)}</p>}<button type="button" onClick={() => setOpenSlot(slot)} className={`${product ? 'border border-primary/30 text-primary-hover hover:bg-primary/10' : 'luxury-primary-button'} inline-flex min-h-10 items-center gap-2 rounded-md px-4 text-xs font-bold uppercase tracking-[0.06em]`}>{product ? 'Thay đổi' : 'Chọn'} <ChevronRight size={15} aria-hidden="true" /></button>{product && <button type="button" onClick={() => removePart(slot.id)} className="grid h-10 w-10 place-items-center rounded-md border border-border-subtle text-text-muted hover:border-[#d56f66]/40 hover:text-[#e7958d]" aria-label={`Bỏ ${product.name}`}><X size={16} aria-hidden="true" /></button>}</div>
                  </div>
                </article>
              );
            })}

            {!loading && (error || catalog.length === 0) && <div className="rounded-lg border border-[#d6b873]/25 bg-primary/[0.05] p-5 text-sm leading-6 text-text-muted"><AlertTriangle size={20} className="mb-3 text-primary" aria-hidden="true" /><strong className="block text-text-main">Dữ liệu Build PC chưa sẵn sàng</strong>Hãy chạy migration danh mục Build PC để nạp các linh kiện mẫu và thuộc tính tương thích.</div>}
          </div>

          <aside className="luxury-panel rounded-[10px] p-5 lg:sticky lg:top-40 lg:p-6" aria-label="Tóm tắt cấu hình">
            <p className="luxury-eyebrow mb-2">TÓM TẮT BUILD</p><h2 className="luxury-heading text-xl">Cấu hình của bạn</h2>
            <div className="my-5 grid grid-cols-3 gap-2">
              <div className="rounded-lg border border-border-subtle bg-bg-main/60 p-3 text-center"><p className="font-['JetBrains_Mono'] text-lg font-bold text-primary-hover">{selectedProducts.length}/8</p><p className="mt-1 text-[9px] uppercase tracking-[0.06em] text-text-muted">Linh kiện</p></div>
              <div className="rounded-lg border border-border-subtle bg-bg-main/60 p-3 text-center"><p className="font-['JetBrains_Mono'] text-lg font-bold text-primary-hover">{estimatedPower || 0}W</p><p className="mt-1 text-[9px] uppercase tracking-[0.06em] text-text-muted">Ước tính</p></div>
              <div className="rounded-lg border border-border-subtle bg-bg-main/60 p-3 text-center"><p className="font-['JetBrains_Mono'] text-lg font-bold text-primary-hover">{recommendedPower || 0}W</p><p className="mt-1 text-[9px] uppercase tracking-[0.06em] text-text-muted">Nguồn nên dùng</p></div>
            </div>

            <div className="space-y-2 border-y border-border-subtle py-4">
              {issues.length === 0 && selectedProducts.length > 0 ? <p className="flex items-start gap-2 text-sm leading-5 text-[#9ed1ad]"><CheckCircle2 size={17} className="mt-0.5 shrink-0" aria-hidden="true" />Các linh kiện đang chọn tương thích với nhau.</p> : issues.map((issue) => <p key={issue.code} className={`flex items-start gap-2 text-xs leading-5 ${issue.tone === 'error' ? 'text-[#e7958d]' : 'text-[#d8bd7b]'}`}>{issue.tone === 'error' ? <AlertTriangle size={15} className="mt-0.5 shrink-0" aria-hidden="true" /> : <ShieldCheck size={15} className="mt-0.5 shrink-0" aria-hidden="true" />}{issue.message}</p>)}
              {selectedProducts.length === 0 && <p className="text-sm leading-6 text-text-muted">Bắt đầu bằng CPU hoặc chọn nhanh một cấu hình gợi ý.</p>}
            </div>

            <div className="py-5"><div className="flex items-center justify-between text-sm text-text-muted"><span className="flex items-center gap-2"><WalletCards size={17} className="text-primary" aria-hidden="true" /> Tổng dự toán</span><span className="font-['Sora'] text-xl font-bold text-primary-hover">{total ? formatCommercePrice(total) : '0 ₫'}</span></div><p className="mt-2 text-[10px] leading-5 text-text-muted">Giá lấy trực tiếp từ dữ liệu sản phẩm và có thể thay đổi theo thời điểm.</p></div>
            <button type="button" onClick={addBuildToCart} disabled={!isReady} className="luxury-primary-button flex min-h-12 w-full items-center justify-center gap-2 rounded-md text-xs font-bold uppercase tracking-[0.08em] disabled:cursor-not-allowed disabled:opacity-40"><ShoppingCart size={17} aria-hidden="true" /> Thêm cấu hình vào giỏ</button>
          </aside>
        </div>
      </section>

      <PartPicker catalog={catalog} onClose={() => setOpenSlot(null)} onSelect={selectPart} openSlot={openSlot} selections={selections} />
    </>
  );
}
