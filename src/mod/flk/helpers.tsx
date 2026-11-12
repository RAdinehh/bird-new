/**
 * helpers.tsx — helperهای مشترک ماژول flk
 */
import type { ReactNode } from 'react';
export { Row, RowGrid } from '../../shr/components/ui';



export function DepBox({ title, children, tone = 'accent' }: { title: string; children: ReactNode; tone?: 'accent' | 'purple' }) {
  const c = tone === 'purple' ? 'var(--purple)' : 'var(--accent)';
  const s = tone === 'purple' ? 'var(--purple-soft)' : 'var(--accent-soft)';
  const b = tone === 'purple' ? 'var(--purple)' : 'var(--accent-border)';
  return (
    <div style={{ background: s, border: `1px dashed ${b}`, borderRadius: 'var(--r-md)', padding: 'var(--sp-3)', display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)', marginTop: 4 }}>
      <div style={{ fontSize: 'var(--fs-xs)', color: c, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 'var(--sp-2)', paddingBottom: 'var(--sp-2)', borderBottom: '1px solid var(--border)' }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: c }} />
        {title}
      </div>
      {children}
    </div>
  );
}


/**
 * computeFlockConsumption — هزینه انباشته مصرف یک گله از انبار
 * از whs.movements[flockId] + reason='consumption' + type='out'
 */
export interface FlockConsumptionBucket {
  total: number;
  cost: number;
  count: number;
}

export interface FlockConsumption {
  feed: FlockConsumptionBucket;
  medicine: FlockConsumptionBucket;
  herbal: FlockConsumptionBucket;
  vaccine: FlockConsumptionBucket;
  other: FlockConsumptionBucket;
  totalCost: number;
}

const emptyBucket = (): FlockConsumptionBucket => ({ total: 0, cost: 0, count: 0 });

export function computeFlockConsumption(
  flockId: string,
  movements: Array<{ flockId?: string; itemId: string; type: string; reason: string; quantity: number; unitPrice: number }>,
  items: Array<{ id: string; name: string; category: string; lastPrice?: number; avgPrice?: number }>,
): FlockConsumption {
  const result: FlockConsumption = {
    feed: emptyBucket(),
    medicine: emptyBucket(),
    herbal: emptyBucket(),
    vaccine: emptyBucket(),
    other: emptyBucket(),
    totalCost: 0,
  };
  if (!flockId) return result;

  const itemMap = new Map(items.map(i => [i.id, i]));

  for (const m of movements) {
    if (m.flockId !== flockId) continue;
    if (m.type !== 'out') continue;
    if (m.reason !== 'consumption') continue;

    const item = itemMap.get(m.itemId);
    const price = Number(m.unitPrice) || Number(item?.lastPrice) || Number(item?.avgPrice) || 0;
    const qty = Number(m.quantity) || 0;
    const cost = price * qty;

    const cat = item?.category || 'other';
    let bucket: 'feed' | 'medicine' | 'herbal' | 'vaccine' | 'other' = 'other';
    if (cat === 'feed' || cat === 'concentrate') bucket = 'feed';
    else if (cat === 'medicine') bucket = 'medicine';
    else if (cat === 'herbal') bucket = 'herbal';
    else if (cat === 'vaccine') bucket = 'vaccine';

    result[bucket].total += qty;
    result[bucket].cost += cost;
    result[bucket].count += 1;
    result.totalCost += cost;
  }

  return result;
}
