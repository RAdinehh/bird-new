import { describe, it, expect } from 'vitest';
import { format, addDays } from 'date-fns-jalali';
import {
  stockWarning, daysToExpiry, expiryWarning, totalInventoryValue,
  CATEGORY_LABEL, CATEGORY_ICON, UNIT_LABEL, MOVEMENT_REASON, STORAGE_LABEL,
} from '../mod/whs/store';

const makeItem = (o: any = {}) => ({
  id: 'i1', name: 'دان', category: 'feed', unit: 'kg',
  currentStock: 100, minStock: 20, lastPrice: 50000,
  expireDate: '',
  ...o,
});

const daysFromTodayJ = (n: number) => format(addDays(new Date(), n), 'yyyy/MM/dd');

// ═══════════════════════════════════════════════
// stockWarning
// ═══════════════════════════════════════════════
describe('stockWarning', () => {
  it('stock > min → ok', () => {
    expect(stockWarning(makeItem({ currentStock: 100, minStock: 20 }) as any)).toBe('ok');
  });

  it('stock == min → low (مرز)', () => {
    expect(stockWarning(makeItem({ currentStock: 20, minStock: 20 }) as any)).toBe('low');
  });

  it('stock < min → low', () => {
    expect(stockWarning(makeItem({ currentStock: 10, minStock: 20 }) as any)).toBe('low');
  });

  it('stock == 0 → critical', () => {
    expect(stockWarning(makeItem({ currentStock: 0, minStock: 20 }) as any)).toBe('critical');
  });

  it('stock منفی → critical', () => {
    expect(stockWarning(makeItem({ currentStock: -5, minStock: 20 }) as any)).toBe('critical');
  });

  it('minStock=0 و stock>0 → ok', () => {
    expect(stockWarning(makeItem({ currentStock: 5, minStock: 0 }) as any)).toBe('ok');
  });

  it('minStock=0 و stock=0 → critical (مرز)', () => {
    expect(stockWarning(makeItem({ currentStock: 0, minStock: 0 }) as any)).toBe('critical');
  });
});

// ═══════════════════════════════════════════════
// daysToExpiry — این باید باگ رو نشون بده
// ═══════════════════════════════════════════════
describe('daysToExpiry', () => {
  it('خالی → null', () => {
    expect(daysToExpiry('')).toBeNull();
  });

  it('null → null', () => {
    expect(daysToExpiry(null as any)).toBeNull();
  });

  it('نامعتبر → null', () => {
    expect(daysToExpiry('abc')).toBeNull();
  });

  it('امروز → 0', () => {
    // امروز = تاریخ امروز، پس daysToExpiry = 0 (بالا گرد)
    const d = daysToExpiry(daysFromTodayJ(0));
    expect(d).toBe(0);
  });

  it('فردا → 1', () => {
    expect(daysToExpiry(daysFromTodayJ(1))).toBe(1);
  });

  it('10 روز بعد → 10', () => {
    expect(daysToExpiry(daysFromTodayJ(10))).toBe(10);
  });

  it('دیروز → -1', () => {
    expect(daysToExpiry(daysFromTodayJ(-1))).toBe(-1);
  });

  it('30 روز بعد → 30', () => {
    expect(daysToExpiry(daysFromTodayJ(30))).toBe(30);
  });

  it('100 روز بعد → 100', () => {
    expect(daysToExpiry(daysFromTodayJ(100))).toBe(100);
  });

  it('اعداد فارسی → درست', () => {
    // باید با ۱۴۰۵ کار کنه
    const jalali = format(addDays(new Date(), 5), 'yyyy/MM/dd');
    const persian = jalali.replace(/[0-9]/g, d => '۰۱۲۳۴۵۶۷۸۹'[+d]);
    expect(daysToExpiry(persian)).toBe(5);
  });
});

// ═══════════════════════════════════════════════
// expiryWarning
// ═══════════════════════════════════════════════
describe('expiryWarning', () => {
  it('بدون expireDate → ok', () => {
    expect(expiryWarning(makeItem({ expireDate: '' }) as any)).toBe('ok');
  });

  it('منقضی (دیروز) → expired', () => {
    expect(expiryWarning(makeItem({ expireDate: daysFromTodayJ(-1) }) as any)).toBe('expired');
  });

  it('امروز → soon (0 روز مانده)', () => {
    expect(expiryWarning(makeItem({ expireDate: daysFromTodayJ(0) }) as any)).toBe('soon');
  });

  it('10 روز مانده → soon', () => {
    expect(expiryWarning(makeItem({ expireDate: daysFromTodayJ(10) }) as any)).toBe('soon');
  });

  it('30 روز مانده → soon (مرز)', () => {
    expect(expiryWarning(makeItem({ expireDate: daysFromTodayJ(30) }) as any)).toBe('soon');
  });

  it('31 روز مانده → ok', () => {
    expect(expiryWarning(makeItem({ expireDate: daysFromTodayJ(31) }) as any)).toBe('ok');
  });

  it('100 روز مانده → ok', () => {
    expect(expiryWarning(makeItem({ expireDate: daysFromTodayJ(100) }) as any)).toBe('ok');
  });
});

// ═══════════════════════════════════════════════
// totalInventoryValue
// ═══════════════════════════════════════════════
describe('totalInventoryValue', () => {
  it('خالی → 0', () => {
    expect(totalInventoryValue([])).toBe(0);
  });

  it('یک آیتم', () => {
    expect(totalInventoryValue([
      makeItem({ currentStock: 10, lastPrice: 5000 }) as any,
    ])).toBe(50000);
  });

  it('چند آیتم → جمع', () => {
    expect(totalInventoryValue([
      makeItem({ currentStock: 10, lastPrice: 5000 }) as any,
      makeItem({ currentStock: 5, lastPrice: 10000 }) as any,
    ])).toBe(50000 + 50000);
  });

  it('stock صفر → 0', () => {
    expect(totalInventoryValue([
      makeItem({ currentStock: 0, lastPrice: 5000 }) as any,
    ])).toBe(0);
  });

  it('قیمت صفر → 0', () => {
    expect(totalInventoryValue([
      makeItem({ currentStock: 10, lastPrice: 0 }) as any,
    ])).toBe(0);
  });
});

// ═══════════════════════════════════════════════
// constants
// ═══════════════════════════════════════════════
describe('constants', () => {
  it('CATEGORY_LABEL همه دسته‌ها', () => {
    expect(CATEGORY_LABEL.feed).toBeTruthy();
    expect(CATEGORY_LABEL.medicine).toBeTruthy();
    expect(CATEGORY_LABEL.vaccine).toBeTruthy();
    expect(CATEGORY_LABEL.equipment).toBeTruthy();
  });
  it('UNIT_LABEL همه واحدها', () => {
    expect(UNIT_LABEL.kg).toBeTruthy();
    expect(UNIT_LABEL.L).toBeTruthy();
    expect(UNIT_LABEL.pcs).toBeTruthy();
  });
  it('MOVEMENT_REASON', () => {
    expect(MOVEMENT_REASON.purchase).toBeTruthy();
    expect(MOVEMENT_REASON.consumption).toBeTruthy();
  });
});
