/**
 * data-breeds.ts — ۲۳ نژاد جدید (نسخه ۳)
 * منابع: Cobb/Aviagen 2024، وزارت جهاد ۱۴۰۳، مراکز تحقیقات استانی، منابع داخلی و بین‌المللی
 */

import type { BirdStandard } from '../types';


export const TURKEY: BirdStandard = {
  key: 'turkey',
  source: 'منابع پرورش بوقلمون ایران + BUT',
  publishYear: 1403,
  region: 'iran',
  birdName: 'بوقلمون',
  birdKind: 'turkey',
  purposes: ['broiler'],
  primaryPurpose: 'broiler',
  nameFa: 'بوقلمون (برنز/بوربون/بیوتی)',
  nameEn: 'Turkey',
  category: 'industrial',
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
  { dayFrom: 1, dayTo: 14, feedG: 40, waterMl: 80, phaseName: 'استارتر', lysinePct: 1.6, methioninePct: 0.55, calciumPct: 1.2, availablePhosphorusPct: 0.55, saltPct: 0.25, mainIngredients: ['ذرت', 'کنجاله سویا', 'پودر ماهی', 'مکمل'] },
  { dayFrom: 15, dayTo: 28, feedG: 90, waterMl: 180, phaseName: 'استارتر', lysinePct: 1.6, methioninePct: 0.55, calciumPct: 1.2, availablePhosphorusPct: 0.55, saltPct: 0.25, mainIngredients: ['ذرت', 'کنجاله سویا', 'پودر ماهی', 'مکمل'] },
  { dayFrom: 29, dayTo: 42, feedG: 160, waterMl: 320, phaseName: 'گروئر', lysinePct: 1.4, methioninePct: 0.5, calciumPct: 1.1, availablePhosphorusPct: 0.5, saltPct: 0.22, mainIngredients: ['ذرت', 'کنجاله سویا', 'گندم'] },
  { dayFrom: 43, dayTo: 84, feedG: 260, waterMl: 520, phaseName: 'گروئر', lysinePct: 1.4, methioninePct: 0.5, calciumPct: 1.1, availablePhosphorusPct: 0.5, saltPct: 0.22, mainIngredients: ['ذرت', 'کنجاله سویا', 'گندم'] },
  { dayFrom: 85, dayTo: 150, feedG: 350, waterMl: 700, phaseName: 'فینیشر', lysinePct: 1.2, methioninePct: 0.4, calciumPct: 1.0, availablePhosphorusPct: 0.45, saltPct: 0.2, mainIngredients: ['ذرت', 'گندم', 'کنجاله سویا'] },
  ],
  growth: {
    weightByAge: [
  { dayFrom: 1, dayTo: 14, weightG: 350, adgG: 21.07, fcr: 1.16 },
  { dayFrom: 15, dayTo: 28, weightG: 900, adgG: 39.29, fcr: 1.39 },
  { dayFrom: 29, dayTo: 42, weightG: 1800, adgG: 64.29, fcr: 1.5 },
  { dayFrom: 43, dayTo: 84, weightG: 4500, adgG: 64.29, fcr: 1.4 },
  { dayFrom: 85, dayTo: 150, weightG: 8000, adgG: 53.03, fcr: 1.56 },
    ],
    finalWeightG: 8000,
  },
  space: { densityMax: 5, feederSpaceCm: 10, drinkerSpaceCm: 2 },
  equipment: {
    feeder: { chainCmPerBird: 10, panBirdsPerUnit: 40, tubeCmPerBird: 50, manualCmPerBird: 5 },
    drinker: { nippleBirdsPerUnit: 12, cupBirdsPerUnit: 20, troughCmPerBird: 3, manualCmPerBird: 2 },
    lampWattPerM2: 3, fanM3PerKg: 7.5,
  },
  incubation: { totalDays: 28, lockdownDay: 25, setterTemp: 37.5, setterHumidity: 55, hatcherTemp: 37.0, hatcherHumidity: 70 },
  litter: {
    recommended: ['wood_shavings', 'straw'],
    kgPerM2: 4.5,
    thicknessCm: 8,
    lifetimeDays: 60,
  },
  mortality: [
    { dayFrom: 1, dayTo: 7, maxPct: 1 },
    { dayFrom: 8, dayTo: 30, maxPct: 1.5 },
    { dayFrom: 31, dayTo: 365, maxPct: 2 },
  ],
  mortalityTotalPct: 4.5,
  notes: 'بوقلمون (برنز/بوربون/بیوتی)',
};

export const GOOSE: BirdStandard = {
  key: 'goose',
  source: 'سازمان دامپزشکی ایران',
  publishYear: 1403,
  region: 'iran',
  birdName: 'غاز',
  birdKind: 'goose',
  purposes: ['broiler', 'dual'],
  primaryPurpose: 'dual',
  nameFa: 'غاز',
  nameEn: 'Goose',
  category: 'industrial',
  biology: {
    sexualMaturityDay: 150, layingStartDay: 140, peakLayingDay: 200,
    endOfCycleDay: 500, cullDay: 550, incubationDays: 30, maleFemaleRatio: 10,
  },
  env: [
  { dayFrom: 1, dayTo: 3, temp: { min: 32, max: 36, target: 34 }, humidity: { min: 60, max: 70 }, light: { hours: 22 } },
  { dayFrom: 4, dayTo: 7, temp: { min: 30, max: 34, target: 32 }, humidity: { min: 60, max: 65 }, light: { hours: 22 } },
  { dayFrom: 8, dayTo: 14, temp: { min: 26, max: 30, target: 28 }, humidity: { min: 55, max: 65 }, light: { hours: 22 } },
  { dayFrom: 15, dayTo: 21, temp: { min: 22, max: 26, target: 24 }, humidity: { min: 55, max: 65 }, light: { hours: 22 } },
  { dayFrom: 22, dayTo: 42, temp: { min: 18, max: 22, target: 20 }, humidity: { min: 55, max: 65 }, light: { hours: 22 } },
  { dayFrom: 43, dayTo: 90, temp: { min: 16, max: 20, target: 18 }, humidity: { min: 55, max: 65 }, light: { hours: 22 } },
  ],
  feed: [
  { dayFrom: 1, dayTo: 14, feedG: 60, waterMl: 120, phaseName: 'استارتر', lysinePct: 1.05, methioninePct: 0.42, calciumPct: 0.9, availablePhosphorusPct: 0.4, saltPct: 0.2, mainIngredients: ['ذرت', 'کنجاله سویا', 'گندم'] },
  { dayFrom: 15, dayTo: 28, feedG: 130, waterMl: 260, phaseName: 'استارتر', lysinePct: 1.05, methioninePct: 0.42, calciumPct: 0.9, availablePhosphorusPct: 0.4, saltPct: 0.2, mainIngredients: ['ذرت', 'کنجاله سویا', 'گندم'] },
  { dayFrom: 29, dayTo: 60, feedG: 220, waterMl: 440, phaseName: 'رشد', lysinePct: 0.9, methioninePct: 0.38, calciumPct: 0.85, availablePhosphorusPct: 0.38, saltPct: 0.2, mainIngredients: ['ذرت', 'گندم', 'کنجاله سویا'] },
  { dayFrom: 61, dayTo: 90, feedG: 280, waterMl: 560, phaseName: 'رشد', lysinePct: 0.9, methioninePct: 0.38, calciumPct: 0.85, availablePhosphorusPct: 0.38, saltPct: 0.2, mainIngredients: ['ذرت', 'گندم', 'کنجاله سویا'] },
  { dayFrom: 91, dayTo: 180, feedG: 320, waterMl: 640, phaseName: 'پروار', lysinePct: 0.75, methioninePct: 0.32, calciumPct: 0.8, availablePhosphorusPct: 0.35, saltPct: 0.18, mainIngredients: ['ذرت', 'گندم', 'یونجه', 'کنجاله سویا'] },
  ],
  growth: {
    weightByAge: [
  { dayFrom: 1, dayTo: 14, weightG: 500, adgG: 28.57, fcr: 1.2 },
  { dayFrom: 15, dayTo: 28, weightG: 1200, adgG: 50.0, fcr: 1.42 },
  { dayFrom: 29, dayTo: 60, weightG: 2500, adgG: 40.62, fcr: 1.48 },
  { dayFrom: 61, dayTo: 90, weightG: 3800, adgG: 43.33, fcr: 1.66 },
  { dayFrom: 91, dayTo: 180, weightG: 5000, adgG: 13.33, fcr: 1.76 },
    ],
    finalWeightG: 5000,
  },
  space: { densityMax: 4, feederSpaceCm: 10, drinkerSpaceCm: 2 },
  equipment: {
    feeder: { chainCmPerBird: 10, panBirdsPerUnit: 25, tubeCmPerBird: 50, manualCmPerBird: 5 },
    drinker: { nippleBirdsPerUnit: 8, cupBirdsPerUnit: 20, troughCmPerBird: 3, manualCmPerBird: 2 },
    lampWattPerM2: 3, fanM3PerKg: 5,
  },
  incubation: { totalDays: 30, lockdownDay: 27, setterTemp: 37.5, setterHumidity: 60, hatcherTemp: 37.0, hatcherHumidity: 75 },
  litter: {
    recommended: ['straw', 'wood_shavings'],
    kgPerM2: 5.5,
    thicknessCm: 10,
    lifetimeDays: 30,
    replacementsPerCycle: 4,
  },
  mortality: [
    { dayFrom: 1, dayTo: 7, maxPct: 1 },
    { dayFrom: 8, dayTo: 30, maxPct: 1.5 },
    { dayFrom: 31, dayTo: 365, maxPct: 2 },
  ],
  mortalityTotalPct: 4.5,
  notes: 'غاز',
};
