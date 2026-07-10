import type { FulfillmentMethod, OrderStatus } from "@/lib/types";

export function formatOrderStatus(status: OrderStatus) {
  switch (status) {
    case "in_transit":
      return "In transit";
    case "ready_for_pickup":
      return "Ready for pickup";
    case "completed":
      return "Completed";
    case "processing":
      return "Processing";
    default:
      return status
        .replaceAll("_", " ")
        .split(" ")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
  }
}

export function formatFulfillmentLabel(fulfillmentMethod: FulfillmentMethod) {
  return fulfillmentMethod === "pickup" ? "Pickup order" : "Delivery order";
}

export function getAllowedOrderStatuses(fulfillmentMethod: FulfillmentMethod): OrderStatus[] {
  if (fulfillmentMethod === "pickup") {
    return ["pending", "paid", "ready_for_pickup", "completed", "cancelled"];
  }

  return ["pending", "paid", "in_transit", "completed", "cancelled"];
}

export function normalizeOrderStatus(status: OrderStatus): OrderStatus {
  if (status === "shipped") {
    return "in_transit";
  }

  if (status === "delivered") {
    return "completed";
  }

  return status;
}
