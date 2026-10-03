/**
 * validation/biological.ts — قوانین بیولوژیکی و صنعتی مرغداری
 *
 * منابع:
 * - استانداردهای بین‌المللی پرورش طیور (Ross 308, Hy-Line, Lohmann)
 * - تجربه پرورش نژادهای بومی ایران (مرندی، گلپایگانی، گیلینی)
 */

// ═══════════════════════════════════════════════
// دما
// ═══════════════════════════════════════════════
export const TEMP = {
  minRoom: -10,
  maxRoom: 50,
  chick: { min: 30, max: 36, ideal: 33 },
  layer: { min: 18, max: 26, ideal: 22 },
  broiler: { min: 20, max: 28, ideal: 24 },
} as const;

// ═══════════════════════════════════════════════
// رطوبت
// ═══════════════════════════════════════════════
export const HUMIDITY = {
  min: 20,
  max: 95,
  ideal: { min: 40, max: 70 },
} as const;

// ═══════════════════════════════════════════════
// دان مصرفی
// ═══════════════════════════════════════════════
export const FEED = {
  perBirdGramsPerDay: { min: 10, max: 260 },
  chickStarter: 25, // گرم/روز
  layer: 110, // گرم/روز
  broiler: 150, // گرم/روز
} as const;

// ═══════════════════════════════════════════════
// تخم‌مرغ
// ═══════════════════════════════════════════════
export const EGG = {
  weightGram: { min: 35, max: 85, ideal: 60 },
  henDayPercent: { min: 0, max: 102 }, // بیولوژیکی
  densePerSqMeter: { layer: 9, broiler: 12, breeder: 6 },
} as const;

// ═══════════════════════════════════════════════
// جوجه‌کشی
// ═══════════════════════════════════════════════
export const HATCH = {
  incubationDays: { chicken: 21, turkey: 28, duck: 28, quail: 18 },
  chickWeightGram: { min: 20, max: 60 },
  chickYieldPercent: { min: 64, max: 71 }, // وزن جوجه / وزن تخم
  hatchOfTotal: { min: 0, max: 100 },
  hatchOfFertile: { min: 0, max: 100 },
  candlingDays: { chicken: 7, turkey: 10, duck: 10, quail: 5 },
} as const;

// ═══════════════════════════════════════════════
// رشد و FCR
// ═══════════════════════════════════════════════
export const GROWTH = {
  fcr: { min: 1.0, max: 5.0 },
  adg: { min: 5, max: 80 }, // میانگین افزایش وزن روزانه (گرم)
  mortality: {
    broiler: { daily: 0.15, weekly: 1.0, total: 5 },
    layer: { daily: 0.05, weekly: 0.3, total: 8 },
    breeder: { daily: 0.08, weekly: 0.5, total: 10 },
  },
} as const;

// ═══════════════════════════════════════════════
// فیزیک سالن
// ═══════════════════════════════════════════════
export const HALL = {
  densityBirdsPerSqM: { min: 3, max: 25 },
  areaSqM: { min: 5, max: 5000 },
  capacityBirds: { min: 10, max: 100000 },
} as const;

// ═══════════════════════════════════════════════
// جیره و مواد مغذی (برای fed)
// ═══════════════════════════════════════════════
export const RATION = {
  inclusionSumPct: { target: 100, tolerance: 0.1 },
  nutrients: {
    meKcalPerKg: { min: 2400, max: 3400 },
    crudeProteinPct: { min: 12, max: 28 },
    calciumPct: { min: 0.6, max: 4.5 },
    availablePhosphorusPct: { min: 0.25, max: 0.8 },
    lysinePct: { min: 0.5, max: 1.7 },
    methioninePct: { min: 0.25, max: 0.9 },
    sodiumPct: { min: 0.12, max: 0.25 },
  },
} as const;

// ═══════════════════════════════════════════════
// توابع کمکی
// ═══════════════════════════════════════════════

/** میانگین وزن جوجه (گرم) از وزن تخم */
export function chickWeightFromEgg(eggGram: number): number {
  return Math.round(eggGram * 0.675); // ضریب صنعت
}

/** FCR = دان مصرفی (kg) / افزایش وزن یا تولید (kg) */
export function fcr(feedKg: number, gainKg: number): number {
  if (gainKg <= 0) return 0;
  return Math.round((feedKg / gainKg) * 100) / 100;
}

/** Hen-Day % = تخم سالم / تعداد مرغ زنده × 100 */
export function henDayPercent(eggs: number, liveBirds: number): number {
  if (liveBirds <= 0) return 0;
  return Math.round((eggs / liveBirds) * 1000) / 10;
}

/** میانگین وزن (گرم) از مجموع کیلوگرم / تعداد */
export function avgEggGram(totalKg: number, count: number): number {
  if (count <= 0) return 0;
  return Math.round((totalKg * 1000 / count) * 10) / 10;
}

/** دان مصرفی به ازای هر پرنده (گرم/روز) */
export function feedPerBirdGram(feedKg: number, birds: number, days = 1): number {
  if (birds <= 0 || days <= 0) return 0;
  return Math.round((feedKg * 1000) / (birds * days));
}
