import { eachDayOfInterval, endOfDay, format, isWithinInterval, startOfDay, subDays } from "date-fns";

import type { DashboardSnapshot, Order, Product, WalkInSale } from "@/lib/types";

type DashboardInput = {
  products: Product[];
  orders: Order[];
  walkInSales: WalkInSale[];
};

function getItemProfit(unitPrice: number, unitCost: number, quantity: number) {
  return (unitPrice - unitCost) * quantity;
}

export function buildDashboardSnapshot({
  products,
  orders,
  walkInSales,
}: DashboardInput): DashboardSnapshot {
  const now = new Date("2026-05-05T12:00:00.000Z");
  const currentWindowStart = startOfDay(subDays(now, 6));
  const previousWindowStart = startOfDay(subDays(now, 13));
  const previousWindowEnd = endOfDay(subDays(now, 7));

  const allSales = [
    ...orders.map((order) => ({
      date: new Date(order.placedAt),
      revenue: order.total,
      subtotal: order.subtotal,
      units: order.items.reduce((total, item) => total + item.quantity, 0),
      profit: order.items.reduce(
        (total, item) => total + getItemProfit(item.unitPrice, item.unitCost, item.quantity),
        0,
      ),
      channel: "online" as const,
      items: order.items,
    })),
    ...walkInSales.map((sale) => ({
      date: new Date(sale.soldAt),
      revenue: sale.total,
      subtotal: sale.subtotal,
      units: sale.items.reduce((total, item) => total + item.quantity, 0),
      profit: sale.items.reduce(
        (total, item) => total + getItemProfit(item.unitPrice, item.unitCost, item.quantity),
        0,
      ),
      channel: "walk_in" as const,
      items: sale.items,
    })),
  ];

  const currentSales = allSales.filter((sale) =>
    isWithinInterval(sale.date, { start: currentWindowStart, end: now }),
  );
  const previousSales = allSales.filter((sale) =>
    isWithinInterval(sale.date, { start: previousWindowStart, end: previousWindowEnd }),
  );

  const currentRevenue = currentSales.reduce((total, sale) => total + sale.revenue, 0);
  const currentProfit = currentSales.reduce((total, sale) => total + sale.profit, 0);
  const currentUnits = currentSales.reduce((total, sale) => total + sale.units, 0);
  const currentOrders = currentSales.length;
  const previousRevenue = previousSales.reduce((total, sale) => total + sale.revenue, 0);
  const previousProfit = previousSales.reduce((total, sale) => total + sale.profit, 0);
  const previousOrders = previousSales.length;
  const previousAov = previousOrders === 0 ? 0 : previousRevenue / previousOrders;
  const currentAov = currentOrders === 0 ? 0 : currentRevenue / currentOrders;

  const change = (current: number, previous: number) => {
    if (previous === 0) {
      return current === 0 ? 0 : 100;
    }

    return ((current - previous) / previous) * 100;
  };

  const salesTrend = eachDayOfInterval({ start: currentWindowStart, end: now }).map((date) => {
    const daySales = currentSales.filter((sale) => format(sale.date, "yyyy-MM-dd") === format(date, "yyyy-MM-dd"));

    return {
      label: format(date, "EEE"),
      revenue: daySales.reduce((total, sale) => total + sale.revenue, 0),
      profit: daySales.reduce((total, sale) => total + sale.profit, 0),
      orders: daySales.length,
    };
  });

  const onlineRevenue = currentSales
    .filter((sale) => sale.channel === "online")
    .reduce((total, sale) => total + sale.revenue, 0);
  const walkInRevenue = currentSales
    .filter((sale) => sale.channel === "walk_in")
    .reduce((total, sale) => total + sale.revenue, 0);

  const productStats = new Map<string, { name: string; unitsSold: number; revenue: number; profit: number }>();
  for (const sale of currentSales) {
    for (const item of sale.items) {
      const current =
        productStats.get(item.productId) ??
        { name: item.productName, unitsSold: 0, revenue: 0, profit: 0 };

      current.unitsSold += item.quantity;
      current.revenue += item.unitPrice * item.quantity;
      current.profit += getItemProfit(item.unitPrice, item.unitCost, item.quantity);
      productStats.set(item.productId, current);
    }
  }

  const lowStockProducts = products
    .map((product) => ({
      name: product.name,
      stock: product.variants.reduce((total, variant) => total + variant.stockQuantity, 0),
    }))
    .sort((a, b) => a.stock - b.stock)
    .slice(0, 5);

  return {
    kpis: [
      {
        label: "Gross Sales",
        value: currentRevenue,
        change: change(currentRevenue, previousRevenue),
        helper: "Across online and walk-in sales",
      },
      {
        label: "Profit",
        value: currentProfit,
        change: change(currentProfit, previousProfit),
        helper: "Captured from item-level costs",
      },
      {
        label: "Orders & Sales",
        value: currentOrders,
        change: change(currentOrders, previousOrders),
        helper: `${currentUnits} units sold in the last 7 days`,
      },
      {
        label: "Average Order Value",
        value: currentAov,
        change: change(currentAov, previousAov),
        helper: "Blended across channels",
      },
    ],
    salesTrend,
    channelSplit: [
      { name: "Online", value: onlineRevenue, color: "#2f6df6" },
      { name: "Walk-in", value: walkInRevenue, color: "#0ea5e9" },
    ],
    bestSellingProducts: [...productStats.values()]
      .sort((a, b) => b.unitsSold - a.unitsSold)
      .slice(0, 5)
      .map((item) => ({ name: item.name, unitsSold: item.unitsSold, revenue: item.revenue })),
    highestProfitProducts: [...productStats.values()]
      .sort((a, b) => b.profit - a.profit)
      .slice(0, 5)
      .map((item) => ({ name: item.name, profit: item.profit })),
    lowStockProducts,
  };
}
