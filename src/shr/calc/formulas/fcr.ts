/**
 * fcr.ts — محاسبه FCR (ضریب تبدیل غذایی)
 *
 * استاندارد: Aviagen Ross 308 / Cobb 500
 *   FCR = کل دان مصرفی ÷ کل افزایش وزن
 *
 *   کل افزایش وزن = (وزن نهایی − وزن اولیه) × تعداد زنده
 *
 * آستانه‌ها (Aviagen):
 *   - اگر FCR > ۱۰٪ بدتر از استاندارد → danger
 *   - اگر FCR ۵-۱۰٪ بدتر → warn
 *   - اگر FCR بین -۱۰٪ تا +۵٪ نسبت به استاندارد → accent
 *   - اگر FCR ۱۰-۲۰٪ بهتر (غیرعادی) → warn
 *   - اگر FCR بیش از ۲۰٪ بهتر (غیرممکن بیولوژیک) → danger
 */
import type { FcrParams, FcrResult, Tone } from '../types';

export function calculateFCR(params: FcrParams): FcrResult {
  const {
    feedConsumedKg,
    initialWeightKg,
    finalWeightKg,
    aliveCount,
    standardFCR,
  } = params;

  // ═══ محاسبه پایه
  let fcr: number | null = null;
  let totalGainKg = 0;
  let confidence: 'exact' | 'approximate' | 'insufficient' = 'insufficient';
  let reason = '';

  if (feedConsumedKg <= 0) {
    reason = 'دان مصرفی صفر یا منفی است — FCR قابل محاسبه نیست';
  } else if (finalWeightKg <= 0) {
    reason = 'وزن نهایی موجود نیست — ابتدا وزن‌گیری کنید';
  } else if (aliveCount <= 0) {
    reason = 'تعداد زنده صفر است';
  } else if (finalWeightKg <= initialWeightKg) {
    reason = 'وزن نهایی کمتر یا مساوی وزن اولیه — افزایش وزن منفی';
  } else {
    totalGainKg = (finalWeightKg - initialWeightKg) * aliveCount;
    fcr = feedConsumedKg / totalGainKg;
    confidence = 'exact';
  }

  // ═══ diffPct نسبت به استاندارد
  let diffPct: number | null = null;
  if (fcr !== null && standardFCR !== null && standardFCR > 0) {
    diffPct = ((fcr - standardFCR) / standardFCR) * 100;
  }

  // ═══ tone
  let tone: Tone = 'info';
  if (fcr !== null && standardFCR !== null && standardFCR > 0) {
    const diff = (fcr - standardFCR) / standardFCR;

    if (diff < -0.20) {
      // بیش از ۲۰٪ بهتر — غیرممکن بیولوژیک، احتمالاً داده غلط
      tone = 'danger';
    } else if (diff < -0.10) {
      // ۱۰-۲۰٪ بهتر — غیرعادی
      tone = 'warn';
    } else if (diff <= 0.05) {
      // -۱۰٪ تا +۵٪ — خوب یا بهتر
      tone = 'accent';
    } else if (diff <= 0.10) {
      // ۵-۱۰٪ بدتر
      tone = 'warn';
    } else {
      // بیش از ۱۰٪ بدتر
      tone = 'danger';
    }
  }

  return {
    fcr: fcr !== null ? Math.round(fcr * 100) / 100 : null,
    confidence,
    totalFeedKg: Math.round(feedConsumedKg * 100) / 100,
    totalGainKg: Math.round(totalGainKg * 100) / 100,
    standardFCR,
    diffPct: diffPct !== null ? Math.round(diffPct * 10) / 10 : null,
    tone,
    reason,
  };
}
