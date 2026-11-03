/**
 * receivables-deals.test.ts — تست‌های L11 برای منطق معاملات در مطالبات
 * پوشش: computeDealBalance + dealDaysUntilDue + agingBucketFromDeal + isDealOpen
 */
import { describe, it, expect } from 'vitest';
import { computeDealBalance, dealDaysUntilDue, agingBucketFromDeal, isDealOpen } from '../mod/tra/calc';
import type { Deal } from '../mod/tra/types';

const mkDeal = (o: Partial<Deal> = {}): Deal => ({
  id: 'd1', type: 'consignment', date: '1405/08/01', partyId: 'p1',
  description: 'تست', value: 0, percent: null, dueDate: '', status: 'open',
  notes: '', sales: [], payments: [],
  createdAt: '', updatedAt: '',
  ...o,
} as Deal);

// ══════════════════════════════════════════════════════════
// computeDealBalance
// ══════════════════════════════════════════════════════════
describe('computeDealBalance', () => {
  it('کمیسیون درصدی درست محاسبه می‌شود', () => {
    const d = mkDeal({
      settlementType: 'percent', settlementValue: 15,
      sales: [{ id: 's1', goodId: 'g1', date: '', quantity: 100, unitPrice: 1000 }],
    });
    const b = computeDealBalance(d);
    expect(b.totalSales).toBe(100000);
    expect(b.commission).toBe(15000);
    expect(b.myShare).toBe(85000);
    expect(b.balance).toBe(85000);
  });

  it('تسویه مبلغ ثابت — کمیسیون = مقدار ثابت', () => {
    const d = mkDeal({
      settlementType: 'fixed', settlementValue: 5000,
      sales: [{ id: 's1', goodId: 'g1', date: '', quantity: 10, unitPrice: 1000 }],
    });
    const b = computeDealBalance(d);
    expect(b.commission).toBe(5000);
    expect(b.myShare).toBe(5000);
  });

  it('پرداخت‌های ورودی (دریافت) از مانده کم می‌کند', () => {
    const d = mkDeal({
      sales: [{ id: 's1', goodId: 'g1', date: '', quantity: 10, unitPrice: 1000 }],
      payments: [{ id: 'p1', date: '', amount: 3000, direction: 'in', method: 'cash' }],
    });
    const b = computeDealBalance(d);
    expect(b.paidIn).toBe(3000);
    expect(b.balance).toBe(7000); // 10000 - 3000
  });

  it('پرداخت‌های خروجی (پرداخت به طرف) به مانده اضافه می‌کند', () => {
    const d = mkDeal({
      sales: [{ id: 's1', goodId: 'g1', date: '', quantity: 10, unitPrice: 1000 }],
      payments: [{ id: 'p1', date: '', amount: 2000, direction: 'out', method: 'cash' }],
    });
    const b = computeDealBalance(d);
    expect(b.paidOut).toBe(2000);
    expect(b.balance).toBe(12000); // 10000 + 2000
  });

  it('فروش‌های چندگانه جمع می‌شوند', () => {
    const d = mkDeal({
      sales: [
        { id: 's1', goodId: 'g1', date: '', quantity: 5, unitPrice: 100 },
        { id: 's2', goodId: 'g2', date: '', quantity: 10, unitPrice: 200 },
      ],
    });
    expect(computeDealBalance(d).totalSales).toBe(2500);
  });
});

// ══════════════════════════════════════════════════════════
// dealDaysUntilDue
// ══════════════════════════════════════════════════════════
describe('dealDaysUntilDue', () => {
  it('بدون dueDate → null', () => {
    expect(dealDaysUntilDue(mkDeal({ dueDate: '' }))).toBeNull();
  });

  it('تاریخ نامعتبر → null', () => {
    expect(dealDaysUntilDue(mkDeal({ dueDate: 'invalid' }))).toBeNull();
  });
});

// ══════════════════════════════════════════════════════════
// agingBucketFromDeal
// ══════════════════════════════════════════════════════════
describe('agingBucketFromDeal', () => {
  it('بدون dueDate → 0-15 (پیش‌فرض)', () => {
    expect(agingBucketFromDeal(mkDeal())).toBe('0-15');
  });
});

// ══════════════════════════════════════════════════════════
// isDealOpen
// ══════════════════════════════════════════════════════════
describe('isDealOpen', () => {
  it('وضعیت settled → false', () => {
    const d = mkDeal({ status: 'settled' });
    expect(isDealOpen(d, [])).toBe(false);
  });

  it('وضعیت cancelled → false', () => {
    const d = mkDeal({ status: 'cancelled' });
    expect(isDealOpen(d, [])).toBe(false);
  });

  it('تبدیل به فاکتور شده (relatedDealId) → false', () => {
    const d = mkDeal({ status: 'open', sales: [{ id: 's1', goodId: 'g1', date: '', quantity: 1, unitPrice: 100 }] });
    expect(isDealOpen(d, [{ relatedDealId: d.id }])).toBe(false);
  });

  it('مانده صفر → false', () => {
    const d = mkDeal({ status: 'open', sales: [], payments: [] });
    expect(isDealOpen(d, [])).toBe(false);
  });

  it('باز + مانده غیرصفر → true', () => {
    const d = mkDeal({ status: 'open', sales: [{ id: 's1', goodId: 'g1', date: '', quantity: 1, unitPrice: 100 }] });
    expect(isDealOpen(d, [])).toBe(true);
  });
});
