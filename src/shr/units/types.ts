/**
 * types.ts — تایپ‌های واحدها
 *
 * قاعده کلی:
 *   - واحد پایه در DB ذخیره میشه (g, ml, cm, m², °C, تومان, ثانیه)
 *   - واحد نمایش از تنظیمات کاربر گرفته میشه
 */

// ═══ پول ═══
export type CurrencyUnit = 'rial' | 'toman' | 'usd';

// ═══ دما ═══
export type TempUnit = 'c' | 'f';

// ═══ وزن (پایه: گرم) ═══
export type WeightUnit = 'mg' | 'g' | 'kg' | 'ton';

// ═══ حجم (پایه: میلی‌لیتر) ═══
export type VolumeUnit = 'cc' | 'ml' | 'L' | 'gal';

// ═══ طول (پایه: سانتی‌متر) ═══
export type LengthUnit = 'mm' | 'cm' | 'm' | 'km';

// ═══ مساحت (پایه: مترمربع) ═══
export type AreaUnit = 'm2' | 'ha' | 'ft2';

// ═══ زمان (پایه: ثانیه) ═══
export type TimeUnit = 's' | 'min' | 'h' | 'day';

// ═══ نمایش ═══
export type NumberFormat = 'fa' | 'en';
export type ThousandSep = 'fa' | 'en' | 'space' | 'dot' | 'none';
export type DateFormat = 'jalali' | 'gregorian';

// ═══ واحدهای کامل ═══
export interface Units {
  // پول
  currency: CurrencyUnit;
  usdRate: number;      // نرخ دلار به تومان (مثال: 200000)

  // فیزیکی
  temperature: TempUnit;
  weight: WeightUnit;
  volume: VolumeUnit;
  length: LengthUnit;
  area: AreaUnit;
  time: TimeUnit;

  // نمایش
  numberFormat: NumberFormat;
  thousandSep: ThousandSep;
  decimals: number;      // 0..4
  dateFormat: DateFormat;
}

// ═══ مقدار پیش‌فرض ═══
export const DEFAULT_UNITS: Units = {
  currency: 'toman',
  usdRate: 200000,

  temperature: 'c',
  weight: 'kg',
  volume: 'L',
  length: 'cm',
  area: 'm2',
  time: 'h',

  numberFormat: 'fa',
  thousandSep: 'fa',
  decimals: 2,
  dateFormat: 'jalali',
};

// ═══ برچسب‌های فارسی ═══
export const UNIT_LABELS: Record<string, Record<string, string>> = {
  currency: { rial: 'ریال', toman: 'تومان', usd: 'دلار' },
  temperature: { c: 'سلسیوس °C', f: 'فارنهایت °F' },
  weight: { mg: 'میلی‌گرم', g: 'گرم', kg: 'کیلوگرم', ton: 'تن' },
  volume: { cc: 'سی‌سی', ml: 'میلی‌لیتر', L: 'لیتر', gal: 'گالن' },
  length: { mm: 'میلی‌متر', cm: 'سانتی‌متر', m: 'متر', km: 'کیلومتر' },
  area: { m2: 'مترمربع', ha: 'هکتار', ft2: 'فوتمربع' },
  time: { s: 'ثانیه', min: 'دقیقه', h: 'ساعت', day: 'روز' },
  numberFormat: { fa: 'فارسی', en: 'انگلیسی' },
  thousandSep: { fa: '٬ فارسی', en: ', انگلیسی', space: 'فاصله', dot: '. نقطه', none: 'هیچ' },
  dateFormat: { jalali: 'شمسی', gregorian: 'میلادی' },
};

// ═══ برچسب کوتاه (برای کنار عدد) ═══
export const UNIT_SHORT: Record<string, Record<string, string>> = {
  currency: { rial: 'ریال', toman: 'تومان', usd: '$' },
  temperature: { c: '°C', f: '°F' },
  weight: { mg: 'mg', g: 'g', kg: 'kg', ton: 't' },
  volume: { cc: 'cc', ml: 'ml', L: 'L', gal: 'gal' },
  length: { mm: 'mm', cm: 'cm', m: 'm', km: 'km' },
  area: { m2: 'm²', ha: 'ha', ft2: 'ft²' },
  time: { s: 'ث', min: 'دق', h: 'س', day: 'روز' },
};
