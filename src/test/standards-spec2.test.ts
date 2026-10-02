/**
 * standards-spec2.test.ts — round 2
 * تست‌های عمیق‌تر: customStandards, findInRange, missing fields
 */
import { describe, it, expect } from 'vitest';
import {
  getEffectiveEnv,
  getEffectiveFeed,
  getEffectiveGrowth,
  getMortalityRange,
  getIncubation,
  getStandardsGroupedByBird,
  getStandardFor,
} from '../mod/set/standards/resolve';
import { DEFAULT_STANDARDS, FALLBACK_ENV } from '../mod/set/standards/data';
import type { BirdStandard } from '../mod/set/standards/types';

// helper — یه استاندارد custom بساز
function makeCustom(overrides: Partial<BirdStandard> = {}): BirdStandard {
  return {
    ...DEFAULT_STANDARDS.marandi,
    ...overrides,
  } as BirdStandard;
}

// ═══════════════════════════════════════════════
// customStandards priority
// ═══════════════════════════════════════════════
describe('customStandards — اولویت', () => {
  it('settings > default: وقتی custom هست، source=settings', () => {
    const custom = { marandi: makeCustom() };
    const env = getEffectiveEnv('مرندی', 5, null, { customStandards: custom });
    expect(env.source).toBe('settings');
  });

  it('override > settings: با هر دو، override برنده', () => {
    const custom = { marandi: makeCustom() };
    const env = getEffectiveEnv('مرندی', 5, 25, { customStandards: custom });
    expect(env.source).toBe('override');
    expect(env.temp.target).toBe(25);
  });

  it('custom مقدار متفاوت → مقدار custom استفاده بشه', () => {
    const custom = {
      marandi: makeCustom({
        env: [{ dayFrom: 1, dayTo: 9999,
          temp: { min: 20, max: 25, target: 22 },
          humidity: { min: 50, max: 60 },
          light: { hours: 12 } }],
      }),
    };
    const env = getEffectiveEnv('مرندی', 100, null, { customStandards: custom });
    expect(env.temp.target).toBe(22);
  });

  it('custom بدون بازه برای سن → مقدار undefined نده', () => {
    const custom = {
      marandi: makeCustom({
        env: [{ dayFrom: 100, dayTo: 200,
          temp: { min: 20, max: 25, target: 22 },
          humidity: { min: 50, max: 60 },
          light: { hours: 12 } }],
      }),
    };
    // سن 5 — هیچ بازه‌ای match نمیشه
    const env = getEffectiveEnv('مرندی', 5, null, { customStandards: custom });
    // باید یا اولین بازه، یا fallback باشه — نه undefined
    expect(env.temp).toBeTruthy();
    expect(env.temp.target).toBeDefined();
    expect(env.temp.target).not.toBe(undefined);
    expect(isNaN(env.temp.target)).toBe(false);
  });
});

// ═══════════════════════════════════════════════
// findInRange — آرایه نامرتب
// ═══════════════════════════════════════════════
describe('findInRange — آرایه نامرتب (bug sus)', () => {
  it('بازه‌های نامرتب نباید نتیجه اشتباه بدن', () => {
    const custom = {
      marandi: makeCustom({
        env: [
          { dayFrom: 30, dayTo: 60, temp: { min: 18, max: 22, target: 20 }, humidity: { min: 50, max: 60 }, light: { hours: 12 } },
          { dayFrom: 1, dayTo: 15, temp: { min: 32, max: 35, target: 33 }, humidity: { min: 60, max: 70 }, light: { hours: 23 } },
          { dayFrom: 16, dayTo: 29, temp: { min: 25, max: 28, target: 26 }, humidity: { min: 55, max: 65 }, light: { hours: 18 } },
        ],
      }),
    };
    // سن 5 → باید بازه 1-15 رو بده (نه 30-60)
    const env = getEffectiveEnv('مرندی', 5, null, { customStandards: custom });
    expect(env.temp.target).toBe(33);
  });
});

// ═══════════════════════════════════════════════
// missing fields — نباید crash کنه
// ═══════════════════════════════════════════════
describe('missing fields', () => {
  it('getMortalityRange وقتی mortality نیست → null یا آرایه خالی', () => {
    const custom = {
      marandi: makeCustom({ mortality: undefined as any }),
    };
    expect(() => {
      getMortalityRange('مرندی', 5, { customStandards: custom });
    }).not.toThrow();
  });

  it('getIncubation وقتی incubation نیست → null', () => {
    const custom = {
      marandi: makeCustom({ incubation: undefined as any }),
    };
    const r = getIncubation('مرندی', { customStandards: custom });
    expect(r).toBe(null);
  });

  it('getEffectiveGrowth وقتی growth نیست → fallback', () => {
    const custom = {
      marandi: makeCustom({ growth: undefined as any }),
    };
    const g = getEffectiveGrowth('مرندی', 5, { customStandards: custom });
    expect(g.source).toBe('fallback');
  });
});

// ═══════════════════════════════════════════════
// getStandardsGroupedByBird
// ═══════════════════════════════════════════════
describe('getStandardsGroupedByBird', () => {
  it('بدون custom → بر اساس DEFAULT_STANDARDS', () => {
    const g = getStandardsGroupedByBird();
    expect(Object.keys(g).length).toBeGreaterThan(0);
    // هر گروه باید آرایه غیرخالی باشه
    Object.values(g).forEach(arr => {
      expect(Array.isArray(arr)).toBe(true);
      expect(arr.length).toBeGreaterThan(0);
    });
  });

  it('با custom → custom اضافه بشه', () => {
    const custom = {
      'لاری': makeCustom({ key: 'لاری', nameFa: 'لاری', birdName: 'مرغ' }),
    };
    const g = getStandardsGroupedByBird(custom);
    // گروه «مرغ» باید بیشتر از قبل داشته باشه
    expect(g['مرغ']).toBeTruthy();
    expect(g['مرغ'].length).toBeGreaterThan(0);
  });

  it('custom با birdName ناشناخته → گروه جدید', () => {
    const custom = {
      'شترمرغ_نژاد': makeCustom({ key: 'شترمرغ_نژاد', birdName: 'شترمرغ' }),
    };
    const g = getStandardsGroupedByBird(custom);
    expect(g['شترمرغ']).toBeTruthy();
  });
});

// ═══════════════════════════════════════════════
// getStandardFor
// ═══════════════════════════════════════════════
describe('getStandardFor', () => {
  it('ناشناخته → null', () => {
    expect(getStandardFor('xyz_ناشناخته')).toBe(null);
  });
  it('مرندی → ساختار کامل', () => {
    const s = getStandardFor('مرندی');
    expect(s).toBeTruthy();
    expect(s!.key).toBe('marandi');
  });
});
