"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";

import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getFirebaseBrowserAuth } from "@/lib/firebase/client";

type AdminLoginCardProps = {
  isEnabled: boolean;
};

export function AdminLoginCard({ isEnabled }: AdminLoginCardProps) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  return (
    <Card className="mx-auto max-w-xl">
      <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Admin access</p>
      <h1 className="mt-4 font-display text-4xl font-semibold text-slate-900">Sign in to the dashboard</h1>
      <p className="mt-4 text-sm leading-7 text-slate-600">
        Sign in with an authorized Firebase admin account to manage products, orders, staff, and sales.
      </p>

      {!isEnabled ? (
        <div className="mt-6 rounded-3xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-700">
          Admin login is disabled until Firebase Admin credentials are configured on the server.
        </div>
      ) : (
        <form
          className="mt-8 space-y-4"
          onSubmit={async (event) => {
            event.preventDefault();
            setMessage("");
            setIsSubmitting(true);

            try {
              const formData = new FormData(event.currentTarget);
              const email = String(formData.get("email") ?? "").trim();
              const password = String(formData.get("password") ?? "");
              const auth = getFirebaseBrowserAuth();

              if (!auth) {
                throw new Error("Firebase Auth is not configured.");
              }

              const credential = await signInWithEmailAndPassword(auth, email, password);
              const idToken = await credential.user.getIdToken(true);
              const response = await fetch("/api/auth/session", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({ idToken, requestedRole: "admin" }),
              });

              const body = (await response.json().catch(() => null)) as { message?: string } | null;

              if (!response.ok) {
                await signOut(auth).catch(() => undefined);
                throw new Error(body?.message ?? "We could not sign you in to the admin dashboard.");
              }

              router.push("/admin");
              router.refresh();
            } catch (error) {
              setMessage(error instanceof Error ? error.message : "Something went wrong while signing you in.");
            } finally {
              setIsSubmitting(false);
            }
          }}
        >
          <Input name="email" type="email" placeholder="Admin email address" autoComplete="username" required />
          <Input name="password" type="password" placeholder="Password" autoComplete="current-password" required />
          {message ? (
            <Alert tone="error" title="Admin sign-in failed" onDismiss={() => setMessage("")}>
              {message}
            </Alert>
          ) : null}
          <Button className="w-full" disabled={isSubmitting || !isEnabled}>
            {isSubmitting ? "Signing in..." : "Open admin dashboard"}
          </Button>
        </form>
      )}
    </Card>
  );
}
