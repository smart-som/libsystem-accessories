import { cache } from "react";

import { profiles, shippingZones } from "@/lib/demo-data";
import { buildDashboardSnapshot } from "@/lib/analytics";
import { readCatalogSnapshot } from "@/lib/catalog-store";
import { isFirebaseConfigured } from "@/lib/env";
import { getFirebaseAdminFirestore } from "@/lib/firebase/admin";
import { firestoreCollections } from "@/lib/firebase/firestore";
import { readOrdersSnapshot } from "@/lib/order-store";
import { readWalkInSalesSnapshot } from "@/lib/walk-in-sales-store";
import type { Order, Product } from "@/lib/types";

function getActiveProducts(products: ReturnType<typeof readCatalogSnapshot>["products"]) {
  return products.filter((product) => product.status === "active");
}

function buildBestSellers(orders: Order[], walkInSales: ReturnType<typeof readWalkInSalesSnapshot>["sales"]) {
  const totals = new Map<string, { name: string; unitsSold: number }>();

  for (const order of orders) {
    for (const item of order.items) {
      const current = totals.get(item.productId) ?? { name: item.productName, unitsSold: 0 };
      current.unitsSold += item.quantity;
      totals.set(item.productId, current);
    }
  }

  for (const sale of walkInSales) {
    for (const item of sale.items) {
      const current = totals.get(item.productId) ?? { name: item.productName, unitsSold: 0 };
      current.unitsSold += item.quantity;
      totals.set(item.productId, current);
    }
  }

  return [...totals.values()].sort((a, b) => b.unitsSold - a.unitsSold).slice(0, 4);
}

export function getNavigationCatalog() {
  const snapshot = readCatalogSnapshot();
  return { categories: snapshot.categories, products: getActiveProducts(snapshot.products) };
}

export function getCategories() {
  return readCatalogSnapshot().categories;
}

export function getBrands() {
  return readCatalogSnapshot().brands;
}

export function getProducts() {
  return getActiveProducts(readCatalogSnapshot().products);
}

export function getAdminProducts() {
  return readCatalogSnapshot().products;
}

export function getFeaturedProducts() {
  return getProducts().filter((product) => product.featured);
}

export function getProductBySlug(slug: string) {
  return getProducts().find((product) => product.slug === slug);
}

export function getRelatedProducts(categoryId: string, productId: string) {
  return getProducts()
    .filter((product) => product.categoryId === categoryId && product.id !== productId)
    .slice(0, 4);
}

export function getShippingZones() {
  return shippingZones;
}

export const getOrders = cache(async function getOrders() {
  return (await readOrdersSnapshot()).orders;
});

export function getWalkInSales() {
  return readWalkInSalesSnapshot().sales;
}

export function getProfiles() {
  return profiles;
}

export async function getCustomerOrders(customerEmail: string) {
  return (await getOrders()).filter((order) => order.customerEmail === customerEmail.trim().toLowerCase());
}

async function applyDurableInventory(products: Product[], requireInventory: boolean) {
  const firestore = getFirebaseAdminFirestore();

  if (!firestore) {
    if (requireInventory) {
      throw new Error("Live inventory is unavailable.");
    }

    return products;
  }

  try {
    const inventorySnapshot = await firestore.collection(firestoreCollections.inventory).get();

    if (inventorySnapshot.empty) {
      return products;
    }

    const quantities = new Map<string, number>();
    inventorySnapshot.docs.forEach((document) => {
      const variantId = document.get("variantId");
      const stockQuantity = document.get("stockQuantity");

      if (typeof variantId === "string" && typeof stockQuantity === "number") {
        quantities.set(variantId, stockQuantity);
      }
    });

    return products
      .map((product) => {
        const variants = product.variants.map((variant) => ({
          ...variant,
          stockQuantity: quantities.get(variant.id) ?? variant.stockQuantity,
        }));
        const totalStock = variants.reduce((total, variant) => total + variant.stockQuantity, 0);

        return {
          ...product,
          variants,
          status: totalStock <= 0 ? ("archived" as const) : product.status,
        };
      })
      .filter((product) => product.status === "active");
  } catch (error) {
    console.error("[catalog/inventory] Firestore inventory read failed.", {
      message: error instanceof Error ? error.message : String(error),
    });

    if (requireInventory) {
      throw new Error("Live inventory is temporarily unavailable.", { cause: error });
    }

    return products;
  }
}

export async function getStorefrontProducts(options: { requireInventory?: boolean } = {}) {
  const products = getActiveProducts(readCatalogSnapshot().products);
  return applyDurableInventory(products, options.requireInventory ?? false);
}

export async function getStorefrontNavigationCatalog() {
  const snapshot = readCatalogSnapshot();
  return {
    categories: snapshot.categories,
    products: await applyDurableInventory(getActiveProducts(snapshot.products), false),
  };
}

export async function getBestSellerProducts() {
  const orders = await getOrders();
  const walkInSales = getWalkInSales();
  return buildBestSellers(orders, walkInSales);
}

export function getInventoryStatus() {
  return getProducts()
    .map((product) => ({
      product,
      stock: product.variants.reduce((total, variant) => total + variant.stockQuantity, 0),
    }))
    .sort((a, b) => a.stock - b.stock);
}

export async function getDashboardData() {
  const { products } = readCatalogSnapshot();
  const orders = await getOrders();
  const walkInSales = getWalkInSales();
  return buildDashboardSnapshot({ products, orders, walkInSales });
}

export async function getStoreContext() {
  const snapshot = readCatalogSnapshot();
  const orders = await getOrders();
  const walkInSales = getWalkInSales();
  const products = getActiveProducts(snapshot.products);

  return {
    isDemoMode: !isFirebaseConfigured,
    categories: snapshot.categories,
    brands: snapshot.brands,
    products,
    featuredProducts: products.filter((product) => product.featured),
    bestSellers: buildBestSellers(orders, walkInSales),
    shippingZones,
    orders,
    walkInSales,
    dashboard: buildDashboardSnapshot({ products: snapshot.products, orders, walkInSales }),
    profiles,
  };
}
