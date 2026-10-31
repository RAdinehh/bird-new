/**
 * deal-caps.test.ts — تست‌های L11 برای توابع سقف (ATP)
 * پوشش ۴ تابع: computeGoodsCap, computeDeliveryCap, computeSaleCap, computePaymentCap
 * استاندارد: SAP ATP / Odoo Free Qty
 */
import { describe, it, expect } from 'vitest';
import {
  computeGoodsCap,
  computeDeliveryCap,
  computeSaleCap,
  computePaymentCap,
} from '../mod/tra/caps';
import type { Deal, DealGood, DealDelivery, DealSale, DealPayment } from '../mod/tra/types';

// ═══ Builders ═══
const mkGood = (o: Partial<DealGood> = {}): DealGood => ({
  id: 'g1', name: 'جوجه', quantity: 100, unit: 'pcs', estimatedPrice: 15000,
  category: 'chick', source: 'flock', existingFlockId: 'flock-1', ...o,
});

const mkDeal = (o: Partial<Deal> = {}): Deal => ({
  id: 'd1', type: 'consignment', date: '1405/08/01', partyId: 'p1', description: 'test',
  value: 0, percent: null, dueDate: '', status: 'open', notes: '',
  createdAt: '', updatedAt: '', ...o,
});

const mkDelivery = (o: Partial<DealDelivery> = {}): DealDelivery => ({
  id: 'dv1', goodId: 'g1', date: '1405/08/01', type: 'out', quantity: 0, ...o,
});

const mkSale = (o: Partial<DealSale> = {}): DealSale => ({
  id: 's1', goodId: 'g1', date: '1405/08/01', quantity: 0, unitPrice: 0, ...o,
});

const mkPay = (o: Partial<DealPayment> = {}): DealPayment => ({
  id: 'p1', date: '1405/08/01', amount: 0, direction: 'in', method: 'cash', ...o,
});

// ══════════════════════════════════════════════════════════════════
// computeGoodsCap — ATP
// ══════════════════════════════════════════════════════════════════
describe('computeGoodsCap — ATP', () => {
  it('اولین deal، source خالی → سقف = sourceAvailable', () => {
    const good = mkGood({ quantity: 100 });
    const cap = computeGoodsCap(good, 'd1', [mkDeal({ id: 'd1' })], 185);
    expect(cap).toBe(185);
  });

  it('deal دیگه با همون گله → cap کاهش', () => {
    const good = mkGood({ quantity: 50 });
    const other = mkDeal({ id: 'd2', goods: [mkGood({ id: 'g2', quantity: 100 })], deliveries: [] });
    const cap = computeGoodsCap(good, 'd1', [mkDeal({ id: 'd1' }), other], 185);
    expect(cap).toBe(85);
  });

  it('deal cancelled → نادیده', () => {
    const good = mkGood({ quantity: 50 });
    const other = mkDeal({ id: 'd2', status: 'cancelled', goods: [mkGood({ id: 'g2', quantity: 100 })] });
    const cap = computeGoodsCap(good, 'd1', [mkDeal({ id: 'd1' }), other], 185);
    expect(cap).toBe(185);
  });

  it('deal settled با تحویل کامل → allocation = 0', () => {
    const good = mkGood({ quantity: 50 });
    const other = mkDeal({
      id: 'd2', status: 'settled',
      goods: [mkGood({ id: 'g2', quantity: 100 })],
      deliveries: [mkDelivery({ id: 'dv2', goodId: 'g2', quantity: 100 })],
    });
    const cap = computeGoodsCap(good, 'd1', [mkDeal({ id: 'd1' }), other], 85);
    expect(cap).toBe(85);
  });

  it('deal settled با تحویل جزئی → allocation = باقیمانده', () => {
    const good = mkGood({ quantity: 50 });
    const other = mkDeal({
      id: 'd2', status: 'settled',
      goods: [mkGood({ id: 'g2', quantity: 100 })],
      deliveries: [mkDelivery({ id: 'dv2', goodId: 'g2', quantity: 40 })],
    });
    const cap = computeGoodsCap(good, 'd1', [mkDeal({ id: 'd1' }), other], 185);
    expect(cap).toBe(125);  // 185 - 60 (باقیمانده 100-40)
  });

  it('deal با source متفاوت → نادیده', () => {
    const good = mkGood({ source: 'flock', existingFlockId: 'flock-1' });
    const other = mkDeal({ id: 'd2', goods: [mkGood({ id: 'g2', source: 'hatch', existingFlockId: undefined, hatchId: 'hatch-1' })] });
    const cap = computeGoodsCap(good, 'd1', [mkDeal({ id: 'd1' }), other], 185);
    expect(cap).toBe(185);
  });

  it('deal با category متفاوت → نادیده', () => {
    const good = mkGood({ category: 'chick' });
    const other = mkDeal({ id: 'd2', goods: [mkGood({ id: 'g2', category: 'adult' })] });
    const cap = computeGoodsCap(good, 'd1', [mkDeal({ id: 'd1' }), other], 185);
    expect(cap).toBe(185);
  });

  it('sourceAvailable < otherAllocations → cap = 0 (نه منفی)', () => {
    const good = mkGood({ quantity: 50 });
    const other = mkDeal({ id: 'd2', goods: [mkGood({ id: 'g2', quantity: 200 })] });
    const cap = computeGoodsCap(good, 'd1', [mkDeal({ id: 'd1' }), other], 185);
    expect(cap).toBe(0);
  });

  it('دو good در یک deal → good دوم cap = source - good اول', () => {
    const goodA = mkGood({ id: 'g1', quantity: 100 });
    const goodB = mkGood({ id: 'g2', quantity: 0 });
    const deal = mkDeal({ id: 'd1', goods: [goodA, goodB] });
    const cap = computeGoodsCap(goodB, 'd1', [deal], 185);
    expect(cap).toBe(85);
  });

  it('سه good در یک deal', () => {
    const g1 = mkGood({ id: 'g1', quantity: 100 });
    const g2 = mkGood({ id: 'g2', quantity: 50 });
    const g3 = mkGood({ id: 'g3', quantity: 0 });
    const deal = mkDeal({ id: 'd1', goods: [g1, g2, g3] });
    const cap = computeGoodsCap(g3, 'd1', [deal], 185);
    expect(cap).toBe(35);
  });

  it('منبع undefined → پیش‌فرض flock', () => {
    const good = mkGood({ source: undefined });
    const other = mkDeal({ id: 'd2', goods: [mkGood({ id: 'g2', quantity: 100 })] });
    const cap = computeGoodsCap(good, 'd1', [mkDeal({ id: 'd1' }), other], 185);
    expect(cap).toBe(85);
  });
});

// ══════════════════════════════════════════════════════════════════
// computeDeliveryCap — Free Qty
// ══════════════════════════════════════════════════════════════════
describe('computeDeliveryCap — Free Qty', () => {
  it('بدون تحویل → cap = goods.quantity', () => {
    const good = mkGood({ quantity: 100 });
    const cap = computeDeliveryCap(good, []);
    expect(cap).toBe(100);
  });

  it('یه تحویل → cap کاهش', () => {
    const good = mkGood({ quantity: 100 });
    const cap = computeDeliveryCap(good, [mkDelivery({ goodId: 'g1', quantity: 40 })]);
    expect(cap).toBe(60);
  });

  it('دو تحویل → cap کاهش', () => {
    const good = mkGood({ quantity: 100 });
    const cap = computeDeliveryCap(good, [
      mkDelivery({ id: 'dv1', goodId: 'g1', quantity: 40 }),
      mkDelivery({ id: 'dv2', goodId: 'g1', quantity: 30 }),
    ]);
    expect(cap).toBe(30);
  });

  it('return (برگشت) → cap افزایش', () => {
    const good = mkGood({ quantity: 100 });
    const cap = computeDeliveryCap(good, [
      mkDelivery({ id: 'dv1', goodId: 'g1', quantity: 40, type: 'out' }),
      mkDelivery({ id: 'dv2', goodId: 'g1', quantity: 10, type: 'return' }),
    ]);
    expect(cap).toBe(70);  // 100 - (40 - 10)
  });

  it('loss (ضایعات) → cap افزایش', () => {
    const good = mkGood({ quantity: 100 });
    const cap = computeDeliveryCap(good, [
      mkDelivery({ id: 'dv1', goodId: 'g1', quantity: 40, type: 'out' }),
      mkDelivery({ id: 'dv2', goodId: 'g1', quantity: 5, type: 'loss' }),
    ]);
    expect(cap).toBe(65);  // 100 - (40 - 5)
  });

  it('تحویل بیش از quantity → cap = 0', () => {
    const good = mkGood({ quantity: 50 });
    const cap = computeDeliveryCap(good, [mkDelivery({ goodId: 'g1', quantity: 100 })]);
    expect(cap).toBe(0);
  });
});

// ══════════════════════════════════════════════════════════════════
// computeSaleCap — Delivered Qty
// ══════════════════════════════════════════════════════════════════
describe('computeSaleCap — Delivered Qty', () => {
  it('بدون تحویل، بدون فروش → 0 (تصمیم ۴: بلاک)', () => {
    const cap = computeSaleCap('g1', [], []);
    expect(cap).toBe(0);
  });

  it('تحویل ۱۰۰، بدون فروش → ۱۰۰', () => {
    const cap = computeSaleCap('g1', [mkDelivery({ goodId: 'g1', quantity: 100 })], []);
    expect(cap).toBe(100);
  });

  it('تحویل ۱۰۰، فروش ۳۰ → ۷۰', () => {
    const cap = computeSaleCap(
      'g1',
      [mkDelivery({ goodId: 'g1', quantity: 100 })],
      [mkSale({ goodId: 'g1', quantity: 30 })]
    );
    expect(cap).toBe(70);
  });

  it('تحویل ۱۰۰، دو فروش (۳۰+۴۰) → ۳۰', () => {
    const cap = computeSaleCap(
      'g1',
      [mkDelivery({ goodId: 'g1', quantity: 100 })],
      [
        mkSale({ id: 's1', goodId: 'g1', quantity: 30 }),
        mkSale({ id: 's2', goodId: 'g1', quantity: 40 }),
      ]
    );
    expect(cap).toBe(30);
  });

  it('تحویل ۱۰۰ + return ۲۰ → ۸۰، بدون فروش → ۸۰', () => {
    const cap = computeSaleCap(
      'g1',
      [
        mkDelivery({ id: 'dv1', goodId: 'g1', quantity: 100, type: 'out' }),
        mkDelivery({ id: 'dv2', goodId: 'g1', quantity: 20, type: 'return' }),
      ],
      []
    );
    expect(cap).toBe(80);
  });

  it('فروش از good دیگه → نادیده', () => {
    const cap = computeSaleCap(
      'g1',
      [mkDelivery({ goodId: 'g1', quantity: 100 })],
      [mkSale({ goodId: 'g2', quantity: 30 })]
    );
    expect(cap).toBe(100);
  });

  it('فروش بیش از تحویل → cap = 0', () => {
    const cap = computeSaleCap(
      'g1',
      [mkDelivery({ goodId: 'g1', quantity: 50 })],
      [mkSale({ goodId: 'g1', quantity: 100 })]
    );
    expect(cap).toBe(0);
  });
});

// ══════════════════════════════════════════════════════════════════
// computePaymentCap — Remaining
// ══════════════════════════════════════════════════════════════════
describe('computePaymentCap — Remaining Amount', () => {
  it('بدون پرداخت → cap = myShare', () => {
    expect(computePaymentCap(1_000_000, [])).toBe(1_000_000);
  });

  it('یه پرداخت → cap کاهش', () => {
    const cap = computePaymentCap(1_000_000, [mkPay({ amount: 300_000, direction: 'in' })]);
    expect(cap).toBe(700_000);
  });

  it('دو پرداخت → cap کاهش', () => {
    const cap = computePaymentCap(1_000_000, [
      mkPay({ id: 'p1', amount: 300_000, direction: 'in' }),
      mkPay({ id: 'p2', amount: 200_000, direction: 'in' }),
    ]);
    expect(cap).toBe(500_000);
  });

  it('refund → cap افزایش', () => {
    const cap = computePaymentCap(1_000_000, [
      mkPay({ id: 'p1', amount: 300_000, direction: 'in' }),
      mkPay({ id: 'p2', amount: 100_000, direction: 'in', type: 'refund' } as any),
    ]);
    expect(cap).toBe(800_000);  // 1M - 300K + 100K refund
  });

  it('پرداخت out (به طرف) → نامربوط', () => {
    const cap = computePaymentCap(1_000_000, [mkPay({ amount: 300_000, direction: 'out' })]);
    expect(cap).toBe(1_000_000);
  });

  it('پرداخت بیش از myShare → cap = 0', () => {
    const cap = computePaymentCap(500_000, [mkPay({ amount: 1_000_000, direction: 'in' })]);
    expect(cap).toBe(0);
  });

  it('myShare=0 → cap = 0', () => {
    expect(computePaymentCap(0, [])).toBe(0);
  });
});
