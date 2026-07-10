import { OrdersManager } from "@/components/admin/orders-manager";
import { getOrders } from "@/lib/catalog";

export default function AdminOrdersPage() {
  return <OrdersManager initialOrders={getOrders()} />;
}
