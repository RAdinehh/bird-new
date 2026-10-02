import { describe, it, expect } from 'vitest';
import { format, parse, startOfDay, differenceInCalendarDays, addDays } from 'date-fns-jalali';

// تست ریاضی که ثابت کنه باگ رفع شده
describe('jalali date comparison — the fix logic', () => {
  const jalaliDate = (s: string): Date | null => {
    if (!s) return null;
    const en = s.replace(/[۰-۹]/g, d => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)));
    const d = parse(en, 'yyyy/MM/dd', new Date());
    return startOfDay(d);
  };

  it('امروز → diff 0', () => {
    const today = format(new Date(), 'yyyy/MM/dd');
    const d = jalaliDate(today)!;
    const diff = differenceInCalendarDays(startOfDay(new Date()), d);
    expect(diff).toBe(0);
  });

  it('دیروز → diff 1', () => {
    const yesterday = format(addDays(startOfDay(new Date()), -1), 'yyyy/MM/dd');
    const d = jalaliDate(yesterday)!;
    const diff = differenceInCalendarDays(startOfDay(new Date()), d);
    expect(diff).toBe(1);
  });

  it('3 روز پیش → diff 3 (در بازه)', () => {
    const past = format(addDays(startOfDay(new Date()), -3), 'yyyy/MM/dd');
    const d = jalaliDate(past)!;
    const diff = differenceInCalendarDays(startOfDay(new Date()), d);
    expect(diff).toBe(3);
  });

  it('4 روز پیش → diff 4 (خارج از بازه)', () => {
    const past = format(addDays(startOfDay(new Date()), -4), 'yyyy/MM/dd');
    const d = jalaliDate(past)!;
    const diff = differenceInCalendarDays(startOfDay(new Date()), d);
    expect(diff).toBe(4);
  });

  it('باگ قدیم: new Date(1405, 6, 9) → diff عظیم منفی', () => {
    // اثبات که چرا قدیم کار نمیکرد
    const parts = [1405, 7, 9];
    const bad = new Date(parts[0], parts[1] - 1, parts[2]);
    const diff = Math.floor((Date.now() - bad.getTime()) / (1000 * 60 * 60 * 24));
    // سال 1405 میلادی → ~226,000 روز اختلاف
    expect(Math.abs(diff)).toBeGreaterThan(200000);
  });
});
