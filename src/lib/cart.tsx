import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { api } from "./api";
import { useStoreSettings } from "./store";
import type { CouponCheck, Product } from "./types";

export type CartItem = { product: Product; quantity: number };
export type AppliedCoupon = { code: string; discount: number; message: string };

const CART_KEY = "lmart.cart.v1";
const COUPON_KEY = "lmart.coupon.v1";

function loadCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(CART_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CartItem[];
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item) =>
        item?.product?.id &&
        typeof item.product.price === "number" &&
        typeof item.quantity === "number" &&
        item.quantity > 0,
    );
  } catch {
    return [];
  }
}

function loadCoupon(): AppliedCoupon | null {
  try {
    const raw = localStorage.getItem(COUPON_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AppliedCoupon;
    return parsed?.code ? parsed : null;
  } catch {
    return null;
  }
}

type CartContextValue = {
  items: CartItem[];
  count: number;
  subtotal: number;
  discount: number;
  deliveryFee: number;
  total: number;
  coupon: AppliedCoupon | null;
  couponBusy: boolean;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  add: (product: Product, quantity?: number) => void;
  setQuantity: (productId: string, quantity: number) => void;
  remove: (productId: string) => void;
  clear: () => void;
  applyCoupon: (code: string) => Promise<CouponCheck>;
  removeCoupon: () => void;
  quantityOf: (productId: string) => number;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const { settings } = useStoreSettings();
  const [items, setItems] = useState<CartItem[]>(loadCart);
  const [coupon, setCoupon] = useState<AppliedCoupon | null>(loadCoupon);
  const [couponBusy, setCouponBusy] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(items));
    } catch {
      /* ignore quota errors */
    }
  }, [items]);

  useEffect(() => {
    try {
      if (coupon) localStorage.setItem(COUPON_KEY, JSON.stringify(coupon));
      else localStorage.removeItem(COUPON_KEY);
    } catch {
      /* ignore quota errors */
    }
  }, [coupon]);

  const subtotal = useMemo(
    () => Math.round(items.reduce((sum, item) => sum + item.product.price * item.quantity, 0) * 100) / 100,
    [items],
  );

  const discount = coupon?.discount ?? 0;

  const deliveryFee = useMemo(() => {
    if (subtotal <= 0) return 0;
    if (settings.free_delivery_above > 0 && subtotal >= settings.free_delivery_above) return 0;
    return settings.delivery_fee;
  }, [subtotal, settings.free_delivery_above, settings.delivery_fee]);

  const total = Math.max(subtotal - discount + deliveryFee, 0);
  const count = items.reduce((sum, item) => sum + item.quantity, 0);

  // Recalculate the coupon whenever the basket value changes.
  useEffect(() => {
    if (!coupon || subtotal <= 0) return;
    let cancelled = false;
    const code = coupon.code;
    api
      .validateCoupon(code, subtotal)
      .then((check) => {
        if (cancelled) return;
        setCoupon((current) => {
          if (!current || current.code !== code) return current;
          return check.valid
            ? { code, discount: check.discount, message: check.message }
            : null;
        });
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subtotal]);

  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);

  const add = useCallback((product: Product, quantity = 1) => {
    setItems((current) => {
      const existing = current.find((item) => item.product.id === product.id);
      if (existing) {
        const next = Math.min(existing.quantity + quantity, Math.max(product.stock, 1));
        return current.map((item) =>
          item.product.id === product.id ? { ...item, quantity: next } : item,
        );
      }
      return [...current, { product, quantity: Math.min(quantity, Math.max(product.stock, 1)) }];
    });
  }, []);

  const setQuantity = useCallback((productId: string, quantity: number) => {
    setItems((current) => {
      if (quantity <= 0) return current.filter((item) => item.product.id !== productId);
      return current.map((item) =>
        item.product.id === productId
          ? { ...item, quantity: Math.min(quantity, Math.max(item.product.stock, 1)) }
          : item,
      );
    });
  }, []);

  const remove = useCallback((productId: string) => {
    setItems((current) => current.filter((item) => item.product.id !== productId));
  }, []);

  const clear = useCallback(() => {
    setItems([]);
    setCoupon(null);
  }, []);

  const applyCoupon = useCallback(
    async (code: string) => {
      setCouponBusy(true);
      try {
        const check = await api.validateCoupon(code, subtotal);
        if (check.valid) {
          setCoupon({ code: code.trim().toUpperCase(), discount: check.discount, message: check.message });
        }
        return check;
      } finally {
        setCouponBusy(false);
      }
    },
    [subtotal],
  );

  const removeCoupon = useCallback(() => setCoupon(null), []);

  const quantityOf = useCallback(
    (productId: string) => items.find((item) => item.product.id === productId)?.quantity ?? 0,
    [items],
  );

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      count,
      subtotal,
      discount,
      deliveryFee,
      total,
      coupon,
      couponBusy,
      isOpen,
      openCart,
      closeCart,
      add,
      setQuantity,
      remove,
      clear,
      applyCoupon,
      removeCoupon,
      quantityOf,
    }),
    [
      items,
      count,
      subtotal,
      discount,
      deliveryFee,
      total,
      coupon,
      couponBusy,
      isOpen,
      openCart,
      closeCart,
      add,
      setQuantity,
      remove,
      clear,
      applyCoupon,
      removeCoupon,
      quantityOf,
    ],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used inside CartProvider");
  return context;
}
