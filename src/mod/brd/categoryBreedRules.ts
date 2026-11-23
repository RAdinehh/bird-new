/** src/mod/brd/categoryBreedRules.ts — قوانین تطابق دسته‌بندی معامله با کاربرد نژاد (purposes) */
import type { Breed } from './store';

/** کاربردهای مجاز نژاد برای هر دسته‌بندی معامله */
export function getAllowedPurposesForCategory(category: string, isPurchase: boolean): string[] | null {
  // تخم نطفه‌دار (در خرید با کد egg و در فروش با کد fertile_egg)
  if (category === 'fertile_egg' || (isPurchase && category === 'egg')) {
    return ['breeder', 'dual', 'ornamental'];
  }
  // تخم خوراکی (در فروش با کد egg)
  if (!isPurchase && category === 'egg') {
    return ['layer', 'dual', 'breeder', 'ornamental'];
  }
  // جوجه یک‌روزه و پرنده بالغ: همه کاربردها مجازند
  return null;
}

/** بررسی مجاز بودن یک نژاد برای دسته‌بندی انتخاب‌شده */
export function isBreedAllowedForCategory(breed: Pick<Breed, 'purposes'> | undefined, category: string, isPurchase: boolean): boolean {
  if (!breed) return false;
  const allowed = getAllowedPurposesForCategory(category, isPurchase);
  if (!allowed) return true;
  // نژادهای سفارشی بدون purpose تعریف‌شده مسدود نمی‌شوند
  if (!breed.purposes || breed.purposes.length === 0) return true;
  return breed.purposes.some(p => allowed.includes(p));
}

/** عنوان کاربرد موردنیاز برای پیام راهنمای کوتاه */
export function getRequiredPurposeHint(category: string, isPurchase: boolean): string | null {
  if (category === 'fertile_egg' || (isPurchase && category === 'egg')) {
    return 'مادر / مولد';
  }
  if (!isPurchase && category === 'egg') {
    return 'تخم‌گذار یا دومنظوره';
  }
  return null;
}
