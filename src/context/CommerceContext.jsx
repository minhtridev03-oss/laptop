import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { isCommerceProductPurchasable, toCommerceProduct } from '../lib/commerce';
import { useAuth } from './AuthContext';
import {
  loadCustomerCommerce,
  mergeCustomerCart,
  mergeCustomerWishlist,
  syncCustomerCart,
  syncCustomerWishlist,
} from '../services/customerService';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';

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
  const { t } = useTranslation();
  const { loading: authLoading, user } = useAuth();
  const [cart, setCart] = useState(() => readStorage(STORAGE_KEYS.cart));
  const [wishlist, setWishlist] = useState(() => readStorage(STORAGE_KEYS.wishlist));
  const [compare, setCompare] = useState(() => readStorage(STORAGE_KEYS.compare));
  const [recentlyViewed, setRecentlyViewed] = useState(() => readStorage(STORAGE_KEYS.recent));
  const [commerceSyncing, setCommerceSyncing] = useState(false);
  const [commerceSyncError, setCommerceSyncError] = useState(null);
  const [remoteSyncUserId, setRemoteSyncUserId] = useState(null);
  const cartSyncTimer = useRef(null);
  const wishlistSyncTimer = useRef(null);
  const previousUserId = useRef(null);

  useEffect(() => writeStorage(STORAGE_KEYS.cart, cart), [cart]);
  useEffect(() => writeStorage(STORAGE_KEYS.wishlist, wishlist), [wishlist]);
  useEffect(() => writeStorage(STORAGE_KEYS.compare, compare), [compare]);
  useEffect(() => writeStorage(STORAGE_KEYS.recent, recentlyViewed), [recentlyViewed]);
  useEffect(() => () => {
    window.clearTimeout(cartSyncTimer.current);
    window.clearTimeout(wishlistSyncTimer.current);
  }, []);

  useEffect(() => {
    if (authLoading) return undefined;
    let ignore = false;

    if (!user?.id) {
      if (previousUserId.current) {
        setCart([]);
        setWishlist([]);
      }
      previousUserId.current = null;
      setRemoteSyncUserId(null);
      setCommerceSyncError(null);
      setCommerceSyncing(false);
      return undefined;
    }

    previousUserId.current = user.id;
    setCommerceSyncing(true);
    setCommerceSyncError(null);
    loadCustomerCommerce(user.id)
      .then((remote) => {
        if (ignore) return;
        setCart((local) => mergeCustomerCart(local, remote.cart));
        setWishlist((local) => mergeCustomerWishlist(local, remote.wishlist));
        setRemoteSyncUserId(user.id);
      })
      .catch((error) => {
        if (!ignore) {
          setCommerceSyncError(error);
          setRemoteSyncUserId(null);
        }
      })
      .finally(() => { if (!ignore) setCommerceSyncing(false); });

    return () => { ignore = true; };
  }, [authLoading, user?.id]);

  useEffect(() => {
    if (!user?.id || remoteSyncUserId !== user.id) return undefined;
    window.clearTimeout(cartSyncTimer.current);
    cartSyncTimer.current = window.setTimeout(() => {
      syncCustomerCart(cart).catch(setCommerceSyncError);
    }, 350);
    return () => window.clearTimeout(cartSyncTimer.current);
  }, [cart, remoteSyncUserId, user?.id]);

  useEffect(() => {
    if (!user?.id || remoteSyncUserId !== user.id) return undefined;
    window.clearTimeout(wishlistSyncTimer.current);
    wishlistSyncTimer.current = window.setTimeout(() => {
      syncCustomerWishlist(wishlist).catch(setCommerceSyncError);
    }, 350);
    return () => window.clearTimeout(wishlistSyncTimer.current);
  }, [remoteSyncUserId, user?.id, wishlist]);

  const notify = useCallback((message, tone = 'success') => {
    if (tone === 'success') toast.success(message);
    else if (tone === 'warning') toast.warning(message);
    else if (tone === 'error') toast.error(message);
    else toast(message);
  }, []);

  const addToCart = useCallback((rawProduct, quantity = 1) => {
    const product = toCommerceProduct(rawProduct);
    if (!product.id) return;
    if (!isCommerceProductPurchasable(product)) {
      notify(`${product.name} ${t('common.out_of_stock')}`, 'warning');
      return;
    }
    const safeQuantity = Math.max(1, Math.min(10, Number(quantity) || 1));
    setCart((current) => {
      const existing = current.find((item) => item.product.id === product.id);
      if (!existing) return [...current, { product, quantity: safeQuantity }];
      return current.map((item) => item.product.id === product.id
        ? { product, quantity: Math.min(10, item.quantity + safeQuantity) }
        : item);
    });
    notify(t('cart.added_to_cart', { name: product.name }));
  }, [notify, t]);

  const updateCartQuantity = useCallback((productId, quantity) => {
    const safeQuantity = Math.max(1, Math.min(10, Number(quantity) || 1));
    setCart((current) => current.map((item) => item.product.id === productId
      ? { ...item, quantity: safeQuantity }
      : item));
  }, []);

  const removeFromCart = useCallback((productId) => {
    setCart((current) => current.filter((item) => item.product.id !== productId));
    notify(t('cart.removed_from_cart'), 'neutral');
  }, [notify, t]);

  const clearCart = useCallback(() => setCart([]), []);

  const toggleWishlist = useCallback((rawProduct) => {
    const product = toCommerceProduct(rawProduct);
    if (!product.id) return;
    const exists = wishlist.some((item) => item.id === product.id);
    setWishlist(exists ? wishlist.filter((item) => item.id !== product.id) : [product, ...wishlist]);
    notify(exists ? t('product_detail.removed_from_wishlist') : t('product_detail.added_to_wishlist'), exists ? 'neutral' : 'success');
  }, [notify, t, wishlist]);

  const getProductGroup = (product) => {
    if (product.componentType) return product.componentType.toLowerCase();
    if (product.category) return product.category.split('-')[0].toLowerCase();
    return 'unknown';
  };

  const toggleCompare = useCallback((rawProduct) => {
    const product = toCommerceProduct(rawProduct);
    if (!product.id) return;
    const exists = compare.some((item) => item.id === product.id);
    if (exists) {
      setCompare(compare.filter((item) => item.id !== product.id));
      notify(t('compare.removed'), 'neutral');
      return;
    }
    
    if (compare.length > 0) {
      const currentGroup = getProductGroup(compare[0]);
      const newGroup = getProductGroup(product);
      if (currentGroup !== newGroup && currentGroup !== 'unknown' && newGroup !== 'unknown') {
        notify('Chỉ có thể so sánh các sản phẩm cùng loại', 'error');
        return;
      }
    }

    if (compare.length >= 4) {
      notify(t('compare.limit_reached'), 'warning');
      return;
    }
    setCompare([...compare, product]);
    notify(t('compare.added'));
  }, [compare, notify, t]);

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
    commerceSyncing,
    commerceSyncError,
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
    commerceSyncError,
    commerceSyncing,
    clearCart,
    compare,
    compareIds,
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
