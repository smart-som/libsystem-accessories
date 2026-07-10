import { NextResponse } from "next/server";

import { canRecordWalkInSales, getSessionContext } from "@/lib/auth";
import { getOrders, getWalkInSales } from "@/lib/catalog";
import { buildSalesCsv, getSalesRecords } from "@/lib/sales-report";

export async function GET() {
  const session = await getSessionContext();

  if (!session.user || !canRecordWalkInSales(session.role)) {
    return NextResponse.json({ message: "You are not allowed to export sales." }, { status: 403 });
  }

  const csv = buildSalesCsv(getSalesRecords(getOrders(), getWalkInSales()));

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="libsystem-sales.csv"',
      "Cache-Control": "no-store",
    },
  });
}
