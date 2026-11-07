/**
 * feed.ts — مصرف دان (simple / precision / auto)
 *
 * روش‌های دان‌دهی:
 *   scoop / bag / semi_auto → precision اگر remaining باشد، else simple
 *   auto_sensor              → همیشه precision (سنسور خودش مصرف را می‌دهد)
 *   auto_chain               → همیشه simple (هر چه داده = مصرف)
 *
 *   precision: feedConsumed = feedDelivered - (feedRemaining - previousRemaining)
 *   simple:    feedConsumed = feedDelivered
 *
 * هشدار:
 *   - consumed < 0 → danger
 *   - perBirdG > 300 → warn
 *   - perBirdG < 5 → warn
 */
import type { FeedParams, FeedResult } from '../types';

export function calculateFeedMetrics(params: FeedParams): FeedResult {
  const {
    feedMethod,
    feedDeliveredKg,
    feedRemainingKg,
    previousRemainingKg,
    aliveCount,
  } = params;

  let feedConsumedKg = 0;
  let mode: 'simple' | 'precision' = 'simple';
  let warning: string | null = null;

  if (feedMethod === 'auto_sensor') {
    // سنسور خودش مصرف را می‌دهد
    mode = 'precision';
    feedConsumedKg = feedDeliveredKg;
  } else if (feedMethod === 'auto_chain') {
    // زنجیری: delivered ≈ consumed
    mode = 'simple';
    feedConsumedKg = feedDeliveredKg;
  } else {
    // scoop / bag / semi_auto
    if (feedRemainingKg !== null && previousRemainingKg !== null) {
      mode = 'precision';
      const delta = feedRemainingKg - previousRemainingKg;
      feedConsumedKg = feedDeliveredKg - delta;
    } else {
      mode = 'simple';
      feedConsumedKg = feedDeliveredKg;
    }
  }

  if (feedConsumedKg < 0) {
    warning = 'مصرف دان منفی — داده را بررسی کنید';
    feedConsumedKg = 0;
  }

  const feedPerBirdG =
    aliveCount > 0 ? (feedConsumedKg * 1000) / aliveCount : 0;
  const feedPerBirdR = Math.round(feedPerBirdG * 10) / 10;

  if (!warning && feedPerBirdR > 300) {
    warning = 'مصرف دان غیرعادی بالا — داده را بررسی کنید';
  } else if (!warning && feedPerBirdR < 5 && feedConsumedKg > 0) {
    warning = 'مصرف دان غیرعادی پایین — داده را بررسی کنید';
  }

  return {
    feedConsumedKg: Math.round(feedConsumedKg * 100) / 100,
    feedPerBirdG: feedPerBirdR,
    mode,
    warning,
  };
}
