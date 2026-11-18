import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';
import {
  archiveLogs,
  countArchived,
  listArchived,
  restoreManyFromArchive,
  ARCHIVE_STORES,
  splitForArchive,
  monthsAgo,
} from '../cor/storage/historyArchive';

const ST = ARCHIVE_STORES.dlg;

const log = (id: string, date: string, flockId = 'f1') =>
  ({ id, date, flockId, eggs: 0 } as any);

describe('معیار پذیرش د — hot + archive == کل', () => {
  beforeEach(async () => {
    // پاک‌سازی آرشیو بین تست‌ها
    const rows = await listArchived({ limit: 100000 }, ST);
    if (rows.length) await restoreManyFromArchive(rows.map(r => r.id), ST);
  });

  it('آرشیو، هیچ لاگی را گم نمی‌کند', async () => {
    const now = new Date(2026, 10, 19); // 2026-11-19
    const old1 = log('a1', '1404/01/10');
    const old2 = log('a2', '1404/02/20');
    const fresh = log('b1', '1405/08/01');
    const all = [old1, old2, fresh];

    const res = await archiveLogs(all, { now, months: 6 }, ST);
    expect(res.archivedCount).toBe(2);

    const hot = all.filter(l => !res.archivedIds.includes(l.id));
    const archived = await countArchived(ST);

    expect(hot.length + archived).toBe(all.length);
    expect(archived).toBe(2);
  });

  it('بازگردانی اتمیک: لاگ‌ها برمی‌گردند و از آرشیو حذف می‌شوند', async () => {
    const now = new Date(2026, 10, 19);
    const all = [log('c1', '1404/01/01'), log('c2', '1404/02/01')];
    const res = await archiveLogs(all, { now, months: 6 }, ST);
    expect(res.archivedCount).toBe(2);

    const before = await countArchived(ST);
    expect(before).toBeGreaterThanOrEqual(2);

    const restored = await restoreManyFromArchive(res.archivedIds, ST);
    expect(restored.length).toBe(2);

    const after = await countArchived(ST);
    expect(after).toBe(before - 2);
  });

  it('لاگ دارای اصلاحات یا تلفات هرگز آرشیو نمی‌شود', () => {
    const now = new Date(2026, 10, 19);
    const cutoff = monthsAgo(now, 6);
    const audit = { ...log('d1', '1404/01/01'), corrections: [{ id: 'x' }] };
    const death = { ...log('d2', '1404/01/01'), deaths: [{ id: 'y' }] };
    const plain = log('d3', '1404/01/01');

    const { toArchive, keep } = splitForArchive([audit, death, plain] as any, cutoff);
    expect(toArchive.map(l => l.id)).toEqual(['d3']);
    expect(keep.map(l => l.id).sort()).toEqual(['d1', 'd2']);
  });
});
