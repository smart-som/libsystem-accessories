import type { Metadata } from "next";

import { SiteShell } from "@/components/layout/site-shell";
import { CartProvider } from "@/components/providers/cart-provider";
import { getSessionContext } from "@/lib/auth";
import { getStorefrontNavigationCatalog } from "@/lib/catalog";
import { isFirebaseAdminConfigured, isFirebaseConfigured } from "@/lib/env";

import "./globals.css";

export const metadata: Metadata = {
  title: "Libsystem Accessories",
  description: "Nigeria-first ecommerce for phones, gaming gear, computer accessories, and home appliances.",
  icons: { icon: "/libsystem-logo.jpeg" },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSessionContext();
  const { categories, products } = await getStorefrontNavigationCatalog();
  const isStaffUser = session.user && (session.role === "admin" || session.role === "staff");
  const isCustomerUser = session.user && session.role === "customer";
  const accountHref = isStaffUser ? "/admin" : isCustomerUser ? "/account" : "/login";
  const accountLabel = isStaffUser ? "Dashboard" : isCustomerUser ? "My account" : "Sign in";
  const accountNavLinks = isStaffUser
    ? [
        { href: "/admin", label: "Dashboard" },
        { href: "/admin/orders", label: "Orders" },
      ]
    : isCustomerUser
      ? [
          { href: "/account", label: "My account" },
          { href: "/account/orders", label: "Order history" },
        ]
      : [
          { href: "/login", label: "Sign in" },
          { href: "/register", label: "Create account" },
        ];
  const syncWithFirebaseAuth = isFirebaseConfigured && isFirebaseAdminConfigured;

  return (
    <html lang="en" suppressHydrationWarning data-scroll-behavior="smooth">
      <body suppressHydrationWarning className="bg-white text-slate-900 antialiased">
        <CartProvider products={products}>
          <SiteShell
            categories={categories}
            accountHref={accountHref}
            accountLabel={accountLabel}
            accountNavLinks={accountNavLinks}
            isAuthenticated={Boolean(session.user)}
            syncWithFirebaseAuth={syncWithFirebaseAuth}
          >
            {children}
          </SiteShell>
        </CartProvider>
      </body>
    </html>
  );
}
