/**
 * temp.ts — تبدیل واحد دما (°C ↔ °F)
 *
 * ⚠️ قانون: همیشه در DB/internal به **سلسیوس** ذخیره می‌شود.
 * فقط در نمایش به کاربر، تبدیل به واحد انتخابی کاربر انجام می‌شود.
 *
 * این استاندارد صنعت است (Big Dutchman, Munters, Fancom).
 */

import { useSet } from '../../mod/set/store';

export type TempUnit = 'c' | 'f';

// ═══ تبدیل فرمول ═══
export function cToF(c: number): number {
  return c * 9 / 5 + 32;
}

export function fToC(f: number): number {
  return (f - 32) * 5 / 9;
}

export function convertTemp(value: number, from: TempUnit, to: TempUnit): number {
  if (from === to) return value;
  if (from === 'c' && to === 'f') return cToF(value);
  return fToC(value);
}

// ═══ برچسب واحد ═══
export function tempLabel(unit: TempUnit): string {
  return unit === 'c' ? '°C' : '°F';
}

// ═══ برای نمایش: از سلسیوس به واحد کاربر ═══
export function toUserTemp(celsius: number | null | undefined, unit: TempUnit): number | null {
  if (celsius == null || isNaN(celsius)) return null;
  return unit === 'c' ? celsius : cToF(celsius);
}

// ═══ برای ورودی: از واحد کاربر به سلسیوس ═══
export function toCelsius(userValue: number | null | undefined, unit: TempUnit): number | null {
  if (userValue == null || isNaN(userValue)) return null;
  return unit === 'c' ? userValue : fToC(userValue);
}

// ═══ گرد کردن به ۱ رقم اعشار ═══
export function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

// ═══ نمایش متنی «۲۲°C» یا «۷۲°F» ═══
export function formatTemp(
  celsius: number | null | undefined,
  unit: TempUnit,
  toFaFn: (v: any) => string,
): string {
  if (celsius == null) return '—';
  const v = toUserTemp(celsius, unit);
  if (v == null) return '—';
  const rounded = round1(v);
  return toFaFn(rounded) + tempLabel(unit);
}

// ═══ هوک: واحد فعلی کاربر ═══
export function useTempUnit(): TempUnit {
  const settings = useSet();
  const t = (settings as any)?.units?.temperature;
  return t === 'f' ? 'f' : 'c';
}
