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
