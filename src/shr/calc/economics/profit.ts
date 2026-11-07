/**
 * economics/profit.ts — سود + نسبت سود/هزینه + حاشیه سود
 *
 *   profit           = revenue - totalCost
 *   profitPerBird    = profit / aliveCount
 *   revenueToCost    = revenue / totalCost   (markup ratio)
 *   marginPct        = (profit / revenue) * 100
 */
import type { ProfitParams, ProfitResult } from '../types';

export function calculateProfit(params: ProfitParams): ProfitResult {
  const { revenue, totalCost, aliveCount } = params;

  if (revenue <= 0 && totalCost <= 0) {
    return {
      profit: 0,
      profitPerBird: 0,
      revenueToCostRatio: 0,
      marginPct: 0,
      hasData: false,
    };
  }

  const profit = revenue - totalCost;
  const profitPerBird =
    aliveCount > 0 ? Math.round((profit / aliveCount) * 100) / 100 : 0;
  const revenueToCostRatio =
    totalCost > 0 ? Math.round((revenue / totalCost) * 100) / 100 : 0;
  const marginPct =
    revenue > 0 ? Math.round((profit / revenue) * 1000) / 10 : 0;

  return {
    profit: Math.round(profit * 100) / 100,
    profitPerBird,
    revenueToCostRatio,
    marginPct,
    hasData: true,
  };
}
