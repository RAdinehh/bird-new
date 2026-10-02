import type {
  BirdType, EnvRange, FeedRange, BirdStandard,
  EffectiveEnv, EffectiveFeed, ResolveSource,
} from './types';
import { DEFAULT_STANDARDS, FALLBACK_ENV, FALLBACK_FEED } from './data';

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

function findEnvRange(env: EnvRange[], ageDays: number): EnvRange | null {
  if (!env || env.length === 0) return null;
  // اگر سن 0 یا منفی بود، مثل روز ۱ حساب کن (جوجه تازه هچ‌شده)
  const safeAge = Math.max(1, ageDays || 0);
  for (const range of env) {
    if (safeAge >= range.dayFrom && safeAge <= range.dayTo) return range;
  }
  return env[env.length - 1] || null;
}

function findFeedRange(feed: FeedRange[], ageDays: number): FeedRange | null {
  if (!feed || feed.length === 0) return null;
  // اگر سن 0 یا منفی بود، مثل روز ۱ حساب کن
  const safeAge = Math.max(1, ageDays || 0);
  for (const range of feed) {
    if (safeAge >= range.dayFrom && safeAge <= range.dayTo) return range;
  }
  return feed[feed.length - 1] || null;
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

export function getEffectiveEnv(
  birdNameOrKey: string | null | undefined,
  ageDays: number | null,
  overrideTemp?: number | null,
  opts?: ResolveOptions,
): EffectiveEnv {
  const key = NAME_TO_KEY[birdNameOrKey || ''] || (birdNameOrKey as BirdType);
  const { std, source: stdSource } = getStandard(key, opts);

  const baseRange = std ? findEnvRange(std.env, ageDays || 0) : null;

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

export function getEffectiveFeed(
  birdNameOrKey: string | null | undefined,
  ageDays: number | null,
  overrideFeedG?: number | null,
  overrideWaterMl?: number | null,
  opts?: ResolveOptions,
): EffectiveFeed {
  const key = NAME_TO_KEY[birdNameOrKey || ''] || (birdNameOrKey as BirdType);
  const { std, source: stdSource } = getStandard(key, opts);

  const baseRange = std ? findFeedRange(std.feed, ageDays || 0) : null;

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

  return { feedG, waterMl, source };
}

export function getStandardFor(
  birdNameOrKey: string | null | undefined,
  opts?: ResolveOptions,
): BirdStandard | null {
  const key = NAME_TO_KEY[birdNameOrKey || ''] || (birdNameOrKey as BirdType);
  const { std } = getStandard(key, opts);
  return std;
}
