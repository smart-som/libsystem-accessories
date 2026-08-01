import { NextResponse } from "next/server";

import { fulfillPaystackTransaction, PaystackOrderFulfillmentError } from "@/lib/paystack";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const reference = requestUrl.searchParams.get("reference") ?? requestUrl.searchParams.get("trxref");
  const destination = new URL("/checkout/complete", request.url);

  if (!reference) {
    destination.searchParams.set("payment", "failed");
    return NextResponse.redirect(destination);
  }

  try {
    const { order } = await fulfillPaystackTransaction(reference);
    destination.searchParams.set("payment", "success");
    destination.searchParams.set("reference", reference);
    destination.searchParams.set("order", order.orderNumber);
  } catch (error) {
    console.error("[paystack/verify] Payment verification failed.", {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    destination.searchParams.set("payment", error instanceof PaystackOrderFulfillmentError ? "processing" : "failed");
    destination.searchParams.set("reference", reference);
  }

  return NextResponse.redirect(destination);
}
