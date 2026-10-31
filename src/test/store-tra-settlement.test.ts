/**
 * store-tra-settlement.test.ts — تست‌های L11 برای گارد تسویه
 * پوشش: addSettlement (duplicate guard) + deleteSettlement (invoice guard)
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { useTra } from '../mod/tra/store';
import type { Settlement } from '../mod/tra/types';

const mkSettlement = (o: Partial<Settlement> = {}): Omit<Settlement, 'id' | 'createdAt' | 'updatedAt'> => ({
  dealId: 'deal-1',
  periodStart: '1405/08/01',
  periodEnd: '1405/08/31',
  deliveriesSnapshot: [],
  salesSnapshot: [],
  paymentsSnapshot: [],
  grossSales: 0,
  commission: 0,
  netPayable: 0,
  paidAmount: 0,
  status: 'draft',
  ...o,
});

beforeEach(() => {
  useTra.setState({ deals: [], invoices: [], settlements: [] });
});

// ══════════════════════════════════════════════════════════
// addSettlement — گارد تسویه‌ی تکراری
// ══════════════════════════════════════════════════════════
describe('addSettlement — گارد تسویه تکراری', () => {
  it('اولین تسویه ثبت می‌شه', () => {
    const id = useTra.getState().addSettlement(mkSettlement());
    expect(id).toBeTruthy();
    expect(useTra.getState().settlements).toHaveLength(1);
    expect(useTra.getState().settlements[0].id).toBe(id);
  });

  it('تسویه تکراری (draft) → throw', () => {
    useTra.getState().addSettlement(mkSettlement({ status: 'draft' }));
    expect(() => useTra.getState().addSettlement(mkSettlement({ status: 'draft' })))
      .toThrow(/قبلاً تسویه‌ای/);
    expect(useTra.getState().settlements).toHaveLength(1);
  });

  it('تسویه تکراری (confirmed) → throw', () => {
    useTra.getState().addSettlement(mkSettlement({ status: 'draft' }));
    expect(() => useTra.getState().addSettlement(mkSettlement({ status: 'confirmed' })))
      .toThrow(/قبلاً تسویه‌ای/);
    expect(useTra.getState().settlements).toHaveLength(1);
  });

  it('تسویه تکراری (invoiced) → throw', () => {
    useTra.getState().addSettlement(mkSettlement({ status: 'draft' }));
    expect(() => useTra.getState().addSettlement(mkSettlement({ status: 'invoiced' })))
      .toThrow(/قبلاً تسویه‌ای/);
    expect(useTra.getState().settlements).toHaveLength(1);
  });

  it('بازه مختلف (periodStart دیگر) → مجاز', () => {
    useTra.getState().addSettlement(mkSettlement({ periodStart: '1405/08/01' }));
    const id2 = useTra.getState().addSettlement(mkSettlement({ periodStart: '1405/09/01' }));
    expect(id2).toBeTruthy();
    expect(useTra.getState().settlements).toHaveLength(2);
  });

  it('بازه مختلف (periodEnd دیگر) → مجاز', () => {
    useTra.getState().addSettlement(mkSettlement({ periodEnd: '1405/08/31' }));
    useTra.getState().addSettlement(mkSettlement({ periodEnd: '1405/09/30' }));
    expect(useTra.getState().settlements).toHaveLength(2);
  });

  it('dealId دیگر → مجاز', () => {
    useTra.getState().addSettlement(mkSettlement({ dealId: 'deal-1' }));
    useTra.getState().addSettlement(mkSettlement({ dealId: 'deal-2' }));
    expect(useTra.getState().settlements).toHaveLength(2);
  });
});

// ══════════════════════════════════════════════════════════
// deleteSettlement — گارد فاکتور
// ══════════════════════════════════════════════════════════
describe('deleteSettlement — گارد فاکتور', () => {
  it('حذف تسویه بدون فاکتور → موفق', () => {
    const id = useTra.getState().addSettlement(mkSettlement());
    useTra.getState().deleteSettlement(id);
    expect(useTra.getState().settlements).toHaveLength(0);
  });

  it('حذف تسویه با invoiceId → throw', () => {
    const id = useTra.getState().addSettlement(mkSettlement({ status: 'invoiced' }));
    // شبیه‌سازی لینک به فاکتور
    useTra.getState().updateSettlement(id, { invoiceId: 'inv-1' });
    expect(() => useTra.getState().deleteSettlement(id)).toThrow(/دارای فاکتور/);
    expect(useTra.getState().settlements).toHaveLength(1);
  });
});
