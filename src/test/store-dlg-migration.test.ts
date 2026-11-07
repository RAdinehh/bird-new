import { describe, it, expect } from 'vitest';
import { useDlg } from '../mod/dlg/store';

// دسترسی به migrate از Zustand persist
const migrateFn = (useDlg.persist as any).getOptions().migrate;

const oldLog = (overrides: any = {}) => ({
  id: 'log-1',
  flockId: 'flock-A',
  date: '1404/02/10',
  entryTime: '07:30',
  // v5 fields
  eggsCount: 350,
  dirtyEggs: 25,
  brokenEggs: 10,
  // legacy targets
  brokenTarget: 'consumption',
  otherTarget: 'consumption',
  ...overrides,
});

describe('migration — v5 → v10', () => {
  it('eatingEggs از eggsCount منتقل می‌شود', () => {
    const persisted = { logs: [oldLog()] };
    const result = migrateFn(persisted, 5);
    expect(result.logs[0].eatingEggs).toBe(350);
  });

  it('otherEggs از dirtyEggs منتقل می‌شود', () => {
    const persisted = { logs: [oldLog()] };
    const result = migrateFn(persisted, 5);
    expect(result.logs[0].otherEggs).toBe(25);
  });

  it('eggsCount و dirtyEggs حذف می‌شوند', () => {
    const persisted = { logs: [oldLog()] };
    const result = migrateFn(persisted, 5);
    expect(result.logs[0].eggsCount).toBeUndefined();
    expect(result.logs[0].dirtyEggs).toBeUndefined();
  });

  

  it('birdAgeDays پیش‌فرض null می‌گیرد', () => {
    const persisted = { logs: [oldLog()] };
    const result = migrateFn(persisted, 5);
    expect(result.logs[0].birdAgeDays).toBeNull();
  });
});

describe('migration — v7 → v10', () => {
  
  });


describe('migration — defensive v10 (v7 failed case)', () => {
  it('اگر v7 نتوانست eatingEggs را از eggsCount کپی کند، v10 آن را انجام می‌دهد', () => {
    // حالت: از v5 آمد ولی v7 به هر دلیل نتواست (مثلاً ترتیب معکوس در نسخه قدیمی)
    const brokenV7Log = {
      id: 'log-1',
      flockId: 'flock-A',
      date: '1404/02/10',
      entryTime: '07:30',
      eggsCount: 350,       // هنوز موجود
      eatingEggs: null,     // v7 نتوانست
      dirtyEggs: 25,
      otherEggs: null,
    };
    const persisted = { logs: [brokenV7Log] };
    const result = migrateFn(persisted, 7);
    expect(result.logs[0].eatingEggs).toBe(350);
    expect(result.logs[0].otherEggs).toBe(25);
    expect(result.logs[0].eggsCount).toBeUndefined();
  });
});
