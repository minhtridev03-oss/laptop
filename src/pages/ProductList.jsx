import { Helmet } from 'react-helmet-async';
import { useParams, Link } from 'react-router-dom';
import { products, categories } from '../data/mockData';
import ProductCard from '../components/ui/ProductCard';
import { Filter } from 'lucide-react';

export default function ProductList() {
  const { categoryId } = useParams();
  const category = categories.find(c => c.id === categoryId) || { name: 'Tất cả sản phẩm' };
  
  // Lọc sản phẩm theo category (nếu có)
  const filteredProducts = categoryId 
    ? products.filter(p => p.category === categoryId)
    : products;

  return (
    <>
      <Helmet>
        <title>{category.name} | Laptop World</title>
        <meta name="description" content={`Danh sách ${category.name} chính hãng, giá cực sốc tại Laptop World.`} />
      </Helmet>

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Filter Sidebar */}
          <div className="w-full md:w-1/4">
            <div className="bg-bg-card rounded-sm shadow-sm border border-border-subtle p-5">
              <div className="flex items-center gap-2 font-bold text-lg border-b border-border-subtle pb-3 mb-4 text-text-main">
                <Filter size={20} className="text-primary" />
                BỘ LỌC TÌM KIẾM
              </div>
              
              <div className="mb-6">
                <h4 className="font-semibold mb-3 text-text-main">Mức giá</h4>
                <div className="space-y-2 text-sm text-text-muted">
                  <label className="flex items-center gap-2 cursor-pointer hover:text-primary transition-colors"><input type="checkbox" className="rounded-sm border-border-subtle bg-bg-main text-primary focus:ring-primary focus:ring-offset-bg-card" /> Dưới 10 triệu</label>
                  <label className="flex items-center gap-2 cursor-pointer hover:text-primary transition-colors"><input type="checkbox" className="rounded-sm border-border-subtle bg-bg-main text-primary focus:ring-primary focus:ring-offset-bg-card" /> 10 - 15 triệu</label>
                  <label className="flex items-center gap-2 cursor-pointer hover:text-primary transition-colors"><input type="checkbox" className="rounded-sm border-border-subtle bg-bg-main text-primary focus:ring-primary focus:ring-offset-bg-card" /> 15 - 20 triệu</label>
                  <label className="flex items-center gap-2 cursor-pointer hover:text-primary transition-colors"><input type="checkbox" className="rounded-sm border-border-subtle bg-bg-main text-primary focus:ring-primary focus:ring-offset-bg-card" /> Trên 20 triệu</label>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold mb-3 text-text-main">Thương hiệu</h4>
                <div className="space-y-2 text-sm text-text-muted">
                  <label className="flex items-center gap-2 cursor-pointer hover:text-primary transition-colors"><input type="checkbox" className="rounded-sm border-border-subtle bg-bg-main text-primary focus:ring-primary focus:ring-offset-bg-card" /> Asus</label>
                  <label className="flex items-center gap-2 cursor-pointer hover:text-primary transition-colors"><input type="checkbox" className="rounded-sm border-border-subtle bg-bg-main text-primary focus:ring-primary focus:ring-offset-bg-card" /> Dell</label>
                  <label className="flex items-center gap-2 cursor-pointer hover:text-primary transition-colors"><input type="checkbox" className="rounded-sm border-border-subtle bg-bg-main text-primary focus:ring-primary focus:ring-offset-bg-card" /> Lenovo</label>
                  <label className="flex items-center gap-2 cursor-pointer hover:text-primary transition-colors"><input type="checkbox" className="rounded-sm border-border-subtle bg-bg-main text-primary focus:ring-primary focus:ring-offset-bg-card" /> Apple</label>
                </div>
              </div>
            </div>
          </div>

          {/* Product Grid */}
          <div className="w-full md:w-3/4">
            <h1 className="text-2xl font-black mb-6 text-text-main flex items-center gap-3 uppercase tracking-tight">
              {category.name}
              <span className="text-xs font-bold text-primary border border-border-subtle bg-bg-card px-2.5 py-1 rounded-sm">{filteredProducts.length} sản phẩm</span>
            </h1>

            {filteredProducts.length > 0 ? (
              <div className="grid grid-cols-2 xl:grid-cols-3 gap-4 md:gap-5">
                {filteredProducts.map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="bg-bg-card p-12 text-center rounded-sm border border-border-subtle text-text-muted">
                Không tìm thấy sản phẩm nào phù hợp.
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
