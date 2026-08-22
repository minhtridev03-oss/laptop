import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { CheckCircle2, ChevronLeft, CreditCard, MapPin, PackageCheck, ShieldCheck } from 'lucide-react';
import { useCommerce } from '../context/CommerceContext';
import { formatCommercePrice } from '../lib/commerce';
import { supabase } from '../lib/supabase';

const initialForm = {
  fullName: '', phone: '', email: '', address: '', province: '', notes: '', paymentMethod: 'cod',
};

export default function Checkout() {
  const { cart, cartSubtotal, clearCart } = useCommerce();
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [order, setOrder] = useState(null);

  const updateField = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (cart.length === 0 || submitting) return;
    setSubmitting(true);
    setError('');

    const { data, error: submitError } = await supabase.rpc('create_guest_order', {
      p_customer: {
        full_name: form.fullName.trim(),
        phone: form.phone.trim(),
        email: form.email.trim() || null,
        address: form.address.trim(),
        province: form.province.trim(),
      },
      p_items: cart.map((item) => ({ product_id: item.product.id, quantity: item.quantity })),
      p_payment_method: form.paymentMethod,
      p_notes: form.notes.trim() || null,
    });

    if (submitError) {
      console.error('Checkout failed:', submitError);
      setError('Chưa thể tạo đơn hàng. Hãy kiểm tra migration SQL hoặc thử lại sau.');
      setSubmitting(false);
      return;
    }

    setOrder(Array.isArray(data) ? data[0] : data);
    clearCart();
    setSubmitting(false);
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
                  {[
                    ['cod', 'Thanh toán khi nhận', PackageCheck],
                    ['bank_transfer', 'Chuyển khoản', CreditCard],
                    ['showroom', 'Tại showroom', MapPin],
                  ].map(([value, label, Icon]) => (
                    <label key={value} className={`flex cursor-pointer items-center gap-3 rounded-md border p-4 text-sm transition-colors ${form.paymentMethod === value ? 'border-primary/55 bg-primary/[0.08] text-primary-hover' : 'border-border-subtle text-text-muted hover:text-text-main'}`}>
                      <input type="radio" name="paymentMethod" value={value} checked={form.paymentMethod === value} onChange={updateField} className="accent-[#d6b873]" />
                      <Icon size={17} aria-hidden="true" /> {label}
                    </label>
                  ))}
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
              <div className="mt-5 flex justify-between gap-4 border-t border-border-subtle pt-5"><span className="text-sm text-text-muted">Tạm tính</span><strong className="font-['Sora'] text-lg text-primary-hover">{formatCommercePrice(cartSubtotal)}</strong></div>
              <p className="mt-3 text-xs leading-5 text-text-muted">Phí giao hàng và tổng tiền cuối cùng được máy chủ tính lại theo dữ liệu sản phẩm hiện tại.</p>
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
