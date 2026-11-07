/**
 * economics/vaccineCost.ts — هزینه واکسن
 *
 * فیلتر: reason='consumption' + category='vaccine'
 */
import type { InputMovement, InputItem, CostResult } from '../types';
import { sumMovementsByCategory } from './_shared';

export interface VaccineCostParams {
  movements: InputMovement[];
  items: InputItem[];
  flockId?: string;
  aliveCount: number;
  fromDate?: string;
  toDate?: string;
}

export function calculateVaccineCost(params: VaccineCostParams): CostResult {
  return sumMovementsByCategory(
    params.movements,
    params.items,
    {
      flockId: params.flockId,
      category: 'vaccine',
      reason: 'consumption',
      fromDate: params.fromDate,
      toDate: params.toDate,
    },
    params.aliveCount,
  );
}
