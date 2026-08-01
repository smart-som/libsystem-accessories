import { OrdersManager } from "@/components/admin/orders-manager";
import { getOrders } from "@/lib/catalog";

export default async function AdminOrdersPage() {
  return <OrdersManager initialOrders={await getOrders()} />;
}
