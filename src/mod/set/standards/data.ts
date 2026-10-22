/**
 * data.ts — استانداردهای پیش‌فرض صنعتی و بومی (نسخه ۲)
 *
 * منابع:
 * - مرندی: موسسه تحقیقات علوم دامی کشور، مطالعات دانشگاه تبریز
 * - گلپایگانی: تحقیقات دانشگاه اصفهان، موسسه علوم دامی
 * - گلین: منابع بومی ترکیبی
 * - گوشتی: Ross 308 Broiler Management Guide (Aviagen 2022)
 * - تخمگذار: Hy-Line Brown Commercial Management Guide
 *
 * ⚠️ همه اعداد در پنل تنظیمات قابل ویرایش هستند.
 */

import { NEW_BREEDS } from './data-breeds';
import type { BirdStandard, EnvRange, FeedRange, GrowthRange, IncubationStandard } from './types';

// ═══════════════════════════════════════════════
// رنج‌های Brooding مشترک
// ═══════════════════════════════════════════════
const COMMON_BROODING: EnvRange[] = [
  { dayFrom: 1,  dayTo: 3,   temp: { min: 32, max: 35, target: 33 }, humidity: { min: 60, max: 70 }, light: { hours: 23, lux: 25 } },
  { dayFrom: 4,  dayTo: 7,   temp: { min: 30, max: 33, target: 31 }, humidity: { min: 60, max: 70 }, light: { hours: 22, lux: 25 } },
  { dayFrom: 8,  dayTo: 14,  temp: { min: 28, max: 31, target: 29 }, humidity: { min: 55, max: 65 }, light: { hours: 20, lux: 20 } },
  { dayFrom: 15, dayTo: 21,  temp: { min: 26, max: 29, target: 27 }, humidity: { min: 55, max: 65 }, light: { hours: 18, lux: 20 } },
];


// ═══════════════════════════════════════════════
// انکوباسیون استاندارد مرغ‌ها (۲۱ روزه)
// ═══════════════════════════════════════════════
const CHICKEN_INCUBATION: IncubationStandard = {
  totalDays: 21,
  lockdownDay: 18,
  setterTemp: 37.7,
  setterHumidity: 55,
  hatcherTemp: 37.2,
  hatcherHumidity: 65,
};

// ═══════════════════════════════════════════════
// ۱. مرندی (بومی)
// ═══════════════════════════════════════════════

// ═══════════════════════════════════════════════
// ۲. گلپایگانی (بومی)
// ═══════════════════════════════════════════════

// ═══════════════════════════════════════════════
// ۳. گلین (بومی)
// ═══════════════════════════════════════════════

// ═══════════════════════════════════════════════
// ۴. مرغ گوشتی (Ross 308)
// ═══════════════════════════════════════════════
const BROILER: BirdStandard = {
  key: 'broiler',
  birdName: 'مرغ',
  birdKind: 'chicken',
  nameFa: 'مرغ گوشتی',
  nameEn: 'Broiler (Ross 308)',
  category: 'industrial',

  biology: {
    sexualMaturityDay: 140,
    layingStartDay: null,
    peakLayingDay: null,
    endOfCycleDay: 42,
    cullDay: 42,
    incubationDays: 21,
    maleFemaleRatio: null,
  },

  env: [
    { dayFrom: 1,  dayTo: 3,   temp: { min: 32, max: 34, target: 33 }, humidity: { min: 60, max: 70 }, light: { hours: 23, lux: 25 } },
    { dayFrom: 4,  dayTo: 7,   temp: { min: 30, max: 32, target: 31 }, humidity: { min: 60, max: 70 }, light: { hours: 20, lux: 25 } },
    { dayFrom: 8,  dayTo: 14,  temp: { min: 27, max: 30, target: 28 }, humidity: { min: 55, max: 65 }, light: { hours: 18, lux: 20 } },
    { dayFrom: 15, dayTo: 21,  temp: { min: 24, max: 27, target: 25 }, humidity: { min: 55, max: 65 }, light: { hours: 18, lux: 15 } },
    { dayFrom: 22, dayTo: 35,  temp: { min: 21, max: 24, target: 22 }, humidity: { min: 50, max: 65 }, light: { hours: 18, lux: 15 } },
    { dayFrom: 36, dayTo: 1825, temp: { min: 18, max: 24, target: 21 }, humidity: { min: 50, max: 65 }, light: { hours: 20, lux: 10 } },
  ],

  feed: [
    { dayFrom: 1,  dayTo: 7,    feedG: 18, waterMl: 35, proteinPct: 22, energyKcal: 3000 },
    { dayFrom: 8,  dayTo: 14,   feedG: 45, waterMl: 85, proteinPct: 21, energyKcal: 3050 },
    { dayFrom: 15, dayTo: 21,   feedG: 85, waterMl: 160, proteinPct: 20, energyKcal: 3100 },
    { dayFrom: 22, dayTo: 28,   feedG: 120, waterMl: 230, proteinPct: 19, energyKcal: 3150 },
    { dayFrom: 29, dayTo: 35,   feedG: 150, waterMl: 290, proteinPct: 19, energyKcal: 3150 },
    { dayFrom: 36, dayTo: 1825, feedG: 170, waterMl: 325, proteinPct: 18, energyKcal: 3200 },
  ],

  growth: {
    weightByAge: [
      { dayFrom: 1,  dayTo: 7,   weightG: 185,  adgG: 20,  fcr: 0.9 },
      { dayFrom: 8,  dayTo: 14,  weightG: 460,  adgG: 45,  fcr: 1.1 },
      { dayFrom: 15, dayTo: 21,  weightG: 960,  adgG: 70,  fcr: 1.3 },
      { dayFrom: 22, dayTo: 28,  weightG: 1620, adgG: 95,  fcr: 1.4 },
      { dayFrom: 29, dayTo: 35,  weightG: 2200, adgG: 90,  fcr: 1.5 },
      { dayFrom: 36, dayTo: 42,  weightG: 2650, adgG: 80,  fcr: 1.6 },
      { dayFrom: 43, dayTo: 1825, weightG: 2800, adgG: 60, fcr: 1.65 },
    ],
    finalWeightG: 2800,
  },

  space: {
    densityMax: 20,
    feederSpaceCm: 8,
    drinkerSpaceCm: 2.5,
  },

  equipment: {
    feeder: {
      chainCmPerBird: 10,
      panBirdsPerUnit: 30,
      tubeCmPerBird: 8,
      manualCmPerBird: 15,
    },
    drinker: {
      nippleBirdsPerUnit: 10,
      cupBirdsPerUnit: 20,
      troughCmPerBird: 2.5,
      manualCmPerBird: 3,
    },
    lampWattPerM2: 3,
    fanM3PerKg: 3.75,
  },

  mortality: [
    { dayFrom: 1,  dayTo: 7,    maxPct: 1 },
    { dayFrom: 8,  dayTo: 21,   maxPct: 2 },
    { dayFrom: 22, dayTo: 42,   maxPct: 3 },
  ],
  incubation: CHICKEN_INCUBATION,
  mortalityTotalPct: 5,

  notes: 'مرغ گوشتی صنعتی — Ross 308 Management Guide',
};

// ═══════════════════════════════════════════════
// ۵. مرغ تخمگذار (Hy-Line Brown)
// ═══════════════════════════════════════════════
const LAYER: BirdStandard = {
  key: 'layer',
  birdName: 'مرغ',
  birdKind: 'chicken',
  nameFa: 'مرغ تخمگذار',
  nameEn: 'Layer (Hy-Line Brown)',
  category: 'industrial',

  biology: {
    sexualMaturityDay: 140,
    layingStartDay: 140,
    peakLayingDay: 200,
    endOfCycleDay: 700,
    cullDay: 720,
    incubationDays: 21,
    maleFemaleRatio: 10,
  },

  env: [
    { dayFrom: 1,  dayTo: 3,   temp: { min: 32, max: 35, target: 33 }, humidity: { min: 60, max: 70 }, light: { hours: 23, lux: 30 } },
    { dayFrom: 4,  dayTo: 7,   temp: { min: 30, max: 33, target: 31 }, humidity: { min: 60, max: 70 }, light: { hours: 22, lux: 30 } },
    { dayFrom: 8,  dayTo: 14,  temp: { min: 28, max: 30, target: 29 }, humidity: { min: 55, max: 65 }, light: { hours: 18, lux: 25 } },
    { dayFrom: 15, dayTo: 42,  temp: { min: 22, max: 26, target: 24 }, humidity: { min: 55, max: 65 }, light: { hours: 12, lux: 15 } },
    { dayFrom: 43, dayTo: 140, temp: { min: 20, max: 24, target: 22 }, humidity: { min: 50, max: 65 }, light: { hours: 14, lux: 20 } },
    { dayFrom: 141, dayTo: 1825, temp: { min: 18, max: 24, target: 21 }, humidity: { min: 50, max: 65 }, light: { hours: 16, lux: 30 } },
  ],

  feed: [
    { dayFrom: 1,  dayTo: 7,    feedG: 15, waterMl: 28, proteinPct: 20, energyKcal: 2900 },
    { dayFrom: 8,  dayTo: 14,   feedG: 30, waterMl: 55, proteinPct: 19, energyKcal: 2850 },
    { dayFrom: 15, dayTo: 42,   feedG: 50, waterMl: 95, proteinPct: 17, energyKcal: 2750 },
    { dayFrom: 43, dayTo: 140,  feedG: 75, waterMl: 145, proteinPct: 16, energyKcal: 2750 },
    { dayFrom: 141, dayTo: 1825, feedG: 115, waterMl: 220, proteinPct: 17, energyKcal: 2750 },
  ],

  growth: {
    weightByAge: [
      { dayFrom: 1,  dayTo: 7,    weightG: 70,   adgG: 8,   fcr: 1.2 },
      { dayFrom: 8,  dayTo: 14,   weightG: 120,  adgG: 10,  fcr: 1.8 },
      { dayFrom: 15, dayTo: 42,   weightG: 450,  adgG: 12,  fcr: 2.5 },
      { dayFrom: 43, dayTo: 91,   weightG: 1050, adgG: 13,  fcr: 3.2 },
      { dayFrom: 92, dayTo: 140,  weightG: 1600, adgG: 12,  fcr: 4.0 },
      { dayFrom: 141, dayTo: 1825, weightG: 1950, adgG: 3,  fcr: 5.0 },
    ],
    finalWeightG: 1950,
  },

  space: {
    densityMax: 15,
    feederSpaceCm: 10,
    drinkerSpaceCm: 2.5,
  },

  equipment: {
    feeder: {
      chainCmPerBird: 10,
      panBirdsPerUnit: 30,
      tubeCmPerBird: 8,
      manualCmPerBird: 12,
    },
    drinker: {
      nippleBirdsPerUnit: 10,
      cupBirdsPerUnit: 20,
      troughCmPerBird: 2.5,
      manualCmPerBird: 3,
    },
    lampWattPerM2: 3,
    fanM3PerKg: 5,
  },

  production: {
    layingStartDay: 140,
    peakLayingPct: 95,
    eggsPerYear: 320,
    eggWeightG: 63,
    cycleDays: 700,
    fertilityPct: 90,
    hatchabilityPct: 85,
  },

  mortality: [
    { dayFrom: 1,  dayTo: 7,    maxPct: 1 },
    { dayFrom: 8,  dayTo: 21,   maxPct: 1.5 },
    { dayFrom: 22, dayTo: 140,  maxPct: 2.5 },
    { dayFrom: 141, dayTo: 1825, maxPct: 4 },
  ],
  incubation: CHICKEN_INCUBATION,
  mortalityTotalPct: 8,

  notes: 'مرغ تخمگذار صنعتی — Hy-Line Brown. مناسب برای تولید تخم نطفه‌دار',
};

// ═══════════════════════════════════════════════
// Export
// ═══════════════════════════════════════════════
export const DEFAULT_STANDARDS: Record<string, BirdStandard> = {
  // 🆕 legacy aliases (برای سازگاری تست‌ها و کد قدیم)
  broiler: BROILER,
  layer: LAYER,
  // نژادهای جدید
  ...NEW_BREEDS,
};

export const FALLBACK_ENV: EnvRange = {
  dayFrom: 0,
  dayTo: 1825,
  temp: { min: 18, max: 26, target: 22 },
  humidity: { min: 40, max: 70 },
  light: { hours: 14 },
};

export const FALLBACK_FEED: FeedRange = {
  dayFrom: 0,
  dayTo: 1825,
  feedG: 80,
  waterMl: 160,
};

export const FALLBACK_GROWTH: GrowthRange = {
  dayFrom: 0,
  dayTo: 1825,
  weightG: 1500,
  adgG: 15,
  fcr: 3,
};
