import { SalesReport } from "@/components/admin/sales-report";
import { getOrders, getWalkInSales } from "@/lib/catalog";
import { getSalesRecords } from "@/lib/sales-report";

export default async function AdminSalesPage() {
  return <SalesReport sales={getSalesRecords(await getOrders(), getWalkInSales())} />;
}
