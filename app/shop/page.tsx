import { getBrands, getCategories, getProducts } from "@/lib/catalog";
import { ShopCatalogClient } from "@/components/store/shop-catalog-client";

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; query?: string }>;
}) {
  const params = await searchParams;

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-10 max-w-3xl">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Shop</p>
        <h1 className="mt-3 font-display text-5xl font-semibold text-slate-900">Everyday essentials and premium upgrades</h1>
        <p className="mt-4 text-sm leading-7 text-slate-600">
          Explore phone accessories, creator tools, gaming gear, and home appliances with clean filters and variant-aware browsing.
        </p>
      </div>
      <ShopCatalogClient
        key={`${params.category ?? "all"}:${params.query ?? ""}`}
        products={getProducts()}
        categories={getCategories()}
        brands={getBrands()}
        initialCategory={params.category ?? "all"}
        initialSearch={params.query ?? ""}
      />
    </div>
  );
}
