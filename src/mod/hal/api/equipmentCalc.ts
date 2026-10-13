/**
 * api/equipmentCalc.ts — توابع کمکی EquipmentPage
 */
import { getEquipUnit } from '../equipUnits';
import type { BirdStandard } from '../../set/standards/types';
import type { Flock } from '../../flk/store';
import { CATEGORY_LABELS } from '../store';

export const CATEGORIES_BY_KIND: Record<string, string[]> = {
  asset: [
    'ventilation', 'heating', 'lighting', 'drinking', 'feeding',
    'power', 'cooling', 'water_treatment', 'safety', 'weighing',
    'cleaning', 'hand_tools', 'auxiliary',
  ],
  consumable: ['litter'],
  // system قبلاً ادغام شد با asset (رفع ابهام برای کاربر)
};

export function categoriesForKind(kind: string): string[] {
  return CATEGORIES_BY_KIND[kind] || Object.keys(CATEGORY_LABELS);
}

export const TYPES_BY_CATEGORY: Record<string, string[]> = {
  ventilation:     ['fan_tunnel', 'fan_ceiling', 'air_inlet', 'cooling_pad'],
  feeding:         ['feeder_manual', 'feeder_pan', 'feeder_chain', 'feeder_tube', 'feeder_bucket'],
  drinking:        ['nipple', 'cup', 'trough', 'fountain_drinker'],
  heating:         ['radiant_brooder', 'jet_heater', 'duct_heater'],
  lighting:        ['lamp_led', 'lamp_fluorescent', 'dimmer'],
  litter:          ['litter_wood_shavings', 'litter_roll', 'litter_sand'],
  power:           ['generator', 'electrical_panel', 'cable'],
  auxiliary:       ['camera', 'sensor', 'scale'],
  water_treatment: ['water_tank', 'water_filter', 'water_pipe'],
  safety:          ['fire_extinguisher', 'smoke_detector', 'emergency_light', 'first_aid'],
  cleaning:        ['pressure_washer', 'sprayer', 'flame_gun'],
  hand_tools:      ['shovel', 'wheelbarrow', 'rake', 'feed_scoop', 'broom', 'bucket'],
  weighing:        ['bird_scale', 'feed_scale', 'platform_scale'],
  cooling:         ['fogger', 'misting_system', 'swamp_cooler'],
};

export function typesForCategory(cat: string): string[] {
  const list = TYPES_BY_CATEGORY[cat];
  return (list && list.length > 0) ? list : [];
}

export function getCapacityHint(type: string, cap: number | null, hallVol: number | null, count: number = 1, eff: number | null = null): string {
  if (!cap || !hallVol || hallVol <= 0) return '';
  if (type === 'fan' || type === 'cooler') {
    const totalCap = cap * count;
    const changesPerHour = totalCap / hallVol;
    const minPerChange = Math.round(60 / changesPerHour);
    if (minPerChange <= 1) return 'هر دقیقه ۱ بار تعویض هوا — مناسب گرمای شدید';
    if (minPerChange <= 3) return 'هر ' + minPerChange + ' دقیقه ۱ بار تعویض هوا — مناسب تابستان';
    if (minPerChange <= 10) return 'هر ' + minPerChange + ' دقیقه ۱ بار تعویض هوا — مناسب بهار/پاییز';
    return 'هر ' + minPerChange + ' دقیقه ۱ بار تعویض هوا — مناسب زمستان';
  }
  if (type === 'lamp') {
    const luxPerWatt = eff || 85;
    const totalLumens = cap * count * luxPerWatt;
    const area = hallVol / 3;
    const lux = totalLumens / area;
    if (lux >= 20) return '~' + Math.round(lux) + ' لوکس — مناسب تخم‌گذار';
    if (lux >= 10) return '~' + Math.round(lux) + ' لوکس — مناسب پرورش';
    return '~' + Math.round(lux) + ' لوکس — نور کم';
  }
  return '';
}


/** محاسبه نیاز تجهیزات بر اساس گله فعال سالن و استاندارد نژاد */
export function calcEquipNeed(
  type: string,
  hallId: string,
  flocks: Flock[],
  breedStd: { byBreedId: (breedId: string | null | undefined) => BirdStandard | null } | null | undefined,
  hallArea: number,
): { need: number; unit: string; desc: string } | null {
  // گله فعال این سالن
  const flock = flocks.find((f: Flock) => f.hallId === hallId && f.status === 'active' && !f.paused);
  if (!flock) return null;

  const std = breedStd?.byBreedId(flock.breedId);
  if (!std || !std.equipment) return null;

  const count = flock.currentCount || 0;
  if (count <= 0) return null;

  if (type === 'feeder') {
    const eq = std.equipment.feeder;
    if (eq.panBirdsPerUnit) {
      const need = Math.ceil(count / eq.panBirdsPerUnit);
      return { need, unit: 'عدد', desc: count + ' پرنده ÷ ' + eq.panBirdsPerUnit + ' پرنده/واحد' };
    }
    if (eq.chainCmPerBird) {
      const meters = Math.ceil((count * eq.chainCmPerBird) / 100);
      return { need: meters, unit: 'متر', desc: count + ' پرنده × ' + eq.chainCmPerBird + ' سانتی‌متر' };
    }
  }

  if (type === 'drinker') {
    const eq = std.equipment.drinker;
    if (eq.nippleBirdsPerUnit) {
      const need = Math.ceil(count / eq.nippleBirdsPerUnit);
      return { need, unit: 'عدد', desc: count + ' پرنده ÷ ' + eq.nippleBirdsPerUnit + ' پرنده/نوپل' };
    }
    if (eq.cupBirdsPerUnit) {
      const need = Math.ceil(count / eq.cupBirdsPerUnit);
      return { need, unit: 'عدد', desc: count + ' پرنده ÷ ' + eq.cupBirdsPerUnit + ' پرنده/کاپ' };
    }
  }

  if (type === 'lamp' && hallArea > 0) {
    const w = std.equipment.lampWattPerM2 || 3;
    const totalW = Math.ceil(hallArea * w);
    return { need: totalW, unit: 'W', desc: hallArea + ' m² × ' + w + ' W/m²' };
  }

  if (type === 'fan') {
    const kg = std.equipment.fanM3PerKg || 4.5;
    // وزن هدف از growth یا فرض ۲ کیلوگرم
    const targetW = std.growth?.weightByAge?.[std.growth.weightByAge.length - 1]?.weightG || 2000;
    const totalKg = (count * targetW) / 1000;
    const need = Math.ceil(totalKg * kg);
    return { need, unit: 'm³/h', desc: 'وزن کل ' + Math.round(totalKg) + ' kg × ' + kg };
  }

  return null;
}

export function calcEquipValue(e: { type?: string; count?: number | null; unitPrice?: number | null; purchasePrice?: number | null }): number {
  const count = e.count || 0;
  const price = e.unitPrice || 0;
  if (!count || !price) return 0;
  const def = getEquipUnit(e.type || 'other');
  if (def.baseUnit === 'kg') {
    const base = def.calc(count, (e as any).capacity || 0);
    return Math.round(base * price);
  }
  return count * price;
}






/** 🆕 پیش‌فرض فیلد ثانویه از استاندارد نژاد — با استفاده از stdKey */
export function getStdDefaultForType(
  type: string,
  std: BirdStandard | null | undefined
): number | null {
  if (!std?.equipment) return null;
  const def = getEquipUnit(type);
  const key = def.stdKey;
  if (!key) return null;

  const eq = std.equipment as unknown as Record<string, unknown>;
  // path به‌صورت "drinker.nippleBirdsPerUnit"
  const parts = key.split('.');
  if (parts.length === 2) {
    const nested = eq[parts[0]] as Record<string, unknown> | undefined;
    const v = nested?.[parts[1]];
    return typeof v === 'number' ? v : null;
  }
  // top-level مثل lampWattPerM2 یا fanM3PerKg
  const v = eq[key];
  return typeof v === 'number' ? v : null;
}


/** 🆕 آیا این زیرنوع مصرفیه؟ (خودکار از نوع) */
export const CONSUMABLE_TYPES = new Set([
  // روشنایی — لامپ‌ها مصرفی
  'lamp_led', 'lamp_fluorescent', 'lamp', 'dimmer',
  // بستر — کاملاً مصرفی
  'litter_wood_shavings', 'litter_roll', 'litter_sand',
  // تصفیه — فیلتر مصرفی
  'water_filter',
  // شستشو — سمپاش/واش‌پرس سبک
  'sprayer', 'flame_gun',
  // ابزار دستی — همه مصرفی
  'shovel', 'wheelbarrow', 'rake', 'feed_scoop', 'broom', 'bucket',
  // جانبی — سنسور
  'sensor',
]);

/** 🆕 تشخیص خودکار نوع: مصرفی یا دارایی */
export function isConsumable(type: string): boolean {
  return CONSUMABLE_TYPES.has(type);
}

/** 🆕 تشخیص خودکار نوع برای نمایش/گزارش */
export function kindForType(type: string): 'asset' | 'consumable' {
  return isConsumable(type) ? 'consumable' : 'asset';
}
