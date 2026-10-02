/**
 * standards-spec.test.ts
 * تست «رفتار مطلوب» — نه «رفتار فعلی».
 * هر fail = باگ واقعی.
 */
import { describe, it, expect } from 'vitest';
import {
  resolveBirdType,
  getEffectiveEnv,
  getEffectiveFeed,
  getEffectiveGrowth,
} from '../mod/set/standards/resolve';
import { DEFAULT_STANDARDS, FALLBACK_FEED, FALLBACK_ENV } from '../mod/set/standards/data';

describe('resolveBirdType', () => {
  it('نام فارسی دقیق', () => {
    expect(resolveBirdType('مرندی')).toBe('marandi');
    expect(resolveBirdType('گوشتی')).toBe('broiler');
    expect(resolveBirdType('تخمگذار')).toBe('layer');
  });
  it('trim فاصله اضافه', () => {
    expect(resolveBirdType('  مرندی  ')).toBe('marandi');
  });
  it('null/undefined/خالی → null', () => {
    expect(resolveBirdType(null)).toBe(null);
    expect(resolveBirdType(undefined)).toBe(null);
    expect(resolveBirdType('')).toBe(null);
  });
  it('ناشناخته → null', () => {
    expect(resolveBirdType('نژاد_نامعلوم_xyz')).toBe(null);
  });
});

describe('getEffectiveEnv — سنین لبه‌ای', () => {
  it('سن 0 = روز 1', () => {
    expect(getEffectiveEnv('مرندی', 0).temp.target)
      .toBe(getEffectiveEnv('مرندی', 1).temp.target);
  });
  it('سن منفی = روز 1', () => {
    expect(getEffectiveEnv('مرندی', -5).temp.target)
      .toBe(getEffectiveEnv('مرندی', 1).temp.target);
  });
  it('سن null = روز 1', () => {
    expect(getEffectiveEnv('مرندی', null).temp.target)
      .toBe(getEffectiveEnv('مرندی', 1).temp.target);
  });
  it('سن 99999 → آخرین بازه', () => {
    const a = getEffectiveEnv('مرندی', 99999);
    const arr = DEFAULT_STANDARDS.marandi.env;
    expect(a.temp.target).toBe(arr[arr.length - 1].temp.target);
  });
});

describe('getEffectiveEnv — override', () => {
  it('override=30 → target=30, source=override', () => {
    const env = getEffectiveEnv('مرندی', 5, 30);
    expect(env.temp.target).toBe(30);
    expect(env.source).toBe('override');
  });
  it('override=0 (صفر) → override بشه نه نادیده', () => {
    const env = getEffectiveEnv('مرندی', 5, 0);
    expect(env.source).toBe('override');
    expect(env.temp.target).toBe(0);
  });
  it('override=NaN → نادیده', () => {
    expect(getEffectiveEnv('مرندی', 5, NaN).source).not.toBe('override');
  });
  it('override=null → نادیده', () => {
    expect(getEffectiveEnv('مرندی', 5, null).source).not.toBe('override');
  });
});

describe('getEffectiveEnv — ناشناخته', () => {
  it('ناشناخته → fallback + FALLBACK_ENV', () => {
    const env = getEffectiveEnv('نژاد_xyz_نامعلوم', 5);
    expect(env.source).toBe('fallback');
    expect(env.temp.target).toBe(FALLBACK_ENV.temp.target);
  });
  it('null → fallback', () => {
    expect(getEffectiveEnv(null, 5).source).toBe('fallback');
  });
});

describe('getEffectiveFeed — override ترکیبی', () => {
  it('feed override + پرنده ناشناخته → آب از fallback', () => {
    const f = getEffectiveFeed('نژاد_xyz_نامعلوم', 5, 100, null);
    expect(f.feedG).toBe(100);
    expect(f.waterMl).toBe(FALLBACK_FEED.waterMl);
  });
  it('water override + ناشناخته → دان از fallback', () => {
    const f = getEffectiveFeed('نژاد_xyz_نامعلوم', 5, null, 200);
    expect(f.waterMl).toBe(200);
    expect(f.feedG).toBe(FALLBACK_FEED.feedG);
  });
  it('feed override=0 → override بشه', () => {
    expect(getEffectiveFeed('مرندی', 5, 0, null).feedG).toBe(0);
  });
});

describe('getEffectiveGrowth', () => {
  it('ناشناخته → fallback', () => {
    expect(getEffectiveGrowth('نژاد_xyz_نامعلوم', 5).source).toBe('fallback');
  });
  it('مرندی روز 3 → default', () => {
    const g = getEffectiveGrowth('مرندی', 3);
    expect(g.weightG).toBeGreaterThan(0);
    expect(g.source).toBe('default');
  });
});
