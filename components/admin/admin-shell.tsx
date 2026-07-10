"use client";

import Image from "next/image";
import Link from "next/link";
import { Bell, ChartColumn, CreditCard, HelpCircle, LayoutDashboard, Moon, Package, ReceiptText, Search, Settings2, ShoppingBag, Sun, Users, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { ADMIN_NOTIFICATIONS_CHANGED_EVENT, markAdminNotificationsRead, readAdminNotificationOrderIds } from "@/lib/admin-notifications";
import { AdminSignOutButton } from "@/components/admin/admin-sign-out-button";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate } from "@/lib/format";
import { formatOrderStatus } from "@/lib/order-status";
import type { Order } from "@/lib/types";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
  { href: "/admin/sales", label: "Sales", icon: ReceiptText },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/walk-in-sales", label: "Walk-in sales", icon: CreditCard },
  { href: "/admin/analytics", label: "Analytics", icon: ChartColumn },
  { href: "/admin/staff", label: "Staff", icon: Users },
];

const utilityItems = [
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "help", label: "Help", icon: HelpCircle },
  { id: "settings", label: "Settings", icon: Settings2 },
] as const;

const routeTitles: Record<string, string> = {
  "/admin": "Dashboard",
  "/admin/orders": "Orders",
  "/admin/sales": "Sales",
  "/admin/products": "Products",
  "/admin/walk-in-sales": "Walk-in sales",
  "/admin/analytics": "Analytics",
  "/admin/staff": "Staff",
};

function getInitials(value: string) {
  return value
    .split(/[\s@._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function AdminShell({
  children,
  userEmail,
  userName,
  role,
  initialOrders,
}: {
  children: React.ReactNode;
  userEmail: string;
  userName: string;
  role: string;
  initialOrders: Order[];
}) {
  const pathname = usePathname();
  const [activeUtilityPanel, setActiveUtilityPanel] = useState<"notifications" | "help" | "settings" | null>(null);
  const [readNotificationOrderIds, setReadNotificationOrderIds] = useState<string[]>([]);
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (typeof window === "undefined") {
      return "dark";
    }

    const storedTheme = window.localStorage.getItem("libsystem-admin-theme");
    if (storedTheme === "light" || storedTheme === "dark") {
      return storedTheme;
    }

    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });
  const pageTitle = routeTitles[pathname] ?? "Dashboard";
  const displayName = userName.trim() || userEmail.split("@")[0] || "Admin";
  const initials = getInitials(displayName);
  const recentOrders = useMemo(
    () =>
      [...initialOrders]
        .sort((left, right) => new Date(right.placedAt).getTime() - new Date(left.placedAt).getTime())
        .slice(0, 6),
    [initialOrders],
  );
  const unreadRecentOrders = useMemo(
    () => recentOrders.filter((order) => !readNotificationOrderIds.includes(order.id)),
    [readNotificationOrderIds, recentOrders],
  );
  const recentOrderCount = unreadRecentOrders.length;
  const helpCards = [
    {
      title: "Products",
      body: "Use Edit or Create new product in the Products page. The form now scrolls into view automatically so the open editor is obvious.",
    },
    {
      title: "Orders",
      body: "New online demo orders are added to the order list and surface in Notifications, while the Orders page remains the place for full status updates.",
    },
    {
      title: "Customer login",
      body: "Customers can now sign in from /login with the demo customer account in local mode, or register a simple local customer account for testing.",
    },
    {
      title: "Inventory rule",
      body: "Products with zero stock become inactive, and only zero-stock products can be deleted from the catalog manager.",
    },
  ];

  useEffect(() => {
    window.localStorage.setItem("libsystem-admin-theme", theme);
  }, [theme]);

  useEffect(() => {
    setReadNotificationOrderIds(readAdminNotificationOrderIds());

    const syncReadIds = () => {
      setReadNotificationOrderIds(readAdminNotificationOrderIds());
    };

    window.addEventListener("storage", syncReadIds);
    window.addEventListener(ADMIN_NOTIFICATIONS_CHANGED_EVENT, syncReadIds as EventListener);

    return () => {
      window.removeEventListener("storage", syncReadIds);
      window.removeEventListener(ADMIN_NOTIFICATIONS_CHANGED_EVENT, syncReadIds as EventListener);
    };
  }, []);

  useEffect(() => {
    if (activeUtilityPanel !== "notifications" || !recentOrders.length) {
      return;
    }

    setReadNotificationOrderIds(markAdminNotificationsRead(recentOrders.map((order) => order.id)));
  }, [activeUtilityPanel, recentOrders]);

  const closeUtilityPanel = () => setActiveUtilityPanel(null);

  const toggleUtilityPanel = (panel: "notifications" | "help" | "settings") => {
    setActiveUtilityPanel((current) => (current === panel ? null : panel));
  };

  const sidebarLinks = navItems.map((item) => ({
    ...item,
    active: pathname === item.href,
  }));

  return (
    <div
      suppressHydrationWarning
      data-admin-theme={theme}
      className="min-h-screen bg-[var(--admin-bg)] text-[var(--admin-text)] transition-colors duration-200"
    >
      <div className="flex min-h-screen gap-0">
        <aside className="sticky top-0 flex h-screen w-full max-w-[250px] shrink-0 flex-col overflow-y-auto border-r border-[color:var(--admin-border)] bg-[var(--admin-sidebar)] px-4 py-5">
          <Link href="/admin" className="flex items-center gap-3 px-1">
            <div className="relative flex h-11 w-11 items-center justify-center overflow-hidden border border-[color:var(--admin-border)] bg-[var(--admin-panel-2)]">
              <Image src="/libsystem-logo.jpeg" alt="Libsystem Accessories logo" fill className="object-cover" />
            </div>
            <div>
              <p className="font-display text-xl font-semibold text-[var(--admin-text)]">ProfitPulse</p>
              <p className="text-xs text-[var(--admin-subtle)]">Libsystem admin</p>
            </div>
          </Link>

          <nav className="mt-8 space-y-2">
            {sidebarLinks.map((item) => {
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 border px-4 py-3 text-sm transition",
                    item.active
                      ? "border-[color:var(--admin-accent)] bg-[var(--admin-accent)] font-semibold text-[var(--admin-on-accent)]"
                      : "border-transparent text-[var(--admin-muted)] hover:border-[color:var(--admin-border)] hover:bg-[var(--admin-panel)] hover:text-[var(--admin-text)]",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="mt-8 border-t border-[color:var(--admin-border)] pt-6">
            <div className="space-y-2">
              {utilityItems.map((item) => {
                const Icon = item.icon;

                return (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => toggleUtilityPanel(item.id)}
                    className="flex w-full items-center gap-3 border border-transparent px-4 py-3 text-left text-sm text-[var(--admin-muted)] transition hover:border-[color:var(--admin-border)] hover:bg-[var(--admin-panel)] hover:text-[var(--admin-text)]"
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                    {item.id === "notifications" && recentOrderCount > 0 ? (
                      <span className="ml-auto border border-[color:var(--admin-border)] bg-[var(--admin-panel-2)] px-2 py-0.5 text-[10px] font-semibold text-[var(--admin-text)]">
                        {recentOrderCount}
                      </span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-auto pt-8">
            <AdminSignOutButton className="w-full justify-start rounded-none border-[color:var(--admin-border)] bg-[var(--admin-panel)] px-4 text-[var(--admin-muted)] hover:bg-[var(--admin-panel-2)] hover:text-[var(--admin-text)]" />
          </div>
        </aside>

        <main className="min-w-0 flex-1 bg-[var(--admin-main)] p-5 text-[var(--admin-text)] lg:p-7">
          <div className="mb-8 flex flex-col gap-4 border-b border-[color:var(--admin-border)] pb-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-[var(--admin-subtle)]">Admin workspace</p>
                <h1 className="mt-2 font-display text-4xl font-semibold text-[var(--admin-text)]">{pageTitle}</h1>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    aria-label="Notifications"
                    className="h-11 rounded-none border-[color:var(--admin-border)] bg-[var(--admin-panel)] px-3 text-[var(--admin-text)] hover:bg-[var(--admin-panel-2)]"
                    onClick={() => toggleUtilityPanel("notifications")}
                  >
                    <Bell className="h-4 w-4" />
                    {recentOrderCount > 0 ? (
                      <span className="ml-2 inline-flex min-w-5 items-center justify-center border border-[color:var(--admin-border)] bg-[var(--admin-panel-2)] px-1.5 text-[10px] font-semibold text-[var(--admin-text)]">
                        {recentOrderCount}
                      </span>
                    ) : null}
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    aria-label="Search admin area"
                    className="h-11 rounded-none border-[color:var(--admin-border)] bg-[var(--admin-panel)] px-3 text-[var(--admin-text)] hover:bg-[var(--admin-panel-2)]"
                  >
                    <Search className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
                    className="h-11 rounded-none border-[color:var(--admin-border)] bg-[var(--admin-panel)] px-3 text-[var(--admin-text)] hover:bg-[var(--admin-panel-2)]"
                    onClick={() => setTheme((current) => (current === "dark" ? "light" : "dark"))}
                  >
                    {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                  </Button>
                </div>

                <div className="flex items-center gap-3 border border-[color:var(--admin-border)] bg-[var(--admin-panel)] px-3 py-2">
                  <div className="flex h-11 w-11 items-center justify-center border border-[color:var(--admin-border)] bg-[var(--admin-panel-2)] text-sm font-semibold text-[var(--admin-text)]">
                    {initials || "A"}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-[var(--admin-text)]">{displayName}</p>
                    <p className="truncate text-xs text-[var(--admin-subtle)]">{userEmail}</p>
                  </div>
                  <span className="border border-[color:var(--admin-border)] bg-[var(--admin-panel-2)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--admin-subtle)]">
                    {role}
                  </span>
                </div>
              </div>
            </div>

            {children}
        </main>
      </div>

      {activeUtilityPanel ? (
        <div className="fixed inset-0 z-50 bg-black/25" onClick={closeUtilityPanel}>
          <aside
            className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col border-l border-[color:var(--admin-border)] bg-[var(--admin-main)] shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[color:var(--admin-border)] px-5 py-4">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-[var(--admin-subtle)]">Admin utility</p>
                <h2 className="mt-2 font-display text-2xl font-semibold text-[var(--admin-text)]">
                  {activeUtilityPanel === "notifications"
                    ? "Notifications"
                    : activeUtilityPanel === "help"
                      ? "Help"
                      : "Settings"}
                </h2>
              </div>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={closeUtilityPanel}
                className="h-10 rounded-none border-[color:var(--admin-border)] bg-[var(--admin-panel)] px-3 text-[var(--admin-text)] hover:bg-[var(--admin-panel-2)]"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-5">
              {activeUtilityPanel === "notifications" ? (
                recentOrders.length ? (
                  <div className="space-y-4">
                    <p className="text-sm text-[var(--admin-muted)]">
                      Orders placed within the last 24 hours show a count badge here, and the latest orders appear first.
                    </p>
                    {recentOrders.map((order) => {
                      const isRecent = Date.now() - new Date(order.placedAt).getTime() <= 1000 * 60 * 60 * 24;
                      const isUnread = !readNotificationOrderIds.includes(order.id);

                      return (
                        <div key={order.id} className="border border-[color:var(--admin-border)] bg-[var(--admin-panel)] p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="font-semibold text-[var(--admin-text)]">{order.orderNumber}</p>
                              <p className="mt-1 text-sm text-[var(--admin-muted)]">{order.customerName}</p>
                            </div>
                            <span className="border border-[color:var(--admin-border)] bg-[var(--admin-panel-2)] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--admin-text)]">
                              {isRecent && isUnread ? "New" : formatOrderStatus(order.status)}
                            </span>
                          </div>
                          <div className="mt-4 flex items-center justify-between text-sm text-[var(--admin-muted)]">
                            <span>{formatCurrency(order.total)}</span>
                            <span>{formatDate(order.placedAt)}</span>
                          </div>
                        </div>
                      );
                    })}
                    <Link href="/admin/orders" onClick={closeUtilityPanel} className="inline-flex text-sm font-semibold text-[var(--admin-text)] underline underline-offset-4">
                      Open orders workspace
                    </Link>
                  </div>
                ) : (
                  <p className="text-sm text-[var(--admin-muted)]">No order notifications yet.</p>
                )
              ) : null}

              {activeUtilityPanel === "help" ? (
                <div className="space-y-4">
                  <p className="text-sm text-[var(--admin-muted)]">
                    Quick guidance for the workflows that are now connected in this admin area.
                  </p>
                  {helpCards.map((card) => (
                    <div key={card.title} className="border border-[color:var(--admin-border)] bg-[var(--admin-panel)] p-4">
                      <p className="font-semibold text-[var(--admin-text)]">{card.title}</p>
                      <p className="mt-2 text-sm leading-7 text-[var(--admin-muted)]">{card.body}</p>
                    </div>
                  ))}
                </div>
              ) : null}

              {activeUtilityPanel === "settings" ? (
                <div className="space-y-4">
                  <div className="border border-[color:var(--admin-border)] bg-[var(--admin-panel)] p-4">
                    <p className="font-semibold text-[var(--admin-text)]">Theme</p>
                    <p className="mt-2 text-sm leading-7 text-[var(--admin-muted)]">
                      Use the sun and moon button in the header to switch between the light and dark admin themes.
                    </p>
                  </div>
                  <div className="border border-[color:var(--admin-border)] bg-[var(--admin-panel)] p-4">
                    <p className="font-semibold text-[var(--admin-text)]">Session</p>
                    <p className="mt-2 text-sm leading-7 text-[var(--admin-muted)]">
                      Sign out from the sidebar whenever you want to return to the customer storefront or switch accounts.
                    </p>
                  </div>
                </div>
              ) : null}
            </div>
          </aside>
        </div>
      ) : null}
    </div>
  );
}
