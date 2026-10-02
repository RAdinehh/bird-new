/**
 * temp.ts — تبدیل واحد دما (°C ↔ °F)
 *
 * ⚠️ ذخیره همیشه به سلسیوس، نمایش به واحد کاربر.
 */

export type TempUnit = 'c' | 'f';

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

export function tempLabel(unit: TempUnit): string {
  return unit === 'c' ? '°C' : '°F';
}

export function toUserTemp(celsius: number | null | undefined, unit: TempUnit): number | null {
  if (celsius == null || isNaN(celsius)) return null;
  return unit === 'c' ? celsius : cToF(celsius);
}

export function toCelsius(userValue: number | null | undefined, unit: TempUnit): number | null {
  if (userValue == null || isNaN(userValue)) return null;
  return unit === 'c' ? userValue : fToC(userValue);
}

export function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

export function formatTemp(
  celsius: number | null | undefined,
  unit: TempUnit,
  toFaFn: (v: any) => string,
): string {
  if (celsius == null) return '—';
  const v = toUserTemp(celsius, unit);
  if (v == null) return '—';
  return toFaFn(round1(v)) + tempLabel(unit);
}
