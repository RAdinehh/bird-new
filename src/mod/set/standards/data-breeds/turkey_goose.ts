/**
 * data-breeds.ts — ۲۳ نژاد جدید (نسخه ۳)
 * منابع: Cobb/Aviagen 2024، وزارت جهاد ۱۴۰۳، مراکز تحقیقات استانی، منابع داخلی و بین‌المللی
 */

import type { BirdStandard } from '../types';


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
  { dayFrom: 43, dayTo: 365, temp: { min: 16, max: 20, target: 18 }, humidity: { min: 55, max: 65 }, light: { hours: 22 } },
  ],
  feed: [
  { dayFrom: 1, dayTo: 14, feedG: 60, waterMl: 120, phaseName: 'استارتر', lysinePct: 1.05, methioninePct: 0.42, calciumPct: 0.9, availablePhosphorusPct: 0.4, saltPct: 0.2, mainIngredients: ['ذرت', 'کنجاله سویا', 'گندم'] },
  { dayFrom: 15, dayTo: 28, feedG: 130, waterMl: 260, phaseName: 'استارتر', lysinePct: 1.05, methioninePct: 0.42, calciumPct: 0.9, availablePhosphorusPct: 0.4, saltPct: 0.2, mainIngredients: ['ذرت', 'کنجاله سویا', 'گندم'] },
  { dayFrom: 29, dayTo: 60, feedG: 220, waterMl: 440, phaseName: 'رشد', lysinePct: 0.9, methioninePct: 0.38, calciumPct: 0.85, availablePhosphorusPct: 0.38, saltPct: 0.2, mainIngredients: ['ذرت', 'گندم', 'کنجاله سویا'] },
  { dayFrom: 61, dayTo: 90, feedG: 280, waterMl: 560, phaseName: 'رشد', lysinePct: 0.9, methioninePct: 0.38, calciumPct: 0.85, availablePhosphorusPct: 0.38, saltPct: 0.2, mainIngredients: ['ذرت', 'گندم', 'کنجاله سویا'] },
  { dayFrom: 91, dayTo: 365, feedG: 320, waterMl: 640, phaseName: 'پروار', lysinePct: 0.75, methioninePct: 0.32, calciumPct: 0.8, availablePhosphorusPct: 0.35, saltPct: 0.18, mainIngredients: ['ذرت', 'گندم', 'یونجه', 'کنجاله سویا'] },
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
    { dayFrom: 1, dayTo: 7, maxPct: 2.0 },
    { dayFrom: 8, dayTo: 21, maxPct: 2.5 },
    { dayFrom: 22, dayTo: 60, maxPct: 3.0 },
    { dayFrom: 61, dayTo: 180, maxPct: 3.5 },
    { dayFrom: 181, dayTo: 365, maxPct: 4.0 },
  ],
  mortalityTotalPct: 4.5,
  notes: 'غاز',
};
