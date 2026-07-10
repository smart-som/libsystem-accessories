"use client";

import dynamic from "next/dynamic";

import type { ChannelSplitPoint, SalesTrendPoint } from "@/lib/types";

const DashboardCharts = dynamic(
  () => import("@/components/admin/dashboard-charts").then((module) => module.DashboardCharts),
  {
    ssr: false,
  },
);

type DashboardChartsShellProps = {
  salesTrend: SalesTrendPoint[];
  channelSplit: ChannelSplitPoint[];
};

export function DashboardChartsShell(props: DashboardChartsShellProps) {
  return <DashboardCharts {...props} />;
}
