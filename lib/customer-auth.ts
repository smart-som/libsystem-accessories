import { createHmac, timingSafeEqual } from "node:crypto";

import { env, isUsingFallbackCustomerCredentials } from "@/lib/env";
import type { LocalCustomer } from "@/lib/customer-store";
import { CUSTOMER_SESSION_COOKIE_NAME } from "@/lib/session-cookies";
import { getCustomerLoginPreview } from "@/lib/customer-store";

type CustomerSessionUser = LocalCustomer;

type CustomerSessionPayload = {
  sub: string;
  email: string;
  name: string;
  phone: string;
  role: "customer";
  exp: number;
};

const CUSTOMER_SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 5;

function getCustomerSessionSecret() {
  if (!env.customerSessionSecret) {
    throw new Error("Customer session secret is not configured.");
  }

  return env.customerSessionSecret;
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
  return createHmac("sha256", getCustomerSessionSecret()).update(value).digest("base64url");
}

export function isLocalCustomerAuthEnabled() {
  return true;
}

export function getLocalCustomerLoginPreview() {
  return getCustomerLoginPreview();
}

export function isUsingFallbackCustomerLoginPreview() {
  return isUsingFallbackCustomerCredentials;
}

export function createCustomerSessionToken(customer: CustomerSessionUser) {
  const payload = {
    sub: customer.id,
    email: customer.email,
    name: customer.fullName,
    phone: customer.phone,
    role: "customer",
    exp: Date.now() + CUSTOMER_SESSION_DURATION_MS,
  } satisfies CustomerSessionPayload;

  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = signValue(encodedPayload);

  return `${encodedPayload}.${signature}`;
}

export function readCustomerSessionToken(token: string) {
  const [encodedPayload, signature] = token.split(".");

  if (!encodedPayload || !signature) {
    return null;
  }

  const expectedSignature = signValue(encodedPayload);

  if (!safeEqual(signature, expectedSignature)) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8")) as Partial<CustomerSessionPayload>;

    if (payload.role !== "customer" || typeof payload.exp !== "number" || payload.exp <= Date.now()) {
      return null;
    }

    if (
      typeof payload.sub !== "string" ||
      typeof payload.email !== "string" ||
      typeof payload.name !== "string" ||
      typeof payload.phone !== "string"
    ) {
      return null;
    }

    return {
      user: {
        id: payload.sub,
        email: payload.email,
        displayName: payload.name,
        phone: payload.phone,
      },
      role: "customer" as const,
    };
  } catch {
    return null;
  }
}

export function getCustomerSessionCookieOptions(maxAge = CUSTOMER_SESSION_DURATION_MS / 1000) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge,
  };
}

export function clearCustomerSessionCookie(response: {
  cookies: {
    set: (name: string, value: string, options: ReturnType<typeof getCustomerSessionCookieOptions>) => void;
  };
}) {
  response.cookies.set(CUSTOMER_SESSION_COOKIE_NAME, "", getCustomerSessionCookieOptions(0));
}
