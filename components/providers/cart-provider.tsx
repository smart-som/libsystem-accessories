"use client";

import { createContext, useContext, useSyncExternalStore } from "react";

import type { Product, ProductVariant } from "@/lib/types";

type CartLine = {
  productId: string;
  variantId: string;
  quantity: number;
  product: Product;
  variant: ProductVariant;
};

type CartContextValue = {
  items: CartLine[];
  totalItems: number;
  subtotal: number;
  addItem: (productId: string, variantId: string, quantity?: number) => void;
  updateQuantity: (variantId: string, quantity: number) => void;
  removeItem: (variantId: string) => void;
  clearCart: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "libsystem-cart";
const CART_CHANGED_EVENT = "libsystem-cart-changed";

type StoredCartItem = {
  productId: string;
  variantId: string;
  quantity: number;
};

const EMPTY_CART: StoredCartItem[] = [];
let cachedRawCart: string | null | undefined;
let cachedCart: StoredCartItem[] = EMPTY_CART;

function parseStoredCart(raw: string | null): StoredCartItem[] {
  if (!raw) {
    return [];
  }

  try {
    const value: unknown = JSON.parse(raw);

    if (!Array.isArray(value)) {
      return [];
    }

    return value.filter(
      (item): item is StoredCartItem =>
        typeof item === "object" &&
        item !== null &&
        "productId" in item &&
        typeof item.productId === "string" &&
        "variantId" in item &&
        typeof item.variantId === "string" &&
        "quantity" in item &&
        typeof item.quantity === "number" &&
        Number.isInteger(item.quantity) &&
        item.quantity > 0,
    );
  } catch {
    return [];
  }
}

function getServerCartSnapshot() {
  return EMPTY_CART;
}

function getCartSnapshot() {
  const raw = window.localStorage.getItem(STORAGE_KEY);

  if (raw !== cachedRawCart) {
    cachedRawCart = raw;
    cachedCart = parseStoredCart(raw);
  }

  return cachedCart;
}

function subscribeToCart(onStoreChange: () => void) {
  const handleStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) {
      onStoreChange();
    }
  };
  const handleLocalChange = () => onStoreChange();

  window.addEventListener("storage", handleStorage);
  window.addEventListener(CART_CHANGED_EVENT, handleLocalChange);

  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(CART_CHANGED_EVENT, handleLocalChange);
  };
}

function updateStoredCart(update: (current: StoredCartItem[]) => StoredCartItem[]) {
  const nextCart = update(getCartSnapshot());
  const raw = JSON.stringify(nextCart);

  cachedRawCart = raw;
  cachedCart = nextCart;
  window.localStorage.setItem(STORAGE_KEY, raw);
  window.dispatchEvent(new Event(CART_CHANGED_EVENT));
}

export function CartProvider({
  children,
  products,
}: {
  children: React.ReactNode;
  products: Product[];
}) {
  const storedItems = useSyncExternalStore(subscribeToCart, getCartSnapshot, getServerCartSnapshot);

  const items = storedItems
    .map((item) => {
      const product = products.find((entry) => entry.id === item.productId);
      const variant = product?.variants.find((entry) => entry.id === item.variantId);
      if (!product || !variant) {
        return null;
      }

      return {
        ...item,
        product,
        variant,
      };
    })
    .filter((item): item is CartLine => Boolean(item));

  const subtotal = items.reduce((total, item) => total + item.variant.price * item.quantity, 0);
  const totalItems = items.reduce((total, item) => total + item.quantity, 0);

  const value: CartContextValue = {
    items,
    totalItems,
    subtotal,
    addItem(productId, variantId, quantity = 1) {
      updateStoredCart((current) => {
        const existing = current.find((item) => item.variantId === variantId);
        if (existing) {
          return current.map((item) =>
            item.variantId === variantId ? { ...item, quantity: item.quantity + quantity } : item,
          );
        }

        return [...current, { productId, variantId, quantity }];
      });
    },
    updateQuantity(variantId, quantity) {
      updateStoredCart((current) =>
        current
          .map((item) => (item.variantId === variantId ? { ...item, quantity } : item))
          .filter((item) => item.quantity > 0),
      );
    },
    removeItem(variantId) {
      updateStoredCart((current) => current.filter((item) => item.variantId !== variantId));
    },
    clearCart() {
      updateStoredCart(() => []);
    },
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used inside CartProvider");
  }

  return context;
}
