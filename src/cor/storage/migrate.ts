/**
 * migrate.ts — مهاجرت یک‌باره از localStorage به IndexedDB
 * استاندارد: W3C Storage API
 * هدف: آزادسازی سقف ۵ مگابایتی و انتقال به IndexedDB بدون از دست رفتن داده
 */
import { idbGetItem, idbSetItem } from './idbStorage';

// لیست کلیدهای فعلی پروژه در localStorage
const PM_KEYS = [
  'pm-settings', 'pm-brd', 'pm-hal', 'pm-ctc', 'pm-flk', 'pm-inc',
  'pm-egg', 'pm-dlg', 'pm-whs', 'pm-fed', 'pm-tra', 'pm-recycle-tra',
  'pm-alt', 'pm-cal-manual', 'pm-theme'
] as const;

const MIGRATION_FLAG = 'pm-migrated-to-idb-v1';

export async function migrateToIDB(): Promise<void> {
  // اگر قبلاً مهاجرت انجام شده، کاری نکن
  if (localStorage.getItem(MIGRATION_FLAG) === 'done') {
    return;
  }

  // اگر IndexedDB اصلاً پشتیبانی نمی‌شود (مرورگرهای خیلی قدیمی)
  if (typeof indexedDB === 'undefined') {
    console.warn('[Migrate] IndexedDB not supported. Staying on localStorage.');
    return;
  }

  let migratedCount = 0;

  try {
    for (const key of PM_KEYS) {
      const raw = localStorage.getItem(key);
      if (raw) {
        // آیا از قبل در IndexedDB هست؟ (برای جلوگیری از بازنویسی)
        const existing = await idbGetItem(key);
        if (!existing) {
          await idbSetItem(key, raw);
          migratedCount++;
          console.debug(`[Migrate] ${key} → IndexedDB (${(raw.length / 1024).toFixed(1)} KB)`);
        }
      }
    }

    // علامت‌گذاری که مهاجرت انجام شد
    localStorage.setItem(MIGRATION_FLAG, 'done');
    console.info(`[Migrate] ✅ ${migratedCount} کلید به IndexedDB منتقل شد.`);

    // 🆕 پاک‌سازی localStorage (فقط کلیدهای پروژه، نه کل چیزها)
    for (const key of PM_KEYS) {
      if (localStorage.getItem(key)) {
        localStorage.removeItem(key);
      }
    }
    console.info('[Migrate] 🧹 localStorage پاک‌سازی شد.');
    
  } catch (err) {
    console.error('[Migrate] ❌ خطا در مهاجرت:', err);
  }
}
