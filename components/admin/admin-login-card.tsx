"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type AdminLoginCardProps = {
  credentialsPreview: {
    email: string;
    password: string;
  } | null;
  isEnabled: boolean;
};

export function AdminLoginCard({ credentialsPreview, isEnabled }: AdminLoginCardProps) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  return (
    <Card className="mx-auto max-w-xl">
      <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Admin access</p>
      <h1 className="mt-4 font-display text-4xl font-semibold text-slate-900">Sign in to the dashboard</h1>
      <p className="mt-4 text-sm leading-7 text-slate-600">
        Use the admin credentials below to open the store dashboard, manage products, and review orders.
      </p>

      {credentialsPreview ? (
        <div className="mt-6 rounded-3xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
          <p className="font-semibold">Default admin credentials</p>
          <p className="mt-2">Email: {credentialsPreview.email}</p>
          <p>Password: {credentialsPreview.password}</p>
          <p className="mt-3 text-amber-800">Change these with `ADMIN_LOGIN_EMAIL`, `ADMIN_LOGIN_PASSWORD`, and `ADMIN_SESSION_SECRET` before production use.</p>
        </div>
      ) : null}

      {!isEnabled ? (
        <div className="mt-6 rounded-3xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-700">
          Admin login is disabled because secure credentials have not been configured for this environment.
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
              const response = await fetch("/api/auth/admin-login", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({ email, password }),
              });

              const body = (await response.json().catch(() => null)) as { message?: string } | null;

              if (!response.ok) {
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
          {message ? <p className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">{message}</p> : null}
          <Button className="w-full" disabled={isSubmitting || !isEnabled}>
            {isSubmitting ? "Signing in..." : "Open admin dashboard"}
          </Button>
        </form>
      )}
    </Card>
  );
}
