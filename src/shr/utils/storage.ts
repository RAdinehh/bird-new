/**
 * storage.ts — localStorage امن
 * در حالت private browsing یا quota پر، خطا نمیدهد
 */

export const safeStorage = {
  get(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },

  set(key: string, value: string): boolean {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch {
      return false;
    }
  },

  remove(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch { /* silent */ }
  },

  /** خواندن + پارس JSON امن */
  getJSON<T = any>(key: string, fallback: T): T {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      const parsed = JSON.parse(raw);
      return parsed ?? fallback;
    } catch {
      return fallback;
    }
  },

  /** نوشتن + سریالایز JSON امن */
  setJSON(key: string, value: any): boolean {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  },

  keys(): string[] {
    try {
      return Object.keys(localStorage);
    } catch {
      return [];
    }
  },
};
