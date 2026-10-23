/**
 * tra-formulas.test.ts — تست single source of truth
 */
import { describe, it, expect } from 'vitest';
import { format as formatJ } from 'date-fns-jalali';
import {
  partyBalance,
  agingBucketFromDue,
  isOverdue,
  overdueDays,
} from '../mod/tra/formulas';
import { computePartyCredit } from '../mod/tra/store';

const makeInv = (o: any = {}): any => ({
  id: 'inv-' + Math.random().toString(36).slice(2, 9),
  type: 'sale',
  date: '1405/07/01',
  dueDate: '1405/07/31',
  partyId: 'p1',
  total: 1000,
  payments: [],
  category: 'feed',
  items: [],
  number: 'T001',
  relatedFlockId: '',
  relatedEntryId: '',
  notes: '',
  createdAt: '',
  updatedAt: '',
  ...o,
});

describe('partyBalance — single source of truth', () => {
  it('fully paid → 0', () => {
    const inv = makeInv({ total: 1000, payments: [{ id: 'p1', amount: 1000, method: 'cash', date: '1405/07/05' } as any] });
    expect(partyBalance('p1', [inv])).toBe(0);
  });

  it('unpaid → negative (بدهی)', () => {
    const inv = makeInv({ total: 1000 });
    expect(partyBalance('p1', [inv])).toBe(-1000);
  });

  it('overpaid → positive (پیش‌پرداخت)', () => {
    const inv = makeInv({ total: 1000, payments: [{ id: 'p1', amount: 1500, method: 'cash', date: '1405/07/05' } as any] });
    expect(partyBalance('p1', [inv])).toBe(500);
  });

  it('cash discount fully paid → 0', () => {
    const inv = makeInv({
      total: 1000,
      payments: [{ id: 'p1', amount: 950, method: 'cash', date: '1405/07/05' } as any],
      cashDiscountPct: 5, cashDiscountDays: 30,
    });
    expect(partyBalance('p1', [inv])).toBe(0);
  });

  it('filter by partyId', () => {
    const i1 = makeInv({ partyId: 'p1', total: 500 });
    const i2 = makeInv({ partyId: 'p2', total: 9999 });
    expect(partyBalance('p1', [i1, i2])).toBe(-500);
  });

  it('consistency با computePartyCredit', () => {
    const invs = [makeInv({ partyId: 'p1', total: 1000 })];
    expect(partyBalance('p1', invs)).toBe(computePartyCredit('p1', invs));
  });
});

describe('agingBucketFromDue — از dueDate (نه invoice date)', () => {
  const today = new Date();
  const fmtJ = (d: Date) => formatJ(d, 'yyyy/MM/dd');
  const daysAgo = (n: number) => {
    const d = new Date(today);
    d.setDate(d.getDate() - n);
    return fmtJ(d);
  };
  const daysAhead = (n: number) => {
    const d = new Date(today);
    d.setDate(d.getDate() + n);
    return fmtJ(d);
  };

  it('dueDate آینده → 0-15', () => {
    const inv = makeInv({ dueDate: daysAhead(5) });
    expect(agingBucketFromDue(inv)).toBe('0-15');
    expect(isOverdue(inv)).toBe(false);
    expect(overdueDays(inv)).toBe(0);
  });

  it('overdue 10 روز → 0-15', () => {
    const inv = makeInv({ dueDate: daysAgo(10) });
    expect(agingBucketFromDue(inv)).toBe('0-15');
    expect(isOverdue(inv)).toBe(true);
    expect(overdueDays(inv)).toBeGreaterThanOrEqual(9);
  });

  it('overdue 25 روز → 16-30', () => {
    const inv = makeInv({ dueDate: daysAgo(25) });
    expect(agingBucketFromDue(inv)).toBe('16-30');
  });

  it('overdue 45 روز → 31-60', () => {
    const inv = makeInv({ dueDate: daysAgo(45) });
    expect(agingBucketFromDue(inv)).toBe('31-60');
  });

  it('overdue 70 روز → 61-90', () => {
    const inv = makeInv({ dueDate: daysAgo(70) });
    expect(agingBucketFromDue(inv)).toBe('61-90');
  });

  it('overdue 100 روز → +90', () => {
    const inv = makeInv({ dueDate: daysAgo(100) });
    expect(agingBucketFromDue(inv)).toBe('+90');
  });

  it('invoice قدیمی با dueDate آینده → not overdue', () => {
    const inv = makeInv({ date: daysAgo(200), dueDate: daysAhead(10) });
    expect(isOverdue(inv)).toBe(false);
    expect(agingBucketFromDue(inv)).toBe('0-15');
  });
});
