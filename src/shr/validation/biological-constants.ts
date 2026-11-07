/**
 * validation/biological.ts — قوانین بیولوژیکی و صنعتی مرغداری
 *
 * منابع:
 * - استانداردهای بین‌المللی پرورش طیور (Ross 308, Hy-Line, Lohmann)
 * - تجربه پرورش نژادهای بومی ایران (مرندی، گلپایگانی، گیلینی)
  *
 * (migrated from biological.ts — 5 orphan functions removed)
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
// دمای جوجه‌کشی (per species)
// ═══════════════════════════════════════════════
export const INCUBATION_TEMP = {
  chicken: 37.8,
  turkey: 37.5,
  duck: 37.5,
  quail: 37.5,
} as const;

/**
 * دمای ایده‌آل بر اساس species + fieldPath
 * - inc.* → دمای جوجه‌کشی
 * - dlg/hal.* → دمای سالن (بسته به مرحله پرورش — chick/layer/broiler)
 */
export function getTempIdeal(
  species: string | undefined,
  fieldPath: string,
): number | null {
  if (fieldPath.startsWith('inc.')) {
    if (!species) return null;
    const key = species as keyof typeof INCUBATION_TEMP;
    return INCUBATION_TEMP[key] ?? null;
  }
  // سالن — اولین مرحله (chick) یا ۳۳ درجه به عنوان default
  if (fieldPath.startsWith('dlg.') || fieldPath.startsWith('hal.')) {
    return TEMP.chick.ideal;  // 33°C — user در روز اول
  }
  return null;
}

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
