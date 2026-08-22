import { Link } from 'react-router-dom';
import { Heart, ImageOff, Scale, ShoppingBag, Sparkles } from 'lucide-react';
import { useCommerce } from '../../context/CommerceContext';
import { formatCommercePrice } from '../../lib/commerce';

export default function ProductCard({ product }) {
  const { addToCart, isCompared, isWishlisted, toggleCompare, toggleWishlist } = useCommerce();
  const price = formatCommercePrice(product.price);
  const originalPrice = formatCommercePrice(product.originalPrice);
  const specs = Object.values(product.specs ?? {}).filter(Boolean).slice(0, 3);
  const hasDiscount = Number(product.discount) > 0;
  const wished = isWishlisted(product.id);
  const compared = isCompared(product.id);
  const canPurchase = product.status !== 'inactive' && Number(product.stockQuantity) !== 0;

  return (
    <article className="luxury-panel hover-lift group flex h-full flex-col overflow-hidden rounded-[10px] p-3 sm:p-4">
      <div className="relative mb-4">
        <div className="absolute left-2 top-2 z-10 flex flex-wrap gap-1.5">
          {hasDiscount && (
            <span className="rounded border border-primary/45 bg-bg-main/90 px-2 py-1 font-['JetBrains_Mono'] text-[9px] font-semibold uppercase tracking-[0.08em] text-primary-hover backdrop-blur">
              -{product.discount}%
            </span>
          )}
          {product.isHot && (
            <span className="inline-flex items-center gap-1 rounded border border-[#c58b72]/40 bg-bg-main/90 px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.08em] text-[#d9a48d] backdrop-blur">
              <Sparkles size={10} aria-hidden="true" /> Nổi bật
            </span>
          )}
        </div>

        <div className="absolute right-2 top-2 z-20 flex flex-col gap-1.5">
          <button
            type="button"
            onClick={() => toggleWishlist(product)}
            className={`grid h-10 w-10 place-items-center rounded-md border backdrop-blur transition-colors ${wished ? 'border-primary/55 bg-primary/15 text-primary-hover' : 'border-border-subtle bg-bg-main/85 text-text-muted hover:border-primary/45 hover:text-primary-hover'}`}
            aria-label={wished ? `Bỏ yêu thích ${product.name}` : `Yêu thích ${product.name}`}
            aria-pressed={wished}
          >
            <Heart size={16} fill={wished ? 'currentColor' : 'none'} aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => toggleCompare(product)}
            className={`grid h-10 w-10 place-items-center rounded-md border backdrop-blur transition-colors ${compared ? 'border-primary/55 bg-primary/15 text-primary-hover' : 'border-border-subtle bg-bg-main/85 text-text-muted hover:border-primary/45 hover:text-primary-hover'}`}
            aria-label={compared ? `Bỏ so sánh ${product.name}` : `So sánh ${product.name}`}
            aria-pressed={compared}
          >
            <Scale size={16} aria-hidden="true" />
          </button>
        </div>

        <Link
          to={`/product/${product.id}`}
          className="relative flex h-44 items-center justify-center overflow-hidden rounded-md border border-border-subtle bg-[radial-gradient(circle_at_50%_46%,rgba(214,184,115,0.09),transparent_55%),#0b0a08] p-4 transition-colors group-hover:border-primary/35 sm:h-52"
          aria-label={`Xem chi tiết ${product.name}`}
        >
          <span className="pointer-events-none absolute inset-2 border border-primary/[0.04]" aria-hidden="true" />
          {product.image ? (
            <img
              src={product.image}
              alt={product.name}
              loading="lazy"
              decoding="async"
              className="max-h-full max-w-full object-contain drop-shadow-[0_22px_30px_rgba(0,0,0,0.48)] transition-transform duration-500 group-hover:scale-[1.045]"
            />
          ) : (
            <ImageOff size={28} className="text-text-muted/50" aria-hidden="true" />
          )}
        </Link>
      </div>

      <div className="flex flex-1 flex-col">
        <span className="luxury-eyebrow mb-2">LỰA CHỌN NỔI BẬT</span>
        <Link to={`/product/${product.id}`} className="group/title">
          <h3 className="line-clamp-2 min-h-11 text-[13px] font-semibold leading-[1.65] text-text-main transition-colors group-hover/title:text-primary-hover sm:text-sm">
            {product.name}
          </h3>
        </Link>

        {specs.length > 0 && (
          <div className="my-4 flex flex-wrap gap-1.5">
            {specs.map((spec) => (
              <span key={spec} className="luxury-chip max-w-full truncate rounded px-2 py-1 text-[9px] sm:text-[10px]">
                {spec}
              </span>
            ))}
          </div>
        )}

        <div className="mt-auto border-t border-border-subtle pt-4">
          <div className="flex items-end justify-between gap-3">
            <div className="min-w-0">
              <span className="mb-1 block text-[9px] font-semibold uppercase tracking-[0.12em] text-text-muted">Giá sản phẩm</span>
              <strong className="block truncate font-['Sora'] text-base font-bold text-primary-hover sm:text-lg">
                {price}
              </strong>
              {originalPrice && Number(product.originalPrice) > Number(product.price) && (
                <del className="mt-1 block text-[10px] text-text-muted">{originalPrice}</del>
              )}
            </div>
            <button
              type="button"
              onClick={() => addToCart(product, 1)}
              disabled={!canPurchase}
              className="luxury-primary-button grid h-11 w-11 shrink-0 place-items-center rounded-md disabled:cursor-not-allowed disabled:opacity-40"
              aria-label={canPurchase ? `Thêm ${product.name} vào giỏ hàng` : `${product.name} đang hết hàng`}
            >
              <ShoppingBag size={17} aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
