/**
 * equipUnits.ts — API اصلی واحدها و فرمول‌های تجهیزات
 *
 * از دو فایل زیرین تغذیه می‌شود:
 *   - _equipUnitsCore.ts (زیرنوع‌های اصلی)
 *   - _equipUnitsExtras.ts (زیرنوع‌های جانبی)
 *
 * API عمومی:
 *   - EQUIP_UNITS
 *   - getEquipUnit(type)
 */

import { EQUIP_UNITS_CORE } from './_equipUnitsCore';
import { EQUIP_UNITS_EXTRAS } from './_equipUnitsExtras';

export interface FieldDef {
  label: string;
  unit: string;
  defaultValue?: number;
  optional?: boolean;
  /** 🆕 راهنمای نمایش (مثل «۳ لیتری — ۵۰-۷۰ پرنده») */
  hint?: string;
}

export interface EquipUnitDef {
  primary: FieldDef;
  secondary?: FieldDef;
  baseUnit: string;
  calc: (primary: number, secondary: number) => number;
  summaryLabel: string;
  stdKey?: string;
}

/** ادغام core + extras */
export const EQUIP_UNITS: Record<string, EquipUnitDef> = {
  ...EQUIP_UNITS_CORE,
  ...EQUIP_UNITS_EXTRAS,
};

/** خروجی امن — اگه زیرنوع ناشناس بود */
export function getEquipUnit(type: string): EquipUnitDef {
  return EQUIP_UNITS[type] || {
    primary: { label: 'تعداد', unit: 'عدد', defaultValue: 1 },
    baseUnit: 'عدد',
    calc: (p: number) => p,
    summaryLabel: 'عدد',
  };
}
