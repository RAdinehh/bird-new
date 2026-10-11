/**
 * _display-name.ts — نام نمایشی پویا برای پرنده و نژاد
 *
 * طبق FOUNDATION بخش ۶ (منبع حقیقت):
 *   - standardKey داره → از customStandards/DEFAULT_STANDARDS می‌خونیم (Live)
 *   - نداره → از name (snapshot) — چون dedup بهش وابسته‌ست
 *
 * این helper فقط برای نمایش — نه ذخیره‌سازی.
 */
import { DEFAULT_STANDARDS } from '../set/standards/data';
import type { Bird, Breed } from './store';

interface EntityWithKey {
  name: string;
  standardKey?: string;
}

/**
 * نام نمایشی برای هر پرنده/نژاد
 * @param entity پرنده یا نژاد
 * @param customStandards استانداردهای سفارشی کاربر
 */
export function getDisplayName(
  entity: EntityWithKey | undefined,
  customStandards?: Record<string, any>
): string {
  if (!entity) return '—';

  const key = entity.standardKey;
  if (!key) return entity.name;

  const custom = customStandards?.[key];
  if (custom?.nameFa) return custom.nameFa;

  const std = (DEFAULT_STANDARDS as any)[key];
  if (std?.nameFa) return std.nameFa;

  return entity.name;
}

/**
 * نام نمایشی برای پرنده (wrapper)
 */
export function getBirdDisplayName(
  bird: Bird | undefined,
  customStandards?: Record<string, any>
): string {
  return getDisplayName(bird, customStandards);
}

/**
 * نام نمایشی برای نژاد (wrapper)
 */
export function getBreedDisplayName(
  breed: Breed | undefined,
  customStandards?: Record<string, any>
): string {
  return getDisplayName(breed, customStandards);
}
