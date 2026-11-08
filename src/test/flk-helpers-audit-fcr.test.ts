/**
 * flk-helpers-audit.calculateFCR — FCR اصلاح‌شده
 */
import { describe, it, expect } from 'vitest';
import { calculateFCR } from '../mod/flk/helpers-audit';

const makeConsumption = (totalFeedKg: number): any => ({
  totalFeedKg,
  totalDays: 30,
});

const makeWeightBySex = (avgWeight: number, hasData = true): any => ({
  hasData,
  male: { hasData: false, avg: 0, cv: 0, count: 0 },
  female: { hasData: false, avg: 0, cv: 0, count: 0 },
  mixed: { hasData: true, avg: avgWeight, cv: 5, count: 10 },
});

describe('calculateFCR (helpers-audit) — اصلاح‌شده', () => {
  it('FCR = دان ÷ افزایش وزن (نه وزن زنده)', () => {
    const consumption = makeConsumption(1000);
    const weightBySex = makeWeightBySex(2.5);
    const flock = { currentCount: 1000, unknownCount: 1000, chickWeight: 0.04 };

    const result = calculateFCR(consumption, weightBySex, flock, null);

    expect(result.confidence).toBe('exact');
    expect(result.fcr).toBeCloseTo(0.41, 1);
    expect(result.totalGainKg).toBeCloseTo(2460, 0);
    expect(result.totalLiveWeightKg).toBeCloseTo(2500, 0);
    expect(result.note).toContain('افزایش وزن');
  });

  it('chickWeight null → پیش‌فرض 0.04', () => {
    const consumption = makeConsumption(1000);
    const weightBySex = makeWeightBySex(2.5);
    const flock = { currentCount: 1000, unknownCount: 1000, chickWeight: null };

    const result = calculateFCR(consumption, weightBySex, flock, null);
    expect(result.confidence).toBe('exact');
    expect(result.totalGainKg).toBeCloseTo(2460, 0);
  });

  it('وزن فعلی ≤ وزن اولیه → fcr: null، insufficient', () => {
    const consumption = makeConsumption(100);
    const weightBySex = makeWeightBySex(0.03);
    const flock = { currentCount: 100, unknownCount: 100, chickWeight: 0.04 };

    const result = calculateFCR(consumption, weightBySex, flock, null);
    expect(result.fcr).toBeNull();
    expect(result.confidence).toBe('insufficient');
    expect(result.note).toContain('وزن فعلی کمتر از وزن اولیه');
  });

  it('بدون دان → insufficient', () => {
    const consumption = makeConsumption(0);
    const weightBySex = makeWeightBySex(2.5);
    const flock = { currentCount: 1000, unknownCount: 1000, chickWeight: 0.04 };

    const result = calculateFCR(consumption, weightBySex, flock, null);
    expect(result.fcr).toBeNull();
    expect(result.confidence).toBe('insufficient');
  });

  it('وزن کامل نیست + standard موجود → confidence: standard', () => {
    const consumption = makeConsumption(1000);
    const weightBySex = makeWeightBySex(2.5, false);
    const flock = { currentCount: 1000, unknownCount: 1000, chickWeight: 0.04 };

    const result = calculateFCR(consumption, weightBySex, flock, 1.6);
    expect(result.confidence).toBe('standard');
    expect(result.fcr).toBe(1.6);
  });
});
