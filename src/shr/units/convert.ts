/**
 * convert.ts — تبدیل واحدها به واحد پایه
 *
 * واحد پایه:
 *   وزن: گرم (g)
 *   حجم: میلی‌لیتر (ml)
 *   طول: سانتی‌متر (cm)
 *   مساحت: مترمربع (m²)
 *   دما: سلسیوس (°C)
 *   زمان: ثانیه (s)
 *   پول: تومان
 */

import type {
  WeightUnit, VolumeUnit, LengthUnit, AreaUnit, TimeUnit,
  TempUnit, CurrencyUnit,
} from './types';

// ═══ وزن: تبدیل به گرم ═══
const WEIGHT_TO_G: Record<WeightUnit, number> = {
  mg: 0.001,
  g: 1,
  kg: 1000,
  ton: 1_000_000,
};

export function weightToG(value: number, unit: WeightUnit): number {
  return value * WEIGHT_TO_G[unit];
}

export function gToWeight(grams: number, unit: WeightUnit): number {
  return grams / WEIGHT_TO_G[unit];
}

// ═══ حجم: تبدیل به میلی‌لیتر ═══
const VOLUME_TO_ML: Record<VolumeUnit, number> = {
  cc: 1,       // دقیقاً برابر ml
  ml: 1,
  L: 1000,
  gal: 3785.41,  // گالن آمریکایی
};

export function volumeToMl(value: number, unit: VolumeUnit): number {
  return value * VOLUME_TO_ML[unit];
}

export function mlToVolume(ml: number, unit: VolumeUnit): number {
  return ml / VOLUME_TO_ML[unit];
}

// ═══ طول: تبدیل به سانتی‌متر ═══
const LENGTH_TO_CM: Record<LengthUnit, number> = {
  mm: 0.1,
  cm: 1,
  m: 100,
  km: 100_000,
};

export function lengthToCm(value: number, unit: LengthUnit): number {
  return value * LENGTH_TO_CM[unit];
}

export function cmToLength(cm: number, unit: LengthUnit): number {
  return cm / LENGTH_TO_CM[unit];
}

// ═══ مساحت: تبدیل به مترمربع ═══
const AREA_TO_M2: Record<AreaUnit, number> = {
  m2: 1,
  ha: 10_000,
  ft2: 0.09290304,
};

export function areaToM2(value: number, unit: AreaUnit): number {
  return value * AREA_TO_M2[unit];
}

export function m2ToArea(m2: number, unit: AreaUnit): number {
  return m2 / AREA_TO_M2[unit];
}

// ═══ زمان: تبدیل به ثانیه ═══
const TIME_TO_S: Record<TimeUnit, number> = {
  s: 1,
  min: 60,
  h: 3600,
  day: 86400,
};

export function timeToS(value: number, unit: TimeUnit): number {
  return value * TIME_TO_S[unit];
}

export function sToTime(s: number, unit: TimeUnit): number {
  return s / TIME_TO_S[unit];
}

// ═══ دما ═══
export function cToF(c: number): number {
  return c * 9 / 5 + 32;
}

export function fToC(f: number): number {
  return (f - 32) * 5 / 9;
}

export function tempToC(value: number, unit: TempUnit): number {
  return unit === 'c' ? value : fToC(value);
}

export function cToTemp(c: number, unit: TempUnit): number {
  return unit === 'c' ? c : cToF(c);
}

// ═══ پول (پایه: تومان) ═══
const TOMAN_TO_RIAL = 10;

export function currencyToToman(
  value: number,
  unit: CurrencyUnit,
  usdRate: number,
): number {
  if (unit === 'toman') return value;
  if (unit === 'rial') return value / TOMAN_TO_RIAL;
  if (unit === 'usd') return value * usdRate;
  return value;
}

export function tomanToCurrency(
  toman: number,
  unit: CurrencyUnit,
  usdRate: number,
): number {
  if (unit === 'toman') return toman;
  if (unit === 'rial') return toman * TOMAN_TO_RIAL;
  if (unit === 'usd') return toman / usdRate;
  return toman;
}
