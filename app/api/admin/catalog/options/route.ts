import { NextResponse } from "next/server";

import { canManageCatalog, getSessionContext } from "@/lib/auth";
import { createBrand, createCategory } from "@/lib/catalog-store";

function parseString(value: unknown, label: string) {
  const parsed = String(value ?? "").trim();
  if (!parsed) {
    throw new Error(`${label} is required.`);
  }

  return parsed;
}

export async function POST(request: Request) {
  const session = await getSessionContext();

  if (!session.user || !canManageCatalog(session.role)) {
    return NextResponse.json({ message: "You are not allowed to manage the catalog." }, { status: 403 });
  }

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const kind = parseString(body.kind, "Type");

    if (kind === "category") {
      const { category, snapshot } = createCategory({
        name: parseString(body.name, "Category name"),
        description: parseString(body.description, "Category description"),
        hero: parseString(body.hero, "Category hero text"),
      });

      return NextResponse.json({ category, ...snapshot });
    }

    if (kind === "brand") {
      const { brand, snapshot } = createBrand({
        name: parseString(body.name, "Brand name"),
      });

      return NextResponse.json({ brand, ...snapshot });
    }

    throw new Error("Unsupported option type.");
  } catch (error) {
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : "We could not save that option.",
      },
      { status: 400 },
    );
  }
}
