import { describe, it, expect } from 'vitest';
import {
  DEFAULT_STANDARDS, FALLBACK_ENV, FALLBACK_FEED,
  resolveBirdType, getEffectiveEnv, getEffectiveFeed, getStandardFor,
  getEffectiveGrowth, getBiology, getSpace, getEquipment,
  getProduction, getMortalityRange,
} from '../mod/set/standards';

// ═══════════════════════════════════════════════
// resolveBirdType
// ═══════════════════════════════════════════════
describe('resolveBirdType', () => {
  it('مرندی → marandi', () => {
    expect(resolveBirdType('مرندی')).toBe('marandi');
  });
  it('گلپایگانی → golpaygani', () => {
    expect(resolveBirdType('گلپایگانی')).toBe('golpaygani');
  });
  it('گلین → gilini', () => {
    expect(resolveBirdType('گلین')).toBe('gilini');
  });
  it('مرغ گوشتی → broiler', () => {
    expect(resolveBirdType('مرغ گوشتی')).toBe('broiler');
  });
  it('گوشتی → broiler', () => {
    expect(resolveBirdType('گوشتی')).toBe('broiler');
  });
  it('مرغ تخمگذار → layer', () => {
    expect(resolveBirdType('مرغ تخمگذار')).toBe('layer');
  });
  it('با فضای اضافه', () => {
    expect(resolveBirdType('  مرندی  ')).toBe('marandi');
  });
  it('ناشناخته → null', () => {
    expect(resolveBirdType('پرنده ناشناخته')).toBeNull();
  });
  it('null → null', () => {
    expect(resolveBirdType(null)).toBeNull();
  });
  it('خالی → null', () => {
    expect(resolveBirdType('')).toBeNull();
  });
});

// ═══════════════════════════════════════════════
// getStandardFor
// ═══════════════════════════════════════════════
describe('getStandardFor', () => {
  it('مرندی برمیگردونه', () => {
    const std = getStandardFor('مرندی');
    expect(std).toBeTruthy();
    expect(std!.key).toBe('marandi');
    expect(std!.category).toBe('native');
  });

  it('گوشتی', () => {
    const std = getStandardFor('گوشتی');
    expect(std!.key).toBe('broiler');
    expect(std!.category).toBe('industrial');
  });

  it('ناشناخته → null', () => {
    expect(getStandardFor('xyz')).toBeNull();
  });
});

// ═══════════════════════════════════════════════
// getEffectiveEnv — Priority Chain
// ═══════════════════════════════════════════════
describe('getEffectiveEnv — priority chain', () => {
  it('مرندی روز 1 → temp 33 (brooding)', () => {
    const env = getEffectiveEnv('مرندی', 1);
    expect(env.temp.target).toBe(33);
    expect(env.source).toBe('default');
  });

  it('مرندی روز 5 → temp 31', () => {
    const env = getEffectiveEnv('مرندی', 5);
    expect(env.temp.target).toBe(31);
  });

  it('مرندی روز 10 → temp 29', () => {
    const env = getEffectiveEnv('مرندی', 10);
    expect(env.temp.target).toBe(29);
  });

  it('مرندی روز 100 → temp 22 (بالغ)', () => {
    const env = getEffectiveEnv('مرندی', 100);
    expect(env.temp.target).toBe(22);
  });

  it('گوشتی روز 1 → temp 33', () => {
    const env = getEffectiveEnv('گوشتی', 1);
    expect(env.temp.target).toBe(33);
  });

  it('گوشتی روز 25 → temp 22', () => {
    const env = getEffectiveEnv('گوشتی', 25);
    expect(env.temp.target).toBe(22);
  });

  it('گوشتی روز 40 → temp 21', () => {
    const env = getEffectiveEnv('گوشتی', 40);
    expect(env.temp.target).toBe(21);
  });

  it('layer روز 200 (بالغ) → temp 21', () => {
    const env = getEffectiveEnv('مرغ تخمگذار', 200);
    expect(env.temp.target).toBe(21);
  });

  it('override: temp=30 → source=override', () => {
    const env = getEffectiveEnv('مرندی', 100, 30);
    expect(env.temp.target).toBe(30);
    expect(env.source).toBe('override');
  });

  it('override: temp=25 → min/max محاسبه میشن', () => {
    const env = getEffectiveEnv('مرندی', 100, 25);
    expect(env.temp.min).toBe(23);
    expect(env.temp.max).toBe(27);
  });

  it('override temp=null → از default استفاده', () => {
    const env = getEffectiveEnv('مرندی', 100, null);
    expect(env.source).toBe('default');
    expect(env.temp.target).toBe(22);
  });

  it('override temp=undefined → default', () => {
    const env = getEffectiveEnv('مرندی', 100, undefined);
    expect(env.source).toBe('default');
  });

  it('پرنده ناشناخته → fallback', () => {
    const env = getEffectiveEnv('xyz', 5);
    expect(env.source).toBe('fallback');
    expect(env.temp.target).toBe(22);
  });

  it('override + پرنده ناشناخته → override', () => {
    const env = getEffectiveEnv('xyz', 5, 30);
    expect(env.source).toBe('override');
    expect(env.temp.target).toBe(30);
  });

  it('age null → روز 0', () => {
    const env = getEffectiveEnv('مرندی', null);
    expect(env.temp.target).toBe(33);  // brooding
  });

  it('age منفی → 0', () => {
    const env = getEffectiveEnv('مرندی', -5);
    expect(env.temp.target).toBe(33);
  });

  it('age خیلی زیاد → آخرین رنج', () => {
    const env = getEffectiveEnv('مرندی', 5000);
    expect(env.temp.target).toBe(22);
  });

  it('light hours درست', () => {
    const env = getEffectiveEnv('گوشتی', 2);
    expect(env.light.hours).toBe(23);
  });

  it('humidity درست', () => {
    const env = getEffectiveEnv('گوشتی', 2);
    expect(env.humidity.min).toBe(60);
    expect(env.humidity.max).toBe(70);
  });
});

// ═══════════════════════════════════════════════
// getEffectiveFeed
// ═══════════════════════════════════════════════
describe('getEffectiveFeed', () => {
  it('مرندی روز 5 → 12g دان', () => {
    const f = getEffectiveFeed('مرندی', 5);
    expect(f.feedG).toBe(12);
    expect(f.waterMl).toBe(22);
  });

  it('مرندی روز 100 → 70g', () => {
    const f = getEffectiveFeed('مرندی', 100);
    expect(f.feedG).toBe(70);
  });

  it('گوشتی روز 40 → 170g', () => {
    const f = getEffectiveFeed('گوشتی', 40);
    expect(f.feedG).toBe(170);
  });

  it('override دان', () => {
    const f = getEffectiveFeed('مرندی', 100, 100);
    expect(f.feedG).toBe(100);
    expect(f.source).toBe('override');
  });

  it('override آب', () => {
    const f = getEffectiveFeed('مرندی', 100, undefined, 500);
    expect(f.waterMl).toBe(500);
    expect(f.source).toBe('override');
  });

  it('override هر دو', () => {
    const f = getEffectiveFeed('مرندی', 100, 100, 500);
    expect(f.feedG).toBe(100);
    expect(f.waterMl).toBe(500);
    expect(f.source).toBe('override');
  });

  it('پرنده ناشناخته → fallback', () => {
    const f = getEffectiveFeed('xyz', 5);
    expect(f.source).toBe('fallback');
    expect(f.feedG).toBe(80);
  });
});

// ═══════════════════════════════════════════════
// data integrity
// ═══════════════════════════════════════════════
describe('DEFAULT_STANDARDS integrity', () => {
  it('۵ پرنده داری', () => {
    expect(Object.keys(DEFAULT_STANDARDS)).toHaveLength(5);
  });

  it('هر پرنده ساختار کامل داره', () => {
    Object.values(DEFAULT_STANDARDS).forEach(std => {
      expect(std.env.length).toBeGreaterThan(0);
      expect(std.feed.length).toBeGreaterThan(0);
      expect(std.mortality.length).toBeGreaterThan(0);
      expect(std.space.densityMax).toBeGreaterThan(0);
      expect(std.biology).toBeTruthy();
      expect(std.growth).toBeTruthy();
      expect(std.growth.weightByAge.length).toBeGreaterThan(0);
      expect(std.equipment).toBeTruthy();
    });
  });

  it('تلفات کل مجاز داره', () => {
    Object.values(DEFAULT_STANDARDS).forEach(std => {
      expect(std.mortalityTotalPct).toBeGreaterThan(0);
    });
  });

  it('equipment feeder و drinker داره', () => {
    Object.values(DEFAULT_STANDARDS).forEach(std => {
      expect(std.equipment.feeder).toBeTruthy();
      expect(std.equipment.drinker).toBeTruthy();
      expect(std.equipment.lampWattPerM2).toBeGreaterThan(0);
      expect(std.equipment.fanM3PerKg).toBeGreaterThan(0);
    });
  });

  it('biology برای همه پرنده‌ها پر شده', () => {
    Object.values(DEFAULT_STANDARDS).forEach(std => {
      expect(std.biology.incubationDays).toBeGreaterThan(0);
      expect(std.biology.sexualMaturityDay).toBeGreaterThan(0);
    });
  });

  it('بومی‌ها production دارن', () => {
    expect(DEFAULT_STANDARDS.marandi.production).toBeTruthy();
    expect(DEFAULT_STANDARDS.golpaygani.production).toBeTruthy();
    expect(DEFAULT_STANDARDS.gilini.production).toBeTruthy();
  });

  it('layer تولید بالاترین', () => {
    const layer = DEFAULT_STANDARDS.layer;
    const marandi = DEFAULT_STANDARDS.marandi;
    expect(layer.production!.eggsPerYear).toBeGreaterThan(marandi.production!.eggsPerYear);
  });

  it('golpaygani تولید بومی بالاترین', () => {
    const gol = DEFAULT_STANDARDS.golpaygani;
    const mar = DEFAULT_STANDARDS.marandi;
    expect(gol.production!.eggsPerYear).toBeGreaterThanOrEqual(mar.production!.eggsPerYear);
  });

  it('هر پرنده env از روز 1 شروع میشه', () => {
    Object.values(DEFAULT_STANDARDS).forEach(std => {
      const first = std.env[0];
      expect(first.dayFrom).toBe(1);
    });
  });

  it('env رنج‌ها پیوسته (بدون gap)', () => {
    Object.values(DEFAULT_STANDARDS).forEach(std => {
      const env = std.env;
      for (let i = 0; i < env.length - 1; i++) {
        expect(env[i].dayTo + 1).toBe(env[i + 1].dayFrom);
      }
    });
  });

  it('آخرین env رنج تا 9999 میره', () => {
    Object.values(DEFAULT_STANDARDS).forEach(std => {
      const last = std.env[std.env.length - 1];
      expect(last.dayTo).toBe(9999);
    });
  });
});

// ═══════════════════════════════════════════════
// custom overrides
// ═══════════════════════════════════════════════
describe('customStandards', () => {
  it('custom جایگزین default میشه', () => {
    const custom = {
      marandi: {
        ...DEFAULT_STANDARDS.marandi,
        env: [
          { dayFrom: 0, dayTo: 9999, temp: { min: 25, max: 30, target: 28 }, humidity: { min: 50, max: 60 }, light: { hours: 15 } },
        ],
      },
    };

    const env = getEffectiveEnv('مرندی', 100, null, { customStandards: custom });
    expect(env.temp.target).toBe(28);
    expect(env.source).toBe('settings');
  });

  it('بدون custom → default', () => {
    const env = getEffectiveEnv('مرندی', 100);
    expect(env.source).toBe('default');
  });
});

// ═══════════════════════════════════════════════
// FALLBACK
// ═══════════════════════════════════════════════
describe('FALLBACK', () => {
  it('FALLBACK_ENV temp', () => {
    expect(FALLBACK_ENV.temp.target).toBe(22);
  });
  it('FALLBACK_FEED', () => {
    expect(FALLBACK_FEED.feedG).toBe(80);
  });
});

// ═══════════════════════════════════════════════
// 🆕 getEffectiveGrowth
// ═══════════════════════════════════════════════
describe('getEffectiveGrowth', () => {
  it('مرندی روز 3 → وزن ~90g', () => {
    const g = getEffectiveGrowth('مرندی', 3);
    expect(g.weightG).toBe(90);
    expect(g.source).toBe('default');
  });

  it('گوشتی روز 40 → وزن ~2650g', () => {
    const g = getEffectiveGrowth('گوشتی', 40);
    expect(g.weightG).toBe(2650);
  });

  it('گوشتی ADG روز 25 → 95', () => {
    const g = getEffectiveGrowth('گوشتی', 25);
    expect(g.adgG).toBe(95);
  });

  it('گوشتی FCR روز 30 → 1.5', () => {
    const g = getEffectiveGrowth('گوشتی', 30);
    expect(g.fcr).toBe(1.5);
  });

  it('پرنده ناشناخته → fallback', () => {
    const g = getEffectiveGrowth('xyz', 5);
    expect(g.source).toBe('fallback');
  });

  it('سن null → اولین رنج', () => {
    const g = getEffectiveGrowth('گوشتی', null);
    expect(g.weightG).toBe(185);
  });
});

// ═══════════════════════════════════════════════
// 🆕 getBiology
// ═══════════════════════════════════════════════
describe('getBiology', () => {
  it('مرندی → layingStartDay 150', () => {
    const b = getBiology('مرندی');
    expect(b).toBeTruthy();
    expect(b!.layingStartDay).toBe(150);
    expect(b!.incubationDays).toBe(21);
  });

  it('گوشتی → بدون layingStartDay', () => {
    const b = getBiology('گوشتی');
    expect(b!.layingStartDay).toBeNull();
    expect(b!.endOfCycleDay).toBe(42);
  });

  it('ناشناخته → null', () => {
    expect(getBiology('xyz')).toBeNull();
  });
});

// ═══════════════════════════════════════════════
// 🆕 getSpace
// ═══════════════════════════════════════════════
describe('getSpace', () => {
  it('مرندی → density 10', () => {
    const sp = getSpace('مرندی');
    expect(sp!.densityMax).toBe(10);
    expect(sp!.feederSpaceCm).toBe(12);
  });

  it('گوشتی → density 20', () => {
    const sp = getSpace('گوشتی');
    expect(sp!.densityMax).toBe(20);
  });

  it('ناشناخته → null', () => {
    expect(getSpace('xyz')).toBeNull();
  });
});

// ═══════════════════════════════════════════════
// 🆕 getEquipment
// ═══════════════════════════════════════════════
describe('getEquipment', () => {
  it('مرندی → nipplePerBird 10', () => {
    const eq = getEquipment('مرندی');
    expect(eq!.drinker.nippleBirdsPerUnit).toBe(10);
  });

  it('گوشتی → panPerUnit 30', () => {
    const eq = getEquipment('گوشتی');
    expect(eq!.feeder.panBirdsPerUnit).toBe(30);
  });

  it('ناشناخته → null', () => {
    expect(getEquipment('xyz')).toBeNull();
  });
});

// ═══════════════════════════════════════════════
// 🆕 getProduction
// ═══════════════════════════════════════════════
describe('getProduction', () => {
  it('مرندی production دارد', () => {
    const p = getProduction('مرندی');
    expect(p!.eggsPerYear).toBe(170);
    expect(p!.fertilityPct).toBe(82);
  });

  it('گوشتی production ندارد', () => {
    expect(getProduction('گوشتی')).toBeNull();
  });
});

// ═══════════════════════════════════════════════
// 🆕 getMortalityRange
// ═══════════════════════════════════════════════
describe('getMortalityRange', () => {
  it('مرندی روز 5 → 1.5%', () => {
    const m = getMortalityRange('مرندی', 5);
    expect(m!.maxPct).toBe(1.5);
  });

  it('مرندی روز 100 → 6%', () => {
    const m = getMortalityRange('مرندی', 100);
    expect(m!.maxPct).toBe(6);
  });

  it('گوشتی روز 30 → 3%', () => {
    const m = getMortalityRange('گوشتی', 30);
    expect(m!.maxPct).toBe(3);
  });
});
