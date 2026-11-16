/**
 * health.ts — بررسی سلامت، ماندگاری و سهمیه فضای ذخیره‌سازی
 * استاندارد: W3C Storage API (navigator.storage)
 * هدف: جلوگیری از پاک شدن داده‌ها و هشدار پیش از پر شدن فضا
 */
import { toastMsg } from '../store/toast';

let healthCheckDone = false;

export async function ensurePersistentStorage(): Promise<void> {
  if (typeof navigator === 'undefined' || !navigator.storage || !navigator.storage.persist) {
    return;
  }
  try {
    const isPersisted = await navigator.storage.persisted();
    if (isPersisted) {
      console.debug('[Storage] Already persistent.');
      return;
    }
    const granted = await navigator.storage.persist();
    if (granted) {
      console.info('[Storage] ✅ Persistent storage granted.');
    } else {
      console.warn('[Storage] ⚠️ Persistent storage denied. Data may be cleared by browser.');
    }
  } catch (err) {
    console.error('[Storage] Failed to request persist:', err);
  }
}

export async function checkStorageQuota(): Promise<void> {
  if (typeof navigator === 'undefined' || !navigator.storage || !navigator.storage.estimate) {
    return;
  }
  try {
    const { usage = 0, quota = 0 } = await navigator.storage.estimate();
    if (quota === 0) return;
    const percent = (usage / quota) * 100;
    console.debug(`[Storage] Usage: ${(usage / 1024 / 1024).toFixed(1)}MB of ${(quota / 1024 / 1024).toFixed(1)}MB (${percent.toFixed(1)}%)`);
    if (percent > 80) {
      toastMsg.warn(`فضای ذخیره‌سازی رو به اتمام است (${percent.toFixed(0)}٪). برای حفظ سرعت، داده‌های قدیمی را آرشیو کنید.`);
    }
  } catch (err) {
    console.error('[Storage] Failed to estimate:', err);
  }
}

export async function initStorageHealth(): Promise<void> {
  if (healthCheckDone) return;
  healthCheckDone = true;
  await ensurePersistentStorage();
  await checkStorageQuota();
}
