/**
 * geese.ts — استانداردهای غاز (تفکیک‌شده)
 * منابع: Emden/Toulouse/African Standards, منابع محلی ایران
 */
import type { BirdStandard } from '../types';

const GOOSE_BASE = {
  birdKind: 'goose' as const,
  category: 'industrial' as const,
  biology: {
    sexualMaturityDay: 150, layingStartDay: 140, peakLayingDay: 200,
    endOfCycleDay: 500, cullDay: 550, incubationDays: 30, maleFemaleRatio: 5,
  },
  env: [
    { dayFrom: 1, dayTo: 3, temp: { min: 32, max: 36, target: 34 }, humidity: { min: 60, max: 70 }, light: { hours: 22 } },
    { dayFrom: 4, dayTo: 7, temp: { min: 30, max: 34, target: 32 }, humidity: { min: 60, max: 65 }, light: { hours: 22 } },
    { dayFrom: 8, dayTo: 14, temp: { min: 26, max: 30, target: 28 }, humidity: { min: 55, max: 65 }, light: { hours: 22 } },
    { dayFrom: 15, dayTo: 21, temp: { min: 22, max: 26, target: 24 }, humidity: { min: 55, max: 65 }, light: { hours: 22 } },
    { dayFrom: 22, dayTo: 42, temp: { min: 18, max: 22, target: 20 }, humidity: { min: 55, max: 65 }, light: { hours: 22 } },
    { dayFrom: 43, dayTo: 365, temp: { min: 16, max: 20, target: 18 }, humidity: { min: 55, max: 65 }, light: { hours: 22 } },
  ],
  feed: [
    { dayFrom: 1, dayTo: 14, feedG: 60, waterMl: 120, phaseName: 'استارتر' },
    { dayFrom: 15, dayTo: 28, feedG: 130, waterMl: 260, phaseName: 'استارتر' },
    { dayFrom: 29, dayTo: 60, feedG: 220, waterMl: 440, phaseName: 'رشد' },
    { dayFrom: 61, dayTo: 90, feedG: 280, waterMl: 560, phaseName: 'رشد' },
    { dayFrom: 91, dayTo: 365, feedG: 320, waterMl: 640, phaseName: 'پروار' },
  ],
  space: { densityMax: 4, feederSpaceCm: 10, drinkerSpaceCm: 2 },
  equipment: {
    feeder: { chainCmPerBird: 10, panBirdsPerUnit: 25, tubeCmPerBird: 50, manualCmPerBird: 5, bucketBirdsPerUnit: 40, chickFeederBirdsPerUnit: 40, chickTrayBirdsPerUnit: 80 },
    drinker: { nippleBirdsPerUnit: 8, cupBirdsPerUnit: 20, troughCmPerBird: 3, manualCmPerBird: 2, fountainBirdsPerUnit: 40 },
    lampWattPerM2: 3, fanM3PerKg: 5,
  },
  incubation: { totalDays: 30, lockdownDay: 27, setterTemp: 37.5, setterHumidity: 60, hatcherTemp: 37.0, hatcherHumidity: 75, weightLossMinPct: 11, weightLossMaxPct: 13, estMinTemp: 37.5, estMaxTemp: 38.0, turningAngleDeg: 45, co2MaxPct: 0.5, o2MinPct: 20, tempProfile: [{ dayFrom: 1, dayTo: 7, temp: 37.6, humidity: 60.0, label: 'استقرار' }, { dayFrom: 8, dayTo: 14, temp: 37.4, humidity: 58.0, label: 'رشد' }, { dayFrom: 15, dayTo: 26, temp: 37.2, humidity: 55.0, label: 'بلوغ' }, { dayFrom: 27, dayTo: 30, temp: 37.0, humidity: 75.0, label: 'هچر' }]},
  litter: { recommended: ['straw' as const, 'wood_shavings' as const], kgPerM2ByMaterial: { wood_shavings: 5.5, rice_hull: 5.5, straw: 9.2, sand: 45.8, sawdust: 7.3, peat: 9.2, paper_roll: 0.55, none: 0 }, thicknessCm: 10, lifetimeDays: 30 },
  mortality: [
    { dayFrom: 1, dayTo: 7, maxPct: 2.0 },
    { dayFrom: 8, dayTo: 21, maxPct: 2.5 },
    { dayFrom: 22, dayTo: 60, maxPct: 3.0 },
    { dayFrom: 61, dayTo: 180, maxPct: 3.5 },
    { dayFrom: 181, dayTo: 365, maxPct: 4.0 },
  ],
  mortalityTotalPct: 4.5,
};

export const GOOSE_EMDEN: BirdStandard = {
  ...GOOSE_BASE,
  key: 'goose-emden',
  source: 'Emden Goose Standard + منابع محلی',
  publishYear: 1403,
  region: 'iran',
  birdName: 'غاز',
  purposes: ['broiler'],
  primaryPurpose: 'broiler',
  breederStandardKey: 'goose-toulouse',
  nameFa: 'غاز امبدن',
  nameEn: 'Emden Goose',
  growth: {
    weightByAge: [
      { dayFrom: 1, dayTo: 14, weightG: 550, adgG: 32, fcr: 1.2 },
      { dayFrom: 15, dayTo: 28, weightG: 1400, adgG: 60, fcr: 1.4 },
      { dayFrom: 29, dayTo: 60, weightG: 3000, adgG: 51, fcr: 1.5 },
      { dayFrom: 61, dayTo: 90, weightG: 5000, adgG: 66, fcr: 1.6 },
      { dayFrom: 91, dayTo: 180, weightG: 8000, adgG: 37, fcr: 1.75 },
    ],
    finalWeightG: 8000,
  },
  notes: 'غاز امبدن — گوشتی، جگر چرب بالا، رشد سریع',
};

export const GOOSE_CHINESE: BirdStandard = {
  ...GOOSE_BASE,
  key: 'goose-chinese',
  source: 'Chinese Goose Standard',
  publishYear: 1403,
  region: 'international',
  birdName: 'غاز',
  purposes: ['layer'],
  primaryPurpose: 'layer',
  breederStandardKey: 'goose-toulouse',
  nameFa: 'غاز چینی',
  nameEn: 'Chinese Goose',
  biology: {
    sexualMaturityDay: 200, layingStartDay: 220, peakLayingDay: 280,
    endOfCycleDay: 500, cullDay: 520, incubationDays: 30, maleFemaleRatio: 5,
  },
  growth: {
    weightByAge: [
      { dayFrom: 1, dayTo: 14, weightG: 400, adgG: 22, fcr: 1.3 },
      { dayFrom: 15, dayTo: 28, weightG: 1000, adgG: 43, fcr: 1.55 },
      { dayFrom: 29, dayTo: 60, weightG: 2000, adgG: 34, fcr: 1.7 },
      { dayFrom: 61, dayTo: 90, weightG: 3000, adgG: 33, fcr: 1.85 },
      { dayFrom: 91, dayTo: 180, weightG: 4000, adgG: 11, fcr: 1.95 },
    ],
    finalWeightG: 4000,
  },
  production: {
    layingStartDay: 220,
    peakLayingPct: 60,
    eggsPerYear: 80,
    eggWeightG: 130,
    cycleDays: 500,
    fertilityPct: 85,
    hatchabilityPct: 75,
  },
  notes: 'غاز چینی — بالاترین تخم‌گذاری در غازها',
};

export const GOOSE_TOULOUSE: BirdStandard = {
  ...GOOSE_BASE,
  key: 'goose-toulouse',
  source: 'Toulouse Goose Breeder Standard',
  publishYear: 1403,
  region: 'international',
  birdName: 'غاز',
  purposes: ['breeder'],
  primaryPurpose: 'breeder',
  nameFa: 'مادر غاز تولوز',
  nameEn: 'Toulouse Goose Breeder',
  biology: {
    sexualMaturityDay: 240, layingStartDay: 260, peakLayingDay: 320,
    endOfCycleDay: 500, cullDay: 520, incubationDays: 30, maleFemaleRatio: 4,
  },
  growth: {
    weightByAge: [
      { dayFrom: 1, dayTo: 14, weightG: 480, adgG: 27, fcr: 1.3 },
      { dayFrom: 15, dayTo: 28, weightG: 1200, adgG: 51, fcr: 1.5 },
      { dayFrom: 29, dayTo: 60, weightG: 2500, adgG: 42, fcr: 1.6 },
      { dayFrom: 61, dayTo: 90, weightG: 4000, adgG: 50, fcr: 1.75 },
      { dayFrom: 91, dayTo: 260, weightG: 6500, adgG: 15, fcr: 2.0 },
      { dayFrom: 261, dayTo: 9999, weightG: 7000, adgG: 2, fcr: 2.1 },
    ],
    finalWeightG: 7000,
  },
  space: { densityMax: 3, feederSpaceCm: 15, drinkerSpaceCm: 3 },
  production: {
    layingStartDay: 260,
    peakLayingPct: 50,
    eggsPerYear: 40,
    eggWeightG: 140,
    cycleDays: 500,
    fertilityPct: 88,
    hatchabilityPct: 78,
  },
  mortality: [
    { dayFrom: 1, dayTo: 7, maxPct: 2.0 },
    { dayFrom: 8, dayTo: 21, maxPct: 2.5 },
    { dayFrom: 22, dayTo: 60, maxPct: 3.0 },
    { dayFrom: 61, dayTo: 260, maxPct: 4.0 },
    { dayFrom: 261, dayTo: 9999, maxPct: 5.0 },
  ],
  mortalityTotalPct: 10,
  notes: 'مادر غاز تولوز — جگر چرب بالا، تخم نطفه‌دار',
};

// ═══════════════════════════════════════════════
// غاز آفریقایی (African) — گوشتی، مقاوم به گرما
// ═══════════════════════════════════════════════
export const GOOSE_AFRICAN: BirdStandard = {
  ...GOOSE_BASE,
  key: 'goose-african',
  source: 'African Goose Standard + منابع محلی',
  publishYear: 1403,
  region: 'international',
  birdName: 'غاز',
  purposes: ['broiler'],
  primaryPurpose: 'broiler',
  breederStandardKey: 'goose-toulouse',
  nameFa: 'غاز آفریقایی',
  nameEn: 'African Goose',
  growth: {
    weightByAge: [
      { dayFrom: 1, dayTo: 14, weightG: 520, adgG: 30, fcr: 1.2 },
      { dayFrom: 15, dayTo: 28, weightG: 1300, adgG: 55, fcr: 1.4 },
      { dayFrom: 29, dayTo: 60, weightG: 2800, adgG: 48, fcr: 1.55 },
      { dayFrom: 61, dayTo: 90, weightG: 4500, adgG: 56, fcr: 1.65 },
      { dayFrom: 91, dayTo: 180, weightG: 7000, adgG: 27, fcr: 1.8 },
    ],
    finalWeightG: 7000,
  },
  notes: 'غاز آفریقایی — مقاوم به گرما، وزن متوسط، محبوب در مناطق گرم',
};

// ═══════════════════════════════════════════════
// غاز اوکراینی (Ukrainian) — دوگانه، خاکستری
// ═══════════════════════════════════════════════
export const GOOSE_UKRAINIAN: BirdStandard = {
  ...GOOSE_BASE,
  key: 'goose-ukrainian',
  source: 'Ukrainian Grey Goose Standard + منابع محلی',
  publishYear: 1403,
  region: 'international',
  birdName: 'غاز',
  purposes: ['dual', 'layer'],
  primaryPurpose: 'dual',
  breederStandardKey: 'goose-toulouse',
  nameFa: 'غاز اوکراینی (خاکستری)',
  nameEn: 'Ukrainian Grey Goose',
  biology: {
    sexualMaturityDay: 180, layingStartDay: 190, peakLayingDay: 250,
    endOfCycleDay: 500, cullDay: 520, incubationDays: 30, maleFemaleRatio: 5,
  },
  growth: {
    weightByAge: [
      { dayFrom: 1, dayTo: 14, weightG: 450, adgG: 25, fcr: 1.25 },
      { dayFrom: 15, dayTo: 28, weightG: 1100, adgG: 46, fcr: 1.45 },
      { dayFrom: 29, dayTo: 60, weightG: 2300, adgG: 39, fcr: 1.6 },
      { dayFrom: 61, dayTo: 90, weightG: 3500, adgG: 40, fcr: 1.7 },
      { dayFrom: 91, dayTo: 180, weightG: 5000, adgG: 16, fcr: 1.85 },
    ],
    finalWeightG: 5000,
  },
  production: {
    layingStartDay: 190,
    peakLayingPct: 55,
    eggsPerYear: 60,
    eggWeightG: 130,
    cycleDays: 500,
    fertilityPct: 87,
    hatchabilityPct: 78,
  },
  notes: 'غاز اوکراینی خاکستری — دوگانه (گوشت + تخم)، مقاوم، محبوب',
};
