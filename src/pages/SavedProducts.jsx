import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { Clock3, Heart, PackageSearch } from 'lucide-react';
import ProductCard from '../components/ui/ProductCard';
import { useCommerce } from '../context/CommerceContext';

export default function SavedProducts({ mode = 'wishlist' }) {
  const { recentlyViewed, wishlist } = useCommerce();
  const isRecent = mode === 'recent';
  const products = isRecent ? recentlyViewed : wishlist;
  const title = isRecent ? 'Sản phẩm đã xem' : 'Sản phẩm yêu thích';
  const Icon = isRecent ? Clock3 : Heart;

  return (
    <>
      <Helmet><title>{title} | Laptop World</title></Helmet>
      <section className="luxury-page-section mx-auto min-h-[70vh] w-full max-w-[1440px] px-4 py-10 lg:px-6 lg:py-14">
        <div className="mb-8 border-b border-border-subtle pb-6">
          <p className="luxury-eyebrow mb-3">BỘ SƯU TẬP CÁ NHÂN</p>
          <h1 className="luxury-heading flex items-center gap-3 text-3xl"><Icon className="text-primary" aria-hidden="true" /> {title}</h1>
          <p className="mt-2 text-sm text-text-muted">{products.length} sản phẩm được lưu trên thiết bị này.</p>
        </div>

        {products.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 lg:grid-cols-4 xl:grid-cols-5">
            {products.map((product) => <ProductCard key={product.id} product={product} />)}
          </div>
        ) : (
          <div className="luxury-panel mx-auto max-w-2xl rounded-[10px] px-6 py-16 text-center">
            <PackageSearch size={42} className="mx-auto mb-5 text-primary" aria-hidden="true" />
            <h2 className="luxury-heading mb-2 text-xl">Chưa có sản phẩm nào</h2>
            <p className="mb-7 text-sm text-text-muted">{isRecent ? 'Những sản phẩm bạn mở xem sẽ xuất hiện tại đây.' : 'Nhấn biểu tượng trái tim để lưu sản phẩm quan tâm.'}</p>
            <Link to="/products" className="luxury-primary-button inline-flex min-h-11 items-center rounded-md px-6 text-xs font-bold uppercase tracking-[0.08em]">Khám phá sản phẩm</Link>
          </div>
        )}
      </section>
    </>
  );
}
