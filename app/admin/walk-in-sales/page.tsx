import { WalkInSalesPanel } from "@/components/admin/walkin-sales-panel";
import { getAdminProducts, getWalkInSales } from "@/lib/catalog";

export default function AdminWalkInSalesPage() {
  return <WalkInSalesPanel products={getAdminProducts()} sales={getWalkInSales()} />;
}
