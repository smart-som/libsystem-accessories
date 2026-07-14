import { profiles, shippingZones } from "@/lib/demo-data";
import { buildDashboardSnapshot } from "@/lib/analytics";
import { readCatalogSnapshot } from "@/lib/catalog-store";
import { isFirebaseConfigured } from "@/lib/env";
import { readOrdersSnapshot } from "@/lib/order-store";
import { readWalkInSalesSnapshot } from "@/lib/walk-in-sales-store";

function getActiveProducts(products: ReturnType<typeof readCatalogSnapshot>["products"]) {
  return products.filter((product) => product.status === "active");
}

function buildBestSellers(orders: ReturnType<typeof readOrdersSnapshot>["orders"], walkInSales: ReturnType<typeof readWalkInSalesSnapshot>["sales"]) {
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

export function getOrders() {
  return readOrdersSnapshot().orders;
}

export function getWalkInSales() {
  return readWalkInSalesSnapshot().sales;
}

export function getProfiles() {
  return profiles;
}

export function getCustomerOrders(customerEmail: string) {
  return getOrders().filter((order) => order.customerEmail === customerEmail);
}

export function getBestSellerProducts() {
  const orders = getOrders();
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

export function getDashboardData() {
  const { products } = readCatalogSnapshot();
  const orders = getOrders();
  const walkInSales = getWalkInSales();
  return buildDashboardSnapshot({ products, orders, walkInSales });
}

export function getStoreContext() {
  const snapshot = readCatalogSnapshot();
  const orders = getOrders();
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
