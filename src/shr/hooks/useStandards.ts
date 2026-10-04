import { useMemo } from 'react';
import { BUILTIN_STANDARDS, getStandard } from '../data/standards';
import type { Standard } from '../data/standards';

/** درون‌یابی خطی برای هر ستون عددی */
function interp<T extends Record<string, number>>(
  points: T[],
  xKey: keyof T,
  yKey: keyof T,
  x: number,
): number | null {
  if (points.length === 0) return null;
  const sorted = [...points].sort((a, b) => a[xKey] - b[xKey]);
  if (x <= sorted[0][xKey]) return sorted[0][yKey];
  if (x >= sorted[sorted.length - 1][xKey]) return sorted[sorted.length - 1][yKey];
  for (let i = 0; i < sorted.length - 1; i++) {
    const a = sorted[i];
    const b = sorted[i + 1];
    if (x >= a[xKey] && x <= b[xKey]) {
      const t = (x - a[xKey]) / (b[xKey] - a[xKey]);
      return a[yKey] + t * (b[yKey] - a[yKey]);
    }
  }
  return null;
}

export function useStandards(standardId?: string) {
  const standard: Standard | undefined = useMemo(
    () => (standardId ? getStandard(standardId) : undefined),
    [standardId],
  );

  const all = BUILTIN_STANDARDS;

  /** دما در روز مشخص */
  const tempAtDay = (day: number): number | null => {
    if (!standard) return null;
    const sorted = [...standard.temperature].sort((a, b) => a.day - b.day);
    if (day <= sorted[0].day) return sorted[0].tempC;
    if (day >= sorted[sorted.length - 1].day) return sorted[sorted.length - 1].tempC;
    for (let i = 0; i < sorted.length - 1; i++) {
      if (day >= sorted[i].day && day <= sorted[i + 1].day) {
        const t = (day - sorted[i].day) / (sorted[i + 1].day - sorted[i].day);
        return sorted[i].tempC + t * (sorted[i + 1].tempC - sorted[i].tempC);
      }
    }
    return null;
  };

  /** رطوبت در روز مشخص */
  const humidityAtDay = (day: number): { min: number; max: number } | null => {
    if (!standard) return null;
    const sorted = [...standard.temperature].sort((a, b) => a.day - b.day);
    if (day <= sorted[0].day) return { min: sorted[0].humidityMin, max: sorted[0].humidityMax };
    if (day >= sorted[sorted.length - 1].day) {
      const last = sorted[sorted.length - 1];
      return { min: last.humidityMin, max: last.humidityMax };
    }
    for (let i = 0; i < sorted.length - 1; i++) {
      if (day >= sorted[i].day && day <= sorted[i + 1].day) {
        const t = (day - sorted[i].day) / (sorted[i + 1].day - sorted[i].day);
        return {
          min: sorted[i].humidityMin + t * (sorted[i + 1].humidityMin - sorted[i].humidityMin),
          max: sorted[i].humidityMax + t * (sorted[i + 1].humidityMax - sorted[i].humidityMax),
        };
      }
    }
    return null;
  };

  /** وزن پرنده در روز مشخص (گرم) */
  const weightAtDay = (day: number): number | null => {
    if (!standard) return null;
    return interp(standard.weightByAge as any, 'day', 'weightG', day) as number | null;
  };

  /** دان مصرفی در روز مشخص (گرم/پرنده) */
  const feedAtDay = (day: number): number | null => {
    if (!standard || !standard.feedByAge) return null;
    return interp(standard.feedByAge as any, 'day', 'gramsPerBird', day) as number | null;
  };

  /** نیاز تهویه بر اساس وزن (m³/h/پرنده) */
  const ventilationPerBird = (weightKg: number): number | null => {
    if (!standard) return null;
    return interp(standard.ventilationByWeight as any, 'weightKg', 'm3hPerBird', weightKg) as number | null;
  };

  /** نیاز آبخوری (تعداد) */
  const drinkerNeed = (type: 'nipple' | 'cup' | 'fountain', birdCount: number): number | null => {
    if (!standard) return null;
    const d = standard.equipment.drinker;
    const perBird = type === 'nipple' ? d.nippleBirdsPerUnit
                  : type === 'cup'    ? d.cupBirdsPerUnit
                  : type === 'fountain' ? d.fountainBirdsPerUnit
                  : null;
    if (!perBird) return null;
    return Math.ceil(birdCount / perBird);
  };

  /** نیاز دانخوری (تعداد) */
  const feederNeed = (type: 'pan' | 'tube' | 'manual', birdCount: number): number | null => {
    if (!standard) return null;
    const f = standard.equipment.feeder;
    const perBird = type === 'pan' ? f.panBirdsPerUnit
                  : type === 'tube' ? f.tubeBirdsPerUnit
                  : type === 'manual' ? f.manualBirdsPerUnit
                  : null;
    if (!perBird) return null;
    return Math.ceil(birdCount / perBird);
  };

  return {
    standard,
    all,
    tempAtDay,
    humidityAtDay,
    weightAtDay,
    feedAtDay,
    ventilationPerBird,
    drinkerNeed,
    feederNeed,
  };
}
