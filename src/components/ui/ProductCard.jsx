import { Link } from 'react-router-dom';
import { ShoppingCart } from 'lucide-react';

export default function ProductCard({ product }) {
  const formatPrice = (price) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

  return (
    <div className="bg-bg-card rounded-sm p-4 shadow-sm hover-lift flex flex-col group relative overflow-hidden border border-border-subtle h-full">
      {product.discount > 0 && (
        <div className="absolute top-3 left-3 bg-bg-main border border-primary text-primary text-[10px] font-bold px-2 py-0.5 rounded-sm z-10 uppercase tracking-wider">
          -{product.discount}%
        </div>
      )}
      
      <Link to={`/product/${product.id}`} className="h-48 overflow-hidden rounded-sm mb-4 flex items-center justify-center bg-bg-main p-2 border border-border-subtle group-hover:border-primary/50 transition-colors">
        <img 
          src={product.image} 
          alt={product.name} 
          className="max-h-full object-contain group-hover:scale-105 transition-transform duration-500" 
        />
      </Link>
      
      <Link to={`/product/${product.id}`}>
        <h3 className="text-sm font-medium text-text-main mb-2 line-clamp-2 hover:text-primary transition-colors h-10">
          {product.name}
        </h3>
      </Link>
      
      <div className="mb-4">
        <div className="flex flex-wrap gap-1.5 text-[10px] text-text-muted">
          <span className="bg-bg-main border border-border-subtle px-1.5 py-0.5 rounded-sm">{product.specs.cpu}</span>
          <span className="bg-bg-main border border-border-subtle px-1.5 py-0.5 rounded-sm">{product.specs.ram}</span>
          <span className="bg-bg-main border border-border-subtle px-1.5 py-0.5 rounded-sm">{product.specs.gpu}</span>
        </div>
      </div>
      
      <div className="mt-auto flex items-end justify-between">
        <div>
          <div className="text-primary font-bold text-lg leading-none mb-1">
            {formatPrice(product.price)}
          </div>
          {product.originalPrice > product.price && (
            <div className="text-text-muted text-xs line-through">
              {formatPrice(product.originalPrice)}
            </div>
          )}
        </div>
        <button className="bg-bg-main border border-border-subtle p-2 rounded-sm text-text-muted hover:bg-primary hover:text-bg-main hover:border-primary transition-colors">
          <ShoppingCart size={18} />
        </button>
      </div>
    </div>
  );
}
