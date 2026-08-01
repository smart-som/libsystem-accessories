import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import path from "path";

import { readCatalogSnapshot, reserveInventoryForSale, writeCatalogSnapshot } from "@/lib/catalog-store";
import { orders as demoOrders } from "@/lib/demo-data";
import { normalizeOrderStatus } from "@/lib/order-status";
import type { CheckoutPayload, Order, OrderStatus, PaymentMethod } from "@/lib/types";

type OrdersSnapshot = {
  orders: Order[];
};

const ordersFilePath = path.join(process.cwd(), "data", "orders.json");

function ensureOrdersDirectory() {
  mkdirSync(path.dirname(ordersFilePath), { recursive: true });
}

function cloneDemoOrders(): OrdersSnapshot {
  return {
    orders: structuredClone(demoOrders).map((order) => ({
      ...order,
      status: normalizeOrderStatus(order.status),
    })),
  };
}

export function readOrdersSnapshot(): OrdersSnapshot {
  if (!existsSync(ordersFilePath)) {
    return cloneDemoOrders();
  }

  try {
    const raw = readFileSync(ordersFilePath, "utf8");
    const snapshot = JSON.parse(raw) as OrdersSnapshot;

    return {
      orders: snapshot.orders.map((order) => ({
        ...order,
        status: normalizeOrderStatus(order.status),
      })),
    };
  } catch {
    return cloneDemoOrders();
  }
}

export function writeOrdersSnapshot(snapshot: OrdersSnapshot) {
  ensureOrdersDirectory();
  writeFileSync(ordersFilePath, JSON.stringify(snapshot, null, 2));
}

export function updateOrderStatus(orderId: string, status: OrderStatus) {
  const snapshot = readOrdersSnapshot();
  const existingOrder = snapshot.orders.find((order) => order.id === orderId);

  if (!existingOrder) {
    throw new Error("Order not found.");
  }

  const updatedOrder = {
    ...existingOrder,
    status: normalizeOrderStatus(status),
  };

  snapshot.orders = snapshot.orders.map((order) => (order.id === orderId ? updatedOrder : order));
  writeOrdersSnapshot(snapshot);

  return {
    order: updatedOrder,
    snapshot,
  };
}

export function createDemoOrderFromCheckout({
  payload,
  shippingFee,
  customerId,
}: {
  payload: CheckoutPayload;
  shippingFee: number;
  customerId?: string;
}) {
  return createPaidOrderFromCheckout({
    payload,
    shippingFee,
    customerId,
    paymentReference: `DEMO-${Date.now()}`,
    paymentMethod: "card",
  }).order;
}

export function createPaidOrderFromCheckout({
  payload,
  shippingFee,
  customerId,
  paymentReference,
  paymentMethod,
}: {
  payload: CheckoutPayload;
  shippingFee: number;
  customerId?: string;
  paymentReference: string;
  paymentMethod: PaymentMethod;
}) {
  const snapshot = readOrdersSnapshot();
  const existingOrder = snapshot.orders.find((order) => order.paymentReference === paymentReference);

  if (existingOrder) {
    return { order: existingOrder, created: false };
  }

  const catalogSnapshot = readCatalogSnapshot();
  const { snapshot: nextCatalogSnapshot, reservedLines } = reserveInventoryForSale(
    catalogSnapshot,
    payload.items.map((item) => ({
      variantId: item.variantId,
      quantity: item.quantity,
    })),
  );
  const placedAt = new Date().toISOString();
  const items = reservedLines.map((line, index) => {
    return {
      id: `order-item-${Date.now()}-${index + 1}`,
      productId: line.product.id,
      productName: line.product.name,
      variantId: line.variant.id,
      variantName: line.variant.name,
      quantity: line.quantity,
      unitPrice: line.variant.price,
      unitCost: line.variant.costPrice,
      imageUrl: line.product.images[0]?.url ?? "",
    };
  });
  const subtotal = items.reduce((total, item) => total + item.unitPrice * item.quantity, 0);
  const total = subtotal + shippingFee;
  const orderCode = `${placedAt.slice(2, 4)}${placedAt.slice(5, 7)}${placedAt.slice(8, 10)}${String(snapshot.orders.length + 1).padStart(3, "0")}`;

  const order: Order = {
    id: `order-${Date.now()}`,
    orderNumber: `LS-${orderCode}`,
    customerId,
    customerName: payload.customerName.trim(),
    customerEmail: payload.customerEmail.trim().toLowerCase(),
    customerPhone: payload.customerPhone.trim(),
    status: "paid",
    channel: "online",
    paymentMethod,
    paymentReference,
    fulfillmentMethod: payload.fulfillmentMethod,
    shippingZoneId: payload.shippingZoneId,
    shippingAddress: payload.shippingAddress,
    subtotal,
    shippingFee,
    total,
    placedAt,
    items,
  };

  snapshot.orders = [order, ...snapshot.orders];
  writeCatalogSnapshot(nextCatalogSnapshot);
  writeOrdersSnapshot(snapshot);

  return { order, created: true };
}
