/**
 * calc-thresholds.test.ts — تست getThresholds از standards
 */
import { describe, it, expect } from 'vitest';
import { getThresholds } from '../shr/calc/thresholds';

describe('getThresholds — Ross 308 (گوشتی)', () => {
  const ctx = {
    breedId: 'ross-308',
    flockType: 'broiler' as const,
    ageDays: 21,
    aliveCount: 1000,
    initialCount: 1000,
  };

  it('temp موجود و در بازه معقول', () => {
    const t = getThresholds(ctx);
    expect(t.temp).not.toBeNull();
    expect(t.temp!.min).toBeGreaterThanOrEqual(15);
    expect(t.temp!.max).toBeLessThanOrEqual(36);
    expect(t.temp!.target).toBeGreaterThanOrEqual(t.temp!.min);
    expect(t.temp!.target).toBeLessThanOrEqual(t.temp!.max);
  });

  it('humidity موجود', () => {
    const t = getThresholds(ctx);
    expect(t.humidity).not.toBeNull();
  });

  it('fcr موجود و معقول (۰.۵-۲.۵)', () => {
    const t = getThresholds(ctx);
    expect(t.fcr).not.toBeNull();
    expect(t.fcr!).toBeGreaterThan(0.5);
    expect(t.fcr!).toBeLessThan(2.5);
  });

  it('adgG > 0', () => {
    const t = getThresholds(ctx);
    expect(t.adgG).not.toBeNull();
    expect(t.adgG!).toBeGreaterThan(0);
  });

  it('mortality موجود و همه سه بخش مثبت', () => {
    const t = getThresholds(ctx);
    expect(t.mortality).not.toBeNull();
    expect(t.mortality!.dailyPct).toBeGreaterThan(0);
    expect(t.mortality!.weeklyPct).toBeGreaterThan(0);
    expect(t.mortality!.totalPct).toBeGreaterThan(0);
  });

  it('weeklyPct ≈ dailyPct × 5', () => {
    const t = getThresholds(ctx);
    const expected = Math.round(t.mortality!.dailyPct * 5 * 100) / 100;
    expect(t.mortality!.weeklyPct).toBe(expected);
  });

  it('density موجود', () => {
    const t = getThresholds(ctx);
    expect(t.densityBirdPerSqM).not.toBeNull();
    expect(t.densityBirdPerSqM!).toBeGreaterThan(0);
  });

  it('cvPct = ۱۲ (عمومی)', () => {
    const t = getThresholds(ctx);
    expect(t.cvPct).toBe(12);
  });

  it('uniformityPct = ۷۰ (عمومی)', () => {
    const t = getThresholds(ctx);
    expect(t.uniformityPct).toBe(70);
  });

  it('waterFeedRatio = { min:1.5, max:2.5 }', () => {
    const t = getThresholds(ctx);
    expect(t.waterFeedRatio).toEqual({ min: 1.5, max: 2.5 });
  });

  it('henDayPct = null (گوشتی)', () => {
    const t = getThresholds(ctx);
    expect(t.henDayPct).toBeNull();
  });
});

describe('getThresholds — Hy-Line W36 (تخم‌گذار)', () => {
  const ctx = {
    breedId: 'hy-line-w36',
    flockType: 'layer' as const,
    ageDays: 140,
    aliveCount: 1000,
    initialCount: 1000,
  };

  it('henDayPct موجود (تخم‌گذار)', () => {
    const t = getThresholds(ctx);
    expect(t.henDayPct).not.toBeNull();
    expect(t.henDayPct!).toBeGreaterThan(50);
    expect(t.henDayPct!).toBeLessThanOrEqual(100);
  });

  it('henHousedPct کمتر از henDayPct', () => {
    const t = getThresholds(ctx);
    expect(t.henHousedPct).not.toBeNull();
    expect(t.henHousedPct!).toBeLessThan(t.henDayPct!);
  });

  it('eggWeightG معقول (۴۰-۱۰۰)', () => {
    const t = getThresholds(ctx);
    expect(t.eggWeightG).not.toBeNull();
    expect(t.eggWeightG!).toBeGreaterThan(40);
    expect(t.eggWeightG!).toBeLessThan(100);
  });
});

describe('getThresholds — نژاد ناشناخته', () => {
  it('breedId نامعتبر → همه null', () => {
    const t = getThresholds({
      breedId: 'unknown-breed-xyz-12345',
      flockType: 'broiler',
      ageDays: 21,
      aliveCount: 1000,
      initialCount: 1000,
    });
    expect(t.temp).toBeNull();
    expect(t.fcr).toBeNull();
    expect(t.mortality).toBeNull();
    expect(t.henDayPct).toBeNull();
    expect(t.cvPct).toBeNull();
  });
});
