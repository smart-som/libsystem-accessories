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
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [accountHref, setAccountHref] = useState(initialAccountHref);
  const [accountLabel, setAccountLabel] = useState(initialAccountLabel);
  const [resolvedIsAuthenticated, setResolvedIsAuthenticated] = useState(isAuthenticated);
  const { totalItems } = useCart();
  const categoryLinks = categories.map((category) => ({
    href: `/shop?category=${category.slug}`,
    label: getCategoryLabel(category.name),
  }));
  const secondaryAccountLink = accountNavLinks.find((item) => item.href !== accountHref);

  useEffect(() => {
    setAccountHref(initialAccountHref);
    setAccountLabel(initialAccountLabel);
    setResolvedIsAuthenticated(isAuthenticated);
  }, [initialAccountHref, initialAccountLabel, isAuthenticated]);

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
      setAccountHref(isLoggedIn ? "/account" : "/login");
      setAccountLabel(isLoggedIn ? "My account" : "Sign in");
      setResolvedIsAuthenticated(isLoggedIn);
    });

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      const isLoggedIn = Boolean(user);
      setAccountHref(isLoggedIn ? "/account" : "/login");
      setAccountLabel(isLoggedIn ? "My account" : "Sign in");
      setResolvedIsAuthenticated(isLoggedIn);
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [syncWithFirebaseAuth]);

  const mobileLinks = [{ href: "/shop", label: "Search products" }, ...categoryLinks, ...accountNavLinks];

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          <div className="relative h-12 w-12 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <Image src="/libsystem-logo.jpeg" alt="Libsystem Accessories logo" fill className="object-cover" />
          </div>
          <div>
            <div className="font-display text-xl font-bold tracking-tight text-slate-900">Libsystem</div>
            <div className="text-xs uppercase tracking-[0.3em] text-slate-500">Accessories</div>
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

        <div className="ml-auto flex items-center gap-2 lg:hidden">
          <Link
            href="/shop"
            aria-label="Search products"
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-300 bg-white text-slate-700"
          >
            <Search className="h-5 w-5" />
          </Link>
          <Link
            href={accountHref}
            aria-label={accountLabel}
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-300 bg-white text-slate-700"
          >
            <User className="h-5 w-5" />
          </Link>
          <Link href="/cart" aria-label="Cart" className="relative inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-300 bg-white text-slate-700">
            <ShoppingBag className="h-5 w-5" />
            <span className="absolute -right-2 -top-2 inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-slate-900 px-1.5 text-[10px] font-bold text-white">
              {totalItems}
            </span>
          </Link>
          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-300 bg-white text-slate-700"
            onClick={() => setOpen((value) => !value)}
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className={cn("border-t border-slate-200 lg:hidden", open ? "block" : "hidden")}>
        <nav className="mx-auto flex max-w-7xl flex-col px-4 py-3 text-sm text-slate-600 sm:px-6">
          {mobileLinks.map((item) => (
            <Link key={`${item.href}-${item.label}`} href={item.href} className="rounded-2xl px-3 py-3 hover:bg-slate-100" onClick={() => setOpen(false)}>
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
