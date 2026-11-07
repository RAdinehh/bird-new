/**
 * economics/litterCost.ts — هزینه بستر
 *
 * فیلتر: reason='consumption' + category='consumable'
 */
import type { InputMovement, InputItem, CostResult } from '../types';
import { sumMovementsByCategory } from './_shared';

export interface LitterCostParams {
  movements: InputMovement[];
  items: InputItem[];
  flockId?: string;
  aliveCount: number;
  fromDate?: string;
  toDate?: string;
}

export function calculateLitterCost(params: LitterCostParams): CostResult {
  return sumMovementsByCategory(
    params.movements,
    params.items,
    {
      flockId: params.flockId,
      category: 'consumable',
      reason: 'consumption',
      fromDate: params.fromDate,
      toDate: params.toDate,
    },
    params.aliveCount,
  );
}
