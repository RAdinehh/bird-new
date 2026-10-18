/**
 * money.ts — توابع ریاضی دقیق برای محاسبات مالی
 *
 * چرا این فایل وجود دارد؟
 * ─────────────────────────────────────────────
 * در جاوااسکریپت، محاسبات با اعداد اعشاری (float) دقیق نیست:
 *   0.1 + 0.2 === 0.30000000000000004  (نه 0.3!)
 *
 * در نرم‌افزار مالی، این خطا در فاکتورهای بزرگ چند هزار تومان اختلاف می‌سازد.
 * این فایل با استفاده از decimal.js، محاسبات دقیق را تضمین می‌کند.
 *
 * قوانین استفاده:
 * ─────────────────────────────────────────────
 * - همه‌جا از این توابع استفاده کنید، نه از عملگرهای + - * / مستقیم.
 * - برای پارس کردن ورودی کاربر، از parseFaNum استفاده کنید (که در fa.ts است).
 * - پس از محاسبه، از moneyRound استفاده کنید تا به تومان صحیح گرد شود.
 */

import Decimal from 'decimal.js';

// تنظیمات دقت مالی: دقت ۲۰ رقم، گرد کردن به سمت بالا در نیمه (.5 → بالاتر)
Decimal.set({
  precision: 20,
  rounding: Decimal.ROUND_HALF_UP,
});

type Num = number | string | null | undefined;

/** امن‌سازی ورودی: null/undefined/NaN/رشته نامعتبر → صفر */
const _safe = (n: Num): string => {
  if (n === null || n === undefined || n === '') return '0';
  const num = typeof n === 'number' ? n : Number(n);
  if (Number.isNaN(num) || !Number.isFinite(num)) return '0';
  return String(n);
};

// ─── عملیات پایه ───

export function moneyAdd(a: Num, b: Num): number {
  return new Decimal(_safe(a)).plus(_safe(b)).toNumber();
}

export function moneySub(a: Num, b: Num): number {
  return new Decimal(_safe(a)).minus(_safe(b)).toNumber();
}

export function moneyMul(a: Num, b: Num): number {
  return new Decimal(_safe(a)).times(_safe(b)).toNumber();
}

export function moneyDiv(a: Num, b: Num): number {
  const divisor = _safe(b);
  if (divisor === '0') return 0;
  return new Decimal(_safe(a)).div(divisor).toNumber();
}

// ─── گرد کردن ───

/** گرد کردن مبلغ به تعداد رقم اعشار مشخص (پیش‌فرض: تومان صحیح) */
export function moneyRound(n: Num, decimals = 0): number {
  return new Decimal(_safe(n)).toDecimalPlaces(decimals, Decimal.ROUND_HALF_UP).toNumber();
}

// ─── درصد ───

/** محاسبه درصد از یک مبلغ (مثلاً ۲٪ از ۱۰۰,۰۰۰ = ۲,۰۰۰) */
export function moneyPercent(n: Num, pct: Num): number {
  return new Decimal(_safe(n)).times(_safe(pct)).div(100).toNumber();
}

/** اعمال تخفیف درصدی (۱۰۰,۰۰۰ با ۲٪ تخفیف = ۹۸,۰۰۰) */
export function moneyApplyDiscount(n: Num, pct: Num): number {
  const base = new Decimal(_safe(n));
  const discount = base.times(_safe(pct)).div(100);
  return base.minus(discount).toNumber();
}

// ─── جمع گروهی ───

export function moneySum(values: Num[]): number {
  return values.reduce<number>((acc, v) => moneyAdd(acc, v), 0);
}

// ─── مقایسه‌ها ───

export function moneyEquals(a: Num, b: Num): boolean {
  return new Decimal(_safe(a)).equals(_safe(b));
}

export function moneyGreaterThan(a: Num, b: Num): boolean {
  return new Decimal(_safe(a)).gt(_safe(b));
}

export function moneyLessThan(a: Num, b: Num): boolean {
  return new Decimal(_safe(a)).lt(_safe(b));
}

// ─── ثابت‌های مقیاس (Scale) ───

/** تعداد رقم اعشار برای مبالغ تومانی: ۰ (تومان صحیح) */
export const MONEY_SCALE = 0;

/** تعداد رقم اعشار برای درصدها: ۲ */
export const PERCENT_SCALE = 2;

/** تعداد رقم اعشار برای وزن (کیلوگرم): ۳ */
export const WEIGHT_SCALE = 3;

/** تعداد رقم اعشار برای نرخ تبدیل ارز: ۴ */
export const RATE_SCALE = 4;
