"use client";

import { Search, SlidersHorizontal } from "lucide-react";
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
  initialSearch?: string;
};

export function ShopCatalogClient({
  products,
  categories,
  brands,
  initialCategory = "all",
  initialSearch = "",
}: ShopCatalogClientProps) {
  const [search, setSearch] = useState(initialSearch);
  const [category, setCategory] = useState(initialCategory);
  const [brand, setBrand] = useState("all");
  const [price, setPrice] = useState("all");
  const deferredSearch = useDeferredValue(search);

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
    <div className="grid gap-8 lg:grid-cols-[320px,1fr]">
      <Card className="h-fit space-y-5">
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

      <div className="space-y-6">
        <div className="flex items-center justify-between rounded-[28px] border border-slate-200 bg-slate-50 px-6 py-5">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Results</p>
            <h2 className="font-display text-2xl font-semibold text-slate-900">{filteredProducts.length} products available</h2>
          </div>
          <p className="text-sm text-slate-600">Fast charging, creator gear, gaming, and home essentials.</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </div>
  );
}
