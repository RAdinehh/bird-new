/**
 * health.ts — محاسبه دوز دارو/واکسن
 *
 * منطق:
 *   - water:         requiredMl = dosePerLiter × waterAmountL
 *   - oral/injectable: requiredMl = dosePerBirdMl × aliveCount
 *   - feed:           requiredMl = dosePerKgFeed × feedAmountKg
 *   - spray/other:    insufficient (نیاز به داده اختصاصی)
 *
 * اگر داده کافی نبود، hasData=false و requiredMl=null برمی‌گردد.
 */
import type { HealthParams, HealthResult } from '../types';

export function calculateHealthDose(params: HealthParams): HealthResult {
  const { route, waterAmountL, aliveCount, dosePerBirdMl, dosePerLiter, feedAmountKg, dosePerKgFeed } = params;

  // ═══ روش آشامیدنی ═══
  if (route === 'water') {
    if (!dosePerLiter || dosePerLiter <= 0) {
      return {
        requiredMl: null,
        mode: 'insufficient',
        reason: 'دوز در هر لیتر آب در انبار تعریف نشده است.',
        hasData: false,
      };
    }
    if (!waterAmountL || waterAmountL <= 0) {
      return {
        requiredMl: null,
        mode: 'insufficient',
        reason: 'مقدار آب مصرفی امروز ثبت نشده است.',
        hasData: false,
      };
    }
    return {
      requiredMl: Math.round(dosePerLiter * waterAmountL * 10) / 10,
      mode: 'water',
      reason: `بر اساس ${waterAmountL} لیتر آب مصرفی امروز`,
      hasData: true,
    };
  }

  // ═══ روش تزریقی/خوراکی ═══
  if (route === 'oral' || route === 'injectable') {
    if (!dosePerBirdMl || dosePerBirdMl <= 0) {
      return {
        requiredMl: null,
        mode: 'insufficient',
        reason: 'دوز هر پرنده در انبار تعریف نشده است.',
        hasData: false,
      };
    }
    if (!aliveCount || aliveCount <= 0) {
      return {
        requiredMl: null,
        mode: 'insufficient',
        reason: 'تعداد پرنده زنده در دسترس نیست.',
        hasData: false,
      };
    }
    return {
      requiredMl: Math.round(dosePerBirdMl * aliveCount * 10) / 10,
      mode: 'per_bird',
      reason: `بر اساس ${aliveCount} پرنده زنده`,
      hasData: true,
    };
  }

  // ═══ روش مخلوط با دان ═══
  if (route === 'feed') {
    if (!dosePerKgFeed || dosePerKgFeed <= 0) {
      return {
        requiredMl: null,
        mode: 'insufficient',
        reason: 'دوز در هر کیلوگرم دان در انبار تعریف نشده است.',
        hasData: false,
      };
    }
    if (!feedAmountKg || feedAmountKg <= 0) {
      return {
        requiredMl: null,
        mode: 'insufficient',
        reason: 'مقدار دان مصرفی امروز ثبت نشده است.',
        hasData: false,
      };
    }
    return {
      requiredMl: Math.round(dosePerKgFeed * feedAmountKg * 10) / 10,
      mode: 'feed',
      reason: `بر اساس ${feedAmountKg} کیلوگرم دان مصرفی امروز`,
      hasData: true,
    };
  }

  // ═══ روش‌های دیگر (spray/other) ═══
  return {
    requiredMl: null,
    mode: 'insufficient',
    reason: 'برای این روش مصرف، محاسبه خودکار تعریف نشده است.',
    hasData: false,
  };
}
