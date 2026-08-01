"use client";

import { useEffect, useRef } from "react";

import { useCart } from "@/components/providers/cart-provider";

export function PaymentCompleteClient() {
  const { clearCart } = useCart();
  const hasClearedCart = useRef(false);

  useEffect(() => {
    if (!hasClearedCart.current) {
      hasClearedCart.current = true;
      clearCart();
    }
  }, [clearCart]);

  return null;
}
