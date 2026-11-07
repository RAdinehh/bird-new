/**
 * migrations-feed-trigger.ts — trigger یک‌باره migration
 * فاز ۹b — از main.tsx بعد از hydration صدا زده می‌شود
 */
import { migrateFeedLogsToConsumption, buildExistingNotesSet } from './migrations-feed';
import type { ConsumptionEvent } from './types-store';

export const FEED_MIGRATION_FLAG_KEY = 'pm-feed-migrated-v1';

export interface FeedMigrationResult {
  ran: boolean;
  migrated: number;
  reason: 'already-done' | 'no-data' | 'success' | 'error';
}

export interface FeedMigrationDeps {
  getLogs: () => any[];
  getExistingEvents: () => ConsumptionEvent[];
  addEvent: (ev: Omit<ConsumptionEvent, 'id' | 'createdAt' | 'updatedAt'>) => string;
  getFlag: (key: string) => string | null;
  setFlag: (key: string, value: string) => void;
}

/**
 * runFeedMigrationIfNeeded — migration یک‌باره با flag
 * - اگر flag ست است → skip
 * - اگر داده‌ای نبود → flag ست می‌شود (جلوگیری از اجرای تکراری)
 * - روی خطا → rollback نمی‌شود (idempotent — اجرای بعدی aday خواهد بود)
 */
export function runFeedMigrationIfNeeded(deps: FeedMigrationDeps): FeedMigrationResult {
  try {
    if (deps.getFlag(FEED_MIGRATION_FLAG_KEY)) {
      return { ran: false, migrated: 0, reason: 'already-done' };
    }
    const logs = deps.getLogs() || [];
    const existing = deps.getExistingEvents() || [];
    const markers = buildExistingNotesSet(existing);
    const candidates = migrateFeedLogsToConsumption(logs, markers);

    if (candidates.length === 0) {
      deps.setFlag(FEED_MIGRATION_FLAG_KEY, new Date().toISOString());
      return { ran: true, migrated: 0, reason: 'no-data' };
    }

    for (const c of candidates) {
      deps.addEvent(c);
    }
    deps.setFlag(FEED_MIGRATION_FLAG_KEY, new Date().toISOString());
    return { ran: true, migrated: candidates.length, reason: 'success' };
  } catch (e) {
    try { console.error('[feed-migration] error:', e); } catch { /* double-catch */ }
    return { ran: false, migrated: 0, reason: 'error' };
  }
}
