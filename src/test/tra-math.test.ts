/**
 * tra-math.test.ts — تست‌های منطق عددی و ریاضی خرید
 */
import { describe, it, expect } from 'vitest';
import {
  calcItemTotal, paidSum, remaining, computeCashDiscount, generateInstallments,
} from '../mod/tra/calc';

describe('calcItemTotal', () => {
  it('no discount: quantity × price', () => {
    expect(calcItemTotal(100, 1000)).toBe(100000);
  });
  it('zero quantity', () => {
    expect(calcItemTotal(0, 1000)).toBe(0);
  });
  it('percent discount 5%', () => {
    expect(calcItemTotal(100, 1000, 'percent', 5)).toBe(95000);
  });
  it('amount discount', () => {
    expect(calcItemTotal(100, 1000, 'amount', 10000)).toBe(90000);
  });
  it('discount larger than base → capped at 0', () => {
    expect(calcItemTotal(10, 100, 'amount', 5000)).toBe(0);
  });
  it('percent 100% → 0', () => {
    expect(calcItemTotal(100, 1000, 'percent', 100)).toBe(0);
  });
  it('fractional quantity', () => {
    expect(calcItemTotal(0.5, 1000)).toBe(500);
  });
});

describe('paidSum', () => {
  it('regular payments', () => {
    expect(paidSum([{ amount: 1000, method: 'cash' }, { amount: 2000, method: 'card' }] as any)).toBe(3000);
  });
  it('refund subtracts', () => {
    expect(paidSum([{ amount: 1000, method: 'cash', type: 'regular' }, { amount: 500, method: 'cash', type: 'refund' }] as any)).toBe(500);
  });
  it('bounced check ignored', () => {
    expect(paidSum([{ amount: 1000, method: 'cash' }, { amount: 5000, method: 'check', status: 'bounced' }] as any)).toBe(1000);
  });
  it('only cleared check counted (pending ignored)', () => {
    expect(paidSum([{ amount: 1000, method: 'check', status: 'pending' }, { amount: 2000, method: 'check', status: 'cleared' }] as any)).toBe(2000);
  });
});

describe('generateInstallments', () => {
  it('even split 1000/3 with remainder on last', () => {
    const inst = generateInstallments(1000, 3, 30, '1405/01/01', 0);
    expect(inst).toHaveLength(3);
    expect(inst[0].amount + inst[1].amount + inst[2].amount).toBe(1000);
  });
  it('single installment', () => {
    const inst = generateInstallments(5000, 1, 30, '1405/01/01', 0);
    expect(inst[0].amount).toBe(5000);
  });
  it('with advance', () => {
    const inst = generateInstallments(10000, 4, 30, '1405/01/01', 2000);
    expect(inst.reduce((a, i) => a + i.amount, 0)).toBe(8000);
  });
  it('advance >= total → empty', () => {
    expect(generateInstallments(1000, 3, 30, '1405/01/01', 1000)).toHaveLength(0);
  });
  it('count=0 → empty', () => {
    expect(generateInstallments(1000, 0, 30, '1405/01/01', 0)).toHaveLength(0);
  });
  it('total=0 → empty', () => {
    expect(generateInstallments(0, 3, 30, '1405/01/01', 0)).toHaveLength(0);
  });
  it('100/7 distributes remainder correctly', () => {
    const inst = generateInstallments(100, 7, 30, '1405/01/01', 0);
    expect(inst.reduce((a, i) => a + i.amount, 0)).toBe(100);
  });
});

describe('computeCashDiscount', () => {
  it('no discount config', () => {
    expect(computeCashDiscount({ total: 1000, date: '1405/01/01', payments: [{ date: '1405/01/05', amount: 500 }] } as any)).toBe(0);
  });
  it('partial payment within window → no discount (نیاز به تسویه کامل)', () => {
    // استاندارد accounting: تخفیف نقدی روی total فاکتور اعمال می‌شود
    // اما فقط وقتی که مشتری به اندازه total-discount پرداخت کند (تسویه)
    const d = computeCashDiscount({ total: 1000, date: '1405/01/01', cashDiscountPct: 5, cashDiscountDays: 10, payments: [{ date: '1405/01/05', amount: 500 }] } as any);
    expect(d).toBe(0);
  });

  it('full payment within window → discount روی total', () => {
    // مشتری ۹۵۰ پرداخت کرد (total - 5%) → تخفیف ۵۰ اعمال می‌شود
    const d = computeCashDiscount({ total: 1000, date: '1405/01/01', cashDiscountPct: 5, cashDiscountDays: 10, payments: [{ date: '1405/01/05', amount: 950 }] } as any);
    expect(d).toBe(50);
  });
  it('payment outside window', () => {
    expect(computeCashDiscount({ total: 1000, date: '1405/01/01', cashDiscountPct: 5, cashDiscountDays: 10, payments: [{ date: '1405/02/15', amount: 500 }] } as any)).toBe(0);
  });
});

describe('remaining', () => {
  it('total - paid', () => {
    expect(remaining({ total: 1000, payments: [{ amount: 300, method: 'cash' }] } as any)).toBe(700);
  });
  it('fully paid', () => {
    expect(remaining({ total: 1000, payments: [{ amount: 1000, method: 'cash' }] } as any)).toBe(0);
  });
  it('overpaid clamped to 0', () => {
    expect(remaining({ total: 1000, payments: [{ amount: 1500, method: 'cash' }] } as any)).toBe(0);
  });
});

describe('Complex scenarios', () => {
  it('mixed invoice with different discounts', () => {
    const items = [
      { q: 100, p: 1000, dt: 'percent', dv: 5 },
      { q: 50, p: 2000, dt: 'amount', dv: 5000 },
      { q: 10, p: 500 },
    ];
    const sum = items.reduce((a, it: any) => a + calcItemTotal(it.q, it.p, it.dt, it.dv), 0);
    expect(sum).toBe(95000 + 95000 + 5000);
  });
  it('installments with advance 30%', () => {
    const total = 45000000;
    const advance = Math.round(total * 30 / 100);
    const inst = generateInstallments(total, 3, 30, '1405/01/01', advance);
    expect(inst.reduce((a, i) => a + i.amount, 0)).toBe(total - advance);
  });
});
