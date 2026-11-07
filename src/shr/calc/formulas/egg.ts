/**
 * egg.ts — شاخص‌های تولید تخم
 *
 * استاندارد: Hy-Line W-36 Management Guide
 *
 *   henDayPct      = تخم سالم امروز ÷ مرغ زنده امروز × 100
 *   henHousedPct   = تخم سالم امروز ÷ مرغ اولیه × 100
 *   brokenRatePct  = تخم شکسته ÷ کل جمع‌آوری × 100
 *   dirtyRatePct   = تخم کثیف ÷ کل جمع‌آوری × 100
 *
 * tone (hen-day و hen-housed):
 *   - ≥ استاندارد → accent
 *   - ۰.۹ تا ۱.۰ × استاندارد → warn
 *   - < ۰.۹ × استاندارد → danger
 *
 * tone (broken و dirty):
 *   - broken: < ۲٪ accent | ۲-۴٪ warn | > ۴٪ danger
 *   - dirty:  < ۲٪ accent | ۲-۵٪ warn | > ۵٪ danger
 */
import type { EggParams, EggResult, Tone } from '../types';

function rateTone(pct: number, standard: number | null): Tone {
  if (standard === null || standard <= 0) return 'info';
  if (pct >= standard) return 'accent';
  if (pct >= standard * 0.9) return 'warn';
  return 'danger';
}

export function calculateEggMetrics(params: EggParams): EggResult {
  const {
    eggsToday,
    eggsBroken,
    eggsDirty,
    aliveToday,
    initialCount,
    standardHenDayPct,
    standardHenHousedPct,
  } = params;

  const totalToday = eggsToday + eggsBroken + eggsDirty;

  // hen-day
  const henDayPct = aliveToday > 0 ? (eggsToday / aliveToday) * 100 : 0;
  const henDayR = Math.round(henDayPct * 10) / 10;

  // hen-housed
  const henHousedPct = initialCount > 0 ? (eggsToday / initialCount) * 100 : 0;
  const henHousedR = Math.round(henHousedPct * 10) / 10;

  // broken rate
  const brokenRate = totalToday > 0 ? (eggsBroken / totalToday) * 100 : 0;
  const brokenR = Math.round(brokenRate * 10) / 10;

  // dirty rate
  const dirtyRate = totalToday > 0 ? (eggsDirty / totalToday) * 100 : 0;
  const dirtyR = Math.round(dirtyRate * 10) / 10;

  // hen-day diff
  const henDayDiffPct =
    standardHenDayPct !== null && standardHenDayPct > 0
      ? Math.round(((henDayR - standardHenDayPct) / standardHenDayPct) * 1000) / 10
      : null;

  return {
    henDayPct: henDayR,
    henDayTone: rateTone(henDayR, standardHenDayPct),
    henDayDiffPct,
    henHousedPct: henHousedR,
    henHousedTone: rateTone(henHousedR, standardHenHousedPct),
    brokenRatePct: brokenR,
    brokenTone: brokenR < 2 ? 'accent' : brokenR < 4 ? 'warn' : 'danger',
    dirtyRatePct: dirtyR,
    dirtyTone: dirtyR < 2 ? 'accent' : dirtyR < 5 ? 'warn' : 'danger',
  };
}
