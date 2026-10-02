import { describe, it, expect } from 'vitest';
import { format, parse, addDays, startOfDay } from 'date-fns-jalali';
import {
  todayJalali, jalaliToDate, jalaliToKey, daysFromToday, statusOf,
  eventsOfDay,
  TYPE_COLORS, TYPE_LABELS,
} from '../mod/cal/store';

const daysFromTodayJ = (n: number) => format(addDays(startOfDay(new Date()), n), 'yyyy/MM/dd');

// ═══════════════════════════════════════════════
// todayJalali
// ═══════════════════════════════════════════════
describe('todayJalali', () => {
  it('فرمت yyyy/MM/dd', () => {
    const t = todayJalali();
    expect(t).toMatch(/^\d{4}\/\d{2}\/\d{2}$/);
  });

  it('با الان مطابقت داره', () => {
    expect(todayJalali()).toBe(format(new Date(), 'yyyy/MM/dd'));
  });
});

// ═══════════════════════════════════════════════
// jalaliToDate
// ═══════════════════════════════════════════════
describe('jalaliToDate', () => {
  it('تاریخ معتبر → Date', () => {
    const d = jalaliToDate('1405/07/09');
    expect(d).toBeInstanceOf(Date);
  });

  it('خالی → null', () => {
    expect(jalaliToDate('')).toBeNull();
    expect(jalaliToDate(null as any)).toBeNull();
  });

  it('نامعتبر → null', () => {
    expect(jalaliToDate('xyz')).toBeNull();
  });

  it('اعداد فارسی', () => {
    const d = jalaliToDate('۱۴۰۵/۰۷/۰۹');
    expect(d).toBeInstanceOf(Date);
    expect(format(d!, 'yyyy/MM/dd')).toBe('1405/07/09');
  });
});

// ═══════════════════════════════════════════════
// jalaliToKey
// ═══════════════════════════════════════════════
describe('jalaliToKey', () => {
  it('YYYY/MM/DD → YYYYMMDD', () => {
    expect(jalaliToKey('1405/07/09')).toBe('14050709');
  });

  it('ماه/روز تک‌رقمی → pad', () => {
    expect(jalaliToKey('1405/7/9')).toBe('14050709');
  });

  it('اعداد فارسی', () => {
    expect(jalaliToKey('۱۴۰۵/۰۷/۰۹')).toBe('14050709');
  });

  it('خالی → خالی', () => {
    expect(jalaliToKey('')).toBe('');
    expect(jalaliToKey(null as any)).toBe('');
  });

  it('نامعتبر → خالی', () => {
    expect(jalaliToKey('abc')).toBe('');
    expect(jalaliToKey('1405/07')).toBe('');
  });
});

// ═══════════════════════════════════════════════
// daysFromToday — باگ مشکوک (بدون startOfDay)
// ═══════════════════════════════════════════════
describe('daysFromToday', () => {
  it('امروز → 0', () => {
    expect(daysFromToday(daysFromTodayJ(0))).toBe(0);
  });

  it('فردا → 1', () => {
    expect(daysFromToday(daysFromTodayJ(1))).toBe(1);
  });

  it('دیروز → -1', () => {
    expect(daysFromToday(daysFromTodayJ(-1))).toBe(-1);
  });

  it('10 روز بعد → 10', () => {
    expect(daysFromToday(daysFromTodayJ(10))).toBe(10);
  });

  it('30 روز قبل → -30', () => {
    expect(daysFromToday(daysFromTodayJ(-30))).toBe(-30);
  });

  it('خالی → 999', () => {
    expect(daysFromToday('')).toBe(999);
  });

  it('نامعتبر → 999', () => {
    expect(daysFromToday('xyz')).toBe(999);
  });
});

// ═══════════════════════════════════════════════
// statusOf
// ═══════════════════════════════════════════════
describe('statusOf', () => {
  it('دیروز → past', () => {
    expect(statusOf(daysFromTodayJ(-1))).toBe('past');
  });

  it('امروز → today', () => {
    expect(statusOf(daysFromTodayJ(0))).toBe('today');
  });

  it('فردا → future', () => {
    expect(statusOf(daysFromTodayJ(1))).toBe('future');
  });

  it('10 روز بعد → future', () => {
    expect(statusOf(daysFromTodayJ(10))).toBe('future');
  });

  it('100 روز بعد → future (چون statusOf فقط past/today/future داره)', () => {
    expect(statusOf(daysFromTodayJ(100))).toBe('future');
  });
});

// ═══════════════════════════════════════════════
// eventsOfDay
// ═══════════════════════════════════════════════
describe('eventsOfDay', () => {
  it('فیلتر رویدادهای یک روز', () => {
    const events = [
      { id: '1', date: '1405/07/09' },
      { id: '2', date: '1405/07/09' },
      { id: '3', date: '1405/07/10' },
    ] as any;
    expect(eventsOfDay(events, '1405/07/09')).toHaveLength(2);
  });

  it('خالی', () => {
    expect(eventsOfDay([], '1405/07/09')).toEqual([]);
  });

  it('روز ناموجود → []', () => {
    const events = [{ id: '1', date: '1405/07/09' }] as any;
    expect(eventsOfDay(events, '1405/07/10')).toEqual([]);
  });
});

// ═══════════════════════════════════════════════
// constants
// ═══════════════════════════════════════════════
describe('constants', () => {
  it('TYPE_COLORS', () => {
    expect(TYPE_COLORS.hatch).toBeTruthy();
    expect(TYPE_COLORS.vaccine).toBeTruthy();
  });
  it('TYPE_LABELS', () => {
    expect(TYPE_LABELS.hatch).toBeTruthy();
  });
});
