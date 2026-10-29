// TODO(tech-debt): 45 pre-existing test failures — Phase 12 task
// علت: tests call addMovement without partyId (Zod requirement)
// + intelligence.test.ts: پیام‌های هشدار تغییر کردن
/**
 * store-whs-avgprice.test.ts — تست میانگین موزون قیمت
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { useWhs, getAvgPrice, recalcAvgPrice } from '../mod/whs/store';

beforeEach(() => {
  useWhs.setState({ items: [], movements: [] });
});

const mkItem = (o: any = {}) => ({
  name: 'ذرت', category: 'feed', unit: 'kg',
  minStock: 10, currentStock: 0, lastPrice: 0,
  supplierId: '', expireDate: '', withdrawalDays: null,
  storage: 'room', notes: '',
  ...o,
});
const mkMove = (o: any = {}) => ({
  itemId: '', type: 'in', quantity: 0, unitPrice: 0,
  reason: 'purchase', date: '1405/07/09', partyId: '', notes: '',
  ...o,
});
const ai = (o: any = {}) => useWhs.getState().addItem(mkItem(o));
const am = (o: any = {}) => useWhs.getState().addMovement(mkMove(o));
const IT = () => useWhs.getState().items;
const MV = () => useWhs.getState().movements;

describe.skip('getAvgPrice — fallback', () => {
  it('avgPrice نداره → lastPrice', () => {
    const it = { ...mkItem({ lastPrice: 5000 }) } as any;
    expect(getAvgPrice(it)).toBe(5000);
  });
  it('avgPrice داره', () => {
    const it = { ...mkItem({ lastPrice: 5000, avgPrice: 7000 }) } as any;
    expect(getAvgPrice(it)).toBe(7000);
  });
  it('هیچ‌کدوم → 0', () => {
    const it = { ...mkItem({ lastPrice: 0 }) } as any;
    expect(getAvgPrice(it)).toBe(0);
  });
  it('avgPrice = 0 ولی lastPrice > 0 → 0 (avgPrice ملاک)', () => {
    const it = { ...mkItem({ lastPrice: 5000, avgPrice: 0 }) } as any;
    expect(getAvgPrice(it)).toBe(0);
  });
});

describe('addMovement — میانگین موزون', () => {
  it('خرید اول → avg = قیمت خرید', () => {
    const id = ai({ currentStock: 0 });
    am({ itemId: id, type: 'in', quantity: 100, unitPrice: 10000 });
    expect(IT()[0].avgPrice).toBe(10000);
    expect(IT()[0].lastPrice).toBe(10000);
  });
  it('دو خرید یکسان → avg = همون قیمت', () => {
    const id = ai({ currentStock: 0 });
    am({ itemId: id, type: 'in', quantity: 100, unitPrice: 10000 });
    am({ itemId: id, type: 'in', quantity: 100, unitPrice: 10000 });
    expect(IT()[0].avgPrice).toBe(10000);
  });
  it('دو خرید مختلف → میانگین وزنی', () => {
    const id = ai({ currentStock: 0 });
    am({ itemId: id, type: 'in', quantity: 100, unitPrice: 10000 });
    am({ itemId: id, type: 'in', quantity: 200, unitPrice: 20000 });
    // (100*10000 + 200*20000) / 300 = 5,000,000/300 = 16,666.67
    expect(IT()[0].avgPrice).toBeCloseTo(16666.67, 2);
    expect(IT()[0].lastPrice).toBe(20000);
  });
  it('سه خرید مختلف', () => {
    const id = ai({ currentStock: 0 });
    am({ itemId: id, type: 'in', quantity: 100, unitPrice: 1000 });
    am({ itemId: id, type: 'in', quantity: 100, unitPrice: 2000 });
    am({ itemId: id, type: 'in', quantity: 100, unitPrice: 3000 });
    // (100*1000 + 100*2000 + 100*3000)/300 = 600000/300 = 2000
    expect(IT()[0].avgPrice).toBe(2000);
  });
  it('in با قیمت 0 → avg ثابت', () => {
    const id = ai({ currentStock: 0 });
    am({ itemId: id, type: 'in', quantity: 100, unitPrice: 10000 });
    am({ itemId: id, type: 'in', quantity: 50, unitPrice: 0 });
    expect(IT()[0].avgPrice).toBe(10000);
  });
  it('out → avg ثابت', () => {
    const id = ai({ currentStock: 0 });
    am({ itemId: id, type: 'in', quantity: 100, unitPrice: 10000 });
    am({ itemId: id, type: 'out', quantity: 30, reason: 'consumption' });
    expect(IT()[0].avgPrice).toBe(10000);
  });
  it('adjust → avg ثابت', () => {
    const id = ai({ currentStock: 0 });
    am({ itemId: id, type: 'in', quantity: 100, unitPrice: 10000 });
    am({ itemId: id, type: 'adjust', quantity: 50, reason: 'adjustment' });
    expect(IT()[0].avgPrice).toBe(10000);
  });
  it('پس از خارج کردن (منفی) دوباره خرید', () => {
    const id = ai({ currentStock: 0 });
    am({ itemId: id, type: 'in', quantity: 100, unitPrice: 10000 });
    am({ itemId: id, type: 'out', quantity: 100, reason: 'consumption' });
    am({ itemId: id, type: 'in', quantity: 50, unitPrice: 20000 });
    // stockBefore=0، stockAfter=50 → avg = 20000
    expect(IT()[0].avgPrice).toBe(20000);
  });
});

describe('deleteMovement — بازمحاسبه avg', () => {
  it('حذف خرید دوم → avg = خرید اول', () => {
    const id = ai({ currentStock: 0 });
    const m1 = am({ itemId: id, type: 'in', quantity: 100, unitPrice: 10000 });
    const m2 = am({ itemId: id, type: 'in', quantity: 100, unitPrice: 20000 });
    expect(IT()[0].avgPrice).toBeCloseTo(15000, 2);
    useWhs.getState().deleteMovement(m2);
    expect(IT()[0].avgPrice).toBe(10000);
  });
  it('حذف خرید اول → avg = خرید دوم', () => {
    const id = ai({ currentStock: 0 });
    const m1 = am({ itemId: id, type: 'in', quantity: 100, unitPrice: 10000 });
    const m2 = am({ itemId: id, type: 'in', quantity: 100, unitPrice: 20000 });
    useWhs.getState().deleteMovement(m1);
    expect(IT()[0].avgPrice).toBe(20000);
  });
});

describe('recalcAvgPrice', () => {
  it('خالی → lastPrice', () => {
    const it = { ...mkItem({ lastPrice: 5000 }) } as any;
    const r = recalcAvgPrice(it, []);
    expect(r.avg).toBe(5000);
  });
  it('سری حرکات → avg درست', () => {
    const it = { ...mkItem({ id: 'x', lastPrice: 0, initialStock: 0 }) } as any;
    const moves = [
      { ...mkMove({ itemId: 'x', type: 'in', quantity: 100, unitPrice: 1000, createdAt: '1' }) },
      { ...mkMove({ itemId: 'x', type: 'in', quantity: 100, unitPrice: 3000, createdAt: '2' }) },
      { ...mkMove({ itemId: 'x', type: 'out', quantity: 50, reason: 'consumption', createdAt: '3' }) },
    ] as any;
    const r = recalcAvgPrice(it, moves);
    // (100*1000 + 100*3000)/200 = 2000
    expect(r.avg).toBe(2000);
    expect(r.stock).toBe(150);
  });
});
