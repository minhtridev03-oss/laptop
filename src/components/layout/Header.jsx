import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Clock3, Heart, LayoutDashboard, MapPin, Menu, Scale, Search, ShoppingBag, UserRound, Wrench, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useCommerce } from '../../context/CommerceContext';
import { useAuth } from '../../context/AuthContext';
import AuthModal from '../auth/AuthModal';

function HeaderAction({ to, icon: Icon, label, count = 0, mobileVisible = false }) {
  const content = (
    <>
      <span className="luxury-icon-button relative grid h-11 w-11 place-items-center rounded-lg group-hover:-translate-y-0.5">
        <Icon size={19} strokeWidth={1.8} aria-hidden="true" />
        {count > 0 && (
          <span className="absolute -right-1.5 -top-1.5 grid min-h-5 min-w-5 place-items-center rounded-full border border-bg-main bg-primary px-1 font-['JetBrains_Mono'] text-[9px] font-bold text-[#171208]">
            {count > 99 ? '99+' : count}
          </span>
        )}
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

function LangSwitcher() {
  const { i18n } = useTranslation();
  const current = i18n.language;
  const toggle = () => {
    const next = current === 'vi' ? 'en' : 'vi';
    i18n.changeLanguage(next);
    localStorage.setItem('lang', next);
  };
  return (
    <button
      type="button"
      onClick={toggle}
      className="hidden items-center gap-1 rounded border border-primary/30 px-2 py-0.5 font-['JetBrains_Mono'] text-[10px] font-semibold uppercase tracking-widest text-primary-hover transition-all hover:border-primary hover:bg-primary/10 lg:flex"
      aria-label="Chuyển ngôn ngữ"
    >
      {current === 'vi' ? '🇻🇳 VI' : '🇺🇸 EN'}
    </button>
  );
}

export default function Header() {
  const navigate = useNavigate();
  const { cartCount, compare, wishlist } = useCommerce();
  const { isStaff, user, authModalOpen, setAuthModalOpen } = useAuth();
  const { t, i18n } = useTranslation();
  const [query, setQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSearch = (event) => {
    event.preventDefault();
    const normalizedQuery = query.trim();
    navigate(normalizedQuery ? `/products?q=${encodeURIComponent(normalizedQuery)}` : '/products');
    setMobileMenuOpen(false);
  };

  const toggleLangMobile = () => {
    const next = i18n.language === 'vi' ? 'en' : 'vi';
    i18n.changeLanguage(next);
    localStorage.setItem('lang', next);
  };

  return (
    <header className="sticky top-0 z-50 border-b border-primary/10 bg-bg-main/90 text-text-main shadow-[0_16px_45px_-34px_rgba(214,184,115,0.42)] backdrop-blur-xl">
      <div className="border-b border-border-subtle/80 bg-[#0d0c0a]/90">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between px-4 py-2 text-[11px] font-medium tracking-wide text-text-muted lg:px-6">
          <div className="flex items-center gap-5">
            <a href="tel:0961560888" className="group hidden items-center gap-2 transition-colors hover:text-primary-hover md:flex">
              <span className="h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_10px_rgba(214,184,115,0.65)]" />
              {t('header.hotline')} <strong className="font-semibold text-text-main group-hover:text-primary-hover">0961.56.0888</strong>
            </a>
            <span className="hidden items-center gap-2 lg:flex">
              <MapPin size={13} className="text-primary" aria-hidden="true" />
              {t('header.address')}
            </span>
          </div>
          <nav className="flex items-center gap-5" aria-label="Support links">
            <Link to="/order-lookup" className="transition-colors hover:text-primary-hover">{t('header.order_lookup')}</Link>
            <button type="button" onClick={() => user ? navigate('/account') : setAuthModalOpen(true)} className="flex items-center gap-1.5 transition-colors hover:text-primary-hover" aria-label={user ? t('header.account') : t('header.login')}>
              <UserRound size={13} className="text-primary" aria-hidden="true" />
              {user ? t('header.account') : t('header.login')}
            </button>
            <Link to="/build-pc" className="flex items-center gap-1.5 font-semibold text-primary-hover transition-colors hover:text-primary">
              <Wrench size={13} aria-hidden="true" /> {t('header.build_pc')}
            </Link>
            {isStaff && <Link to="/admin" className="flex items-center gap-1.5 font-semibold text-primary-hover transition-colors hover:text-primary"><LayoutDashboard size={13} aria-hidden="true" /> {t('header.admin')}</Link>}
            <Link to="/products" className="hidden transition-colors hover:text-primary-hover sm:block">{t('header.products')}</Link>
            <LangSwitcher />
          </nav>
        </div>
      </div>

      <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-4 px-4 py-4 lg:gap-7 lg:px-6">
        <Link to="/" className="group flex shrink-0 items-center gap-3" aria-label="Laptop World - Home">
          <span className="relative grid h-10 w-10 place-items-center overflow-hidden rounded-lg border border-primary/40 bg-gradient-to-br from-primary/15 to-transparent font-['Be_Vietnam_Pro'] text-xs font-extrabold tracking-tight text-primary-hover shadow-[inset_0_1px_0_rgba(255,248,224,0.08)]">
            LW
            <span className="absolute inset-x-2 bottom-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent" aria-hidden="true" />
          </span>
          <span className="hidden flex-col leading-none min-[360px]:flex">
            <span className="font-['Be_Vietnam_Pro'] text-[17px] font-extrabold tracking-[0.08em] text-text-main transition-colors group-hover:text-primary-hover sm:text-[19px]">
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
              placeholder={t('header.search_placeholder')}
              className="w-full bg-transparent py-3 pl-11 pr-14 text-sm font-medium text-text-main outline-none placeholder:text-text-muted/70"
              aria-label={t('header.search_label')}
            />
            <button type="submit" className="absolute right-1.5 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-md text-primary transition-colors hover:bg-primary/10 hover:text-primary-hover" aria-label={t('common.search')}>
              <Search size={16} aria-hidden="true" />
            </button>
          </div>
        </form>

        <div className="flex items-center gap-2.5 lg:gap-4">
          <HeaderAction to="/recently-viewed" icon={Clock3} label={t('header.recently_viewed')} />
          <HeaderAction to="/compare" icon={Scale} label={t('header.compare')} count={compare.length} />
          <HeaderAction to="/wishlist" icon={Heart} label={t('header.wishlist')} count={wishlist.length} />
          <HeaderAction to="/cart" icon={ShoppingBag} label={t('header.cart')} count={cartCount} mobileVisible />
          <button
            type="button"
            className="luxury-icon-button grid h-11 w-11 place-items-center rounded-lg md:hidden"
            aria-label={mobileMenuOpen ? t('header.close_menu') : t('header.open_menu')}
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
            placeholder={t('header.search_placeholder_mobile')}
            className="w-full bg-transparent py-3 pl-11 pr-14 text-sm text-text-main outline-none placeholder:text-text-muted/70"
            aria-label={t('header.search_label')}
          />
          <button type="submit" className="absolute right-1.5 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-md text-primary" aria-label={t('common.search')}>
            <Search size={16} aria-hidden="true" />
          </button>
        </form>
      </div>

      {mobileMenuOpen && (
        <nav className="border-t border-border-subtle bg-bg-main/95 px-4 pb-4 pt-2 md:hidden" aria-label="Mobile navigation">
          <div className="luxury-panel grid overflow-hidden rounded-[10px]">
            <Link to="/products" onClick={() => setMobileMenuOpen(false)} className="flex min-h-12 items-center justify-between border-b border-border-subtle px-4 text-sm font-semibold text-text-main hover:text-primary-hover">
              {t('header.all_products')} <Search size={16} className="text-primary" aria-hidden="true" />
            </Link>
            <Link to="/build-pc" onClick={() => setMobileMenuOpen(false)} className="flex min-h-12 items-center justify-between border-b border-border-subtle px-4 text-sm font-semibold text-primary-hover">
              {t('header.build_pc_full')} <Wrench size={16} className="text-primary" aria-hidden="true" />
            </Link>
            <Link to="/wishlist" onClick={() => setMobileMenuOpen(false)} className="flex min-h-12 items-center justify-between border-b border-border-subtle px-4 text-sm font-semibold text-text-main hover:text-primary-hover">
              {t('header.wishlist_full')} <span className="flex items-center gap-2 text-primary"><span>{wishlist.length}</span><Heart size={16} aria-hidden="true" /></span>
            </Link>
            <Link to="/compare" onClick={() => setMobileMenuOpen(false)} className="flex min-h-12 items-center justify-between border-b border-border-subtle px-4 text-sm font-semibold text-text-main hover:text-primary-hover">
              {t('header.compare_full')} <span className="flex items-center gap-2 text-primary"><span>{compare.length}</span><Scale size={16} aria-hidden="true" /></span>
            </Link>
            <Link to="/recently-viewed" onClick={() => setMobileMenuOpen(false)} className="flex min-h-12 items-center justify-between border-b border-border-subtle px-4 text-sm font-semibold text-text-main hover:text-primary-hover">
              {t('header.recently_viewed_full')} <Clock3 size={16} className="text-primary" aria-hidden="true" />
            </Link>
            <Link to="/order-lookup" onClick={() => setMobileMenuOpen(false)} className="flex min-h-12 items-center justify-between border-b border-border-subtle px-4 text-sm font-semibold text-text-main hover:text-primary-hover">
              {t('header.order_lookup')} <Search size={16} className="text-primary" aria-hidden="true" />
            </Link>
            <button type="button" onClick={() => { setMobileMenuOpen(false); if (user) navigate('/account'); else setAuthModalOpen(true); }} className="flex min-h-12 items-center justify-between border-b border-border-subtle px-4 text-left text-sm font-semibold text-text-main hover:text-primary-hover">
              {user ? t('header.my_account') : t('header.login_register')} <UserRound size={16} className="text-primary" aria-hidden="true" />
            </button>
            {isStaff && <Link to="/admin" onClick={() => setMobileMenuOpen(false)} className="flex min-h-12 items-center justify-between border-b border-border-subtle px-4 text-sm font-semibold text-primary-hover">{t('header.admin_center')} <LayoutDashboard size={16} className="text-primary" aria-hidden="true" /></Link>}
            <button type="button" onClick={toggleLangMobile} className="flex min-h-12 items-center justify-between px-4 text-sm font-semibold text-text-main hover:text-primary-hover">
              {i18n.language === 'vi' ? '🇺🇸 Switch to English' : '🇻🇳 Chuyển sang Tiếng Việt'}
            </button>
          </div>
        </nav>
      )}
      <AuthModal open={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </header>
  );
}
