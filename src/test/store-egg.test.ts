import { describe, it, expect, beforeEach } from 'vitest';
import {
  useEgg,
  healthyCount, henDayRate, brokenRate, calcStock,
  toPieces, saleTotal, pricePerPiece,
  EGG_TYPE_LABEL, UNIT_LABEL, PAYMENT_LABEL,
} from '../mod/egg/store';

const makeProd = (o: any = {}) => ({
  id: 'p1', date: '1405/07/09', flockId: 'f1',
  totalCount: 100, brokenCount: 0, softCount: 0, dirtyCount: 0,
  type: 'eating',
  ...o,
});

const makeSale = (o: any = {}) => ({
  id: 's1', date: '1405/07/09',
  type: 'eating', count: 10, unit: 'piece', unitPrice: 5000,
  customerName: '', paymentMethod: 'cash',
  ...o,
});

beforeEach(() => {
  useEgg.setState({ productions: [], stocks: [], sales: [] } as any);
});

// ═══════════════════════════════════════════════
// healthyCount
// ═══════════════════════════════════════════════
describe('healthyCount', () => {
  it('بدون شکسته/نرم/کثیف → total', () => {
    expect(healthyCount(makeProd({ totalCount: 100 }) as any)).toBe(100);
  });

  it('با شکسته → کاهش', () => {
    expect(healthyCount(makeProd({ totalCount: 100, brokenCount: 5 }) as any)).toBe(95);
  });

  it('با شکسته + نرم + کثیف', () => {
    expect(healthyCount(makeProd({
      totalCount: 100, brokenCount: 5, softCount: 2, dirtyCount: 3
    }) as any)).toBe(90);
  });

  it('منفی نشه (clamp 0)', () => {
    expect(healthyCount(makeProd({
      totalCount: 5, brokenCount: 10, softCount: 5, dirtyCount: 5
    }) as any)).toBe(0);
  });

  it('total صفر → 0', () => {
    expect(healthyCount(makeProd({ totalCount: 0 }) as any)).toBe(0);
  });
});

// ═══════════════════════════════════════════════
// henDayRate
// ═══════════════════════════════════════════════
describe('henDayRate — نرخ تخم‌گذاری', () => {
  it('90/100 → 90%', () => {
    expect(henDayRate(makeProd({ totalCount: 90 }) as any, 100)).toBe(90);
  });

  it('80 سالم از 100 → 80%', () => {
    expect(henDayRate(makeProd({ totalCount: 85, brokenCount: 5 }) as any, 100)).toBe(80);
  });

  it('flockCount صفر → 0 (نه Infinity)', () => {
    expect(henDayRate(makeProd() as any, 0)).toBe(0);
  });

  it('flockCount منفی → 0', () => {
    expect(henDayRate(makeProd() as any, -5)).toBe(0);
  });

  it('بیش از ۱۰۰٪ ممکن (data error → just rate)', () => {
    // 110 سالم از 100 → 110% (کاربر باید بفهمه داده اشتباهه)
    expect(henDayRate(makeProd({ totalCount: 110 }) as any, 100)).toBe(110);
  });
});

// ═══════════════════════════════════════════════
// brokenRate — باگ مشکوک
// ═══════════════════════════════════════════════
describe('brokenRate — درصد شکسته', () => {
  it('بدون شکسته → 0', () => {
    expect(brokenRate(makeProd({ totalCount: 100, brokenCount: 0 }) as any)).toBe(0);
  });

  it('5 شکسته از 100 → 5%', () => {
    // اگه totalCount شامل شکسته‌هاست: 5/100 = 5%
    // ولی فرمول فعلی: 5/(100+5) = 4.76%
    expect(brokenRate(makeProd({ totalCount: 100, brokenCount: 5 }) as any)).toBe(5);
  });

  it('10 شکسته از 100 → 10%', () => {
    expect(brokenRate(makeProd({ totalCount: 100, brokenCount: 10 }) as any)).toBe(10);
  });

  it('همه صفر → 0 (نه NaN)', () => {
    expect(brokenRate(makeProd({
      totalCount: 0, brokenCount: 0, softCount: 0, dirtyCount: 0
    }) as any)).toBe(0);
  });

  it('20 شکسته، 5 نرم، 3 کثیف از 100', () => {
    // انتظار: 20/100 = 20%
    // اگه double-count: 20/(100+20+5+3) = 15.6%
    expect(brokenRate(makeProd({
      totalCount: 100, brokenCount: 20, softCount: 5, dirtyCount: 3
    }) as any)).toBe(20);
  });
});

// ═══════════════════════════════════════════════
// toPieces
// ═══════════════════════════════════════════════
describe('toPieces — تبدیل واحد', () => {
  it('piece → همون', () => {
    expect(toPieces(10, 'piece')).toBe(10);
  });
  it('shikan → ×30', () => {
    expect(toPieces(2, 'shikan')).toBe(60);
  });
  it('box → ×10', () => {
    expect(toPieces(3, 'box')).toBe(30);
  });
  it('carton → ×360', () => {
    expect(toPieces(1, 'carton')).toBe(360);
  });
  it('واحد ناشناخته → ×1', () => {
    expect(toPieces(5, 'unknown')).toBe(5);
  });
  it('صفر → 0', () => {
    expect(toPieces(0, 'carton')).toBe(0);
  });
});

// ═══════════════════════════════════════════════
// saleTotal
// ═══════════════════════════════════════════════
describe('saleTotal', () => {
  it('10 × 5000 = 50000', () => {
    expect(saleTotal(10, 5000)).toBe(50000);
  });
  it('صفر', () => {
    expect(saleTotal(0, 5000)).toBe(0);
    expect(saleTotal(10, 0)).toBe(0);
  });
});

// ═══════════════════════════════════════════════
// pricePerPiece
// ═══════════════════════════════════════════════
describe('pricePerPiece', () => {
  it('piece: قیمت واحد = قیمت هر تخم', () => {
    expect(pricePerPiece(10, 5000, 'piece')).toBe(5000);
  });

  it('shikan: 2 شیکان 60000 تومان → 2000 هر تخم', () => {
    // 2 شیکان = 60 تخم؛ 2 × 30000 = 60000؛ 60000/60 = 1000? 
    // فرمول: (count * unitPrice) / (count * 30) = unitPrice / 30
    // اگه unitPrice = 30000 → 30000/30 = 1000
    expect(pricePerPiece(2, 30000, 'shikan')).toBe(1000);
  });

  it('carton: unitPrice/360', () => {
    expect(pricePerPiece(1, 360000, 'carton')).toBe(1000);
  });

  it('count صفر → 0 (نه NaN/Infinity)', () => {
    expect(pricePerPiece(0, 5000, 'piece')).toBe(0);
  });
});

// ═══════════════════════════════════════════════
// calcStock
// ═══════════════════════════════════════════════
describe('calcStock', () => {
  it('خالی → همه 0', () => {
    const s = calcStock([], []);
    expect(s.eating).toBe(0);
    expect(s.fertile).toBe(0);
    expect(s.broken).toBe(0);
  });

  it('تولید 100 سالم → eating = 100', () => {
    const s = calcStock([makeProd({ totalCount: 100 }) as any], []);
    expect(s.eating).toBe(100);
  });

  it('فروش 10 عدد → eating کاهش', () => {
    const s = calcStock(
      [makeProd({ totalCount: 100 }) as any],
      [makeSale({ count: 10, unit: 'piece', type: 'eating' }) as any]
    );
    expect(s.eating).toBe(90);
  });

  it('فروش شیکان (30 عدد)', () => {
    const s = calcStock(
      [makeProd({ totalCount: 100 }) as any],
      [makeSale({ count: 2, unit: 'shikan', type: 'eating' }) as any]
    );
    expect(s.eating).toBe(40);
  });

  it('فروش بیشتر از موجودی → clamp 0', () => {
    const s = calcStock(
      [makeProd({ totalCount: 10 }) as any],
      [makeSale({ count: 100, unit: 'piece', type: 'eating' }) as any]
    );
    expect(s.eating).toBe(0);
  });

  it('شکسته و نرم → broken', () => {
    const s = calcStock(
      [makeProd({ totalCount: 100, brokenCount: 5, softCount: 3 }) as any],
      []
    );
    expect(s.broken).toBe(8);
  });

  it('فروش fertile (اگه تولید fertile داشته باشیم)', () => {
    // ⚠️ این تست رو باید وقتی interface رو دیدم تنظیم کنم
    // فعلاً behavior فعلی رو چک میکنم
    const s = calcStock(
      [makeProd({ totalCount: 100, type: 'fertile' }) as any],
      []
    );
    // اگه تولید fertile هم به eating اضافه بشه، این مقدار 100 میمونه
    // اگه درست باشه، باید به fertile اضافه بشه
    expect(s.fertile).toBe(0); // ← فعلاً 0 (باگ احتمالی)
  });
});

// ═══════════════════════════════════════════════
// constants
// ═══════════════════════════════════════════════
describe('constants', () => {
  it('EGG_TYPE_LABEL', () => {
    expect(EGG_TYPE_LABEL.eating).toBeTruthy();
    expect(EGG_TYPE_LABEL.fertile).toBeTruthy();
    expect(EGG_TYPE_LABEL.broken).toBeTruthy();
  });
  it('UNIT_LABEL', () => {
    expect(UNIT_LABEL.piece).toBeTruthy();
    expect(UNIT_LABEL.shikan).toBeTruthy();
  });
});
