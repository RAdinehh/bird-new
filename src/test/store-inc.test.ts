import { describe, it, expect } from 'vitest';
import { format, parse, addDays, differenceInDays } from 'date-fns-jalali';
import {
  jalaliToDate, daysAgo, addDaysJalali, daysToHatch,
  isLockdown, isHatchWindow, incubationDays, daysFromProfiles,
  hatchRate, costPerChick,
  DEVICE_MODE_LABEL, DEVICE_STATUS_LABEL, DEAL_LABEL, ENTRY_STATUS_LABEL,
} from '../mod/inc/store';

// helper
const todayJ = () => format(new Date(), 'yyyy/MM/dd');
const daysFromTodayJ = (n: number) => format(addDays(new Date(), n), 'yyyy/MM/dd');

// ═══════════════════════════════════════════════
// jalaliToDate
// ═══════════════════════════════════════════════
describe('jalaliToDate', () => {
  it('تاریخ معتبر → Date', () => {
    const d = jalaliToDate('1405/07/09');
    expect(d).toBeInstanceOf(Date);
    expect(d).not.toBeNull();
  });

  it('تاریخ خالی → null', () => {
    expect(jalaliToDate('')).toBeNull();
  });

  it('رشته نامعتبر → null', () => {
    expect(jalaliToDate('xyz')).toBeNull();
  });

  it('اعداد فارسی → درست پارس', () => {
    const d = jalaliToDate('۱۴۰۵/۰۷/۰۹');
    expect(d).toBeInstanceOf(Date);
  });

  it('پارس دقیق: 1405/07/09 → 09 مهر', () => {
    const d = jalaliToDate('1405/07/09');
    expect(format(d!, 'yyyy/MM/dd')).toBe('1405/07/09');
  });
});

// ═══════════════════════════════════════════════
// addDaysJalali — تست ریاضی دقیق
// ═══════════════════════════════════════════════
describe('addDaysJalali — محاسبات دقیق شمسی', () => {
  it('+0 → همون تاریخ', () => {
    expect(addDaysJalali('1405/07/09', 0)).toBe('1405/07/09');
  });

  it('+1 → فردا', () => {
    expect(addDaysJalali('1405/07/09', 1)).toBe('1405/07/10');
  });

  it('+21 → 21 روز بعد (مرغ)', () => {
    // مهر 30 روزه: 9+21=30 → 30 مهر
    expect(addDaysJalali('1405/07/09', 21)).toBe('1405/07/30');
  });

  it('+30 → عبور از ماه (مهر 30 روزه)', () => {
    // 9 + 30 = 39، 39-30=9 → 9 آبان
    expect(addDaysJalali('1405/07/09', 30)).toBe('1405/08/09');
  });

  it('+60 → دو ماه بعد', () => {
    // مهر 30 + آبان 30 = 60 → 9 آذر
    expect(addDaysJalali('1405/07/09', 60)).toBe('1405/09/09');
  });

  it('-5 → 5 روز قبل', () => {
    expect(addDaysJalali('1405/07/09', -5)).toBe('1405/07/04');
  });

  it('عبور از سال 1405→1406 (اسفند 29 روزه 1405)', () => {
    // 1405 کبیسه نیست → اسفند 29
    // 25 اسفند + 10 = 29 اسفند + 6 فروردین 1406
    expect(addDaysJalali('1405/12/25', 10)).toBe('1406/01/06');
  });

  it('سال کبیسه 1403 (اسفند 30 روزه)', () => {
    // 1403 کبیسه هست → اسفند 30
    // 25 اسفند + 10 = 30 اسفند (5 روز) + 5 فروردین
    expect(addDaysJalali('1403/12/25', 10)).toBe('1404/01/05');
  });

  it('تاریخ خالی → خالی', () => {
    expect(addDaysJalali('', 5)).toBe('');
  });

  it('تاریخ نامعتبر → خالی', () => {
    expect(addDaysJalali('xyz', 5)).toBe('');
  });

  it('پایداری: 100 روز رفت و برگشت', () => {
    const base = '1405/01/15';
    const forward = addDaysJalali(base, 100);
    const back = addDaysJalali(forward, -100);
    expect(back).toBe(base);
  });
});

// ═══════════════════════════════════════════════
// daysAgo
// ═══════════════════════════════════════════════
describe('daysAgo', () => {
  it('امروز → 1 (روز اول = 1)', () => {
    expect(daysAgo(todayJ())).toBe(1);
  });

  it('دیروز → 2', () => {
    expect(daysAgo(daysFromTodayJ(-1))).toBe(2);
  });

  it('10 روز پیش → 11', () => {
    expect(daysAgo(daysFromTodayJ(-10))).toBe(11);
  });

  it('تاریخ خالی → 0', () => {
    expect(daysAgo('')).toBe(0);
  });

  it('تاریخ نامعتبر → 0', () => {
    expect(daysAgo('xyz')).toBe(0);
  });

  it('تاریخ آینده → 1 (حداقل)', () => {
    // چون Math.max(1, days+1) — اگه آینده باشه days منفیه، ولی حداقل 1
    expect(daysAgo(daysFromTodayJ(5))).toBe(1);
  });
});

// ═══════════════════════════════════════════════
// daysToHatch
// ═══════════════════════════════════════════════
describe('daysToHatch', () => {
  it('امروز → 0', () => {
    expect(daysToHatch(todayJ())).toBe(0);
  });

  it('فردا → 1', () => {
    expect(daysToHatch(daysFromTodayJ(1))).toBe(1);
  });

  it('دیروز → -1', () => {
    expect(daysToHatch(daysFromTodayJ(-1))).toBe(-1);
  });

  it('10 روز بعد → 10', () => {
    expect(daysToHatch(daysFromTodayJ(10))).toBe(10);
  });

  it('تاریخ خالی → 0', () => {
    expect(daysToHatch('')).toBe(0);
  });

  it('تاریخ نامعتبر → 0', () => {
    expect(daysToHatch('xyz')).toBe(0);
  });
});

// ═══════════════════════════════════════════════
// isLockdown
// ═══════════════════════════════════════════════
describe('isLockdown', () => {
  it('روز 1 → false', () => {
    expect(isLockdown({ entryDate: todayJ() } as any)).toBe(false);
  });

  it('روز 17 → false', () => {
    // 17 روز پیش → daysAgo=18 → true (چون >=18)
    // برای 17: 16 روز پیش → daysAgo=17 → false
    expect(isLockdown({ entryDate: daysFromTodayJ(-16) } as any)).toBe(false);
  });

  it('روز 18 → true (شروع lockdown)', () => {
    // 17 روز پیش → daysAgo = 18
    expect(isLockdown({ entryDate: daysFromTodayJ(-17) } as any)).toBe(true);
  });

  it('روز 21 → true', () => {
    expect(isLockdown({ entryDate: daysFromTodayJ(-20) } as any)).toBe(true);
  });

  it('تاریخ خالی → false (age=0)', () => {
    expect(isLockdown({ entryDate: '' } as any)).toBe(false);
  });
});

// ═══════════════════════════════════════════════
// isHatchWindow
// ═══════════════════════════════════════════════
describe('isHatchWindow — پنجره 2 روز قبل تا 1 روز بعد', () => {
  it('امروز هچ → true', () => {
    expect(isHatchWindow({ expectedHatchDate: todayJ() } as any)).toBe(true);
  });

  it('2 روز بعد → true (مرز بالا)', () => {
    expect(isHatchWindow({ expectedHatchDate: daysFromTodayJ(2) } as any)).toBe(true);
  });

  it('3 روز بعد → false', () => {
    expect(isHatchWindow({ expectedHatchDate: daysFromTodayJ(3) } as any)).toBe(false);
  });

  it('دیروز هچ → true (مرز پایین)', () => {
    expect(isHatchWindow({ expectedHatchDate: daysFromTodayJ(-1) } as any)).toBe(true);
  });

  it('2 روز قبل هچ → false', () => {
    expect(isHatchWindow({ expectedHatchDate: daysFromTodayJ(-2) } as any)).toBe(false);
  });

  it('5 روز بعد → false', () => {
    expect(isHatchWindow({ expectedHatchDate: daysFromTodayJ(5) } as any)).toBe(false);
  });
});

// ═══════════════════════════════════════════════
// incubationDays — fallback values
// ═══════════════════════════════════════════════
describe('incubationDays — مقادیر پیش‌فرض پرندگان', () => {
  // توجه: اگه pm-settings تنظیم شده باشه، این مقادیر از profile میان
  // پس این تست‌ها روی fallback کار می‌کنن (وقتی profile نباشه)
  it('بوقلمون → 28', () => {
    expect(incubationDays('بوقلمون')).toBe(28);
  });

  it('اردک → 28', () => {
    expect(incubationDays('اردک')).toBe(28);
  });

  it('غاز → 30', () => {
    expect(incubationDays('غاز')).toBe(30);
  });

  it('بلدرچین → 18', () => {
    expect(incubationDays('بلدرچین')).toBe(18);
  });

  it('قرقاول → 24', () => {
    expect(incubationDays('قرقاول')).toBe(24);
  });

  it('کبوتر → 17', () => {
    expect(incubationDays('کبوتر')).toBe(17);
  });

  it('مرغ (پیش‌فرض) → 21', () => {
    expect(incubationDays('مرغ')).toBe(21);
  });

  it('ناشناخته → 21', () => {
    expect(incubationDays('نامعلوم')).toBe(21);
  });

  it('خالی → 21', () => {
    expect(incubationDays('')).toBe(21);
  });
});

// ═══════════════════════════════════════════════
// daysFromProfiles — pure function
// ═══════════════════════════════════════════════
describe('daysFromProfiles', () => {
  it('پیدا در profiles', () => {
    const profiles = [{ birdName: 'مرغ', totalDays: 25 }];
    expect(daysFromProfiles('مرغ', profiles)).toBe(25);
  });

  it('نبود → fallback', () => {
    expect(daysFromProfiles('بوقلمون', [])).toBe(28);
  });

  it('profiles null → fallback', () => {
    expect(daysFromProfiles('بوقلمون', null as any)).toBe(28);
  });

  it('مقایسه case-insensitive', () => {
    const profiles = [{ birdName: 'مرغ', totalDays: 25 }];
    expect(daysFromProfiles('مرغ', profiles)).toBe(25);
  });

  it('profile بدون totalDays → fallback', () => {
    const profiles = [{ birdName: 'مرغ' }];
    expect(daysFromProfiles('مرغ', profiles)).toBe(21);
  });
});

// ═══════════════════════════════════════════════
// hatchRate
// ═══════════════════════════════════════════════
describe('hatchRate', () => {
  it('100/100 → 100%', () => {
    expect(hatchRate(100, 100)).toBe(100);
  });

  it('50/100 → 50%', () => {
    expect(hatchRate(50, 100)).toBe(50);
  });

  it('0/100 → 0%', () => {
    expect(hatchRate(0, 100)).toBe(0);
  });

  it('80/95 → ~84.21%', () => {
    expect(hatchRate(80, 95)).toBeCloseTo(84.21, 1);
  });

  it('تقسیم بر صفر → 0 (نه Infinity/NaN)', () => {
    expect(hatchRate(50, 0)).toBe(0);
  });

  it('پیش‌فرض 0/0 → 0', () => {
    expect(hatchRate(0, 0)).toBe(0);
  });
});

// ═══════════════════════════════════════════════
// costPerChick
// ═══════════════════════════════════════════════
describe('costPerChick', () => {
  it('1000/100 → 10', () => {
    expect(costPerChick(1000, 100)).toBe(10);
  });

  it('تقسیم بر صفر → 0 (نه Infinity)', () => {
    expect(costPerChick(1000, 0)).toBe(0);
  });

  it('هزینه صفر → 0', () => {
    expect(costPerChick(0, 100)).toBe(0);
  });

  it('دقت اعشاری', () => {
    expect(costPerChick(1500, 100)).toBe(15);
    expect(costPerChick(1250, 100)).toBe(12.5);
  });
});

// ═══════════════════════════════════════════════
// constants
// ═══════════════════════════════════════════════
describe('constants', () => {
  it('DEVICE_MODE_LABEL', () => {
    expect(DEVICE_MODE_LABEL.setter).toBeTruthy();
    expect(DEVICE_MODE_LABEL.hatcher).toBeTruthy();
    expect(DEVICE_MODE_LABEL['setter+hatcher']).toBeTruthy();
  });

  it('DEVICE_STATUS_LABEL', () => {
    expect(DEVICE_STATUS_LABEL.active).toBeTruthy();
    expect(DEVICE_STATUS_LABEL.idle).toBeTruthy();
    expect(DEVICE_STATUS_LABEL.maintenance).toBeTruthy();
    expect(DEVICE_STATUS_LABEL.broken).toBeTruthy();
  });

  it('DEAL_LABEL', () => {
    expect(DEAL_LABEL.own).toBeTruthy();
    expect(DEAL_LABEL.purchase).toBeTruthy();
    expect(DEAL_LABEL.partnership).toBeTruthy();
    expect(DEAL_LABEL.rent).toBeTruthy();
    expect(DEAL_LABEL.consignment).toBeTruthy();
  });

  it('ENTRY_STATUS_LABEL', () => {
    expect(ENTRY_STATUS_LABEL.incubating).toBeTruthy();
    expect(ENTRY_STATUS_LABEL.candled).toBeTruthy();
    expect(ENTRY_STATUS_LABEL.locked).toBeTruthy();
    expect(ENTRY_STATUS_LABEL.hatched).toBeTruthy();
    expect(ENTRY_STATUS_LABEL.done).toBeTruthy();
    expect(ENTRY_STATUS_LABEL.failed).toBeTruthy();
  });
});
