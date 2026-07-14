"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { FirebaseError } from "firebase/app";
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  type User,
} from "firebase/auth";

import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getFirebaseBrowserAuth } from "@/lib/firebase/client";

type AuthCardProps = {
  mode: "login" | "register";
  isEnabled: boolean;
  title: string;
  description: string;
  submitLabel: string;
  footerText: string;
  footerLinkHref: string;
  footerLinkLabel: string;
  includeName?: boolean;
};

type SessionResponse = {
  message?: string;
  role?: "customer" | "admin" | "staff";
};

function getAuthErrorMessage(error: unknown) {
  if (!(error instanceof FirebaseError)) {
    return error instanceof Error ? error.message : "Something went wrong while signing you in.";
  }

  switch (error.code) {
    case "auth/email-already-in-use":
      return "An account already exists for this email. Try signing in instead.";
    case "auth/invalid-credential":
    case "auth/user-not-found":
    case "auth/wrong-password":
      return "The email or password is incorrect.";
    case "auth/weak-password":
      return "Choose a stronger password with at least six characters.";
    case "auth/popup-closed-by-user":
      return "Google sign-in was cancelled.";
    case "auth/popup-blocked":
      return "Your browser blocked the Google sign-in window. Allow pop-ups and try again.";
    case "auth/account-exists-with-different-credential":
      return "This email already uses another sign-in method. Sign in with that method first.";
    case "auth/unauthorized-domain":
      return "This domain is not authorized in Firebase Authentication.";
    case "auth/too-many-requests":
      return "Too many attempts. Please wait a moment and try again.";
    default:
      return "We could not sign you in. Please try again.";
  }
}

export function AuthCard({
  mode,
  isEnabled,
  title,
  description,
  submitLabel,
  footerText,
  footerLinkHref,
  footerLinkLabel,
  includeName = false,
}: AuthCardProps) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function startServerSession(user: User, phone?: string) {
    const auth = getFirebaseBrowserAuth();

    if (!auth) {
      throw new Error("Firebase Auth is not configured yet.");
    }

    const idToken = await user.getIdToken(true);
    const response = await fetch("/api/auth/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        idToken,
        requestedRole: "customer",
        profile: phone ? { phone } : undefined,
      }),
    });
    const body = (await response.json().catch(() => null)) as SessionResponse | null;

    if (!response.ok) {
      await signOut(auth).catch(() => undefined);
      throw new Error(body?.message ?? "We could not start your authenticated session.");
    }

    router.push(body?.role === "admin" || body?.role === "staff" ? "/admin" : "/account");
    router.refresh();
  }

  async function signInWithGoogle() {
    setMessage("");
    setIsSubmitting(true);

    try {
      if (!isEnabled) {
        throw new Error("Firebase authentication is not fully configured yet.");
      }

      const auth = getFirebaseBrowserAuth();

      if (!auth) {
        throw new Error("Firebase Auth is not configured yet.");
      }

      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      const credential = await signInWithPopup(auth, provider);
      await startServerSession(credential.user);
    } catch (error) {
      setMessage(getAuthErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="mx-auto max-w-xl">
      <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Welcome back</p>
      <h1 className="mt-4 font-display text-4xl font-semibold text-slate-900">{title}</h1>
      <p className="mt-4 text-sm leading-7 text-slate-600">{description}</p>
      {!isEnabled ? (
        <div className="mt-6 rounded-3xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
          Firebase authentication is being configured. Sign-in will be available when the server credentials are installed.
        </div>
      ) : null}

      <form
        className="mt-8 space-y-4"
        onSubmit={async (event) => {
          event.preventDefault();
          setMessage("");
          setIsSubmitting(true);

          try {
            if (!isEnabled) {
              throw new Error("Firebase authentication is not fully configured yet.");
            }

            const formData = new FormData(event.currentTarget);
            const fullName = String(formData.get("fullName") ?? "").trim();
            const phone = String(formData.get("phone") ?? "").trim();
            const email = String(formData.get("email") ?? "").trim();
            const password = String(formData.get("password") ?? "");
            const auth = getFirebaseBrowserAuth();

            if (!auth) {
              throw new Error("Firebase Auth is not configured yet.");
            }

            const credential =
              mode === "register"
                ? await createUserWithEmailAndPassword(auth, email, password)
                : await signInWithEmailAndPassword(auth, email, password);

            if (mode === "register" && fullName) {
              await updateProfile(credential.user, {
                displayName: fullName,
              });
            }

            await startServerSession(credential.user, mode === "register" ? phone : undefined);
          } catch (error) {
            setMessage(getAuthErrorMessage(error));
          } finally {
            setIsSubmitting(false);
          }
        }}
      >
        {includeName ? <Input name="fullName" placeholder="Full name" required={mode === "register"} /> : null}
        {mode === "register" ? <Input name="phone" type="tel" placeholder="+234 801 234 5678" required /> : null}
        <Input name="email" type="email" placeholder="Email address" required />
        <Input name="password" type="password" placeholder="Password" required />
        {message ? (
          <Alert tone="error" title="We couldn't sign you in" onDismiss={() => setMessage("")}>
            {message}
          </Alert>
        ) : null}
        <Button className="w-full" disabled={isSubmitting || !isEnabled}>
          {isSubmitting ? "Please wait..." : submitLabel}
        </Button>
      </form>

      <div className="my-6 flex items-center gap-4" aria-hidden="true">
        <span className="h-px flex-1 bg-slate-200" />
        <span className="text-xs font-medium uppercase tracking-[0.2em] text-slate-400">or</span>
        <span className="h-px flex-1 bg-slate-200" />
      </div>

      <Button type="button" variant="secondary" className="w-full" disabled={isSubmitting || !isEnabled} onClick={signInWithGoogle}>
        <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
          <path fill="#4285F4" d="M21.6 12.23c0-.71-.06-1.4-.18-2.07H12v3.92h5.38a4.6 4.6 0 0 1-2 3.02v2.55h3.24c1.9-1.75 2.98-4.33 2.98-7.42Z" />
          <path fill="#34A853" d="M12 22c2.7 0 4.98-.9 6.63-2.35l-3.24-2.55c-.9.6-2.05.96-3.39.96-2.61 0-4.82-1.76-5.61-4.13H3.04v2.63A10 10 0 0 0 12 22Z" />
          <path fill="#FBBC05" d="M6.39 13.93A6.02 6.02 0 0 1 6.07 12c0-.67.11-1.32.32-1.93V7.44H3.04A10 10 0 0 0 2 12c0 1.61.38 3.14 1.04 4.56l3.35-2.63Z" />
          <path fill="#EA4335" d="M12 5.94c1.47 0 2.79.5 3.83 1.5l2.87-2.87A9.63 9.63 0 0 0 12 2a10 10 0 0 0-8.96 5.44l3.35 2.63C7.18 7.7 9.39 5.94 12 5.94Z" />
        </svg>
        Continue with Google
      </Button>

      <p className="mt-6 text-sm text-slate-600">
        {footerText}{" "}
        <Link href={footerLinkHref} className="font-semibold text-sky-600">
          {footerLinkLabel}
        </Link>
      </p>
    </Card>
  );
}
