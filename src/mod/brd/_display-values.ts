/**
 * _display-values.ts — مقادیر پویا از استاندارد
 *
 * طبق FOUNDATION بخش ۱۴.۱ (Stale Value Bug):
 *   مقدار باید از منبع فعلی خونده شه، نه snapshot قدیمی.
 *
 * اولویت:
 *   ۱. override کاربر (اگه مقدار دستی وارد شده)
 *   ۲. مقدار از استاندارد (standardKey)
 *   ۳. null
 */
import { DEFAULT_STANDARDS } from '../set/standards/data';

interface BreedLike {
  fcr?: number | null;
  standardKey?: string;
}

/** FCR نهایی نژاد */
export function getBreedFcr(
  breed: BreedLike | undefined | null,
  customStandards?: Record<string, any>,
  customOverrides?: Record<string, any>
): number | null {
  if (!breed) return null;

  // ۱. override کاربر روی breed.fcr
  if (breed.fcr != null) return breed.fcr;

  // ۲. از استاندارد (با احتساب overrides)
  if (breed.standardKey) {
    const base = (DEFAULT_STANDARDS as any)[breed.standardKey];
    const custom = customStandards?.[breed.standardKey];
    const ov = customOverrides?.[breed.standardKey];

    // deepMerge ساده: base + custom + overrides.growth
    let effective: any = custom ? { ...base, ...custom } : base;
    if (ov?.growth?.weightByAge) {
      effective = { ...effective, growth: { ...(effective?.growth || {}), weightByAge: ov.growth.weightByAge } };
    }

    const last = effective?.growth?.weightByAge?.[effective.growth.weightByAge.length - 1];
    if (last?.fcr != null) return last.fcr;
  }

  return null;
}

/** چرخه زندگی نژاد (روز) */
export function getBreedCycleDays(
  breed: BreedLike | undefined | null,
  customStandards?: Record<string, any>
): number | null {
  if (!breed?.standardKey) return null;

  const std = customStandards?.[breed.standardKey]
    || (DEFAULT_STANDARDS as any)[breed.standardKey];
  return std?.biology?.cullDay ?? null;
}
