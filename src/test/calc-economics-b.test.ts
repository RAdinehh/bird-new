import { describe, it, expect } from 'vitest';
import { calculateTotalCost } from '../shr/calc/economics/totalCost';
import { calculatePerKgCost } from '../shr/calc/economics/perKgCost';
import { calculatePerEggCost } from '../shr/calc/economics/perEggCost';
import { calculateRevenueFromInvoices, calculateRevenueFromPrices, calculateRevenue } from '../shr/calc/economics/revenue';
import { calculateProfit } from '../shr/calc/economics/profit';
import type { InputInvoice } from '../shr/calc/types';

describe('calculateTotalCost', () => {
  it('جمع همه هزینه‌ها', () => {
    const r = calculateTotalCost({
      feedTotal: 100000000,
      vaccineTotal: 8000000,
      medicationTotal: 12000000,
      litterTotal: 3000000,
      aliveCount: 1000,
    });
    expect(r.totalCost).toBe(123000000);
    expect(r.costPerBird).toBe(123000);
    expect(r.breakdown.feed).toBe(100000000);
  });

  it('با utilities و labor', () => {
    const r = calculateTotalCost({
      feedTotal: 100,
      vaccineTotal: 10,
      medicationTotal: 10,
      litterTotal: 5,
      utilitiesTotal: 20,
      laborTotal: 30,
      aliveCount: 10,
    });
    expect(r.totalCost).toBe(175);
    expect(r.costPerBird).toBe(17.5);
  });

  it('aliveCount = 0 → costPerBird = 0', () => {
    const r = calculateTotalCost({
      feedTotal: 100, vaccineTotal: 0, medicationTotal: 0, litterTotal: 0, aliveCount: 0,
    });
    expect(r.costPerBird).toBe(0);
  });
});

describe('calculatePerKgCost', () => {
  it('وزن و gain معتبر', () => {
    const r = calculatePerKgCost({ totalCost: 100000000, totalLiveWeightKg: 3000, totalGainKg: 2958 });
    expect(r.costPerLiveKg).toBeCloseTo(33333.33, 1);
    expect(r.costPerGainKg).toBeCloseTo(33806.63, 1);
  });

  it('وزن ۰ → null', () => {
    const r = calculatePerKgCost({ totalCost: 100, totalLiveWeightKg: 0, totalGainKg: 0 });
    expect(r.costPerLiveKg).toBeNull();
    expect(r.costPerGainKg).toBeNull();
  });

  it('فقط live weight', () => {
    const r = calculatePerKgCost({ totalCost: 1000, totalLiveWeightKg: 100, totalGainKg: 0 });
    expect(r.costPerLiveKg).toBe(10);
    expect(r.costPerGainKg).toBeNull();
  });
});

describe('calculatePerEggCost', () => {
  it('تخم معتبر', () => {
    const r = calculatePerEggCost({ totalCost: 1000000, totalEggs: 100000 });
    expect(r.costPerEgg).toBe(10);
  });

  it('totalEggs = 0 → null', () => {
    const r = calculatePerEggCost({ totalCost: 1000, totalEggs: 0 });
    expect(r.costPerEgg).toBeNull();
  });
});

describe('calculateRevenueFromInvoices', () => {
  const mkInv = (o: Partial<InputInvoice> = {}): InputInvoice => ({
    id: 'i1', type: 'sale', total: 100000, relatedFlockId: 'A', workflowStatus: 'paid', ...o,
  });

  it('فقط sale معتبر', () => {
    const r = calculateRevenueFromInvoices({
      invoices: [
        mkInv({ id: '1', total: 500000 }),
        mkInv({ id: '2', total: 300000 }),
        mkInv({ id: '3', total: 200000, type: 'purchase' }),
        mkInv({ id: '4', total: 100000, workflowStatus: 'draft' }),
      ],
      flockId: 'A',
    }, 1000);
    expect(r.totalRevenue).toBe(800000);
    expect(r.count).toBe(2);
    expect(r.source).toBe('invoices');
  });

  it('includeDraft = true → draft هم حساب', () => {
    const r = calculateRevenueFromInvoices({
      invoices: [mkInv({ total: 500000 }), mkInv({ total: 100000, workflowStatus: 'draft' })],
      flockId: 'A',
      includeDraft: true,
    }, 1000);
    expect(r.totalRevenue).toBe(600000);
    expect(r.count).toBe(2);
  });

  it('flockId نادرست → صفر', () => {
    const r = calculateRevenueFromInvoices({
      invoices: [mkInv({ relatedFlockId: 'B' })],
      flockId: 'A',
    }, 1000);
    expect(r.totalRevenue).toBe(0);
    expect(r.source).toBe('none');
  });
});

describe('calculateRevenueFromPrices', () => {
  it('گوشتی: وزن × قیمت', () => {
    const r = calculateRevenueFromPrices({ liveWeightKg: 3000, pricePerKg: 100000 }, 1000);
    expect(r.totalRevenue).toBe(300000000);
    expect(r.revenuePerBird).toBe(300000);
    expect(r.source).toBe('prices');
  });

  it('تخم‌گذار: تخم × قیمت', () => {
    const r = calculateRevenueFromPrices({ eggsCount: 200000, pricePerEgg: 5000 }, 1000);
    expect(r.totalRevenue).toBe(1000000000);
  });

  it('مرغ حذفی', () => {
    const r = calculateRevenueFromPrices({ culledCount: 50, culledPrice: 50000 }, 1000);
    expect(r.totalRevenue).toBe(2500000);
  });
});

describe('calculateRevenue (hybrid)', () => {
  it('فاکتور هست → از فاکتور', () => {
    const r = calculateRevenue(
      { invoices: [{ id: '1', type: 'sale', total: 500000, relatedFlockId: 'A', workflowStatus: 'paid' }], flockId: 'A' },
      { liveWeightKg: 3000, pricePerKg: 100000 },
      1000,
    );
    expect(r.source).toBe('invoices');
    expect(r.totalRevenue).toBe(500000);
  });

  it('فاکتور نیست → از prices', () => {
    const r = calculateRevenue(
      { invoices: [], flockId: 'A' },
      { liveWeightKg: 3000, pricePerKg: 100000 },
      1000,
    );
    expect(r.source).toBe('prices');
  });
});

describe('calculateProfit', () => {
  it('سود مثبت', () => {
    const r = calculateProfit({ revenue: 300000000, totalCost: 200000000, aliveCount: 1000 });
    expect(r.profit).toBe(100000000);
    expect(r.profitPerBird).toBe(100000);
    expect(r.revenueToCostRatio).toBe(1.5);
    expect(r.marginPct).toBe(33.3);
  });

  it('سود منفی (ضرر)', () => {
    const r = calculateProfit({ revenue: 100000000, totalCost: 200000000, aliveCount: 1000 });
    expect(r.profit).toBe(-100000000);
    expect(r.revenueToCostRatio).toBe(0.5);
    expect(r.marginPct).toBe(-100);
  });

  it('هر دو صفر → hasData = false', () => {
    const r = calculateProfit({ revenue: 0, totalCost: 0, aliveCount: 1000 });
    expect(r.hasData).toBe(false);
  });
});
