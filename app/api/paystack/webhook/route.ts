import { NextResponse } from "next/server";
import { z } from "zod";

import { fulfillPaystackTransaction, hasValidPaystackSignature } from "@/lib/paystack";

const webhookSchema = z.object({
  event: z.string(),
  data: z.object({
    reference: z.string(),
  }),
});

export async function POST(request: Request) {
  const rawBody = await request.text();

  if (!hasValidPaystackSignature(rawBody, request.headers.get("x-paystack-signature"))) {
    return NextResponse.json({ message: "Invalid Paystack signature." }, { status: 401 });
  }

  let eventBody: unknown;

  try {
    eventBody = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ message: "Invalid JSON payload." }, { status: 400 });
  }

  const parsedEvent = webhookSchema.safeParse(eventBody);

  if (!parsedEvent.success || parsedEvent.data.event !== "charge.success") {
    return NextResponse.json({ received: true });
  }

  try {
    await fulfillPaystackTransaction(parsedEvent.data.data.reference);
  } catch (error) {
    console.error("[paystack/webhook] Payment fulfillment failed.", {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json({ message: "Payment fulfillment failed." }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
