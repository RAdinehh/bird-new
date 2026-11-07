/**
 * economics/feedCost.ts — هزینه دان
 *
 * فیلتر: reason='consumption' + category='feed'
 */
import type { InputMovement, InputItem, CostResult } from '../types';
import { sumMovementsByCategory } from './_shared';

export interface FeedCostParams {
  movements: InputMovement[];
  items: InputItem[];
  flockId?: string;
  aliveCount: number;
  fromDate?: string;
  toDate?: string;
}

export function calculateFeedCost(params: FeedCostParams): CostResult {
  return sumMovementsByCategory(
    params.movements,
    params.items,
    {
      flockId: params.flockId,
      category: 'feed',
      reason: 'consumption',
      fromDate: params.fromDate,
      toDate: params.toDate,
    },
    params.aliveCount,
  );
}
