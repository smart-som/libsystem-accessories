import { CatalogManager } from "@/components/admin/catalog-manager";
import { getAdminProducts, getBrands, getCategories } from "@/lib/catalog";

export default function AdminProductsPage() {
  return <CatalogManager initialProducts={getAdminProducts()} initialCategories={getCategories()} initialBrands={getBrands()} />;
}
