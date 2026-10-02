import { describe, it, expect } from 'vitest';
import { format, parse, addDays, startOfDay } from 'date-fns-jalali';
import {
  toEnNum, monthKey, currentMonth, todayJalali, dateDiffDays, fcrBg,
} from '../mod/dsh/utils';
import { monthKey as analyticsMonthKey } from '../mod/rep/analytics';

const daysFromTodayJ = (n: number) => format(addDays(startOfDay(new Date()), n), 'yyyy/MM/dd');

// ═══════════════════════════════════════════════
// toEnNum
// ═══════════════════════════════════════════════
describe('toEnNum', () => {
  it('رشته لاتین → عدد', () => {
    expect(toEnNum('123')).toBe(123);
  });

  it('اعداد فارسی → عدد', () => {
    expect(toEnNum('۱۲۳')).toBe(123);
  });

  it('عدد بزرگ', () => {
    expect(toEnNum('۱۴۰۵۰۷۰۹')).toBe(14050709);
  });

  it('خالی → 0', () => {
    expect(toEnNum('')).toBe(0);
  });

  it('غیرعددی → 0', () => {
    expect(toEnNum('abc')).toBe(0);
  });

  it('مخلوط (شروع با عدد) → عدد ابتدایی', () => {
    // '۱۲۳abc' → '123abc' → parseInt = 123
    expect(toEnNum('۱۲۳abc')).toBe(123);
  });

  it('مخلوط (شروع با حرف) → 0', () => {
    expect(toEnNum('abc۱۲۳')).toBe(0);
  });

  it('صفر → 0', () => {
    expect(toEnNum('۰')).toBe(0);
  });
});

// ═══════════════════════════════════════════════
// monthKey — باگ مشکوک (pad نکردن)
// ═══════════════════════════════════════════════
describe('monthKey — یکپارچگی با analytics.ts', () => {
  it('تاریخ با ماه 2 رقمی', () => {
    expect(monthKey('1405/07/09')).toBe('1405/07');
  });

  it('اعداد فارسی', () => {
    expect(monthKey('۱۴۰۵/۰۷/۰۹')).toBe('1405/07');
  });

  it('خالی → خالی', () => {
    expect(monthKey('')).toBe('');
    expect(monthKey(null as any)).toBe('');
  });

  it('نامعتبر → خالی', () => {
    expect(monthKey('abc')).toBe('');
  });

  it('فقط سال/ماه (2 قسمت) → خالی', () => {
    expect(monthKey('1405/07')).toBe('');
  });

  it('ماه تک‌رقمی باید pad بشه (1405/7/9 → 1405/07)', () => {
    // ⚠️ باگ احتمالی: کد فعلی 1405/7 برمیگردونه
    // تست: باید با analytics.monthKey یکسان باشه
    const dsh = monthKey('1405/7/9');
    const ana = analyticsMonthKey('1405/7/9');
    expect(dsh).toBe(ana);
  });

  it('سازگاری با currentMonth برای امروز', () => {
    // وقتی todayJalali داره تاریخ امروز رو میده، monthKey باید همون currentMonth باشه
    const today = todayJalali();
    const cm = currentMonth();
    expect(monthKey(today)).toBe(cm);
  });
});

// ═══════════════════════════════════════════════
// currentMonth / todayJalali
// ═══════════════════════════════════════════════
describe('currentMonth', () => {
  it('فرمت yyyy/MM', () => {
    expect(currentMonth()).toMatch(/^\d{4}\/\d{2}$/);
  });

  it('همیشه 2 رقمی برای ماه', () => {
    const cm = currentMonth();
    const month = cm.split('/')[1];
    expect(month).toHaveLength(2);
  });
});

describe('todayJalali', () => {
  it('فرمت yyyy/MM/dd', () => {
    expect(todayJalali()).toMatch(/^\d{4}\/\d{2}\/\d{2}$/);
  });

  it('با format مطابقت داره', () => {
    expect(todayJalali()).toBe(format(new Date(), 'yyyy/MM/dd'));
  });
});

// ═══════════════════════════════════════════════
// dateDiffDays
// ═══════════════════════════════════════════════
describe('dateDiffDays', () => {
  it('امروز → 0', () => {
    expect(dateDiffDays(todayJalali())).toBe(0);
  });

  it('دیروز → 1', () => {
    expect(dateDiffDays(daysFromTodayJ(-1))).toBe(1);
  });

  it('10 روز پیش → 10', () => {
    expect(dateDiffDays(daysFromTodayJ(-10))).toBe(10);
  });

  it('30 روز پیش → 30', () => {
    expect(dateDiffDays(daysFromTodayJ(-30))).toBe(30);
  });

  it('فردا → -1', () => {
    expect(dateDiffDays(daysFromTodayJ(1))).toBe(-1);
  });

  it('5 روز بعد → -5', () => {
    expect(dateDiffDays(daysFromTodayJ(5))).toBe(-5);
  });

  it('خالی → 999', () => {
    expect(dateDiffDays('')).toBe(999);
  });

  it('نامعتبر → 999', () => {
    expect(dateDiffDays('xyz')).toBe(999);
  });

  it('اعداد فارسی', () => {
    const jalali = daysFromTodayJ(-5);
    const persian = jalali.replace(/[0-9]/g, d => '۰۱۲۳۴۵۶۷۸۹'[+d]);
    expect(dateDiffDays(persian)).toBe(5);
  });
});

// ═══════════════════════════════════════════════
// fcrBg
// ═══════════════════════════════════════════════
describe('fcrBg', () => {
  it('<=0 → accent-soft', () => {
    expect(fcrBg(0)).toBe('var(--accent-soft)');
    expect(fcrBg(-5)).toBe('var(--accent-soft)');
  });

  it('1-10 → warn-soft', () => {
    expect(fcrBg(1)).toBe('var(--warn-soft)');
    expect(fcrBg(5)).toBe('var(--warn-soft)');
    expect(fcrBg(10)).toBe('var(--warn-soft)');
  });

  it('>10 → danger-soft', () => {
    expect(fcrBg(11)).toBe('var(--danger-soft)');
    expect(fcrBg(100)).toBe('var(--danger-soft)');
  });
});
