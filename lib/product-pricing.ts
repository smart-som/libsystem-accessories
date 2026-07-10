const RECOMMENDED_PROFIT_RATE = 0.05;

export function getUnitCostPrice(totalMarketCostPrice: number, unitInStock: number) {
  if (
    !Number.isFinite(totalMarketCostPrice) ||
    totalMarketCostPrice <= 0 ||
    !Number.isFinite(unitInStock) ||
    unitInStock <= 0
  ) {
    return 0;
  }

  return Math.ceil(totalMarketCostPrice / unitInStock);
}

export function getRecommendedSalesPrice(totalMarketCostPrice: number, unitInStock: number) {
  const unitCostPrice = getUnitCostPrice(totalMarketCostPrice, unitInStock);

  if (!unitCostPrice) {
    return 0;
  }

  return Math.ceil(unitCostPrice * (1 + RECOMMENDED_PROFIT_RATE));
}

export function getProfitMarginAmount(totalMarketCostPrice: number, unitInStock: number, salesPrice: number) {
  const unitCostPrice = getUnitCostPrice(totalMarketCostPrice, unitInStock);

  if (!unitCostPrice || !Number.isFinite(salesPrice)) {
    return 0;
  }

  return salesPrice - unitCostPrice;
}

export function getTotalProjectedProfit(totalMarketCostPrice: number, unitInStock: number, salesPrice: number) {
  if (
    !Number.isFinite(totalMarketCostPrice) ||
    !Number.isFinite(unitInStock) ||
    !Number.isFinite(salesPrice) ||
    unitInStock <= 0
  ) {
    return 0;
  }

  return salesPrice * unitInStock - totalMarketCostPrice;
}
