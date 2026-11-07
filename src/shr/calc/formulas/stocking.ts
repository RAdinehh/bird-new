/**
 * stocking.ts — تراکم
 *
 *   densityBirdPerSqM = aliveCount / hallAreaSqM
 *
 * tone:
 *   hallArea = 0 یا density = 0 → info (داده کافی نیست)
 *   ratio ≤ 0.9  → accent
 *   ratio ≤ 1.0  → accent
 *   ratio ≤ 1.1  → warn
 *   ratio > 1.1  → danger
 *
 * warning:
 *   ratio > 1.5  → «تراکم خطرناک»
 *   ratio > 1.0  → «تراکم بیش از حد مجاز»
 */
import type { StockingParams, StockingResult, Tone } from '../types';

export function calculateStockingDensity(
  params: StockingParams,
): StockingResult {
  const { aliveCount, hallAreaSqM, standardDensityMax } = params;

  // guard: بدون مساحت یا بدون پرنده → info
  if (hallAreaSqM <= 0 || aliveCount <= 0) {
    return {
      densityBirdPerSqM: 0,
      standardDensityMax,
      tone: 'info',
      warning: null,
    };
  }

  const density = aliveCount / hallAreaSqM;
  const densityR = Math.round(density * 10) / 10;

  let tone: Tone = 'info';
  let warning: string | null = null;

  if (standardDensityMax !== null && standardDensityMax > 0) {
    const ratio = density / standardDensityMax;
    if (ratio <= 0.9) tone = 'accent';
    else if (ratio <= 1.0) tone = 'accent';
    else if (ratio <= 1.1) tone = 'warn';
    else tone = 'danger';

    if (ratio > 1.5) {
      warning = 'تراکم خطرناک — خطر رفاه و کاهش شدید FCR';
    } else if (ratio > 1.0) {
      warning = 'تراکم بیش از حد مجاز — بررسی تهویه';
    }
  }

  return {
    densityBirdPerSqM: densityR,
    standardDensityMax,
    tone,
    warning,
  };
}
