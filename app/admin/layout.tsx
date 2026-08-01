import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { AdminShell } from "@/components/admin/admin-shell";
import { getSessionContext } from "@/lib/auth";
import { getOrders } from "@/lib/catalog";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await getSessionContext();

  if (!session.user || (session.role !== "admin" && session.role !== "staff")) {
    redirect("/libsystem-admin-secure-access-7k9m2x4q");
  }

  return (
    <AdminShell
      userEmail={session.user.email ?? "admin@libsystem.local"}
      userName={session.user.displayName ?? session.user.email ?? "Admin"}
      role={session.role}
      initialOrders={await getOrders()}
    >
      {children}
    </AdminShell>
  );
}
