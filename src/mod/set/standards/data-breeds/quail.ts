/**
 * data-breeds.ts — ۲۳ نژاد جدید (نسخه ۳)
 * منابع: Cobb/Aviagen 2024، وزارت جهاد ۱۴۰۳، مراکز تحقیقات استانی، منابع داخلی و بین‌المللی
 */

import type { BirdStandard } from '../types';


export const QUAIL_BROILER: BirdStandard = {
  key: 'quail-broiler',
  source: 'مرکز تحقیقات بلدرچین ایران',
  publishYear: 2024,
  region: 'iran',
  birdName: 'بلدرچین',
  birdKind: 'quail',
  purposes: ['broiler'],
  primaryPurpose: 'broiler',
  breederStandardKey: 'quail-breeder',
  nameFa: 'بلدرچین گوشتی',
  nameEn: 'Quail Broiler',
  category: 'industrial',
  biology: {
    sexualMaturityDay: 150, layingStartDay: 140, peakLayingDay: 200,
    endOfCycleDay: 500, cullDay: 550, incubationDays: 17, maleFemaleRatio: 10,
  },
  env: [
  { dayFrom: 1, dayTo: 7, temp: { min: 34, max: 38, target: 36 }, humidity: { min: 60, max: 70 }, light: { hours: 22 } },
  { dayFrom: 8, dayTo: 14, temp: { min: 32, max: 36, target: 34 }, humidity: { min: 60, max: 65 }, light: { hours: 22 } },
  { dayFrom: 15, dayTo: 21, temp: { min: 30, max: 34, target: 32 }, humidity: { min: 55, max: 65 }, light: { hours: 22 } },
  { dayFrom: 22, dayTo: 28, temp: { min: 27, max: 31, target: 29 }, humidity: { min: 55, max: 65 }, light: { hours: 22 } },
  { dayFrom: 29, dayTo: 35, temp: { min: 23, max: 27, target: 25 }, humidity: { min: 55, max: 65 }, light: { hours: 22 } },
  { dayFrom: 36, dayTo: 45, temp: { min: 21, max: 25, target: 23 }, humidity: { min: 55, max: 65 }, light: { hours: 22 } },
  ],
  feed: [
  { dayFrom: 1, dayTo: 7, feedG: 8, waterMl: 16, phaseName: 'استارتر', lysinePct: 1.3, methioninePct: 0.5, calciumPct: 1.0, availablePhosphorusPct: 0.45, saltPct: 0.2, mainIngredients: ['ذرت', 'کنجاله سویا', 'پودر ماهی', 'مکمل'] },
  { dayFrom: 8, dayTo: 14, feedG: 15, waterMl: 30, phaseName: 'استارتر', lysinePct: 1.3, methioninePct: 0.5, calciumPct: 1.0, availablePhosphorusPct: 0.45, saltPct: 0.2, mainIngredients: ['ذرت', 'کنجاله سویا', 'پودر ماهی', 'مکمل'] },
  { dayFrom: 15, dayTo: 21, feedG: 22, waterMl: 44, phaseName: 'رشد', lysinePct: 1.15, methioninePct: 0.45, calciumPct: 0.9, availablePhosphorusPct: 0.4, saltPct: 0.2, mainIngredients: ['ذرت', 'کنجاله سویا', 'گندم'] },
  { dayFrom: 22, dayTo: 28, feedG: 27, waterMl: 54, phaseName: 'رشد', lysinePct: 1.15, methioninePct: 0.45, calciumPct: 0.9, availablePhosphorusPct: 0.4, saltPct: 0.2, mainIngredients: ['ذرت', 'کنجاله سویا', 'گندم'] },
  { dayFrom: 29, dayTo: 35, feedG: 30, waterMl: 60, phaseName: 'رشد', lysinePct: 1.15, methioninePct: 0.45, calciumPct: 0.9, availablePhosphorusPct: 0.4, saltPct: 0.2, mainIngredients: ['ذرت', 'کنجاله سویا', 'گندم'] },
  { dayFrom: 36, dayTo: 45, feedG: 32, waterMl: 64, phaseName: 'رشد', lysinePct: 1.15, methioninePct: 0.45, calciumPct: 0.9, availablePhosphorusPct: 0.4, saltPct: 0.2, mainIngredients: ['ذرت', 'کنجاله سویا', 'گندم'] },
  ],
  growth: {
    weightByAge: [
  { dayFrom: 1, dayTo: 7, weightG: 30, adgG: 3.0, fcr: 1.3 },
  { dayFrom: 8, dayTo: 14, weightG: 80, adgG: 7.14, fcr: 1.38 },
  { dayFrom: 15, dayTo: 21, weightG: 140, adgG: 8.57, fcr: 1.57 },
  { dayFrom: 22, dayTo: 28, weightG: 190, adgG: 7.14, fcr: 1.74 },
  { dayFrom: 29, dayTo: 35, weightG: 230, adgG: 5.71, fcr: 1.83 },
  { dayFrom: 36, dayTo: 42, weightG: 260, adgG: 4.29, fcr: 1.88 },
    ],
    finalWeightG: 260,
  },
  space: { densityMax: 150, feederSpaceCm: 10, drinkerSpaceCm: 2 },
  equipment: {
    feeder: { chainCmPerBird: 10, panBirdsPerUnit: 40, tubeCmPerBird: 50, manualCmPerBird: 5 },
    drinker: { nippleBirdsPerUnit: 15, cupBirdsPerUnit: 20, troughCmPerBird: 3, manualCmPerBird: 2 },
    lampWattPerM2: 4, fanM3PerKg: 5,
  },
  incubation: { totalDays: 17, lockdownDay: 14, setterTemp: 37.5, setterHumidity: 55, hatcherTemp: 37.2, hatcherHumidity: 70 },
  litter: {
    recommended: ['wood_shavings', 'rice_hull'],
    kgPerM2ByMaterial: { wood_shavings: 2.0, rice_hull: 2.0, straw: 3.3, sand: 16.7, sawdust: 2.7, peat: 3.3, paper_roll: 0.2, none: 0 },
    thicknessCm: 5,
    lifetimeDays: 42,
  },
  mortality: [
    { dayFrom: 1, dayTo: 7, maxPct: 2.5 },
    { dayFrom: 8, dayTo: 21, maxPct: 3.0 },
    { dayFrom: 22, dayTo: 45, maxPct: 3.5 },
  ],
  mortalityTotalPct: 4.5,
  notes: 'بلدرچین گوشتی',
};

export const QUAIL_LAYER: BirdStandard = {
  key: 'quail-layer',
  source: 'مرکز تحقیقات بلدرچین ایران',
  publishYear: 2024,
  region: 'iran',
  birdName: 'بلدرچین',
  birdKind: 'quail',
  purposes: ['layer'],
  primaryPurpose: 'layer',
  breederStandardKey: 'quail-breeder',
  nameFa: 'بلدرچین تخم‌گذار',
  nameEn: 'Quail Layer',
  category: 'industrial',
  biology: {
    sexualMaturityDay: 150, layingStartDay: 140, peakLayingDay: 200,
    endOfCycleDay: 500, cullDay: 550, incubationDays: 17, maleFemaleRatio: 10,
  },
  env: [
  { dayFrom: 1, dayTo: 7, temp: { min: 34, max: 38, target: 36 }, humidity: { min: 60, max: 70 }, light: { hours: 22 } },
  { dayFrom: 8, dayTo: 14, temp: { min: 32, max: 36, target: 34 }, humidity: { min: 60, max: 65 }, light: { hours: 22 } },
  { dayFrom: 15, dayTo: 28, temp: { min: 28, max: 32, target: 30 }, humidity: { min: 55, max: 65 }, light: { hours: 22 } },
  { dayFrom: 29, dayTo: 42, temp: { min: 24, max: 28, target: 26 }, humidity: { min: 55, max: 65 }, light: { hours: 22 } },
  { dayFrom: 43, dayTo: 180, temp: { min: 22, max: 26, target: 24 }, humidity: { min: 55, max: 65 }, light: { hours: 22 } },
  ],
  feed: [
  { dayFrom: 1, dayTo: 14, feedG: 14, waterMl: 28, phaseName: 'استارتر', lysinePct: 1.3, methioninePct: 0.5, calciumPct: 1.0, availablePhosphorusPct: 0.45, saltPct: 0.2, mainIngredients: ['ذرت', 'کنجاله سویا', 'پودر ماهی'] },
  { dayFrom: 15, dayTo: 28, feedG: 24, waterMl: 48, phaseName: 'استارتر', lysinePct: 1.3, methioninePct: 0.5, calciumPct: 1.0, availablePhosphorusPct: 0.45, saltPct: 0.2, mainIngredients: ['ذرت', 'کنجاله سویا', 'پودر ماهی'] },
  { dayFrom: 29, dayTo: 42, feedG: 28, waterMl: 56, phaseName: 'رشد', lysinePct: 1.0, methioninePct: 0.42, calciumPct: 1.0, availablePhosphorusPct: 0.4, saltPct: 0.2, mainIngredients: ['ذرت', 'کنجاله سویا', 'گندم'] },
  { dayFrom: 43, dayTo: 60, feedG: 30, waterMl: 60, phaseName: 'لِی', lysinePct: 1.05, methioninePct: 0.45, calciumPct: 2.5, availablePhosphorusPct: 0.42, saltPct: 0.22, mainIngredients: ['ذرت', 'کنجاله سویا', 'گندم', 'پودر صدف'] },
  { dayFrom: 61, dayTo: 180, feedG: 32, waterMl: 64, phaseName: 'لِی', lysinePct: 1.05, methioninePct: 0.45, calciumPct: 2.5, availablePhosphorusPct: 0.42, saltPct: 0.22, mainIngredients: ['ذرت', 'کنجاله سویا', 'گندم', 'پودر صدف'] },
  ],
  growth: {
    weightByAge: [
  { dayFrom: 1, dayTo: 14, weightG: 75, adgG: 4.71, fcr: 1.12 },
  { dayFrom: 15, dayTo: 28, weightG: 140, adgG: 4.64, fcr: 1.54 },
  { dayFrom: 29, dayTo: 42, weightG: 180, adgG: 2.86, fcr: 1.78 },
  { dayFrom: 43, dayTo: 60, weightG: 200, adgG: 1.11, fcr: 1.9 },
  { dayFrom: 61, dayTo: 180, weightG: 220, adgG: 0.17, fcr: 1.91 },
    ],
    finalWeightG: 220,
  },
  space: { densityMax: 100, feederSpaceCm: 10, drinkerSpaceCm: 2 },
  equipment: {
    feeder: { chainCmPerBird: 10, panBirdsPerUnit: 30, tubeCmPerBird: 50, manualCmPerBird: 5 },
    drinker: { nippleBirdsPerUnit: 15, cupBirdsPerUnit: 20, troughCmPerBird: 3, manualCmPerBird: 2 },
    lampWattPerM2: 4.5, fanM3PerKg: 5,
  },
  incubation: { totalDays: 17, lockdownDay: 14, setterTemp: 37.5, setterHumidity: 55, hatcherTemp: 37.2, hatcherHumidity: 70 },
  litter: {
    recommended: ['wood_shavings', 'rice_hull'],
    kgPerM2ByMaterial: { wood_shavings: 2.0, rice_hull: 2.0, straw: 3.3, sand: 16.7, sawdust: 2.7, peat: 3.3, paper_roll: 0.2, none: 0 },
    thicknessCm: 5,
    lifetimeDays: 42,
  },
  mortality: [
    { dayFrom: 1, dayTo: 7, maxPct: 2.5 },
    { dayFrom: 8, dayTo: 21, maxPct: 3.0 },
    { dayFrom: 22, dayTo: 60, maxPct: 3.5 },
    { dayFrom: 61, dayTo: 180, maxPct: 4.0 },
  ],
  mortalityTotalPct: 4.5,
  notes: 'بلدرچین تخم‌گذار',
};


// ═══════════════════════════════════════════════
// مادر بلدرچین (Quail Breeder)
// ═══════════════════════════════════════════════
export const QUAIL_BREEDER: BirdStandard = {
  key: 'quail-breeder',
  source: 'مرکز تحقیقات بلدرچین ایران + Japanese Quail Standards',
  publishYear: 1403,
  region: 'iran',
  birdName: 'بلدرچین',
  birdKind: 'quail',
  purposes: ['breeder'],
  primaryPurpose: 'breeder',
  nameFa: 'مادر بلدرچین',
  nameEn: 'Japanese Quail Breeder',
  category: 'industrial',
  biology: {
    sexualMaturityDay: 45, layingStartDay: 50, peakLayingDay: 70,
    endOfCycleDay: 250, cullDay: 270, incubationDays: 17, maleFemaleRatio: 3,
  },
  env: [
    { dayFrom: 1, dayTo: 7, temp: { min: 34, max: 38, target: 36 }, humidity: { min: 60, max: 70 }, light: { hours: 23 } },
    { dayFrom: 8, dayTo: 21, temp: { min: 28, max: 32, target: 30 }, humidity: { min: 55, max: 65 }, light: { hours: 14 } },
    { dayFrom: 22, dayTo: 45, temp: { min: 22, max: 26, target: 24 }, humidity: { min: 55, max: 65 }, light: { hours: 12 } },
    { dayFrom: 46, dayTo: 250, temp: { min: 20, max: 24, target: 22 }, humidity: { min: 50, max: 65 }, light: { hours: 16, lux: 20 } },
    { dayFrom: 251, dayTo: 9999, temp: { min: 20, max: 24, target: 22 }, humidity: { min: 50, max: 65 }, light: { hours: 16, lux: 20 } },
  ],
  feed: [
    { dayFrom: 1, dayTo: 14, feedG: 14, waterMl: 28, phaseName: 'استارتر' },
    { dayFrom: 15, dayTo: 21, feedG: 22, waterMl: 44, phaseName: 'استارتر' },
    { dayFrom: 22, dayTo: 45, feedG: 26, waterMl: 52, phaseName: 'رشد' },
    { dayFrom: 46, dayTo: 250, feedG: 30, waterMl: 60, phaseName: 'تولید' },
    { dayFrom: 251, dayTo: 9999, feedG: 28, waterMl: 56, phaseName: 'پایان' },
  ],
  growth: {
    weightByAge: [
      { dayFrom: 1, dayTo: 14, weightG: 75, adgG: 5, fcr: 1.12 },
      { dayFrom: 15, dayTo: 28, weightG: 140, adgG: 5, fcr: 1.54 },
      { dayFrom: 29, dayTo: 45, weightG: 180, adgG: 2.5, fcr: 1.9 },
      { dayFrom: 46, dayTo: 250, weightG: 210, adgG: 0.15, fcr: 2.2 },
      { dayFrom: 251, dayTo: 9999, weightG: 215, adgG: 0.05, fcr: 2.3 },
    ],
    finalWeightG: 215,
  },
  space: { densityMax: 80, feederSpaceCm: 10, drinkerSpaceCm: 2 },
  equipment: {
    feeder: { chainCmPerBird: 10, panBirdsPerUnit: 30, tubeCmPerBird: 50, manualCmPerBird: 5 },
    drinker: { nippleBirdsPerUnit: 15, cupBirdsPerUnit: 20, troughCmPerBird: 3, manualCmPerBird: 2 },
    lampWattPerM2: 4.5, fanM3PerKg: 5,
  },
  incubation: { totalDays: 17, lockdownDay: 14, setterTemp: 37.5, setterHumidity: 55, hatcherTemp: 37.2, hatcherHumidity: 70 },
  litter: { recommended: ['wood_shavings', 'rice_hull'], kgPerM2ByMaterial: { wood_shavings: 2.0, rice_hull: 2.0, straw: 3.3, sand: 16.7, sawdust: 2.7, peat: 3.3, paper_roll: 0.2, none: 0 }, thicknessCm: 5, lifetimeDays: 42 },
  production: {
    layingStartDay: 50,
    peakLayingPct: 85,
    eggsPerYear: 280,
    eggWeightG: 12,
    cycleDays: 250,
    fertilityPct: 85,
    hatchabilityPct: 75,
  },
  mortality: [
    { dayFrom: 1, dayTo: 7, maxPct: 2.5 },
    { dayFrom: 8, dayTo: 21, maxPct: 3.0 },
    { dayFrom: 22, dayTo: 60, maxPct: 3.5 },
    { dayFrom: 61, dayTo: 9999, maxPct: 4.5 },
  ],
  mortalityTotalPct: 5.5,
  notes: 'مادر بلدرچین ژاپنی — تخم نطفه‌دار برای جوجه‌کشی',
};
