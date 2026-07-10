"use client";

import { startTransition, useState } from "react";

import { useCart } from "@/components/providers/cart-provider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { formatCurrency } from "@/lib/format";
import type { ShippingZone } from "@/lib/types";

type CheckoutFormProps = {
  shippingZones: ShippingZone[];
  defaults?: {
    customerName?: string;
    customerEmail?: string;
    customerPhone?: string;
  };
  isSignedInCustomer?: boolean;
};

export function CheckoutForm({ shippingZones, defaults, isSignedInCustomer = false }: CheckoutFormProps) {
  const { items, subtotal, clearCart } = useCart();
  const [fulfillmentMethod, setFulfillmentMethod] = useState<"delivery" | "pickup">("delivery");
  const [shippingZoneId, setShippingZoneId] = useState(shippingZones[0]?.id ?? "");
  const [createAccount, setCreateAccount] = useState(!isSignedInCustomer);
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const shippingZone = shippingZones.find((zone) => zone.id === shippingZoneId);
  const shippingFee = fulfillmentMethod === "pickup" ? 0 : shippingZone?.fee ?? 0;
  const total = subtotal + shippingFee;

  const onSubmit = async (formData: FormData) => {
    if (items.length === 0) {
      setMessage("Your cart is empty.");
      return;
    }

    setIsSubmitting(true);
    setMessage("");

    const payload = {
      customerName: String(formData.get("customerName") ?? ""),
      customerEmail: String(formData.get("customerEmail") ?? ""),
      customerPhone: String(formData.get("customerPhone") ?? ""),
      shippingAddress: String(formData.get("shippingAddress") ?? ""),
      fulfillmentMethod,
      shippingZoneId: fulfillmentMethod === "delivery" ? shippingZoneId : undefined,
      createAccount,
      items: items.map((item) => ({
        productId: item.productId,
        variantId: item.variantId,
        quantity: item.quantity,
      })),
    };

    const response = await fetch("/api/paystack/initialize", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const result = (await response.json()) as { message: string; checkoutUrl?: string; demo?: boolean };
    startTransition(() => {
      setMessage(result.message);
      if (result.demo) {
        clearCart();
      }
      if (result.checkoutUrl) {
        window.location.href = result.checkoutUrl;
      }
    });
    setIsSubmitting(false);
  };

  return (
    <div className="grid gap-8 lg:grid-cols-[1.2fr,0.8fr]">
      <Card>
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Checkout</p>
          <h1 className="font-display text-4xl font-semibold text-slate-900">Fast, friendly checkout</h1>
          <p className="max-w-2xl text-sm leading-7 text-slate-600">
            Complete your delivery or pickup details, then continue to Paystack. When payment is not configured yet, the form falls back to demo confirmation so the experience can still be reviewed.
          </p>
        </div>

        <form action={onSubmit} className="mt-8 space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm text-slate-600">Full name</label>
              <Input name="customerName" placeholder="Kene Nwosu" defaultValue={defaults?.customerName} required />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-slate-600">Email address</label>
              <Input name="customerEmail" type="email" placeholder="kene@example.com" defaultValue={defaults?.customerEmail} required />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-slate-600">Phone number</label>
              <Input name="customerPhone" placeholder="+234 801 234 5678" defaultValue={defaults?.customerPhone} required />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-slate-600">Fulfillment</label>
              <Select value={fulfillmentMethod} onChange={(event) => setFulfillmentMethod(event.target.value as "delivery" | "pickup")}>
                <option value="delivery">Delivery</option>
                <option value="pickup">Store pickup</option>
              </Select>
            </div>
          </div>

          {fulfillmentMethod === "delivery" ? (
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm text-slate-600">Delivery zone</label>
                <Select value={shippingZoneId} onChange={(event) => setShippingZoneId(event.target.value)}>
                  {shippingZones.map((zone) => (
                    <option key={zone.id} value={zone.id}>
                      {zone.name} ({formatCurrency(zone.fee)})
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm text-slate-600">Delivery address</label>
                <Input name="shippingAddress" placeholder="12 Admiralty Way, Lekki Phase 1, Lagos" required />
              </div>
            </div>
          ) : null}

          {isSignedInCustomer ? (
            <p className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
              You are checking out with a signed-in customer account, so this order can appear in your account history automatically.
            </p>
          ) : (
            <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={createAccount}
                onChange={(event) => setCreateAccount(event.target.checked)}
                className="h-4 w-4 accent-sky-200"
              />
              Create a customer account after checkout to track this order later.
            </label>
          )}

          {message ? <p className="rounded-2xl border border-sky-100 bg-sky-50 px-4 py-3 text-sm text-sky-600">{message}</p> : null}

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Starting secure checkout..." : "Continue to payment"}
          </Button>
        </form>
      </Card>

      <Card className="h-fit">
        <h2 className="font-display text-2xl font-semibold text-slate-900">Order summary</h2>
        <div className="mt-6 space-y-4">
          {items.map((item) => (
            <div key={item.variantId} className="flex items-start justify-between gap-4 border-b border-slate-200 pb-4">
              <div>
                <p className="text-sm font-semibold text-slate-900">{item.product.name}</p>
                <p className="text-xs text-slate-400">
                  {item.variant.name} x {item.quantity}
                </p>
              </div>
              <p className="text-sm text-slate-700">{formatCurrency(item.variant.price * item.quantity)}</p>
            </div>
          ))}
          <div className="flex items-center justify-between text-sm text-slate-600">
            <span>Subtotal</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
          <div className="flex items-center justify-between text-sm text-slate-600">
            <span>Shipping</span>
            <span>{formatCurrency(shippingFee)}</span>
          </div>
          <div className="flex items-center justify-between border-t border-slate-200 pt-4 text-base font-semibold text-slate-900">
            <span>Total</span>
            <span>{formatCurrency(total)}</span>
          </div>
          {shippingZone ? (
            <p className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600">
              {shippingZone.name}: {shippingZone.eta}
            </p>
          ) : null}
        </div>
      </Card>
    </div>
  );
}
