/**
 * environment.ts — هشدارهای محیطی (دما، رطوبت)
 *
 * منطق: حفظ رفتار قبلی (tempWarning / humidityWarning) — بدون تغییر
 *
 * Tone:
 *   accent   → در محدوده یا بدون داده
 *   warn     → کمی خارج
 *   danger   → خارج از محدوده مجاز
 */
import type { Tone } from '../types';

export interface EnvironmentWarningParams {
  tempC: number | null;
  tempMin: number | null;
  tempMax: number | null;
  tempTarget: number | null;
  humidityPct: number | null;
  humidityMin: number | null;
  humidityMax: number | null;
}

export interface EnvironmentWarningResult {
  tempTone: Tone;
  humidityTone: Tone;
}

function tempToneFrom(
  temp: number | null,
  min: number | null,
  max: number | null,
  target: number | null,
): Tone {
  if (temp == null || temp === 0) return 'accent';
  if (min != null && max != null) {
    if (temp < min || temp > max) return 'danger';
    if (target != null) {
      const range = max - min;
      const tolerance = Math.max(1, range * 0.15);
      if (Math.abs(temp - target) > tolerance) return 'warn';
    }
    return 'accent';
  }
  if (temp < 15 || temp > 30) return 'danger';
  if (temp < 18 || temp > 26) return 'warn';
  return 'accent';
}

function humidityToneFrom(
  h: number | null,
  min: number | null,
  max: number | null,
): Tone {
  if (h == null || h === 0) return 'accent';
  if (min != null && max != null) {
    const range = max - min;
    const tolerance = Math.max(5, range * 0.3);
    if (h < min - tolerance || h > max + tolerance) return 'danger';
    if (h < min || h > max) return 'warn';
    return 'accent';
  }
  if (h < 30 || h > 80) return 'danger';
  if (h < 40 || h > 70) return 'warn';
  return 'accent';
}

export function calculateEnvironmentWarnings(
  params: EnvironmentWarningParams,
): EnvironmentWarningResult {
  return {
    tempTone: tempToneFrom(
      params.tempC,
      params.tempMin,
      params.tempMax,
      params.tempTarget,
    ),
    humidityTone: humidityToneFrom(
      params.humidityPct,
      params.humidityMin,
      params.humidityMax,
    ),
  };
}
