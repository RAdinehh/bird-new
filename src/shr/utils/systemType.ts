/**
 * تبدیل انواع دانخوری/آبخوری سالن → سیستم ثبت روزانه
 * 
 * این فایل پل ارتباطی بین ماژول سالن (hal) و ثبت روزانه (dlg) است.
 * هر وقت سیستم جدیدی اضافه شد، فقط این فایل عوض می‌شود.
 */

// === سیستم دان (5 مقدار مطابق calc) ===
export type FeedSystem = 'scoop' | 'bag' | 'semi_auto' | 'auto_sensor' | 'auto_chain';

export function feedSystemFromHall(feederType: string): FeedSystem {
  if (!feederType || feederType === 'manual' || feederType === 'none') return 'scoop';
  if (feederType === 'chain') return 'auto_chain';
  if (feederType === 'pan') return 'auto_sensor';
  if (feederType === 'tube') return 'scoop';
  return 'scoop';
}

export const FEED_SYSTEM_LABEL: Record<FeedSystem, string> = {
  scoop: 'دستی (سطل)',
  bag: 'کیسه‌ای',
  semi_auto: 'نیمه‌اتومات',
  auto_sensor: 'اتومات (سنسور)',
  auto_chain: 'اتومات (زنجیری)',
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
  // همه 5 مقدار در calc پیاده شده‌اند
  return true;
}
