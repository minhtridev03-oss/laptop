import { useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { Award, BarChart3, CheckCircle2, ImageOff, Info, PackagePlus, Scale, ShieldCheck, ShoppingBag, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useCommerce } from '../context/CommerceContext';
import { formatCommercePrice } from '../lib/commerce';
import { COMPARISON_MODES, extractDisplayInfo, getComparableSpecValue, scoreComparison } from '../lib/comparison';

const SPEC_LABELS = { cpu: 'Bộ xử lý', ram: 'RAM', storage: 'Lưu trữ', gpu: 'Card đồ họa' };

const PANEL_LABELS = { oled: 'OLED', qled: 'QLED / Mini-LED', ips: 'IPS', va: 'VA', tn: 'TN' };
const RES_LABELS = { 'uhd4k': '4K UHD', '2.8k': '2.8K', qhd: '2K QHD', fhd: 'Full HD', hd: 'HD' };

const INSIGHT_COLORS = { good: 'text-[#9ed1ad]', warn: 'text-[#d9a48d]', info: 'text-text-muted' };
const INSIGHT_BG = { good: 'bg-[#79b88d]/[0.08] border-[#79b88d]/25', warn: 'bg-[#c58b72]/[0.08] border-[#c58b72]/25', info: 'bg-primary/[0.05] border-primary/20' };

export default function Compare() {
  const { t } = useTranslation();
  const { addToCart, compare, toggleCompare } = useCommerce();
  const [mode, setMode] = useState('overall');
  const specKeys = useMemo(() => [...new Set(compare.flatMap((product) => Object.keys(product.specs ?? {}).filter((key) => product.specs[key])))], [compare]);
  const activeMode = COMPARISON_MODES.find((item) => item.id === mode) ?? COMPARISON_MODES[0];
  const scoredProducts = useMemo(() => scoreComparison(compare, mode), [compare, mode]);
  const scoreById = useMemo(() => new Map(scoredProducts.map((item) => [item.id, item])), [scoredProducts]);
  const winner = compare.find((product) => product.id === scoredProducts[0]?.id);
  const lowestPrice = Math.min(...compare.map((product) => Number(product.price) || Number.POSITIVE_INFINITY));
  const bestSpecValues = useMemo(() => Object.fromEntries(specKeys.map((key) => [
    key,
    Math.max(...compare.map((product) => getComparableSpecValue(key, product.specs?.[key]))),
  ])), [compare, specKeys]);
  const displayInfoMap = useMemo(() => new Map(compare.map((p) => [p.id, extractDisplayInfo(p)])), [compare]);

  return (
    <>
      <Helmet><title>{t('compare.title')} | Laptop World</title></Helmet>
      <section className="luxury-page-section mx-auto min-h-[70vh] w-full max-w-[1440px] px-4 py-10 lg:px-6 lg:py-14">
        <div className="mb-8 border-b border-border-subtle pb-6">
          <p className="luxury-eyebrow mb-3">{t('compare.eyebrow')}</p>
          <h1 className="luxury-heading flex items-center gap-3 text-3xl"><Scale className="text-primary" aria-hidden="true" /> {t('compare.title')}</h1>
          <p className="mt-2 text-sm text-text-muted">Chọn tối đa 4 sản phẩm để đối chiếu thông số, mức giá và điểm phù hợp theo nhu cầu.</p>
        </div>

        {compare.length === 0 ? (
          <div className="luxury-panel mx-auto max-w-2xl rounded-[10px] px-6 py-16 text-center">
            <PackagePlus size={42} className="mx-auto mb-5 text-primary" aria-hidden="true" />
            <h2 className="luxury-heading mb-2 text-xl">{t('compare.empty_title')}</h2>
            <p className="mb-7 text-sm text-text-muted">{t('compare.empty_desc')}</p>
            <Link to="/products" className="luxury-primary-button inline-flex min-h-11 items-center rounded-md px-6 text-xs font-bold uppercase tracking-[0.08em]">{t('compare.add_product')}</Link>
          </div>
        ) : (
          <>
            <div className="luxury-panel mb-6 rounded-[10px] p-5 lg:p-6">
              <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-center">
                <div>
                  <p className="luxury-eyebrow mb-2">MỤC ĐÍCH SỬ DỤNG</p>
                  <h2 className="luxury-heading text-lg">Chấm điểm theo nhu cầu của bạn</h2>
                  <p className="mt-2 text-sm text-text-muted">{activeMode.description}</p>
                </div>
                <div className="flex flex-wrap gap-2" role="tablist" aria-label="Chọn nhu cầu so sánh">
                  {COMPARISON_MODES.map((item) => (
                    <button key={item.id} type="button" role="tab" aria-selected={mode === item.id} onClick={() => setMode(item.id)} className={`min-h-10 rounded-md border px-4 text-xs font-bold uppercase tracking-[0.06em] transition-colors ${mode === item.id ? 'border-primary/55 bg-primary/15 text-primary-hover' : 'border-border-subtle bg-bg-main/60 text-text-muted hover:border-primary/35 hover:text-text-main'}`}>
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {compare.length >= 2 && winner && (
                <div className="mt-5 grid gap-4 border-t border-border-subtle pt-5 md:grid-cols-[auto_1fr_auto] md:items-center">
                  <span className="grid h-12 w-12 place-items-center rounded-xl border border-primary/30 bg-primary/[0.08] text-primary-hover"><Award size={23} aria-hidden="true" /></span>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.08em] text-primary">Phù hợp nhất · {activeMode.label}</p>
                    <p className="mt-1 line-clamp-2 font-['Be_Vietnam_Pro'] text-sm font-semibold text-text-main">{winner.name}</p>
                  </div>
                  <span className="font-['JetBrains_Mono'] text-2xl font-bold text-primary-hover">{scoredProducts[0].score}<small className="text-xs text-text-muted">/100</small></span>
                </div>
              )}

              <details className="mt-5 border-t border-border-subtle pt-4 text-sm text-text-muted">
                <summary className="flex cursor-pointer list-none items-center gap-2 font-semibold text-text-main hover:text-primary-hover"><Info size={16} className="text-primary" aria-hidden="true" /> Cách hệ thống tính điểm</summary>
                <p className="mt-3 max-w-4xl leading-6">Đây là đánh giá theo quy tắc, không sử dụng AI. Hệ thống quy đổi CPU, GPU, RAM và dung lượng lưu trữ thành điểm kỹ thuật; sau đó áp dụng trọng số của từng nhu cầu và cộng điểm hiệu quả trên giá bán. Thông số thiếu sẽ không được cộng điểm.</p>
              </details>
            </div>

            {compare.length < 2 && <div className="mb-5 rounded-md border border-primary/20 bg-primary/[0.05] px-4 py-3 text-sm text-text-muted">Thêm ít nhất một sản phẩm nữa để hệ thống đưa ra gợi ý tương đối chính xác hơn.</div>}
            <div className="overflow-x-auto rounded-[10px] border border-border-subtle">
              <table className="w-full table-fixed min-w-[760px] border-collapse bg-bg-card/75 text-sm">
                <caption className="sr-only">Bảng so sánh sản phẩm theo thông số và điểm phù hợp</caption>
                <thead>
                  <tr>
                    <th className="w-44 border-b border-r border-border-subtle p-4 text-left text-xs uppercase tracking-[0.08em] text-text-muted">Sản phẩm</th>
                    {compare.map((product) => (
                      <th key={product.id} scope="col" className="border-b border-r border-border-subtle p-4 text-left align-top last:border-r-0" style={{width: '280px', minWidth: '230px', maxWidth: '280px'}}>
                        <div className="relative mb-4 overflow-hidden rounded-md border border-border-subtle bg-bg-main" style={{height: '160px', width: '100%'}}>
                          {product.image 
                            ? <img src={product.image} alt={product.name} style={{position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', padding: '12px'}} />
                            : <ImageOff className="absolute inset-0 m-auto text-text-muted" aria-hidden="true" />}
                          <button type="button" onClick={() => toggleCompare(product)} className="absolute right-2 top-2 z-10 grid h-9 w-9 place-items-center rounded-md border border-border-subtle bg-bg-main/90 text-text-muted hover:text-[#d56f66]" aria-label={`Bỏ ${product.name} khỏi so sánh`}><X size={16} aria-hidden="true" /></button>
                        </div>
                        <Link to={`/product/${product.id}`} className="line-clamp-2 font-['Be_Vietnam_Pro'] text-sm font-semibold leading-6 text-text-main hover:text-primary-hover">{product.name}</Link>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <th scope="row" className="border-b border-r border-border-subtle p-4 text-left text-text-muted">Điểm phù hợp</th>
                    {compare.map((product) => {
                      const scored = scoreById.get(product.id);
                      const productScore = scored?.score ?? 0;
                      const isBest = compare.length >= 2 && product.id === scoredProducts[0]?.id;
                      const insights = scored?.insights ?? [];
                      return (
                        <td key={product.id} className={`border-b border-r border-border-subtle p-4 last:border-r-0 ${isBest ? 'bg-primary/[0.06]' : ''}`}>
                          <div className="mb-2 flex items-center justify-between gap-3">
                            <span className="font-['JetBrains_Mono'] text-xl font-bold text-primary-hover">{productScore}/100</span>
                            {isBest && <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.06em] text-primary"><Award size={13} aria-hidden="true" /> Dẫn đầu</span>}
                          </div>
                          <div className="h-1.5 overflow-hidden rounded-full bg-bg-main">
                            <span className="block h-full rounded-full bg-gradient-to-r from-[#b98d42] to-[#f1d58a]" style={{ width: `${productScore}%` }} />
                          </div>
                          {insights.length > 0 && (
                            <ul className="mt-3 space-y-1.5">
                              {insights.map((ins, i) => (
                                <li key={i} className={`flex items-start gap-1.5 rounded border px-2 py-1.5 text-[10px] leading-5 ${INSIGHT_BG[ins.type]}`}>
                                  <span className={`mt-0.5 shrink-0 font-bold ${INSIGHT_COLORS[ins.type]}`}>{ins.type === 'good' ? '✓' : ins.type === 'warn' ? '!' : 'i'}</span>
                                  <span className={INSIGHT_COLORS[ins.type]}>{ins.text}</span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                  <tr>
                    <th scope="row" className="border-b border-r border-border-subtle p-4 text-left text-text-muted">Giá bán</th>
                    {compare.map((product) => {
                      const isBest = compare.length >= 2 && Number(product.price) === lowestPrice;
                      return <td key={product.id} className={`border-b border-r border-border-subtle p-4 font-['Be_Vietnam_Pro'] font-bold text-primary-hover last:border-r-0 ${isBest ? 'bg-[#79b88d]/[0.06]' : ''}`}>{formatCommercePrice(product.price)}{isBest && <span className="mt-2 flex items-center gap-1 text-[10px] uppercase tracking-[0.06em] text-[#9ed1ad]"><CheckCircle2 size={13} aria-hidden="true" /> Giá thấp nhất</span>}</td>;
                    })}
                  </tr>
                  {specKeys.map((key) => (
                    <tr key={key}>
                      <th scope="row" className="border-b border-r border-border-subtle p-4 text-left text-text-muted">{SPEC_LABELS[key] ?? key}</th>
                      {compare.map((product) => {
                        const comparableValue = getComparableSpecValue(key, product.specs?.[key]);
                        const isBest = compare.length >= 2 && comparableValue > 0 && comparableValue === bestSpecValues[key];
                        return <td key={product.id} className={`border-b border-r border-border-subtle p-4 font-['JetBrains_Mono'] text-xs leading-6 text-text-main last:border-r-0 ${isBest ? 'bg-primary/[0.05]' : ''}`}>{product.specs?.[key] || '—'}{isBest && <span className="mt-2 flex items-center gap-1 font-['Inter'] text-[10px] font-bold uppercase tracking-[0.06em] text-primary"><BarChart3 size={13} aria-hidden="true" /> Thông số nổi bật</span>}</td>;
                      })}
                    </tr>
                  ))}

                  {/* Display row */}
                  {compare.some((p) => displayInfoMap.get(p.id)) && (
                    <tr>
                      <th scope="row" className="border-b border-r border-border-subtle p-4 text-left text-text-muted">Màn hình</th>
                      {compare.map((product) => {
                        const info = displayInfoMap.get(product.id);
                        const scored = scoreById.get(product.id);
                        const displayScore = scored?.components?.display ?? 0;
                        const bestDisplay = Math.max(...[...scoreById.values()].map((s) => s.components?.display ?? 0));
                        const isBest = compare.length >= 2 && displayScore > 0 && displayScore === bestDisplay;
                        return (
                          <td key={product.id} className={`border-b border-r border-border-subtle p-4 text-xs leading-6 last:border-r-0 ${isBest ? 'bg-primary/[0.05]' : ''}`}>
                            {info ? (
                              <div className="space-y-1 font-['JetBrains_Mono'] text-text-main">
                                {info.panel && <div><span className="text-text-muted">Tấm nền: </span>{PANEL_LABELS[info.panel] ?? info.panel.toUpperCase()}</div>}
                                {info.resolution && <div><span className="text-text-muted">Độ phân giải: </span>{RES_LABELS[info.resolution] ?? info.resolution}</div>}
                                {info.hz && <div><span className="text-text-muted">Tần số quét: </span><span className={info.hz >= 144 ? 'text-primary-hover font-bold' : ''}>{info.hz}Hz</span></div>}
                                {info.colorGamut && <div><span className="text-text-muted">Độ phủ màu: </span><span className={info.colorGamut.type === 'dci-p3' ? 'text-primary-hover font-bold' : ''}>{info.colorGamut.pct}% {info.colorGamut.type === 'dci-p3' ? 'DCI-P3' : info.colorGamut.type === 'srgb' ? 'sRGB' : 'NTSC'}</span></div>}
                              </div>
                            ) : '—'}
                            {isBest && <span className="mt-2 flex items-center gap-1 font-['Inter'] text-[10px] font-bold uppercase tracking-[0.06em] text-primary"><BarChart3 size={13} aria-hidden="true" /> Màn hình tốt nhất</span>}
                          </td>
                        );
                      })}
                    </tr>
                  )}

                  {/* Weight row */}
                  {compare.some((p) => displayInfoMap.get(p.id)?.weightKg !== null) && (
                    <tr>
                      <th scope="row" className="border-b border-r border-border-subtle p-4 text-left text-text-muted">Cân nặng</th>
                      {compare.map((product) => {
                        const info = displayInfoMap.get(product.id);
                        const kg = info?.weightKg;
                        const allKg = compare.map((p) => displayInfoMap.get(p.id)?.weightKg).filter((v) => v !== null && v !== undefined);
                        const lightestKg = allKg.length > 0 ? Math.min(...allKg) : null;
                        const isLightest = compare.length >= 2 && kg !== null && kg !== undefined && kg === lightestKg;
                        return (
                          <td key={product.id} className={`border-b border-r border-border-subtle p-4 font-['JetBrains_Mono'] text-xs last:border-r-0 ${isLightest ? 'bg-[#79b88d]/[0.05]' : ''}`}>
                            {kg != null ? <>{kg}kg{isLightest && <span className="ml-2 inline-flex items-center gap-1 font-['Inter'] text-[10px] font-bold uppercase tracking-[0.06em] text-[#9ed1ad]"><CheckCircle2 size={11} aria-hidden="true" /> Nhẹ nhất</span>}</> : '—'}
                          </td>
                        );
                      })}
                    </tr>
                  )}
                  <tr>
                    <th scope="row" className="border-r border-border-subtle p-4 text-left text-text-muted">Hành động</th>
                    {compare.map((product) => (
                      <td key={product.id} className="border-r border-border-subtle p-4 last:border-r-0">
                        <button type="button" onClick={() => addToCart(product, 1)} className="luxury-primary-button inline-flex min-h-11 items-center gap-2 rounded-md px-4 text-xs font-bold uppercase tracking-[0.06em]"><ShoppingBag size={16} aria-hidden="true" /> Thêm vào giỏ</button>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="mt-4 flex items-start gap-2 text-xs leading-5 text-text-muted"><ShieldCheck size={15} className="mt-0.5 shrink-0 text-primary" aria-hidden="true" /> Điểm số chỉ hỗ trợ sàng lọc theo dữ liệu hiện có, không thay thế tư vấn kỹ thuật theo phần mềm và công việc thực tế.</p>
          </>
        )}
      </section>
    </>
  );
}
