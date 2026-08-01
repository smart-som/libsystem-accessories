import { createHash } from "crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import path from "path";

import { readCatalogSnapshot, reserveInventoryForSale, writeCatalogSnapshot } from "@/lib/catalog-store";
import { orders as demoOrders } from "@/lib/demo-data";
import { getFirebaseAdminFirestore } from "@/lib/firebase/admin";
import { firestoreCollections } from "@/lib/firebase/firestore";
import { normalizeOrderStatus } from "@/lib/order-status";
import type { CheckoutPayload, Order, OrderStatus, PaymentMethod } from "@/lib/types";

export type OrdersSnapshot = {
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

function readLocalOrdersSnapshot(): OrdersSnapshot {
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

function firestoreDocumentId(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function toFirestoreData<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export async function readOrdersSnapshot(): Promise<OrdersSnapshot> {
  const firestore = getFirebaseAdminFirestore();

  if (!firestore) {
    return readLocalOrdersSnapshot();
  }

  const snapshot = await firestore.collection(firestoreCollections.orders).get();
  const orders = snapshot.docs
    .map((document) => document.data() as Order)
    .map((order) => ({ ...order, status: normalizeOrderStatus(order.status) }))
    .sort((left, right) => new Date(right.placedAt).getTime() - new Date(left.placedAt).getTime());

  return { orders };
}

export async function updateOrderStatus(orderId: string, status: OrderStatus) {
  const firestore = getFirebaseAdminFirestore();

  if (firestore) {
    const orderQuery = await firestore
      .collection(firestoreCollections.orders)
      .where("id", "==", orderId)
      .limit(1)
      .get();
    const orderDocument = orderQuery.docs[0];

    if (!orderDocument) {
      throw new Error("Order not found.");
    }

    await orderDocument.ref.update({ status: normalizeOrderStatus(status) });
    const snapshot = await readOrdersSnapshot();
    const order = snapshot.orders.find((entry) => entry.id === orderId);

    if (!order) {
      throw new Error("Order not found after it was updated.");
    }

    return { order, snapshot };
  }

  const snapshot = readLocalOrdersSnapshot();
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

export async function createDemoOrderFromCheckout({
  payload,
  shippingFee,
  customerId,
}: {
  payload: CheckoutPayload;
  shippingFee: number;
  customerId?: string;
}) {
  return (await createPaidOrderFromCheckout({
    payload,
    shippingFee,
    customerId,
    paymentReference: `DEMO-${Date.now()}`,
    paymentMethod: "card",
  })).order;
}

export async function createPaidOrderFromCheckout({
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
  const firestore = getFirebaseAdminFirestore();
  const orderReference = firestore
    ? firestore.collection(firestoreCollections.orders).doc(firestoreDocumentId(paymentReference))
    : null;

  if (orderReference) {
    const existingOrderDocument = await orderReference.get();

    if (existingOrderDocument.exists) {
      return { order: existingOrderDocument.data() as Order, created: false };
    }
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
  const referenceSuffix = firestoreDocumentId(paymentReference).slice(0, 6).toUpperCase();
  const orderCode = `${placedAt.slice(2, 4)}${placedAt.slice(5, 7)}${placedAt.slice(8, 10)}-${referenceSuffix}`;

  const order: Order = {
    id: `order-${firestoreDocumentId(paymentReference).slice(0, 20)}`,
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

  if (firestore && orderReference) {
    const paymentDocument = firestore.collection(firestoreCollections.payments).doc(firestoreDocumentId(paymentReference));
    const inventoryReferences = reservedLines.map((line) =>
      firestore.collection(firestoreCollections.inventory).doc(firestoreDocumentId(line.variant.id)),
    );

    return firestore.runTransaction(async (transaction) => {
      const [existingOrderDocument, ...inventoryDocuments] = await transaction.getAll(
        orderReference,
        ...inventoryReferences,
      );

      if (existingOrderDocument.exists) {
        return { order: existingOrderDocument.data() as Order, created: false };
      }

      inventoryDocuments.forEach((document, index) => {
        const line = reservedLines[index];
        const storedQuantity = document.exists ? document.get("stockQuantity") : line.variant.stockQuantity;
        const stockQuantity = typeof storedQuantity === "number" ? storedQuantity : line.variant.stockQuantity;

        if (stockQuantity < line.quantity) {
          throw new Error(`Only ${stockQuantity} unit(s) left for ${line.product.name} - ${line.variant.name}.`);
        }

        transaction.set(
          inventoryReferences[index],
          {
            productId: line.product.id,
            variantId: line.variant.id,
            sku: line.variant.sku,
            stockQuantity: stockQuantity - line.quantity,
            updatedAt: placedAt,
          },
          { merge: true },
        );
      });

      transaction.set(orderReference, toFirestoreData(order));
      transaction.set(paymentDocument, {
        orderId: order.id,
        provider: "paystack",
        providerReference: paymentReference,
        amount: total,
        status: "success",
        paidAt: placedAt,
      });

      return { order, created: true };
    });
  }

  const snapshot = readLocalOrdersSnapshot();
  const existingOrder = snapshot.orders.find((entry) => entry.paymentReference === paymentReference);

  if (existingOrder) {
    return { order: existingOrder, created: false };
  }

  snapshot.orders = [order, ...snapshot.orders];
  writeCatalogSnapshot(nextCatalogSnapshot);
  writeOrdersSnapshot(snapshot);

  return { order, created: true };
}
