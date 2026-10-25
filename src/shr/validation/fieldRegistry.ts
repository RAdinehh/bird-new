/**
 * validation/fieldRegistry.ts — منبع واحد حقیقت برای فیلدهای اجباری
 *
 * مزیت: به جای پخش ۱۰۰ خط error={err('...')} در ۲۰ زیردسته،
 * همه قوانین اینجا متمرکز است. تغییر قانون = تغییر ۱ خط.
 */

export interface FieldRule {
  /** پیام خطا برای این فیلد */
  message: string;
  /** فقط در خرید اجباری است */
  purchaseOnly?: boolean;
  /** فقط در فروش اجباری است */
  saleOnly?: boolean;
  /** شرط اضافی: اگر true برگرداند، فیلد اجباری می‌شود */
  when?: (item: any, form: any) => boolean;
}

/** فیلدهای مشترک همه دسته‌ها (همیشه اجباری) */
export const UNIVERSAL_FIELDS: Record<string, FieldRule> = {
  description: { message: 'نام کالا را وارد کنید.' },
  quantity: { message: 'تعداد باید بیشتر از صفر باشد.' },
  unitPrice: { message: 'قیمت را وارد کنید.' },
};

/** فیلدهای اختصاصی هر زیردسته */
export const CATEGORY_FIELDS: Record<string, Record<string, FieldRule>> = {
  chick: {
    birdId: { message: 'پرنده را انتخاب کنید.' },
    breedId: { message: 'نژاد را انتخاب کنید.' },
    hatchDate: { message: 'تاریخ هچ را وارد کنید.' },
    flockId: { message: 'گله مبدأ را انتخاب کنید.', saleOnly: true },
    hatchId: { message: 'هچ مبدأ را انتخاب کنید.', saleOnly: true },
  },
  adult: {
    birdId: { message: 'پرنده را انتخاب کنید.' },
    breedId: { message: 'نژاد را انتخاب کنید.' },
    hatchDate: { message: 'تاریخ هچ را وارد کنید.' },
    flockId: { message: 'گله مبدأ را انتخاب کنید.', saleOnly: true },
    saleReason: { message: 'دلیل فروش را انتخاب کنید.', saleOnly: true },
    liveWeight: {
      message: 'وزن زنده را وارد کنید.',
      when: (item) => item?.priceUnit === 'perKg',
    },
  },
  egg: {
    birdId: { message: 'پرنده را انتخاب کنید.' },
    breedId: { message: 'نژاد را انتخاب کنید.' },
  },
  fertile_egg: {
    birdId: { message: 'پرنده را انتخاب کنید.' },
    breedId: { message: 'نژاد را انتخاب کنید.' },
  },
  feed: {
    stockItemId: { message: 'کالای انبار را انتخاب کنید.', saleOnly: true },
  },
  medicine: {
    stockItemId: { message: 'کالای انبار را انتخاب کنید.', saleOnly: true },
  },
  vaccine: {
    stockItemId: { message: 'کالای انبار را انتخاب کنید.', saleOnly: true },
  },
  herbal: {
    stockItemId: { message: 'کالای انبار را انتخاب کنید.', saleOnly: true },
  },
  manure: {
    flockId: { message: 'گله مبدأ را انتخاب کنید.', saleOnly: true },
    stockItemId: { message: 'کالای انبار را انتخاب کنید.', saleOnly: true },
  },
  broken: {
    flockId: { message: 'گله مبدأ را انتخاب کنید.', saleOnly: true },
    stockItemId: { message: 'کالای انبار را انتخاب کنید.', saleOnly: true },
  },
  equipment: {
    equipmentCategory: { message: 'دسته تجهیزات را انتخاب کنید.' },
    equipmentType: { message: 'نوع تجهیز را انتخاب کنید.' },
    equipmentId: { message: 'تجهیز موجود را انتخاب کنید.', saleOnly: true },
  },
  other: {
    costType: { message: 'نوع هزینه را انتخاب کنید.', purchaseOnly: true },
  },
};

/** بررسی اینکه آیا فیلد در دسته فعلی اجباری است */
export function isFieldRequired(
  category: string,
  fieldName: string,
  kind: 'purchase' | 'sale',
  item?: any,
  form?: any,
): boolean {
  if (UNIVERSAL_FIELDS[fieldName]) return true;

  const rule = CATEGORY_FIELDS[category]?.[fieldName];
  if (!rule) return false;

  if (rule.purchaseOnly && kind !== 'purchase') return false;
  if (rule.saleOnly && kind !== 'sale') return false;
  if (rule.when && !rule.when(item, form)) return false;

  return true;
}

/** گرفتن پیام خطا برای فیلد در دسته */
export function getFieldMessage(
  category: string,
  fieldName: string,
): string | null {
  if (UNIVERSAL_FIELDS[fieldName]) return UNIVERSAL_FIELDS[fieldName].message;
  return CATEGORY_FIELDS[category]?.[fieldName]?.message || null;
}
