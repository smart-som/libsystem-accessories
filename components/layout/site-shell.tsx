"use client";

import { usePathname } from "next/navigation";

import { DemoModeBanner } from "@/components/layout/demo-mode-banner";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import type { Category } from "@/lib/types";

export function SiteShell({
  children,
  categories,
  accountHref,
  accountLabel,
  accountNavLinks,
  isAuthenticated,
  syncWithFirebaseAuth,
}: {
  children: React.ReactNode;
  categories: Category[];
  accountHref: string;
  accountLabel: string;
  accountNavLinks: Array<{ href: string; label: string }>;
  isAuthenticated: boolean;
  syncWithFirebaseAuth: boolean;
}) {
  const pathname = usePathname();
  const isAdminRoute = pathname.startsWith("/admin");

  if (isAdminRoute) {
    return <main className="min-h-screen">{children}</main>;
  }

  return (
    <>
      <DemoModeBanner />
      <SiteHeader
        categories={categories}
        accountHref={accountHref}
        accountLabel={accountLabel}
        accountNavLinks={accountNavLinks}
        isAuthenticated={isAuthenticated}
        syncWithFirebaseAuth={syncWithFirebaseAuth}
      />
      <main className="min-h-screen">{children}</main>
      <SiteFooter accountNavLinks={accountNavLinks} />
    </>
  );
}
