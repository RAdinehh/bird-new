/**
 * economics/_shared.ts — helperهای مشترک محاسبات اقتصادی
 */
import type {
  InputMovement,
  InputItem,
  CostFilter,
  CostResult,
} from '../types';

export function sumMovementsByCategory(
  movements: InputMovement[],
  items: InputItem[],
  filter: CostFilter,
  aliveCount: number,
): CostResult {
  const categorySet = filter.category
    ? new Set([filter.category])
    : filter.categories
      ? new Set(filter.categories)
      : null;

  const itemMap = new Map<string, InputItem>();
  items.forEach((i) => itemMap.set(i.id, i));

  let totalCost = 0;
  let count = 0;

  for (const m of movements) {
    if (filter.reason && m.reason !== filter.reason) continue;
    if (filter.flockId && m.flockId !== filter.flockId) continue;
    if (filter.fromDate && m.date < filter.fromDate) continue;
    if (filter.toDate && m.date > filter.toDate) continue;

    if (categorySet) {
      const item = itemMap.get(m.itemId);
      if (!item) continue;
      if (!categorySet.has(item.category)) continue;
    }

    totalCost += m.quantity * m.unitPrice;
    count++;
  }

  const costPerBird =
    aliveCount > 0 ? Math.round((totalCost / aliveCount) * 100) / 100 : 0;

  return {
    totalCost: Math.round(totalCost * 100) / 100,
    costPerBird,
    count,
    hasData: count > 0,
  };
}
