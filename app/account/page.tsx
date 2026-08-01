import { redirect } from "next/navigation";
import Link from "next/link";
import { Package, User2 } from "lucide-react";

import { CustomerSignOutButton } from "@/components/store/customer-sign-out-button";
import { Card } from "@/components/ui/card";
import { getSessionContext } from "@/lib/auth";
import { getCustomerOrders } from "@/lib/catalog";
import { formatCurrency, formatDate } from "@/lib/format";
import { formatOrderStatus } from "@/lib/order-status";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const session = await getSessionContext();

  if (!session.user || session.role !== "customer") {
    redirect("/login");
  }

  const orders = await getCustomerOrders(session.user.email ?? "");
  const latestOrder = orders[0];
  const displayName = session.user.displayName ?? "Customer";
  const displayEmail = session.user.email ?? "customer@libsystem.local";
  const displayPhone = session.user.phone?.trim() || "No phone number saved yet";

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="grid gap-8 lg:grid-cols-[0.75fr,1.25fr]">
        <Card>
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-3xl bg-sky-50 text-sky-500">
            <User2 className="h-7 w-7" />
          </div>
          <h1 className="mt-6 font-display text-4xl font-semibold text-slate-900">{displayName}</h1>
          <p className="mt-3 text-sm text-slate-600">{displayEmail} - {displayPhone}</p>
          <CustomerSignOutButton className="mt-6" />
        </Card>

        <Card>
          {latestOrder ? (
            <>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Latest order</p>
                  <h2 className="mt-3 font-display text-3xl font-semibold text-slate-900">{latestOrder.orderNumber}</h2>
                  <p className="mt-2 text-sm text-slate-600">{formatDate(latestOrder.placedAt)}</p>
                </div>
                <div className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-600">{formatOrderStatus(latestOrder.status)}</div>
              </div>
              <div className="mt-6 space-y-4">
                {latestOrder.items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between rounded-3xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-center gap-3">
                      <Package className="h-5 w-5 text-sky-500" />
                      <div>
                        <p className="font-semibold text-slate-900">{item.productName}</p>
                        <p className="text-sm text-slate-600">
                          {item.variantName} x {item.quantity}
                        </p>
                      </div>
                    </div>
                    <p className="text-sm text-slate-700">{formatCurrency(item.unitPrice * item.quantity)}</p>
                  </div>
                ))}
              </div>
              <Link href="/account/orders" className="mt-6 inline-flex text-sm font-semibold text-sky-600">
                View full order history
              </Link>
            </>
          ) : (
            <>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Latest order</p>
              <h2 className="mt-3 font-display text-3xl font-semibold text-slate-900">No orders yet</h2>
              <p className="mt-3 text-sm text-slate-600">Once you place a checkout with this account email, your most recent order will appear here.</p>
              <Link href="/shop" className="mt-6 inline-flex text-sm font-semibold text-sky-600">
                Start shopping
              </Link>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
