import { formatFulfillmentLabel, formatOrderStatus } from "@/lib/order-status";
import type { Order, SalesRecord, WalkInSale } from "@/lib/types";

function normalizePaymentMethod(value: string) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (character) => character.toUpperCase());
}

function escapeCsvValue(value: string | number) {
  const normalized = String(value ?? "");
  if (/[",\n]/.test(normalized)) {
    return `"${normalized.replace(/"/g, "\"\"")}"`;
  }

  return normalized;
}

export function getSalesRecords(orders: Order[], walkInSales: WalkInSale[]): SalesRecord[] {
  const onlineRecords: SalesRecord[] = orders.map((order) => ({
    id: order.id,
    reference: order.orderNumber,
    channel: "online",
    customerName: order.customerName,
    customerPhone: order.customerPhone,
    paymentMethod: order.paymentMethod,
    status: formatOrderStatus(order.status),
    fulfillmentMethod: order.fulfillmentMethod,
    subtotal: order.subtotal,
    total: order.total,
    units: order.items.reduce((total, item) => total + item.quantity, 0),
    soldAt: order.placedAt,
    itemsSummary: order.items.map((item) => `${item.productName} x ${item.quantity}`).join("; "),
  }));

  const walkInRecords: SalesRecord[] = walkInSales.map((sale) => ({
    id: sale.id,
    reference: sale.receiptNumber,
    channel: "walk_in",
    customerName: sale.customerName?.trim() || "Walk-in customer",
    customerPhone: sale.customerPhone?.trim() || "-",
    paymentMethod: sale.paymentMethod,
    status: "Completed",
    subtotal: sale.subtotal,
    total: sale.total,
    units: sale.items.reduce((total, item) => total + item.quantity, 0),
    soldAt: sale.soldAt,
    itemsSummary: sale.items.map((item) => `${item.productName} x ${item.quantity}`).join("; "),
  }));

  return [...onlineRecords, ...walkInRecords].sort(
    (left, right) => new Date(right.soldAt).getTime() - new Date(left.soldAt).getTime(),
  );
}

export function buildSalesCsv(records: SalesRecord[]) {
  const header = [
    "Reference",
    "Channel",
    "Date",
    "Customer",
    "Phone",
    "Payment Method",
    "Status",
    "Fulfillment",
    "Units",
    "Subtotal",
    "Total",
    "Items",
  ];
  const rows = records.map((record) => [
    record.reference,
    record.channel === "online" ? "Online" : "Walk-in",
    record.soldAt,
    record.customerName,
    record.customerPhone,
    normalizePaymentMethod(record.paymentMethod),
    record.status,
    record.fulfillmentMethod ? formatFulfillmentLabel(record.fulfillmentMethod) : "Walk-in",
    record.units,
    record.subtotal,
    record.total,
    record.itemsSummary,
  ]);

  return [header, ...rows]
    .map((row) => row.map((value) => escapeCsvValue(value)).join(","))
    .join("\n");
}
