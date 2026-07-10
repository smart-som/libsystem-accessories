import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    ok: true,
    message: "Payment verification endpoint scaffolded. Connect Paystack webhook or callback verification next.",
  });
}
