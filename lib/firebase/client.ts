import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

import { env, isFirebaseConfigured } from "@/lib/env";

function getFirebaseConfig() {
  return {
    apiKey: env.firebaseApiKey!,
    authDomain: env.firebaseAuthDomain!,
    projectId: env.firebaseProjectId!,
    storageBucket: env.firebaseStorageBucket!,
    messagingSenderId: env.firebaseMessagingSenderId!,
    appId: env.firebaseAppId!,
  };
}

export function getFirebaseBrowserApp(): FirebaseApp | null {
  if (!isFirebaseConfigured) {
    return null;
  }

  return getApps().length > 0 ? getApp() : initializeApp(getFirebaseConfig());
}

export function getFirebaseBrowserAuth() {
  const app = getFirebaseBrowserApp();
  return app ? getAuth(app) : null;
}

export function getFirebaseBrowserFirestore() {
  const app = getFirebaseBrowserApp();
  return app ? getFirestore(app) : null;
}
