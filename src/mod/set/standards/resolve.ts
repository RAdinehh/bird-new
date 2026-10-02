/**
 * resolve.ts — توابع Priority Chain (نسخه ۲)
 *
 * Priority:
 *   1. Override (کاربر در فرم)
 *   2. Settings (پنل تنظیمات)
 *   3. Default (DEFAULT_STANDARDS)
 *   4. Fallback
 */

import type {
  BirdType, EnvRange, FeedRange, GrowthRange, BirdStandard,
  EffectiveEnv, EffectiveFeed, EffectiveGrowth, ResolveSource,
  BiologyStandard, SpaceStandard, EquipmentRatios, ProductionStandard,
  MortalityRange,
} from './types';
import { DEFAULT_STANDARDS, FALLBACK_ENV, FALLBACK_FEED, FALLBACK_GROWTH } from './data';

// ═══ نگاشت نام فارسی → key ═══
const NAME_TO_KEY: Record<string, BirdType> = {
  'مرندی': 'marandi',
  'گلپایگانی': 'golpaygani',
  'گلین': 'gilini',
  'مرغ': 'marandi',
  'مرغ گوشتی': 'broiler',
  'گوشتی': 'broiler',
  'مرغ تخمگذار': 'layer',
  'تخمگذار': 'layer',
};

export function resolveBirdType(birdName: string | null | undefined): BirdType | null {
  if (!birdName) return null;
  const clean = birdName.trim();
  if (NAME_TO_KEY[clean]) return NAME_TO_KEY[clean];
  for (const [name, key] of Object.entries(NAME_TO_KEY)) {
    if (clean.includes(name)) return key;
  }
  return null;
}

// ═══ Helpers ═══
function findInRange<T extends { dayFrom: number; dayTo: number }>(arr: T[], ageDays: number): T | null {
  if (!arr || arr.length === 0) return null;
  const safeAge = Math.max(1, ageDays || 0);
  for (const range of arr) {
    if (safeAge >= range.dayFrom && safeAge <= range.dayTo) return range;
  }
  return arr[arr.length - 1] || null;
}

export interface ResolveOptions {
  customStandards?: Record<string, BirdStandard>;
}

function getStandard(
  birdType: BirdType | null,
  opts?: ResolveOptions,
): { std: BirdStandard | null; source: 'settings' | 'default' } {
  if (!birdType) return { std: null, source: 'default' };
  const custom = opts?.customStandards?.[birdType];
  if (custom) return { std: custom, source: 'settings' };
  const def = DEFAULT_STANDARDS[birdType];
  if (def) return { std: def, source: 'default' };
  return { std: null, source: 'default' };
}

function resolveKey(birdNameOrKey: string | null | undefined): BirdType | null {
  if (!birdNameOrKey) return null;
  const direct = NAME_TO_KEY[birdNameOrKey];
  if (direct) return direct;
  if (birdNameOrKey in DEFAULT_STANDARDS) return birdNameOrKey as BirdType;
  // تلاش با includes
  return resolveBirdType(birdNameOrKey);
}

// ═══ Env ═══
export function getEffectiveEnv(
  birdNameOrKey: string | null | undefined,
  ageDays: number | null,
  overrideTemp?: number | null,
  opts?: ResolveOptions,
): EffectiveEnv {
  const key = resolveKey(birdNameOrKey);
  const { std, source: stdSource } = getStandard(key, opts);

  const baseRange = std ? findInRange(std.env, ageDays || 0) : null;

  let source: ResolveSource = stdSource;
  let temp = baseRange?.temp || FALLBACK_ENV.temp;
  const humidity = baseRange?.humidity || FALLBACK_ENV.humidity;
  const light = baseRange?.light || FALLBACK_ENV.light;

  if (overrideTemp != null && !isNaN(overrideTemp)) {
    temp = { min: overrideTemp - 2, max: overrideTemp + 2, target: overrideTemp };
    source = 'override';
  } else if (!baseRange) {
    source = 'fallback';
  }

  return { temp, humidity, light, source };
}

// ═══ Feed ═══
export function getEffectiveFeed(
  birdNameOrKey: string | null | undefined,
  ageDays: number | null,
  overrideFeedG?: number | null,
  overrideWaterMl?: number | null,
  opts?: ResolveOptions,
): EffectiveFeed {
  const key = resolveKey(birdNameOrKey);
  const { std, source: stdSource } = getStandard(key, opts);

  const baseRange = std ? findInRange(std.feed, ageDays || 0) : null;

  let source: ResolveSource = stdSource;
  let feedG = baseRange?.feedG ?? FALLBACK_FEED.feedG;
  let waterMl = baseRange?.waterMl ?? FALLBACK_FEED.waterMl;

  if (overrideFeedG != null && !isNaN(overrideFeedG)) {
    feedG = overrideFeedG;
    source = 'override';
  }
  if (overrideWaterMl != null && !isNaN(overrideWaterMl)) {
    waterMl = overrideWaterMl;
    source = 'override';
  } else if (!baseRange && source !== 'override') {
    source = 'fallback';
  }

  return {
    feedG,
    waterMl,
    proteinPct: baseRange?.proteinPct,
    energyKcal: baseRange?.energyKcal,
    source,
  };
}

// ═══ 🆕 Growth ═══
export function getEffectiveGrowth(
  birdNameOrKey: string | null | undefined,
  ageDays: number | null,
  opts?: ResolveOptions,
): EffectiveGrowth {
  const key = resolveKey(birdNameOrKey);
  const { std, source: stdSource } = getStandard(key, opts);

  const baseRange = std ? findInRange(std.growth?.weightByAge || [], ageDays || 0) : null;

  if (!baseRange) {
    return { ...FALLBACK_GROWTH, source: 'fallback' };
  }

  return {
    weightG: baseRange.weightG,
    adgG: baseRange.adgG,
    fcr: baseRange.fcr,
    source: stdSource,
  };
}

// ═══ 🆕 Biology ═══
export function getBiology(
  birdNameOrKey: string | null | undefined,
  opts?: ResolveOptions,
): BiologyStandard | null {
  const key = resolveKey(birdNameOrKey);
  const { std } = getStandard(key, opts);
  return std?.biology || null;
}

// ═══ 🆕 Space ═══
export function getSpace(
  birdNameOrKey: string | null | undefined,
  opts?: ResolveOptions,
): SpaceStandard | null {
  const key = resolveKey(birdNameOrKey);
  const { std } = getStandard(key, opts);
  return std?.space || null;
}

// ═══ 🆕 Equipment ═══
export function getEquipment(
  birdNameOrKey: string | null | undefined,
  opts?: ResolveOptions,
): EquipmentRatios | null {
  const key = resolveKey(birdNameOrKey);
  const { std } = getStandard(key, opts);
  return std?.equipment || null;
}

// ═══ 🆕 Production ═══
export function getProduction(
  birdNameOrKey: string | null | undefined,
  opts?: ResolveOptions,
): ProductionStandard | null {
  const key = resolveKey(birdNameOrKey);
  const { std } = getStandard(key, opts);
  return std?.production || null;
}

// ═══ 🆕 Mortality ═══
export function getMortalityRange(
  birdNameOrKey: string | null | undefined,
  ageDays: number | null,
  opts?: ResolveOptions,
): MortalityRange | null {
  const key = resolveKey(birdNameOrKey);
  const { std } = getStandard(key, opts);
  if (!std) return null;
  return findInRange(std.mortality, ageDays || 0);
}

// ═══ Standard کامل ═══
export function getStandardFor(
  birdNameOrKey: string | null | undefined,
  opts?: ResolveOptions,
): BirdStandard | null {
  const key = resolveKey(birdNameOrKey);
  const { std } = getStandard(key, opts);
  return std;
}
