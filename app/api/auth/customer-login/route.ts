import { NextResponse } from "next/server";
import { z } from "zod";

import { clearAdminSessionCookie } from "@/lib/admin-auth";
import {
  createCustomerSessionToken,
  getCustomerSessionCookieOptions,
  isLocalCustomerAuthEnabled,
} from "@/lib/customer-auth";
import { validateLocalCustomerCredentials } from "@/lib/customer-store";
import { CUSTOMER_SESSION_COOKIE_NAME, FIREBASE_SESSION_COOKIE_NAME } from "@/lib/session-cookies";

const customerLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(request: Request) {
  if (!isLocalCustomerAuthEnabled()) {
    return NextResponse.json({ message: "Customer login is not enabled for this environment." }, { status: 503 });
  }

  const payload = customerLoginSchema.parse(await request.json());
  const customer = validateLocalCustomerCredentials(payload.email, payload.password);

  if (!customer) {
    return NextResponse.json({ message: "Invalid customer email or password." }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true, role: "customer" });
  response.cookies.set(
    CUSTOMER_SESSION_COOKIE_NAME,
    createCustomerSessionToken(customer),
    getCustomerSessionCookieOptions(),
  );
  response.cookies.set(FIREBASE_SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  clearAdminSessionCookie(response);

  return response;
}
