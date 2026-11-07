import { describe, it, expect } from 'vitest';
import { calculateEPEF } from '../shr/calc/formulas/epef';

describe('calculateEPEF — محاسبه پایه', () => {
  it('EPEF = 452 (مثال استاندارد)', () => {
    const r = calculateEPEF({
      livabilityPct: 95,
      finalWeightKg: 3.0,
      ageDays: 42,
      fcr: 1.5,
    });
    // (95 × 3 × 100) / (42 × 1.5) = 28500 / 63 = 452.38
    expect(r.epef).toBe(452.4);
    expect(r.tone).toBe('accent');
  });

  it('EPEF = 350 → مرز warn/accent → accent', () => {
    const r = calculateEPEF({
      livabilityPct: 95,
      finalWeightKg: 2.5,
      ageDays: 42,
      fcr: 1.61,
    });
    // (95 × 2.5 × 100) / (42 × 1.61) ≈ 351
    expect(r.epef).toBeGreaterThanOrEqual(350);
    expect(r.tone).toBe('accent');
  });

  it('EPEF = 300-350 → warn', () => {
    const r = calculateEPEF({
      livabilityPct: 92,
      finalWeightKg: 2.5,
      ageDays: 42,
      fcr: 1.7,
    });
    // (92 × 2.5 × 100) / (42 × 1.7) ≈ 322
    expect(r.epef).toBeGreaterThan(300);
    expect(r.epef).toBeLessThan(350);
    expect(r.tone).toBe('warn');
  });

  it('EPEF < 300 → danger', () => {
    const r = calculateEPEF({
      livabilityPct: 88,
      finalWeightKg: 2.2,
      ageDays: 42,
      fcr: 1.9,
    });
    // (88 × 2.2 × 100) / (42 × 1.9) ≈ 242
    expect(r.epef).toBeLessThan(300);
    expect(r.tone).toBe('danger');
  });
});

describe('calculateEPEF — edge', () => {
  it('ageDays = 0 → epef = 0، tone info', () => {
    const r = calculateEPEF({
      livabilityPct: 95,
      finalWeightKg: 3.0,
      ageDays: 0,
      fcr: 1.5,
    });
    expect(r.epef).toBe(0);
    expect(r.tone).toBe('info');
  });

  it('fcr = 0 → epef = 0', () => {
    const r = calculateEPEF({
      livabilityPct: 95,
      finalWeightKg: 3.0,
      ageDays: 42,
      fcr: 0,
    });
    expect(r.epef).toBe(0);
    expect(r.tone).toBe('info');
  });

  it('finalWeight = 0 → epef = 0', () => {
    const r = calculateEPEF({
      livabilityPct: 95,
      finalWeightKg: 0,
      ageDays: 42,
      fcr: 1.5,
    });
    expect(r.epef).toBe(0);
  });
});
