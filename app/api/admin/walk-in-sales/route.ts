import { NextResponse } from "next/server";
import { z } from "zod";

import { canRecordWalkInSales, getSessionContext } from "@/lib/auth";
import { readCatalogSnapshot } from "@/lib/catalog-store";
import { createWalkInSale, readWalkInSalesSnapshot } from "@/lib/walk-in-sales-store";

const walkInSaleSchema = z.object({
  customerName: z.string().optional(),
  customerPhone: z.string().optional(),
  paymentMethod: z.enum(["cash", "pos", "bank_transfer"]),
  lines: z.array(
    z.object({
      variantId: z.string().min(1),
      quantity: z.number().int().positive(),
      unitPrice: z.number().positive().optional(),
    }),
  ).min(1),
});

export async function GET() {
  const session = await getSessionContext();

  if (!session.user || !canRecordWalkInSales(session.role)) {
    return NextResponse.json({ message: "You are not allowed to record walk-in sales." }, { status: 403 });
  }

  return NextResponse.json({
    sales: readWalkInSalesSnapshot().sales,
    products: readCatalogSnapshot().products,
  });
}

export async function POST(request: Request) {
  const session = await getSessionContext();

  if (!session.user || !canRecordWalkInSales(session.role)) {
    return NextResponse.json({ message: "You are not allowed to record walk-in sales." }, { status: 403 });
  }

  try {
    const payload = walkInSaleSchema.parse(await request.json());
    const { sale, salesSnapshot, catalogSnapshot } = createWalkInSale({
      recordedBy: session.user.id,
      customerName: payload.customerName,
      customerPhone: payload.customerPhone,
      paymentMethod: payload.paymentMethod,
      lines: payload.lines,
    });

    return NextResponse.json({
      sale,
      sales: salesSnapshot.sales,
      products: catalogSnapshot.products,
    });
  } catch (error) {
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : "We could not record this walk-in sale right now.",
      },
      { status: 400 },
    );
  }
}
