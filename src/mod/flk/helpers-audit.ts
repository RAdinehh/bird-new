/**
 * helpers-audit.ts — metadata برای نمایش sexBalanceEvents
 * فاز ۷.۵ — audit trail نمایش
 */
import type { FlockSexBalanceEvent } from './store';

export type SexAuditType = FlockSexBalanceEvent['type'];

export const SEX_AUDIT_META: Record<SexAuditType, { icon: string; label: string; tone: string }> = {
  sexing:                 { icon: '🧬', label: 'تفکیک جنسیت',        tone: 'var(--accent)' },
  death:                  { icon: '💀', label: 'تلفات',               tone: 'var(--danger)' },
  sale:                   { icon: '💰', label: 'فروش',                tone: 'var(--purple)' },
  return:                 { icon: '↩️', label: 'برگشت',              tone: 'var(--info)' },
  correction:             { icon: '✏️', label: 'اصلاح',              tone: 'var(--warn)' },
  merge:                  { icon: '🔗', label: 'ادغام',               tone: 'var(--info)' },
  unmerge:                { icon: '🔓', label: 'بازگردانی',          tone: 'var(--info)' },
  pre_sexing_observation: { icon: '👁',  label: 'مشاهده قبل تفکیک', tone: 'var(--muted)' },
};

/** formatSexDelta — متن کوتاه از delta */
export function formatSexDelta(d: FlockSexBalanceEvent['delta']): string {
  const parts: string[] = [];
  if (d.male !== 0) parts.push(`♂ ${d.male > 0 ? '+' : ''}${d.male}`);
  if (d.female !== 0) parts.push(`♀ ${d.female > 0 ? '+' : ''}${d.female}`);
  if (d.unknown !== 0) parts.push(`? ${d.unknown > 0 ? '+' : ''}${d.unknown}`);
  return parts.join(' · ');
}

// ═════════════════════════════════════════════════════════════
// فاز ۷.۲ — نرخ تلفات به تفکیک جنسیت
// ═════════════════════════════════════════════════════════════
export interface DeathRate {
  male: { deaths: number; initial: number; rate: number };
  female: { deaths: number; initial: number; rate: number };
  unknown: { deaths: number };
  hasData: boolean;
}

/**
 * aggregateDeathsBySex — جمع تلفات از sexBalanceEvents (type='death')
 * then compute rate based on initialMaleCount / initialFemaleCount
 */
export function aggregateDeathsBySex(
  sexBalanceEvents: FlockSexBalanceEvent[] | undefined,
  initialMale: number | null | undefined,
  initialFemale: number | null | undefined,
): DeathRate {
  const deaths = sexBalanceEvents || [];
  const deathOnly = deaths.filter(e => e.type === 'death');

  const maleDeaths = deathOnly.reduce((s, e) => s + Math.abs(Math.min(0, e.delta.male)), 0);
  const femaleDeaths = deathOnly.reduce((s, e) => s + Math.abs(Math.min(0, e.delta.female)), 0);
  const unknownDeaths = deathOnly.reduce((s, e) => s + Math.abs(Math.min(0, e.delta.unknown)), 0);

  const im = initialMale ?? 0;
  const iff = initialFemale ?? 0;

  const hasData = im > 0 || iff > 0;

  return {
    male: { deaths: maleDeaths, initial: im, rate: im > 0 ? (maleDeaths / im) * 100 : 0 },
    female: { deaths: femaleDeaths, initial: iff, rate: iff > 0 ? (femaleDeaths / iff) * 100 : 0 },
    unknown: { deaths: unknownDeaths },
    hasData,
  };
}

/** toneFromRate — رنگ بر اساس نرخ */
export function toneFromRate(rate: number): string {
  if (rate >= 20) return 'var(--danger)';
  if (rate >= 10) return 'var(--warn)';
  return 'var(--text)';
}

// ═════════════════════════════════════════════════════════════
// فاز ۷.۳ — CSV export
// ═════════════════════════════════════════════════════════════
import type { FlockEvent } from './types-store';

const csvCell = (v: any): string => {
  const s = String(v ?? '').replace(/"/g, '""');
  return `"${s}"`;
};

/**
 * eventsToCSV — CSV ردیف‌های flock.events
 * header: تاریخ,نوع,تعداد,جنس,دلیل,توضیح,لغوشده
 */
export function eventsToCSV(events: FlockEvent[] | undefined): string {
  const header = ['تاریخ', 'نوع', 'تعداد', 'جنس', 'دلیل', 'توضیح', 'لغوشده'];
  const rows: string[][] = [header];
  for (const e of events || []) {
    rows.push([
      e.date || '',
      e.type,
      String(e.count ?? 0),
      e.sex || '',
      e.reason || '',
      e.notes || '',
      e.revoked ? 'بله' : 'خیر',
    ]);
  }
  return rows.map(r => r.map(csvCell).join(',')).join('\n');
}

/**
 * auditToCSV — CSV ردیف‌های sexBalanceEvents
 * header: تاریخ,نوع,نر قبل,ماده قبل,نامشخص قبل,نر بعد,ماده بعد,نامشخص بعد,Δنر,Δماده,Δنامشخص,یادداشت
 */
export function auditToCSV(events: FlockSexBalanceEvent[] | undefined): string {
  const header = ['تاریخ', 'نوع', 'نر قبل', 'ماده قبل', 'نامشخص قبل', 'نر بعد', 'ماده بعد', 'نامشخص بعد', 'Δنر', 'Δماده', 'Δنامشخص', 'یادداشت'];
  const rows: string[][] = [header];
  for (const e of events || []) {
    rows.push([
      e.date || '',
      e.type,
      String(e.before.male),
      String(e.before.female),
      String(e.before.unknown),
      String(e.after.male),
      String(e.after.female),
      String(e.after.unknown),
      String(e.delta.male),
      String(e.delta.female),
      String(e.delta.unknown),
      e.note || '',
    ]);
  }
  return rows.map(r => r.map(csvCell).join(',')).join('\n');
}

// ═════════════════════════════════════════════════════════════
// فاز ۷.۴ — وزن به تفکیک جنسیت
// ═════════════════════════════════════════════════════════════
export interface SexWeightStat {
  avg: number;
  count: number;
  cv: number;
  hasData: boolean;
}

export interface WeightBySex {
  male: SexWeightStat;
  female: SexWeightStat;
  mixed: SexWeightStat;
  delta: number | null;
  hasData: boolean;
}

/**
 * weightBySexFromLogs — جمع وزن‌سنجی‌های یک گله به تفکیک جنسیت
 * منبع: dlg logs — هر log دارای weightSamples[] + weightGender
 */
export function weightBySexFromLogs(logs: any[], flockId: string): WeightBySex {
  const male: number[] = [];
  const female: number[] = [];
  const mixed: number[] = [];

  for (const log of logs || []) {
    if (log.flockId !== flockId) continue;
    if (!log.weightSamples || log.weightSamples.length === 0) continue;
    const gender = log.weightGender || 'mixed';
    const ws = (log.weightSamples as any[])
      .map(s => Number(s.weight))
      .filter(w => w > 0);
    if (gender === 'male') male.push(...ws);
    else if (gender === 'female') female.push(...ws);
    else mixed.push(...ws);
  }

  const stat = (arr: number[]): SexWeightStat => {
    if (arr.length === 0) return { avg: 0, count: 0, cv: 0, hasData: false };
    const mean = arr.reduce((a, w) => a + w, 0) / arr.length;
    const variance = arr.reduce((a, w) => a + Math.pow(w - mean, 2), 0) / arr.length;
    const std = Math.sqrt(variance);
    const cv = mean > 0 ? (std / mean) * 100 : 0;
    return {
      avg: Math.round(mean * 1000) / 1000,
      count: arr.length,
      cv: Math.round(cv * 10) / 10,
      hasData: true,
    };
  };

  const m = stat(male);
  const f = stat(female);
  const mx = stat(mixed);
  const hasData = m.hasData || f.hasData || mx.hasData;
  const delta = m.hasData && f.hasData
    ? Math.round((m.avg - f.avg) * 1000) / 1000
    : null;

  return { male: m, female: f, mixed: mx, delta, hasData };
}

// ═════════════════════════════════════════════════════════════
// فاز ۸c — CSV export برای ConsumptionEvent
// ═════════════════════════════════════════════════════════════
import type { ConsumptionEvent } from './types-store';

const SOURCE_LABEL: Record<string, string> = {
  daily_manual: 'روزانه دستی',
  bulk_manual: 'پر کردن سطل',
  sensor_scale: 'سنسور وزن',
  sensor_level: 'سنسور سطح',
  auto_feeder: 'اتومات',
  inferred: 'استاندارد',
};

/**
 * consumptionToCSV — CSV مصرف (دان + آب)
 * header: تاریخ, نوع, مقدار, واحد, جنسیت, روش, یادداشت
 */
export function consumptionToCSV(events: ConsumptionEvent[] | undefined): string {
  const header = ['تاریخ', 'نوع', 'مقدار', 'واحد', 'جنسیت', 'روش', 'یادداشت'];
  const rows: string[][] = [header];
  for (const e of events || []) {
    rows.push([
      e.date || '',
      e.type === 'feed' ? 'دان' : 'آب',
      String(e.amount),
      e.unit,
      e.sex === 'male' ? 'نر' : e.sex === 'female' ? 'ماده' : e.sex === 'mixed' ? 'مخلوط' : '',
      SOURCE_LABEL[e.source] || e.source,
      e.notes || '',
    ]);
  }
  return rows.map(r => r.map(csvCell).join(',')).join('\n');
}

// ═════════════════════════════════════════════════════════════
// فاز ۸d — FCR engine
// ═════════════════════════════════════════════════════════════
import type { ConsumptionAggregate } from './consumptionEventsCalc';

export interface FCRResult {
  fcr: number | null;
  confidence: 'exact' | 'standard' | 'insufficient';
  totalFeedKg: number;
  feedPerBird: number;
  totalLiveWeightKg: number | null;
  source: string;
  note: string;
}

export function calculateFCR(
  consumption: ConsumptionAggregate,
  weightBySex: WeightBySex | null,
  flock: {
    currentCount?: number | null;
    maleCount?: number | null;
    femaleCount?: number | null;
    unknownCount?: number | null;
  },
  standardFCR?: number | null,
): FCRResult {
  const totalFeedKg = consumption.totalFeedKg || 0;
  const currentCount = flock.currentCount || 0;
  const feedPerBird = currentCount > 0 ? totalFeedKg / currentCount : 0;
  const r2 = (n: number) => Math.round(n * 100) / 100;

  if (totalFeedKg <= 0) {
    return {
      fcr: null, confidence: 'insufficient', totalFeedKg: 0,
      feedPerBird: 0, totalLiveWeightKg: null,
      source: 'بدون ثبت دان', note: '',
    };
  }

  // try exact from weight
  let totalLiveWeight = 0;
  let weightComplete = false;
  if (weightBySex && weightBySex.hasData) {
    const m = flock.maleCount ?? 0;
    const f = flock.femaleCount ?? 0;
    const u = flock.unknownCount ?? 0;
    if (weightBySex.male.hasData && m > 0) totalLiveWeight += weightBySex.male.avg * m;
    if (weightBySex.female.hasData && f > 0) totalLiveWeight += weightBySex.female.avg * f;
    if (weightBySex.mixed.hasData && u > 0) totalLiveWeight += weightBySex.mixed.avg * u;
    const okM = m === 0 || weightBySex.male.hasData;
    const okF = f === 0 || weightBySex.female.hasData;
    const okU = u === 0 || weightBySex.mixed.hasData;
    weightComplete = okM && okF && okU && totalLiveWeight > 0;
  }

  if (weightComplete) {
    return {
      fcr: r2(totalFeedKg / totalLiveWeight),
      confidence: 'exact',
      totalFeedKg: r2(totalFeedKg),
      feedPerBird: r2(feedPerBird),
      totalLiveWeightKg: r2(totalLiveWeight),
      source: 'دان + وزن واقعی',
      note: `FCR = ${r2(totalFeedKg)}kg دان ÷ ${Math.round(totalLiveWeight)}kg وزن زنده`,
    };
  }

  if (standardFCR && standardFCR > 0) {
    return {
      fcr: r2(standardFCR),
      confidence: 'standard',
      totalFeedKg: r2(totalFeedKg),
      feedPerBird: r2(feedPerBird),
      totalLiveWeightKg: null,
      source: 'استاندارد نژاد',
      note: 'وزن واقعی موجود نیست — FCR استاندارد نمایش داده می‌شود',
    };
  }

  return {
    fcr: null, confidence: 'insufficient',
    totalFeedKg: r2(totalFeedKg),
    feedPerBird: r2(feedPerBird),
    totalLiveWeightKg: null,
    source: 'دان فقط',
    note: 'وزن و استاندارد هر دو غایب',
  };
}
