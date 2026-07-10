export type UserRole = "customer" | "staff" | "admin";

export type ProductStatus = "active" | "archived" | "draft";
export type OrderStatus =
  | "pending"
  | "paid"
  | "in_transit"
  | "completed"
  | "processing"
  | "ready_for_pickup"
  | "shipped"
  | "delivered"
  | "cancelled";

export type FulfillmentMethod = "delivery" | "pickup";
export type PaymentMethod = "card" | "bank_transfer" | "cash" | "pos";
export type SalesChannel = "online" | "walk_in";

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  hero: string;
}

export interface Brand {
  id: string;
  name: string;
  slug: string;
}

export interface ProductVariant {
  id: string;
  sku: string;
  name: string;
  attributes: Record<string, string>;
  stockQuantity: number;
  price: number;
  costPrice: number;
}

export interface ProductImage {
  id: string;
  url: string;
  alt: string;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  description: string;
  categoryId: string;
  brandId: string;
  marketCostPrice?: number;
  basePrice: number;
  costPrice: number;
  featured: boolean;
  status: ProductStatus;
  compatibility?: string[];
  specs: Array<{ label: string; value: string }>;
  tags: string[];
  seoTitle: string;
  seoDescription: string;
  rating: number;
  reviewCount: number;
  images: ProductImage[];
  variants: ProductVariant[];
}

export interface ShippingZone {
  id: string;
  name: string;
  regions: string[];
  fee: number;
  eta: string;
}

export interface Profile {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: UserRole;
}

export interface CartItem {
  productId: string;
  variantId: string;
  quantity: number;
}

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  variantId: string;
  variantName: string;
  quantity: number;
  unitPrice: number;
  unitCost: number;
  imageUrl: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerId?: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  status: OrderStatus;
  channel: "online";
  paymentMethod: PaymentMethod;
  paymentReference: string;
  fulfillmentMethod: FulfillmentMethod;
  shippingZoneId?: string;
  shippingAddress?: string;
  subtotal: number;
  shippingFee: number;
  total: number;
  placedAt: string;
  items: OrderItem[];
}

export interface WalkInSaleItem {
  id: string;
  productId: string;
  productName: string;
  variantId: string;
  variantName: string;
  quantity: number;
  unitPrice: number;
  unitCost: number;
}

export interface WalkInSale {
  id: string;
  receiptNumber: string;
  recordedBy: string;
  customerName?: string;
  customerPhone?: string;
  paymentMethod: PaymentMethod;
  soldAt: string;
  subtotal: number;
  total: number;
  items: WalkInSaleItem[];
}

export interface SalesRecord {
  id: string;
  reference: string;
  channel: SalesChannel;
  customerName: string;
  customerPhone: string;
  paymentMethod: PaymentMethod;
  status: string;
  fulfillmentMethod?: FulfillmentMethod;
  subtotal: number;
  total: number;
  units: number;
  soldAt: string;
  itemsSummary: string;
}

export interface InventoryMovement {
  id: string;
  productId: string;
  variantId: string;
  quantityChange: number;
  reason: "online_order" | "walk_in_sale" | "restock" | "adjustment";
  referenceId: string;
  createdAt: string;
}

export interface DashboardKPI {
  label: string;
  value: number;
  change: number;
  helper: string;
}

export interface SalesTrendPoint {
  label: string;
  revenue: number;
  profit: number;
  orders: number;
}

export interface ChannelSplitPoint {
  name: string;
  value: number;
  color: string;
}

export interface DashboardSnapshot {
  kpis: DashboardKPI[];
  salesTrend: SalesTrendPoint[];
  channelSplit: ChannelSplitPoint[];
  bestSellingProducts: Array<{ name: string; unitsSold: number; revenue: number }>;
  highestProfitProducts: Array<{ name: string; profit: number }>;
  lowStockProducts: Array<{ name: string; stock: number }>;
}

export interface CheckoutPayload {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingZoneId?: string;
  shippingAddress?: string;
  fulfillmentMethod: FulfillmentMethod;
  createAccount: boolean;
  items: Array<{
    productId: string;
    variantId: string;
    quantity: number;
  }>;
}
