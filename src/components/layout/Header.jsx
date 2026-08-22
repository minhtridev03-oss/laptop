import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Cpu, MapPin, Menu, Search, ShoppingBag, UserRound, X } from 'lucide-react';

function HeaderAction({ to, icon: Icon, label, mobileVisible = false }) {
  const content = (
    <>
      <span className="luxury-icon-button grid h-11 w-11 place-items-center rounded-lg group-hover:-translate-y-0.5">
        <Icon size={19} strokeWidth={1.8} aria-hidden="true" />
      </span>
      <span className="hidden xl:block text-[10px] font-semibold uppercase tracking-[0.12em] text-text-muted group-hover:text-primary-hover transition-colors">
        {label}
      </span>
    </>
  );

  if (to) {
    return (
      <Link to={to} className={`${mobileVisible ? 'flex' : 'hidden lg:flex'} group items-center gap-2`} aria-label={label}>
        {content}
      </Link>
    );
  }

  return (
    <button type="button" className={`${mobileVisible ? 'flex' : 'hidden lg:flex'} group items-center gap-2`} aria-label={label}>
      {content}
    </button>
  );
}

export default function Header() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSearch = (event) => {
    event.preventDefault();
    const normalizedQuery = query.trim();
    navigate(normalizedQuery ? `/products?q=${encodeURIComponent(normalizedQuery)}` : '/products');
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 border-b border-primary/10 bg-bg-main/90 text-text-main shadow-[0_16px_45px_-34px_rgba(214,184,115,0.42)] backdrop-blur-xl">
      <div className="border-b border-border-subtle/80 bg-[#0d0c0a]/90">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between px-4 py-2 text-[11px] font-medium tracking-wide text-text-muted lg:px-6">
          <div className="flex items-center gap-5">
            <a href="tel:0961560888" className="group hidden items-center gap-2 transition-colors hover:text-primary-hover md:flex">
              <span className="h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_10px_rgba(214,184,115,0.65)]" />
              Hotline <strong className="font-semibold text-text-main group-hover:text-primary-hover">0961.56.0888</strong>
            </a>
            <span className="hidden items-center gap-2 lg:flex">
              <MapPin size={13} className="text-primary" aria-hidden="true" />
              10 Ngõ 117 Thái Hà, Hà Nội
            </span>
          </div>
          <nav className="flex items-center gap-5" aria-label="Liên kết hỗ trợ">
            <Link to="/tin-tuc" className="transition-colors hover:text-primary-hover">Tin tức công nghệ</Link>
            <Link to="/huong-dan" className="hidden transition-colors hover:text-primary-hover sm:block">Hướng dẫn mua hàng</Link>
          </nav>
        </div>
      </div>

      <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-4 px-4 py-4 lg:gap-7 lg:px-6">
        <Link to="/" className="group flex shrink-0 items-center gap-3" aria-label="Laptop World - Trang chủ">
          <span className="relative grid h-10 w-10 place-items-center overflow-hidden rounded-lg border border-primary/40 bg-gradient-to-br from-primary/15 to-transparent font-['Sora'] text-xs font-extrabold tracking-tight text-primary-hover shadow-[inset_0_1px_0_rgba(255,248,224,0.08)]">
            LW
            <span className="absolute inset-x-2 bottom-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent" aria-hidden="true" />
          </span>
          <span className="flex flex-col leading-none">
            <span className="font-['Sora'] text-[17px] font-extrabold tracking-[0.08em] text-text-main transition-colors group-hover:text-primary-hover sm:text-[19px]">
              LAPTOP WORLD
            </span>
            <span className="mt-1 hidden font-['JetBrains_Mono'] text-[8px] font-semibold tracking-[0.24em] text-primary/80 sm:block">
              PREMIUM HARDWARE
            </span>
          </span>
        </Link>

        <form className="hidden max-w-2xl flex-1 md:block" role="search" onSubmit={handleSearch}>
          <div className="luxury-search group relative rounded-[10px] transition-all">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/75" size={17} strokeWidth={1.8} aria-hidden="true" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Tìm laptop, CPU, GPU, linh kiện..."
              className="w-full bg-transparent py-3 pl-11 pr-14 text-sm font-medium text-text-main outline-none placeholder:text-text-muted/70"
              aria-label="Tìm kiếm sản phẩm"
            />
            <button type="submit" className="absolute right-1.5 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-md text-primary transition-colors hover:bg-primary/10 hover:text-primary-hover" aria-label="Tìm kiếm">
              <Search size={16} aria-hidden="true" />
            </button>
          </div>
        </form>

        <div className="flex items-center gap-2.5 lg:gap-4">
          <HeaderAction to="/build-pc" icon={Cpu} label="Xây cấu hình" />
          <HeaderAction icon={UserRound} label="Tài khoản" />
          <HeaderAction to="/cart" icon={ShoppingBag} label="Giỏ hàng" mobileVisible />
          <button
            type="button"
            className="luxury-icon-button grid h-11 w-11 place-items-center rounded-lg md:hidden"
            aria-label={mobileMenuOpen ? 'Đóng menu điều hướng' : 'Mở menu điều hướng'}
            aria-expanded={mobileMenuOpen}
            onClick={() => setMobileMenuOpen((open) => !open)}
          >
            {mobileMenuOpen ? <X size={21} aria-hidden="true" /> : <Menu size={21} aria-hidden="true" />}
          </button>
        </div>
      </div>

      <div className="px-4 pb-4 md:hidden">
        <form className="luxury-search relative rounded-[10px]" role="search" onSubmit={handleSearch}>
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/75" size={17} aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Tìm kiếm sản phẩm..."
            className="w-full bg-transparent py-3 pl-11 pr-14 text-sm text-text-main outline-none placeholder:text-text-muted/70"
            aria-label="Tìm kiếm sản phẩm trên di động"
          />
          <button type="submit" className="absolute right-1.5 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-md text-primary" aria-label="Tìm kiếm">
            <Search size={16} aria-hidden="true" />
          </button>
        </form>
      </div>

      {mobileMenuOpen && (
        <nav className="border-t border-border-subtle bg-bg-main/95 px-4 pb-4 pt-2 md:hidden" aria-label="Điều hướng di động">
          <div className="luxury-panel grid overflow-hidden rounded-[10px]">
            <Link to="/products" onClick={() => setMobileMenuOpen(false)} className="flex min-h-12 items-center justify-between border-b border-border-subtle px-4 text-sm font-semibold text-text-main hover:text-primary-hover">
              Tất cả sản phẩm <Search size={16} className="text-primary" aria-hidden="true" />
            </Link>
            <a href="tel:0961560888" className="flex min-h-12 items-center justify-between px-4 text-sm font-semibold text-text-main hover:text-primary-hover">
              Tư vấn: 0961.56.0888 <MapPin size={16} className="text-primary" aria-hidden="true" />
            </a>
          </div>
        </nav>
      )}
    </header>
  );
}
