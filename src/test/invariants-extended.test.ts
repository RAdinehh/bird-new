/**
 * invariants-extended.test.ts — قواعد همیشگی داده
 * ═══════════════════════════════════════════════
 * هر تغییر در storeها → این تست‌ها باید پاس شن.
 * اگه fail داد → یه باگ واقعی برگشته.
 * ═══════════════════════════════════════════════
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { useTra, remaining, itemsSum, computePartyCredit } from '../mod/tra/store';
import { useFlk } from '../mod/flk/store';
import { useEgg } from '../mod/egg/store';
import { useWhs } from '../mod/whs/store';

const now = () => new Date().toISOString();

const makeInvoice = (o: any = {}): any => ({
  id: 'inv-' + Math.random().toString(36).slice(2, 9),
  type: 'purchase',
  number: 'P' + Date.now(),
  date: '1405/07/01',
  partyId: 'p1',
  category: 'feed',
  items: [],
  total: 0,
  payments: [],
  dueDate: '1405/07/31',
  relatedFlockId: '',
  relatedEntryId: '',
  notes: '',
  createdAt: now(),
  updatedAt: now(),
  ...o,
});

beforeEach(() => {
  useTra.setState({ invoices: [], allocations: [], partyPayments: [], deals: [] } as any);
  useFlk.setState({ flocks: [], groups: [], groupMembers: [] } as any);
  useEgg.setState({ productions: [], sales: [] } as any);
  useWhs.setState({ items: [], movements: [] } as any);
});

// ═══════════════════════════════════════════════
// INVARIANT 1: sum(items) === invoice.total
// ═══════════════════════════════════════════════
describe('INVARIANT: sum(items) === total', () => {
  it('اقلام ساده → مجموع درست', () => {
    const items = [
      { id: 'i1', description: 'a', unit: 'kg', quantity: 10, unitPrice: 100, total: 1000 },
      { id: 'i2', description: 'b', unit: 'kg', quantity: 5, unitPrice: 200, total: 1000 },
    ];
    expect(itemsSum(items as any)).toBe(2000);
  });

  it('invoice با total اشتباه → itemsSum تشخیص می‌ده', () => {
    const inv = makeInvoice({
      items: [{ id: 'i1', description: 'a', unit: 'kg', quantity: 10, unitPrice: 100, total: 1000 }],
      total: 9999,
    });
    expect(itemsSum(inv.items)).not.toBe(inv.total);
    expect(itemsSum(inv.items)).toBe(1000);
  });
});

// ═══════════════════════════════════════════════
// INVARIANT 2: remaining=0 → partyCredit=0
// ═══════════════════════════════════════════════
describe('INVARIANT: remaining=0 → partyCredit=0', () => {
  it('invoice تسویه با cash → credit صفر', () => {
    const inv = makeInvoice({
      total: 1000,
      payments: [
        { id: 'pay1', amount: 1000, method: 'cash', date: '1405/07/01', checkNo: '', bank: '', dueDate: '', notes: '' } as any,
      ],
    });
    useTra.setState({ invoices: [inv] } as any);

    expect(remaining(inv)).toBe(0);
    expect(computePartyCredit('p1', [inv])).toBe(0);
  });

  it('cash discount → remaining=0 و credit=0 (باگ قبلی: -50)', () => {
    const inv = makeInvoice({
      total: 1000,
      payments: [
        { id: 'pay1', amount: 950, method: 'cash', date: '1405/07/01', checkNo: '', bank: '', dueDate: '', notes: '' } as any,
      ],
      cashDiscountPct: 5,
      cashDiscountDays: 30,
    });
    useTra.setState({ invoices: [inv] } as any);

    expect(remaining(inv)).toBe(0);
    expect(computePartyCredit('p1', [inv])).toBe(0);
  });
});

// ═══════════════════════════════════════════════
// INVARIANT 3: delete(add(inv)) → no orphan
// ═══════════════════════════════════════════════
describe('INVARIANT: delete(add(inv)) → no orphan', () => {
  it('فروش تخم → delete → egg.sales صفر (باگ قبلی: orphan)', () => {
    const inv = makeInvoice({
      type: 'sale',
      category: 'egg',
      items: [
        {
          id: 'i1', description: 'تخم', category: 'egg', unit: 'pcs',
          quantity: 100, unitPrice: 500, total: 50000,
        },
      ],
      total: 50000,
    });

    const id = useTra.getState().addInvoice(inv as any);
    expect(useEgg.getState().sales.length).toBeGreaterThan(0);

    useTra.getState().deleteInvoice(id);
    expect(useEgg.getState().sales.length).toBe(0);
  });

  it('خرید جوجه → delete → گله بدون sourceInvoiceId (باگ قبلی: orphan)', () => {
    const inv = makeInvoice({
      type: 'purchase',
      category: 'chick',
      items: [
        {
          id: 'i1', description: 'جوجه', category: 'chick',
          birdId: 'b1', breedId: 'br1', unit: 'pcs',
          quantity: 100, healthyCount: 95, unitPrice: 10000, total: 950000,
        },
      ],
      total: 950000,
    });

    const id = useTra.getState().addInvoice(inv as any);
    const flocksWithSource = useFlk.getState().flocks.filter((f: any) => f.sourceInvoiceId === id);
    expect(flocksWithSource.length).toBeGreaterThan(0);

    useTra.getState().deleteInvoice(id);
    const orphans = useFlk.getState().flocks.filter((f: any) => f.sourceInvoiceId === id);
    expect(orphans.length).toBe(0);
  });
});

// ═══════════════════════════════════════════════
// INVARIANT 4: currentCount >= 0
// ═══════════════════════════════════════════════
describe('INVARIANT: currentCount >= 0', () => {
  it('پس از delete، گله منفی نیست', () => {
    const inv = makeInvoice({
      type: 'purchase',
      category: 'chick',
      items: [
        {
          id: 'i1', description: 'جوجه', category: 'chick',
          birdId: 'b1', breedId: 'br1', unit: 'pcs',
          quantity: 100, healthyCount: 95, unitPrice: 10000, total: 950000,
        },
      ],
      total: 950000,
    });

    const id = useTra.getState().addInvoice(inv as any);
    useTra.getState().deleteInvoice(id);

    const flocks = useFlk.getState().flocks;
    flocks.forEach((f: any) => {
      expect(f.currentCount ?? 0).toBeGreaterThanOrEqual(0);
    });
  });
});

// ═══════════════════════════════════════════════
// INVARIANT 5: check bounced → paidSum نادیده
// ═══════════════════════════════════════════════
describe('INVARIANT: check bounced → paidSum=0', () => {
  it('چک برگشتی در paidSum حساب نمی‌شه', async () => {
    const { paidSum } = await import('../mod/tra/calc');
    const inv = makeInvoice({
      total: 1000,
      payments: [
        {
          id: 'p1', amount: 1000, method: 'check', status: 'bounced',
          date: '1405/07/01', checkNo: '', bank: '', dueDate: '', notes: '',
        } as any,
      ],
    });
    expect(paidSum(inv.payments)).toBe(0);
  });
});

// ═══════════════════════════════════════════════
// INVARIANT 6: aging از dueDate نه date
// ═══════════════════════════════════════════════
describe('INVARIANT: aging از dueDate (نه invoice age)', () => {
  it('invoice تازه با dueDate گذشته → overdue (نه age)', async () => {
    const { daysUntilDue } = await import('../mod/tra/helpers');
    const inv = makeInvoice({
      date: '1405/07/10',
      dueDate: '1405/07/01',
    });
    const d = daysUntilDue(inv);
    expect(d).not.toBeNull();
    expect(d!).toBeLessThan(0);
  });

  it('invoice قدیمی با dueDate آینده → not overdue', async () => {
    const { daysUntilDue } = await import('../mod/tra/helpers');
    const inv = makeInvoice({
      date: '1404/01/01',
      dueDate: '1405/12/29',
    });
    const d = daysUntilDue(inv);
    expect(d).not.toBeNull();
    expect(d!).toBeGreaterThan(0);
  });
});
