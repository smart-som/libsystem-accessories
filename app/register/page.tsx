import { redirect } from "next/navigation";

import { AuthCard } from "@/components/store/auth-card";
import { getSessionContext } from "@/lib/auth";
import { isFirebaseAdminConfigured, isFirebaseConfigured } from "@/lib/env";

export default async function RegisterPage() {
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
      <AuthCard
        mode="register"
        isEnabled={isEnabled}
        title="Create your account"
        description="Register to save addresses, check order status, and keep your favorite accessories in one place."
        submitLabel="Create account"
        footerText="Already have an account?"
        footerLinkHref="/login"
        footerLinkLabel="Sign in"
        includeName
      />
    </div>
  );
}
