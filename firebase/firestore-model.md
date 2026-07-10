# Firestore Model

This project previously used a relational schema as the source of truth for planned production data. For Firebase, the closest starting point is a document-oriented structure like this:

## Top-level collections

- `profiles`
- `categories`
- `brands`
- `products`
- `productVariants`
- `productImages`
- `shippingZones`
- `orders`
- `payments`
- `walkInSales`
- `inventoryMovements`

## Suggested document shapes

### `profiles/{uid}`

```ts
{
  fullName: string
  email: string
  phone?: string
  role: "customer" | "staff" | "admin"
  createdAt: Timestamp
  updatedAt: Timestamp
}
```

### `products/{productId}`

```ts
{
  categoryId: string
  brandId: string
  name: string
  slug: string
  shortDescription?: string
  description?: string
  basePrice: number
  costPrice: number
  featured: boolean
  status: "active" | "archived" | "draft"
  compatibility: string[]
  tags: string[]
  seoTitle?: string
  seoDescription?: string
  rating: number
  reviewCount: number
  createdAt: Timestamp
  updatedAt: Timestamp
}
```

### `productVariants/{variantId}`

```ts
{
  productId: string
  sku: string
  name: string
  attributes: Record<string, string>
  stockQuantity: number
  price: number
  costPrice: number
  createdAt: Timestamp
  updatedAt: Timestamp
}
```

### `orders/{orderId}`

```ts
{
  orderNumber: string
  customerId?: string
  customerName: string
  customerEmail: string
  customerPhone?: string
  status: "pending" | "paid" | "processing" | "ready_for_pickup" | "shipped" | "delivered" | "cancelled"
  paymentMethod: "card" | "bank_transfer" | "cash" | "pos"
  paymentReference?: string
  fulfillmentMethod: "delivery" | "pickup"
  shippingZoneId?: string
  shippingAddress?: string
  subtotal: number
  shippingFee: number
  total: number
  placedAt: Timestamp
}
```

### `walkInSales/{saleId}`

```ts
{
  receiptNumber: string
  recordedBy: string
  customerName?: string
  customerPhone?: string
  paymentMethod: "card" | "bank_transfer" | "cash" | "pos"
  subtotal: number
  total: number
  soldAt: Timestamp
}
```

## Notes

- If you want tighter document locality, `productVariants`, `productImages`, `orderItems`, and `walkInSaleItems` can be nested as subcollections under their parent documents instead of staying top-level.
- Admin/staff authorization should be enforced with Firebase Auth custom claims plus Firestore security rules.
- For analytics-heavy views, you may eventually want derived aggregate documents instead of querying large transactional collections directly.
