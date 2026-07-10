"use client";

import { Check } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { useCart } from "@/components/providers/cart-provider";

type AddToCartButtonProps = {
  productId: string;
  variantId: string;
};

export function AddToCartButton({ productId, variantId }: AddToCartButtonProps) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);

  return (
    <Button
      onClick={() => {
        addItem(productId, variantId);
        setAdded(true);
        window.setTimeout(() => setAdded(false), 1800);
      }}
      className="w-full"
    >
      {added ? <Check className="h-4 w-4" /> : null}
      {added ? "Added to cart" : "Add to cart"}
    </Button>
  );
}
