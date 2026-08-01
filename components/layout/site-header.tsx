"use client";

import Image from "next/image";
import Link from "next/link";
import { Menu, Search, ShoppingBag, User } from "lucide-react";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";

import { buttonVariants } from "@/components/ui/button";
import { getFirebaseBrowserAuth } from "@/lib/firebase/client";
import type { Category } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useCart } from "@/components/providers/cart-provider";

function getCategoryLabel(name: string) {
  return name
    .replace(" Accessories", "")
    .replace(" Appliances", "")
    .trim();
}

export function SiteHeader({
  categories,
  accountHref: initialAccountHref,
  accountLabel: initialAccountLabel,
  accountNavLinks,
  isAuthenticated,
  syncWithFirebaseAuth,
}: {
  categories: Category[];
  accountHref: string;
  accountLabel: string;
  accountNavLinks: Array<{ href: string; label: string }>;
  isAuthenticated: boolean;
  syncWithFirebaseAuth: boolean;
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [firebaseIsAuthenticated, setFirebaseIsAuthenticated] = useState<boolean | null>(null);
  const resolvedIsAuthenticated = firebaseIsAuthenticated ?? isAuthenticated;
  const accountHref = firebaseIsAuthenticated === null ? initialAccountHref : firebaseIsAuthenticated ? "/account" : "/login";
  const accountLabel = firebaseIsAuthenticated === null ? initialAccountLabel : firebaseIsAuthenticated ? "My account" : "Sign in";
  const { totalItems } = useCart();
  const categoryLinks = categories.map((category) => ({
    href: `/shop?category=${category.slug}`,
    label: getCategoryLabel(category.name),
  }));
  const secondaryAccountLink = accountNavLinks.find((item) => item.href !== accountHref);

  useEffect(() => {
    if (!syncWithFirebaseAuth) {
      return;
    }

    const auth = getFirebaseBrowserAuth();

    if (!auth) {
      return;
    }

    let active = true;

    void auth.authStateReady().then(() => {
      if (!active) {
        return;
      }

      const isLoggedIn = Boolean(auth.currentUser);
      setFirebaseIsAuthenticated(isLoggedIn);
    });

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      const isLoggedIn = Boolean(user);
      setFirebaseIsAuthenticated(isLoggedIn);
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [syncWithFirebaseAuth]);

  const mobileLinks = [{ href: "/shop#product-search", label: "Search products" }, ...categoryLinks, ...accountNavLinks];

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-3 py-3 sm:gap-4 sm:px-6 sm:py-4 lg:px-8">
        <Link href="/" className="flex min-w-0 items-center gap-2 sm:gap-3">
          <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm sm:h-12 sm:w-12 sm:rounded-2xl">
            <Image src="/libsystem-logo.jpeg" alt="Libsystem Accessories logo" fill sizes="(min-width: 640px) 48px, 40px" className="object-cover" />
          </div>
          <div className="min-w-0">
            <div className="truncate font-display text-lg font-bold tracking-tight text-slate-900 sm:text-xl">Libsystem</div>
            <div className="hidden text-xs uppercase tracking-[0.3em] text-slate-500 min-[390px]:block">Accessories</div>
          </div>
        </Link>

        <nav className="hidden min-w-0 flex-1 items-center justify-center gap-6 text-sm text-slate-600 lg:flex">
          {categoryLinks.map((item) => (
            <Link key={item.href} href={item.href} className="whitespace-nowrap transition hover:text-slate-900">
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <form action="/shop" className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-2 py-2">
            <div className="flex items-center gap-2 px-2">
              <Search className="h-4 w-4 text-slate-400" />
              <input
                type="search"
                name="query"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search products"
                className="w-40 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
              />
            </div>
            <button type="submit" className="inline-flex h-9 items-center gap-2 rounded-full bg-slate-900 px-4 text-sm font-semibold text-white">
              <Search className="h-4 w-4" />
              Search
            </button>
          </form>

          {resolvedIsAuthenticated ? (
            <>
              {secondaryAccountLink ? (
                <Link href={secondaryAccountLink.href} className="text-sm font-medium text-slate-600 transition hover:text-slate-900">
                  {secondaryAccountLink.label}
                </Link>
              ) : null}
              <Link href={accountHref} aria-label={accountLabel} className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                <User className="h-4 w-4" />
                {accountLabel}
              </Link>
            </>
          ) : (
            <>
              <Link href="/login" className="text-sm font-medium text-slate-600 transition hover:text-slate-900">
                Sign in
              </Link>
              <Link href="/register" className={cn(buttonVariants({ variant: "secondary", size: "sm" }))}>
                Create account
              </Link>
            </>
          )}

          <Link href="/cart" className={cn(buttonVariants({ variant: "secondary", size: "sm" }), "relative")}>
            <ShoppingBag className="h-4 w-4" />
            Cart
            <span className="absolute -right-2 -top-2 inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-slate-900 px-1.5 text-[10px] font-bold text-white">
              {totalItems}
            </span>
          </Link>
        </div>

        <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2 lg:hidden">
          <Link
            href="/shop#product-search"
            aria-label="Search products"
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-300 bg-white text-slate-700 sm:h-11 sm:w-11"
          >
            <Search className="h-5 w-5" />
          </Link>
          <Link href="/cart" aria-label="Cart" className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-300 bg-white text-slate-700 sm:h-11 sm:w-11">
            <ShoppingBag className="h-5 w-5" />
            <span className="absolute -right-2 -top-2 inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-slate-900 px-1.5 text-[10px] font-bold text-white">
              {totalItems}
            </span>
          </Link>
          <details className="group relative">
            <summary className="inline-flex h-10 w-10 cursor-pointer list-none items-center justify-center rounded-xl border border-slate-300 bg-white text-slate-700 sm:h-11 sm:w-11 [&::-webkit-details-marker]:hidden">
              <span className="sr-only">Open navigation</span>
              <Menu className="h-5 w-5" />
            </summary>
            <div className="absolute right-0 top-[calc(100%+0.75rem)] z-50 w-72 max-w-[calc(100vw-1.5rem)] overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl">
              <nav className="flex flex-col text-sm text-slate-700">
                {mobileLinks.map((item) => (
                  <Link key={`${item.href}-${item.label}`} href={item.href} className="rounded-xl px-3 py-3 transition hover:bg-slate-100">
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>
          </details>
        </div>
      </div>
    </header>
  );
}
