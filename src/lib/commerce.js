const compactSpecs = (product) => {
  const source = product.specs ?? {};
  return {
    cpu: source.cpu ?? product.spec_cpu ?? null,
    ram: source.ram ?? product.spec_ram ?? null,
    storage: source.storage ?? product.spec_storage ?? null,
    gpu: source.gpu ?? product.spec_gpu ?? null,
  };
};

export const toCommerceProduct = (product = {}) => ({
  id: product.id,
  name: product.name ?? 'Sản phẩm',
  price: Number(product.price) || 0,
  originalPrice: Number(product.originalPrice ?? product.original_price) || 0,
  discount: Number(product.discount) || 0,
  category: product.category ?? product.category_id ?? null,
  image: product.image ?? product.image_url ?? null,
  specs: compactSpecs(product),
  isHot: Boolean(product.isHot ?? product.is_hot),
  stockQuantity: product.stockQuantity ?? product.stock_quantity ?? null,
  status: product.status ?? 'active',
});

export const formatCommercePrice = (value) => {
  const price = Number(value);
  if (!Number.isFinite(price) || price <= 0) return 'Liên hệ';
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(price);
};
