import { DashboardChartsShell } from "@/components/admin/dashboard-charts-shell";
import { KpiCard } from "@/components/admin/kpi-card";
import { Card } from "@/components/ui/card";
import { getStoreContext } from "@/lib/catalog";
import { formatCurrency } from "@/lib/format";

export default async function AdminDashboardPage() {
  const store = await getStoreContext();

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {store.dashboard.kpis.map((item) => (
          <KpiCard key={item.label} item={item} />
        ))}
      </div>

      <DashboardChartsShell salesTrend={store.dashboard.salesTrend} channelSplit={store.dashboard.channelSplit} />

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="rounded-none border-[color:var(--admin-border)] bg-[var(--admin-panel)] text-[var(--admin-text)] shadow-[var(--admin-shadow)]">
          <p className="text-xs uppercase tracking-[0.3em] text-[var(--admin-subtle)]">Best sellers</p>
          <div className="mt-6 space-y-4">
            {store.dashboard.bestSellingProducts.map((product) => (
              <div key={product.name} className="flex items-center justify-between border border-[color:var(--admin-border)] bg-[var(--admin-panel-2)] px-4 py-4">
                <div>
                  <p className="font-semibold text-[var(--admin-text)]">{product.name}</p>
                  <p className="text-sm text-[var(--admin-muted)]">{product.unitsSold} units sold</p>
                </div>
                <p className="text-sm text-[var(--admin-text)]">{formatCurrency(product.revenue)}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card className="rounded-none border-[color:var(--admin-border)] bg-[var(--admin-panel)] text-[var(--admin-text)] shadow-[var(--admin-shadow)]">
          <p className="text-xs uppercase tracking-[0.3em] text-[var(--admin-subtle)]">Highest profit</p>
          <div className="mt-6 space-y-4">
            {store.dashboard.highestProfitProducts.map((product) => (
              <div key={product.name} className="flex items-center justify-between border border-[color:var(--admin-border)] bg-[var(--admin-panel-2)] px-4 py-4">
                <p className="font-semibold text-[var(--admin-text)]">{product.name}</p>
                <p className="text-sm text-[var(--admin-text)]">{formatCurrency(product.profit)}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card className="rounded-none border-[color:var(--admin-border)] bg-[var(--admin-panel)] text-[var(--admin-text)] shadow-[var(--admin-shadow)]">
          <p className="text-xs uppercase tracking-[0.3em] text-[var(--admin-subtle)]">Low stock watch</p>
          <div className="mt-6 space-y-4">
            {store.dashboard.lowStockProducts.map((product) => (
              <div key={product.name} className="flex items-center justify-between border border-[color:var(--admin-border)] bg-[var(--admin-panel-2)] px-4 py-4">
                <p className="font-semibold text-[var(--admin-text)]">{product.name}</p>
                <p className="text-sm text-[var(--admin-text)]">{product.stock} left</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
