"use client";

import { ChevronDown, Search, SlidersHorizontal } from "lucide-react";
import { useDeferredValue, useMemo, useState } from "react";

import { ProductCard } from "@/components/store/product-card";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { Brand, Category, Product } from "@/lib/types";

type ShopCatalogClientProps = {
  products: Product[];
  categories: Category[];
  brands: Brand[];
  initialCategory?: string;
  initialBrand?: string;
  initialPrice?: string;
  initialSearch?: string;
};

export function ShopCatalogClient({
  products,
  categories,
  brands,
  initialCategory = "all",
  initialBrand = "all",
  initialPrice = "all",
  initialSearch = "",
}: ShopCatalogClientProps) {
  const [search, setSearch] = useState(initialSearch);
  const [category, setCategory] = useState(initialCategory);
  const [brand, setBrand] = useState(initialBrand);
  const [price, setPrice] = useState(initialPrice);
  const deferredSearch = useDeferredValue(search);
  const activeFilterCount = Number(category !== "all") + Number(brand !== "all") + Number(price !== "all");

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch =
        deferredSearch.length === 0 ||
        `${product.name} ${product.shortDescription} ${product.tags.join(" ")}`.toLowerCase().includes(deferredSearch.toLowerCase());
      const categoryEntry = categories.find((entry) => entry.id === product.categoryId);
      const brandEntry = brands.find((entry) => entry.id === product.brandId);
      const matchesCategory = category === "all" || categoryEntry?.slug === category;
      const matchesBrand = brand === "all" || brandEntry?.slug === brand;
      const variantPrice = product.variants[0]?.price ?? product.basePrice;
      const matchesPrice =
        price === "all" ||
        (price === "under-50000" && variantPrice < 50000) ||
        (price === "50000-100000" && variantPrice >= 50000 && variantPrice <= 100000) ||
        (price === "100000-plus" && variantPrice > 100000);

      return matchesSearch && matchesCategory && matchesBrand && matchesPrice;
    });
  }, [brands, categories, category, brand, deferredSearch, price, products]);

  return (
    <div className="min-w-0">
      <div id="product-search" className="mb-6 scroll-mt-24 lg:hidden">
        <form action="/shop" className="flex items-center gap-2">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <Input
              type="search"
              name="query"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search products"
              aria-label="Search products"
              className="pl-11"
            />
          </div>
          <button type="submit" className="inline-flex h-12 shrink-0 items-center justify-center rounded-2xl bg-slate-900 px-4 text-sm font-semibold text-white">
            Search
          </button>
        </form>

        <details className="group mt-3">
          <summary className="flex cursor-pointer list-none items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-800 [&::-webkit-details-marker]:hidden">
            <span className="inline-flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4" />
              Filter products
              {activeFilterCount > 0 ? (
                <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-slate-900 px-1 text-[10px] font-bold text-white">{activeFilterCount}</span>
              ) : null}
            </span>
            <ChevronDown className="h-4 w-4 transition group-open:rotate-180" />
          </summary>

          <form action="/shop" className="mt-3 space-y-5 rounded-[24px] border border-slate-200 bg-white p-5 shadow-lg">
            {search ? <input type="hidden" name="query" value={search} /> : null}

            <div className="space-y-2">
              <label htmlFor="mobile-category-filter" className="text-xs uppercase tracking-[0.3em] text-slate-500">Category</label>
              <Select id="mobile-category-filter" name="category" value={category} onChange={(event) => setCategory(event.target.value)}>
                <option value="all">All categories</option>
                {categories.map((entry) => <option key={entry.id} value={entry.slug}>{entry.name}</option>)}
              </Select>
            </div>
            <div className="space-y-2">
              <label htmlFor="mobile-brand-filter" className="text-xs uppercase tracking-[0.3em] text-slate-500">Brand</label>
              <Select id="mobile-brand-filter" name="brand" value={brand} onChange={(event) => setBrand(event.target.value)}>
                <option value="all">All brands</option>
                {brands.map((entry) => <option key={entry.id} value={entry.slug}>{entry.name}</option>)}
              </Select>
            </div>
            <div className="space-y-2">
              <label htmlFor="mobile-price-filter" className="text-xs uppercase tracking-[0.3em] text-slate-500">Price range</label>
              <Select id="mobile-price-filter" name="price" value={price} onChange={(event) => setPrice(event.target.value)}>
                <option value="all">Any budget</option>
                <option value="under-50000">Under NGN 50,000</option>
                <option value="50000-100000">NGN 50,000 - 100,000</option>
                <option value="100000-plus">Above NGN 100,000</option>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <a href={search ? `/shop?query=${encodeURIComponent(search)}` : "/shop"} className="inline-flex h-12 items-center justify-center rounded-2xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700">Clear filters</a>
              <button type="submit" className="inline-flex h-12 items-center justify-center rounded-2xl bg-slate-900 px-3 text-center text-sm font-semibold text-white">Show products</button>
            </div>
          </form>
        </details>
      </div>

      <div className="grid min-w-0 gap-8 lg:grid-cols-[320px,minmax(0,1fr)]">
      <Card className="hidden h-fit space-y-5 lg:block">
        <div className="flex items-center gap-3">
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-50 text-sky-500">
            <SlidersHorizontal className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-display text-xl font-semibold text-slate-900">Refine your search</h2>
            <p className="text-sm text-slate-600">Filter by category, brand, and budget.</p>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs uppercase tracking-[0.3em] text-slate-500">Search</label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Power bank, headset, blender..."
              className="pl-11"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs uppercase tracking-[0.3em] text-slate-500">Category</label>
          <Select value={category} onChange={(event) => setCategory(event.target.value)}>
            <option value="all">All categories</option>
            {categories.map((entry) => (
              <option key={entry.id} value={entry.slug}>
                {entry.name}
              </option>
            ))}
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-xs uppercase tracking-[0.3em] text-slate-500">Brand</label>
          <Select value={brand} onChange={(event) => setBrand(event.target.value)}>
            <option value="all">All brands</option>
            {brands.map((entry) => (
              <option key={entry.id} value={entry.slug}>
                {entry.name}
              </option>
            ))}
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-xs uppercase tracking-[0.3em] text-slate-500">Price range</label>
          <Select value={price} onChange={(event) => setPrice(event.target.value)}>
            <option value="all">Any budget</option>
            <option value="under-50000">Under NGN 50,000</option>
            <option value="50000-100000">NGN 50,000 - 100,000</option>
            <option value="100000-plus">Above NGN 100,000</option>
          </Select>
        </div>
      </Card>

      <div className="min-w-0 space-y-6">
        <div className="flex flex-col gap-2 rounded-[24px] border border-slate-200 bg-slate-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:rounded-[28px] sm:px-6 sm:py-5">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Results</p>
            <h2 className="font-display text-2xl font-semibold text-slate-900">{filteredProducts.length} products available</h2>
          </div>
          <p className="text-sm text-slate-600 sm:max-w-xs sm:text-right">Fast charging, creator gear, gaming, and home essentials.</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
      </div>

    </div>
  );
}
