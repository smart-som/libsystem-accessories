import { redirect } from "next/navigation";

import { AuthCard } from "@/components/store/auth-card";
import { getSessionContext } from "@/lib/auth";
import { isFirebaseAdminConfigured, isFirebaseConfigured } from "@/lib/env";

export default async function LoginPage() {
  const session = await getSessionContext();

  if (session.user && session.role === "customer") {
    redirect("/account");
  }

  if (session.user && (session.role === "admin" || session.role === "staff")) {
    redirect("/admin");
  }

  const isEnabled = isFirebaseConfigured && isFirebaseAdminConfigured;

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="mb-8">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Customer access</p>
          <h2 className="mt-3 font-display text-4xl font-semibold text-slate-900">Sign in to your account</h2>
        </div>
      </div>

      <AuthCard
        mode="login"
        isEnabled={isEnabled}
        title="Sign in"
        description="Sign in to track orders, manage saved details, and access the right experience for your account."
        submitLabel="Sign in"
        footerText="New to Libsystem?"
        footerLinkHref="/register"
        footerLinkLabel="Create an account"
      />
    </div>
  );
}
