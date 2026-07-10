import { cookies } from "next/headers";

import { readAdminSessionToken } from "@/lib/admin-auth";
import { readCustomerSessionToken } from "@/lib/customer-auth";
import { getFirebaseAdminAuth, getFirebaseAdminFirestore } from "@/lib/firebase/admin";
import { firestoreCollections } from "@/lib/firebase/firestore";
import { ADMIN_SESSION_COOKIE_NAME, CUSTOMER_SESSION_COOKIE_NAME, FIREBASE_SESSION_COOKIE_NAME } from "@/lib/session-cookies";
import type { UserRole } from "@/lib/types";

type SessionUser = {
  id: string;
  email: string | null;
  displayName?: string | null;
  phone?: string | null;
};

function getRoleFromClaims(claims: Record<string, unknown>): UserRole {
  const role = claims.role;
  return role === "admin" || role === "staff" || role === "customer" ? role : "customer";
}

export async function getSessionContext() {
  const cookieStore = await cookies();
  const adminSessionCookie = cookieStore.get(ADMIN_SESSION_COOKIE_NAME)?.value;

  if (adminSessionCookie) {
    const adminSession = readAdminSessionToken(adminSessionCookie);

    if (adminSession) {
      return {
        user: adminSession.user,
        role: adminSession.role,
        isDemo: false,
      };
    }
  }

  const customerSessionCookie = cookieStore.get(CUSTOMER_SESSION_COOKIE_NAME)?.value;

  if (customerSessionCookie) {
    const customerSession = readCustomerSessionToken(customerSessionCookie);

    if (customerSession) {
      return {
        user: customerSession.user,
        role: customerSession.role,
        isDemo: true,
      };
    }
  }

  const auth = getFirebaseAdminAuth();

  if (!auth) {
    return {
      user: null,
      role: "customer" as UserRole,
      isDemo: true,
    };
  }

  const sessionCookie = cookieStore.get(FIREBASE_SESSION_COOKIE_NAME)?.value;

  if (!sessionCookie) {
    return {
      user: null,
      role: "customer" as UserRole,
      isDemo: false,
    };
  }

  try {
    const decoded = await auth.verifySessionCookie(sessionCookie, true);
    let profilePhone: string | null = null;
    const firestore = getFirebaseAdminFirestore();

    if (firestore) {
      try {
        const profileSnapshot = await firestore.collection(firestoreCollections.profiles).doc(decoded.uid).get();
        const profileData = profileSnapshot.data();
        profilePhone = typeof profileData?.phone === "string" ? profileData.phone : null;
      } catch {
        profilePhone = null;
      }
    }

    return {
      user: {
        id: decoded.uid,
        email: decoded.email ?? null,
        displayName: decoded.name ?? null,
        phone: decoded.phone_number ?? profilePhone,
      } satisfies SessionUser,
      role: getRoleFromClaims(decoded),
      isDemo: false,
    };
  } catch {
    return {
      user: null,
      role: "customer" as UserRole,
      isDemo: false,
    };
  }
}

export function canManageCatalog(role: UserRole) {
  return role === "admin";
}

export function canRecordWalkInSales(role: UserRole) {
  return role === "admin" || role === "staff";
}
