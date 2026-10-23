/**
 * breeders.ts — استانداردهای مرغ مادر (Breeder)
 * منابع: Ross 308 Parent Stock Guide 2022, Cobb 500 Breeder Guide 2021,
 *        Hy-Line Brown Parent Stock Guide 2023, وزارت جهاد کشاورزی ۱۴۰۳
 *
 * ⚠️ توجه: این اعداد از دانش عمومی صنعت طیور استخراج شده.
 * کاربر می‌تواند از Settings → Standards ویرایش کند.
 */
import type { BirdStandard } from '../types';

const CHICKEN_INCUBATION_LOCAL = {
  totalDays: 21, lockdownDay: 18,
  setterTemp: 37.7, setterHumidity: 55,
  hatcherTemp: 37.2, hatcherHumidity: 65,
};

// ═══════════════════════════════════════════════
// مرغ مادر گوشتی — Ross 308 Parent Stock
// ═══════════════════════════════════════════════
export const ROSS_308_BREEDER: BirdStandard = {
  key: 'ross-308-breeder',
  source: 'Aviagen Ross 308 Parent Stock Guide',
  publishYear: 2022,
  region: 'international',
  birdName: 'مرغ',
  birdKind: 'chicken',
  purposes: ['breeder'],
  primaryPurpose: 'breeder',
  nameFa: 'مادر گوشتی راس ۳۰۸',
  nameEn: 'Ross 308 Breeder (Parent Stock)',
  category: 'industrial',
  biology: {
    sexualMaturityDay: 140,
    layingStartDay: 154,
    peakLayingDay: 210,
    endOfCycleDay: 448,
    cullDay: 462,
    incubationDays: 21,
    maleFemaleRatio: 9,
  },
  env: [
    { dayFrom: 1, dayTo: 7, temp: { min: 30, max: 34, target: 32 }, humidity: { min: 60, max: 70, target: 65 }, light: { hours: 23, lux: 30 } },
    { dayFrom: 8, dayTo: 14, temp: { min: 26, max: 30, target: 28 }, humidity: { min: 55, max: 65, target: 60 }, light: { hours: 20, lux: 25 } },
    { dayFrom: 15, dayTo: 21, temp: { min: 26, max: 30, target: 28 }, humidity: { min: 55, max: 65, target: 60 }, light: { hours: 20, lux: 25 } },
    { dayFrom: 22, dayTo: 28, temp: { min: 18, max: 24, target: 21 }, humidity: { min: 50, max: 65, target: 58 }, light: { hours: 8, lux: 10 } },
    { dayFrom: 29, dayTo: 35, temp: { min: 18, max: 24, target: 21 }, humidity: { min: 50, max: 65, target: 58 }, light: { hours: 8, lux: 10 } },
    { dayFrom: 36, dayTo: 42, temp: { min: 18, max: 24, target: 21 }, humidity: { min: 50, max: 65, target: 58 }, light: { hours: 8, lux: 10 } },
    { dayFrom: 43, dayTo: 49, temp: { min: 18, max: 24, target: 21 }, humidity: { min: 50, max: 65, target: 58 }, light: { hours: 8, lux: 10 } },
    { dayFrom: 50, dayTo: 56, temp: { min: 18, max: 24, target: 21 }, humidity: { min: 50, max: 65, target: 58 }, light: { hours: 8, lux: 10 } },
    { dayFrom: 57, dayTo: 63, temp: { min: 18, max: 24, target: 21 }, humidity: { min: 50, max: 65, target: 58 }, light: { hours: 8, lux: 10 } },
    { dayFrom: 64, dayTo: 70, temp: { min: 18, max: 24, target: 21 }, humidity: { min: 50, max: 65, target: 58 }, light: { hours: 8, lux: 10 } },
    { dayFrom: 71, dayTo: 77, temp: { min: 18, max: 24, target: 21 }, humidity: { min: 50, max: 65, target: 58 }, light: { hours: 8, lux: 10 } },
    { dayFrom: 78, dayTo: 84, temp: { min: 18, max: 24, target: 21 }, humidity: { min: 50, max: 65, target: 58 }, light: { hours: 8, lux: 10 } },
    { dayFrom: 85, dayTo: 140, temp: { min: 18, max: 24, target: 21 }, humidity: { min: 50, max: 65, target: 58 }, light: { hours: 8, lux: 10 } },
    { dayFrom: 141, dayTo: 448, temp: { min: 18, max: 24, target: 21 }, humidity: { min: 50, max: 65, target: 58 }, light: { hours: 14, lux: 30 } },
    { dayFrom: 449, dayTo: 1825, temp: { min: 18, max: 24, target: 21 }, humidity: { min: 50, max: 65, target: 58 }, light: { hours: 16, lux: 30 } },
  ],
  feed: [
    { dayFrom: 1, dayTo: 21, feedG: 25, waterMl: 45, proteinPct: 21, energyKcal: 2900 },
    { dayFrom: 22, dayTo: 140, feedG: 85, waterMl: 160, proteinPct: 16, energyKcal: 2750 },
    { dayFrom: 141, dayTo: 448, feedG: 165, waterMl: 320, proteinPct: 16.5, energyKcal: 2800 },
    { dayFrom: 449, dayTo: 1825, feedG: 150, waterMl: 290, proteinPct: 16, energyKcal: 2750 },
  ],
  growth: {
    weightByAge: [
      { dayFrom: 1, dayTo: 7, weightG: 130, adgG: 18, fcr: 0.9 },
      { dayFrom: 8, dayTo: 21, weightG: 450, adgG: 24, fcr: 1.4 },
      { dayFrom: 22, dayTo: 70, weightG: 1350, adgG: 19, fcr: 2.5 },
      { dayFrom: 71, dayTo: 140, weightG: 2200, adgG: 12, fcr: 3.2 },
      { dayFrom: 141, dayTo: 300, weightG: 3400, adgG: 7, fcr: 3.6 },
      { dayFrom: 301, dayTo: 1825, weightG: 3900, adgG: 3, fcr: 3.3 },
    ],
    finalWeightG: 3900,
  },
  space: { densityMax: 6, feederSpaceCm: 15, drinkerSpaceCm: 3 },
  equipment: {
    feeder: {  chainCmPerBird: 15, panBirdsPerUnit: 20, tubeCmPerBird: 12, manualCmPerBird: 18, bucketBirdsPerUnit: 60, chickFeederBirdsPerUnit: 50, chickTrayBirdsPerUnit: 100 },
    drinker: {  nippleBirdsPerUnit: 8, cupBirdsPerUnit: 15, troughCmPerBird: 3, manualCmPerBird: 3.5, fountainBirdsPerUnit: 60 },
    lampWattPerM2: 3, fanM3PerKg: 5,
  },
  production: {
    layingStartDay: 154,
    peakLayingPct: 85,
    eggsPerYear: 170,
    eggWeightG: 65,
    cycleDays: 448,
    fertilityPct: 90,
    hatchabilityPct: 85,
  },
  mortality: [
    { dayFrom: 1, dayTo: 7, maxPct: 1 },
    { dayFrom: 8, dayTo: 21, maxPct: 1.5 },
    { dayFrom: 22, dayTo: 140, maxPct: 2 },
    { dayFrom: 141, dayTo: 1825, maxPct: 5 },
  ],
  incubation: CHICKEN_INCUBATION_LOCAL,
  mortalityTotalPct: 9.5,
  notes: 'مرغ مادر گوشتی راس ۳۰۸ — تخم نطفه‌دار برای جوجه‌کشی گوشتی',
};

// ═══════════════════════════════════════════════
// مرغ مادر گوشتی — Cobb 500 Parent Stock
// ═══════════════════════════════════════════════
export const COBB_500_BREEDER: BirdStandard = {
  key: 'cobb-500-breeder',
  source: 'Cobb-Vantress Breeder Guide',
  publishYear: 2021,
  region: 'international',
  birdName: 'مرغ',
  birdKind: 'chicken',
  purposes: ['breeder'],
  primaryPurpose: 'breeder',
  nameFa: 'مادر گوشتی کاب ۵۰۰',
  nameEn: 'Cobb 500 Breeder (Parent Stock)',
  category: 'industrial',
  biology: {
    sexualMaturityDay: 140,
    layingStartDay: 154,
    peakLayingDay: 210,
    endOfCycleDay: 448,
    cullDay: 462,
    incubationDays: 21,
    maleFemaleRatio: 9,
  },
  env: [
    { dayFrom: 1, dayTo: 7, temp: { min: 30, max: 34, target: 32 }, humidity: { min: 60, max: 70, target: 65 }, light: { hours: 23, lux: 30 } },
    { dayFrom: 8, dayTo: 14, temp: { min: 26, max: 30, target: 28 }, humidity: { min: 55, max: 65, target: 60 }, light: { hours: 20, lux: 25 } },
    { dayFrom: 15, dayTo: 21, temp: { min: 26, max: 30, target: 28 }, humidity: { min: 55, max: 65, target: 60 }, light: { hours: 20, lux: 25 } },
    { dayFrom: 22, dayTo: 28, temp: { min: 18, max: 24, target: 21 }, humidity: { min: 50, max: 65, target: 58 }, light: { hours: 8, lux: 10 } },
    { dayFrom: 29, dayTo: 35, temp: { min: 18, max: 24, target: 21 }, humidity: { min: 50, max: 65, target: 58 }, light: { hours: 8, lux: 10 } },
    { dayFrom: 36, dayTo: 42, temp: { min: 18, max: 24, target: 21 }, humidity: { min: 50, max: 65, target: 58 }, light: { hours: 8, lux: 10 } },
    { dayFrom: 43, dayTo: 49, temp: { min: 18, max: 24, target: 21 }, humidity: { min: 50, max: 65, target: 58 }, light: { hours: 8, lux: 10 } },
    { dayFrom: 50, dayTo: 56, temp: { min: 18, max: 24, target: 21 }, humidity: { min: 50, max: 65, target: 58 }, light: { hours: 8, lux: 10 } },
    { dayFrom: 57, dayTo: 63, temp: { min: 18, max: 24, target: 21 }, humidity: { min: 50, max: 65, target: 58 }, light: { hours: 8, lux: 10 } },
    { dayFrom: 64, dayTo: 70, temp: { min: 18, max: 24, target: 21 }, humidity: { min: 50, max: 65, target: 58 }, light: { hours: 8, lux: 10 } },
    { dayFrom: 71, dayTo: 77, temp: { min: 18, max: 24, target: 21 }, humidity: { min: 50, max: 65, target: 58 }, light: { hours: 8, lux: 10 } },
    { dayFrom: 78, dayTo: 84, temp: { min: 18, max: 24, target: 21 }, humidity: { min: 50, max: 65, target: 58 }, light: { hours: 8, lux: 10 } },
    { dayFrom: 85, dayTo: 140, temp: { min: 18, max: 24, target: 21 }, humidity: { min: 50, max: 65, target: 58 }, light: { hours: 8, lux: 10 } },
    { dayFrom: 141, dayTo: 448, temp: { min: 18, max: 24, target: 21 }, humidity: { min: 50, max: 65, target: 58 }, light: { hours: 14, lux: 30 } },
    { dayFrom: 449, dayTo: 1825, temp: { min: 18, max: 24, target: 21 }, humidity: { min: 50, max: 65, target: 58 }, light: { hours: 16, lux: 30 } },
  ],
  feed: [
    { dayFrom: 1, dayTo: 21, feedG: 25, waterMl: 45, proteinPct: 21, energyKcal: 2900 },
    { dayFrom: 22, dayTo: 140, feedG: 85, waterMl: 160, proteinPct: 16, energyKcal: 2750 },
    { dayFrom: 141, dayTo: 448, feedG: 160, waterMl: 310, proteinPct: 16.5, energyKcal: 2800 },
    { dayFrom: 449, dayTo: 1825, feedG: 145, waterMl: 280, proteinPct: 16, energyKcal: 2750 },
  ],
  growth: {
    weightByAge: [
      { dayFrom: 1, dayTo: 7, weightG: 125, adgG: 17, fcr: 0.9 },
      { dayFrom: 8, dayTo: 21, weightG: 440, adgG: 23, fcr: 1.4 },
      { dayFrom: 22, dayTo: 70, weightG: 1320, adgG: 19, fcr: 2.5 },
      { dayFrom: 71, dayTo: 140, weightG: 2150, adgG: 12, fcr: 3.2 },
      { dayFrom: 141, dayTo: 300, weightG: 3350, adgG: 7, fcr: 3.6 },
      { dayFrom: 301, dayTo: 1825, weightG: 3800, adgG: 3, fcr: 3.3 },
    ],
    finalWeightG: 3800,
  },
  space: { densityMax: 6, feederSpaceCm: 15, drinkerSpaceCm: 3 },
  equipment: {
    feeder: {  chainCmPerBird: 15, panBirdsPerUnit: 20, tubeCmPerBird: 12, manualCmPerBird: 18, bucketBirdsPerUnit: 60, chickFeederBirdsPerUnit: 50, chickTrayBirdsPerUnit: 100 },
    drinker: {  nippleBirdsPerUnit: 8, cupBirdsPerUnit: 15, troughCmPerBird: 3, manualCmPerBird: 3.5, fountainBirdsPerUnit: 60 },
    lampWattPerM2: 3, fanM3PerKg: 5,
  },
  production: {
    layingStartDay: 154,
    peakLayingPct: 84,
    eggsPerYear: 165,
    eggWeightG: 65,
    cycleDays: 448,
    fertilityPct: 90,
    hatchabilityPct: 85,
  },
  mortality: [
    { dayFrom: 1, dayTo: 7, maxPct: 1 },
    { dayFrom: 8, dayTo: 21, maxPct: 1.5 },
    { dayFrom: 22, dayTo: 140, maxPct: 2 },
    { dayFrom: 141, dayTo: 1825, maxPct: 5 },
  ],
  incubation: CHICKEN_INCUBATION_LOCAL,
  mortalityTotalPct: 9.5,
  notes: 'مرغ مادر گوشتی کاب ۵۰۰ — تخم نطفه‌دار برای جوجه‌کشی گوشتی',
};

// ═══════════════════════════════════════════════
// مرغ مادر تخم‌گذار — Hy-Line Brown Parent Stock
// ═══════════════════════════════════════════════
export const HY_LINE_BROWN_BREEDER: BirdStandard = {
  key: 'hy-line-brown-breeder',
  source: 'Hy-Line International Parent Stock Guide',
  publishYear: 2023,
  region: 'international',
  birdName: 'مرغ',
  birdKind: 'chicken',
  purposes: ['breeder'],
  primaryPurpose: 'breeder',
  nameFa: 'مادر تخم‌گذار های‌لاین براون',
  nameEn: 'Hy-Line Brown Breeder (Parent Stock)',
  category: 'industrial',
  biology: {
    sexualMaturityDay: 140,
    layingStartDay: 147,
    peakLayingDay: 210,
    endOfCycleDay: 500,
    cullDay: 520,
    incubationDays: 21,
    maleFemaleRatio: 8,
  },
  env: [
    { dayFrom: 1, dayTo: 7, temp: { min: 30, max: 34, target: 32 }, humidity: { min: 60, max: 70, target: 65 }, light: { hours: 23, lux: 30 } },
    { dayFrom: 8, dayTo: 14, temp: { min: 26, max: 30, target: 28 }, humidity: { min: 55, max: 65, target: 60 }, light: { hours: 20, lux: 25 } },
    { dayFrom: 15, dayTo: 21, temp: { min: 26, max: 30, target: 28 }, humidity: { min: 55, max: 65, target: 60 }, light: { hours: 20, lux: 25 } },
    { dayFrom: 22, dayTo: 28, temp: { min: 18, max: 24, target: 21 }, humidity: { min: 50, max: 65, target: 58 }, light: { hours: 10, lux: 12 } },
    { dayFrom: 29, dayTo: 35, temp: { min: 18, max: 24, target: 21 }, humidity: { min: 50, max: 65, target: 58 }, light: { hours: 10, lux: 12 } },
    { dayFrom: 36, dayTo: 42, temp: { min: 18, max: 24, target: 21 }, humidity: { min: 50, max: 65, target: 58 }, light: { hours: 10, lux: 12 } },
    { dayFrom: 43, dayTo: 49, temp: { min: 18, max: 24, target: 21 }, humidity: { min: 50, max: 65, target: 58 }, light: { hours: 10, lux: 12 } },
    { dayFrom: 50, dayTo: 56, temp: { min: 18, max: 24, target: 21 }, humidity: { min: 50, max: 65, target: 58 }, light: { hours: 10, lux: 12 } },
    { dayFrom: 57, dayTo: 63, temp: { min: 18, max: 24, target: 21 }, humidity: { min: 50, max: 65, target: 58 }, light: { hours: 10, lux: 12 } },
    { dayFrom: 64, dayTo: 70, temp: { min: 18, max: 24, target: 21 }, humidity: { min: 50, max: 65, target: 58 }, light: { hours: 10, lux: 12 } },
    { dayFrom: 71, dayTo: 77, temp: { min: 18, max: 24, target: 21 }, humidity: { min: 50, max: 65, target: 58 }, light: { hours: 10, lux: 12 } },
    { dayFrom: 78, dayTo: 84, temp: { min: 18, max: 24, target: 21 }, humidity: { min: 50, max: 65, target: 58 }, light: { hours: 10, lux: 12 } },
    { dayFrom: 85, dayTo: 140, temp: { min: 18, max: 24, target: 21 }, humidity: { min: 50, max: 65, target: 58 }, light: { hours: 10, lux: 12 } },
    { dayFrom: 141, dayTo: 500, temp: { min: 18, max: 24, target: 21 }, humidity: { min: 50, max: 65, target: 58 }, light: { hours: 15, lux: 30 } },
    { dayFrom: 501, dayTo: 1825, temp: { min: 18, max: 24, target: 21 }, humidity: { min: 50, max: 65, target: 58 }, light: { hours: 16, lux: 30 } },
  ],
  feed: [
    { dayFrom: 1, dayTo: 21, feedG: 20, waterMl: 38, proteinPct: 20, energyKcal: 2900 },
    { dayFrom: 22, dayTo: 140, feedG: 70, waterMl: 130, proteinPct: 16, energyKcal: 2750 },
    { dayFrom: 141, dayTo: 500, feedG: 120, waterMl: 230, proteinPct: 16.5, energyKcal: 2750 },
    { dayFrom: 501, dayTo: 1825, feedG: 115, waterMl: 220, proteinPct: 16, energyKcal: 2750 },
  ],
  growth: {
    weightByAge: [
      { dayFrom: 1, dayTo: 7, weightG: 70, adgG: 9, fcr: 1.2 },
      { dayFrom: 8, dayTo: 21, weightG: 175, adgG: 11, fcr: 1.8 },
      { dayFrom: 22, dayTo: 70, weightG: 700, adgG: 11, fcr: 2.5 },
      { dayFrom: 71, dayTo: 140, weightG: 1450, adgG: 11, fcr: 3.0 },
      { dayFrom: 141, dayTo: 300, weightG: 1950, adgG: 4, fcr: 2.6 },
      { dayFrom: 301, dayTo: 1825, weightG: 2100, adgG: 1, fcr: 2.4 },
    ],
    finalWeightG: 2100,
  },
  space: { densityMax: 7, feederSpaceCm: 12, drinkerSpaceCm: 2.5 },
  equipment: {
    feeder: {  chainCmPerBird: 12, panBirdsPerUnit: 25, tubeCmPerBird: 10, manualCmPerBird: 15, bucketBirdsPerUnit: 60, chickFeederBirdsPerUnit: 50, chickTrayBirdsPerUnit: 100 },
    drinker: {  nippleBirdsPerUnit: 10, cupBirdsPerUnit: 18, troughCmPerBird: 2.5, manualCmPerBird: 3, fountainBirdsPerUnit: 60 },
    lampWattPerM2: 3, fanM3PerKg: 4.5,
  },
  production: {
    layingStartDay: 147,
    peakLayingPct: 92,
    eggsPerYear: 250,
    eggWeightG: 62,
    cycleDays: 500,
    fertilityPct: 92,
    hatchabilityPct: 87,
  },
  mortality: [
    { dayFrom: 1, dayTo: 7, maxPct: 1 },
    { dayFrom: 8, dayTo: 21, maxPct: 1.5 },
    { dayFrom: 22, dayTo: 140, maxPct: 2 },
    { dayFrom: 141, dayTo: 1825, maxPct: 5 },
  ],
  incubation: CHICKEN_INCUBATION_LOCAL,
  mortalityTotalPct: 9.5,
  notes: 'مرغ مادر تخم‌گذار های‌لاین براون — تخم نطفه‌دار برای تولید مرغ تخم‌گذار',
};
