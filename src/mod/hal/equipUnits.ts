/**
 * equipUnits.ts — واحد و فرمول محاسبه برای هر زیرنوع تجهیز
 *
 * هر زیرنوع:
 *   - primary: فیلد اول (معمولاً تعداد)
 *   - secondary: فیلد دوم (اختیاری) — ظرفیت/وزن/مساحت
 *   - baseUnit: واحد پایه برای مقایسه با نیاز
 *   - calc: (primary, secondary) → مقدار به واحد پایه
 */

export interface FieldDef {
  label: string;
  unit: string;
  /** مقدار پیش‌فرض (اگه کاربر وارد نکرد) */
  defaultValue?: number;
  /** آیا لازمه؟ اگه false و خالی باشه، فیلد مخفی می‌مونه */
  optional?: boolean;
}

export interface EquipUnitDef {
  primary: FieldDef;
  secondary?: FieldDef;
  /** واحد پایه برای نمایش مجموع */
  baseUnit: string;
  /** محاسبه مقدار پایه از primary و secondary */
  calc: (primary: number, secondary: number) => number;
  /** برچسب خلاصه برای نمایش (مثلاً «kg» یا «عدد») */
  summaryLabel: string;
  /** 🆕 کلید استاندارد نژاد (اگه از EquipmentRatios قابل خوندن باشه) */
  stdKey?: string;
}

/** پیش‌فرض‌ها */
const DEFAULT_ROLL_KG = 50;

export const EQUIP_UNITS: Record<string, EquipUnitDef> = {
  // ═══════ تهویه ═══════
  fan_tunnel: {
    primary: { label: 'تعداد', unit: 'عدد', defaultValue: 1 },
    secondary: { label: 'ظرفیت هر فن', unit: 'm³/h', defaultValue: 4000 },
    baseUnit: 'm³/h',
    calc: (p, s) => p * s,
    summaryLabel: 'm³/h',
    stdKey: 'fanM3PerKg',
  },
  fan_ceiling: {
    primary: { label: 'تعداد', unit: 'عدد', defaultValue: 1 },
    secondary: { label: 'ظرفیت هر فن', unit: 'm³/h', defaultValue: 2000 },
    baseUnit: 'm³/h',
    calc: (p, s) => p * s,
    summaryLabel: 'm³/h',
  },
  air_inlet: {
    primary: { label: 'تعداد', unit: 'عدد', defaultValue: 1 },
    secondary: { label: 'ظرفیت هر دریچه', unit: 'm³/h', defaultValue: 500 },
    baseUnit: 'm³/h',
    calc: (p, s) => p * s,
    summaryLabel: 'm³/h',
  },
  cooling_pad: {
    primary: { label: 'مساحت پد', unit: 'm²', defaultValue: 1 },
    secondary: { label: 'ضخامت', unit: 'cm', defaultValue: 10, optional: true },
    baseUnit: 'm²',
    calc: (p, s) => p,
    summaryLabel: 'm²',
  },

  // ═══════ گرمایش ═══════
  radiant_brooder: {
    primary: { label: 'تعداد', unit: 'عدد', defaultValue: 1 },
    secondary: { label: 'توان هر واحد', unit: 'kW', defaultValue: 5 },
    baseUnit: 'kW',
    calc: (p, s) => p * s,
    summaryLabel: 'kW',
  },
  jet_heater: {
    primary: { label: 'تعداد', unit: 'عدد', defaultValue: 1 },
    secondary: { label: 'توان هر واحد', unit: 'kW', defaultValue: 50 },
    baseUnit: 'kW',
    calc: (p, s) => p * s,
    summaryLabel: 'kW',
  },
  duct_heater: {
    primary: { label: 'تعداد', unit: 'عدد', defaultValue: 1 },
    secondary: { label: 'توان هر واحد', unit: 'kW', defaultValue: 80 },
    baseUnit: 'kW',
    calc: (p, s) => p * s,
    summaryLabel: 'kW',
  },

  // ═══════ روشنایی ═══════
  lamp_led: {
    primary: { label: 'تعداد', unit: 'عدد', defaultValue: 1 },
    secondary: { label: 'توان هر لامپ', unit: 'W', defaultValue: 10 },
    baseUnit: 'W',
    calc: (p, s) => p * s,
    summaryLabel: 'W',
    stdKey: 'lampWattPerM2',
  },
  lamp_fluorescent: {
    primary: { label: 'تعداد', unit: 'عدد', defaultValue: 1 },
    secondary: { label: 'توان هر لامپ', unit: 'W', defaultValue: 40 },
    baseUnit: 'W',
    calc: (p, s) => p * s,
    summaryLabel: 'W',
  },
  dimmer: {
    primary: { label: 'تعداد', unit: 'عدد', defaultValue: 1 },
    secondary: { label: 'توان', unit: 'W', defaultValue: 0, optional: true },
    baseUnit: 'عدد',
    calc: (p, s) => p,
    summaryLabel: 'عدد',
  },

  // ═══════ آبخوری ═══════
  nipple: {
    primary: { label: 'تعداد نیپل', unit: 'عدد', defaultValue: 1 },
    secondary: { label: 'ظرفیت هر نیپل', unit: 'راس', defaultValue: 12 },
    baseUnit: 'راس',
    calc: (p, s) => p * s,
    summaryLabel: 'راس',
    stdKey: 'drinker.nippleBirdsPerUnit',
  },
  cup: {
    primary: { label: 'تعداد کاپ', unit: 'عدد', defaultValue: 1 },
    secondary: { label: 'ظرفیت هر کاپ', unit: 'راس', defaultValue: 20 },
    baseUnit: 'راس',
    calc: (p, s) => p * s,
    summaryLabel: 'راس',
    stdKey: 'drinker.cupBirdsPerUnit',
  },
  trough: {
    primary: { label: 'طول', unit: 'm', defaultValue: 1 },
    secondary: { label: 'ظرفیت هر متر', unit: 'راس', defaultValue: 50 },
    baseUnit: 'راس',
    calc: (p, s) => p * s,
    summaryLabel: 'راس',
    stdKey: 'drinker.troughCmPerBird',
  },
  fountain_drinker: {
    primary: { label: 'تعداد کله‌قندی', unit: 'عدد', defaultValue: 1 },
    secondary: { label: 'ظرفیت هر واحد', unit: 'راس', defaultValue: 60 },
    baseUnit: 'راس',
    calc: (p, s) => p * s,
    summaryLabel: 'راس',
    stdKey: 'drinker.manualCmPerBird',
  },

  // ═══════ دانخوری ═══════
  feeder_manual: {
    primary: { label: 'تعداد', unit: 'عدد', defaultValue: 1 },
    secondary: { label: 'ظرفیت هر واحد', unit: 'راس', defaultValue: 20 },
    baseUnit: 'راس',
    calc: (p, s) => p * s,
    summaryLabel: 'راس',
    stdKey: 'feeder.manualCmPerBird',
  },
  feeder_pan: {
    primary: { label: 'تعداد پن', unit: 'عدد', defaultValue: 1 },
    secondary: { label: 'ظرفیت هر پن', unit: 'راس', defaultValue: 12 },
    baseUnit: 'راس',
    calc: (p, s) => p * s,
    summaryLabel: 'راس',
    stdKey: 'feeder.panBirdsPerUnit',
  },
  feeder_chain: {
    primary: { label: 'طول کل', unit: 'm', defaultValue: 1 },
    secondary: { label: 'ظرفیت هر متر', unit: 'راس', defaultValue: 30 },
    baseUnit: 'راس',
    calc: (p, s) => p * s,
    summaryLabel: 'راس',
    stdKey: 'feeder.chainCmPerBird',
  },
  feeder_tube: {
    primary: { label: 'طول کل', unit: 'm', defaultValue: 1 },
    secondary: { label: 'ظرفیت هر متر', unit: 'راس', defaultValue: 25 },
    baseUnit: 'راس',
    calc: (p, s) => p * s,
    summaryLabel: 'راس',
    stdKey: 'feeder.tubeCmPerBird',
  },
  feeder_bucket: {
    primary: { label: 'تعداد', unit: 'عدد', defaultValue: 1 },
    secondary: { label: 'ظرفیت هر سطل', unit: 'راس', defaultValue: 25 },
    baseUnit: 'راس',
    calc: (p, s) => p * s,
    summaryLabel: 'راس',
    stdKey: 'feeder.manualCmPerBird',
  },

  // ═══════ بستر ═══════
  litter_roll: {
    primary: { label: 'تعداد رول', unit: 'عدد', defaultValue: 1 },
    secondary: { label: 'وزن هر رول', unit: 'kg', defaultValue: DEFAULT_ROLL_KG },
    baseUnit: 'kg',
    calc: (p, s) => p * s,
    summaryLabel: 'kg',
  },
  litter_wood_shavings: {
    primary: { label: 'مساحت پوشش', unit: 'm²', defaultValue: 1 },
    secondary: { label: 'ضخامت', unit: 'cm', defaultValue: 6, optional: true },
    baseUnit: 'kg',
    calc: (p, s) => Math.ceil(p * 4.5),
    summaryLabel: 'kg',
  },
  litter_sand: {
    primary: { label: 'مساحت پوشش', unit: 'm²', defaultValue: 1 },
    secondary: { label: 'ضخامت', unit: 'cm', defaultValue: 5, optional: true },
    baseUnit: 'kg',
    calc: (p, s) => Math.ceil(p * 30),
    summaryLabel: 'kg',
  },

  // ═══════ برق‌رسانی ═══════
  generator: {
    primary: { label: 'تعداد', unit: 'عدد', defaultValue: 1 },
    secondary: { label: 'توان', unit: 'kW', defaultValue: 10 },
    baseUnit: 'kW',
    calc: (p, s) => p * s,
    summaryLabel: 'kW',
  },
  electrical_panel: {
    primary: { label: 'تعداد', unit: 'عدد', defaultValue: 1 },
    secondary: { label: 'ظرفیت', unit: 'A', defaultValue: 100, optional: true },
    baseUnit: 'عدد',
    calc: (p, s) => p,
    summaryLabel: 'عدد',
  },
  cable: {
    primary: { label: 'طول', unit: 'm', defaultValue: 1 },
    secondary: { label: 'سطح مقطع', unit: 'mm²', defaultValue: 2.5, optional: true },
    baseUnit: 'm',
    calc: (p, s) => p,
    summaryLabel: 'm',
  },

  // ═══════ جانبی ═══════
  camera: {
    primary: { label: 'تعداد', unit: 'عدد', defaultValue: 1 },
    secondary: { label: 'کیفیت', unit: 'MP', defaultValue: 2, optional: true },
    baseUnit: 'عدد',
    calc: (p, s) => p,
    summaryLabel: 'عدد',
  },
  sensor: {
    primary: { label: 'تعداد', unit: 'عدد', defaultValue: 1 },
    secondary: { label: 'دقت اندازه‌گیری', unit: '٪', defaultValue: 5, optional: true },
    baseUnit: 'عدد',
    calc: (p, s) => p,
    summaryLabel: 'عدد',
  },
  scale: {
    primary: { label: 'تعداد', unit: 'عدد', defaultValue: 1 },
    secondary: { label: 'حداکثر وزن', unit: 'kg', defaultValue: 50, optional: true },
    baseUnit: 'عدد',
    calc: (p, s) => p,
    summaryLabel: 'عدد',
  },

  // ═══════ سازگاری با قدیمی ═══════
  lamp: {
    primary: { label: 'تعداد', unit: 'عدد', defaultValue: 1 },
    secondary: { label: 'توان هر لامپ', unit: 'W', defaultValue: 10 },
    baseUnit: 'W',
    calc: (p, s) => p * s,
    summaryLabel: 'W',
  },
  fan: {
    primary: { label: 'تعداد', unit: 'عدد', defaultValue: 1 },
    secondary: { label: 'ظرفیت هر فن', unit: 'm³/h', defaultValue: 4000 },
    baseUnit: 'm³/h',
    calc: (p, s) => p * s,
    summaryLabel: 'm³/h',
  },
  heater: {
    primary: { label: 'تعداد', unit: 'عدد', defaultValue: 1 },
    secondary: { label: 'توان هر واحد', unit: 'kW', defaultValue: 5 },
    baseUnit: 'kW',
    calc: (p, s) => p * s,
    summaryLabel: 'kW',
  },
  cooler: {
    primary: { label: 'تعداد', unit: 'عدد', defaultValue: 1 },
    secondary: { label: 'ظرفیت هر واحد', unit: 'm³/h', defaultValue: 4000 },
    baseUnit: 'm³/h',
    calc: (p, s) => p * s,
    summaryLabel: 'm³/h',
  },
  drinker: {
    primary: { label: 'تعداد', unit: 'عدد', defaultValue: 1 },
    baseUnit: 'عدد',
    calc: (p, s) => p,
    summaryLabel: 'عدد',
  },
  feeder: {
    primary: { label: 'تعداد', unit: 'عدد', defaultValue: 1 },
    baseUnit: 'عدد',
    calc: (p, s) => p,
    summaryLabel: 'عدد',
  },
  other: {
    primary: { label: 'تعداد', unit: 'عدد', defaultValue: 1 },
    baseUnit: 'عدد',
    calc: (p, s) => p,
    summaryLabel: 'عدد',
  },
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
