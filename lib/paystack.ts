import "server-only";

import { createHmac, randomBytes, timingSafeEqual } from "crypto";
import { z } from "zod";

import { env } from "@/lib/env";
import { createPaidOrderFromCheckout } from "@/lib/order-store";
import type { PaymentMethod } from "@/lib/types";

const PAYSTACK_API_URL = "https://api.paystack.co";

export const checkoutSchema = z
  .object({
    customerName: z.string().trim().min(2).max(120),
    customerEmail: z.string().trim().email().max(254),
    customerPhone: z.string().trim().min(7).max(30),
    shippingAddress: z.string().trim().max(500).optional(),
    shippingZoneId: z.string().trim().max(100).optional(),
    fulfillmentMethod: z.enum(["delivery", "pickup"]),
    createAccount: z.boolean(),
    items: z
      .array(
        z.object({
          productId: z.string().min(1).max(100),
          variantId: z.string().min(1).max(100),
          quantity: z.number().int().positive().max(100),
        }),
      )
      .min(1)
      .max(100),
  })
  .superRefine((value, context) => {
    if (value.fulfillmentMethod === "delivery" && (!value.shippingZoneId || !value.shippingAddress)) {
      context.addIssue({
        code: "custom",
        message: "A delivery zone and address are required for delivery.",
      });
    }

    const variantIds = new Set<string>();
    value.items.forEach((item, index) => {
      if (variantIds.has(item.variantId)) {
        context.addIssue({
          code: "custom",
          path: ["items", index, "variantId"],
          message: "Each product variant can appear only once per checkout.",
        });
      }
      variantIds.add(item.variantId);
    });
  });

const paystackMetadataSchema = z.object({
  schemaVersion: z.literal(1),
  checkout: checkoutSchema,
  customerId: z.string().min(1).optional(),
  shippingFee: z.number().int().nonnegative(),
  expectedAmountKobo: z.number().int().positive(),
});

const verifiedTransactionSchema = z.object({
  status: z.literal(true),
  message: z.string(),
  data: z.object({
    status: z.string(),
    reference: z.string(),
    amount: z.number().int(),
    currency: z.string(),
    channel: z.string().nullable().optional(),
    paid_at: z.string().nullable().optional(),
    metadata: z.unknown(),
  }),
});

export type PaystackCheckoutMetadata = z.infer<typeof paystackMetadataSchema>;

export class PaystackOrderFulfillmentError extends Error {
  constructor(cause: unknown) {
    super("Payment was verified, but the order could not be recorded yet.", { cause });
    this.name = "PaystackOrderFulfillmentError";
  }
}

export function createPaystackReference() {
  return `LS-${Date.now()}-${randomBytes(6).toString("hex")}`;
}

export function buildPaystackMetadata(input: PaystackCheckoutMetadata) {
  return paystackMetadataSchema.parse(input);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeInteger(value: unknown) {
  return typeof value === "string" && /^\d+$/.test(value) ? Number(value) : value;
}

function normalizeBoolean(value: unknown) {
  if (value === "true") return true;
  if (value === "false") return false;
  return value;
}

function normalizePaystackMetadata(value: unknown) {
  if (!isRecord(value)) {
    return value;
  }

  const checkout = value.checkout;
  const normalizedCheckout = isRecord(checkout)
    ? {
        ...checkout,
        createAccount: normalizeBoolean(checkout.createAccount),
        items: Array.isArray(checkout.items)
          ? checkout.items.map((item) =>
              isRecord(item) ? { ...item, quantity: normalizeInteger(item.quantity) } : item,
            )
          : checkout.items,
      }
    : checkout;

  return {
    ...value,
    schemaVersion: normalizeInteger(value.schemaVersion),
    checkout: normalizedCheckout,
    shippingFee: normalizeInteger(value.shippingFee),
    expectedAmountKobo: normalizeInteger(value.expectedAmountKobo),
  };
}

function parseMetadata(value: unknown) {
  if (typeof value === "string") {
    try {
      return paystackMetadataSchema.parse(normalizePaystackMetadata(JSON.parse(value)));
    } catch {
      throw new Error("Paystack returned invalid checkout metadata.");
    }
  }

  return paystackMetadataSchema.parse(normalizePaystackMetadata(value));
}

function getPaymentMethod(channel?: string | null): PaymentMethod {
  return channel === "bank" || channel === "bank_transfer" ? "bank_transfer" : "card";
}

export async function verifyPaystackTransaction(reference: string) {
  if (!env.paystackSecretKey) {
    throw new Error("Paystack is not configured.");
  }

  const response = await fetch(`${PAYSTACK_API_URL}/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: {
      Authorization: `Bearer ${env.paystackSecretKey}`,
    },
    cache: "no-store",
  });
  const body: unknown = await response.json();

  if (!response.ok) {
    const message =
      typeof body === "object" && body && "message" in body && typeof body.message === "string"
        ? body.message
        : "Paystack could not verify this transaction.";
    throw new Error(message);
  }

  return verifiedTransactionSchema.parse(body).data;
}

export async function fulfillPaystackTransaction(reference: string) {
  const transaction = await verifyPaystackTransaction(reference);

  if (transaction.reference !== reference || transaction.status !== "success") {
    throw new Error("The payment has not completed successfully.");
  }

  const metadata = parseMetadata(transaction.metadata);

  if (transaction.currency !== "NGN" || transaction.amount !== metadata.expectedAmountKobo) {
    throw new Error("The verified payment amount or currency does not match the order.");
  }

  try {
    const result = await createPaidOrderFromCheckout({
      payload: metadata.checkout,
      shippingFee: metadata.shippingFee,
      customerId: metadata.customerId,
      paymentReference: transaction.reference,
      paymentMethod: getPaymentMethod(transaction.channel),
    });

    console.info("[paystack/fulfill] Paid order recorded.", {
      reference: transaction.reference,
      orderNumber: result.order.orderNumber,
      created: result.created,
    });

    return result;
  } catch (error) {
    throw new PaystackOrderFulfillmentError(error);
  }
}

export function hasValidPaystackSignature(rawBody: string, signature: string | null) {
  if (!env.paystackSecretKey || !signature) {
    return false;
  }

  const expected = createHmac("sha512", env.paystackSecretKey).update(rawBody).digest("hex");
  const receivedBuffer = Buffer.from(signature, "utf8");
  const expectedBuffer = Buffer.from(expected, "utf8");

  return receivedBuffer.length === expectedBuffer.length && timingSafeEqual(receivedBuffer, expectedBuffer);
}
