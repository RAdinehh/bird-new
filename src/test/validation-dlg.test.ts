import { describe, it, expect } from 'vitest';
import { createDlgSchema } from '../shr/validation/rules/dlg';

const mkBase = (overrides: any = {}) => ({
  flockId: 'flock-1',
  date: '1400/01/01',
  entryTime: '07:30',
  eatingEggs: 0,
  fertileEggs: 0,
  brokenEggs: 0,
  otherEggs: 0,
  brokenTarget: 'consumption',
  otherTarget: 'consumption',
  deathsCount: 0,
  deaths: [],
  vaccines: [],
  medications: [],
  weightSamples: [],
  activities: [],
  notes: '',
  ...overrides,
});

describe('createDlgSchema — baseline', () => {
  it('فرم معتبر خالی → پاس', () => {
    const schema = createDlgSchema();
    const r = schema.safeParse(mkBase());
    if (!r.success) console.log(r.error.issues);
    expect(r.success).toBe(true);
  });

  it('flockId خالی → error', () => {
    const schema = createDlgSchema();
    const r = schema.safeParse(mkBase({ flockId: '' }));
    expect(r.success).toBe(false);
  });

  it('tempMin > tempMax → error', () => {
    const schema = createDlgSchema();
    const r = schema.safeParse(mkBase({ temperatureMin: 25, temperatureMax: 20 }));
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues.some(i => i.path.includes('temperatureMin'))).toBe(true);
    }
  });

  it('humidityMin > humidityMax → error', () => {
    const schema = createDlgSchema();
    const r = schema.safeParse(mkBase({ humidityMin: 80, humidityMax: 50 }));
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues.some(i => i.path.includes('humidityMin'))).toBe(true);
    }
  });

  it('مجموع deaths ≠ deathsCount → error', () => {
    const schema = createDlgSchema();
    const r = schema.safeParse(mkBase({
      deathsCount: 5,
      deaths: [{ id: 'd1', count: 3, cause: '', notes: '' }],
    }));
    expect(r.success).toBe(false);
  });

  it('مجموع deaths = deathsCount → pass', () => {
    const schema = createDlgSchema();
    const r = schema.safeParse(mkBase({
      deathsCount: 5,
      deaths: [
        { id: 'd1', count: 2, cause: '', notes: '' },
        { id: 'd2', count: 3, cause: '', notes: '' },
      ],
    }));
    expect(r.success).toBe(true);
  });

  it('واکسن از انبار با quantity=0 → error', () => {
    const schema = createDlgSchema();
    const r = schema.safeParse(mkBase({
      vaccines: [{ id: 'v1', itemId: 'item-1', quantity: 0, name: 'نیوکاسل' }],
    }));
    expect(r.success).toBe(false);
  });

  it('واکسن از انبار با quantity>0 → pass', () => {
    const schema = createDlgSchema();
    const r = schema.safeParse(mkBase({
      vaccines: [{ id: 'v1', itemId: 'item-1', quantity: 100, name: 'نیوکاسل' }],
    }));
    expect(r.success).toBe(true);
  });

  it('دارو از انبار با quantity=0 → error', () => {
    const schema = createDlgSchema();
    const r = schema.safeParse(mkBase({
      medications: [{ id: 'm1', itemId: 'item-2', quantity: 0 }],
    }));
    expect(r.success).toBe(false);
  });

  it('وزن نمونه < 0.02 kg → error', () => {
    const schema = createDlgSchema();
    const r = schema.safeParse(mkBase({
      weightSamples: [{ id: 'w1', weight: 0.01 }],
    }));
    expect(r.success).toBe(false);
  });

  it('وزن نمونه > 5 kg → error', () => {
    const schema = createDlgSchema();
    const r = schema.safeParse(mkBase({
      weightSamples: [{ id: 'w1', weight: 6 }],
    }));
    expect(r.success).toBe(false);
  });

  it('وزن نمونه معتبر (1 kg) → pass', () => {
    const schema = createDlgSchema();
    const r = schema.safeParse(mkBase({
      weightSamples: [{ id: 'w1', weight: 1 }],
    }));
    expect(r.success).toBe(true);
  });
});

describe('createDlgSchema — با context', () => {
  it('deathsCount > flockAlive → error', () => {
    const schema = createDlgSchema({ flockCurrentCount: 100 });
    const r = schema.safeParse(mkBase({
      deathsCount: 150,
      deaths: [{ id: 'd1', count: 150, cause: '', notes: '' }],
    }));
    expect(r.success).toBe(false);
  });

  it('deathsCount ≤ flockAlive → pass', () => {
    const schema = createDlgSchema({ flockCurrentCount: 1000 });
    const r = schema.safeParse(mkBase({
      deathsCount: 50,
      deaths: [{ id: 'd1', count: 50, cause: '', notes: '' }],
    }));
    expect(r.success).toBe(true);
  });

  it('hen-day > 102% → error', () => {
    const schema = createDlgSchema({ flockCurrentCount: 100 });
    const r = schema.safeParse(mkBase({ eatingEggs: 110 }));
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(r.error.issues.some(i => i.path.includes('eatingEggs'))).toBe(true);
    }
  });

  it('hen-day ≤ 102% → pass', () => {
    const schema = createDlgSchema({ flockCurrentCount: 100 });
    const r = schema.safeParse(mkBase({ eatingEggs: 100 }));
    expect(r.success).toBe(true);
  });
});
