"use client";

import { Download, ReceiptText, Search } from "lucide-react";
import { useDeferredValue, useMemo, useState } from "react";

import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { buttonVariants } from "@/components/ui/button";
import { formatCompactNumber, formatCurrency, formatDate } from "@/lib/format";
import type { SalesRecord } from "@/lib/types";
import { cn } from "@/lib/utils";

function formatChannelLabel(channel: SalesRecord["channel"]) {
  return channel === "online" ? "Online" : "Walk-in";
}

export function SalesReport({ sales }: { sales: SalesRecord[] }) {
  const [search, setSearch] = useState("");
  const [channel, setChannel] = useState<"all" | SalesRecord["channel"]>("all");
  const deferredSearch = useDeferredValue(search);

  const filteredSales = useMemo(() => {
    const query = deferredSearch.trim().toLowerCase();

    return sales.filter((sale) => {
      const matchesChannel = channel === "all" || sale.channel === channel;
      const matchesQuery =
        !query ||
        sale.reference.toLowerCase().includes(query) ||
        sale.customerName.toLowerCase().includes(query) ||
        sale.customerPhone.toLowerCase().includes(query) ||
        sale.itemsSummary.toLowerCase().includes(query);

      return matchesChannel && matchesQuery;
    });
  }, [channel, deferredSearch, sales]);

  const totalSalesValue = filteredSales.reduce((total, sale) => total + sale.total, 0);
  const totalUnits = filteredSales.reduce((total, sale) => total + sale.units, 0);
  const onlineSalesValue = filteredSales
    .filter((sale) => sale.channel === "online")
    .reduce((total, sale) => total + sale.total, 0);
  const walkInSalesValue = filteredSales
    .filter((sale) => sale.channel === "walk_in")
    .reduce((total, sale) => total + sale.total, 0);

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "All sales", value: formatCurrency(totalSalesValue), helper: `${filteredSales.length} records` },
          { label: "Online sales", value: formatCurrency(onlineSalesValue), helper: "Orders paid online" },
          { label: "Walk-in sales", value: formatCurrency(walkInSalesValue), helper: "Sales recorded in store" },
          { label: "Units sold", value: formatCompactNumber(totalUnits), helper: "Combined across channels" },
        ].map((item) => (
          <Card key={item.label} className="rounded-none border-[color:var(--admin-border)] bg-[var(--admin-panel)] text-[var(--admin-text)] shadow-[var(--admin-shadow)]">
            <p className="text-xs uppercase tracking-[0.3em] text-[var(--admin-subtle)]">{item.label}</p>
            <p className="mt-3 font-display text-3xl font-semibold text-[var(--admin-text)]">{item.value}</p>
            <p className="mt-2 text-sm text-[var(--admin-muted)]">{item.helper}</p>
          </Card>
        ))}
      </div>

      <Card className="rounded-none border-[color:var(--admin-border)] bg-[var(--admin-panel)] text-[var(--admin-text)] shadow-[var(--admin-shadow)]">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-[var(--admin-subtle)]">Sales ledger</p>
            <h2 className="mt-3 font-display text-3xl font-semibold text-[var(--admin-text)]">Every online and walk-in sale</h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--admin-muted)]">
              Review all completed sales in one place, then export the same ledger as CSV for spreadsheets or bookkeeping.
            </p>
          </div>
          <a
            href="/api/admin/sales/export"
            className={cn(buttonVariants({ variant: "secondary" }), "rounded-none border-[color:var(--admin-border)] bg-[var(--admin-panel-2)] text-[var(--admin-text)] hover:bg-[var(--admin-accent-soft)]")}
          >
            <Download className="h-4 w-4" />
            Download CSV
          </a>
        </div>

        <div className="mt-6 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-wrap gap-3">
            <div className="relative min-w-[240px]">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--admin-subtle)]" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search reference, customer, or item"
                className="h-12 rounded-none border-[color:var(--admin-border)] bg-[var(--admin-input)] pl-11 text-[var(--admin-text)] placeholder:text-[var(--admin-subtle)] focus:border-[color:var(--admin-accent)]"
              />
            </div>
            <Select
              value={channel}
              onChange={(event) => setChannel(event.target.value as "all" | SalesRecord["channel"])}
              className="h-12 min-w-[170px] rounded-none border-[color:var(--admin-border)] bg-[var(--admin-input)] text-[var(--admin-text)] focus:border-[color:var(--admin-accent)]"
            >
              <option value="all">All channels</option>
              <option value="online">Online</option>
              <option value="walk_in">Walk-in</option>
            </Select>
          </div>
          <div className="inline-flex items-center gap-2 border border-[color:var(--admin-border)] bg-[var(--admin-panel-2)] px-4 py-3 text-sm text-[var(--admin-muted)]">
            <ReceiptText className="h-4 w-4" />
            {filteredSales.length} sales record(s)
          </div>
        </div>

        <div className="mt-6 overflow-hidden border border-[color:var(--admin-border)] bg-[var(--admin-input)]">
          <div className="grid grid-cols-[1.05fr,0.85fr,1.1fr,0.8fr,0.85fr,1.4fr] gap-3 border-b border-[color:var(--admin-border)] px-5 py-4 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--admin-subtle)]">
            <div>Reference</div>
            <div>Channel</div>
            <div>Customer</div>
            <div>Total</div>
            <div>Date</div>
            <div>Items</div>
          </div>

          <div className="divide-y divide-[color:var(--admin-border)]">
            {filteredSales.map((sale) => (
              <div key={sale.id} className="grid grid-cols-[1.05fr,0.85fr,1.1fr,0.8fr,0.85fr,1.4fr] gap-3 px-5 py-4 text-sm">
                <div>
                  <p className="font-semibold text-[var(--admin-text)]">{sale.reference}</p>
                  <p className="mt-1 text-xs text-[var(--admin-subtle)]">{sale.status}</p>
                </div>
                <div>
                  <span className="border border-[color:var(--admin-border)] bg-[var(--admin-panel-2)] px-3 py-1.5 text-xs font-semibold text-[var(--admin-text)]">
                    {formatChannelLabel(sale.channel)}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-[var(--admin-text)]">{sale.customerName}</p>
                  <p className="mt-1 text-xs text-[var(--admin-subtle)]">{sale.customerPhone}</p>
                </div>
                <div className="font-medium text-[var(--admin-text)]">{formatCurrency(sale.total)}</div>
                <div className="text-[var(--admin-muted)]">{formatDate(sale.soldAt)}</div>
                <div className="text-[var(--admin-muted)]">{sale.itemsSummary}</div>
              </div>
            ))}

            {!filteredSales.length ? (
              <div className="px-5 py-12 text-center text-sm text-[var(--admin-muted)]">No sales match the current filters.</div>
            ) : null}
          </div>
        </div>
      </Card>
    </div>
  );
}
