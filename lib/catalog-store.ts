import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import path from "path";
import { randomUUID } from "crypto";

import { brands as demoBrands, categories as demoCategories, products as demoProducts } from "@/lib/demo-data";
import type { Brand, Category, Product, ProductImage, ProductStatus, ProductVariant } from "@/lib/types";
import { getUnitCostPrice } from "@/lib/product-pricing";

type CatalogSnapshot = {
  categories: Category[];
  brands: Brand[];
  products: Product[];
};

type ProductInput = {
  id?: string;
  name: string;
  shortDescription: string;
  description: string;
  categoryId: string;
  brandId: string;
  marketCostPrice: number;
  salesPrice: number;
  unitInStock: number;
  sku: string;
  variantName: string;
  imageUrls: string[];
  status?: ProductStatus;
};

type CategoryInput = {
  name: string;
  description: string;
  hero: string;
};

type BrandInput = {
  name: string;
};

export type InventorySaleLine = {
  variantId: string;
  quantity: number;
};

export type ReservedInventoryLine = {
  product: Product;
  variant: ProductVariant;
  quantity: number;
};

const catalogFilePath = path.join(process.cwd(), "data", "catalog.json");

function cloneDemoData(): CatalogSnapshot {
  return structuredClone({
    categories: demoCategories,
    brands: demoBrands,
    products: demoProducts,
  });
}

function ensureCatalogDirectory() {
  mkdirSync(path.dirname(catalogFilePath), { recursive: true });
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

function makeId(prefix: string) {
  return `${prefix}-${randomUUID().slice(0, 8)}`;
}

function makeProductImages(imageUrls: string[], name: string): ProductImage[] {
  return imageUrls.map((url, index) => ({
    id: makeId("img"),
    url,
    alt: `${name} image ${index + 1}`,
  }));
}

function makePrimaryVariant(input: ProductInput, existingVariant?: ProductVariant): ProductVariant {
  const unitCostPrice = getUnitCostPrice(input.marketCostPrice, input.unitInStock);

  return {
    id: existingVariant?.id ?? makeId("var"),
    sku: input.sku,
    name: input.variantName,
    attributes: existingVariant?.attributes ?? { option: input.variantName },
    stockQuantity: input.unitInStock,
    price: input.salesPrice,
    costPrice: unitCostPrice,
  };
}

export function getProductStatusForStock(unitInStock: number, fallbackStatus?: ProductStatus) {
  if (unitInStock <= 0) {
    return "archived" satisfies ProductStatus;
  }

  if (fallbackStatus === "draft") {
    return "draft";
  }

  return "active" satisfies ProductStatus;
}

export function getTotalStock(product: Product) {
  return product.variants.reduce((total, variant) => total + variant.stockQuantity, 0);
}

export function reserveInventoryForSale(snapshot: CatalogSnapshot, lines: InventorySaleLine[]) {
  const nextSnapshot = structuredClone(snapshot);
  const reservedLines: ReservedInventoryLine[] = [];

  for (const line of lines) {
    if (!Number.isInteger(line.quantity) || line.quantity <= 0) {
      throw new Error("Sale quantities must be whole numbers greater than zero.");
    }

    const productIndex = nextSnapshot.products.findIndex((product) =>
      product.variants.some((variant) => variant.id === line.variantId),
    );

    if (productIndex === -1) {
      throw new Error("Selected product variant was not found.");
    }

    const product = nextSnapshot.products[productIndex];
    const variantIndex = product.variants.findIndex((variant) => variant.id === line.variantId);
    const variant = product.variants[variantIndex];

    if (!variant) {
      throw new Error("Selected product variant was not found.");
    }

    if (variant.stockQuantity < line.quantity) {
      throw new Error(`Only ${variant.stockQuantity} unit(s) left for ${product.name} - ${variant.name}.`);
    }

    reservedLines.push({
      product: structuredClone(product),
      variant: structuredClone(variant),
      quantity: line.quantity,
    });

    const nextVariant = {
      ...variant,
      stockQuantity: variant.stockQuantity - line.quantity,
    };

    const nextVariants = product.variants.map((entry, entryIndex) => (entryIndex === variantIndex ? nextVariant : entry));
    const remainingStock = nextVariants.reduce((total, entry) => total + entry.stockQuantity, 0);

    nextSnapshot.products[productIndex] = {
      ...product,
      variants: nextVariants,
      status: getProductStatusForStock(remainingStock, product.status),
    };
  }

  return {
    snapshot: nextSnapshot,
    reservedLines,
  };
}

export function readCatalogSnapshot(): CatalogSnapshot {
  if (!existsSync(catalogFilePath)) {
    return cloneDemoData();
  }

  try {
    const raw = readFileSync(catalogFilePath, "utf8");
    return JSON.parse(raw) as CatalogSnapshot;
  } catch {
    return cloneDemoData();
  }
}

export function writeCatalogSnapshot(snapshot: CatalogSnapshot) {
  ensureCatalogDirectory();
  writeFileSync(catalogFilePath, JSON.stringify(snapshot, null, 2));
}

export function createCategory(input: CategoryInput) {
  const snapshot = readCatalogSnapshot();
  const slug = slugify(input.name);

  if (snapshot.categories.some((category) => category.slug === slug)) {
    throw new Error("A category with this name already exists.");
  }

  const category: Category = {
    id: makeId("cat"),
    name: input.name,
    slug,
    description: input.description,
    hero: input.hero,
  };

  snapshot.categories.push(category);
  writeCatalogSnapshot(snapshot);

  return { category, snapshot };
}

export function createBrand(input: BrandInput) {
  const snapshot = readCatalogSnapshot();
  const slug = slugify(input.name);

  if (snapshot.brands.some((brand) => brand.slug === slug)) {
    throw new Error("A brand with this name already exists.");
  }

  const brand: Brand = {
    id: makeId("brand"),
    name: input.name,
    slug,
  };

  snapshot.brands.push(brand);
  writeCatalogSnapshot(snapshot);

  return { brand, snapshot };
}

export function upsertProduct(input: ProductInput) {
  const snapshot = readCatalogSnapshot();
  const existingProduct = input.id ? snapshot.products.find((product) => product.id === input.id) : undefined;
  const slugBase = slugify(input.name);
  const unitCostPrice = getUnitCostPrice(input.marketCostPrice, input.unitInStock);
  const slug =
    existingProduct?.slug && slugify(existingProduct.name) === slugBase
      ? existingProduct.slug
      : `${slugBase}-${input.id ? input.id.slice(-4) : randomUUID().slice(0, 4)}`;
  const primaryVariant = makePrimaryVariant(input, existingProduct?.variants[0]);
  const product: Product = {
    id: existingProduct?.id ?? makeId("prod"),
    slug,
    name: input.name,
    shortDescription: input.shortDescription,
    description: input.description,
    categoryId: input.categoryId,
    brandId: input.brandId,
    marketCostPrice: input.marketCostPrice,
    basePrice: input.salesPrice,
    costPrice: unitCostPrice,
    featured: existingProduct?.featured ?? false,
    status: getProductStatusForStock(input.unitInStock, input.status ?? existingProduct?.status),
    compatibility: existingProduct?.compatibility ?? [],
    specs: existingProduct?.specs ?? [],
    tags: existingProduct?.tags ?? [],
    seoTitle: existingProduct?.seoTitle ?? `${input.name} | Libsystem Accessories`,
    seoDescription: existingProduct?.seoDescription ?? input.shortDescription,
    rating: existingProduct?.rating ?? 0,
    reviewCount: existingProduct?.reviewCount ?? 0,
    images: makeProductImages(input.imageUrls, input.name),
    variants: [primaryVariant],
  };

  if (existingProduct) {
    snapshot.products = snapshot.products.map((entry) => (entry.id === existingProduct.id ? product : entry));
  } else {
    snapshot.products.unshift(product);
  }

  writeCatalogSnapshot(snapshot);

  return { product, snapshot };
}

export function deleteProduct(productId: string) {
  const snapshot = readCatalogSnapshot();
  const product = snapshot.products.find((entry) => entry.id === productId);

  if (!product) {
    throw new Error("Product not found.");
  }

  if (getTotalStock(product) > 0) {
    throw new Error("Only products with zero stock can be deleted.");
  }

  snapshot.products = snapshot.products.filter((entry) => entry.id !== productId);
  writeCatalogSnapshot(snapshot);

  return { snapshot };
}
