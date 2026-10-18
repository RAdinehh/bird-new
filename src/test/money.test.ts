import { describe, it, expect } from 'vitest';
import {
  moneyAdd, moneySub, moneyMul, moneyDiv, moneyRound,
  moneyPercent, moneyApplyDiscount, moneySum, moneyEquals,
  moneyGreaterThan, moneyLessThan,
} from '../shr/utils/money';

describe('money utilities — دقت مالی', () => {
  describe('عملیات پایه', () => {
    it('moneyAdd: 0.1 + 0.2 = 0.3 (نه 0.30000000000000004)', () => {
      expect(moneyAdd(0.1, 0.2)).toBe(0.3);
    });

    it('moneyAdd: امن در برابر null/undefined/empty', () => {
      expect(moneyAdd(null, 5)).toBe(5);
      expect(moneyAdd(undefined, 5)).toBe(5);
      expect(moneyAdd('', 5)).toBe(5);
      expect(moneyAdd(null, null)).toBe(0);
    });

    it('moneyAdd: هندل کردن رشته‌های نامعتبر', () => {
      expect(moneyAdd('abc', 5)).toBe(5);
      expect(moneyAdd('100', '200')).toBe(300);
    });

    it('moneySub: 100 - 33.33 = 66.67', () => {
      expect(moneySub(100, 33.33)).toBe(66.67);
    });

    it('moneyMul: 100,000 × 0.02 = 2,000 دقیق', () => {
      expect(moneyMul(100000, 0.02)).toBe(2000);
    });

    it('moneyMul: 333,333 × 0.02 = 6,666.66', () => {
      expect(moneyMul(333333, 0.02)).toBe(6666.66);
    });

    it('moneyMul: اعداد بزرگ', () => {
      expect(moneyMul(1000000, 1000000)).toBe(1000000000000);
    });

    it('moneyDiv: تقسیم با دقت', () => {
      expect(moneyDiv(100, 3)).toBeCloseTo(33.333333, 5);
    });

    it('moneyDiv: تقسیم بر صفر → 0', () => {
      expect(moneyDiv(100, 0)).toBe(0);
    });
  });

  describe('گرد کردن', () => {
    it('moneyRound: 2.5 → 3 (half-up)', () => {
      expect(moneyRound(2.5, 0)).toBe(3);
    });

    it('moneyRound: 2.4 → 2', () => {
      expect(moneyRound(2.4, 0)).toBe(2);
    });

    it('moneyRound: با ۲ رقم اعشار', () => {
      expect(moneyRound(2.567, 2)).toBe(2.57);
    });
  });

  describe('درصدها', () => {
    it('moneyPercent: ۲٪ از ۱۰۰,۰۰۰ = ۲,۰۰۰', () => {
      expect(moneyPercent(100000, 2)).toBe(2000);
    });

    it('moneyApplyDiscount: ۱۰۰,۰۰۰ با ۲٪ تخفیف = ۹۸,۰۰۰', () => {
      expect(moneyApplyDiscount(100000, 2)).toBe(98000);
    });

    it('moneyApplyDiscount: تخفیف ۰٪ → همان مبلغ', () => {
      expect(moneyApplyDiscount(100000, 0)).toBe(100000);
    });
  });

  describe('جمع گروهی', () => {
    it('moneySum: 0.1 + 0.2 + 0.3 = 0.6', () => {
      expect(moneySum([0.1, 0.2, 0.3])).toBe(0.6);
    });

    it('moneySum: آرایه خالی → 0', () => {
      expect(moneySum([])).toBe(0);
    });

    it('moneySum: مقادیر null/undefined', () => {
      expect(moneySum([10, null, 20, undefined, 30])).toBe(60);
    });
  });

  describe('مقایسه‌ها', () => {
    it('moneyEquals: 0.3 == 0.1 + 0.2', () => {
      expect(moneyEquals(0.3, moneyAdd(0.1, 0.2))).toBe(true);
    });

    it('moneyGreaterThan: 10 > 5', () => {
      expect(moneyGreaterThan(10, 5)).toBe(true);
      expect(moneyGreaterThan(5, 10)).toBe(false);
    });

    it('moneyLessThan: 5 < 10', () => {
      expect(moneyLessThan(5, 10)).toBe(true);
      expect(moneyLessThan(10, 5)).toBe(false);
    });
  });

  describe('سناریوهای واقعی فاکتور', () => {
    it('فاکتور خرید جوجه: ۱۰,۰۰۰ × ۱۵,۰۰۰ = ۱۵۰,۰۰۰,۰۰۰', () => {
      const qty = 10000;
      const price = 15000;
      expect(moneyMul(qty, price)).toBe(150000000);
    });

    it('تخفیف ۲٪ نقدی روی ۱۵۰ میلیون = ۳ میلیون تخفیف', () => {
      const total = 150000000;
      const afterDiscount = moneyApplyDiscount(total, 2);
      expect(afterDiscount).toBe(147000000);
    });

    it('پرداخت جزئی: ۱۰۰ میلیون - ۳۰ میلیون پیش‌پرداخت - ۵ میلیون بستانکاری = ۶۵ میلیون', () => {
      const total = 100000000;
      const paid = 30000000;
      const credit = 5000000;
      const remaining = moneySub(moneySub(total, paid), credit);
      expect(remaining).toBe(65000000);
    });

    it('جمع اقلام فاکتور با اعشار', () => {
      const items = [
        moneyMul(100, 1500.5),
        moneyMul(50, 2500.75),
        moneyMul(200, 3000.25),
      ];
      expect(moneySum(items)).toBe(150050 + 125037.5 + 600050);
    });
  });
});
