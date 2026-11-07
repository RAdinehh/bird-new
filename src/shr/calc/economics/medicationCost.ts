/**
 * economics/medicationCost.ts — هزینه دارو (شیمیایی + گیاهی جدا)
 */
import type {
  InputMovement,
  InputItem,
  CostResult,
  MedicationCostResult,
} from '../types';
import { sumMovementsByCategory } from './_shared';

export interface MedicationCostParams {
  movements: InputMovement[];
  items: InputItem[];
  flockId?: string;
  aliveCount: number;
  fromDate?: string;
  toDate?: string;
}

export function calculateMedicationCost(
  params: MedicationCostParams,
): MedicationCostResult {
  const baseFilter = {
    flockId: params.flockId,
    reason: 'consumption' as const,
    fromDate: params.fromDate,
    toDate: params.toDate,
  };

  const chemical = sumMovementsByCategory(
    params.movements,
    params.items,
    { ...baseFilter, category: 'medicine' },
    params.aliveCount,
  );

  const herbal = sumMovementsByCategory(
    params.movements,
    params.items,
    { ...baseFilter, category: 'herbal' },
    params.aliveCount,
  );

  const total: CostResult = {
    totalCost: Math.round((chemical.totalCost + herbal.totalCost) * 100) / 100,
    costPerBird:
      Math.round((chemical.costPerBird + herbal.costPerBird) * 100) / 100,
    count: chemical.count + herbal.count,
    hasData: chemical.hasData || herbal.hasData,
  };

  return { chemical, herbal, total };
}
