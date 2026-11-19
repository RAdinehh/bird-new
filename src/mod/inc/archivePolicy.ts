import type { EggEntry } from './store';

export interface IncSplitResult {
  toArchive: EggEntry[];
  keep: EggEntry[];
  skipped: EggEntry[];
}

export interface IncArchiveOptions {
  cutoffIso?: string;
}

const ARCHIVABLE_STATUSES = new Set<EggEntry['status']>(['hatched', 'done', 'failed']);

/**
 * تفکیک خالص بچ‌های جوجه‌کشی پیش از انتقال به مخزن inc_batches:
 * دوره‌های فعال (incubating/candled/locked) در keep می‌مانند و فقط دوره‌های
 * خاتمه‌یافته (hatched/done/failed) که قبل از cutoffIso باشند به toArchive می‌روند.
 */
export function splitIncEntriesForArchive(
  entries: EggEntry[],
  opts: IncArchiveOptions = {}
): IncSplitResult {
  const toArchive: EggEntry[] = [];
  const keep: EggEntry[] = [];
  const skipped: EggEntry[] = [];

  for (const entry of entries) {
    if (!entry || !entry.id) {
      skipped.push(entry);
      continue;
    }
    if (!ARCHIVABLE_STATUSES.has(entry.status)) {
      keep.push(entry);
      continue;
    }
    if (opts.cutoffIso) {
      const marker = entry.expectedHatchDate || entry.entryDate || entry.createdAt || '';
      if (!marker || marker > opts.cutoffIso) {
        keep.push(entry);
        continue;
      }
    }
    toArchive.push(entry);
  }

  return { toArchive, keep, skipped };
}
