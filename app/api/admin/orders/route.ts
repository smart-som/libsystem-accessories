import { NextResponse } from "next/server";

import { canManageCatalog, getSessionContext } from "@/lib/auth";
import { getAllowedOrderStatuses } from "@/lib/order-status";
import { readOrdersSnapshot, updateOrderStatus } from "@/lib/order-store";
import type { FulfillmentMethod, OrderStatus } from "@/lib/types";

function parseString(value: unknown, label: string) {
  const parsed = String(value ?? "").trim();
  if (!parsed) {
    throw new Error(`${label} is required.`);
  }

  return parsed;
}

export async function GET() {
  const session = await getSessionContext();

  if (!session.user || !canManageCatalog(session.role)) {
    return NextResponse.json({ message: "You are not allowed to manage orders." }, { status: 403 });
  }

  return NextResponse.json(await readOrdersSnapshot());
}

export async function PATCH(request: Request) {
  const session = await getSessionContext();

  if (!session.user || !canManageCatalog(session.role)) {
    return NextResponse.json({ message: "You are not allowed to manage orders." }, { status: 403 });
  }

  try {
    const body = (await request.json()) as {
      orderId?: string;
      status?: OrderStatus;
      fulfillmentMethod?: FulfillmentMethod;
    };

    const orderId = parseString(body.orderId, "Order");
    const status = parseString(body.status, "Status") as OrderStatus;
    const fulfillmentMethod = parseString(body.fulfillmentMethod, "Fulfillment method") as FulfillmentMethod;

    if (!getAllowedOrderStatuses(fulfillmentMethod).includes(status)) {
      throw new Error("That status is not allowed for this order.");
    }

    const { order, snapshot } = await updateOrderStatus(orderId, status);

    return NextResponse.json({
      order,
      orders: snapshot.orders,
    });
  } catch (error) {
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : "We could not update this order right now.",
      },
      { status: 400 },
    );
  }
}
