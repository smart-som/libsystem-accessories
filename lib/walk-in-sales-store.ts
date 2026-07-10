import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

import { walkInSales as demoWalkInSales } from "@/lib/demo-data";
import { readCatalogSnapshot, reserveInventoryForSale, writeCatalogSnapshot } from "@/lib/catalog-store";
import type { PaymentMethod, WalkInSale } from "@/lib/types";

type WalkInSalesSnapshot = {
  sales: WalkInSale[];
};

type CreateWalkInSaleInput = {
  recordedBy: string;
  customerName?: string;
  customerPhone?: string;
  paymentMethod: PaymentMethod;
  lines: Array<{
    variantId: string;
    quantity: number;
    unitPrice?: number;
  }>;
};

const walkInSalesFilePath = path.join(process.cwd(), "data", "walk-in-sales.json");

function cloneDemoWalkInSales(): WalkInSalesSnapshot {
  return {
    sales: structuredClone(demoWalkInSales),
  };
}

function ensureWalkInSalesDirectory() {
  mkdirSync(path.dirname(walkInSalesFilePath), { recursive: true });
}

export function readWalkInSalesSnapshot(): WalkInSalesSnapshot {
  if (!existsSync(walkInSalesFilePath)) {
    return cloneDemoWalkInSales();
  }

  try {
    const raw = readFileSync(walkInSalesFilePath, "utf8");
    return JSON.parse(raw) as WalkInSalesSnapshot;
  } catch {
    return cloneDemoWalkInSales();
  }
}

export function writeWalkInSalesSnapshot(snapshot: WalkInSalesSnapshot) {
  ensureWalkInSalesDirectory();
  writeFileSync(walkInSalesFilePath, JSON.stringify(snapshot, null, 2));
}

export function createWalkInSale(input: CreateWalkInSaleInput) {
  const catalogSnapshot = readCatalogSnapshot();
  const { snapshot: nextCatalogSnapshot, reservedLines } = reserveInventoryForSale(
    catalogSnapshot,
    input.lines.map((line) => ({
      variantId: line.variantId,
      quantity: line.quantity,
    })),
  );
  const salesSnapshot = readWalkInSalesSnapshot();
  const soldAt = new Date().toISOString();
  const receiptSuffix = `${soldAt.slice(2, 4)}${soldAt.slice(5, 7)}${soldAt.slice(8, 10)}${String(salesSnapshot.sales.length + 1).padStart(3, "0")}`;
  const items = reservedLines.map((line, index) => {
    const customLine = input.lines[index];
    const unitPrice = customLine?.unitPrice && customLine.unitPrice > 0 ? customLine.unitPrice : line.variant.price;

    return {
      id: `walk-item-${Date.now()}-${index + 1}`,
      productId: line.product.id,
      productName: line.product.name,
      variantId: line.variant.id,
      variantName: line.variant.name,
      quantity: line.quantity,
      unitPrice,
      unitCost: line.variant.costPrice,
    };
  });
  const subtotal = items.reduce((total, item) => total + item.unitPrice * item.quantity, 0);
  const sale: WalkInSale = {
    id: `walk-${Date.now()}`,
    receiptNumber: `WK-${receiptSuffix}`,
    recordedBy: input.recordedBy,
    customerName: input.customerName?.trim() || undefined,
    customerPhone: input.customerPhone?.trim() || undefined,
    paymentMethod: input.paymentMethod,
    soldAt,
    subtotal,
    total: subtotal,
    items,
  };

  salesSnapshot.sales = [sale, ...salesSnapshot.sales];
  writeCatalogSnapshot(nextCatalogSnapshot);
  writeWalkInSalesSnapshot(salesSnapshot);

  return {
    sale,
    salesSnapshot,
    catalogSnapshot: nextCatalogSnapshot,
  };
}
