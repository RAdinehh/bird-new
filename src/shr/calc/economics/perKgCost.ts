/**
 * economics/perKgCost.ts — هزینه هر کیلو وزن زنده / افزایش وزن
 */
import type { PerKgCostParams, PerKgCostResult } from '../types';

export function calculatePerKgCost(
  params: PerKgCostParams,
): PerKgCostResult {
  const { totalCost, totalLiveWeightKg, totalGainKg } = params;

  const costPerLiveKg =
    totalLiveWeightKg > 0
      ? Math.round((totalCost / totalLiveWeightKg) * 100) / 100
      : null;

  const costPerGainKg =
    totalGainKg > 0
      ? Math.round((totalCost / totalGainKg) * 100) / 100
      : null;

  return { costPerLiveKg, costPerGainKg };
}
