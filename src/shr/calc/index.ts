/**
 * index.ts — نقطه ورود موتور محاسباتی (shr/calc)
 *
 * C1.2 — همه توابع + typeها export می‌شوند.
 */

// ═══ Formulas ═══
export { calculateFCR } from './formulas/fcr';
export { calculateMortality } from './formulas/mortality';
export { calculateEggMetrics } from './formulas/egg';
export { calculateWeightMetrics } from './formulas/weight';
export { calculateFeedMetrics } from './formulas/feed';
export { calculateWaterMetrics } from './formulas/water';
export { calculateStockingDensity } from './formulas/stocking';
export { calculateEPEF } from './formulas/epef';

// ═══ Types ═══
export type {
  Tone,
  FeedMethod,
  CalcContext,
  FcrParams,
  FcrResult,
  MortalityParams,
  MortalityResult,
  EggParams,
  EggResult,
  WeightSample,
  WeightParams,
  WeightResult,
  FeedParams,
  FeedResult,
  WaterParams,
  WaterResult,
  StockingParams,
  StockingResult,
  EpefParams,
  EpefResult,
  Thresholds,
} from './types';
