/**
 * types.ts — typeهای موتور محاسباتی مشترک (shr/calc)
 *
 * فاز C1.1 — فقط type، بدون منطق.
 * منبع استانداردها: src/mod/set/standards
 * منبع فرمول‌ها: biological.ts (منتقل می‌شود) + استانداردهای جهانی
 */

// ═══════════════════════════════════════════════
// نوع‌های پایه
// ═══════════════════════════════════════════════

export type Tone = 'accent' | 'info' | 'warn' | 'danger';

export type FeedMethod =
  | 'scoop'
  | 'bag'
  | 'semi_auto'
  | 'auto_sensor'
  | 'auto_chain';

export interface CalcContext {
  breedId: string;
  flockType: 'broiler' | 'layer' | 'breeder' | 'ornamental';
  ageDays: number;
  aliveCount: number;
  initialCount: number;
}

// ═══════════════════════════════════════════════
// FCR
// ═══════════════════════════════════════════════

export interface FcrParams {
  feedConsumedKg: number;
  initialWeightKg: number;
  finalWeightKg: number;
  aliveCount: number;
  standardFCR: number | null;
}

export interface FcrResult {
  fcr: number | null;
  confidence: 'exact' | 'approximate' | 'insufficient';
  totalFeedKg: number;
  totalGainKg: number;
  standardFCR: number | null;
  diffPct: number | null;
  tone: Tone;
  reason: string;
}

// ═══════════════════════════════════════════════
// Mortality
// ═══════════════════════════════════════════════

export interface MortalityParams {
  deathsToday: number;
  deathsThisWeek: number;
  deathsCumulative: number;
  aliveToday: number;
  initialCount: number;
  standardDailyPct: number | null;
  standardWeeklyPct: number | null;
  standardTotalPct: number | null;
}

export interface MortalityResult {
  dailyPct: number;
  weeklyPct: number;
  cumulativePct: number;
  dailyTone: Tone;
  weeklyTone: Tone;
  cumulativeTone: Tone;
  dailyDiffPct: number | null;
  weeklyDiffPct: number | null;
  cumulativeDiffPct: number | null;
}

// ═══════════════════════════════════════════════
// Egg Production
// ═══════════════════════════════════════════════

export interface EggParams {
  eggsToday: number;
  eggsBroken: number;
  eggsDirty: number;
  eggsCumulative: number;
  aliveToday: number;
  initialCount: number;
  standardHenDayPct: number | null;
  standardHenHousedPct: number | null;
}

export interface EggResult {
  henDayPct: number;
  henDayTone: Tone;
  henDayDiffPct: number | null;
  henHousedPct: number;
  henHousedTone: Tone;
  brokenRatePct: number;
  brokenTone: Tone;
  dirtyRatePct: number;
  dirtyTone: Tone;
}

// ═══════════════════════════════════════════════
// Weight
// ═══════════════════════════════════════════════

export interface WeightSample {
  weight: number;
}

export interface WeightParams {
  samples: WeightSample[];
  previousAvgWeightG: number | null;
  ageDays: number;
  standardWeightG: number | null;
}

export interface WeightResult {
  avgWeightG: number;
  cvPct: number;
  uniformityPct: number;
  adgG: number;
  standardWeightG: number | null;
  weightDiffPct: number | null;
  cvTone: Tone;
  uniformityTone: Tone;
  weightTone: Tone;
  hasData: boolean;
}

// ═══════════════════════════════════════════════
// Feed
// ═══════════════════════════════════════════════

export interface FeedParams {
  feedMethod: FeedMethod;
  feedDeliveredKg: number;
  feedRemainingKg: number | null;
  previousRemainingKg: number | null;
  aliveCount: number;
}

export interface FeedResult {
  feedConsumedKg: number;
  feedPerBirdG: number;
  mode: 'simple' | 'precision';
  warning: string | null;
}

// ═══════════════════════════════════════════════
// Water
// ═══════════════════════════════════════════════

export interface WaterParams {
  waterAmountL: number;
  feedConsumedKg: number;
  aliveCount: number;
  standardWaterFeedRatio: number | null;
}

export interface WaterResult {
  waterPerBirdMl: number;
  waterFeedRatio: number;
  waterFeedTone: Tone;
  warning: string | null;
}

// ═══════════════════════════════════════════════
// Stocking
// ═══════════════════════════════════════════════

export interface StockingParams {
  aliveCount: number;
  hallAreaSqM: number;
  standardDensityMax: number | null;
}

export interface StockingResult {
  densityBirdPerSqM: number;
  standardDensityMax: number | null;
  tone: Tone;
  warning: string | null;
}

// ═══════════════════════════════════════════════
// EPEF
// ═══════════════════════════════════════════════

export interface EpefParams {
  livabilityPct: number;
  finalWeightKg: number;
  ageDays: number;
  fcr: number;
}

export interface EpefResult {
  epef: number;
  tone: Tone;
}

// ═══════════════════════════════════════════════
// Thresholds
// ═══════════════════════════════════════════════

export interface Thresholds {
  temp: { min: number; max: number; target: number } | null;
  humidity: { min: number; max: number; target: number } | null;
  lightHours: { min: number; max: number } | null;
  feedPerBirdG: { min: number; max: number } | null;
  waterFeedRatio: { min: number; max: number } | null;
  fcr: number | null;
  adgG: number | null;
  cvPct: number | null;
  uniformityPct: number | null;
  mortality: {
    dailyPct: number;
    weeklyPct: number;
    totalPct: number;
  } | null;
  henDayPct: number | null;
  henHousedPct: number | null;
  eggWeightG: number | null;
  densityBirdPerSqM: number | null;
}
