/**
 * economics/perEggCost.ts — هزینه هر تخم (برای تخم‌گذار)
 */
import type { PerEggCostParams, PerEggCostResult } from '../types';

export function calculatePerEggCost(
  params: PerEggCostParams,
): PerEggCostResult {
  const { totalCost, totalEggs } = params;
  if (totalEggs <= 0) return { costPerEgg: null };
  return { costPerEgg: Math.round((totalCost / totalEggs) * 100) / 100 };
}
