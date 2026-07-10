import { NextResponse } from "next/server";
import { z } from "zod";

import { getSessionContext } from "@/lib/auth";
import { env, isPaystackConfigured } from "@/lib/env";
import { getProducts, getShippingZones } from "@/lib/catalog";
import { createDemoOrderFromCheckout } from "@/lib/order-store";

const checkoutSchema = z.object({
  customerName: z.string().min(2),
  customerEmail: z.string().email(),
  customerPhone: z.string().min(7),
  shippingAddress: z.string().optional(),
  shippingZoneId: z.string().optional(),
  fulfillmentMethod: z.enum(["delivery", "pickup"]),
  createAccount: z.boolean(),
  items: z.array(
    z.object({
      productId: z.string(),
      variantId: z.string(),
      quantity: z.number().int().positive(),
    }),
  ),
});

export async function POST(request: Request) {
  const payload = checkoutSchema.parse(await request.json());
  const session = await getSessionContext();
  const shippingFee =
    payload.fulfillmentMethod === "delivery"
      ? getShippingZones().find((zone) => zone.id === payload.shippingZoneId)?.fee ?? 0
      : 0;
  const products = getProducts();
  const subtotal = payload.items.reduce((total, item) => {
    const product = products.find((entry) => entry.id === item.productId);
    const variant = product?.variants.find((entry) => entry.id === item.variantId);
    return total + (variant?.price ?? 0) * item.quantity;
  }, 0);
  const amount = subtotal + shippingFee;

  if (!isPaystackConfigured) {
    const order = createDemoOrderFromCheckout({
      payload,
      shippingFee,
      customerId: session.role === "customer" ? session.user?.id : undefined,
    });

    return NextResponse.json({
      demo: true,
      message: `Demo checkout complete for ${payload.customerName}. ${order.orderNumber} was added for ${amount.toLocaleString("en-NG")} NGN.`,
    });
  }

  const response = await fetch("https://api.paystack.co/transaction/initialize", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.paystackSecretKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: payload.customerEmail,
      amount: amount * 100,
      callback_url: `${env.appUrl}/account/orders`,
      metadata: payload,
    }),
  });

  const result = (await response.json()) as {
    status: boolean;
    message: string;
    data?: { authorization_url: string };
  };

  if (!result.status || !result.data) {
    return NextResponse.json({ message: result.message }, { status: 400 });
  }

  return NextResponse.json({
    message: "Redirecting to Paystack...",
    checkoutUrl: result.data.authorization_url,
  });
}
