import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { ImageOff, PackagePlus, Scale, ShoppingBag, X } from 'lucide-react';
import { useCommerce } from '../context/CommerceContext';
import { formatCommercePrice } from '../lib/commerce';

const SPEC_LABELS = { cpu: 'Bộ xử lý', ram: 'RAM', storage: 'Lưu trữ', gpu: 'Card đồ họa' };

export default function Compare() {
  const { addToCart, compare, toggleCompare } = useCommerce();
  const specKeys = [...new Set(compare.flatMap((product) => Object.keys(product.specs ?? {}).filter((key) => product.specs[key])))];

  return (
    <>
      <Helmet><title>So sánh sản phẩm | Laptop World</title></Helmet>
      <section className="luxury-page-section mx-auto min-h-[70vh] w-full max-w-[1440px] px-4 py-10 lg:px-6 lg:py-14">
        <div className="mb-8 border-b border-border-subtle pb-6">
          <p className="luxury-eyebrow mb-3">ĐỐI CHIẾU CẤU HÌNH</p>
          <h1 className="luxury-heading flex items-center gap-3 text-3xl"><Scale className="text-primary" aria-hidden="true" /> So sánh sản phẩm</h1>
          <p className="mt-2 text-sm text-text-muted">Chọn tối đa 4 sản phẩm để so sánh thông số và mức giá.</p>
        </div>

        {compare.length === 0 ? (
          <div className="luxury-panel mx-auto max-w-2xl rounded-[10px] px-6 py-16 text-center">
            <PackagePlus size={42} className="mx-auto mb-5 text-primary" aria-hidden="true" />
            <h2 className="luxury-heading mb-2 text-xl">Bảng so sánh đang trống</h2>
            <p className="mb-7 text-sm text-text-muted">Nhấn biểu tượng cân trên thẻ sản phẩm để thêm vào bảng này.</p>
            <Link to="/products" className="luxury-primary-button inline-flex min-h-11 items-center rounded-md px-6 text-xs font-bold uppercase tracking-[0.08em]">Chọn sản phẩm</Link>
          </div>
        ) : (
          <>
            {compare.length < 2 && <div className="mb-5 rounded-md border border-primary/20 bg-primary/[0.05] px-4 py-3 text-sm text-text-muted">Thêm ít nhất một sản phẩm nữa để đối chiếu rõ hơn.</div>}
            <div className="overflow-x-auto rounded-[10px] border border-border-subtle">
              <table className="w-full min-w-[760px] border-collapse bg-bg-card/75 text-sm">
                <caption className="sr-only">Bảng so sánh sản phẩm</caption>
                <thead>
                  <tr>
                    <th className="w-44 border-b border-r border-border-subtle p-4 text-left text-xs uppercase tracking-[0.08em] text-text-muted">Sản phẩm</th>
                    {compare.map((product) => (
                      <th key={product.id} className="min-w-[230px] border-b border-r border-border-subtle p-4 text-left align-top last:border-r-0">
                        <div className="relative mb-4 grid h-40 place-items-center rounded-md border border-border-subtle bg-bg-main p-3">
                          {product.image ? <img src={product.image} alt={product.name} className="max-h-full max-w-full object-contain" /> : <ImageOff className="text-text-muted" aria-hidden="true" />}
                          <button type="button" onClick={() => toggleCompare(product)} className="absolute right-2 top-2 grid h-9 w-9 place-items-center rounded-md border border-border-subtle bg-bg-main/90 text-text-muted hover:text-[#d56f66]" aria-label={`Bỏ ${product.name} khỏi so sánh`}><X size={16} aria-hidden="true" /></button>
                        </div>
                        <Link to={`/product/${product.id}`} className="line-clamp-2 font-['Sora'] text-sm font-semibold leading-6 text-text-main hover:text-primary-hover">{product.name}</Link>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <th scope="row" className="border-b border-r border-border-subtle p-4 text-left text-text-muted">Giá bán</th>
                    {compare.map((product) => <td key={product.id} className="border-b border-r border-border-subtle p-4 font-['Sora'] font-bold text-primary-hover last:border-r-0">{formatCommercePrice(product.price)}</td>)}
                  </tr>
                  {specKeys.map((key) => (
                    <tr key={key}>
                      <th scope="row" className="border-b border-r border-border-subtle p-4 text-left text-text-muted">{SPEC_LABELS[key] ?? key}</th>
                      {compare.map((product) => <td key={product.id} className="border-b border-r border-border-subtle p-4 font-['JetBrains_Mono'] text-xs leading-6 text-text-main last:border-r-0">{product.specs?.[key] || '—'}</td>)}
                    </tr>
                  ))}
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
          </>
        )}
      </section>
    </>
  );
}
