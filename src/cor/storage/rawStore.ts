/**
 * rawStore.ts — دسترسی خام به لایه‌ی ذخیره‌سازی (IDB + localStorage)
 *
 * چرا لازم است؟
 * hybridStorage فقط برای Zustand است و در خواندن، مهاجرت انجام می‌دهد
 * (LS → IDB + حذف LS). برای پشتیبان‌گیری نمی‌خواهیم خواندن حالت را تغییر دهد.
 * این ماژول خواندن/نوشتن/حذف خالص می‌دهد، بدون عوارض جانبی.
 *
 * قاعده:
 *   کلیدهای IDB → اول IDB، بعد LS (آینه‌ی hybridStorage)
 *   کلیدهای LS  → فقط LS (مثل pm-settings که نباید به IDB برود)
 */
import { idbGetItem, idbSetItem, idbRemoveItem } from './idbStorage';
import { safeStorage } from '../../shr/utils/storage';

/** کلیدهایی که در IndexedDB نگهداری می‌شوند (۱۰ استور Zustand) */
export const IDB_KEYS = [
  'pm-brd',
  'pm-hal',
  'pm-ctc',
  'pm-flk',
  'pm-inc',
  'pm-egg',
  'pm-dlg',
  'pm-whs',
  'pm-fed',
  'pm-tra',
] as const;

export type IdbKey = (typeof IDB_KEYS)[number];

const IDB_SET = new Set<string>(IDB_KEYS);

export function isIdbKey(key: string): boolean {
  return IDB_SET.has(key);
}

/**
 * خواندن خام — اول IndexedDB، بعد localStorage.
 * هیچ مهاجرت/حذفی انجام نمی‌دهد تا export کردن، داده را تغییر ندهد.
 */
export async function rawGet(key: string): Promise<string | null> {
  if (isIdbKey(key)) {
    try {
      const val = await idbGetItem(key);
      if (val != null && val !== '') return String(val);
    } catch (e) {
      console.error('[rawStore] خواندن از IndexedDB ناموفق:', key, e);
    }
  }
  return safeStorage.get(key);
}

/**
 * نوشتن خام.
 * برای کلیدهای IDB: اول در IDB می‌نویسد و فقط بعد از موفقیت نسخه‌ی
 * localStorage را حذف می‌کند (وگرنه hybridStorage داده‌ی کهنه را برمی‌گرداند).
 * برای کلیدهای LS: به IDB دست نمی‌زند — تنظیمات کاربر حفظ می‌شود.
 */
export async function rawSet(key: string, value: string): Promise<boolean> {
  if (isIdbKey(key)) {
    try {
      await idbSetItem(key, value);
      safeStorage.remove(key);
      return true;
    } catch (e) {
      console.error('[rawStore] نوشتن در IndexedDB ناموفق، بازگشت به localStorage:', key, e);
      return safeStorage.set(key, value);
    }
  }
  return safeStorage.set(key, value);
}

/** حذف خام از هر دو لایه */
export async function rawRemove(key: string): Promise<void> {
  if (isIdbKey(key)) {
    try {
      await idbRemoveItem(key);
    } catch (e) {
      console.error('[rawStore] حذف از IndexedDB ناموفق:', key, e);
    }
  }
  safeStorage.remove(key);
}
