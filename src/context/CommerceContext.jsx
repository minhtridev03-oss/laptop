import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { toCommerceProduct } from '../lib/commerce';

const CommerceContext = createContext(null);
const STORAGE_KEYS = {
  cart: 'laptop-world:cart',
  wishlist: 'laptop-world:wishlist',
  compare: 'laptop-world:compare',
  recent: 'laptop-world:recent',
};

const readStorage = (key) => {
  if (typeof window === 'undefined') return [];
  try {
    const value = JSON.parse(window.localStorage.getItem(key));
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
};

const writeStorage = (key, value) => {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // The store remains usable in memory when browser storage is unavailable.
  }
};

export function CommerceProvider({ children }) {
  const [cart, setCart] = useState(() => readStorage(STORAGE_KEYS.cart));
  const [wishlist, setWishlist] = useState(() => readStorage(STORAGE_KEYS.wishlist));
  const [compare, setCompare] = useState(() => readStorage(STORAGE_KEYS.compare));
  const [recentlyViewed, setRecentlyViewed] = useState(() => readStorage(STORAGE_KEYS.recent));
  const [notification, setNotification] = useState(null);
  const noticeTimer = useRef(null);

  useEffect(() => writeStorage(STORAGE_KEYS.cart, cart), [cart]);
  useEffect(() => writeStorage(STORAGE_KEYS.wishlist, wishlist), [wishlist]);
  useEffect(() => writeStorage(STORAGE_KEYS.compare, compare), [compare]);
  useEffect(() => writeStorage(STORAGE_KEYS.recent, recentlyViewed), [recentlyViewed]);
  useEffect(() => () => window.clearTimeout(noticeTimer.current), []);

  const notify = useCallback((message, tone = 'success') => {
    window.clearTimeout(noticeTimer.current);
    setNotification({ message, tone });
    noticeTimer.current = window.setTimeout(() => setNotification(null), 2400);
  }, []);

  const addToCart = useCallback((rawProduct, quantity = 1) => {
    const product = toCommerceProduct(rawProduct);
    if (!product.id) return;
    const safeQuantity = Math.max(1, Math.min(10, Number(quantity) || 1));
    setCart((current) => {
      const existing = current.find((item) => item.product.id === product.id);
      if (!existing) return [...current, { product, quantity: safeQuantity }];
      return current.map((item) => item.product.id === product.id
        ? { product, quantity: Math.min(10, item.quantity + safeQuantity) }
        : item);
    });
    notify(`Đã thêm ${product.name} vào giỏ hàng`);
  }, [notify]);

  const updateCartQuantity = useCallback((productId, quantity) => {
    const safeQuantity = Math.max(1, Math.min(10, Number(quantity) || 1));
    setCart((current) => current.map((item) => item.product.id === productId
      ? { ...item, quantity: safeQuantity }
      : item));
  }, []);

  const removeFromCart = useCallback((productId) => {
    setCart((current) => current.filter((item) => item.product.id !== productId));
    notify('Đã xóa sản phẩm khỏi giỏ hàng', 'neutral');
  }, [notify]);

  const clearCart = useCallback(() => setCart([]), []);

  const toggleWishlist = useCallback((rawProduct) => {
    const product = toCommerceProduct(rawProduct);
    if (!product.id) return;
    const exists = wishlist.some((item) => item.id === product.id);
    setWishlist(exists ? wishlist.filter((item) => item.id !== product.id) : [product, ...wishlist]);
    notify(exists ? 'Đã bỏ khỏi danh sách yêu thích' : 'Đã lưu vào danh sách yêu thích', exists ? 'neutral' : 'success');
  }, [notify, wishlist]);

  const toggleCompare = useCallback((rawProduct) => {
    const product = toCommerceProduct(rawProduct);
    if (!product.id) return;
    const exists = compare.some((item) => item.id === product.id);
    if (exists) {
      setCompare(compare.filter((item) => item.id !== product.id));
      notify('Đã bỏ sản phẩm khỏi bảng so sánh', 'neutral');
      return;
    }
    if (compare.length >= 4) {
      notify('Chỉ có thể so sánh tối đa 4 sản phẩm', 'warning');
      return;
    }
    setCompare([...compare, product]);
    notify('Đã thêm sản phẩm vào bảng so sánh');
  }, [compare, notify]);

  const addRecentlyViewed = useCallback((rawProduct) => {
    const product = toCommerceProduct(rawProduct);
    if (!product.id) return;
    setRecentlyViewed((current) => [product, ...current.filter((item) => item.id !== product.id)].slice(0, 10));
  }, []);

  const syncCartProducts = useCallback((rawProducts) => {
    const catalog = new Map(rawProducts.map((product) => {
      const normalized = toCommerceProduct(product);
      return [normalized.id, normalized];
    }));
    setCart((current) => current.flatMap((item) => {
      const latest = catalog.get(item.product.id);
      return latest ? [{ ...item, product: latest }] : [];
    }));
  }, []);

  const cartCount = useMemo(() => cart.reduce((total, item) => total + item.quantity, 0), [cart]);
  const cartSubtotal = useMemo(() => cart.reduce((total, item) => total + item.product.price * item.quantity, 0), [cart]);
  const wishlistIds = useMemo(() => new Set(wishlist.map((item) => item.id)), [wishlist]);
  const compareIds = useMemo(() => new Set(compare.map((item) => item.id)), [compare]);

  const value = useMemo(() => ({
    cart,
    cartCount,
    cartSubtotal,
    wishlist,
    compare,
    recentlyViewed,
    notification,
    addToCart,
    updateCartQuantity,
    removeFromCart,
    clearCart,
    toggleWishlist,
    toggleCompare,
    addRecentlyViewed,
    syncCartProducts,
    isWishlisted: (productId) => wishlistIds.has(productId),
    isCompared: (productId) => compareIds.has(productId),
  }), [
    addRecentlyViewed,
    addToCart,
    cart,
    cartCount,
    cartSubtotal,
    clearCart,
    compare,
    compareIds,
    notification,
    recentlyViewed,
    removeFromCart,
    syncCartProducts,
    toggleCompare,
    toggleWishlist,
    updateCartQuantity,
    wishlist,
    wishlistIds,
  ]);

  return <CommerceContext.Provider value={value}>{children}</CommerceContext.Provider>;
}

export const useCommerce = () => {
  const context = useContext(CommerceContext);
  if (!context) throw new Error('useCommerce must be used within CommerceProvider');
  return context;
};
