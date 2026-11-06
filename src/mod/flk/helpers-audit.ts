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
