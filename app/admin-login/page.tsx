import Link from "next/link";
import { redirect } from "next/navigation";

import { AdminLoginCard } from "@/components/admin/admin-login-card";
import { buttonVariants } from "@/components/ui/button";
import { getAdminLoginPreview, isAdminLoginEnabled } from "@/lib/admin-auth";
import { getSessionContext } from "@/lib/auth";
import { cn } from "@/lib/utils";

export default async function AdminLoginPage() {
  const session = await getSessionContext();

  if (session.user && (session.role === "admin" || session.role === "staff")) {
    redirect("/admin");
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Secure area</p>
          <h2 className="mt-3 font-display text-4xl font-semibold text-slate-900">Libsystem admin sign-in</h2>
        </div>
        <Link href="/login" className={cn(buttonVariants({ variant: "secondary" }))}>
          Customer login
        </Link>
      </div>

      <AdminLoginCard credentialsPreview={getAdminLoginPreview()} isEnabled={isAdminLoginEnabled()} />
    </div>
  );
}
