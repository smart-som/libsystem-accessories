"use client";

import { createContext, useContext, useEffect, useState } from "react";

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

type StoredCartItem = {
  productId: string;
  variantId: string;
  quantity: number;
};

export function CartProvider({
  children,
  products,
}: {
  children: React.ReactNode;
  products: Product[];
}) {
  const [storedItems, setStoredItems] = useState<StoredCartItem[]>(() => {
    if (typeof window === "undefined") {
      return [];
    }

    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }

    try {
      return JSON.parse(raw) as StoredCartItem[];
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
      return [];
    }
  });

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(storedItems));
  }, [storedItems]);

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
      setStoredItems((current) => {
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
      setStoredItems((current) =>
        current
          .map((item) => (item.variantId === variantId ? { ...item, quantity } : item))
          .filter((item) => item.quantity > 0),
      );
    },
    removeItem(variantId) {
      setStoredItems((current) => current.filter((item) => item.variantId !== variantId));
    },
    clearCart() {
      setStoredItems([]);
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
