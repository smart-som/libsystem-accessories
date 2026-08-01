import { CheckCircle2, CircleEllipsis, CircleX } from "lucide-react";
import Link from "next/link";

import { PaymentCompleteClient } from "@/components/store/payment-complete-client";
import { Card } from "@/components/ui/card";

export default async function CheckoutCompletePage({
  searchParams,
}: {
  searchParams: Promise<{ payment?: string; reference?: string; order?: string }>;
}) {
  const params = await searchParams;
  const succeeded = params.payment === "success";
  const processing = params.payment === "processing";
  const paymentReceived = succeeded || processing;

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      {paymentReceived ? <PaymentCompleteClient /> : null}
      <Card className="text-center">
        <div
          className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full ${
            succeeded
              ? "bg-emerald-50 text-emerald-600"
              : processing
                ? "bg-amber-50 text-amber-600"
                : "bg-rose-50 text-rose-600"
          }`}
        >
          {succeeded ? (
            <CheckCircle2 className="h-8 w-8" />
          ) : processing ? (
            <CircleEllipsis className="h-8 w-8" />
          ) : (
            <CircleX className="h-8 w-8" />
          )}
        </div>
        <p className="mt-6 text-xs uppercase tracking-[0.3em] text-slate-500">Payment status</p>
        <h1 className="mt-3 font-display text-4xl font-semibold text-slate-900">
          {succeeded ? "Payment confirmed" : processing ? "Payment received" : "Payment not confirmed"}
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-slate-600">
          {succeeded
            ? `Your order${params.order ? ` ${params.order}` : ""} has been paid and recorded successfully.`
            : processing
              ? "Your payment is confirmed. We are still recording the order, so please keep the reference below and do not pay again."
              : "We could not confirm this payment. If your account was debited, keep the reference below and contact support before trying again."}
        </p>

        {params.reference ? (
          <div className="mx-auto mt-6 max-w-lg rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
            Payment reference: <span className="font-semibold">{params.reference}</span>
          </div>
        ) : null}

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          {succeeded ? (
            <Link href="/account/orders" className="inline-flex h-12 items-center justify-center rounded-2xl bg-slate-900 px-6 text-sm font-semibold text-white">
              View order history
            </Link>
          ) : (
            <Link href="/checkout" className="inline-flex h-12 items-center justify-center rounded-2xl bg-slate-900 px-6 text-sm font-semibold text-white">
              Return to checkout
            </Link>
          )}
          <Link href="/shop" className="inline-flex h-12 items-center justify-center rounded-2xl border border-slate-300 bg-white px-6 text-sm font-semibold text-slate-700">
            Continue shopping
          </Link>
        </div>
      </Card>
    </div>
  );
}
