import { NextResponse } from "next/server";
import { z } from "zod";

import { clearAdminSessionCookie } from "@/lib/admin-auth";
import { clearCustomerSessionCookie } from "@/lib/customer-auth";
import { getFirebaseAdminAuth } from "@/lib/firebase/admin";
import { FIREBASE_SESSION_COOKIE_NAME } from "@/lib/session-cookies";

const sessionSchema = z.object({
  idToken: z.string().min(1),
});

const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 5;

export async function POST(request: Request) {
  const auth = getFirebaseAdminAuth();

  if (!auth) {
    return NextResponse.json({ message: "Firebase Admin is not configured." }, { status: 503 });
  }

  const payload = sessionSchema.parse(await request.json());
  const sessionCookie = await auth.createSessionCookie(payload.idToken, {
    expiresIn: SESSION_DURATION_MS,
  });

  const response = NextResponse.json({ ok: true });
  clearAdminSessionCookie(response);
  clearCustomerSessionCookie(response);
  response.cookies.set(FIREBASE_SESSION_COOKIE_NAME, sessionCookie, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DURATION_MS / 1000,
  });

  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(FIREBASE_SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  clearAdminSessionCookie(response);
  clearCustomerSessionCookie(response);
  return response;
}
