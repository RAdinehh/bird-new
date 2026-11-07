/**
 * water.ts — مصرف آب
 *
 *   waterPerBirdMl = waterAmountL × 1000 / aliveCount
 *   waterFeedRatio = waterAmountL / feedConsumedKg
 *
 * tone (با استاندارد):
 *   |diff| ≤ 10٪ → accent | 10-20٪ → warn | > 20٪ → danger
 *
 * tone (بدون استاندارد، پیش‌فرض گوشتی):
 *   1.5-2.5 → accent | 1.2-3.0 → warn | خارج → danger
 *
 * هشدار:
 *   - ratio > 2.5 → «احتمال بیماری یا گرما»
 *   - ratio < 1.5 → «احتمال مشکل آبخوری»
 */
import type { WaterParams, WaterResult, Tone } from '../types';

export function calculateWaterMetrics(params: WaterParams): WaterResult {
  const {
    waterAmountL,
    feedConsumedKg,
    aliveCount,
    standardWaterFeedRatio,
  } = params;

  const waterPerBirdMl =
    aliveCount > 0 ? (waterAmountL * 1000) / aliveCount : 0;

  const waterFeedRatio =
    feedConsumedKg > 0 ? waterAmountL / feedConsumedKg : 0;

  // tone
  let waterFeedTone: Tone = 'info';
  if (waterFeedRatio > 0) {
    if (
      standardWaterFeedRatio !== null &&
      standardWaterFeedRatio > 0
    ) {
      const diff =
        (waterFeedRatio - standardWaterFeedRatio) / standardWaterFeedRatio;
      const absDiff = Math.abs(diff);
      waterFeedTone =
        absDiff <= 0.1 ? 'accent' : absDiff <= 0.2 ? 'warn' : 'danger';
    } else {
      waterFeedTone =
        waterFeedRatio >= 1.5 && waterFeedRatio <= 2.5
          ? 'accent'
          : waterFeedRatio >= 1.2 && waterFeedRatio <= 3.0
            ? 'warn'
            : 'danger';
    }
  }

  // warning
  let warning: string | null = null;
  if (waterFeedRatio > 2.5) {
    warning = 'مصرف آب بالا — احتمال بیماری یا گرما';
  } else if (waterFeedRatio > 0 && waterFeedRatio < 1.5) {
    warning = 'مصرف آب پایین — احتمال مشکل آبخوری';
  }

  return {
    waterPerBirdMl: Math.round(waterPerBirdMl * 10) / 10,
    waterFeedRatio: Math.round(waterFeedRatio * 100) / 100,
    waterFeedTone,
    warning,
  };
}
