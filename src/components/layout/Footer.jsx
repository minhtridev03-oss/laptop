import { Headphones, MapPin, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

const shoppingLinks = [
  { label: 'Tất cả sản phẩm', to: '/products' },
  { label: 'Tự build PC', to: '/build-pc' },
  { label: 'Giỏ hàng', to: '/cart' },
  { label: 'Sản phẩm yêu thích', to: '/wishlist' },
  { label: 'So sánh sản phẩm', to: '/compare' },
];
const supportLinks = [
  { label: 'Tra cứu đơn hàng', to: '/order-lookup' },
  { label: 'Sản phẩm đã xem', to: '/recently-viewed' },
  { label: 'Tư vấn mua hàng', href: 'tel:0961560888' },
  { label: 'Chỉ đường showroom', href: 'https://maps.google.com/?q=10+Ngõ+117+Thái+Hà+Hà+Nội' },
];

export default function Footer() {
  return (
    <footer className="relative mt-16 overflow-hidden border-t border-primary/15 bg-[#0c0b09] text-text-muted">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/70 to-transparent" aria-hidden="true" />
      <div className="pointer-events-none absolute -right-40 -top-48 h-96 w-96 rounded-full bg-primary/5 blur-3xl" aria-hidden="true" />

      <div className="mx-auto max-w-[1440px] px-4 py-12 lg:px-6 lg:py-16">
        <div className="mb-11 grid gap-4 border-b border-border-subtle pb-10 md:grid-cols-3">
          <div className="luxury-panel flex items-center gap-4 rounded-[10px] p-4">
            <span className="luxury-icon-button grid h-11 w-11 shrink-0 place-items-center rounded-lg text-primary">
              <Headphones size={20} aria-hidden="true" />
            </span>
            <div><span className="luxury-eyebrow block">TƯ VẤN MUA HÀNG</span><a href="tel:18001060" className="mt-1 block font-['Sora'] text-sm font-semibold text-text-main hover:text-primary-hover">1800.1060</a></div>
          </div>
          <div className="luxury-panel flex items-center gap-4 rounded-[10px] p-4">
            <span className="luxury-icon-button grid h-11 w-11 shrink-0 place-items-center rounded-lg text-primary">
              <ShieldCheck size={20} aria-hidden="true" />
            </span>
            <div><span className="luxury-eyebrow block">HỖ TRỢ KỸ THUẬT</span><a href="tel:18001763" className="mt-1 block font-['Sora'] text-sm font-semibold text-text-main hover:text-primary-hover">1800.1763</a></div>
          </div>
          <div className="luxury-panel flex items-center gap-4 rounded-[10px] p-4">
            <span className="luxury-icon-button grid h-11 w-11 shrink-0 place-items-center rounded-lg text-primary">
              <MapPin size={20} aria-hidden="true" />
            </span>
            <div><span className="luxury-eyebrow block">SHOWROOM</span><p className="mt-1 text-sm font-semibold text-text-main">10 Ngõ 117 Thái Hà, Hà Nội</p></div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-9 sm:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr_1fr]">
          <div className="pr-4">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-lg border border-primary/40 bg-primary/10 font-['Sora'] text-xs font-extrabold text-primary-hover">LW</span>
              <div><h2 className="luxury-heading text-lg tracking-[0.06em]">LAPTOP WORLD</h2><span className="luxury-eyebrow">PREMIUM HARDWARE</span></div>
            </div>
            <p className="mt-5 max-w-sm text-sm leading-7 text-text-muted">
              Không gian công nghệ dành cho laptop, PC và linh kiện hiệu năng cao, được tuyển chọn cho công việc, sáng tạo và gaming.
            </p>
          </div>

          <FooterColumn title="Mua sắm" items={shoppingLinks} />
          <FooterColumn title="Hỗ trợ" items={supportLinks} />

          <div>
            <h3 className="luxury-heading mb-5 text-sm uppercase tracking-[0.1em]">Thanh toán</h3>
            <div className="flex gap-2">
              <div className="rounded-md border border-border-subtle bg-[#f7f4ec] px-3 py-2">
                <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Visa_Inc._logo.svg/200px-Visa_Inc._logo.svg.png" alt="Visa" className="h-5 w-auto" />
              </div>
              <div className="rounded-md border border-border-subtle bg-[#f7f4ec] px-3 py-2">
                <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Mastercard-logo.svg/200px-Mastercard-logo.svg.png" alt="Mastercard" className="h-5 w-auto" />
              </div>
            </div>
            <p className="mt-4 text-xs leading-5 text-text-muted">Hỗ trợ tư vấn từ 7:30 đến 22:00 mỗi ngày.</p>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-2 border-t border-border-subtle pt-6 text-[11px] sm:flex-row sm:items-center sm:justify-between">
          <span>© 2026 Laptop World. Mọi quyền được bảo lưu.</span>
          <span className="font-['JetBrains_Mono'] tracking-[0.1em] text-primary/70">ENGINEERED FOR PERFORMANCE</span>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ title, items }) {
  return (
    <div>
      <h3 className="luxury-heading mb-5 text-sm uppercase tracking-[0.1em]">{title}</h3>
      <ul className="space-y-3 text-sm">
        {items.map((item) => (
          <li key={item.label}>
            {item.to ? <Link to={item.to} className="group inline-flex items-center gap-2 transition-colors hover:text-primary-hover">
              <span className="h-px w-3 bg-border-subtle transition-all group-hover:w-5 group-hover:bg-primary" aria-hidden="true" />
              {item.label}
            </Link> : <a href={item.href} target={item.href.startsWith('http') ? '_blank' : undefined} rel={item.href.startsWith('http') ? 'noreferrer' : undefined} className="group inline-flex items-center gap-2 transition-colors hover:text-primary-hover">
              <span className="h-px w-3 bg-border-subtle transition-all group-hover:w-5 group-hover:bg-primary" aria-hidden="true" />
              {item.label}
            </a>}
          </li>
        ))}
      </ul>
    </div>
  );
}
