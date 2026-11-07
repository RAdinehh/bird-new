/**
 * migrations-feed.ts — migration یک‌باره DailyLog.feedAmount → ConsumptionEvent
 * فاز ۹a — تابع خالص، بدون دست‌زدن به store
 */
import type { ConsumptionEvent } from './types-store';

export interface DlgLogLite {
  id: string;
  flockId?: string;
  date?: string;
  feedAmount?: number | null;
}

export type FeedMigrationCandidate = Omit<ConsumptionEvent, 'id' | 'createdAt' | 'updatedAt'>;

export const MIGRATED_NOTES_PREFIX = '[migrated:';

/**
 * migrateFeedLogsToConsumption — تبدیل logs قدیمی به candidateها
 * - فقط logs با feedAmount > 0 و flockId و date
 * - دکدوب: existingNotes حاوی "[migrated:<logId>]" → skip
 * - واحد: kg (فرض پایه)
 * - source: daily_manual (ثبت روزانه قدیمی)
 * - confidence: exact (کاربر خودش وارد کرده)
 */
export function migrateFeedLogsToConsumption(
  logs: DlgLogLite[],
  existingNotes: Set<string>,
): FeedMigrationCandidate[] {
  const out: FeedMigrationCandidate[] = [];

  for (const log of logs || []) {
    if (!log || !log.id) continue;
    if (!log.flockId || !log.date) continue;
    const amt = Number(log.feedAmount);
    if (!(amt > 0)) continue;

    const marker = `${MIGRATED_NOTES_PREFIX}${log.id}]`;
    if (existingNotes.has(marker)) continue;

    out.push({
      flockId: log.flockId,
      type: 'feed',
      date: log.date,
      amount: Math.round(amt * 100) / 100,
      unit: 'kg',
      sex: '',
      source: 'daily_manual',
      confidence: 'exact',
      notes: marker,
    });
  }

  return out;
}

/**
 * buildExistingNotesSet — استخراج markerها از ConsumptionEventهای موجود
 */
export function buildExistingNotesSet(events: ConsumptionEvent[] | undefined): Set<string> {
  const s = new Set<string>();
  for (const e of events || []) {
    if (e.notes && e.notes.startsWith(MIGRATED_NOTES_PREFIX)) s.add(e.notes);
  }
  return s;
}
