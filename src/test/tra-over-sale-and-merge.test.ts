import { describe, it, expect } from 'vitest';
import { createInvoiceSchema } from '../shr/validation/rules/tra';

describe('Zod: over-sale prevention (ATP)', () => {
  const makeCtx = (flocks: any[], prevInvoice?: any) => ({
    flocks,
    whsItems: [],
    contacts: [],
    invoices: prevInvoice ? [prevInvoice] : [],
    allocations: [],
    isEdit: !!prevInvoice,
    prevInvoice,
  });

  const makeItem = (overrides: any) => ({
    id: 'it-' + Math.random().toString(36).slice(2),
    category: 'chick',
    flockId: 'f1',
    birdId: 'b1',
    breedId: 'br1',
    quantity: 10,
    unitPrice: 1000,
    description: 'X',
    hatchDate: '1405/08/01',
    total: 10000,
    unit: 'pcs',
    itemId: '',
    movementId: '',
    discountType: '',
    discountValue: 0,
    shipping: 0,
    ...overrides,
  });

  const makeSaleInvoice = (items: any[]) => ({
    type: 'sale',
    date: '1405/08/09',
    partyId: 'c1',
    category: 'chick',
    items,
    discount: 0,
    shipping: 0,
    total: items.reduce((s: number, it: any) => s + (Number(it.total) || 0), 0),
    payments: [],
    dueDate: '',
    relatedFlockId: '',
    relatedEntryId: '',
    relatedDealId: '',
    notes: '',
    isPreorder: false,
    deliveryDate: '',
  });

  it('new invoice: qty > currentCount → error', () => {
    const schema = createInvoiceSchema(makeCtx([{ id: 'f1', name: 'A', currentCount: 70 }]) as any);
    const data = makeSaleInvoice([makeItem({ quantity: 80, total: 80000 })]);
    const r = schema.safeParse(data);
    expect(r.success).toBe(false);
    if (!r.success) {
      const msg = r.error.issues.find(i => i.message.includes('بیش از موجودی گله'))?.message;
      expect(msg).toBeTruthy();
      expect(msg).toContain('80');
      expect(msg).toContain('70');
    }
  });

  it('new invoice: qty = currentCount → no ATP error', () => {
    const schema = createInvoiceSchema(makeCtx([{ id: 'f1', name: 'A', currentCount: 70 }]) as any);
    const data = makeSaleInvoice([makeItem({ quantity: 70, total: 70000 })]);
    const r = schema.safeParse(data);
    const overErrors = r.success ? [] : r.error.issues.filter(i => i.message.includes('بیش از موجودی گله'));
    expect(overErrors).toHaveLength(0);
  });

  it('new invoice: qty < currentCount → no ATP error', () => {
    const schema = createInvoiceSchema(makeCtx([{ id: 'f1', name: 'A', currentCount: 70 }]) as any);
    const data = makeSaleInvoice([makeItem({ quantity: 50, total: 50000 })]);
    const r = schema.safeParse(data);
    const overErrors = r.success ? [] : r.error.issues.filter(i => i.message.includes('بیش از موجودی گله'));
    expect(overErrors).toHaveLength(0);
  });

  it('multi-item same flock: sum > currentCount → error', () => {
    const schema = createInvoiceSchema(makeCtx([{ id: 'f1', name: 'A', currentCount: 70 }]) as any);
    const data = makeSaleInvoice([
      makeItem({ quantity: 50, total: 50000 }),
      makeItem({ quantity: 30, total: 30000 }),
    ]);
    const r = schema.safeParse(data);
    expect(r.success).toBe(false);
    if (!r.success) {
      const msg = r.error.issues.find(i => i.message.includes('بیش از موجودی گله'))?.message;
      expect(msg).toBeTruthy();
      expect(msg).toContain('80');
    }
  });

  it('edit invoice: 80 ≤ 70+10 → no ATP error', () => {
    const prevInv = { id: 'i1', type: 'sale', category: 'chick', items: [makeItem({ quantity: 10 })] };
    const schema = createInvoiceSchema(makeCtx([{ id: 'f1', name: 'A', currentCount: 70 }], prevInv) as any);
    const data = { ...makeSaleInvoice([makeItem({ quantity: 80, total: 80000 })]), id: 'i1' };
    const r = schema.safeParse(data);
    const overErrors = r.success ? [] : r.error.issues.filter(i => i.message.includes('بیش از موجودی گله'));
    expect(overErrors).toHaveLength(0);
  });

  it('edit invoice: 90 > 70+10 → error', () => {
    const prevInv = { id: 'i1', type: 'sale', category: 'chick', items: [makeItem({ quantity: 10 })] };
    const schema = createInvoiceSchema(makeCtx([{ id: 'f1', name: 'A', currentCount: 70 }], prevInv) as any);
    const data = { ...makeSaleInvoice([makeItem({ quantity: 90, total: 90000 })]), id: 'i1' };
    const r = schema.safeParse(data);
    expect(r.success).toBe(false);
    if (!r.success) {
      const msg = r.error.issues.find(i => i.message.includes('بیش از موجودی گله'))?.message;
      expect(msg).toBeTruthy();
      expect(msg).toContain('90');
      expect(msg).toContain('80');
    }
  });

  it('stock: sum > currentStock → error', () => {
    const schema = createInvoiceSchema({
      flocks: [],
      whsItems: [{ id: 's1', name: 'Egg', currentStock: 100 }],
      contacts: [], invoices: [], allocations: [], isEdit: false,
    } as any);
    const data = {
      ...makeSaleInvoice([makeItem({
        category: 'egg', flockId: '', hatchId: '', birdId: '', breedId: '',
        stockItemId: 's1', quantity: 150, total: 75000, unit: 'pcs',
      })]),
      category: 'egg',
    };
    const r = schema.safeParse(data);
    expect(r.success).toBe(false);
    if (!r.success) {
      const msg = r.error.issues.find(i => i.message.includes('بیش از موجودی انبار'))?.message;
      expect(msg).toBeTruthy();
      expect(msg).toContain('150');
      expect(msg).toContain('100');
    }
  });
});
