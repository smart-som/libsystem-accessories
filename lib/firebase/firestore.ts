export const firestoreCollections = {
  profiles: "profiles",
  categories: "categories",
  brands: "brands",
  products: "products",
  productVariants: "productVariants",
  productImages: "productImages",
  shippingZones: "shippingZones",
  orders: "orders",
  payments: "payments",
  inventory: "inventory",
  walkInSales: "walkInSales",
  inventoryMovements: "inventoryMovements",
} as const;

export type FirestoreCollectionName = (typeof firestoreCollections)[keyof typeof firestoreCollections];
