/**
 * helpers.tsx — helperهای مشترک ماژول flk
 */
import type { ReactNode } from 'react';

/** ردیف‌های کوتاه (مقدار، تاریخ) — با autoFrom */
export function Row({
  l, v, accent, autoFrom,
}: {
  l: ReactNode;
  v: ReactNode;
  accent?: boolean;
  autoFrom?: string;
}) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', gap: 'var(--sp-1)',
      padding: 'var(--pad-tight)',
      background: accent ? 'var(--accent-soft)' : 'var(--input-bg)',
      borderRadius: 'var(--r-sm)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--fs-sm)' }}>
        <span style={{ color: accent ? 'var(--accent)' : 'var(--muted)', display: 'flex', alignItems: 'center', gap: 'var(--sp-1)' }}>
          {l}:
          {autoFrom && <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--accent)', display: 'inline-block', flexShrink: 0 }} />}
        </span>
        <span style={{ fontWeight: 600, color: accent ? 'var(--accent)' : 'var(--text)' }}>{v}</span>
      </div>
      {autoFrom && (
        <div style={{ fontSize: 'var(--fs-2xs)', color: 'var(--accent)', fontWeight: 600, opacity: 0.85, textAlign: 'left' }}>
          {'✨ از ' + autoFrom}
        </div>
      )}
    </div>
  );
}

/** 🆕 گرید دو ستونه برای Row های کوتاه */
export function RowGrid({ children }: { children: ReactNode }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: 'var(--sp-1)',
    }}>
      {children}
    </div>
  );
}

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
    let bucket: 'feed' | 'medicine' | 'vaccine' | 'other' = 'other';
    if (cat === 'feed' || cat === 'concentrate') bucket = 'feed';
    else if (cat === 'medicine') bucket = 'medicine';
    else if (cat === 'vaccine') bucket = 'vaccine';

    result[bucket].total += qty;
    result[bucket].cost += cost;
    result[bucket].count += 1;
    result.totalCost += cost;
  }

  return result;
}
