/**
 * تبدیل انواع دانخوری/آبخوری سالن → سیستم ثبت روزانه
 * 
 * این فایل پل ارتباطی بین ماژول سالن (hal) و ثبت روزانه (dlg) است.
 * هر وقت سیستم جدیدی اضافه شد، فقط این فایل عوض می‌شود.
 */

// === سیستم دان ===
export type FeedSystem = 'manual' | 'auto';

export function feedSystemFromHall(feederType: string): FeedSystem {
  // دستی → manual
  if (!feederType || feederType === 'manual' || feederType === 'none' || feederType === '') {
    return 'manual';
  }
  // زنجیری، بشقابی، لوله‌ای → اتوماتیک
  if (feederType === 'chain' || feederType === 'pan' || feederType === 'tube') {
    return 'auto';
  }
  // پیش‌فرض امن
  return 'manual';
}

export const FEED_SYSTEM_LABEL: Record<FeedSystem, string> = {
  manual: 'دستی',
  auto: 'اتوماتیک'
};

// === سیستم آب ===
export type WaterSystem = 'manual' | 'nipple' | 'trough' | 'tank';

export function waterSystemFromHall(drinkerType: string): WaterSystem {
  if (!drinkerType || drinkerType === 'manual' || drinkerType === 'none' || drinkerType === '') {
    return 'manual';
  }
  if (drinkerType === 'nipple' || drinkerType === 'cup') {
    return 'nipple';
  }
  if (drinkerType === 'trough') {
    return 'trough';
  }
  return 'manual';
}

export const WATER_SYSTEM_LABEL: Record<WaterSystem, string> = {
  manual: 'آبخوری دستی',
  nipple: 'نوپل/کاپ',
  trough: 'ناودانی',
  tank: 'تانکر'
};

/**
 * آیا این سیستم نیاز به UI خاص دارد؟ (فعلاً فقط manual پیاده شده)
 */
export function isWaterSystemImplemented(sys: WaterSystem): boolean {
  return sys === 'manual';
}

export function isFeedSystemImplemented(sys: FeedSystem): boolean {
  return sys === 'manual' || sys === 'auto';
}
