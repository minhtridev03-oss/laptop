import { useEffect, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { ArrowRight, Minus, PackageOpen, Plus, ShieldCheck, Trash2, Truck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useCommerce } from '../context/CommerceContext';
import { formatCommercePrice, isCommerceProductPurchasable } from '../lib/commerce';
import { supabase } from '../lib/supabase';

const FREE_SHIPPING_THRESHOLD = 20_000_000;
const STANDARD_SHIPPING_FEE = 30_000;

export default function Cart() {
  const { t } = useTranslation();
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
  const hasUnavailableProduct = cart.some(({ product }) => !isCommerceProductPurchasable(product));

  return (
    <>
      <Helmet><title>{t('cart.title')} | Laptop World</title></Helmet>
      <section className="luxury-page-section mx-auto min-h-[70vh] w-full max-w-[1440px] px-4 py-10 lg:px-6 lg:py-14">
        <div className="mb-8 border-b border-border-subtle pb-6">
          <p className="luxury-eyebrow mb-3">{t('cart.eyebrow')}</p>
          <h1 className="luxury-heading text-3xl">{t('cart.title')}</h1>
          <p className="mt-2 text-sm text-text-muted">{t('cart.subtitle')}</p>
        </div>

        {cart.length === 0 ? (
          <div className="luxury-panel mx-auto max-w-2xl rounded-[10px] px-6 py-16 text-center">
            <PackageOpen size={42} className="mx-auto mb-5 text-primary" aria-hidden="true" />
            <h2 className="luxury-heading mb-2 text-xl">{t('cart.empty_title')}</h2>
            <p className="mb-7 text-sm text-text-muted">{t('cart.empty_desc')}</p>
            <Link to="/products" className="luxury-primary-button inline-flex min-h-11 items-center gap-2 rounded-md px-6 text-xs font-bold uppercase tracking-[0.08em]">
              {t('cart.view_products')} <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.75rem', alignItems: 'start' }}
               className="lg:[grid-template-columns:1fr_360px]">

            {/* ── Product list ── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {cart.map(({ product, quantity }) => {
                const canPurchase = isCommerceProductPurchasable(product);
                return (
                  <article key={product.id} className="luxury-panel rounded-[10px] p-4"
                    style={{ display: 'grid', gridTemplateColumns: '88px 1fr', gap: '1rem', alignItems: 'start' }}>

                    <Link to={`/product/${product.id}`}
                      style={{ width: '88px', height: '88px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}
                      className="rounded-md border border-border-subtle bg-bg-main p-2">
                      {product.image
                        ? <img src={product.image} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                        : <PackageOpen className="text-text-muted" aria-hidden="true" />}
                    </Link>

                    <div style={{ minWidth: 0 }}>
                      <Link to={`/product/${product.id}`}
                        className="font-['Be_Vietnam_Pro'] text-sm font-semibold text-text-main hover:text-primary-hover transition-colors line-clamp-2">
                        {product.name}
                      </Link>

                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
                        {Object.values(product.specs ?? {}).filter(Boolean).slice(0, 2).map((spec) => (
                          <span key={spec} className="luxury-chip rounded px-2 py-1 text-[9px]">{spec}</span>
                        ))}
                      </div>

                      <strong className="mt-2 block font-['Be_Vietnam_Pro'] text-base text-primary-hover">
                        {formatCommercePrice(product.price)}
                      </strong>

                      {!canPurchase && (
                        <span className="mt-1 block text-xs font-semibold text-[#d56f66]">{t('common.out_of_stock')}</span>
                      )}

                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '12px' }}>
                        <div style={{ display: 'flex', overflow: 'hidden', borderRadius: '6px', border: '1px solid var(--color-border-subtle)', background: 'var(--color-bg-main)' }}>
                          <button type="button"
                            onClick={() => updateCartQuantity(product.id, quantity - 1)}
                            disabled={quantity <= 1}
                            style={{ width: '34px', height: '34px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            className="text-text-muted hover:bg-primary/10 hover:text-primary disabled:opacity-30 transition-colors"
                            aria-label="Giảm số lượng">
                            <Minus size={13} aria-hidden="true" />
                          </button>
                          <span style={{ width: '34px', height: '34px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderLeft: '1px solid var(--color-border-subtle)', borderRight: '1px solid var(--color-border-subtle)' }}
                            className="font-['JetBrains_Mono'] text-xs font-bold text-text-main">
                            {quantity}
                          </span>
                          <button type="button"
                            onClick={() => updateCartQuantity(product.id, quantity + 1)}
                            disabled={quantity >= 10}
                            style={{ width: '34px', height: '34px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            className="text-text-muted hover:bg-primary/10 hover:text-primary disabled:opacity-30 transition-colors"
                            aria-label="Tăng số lượng">
                            <Plus size={13} aria-hidden="true" />
                          </button>
                        </div>
                        <button type="button"
                          onClick={() => removeFromCart(product.id)}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', height: '34px', padding: '0 10px', borderRadius: '6px' }}
                          className="text-xs font-semibold text-text-muted hover:bg-[#d56f66]/10 hover:text-[#d56f66] transition-colors">
                          <Trash2 size={13} aria-hidden="true" /> {t('common.delete')}
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

            {/* ── Summary panel — top-aligned by grid ── */}
            <aside className="luxury-panel rounded-[10px] p-6 lg:sticky lg:top-[108px]"
              style={{ alignSelf: 'start' }}
              aria-label="Tóm tắt đơn hàng">
              <p className="luxury-eyebrow mb-2">{t('cart.eyebrow')}</p>
              <h2 className="luxury-heading mb-6 text-lg">{t('cart.subtotal')}</h2>
              <dl style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }} className="text-sm">
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
                  <dt className="text-text-muted">{t('cart.subtotal')}</dt>
                  <dd className="font-semibold text-text-main">{formatCommercePrice(cartSubtotal)}</dd>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
                  <dt className="text-text-muted">{t('cart.shipping')}</dt>
                  <dd className="font-semibold text-text-main">{shippingFee === 0 ? t('cart.free_shipping') : formatCommercePrice(shippingFee)}</dd>
                </div>
                <div className="luxury-divider" />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '1rem' }}>
                  <dt className="font-semibold text-text-main">{t('cart.total')}</dt>
                  <dd className="font-['Be_Vietnam_Pro'] text-xl font-bold text-primary-hover">{formatCommercePrice(total)}</dd>
                </div>
              </dl>
              {shippingFee > 0 && (
                <p className="mt-5 rounded-md border border-primary/15 bg-primary/[0.05] p-3 text-xs leading-5 text-text-muted">
                  {t('cart.more_for_free_ship', { amount: formatCommercePrice(FREE_SHIPPING_THRESHOLD - cartSubtotal) })} {t('cart.free_ship_info')}.
                </p>
              )}
              {hasUnavailableProduct ? (
                <div className="mt-6 flex min-h-12 w-full items-center justify-center rounded-md border border-[#d56f66]/35 bg-[#d56f66]/10 px-4 text-center text-xs font-semibold text-[#e8a49e]">
                  Vui lòng xóa sản phẩm hết hàng
                </div>
              ) : (
                <Link to="/checkout"
                  className="luxury-primary-button mt-6 flex min-h-12 w-full items-center justify-center gap-2 rounded-md px-5 text-xs font-bold uppercase tracking-[0.08em]">
                  {t('cart.checkout')} <ArrowRight size={16} aria-hidden="true" />
                </Link>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1.25rem' }} className="text-xs text-text-muted">
                <span className="flex items-center gap-2"><ShieldCheck size={15} className="text-primary" aria-hidden="true" /> {t('cart.free_shipping_threshold')}</span>
                <span className="flex items-center gap-2"><Truck size={15} className="text-primary" aria-hidden="true" /> {t('cart.free_shipping_note')}</span>
              </div>
            </aside>
          </div>
        )}
      </section>
    </>
  );
}
