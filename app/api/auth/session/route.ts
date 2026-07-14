import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { z } from "zod";

import { getFirebaseAdminAuth, getFirebaseAdminFirestore } from "@/lib/firebase/admin";
import { firestoreCollections } from "@/lib/firebase/firestore";
import { FIREBASE_SESSION_COOKIE_NAME } from "@/lib/session-cookies";

const sessionSchema = z.object({
  idToken: z.string().min(1),
  requestedRole: z.enum(["customer", "admin"]).default("customer"),
  profile: z
    .object({
      phone: z.string().trim().min(3).max(30).optional(),
    })
    .optional(),
});

const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 5;
const RECENT_SIGN_IN_SECONDS = 5 * 60;

export async function POST(request: Request) {
  const auth = getFirebaseAdminAuth();

  if (!auth) {
    return NextResponse.json({ message: "Firebase Admin is not configured." }, { status: 503 });
  }

  const parsed = sessionSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid sign-in request." }, { status: 400 });
  }

  const payload = parsed.data;
  let decodedToken;

  try {
    decodedToken = await auth.verifyIdToken(payload.idToken, true);
  } catch (error) {
    const code = typeof error === "object" && error && "code" in error ? String(error.code) : "unknown";
    console.error("[auth/session] Firebase token verification failed", { code });
    return NextResponse.json({ message: "Your sign-in expired. Please sign in again." }, { status: 401 });
  }

  const role = decodedToken.role;

  if (Math.floor(Date.now() / 1000) - decodedToken.auth_time > RECENT_SIGN_IN_SECONDS) {
    return NextResponse.json({ message: "Please sign in again to continue." }, { status: 401 });
  }

  if (payload.requestedRole === "admin" && role !== "admin" && role !== "staff") {
    return NextResponse.json({ message: "This account is not authorized for admin access." }, { status: 403 });
  }

  if (payload.requestedRole === "customer" && (role === "admin" || role === "staff")) {
    return NextResponse.json({ message: "Privileged accounts must use the admin sign-in host." }, { status: 403 });
  }

  let sessionCookie: string;

  try {
    sessionCookie = await auth.createSessionCookie(payload.idToken, { expiresIn: SESSION_DURATION_MS });
  } catch (error) {
    const code = typeof error === "object" && error && "code" in error ? String(error.code) : "unknown";
    console.error("[auth/session] Firebase session-cookie creation failed", { code });
    return NextResponse.json({ message: "We could not start your secure session. Please try again." }, { status: 503 });
  }

  if (payload.requestedRole === "customer") {
    const firestore = getFirebaseAdminFirestore();

    if (firestore) {
      try {
        const profileRef = firestore.collection(firestoreCollections.profiles).doc(decodedToken.uid);
        const profileSnapshot = await profileRef.get();
        await profileRef.set(
          {
            email: decodedToken.email ?? "",
            ...(decodedToken.name ? { fullName: decodedToken.name } : {}),
            role: "customer",
            ...(payload.profile?.phone ? { phone: payload.profile.phone } : {}),
            ...(!profileSnapshot.exists ? { createdAt: FieldValue.serverTimestamp() } : {}),
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true },
        );
      } catch (error) {
        const code = typeof error === "object" && error && "code" in error ? String(error.code) : "unknown";
        console.warn(`[auth/session] Profile synchronization skipped (${code})`);
      }
    }
  }

  const response = NextResponse.json({ ok: true, role: role === "admin" || role === "staff" ? role : "customer" });
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
  return response;
}
