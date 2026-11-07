/**
 * calc-weight.test.ts — تست وزن و یکنواختی (Aviagen Ross 308)
 */
import { describe, it, expect } from 'vitest';
import { calculateWeightMetrics } from '../shr/calc/formulas/weight';

describe('calculateWeightMetrics — محاسبه پایه', () => {
  it('میانگین وزن ۵ نمونه ۱ کیلویی → ۱۰۰۰ گرم', () => {
    const r = calculateWeightMetrics({
      samples: [
        { weight: 1.0 },
        { weight: 1.0 },
        { weight: 1.0 },
        { weight: 1.0 },
        { weight: 1.0 },
      ],
      previousAvgWeightG: null,
      ageDays: 20,
      standardWeightG: 1000,
    });
    expect(r.avgWeightG).toBe(1000);
    expect(r.cvPct).toBe(0);  // همه یکسان
    expect(r.uniformityPct).toBe(100);  // همه در بازه
    expect(r.hasData).toBe(true);
  });

  it('CV محاسبه صحیح — نمونه‌های متنوع', () => {
    const r = calculateWeightMetrics({
      samples: [
        { weight: 0.9 },
        { weight: 0.95 },
        { weight: 1.0 },
        { weight: 1.05 },
        { weight: 1.1 },
      ],
      previousAvgWeightG: null,
      ageDays: 20,
      standardWeightG: 1000,
    });
    // mean = 1.0 ; std = 0.0707 ; cv = 7.07٪
    expect(r.avgWeightG).toBe(1000);
    expect(r.cvPct).toBe(7.1);
    expect(r.uniformityPct).toBe(100); // همه در بازه 0.9-1.1
  });

  it('uniformity — بعضی خارج بازه', () => {
    const r = calculateWeightMetrics({
      samples: [
        { weight: 0.7 },   // خارج
        { weight: 0.95 },  // داخل
        { weight: 1.0 },   // داخل
        { weight: 1.05 },  // داخل
        { weight: 1.4 },   // خارج
      ],
      previousAvgWeightG: null,
      ageDays: 20,
      standardWeightG: 1000,
    });
    // mean = 1.02 ; low = 0.918 ; high = 1.122
    // 0.7 خارج، 0.95 داخل، 1.0 داخل، 1.05 داخل، 1.4 خارج
    // uniformity = 3/5 = 60٪
    expect(r.uniformityPct).toBe(60);
    expect(r.uniformityTone).toBe('danger');
  });
});

describe('calculateWeightMetrics — tone CV', () => {
  it('CV < ۱۰٪ → accent', () => {
    const r = calculateWeightMetrics({
      samples: [
        { weight: 0.95 },
        { weight: 0.98 },
        { weight: 1.0 },
        { weight: 1.02 },
        { weight: 1.05 },
      ],
      previousAvgWeightG: null,
      ageDays: 20,
      standardWeightG: 1000,
    });
    expect(r.cvTone).toBe('accent');
  });

  it('CV > ۱۲٪ → danger', () => {
    const r = calculateWeightMetrics({
      samples: [
        { weight: 0.6 },
        { weight: 0.8 },
        { weight: 1.0 },
        { weight: 1.3 },
        { weight: 1.5 },
      ],
      previousAvgWeightG: null,
      ageDays: 20,
      standardWeightG: 1000,
    });
    expect(r.cvPct).toBeGreaterThan(12);
    expect(r.cvTone).toBe('danger');
  });
});

describe('calculateWeightMetrics — ADG', () => {
  it('ADG محاسبه صحیح (۱ روز فاصله)', () => {
    const r = calculateWeightMetrics({
      samples: [
        { weight: 1.0 },
        { weight: 1.0 },
        { weight: 1.0 },
      ],
      previousAvgWeightG: 900,
      ageDays: 20,
      standardWeightG: 1000,
    });
    // avgWeightG = 1000 ; previous 900 → adgG = 100
    expect(r.adgG).toBe(100);
  });

  it('بدون previousAvgWeightG → adgG = ۰', () => {
    const r = calculateWeightMetrics({
      samples: [
        { weight: 1.0 },
        { weight: 1.0 },
        { weight: 1.0 },
      ],
      previousAvgWeightG: null,
      ageDays: 20,
      standardWeightG: 1000,
    });
    expect(r.adgG).toBe(0);
  });
});

describe('calculateWeightMetrics — diff و tone وزن', () => {
  it('وزن در محدوده ±۵٪ → accent', () => {
    const r = calculateWeightMetrics({
      samples: [
        { weight: 1.02 },
        { weight: 1.02 },
        { weight: 1.02 },
      ],
      previousAvgWeightG: null,
      ageDays: 20,
      standardWeightG: 1000,
    });
    // avg = 1020 ; diff = 2٪
    expect(r.weightDiffPct).toBe(2);
    expect(r.weightTone).toBe('accent');
  });

  it('وزن ۵-۱۰٪ پایین‌تر → warn', () => {
    const r = calculateWeightMetrics({
      samples: [
        { weight: 0.92 },
        { weight: 0.92 },
        { weight: 0.92 },
      ],
      previousAvgWeightG: null,
      ageDays: 20,
      standardWeightG: 1000,
    });
    // avg = 920 ; diff = -8٪
    expect(r.weightDiffPct).toBe(-8);
    expect(r.weightTone).toBe('warn');
  });

  it('وزن > ۱۰٪ پایین‌تر → danger', () => {
    const r = calculateWeightMetrics({
      samples: [
        { weight: 0.85 },
        { weight: 0.85 },
        { weight: 0.85 },
      ],
      previousAvgWeightG: null,
      ageDays: 20,
      standardWeightG: 1000,
    });
    // avg = 850 ; diff = -15٪
    expect(r.weightDiffPct).toBe(-15);
    expect(r.weightTone).toBe('danger');
  });
});

describe('calculateWeightMetrics — حالت‌های edge', () => {
  it('نمونه < ۳ → hasData = false', () => {
    const r = calculateWeightMetrics({
      samples: [
        { weight: 1.0 },
        { weight: 1.0 },
      ],
      previousAvgWeightG: null,
      ageDays: 20,
      standardWeightG: 1000,
    });
    expect(r.hasData).toBe(false);
    expect(r.avgWeightG).toBe(0);
  });

  it('بدون استاندارد → tone info', () => {
    const r = calculateWeightMetrics({
      samples: [
        { weight: 1.0 },
        { weight: 1.0 },
        { weight: 1.0 },
      ],
      previousAvgWeightG: null,
      ageDays: 20,
      standardWeightG: null,
    });
    expect(r.weightTone).toBe('info');
    expect(r.weightDiffPct).toBeNull();
  });
});
