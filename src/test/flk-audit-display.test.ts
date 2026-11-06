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
