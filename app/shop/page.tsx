import { getBrands, getCategories, getStorefrontProducts } from "@/lib/catalog";
import { ShopCatalogClient } from "@/components/store/shop-catalog-client";

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; brand?: string; price?: string; query?: string }>;
}) {
  const params = await searchParams;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <div className="mb-7 max-w-3xl sm:mb-10">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Shop</p>
        <h1 className="mt-3 font-display text-3xl font-semibold leading-tight text-slate-900 sm:text-5xl">Everyday essentials and premium upgrades</h1>
        <p className="mt-4 text-sm leading-7 text-slate-600">
          Explore phone accessories, creator tools, gaming gear, and home appliances with clean filters and variant-aware browsing.
        </p>
      </div>
      <ShopCatalogClient
        key={`${params.category ?? "all"}:${params.brand ?? "all"}:${params.price ?? "all"}:${params.query ?? ""}`}
        products={await getStorefrontProducts()}
        categories={getCategories()}
        brands={getBrands()}
        initialCategory={params.category ?? "all"}
        initialBrand={params.brand ?? "all"}
        initialPrice={params.price ?? "all"}
        initialSearch={params.query ?? ""}
      />
    </div>
  );
}
