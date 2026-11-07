import { describe, it, expect } from 'vitest';
import { useDlg } from '../mod/dlg/store';

const migrateFn = (useDlg.persist as any).getOptions().migrate;

const oldLog = (overrides: any = {}) => ({
  id: 'log-1',
  flockId: 'flock-A',
  date: '1404/02/10',
  entryTime: '07:30',
  feedAmount: 50,
  feedRemaining: 8,
  ...overrides,
});

describe('migration — v10 → v11 (feedAmount → feedDelivered)', () => {
  it('feedDelivered از feedAmount منتقل می‌شود', () => {
    const persisted = { logs: [oldLog()] };
    const result = migrateFn(persisted, 10);
    expect(result.logs[0].feedDelivered).toBe(50);
  });

  it('feedConsumed = feedDelivered (simple fallback)', () => {
    const persisted = { logs: [oldLog()] };
    const result = migrateFn(persisted, 10);
    expect(result.logs[0].feedConsumed).toBe(50);
  });

  it('feedAmount حذف می‌شود', () => {
    const persisted = { logs: [oldLog()] };
    const result = migrateFn(persisted, 10);
    expect(result.logs[0].feedAmount).toBeUndefined();
  });

  it('feedRemaining دست‌نخورده می‌ماند', () => {
    const persisted = { logs: [oldLog()] };
    const result = migrateFn(persisted, 10);
    expect(result.logs[0].feedRemaining).toBe(8);
  });

  it('اگر feedDelivered از قبل هست، استفاده می‌شود', () => {
    const persisted = {
      logs: [{
        id: 'log-1', flockId: 'f1', date: '1404/02/10', entryTime: '07:30',
        feedDelivered: 45,  // already migrated
        // no feedAmount
      }],
    };
    const result = migrateFn(persisted, 10);
    expect(result.logs[0].feedDelivered).toBe(45);
    expect(result.logs[0].feedConsumed).toBe(45);
  });

  it('اگر feedConsumed از قبل هست، دست‌نخورده', () => {
    const persisted = {
      logs: [{
        id: 'log-1', flockId: 'f1', date: '1404/02/10', entryTime: '07:30',
        feedDelivered: 50, feedConsumed: 42,  // precision mode
      }],
    };
    const result = migrateFn(persisted, 10);
    expect(result.logs[0].feedConsumed).toBe(42);  // not overwritten
  });
});

describe('migration — v5 → v11 (زنجیره‌ای)', () => {
  it('از v5 مستقیم به v11: همه تغییرات', () => {
    const v5Log = {
      id: 'log-1',
      flockId: 'flock-A',
      date: '1404/02/10',
      entryTime: '07:30',
      eggsCount: 350,
      dirtyEggs: 25,
      feedAmount: 50,
      feedRemaining: 8,
    };
    const persisted = { logs: [v5Log] };
    const result = migrateFn(persisted, 5);

    // v10 (A1)
    expect(result.logs[0].eatingEggs).toBe(350);
    expect(result.logs[0].otherEggs).toBe(25);

    // v11 (A2)
    expect(result.logs[0].feedDelivered).toBe(50);
    expect(result.logs[0].feedConsumed).toBe(50);

    // legacy removed
    expect(result.logs[0].eggsCount).toBeUndefined();
    expect(result.logs[0].feedAmount).toBeUndefined();
  });
});
