import { useEffect, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { ArrowRight, Minus, PackageOpen, Plus, ShieldCheck, Trash2, Truck } from 'lucide-react';
import { useCommerce } from '../context/CommerceContext';
import { formatCommercePrice } from '../lib/commerce';
import { supabase } from '../lib/supabase';

const FREE_SHIPPING_THRESHOLD = 20_000_000;
const STANDARD_SHIPPING_FEE = 30_000;

export default function Cart() {
  const { cart, cartSubtotal, removeFromCart, syncCartProducts, updateCartQuantity } = useCommerce();
  const productIds = useMemo(() => cart.map((item) => item.product.id).sort().join(','), [cart]);

  useEffect(() => {
    if (!productIds) return;
    let ignore = false;

    async function refreshCart() {
      const ids = productIds.split(',');
      const { data, error } = await supabase.from('products').select('*').in('id', ids);
      if (!ignore && !error && data) syncCartProducts(data);
    }

    refreshCart();
    return () => { ignore = true; };
  }, [productIds, syncCartProducts]);

  const shippingFee = cartSubtotal >= FREE_SHIPPING_THRESHOLD || cart.length === 0 ? 0 : STANDARD_SHIPPING_FEE;
  const total = cartSubtotal + shippingFee;
  const hasUnavailableProduct = cart.some(({ product }) => product.status === 'inactive' || Number(product.stockQuantity) === 0);

  return (
    <>
      <Helmet><title>Giỏ hàng | Laptop World</title></Helmet>
      <section className="luxury-page-section mx-auto min-h-[70vh] w-full max-w-[1440px] px-4 py-10 lg:px-6 lg:py-14">
        <div className="mb-8 border-b border-border-subtle pb-6">
          <p className="luxury-eyebrow mb-3">ĐƠN HÀNG CỦA BẠN</p>
          <h1 className="luxury-heading text-3xl">Giỏ hàng</h1>
          <p className="mt-2 text-sm text-text-muted">Giá và trạng thái sản phẩm được đồng bộ lại từ dữ liệu mới nhất.</p>
        </div>

        {cart.length === 0 ? (
          <div className="luxury-panel mx-auto max-w-2xl rounded-[10px] px-6 py-16 text-center">
            <PackageOpen size={42} className="mx-auto mb-5 text-primary" aria-hidden="true" />
            <h2 className="luxury-heading mb-2 text-xl">Giỏ hàng đang trống</h2>
            <p className="mb-7 text-sm text-text-muted">Khám phá danh mục và chọn cấu hình phù hợp với nhu cầu của bạn.</p>
            <Link to="/products" className="luxury-primary-button inline-flex min-h-11 items-center gap-2 rounded-md px-6 text-xs font-bold uppercase tracking-[0.08em]">
              Xem sản phẩm <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>
        ) : (
          <div className="grid items-start gap-7 lg:grid-cols-[minmax(0,1fr)_360px]">
            <div className="space-y-3">
              {cart.map(({ product, quantity }) => {
                const canPurchase = product.status !== 'inactive' && Number(product.stockQuantity) !== 0;
                return (
                  <article key={product.id} className="luxury-panel grid grid-cols-[92px_minmax(0,1fr)] gap-4 rounded-[10px] p-4 sm:grid-cols-[120px_minmax(0,1fr)_auto] sm:items-center">
                    <Link to={`/product/${product.id}`} className="grid h-[92px] place-items-center overflow-hidden rounded-md border border-border-subtle bg-bg-main p-2 sm:h-[110px]">
                      {product.image ? <img src={product.image} alt={product.name} className="max-h-full max-w-full object-contain" /> : <PackageOpen className="text-text-muted" aria-hidden="true" />}
                    </Link>
                    <div className="min-w-0">
                      <Link to={`/product/${product.id}`} className="font-['Sora'] text-sm font-semibold leading-6 text-text-main transition-colors hover:text-primary-hover">{product.name}</Link>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {Object.values(product.specs ?? {}).filter(Boolean).slice(0, 2).map((spec) => <span key={spec} className="luxury-chip rounded px-2 py-1 text-[9px]">{spec}</span>)}
                      </div>
                      <strong className="mt-3 block font-['Sora'] text-base text-primary-hover">{formatCommercePrice(product.price)}</strong>
                      {!canPurchase && <span className="mt-1 block text-xs font-semibold text-[#d56f66]">Sản phẩm đang hết hàng</span>}
                    </div>
                    <div className="col-span-2 flex items-center justify-between gap-3 border-t border-border-subtle pt-3 sm:col-span-1 sm:flex-col sm:items-end sm:border-0 sm:pt-0">
                      <div className="grid grid-cols-3 overflow-hidden rounded-md border border-border-subtle bg-bg-main">
                        <button type="button" onClick={() => updateCartQuantity(product.id, quantity - 1)} disabled={quantity <= 1} className="grid h-10 w-10 place-items-center text-text-muted hover:bg-primary/10 hover:text-primary disabled:opacity-35" aria-label="Giảm số lượng"><Minus size={15} aria-hidden="true" /></button>
                        <span className="grid h-10 min-w-10 place-items-center border-x border-border-subtle font-['JetBrains_Mono'] text-xs text-text-main">{quantity}</span>
                        <button type="button" onClick={() => updateCartQuantity(product.id, quantity + 1)} disabled={quantity >= 10} className="grid h-10 w-10 place-items-center text-text-muted hover:bg-primary/10 hover:text-primary disabled:opacity-35" aria-label="Tăng số lượng"><Plus size={15} aria-hidden="true" /></button>
                      </div>
                      <button type="button" onClick={() => removeFromCart(product.id)} className="inline-flex min-h-10 items-center gap-2 text-xs font-semibold text-text-muted transition-colors hover:text-[#d56f66]">
                        <Trash2 size={15} aria-hidden="true" /> Xóa
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>

            <aside className="luxury-panel rounded-[10px] p-6 lg:sticky lg:top-32" aria-label="Tóm tắt đơn hàng">
              <p className="luxury-eyebrow mb-2">TÓM TẮT</p>
              <h2 className="luxury-heading mb-6 text-lg">Giá trị đơn hàng</h2>
              <dl className="space-y-4 text-sm">
                <div className="flex justify-between gap-4"><dt className="text-text-muted">Tạm tính</dt><dd className="font-semibold text-text-main">{formatCommercePrice(cartSubtotal)}</dd></div>
                <div className="flex justify-between gap-4"><dt className="text-text-muted">Phí giao hàng</dt><dd className="font-semibold text-text-main">{shippingFee === 0 ? 'Miễn phí' : formatCommercePrice(shippingFee)}</dd></div>
                <div className="luxury-divider" />
                <div className="flex items-end justify-between gap-4"><dt className="font-semibold text-text-main">Tổng cộng</dt><dd className="font-['Sora'] text-xl font-bold text-primary-hover">{formatCommercePrice(total)}</dd></div>
              </dl>
              {shippingFee > 0 && <p className="mt-5 rounded-md border border-primary/15 bg-primary/[0.05] p-3 text-xs leading-5 text-text-muted">Mua thêm {formatCommercePrice(FREE_SHIPPING_THRESHOLD - cartSubtotal)} để được miễn phí giao hàng.</p>}
              {hasUnavailableProduct ? (
                <div className="mt-6 flex min-h-12 w-full items-center justify-center rounded-md border border-[#d56f66]/35 bg-[#d56f66]/10 px-4 text-center text-xs font-semibold text-[#e8a49e]">Vui lòng xóa sản phẩm hết hàng</div>
              ) : (
                <Link to="/checkout" className="luxury-primary-button mt-6 flex min-h-12 w-full items-center justify-center gap-2 rounded-md px-5 text-xs font-bold uppercase tracking-[0.08em]">
                  Tiến hành đặt hàng <ArrowRight size={16} aria-hidden="true" />
                </Link>
              )}
              <div className="mt-5 grid gap-3 text-xs text-text-muted">
                <span className="flex items-center gap-2"><ShieldCheck size={15} className="text-primary" aria-hidden="true" /> Giá được xác nhận lại khi tạo đơn</span>
                <span className="flex items-center gap-2"><Truck size={15} className="text-primary" aria-hidden="true" /> Miễn phí giao hàng từ 20 triệu</span>
              </div>
            </aside>
          </div>
        )}
      </section>
    </>
  );
}
