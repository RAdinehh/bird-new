/**
 * turkeys.ts — استانداردهای بوقلمون (تفکیک‌شده)
 * منابع: BUT Management Guide, Aviagen Turkeys, منابع محلی ایران
 */
import type { BirdStandard } from '../types';

const TURKEY_BASE = {
  birdKind: 'turkey' as const,
  category: 'industrial' as const,
  biology: {
    sexualMaturityDay: 150, layingStartDay: 140, peakLayingDay: 200,
    endOfCycleDay: 500, cullDay: 550, incubationDays: 28, maleFemaleRatio: 10,
  },
  env: [
    { dayFrom: 1, dayTo: 7, temp: { min: 30, max: 34, target: 32 }, humidity: { min: 60, max: 70 }, light: { hours: 22 } },
    { dayFrom: 8, dayTo: 14, temp: { min: 26, max: 30, target: 28 }, humidity: { min: 60, max: 65 }, light: { hours: 22 } },
    { dayFrom: 15, dayTo: 28, temp: { min: 22, max: 26, target: 24 }, humidity: { min: 55, max: 65 }, light: { hours: 22 } },
    { dayFrom: 29, dayTo: 42, temp: { min: 19, max: 23, target: 21 }, humidity: { min: 55, max: 65 }, light: { hours: 22 } },
    { dayFrom: 43, dayTo: 84, temp: { min: 16, max: 20, target: 18 }, humidity: { min: 55, max: 65 }, light: { hours: 22 } },
    { dayFrom: 85, dayTo: 150, temp: { min: 16, max: 20, target: 18 }, humidity: { min: 55, max: 65 }, light: { hours: 22 } },
  ],
  feed: [
    { dayFrom: 1, dayTo: 14, feedG: 40, waterMl: 80, phaseName: 'استارتر' },
    { dayFrom: 15, dayTo: 28, feedG: 90, waterMl: 180, phaseName: 'استارتر' },
    { dayFrom: 29, dayTo: 42, feedG: 160, waterMl: 320, phaseName: 'گروئر' },
    { dayFrom: 43, dayTo: 84, feedG: 260, waterMl: 520, phaseName: 'گروئر' },
    { dayFrom: 85, dayTo: 150, feedG: 350, waterMl: 700, phaseName: 'فینیشر' },
  ],
  space: { densityMax: 5, feederSpaceCm: 10, drinkerSpaceCm: 2 },
  equipment: {
    feeder: {  chainCmPerBird: 10, panBirdsPerUnit: 40, tubeCmPerBird: 50, manualCmPerBird: 5, bucketBirdsPerUnit: 40, chickFeederBirdsPerUnit: 50, chickTrayBirdsPerUnit: 80 },
    drinker: {  nippleBirdsPerUnit: 12, cupBirdsPerUnit: 20, troughCmPerBird: 3, manualCmPerBird: 2, fountainBirdsPerUnit: 40 },
    lampWattPerM2: 3, fanM3PerKg: 7.5,
  },
  incubation: { totalDays: 28, lockdownDay: 25, setterTemp: 37.5, setterHumidity: 55, hatcherTemp: 37.0, hatcherHumidity: 70, weightLossMinPct: 11, weightLossMaxPct: 13, estMinTemp: 37.5, estMaxTemp: 38.0, turningAngleDeg: 45, co2MaxPct: 0.5, o2MinPct: 20, tempProfile: [{ dayFrom: 1, dayTo: 7, temp: 37.6, humidity: 55.0, label: 'استقرار' }, { dayFrom: 8, dayTo: 14, temp: 37.4, humidity: 53.0, label: 'رشد' }, { dayFrom: 15, dayTo: 24, temp: 37.2, humidity: 50.0, label: 'بلوغ' }, { dayFrom: 25, dayTo: 28, temp: 37.0, humidity: 70.0, label: 'هچر' }]},
  litter: { recommended: ['wood_shavings' as const, 'straw' as const], kgPerM2ByMaterial: { wood_shavings: 4.5, rice_hull: 4.5, straw: 7.5, sand: 37.5, sawdust: 6.0, peat: 7.5, paper_roll: 0.45, none: 0 }, thicknessCm: 8, lifetimeDays: 60 },
  mortality: [
    { dayFrom: 1, dayTo: 7, maxPct: 2.0 },
    { dayFrom: 8, dayTo: 28, maxPct: 2.5 },
    { dayFrom: 29, dayTo: 84, maxPct: 3.0 },
    { dayFrom: 85, dayTo: 150, maxPct: 3.5 },
  ],
  mortalityTotalPct: 4.5,
};

export const TURKEY_BRONZE: BirdStandard = {
  ...TURKEY_BASE,
  key: 'turkey-bronze',
  source: 'BUT Management Guide + منابع محلی',
  publishYear: 1403,
  region: 'iran',
  birdName: 'بوقلمون',
  purposes: ['broiler'],
  primaryPurpose: 'broiler',
  breederStandardKey: 'turkey-breeder',
  nameFa: 'بوقلمون برنز',
  nameEn: 'Bronze Turkey',
  growth: {
    weightByAge: [
      { dayFrom: 1, dayTo: 14, weightG: 350, adgG: 21, fcr: 1.16 },
      { dayFrom: 15, dayTo: 28, weightG: 900, adgG: 39, fcr: 1.39 },
      { dayFrom: 29, dayTo: 42, weightG: 1800, adgG: 64, fcr: 1.5 },
      { dayFrom: 43, dayTo: 84, weightG: 4500, adgG: 64, fcr: 1.4 },
      { dayFrom: 85, dayTo: 150, weightG: 8000, adgG: 53, fcr: 1.56 },
    ],
    finalWeightG: 8000,
  },
  notes: 'بوقلمون برنز — نژاد سنتی، مقاوم، محبوب در بازار محلی',
};

export const TURKEY_WHITE: BirdStandard = {
  ...TURKEY_BASE,
  key: 'turkey-white',
  source: 'BUT 6 Management Guide (Aviagen Turkeys)',
  publishYear: 2022,
  region: 'international',
  birdName: 'بوقلمون',
  purposes: ['broiler'],
  primaryPurpose: 'broiler',
  breederStandardKey: 'turkey-breeder',
  nameFa: 'بیوتی سفید',
  nameEn: 'BUT 6 White Turkey',
  growth: {
    weightByAge: [
      { dayFrom: 1, dayTo: 14, weightG: 400, adgG: 24, fcr: 1.1 },
      { dayFrom: 15, dayTo: 28, weightG: 1100, adgG: 50, fcr: 1.3 },
      { dayFrom: 29, dayTo: 42, weightG: 2200, adgG: 78, fcr: 1.4 },
      { dayFrom: 43, dayTo: 84, weightG: 6000, adgG: 90, fcr: 1.35 },
      { dayFrom: 85, dayTo: 150, weightG: 12000, adgG: 92, fcr: 1.45 },
    ],
    finalWeightG: 12000,
  },
  notes: 'بیوتی سفید (BUT 6) — سریع‌ترین رشد، FCR بهتر',
};

export const TURKEY_BOURBON: BirdStandard = {
  ...TURKEY_BASE,
  key: 'turkey-bourbon',
  source: 'منابع محلی ایران + Bourbon Turkey Standard',
  publishYear: 1403,
  region: 'iran',
  birdName: 'بوقلمون',
  purposes: ['broiler'],
  primaryPurpose: 'broiler',
  breederStandardKey: 'turkey-breeder',
  nameFa: 'بوقلمون بوربون',
  nameEn: 'Bourbon Turkey',
  growth: {
    weightByAge: [
      { dayFrom: 1, dayTo: 14, weightG: 370, adgG: 22, fcr: 1.15 },
      { dayFrom: 15, dayTo: 28, weightG: 1000, adgG: 45, fcr: 1.35 },
      { dayFrom: 29, dayTo: 42, weightG: 2000, adgG: 71, fcr: 1.45 },
      { dayFrom: 43, dayTo: 84, weightG: 5200, adgG: 76, fcr: 1.38 },
      { dayFrom: 85, dayTo: 150, weightG: 9000, adgG: 69, fcr: 1.5 },
    ],
    finalWeightG: 9000,
  },
  notes: 'بوقلمون بوربون — نژاد میان‌وزن، گوشت با کیفیت',
};

export const TURKEY_BREEDER: BirdStandard = {
  ...TURKEY_BASE,
  key: 'turkey-breeder',
  source: 'BUT Breeder Guide + Aviagen Turkeys',
  publishYear: 2022,
  region: 'international',
  birdName: 'بوقلمون',
  purposes: ['breeder'],
  primaryPurpose: 'breeder',
  nameFa: 'مادر بوقلمون',
  nameEn: 'Turkey Breeder (Parent Stock)',
  biology: {
    sexualMaturityDay: 200, layingStartDay: 210, peakLayingDay: 260,
    endOfCycleDay: 380, cullDay: 400, incubationDays: 28, maleFemaleRatio: 10,
  },
  env: [
    { dayFrom: 1, dayTo: 7, temp: { min: 30, max: 34, target: 32 }, humidity: { min: 60, max: 70 }, light: { hours: 23 } },
    { dayFrom: 8, dayTo: 28, temp: { min: 22, max: 28, target: 25 }, humidity: { min: 55, max: 65 }, light: { hours: 8 } },
    { dayFrom: 29, dayTo: 200, temp: { min: 16, max: 22, target: 19 }, humidity: { min: 50, max: 65 }, light: { hours: 8 } },
    { dayFrom: 201, dayTo: 380, temp: { min: 18, max: 22, target: 20 }, humidity: { min: 50, max: 65 }, light: { hours: 14, lux: 30 } },
    { dayFrom: 381, dayTo: 9999, temp: { min: 18, max: 22, target: 20 }, humidity: { min: 50, max: 65 }, light: { hours: 16, lux: 30 } },
  ],
  feed: [
    { dayFrom: 1, dayTo: 28, feedG: 45, waterMl: 90, phaseName: 'استارتر' },
    { dayFrom: 29, dayTo: 200, feedG: 180, waterMl: 360, phaseName: 'رشد محدود' },
    { dayFrom: 201, dayTo: 380, feedG: 280, waterMl: 560, phaseName: 'تولید' },
    { dayFrom: 381, dayTo: 9999, feedG: 260, waterMl: 520, phaseName: 'پایان' },
  ],
  growth: {
    weightByAge: [
      { dayFrom: 1, dayTo: 28, weightG: 900, adgG: 32, fcr: 1.5 },
      { dayFrom: 29, dayTo: 100, weightG: 3500, adgG: 36, fcr: 2.5 },
      { dayFrom: 101, dayTo: 200, weightG: 7500, adgG: 40, fcr: 3.2 },
      { dayFrom: 201, dayTo: 380, weightG: 12000, adgG: 25, fcr: 3.5 },
      { dayFrom: 381, dayTo: 9999, weightG: 12500, adgG: 5, fcr: 3.3 },
    ],
    finalWeightG: 12500,
  },
  space: { densityMax: 3, feederSpaceCm: 15, drinkerSpaceCm: 3 },
  production: {
    layingStartDay: 210,
    peakLayingPct: 70,
    eggsPerYear: 90,
    eggWeightG: 85,
    cycleDays: 380,
    fertilityPct: 88,
    hatchabilityPct: 82,
  },
  mortality: [
    { dayFrom: 1, dayTo: 7, maxPct: 2.5 },
    { dayFrom: 8, dayTo: 28, maxPct: 3.0 },
    { dayFrom: 29, dayTo: 200, maxPct: 4.0 },
    { dayFrom: 201, dayTo: 9999, maxPct: 6.0 },
  ],
  mortalityTotalPct: 12,
  notes: 'مادر بوقلمون — تخم نطفه‌دار برای جوجه‌کشی',
};
