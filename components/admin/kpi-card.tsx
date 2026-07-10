import { TrendingDown, TrendingUp } from "lucide-react";

import { Card } from "@/components/ui/card";
import { formatCompactNumber, formatCurrency } from "@/lib/format";
import type { DashboardKPI } from "@/lib/types";

export function KpiCard({ item }: { item: DashboardKPI }) {
  const isCurrency = item.label !== "Orders & Sales";
  const changePositive = item.change >= 0;

  return (
    <Card className="space-y-4 rounded-none border-[color:var(--admin-border)] bg-[var(--admin-panel)] text-[var(--admin-text)] shadow-[var(--admin-shadow)]">
      <p className="text-xs uppercase tracking-[0.3em] text-[var(--admin-subtle)]">{item.label}</p>
      <div className="flex items-end justify-between gap-4">
        <div>
          <h3 className="font-display text-3xl font-semibold text-[var(--admin-text)]">
            {isCurrency ? formatCurrency(item.value) : formatCompactNumber(item.value)}
          </h3>
          <p className="mt-2 text-sm text-[var(--admin-muted)]">{item.helper}</p>
        </div>
        <div
          className={`inline-flex items-center gap-2 border px-3 py-2 text-xs font-semibold ${
            changePositive
              ? "border-[color:var(--admin-border)] bg-[var(--admin-panel-2)] text-[var(--admin-text)]"
              : "border-[color:var(--admin-border)] bg-[var(--admin-panel-2)] text-[var(--admin-text)]"
          }`}
        >
          {changePositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
          {Math.abs(item.change).toFixed(1)}%
        </div>
      </div>
    </Card>
  );
}
