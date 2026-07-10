"use client";

import Image from "next/image";
import { Mail, MoreHorizontal, Phone, Search, ShieldCheck } from "lucide-react";
import { useState } from "react";

import { markAdminNotificationsRead } from "@/lib/admin-notifications";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { formatCurrency, formatDate } from "@/lib/format";
import { formatFulfillmentLabel, formatOrderStatus, getAllowedOrderStatuses } from "@/lib/order-status";
import type { Order, OrderStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

type OrdersResponse = {
  orders: Order[];
  message?: string;
};

function getInitials(value: string) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function getStatusClass(status: OrderStatus) {
  switch (status) {
    case "completed":
      return "border-[color:var(--admin-border)] bg-[var(--admin-panel-2)] text-[var(--admin-text)]";
    case "in_transit":
      return "border-[color:var(--admin-border)] bg-[var(--admin-panel-2)] text-[var(--admin-text)]";
    case "ready_for_pickup":
      return "border-[color:var(--admin-border)] bg-[var(--admin-panel-2)] text-[var(--admin-text)]";
    case "cancelled":
      return "border-[color:var(--admin-border)] bg-[var(--admin-panel-2)] text-[var(--admin-text)]";
    default:
      return "border-[color:var(--admin-border)] bg-[var(--admin-panel-2)] text-[var(--admin-text)]";
  }
}

export function OrdersManager({ initialOrders }: { initialOrders: Order[] }) {
  const [orders, setOrders] = useState(initialOrders);
  const [draftStatuses, setDraftStatuses] = useState<Record<string, OrderStatus>>(
    Object.fromEntries(initialOrders.map((order) => [order.id, order.status])),
  );
  const [savingOrderId, setSavingOrderId] = useState<string | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState(initialOrders[0]?.id ?? "");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [fulfillmentFilter, setFulfillmentFilter] = useState("all");
  const [sortBy, setSortBy] = useState("latest");
  const [message, setMessage] = useState<{ tone: "success" | "error"; text: string } | null>(null);

  const filteredOrders = [...orders]
    .filter((order) => {
      const query = searchQuery.trim().toLowerCase();
      const matchesQuery =
        !query ||
        order.orderNumber.toLowerCase().includes(query) ||
        order.customerName.toLowerCase().includes(query) ||
        order.customerPhone.toLowerCase().includes(query);
      const matchesStatus = statusFilter === "all" || order.status === statusFilter;
      const matchesFulfillment = fulfillmentFilter === "all" || order.fulfillmentMethod === fulfillmentFilter;

      return matchesQuery && matchesStatus && matchesFulfillment;
    })
    .sort((left, right) => {
      if (sortBy === "oldest") {
        return new Date(left.placedAt).getTime() - new Date(right.placedAt).getTime();
      }

      if (sortBy === "highest-total") {
        return right.total - left.total;
      }

      if (sortBy === "lowest-total") {
        return left.total - right.total;
      }

      return new Date(right.placedAt).getTime() - new Date(left.placedAt).getTime();
    });

  const selectedOrder = filteredOrders.find((order) => order.id === selectedOrderId) ?? filteredOrders[0];

  const selectedDraftStatus = selectedOrder ? draftStatuses[selectedOrder.id] ?? selectedOrder.status : "pending";

  const handleStatusUpdate = async (order: Order, nextStatus: OrderStatus) => {
    setSavingOrderId(order.id);
    setMessage(null);

    try {
      const response = await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderId: order.id,
          status: nextStatus,
          fulfillmentMethod: order.fulfillmentMethod,
        }),
      });

      const payload = (await response.json()) as OrdersResponse;

      if (!response.ok) {
        throw new Error(payload.message ?? "We could not update this order.");
      }

      setOrders(payload.orders);
      setDraftStatuses((current) => ({
        ...current,
        [order.id]: nextStatus,
      }));
      markAdminNotificationsRead([order.id]);
      setMessage({ tone: "success", text: `${order.orderNumber} updated to ${formatOrderStatus(nextStatus)}.` });
    } catch (error) {
      setMessage({
        tone: "error",
        text: error instanceof Error ? error.message : "We could not update this order.",
      });
    } finally {
      setSavingOrderId(null);
    }
  };

  if (!orders.length) {
    return (
      <div className="border border-[color:var(--admin-border)] bg-[var(--admin-panel)] p-8 text-center text-[var(--admin-muted)] shadow-[var(--admin-shadow)]">
        No orders available yet.
      </div>
    );
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[1.55fr,0.75fr]">
      <section className="border border-[color:var(--admin-border)] bg-[var(--admin-panel)] p-5 shadow-[var(--admin-shadow)]">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-wrap gap-3">
            <div className="relative min-w-[220px]">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--admin-subtle)]" />
              <Input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search order or customer"
                className="h-12 rounded-none border-[color:var(--admin-border)] bg-[var(--admin-input)] pl-11 text-[var(--admin-text)] placeholder:text-[var(--admin-subtle)] focus:border-[color:var(--admin-accent)]"
              />
            </div>
            <Select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="h-12 min-w-[160px] rounded-none border-[color:var(--admin-border)] bg-[var(--admin-input)] text-[var(--admin-text)] focus:border-[color:var(--admin-accent)]"
            >
              <option value="all">Any status</option>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="in_transit">In transit</option>
              <option value="ready_for_pickup">Ready for pickup</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </Select>
            <Select
              value={fulfillmentFilter}
              onChange={(event) => setFulfillmentFilter(event.target.value)}
              className="h-12 min-w-[160px] rounded-none border-[color:var(--admin-border)] bg-[var(--admin-input)] text-[var(--admin-text)] focus:border-[color:var(--admin-accent)]"
            >
              <option value="all">All orders</option>
              <option value="delivery">Delivery</option>
              <option value="pickup">Pickup</option>
            </Select>
          </div>

          <Select
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value)}
            className="h-12 min-w-[170px] rounded-none border-[color:var(--admin-border)] bg-[var(--admin-input)] text-[var(--admin-text)] focus:border-[color:var(--admin-accent)]"
          >
            <option value="latest">Sort by date</option>
            <option value="oldest">Oldest first</option>
            <option value="highest-total">Highest total</option>
            <option value="lowest-total">Lowest total</option>
          </Select>
        </div>

        {message ? (
          <div
            className={cn(
              "mt-5 border px-4 py-3 text-sm",
              message.tone === "success"
                ? "border-[color:var(--admin-border)] bg-[var(--admin-panel-2)] text-[var(--admin-text)]"
                : "border-[color:var(--admin-border)] bg-[var(--admin-panel-2)] text-[var(--admin-text)]",
            )}
          >
            {message.text}
          </div>
        ) : null}

        <div className="mt-5 overflow-hidden border border-[color:var(--admin-border)] bg-[var(--admin-input)]">
          <div className="grid grid-cols-[42px,1.2fr,1.45fr,1fr,0.9fr,0.9fr,38px] items-center gap-3 border-b border-[color:var(--admin-border)] px-5 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--admin-subtle)]">
            <div />
            <div>Order</div>
            <div>Customer</div>
            <div>Status</div>
            <div>Total</div>
            <div>Date</div>
            <div />
          </div>

          <div className="divide-y divide-[color:var(--admin-border)]">
            {filteredOrders.map((order) => {
              const active = selectedOrder.id === order.id;

              return (
                <button
                  key={order.id}
                  type="button"
                  onClick={() => setSelectedOrderId(order.id)}
                  className={cn(
                    "grid w-full grid-cols-[42px,1.2fr,1.45fr,1fr,0.9fr,0.9fr,38px] items-center gap-3 px-5 py-4 text-left transition hover:bg-[var(--admin-panel)]",
                    active && "bg-[var(--admin-panel)]",
                  )}
                >
                  <div className="flex justify-center">
                    <span
                      className={cn(
                        "flex h-5 w-5 items-center justify-center border text-[10px] font-bold",
                        active
                          ? "border-[color:var(--admin-accent)] bg-[var(--admin-accent)] text-[var(--admin-on-accent)]"
                          : "border-[color:var(--admin-border)] bg-transparent text-transparent",
                      )}
                    >
                      *
                    </span>
                  </div>
                  <div className="text-sm font-semibold text-[var(--admin-text)]">{order.orderNumber}</div>
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-9 w-9 items-center justify-center border border-[color:var(--admin-border)] bg-[var(--admin-panel-2)] text-xs font-semibold text-[var(--admin-text)]"
                    >
                      {getInitials(order.customerName)}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-[var(--admin-text)]">{order.customerName}</p>
                      <p className="truncate text-xs text-[var(--admin-subtle)]">{formatFulfillmentLabel(order.fulfillmentMethod)}</p>
                    </div>
                  </div>
                  <div>
                    <span className={cn("border px-3 py-1.5 text-xs font-semibold", getStatusClass(order.status))}>
                      {formatOrderStatus(order.status)}
                    </span>
                  </div>
                  <div className="text-sm font-medium text-[var(--admin-text)]">{formatCurrency(order.total)}</div>
                  <div className="text-sm text-[var(--admin-muted)]">{formatDate(order.placedAt)}</div>
                  <div className="flex justify-end text-[var(--admin-subtle)]">
                    <MoreHorizontal className="h-4 w-4" />
                  </div>
                </button>
              );
            })}

            {!filteredOrders.length ? (
              <div className="px-5 py-12 text-center text-sm text-[var(--admin-muted)]">No orders match the current filters.</div>
            ) : null}
          </div>
        </div>
      </section>

      <aside className="border border-[color:var(--admin-border)] bg-[var(--admin-panel)] shadow-[var(--admin-shadow)]">
        {!selectedOrder ? (
          <div className="flex h-full min-h-[520px] items-center justify-center px-8 text-center text-sm text-[var(--admin-muted)]">
            Select an order from the list to view customer details, items, and tracking actions.
          </div>
        ) : (
          <>
        <div className="flex items-start justify-between gap-4 border-b border-[color:var(--admin-border)] px-5 py-5">
          <div>
            <p className="text-3xl font-semibold tracking-tight text-[var(--admin-text)]">{selectedOrder.orderNumber}</p>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <span className={cn("border px-3 py-1.5 text-xs font-semibold", getStatusClass(selectedOrder.status))}>
                {formatOrderStatus(selectedOrder.status)}
              </span>
              <span className="text-sm text-[var(--admin-muted)]">{formatDate(selectedOrder.placedAt)}</span>
            </div>
          </div>
          <span className="border border-[color:var(--admin-border)] bg-[var(--admin-panel-2)] px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--admin-subtle)]">
            {formatFulfillmentLabel(selectedOrder.fulfillmentMethod)}
          </span>
        </div>

        <div className="border-b border-[color:var(--admin-border)] px-5 py-7 text-center">
          <div className="mx-auto flex h-24 w-24 items-center justify-center border border-[color:var(--admin-border)] bg-[var(--admin-panel-2)] text-2xl font-semibold text-[var(--admin-text)]">
            {getInitials(selectedOrder.customerName)}
          </div>
          <h3 className="mt-4 text-2xl font-semibold text-[var(--admin-text)]">{selectedOrder.customerName}</h3>
          <p className="mt-1 text-sm text-[var(--admin-muted)]">{selectedOrder.customerEmail}</p>

          <div className="mt-5 flex items-center justify-center gap-3">
            <a
              href={`mailto:${selectedOrder.customerEmail}`}
              aria-label={`Email ${selectedOrder.customerName}`}
              className="inline-flex h-11 w-11 items-center justify-center border border-[color:var(--admin-border)] bg-[var(--admin-panel-2)] text-[var(--admin-text)] transition hover:bg-[var(--admin-accent-soft)]"
            >
              <Mail className="h-4 w-4" />
            </a>
            <a
              href={`tel:${selectedOrder.customerPhone}`}
              aria-label={`Call ${selectedOrder.customerName}`}
              className="inline-flex h-11 w-11 items-center justify-center border border-[color:var(--admin-border)] bg-[var(--admin-panel-2)] text-[var(--admin-text)] transition hover:bg-[var(--admin-accent-soft)]"
            >
              <Phone className="h-4 w-4" />
            </a>
            <div className="inline-flex h-11 items-center border border-[color:var(--admin-border)] bg-[var(--admin-panel-2)] px-4 text-sm font-medium text-[var(--admin-muted)]">
              {selectedOrder.customerPhone}
            </div>
          </div>
        </div>

        <div className="border-b border-[color:var(--admin-border)] px-5 py-5">
          <div className="flex items-center justify-between">
            <h4 className="text-xl font-semibold text-[var(--admin-text)]">Order items</h4>
            <span className="text-sm text-[var(--admin-muted)]">{selectedOrder.items.length} items</span>
          </div>

          <div className="mt-5 space-y-4">
            {selectedOrder.items.map((item) => (
              <div key={item.id} className="flex items-center gap-3">
                <div className="relative h-14 w-14 overflow-hidden border border-[color:var(--admin-border)] bg-[var(--admin-panel-2)]">
                  <Image src={item.imageUrl} alt={item.productName} fill unoptimized className="object-cover" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-[var(--admin-text)]">{item.productName}</p>
                  <p className="mt-1 text-xs text-[var(--admin-subtle)]">
                    {item.variantName} x {item.quantity}
                  </p>
                </div>
                <p className="text-sm font-medium text-[var(--admin-text)]">{formatCurrency(item.unitPrice * item.quantity)}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="border-b border-[color:var(--admin-border)] px-5 py-5">
          <label className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--admin-subtle)]">Order status</label>
          <div className="mt-3 flex gap-3">
            <Select
              value={selectedDraftStatus}
              onChange={(event) =>
                setDraftStatuses((current) => ({
                  ...current,
                  [selectedOrder.id]: event.target.value as OrderStatus,
                }))
              }
              className="h-12 rounded-none border-[color:var(--admin-border)] bg-[var(--admin-input)] text-[var(--admin-text)] focus:border-[color:var(--admin-accent)]"
            >
              {getAllowedOrderStatuses(selectedOrder.fulfillmentMethod).map((status) => (
                <option key={status} value={status}>
                  {formatOrderStatus(status)}
                </option>
              ))}
            </Select>
            <Button
              type="button"
              onClick={() => void handleStatusUpdate(selectedOrder, selectedDraftStatus)}
              disabled={savingOrderId === selectedOrder.id}
              className="h-12 rounded-none border-[color:var(--admin-accent)] bg-[var(--admin-accent)] px-5 text-[var(--admin-on-accent)] hover:opacity-90"
            >
              {savingOrderId === selectedOrder.id ? "Saving..." : "Update"}
            </Button>
          </div>
        </div>

        <div className="px-5 py-5">
          <div className="flex items-center justify-between border-b border-[color:var(--admin-border)] pb-5">
            <span className="text-lg font-medium text-[var(--admin-text)]">Total</span>
            <span className="text-3xl font-semibold text-[var(--admin-text)]">{formatCurrency(selectedOrder.total)}</span>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <Button
              type="button"
              className="h-12 rounded-none border-[color:var(--admin-accent)] bg-[var(--admin-accent)] text-[var(--admin-on-accent)] hover:opacity-90"
              onClick={() =>
                void handleStatusUpdate(
                  selectedOrder,
                  selectedOrder.fulfillmentMethod === "pickup" ? "ready_for_pickup" : "in_transit",
                )
              }
              disabled={savingOrderId === selectedOrder.id}
            >
              <ShieldCheck className="h-4 w-4" />
              {selectedOrder.fulfillmentMethod === "pickup" ? "Ready" : "Track"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="h-12 rounded-none border-[color:var(--admin-border)] bg-[var(--admin-panel-2)] text-[var(--admin-text)] hover:bg-[var(--admin-accent-soft)]"
              onClick={() => void handleStatusUpdate(selectedOrder, "completed")}
              disabled={savingOrderId === selectedOrder.id}
            >
              Complete
            </Button>
          </div>
        </div>
          </>
        )}
      </aside>
    </div>
  );
}
