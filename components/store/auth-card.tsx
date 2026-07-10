"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getFirebaseBrowserAuth, getFirebaseBrowserFirestore } from "@/lib/firebase/client";
import { firestoreCollections } from "@/lib/firebase/firestore";

type AuthCardProps = {
  mode: "login" | "register";
  provider: "firebase" | "local";
  title: string;
  description: string;
  submitLabel: string;
  footerText: string;
  footerLinkHref: string;
  footerLinkLabel: string;
  includeName?: boolean;
  credentialsPreview?: {
    email: string;
    password: string;
  } | null;
};

export function AuthCard({
  mode,
  provider,
  title,
  description,
  submitLabel,
  footerText,
  footerLinkHref,
  footerLinkLabel,
  includeName = false,
  credentialsPreview = null,
}: AuthCardProps) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  return (
    <Card className="mx-auto max-w-xl">
      <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Welcome back</p>
      <h1 className="mt-4 font-display text-4xl font-semibold text-slate-900">{title}</h1>
      <p className="mt-4 text-sm leading-7 text-slate-600">{description}</p>
      {provider === "local" && credentialsPreview && mode === "login" ? (
        <div className="mt-6 rounded-3xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
          <p className="font-semibold">Demo customer login</p>
          <p className="mt-2">Email: {credentialsPreview.email}</p>
          <p>Password: {credentialsPreview.password}</p>
          <p className="mt-3 text-amber-800">This simple customer account works in local demo mode, and you can also register additional local customers below.</p>
        </div>
      ) : null}

      <form
        className="mt-8 space-y-4"
        onSubmit={async (event) => {
          event.preventDefault();
          setMessage("");
          setIsSubmitting(true);

          try {
            const formData = new FormData(event.currentTarget);
            const fullName = String(formData.get("fullName") ?? "").trim();
            const phone = String(formData.get("phone") ?? "").trim();
            const email = String(formData.get("email") ?? "").trim();
            const password = String(formData.get("password") ?? "");
            if (provider === "local") {
              const response = await fetch(
                mode === "register" ? "/api/auth/customer-register" : "/api/auth/customer-login",
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify(
                    mode === "register"
                      ? { fullName, phone, email, password }
                      : { email, password },
                  ),
                },
              );

              const body = (await response.json().catch(() => null)) as { message?: string } | null;

              if (!response.ok) {
                throw new Error(body?.message ?? "We could not sign you in to your customer account.");
              }

              router.push("/account");
            } else {
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

              const firestore = getFirebaseBrowserFirestore();

              if (mode === "register" && firestore) {
                await setDoc(
                  doc(firestore, firestoreCollections.profiles, credential.user.uid),
                  {
                    fullName: fullName || credential.user.displayName || "",
                    email,
                    phone,
                    role: "customer",
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp(),
                  },
                  { merge: true },
                );
              }

              const idToken = await credential.user.getIdToken(true);
              const tokenResult = await credential.user.getIdTokenResult();

              const response = await fetch("/api/auth/session", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({ idToken }),
              });

              if (!response.ok) {
                throw new Error("We could not start your authenticated session.");
              }

              const role = tokenResult.claims.role;
              router.push(role === "admin" || role === "staff" ? "/admin" : "/account");
            }

            router.refresh();
          } catch (error) {
            const nextMessage = error instanceof Error ? error.message : "Something went wrong while signing you in.";
            setMessage(nextMessage);
          } finally {
            setIsSubmitting(false);
          }
        }}
      >
        {includeName ? <Input name="fullName" placeholder="Full name" required={mode === "register"} /> : null}
        {mode === "register" ? <Input name="phone" type="tel" placeholder="+234 801 234 5678" required /> : null}
        <Input name="email" type="email" placeholder="Email address" required />
        <Input name="password" type="password" placeholder="Password" required />
        {message ? <p className="rounded-2xl border border-sky-100 bg-sky-50 px-4 py-3 text-sm text-sky-600">{message}</p> : null}
        <Button className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Please wait..." : submitLabel}
        </Button>
      </form>

      <p className="mt-6 text-sm text-slate-600">
        {footerText}{" "}
        <Link href={footerLinkHref} className="font-semibold text-sky-600">
          {footerLinkLabel}
        </Link>
      </p>
    </Card>
  );
}
