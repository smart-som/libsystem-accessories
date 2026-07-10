import { NextResponse } from "next/server";
import { z } from "zod";

import { clearAdminSessionCookie } from "@/lib/admin-auth";
import {
  createCustomerSessionToken,
  getCustomerSessionCookieOptions,
  isLocalCustomerAuthEnabled,
} from "@/lib/customer-auth";
import { createLocalCustomer } from "@/lib/customer-store";
import { CUSTOMER_SESSION_COOKIE_NAME, FIREBASE_SESSION_COOKIE_NAME } from "@/lib/session-cookies";

const customerRegisterSchema = z.object({
  fullName: z.string().min(2),
  phone: z.string().min(7),
  email: z.string().email(),
  password: z.string().min(6),
});

export async function POST(request: Request) {
  if (!isLocalCustomerAuthEnabled()) {
    return NextResponse.json({ message: "Customer registration is not enabled for this environment." }, { status: 503 });
  }

  try {
    const payload = customerRegisterSchema.parse(await request.json());
    const customer = createLocalCustomer(payload);
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
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "We could not create that account right now." },
      { status: 400 },
    );
  }
}
