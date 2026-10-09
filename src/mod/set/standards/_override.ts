/**
 * _override.ts — سیستم Override بر پایه Diff
 *
 * چرا؟
 *   الان کاربر هر فیلدی رو تغییر بده، کل استاندارد کپی می‌شه.
 *   با Override، فقط فیلدهای تغییر یافته ذخیره می‌شن:
 *     customOverrides: { marandi: { biology: { cullDay: 250 } } }
 *
 * مزایا:
 *   ✅ حجم ذخیره‌سازی کم
 *   ✅ تشخیص «چه تغییر کرده» آسان
 *   ✅ بازگشت به پیش‌فرض تک‌فیلدی
 *   ✅ وقتی استاندارد پایه آپدیت شد، تغییرات کاربر حفظ می‌شه
 *
 * منابع:
 *   - Design Tokens (W3C) — الگوی override
 *   - PRIMA Poultry, mTech Systems — user overlay standard
 */
import type { BirdStandard } from './types';
import { DEFAULT_STANDARDS } from './data';

// ═══ انواع ═══
export type DeepPartial<T> = T extends (infer U)[]
  ? U[]
  : T extends object
    ? { [K in keyof T]?: DeepPartial<T[K]> }
    : T;

export type StandardOverrides = DeepPartial<BirdStandard>;

// ═══ Deep Merge (array جایگزین، object ادغام) ═══
export function deepMerge<T>(base: T, override: any): T {
  if (override === undefined) return base;
  if (override === null) return override as any;
  if (Array.isArray(override)) return override as any;
  if (typeof override !== 'object') return override as any;
  if (typeof base !== 'object' || base === null) return override as any;

  const result: any = Array.isArray(base) ? [...(base as any)] : { ...(base as any) };
  for (const k of Object.keys(override)) {
    result[k] = deepMerge((base as any)?.[k], override[k]);
  }
  return result;
}

// ═══ دسترسی به مسیر (dot notation) ═══
export function getByPath(obj: any, path: string): any {
  const parts = path.split('.');
  let cur = obj;
  for (const p of parts) {
    if (cur === null || cur === undefined) return undefined;
    cur = cur[p];
  }
  return cur;
}

export function setByPath(obj: any, path: string, value: any): any {
  const parts = path.split('.');
  const result = Array.isArray(obj) ? [...obj] : { ...(obj || {}) };
  let cur = result;
  for (let i = 0; i < parts.length - 1; i++) {
    const p = parts[i];
    if (cur[p] === undefined || cur[p] === null) cur[p] = {};
    else cur[p] = Array.isArray(cur[p]) ? [...cur[p]] : { ...cur[p] };
    cur = cur[p];
  }
  cur[parts[parts.length - 1]] = value;
  return result;
}

export function unsetByPath(obj: any, path: string): any {
  const parts = path.split('.');
  const result = Array.isArray(obj) ? [...obj] : { ...(obj || {}) };
  let cur = result;
  for (let i = 0; i < parts.length - 1; i++) {
    const p = parts[i];
    if (cur[p] === undefined) return result;
    cur[p] = Array.isArray(cur[p]) ? [...cur[p]] : { ...cur[p] };
    cur = cur[p];
  }
  delete cur[parts[parts.length - 1]];
  return result;
}

// ═══ تشخیص تغییر ═══
export function isOverridden(overrides: StandardOverrides | undefined, path: string): boolean {
  if (!overrides) return false;
  return getByPath(overrides, path) !== undefined;
}

// ═══ ساخت Diff (برای migration) ═══
export function computeDiff(base: any, current: any): any {
  if (current === undefined || current === null) return undefined;
  if (Array.isArray(base) && Array.isArray(current)) {
    return JSON.stringify(base) === JSON.stringify(current) ? undefined : current;
  }
  if (typeof base === 'object' && typeof current === 'object' && base !== null && current !== null) {
    const diff: any = {};
    let hasAny = false;
    const keys = new Set([...Object.keys(base || {}), ...Object.keys(current || {})]);
    for (const k of keys) {
      const d = computeDiff(base?.[k], current[k]);
      if (d !== undefined) {
        diff[k] = d;
        hasAny = true;
      }
    }
    return hasAny ? diff : undefined;
  }
  return base === current ? undefined : current;
}

// ═══ گرفتن استاندارد نهایی ═══
export function getEffectiveStandard(
  key: string,
  overrides?: StandardOverrides,
  legacyCustom?: BirdStandard,
): BirdStandard | null {
  const def = (DEFAULT_STANDARDS as any)[key];
  if (!def) {
    // اگه استاندارد پیش‌فرض نیست ولی custom هست
    if (legacyCustom) return legacyCustom;
    return null;
  }

  let result = def as BirdStandard;
  if (legacyCustom) result = deepMerge(result, legacyCustom);
  if (overrides) result = deepMerge(result, overrides);

  return result;
}
