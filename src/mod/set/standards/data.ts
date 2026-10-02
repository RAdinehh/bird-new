import type { BirdStandard, EnvRange, FeedRange } from './types';

const COMMON_BROODING: EnvRange[] = [
  { dayFrom: 1,  dayTo: 3,   temp: { min: 32, max: 35, target: 33 }, humidity: { min: 60, max: 70 }, light: { hours: 23 } },
  { dayFrom: 4,  dayTo: 7,   temp: { min: 30, max: 33, target: 31 }, humidity: { min: 60, max: 70 }, light: { hours: 22 } },
  { dayFrom: 8,  dayTo: 14,  temp: { min: 28, max: 31, target: 29 }, humidity: { min: 55, max: 65 }, light: { hours: 20 } },
  { dayFrom: 15, dayTo: 21,  temp: { min: 26, max: 29, target: 27 }, humidity: { min: 55, max: 65 }, light: { hours: 18 } },
];

const MARANDI: BirdStandard = {
  key: 'marandi',
  nameFa: 'مرندی',
  nameEn: 'Marandi',
  category: 'native',
  env: [
    ...COMMON_BROODING,
    { dayFrom: 22, dayTo: 42,   temp: { min: 22, max: 26, target: 24 }, humidity: { min: 50, max: 65 }, light: { hours: 16 } },
    { dayFrom: 43, dayTo: 9999, temp: { min: 15, max: 28, target: 22 }, humidity: { min: 40, max: 70 }, light: { hours: 14 } },
  ],
  feed: [
    { dayFrom: 1,  dayTo: 7,    feedG: 12, waterMl: 22 },
    { dayFrom: 8,  dayTo: 14,   feedG: 25, waterMl: 45 },
    { dayFrom: 15, dayTo: 21,   feedG: 40, waterMl: 75 },
    { dayFrom: 22, dayTo: 42,   feedG: 55, waterMl: 110 },
    { dayFrom: 43, dayTo: 9999, feedG: 70, waterMl: 140 },
  ],
  production: {
    layingStartDay: 150,
    peakLayingPct: 55,
    eggsPerYear: 165,
    eggWeightG: 50,
    cycleDays: 500,
  },
  mortality: [
    { dayFrom: 1,  dayTo: 7,    maxPct: 2 },
    { dayFrom: 8,  dayTo: 21,   maxPct: 3 },
    { dayFrom: 22, dayTo: 9999, maxPct: 5 },
  ],
  densityMax: 10,
  notes: 'نژاد بومی شمال‌غرب ایران',
};

const GOLPAYGANI: BirdStandard = {
  key: 'golpaygani',
  nameFa: 'گلپایگانی',
  nameEn: 'Golpaygani',
  category: 'native',
  env: [
    ...COMMON_BROODING,
    { dayFrom: 22, dayTo: 42,   temp: { min: 22, max: 26, target: 24 }, humidity: { min: 50, max: 65 }, light: { hours: 16 } },
    { dayFrom: 43, dayTo: 9999, temp: { min: 15, max: 28, target: 22 }, humidity: { min: 40, max: 70 }, light: { hours: 15 } },
  ],
  feed: [
    { dayFrom: 1,  dayTo: 7,    feedG: 13, waterMl: 24 },
    { dayFrom: 8,  dayTo: 14,   feedG: 28, waterMl: 50 },
    { dayFrom: 15, dayTo: 21,   feedG: 45, waterMl: 82 },
    { dayFrom: 22, dayTo: 42,   feedG: 60, waterMl: 120 },
    { dayFrom: 43, dayTo: 9999, feedG: 80, waterMl: 160 },
  ],
  production: {
    layingStartDay: 140,
    peakLayingPct: 60,
    eggsPerYear: 180,
    eggWeightG: 55,
    cycleDays: 520,
  },
  mortality: [
    { dayFrom: 1,  dayTo: 7,    maxPct: 2 },
    { dayFrom: 8,  dayTo: 21,   maxPct: 3 },
    { dayFrom: 22, dayTo: 9999, maxPct: 5 },
  ],
  densityMax: 9,
  notes: 'نژاد بومی اصفهان',
};

const GILINI: BirdStandard = {
  key: 'gilini',
  nameFa: 'گلین',
  nameEn: 'Gilini',
  category: 'native',
  env: [
    ...COMMON_BROODING,
    { dayFrom: 22, dayTo: 42,   temp: { min: 22, max: 26, target: 24 }, humidity: { min: 50, max: 65 }, light: { hours: 16 } },
    { dayFrom: 43, dayTo: 9999, temp: { min: 15, max: 28, target: 22 }, humidity: { min: 40, max: 70 }, light: { hours: 14 } },
  ],
  feed: [
    { dayFrom: 1,  dayTo: 7,    feedG: 12, waterMl: 22 },
    { dayFrom: 8,  dayTo: 14,   feedG: 26, waterMl: 47 },
    { dayFrom: 15, dayTo: 21,   feedG: 42, waterMl: 78 },
    { dayFrom: 22, dayTo: 42,   feedG: 58, waterMl: 115 },
    { dayFrom: 43, dayTo: 9999, feedG: 75, waterMl: 150 },
  ],
  production: {
    layingStartDay: 145,
    peakLayingPct: 55,
    eggsPerYear: 170,
    eggWeightG: 52,
    cycleDays: 510,
  },
  mortality: [
    { dayFrom: 1,  dayTo: 7,    maxPct: 2 },
    { dayFrom: 8,  dayTo: 21,   maxPct: 3 },
    { dayFrom: 22, dayTo: 9999, maxPct: 5 },
  ],
  densityMax: 10,
  notes: 'نژاد بومی ترکیبی',
};

const BROILER: BirdStandard = {
  key: 'broiler',
  nameFa: 'مرغ گوشتی',
  nameEn: 'Broiler (Ross 308)',
  category: 'industrial',
  env: [
    { dayFrom: 1,  dayTo: 3,   temp: { min: 32, max: 34, target: 33 }, humidity: { min: 60, max: 70 }, light: { hours: 23 } },
    { dayFrom: 4,  dayTo: 7,   temp: { min: 30, max: 32, target: 31 }, humidity: { min: 60, max: 70 }, light: { hours: 20 } },
    { dayFrom: 8,  dayTo: 14,  temp: { min: 27, max: 30, target: 28 }, humidity: { min: 55, max: 65 }, light: { hours: 18 } },
    { dayFrom: 15, dayTo: 21,  temp: { min: 24, max: 27, target: 25 }, humidity: { min: 55, max: 65 }, light: { hours: 18 } },
    { dayFrom: 22, dayTo: 35,  temp: { min: 21, max: 24, target: 22 }, humidity: { min: 50, max: 65 }, light: { hours: 18 } },
    { dayFrom: 36, dayTo: 9999, temp: { min: 18, max: 24, target: 21 }, humidity: { min: 50, max: 65 }, light: { hours: 20 } },
  ],
  feed: [
    { dayFrom: 1,  dayTo: 7,    feedG: 18, waterMl: 35 },
    { dayFrom: 8,  dayTo: 14,   feedG: 45, waterMl: 85 },
    { dayFrom: 15, dayTo: 21,   feedG: 85, waterMl: 160 },
    { dayFrom: 22, dayTo: 28,   feedG: 120, waterMl: 230 },
    { dayFrom: 29, dayTo: 35,   feedG: 150, waterMl: 290 },
    { dayFrom: 36, dayTo: 9999, feedG: 170, waterMl: 325 },
  ],
  mortality: [
    { dayFrom: 1,  dayTo: 7,    maxPct: 1 },
    { dayFrom: 8,  dayTo: 21,   maxPct: 2 },
    { dayFrom: 22, dayTo: 9999, maxPct: 4 },
  ],
  densityMax: 20,
  notes: 'مرغ گوشتی صنعتی — Ross 308',
};

const LAYER: BirdStandard = {
  key: 'layer',
  nameFa: 'مرغ تخمگذار',
  nameEn: 'Layer (Hy-Line Brown)',
  category: 'industrial',
  env: [
    { dayFrom: 1,  dayTo: 3,   temp: { min: 32, max: 35, target: 33 }, humidity: { min: 60, max: 70 }, light: { hours: 23 } },
    { dayFrom: 4,  dayTo: 7,   temp: { min: 30, max: 33, target: 31 }, humidity: { min: 60, max: 70 }, light: { hours: 22 } },
    { dayFrom: 8,  dayTo: 14,  temp: { min: 28, max: 30, target: 29 }, humidity: { min: 55, max: 65 }, light: { hours: 18 } },
    { dayFrom: 15, dayTo: 42,  temp: { min: 22, max: 26, target: 24 }, humidity: { min: 55, max: 65 }, light: { hours: 12 } },
    { dayFrom: 43, dayTo: 140, temp: { min: 20, max: 24, target: 22 }, humidity: { min: 50, max: 65 }, light: { hours: 14 } },
    { dayFrom: 141, dayTo: 9999, temp: { min: 18, max: 24, target: 21 }, humidity: { min: 50, max: 65 }, light: { hours: 16 } },
  ],
  feed: [
    { dayFrom: 1,  dayTo: 7,    feedG: 15, waterMl: 28 },
    { dayFrom: 8,  dayTo: 14,   feedG: 30, waterMl: 55 },
    { dayFrom: 15, dayTo: 42,   feedG: 50, waterMl: 95 },
    { dayFrom: 43, dayTo: 140,  feedG: 75, waterMl: 145 },
    { dayFrom: 141, dayTo: 9999, feedG: 115, waterMl: 220 },
  ],
  production: {
    layingStartDay: 140,
    peakLayingPct: 95,
    eggsPerYear: 320,
    eggWeightG: 63,
    cycleDays: 700,
  },
  mortality: [
    { dayFrom: 1,  dayTo: 7,    maxPct: 1 },
    { dayFrom: 8,  dayTo: 21,   maxPct: 2 },
    { dayFrom: 22, dayTo: 9999, maxPct: 3 },
  ],
  densityMax: 15,
  notes: 'مرغ تخمگذار صنعتی — Hy-Line Brown',
};

export const DEFAULT_STANDARDS: Record<string, BirdStandard> = {
  marandi: MARANDI,
  golpaygani: GOLPAYGANI,
  gilini: GILINI,
  broiler: BROILER,
  layer: LAYER,
};

export const FALLBACK_ENV: EnvRange = {
  dayFrom: 0,
  dayTo: 9999,
  temp: { min: 18, max: 26, target: 22 },
  humidity: { min: 40, max: 70 },
  light: { hours: 14 },
};

export const FALLBACK_FEED: FeedRange = {
  dayFrom: 0,
  dayTo: 9999,
  feedG: 80,
  waterMl: 160,
};
