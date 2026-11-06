import { describe, it, expect } from 'vitest';
import { SEX_AUDIT_META, formatSexDelta } from '../mod/flk/helpers-audit';

describe('SEX_AUDIT_META — همه typeها پوشش داده شده', () => {
  it('۸ type اصلی با icon و label', () => {
    const types = ['sexing', 'death', 'sale', 'return', 'correction', 'merge', 'unmerge', 'pre_sexing_observation'] as const;
    for (const t of types) {
      expect(SEX_AUDIT_META[t]).toBeDefined();
      expect(SEX_AUDIT_META[t].icon).toBeTruthy();
      expect(SEX_AUDIT_META[t].label).toBeTruthy();
      expect(SEX_AUDIT_META[t].tone).toMatch(/^var\(--/);
    }
  });
});

describe('formatSexDelta — متن کوتاه', () => {
  it('male only', () => {
    expect(formatSexDelta({ male: -10, female: 0, unknown: 0 })).toBe('♂ -10');
  });
  it('mixed', () => {
    expect(formatSexDelta({ male: 5, female: -3, unknown: 0 })).toBe('♂ +5 · ♀ -3');
  });
  it('zero → خالی', () => {
    expect(formatSexDelta({ male: 0, female: 0, unknown: 0 })).toBe('');
  });
  it('all three', () => {
    expect(formatSexDelta({ male: -1, female: 2, unknown: 3 })).toBe('♂ -1 · ♀ +2 · ? +3');
  });
});

// ═════════════════════════════════════════════════════════════
// فاز ۷.۲ — aggregateDeathsBySex + toneFromRate
// ═════════════════════════════════════════════════════════════
import { aggregateDeathsBySex, toneFromRate } from '../mod/flk/helpers-audit';

const makeEv = (type: any, deltaM: number, deltaF: number, deltaU: number) => ({
  id: 'e-' + Math.random(),
  type,
  date: '1405/08/01',
  before: { male: 50, female: 50, unknown: 0 },
  after: { male: 50 + deltaM, female: 50 + deltaF, unknown: deltaU },
  delta: { male: deltaM, female: deltaF, unknown: deltaU },
  createdAt: '2026-01-01',
});

describe('aggregateDeathsBySex', () => {
  it('بدون sexBalanceEvents → hasData=false', () => {
    const r = aggregateDeathsBySex(undefined, 50, 50);
    expect(r.hasData).toBe(true); // initial موجود است، ولی deaths=0
    expect(r.male.deaths).toBe(0);
    expect(r.female.deaths).toBe(0);
  });

  it('بدون initialMale/Female → hasData=false', () => {
    const r = aggregateDeathsBySex([makeEv('death', -10, 0, 0)], 0, 0);
    expect(r.hasData).toBe(false);
  });

  it('male death -10 با initial=50 → rate=20٪', () => {
    const r = aggregateDeathsBySex([makeEv('death', -10, 0, 0)], 50, 50);
    expect(r.male.deaths).toBe(10);
    expect(r.male.rate).toBe(20);
    expect(r.female.deaths).toBe(0);
  });

  it('چند death event → جمع درست', () => {
    const r = aggregateDeathsBySex([
      makeEv('death', -5, 0, 0),
      makeEv('death', -3, -2, 0),
      makeEv('death', 0, -1, 0),
    ], 50, 50);
    expect(r.male.deaths).toBe(8);
    expect(r.female.deaths).toBe(3);
  });

  it('type=sale → حساب نمی‌شود', () => {
    const r = aggregateDeathsBySex([
      makeEv('death', -10, 0, 0),
      makeEv('sale', -20, -20, 0),
    ], 50, 50);
    expect(r.male.deaths).toBe(10); // فقط death، نه sale
  });

  it('delta مثبت (add) → نادیده', () => {
    const r = aggregateDeathsBySex([
      makeEv('death', -10, 0, 0),
      makeEv('death', 5, 0, 0), // غیرمعمول ولی نادیده
    ], 50, 50);
    expect(r.male.deaths).toBe(10);
  });

  it('unknown deaths جمع جدا', () => {
    const r = aggregateDeathsBySex([makeEv('death', 0, 0, -7)], 50, 50);
    expect(r.unknown.deaths).toBe(7);
  });
});

describe('toneFromRate', () => {
  it('rate<10 → text', () => expect(toneFromRate(5)).toBe('var(--text)'));
  it('rate=10 → warn', () => expect(toneFromRate(10)).toBe('var(--warn)'));
  it('rate=19.9 → warn', () => expect(toneFromRate(19.9)).toBe('var(--warn)'));
  it('rate=20 → danger', () => expect(toneFromRate(20)).toBe('var(--danger)'));
  it('rate=50 → danger', () => expect(toneFromRate(50)).toBe('var(--danger)'));
});
