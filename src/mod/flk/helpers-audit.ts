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
