import { redirect } from "next/navigation";
import type { ReactNode } from "react";

import { AdminShell } from "@/components/admin/admin-shell";
import { getSessionContext } from "@/lib/auth";
import { getOrders } from "@/lib/catalog";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await getSessionContext();

  if (!session.user || (session.role !== "admin" && session.role !== "staff")) {
    redirect("/admin-login");
  }

  return (
    <AdminShell
      userEmail={session.user.email ?? "admin@libsystem.local"}
      userName={session.user.displayName ?? session.user.email ?? "Admin"}
      role={session.role}
      initialOrders={getOrders()}
    >
      {children}
    </AdminShell>
  );
}
