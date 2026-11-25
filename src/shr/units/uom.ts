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
  value: ItemUnit | 'l' | 'roll' | 'service' | 'day' | 'month' | 'bill';   // 'l' کوچک — به‌عنوان alias در ItemUnit هست ولی تایپش نیست
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
export const UOM_RULES: Record<string, UOMRule> = {
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
      { value: 'pcs',     label: 'عدد',     factor: 1,    dimension: 'count' },
      { value: 'kg',      label: 'کیلوگرم', factor: 1,    dimension: 'mass' },
      { value: 'ton',     label: 'تن',      factor: 1000, dimension: 'mass' },
      { value: 'l',       label: 'لیتر',    factor: 1,    dimension: 'volume' },
      { value: 'bag',     label: 'کیسه',    factor: 1,    dimension: 'count' },
      { value: 'roll',    label: 'رول',     factor: 1,    dimension: 'count' },
      { value: 'pack',    label: 'بسته',    factor: null, dimension: 'count' },
      { value: 'service', label: 'سرویس',   factor: 1,    dimension: 'count' },
      { value: 'day',     label: 'روزکار',  factor: 1,    dimension: 'count' },
      { value: 'month',   label: 'ماه',     factor: 1,    dimension: 'count' },
      { value: 'bill',    label: 'قبض',     factor: 1,    dimension: 'count' },
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


export interface OtherCostConfig {
  units: string[];
  defaultUnit: string;
  isFlat: boolean;
  sectionTitle: string;
  qtyLabel: string;
  priceLabel?: string;
  showShipping: boolean;
}

const OTHER_COST_MAP: Record<string, OtherCostConfig> = {
  fuel:        { units: ['l', 'kg', 'pcs'],                   defaultUnit: 'l',       isFlat: false, sectionTitle: 'مشخصات سوخت و گرمایش',    qtyLabel: 'مقدار',         showShipping: true  },
  bedding:     { units: ['kg', 'bag', 'ton', 'roll', 'service'], defaultUnit: 'kg',      isFlat: false, sectionTitle: 'مشخصات بستر و پوشال',     qtyLabel: 'مقدار',         showShipping: true  },
  biosecurity: { units: ['l', 'kg', 'bag', 'pack', 'service'],   defaultUnit: 'l',       isFlat: false, sectionTitle: 'مشخصات ضدعفونی و شست‌وشو', qtyLabel: 'مقدار',         showShipping: true  },
  packaging:   { units: ['pcs', 'pack', 'roll', 'kg'],          defaultUnit: 'pcs',     isFlat: false, sectionTitle: 'مشخصات بسته‌بندی',        qtyLabel: 'تعداد',         showShipping: true  },
  utilities:   { units: ['bill'],                                defaultUnit: 'bill',    isFlat: true,  sectionTitle: 'اطلاعات قبض',             qtyLabel: 'تعداد',         priceLabel: 'مبلغ کل قبض',   showShipping: false },
  labor:       { units: ['day', 'month', 'service', 'pcs'],     defaultUnit: 'day',     isFlat: false, sectionTitle: 'اطلاعات دستمزد و کارگر',  qtyLabel: 'مدت / تعداد',   showShipping: false },
  transport:   { units: ['service', 'ton', 'pcs'],              defaultUnit: 'service', isFlat: false, sectionTitle: 'اطلاعات حمل و نقل',       qtyLabel: 'تعداد سرویس',   showShipping: false },
  maintenance: { units: ['service'],                             defaultUnit: 'service', isFlat: true,  sectionTitle: 'اطلاعات تعمیرات و نگهداری', qtyLabel: 'تعداد',        priceLabel: 'مبلغ کل تعمیر', showShipping: false },
  vet_lab:     { units: ['service', 'pcs'],                     defaultUnit: 'service', isFlat: false, sectionTitle: 'اطلاعات دامپزشکی و آزمایشگاه', qtyLabel: 'تعداد نوبت', showShipping: false },
  rent:        { units: ['month', 'day', 'service'],            defaultUnit: 'month',   isFlat: false, sectionTitle: 'اطلاعات اجاره',           qtyLabel: 'مدت',           showShipping: false },
  other:       { units: ['pcs', 'kg', 'l', 'pack', 'service'],   defaultUnit: 'pcs',     isFlat: false, sectionTitle: 'مشخصات قلم',              qtyLabel: 'تعداد / مقدار', showShipping: true  },
};

export function getOtherCostConfig(costType?: string): OtherCostConfig {
  return OTHER_COST_MAP[String(costType || 'other')] || OTHER_COST_MAP.other;
}
