import { describe, it, expect } from 'vitest';
import { createDlgSchema } from '../shr/validation/rules/dlg';

const mkBase = (overrides: any = {}) => ({
  flockId: 'flock-1',
  date: '1400/01/01',
  entryTime: '07:30',
  eatingEggs: 0, fertileEggs: 0, brokenEggs: 0, otherEggs: 0,
  deathsCount: 0, deaths: [], vaccines: [], medications: [],
  weightSamples: [], notes: '',
  ...overrides,
});

describe('Hen-day با femaleCount', () => {
  it('گله sexed: 450 تخم، 500 ماده → 90% → pass', () => {
    const schema = createDlgSchema({
      flockCurrentCount: 1000, flockFemaleCount: 500,
    });
    const r = schema.safeParse(mkBase({ eatingEggs: 450 }));
    expect(r.success).toBe(true);
  });

  it('گله sexed: 600 تخم، 500 ماده → 120% → error', () => {
    const schema = createDlgSchema({
      flockCurrentCount: 1000, flockFemaleCount: 500,
    });
    const r = schema.safeParse(mkBase({ eatingEggs: 600 }));
    expect(r.success).toBe(false);
  });

  it('مرز 102%: 510 تخم، 500 ماده → pass', () => {
    const schema = createDlgSchema({
      flockCurrentCount: 1000, flockFemaleCount: 500,
    });
    const r = schema.safeParse(mkBase({ eatingEggs: 510 }));
    expect(r.success).toBe(true);
  });

  it('مرز 102.2%: 511 تخم، 500 ماده → error', () => {
    const schema = createDlgSchema({
      flockCurrentCount: 1000, flockFemaleCount: 500,
    });
    const r = schema.safeParse(mkBase({ eatingEggs: 511 }));
    expect(r.success).toBe(false);
  });

  it('گله non-sexed: fallback به flockAlive', () => {
    const schema = createDlgSchema({
      flockCurrentCount: 1000, flockFemaleCount: 0,
    });
    const r = schema.safeParse(mkBase({ eatingEggs: 500 }));
    expect(r.success).toBe(true);
  });

  it('بدون context female → fallback', () => {
    const schema = createDlgSchema({ flockCurrentCount: 1000 });
    const r = schema.safeParse(mkBase({ eatingEggs: 1000 }));
    expect(r.success).toBe(true);
  });
});
