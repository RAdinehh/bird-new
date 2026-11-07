/**
 * mortality.ts — محاسبه نرخ تلفات
 *
 * استاندارد: Aviagen Ross 308 / Hy-Line W-36
 *
 * فرمول‌ها:
 *   dailyPct      = deathsToday / (aliveToday + deathsToday) × 100
 *   weeklyPct     = deathsThisWeek / (aliveToday + deathsToday) × 100
 *   cumulativePct = deathsCumulative / initialCount × 100
 *
 * آستانه‌ها:
 *   - pct ≤ standard × 0.8 → accent
 *   - pct ≤ standard × 1.0 → accent
 *   - pct ≤ standard × 1.5 → warn
 *   - pct > standard × 1.5 → danger
 */
import type { MortalityParams, MortalityResult, Tone } from '../types';

function computeTone(pct: number, standard: number | null): Tone {
  if (standard === null || standard <= 0) return 'info';
  const ratio = pct / standard;
  if (ratio <= 0.8) return 'accent';
  if (ratio <= 1.0) return 'accent';
  if (ratio <= 1.5) return 'warn';
  return 'danger';
}

function computeDiff(pct: number, standard: number | null): number | null {
  if (standard === null || standard <= 0) return null;
  return Math.round(((pct - standard) / standard) * 1000) / 10;
}

export function calculateMortality(params: MortalityParams): MortalityResult {
  const {
    deathsToday,
    deathsThisWeek,
    deathsCumulative,
    aliveToday,
    initialCount,
    standardDailyPct,
    standardWeeklyPct,
    standardTotalPct,
  } = params;

  // ═══ موجودی قبل از تلفات امروز
  const beforeToday = aliveToday + deathsToday;

  // ═══ نرخ‌ها
  const dailyPct =
    beforeToday > 0 ? (deathsToday / beforeToday) * 100 : 0;

  // weeklyPct: تلفات هفته ÷ (زنده فعلی + تلفات امروز)
  // نکته: weekly شامل تلفات امروز است، پس مخرج هم beforeToday است
  const weeklyPct =
    beforeToday > 0 ? (deathsThisWeek / beforeToday) * 100 : 0;

  const cumulativePct =
    initialCount > 0 ? (deathsCumulative / initialCount) * 100 : 0;

  // ═══ گرد کردن
  const dailyR = Math.round(dailyPct * 1000) / 1000;
  const weeklyR = Math.round(weeklyPct * 1000) / 1000;
  const cumulativeR = Math.round(cumulativePct * 1000) / 1000;

  return {
    dailyPct: dailyR,
    weeklyPct: weeklyR,
    cumulativePct: cumulativeR,
    dailyTone: computeTone(dailyR, standardDailyPct),
    weeklyTone: computeTone(weeklyR, standardWeeklyPct),
    cumulativeTone: computeTone(cumulativeR, standardTotalPct),
    dailyDiffPct: computeDiff(dailyR, standardDailyPct),
    weeklyDiffPct: computeDiff(weeklyR, standardWeeklyPct),
    cumulativeDiffPct: computeDiff(cumulativeR, standardTotalPct),
  };
}
