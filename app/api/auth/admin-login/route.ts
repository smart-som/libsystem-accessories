import { NextResponse } from "next/server";
import { z } from "zod";

import {
  createAdminSessionToken,
  getAdminSessionCookieOptions,
  isAdminLoginEnabled,
  validateAdminCredentials,
} from "@/lib/admin-auth";
import { ADMIN_SESSION_COOKIE_NAME, FIREBASE_SESSION_COOKIE_NAME } from "@/lib/session-cookies";

const adminLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(request: Request) {
  if (!isAdminLoginEnabled()) {
    return NextResponse.json(
      { message: "Admin login is not configured for this environment." },
      { status: 503 },
    );
  }

  const payload = adminLoginSchema.parse(await request.json());
  const adminUser = validateAdminCredentials(payload.email, payload.password);

  if (!adminUser) {
    return NextResponse.json({ message: "Invalid admin email or password." }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true, role: adminUser.role });
  response.cookies.set(ADMIN_SESSION_COOKIE_NAME, createAdminSessionToken(), getAdminSessionCookieOptions());
  response.cookies.set(FIREBASE_SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  return response;
}
