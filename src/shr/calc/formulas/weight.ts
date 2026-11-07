/**
 * weight.ts — وزن و یکنواختی
 *
 * استاندارد: Aviagen Ross 308
 *
 *   avgWeightG     = میانگین نمونه‌ها × 1000 (گرم)
 *   cvPct          = (انحراف معیار ÷ میانگین) × 100
 *   uniformityPct  = درصد نمونه‌ها در بازه ±۱۰٪ میانگین
 *   adgG           = افزایش وزن روزانه (فرض ۱ روز از لاگ قبلی)
 *
 * tone (CV):
 *   < ۸٪ → accent | ۸-۱۰٪ → accent | ۱۰-۱۲٪ → warn | > ۱۲٪ → danger
 *
 * tone (uniformity):
 *   > ۸۰٪ → accent | ۷۰-۸۰٪ → warn | < ۷۰٪ → danger
 *
 * tone (weight vs standard):
 *   |diff| ≤ ۵٪ → accent | ۵-۱۰٪ → warn | > ۱۰٪ → danger
 */
import type { WeightParams, WeightResult, Tone } from '../types';

const MIN_SAMPLES = 3;

export function calculateWeightMetrics(params: WeightParams): WeightResult {
  const { samples, previousAvgWeightG, standardWeightG } = params;

  if (samples.length < MIN_SAMPLES) {
    return {
      avgWeightG: 0,
      cvPct: 0,
      uniformityPct: 0,
      adgG: 0,
      standardWeightG,
      weightDiffPct: null,
      cvTone: 'info',
      uniformityTone: 'info',
      weightTone: 'info',
      hasData: false,
    };
  }

  const weights = samples.map((s) => s.weight);
  const sum = weights.reduce((a, w) => a + w, 0);
  const mean = sum / weights.length;

  // avgWeightG: mean در kg → × 1000 = گرم
  const avgWeightG = Math.round(mean * 1000 * 10) / 10;

  // CV
  const variance =
    weights.reduce((a, w) => a + (w - mean) ** 2, 0) / weights.length;
  const std = Math.sqrt(variance);
  const cvPct = mean > 0 ? (std / mean) * 100 : 0;
  const cvR = Math.round(cvPct * 10) / 10;

  // Uniformity: درصد نمونه‌ها در بازه ±۱۰٪ میانگین
  const low = mean * 0.9;
  const high = mean * 1.1;
  const within = weights.filter((w) => w >= low && w <= high).length;
  const uniformityPct = (within / weights.length) * 100;
  const uniformityR = Math.round(uniformityPct * 10) / 10;

  // ADG — فرض ۱ روز از لاگ قبلی
  let adgG = 0;
  if (previousAvgWeightG !== null && previousAvgWeightG > 0) {
    adgG = avgWeightG - previousAvgWeightG;
  }

  // diff vs standard
  let weightDiffPct: number | null = null;
  if (standardWeightG !== null && standardWeightG > 0) {
    weightDiffPct =
      ((avgWeightG - standardWeightG) / standardWeightG) * 100;
  }

  // tones
  const cvTone: Tone =
    cvR < 8 ? 'accent' : cvR < 10 ? 'accent' : cvR < 12 ? 'warn' : 'danger';

  const uniformityTone: Tone =
    uniformityR > 80 ? 'accent' : uniformityR > 70 ? 'warn' : 'danger';

  let weightTone: Tone = 'info';
  if (weightDiffPct !== null) {
    const absDiff = Math.abs(weightDiffPct);
    weightTone = absDiff <= 5 ? 'accent' : absDiff <= 10 ? 'warn' : 'danger';
  }

  return {
    avgWeightG,
    cvPct: cvR,
    uniformityPct: uniformityR,
    adgG: Math.round(adgG * 10) / 10,
    standardWeightG,
    weightDiffPct:
      weightDiffPct !== null ? Math.round(weightDiffPct * 10) / 10 : null,
    cvTone,
    uniformityTone,
    weightTone,
    hasData: true,
  };
}
