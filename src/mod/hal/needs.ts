/**
 * needs.ts — محاسبه نیاز تجهیزات بر اساس استاندارد و گله
 */
import type { BirdStandard } from '../set/standards/types';

/** درون‌یابی وزن پرنده بر اساس سن (روز) */
function interpolateWeight(std: BirdStandard | null, ageDays: number): number {
  if (!std?.growth?.weightByAge?.length) return 1500;
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
  birdCount: number;
  ageDays: number;
  areaM2: number;
  volumeM3: number;
  standard: BirdStandard | null;
  /** 🆕 نوع بستر انتخاب‌شده سالن */
  litterType?: string | null;
}

export interface CategoryNeed {
  value: number;
  unit: string;
  formula: string;
}

/** نیاز تهویه (m³/h) */
export function needVentilation(inp: NeedInput): CategoryNeed | null {
  if (!inp.standard || inp.birdCount <= 0) return null;
  const weightG = interpolateWeight(inp.standard, inp.ageDays);
  const weightKg = weightG / 1000;
  const totalKg = inp.birdCount * weightKg;
  const coef = inp.standard.equipment?.fanM3PerKg || 4.5;
  return {
    value: Math.ceil(totalKg * coef),
    unit: 'm³/h',
    formula: `${inp.birdCount} × ${weightKg.toFixed(2)}kg × ${coef}`,
  };
}

/** نیاز روشنایی (W) */
export function needLighting(inp: NeedInput): CategoryNeed | null {
  if (!inp.standard || inp.areaM2 <= 0) return null;
  const wPerM2 = inp.standard.equipment?.lampWattPerM2 || 3;
  return {
    value: Math.ceil(inp.areaM2 * wPerM2),
    unit: 'W',
    formula: `${inp.areaM2} m² × ${wPerM2} W/m²`,
  };
}

/** نیاز آبخوری (تعداد) */
export function needDrinker(inp: NeedInput): CategoryNeed | null {
  if (!inp.standard || inp.birdCount <= 0) return null;
  // 🆕 به‌جای تعداد تجهیز، ظرفیت پرنده برمی‌گردونیم تا با calcInstalled هم‌واحد باشه
  return {
    value: inp.birdCount,
    unit: 'پرنده',
    formula: `${inp.birdCount} پرنده`,
  };
}

/** نیاز دانخوری (تعداد) */
export function needFeeder(inp: NeedInput): CategoryNeed | null {
  if (!inp.standard || inp.birdCount <= 0) return null;
  // 🆕 ظرفیت پرنده
  return {
    value: inp.birdCount,
    unit: 'پرنده',
    formula: `${inp.birdCount} پرنده`,
  };
}

/** نیاز بستر (kg) — بر اساس مساحت × kg/m² (بسته به ماده) */
export function needLitter(inp: NeedInput): CategoryNeed | null {
  if (inp.areaM2 <= 0) return null;
  const std = inp.standard?.litter;
  const kgMap = std?.kgPerM2ByMaterial;

  // 🆕 نگاشت Equipment type → Standard key
  const LITTER_KEY_MAP: Record<string, string> = {
    'litter_wood_shavings': 'wood_shavings',
    'wood_shavings': 'wood_shavings',
    'litter_roll': 'paper_roll',
    'paper_roll': 'paper_roll',
    'litter_sand': 'sand',
    'sand': 'sand',
    'litter_rice_hull': 'rice_hull',
    'rice_hull': 'rice_hull',
    'litter_straw': 'straw',
    'straw': 'straw',
    'litter_sawdust': 'sawdust',
    'sawdust': 'sawdust',
    'litter_peat': 'peat',
    'peat': 'peat',
  };
  const rawType = inp.litterType;
  const litterType = rawType ? (LITTER_KEY_MAP[rawType] || rawType) : null;

  let kgPerM2 = 0;
  let materialName = '—';
  if (kgMap && litterType && (kgMap as Record<string, number>)[litterType] !== undefined) {
    kgPerM2 = (kgMap as Record<string, number>)[litterType];
    materialName = litterType;
  } else if (kgMap && std?.recommended?.[0]) {
    kgPerM2 = (kgMap as Record<string, number>)[std.recommended[0]] || 0;
    materialName = std.recommended[0];
  }

  if (kgPerM2 <= 0) return null;

  return {
    value: Math.ceil(inp.areaM2 * kgPerM2 * 10) / 10,
    unit: 'kg',
    formula: `${inp.areaM2} m² × ${kgPerM2} kg/m² (${materialName})`,
  };
}

/** نیاز گرمایش (kW) — استاندارد صنعتی: ۰.۱-۰.۲ kW/m² */
export function needHeating(inp: NeedInput): CategoryNeed | null {
  if (inp.areaM2 <= 0) return null;
  const kwPerM2 = 0.15;
  return {
    value: Math.ceil(inp.areaM2 * kwPerM2 * 10) / 10,
    unit: 'kW',
    formula: `${inp.areaM2} m² × ${kwPerM2} kW/m²`,
  };
}

export const NEED_CALCULATORS: Record<string, (inp: NeedInput) => CategoryNeed | null> = {
  ventilation: needVentilation,
  heating: needHeating,
  lighting: needLighting,
  drinking: needDrinker,
  feeding: needFeeder,
  litter: needLitter,
};
