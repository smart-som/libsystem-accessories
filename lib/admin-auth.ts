import { createHmac, timingSafeEqual } from "node:crypto";

import { env, isAdminCredentialsConfigured, isUsingFallbackAdminCredentials } from "@/lib/env";
import { ADMIN_SESSION_COOKIE_NAME } from "@/lib/session-cookies";

const ADMIN_SESSION_DURATION_MS = 1000 * 60 * 60 * 12;
const ADMIN_USER_ID = "libsystem-admin";

type AdminSessionUser = {
  id: string;
  email: string;
  displayName: string;
  role: "admin";
};

type AdminSessionPayload = {
  sub: string;
  email: string;
  name: string;
  role: "admin";
  exp: number;
};

function getAdminSessionSecret() {
  if (!env.adminSessionSecret) {
    throw new Error("Admin session secret is not configured.");
  }

  return env.adminSessionSecret;
}

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}

function signValue(value: string) {
  return createHmac("sha256", getAdminSessionSecret()).update(value).digest("base64url");
}

function getAdminSessionUser() {
  return {
    id: ADMIN_USER_ID,
    email: env.adminLoginEmail!,
    displayName: env.adminDisplayName,
    role: "admin",
  } satisfies AdminSessionUser;
}

export function isAdminLoginEnabled() {
  return isAdminCredentialsConfigured;
}

export function getAdminLoginPreview() {
  if (!isUsingFallbackAdminCredentials || !env.adminLoginEmail || !env.adminLoginPassword) {
    return null;
  }

  return {
    email: env.adminLoginEmail,
    password: env.adminLoginPassword,
  };
}

export function validateAdminCredentials(email: string, password: string) {
  if (!isAdminCredentialsConfigured || !env.adminLoginEmail || !env.adminLoginPassword) {
    return null;
  }

  const normalizedEmail = email.trim().toLowerCase();
  const expectedEmail = env.adminLoginEmail.trim().toLowerCase();

  if (!safeEqual(normalizedEmail, expectedEmail) || !safeEqual(password, env.adminLoginPassword)) {
    return null;
  }

  return getAdminSessionUser();
}

export function createAdminSessionToken() {
  const user = getAdminSessionUser();
  const payload = {
    sub: user.id,
    email: user.email,
    name: user.displayName,
    role: user.role,
    exp: Date.now() + ADMIN_SESSION_DURATION_MS,
  } satisfies AdminSessionPayload;

  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = signValue(encodedPayload);

  return `${encodedPayload}.${signature}`;
}

export function readAdminSessionToken(token: string) {
  const [encodedPayload, signature] = token.split(".");

  if (!encodedPayload || !signature) {
    return null;
  }

  const expectedSignature = signValue(encodedPayload);

  if (!safeEqual(signature, expectedSignature)) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8")) as Partial<AdminSessionPayload>;

    if (payload.role !== "admin" || typeof payload.exp !== "number" || payload.exp <= Date.now()) {
      return null;
    }

    if (typeof payload.sub !== "string" || typeof payload.email !== "string" || typeof payload.name !== "string") {
      return null;
    }

    return {
      user: {
        id: payload.sub,
        email: payload.email,
        displayName: payload.name,
      },
      role: "admin" as const,
    };
  } catch {
    return null;
  }
}

export function getAdminSessionCookieOptions(maxAge = ADMIN_SESSION_DURATION_MS / 1000) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };
}

export function clearAdminSessionCookie(response: {
  cookies: {
    set: (name: string, value: string, options: ReturnType<typeof getAdminSessionCookieOptions>) => void;
  };
}) {
  response.cookies.set(ADMIN_SESSION_COOKIE_NAME, "", getAdminSessionCookieOptions(0));
}
