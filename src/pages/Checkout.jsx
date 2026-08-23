import { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { CheckCircle2, ChevronLeft, CreditCard, LoaderCircle, MapPin, PackageCheck, ShieldCheck, Tag } from 'lucide-react';
import { useCommerce } from '../context/CommerceContext';
import { useAuth } from '../context/AuthContext';
import { formatCommercePrice } from '../lib/commerce';
import { loadCheckoutDefaults } from '../services/customerService';
import { createCheckoutOrder, createVietQrImageUrl, getCheckoutConfiguration, validateCoupon } from '../services/checkoutService';

const initialForm = {
  fullName: '', phone: '', email: '', address: '', province: '', notes: '', paymentMethod: 'cod',
};

const FALLBACK_PAYMENT_METHODS = [
  { code: 'cod', display_name: 'Thanh toán khi nhận', description: 'Thanh toán khi nhận sản phẩm.' },
  { code: 'bank_transfer', display_name: 'Chuyển khoản', description: 'Cửa hàng sẽ gửi thông tin chuyển khoản.' },
  { code: 'showroom', display_name: 'Tại showroom', description: 'Thanh toán trực tiếp tại showroom.' },
];

const PAYMENT_ICONS = { cod: PackageCheck, bank_transfer: CreditCard, showroom: MapPin };

export default function Checkout() {
  const { cart, cartSubtotal, clearCart } = useCommerce();
  const { user } = useAuth();
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [order, setOrder] = useState(null);
  const [checkoutConfig, setCheckoutConfig] = useState(null);
  const [configLoading, setConfigLoading] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [coupon, setCoupon] = useState(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponMessage, setCouponMessage] = useState('');
  const couponDiscount = Number(coupon?.discount_amount || 0);

  useEffect(() => {
    if (!user?.id) return undefined;
    let ignore = false;
    loadCheckoutDefaults(user.id).then((defaults) => {
      if (ignore || !defaults) return;
      const { address, profile } = defaults;
      setForm((current) => ({
        ...current,
        fullName: current.fullName || address?.recipient_name || profile?.full_name || user.user_metadata?.full_name || '',
        phone: current.phone || address?.phone || profile?.phone || '',
        email: current.email || user.email || '',
        address: current.address || [address?.address_line, address?.ward, address?.district].filter(Boolean).join(', '),
        province: current.province || address?.province || '',
      }));
    }).catch((loadError) => console.error('Checkout defaults load failed:', loadError));
    return () => { ignore = true; };
  }, [user]);

  useEffect(() => {
    let ignore = false;
    const timer = window.setTimeout(() => {
      setConfigLoading(true);
      getCheckoutConfiguration(form.province, Math.max(cartSubtotal - couponDiscount, 0))
        .then((configuration) => {
          if (ignore || !configuration) return;
          setCheckoutConfig(configuration);
          const methods = configuration.payment_methods || [];
          if (methods.length > 0) setForm((current) => methods.some((method) => method.code === current.paymentMethod)
            ? current
            : { ...current, paymentMethod: methods[0].code });
        })
        .catch((configurationError) => console.error('Checkout configuration load failed:', configurationError))
        .finally(() => { if (!ignore) setConfigLoading(false); });
    }, 250);
    return () => { ignore = true; window.clearTimeout(timer); };
  }, [cartSubtotal, couponDiscount, form.province]);

  const paymentMethods = checkoutConfig?.payment_methods?.length ? checkoutConfig.payment_methods : FALLBACK_PAYMENT_METHODS;
  const estimatedShippingFee = Number(checkoutConfig?.shipping?.shipping_fee ?? (cartSubtotal >= 20000000 ? 0 : 30000));
  const estimatedTotal = Math.max(cartSubtotal - couponDiscount, 0) + estimatedShippingFee;

  const updateField = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (cart.length === 0 || submitting) return;
    setSubmitting(true);
    setError('');

    try {
      const data = await createCheckoutOrder({
        customer: {
        full_name: form.fullName.trim(),
        phone: form.phone.trim(),
        email: form.email.trim() || null,
        address: form.address.trim(),
        province: form.province.trim(),
        },
        cart,
        couponCode: coupon?.code || null,
        paymentMethod: form.paymentMethod,
        notes: form.notes,
      });
      setOrder(Array.isArray(data) ? data[0] : data);
      clearCart();
    } catch (submitError) {
      console.error('Checkout failed:', submitError);
      setError('Chưa thể tạo đơn hàng. Hãy kiểm tra migration SQL hoặc thử lại sau.');
    } finally {
      setSubmitting(false);
    }
  };

  const applyCoupon = async () => {
    const normalizedCode = couponCode.trim();
    if (!normalizedCode) return;
    setCouponLoading(true);
    setCouponMessage('');
    try {
      const result = await validateCoupon(normalizedCode, cartSubtotal);
      setCoupon(result);
      setCouponCode(result.code);
      setCouponMessage(`Đã áp dụng ${result.name}.`);
    } catch (couponError) {
      console.error('Coupon validation failed:', couponError);
      setCoupon(null);
      setCouponMessage('Mã giảm giá không hợp lệ, đã hết hạn hoặc chưa đủ giá trị đơn tối thiểu.');
    } finally {
      setCouponLoading(false);
    }
  };

  if (order) {
    return (
      <section className="luxury-page-section mx-auto min-h-[70vh] w-full max-w-[900px] px-4 py-14 lg:px-6">
        <Helmet><title>Đặt hàng thành công | Laptop World</title></Helmet>
        <div className="luxury-panel rounded-[10px] px-6 py-14 text-center sm:px-12">
          <CheckCircle2 size={54} className="mx-auto mb-5 text-primary" aria-hidden="true" />
          <p className="luxury-eyebrow mb-3">ĐÃ GHI NHẬN ĐƠN HÀNG</p>
          <h1 className="luxury-heading mb-3 text-3xl">Cảm ơn bạn đã đặt hàng</h1>
          <p className="mx-auto max-w-xl text-sm leading-7 text-text-muted">Laptop World sẽ liên hệ xác nhận sản phẩm, hình thức thanh toán và thời gian giao hàng.</p>
          <div className="mx-auto my-8 grid max-w-md gap-3 rounded-md border border-border-subtle bg-bg-main/70 p-5 text-sm">
            <div className="flex justify-between gap-4"><span className="text-text-muted">Mã đơn hàng</span><strong className="font-['JetBrains_Mono'] text-primary-hover">{order.order_code}</strong></div>
            <div className="flex justify-between gap-4"><span className="text-text-muted">Tổng thanh toán</span><strong className="font-['Sora'] text-text-main">{formatCommercePrice(order.total)}</strong></div>
          </div>
          {order.payment_config && form.paymentMethod === 'bank_transfer' && (
            <div className="mx-auto mb-8 max-w-md rounded-lg border border-primary/20 bg-primary/[0.05] p-5 text-left">
              <h2 className="font-['Sora'] text-sm font-bold text-text-main">Thông tin chuyển khoản</h2>
              {createVietQrImageUrl(order.payment_config, order.total, order.payment_reference) && <img src={createVietQrImageUrl(order.payment_config, order.total, order.payment_reference)} alt={`QR chuyển khoản cho đơn ${order.order_code}`} className="mx-auto my-4 w-full max-w-64 rounded-md bg-white p-2" />}
              <dl className="grid gap-2 text-xs text-text-muted"><div className="flex justify-between gap-3"><dt>Ngân hàng</dt><dd className="text-right text-text-main">{order.payment_config.bank_name || 'Chờ cấu hình'}</dd></div><div className="flex justify-between gap-3"><dt>Số tài khoản</dt><dd className="font-['JetBrains_Mono'] text-text-main">{order.payment_config.account_number || 'Chờ xác nhận'}</dd></div><div className="flex justify-between gap-3"><dt>Nội dung</dt><dd className="font-['JetBrains_Mono'] text-primary-hover">{order.payment_reference}</dd></div></dl>
            </div>
          )}
          <Link to="/products" className="luxury-primary-button inline-flex min-h-11 items-center rounded-md px-6 text-xs font-bold uppercase tracking-[0.08em]">Tiếp tục mua sắm</Link>
        </div>
      </section>
    );
  }

  return (
    <>
      <Helmet><title>Thanh toán | Laptop World</title></Helmet>
      <section className="luxury-page-section mx-auto min-h-[70vh] w-full max-w-[1200px] px-4 py-10 lg:px-6 lg:py-14">
        <Link to="/cart" className="mb-6 inline-flex min-h-10 items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-text-muted hover:text-primary-hover"><ChevronLeft size={16} aria-hidden="true" /> Quay lại giỏ hàng</Link>
        <div className="mb-8 border-b border-border-subtle pb-6">
          <p className="luxury-eyebrow mb-3">THÔNG TIN GIAO HÀNG</p>
          <h1 className="luxury-heading text-3xl">Hoàn tất đặt hàng</h1>
        </div>

        {cart.length === 0 ? (
          <div className="luxury-panel rounded-[10px] px-6 py-14 text-center"><PackageCheck size={40} className="mx-auto mb-4 text-primary" aria-hidden="true" /><h2 className="luxury-heading mb-5 text-xl">Không có sản phẩm để thanh toán</h2><Link to="/products" className="luxury-primary-button inline-flex min-h-11 items-center rounded-md px-6 text-xs font-bold uppercase">Xem sản phẩm</Link></div>
        ) : (
          <form onSubmit={handleSubmit} className="grid items-start gap-7 lg:grid-cols-[minmax(0,1fr)_360px]">
            <div className="luxury-panel rounded-[10px] p-5 sm:p-7">
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Họ và tên" name="fullName" value={form.fullName} onChange={updateField} autoComplete="name" required />
                <Field label="Số điện thoại" name="phone" value={form.phone} onChange={updateField} autoComplete="tel" inputMode="tel" pattern="[0-9+ .-]{8,15}" required />
                <Field label="Email" name="email" value={form.email} onChange={updateField} autoComplete="email" type="email" />
                <Field label="Tỉnh / thành phố" name="province" value={form.province} onChange={updateField} autoComplete="address-level1" required />
                <div className="sm:col-span-2"><Field label="Địa chỉ nhận hàng" name="address" value={form.address} onChange={updateField} autoComplete="street-address" required /></div>
                <label className="sm:col-span-2"><span className="mb-2 block text-xs font-semibold text-text-main">Ghi chú đơn hàng</span><textarea name="notes" value={form.notes} onChange={updateField} rows="4" className="luxury-search w-full rounded-md px-4 py-3 text-sm text-text-main outline-none" placeholder="Yêu cầu xuất hóa đơn, thời gian nhận hàng..." /></label>
              </div>

              <fieldset className="mt-7 border-t border-border-subtle pt-6">
                <legend className="mb-4 font-['Sora'] text-sm font-bold text-text-main">Phương thức thanh toán</legend>
                <div className="grid gap-3 sm:grid-cols-3">
                  {paymentMethods.map((method) => {
                    const Icon = PAYMENT_ICONS[method.code] || CreditCard;
                    return (
                    <label key={method.code} className={`flex cursor-pointer items-start gap-3 rounded-md border p-4 text-sm transition-colors ${form.paymentMethod === method.code ? 'border-primary/55 bg-primary/[0.08] text-primary-hover' : 'border-border-subtle text-text-muted hover:text-text-main'}`}>
                      <input type="radio" name="paymentMethod" value={method.code} checked={form.paymentMethod === method.code} onChange={updateField} className="mt-0.5 accent-[#d6b873]" />
                      <Icon size={17} className="mt-0.5 shrink-0" aria-hidden="true" /> <span>{method.display_name}<small className="mt-1 block text-[10px] leading-4 text-text-muted">{method.description}</small></span>
                    </label>
                    );
                  })}
                </div>
              </fieldset>
            </div>

            <aside className="luxury-panel rounded-[10px] p-6 lg:sticky lg:top-32">
              <p className="luxury-eyebrow mb-2">ĐƠN HÀNG</p>
              <h2 className="luxury-heading mb-5 text-lg">{cart.length} sản phẩm</h2>
              <div className="custom-scrollbar max-h-72 space-y-3 overflow-y-auto pr-1">
                {cart.map(({ product, quantity }) => (
                  <div key={product.id} className="flex gap-3 border-b border-border-subtle pb-3">
                    <div className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded border border-border-subtle bg-bg-main p-1">{product.image && <img src={product.image} alt="" className="max-h-full max-w-full object-contain" />}</div>
                    <div className="min-w-0 flex-1"><p className="line-clamp-2 text-xs font-semibold leading-5 text-text-main">{product.name}</p><span className="mt-1 block text-[11px] text-text-muted">{quantity} × {formatCommercePrice(product.price)}</span></div>
                  </div>
                ))}
              </div>
              <div className="mt-5 border-t border-border-subtle pt-5"><label className="mb-2 block text-[10px] font-bold uppercase tracking-[0.07em] text-text-muted">Mã giảm giá</label><div className="flex gap-2"><span className="luxury-search relative flex min-h-11 min-w-0 flex-1 items-center rounded-md"><Tag size={15} className="absolute left-3 text-primary" /><input value={couponCode} onChange={(event) => { setCouponCode(event.target.value.toUpperCase()); if (coupon) setCoupon(null); }} className="w-full bg-transparent pl-10 pr-3 font-['JetBrains_Mono'] text-xs uppercase text-text-main outline-none" placeholder="NHẬP MÃ" /></span><button type="button" onClick={applyCoupon} disabled={!couponCode.trim() || couponLoading} className="min-h-11 rounded-md border border-primary/30 px-3 text-[10px] font-bold uppercase text-primary-hover disabled:opacity-40">{couponLoading ? <LoaderCircle size={14} className="animate-spin" /> : 'Áp dụng'}</button></div>{couponMessage && <p className={`mt-2 text-[10px] leading-4 ${coupon ? 'text-[#9ed1ad]' : 'text-[#e7958d]'}`}>{couponMessage}</p>}</div>
              <dl className="mt-5 grid gap-3 border-t border-border-subtle pt-5 text-sm"><div className="flex justify-between gap-4"><dt className="text-text-muted">Tạm tính</dt><dd className="font-semibold text-text-main">{formatCommercePrice(cartSubtotal)}</dd></div>{couponDiscount > 0 && <div className="flex justify-between gap-4"><dt className="text-[#9ed1ad]">Giảm giá</dt><dd className="font-semibold text-[#9ed1ad]">−{formatCommercePrice(couponDiscount)}</dd></div>}<div className="flex justify-between gap-4"><dt className="text-text-muted">Phí giao hàng</dt><dd className="font-semibold text-text-main">{configLoading ? 'Đang tính...' : estimatedShippingFee === 0 ? 'Miễn phí' : formatCommercePrice(estimatedShippingFee)}</dd></div><div className="flex justify-between gap-4 border-t border-border-subtle pt-3"><dt className="font-semibold text-text-main">Tổng dự kiến</dt><dd className="font-['Sora'] text-lg font-bold text-primary-hover">{formatCommercePrice(estimatedTotal)}</dd></div></dl>
              {checkoutConfig?.shipping && <p className="mt-3 text-xs leading-5 text-text-muted">{checkoutConfig.shipping.zone_name} · Dự kiến {checkoutConfig.shipping.estimated_days_min}–{checkoutConfig.shipping.estimated_days_max} ngày. Tổng cuối cùng được máy chủ xác nhận lại.</p>}
              {error && <div role="alert" className="mt-4 rounded-md border border-[#d56f66]/35 bg-[#d56f66]/10 p-3 text-xs leading-5 text-[#e8a49e]">{error}</div>}
              <button type="submit" disabled={submitting} className="luxury-primary-button mt-6 flex min-h-12 w-full items-center justify-center gap-2 rounded-md px-5 text-xs font-bold uppercase tracking-[0.08em] disabled:cursor-wait disabled:opacity-60">
                <ShieldCheck size={17} aria-hidden="true" /> {submitting ? 'Đang tạo đơn...' : 'Xác nhận đặt hàng'}
              </button>
            </aside>
          </form>
        )}
      </section>
    </>
  );
}

function Field({ label, ...inputProps }) {
  return <label><span className="mb-2 block text-xs font-semibold text-text-main">{label}</span><input {...inputProps} className="luxury-search min-h-12 w-full rounded-md px-4 text-sm text-text-main outline-none" /></label>;
}
