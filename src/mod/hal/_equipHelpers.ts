/**
 * _equipHelpers.ts — helperهای HallEquipSection
 */
import { getEquipUnit } from './equipUnits';
import type { Equipment } from './store';

export const TYPES_BY_CATEGORY: Record<string, string[]> = {
  ventilation: ['fan_tunnel', 'fan_ceiling', 'air_inlet', 'cooling_pad'],
  feeding:     ['feeder_manual', 'feeder_pan', 'feeder_chain', 'feeder_tube', 'feeder_bucket'],
  drinking:    ['nipple', 'cup', 'trough', 'fountain_drinker'],
  heating:     ['radiant_brooder', 'jet_heater', 'duct_heater'],
  lighting:    ['lamp_led', 'lamp_fluorescent', 'dimmer'],
  litter:      ['litter_wood_shavings', 'litter_roll', 'litter_sand', 'litter_rice_hull', 'litter_straw', 'litter_sawdust', 'litter_peat'],
  power:       ['generator', 'electrical_panel', 'cable'],
  auxiliary:   ['camera', 'sensor', 'scale'],
};

export function typesForCategory(cat: string): string[] {
  return TYPES_BY_CATEGORY[cat] || [];
}

/** ترتیب نمایش */
export const REQUIRED_CATS: string[] = ['ventilation', 'heating', 'lighting', 'drinking', 'feeding', 'litter'];
export const OPTIONAL_CATS: string[] = ['power', 'auxiliary'];
export const ALL_CATS: string[] = [...REQUIRED_CATS, ...OPTIONAL_CATS];

/**
 * واحد هر دسته بر اساس زیرنوع‌های داخلش
 */
export function unitForCategory(cat: string, list: { unit?: string; type?: string }[]): string {
  if (list.length === 0) {
    if (cat === 'ventilation') return 'm³/h';
    if (cat === 'lighting') return 'W';
    if (cat === 'litter') return 'kg';
    if (cat === 'heating') return 'kW';
    return 'عدد';
  }
  return getEquipUnit(list[0].type || '').baseUnit;
}

/** محاسبه مقدار نصب‌شده برای یک دسته */
export function calcInstalled(cat: string, list: Equipment[]): number {
  return list.reduce((a, e) => {
    const def = getEquipUnit(e.type);
    const primary = e.count || 0;
    const secondary = e.capacity != null
      ? e.capacity
      : (def.secondary?.defaultValue || 0);
    return a + def.calc(primary, secondary);
  }, 0);
}
