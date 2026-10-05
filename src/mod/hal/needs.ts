/**
 * needs.ts — محاسبه نیاز تجهیزات بر اساس استاندارد و گله
 *
 * فرمول‌ها بر اساس منابع علمی (Aviagen/Cobb) و استانداردهای ایران
 */
import type { BirdStandard } from '../set/standards/types';

/** درون‌یابی وزن پرنده بر اساس سن (روز) */
function interpolateWeight(std: BirdStandard | null, ageDays: number): number {
  if (!std?.growth?.weightByAge?.length) return 1500; // fallback 1.5 kg
  const pts = [...std.growth.weightByAge].sort((a, b) => a.dayFrom - b.dayFrom);
  if (pts.length === 0) return 1500;
  if (ageDays <= pts[0].dayFrom) return pts[0].weightG;
  if (ageDays >= pts[pts.length - 1].dayTo) return pts[pts.length - 1].weightG;
  for (let i = 0; i < pts.length - 1; i++) {
    if (ageDays >= pts[i].dayFrom && ageDays <= pts[i].dayTo) {
      return pts[i].weightG;
    }
    if (ageDays > pts[i].dayTo && ageDays < pts[i + 1].dayFrom) {
      const t = (ageDays - pts[i].dayTo) / (pts[i + 1].dayFrom - pts[i].dayTo);
      return pts[i].weightG + t * (pts[i + 1].weightG - pts[i].weightG);
    }
  }
  return pts[pts.length - 1].weightG;
}

export interface NeedInput {
  /** تعداد پرنده فعال در سالن */
  birdCount: number;
  /** سن گله (روز) */
  ageDays: number;
  /** مساحت سالن (m²) */
  areaM2: number;
  /** حجم سالن (m³) */
  volumeM3: number;
  /** استاندارد نژاد */
  standard: BirdStandard | null;
}

export interface CategoryNeed {
  /** مقدار نیاز (واحد بسته به دسته) */
  value: number;
  /** واحد */
  unit: string;
  /** توضیح محاسبه */
  formula: string;
}

/** نیاز تهویه (m³/h) */
export function needVentilation(inp: NeedInput): CategoryNeed | null {
  if (!inp.standard || inp.birdCount <= 0) return null;
  const weightG = interpolateWeight(inp.standard, inp.ageDays);
  const weightKg = weightG / 1000;
  const totalKg = inp.birdCount * weightKg;
  const coef = inp.standard.equipment?.fanM3PerKg || 4.5;
  const value = Math.ceil(totalKg * coef);
  return {
    value,
    unit: 'm³/h',
    formula: `${inp.birdCount} پرنده × ${weightKg.toFixed(2)} kg × ${coef}`,
  };
}

/** نیاز روشنایی (W) */
export function needLighting(inp: NeedInput): CategoryNeed | null {
  if (!inp.standard || inp.areaM2 <= 0) return null;
  const wPerM2 = inp.standard.equipment?.lampWattPerM2 || 3;
  const value = Math.ceil(inp.areaM2 * wPerM2);
  return {
    value,
    unit: 'W',
    formula: `${inp.areaM2} m² × ${wPerM2} W/m²`,
  };
}

/** نیاز آبخوری (تعداد) */
export function needDrinker(inp: NeedInput): CategoryNeed | null {
  if (!inp.standard || inp.birdCount <= 0) return null;
  const d = inp.standard.equipment?.drinker;
  if (!d) return null;
  // اولویت: نیپل، بعد کاپ، بعد فواره‌ای
  const ratio = d.nippleBirdsPerUnit || d.cupBirdsPerUnit;
  if (!ratio) return null;
  const value = Math.ceil(inp.birdCount / ratio);
  const type = d.nippleBirdsPerUnit ? 'نیپل' : 'کاپ';
  return {
    value,
    unit: 'عدد',
    formula: `${inp.birdCount} پرنده ÷ ${ratio} پرنده/${type}`,
  };
}

/** نیاز دانخوری (تعداد) */
export function needFeeder(inp: NeedInput): CategoryNeed | null {
  if (!inp.standard || inp.birdCount <= 0) return null;
  const f = inp.standard.equipment?.feeder;
  if (!f) return null;
  const ratio = f.panBirdsPerUnit;
  if (!ratio) return null;
  const value = Math.ceil(inp.birdCount / ratio);
  const type = 'بشقابی';
  return {
    value,
    unit: 'عدد',
    formula: `${inp.birdCount} پرنده ÷ ${ratio} پرنده/${type}`,
  };
}

/** نیاز بستر (kg) */
export function needLitter(inp: NeedInput): CategoryNeed | null {
  if (inp.areaM2 <= 0) return null;
  // استفاده از litter استاندارد اگر باشد، وگرنه مقدار پیش‌فرض
  const kgPerM2 = inp.standard?.litter?.kgPerM2 || 4.5;
  const value = Math.ceil(inp.areaM2 * kgPerM2);
  return {
    value,
    unit: 'kg',
    formula: `${inp.areaM2} m² × ${kgPerM2} kg/m²`,
  };
}

/** نقشه دسته → تابع محاسبه */
export const NEED_CALCULATORS: Record<string, (inp: NeedInput) => CategoryNeed | null> = {
  ventilation: needVentilation,
  lighting: needLighting,
  drinking: needDrinker,
  feeding: needFeeder,
  litter: needLitter,
};
