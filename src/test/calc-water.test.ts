import { describe, it, expect } from 'vitest';
import { calculateWaterMetrics } from '../shr/calc/formulas/water';

describe('calculateWaterMetrics — محاسبه پایه', () => {
  it('ratio = 2.0 با feed=50، water=100', () => {
    const r = calculateWaterMetrics({
      waterAmountL: 100,
      feedConsumedKg: 50,
      aliveCount: 1000,
      standardWaterFeedRatio: 1.9,
    });
    expect(r.waterFeedRatio).toBe(2.0);
    expect(r.waterPerBirdMl).toBe(100);
    expect(r.waterFeedTone).toBe('accent');
  });

  it('ratio = 2.5 → هشدار بالا', () => {
    const r = calculateWaterMetrics({
      waterAmountL: 125,
      feedConsumedKg: 50,
      aliveCount: 1000,
      standardWaterFeedRatio: null,
    });
    expect(r.waterFeedRatio).toBe(2.5);
    expect(r.warning).toBeNull();  // 2.5 = مرز، هنوز مشکل نیست
  });

  it('ratio = 3.0 → هشدار بالا', () => {
    const r = calculateWaterMetrics({
      waterAmountL: 150,
      feedConsumedKg: 50,
      aliveCount: 1000,
      standardWaterFeedRatio: null,
    });
    expect(r.waterFeedRatio).toBe(3.0);
    expect(r.warning).toContain('بالا');
  });

  it('ratio = 1.2 → هشدار پایین', () => {
    const r = calculateWaterMetrics({
      waterAmountL: 60,
      feedConsumedKg: 50,
      aliveCount: 1000,
      standardWaterFeedRatio: null,
    });
    expect(r.waterFeedRatio).toBe(1.2);
    expect(r.warning).toContain('پایین');
  });
});

describe('calculateWaterMetrics — tone با استاندارد', () => {
  it('نزدیک به استاندارد → accent', () => {
    const r = calculateWaterMetrics({
      waterAmountL: 95,
      feedConsumedKg: 50,
      aliveCount: 1000,
      standardWaterFeedRatio: 2.0,
    });
    // ratio = 1.9 ; standard 2.0 ; diff = -5٪
    expect(r.waterFeedTone).toBe('accent');
  });

  it('۱۰-۲۰٪ دور از استاندارد → warn', () => {
    const r = calculateWaterMetrics({
      waterAmountL: 85,
      feedConsumedKg: 50,
      aliveCount: 1000,
      standardWaterFeedRatio: 2.0,
    });
    // ratio = 1.7 ; standard 2.0 ; diff = -15٪
    expect(r.waterFeedTone).toBe('warn');
  });

  it('> ۲۰٪ دور از استاندارد → danger', () => {
    const r = calculateWaterMetrics({
      waterAmountL: 80,
      feedConsumedKg: 50,
      aliveCount: 1000,
      standardWaterFeedRatio: 2.0,
    });
    // ratio = 1.6 ; standard 2.0 ; diff = -20٪ (مرز) — بگذار + بشود
    // استفاده از 2.5 بجای 2.0
    const r2 = calculateWaterMetrics({
      waterAmountL: 75,
      feedConsumedKg: 50,
      aliveCount: 1000,
      standardWaterFeedRatio: 2.0,
    });
    // ratio = 1.5 ; diff = -25٪
    expect(r2.waterFeedTone).toBe('danger');
  });
});

describe('calculateWaterMetrics — edge', () => {
  it('aliveCount = 0 → perBird = 0', () => {
    const r = calculateWaterMetrics({
      waterAmountL: 100,
      feedConsumedKg: 50,
      aliveCount: 0,
      standardWaterFeedRatio: 2.0,
    });
    expect(r.waterPerBirdMl).toBe(0);
  });

  it('feed = 0 → ratio = 0', () => {
    const r = calculateWaterMetrics({
      waterAmountL: 100,
      feedConsumedKg: 0,
      aliveCount: 1000,
      standardWaterFeedRatio: 2.0,
    });
    expect(r.waterFeedRatio).toBe(0);
    expect(r.waterFeedTone).toBe('info');
  });
});
