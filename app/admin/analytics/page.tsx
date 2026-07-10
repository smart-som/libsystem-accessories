import { Card } from "@/components/ui/card";
import { getStoreContext } from "@/lib/catalog";
import { formatCurrency } from "@/lib/format";

export default function AdminAnalyticsPage() {
  const store = getStoreContext();

  return (
    <div className="space-y-6">
      <Card className="rounded-none border-[color:var(--admin-border)] bg-[var(--admin-panel)] text-[var(--admin-text)] shadow-[var(--admin-shadow)]">
        <p className="text-xs uppercase tracking-[0.3em] text-[var(--admin-subtle)]">Daily, weekly, monthly</p>
        <h2 className="mt-3 font-display text-3xl font-semibold text-[var(--admin-text)]">Insight panels built for retail decisions</h2>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-[var(--admin-muted)]">
          The analytics layer is structured around captured item price and cost data, which means changes to current catalog pricing will not distort historical revenue and profit reporting.
        </p>
      </Card>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="rounded-none border-[color:var(--admin-border)] bg-[var(--admin-panel)] text-[var(--admin-text)] shadow-[var(--admin-shadow)]">
          <h3 className="font-display text-2xl font-semibold text-[var(--admin-text)]">Best-selling products</h3>
          <div className="mt-6 space-y-4">
            {store.dashboard.bestSellingProducts.map((item) => (
              <div key={item.name} className="border border-[color:var(--admin-border)] bg-[var(--admin-panel-2)] p-4">
                <p className="font-semibold text-[var(--admin-text)]">{item.name}</p>
                <p className="mt-2 text-sm text-[var(--admin-muted)]">{item.unitsSold} units sold</p>
              </div>
            ))}
          </div>
        </Card>
        <Card className="rounded-none border-[color:var(--admin-border)] bg-[var(--admin-panel)] text-[var(--admin-text)] shadow-[var(--admin-shadow)]">
          <h3 className="font-display text-2xl font-semibold text-[var(--admin-text)]">Most profitable</h3>
          <div className="mt-6 space-y-4">
            {store.dashboard.highestProfitProducts.map((item) => (
              <div key={item.name} className="border border-[color:var(--admin-border)] bg-[var(--admin-panel-2)] p-4">
                <p className="font-semibold text-[var(--admin-text)]">{item.name}</p>
                <p className="mt-2 text-sm text-[var(--admin-muted)]">{formatCurrency(item.profit)}</p>
              </div>
            ))}
          </div>
        </Card>
        <Card className="rounded-none border-[color:var(--admin-border)] bg-[var(--admin-panel)] text-[var(--admin-text)] shadow-[var(--admin-shadow)]">
          <h3 className="font-display text-2xl font-semibold text-[var(--admin-text)]">Low stock alerts</h3>
          <div className="mt-6 space-y-4">
            {store.dashboard.lowStockProducts.map((item) => (
              <div key={item.name} className="border border-[color:var(--admin-border)] bg-[var(--admin-panel-2)] p-4">
                <p className="font-semibold text-[var(--admin-text)]">{item.name}</p>
                <p className="mt-2 text-sm text-[var(--admin-muted)]">{item.stock} units left</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
