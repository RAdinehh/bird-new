/**
 * epef.ts — European Production Efficiency Factor
 *
 * فرمول: EPEF = (livability٪ × weight kg × 100) / (age × FCR)
 *
 * فقط برای گله گوشتی معنی دارد (برای layer/breeder، epef = 0 و tone = info)
 *
 * tone:
 *   > 400 → accent (عالی)
 *   350-400 → accent (خوب)
 *   300-350 → warn (متوسط)
 *   < 300 → danger (ضعیف)
 */
import type { EpefParams, EpefResult, Tone } from '../types';

export function calculateEPEF(params: EpefParams): EpefResult {
  const { livabilityPct, finalWeightKg, ageDays, fcr } = params;

  // guard: denominator صفر
  if (ageDays <= 0 || fcr <= 0 || finalWeightKg <= 0) {
    return { epef: 0, tone: 'info' };
  }

  const epef =
    (livabilityPct * finalWeightKg * 100) / (ageDays * fcr);
  const epefR = Math.round(epef * 10) / 10;

  let tone: Tone = 'info';
  if (epefR > 400) tone = 'accent';
  else if (epefR >= 350) tone = 'accent';
  else if (epefR >= 300) tone = 'warn';
  else tone = 'danger';

  return { epef: epefR, tone };
}
