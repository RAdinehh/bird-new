/**
 * _display-name.ts — نام نمایشی پویا برای پرنده و نژاد
 *
 * طبق FOUNDATION بخش ۱۴.۱ (Stale Value Bug):
 *   - standardKey داره → از customOverrides + customStandards + DEFAULT می‌خونیم (Live)
 *   - نداره → از name (snapshot) — چون dedup بهش وابسته‌ست
 */
import { DEFAULT_STANDARDS } from '../set/standards/data';
import type { Bird, Breed } from './store';

interface EntityWithKey {
  name: string;
  standardKey?: string;
}

export interface DisplayOpts {
  customStandards?: Record<string, any>;
  customOverrides?: Record<string, any>;
}

/**
 * رزولوشن نام از standard + overrides + defaults
 */
function resolveNameFa(
  key: string,
  customStandards?: Record<string, any>,
  customOverrides?: Record<string, any>
): string | undefined {
  // ۱. override (Diff-based) — اول
  const ov = customOverrides?.[key];
  if (ov?.nameFa) return ov.nameFa;

  // ۲. customStandards (Legacy)
  const custom = customStandards?.[key];
  if (custom?.nameFa) return custom.nameFa;

  // ۳. Default
  const std = (DEFAULT_STANDARDS as any)[key];
  return std?.nameFa;
}

/**
 * نام نمایشی برای هر پرنده/نژاد
 */
export function getDisplayName(
  entity: EntityWithKey | undefined,
  opts: DisplayOpts | Record<string, any> = {}
): string {
  if (!entity) return '—';

  const key = entity.standardKey;
  if (!key) return entity.name;

  // 🆕 پشتیبانی از هر دو شکل فراخوانی (Opts یا legacy Record)
  const customStandards = (opts as any)?.customStandards ?? opts;
  const customOverrides = (opts as any)?.customOverrides;

  const resolved = resolveNameFa(key, customStandards, customOverrides);
  return resolved || entity.name;
}

export function getBirdDisplayName(
  bird: Bird | undefined,
  opts: DisplayOpts | Record<string, any> = {}
): string {
  return getDisplayName(bird, opts);
}

export function getBreedDisplayName(
  breed: Breed | undefined,
  opts: DisplayOpts | Record<string, any> = {}
): string {
  return getDisplayName(breed, opts);
}
