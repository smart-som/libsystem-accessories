import { cert, getApp, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

import { env, isFirebaseAdminConfigured } from "@/lib/env";

let initializationFailed = false;

function getInitializationErrorDetails(error: unknown) {
  if (error instanceof Error) {
    const code = "code" in error ? String(error.code) : "unknown";
    return { code, message: error.message };
  }

  return { code: "unknown", message: "Unknown Firebase Admin initialization error." };
}

export function getFirebaseAdminApp() {
  if (!isFirebaseAdminConfigured || initializationFailed) {
    return null;
  }

  try {
    if (getApps().length > 0) {
      return getApp();
    }

    return initializeApp({
      credential: cert({
        projectId: env.firebaseProjectId,
        clientEmail: env.firebaseClientEmail,
        privateKey: env.firebasePrivateKey?.replace(/\\n/g, "\n"),
      }),
    });
  } catch (error) {
    initializationFailed = true;
    console.error("[firebase/admin] Initialization failed; Firebase-backed authentication is disabled.", getInitializationErrorDetails(error));
    return null;
  }
}

export function getFirebaseAdminAuth() {
  const app = getFirebaseAdminApp();
  return app ? getAuth(app) : null;
}

export function getFirebaseAdminFirestore() {
  const app = getFirebaseAdminApp();
  return app ? getFirestore(app) : null;
}
