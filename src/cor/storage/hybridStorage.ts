/**
 * hybridStorage.ts — آداپتور مهاجرت تنبل (Lazy Migration) برای Zustand
 * هدف: انتقال امن داده از localStorage به IndexedDB بدون از دست رفتن اطلاعات
 */
import { idbGetItem, idbSetItem, idbRemoveItem } from './idbStorage';

export const zustandHybridStorage = {
  getItem: async (name: string): Promise<string | null> => {
    try {
      // ۱. اول از IndexedDB بخوان
      const idbVal = await idbGetItem(name);
      if (idbVal) return idbVal;

      // ۲. اگر نبود، از localStorage بخوان (داده‌های قبلی)
      const lsVal = localStorage.getItem(name);
      if (lsVal) {
        console.info(`[Storage] Migrating "${name}" from localStorage to IndexedDB...`);
        // ۳. به IndexedDB منتقل کن
        await idbSetItem(name, lsVal);
        // ۴. از localStorage پاک کن تا فضا آزاد شود
        localStorage.removeItem(name);
        return lsVal;
      }
    } catch (e) {
      console.error(`[Storage] Error in hybridStorage.getItem for "${name}", falling back to localStorage`, e);
      return localStorage.getItem(name);
    }
    return null;
  },

  setItem: async (name: string, value: string): Promise<void> => {
    try {
      await idbSetItem(name, value);
    } catch (e) {
      console.error(`[Storage] Error writing "${name}" to IndexedDB`, e);
    }
  },

  removeItem: async (name: string): Promise<void> => {
    try {
      await idbRemoveItem(name);
      localStorage.removeItem(name);
    } catch (e) {
      console.error(`[Storage] Error removing "${name}"`, e);
    }
  },
};
