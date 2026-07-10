"use client";

import { Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";
import type { ChannelSplitPoint, SalesTrendPoint } from "@/lib/types";

type DashboardChartsProps = {
  salesTrend: SalesTrendPoint[];
  channelSplit: ChannelSplitPoint[];
};

function tooltipFormatter(value: number | string | readonly (number | string)[] | undefined) {
  const amount = Array.isArray(value) ? Number(value[0] ?? 0) : Number(value ?? 0);
  return formatCurrency(amount);
}

export function DashboardCharts({ salesTrend, channelSplit }: DashboardChartsProps) {
  return (
    <div className="grid gap-6 xl:grid-cols-[1.25fr,0.75fr]">
      <Card className="rounded-none border-[color:var(--admin-border)] bg-[var(--admin-panel)] text-[var(--admin-text)] shadow-[var(--admin-shadow)]">
        <p className="text-xs uppercase tracking-[0.3em] text-[var(--admin-subtle)]">Sales trend</p>
        <h3 className="mt-3 font-display text-2xl font-semibold text-[var(--admin-text)]">Daily revenue and profit</h3>
        <div className="mt-6 h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={salesTrend}>
              <XAxis dataKey="label" stroke="var(--admin-subtle)" tickLine={false} axisLine={false} />
              <YAxis stroke="var(--admin-subtle)" tickLine={false} axisLine={false} tickFormatter={(value) => `${Number(value) / 1000}k`} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--admin-panel)",
                  border: "1px solid var(--admin-border)",
                  borderRadius: 0,
                  color: "var(--admin-text)",
                }}
                formatter={tooltipFormatter}
              />
              <Line type="monotone" dataKey="revenue" stroke="var(--admin-text)" strokeWidth={3} dot={false} />
              <Line type="monotone" dataKey="profit" stroke="var(--admin-subtle)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="rounded-none border-[color:var(--admin-border)] bg-[var(--admin-panel)] text-[var(--admin-text)] shadow-[var(--admin-shadow)]">
        <p className="text-xs uppercase tracking-[0.3em] text-[var(--admin-subtle)]">Channel split</p>
        <h3 className="mt-3 font-display text-2xl font-semibold text-[var(--admin-text)]">Online vs walk-in</h3>
        <div className="mt-6 h-80">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--admin-panel)",
                  border: "1px solid var(--admin-border)",
                  borderRadius: 0,
                  color: "var(--admin-text)",
                }}
                formatter={tooltipFormatter}
              />
              <Pie data={channelSplit} dataKey="value" nameKey="name" innerRadius={70} outerRadius={110} paddingAngle={6}>
                {channelSplit.map((entry) => (
                  <Cell key={entry.name} fill={entry.name === "Online" ? "var(--admin-text)" : "var(--admin-subtle)"} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {channelSplit.map((entry) => (
            <div key={entry.name} className="border border-[color:var(--admin-border)] bg-[var(--admin-panel-2)] p-4">
              <div className="flex items-center gap-3">
                <span className="h-3 w-3" style={{ backgroundColor: entry.name === "Online" ? "var(--admin-text)" : "var(--admin-subtle)" }} />
                <p className="text-sm font-semibold text-[var(--admin-text)]">{entry.name}</p>
              </div>
              <p className="mt-2 text-sm text-[var(--admin-muted)]">{formatCurrency(entry.value)}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
