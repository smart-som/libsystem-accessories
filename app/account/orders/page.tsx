import { redirect } from "next/navigation";

import { Card } from "@/components/ui/card";
import { getSessionContext } from "@/lib/auth";
import { getCustomerOrders } from "@/lib/catalog";
import { formatCurrency, formatDate } from "@/lib/format";
import { formatFulfillmentLabel, formatOrderStatus } from "@/lib/order-status";

export const dynamic = "force-dynamic";

export default async function AccountOrdersPage() {
  const session = await getSessionContext();

  if (!session.user || session.role !== "customer") {
    redirect("/login");
  }

  const orders = await getCustomerOrders(session.user.email ?? "");

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Order history</p>
        <h1 className="mt-3 font-display text-5xl font-semibold text-slate-900">Track every checkout</h1>
      </div>

      {orders.length ? (
        <div className="space-y-5">
          {orders.map((order) => (
            <Card key={order.id}>
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <h2 className="font-display text-2xl font-semibold text-slate-900">{order.orderNumber}</h2>
                  <p className="mt-2 text-sm text-slate-600">
                    {order.customerName} - {formatDate(order.placedAt)}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-600">{formatOrderStatus(order.status)}</span>
                  <span className="rounded-full border border-sky-100 bg-sky-50 px-4 py-2 text-sm text-sky-600">{formatFulfillmentLabel(order.fulfillmentMethod)}</span>
                  <span className="rounded-full border border-sky-100 bg-sky-50 px-4 py-2 text-sm text-sky-600">{formatCurrency(order.total)}</span>
                </div>
              </div>
              <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {order.items.map((item) => (
                  <div key={item.id} className="rounded-[24px] border border-slate-200 bg-slate-50 p-4">
                    <p className="font-semibold text-slate-900">{item.productName}</p>
                    <p className="mt-2 text-sm text-slate-600">
                      {item.variantName} x {item.quantity}
                    </p>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <h2 className="font-display text-2xl font-semibold text-slate-900">No orders on this account yet</h2>
          <p className="mt-3 text-sm text-slate-600">Use the same customer email at checkout and your online orders will appear here automatically.</p>
        </Card>
      )}
    </div>
  );
}
