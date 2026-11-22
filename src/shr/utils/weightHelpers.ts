/** weightHelpers.ts — helperهای نمایش وزن (مشترک بین LogCard و EggsWeightSection) */
import { getGlobalFormat } from '../units/useFormat';

import { toFa } from './fa';

export const GENDER_LABEL: Record<string, string> = {
  male: 'نر',
  female: 'ماده',
  mixed: 'مخلوط',
};

/** نمایش وزن: اگر ≥ ۱۰۰۰ گرم بود، کیلوگرم */
export function formatWeightGrams(g: number): string {
  if (!isFinite(g) || g <= 0) return '—';
  if (g >= 1000) return `${getGlobalFormat().code((Math.round(g / 10) / 100).toFixed(2))} کیلوگرم`;
  return `${getGlobalFormat().num(Math.round(g * 10) / 10)} گرم`;
}

/** تفسیر CV بر اساس آستانه‌های صنعت (۸/۱۰/۱۲) */
export function cvText(cv: number): { text: string; color: string } {
  if (!isFinite(cv) || cv < 0) return { text: '—', color: 'var(--muted)' };
  if (cv <= 8) return { text: 'عالی — گله کاملاً همگن', color: 'var(--success, var(--accent))' };
  if (cv <= 10) return { text: 'خوب — در محدوده مطلوب صنعت', color: 'var(--success, var(--accent))' };
  if (cv <= 12) return { text: 'متوسط — توزیع دان و آبخوری را پایش کن', color: 'var(--warn, var(--accent))' };
  return { text: 'ضعیف — رقابت غذایی یا بیماری را فوری بررسی کن', color: 'var(--danger)' };
}
