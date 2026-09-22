import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { PackageCheck, PackageSearch, Search } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { formatCommercePrice } from '../lib/commerce';

const statusLabels = {
  pending: 'Chờ xác nhận', confirmed: 'Đã xác nhận', processing: 'Đang chuẩn bị',
  shipping: 'Đang giao hàng', completed: 'Đã hoàn thành', cancelled: 'Đã hủy',
};

export default function OrderLookup() {
  const [orderCode, setOrderCode] = useState('');
  const [phone, setPhone] = useState('');
  const [order, setOrder] = useState(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setOrder(null);
    setMessage('');
    const { data, error } = await supabase.rpc('lookup_guest_order', {
      p_order_code: orderCode.trim(),
      p_phone: phone.trim(),
    });
    if (error) {
      console.error('Order lookup failed:', error);
      setMessage('Chưa thể tra cứu. Hãy kiểm tra migration SQL hoặc thử lại sau.');
    } else if (!data) {
      setMessage('Không tìm thấy đơn hàng khớp với mã đơn và số điện thoại.');
    } else {
      setOrder(Array.isArray(data) ? data[0] : data);
    }
    setLoading(false);
  };

  return (
    <>
      <Helmet><title>Tra cứu đơn hàng | Laptop World</title></Helmet>
      <section className="luxury-page-section mx-auto min-h-[70vh] w-full max-w-[920px] px-4 py-12 lg:px-6 lg:py-16">
        <div className="mb-8 text-center">
          <PackageSearch size={40} className="mx-auto mb-4 text-primary" aria-hidden="true" />
          <p className="luxury-eyebrow mb-3">TRẠNG THÁI ĐƠN HÀNG</p>
          <h1 className="luxury-heading text-3xl">Tra cứu đơn hàng</h1>
          <p className="mt-3 text-sm text-text-muted">Nhập mã đơn và số điện thoại đã dùng khi đặt hàng.</p>
        </div>

        <form onSubmit={handleSubmit} className="luxury-panel grid gap-4 rounded-[10px] p-5 sm:grid-cols-[1fr_1fr_auto] sm:items-end sm:p-7">
          <label><span className="mb-2 block text-xs font-semibold text-text-main">Mã đơn hàng</span><input value={orderCode} onChange={(event) => setOrderCode(event.target.value)} required className="luxury-search min-h-12 w-full rounded-md px-4 font-['JetBrains_Mono'] text-sm uppercase text-text-main outline-none" placeholder="LW260822ABC123" /></label>
          <label><span className="mb-2 block text-xs font-semibold text-text-main">Số điện thoại</span><input value={phone} onChange={(event) => setPhone(event.target.value)} required inputMode="tel" pattern="[0-9+ .-]{8,15}" className="luxury-search min-h-12 w-full rounded-md px-4 text-sm text-text-main outline-none" placeholder="0961 560 888" /></label>
          <button type="submit" disabled={loading} className="luxury-primary-button flex min-h-12 items-center justify-center gap-2 rounded-md px-5 text-xs font-bold uppercase tracking-[0.08em] disabled:opacity-60"><Search size={16} aria-hidden="true" /> {loading ? 'Đang tìm...' : 'Tra cứu'}</button>
        </form>

        {message && <div role="status" className="mt-5 rounded-md border border-primary/20 bg-primary/[0.05] px-4 py-3 text-sm text-text-muted">{message}</div>}

        {order && (
          <div className="luxury-panel mt-6 rounded-[10px] p-5 sm:p-7">
            <div className="flex flex-col justify-between gap-4 border-b border-border-subtle pb-5 sm:flex-row sm:items-center">
              <div><p className="luxury-eyebrow mb-2">MÃ ĐƠN {order.order_code}</p><h2 className="luxury-heading text-xl">{statusLabels[order.status] ?? order.status}</h2></div>
              <span className="inline-flex min-h-10 items-center gap-2 self-start rounded-md border border-primary/30 bg-primary/[0.07] px-3 text-xs font-bold text-primary-hover"><PackageCheck size={16} aria-hidden="true" /> {statusLabels[order.status] ?? order.status}</span>
            </div>
            <div className="my-5 space-y-3">
              {(order.items ?? []).map((item) => (
                <div key={item.product_id} className="flex items-center gap-4 rounded-md border border-border-subtle bg-bg-main/65 p-3">
                  <div className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded border border-border-subtle p-1">{item.product_image && <img src={item.product_image} alt="" className="max-h-full max-w-full object-contain" />}</div>
                  <div className="min-w-0 flex-1"><p className="text-sm font-semibold text-text-main">{item.product_name}</p><span className="mt-1 block text-xs text-text-muted">{item.quantity} × {formatCommercePrice(item.unit_price)}</span></div>
                  <strong className="font-['Sora'] text-sm text-primary-hover">{formatCommercePrice(item.line_total)}</strong>
                </div>
              ))}
            </div>
            <dl className="ml-auto grid max-w-sm gap-3 border-t border-border-subtle pt-5 text-sm">
              <div className="flex justify-between"><dt className="text-text-muted">Tạm tính</dt><dd className="text-text-main">{formatCommercePrice(order.subtotal)}</dd></div>
              <div className="flex justify-between"><dt className="text-text-muted">Giao hàng</dt><dd className="text-text-main">{Number(order.shipping_fee) === 0 ? 'Miễn phí' : formatCommercePrice(order.shipping_fee)}</dd></div>
              <div className="flex justify-between border-t border-border-subtle pt-3"><dt className="font-semibold text-text-main">Tổng cộng</dt><dd className="font-['Sora'] text-lg font-bold text-primary-hover">{formatCommercePrice(order.total)}</dd></div>
            </dl>
          </div>
        )}
      </section>
    </>
  );
}
