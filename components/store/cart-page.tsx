"use client";

import Link from "next/link";
import { Minus, Plus, Trash2 } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useCart } from "@/components/providers/cart-provider";

export function CartPage() {
  const { items, subtotal, updateQuantity, removeItem } = useCart();

  if (items.length === 0) {
    return (
      <Card className="mx-auto max-w-2xl text-center">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Cart</p>
        <h1 className="mt-4 font-display text-4xl font-semibold text-slate-900">Your cart is still empty</h1>
        <p className="mt-4 text-slate-600">Start with power, audio, gaming gear, or a home essential and we will keep it ready for checkout.</p>
        <Link href="/shop" className={cn(buttonVariants(), "mt-8 inline-flex")}>
          Browse products
        </Link>
      </Card>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1.4fr,0.8fr]">
      <div className="space-y-5">
        {items.map((item) => (
          <Card key={item.variantId} className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">{item.product.name}</p>
              <h2 className="mt-2 font-display text-2xl font-semibold text-slate-900">{item.variant.name}</h2>
              <p className="mt-2 text-sm text-slate-600">{item.product.shortDescription}</p>
            </div>
            <div className="flex flex-col gap-4 sm:items-end">
              <p className="text-lg font-semibold text-slate-900">{formatCurrency(item.variant.price * item.quantity)}</p>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-700"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-10 text-center text-sm font-semibold text-slate-900">{item.quantity}</span>
                <button
                  type="button"
                  onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-700"
                >
                  <Plus className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => removeItem(item.variantId)}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-rose-400/20 bg-rose-400/10 text-rose-200"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card className="h-fit">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Summary</p>
        <h2 className="mt-3 font-display text-3xl font-semibold text-slate-900">Ready for checkout</h2>
        <div className="mt-8 space-y-4">
          <div className="flex items-center justify-between text-sm text-slate-600">
            <span>Subtotal</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex items-center justify-between text-sm text-slate-600">
            <span>Delivery</span>
            <span>Calculated at checkout</span>
          </div>
          <div className="flex items-center justify-between border-t border-slate-200 pt-4 text-base font-semibold text-slate-900">
            <span>Total</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
        </div>
        <Link href="/checkout" className={cn(buttonVariants(), "mt-8 inline-flex w-full")}>
          <span className="w-full text-center">Proceed to checkout</span>
        </Link>
      </Card>
    </div>
  );
}
