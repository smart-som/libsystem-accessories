"use client";

import type { ChangeEvent, FormEvent } from "react";
import { useEffect, useRef, useState } from "react";
import { PencilLine, PlusCircle, Save, Sparkles, Trash2 } from "lucide-react";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { formatCurrency } from "@/lib/format";
import {
  getProfitMarginAmount,
  getRecommendedSalesPrice,
  getTotalProjectedProfit,
  getUnitCostPrice,
} from "@/lib/product-pricing";
import type { Brand, Category, Product } from "@/lib/types";

type ProductDraft = {
  productId: string;
  name: string;
  shortDescription: string;
  description: string;
  categoryId: string;
  brandId: string;
  marketCostPrice: string;
  salesPrice: string;
  unitInStock: string;
  sku: string;
  variantName: string;
  imageUrlsText: string;
};

type CatalogResponse = {
  categories: Category[];
  brands: Brand[];
  products: Product[];
  product?: Product;
  message?: string;
};

function getTotalStock(product: Product) {
  return product.variants.reduce((total, variant) => total + variant.stockQuantity, 0);
}

function getBatchMarketCost(product: Product) {
  const totalStock = getTotalStock(product);
  return product.marketCostPrice ?? product.costPrice * Math.max(totalStock, 1);
}

function parseImageUrls(imageUrlsText: string) {
  return imageUrlsText
    .split("\n")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function createEmptyDraft(categories: Category[], brands: Brand[]): ProductDraft {
  return {
    productId: "",
    name: "",
    shortDescription: "",
    description: "",
    categoryId: categories[0]?.id ?? "",
    brandId: brands[0]?.id ?? "",
    marketCostPrice: "",
    salesPrice: "",
    unitInStock: "",
    sku: "",
    variantName: "Standard",
    imageUrlsText: "",
  };
}

function createDraftFromProduct(product: Product): ProductDraft {
  const primaryVariant = product.variants[0];

  return {
    productId: product.id,
    name: product.name,
    shortDescription: product.shortDescription,
    description: product.description,
    categoryId: product.categoryId,
    brandId: product.brandId,
    marketCostPrice: String(getBatchMarketCost(product)),
    salesPrice: String(primaryVariant?.price ?? product.basePrice),
    unitInStock: String(getTotalStock(product)),
    sku: primaryVariant?.sku ?? "",
    variantName: primaryVariant?.name ?? "Standard",
    imageUrlsText: product.images.map((image) => image.url).join("\n"),
  };
}

function getProductStatusLabel(product: Product) {
  if (getTotalStock(product) <= 0) {
    return "Inactive";
  }

  if (product.status === "draft") {
    return "Draft";
  }

  return "Active";
}

export function CatalogManager({
  initialProducts,
  initialCategories,
  initialBrands,
}: {
  initialProducts: Product[];
  initialCategories: Category[];
  initialBrands: Brand[];
}) {
  const [products, setProducts] = useState(initialProducts);
  const [categories, setCategories] = useState(initialCategories);
  const [brands, setBrands] = useState(initialBrands);
  const [draft, setDraft] = useState(() => createEmptyDraft(initialCategories, initialBrands));
  const [categoryForm, setCategoryForm] = useState({ name: "", description: "", hero: "" });
  const [brandForm, setBrandForm] = useState({ name: "" });
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [isSavingProduct, setIsSavingProduct] = useState(false);
  const [isSavingCategory, setIsSavingCategory] = useState(false);
  const [isSavingBrand, setIsSavingBrand] = useState(false);
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [message, setMessage] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const composerRef = useRef<HTMLDivElement | null>(null);
  const productNameInputRef = useRef<HTMLInputElement | null>(null);
  const pictureInputRef = useRef<HTMLInputElement | null>(null);

  const parsedMarketCostPrice = Number(draft.marketCostPrice || 0);
  const parsedSalesPrice = Number(draft.salesPrice || 0);
  const parsedUnitInStock = Number(draft.unitInStock || 0);
  const unitCostPrice = getUnitCostPrice(parsedMarketCostPrice, parsedUnitInStock);
  const recommendedSalesPrice = getRecommendedSalesPrice(parsedMarketCostPrice, parsedUnitInStock);
  const profitAmount = getProfitMarginAmount(parsedMarketCostPrice, parsedUnitInStock, parsedSalesPrice);
  const totalProjectedProfit = getTotalProjectedProfit(parsedMarketCostPrice, parsedUnitInStock, parsedSalesPrice);
  const draftImageUrls = parseImageUrls(draft.imageUrlsText);
  const isEditing = Boolean(draft.productId);

  useEffect(() => {
    if (!isComposerOpen) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      composerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      productNameInputRef.current?.focus();
    }, 80);

    return () => window.clearTimeout(timeoutId);
  }, [isComposerOpen, draft.productId]);

  const resetProductDraft = () => {
    setDraft(createEmptyDraft(categories, brands));
    setSelectedFiles([]);
    if (pictureInputRef.current) {
      pictureInputRef.current.value = "";
    }
  };

  const openNewProductComposer = () => {
    resetProductDraft();
    setIsComposerOpen(true);
    setMessage(null);
  };

  const updateDraft = (field: keyof ProductDraft) => (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { value } = event.target;
    setDraft((current) => ({ ...current, [field]: value }));
  };

  const handleProductSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);
    setIsSavingProduct(true);

    try {
      const formData = new FormData();
      formData.append("productId", draft.productId);
      formData.append("name", draft.name);
      formData.append("shortDescription", draft.shortDescription);
      formData.append("description", draft.description);
      formData.append("categoryId", draft.categoryId);
      formData.append("brandId", draft.brandId);
      formData.append("marketCostPrice", draft.marketCostPrice);
      formData.append("salesPrice", draft.salesPrice);
      formData.append("unitInStock", draft.unitInStock);
      formData.append("sku", draft.sku);
      formData.append("variantName", draft.variantName);
      formData.append("imageUrls", JSON.stringify(draftImageUrls));

      for (const file of selectedFiles) {
        formData.append("pictures", file);
      }

      const response = await fetch("/api/admin/catalog", {
        method: "POST",
        body: formData,
      });

      const payload = (await response.json()) as CatalogResponse;

      if (!response.ok) {
        throw new Error(payload.message ?? "We could not save this product.");
      }

      setProducts(payload.products);
      setCategories(payload.categories);
      setBrands(payload.brands);

      if (payload.product) {
        setDraft(createDraftFromProduct(payload.product));
      }

      if (pictureInputRef.current) {
        pictureInputRef.current.value = "";
      }

      setSelectedFiles([]);
      setIsComposerOpen(true);
      setMessage({
        tone: "success",
        text: isEditing ? "Product updated successfully." : "New product created successfully.",
      });
    } catch (error) {
      setMessage({
        tone: "error",
        text: error instanceof Error ? error.message : "We could not save this product.",
      });
    } finally {
      setIsSavingProduct(false);
    }
  };

  const handleDeleteProduct = async (product: Product) => {
    if (getTotalStock(product) > 0) {
      return;
    }

    if (!window.confirm(`Delete ${product.name}? This cannot be undone.`)) {
      return;
    }

    setMessage(null);
    setDeletingProductId(product.id);

    try {
      const response = await fetch(`/api/admin/catalog?productId=${product.id}`, {
        method: "DELETE",
      });

      const payload = (await response.json()) as CatalogResponse;

      if (!response.ok) {
        throw new Error(payload.message ?? "We could not delete this product.");
      }

      setProducts(payload.products);

      if (draft.productId === product.id) {
        resetProductDraft();
        setIsComposerOpen(false);
      }

      setMessage({ tone: "success", text: "Product deleted successfully." });
    } catch (error) {
      setMessage({
        tone: "error",
        text: error instanceof Error ? error.message : "We could not delete this product.",
      });
    } finally {
      setDeletingProductId(null);
    }
  };

  const handleCategorySubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);
    setIsSavingCategory(true);

    try {
      const response = await fetch("/api/admin/catalog/options", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          kind: "category",
          ...categoryForm,
        }),
      });

      const payload = (await response.json()) as CatalogResponse & { category?: Category };

      if (!response.ok) {
        throw new Error(payload.message ?? "We could not create this category.");
      }

      setCategories(payload.categories);
      setBrands(payload.brands);
      setProducts(payload.products);
      setCategoryForm({ name: "", description: "", hero: "" });

      if (payload.category) {
        setDraft((current) => ({
          ...current,
          categoryId: payload.category?.id ?? current.categoryId,
        }));
      }

      setMessage({ tone: "success", text: "Category added successfully." });
    } catch (error) {
      setMessage({
        tone: "error",
        text: error instanceof Error ? error.message : "We could not create this category.",
      });
    } finally {
      setIsSavingCategory(false);
    }
  };

  const handleBrandSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);
    setIsSavingBrand(true);

    try {
      const response = await fetch("/api/admin/catalog/options", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          kind: "brand",
          ...brandForm,
        }),
      });

      const payload = (await response.json()) as CatalogResponse & { brand?: Brand };

      if (!response.ok) {
        throw new Error(payload.message ?? "We could not create this brand.");
      }

      setCategories(payload.categories);
      setBrands(payload.brands);
      setProducts(payload.products);
      setBrandForm({ name: "" });

      if (payload.brand) {
        setDraft((current) => ({
          ...current,
          brandId: payload.brand?.id ?? current.brandId,
        }));
      }

      setMessage({ tone: "success", text: "Brand added successfully." });
    } catch (error) {
      setMessage({
        tone: "error",
        text: error instanceof Error ? error.message : "We could not create this brand.",
      });
    } finally {
      setIsSavingBrand(false);
    }
  };

  return (
    <div className="space-y-6">
      {message ? (
        <div
          className={`border px-4 py-3 text-sm ${
            message.tone === "success"
              ? "border-[color:var(--admin-border)] bg-[var(--admin-panel-2)] text-[var(--admin-text)]"
              : "border-[color:var(--admin-border)] bg-[var(--admin-panel-2)] text-[var(--admin-text)]"
          }`}
        >
          {message.text}
        </div>
      ) : null}

      <Card className="border-[color:var(--admin-border)] bg-[var(--admin-panel)] text-[var(--admin-text)] shadow-[var(--admin-shadow)] rounded-none">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-[var(--admin-subtle)]">Catalog inventory</p>
            <h2 className="mt-3 font-display text-2xl font-semibold text-[var(--admin-text)]">Existing products</h2>
          </div>
          <p className="text-sm text-[var(--admin-muted)]">Edit stock and pricing first. Products with zero stock become inactive and can be deleted.</p>
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-[var(--admin-subtle)]">
              <tr>
                <th className="pb-3 pr-4 font-medium">Product</th>
                <th className="pb-3 pr-4 font-medium">Total market cost</th>
                <th className="pb-3 pr-4 font-medium">Unit sales price</th>
                <th className="pb-3 pr-4 font-medium">Units in stock</th>
                <th className="pb-3 pr-4 font-medium">Pictures</th>
                <th className="pb-3 pr-4 font-medium">Status</th>
                <th className="pb-3 pr-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => {
                const primaryVariant = product.variants[0];
                const isDeleting = deletingProductId === product.id;
                const stock = getTotalStock(product);

                return (
                  <tr key={product.id} className="border-t border-[color:var(--admin-border)]">
                    <td className="py-4 pr-4">
                      <p className="font-semibold text-[var(--admin-text)]">{product.name}</p>
                      <p className="mt-1 text-xs text-[var(--admin-subtle)]">{product.slug}</p>
                    </td>
                    <td className="py-4 pr-4 text-[var(--admin-muted)]">{formatCurrency(getBatchMarketCost(product))}</td>
                    <td className="py-4 pr-4 text-[var(--admin-muted)]">{formatCurrency(primaryVariant?.price ?? product.basePrice)}</td>
                    <td className="py-4 pr-4 text-[var(--admin-muted)]">{stock}</td>
                    <td className="py-4 pr-4 text-[var(--admin-muted)]">{product.images.length}</td>
                    <td className="py-4 pr-4 text-[var(--admin-muted)]">{getProductStatusLabel(product)}</td>
                    <td className="py-4 pr-4">
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          onClick={() => {
                            setDraft(createDraftFromProduct(product));
                            setSelectedFiles([]);
                            if (pictureInputRef.current) {
                              pictureInputRef.current.value = "";
                            }
                            setIsComposerOpen(true);
                            setMessage(null);
                          }}
                          className="rounded-none border-[color:var(--admin-border)] bg-[var(--admin-panel-2)] text-[var(--admin-text)] hover:bg-[var(--admin-accent-soft)]"
                        >
                          <PencilLine className="h-4 w-4" />
                          Edit
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          disabled={stock > 0 || isDeleting}
                          onClick={() => void handleDeleteProduct(product)}
                          className="rounded-none text-[var(--admin-muted)] hover:bg-[var(--admin-panel-2)] hover:text-[var(--admin-text)]"
                        >
                          <Trash2 className="h-4 w-4" />
                          {isDeleting ? "Deleting..." : "Delete"}
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="mt-6 flex justify-start">
          <Button type="button" size="sm" variant="secondary" onClick={openNewProductComposer} className="rounded-none border-[color:var(--admin-border)] bg-[var(--admin-panel-2)] text-[var(--admin-text)] hover:bg-[var(--admin-accent-soft)]">
            <PlusCircle className="h-4 w-4" />
            Create new product
          </Button>
        </div>
      </Card>

      {isComposerOpen ? (
        <div ref={composerRef} className="grid gap-6 xl:grid-cols-[1.25fr,0.75fr]">
          <Card className="border-[color:var(--admin-border)] bg-[var(--admin-panel)] text-[var(--admin-text)] shadow-[var(--admin-shadow)] rounded-none">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-[var(--admin-subtle)]">Admin action</p>
                <h2 className="mt-3 font-display text-2xl font-semibold text-[var(--admin-text)]">
                  {isEditing ? "Edit product" : "Create a new product"}
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--admin-muted)]">
                  Enter the total market cost for the full stock batch and the total units in stock. The system recommends a unit selling price with 5% profit.
                </p>
              </div>
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="ghost"
                  className="rounded-none text-[var(--admin-muted)] hover:bg-[var(--admin-panel-2)] hover:text-[var(--admin-text)]"
                  onClick={() => {
                    setIsComposerOpen(false);
                    resetProductDraft();
                  }}
                >
                  Close
                </Button>
              </div>
            </div>

            <form className="mt-6 space-y-6" onSubmit={handleProductSubmit}>
              <div className="grid gap-4 md:grid-cols-2">
                <Input
                  ref={productNameInputRef}
                  value={draft.name}
                  onChange={updateDraft("name")}
                  placeholder="Product name"
                  className="rounded-none border-[color:var(--admin-border)] bg-[var(--admin-input)] text-[var(--admin-text)] placeholder:text-[var(--admin-subtle)] focus:border-[color:var(--admin-accent)]"
                />
                <Input
                  value={draft.shortDescription}
                  onChange={updateDraft("shortDescription")}
                  placeholder="Short description"
                  className="rounded-none border-[color:var(--admin-border)] bg-[var(--admin-input)] text-[var(--admin-text)] placeholder:text-[var(--admin-subtle)] focus:border-[color:var(--admin-accent)]"
                />
                <Select
                  value={draft.categoryId}
                  onChange={updateDraft("categoryId")}
                  className="rounded-none border-[color:var(--admin-border)] bg-[var(--admin-input)] text-[var(--admin-text)] focus:border-[color:var(--admin-accent)]"
                >
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </Select>
                <Select
                  value={draft.brandId}
                  onChange={updateDraft("brandId")}
                  className="rounded-none border-[color:var(--admin-border)] bg-[var(--admin-input)] text-[var(--admin-text)] focus:border-[color:var(--admin-accent)]"
                >
                  {brands.map((brand) => (
                    <option key={brand.id} value={brand.id}>
                      {brand.name}
                    </option>
                  ))}
                </Select>
              </div>

              <textarea
                value={draft.description}
                onChange={updateDraft("description")}
                placeholder="Full product description"
                rows={5}
                className="w-full rounded-none border border-[color:var(--admin-border)] bg-[var(--admin-input)] px-4 py-4 text-sm text-[var(--admin-text)] placeholder:text-[var(--admin-subtle)] focus:border-[color:var(--admin-accent)] focus:outline-none"
              />

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <Input
                  type="number"
                  min="0"
                  value={draft.marketCostPrice}
                  onChange={updateDraft("marketCostPrice")}
                  placeholder="Total market cost"
                  className="rounded-none border-[color:var(--admin-border)] bg-[var(--admin-input)] text-[var(--admin-text)] placeholder:text-[var(--admin-subtle)] focus:border-[color:var(--admin-accent)]"
                />
                <Input
                  type="number"
                  min="0"
                  value={draft.salesPrice}
                  onChange={updateDraft("salesPrice")}
                  placeholder="Unit sales price"
                  className="rounded-none border-[color:var(--admin-border)] bg-[var(--admin-input)] text-[var(--admin-text)] placeholder:text-[var(--admin-subtle)] focus:border-[color:var(--admin-accent)]"
                />
                <Input
                  type="number"
                  min="0"
                  step="1"
                  value={draft.unitInStock}
                  onChange={updateDraft("unitInStock")}
                  placeholder="Total units in stock"
                  className="rounded-none border-[color:var(--admin-border)] bg-[var(--admin-input)] text-[var(--admin-text)] placeholder:text-[var(--admin-subtle)] focus:border-[color:var(--admin-accent)]"
                />
                <Input
                  value={draft.sku}
                  onChange={updateDraft("sku")}
                  placeholder="SKU"
                  className="rounded-none border-[color:var(--admin-border)] bg-[var(--admin-input)] text-[var(--admin-text)] placeholder:text-[var(--admin-subtle)] focus:border-[color:var(--admin-accent)]"
                />
              </div>

              <div className="grid gap-4 lg:grid-cols-[1fr,auto]">
                <div className="border border-[color:var(--admin-border)] bg-[var(--admin-panel-2)] p-5">
                  <div className="flex items-center gap-2 text-[var(--admin-subtle)]">
                    <Sparkles className="h-4 w-4" />
                    <p className="text-xs uppercase tracking-[0.3em]">Recommended unit sales price</p>
                  </div>
                  <p className="mt-3 font-display text-3xl font-semibold text-[var(--admin-text)]">
                    {recommendedSalesPrice ? formatCurrency(recommendedSalesPrice) : "Enter total cost and units"}
                  </p>
                  <p className="mt-2 text-sm text-[var(--admin-muted)]">Derived unit cost: {unitCostPrice ? formatCurrency(unitCostPrice) : formatCurrency(0)}</p>
                  <p className="mt-2 text-sm text-[var(--admin-muted)]">Current profit per unit: {formatCurrency(profitAmount)}</p>
                  <p className="mt-2 text-sm text-[var(--admin-muted)]">Projected total profit: {formatCurrency(totalProjectedProfit)}</p>
                </div>
                <div className="flex items-end">
                  <Button
                    type="button"
                    className="rounded-none border-[color:var(--admin-accent)] bg-[var(--admin-accent)] text-[var(--admin-on-accent)] hover:opacity-90"
                    onClick={() =>
                      setDraft((current) => ({
                        ...current,
                        salesPrice: recommendedSalesPrice ? String(recommendedSalesPrice) : current.salesPrice,
                      }))
                    }
                  >
                    Use recommended price
                  </Button>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Input
                  value={draft.variantName}
                  onChange={updateDraft("variantName")}
                  placeholder="Variant label"
                  className="rounded-none border-[color:var(--admin-border)] bg-[var(--admin-input)] text-[var(--admin-text)] placeholder:text-[var(--admin-subtle)] focus:border-[color:var(--admin-accent)]"
                />
                <div className="border border-dashed border-[color:var(--admin-border)] bg-[var(--admin-input)] px-4 py-3">
                  <label className="block text-sm font-medium text-[var(--admin-text)]">Product pictures</label>
                  <input
                    ref={pictureInputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(event) => setSelectedFiles(Array.from(event.target.files ?? []))}
                    className="mt-3 block w-full text-sm text-[var(--admin-muted)] file:mr-4 file:border file:border-[color:var(--admin-border)] file:bg-[var(--admin-panel-2)] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-[var(--admin-text)]"
                  />
                  <p className="mt-2 text-xs text-[var(--admin-subtle)]">Upload one or more images from your computer.</p>
                </div>
              </div>

              <textarea
                value={draft.imageUrlsText}
                onChange={updateDraft("imageUrlsText")}
                placeholder="Picture URLs, one per line"
                rows={4}
                className="w-full rounded-none border border-[color:var(--admin-border)] bg-[var(--admin-input)] px-4 py-4 text-sm text-[var(--admin-text)] placeholder:text-[var(--admin-subtle)] focus:border-[color:var(--admin-accent)] focus:outline-none"
              />

              {draftImageUrls.length || selectedFiles.length ? (
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  {draftImageUrls.map((imageUrl) => (
                    <div key={imageUrl} className="overflow-hidden border border-[color:var(--admin-border)] bg-[var(--admin-input)]">
                      <div className="relative h-40 w-full">
                        <Image src={imageUrl} alt={draft.name || "Product preview"} fill unoptimized className="object-cover" />
                      </div>
                    </div>
                  ))}
                  {selectedFiles.map((file) => (
                    <div key={file.name} className="border border-dashed border-[color:var(--admin-border)] bg-[var(--admin-input)] p-4 text-sm text-[var(--admin-muted)]">
                      {file.name}
                    </div>
                  ))}
                </div>
              ) : null}

              <div className="flex flex-wrap gap-3">
                <Button type="submit" disabled={isSavingProduct} className="rounded-none border-[color:var(--admin-accent)] bg-[var(--admin-accent)] text-[var(--admin-on-accent)] hover:opacity-90">
                  <Save className="h-4 w-4" />
                  {isSavingProduct ? "Saving..." : isEditing ? "Save product changes" : "Create product"}
                </Button>
                {isEditing ? (
                  <Button type="button" variant="ghost" onClick={openNewProductComposer} className="rounded-none text-[var(--admin-muted)] hover:bg-[var(--admin-panel-2)] hover:text-[var(--admin-text)]">
                    Switch to new product
                  </Button>
                ) : null}
              </div>
            </form>
          </Card>

          <div className="space-y-6">
            <Card className="border-[color:var(--admin-border)] bg-[var(--admin-panel)] text-[var(--admin-text)] shadow-[var(--admin-shadow)] rounded-none">
              <p className="text-xs uppercase tracking-[0.3em] text-[var(--admin-subtle)]">Catalog setup</p>
              <h3 className="mt-3 font-display text-2xl font-semibold text-[var(--admin-text)]">Add category</h3>
              <form className="mt-5 space-y-4" onSubmit={handleCategorySubmit}>
                <Input
                  value={categoryForm.name}
                  onChange={(event) => setCategoryForm((current) => ({ ...current, name: event.target.value }))}
                  placeholder="Category name"
                  className="rounded-none border-[color:var(--admin-border)] bg-[var(--admin-input)] text-[var(--admin-text)] placeholder:text-[var(--admin-subtle)] focus:border-[color:var(--admin-accent)]"
                />
                <Input
                  value={categoryForm.description}
                  onChange={(event) => setCategoryForm((current) => ({ ...current, description: event.target.value }))}
                  placeholder="Short category description"
                  className="rounded-none border-[color:var(--admin-border)] bg-[var(--admin-input)] text-[var(--admin-text)] placeholder:text-[var(--admin-subtle)] focus:border-[color:var(--admin-accent)]"
                />
                <Input
                  value={categoryForm.hero}
                  onChange={(event) => setCategoryForm((current) => ({ ...current, hero: event.target.value }))}
                  placeholder="Hero text"
                  className="rounded-none border-[color:var(--admin-border)] bg-[var(--admin-input)] text-[var(--admin-text)] placeholder:text-[var(--admin-subtle)] focus:border-[color:var(--admin-accent)]"
                />
                <Button type="submit" disabled={isSavingCategory} className="rounded-none border-[color:var(--admin-accent)] bg-[var(--admin-accent)] text-[var(--admin-on-accent)] hover:opacity-90">
                  {isSavingCategory ? "Saving..." : "Add category"}
                </Button>
              </form>
            </Card>

            <Card className="border-[color:var(--admin-border)] bg-[var(--admin-panel)] text-[var(--admin-text)] shadow-[var(--admin-shadow)] rounded-none">
              <p className="text-xs uppercase tracking-[0.3em] text-[var(--admin-subtle)]">Catalog setup</p>
              <h3 className="mt-3 font-display text-2xl font-semibold text-[var(--admin-text)]">Add brand</h3>
              <form className="mt-5 space-y-4" onSubmit={handleBrandSubmit}>
                <Input
                  value={brandForm.name}
                  onChange={(event) => setBrandForm({ name: event.target.value })}
                  placeholder="Brand name"
                  className="rounded-none border-[color:var(--admin-border)] bg-[var(--admin-input)] text-[var(--admin-text)] placeholder:text-[var(--admin-subtle)] focus:border-[color:var(--admin-accent)]"
                />
                <Button type="submit" disabled={isSavingBrand} className="rounded-none border-[color:var(--admin-accent)] bg-[var(--admin-accent)] text-[var(--admin-on-accent)] hover:opacity-90">
                  {isSavingBrand ? "Saving..." : "Add brand"}
                </Button>
              </form>
            </Card>
          </div>
        </div>
      ) : null}
    </div>
  );
}
