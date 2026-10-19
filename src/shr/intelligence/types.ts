/**
 * intelligence/types.ts — انواع مشترک سیستم هوشمند هشدار
 */

export type FieldKind =
  | 'price' | 'percent' | 'count' | 'weight' | 'temperature'
  | 'humidity' | 'date' | 'duration' | 'ratio' | 'volume'
  | 'area' | 'energy' | 'capacity' | 'density' | 'money'
  | 'feed' | 'water' | 'egg' | 'age';

export type ExpectedSource =
  | 'hard_only'
  | 'history'
  | 'history_refbook'
  | 'species'
  | 'species_curve'
  | 'species_temp'
  | 'cross_field'
  | 'user_pattern';

export type Comparison = 'ratio' | 'range' | 'absolute' | 'deviation';

export type AlertLevel = 'yellow' | 'orange' | 'red';

export interface FieldProfile {
  fieldPath: string;
  kind: FieldKind;
  unit?: string;
  /** hardMin/hardMax می‌توانند عدد یا placeholder داینامیک باشند ('${flock.currentCount}') */
  hardMin: number | string;
  hardMax: number | string;
  expectedFrom: ExpectedSource;
  comparison: Comparison;
  /** محدوده زیستی/استاندارد برای signal 4 (اختیاری) */
  biologicalRange?: { min: number; max: number };
  /** قاعده cross-field (اختیاری): lte_flock, lte_female, lte_current, ... */
  crossFieldRule?: string;
  /** آیا structural break (تورم) در نظر گرفته شود */
  structuralBreakAware?: boolean;
  /** اگر تاریخچه کافی نبود، هیچ هشدار نرمی نده */
  suppressIfNoHistory?: boolean;
}

export interface Signal {
  type: string;
  weight: number;
  detail: string;
}

export interface Warning {
  level: AlertLevel;
  field: string;
  value: number;
  reason: string;
  expected?: number;
  signals: Signal[];
}

export interface AnalysisContext {
  species?: string;
  breedKey?: string;
  ageDays?: number;
  flockSize?: number;
  femaleCount?: number;
  currentCount?: number;
  itemId?: string;
  date?: string;
  /** مقدار انتظار (اگر caller از data-breeds خونده و پاس داده) */
  expected?: number;
  /** برای مقایسه range */
  expectedMin?: number;
  expectedMax?: number;
  /** برای مقایسه deviation (مثلاً partnerPercent) */
  userPatternMean?: number;
  userPatternStd?: number;
  [key: string]: unknown;
}

export interface FieldHistoryEntry {
  v: number;
  ctx: Partial<AnalysisContext>;
  date: string;
  confirmed: boolean;
  outlier: boolean;
}

export interface FieldStats {
  count: number;
  mean: number;
  median: number;
  std: number;
  cv: number;
  p25: number;
  p75: number;
  min: number;
  max: number;
  lastApproach: number | null;
  structuralBreak: boolean;
  recentMean?: number;
}

export interface FieldHistory {
  values: FieldHistoryEntry[];
  stats: FieldStats | null;
  lastUpdate: string;
}

export interface HistoryStorage {
  get(fieldPath: string): FieldHistory | null;
  set(fieldPath: string, h: FieldHistory): void;
  clear(): void;
}
