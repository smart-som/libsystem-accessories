import Link from "next/link";

export function SiteFooter({ accountNavLinks }: { accountNavLinks: Array<{ href: string; label: string }> }) {
  return (
    <footer className="border-t border-slate-200 bg-slate-50">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1.4fr,1fr,1fr] lg:px-8">
        <div className="space-y-4">
          <div className="font-display text-2xl font-bold text-slate-900">Libsystem Accessories</div>
          <p className="max-w-md text-sm leading-7 text-slate-600">
            Trusted accessories for phones, computers, gaming setups, and the home. Clean shopping, clear pricing, and reliable delivery.
          </p>
        </div>
        <div className="space-y-4">
          <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">Store</h3>
          <div className="flex flex-col gap-3 text-sm text-slate-600">
            <Link href="/">Home</Link>
            <Link href="/shop">Shop all products</Link>
            <Link href="/cart">Cart</Link>
            <Link href="/checkout">Checkout</Link>
          </div>
        </div>
        <div className="space-y-4">
          <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">Account</h3>
          <div className="flex flex-col gap-3 text-sm text-slate-600">
            {accountNavLinks.map((item) => (
              <Link key={`${item.href}-${item.label}`} href={item.href}>
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
