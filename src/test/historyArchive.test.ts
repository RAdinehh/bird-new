import { describe, it, expect } from 'vitest';
import {
  splitForArchive,
  monthsAgo,
  parseLogDate,
  ARCHIVE_AFTER_MONTHS,
} from '../cor/storage/historyArchive';
import type { DailyLog } from '../mod/dlg/store';

/** ساخت یک لاگ حداقلی برای تست — فقط فیلدهایی که آرشیو لمس می‌کند */
function mkLog(id: string, date: string, flockId = 'f1'): DailyLog {
  return { id, flockId, date } as DailyLog;
}

describe('historyArchive — تفکیک خالص (بدون DB)', () => {
  const cutoff = new Date('2026-05-18T00:00:00.000Z'); // ≈ ۱۴۰۵/۰۲/۲۸

  it('لاگ قدیمی‌تر از cutoff → toArchive', () => {
    const r = splitForArchive([mkLog('a', '1404/01/01')], cutoff);
    expect(r.toArchive).toHaveLength(1);
    expect(r.keep).toHaveLength(0);
    expect(r.skipped).toHaveLength(0);
  });

  it('لاگ جدیدتر از cutoff → keep', () => {
    const r = splitForArchive([mkLog('b', '1405/11/01')], cutoff);
    expect(r.toArchive).toHaveLength(0);
    expect(r.keep).toHaveLength(1);
  });

  it('تاریخ نامعتبر → skipped (در hot می‌ماند، نه حذف)', () => {
    const r = splitForArchive(
      [mkLog('c', ''), mkLog('d', 'abc'), mkLog('e', '1405/11')],
      cutoff
    );
    expect(r.toArchive).toHaveLength(0);
    expect(r.keep).toHaveLength(0);
    expect(r.skipped).toHaveLength(3);
  });

  it('id خالی → skipped', () => {
    const r = splitForArchive([mkLog('', '1404/01/01')], cutoff);
    expect(r.skipped).toHaveLength(1);
    expect(r.toArchive).toHaveLength(0);
  });

  it('معیار پذیرش: toArchive + keep + skipped === کل ورودی', () => {
    const logs = [
      mkLog('1', '1404/01/01'),
      mkLog('2', '1405/11/01'),
      mkLog('3', 'abc'),
      mkLog('4', '1404/06/15'),
    ];
    const r = splitForArchive(logs, cutoff);
    expect(r.toArchive.length + r.keep.length + r.skipped.length).toBe(logs.length);
    expect(r.toArchive.map(l => l.id).sort()).toEqual(['1', '4']);
    expect(r.keep.map(l => l.id)).toEqual(['2']);
    expect(r.skipped.map(l => l.id)).toEqual(['3']);
  });

  it('آرایهٔ خالی → همه صفر', () => {
    const r = splitForArchive([], cutoff);
    expect(r.toArchive).toHaveLength(0);
    expect(r.keep).toHaveLength(0);
    expect(r.skipped).toHaveLength(0);
  });

  it('مرز دقیق: لاگ برابر cutoff → keep (نه archive)', () => {
    const d = parseLogDate('1405/02/28');
    expect(d).not.toBeNull();
    const r = splitForArchive([mkLog('x', '1405/02/28')], d!);
    expect(r.keep).toHaveLength(1);
    expect(r.toArchive).toHaveLength(0);
  });
});

describe('monthsAgo — محاسبهٔ تقویمی', () => {
  it('۶ ماه قبل از نوامبر = می', () => {
    const r = monthsAgo(new Date('2026-11-18T00:00:00.000Z'), 6);
    expect(r.getUTCMonth()).toBe(4); // May = 4
    expect(r.getUTCFullYear()).toBe(2026);
  });

  it('۱۲ ماه قبل سال را عقب می‌برد', () => {
    const r = monthsAgo(new Date('2026-11-18T00:00:00.000Z'), 12);
    expect(r.getUTCFullYear()).toBe(2025);
    expect(r.getUTCMonth()).toBe(10); // November
  });

  it('صفر ماه = همان لحظه', () => {
    const now = new Date('2026-11-18T00:00:00.000Z');
    expect(monthsAgo(now, 0).getTime()).toBe(now.getTime());
  });
});

describe('parseLogDate — همان درِ دفعهٔ قبل', () => {
  it('تاریخ شمسی معتبر → Date', () => {
    expect(parseLogDate('1405/11/17')).not.toBeNull();
  });

  it('خالی/نامعتبر → null', () => {
    expect(parseLogDate('')).toBeNull();
    expect(parseLogDate('abc')).toBeNull();
    expect(parseLogDate('2026-11-18')).toBeNull(); // ISO پذیرفته نمی‌شود — عمدی
  });
});

describe('ثابت‌ها', () => {
  it('آستانهٔ پیش‌فرض ۶ ماه است و قابل بازبینی', () => {
    expect(ARCHIVE_AFTER_MONTHS).toBe(6);
  });
});
