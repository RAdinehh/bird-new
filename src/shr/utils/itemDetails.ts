/**
 * انواع و فیلدهای اختصاصی دسته‌های خرید/فروش
 */

export type MedicineType = 'herbal' | 'chemical' | 'vaccine' | '';
export type PriceUnit = 'per_unit' | 'per_kg' | '';
export type SourceType = 'own_flock' | 'purchased' | '';
export type EggType = 'intact' | 'small' | 'broken' | 'dirty' | 'other';
export type SaleReason = 'old' | 'broken' | 'unneeded' | 'replacement' | 'other';

export const MEDICINE_TYPE_LABEL: Record<string, string> = {
  herbal: '🌿 سنتی (گیاهی)',
  chemical: '💊 شیمیایی',
  vaccine: '💉 واکسن',
};

export const PRICE_UNIT_LABEL: Record<string, string> = {
  per_unit: 'هر عدد',
  per_kg: 'هر کیلو',
};

export const SOURCE_TYPE_LABEL: Record<string, string> = {
  own_flock: 'از گله خودم',
  purchased: 'خریداری‌شده',
};

export const EGG_TYPE_LABEL: Record<EggType, string> = {
  intact: '🥚 سالم',
  small: '🥚 کوچک',
  broken: '💔 شکسته',
  dirty: '🟤 کثیف/لکه‌دار',
  other: '❓ سایر',
};

export const SALE_REASON_LABEL: Record<SaleReason, string> = {
  old: 'کهنه شدن',
  broken: 'خرابی',
  unneeded: 'بی‌نیازی',
  replacement: 'جایگزینی',
  other: 'سایر',
};

// ============ داروی گیاهی (طب سنتی) ============
export type MedicineTemperament = 'moetadel' | 'garm_khoshk' | 'garm_tar' | 'sard_tar' | 'sard_khoshk';
export type MedicineProperty = 'mohallel' | 'molattef' | 'mojaffef' | 'jali' | 'mokhaddar' | 'moshakhen' | 'moshhel' | 'moder' | 'moghvi' | 'ghabez' | 'mofatteh' | 'monzej';
export type MedicineForm = 'jushande' | 'aragh' | 'ghors' | 'safuf' | 'sharbat' | 'roghan' | 'zemad' | 'bokhur';
export type MedicineUseMethod = 'khoraki' | 'mozei' | 'estenshaghi' | 'mokhlut_dan' | 'mokhlut_ab';
export type MedicineTime = 'sobh' | 'zohr' | 'asr' | 'shab' | 'nAshta' | 'qabl_ghaza' | 'bad_ghaza';

export const TEMPERAMENT_LABEL: Record<MedicineTemperament, string> = {
  moetadel: 'معتدل',
  garm_khoshk: 'گرم و خشک',
  garm_tar: 'گرم و تر',
  sard_tar: 'سرد و تر',
  sard_khoshk: 'سرد و خشک',
};

export const PROPERTY_LABEL: Record<MedicineProperty, string> = {
  mohallel: 'محلل', molattef: 'ملطف', mojaffef: 'مجفف', jali: 'جالی',
  mokhaddar: 'مخدر', moshakhen: 'مشخن', moshhel: 'مسهل', moder: 'مدر',
  moghvi: 'مقوی', ghabez: 'قابض', mofatteh: 'مفتح', monzej: 'منضج',
};

export const FORM_LABEL: Record<MedicineForm, string> = {
  jushande: 'جوشانده', aragh: 'عرق', ghors: 'قرص', safuf: 'سفوف',
  sharbat: 'شربت', roghan: 'روغن', zemad: 'ضماد', bokhur: 'بخور',
};

export const USE_METHOD_LABEL: Record<MedicineUseMethod, string> = {
  khoraki: 'خوراکی', mozei: 'موضعی', estenshaghi: 'استنشاقی',
  mokhlut_dan: 'مخلوط در دان', mokhlut_ab: 'مخلوط در آب آشامیدنی',
};

export const TIME_LABEL: Record<MedicineTime, string> = {
  sobh: 'صبح', zohr: 'ظهر', asr: 'عصر', shab: 'شب',
  nAshta: 'ناشتا', qabl_ghaza: 'قبل غذا', bad_ghaza: 'بعد غذا',
};

// ============ اینترفیس‌ها ============
export interface HerbalDetails {
  name: string;
  temperament: MedicineTemperament | '';
  properties: MedicineProperty[];
  form: MedicineForm | '';
  doseValue: number | null;
  doseUnit: string;
  useMethod: MedicineUseMethod | '';
  durationDays: number | null;
  times: MedicineTime[];
}

export interface ChemicalDetails {
  name: string;
  activeIngredient: string;
  strength: string;
  form: string;
  doseValue: number | null;
  doseUnit: string;
  useMethod: string;
  withdrawalDays: number | null;
}

export interface VaccineDetails {
  name: string;
  targetDisease: string;
  injectMethod: string;
  targetAge: number | null;
  doseValue: number | null;
  doseUnit: string;
  immunityMonths: number | null;
}

export interface ItemCategoryFields {
  medicineType?: MedicineType;
  herbalDetails?: HerbalDetails;
  chemicalDetails?: ChemicalDetails;
  vaccineDetails?: VaccineDetails;
  birdId?: string;
  breedId?: string;
  flockId?: string;
  ageDays?: number | null;
  maleCount?: number | null;
  femaleCount?: number | null;
  unknownCount?: number | null;
  priceUnit?: PriceUnit;
  liveWeight?: number | null;
  sourceType?: SourceType;
  isPreorder?: boolean;
  deliveryDate?: string;
  eggTypes?: EggType[];
  saleReason?: SaleReason | '';
  model?: string;
  warrantyMonths?: number | null;
}
