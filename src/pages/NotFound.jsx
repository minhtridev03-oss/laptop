import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { ArrowLeft, SearchX } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function NotFound() {
  const { t } = useTranslation();
  return (
    <section className="luxury-page-section mx-auto grid min-h-[65vh] w-full max-w-[900px] place-items-center px-4 py-14 lg:px-6">
      <Helmet><title>404 | Laptop World</title></Helmet>
      <div className="luxury-panel w-full rounded-[10px] px-6 py-16 text-center">
        <SearchX size={44} className="mx-auto mb-5 text-primary" aria-hidden="true" />
        <p className="luxury-eyebrow mb-3">404 / PAGE NOT FOUND</p>
        <h1 className="luxury-heading mb-3 text-2xl">{t('common.error')}</h1>
        <p className="mb-7 text-sm text-text-muted">{t('common.back')}</p>
        <Link to="/" className="luxury-primary-button inline-flex min-h-11 items-center gap-2 rounded-md px-6 text-xs font-bold uppercase tracking-[0.08em]"><ArrowLeft size={16} aria-hidden="true" /> {t('common.back')}</Link>
      </div>
    </section>
  );
}
