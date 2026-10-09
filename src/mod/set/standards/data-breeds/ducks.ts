/**
 * data-breeds.ts — ۲۳ نژاد جدید (نسخه ۳)
 * منابع: Cobb/Aviagen 2024، وزارت جهاد ۱۴۰۳، مراکز تحقیقات استانی، منابع داخلی و بین‌المللی
 */

import type { BirdStandard } from '../types';


export const DUCK_PEKIN: BirdStandard = {
  key: 'duck-pekin',
  source: 'منابع پرورش اردک ایران',
  publishYear: 2024,
  region: 'iran',
  birdName: 'اردک',
  birdKind: 'duck',
  purposes: ['broiler'],
  primaryPurpose: 'broiler',
  nameFa: 'اردک پکنی',
  nameEn: 'Pekin Duck',
  category: 'industrial',
  biology: {
    sexualMaturityDay: 150, layingStartDay: 140, peakLayingDay: 200,
    endOfCycleDay: 500, cullDay: 550, incubationDays: 28, maleFemaleRatio: 10,
  },
  env: [
  { dayFrom: 1, dayTo: 7, temp: { min: 28, max: 32, target: 30 }, humidity: { min: 60, max: 70 }, light: { hours: 22 } },
  { dayFrom: 8, dayTo: 14, temp: { min: 24, max: 28, target: 26 }, humidity: { min: 60, max: 65 }, light: { hours: 22 } },
  { dayFrom: 15, dayTo: 21, temp: { min: 20, max: 24, target: 22 }, humidity: { min: 55, max: 65 }, light: { hours: 22 } },
  { dayFrom: 22, dayTo: 28, temp: { min: 18, max: 22, target: 20 }, humidity: { min: 55, max: 65 }, light: { hours: 22 } },
  { dayFrom: 29, dayTo: 42, temp: { min: 16, max: 20, target: 18 }, humidity: { min: 55, max: 65 }, light: { hours: 22 } },
  ],
  feed: [
  { dayFrom: 1, dayTo: 7, feedG: 50, waterMl: 100, phaseName: 'استارتر', lysinePct: 1.1, methioninePct: 0.45, calciumPct: 0.9, availablePhosphorusPct: 0.45, saltPct: 0.2, mainIngredients: ['ذرت', 'کنجاله سویا', 'گندم', 'مکمل'] },
  { dayFrom: 8, dayTo: 14, feedG: 100, waterMl: 200, phaseName: 'استارتر', lysinePct: 1.1, methioninePct: 0.45, calciumPct: 0.9, availablePhosphorusPct: 0.45, saltPct: 0.2, mainIngredients: ['ذرت', 'کنجاله سویا', 'گندم', 'مکمل'] },
  { dayFrom: 15, dayTo: 21, feedG: 160, waterMl: 320, phaseName: 'استارتر', lysinePct: 1.1, methioninePct: 0.45, calciumPct: 0.9, availablePhosphorusPct: 0.45, saltPct: 0.2, mainIngredients: ['ذرت', 'کنجاله سویا', 'گندم', 'مکمل'] },
  { dayFrom: 22, dayTo: 28, feedG: 200, waterMl: 400, phaseName: 'رشد', lysinePct: 0.95, methioninePct: 0.4, calciumPct: 0.85, availablePhosphorusPct: 0.4, saltPct: 0.2, mainIngredients: ['ذرت', 'گندم', 'کنجاله سویا'] },
  { dayFrom: 29, dayTo: 42, feedG: 230, waterMl: 460, phaseName: 'رشد', lysinePct: 0.95, methioninePct: 0.4, calciumPct: 0.85, availablePhosphorusPct: 0.4, saltPct: 0.2, mainIngredients: ['ذرت', 'گندم', 'کنجاله سویا'] },
  ],
  growth: {
    weightByAge: [
  { dayFrom: 1, dayTo: 7, weightG: 180, adgG: 17.86, fcr: 1.31 },
  { dayFrom: 8, dayTo: 14, weightG: 500, adgG: 45.71, fcr: 1.36 },
  { dayFrom: 15, dayTo: 21, weightG: 1100, adgG: 85.71, fcr: 1.45 },
  { dayFrom: 22, dayTo: 28, weightG: 1800, adgG: 100.0, fcr: 1.61 },
  { dayFrom: 29, dayTo: 42, weightG: 3000, adgG: 85.71, fcr: 1.6 },
    ],
    finalWeightG: 3000,
  },
  space: { densityMax: 6, feederSpaceCm: 10, drinkerSpaceCm: 2 },
  equipment: {
    feeder: { chainCmPerBird: 10, panBirdsPerUnit: 30, tubeCmPerBird: 50, manualCmPerBird: 5 },
    drinker: { nippleBirdsPerUnit: 6, cupBirdsPerUnit: 20, troughCmPerBird: 3, manualCmPerBird: 2 },
    lampWattPerM2: 3, fanM3PerKg: 5,
  },
  incubation: { totalDays: 28, lockdownDay: 25, setterTemp: 37.5, setterHumidity: 60, hatcherTemp: 37.0, hatcherHumidity: 70 },
  litter: {
    recommended: ['straw', 'wood_shavings'],
    kgPerM2: 5.0,
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
  notes: 'اردک پکنی',
};

export const DUCK_MUSCOVY: BirdStandard = {
  key: 'duck-muscovy',
  source: 'منابع پرورش اردک ایران',
  publishYear: 2024,
  region: 'iran',
  birdName: 'اردک',
  birdKind: 'duck',
  purposes: ['dual'],
  primaryPurpose: 'dual',
  nameFa: 'اردک موسیقا',
  nameEn: 'Muscovy Duck',
  category: 'industrial',
  biology: {
    sexualMaturityDay: 150, layingStartDay: 140, peakLayingDay: 200,
    endOfCycleDay: 500, cullDay: 550, incubationDays: 35, maleFemaleRatio: 10,
  },
  env: [
  { dayFrom: 1, dayTo: 7, temp: { min: 28, max: 32, target: 30 }, humidity: { min: 60, max: 70 }, light: { hours: 22 } },
  { dayFrom: 8, dayTo: 14, temp: { min: 24, max: 28, target: 26 }, humidity: { min: 60, max: 65 }, light: { hours: 22 } },
  { dayFrom: 15, dayTo: 21, temp: { min: 21, max: 25, target: 23 }, humidity: { min: 55, max: 65 }, light: { hours: 22 } },
  { dayFrom: 22, dayTo: 28, temp: { min: 19, max: 23, target: 21 }, humidity: { min: 55, max: 65 }, light: { hours: 22 } },
  { dayFrom: 29, dayTo: 60, temp: { min: 18, max: 22, target: 20 }, humidity: { min: 55, max: 65 }, light: { hours: 22 } },
  ],
  feed: [
  { dayFrom: 1, dayTo: 7, feedG: 55, waterMl: 110, phaseName: 'استارتر', lysinePct: 1.1, methioninePct: 0.45, calciumPct: 0.9, availablePhosphorusPct: 0.45, saltPct: 0.2, mainIngredients: ['ذرت', 'کنجاله سویا', 'گندم', 'مکمل'] },
  { dayFrom: 8, dayTo: 14, feedG: 110, waterMl: 220, phaseName: 'استارتر', lysinePct: 1.1, methioninePct: 0.45, calciumPct: 0.9, availablePhosphorusPct: 0.45, saltPct: 0.2, mainIngredients: ['ذرت', 'کنجاله سویا', 'گندم', 'مکمل'] },
  { dayFrom: 15, dayTo: 28, feedG: 180, waterMl: 360, phaseName: 'استارتر', lysinePct: 1.1, methioninePct: 0.45, calciumPct: 0.9, availablePhosphorusPct: 0.45, saltPct: 0.2, mainIngredients: ['ذرت', 'کنجاله سویا', 'گندم', 'مکمل'] },
  { dayFrom: 29, dayTo: 60, feedG: 220, waterMl: 440, phaseName: 'رشد', lysinePct: 0.95, methioninePct: 0.4, calciumPct: 0.85, availablePhosphorusPct: 0.4, saltPct: 0.2, mainIngredients: ['ذرت', 'گندم', 'کنجاله سویا'] },
  { dayFrom: 61, dayTo: 180, feedG: 240, waterMl: 480, phaseName: 'فینیشر/لِی', lysinePct: 0.85, methioninePct: 0.38, calciumPct: 2.8, availablePhosphorusPct: 0.42, saltPct: 0.22, mainIngredients: ['ذرت', 'گندم', 'کنجاله سویا', 'پودر صدف'] },
  { dayFrom: 181, dayTo: 365, feedG: 250, waterMl: 500, phaseName: 'فینیشر/لِی', lysinePct: 0.85, methioninePct: 0.38, calciumPct: 2.8, availablePhosphorusPct: 0.42, saltPct: 0.22, mainIngredients: ['ذرت', 'گندم', 'کنجاله سویا', 'پودر صدف'] },
  ],
  growth: {
    weightByAge: [
  { dayFrom: 1, dayTo: 7, weightG: 200, adgG: 21.43, fcr: 1.25 },
  { dayFrom: 8, dayTo: 14, weightG: 600, adgG: 57.14, fcr: 1.33 },
  { dayFrom: 15, dayTo: 28, weightG: 1500, adgG: 64.29, fcr: 1.4 },
  { dayFrom: 29, dayTo: 60, weightG: 2500, adgG: 31.25, fcr: 1.6 },
  { dayFrom: 61, dayTo: 180, weightG: 3500, adgG: 8.33, fcr: 1.71 },
  { dayFrom: 181, dayTo: 365, weightG: 4500, adgG: 5.41, fcr: 1.78 },
    ],
    finalWeightG: 4500,
  },
  space: { densityMax: 5, feederSpaceCm: 10, drinkerSpaceCm: 2 },
  equipment: {
    feeder: { chainCmPerBird: 10, panBirdsPerUnit: 25, tubeCmPerBird: 50, manualCmPerBird: 5 },
    drinker: { nippleBirdsPerUnit: 6, cupBirdsPerUnit: 20, troughCmPerBird: 3, manualCmPerBird: 2 },
    lampWattPerM2: 3, fanM3PerKg: 5,
  },
  incubation: { totalDays: 35, lockdownDay: 32, setterTemp: 37.5, setterHumidity: 60, hatcherTemp: 37.0, hatcherHumidity: 70 },
  litter: {
    recommended: ['straw', 'wood_shavings'],
    kgPerM2: 5.0,
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
  notes: 'اردک موسیقا',
};

export const DUCK_UKRAINIAN: BirdStandard = {
  key: 'duck-ukrainian',
  source: 'منابع پرورش اردک ایران',
  publishYear: 2024,
  region: 'iran',
  birdName: 'اردک',
  birdKind: 'duck',
  purposes: ['dual', 'layer'],
  primaryPurpose: 'dual',
  nameFa: 'اردک اوکراینی',
  nameEn: 'Ukrainian Duck',
  category: 'industrial',
  biology: {
    sexualMaturityDay: 150, layingStartDay: 140, peakLayingDay: 200,
    endOfCycleDay: 500, cullDay: 550, incubationDays: 28, maleFemaleRatio: 10,
  },
  env: [
  { dayFrom: 1, dayTo: 7, temp: { min: 27, max: 31, target: 29 }, humidity: { min: 60, max: 70 }, light: { hours: 22 } },
  { dayFrom: 8, dayTo: 14, temp: { min: 23, max: 27, target: 25 }, humidity: { min: 60, max: 65 }, light: { hours: 22 } },
  { dayFrom: 15, dayTo: 21, temp: { min: 20, max: 24, target: 22 }, humidity: { min: 55, max: 65 }, light: { hours: 22 } },
  { dayFrom: 22, dayTo: 28, temp: { min: 18, max: 22, target: 20 }, humidity: { min: 55, max: 65 }, light: { hours: 22 } },
  { dayFrom: 29, dayTo: 60, temp: { min: 16, max: 20, target: 18 }, humidity: { min: 55, max: 65 }, light: { hours: 22 } },
  ],
  feed: [
  { dayFrom: 1, dayTo: 7, feedG: 50, waterMl: 100, phaseName: 'استارتر', lysinePct: 1.1, methioninePct: 0.45, calciumPct: 0.9, availablePhosphorusPct: 0.45, saltPct: 0.2, mainIngredients: ['ذرت', 'کنجاله سویا', 'گندم', 'مکمل'] },
  { dayFrom: 8, dayTo: 14, feedG: 105, waterMl: 210, phaseName: 'استارتر', lysinePct: 1.1, methioninePct: 0.45, calciumPct: 0.9, availablePhosphorusPct: 0.45, saltPct: 0.2, mainIngredients: ['ذرت', 'کنجاله سویا', 'گندم', 'مکمل'] },
  { dayFrom: 15, dayTo: 28, feedG: 175, waterMl: 350, phaseName: 'استارتر', lysinePct: 1.1, methioninePct: 0.45, calciumPct: 0.9, availablePhosphorusPct: 0.45, saltPct: 0.2, mainIngredients: ['ذرت', 'کنجاله سویا', 'گندم', 'مکمل'] },
  { dayFrom: 29, dayTo: 60, feedG: 210, waterMl: 420, phaseName: 'رشد', lysinePct: 0.95, methioninePct: 0.4, calciumPct: 0.85, availablePhosphorusPct: 0.4, saltPct: 0.2, mainIngredients: ['ذرت', 'گندم', 'کنجاله سویا'] },
  { dayFrom: 61, dayTo: 180, feedG: 230, waterMl: 460, phaseName: 'فینیشر/لِی', lysinePct: 0.85, methioninePct: 0.38, calciumPct: 2.8, availablePhosphorusPct: 0.42, saltPct: 0.22, mainIngredients: ['ذرت', 'گندم', 'کنجاله سویا', 'پودر صدف'] },
  ],
  growth: {
    weightByAge: [
  { dayFrom: 1, dayTo: 7, weightG: 190, adgG: 19.29, fcr: 1.29 },
  { dayFrom: 8, dayTo: 14, weightG: 550, adgG: 51.43, fcr: 1.35 },
  { dayFrom: 15, dayTo: 28, weightG: 1400, adgG: 60.71, fcr: 1.39 },
  { dayFrom: 29, dayTo: 60, weightG: 2400, adgG: 31.25, fcr: 1.58 },
  { dayFrom: 61, dayTo: 180, weightG: 3200, adgG: 6.67, fcr: 1.75 },
    ],
    finalWeightG: 3200,
  },
  space: { densityMax: 5.5, feederSpaceCm: 10, drinkerSpaceCm: 2 },
  equipment: {
    feeder: { chainCmPerBird: 10, panBirdsPerUnit: 28, tubeCmPerBird: 50, manualCmPerBird: 5 },
    drinker: { nippleBirdsPerUnit: 6, cupBirdsPerUnit: 20, troughCmPerBird: 3, manualCmPerBird: 2 },
    lampWattPerM2: 3, fanM3PerKg: 5,
  },
  incubation: { totalDays: 28, lockdownDay: 25, setterTemp: 37.5, setterHumidity: 60, hatcherTemp: 37.0, hatcherHumidity: 70 },
  litter: {
    recommended: ['straw', 'wood_shavings'],
    kgPerM2: 5.0,
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
  notes: 'اردک اوکراینی',
};
