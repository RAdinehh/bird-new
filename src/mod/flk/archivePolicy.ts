import type { Flock } from './store';

export interface FlockSplitResult {
  toArchive: Flock[];
  keep: Flock[];
  skipped: Flock[];
}

/**
 * تفکیک خالص گله‌ها پیش از انتقال به مخزن flk_closed.
 * - گله‌های فعال یا ادغام‌شده (merged / mergedInto) برای حفظ توازن و unmerge قفل می‌مانند.
 * - گله‌های بسته (archived / sold) بدون وابستگی ادغام وارد toArchive می‌شوند.
 */
export function splitFlocksForArchive(flocks: Flock[]): FlockSplitResult {
  const toArchive: Flock[] = [];
  const keep: Flock[] = [];
  const skipped: Flock[] = [];

  for (const f of flocks) {
    if (!f || !f.id) {
      skipped.push(f);
      continue;
    }

    const isMerged = f.status === 'merged' || Boolean(f.mergedInto);
    if (isMerged) {
      keep.push(f);
      continue;
    }

    if (f.status === 'archived' || f.status === 'sold') {
      toArchive.push(f);
    } else {
      keep.push(f);
    }
  }

  return { toArchive, keep, skipped };
}
