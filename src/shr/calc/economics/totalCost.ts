/**
 * economics/totalCost.ts — جمع همه هزینه‌ها
 */
import type { TotalCostParams, TotalCostResult } from '../types';

export function calculateTotalCost(params: TotalCostParams): TotalCostResult {
  const {
    feedTotal,
    vaccineTotal,
    medicationTotal,
    litterTotal,
    utilitiesTotal = 0,
    laborTotal = 0,
    aliveCount,
  } = params;

  const totalCost =
    feedTotal + vaccineTotal + medicationTotal + litterTotal + utilitiesTotal + laborTotal;

  const costPerBird =
    aliveCount > 0 ? Math.round((totalCost / aliveCount) * 100) / 100 : 0;

  return {
    totalCost: Math.round(totalCost * 100) / 100,
    costPerBird,
    breakdown: {
      feed: feedTotal,
      vaccine: vaccineTotal,
      medication: medicationTotal,
      litter: litterTotal,
      utilities: utilitiesTotal,
      labor: laborTotal,
    },
  };
}
