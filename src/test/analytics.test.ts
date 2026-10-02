import { describe, it, expect } from 'vitest';
import {
  monthKey, jalaliToDate, lastMonths, MONTH_NAMES, monthLabel,
  salesInMonth, purchasesInMonth, cashInMonth, cashOutMonth,
  eggsInMonth, feedInMonth, deathsInMonth, fcrMonth,
  totalReceivables, totalPayables, avgChickCost, roi,
} from '../mod/rep/analytics';

const makeInvoice = (o: any = {}) => ({
  id: 'i1', type: 'sale', total: 100000, date: '1405/07/09',
  payments: [], ...o,
});

const makeProd = (o: any = {}) => ({
  id: 'p1', date: '1405/07/09',
  totalCount: 100, brokenCount: 0, softCount: 0, dirtyCount: 0,
  ...o,
});

const makeLog = (o: any = {}) => ({
  id: 'l1', date: '1405/07/09', feedAmount: 50, deaths: [],
  ...o,
});

// ═══════════════════════════════════════════════
// monthKey
// ═══════════════════════════════════════════════
describe('monthKey', () => {
  it('تاریخ کامل → yyyy/MM', () => {
    expect(monthKey('1405/07/09')).toBe('1405/07');
  });
  it('ماه تک‌رقمی → pad', () => {
    expect(monthKey('1405/7/9')).toBe('1405/07');
  });
  it('اعداد فارسی → لاتین', () => {
    expect(monthKey('۱۴۰۵/۰۷/۰۹')).toBe('1405/07');
  });
  it('خالی → خالی', () => {
    expect(monthKey('')).toBe('');
  });
  it('نامعتبر → خالی', () => {
    expect(monthKey('abc')).toBe('');
    expect(monthKey('1405/07')).toBe('');
  });
});

// ═══════════════════════════════════════════════
// monthLabel
// ═══════════════════════════════════════════════
describe('monthLabel', () => {
  it('1405/07 → مهر 05', () => {
    expect(monthLabel('1405/07')).toBe('مهر 05');
  });
  it('1405/01 → فروردین 05', () => {
    expect(monthLabel('1405/01')).toBe('فروردین 05');
  });
  it('1405/12 → اسفند 05', () => {
    expect(monthLabel('1405/12')).toBe('اسفند 05');
  });
  it('ماه 13 (نامعتبر) → فقط سال با فاصله', () => {
    // ماه‌های معتبر: 1-12. ماه 13 → MONTH_NAMES[12] undefined → ''
    expect(monthLabel('1405/13')).toBe(' 05');
  });

  it('ماه صفر (نامعتبر)', () => {
    expect(monthLabel('1405/00')).toBe(' 05');
  });
  it('بدون اسلش → همون', () => {
    expect(monthLabel('abc')).toBe('abc');
  });
});

// ═══════════════════════════════════════════════
// MONTH_NAMES
// ═══════════════════════════════════════════════
describe('MONTH_NAMES', () => {
  it('۱۲ ماه', () => {
    expect(MONTH_NAMES).toHaveLength(12);
  });
  it('فروردین اول', () => {
    expect(MONTH_NAMES[0]).toBe('فروردین');
  });
  it('اسفند آخر', () => {
    expect(MONTH_NAMES[11]).toBe('اسفند');
  });
});

// ═══════════════════════════════════════════════
// salesInMonth
// ═══════════════════════════════════════════════
describe('salesInMonth', () => {
  it('یک فروش در ماه → total', () => {
    expect(salesInMonth([makeInvoice({ total: 100000 })] , '1405/07')).toBe(100000);
  });
  it('فقط sale (نه purchase)', () => {
    const invoices = [
      makeInvoice({ type: 'sale', total: 100000 }),
      makeInvoice({ type: 'purchase', total: 500000 }),
    ];
    expect(salesInMonth(invoices, '1405/07')).toBe(100000);
  });
  it('ماه متفاوت → 0', () => {
    expect(salesInMonth([makeInvoice()], '1405/08')).toBe(0);
  });
  it('خالی → 0', () => {
    expect(salesInMonth([], '1405/07')).toBe(0);
  });
  it('چند فروش → جمع', () => {
    const invoices = [
      makeInvoice({ total: 100000 }),
      makeInvoice({ total: 50000 }),
    ];
    expect(salesInMonth(invoices, '1405/07')).toBe(150000);
  });
});

// ═══════════════════════════════════════════════
// purchasesInMonth
// ═══════════════════════════════════════════════
describe('purchasesInMonth', () => {
  it('فقط purchase', () => {
    const invoices = [
      makeInvoice({ type: 'purchase', total: 500000 }),
      makeInvoice({ type: 'sale', total: 100000 }),
    ];
    expect(purchasesInMonth(invoices, '1405/07')).toBe(500000);
  });
  it('خالی → 0', () => {
    expect(purchasesInMonth([], '1405/07')).toBe(0);
  });
});

// ═══════════════════════════════════════════════
// cashInMonth
// ═══════════════════════════════════════════════
describe('cashInMonth', () => {
  it('پرداخت فروش در ماه → جمع', () => {
    const invoices = [
      makeInvoice({
        type: 'sale',
        payments: [{ amount: 50000, date: '1405/07/15' }],
      }),
    ];
    expect(cashInMonth(invoices, '1405/07')).toBe(50000);
  });

  it('پرداخت در ماه دیگه → نادیده', () => {
    const invoices = [
      makeInvoice({
        type: 'sale',
        payments: [{ amount: 50000, date: '1405/08/15' }],
      }),
    ];
    expect(cashInMonth(invoices, '1405/07')).toBe(0);
  });

  it('فقط sale (نه purchase)', () => {
    const invoices = [
      makeInvoice({
        type: 'sale',
        payments: [{ amount: 50000, date: '1405/07/15' }],
      }),
      makeInvoice({
        type: 'purchase',
        payments: [{ amount: 30000, date: '1405/07/15' }],
      }),
    ];
    expect(cashInMonth(invoices, '1405/07')).toBe(50000);
  });
});

// ═══════════════════════════════════════════════
// eggsInMonth — باگ مشکوک
// ═══════════════════════════════════════════════
describe('eggsInMonth', () => {
  it('خالی → صفر', () => {
    const r = eggsInMonth([], '1405/07');
    expect(r.healthy).toBe(0);
    expect(r.total).toBe(0);
    expect(r.days).toBe(0);
  });

  it('یک تولید 100 totalCount → total = 100 (نه 100)', () => {
    const r = eggsInMonth([makeProd({ totalCount: 100 })], '1405/07');
    expect(r.total).toBe(100);
    expect(r.healthy).toBe(100);
    expect(r.days).toBe(1);
  });

  it('100 totalCount + 5 broken → total باید 100 باشه', () => {
    // ⚠️ اگه totalCount شامل broken باشه: total=100
    // اگه شامل نباشه: total=105
    const r = eggsInMonth([makeProd({ totalCount: 100, brokenCount: 5 })], '1405/07');
    expect(r.total).toBe(100);  // ← انتظار 100
    expect(r.healthy).toBe(95);
  });

  it('100 + 20 broken + 5 soft + 3 dirty → total=100', () => {
    const r = eggsInMonth([makeProd({
      totalCount: 100, brokenCount: 20, softCount: 5, dirtyCount: 3,
    })], '1405/07');
    expect(r.total).toBe(100);
    expect(r.healthy).toBe(72);
  });

  it('days → تعداد روزهایی که تولید داشتن', () => {
    const prods = [
      makeProd({ date: '1405/07/01' }),
      makeProd({ date: '1405/07/02' }),
      makeProd({ date: '1405/07/02' }),  // همون روز
      makeProd({ date: '1405/08/01' }),  // ماه دیگه
    ];
    expect(eggsInMonth(prods, '1405/07').days).toBe(3);
  });
});

// ═══════════════════════════════════════════════
// feedInMonth
// ═══════════════════════════════════════════════
describe('feedInMonth', () => {
  it('جمع feedAmount در ماه', () => {
    const logs = [
      makeLog({ feedAmount: 50 }),
      makeLog({ feedAmount: 30 }),
    ];
    expect(feedInMonth(logs, '1405/07')).toBe(80);
  });

  it('ماه متفاوت → 0', () => {
    expect(feedInMonth([makeLog()], '1405/08')).toBe(0);
  });
});

// ═══════════════════════════════════════════════
// deathsInMonth
// ═══════════════════════════════════════════════
describe('deathsInMonth', () => {
  it('جمع deaths.count', () => {
    const logs = [
      makeLog({ deaths: [{ count: 3 }, { count: 2 }] }),
      makeLog({ deaths: [{ count: 5 }] }),
    ];
    expect(deathsInMonth(logs, '1405/07')).toBe(10);
  });

  it('بدون deaths → 0', () => {
    expect(deathsInMonth([makeLog()], '1405/07')).toBe(0);
  });

  it('ماه متفاوت → 0', () => {
    expect(deathsInMonth([makeLog({ deaths: [{ count: 5 }] })], '1405/08')).toBe(0);
  });
});

// ═══════════════════════════════════════════════
// fcrMonth
// ═══════════════════════════════════════════════
describe('fcrMonth — ضریب تبدیل غذایی', () => {
  it('feed=100, birds=1000, gain=1.8kg → FCR=55.56', () => {
    const logs = [makeLog({ feedAmount: 100 })];
    // gain = 1000 * 1.8 / 1000 = 1.8 کیلو
    // FCR = 100 / 1.8 = 55.55...
    expect(fcrMonth(logs, '1405/07', 1000, 1.8)).toBe(55.56);
  });

  it('feed=0 → 0', () => {
    expect(fcrMonth([], '1405/07', 1000, 1.8)).toBe(0);
  });

  it('birds=0 → 0 (بدون تقسیم بر صفر)', () => {
    const logs = [makeLog({ feedAmount: 100 })];
    expect(fcrMonth(logs, '1405/07', 0, 1.8)).toBe(0);
  });

  it('avgWeightGain=0 → 0', () => {
    const logs = [makeLog({ feedAmount: 100 })];
    expect(fcrMonth(logs, '1405/07', 1000, 0)).toBe(0);
  });

  it('مقدار معقول (FCR 1.5-2.0 برای مرغ)', () => {
    // اگه 1.5 باشه: feed = 1.8 * 1.5 = 2.7 کیلو برای 1000 پرنده
    // یعنی 2700 گرم دان / 1800 گرم وزن = 1.5
    const logs = [makeLog({ feedAmount: 2.7 })];
    expect(fcrMonth(logs, '1405/07', 1000, 1.8)).toBe(1.5);
  });
});

// ═══════════════════════════════════════════════
// totalReceivables / totalPayables
// ═══════════════════════════════════════════════
describe('totalReceivables', () => {
  it('جمع remaining از فروشها', () => {
    const invoices = [
      makeInvoice({ type: 'sale', total: 100000, payments: [{ amount: 40000 }] }),
      makeInvoice({ type: 'sale', total: 50000, payments: [] }),
    ];
    // 60000 + 50000 = 110000
    expect(totalReceivables(invoices)).toBe(110000);
  });

  it('فقط sale', () => {
    const invoices = [
      makeInvoice({ type: 'purchase', total: 100000, payments: [] }),
    ];
    expect(totalReceivables(invoices)).toBe(0);
  });
});

describe('totalPayables', () => {
  it('جمع remaining از خریدها', () => {
    const invoices = [
      makeInvoice({ type: 'purchase', total: 100000, payments: [{ amount: 30000 }] }),
    ];
    expect(totalPayables(invoices)).toBe(70000);
  });
});

// ═══════════════════════════════════════════════
// avgChickCost
// ═══════════════════════════════════════════════
describe('avgChickCost', () => {
  it('خالی → 0', () => {
    expect(avgChickCost([], [])).toBe(0);
  });

  it('هزینه کل 1000000 / 500 جوجه → 2000', () => {
    const entries = [{ id: 'e1', totalPrice: 1000000 }];
    const hatches = [{ eggEntryId: 'e1', hatched: 500 }];
    expect(avgChickCost(entries, hatches)).toBe(2000);
  });

  it('entry بدون totalPrice → نادیده', () => {
    const entries = [{ id: 'e1', totalPrice: 0 }];
    const hatches = [{ eggEntryId: 'e1', hatched: 500 }];
    expect(avgChickCost(entries, hatches)).toBe(0);
  });

  it('hatched=0 → 0', () => {
    const entries = [{ id: 'e1', totalPrice: 1000000 }];
    const hatches = [{ eggEntryId: 'e1', hatched: 0 }];
    expect(avgChickCost(entries, hatches)).toBe(0);
  });

  it('چند هچ → جمع', () => {
    const entries = [
      { id: 'e1', totalPrice: 500000 },
      { id: 'e2', totalPrice: 500000 },
    ];
    const hatches = [
      { eggEntryId: 'e1', hatched: 250 },
      { eggEntryId: 'e2', hatched: 250 },
    ];
    expect(avgChickCost(entries, hatches)).toBe(2000);
  });
});

// ═══════════════════════════════════════════════
// roi
// ═══════════════════════════════════════════════
describe('roi', () => {
  it('سود 100% → 100', () => {
    expect(roi(200, 100)).toBe(100);
  });
  it('ضرر 50% → -50', () => {
    expect(roi(50, 100)).toBe(-50);
  });
  it('breakeven → 0', () => {
    expect(roi(100, 100)).toBe(0);
  });
  it('cost=0 → 0 (نه Infinity)', () => {
    expect(roi(100, 0)).toBe(0);
  });
  it('revenue=0 → -100', () => {
    expect(roi(0, 100)).toBe(-100);
  });
});
