/**
 * shr/units/uom.ts — منبع یکتای واحد اندازه‌گیری (UOM)
 *
 * برای همه ماژول‌ها: whs, tra, flk, inc, egg, hal
 * استفاده: از getUOM(category) و getDefaultUnit(category)
 */
import type { ItemUnit } from '../../mod/whs/store';

export type Category =
  | 'feed' | 'medicine' | 'vaccine' | 'herbal' | 'equipment'
  | 'consumable' | 'egg' | 'manure' | 'broken'
  | 'chick' | 'adult' | 'fertile_egg' | 'other';

export interface UOMUnit {
  value: ItemUnit | 'l';   // 'l' کوچک — به‌عنوان alias در ItemUnit هست ولی تایپش نیست
  label: string;
  factor: number | null;   // null = نیاز به unitWeight دستی
  dimension: 'mass' | 'volume' | 'count';
}

export interface UOMRule {
  baseUnit: ItemUnit;
  units: UOMUnit[];
  default: string;
}

/** آیا واحد انتخابی نیاز به unitWeight (ضریب دستی) دارد؟ */
export const UOM_RULES: Record<Category, UOMRule> = {
  // ═══ دام و طیور — تک واحدی ═══
  chick:       { baseUnit: 'pcs', units: [{ value: 'pcs', label: 'عدد', factor: 1, dimension: 'count' }], default: 'pcs' },
  adult:       { baseUnit: 'pcs', units: [{ value: 'pcs', label: 'عدد', factor: 1, dimension: 'count' }], default: 'pcs' },
  egg:         { baseUnit: 'pcs', units: [{ value: 'pcs', label: 'عدد', factor: 1, dimension: 'count' }], default: 'pcs' },
  fertile_egg: { baseUnit: 'pcs', units: [{ value: 'pcs', label: 'عدد', factor: 1, dimension: 'count' }], default: 'pcs' },
  broken:      { baseUnit: 'pcs', units: [{ value: 'pcs', label: 'عدد', factor: 1, dimension: 'count' }], default: 'pcs' },

  // ═══ دان — پایه کیلوگرم ═══
  feed: {
    baseUnit: 'kg',
    units: [
      { value: 'kg',  label: 'کیلوگرم', factor: 1,     dimension: 'mass' },
      { value: 'g',   label: 'گرم',     factor: 0.001, dimension: 'mass' },
      { value: 'ton', label: 'تن',      factor: 1000,  dimension: 'mass' },
      { value: 'bag', label: 'کیسه (۲۵ کیلو)', factor: 25, dimension: 'mass' },
    ],
    default: 'kg',
  },

  // ═══ دارو — پایه میلی‌لیتر (مایع)، پودر با unitWeight ═══
  medicine: {
    baseUnit: 'ml',
    units: [
      { value: 'ml',   label: 'میلی‌لیتر', factor: 1,    dimension: 'volume' },
      { value: 'l',    label: 'لیتر',       factor: 1000, dimension: 'volume' },
      { value: 'g',    label: 'گرم',        factor: null, dimension: 'mass' },   // unitWeight
      { value: 'kg',   label: 'کیلوگرم',    factor: null, dimension: 'mass' },   // unitWeight
      { value: 'vial', label: 'ویال',       factor: null, dimension: 'count' },
      { value: 'pack', label: 'بسته',       factor: null, dimension: 'count' },
    ],
    default: 'ml',
  },

  // ═══ واکسن — پایه ویال (فیزیکی) ═══
  vaccine: {
    baseUnit: 'vial',
    units: [
      { value: 'vial', label: 'ویال', factor: 1,    dimension: 'count' },
      { value: 'dose', label: 'دوز',  factor: null, dimension: 'count' },   // unitWeight = doses/vial
      { value: 'pack', label: 'بسته', factor: null, dimension: 'count' },
    ],
    default: 'vial',
  },

  // ═══ داروی گیاهی — پایه گرم ═══
  herbal: {
    baseUnit: 'g',
    units: [
      { value: 'g',    label: 'گرم',     factor: 1,    dimension: 'mass' },
      { value: 'kg',   label: 'کیلوگرم', factor: 1000, dimension: 'mass' },
      { value: 'pack', label: 'بسته',    factor: null, dimension: 'count' },
    ],
    default: 'g',
  },

  // ═══ تجهیزات — پایه عدد ═══
  equipment: {
    baseUnit: 'pcs',
    units: [
      { value: 'pcs', label: 'عدد',     factor: 1, dimension: 'count' },
      { value: 'kg',  label: 'کیلوگرم', factor: 1, dimension: 'mass' },
      { value: 'L',   label: 'لیتر',    factor: 1, dimension: 'volume' },
    ],
    default: 'pcs',
  },

  // ═══ مصرفی — پایه عدد ═══
  consumable: {
    baseUnit: 'pcs',
    units: [
      { value: 'pcs',  label: 'عدد',  factor: 1,    dimension: 'count' },
      { value: 'pack', label: 'بسته', factor: null, dimension: 'count' },
    ],
    default: 'pcs',
  },

  // ═══ کود — پایه کیلوگرم ═══
  manure: {
    baseUnit: 'kg',
    units: [
      { value: 'kg',  label: 'کیلوگرم', factor: 1,    dimension: 'mass' },
      { value: 'ton', label: 'تن',      factor: 1000, dimension: 'mass' },
      { value: 'bag', label: 'کیسه',    factor: 25,   dimension: 'mass' },
    ],
    default: 'kg',
  },

  // ═══ سایر — پایه عدد ═══
  other: {
    baseUnit: 'pcs',
    units: [
      { value: 'pcs',  label: 'عدد',     factor: 1,    dimension: 'count' },
      { value: 'kg',   label: 'کیلوگرم', factor: 1,    dimension: 'mass' },
      { value: 'pack', label: 'بسته',    factor: null, dimension: 'count' },
    ],
    default: 'pcs',
  },
};

// ═══ Helper ها ═══

export function getUOM(cat: string | undefined): UOMRule | null {
  if (!cat) return null;
  return UOM_RULES[cat as Category] ?? null;
}

export function getDefaultUnit(cat: string | undefined): string {
  if (!cat) return 'pcs';
  return UOM_RULES[cat as Category]?.default ?? 'pcs';
}

export function getBaseUnit(cat: string | undefined): ItemUnit {
  if (!cat) return 'pcs';
  return UOM_RULES[cat as Category]?.baseUnit ?? 'pcs';
}

export function needsUnitWeight(cat: string | undefined, unit: string): boolean {
  const u = getUOM(cat)?.units.find(x => x.value === unit);
  return !!u && u.factor === null;
}

export function getUOMUnit(cat: string | undefined, unit: string): UOMUnit | null {
  return getUOM(cat)?.units.find(x => x.value === unit) ?? null;
}
