import { describe, it, expect } from 'vitest';
import { calculateStockingDensity } from '../shr/calc/formulas/stocking';

describe('calculateStockingDensity — محاسبه پایه', () => {
  it('۱۰۰۰ پرنده در ۱۰۰ m² → ۱۰ bird/m²', () => {
    const r = calculateStockingDensity({
      aliveCount: 1000,
      hallAreaSqM: 100,
      standardDensityMax: 12,
    });
    expect(r.densityBirdPerSqM).toBe(10);
    expect(r.tone).toBe('accent');
    expect(r.warning).toBeNull();
  });

  it('تراکم نزدیک به استاندارد → accent', () => {
    const r = calculateStockingDensity({
      aliveCount: 1200,
      hallAreaSqM: 100,
      standardDensityMax: 12,
    });
    // density = 12 ; ratio = 1.0 → accent
    expect(r.densityBirdPerSqM).toBe(12);
    expect(r.tone).toBe('accent');
  });

  it('تراکم ۵-۱۰٪ بیشتر → warn', () => {
    const r = calculateStockingDensity({
      aliveCount: 1300,
      hallAreaSqM: 100,
      standardDensityMax: 12,
    });
    // density = 13 ; ratio = 1.083 → warn
    expect(r.densityBirdPerSqM).toBe(13);
    expect(r.tone).toBe('warn');
    expect(r.warning).toContain('بیش از حد');
  });

  it('تراکم > ۱.۵ برابر → danger + هشدار شدید', () => {
    const r = calculateStockingDensity({
      aliveCount: 1900,
      hallAreaSqM: 100,
      standardDensityMax: 12,
    });
    // density = 19 ; ratio = 1.58 → danger
    expect(r.densityBirdPerSqM).toBe(19);
    expect(r.tone).toBe('danger');
    expect(r.warning).toContain('خطرناک');
  });
});

describe('calculateStockingDensity — edge', () => {
  it('hallArea = 0 → density = 0، tone info', () => {
    const r = calculateStockingDensity({
      aliveCount: 1000,
      hallAreaSqM: 0,
      standardDensityMax: 12,
    });
    expect(r.densityBirdPerSqM).toBe(0);
    expect(r.tone).toBe('info');
  });

  it('بدون استاندارد → tone info', () => {
    const r = calculateStockingDensity({
      aliveCount: 1000,
      hallAreaSqM: 100,
      standardDensityMax: null,
    });
    expect(r.densityBirdPerSqM).toBe(10);
    expect(r.tone).toBe('info');
  });
});
