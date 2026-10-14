/**
 * needs.ts — محاسبه نیازهای انکوباسیون (مشابه hal/needs.ts)
 *
 * همه توابع pure هستن — بدون React یا store.
 * مرجع: Ross 308 / Cobb / Aviagen Handbooks
 */
import type { IncubationStandard, BirdStandard } from '../../set/standards/types';

// ═══ Input Types ═══

export interface AirExchangeInput {
  eggCount: number;
  standard: BirdStandard | null;
}

export interface TurningInput {
  ageDays: number;
  standard: BirdStandard | null;
}

// ═══ Output Type ═══

export interface NeedResult {
  value: number;
  unit: string;
  formula: string;
  /** 🆕 آستانه هشدار (اگه خارج بازه باشه) */
  level?: 'ok' | 'warn' | 'critical';
}

// ═══ Helpers ═══

// ═══ ۱. نیاز تهویه (m³/h) ═══

/**
 * نیاز تهویه بر اساس airExchangePer1000Eggs
 * فرمول: (eggCount / 1000) × airExchangePer1000Eggs
 * پیش‌فرض: 0.14 m³/h به ازای هر ۱۰۰۰ تخم (Ross 308)
 */
export function needAirExchange(inp: AirExchangeInput): NeedResult | null {
  if (inp.eggCount <= 0) return null;
  const coef = inp.standard?.incubation?.airExchangePer1000Eggs ?? 0.14;
  const value = Math.round(((inp.eggCount / 1000) * coef) * 100) / 100;
  return {
    value,
    unit: 'm³/h',
    formula: `(${inp.eggCount} ÷ 1000) × ${coef} m³/h`,
  };
}

// ═══ ۲. نیاز چرخش ═══

/**
 * تعداد چرخش در روز + جمع کل تا امروز
 * استاندارد: ۲۴ بار در روز (هر ۱ ساعت) یا حداقل ۱۲ بار
 */
export function needTurningCount(inp: TurningInput): NeedResult | null {
  const std: IncubationStandard | undefined = inp.standard?.incubation;
  if (!std) return null;
  const perDay = std.turningPerDay ?? 24;
  const totalSoFar = perDay * Math.max(0, inp.ageDays);
  return {
    value: perDay,
    unit: 'بار/روز',
    formula: `${perDay} بار × ${inp.ageDays} روز = ${totalSoFar} چرخش`,
    level: perDay >= 24 ? 'ok' : perDay >= 12 ? 'warn' : 'critical',
  };
}

// ═══ ۳. نیاز ذخیره‌سازی تخم ═══

/**
 * تعداد روزهای ذخیره‌سازی تخم قبل از انکوباسیون
 * استاندارد: حداکثر ۷ روز (کاهش نرخ هچ بعد از ۷ روز)
 */
export function needEggStorageDays(ageDays: number, maxDays = 7): NeedResult | null {
  if (ageDays < 0) return null;
  return {
    value: ageDays,
    unit: 'روز',
    formula: `${ageDays} روز از ورود`,
    level: ageDays <= maxDays ? 'ok' : ageDays <= maxDays + 2 ? 'warn' : 'critical',
  };
}

// ═══ ۴. نرخ هچ کل (Hatchability) ═══

/**
 * نرخ هچ کل = hatched / totalEggs × 100
 * پیش‌فرض استاندارد: 80-85٪ از کل
 */
export function calcHatchability(
  hatched: number | null | undefined,
  totalEggs: number | null | undefined,
): NeedResult | null {
  if (!hatched || !totalEggs || totalEggs <= 0) return null;
  const pct = Math.round((hatched / totalEggs) * 1000) / 10;
  return {
    value: pct,
    unit: '٪',
    formula: `(${hatched} ÷ ${totalEggs}) × 100`,
    level: pct >= 80 ? 'ok' : pct >= 70 ? 'warn' : 'critical',
  };
}

// ═══ ۵. نرخ هچ واقعی (Real Hatchability) ═══

/**
 * نرخ هچ واقعی = hatched / fertileEggs × 100
 * پیش‌فرض استاندارد: 90-95٪ از نطفه‌دار
 */
export function calcRealHatchability(
  hatched: number | null | undefined,
  fertileEggs: number | null | undefined,
): NeedResult | null {
  if (!hatched || !fertileEggs || fertileEggs <= 0) return null;
  const pct = Math.round((hatched / fertileEggs) * 1000) / 10;
  return {
    value: pct,
    unit: '٪',
    formula: `(${hatched} ÷ ${fertileEggs}) × 100`,
    level: pct >= 90 ? 'ok' : pct >= 80 ? 'warn' : 'critical',
  };
}

// ═══ ۶. Chick Yield ═══

/**
 * Chick Yield = avgChickWeight / avgEggWeight × 100
 * استاندارد Ross: 64-71٪ (بهینه: 67-68٪)
 */
export function calcChickYield(
  avgChickWeightG: number | null | undefined,
  avgEggWeightG: number | null | undefined,
): NeedResult | null {
  if (!avgChickWeightG || !avgEggWeightG || avgEggWeightG <= 0) return null;
  const pct = Math.round((avgChickWeightG / avgEggWeightG) * 1000) / 10;
  const inRange = pct >= 64 && pct <= 71;
  return {
    value: pct,
    unit: '٪',
    formula: `(${avgChickWeightG} ÷ ${avgEggWeightG}) × 100`,
    level: inRange ? 'ok' : pct >= 60 && pct <= 75 ? 'warn' : 'critical',
  };
}

// ═══ Record (مشابه NEED_CALCULATORS در hal) ═══

export const INC_NEEDS: Record<string, string> = {
  airExchange: 'تهویه',
  turningCount: 'چرخش',
  eggStorage: 'ذخیره‌سازی تخم',
  hatchability: 'نرخ هچ کل',
  realHatchability: 'نرخ هچ واقعی',
  chickYield: 'Chick Yield',
};
