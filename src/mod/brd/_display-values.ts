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
  customStandards?: Record<string, any>
): number | null {
  if (!breed) return null;

  // ۱. override کاربر
  if (breed.fcr != null) return breed.fcr;

  // ۲. از استاندارد
  if (breed.standardKey) {
    const std = customStandards?.[breed.standardKey]
      || (DEFAULT_STANDARDS as any)[breed.standardKey];
    if (std) {
      const last = std?.growth?.weightByAge?.[std.growth.weightByAge.length - 1];
      if (last?.fcr != null) return last.fcr;
    }
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
