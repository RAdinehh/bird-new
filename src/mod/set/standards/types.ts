/**
 * types.ts — انواع استانداردهای محیطی، تغذیه‌ای و تولیدی
 */

export type BirdCategory = 'native' | 'industrial';

export type BirdType =
  | 'marandi'
  | 'golpaygani'
  | 'gilini'
  | 'broiler'
  | 'layer';

export interface EnvRange {
  dayFrom: number;
  dayTo: number;
  temp: { min: number; max: number; target: number };
  humidity: { min: number; max: number };
  light: { hours: number };
}

export interface FeedRange {
  dayFrom: number;
  dayTo: number;
  feedG: number;
  waterMl: number;
}

export interface ProductionStandard {
  layingStartDay: number;
  peakLayingPct: number;
  eggsPerYear: number;
  eggWeightG: number;
  cycleDays: number;
}

export interface MortalityRange {
  dayFrom: number;
  dayTo: number;
  maxPct: number;
}

export interface BirdStandard {
  key: BirdType;
  nameFa: string;
  nameEn: string;
  category: BirdCategory;
  env: EnvRange[];
  feed: FeedRange[];
  production?: ProductionStandard;
  mortality: MortalityRange[];
  densityMax: number;
  notes?: string;
}

export type ResolveSource = 'override' | 'settings' | 'default' | 'fallback';

export interface EffectiveEnv {
  temp: { min: number; max: number; target: number };
  humidity: { min: number; max: number };
  light: { hours: number };
  source: ResolveSource;
}

export interface EffectiveFeed {
  feedG: number;
  waterMl: number;
  source: ResolveSource;
}
