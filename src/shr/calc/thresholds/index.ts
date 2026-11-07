/**
 * thresholds/index.ts — استخراج آستانه‌های استاندارد از set/standards
 *
 * آستانه‌های عمومی (hardcoded، بین همه نژادها یکسان):
 *   - cvPct: ۱۲٪
 *   - uniformityPct: ۷۰٪
 *   - waterFeedRatio: ۱.۵ تا ۲.۵
 *
 * آستانه‌های نژاد-محور (از standards):
 *   - temp، humidity، light → از std.env
 *   - feedPerBirdG → از std.feed با تحمل ±۱۰٪
 *   - fcr، adgG → از getEffectiveGrowth
 *   - mortality → از getMortalityRange + std.mortalityTotalPct
 *   - henDayPct، eggWeightG → از getProduction
 *   - henHousedPct → hen-day × livability (تخمین)
 *   - densityBirdPerSqM → از getSpace
 */
import type { Thresholds, CalcContext } from '../types';
import {
  getStandardFor,
  getEffectiveGrowth,
  getSpace,
  getProduction,
  getMortalityRange,
  findInRange,
} from '../../../mod/set/standards';

// ═══ آستانه‌های عمومی (بین همه نژادها یکسان)
const GENERAL_CV_PCT = 12;
const GENERAL_UNIFORMITY_PCT = 70;
const GENERAL_WATER_FEED_RATIO = { min: 1.5, max: 2.5 };
const FEED_TOLERANCE = 0.1;

export function getThresholds(ctx: CalcContext): Thresholds {
  const std = getStandardFor(ctx.breedId);

  if (!std) {
    return emptyThresholds();
  }

  // ═══ محیط
  const envRange = findInRange(std.env, ctx.ageDays);
  const temp = envRange?.temp
    ? {
        min: envRange.temp.min,
        max: envRange.temp.max,
        target: envRange.temp.target,
      }
    : null;

  const humidity = envRange?.humidity
    ? {
        min: envRange.humidity.min,
        max: envRange.humidity.max,
        target:
          envRange.humidity.target ??
          (envRange.humidity.min + envRange.humidity.max) / 2,
      }
    : null;

  const lightHours =
    envRange?.light?.hours != null
      ? {
          min: Math.max(0, envRange.light.hours - 1),
          max: envRange.light.hours + 1,
        }
      : null;

  // ═══ تغذیه
  const feedRange = findInRange(std.feed, ctx.ageDays);
  const feedPerBirdG =
    feedRange?.feedG != null
      ? {
          min: Math.round(feedRange.feedG * (1 - FEED_TOLERANCE)),
          max: Math.round(feedRange.feedG * (1 + FEED_TOLERANCE)),
        }
      : null;

  // ═══ رشد
  const growth = getEffectiveGrowth(ctx.breedId, ctx.ageDays);
  const hasGrowthData = growth.source !== 'fallback';
  const fcr = hasGrowthData ? growth.fcr : null;
  const adgG = hasGrowthData ? growth.adgG : null;

  // ═══ تلفات
  const mortalityRange = getMortalityRange(ctx.breedId, ctx.ageDays);
  const mortality =
    mortalityRange != null && std.mortalityTotalPct != null
      ? {
          dailyPct: mortalityRange.maxPct,
          weeklyPct: Math.round(mortalityRange.maxPct * 5 * 100) / 100,
          totalPct: std.mortalityTotalPct,
        }
      : null;

  // ═══ تولید
  const production = getProduction(ctx.breedId);
  const henDayPct = production?.peakLayingPct ?? null;
  const eggWeightG = production?.eggWeightG ?? null;

  const henHousedPct =
    henDayPct != null && std.mortalityTotalPct != null
      ? Math.round(henDayPct * (1 - std.mortalityTotalPct / 100) * 10) / 10
      : null;

  // ═══ فضا
  const space = getSpace(ctx.breedId);
  const densityBirdPerSqM = space?.densityMax ?? null;

  return {
    temp,
    humidity,
    lightHours,
    feedPerBirdG,
    waterFeedRatio: GENERAL_WATER_FEED_RATIO,
    fcr,
    adgG,
    cvPct: GENERAL_CV_PCT,
    uniformityPct: GENERAL_UNIFORMITY_PCT,
    mortality,
    henDayPct,
    henHousedPct,
    eggWeightG,
    densityBirdPerSqM,
  };
}

function emptyThresholds(): Thresholds {
  return {
    temp: null,
    humidity: null,
    lightHours: null,
    feedPerBirdG: null,
    waterFeedRatio: null,
    fcr: null,
    adgG: null,
    cvPct: null,
    uniformityPct: null,
    mortality: null,
    henDayPct: null,
    henHousedPct: null,
    eggWeightG: null,
    densityBirdPerSqM: null,
  };
}
