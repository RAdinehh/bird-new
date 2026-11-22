/**
 * convert.ts — تبدیل دقیق واحدها به واحد پایه با decimal.js
 */
import Decimal from 'decimal.js';
import type {
  WeightUnit, VolumeUnit, LengthUnit, AreaUnit, TimeUnit,
  TempUnit, CurrencyUnit,
} from './types';

const d = (v: number) => new Decimal(Number.isFinite(v) ? v : 0);

// ═══ وزن (پایه: گرم) ═══
const WEIGHT_TO_G: Record<WeightUnit, number> = {
  mg: 0.001, g: 1, kg: 1000, ton: 1_000_000,
};
export const weightToG = (value: number, unit: WeightUnit): number => d(value).times(WEIGHT_TO_G[unit]).toNumber();
export const gToWeight = (grams: number, unit: WeightUnit): number => d(grams).div(WEIGHT_TO_G[unit]).toNumber();

// ═══ حجم (پایه: میلی‌لیتر) ═══
const VOLUME_TO_ML: Record<VolumeUnit, number> = {
  cc: 1, ml: 1, L: 1000, gal: 3785.41,
};
export const volumeToMl = (value: number, unit: VolumeUnit): number => d(value).times(VOLUME_TO_ML[unit]).toNumber();
export const mlToVolume = (ml: number, unit: VolumeUnit): number => d(ml).div(VOLUME_TO_ML[unit]).toNumber();

// ═══ طول (پایه: سانتی‌متر) ═══
const LENGTH_TO_CM: Record<LengthUnit, number> = {
  mm: 0.1, cm: 1, m: 100, km: 100_000,
};
export const lengthToCm = (value: number, unit: LengthUnit): number => d(value).times(LENGTH_TO_CM[unit]).toNumber();
export const cmToLength = (cm: number, unit: LengthUnit): number => d(cm).div(LENGTH_TO_CM[unit]).toNumber();

// ═══ مساحت (پایه: مترمربع) ═══
const AREA_TO_M2: Record<AreaUnit, number> = {
  m2: 1, ha: 10_000, ft2: 0.09290304,
};
export const areaToM2 = (value: number, unit: AreaUnit): number => d(value).times(AREA_TO_M2[unit]).toNumber();
export const m2ToArea = (m2: number, unit: AreaUnit): number => d(m2).div(AREA_TO_M2[unit]).toNumber();

// ═══ زمان (پایه: ثانیه) ═══
const TIME_TO_S: Record<TimeUnit, number> = {
  s: 1, min: 60, h: 3600, day: 86400,
};
export const timeToS = (value: number, unit: TimeUnit): number => d(value).times(TIME_TO_S[unit]).toNumber();
export const sToTime = (s: number, unit: TimeUnit): number => d(s).div(TIME_TO_S[unit]).toNumber();

// ═══ دما (پایه: سلسیوس) ═══
export const cToF = (c: number): number => d(c).times(9).div(5).plus(32).toNumber();
export const fToC = (f: number): number => d(f).minus(32).times(5).div(9).toNumber();
export const tempToC = (value: number, unit: TempUnit): number => (unit === 'c' ? value : fToC(value));
export const cToTemp = (c: number, unit: TempUnit): number => (unit === 'c' ? c : cToF(c));

// ═══ پول (پایه: تومان) ═══
const TOMAN_TO_RIAL = 10;

export function currencyToToman(value: number, unit: CurrencyUnit, usdRate: number): number {
  if (!Number.isFinite(value)) return 0;
  if (unit === 'toman') return value;
  if (unit === 'rial') return d(value).div(TOMAN_TO_RIAL).toNumber();
  if (unit === 'usd') {
    const rate = Number.isFinite(usdRate) && usdRate > 0 ? usdRate : 0;
    return rate > 0 ? d(value).times(rate).toNumber() : 0;
  }
  return value;
}

export function tomanToCurrency(toman: number, unit: CurrencyUnit, usdRate: number): number {
  if (!Number.isFinite(toman)) return 0;
  if (unit === 'toman') return toman;
  if (unit === 'rial') return d(toman).times(TOMAN_TO_RIAL).toNumber();
  if (unit === 'usd') {
    const rate = Number.isFinite(usdRate) && usdRate > 0 ? usdRate : 0;
    return rate > 0 ? d(toman).div(rate).toNumber() : 0;
  }
  return toman;
}
