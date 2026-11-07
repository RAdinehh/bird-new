import { describe, it, expect } from 'vitest';
import { useDlg } from '../mod/dlg/store';

const migrateFn = (useDlg.persist as any).getOptions().migrate;

const baseLog = (overrides: any = {}) => ({
  id: 'log-1',
  flockId: 'flock-A',
  date: '1404/02/10',
  entryTime: '07:30',
  feedDelivered: 50,
  feedConsumed: 50,
  ...overrides,
});

describe('migration — v11 → v12 (feedMethod: 2 → 5 مقدار)', () => {
  it("'manual' → 'scoop'", () => {
    const persisted = { logs: [baseLog({ feedMethod: 'manual' })] };
    const result = migrateFn(persisted, 11);
    expect(result.logs[0].feedMethod).toBe('scoop');
  });

  it("'auto' → 'auto_chain'", () => {
    const persisted = { logs: [baseLog({ feedMethod: 'auto' })] };
    const result = migrateFn(persisted, 11);
    expect(result.logs[0].feedMethod).toBe('auto_chain');
  });

  it("'' (خالی) → 'scoop'", () => {
    const persisted = { logs: [baseLog({ feedMethod: '' })] };
    const result = migrateFn(persisted, 11);
    expect(result.logs[0].feedMethod).toBe('scoop');
  });

  it('undefined → scoop', () => {
    const persisted = { logs: [baseLog({})] };
    const result = migrateFn(persisted, 11);
    expect(result.logs[0].feedMethod).toBe('scoop');
  });

  it("از قبل 'scoop' → دست‌نخورده", () => {
    const persisted = { logs: [baseLog({ feedMethod: 'scoop' })] };
    const result = migrateFn(persisted, 11);
    expect(result.logs[0].feedMethod).toBe('scoop');
  });

  it("از قبل 'auto_sensor' → دست‌نخورده", () => {
    const persisted = { logs: [baseLog({ feedMethod: 'auto_sensor' })] };
    const result = migrateFn(persisted, 11);
    expect(result.logs[0].feedMethod).toBe('auto_sensor');
  });

  it("از قبل 'bag' → دست‌نخورده", () => {
    const persisted = { logs: [baseLog({ feedMethod: 'bag' })] };
    const result = migrateFn(persisted, 11);
    expect(result.logs[0].feedMethod).toBe('bag');
  });
});

describe('migration — v10 → v12 (زنجیره‌ای)', () => {
  it('از v10: rename + feedMethod', () => {
    const v10Log = {
      id: 'log-1', flockId: 'f1', date: '1404/02/10', entryTime: '07:30',
      feedAmount: 50,
      feedMethod: 'manual',
    };
    const persisted = { logs: [v10Log] };
    const result = migrateFn(persisted, 10);
    expect(result.logs[0].feedDelivered).toBe(50);
    expect(result.logs[0].feedConsumed).toBe(50);
    expect(result.logs[0].feedMethod).toBe('scoop');
    expect(result.logs[0].feedAmount).toBeUndefined();
  });
});
