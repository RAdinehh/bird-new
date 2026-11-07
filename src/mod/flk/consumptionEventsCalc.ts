/**
 * consumptionEventsCalc.ts — محاسبات aggregate دان/آب
 * فاز ۸a — helper مشترک برای FCR engine
 */
import type { ConsumptionEvent, ConsumptionConfidence, ConsumptionType } from './types-store';

export interface ConsumptionAggregate {
  totalFeedKg: number;
  totalWaterL: number;
  byType: { feed: number; water: number };
  bySource: Record<string, number>;
  bySex: { male: number; female: number; mixed: number; unknown: number };
  confidence: 'exact' | 'estimated' | 'standard' | 'mixed';
  eventCount: number;
  hasData: boolean;
}

const EMPTY: ConsumptionAggregate = {
  totalFeedKg: 0,
  totalWaterL: 0,
  byType: { feed: 0, water: 0 },
  bySource: {},
  bySex: { male: 0, female: 0, mixed: 0, unknown: 0 },
  confidence: 'standard',
  eventCount: 0,
  hasData: false,
};

/**
 * aggregateConsumptionEvents — جمع دان/آب در یک بازه
 * - typeFilter: اگر تعریف شود، فقط همان type جمع می‌شود
 * - range: '1405/08/01' <= date <= '1405/08/10' (string compare on jalali works)
 */
export function aggregateConsumptionEvents(
  events: ConsumptionEvent[] | undefined,
  windowStart: string,
  windowEnd: string,
  typeFilter?: ConsumptionType,
): ConsumptionAggregate {
  if (!events || events.length === 0) return EMPTY;

  let totalFeedKg = 0;
  let totalWaterL = 0;
  const bySource: Record<string, number> = {};
  const bySex = { male: 0, female: 0, mixed: 0, unknown: 0 };
  const confSet = new Set<ConsumptionConfidence>();
  let count = 0;

  for (const e of events) {
    if (e.date < windowStart || e.date > windowEnd) continue;
    if (!(e.amount > 0)) continue;
    if (typeFilter && e.type !== typeFilter) continue;

    if (e.type === 'feed') totalFeedKg += e.amount;
    else totalWaterL += e.amount;

    count++;
    bySource[e.source] = (bySource[e.source] || 0) + e.amount;

    // sex فقط برای feed معنی دارد
    if (e.type === 'feed') {
      if (e.sex === 'male') bySex.male += e.amount;
      else if (e.sex === 'female') bySex.female += e.amount;
      else if (e.sex === 'mixed') bySex.mixed += e.amount;
      else bySex.unknown += e.amount;
    }
    confSet.add(e.confidence);
  }

  if (count === 0) return EMPTY;

  let confidence: ConsumptionAggregate['confidence'];
  if (confSet.size === 1) {
    confidence = confSet.values().next().value as ConsumptionConfidence;
  } else {
    confidence = 'mixed';
  }

  const r = (n: number) => Math.round(n * 100) / 100;
  return {
    totalFeedKg: r(totalFeedKg),
    totalWaterL: r(totalWaterL),
    byType: { feed: r(totalFeedKg), water: r(totalWaterL) },
    bySource,
    bySex: {
      male: r(bySex.male),
      female: r(bySex.female),
      mixed: r(bySex.mixed),
      unknown: r(bySex.unknown),
    },
    confidence,
    eventCount: count,
    hasData: true,
  };
}
