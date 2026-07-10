import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

import { NextResponse } from "next/server";

import { canManageCatalog, getSessionContext } from "@/lib/auth";
import { deleteProduct, readCatalogSnapshot, upsertProduct } from "@/lib/catalog-store";
import { getRecommendedSalesPrice } from "@/lib/product-pricing";

function parseNumber(value: FormDataEntryValue | null, label: string) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw new Error(`${label} must be a valid number.`);
  }

  return parsed;
}

function parseString(value: FormDataEntryValue | null, label: string) {
  const parsed = String(value ?? "").trim();
  if (!parsed) {
    throw new Error(`${label} is required.`);
  }

  return parsed;
}

function sanitizeFileName(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9.-]+/g, "-");
}

async function saveUploadedPictures(files: File[], productName: string) {
  const uploadDirectory = path.join(process.cwd(), "public", "uploads", "products");
  await mkdir(uploadDirectory, { recursive: true });

  const savedPaths: string[] = [];

  for (const file of files) {
    if (!file.size) {
      continue;
    }

    const extension = path.extname(file.name) || ".jpg";
    const fileName = `${sanitizeFileName(productName)}-${randomUUID().slice(0, 8)}${extension}`;
    const filePath = path.join(uploadDirectory, fileName);
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filePath, buffer);
    savedPaths.push(`/uploads/products/${fileName}`);
  }

  return savedPaths;
}

export async function GET() {
  const session = await getSessionContext();

  if (!session.user || !canManageCatalog(session.role)) {
    return NextResponse.json({ message: "You are not allowed to manage the catalog." }, { status: 403 });
  }

  return NextResponse.json(readCatalogSnapshot());
}

export async function POST(request: Request) {
  const session = await getSessionContext();

  if (!session.user || !canManageCatalog(session.role)) {
    return NextResponse.json({ message: "You are not allowed to manage the catalog." }, { status: 403 });
  }

  try {
    const formData = await request.formData();
    const name = parseString(formData.get("name"), "Product name");
    const shortDescription = parseString(formData.get("shortDescription"), "Short description");
    const description = parseString(formData.get("description"), "Description");
    const categoryId = parseString(formData.get("categoryId"), "Category");
    const brandId = parseString(formData.get("brandId"), "Brand");
    const marketCostPrice = parseNumber(formData.get("marketCostPrice"), "Market cost price");
    const salesPrice = parseNumber(formData.get("salesPrice"), "Sales price");
    const unitInStock = parseNumber(formData.get("unitInStock"), "Units in stock");
    const sku = parseString(formData.get("sku"), "SKU");
    const variantName = parseString(formData.get("variantName"), "Variant label");
    const productId = String(formData.get("productId") ?? "").trim();
    const rawImageUrls = String(formData.get("imageUrls") ?? "[]");
    const imageUrls = JSON.parse(rawImageUrls) as string[];
    const uploadFiles = formData
      .getAll("pictures")
      .filter((entry): entry is File => entry instanceof File && entry.size > 0);

    if (unitInStock % 1 !== 0) {
      throw new Error("Units in stock must be a whole number.");
    }

    const uploadedImageUrls = await saveUploadedPictures(uploadFiles, name);
    const allImageUrls = [...new Set([...imageUrls, ...uploadedImageUrls])];

    if (!allImageUrls.length) {
      throw new Error("Add at least one product picture.");
    }

    const { snapshot, product } = upsertProduct({
      id: productId || undefined,
      name,
      shortDescription,
      description,
      categoryId,
      brandId,
      marketCostPrice,
      salesPrice,
      unitInStock,
      sku,
      variantName,
      imageUrls: allImageUrls,
    });

    return NextResponse.json({
      product,
      recommendedSalesPrice: getRecommendedSalesPrice(marketCostPrice, unitInStock),
      ...snapshot,
    });
  } catch (error) {
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : "We could not save this product right now.",
      },
      { status: 400 },
    );
  }
}

export async function DELETE(request: Request) {
  const session = await getSessionContext();

  if (!session.user || !canManageCatalog(session.role)) {
    return NextResponse.json({ message: "You are not allowed to manage the catalog." }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const productId = String(searchParams.get("productId") ?? "").trim();

    if (!productId) {
      throw new Error("Product id is required.");
    }

    const { snapshot } = deleteProduct(productId);

    return NextResponse.json(snapshot);
  } catch (error) {
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : "We could not delete this product right now.",
      },
      { status: 400 },
    );
  }
}
