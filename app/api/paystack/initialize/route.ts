import { NextResponse } from "next/server";
import { getSessionContext } from "@/lib/auth";
import { env, isPaystackConfigured } from "@/lib/env";
import { getShippingZones, getStorefrontProducts } from "@/lib/catalog";
import { buildPaystackMetadata, checkoutSchema, createPaystackReference } from "@/lib/paystack";

export async function POST(request: Request) {
  const parsedPayload = checkoutSchema.safeParse(await request.json());

  if (!parsedPayload.success) {
    return NextResponse.json({ message: parsedPayload.error.issues[0]?.message ?? "Invalid checkout details." }, { status: 400 });
  }

  const payload = parsedPayload.data;
  const session = await getSessionContext();
  const shippingFee =
    payload.fulfillmentMethod === "delivery"
      ? getShippingZones().find((zone) => zone.id === payload.shippingZoneId)?.fee ?? 0
      : 0;
  let products;

  try {
    products = await getStorefrontProducts({ requireInventory: true });
  } catch {
    return NextResponse.json(
      { message: "Live inventory is temporarily unavailable. Please try checkout again shortly." },
      { status: 503 },
    );
  }
  let invalidItemMessage = "";
  const subtotal = payload.items.reduce((total, item) => {
    const product = products.find((entry) => entry.id === item.productId);
    const variant = product?.variants.find((entry) => entry.id === item.variantId);

    if (!product || !variant) {
      invalidItemMessage = "One or more products are no longer available.";
      return total;
    }

    if (variant.stockQuantity < item.quantity) {
      invalidItemMessage = `Only ${variant.stockQuantity} unit(s) of ${product.name} are currently available.`;
      return total;
    }

    return total + variant.price * item.quantity;
  }, 0);
  const amount = subtotal + shippingFee;

  if (invalidItemMessage || amount <= 0) {
    return NextResponse.json({ message: invalidItemMessage || "The order total must be greater than zero." }, { status: 400 });
  }

  if (!isPaystackConfigured) {
    return NextResponse.json({
      message: "Paystack checkout is not configured. Add PAYSTACK_SECRET_KEY to the server environment and restart the app.",
    }, { status: 503 });
  }

  const reference = createPaystackReference();
  const amountKobo = Math.round(amount * 100);
  const callbackUrl = new URL("/api/paystack/verify", env.appUrl || request.url);
  const metadata = buildPaystackMetadata({
    schemaVersion: 1,
    checkout: payload,
    shippingFee,
    expectedAmountKobo: amountKobo,
    customerId: session.role === "customer" ? session.user?.id : undefined,
  });
  const response = await fetch("https://api.paystack.co/transaction/initialize", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.paystackSecretKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: payload.customerEmail,
      amount: amountKobo,
      currency: "NGN",
      reference,
      callback_url: callbackUrl.toString(),
      metadata,
    }),
  });

  const result = (await response.json()) as {
    status: boolean;
    message: string;
    data?: { authorization_url: string; reference: string };
  };

  if (!response.ok || !result.status || !result.data?.authorization_url) {
    return NextResponse.json({ message: result.message }, { status: 400 });
  }

  return NextResponse.json({
    message: "Redirecting to Paystack...",
    checkoutUrl: result.data.authorization_url,
  });
}
