/**
 * constants/fieldMeta.ts — منبع واحد حقیقت برای برچسب، پلیس‌هولدر و عنوان مودال فیلدها
 *
 * اصول استاندارد:
 * ۱. برچسب‌ها کوتاه، اسمی و بدون فعل اضافی (مثلاً «پرنده» نه «نوع پرنده»، «گله» نه «انتخاب گله»).
 * ۲. نقش‌های منطقی متفاوت (مبدأ / مقصد / استقرار / مرتبط) کلید مستقل دارند و ادغام نمی‌شوند.
 * ۳. پلیس‌هولدر Selectها یکدست «— انتخاب —» است، مگر وقتی مقدار خالی معنای خاصی دارد.
 * ۴. عنوان مودال‌ها دقیقاً برابر «انتخاب + برچسب دقیق فیلد» است.
 */

export interface FieldMetaEntry {
  readonly label: string;
  readonly placeholder: string;
  readonly modalTitle: string;
}

export const SELECT_PLACEHOLDER = '— انتخاب —' as const;

export const COMMON_PLACEHOLDERS = {
  select: SELECT_PLACEHOLDER,
  number: '۰',
  money: '۰',
  date: 'انتخاب تاریخ',
  dateFrom: 'از تاریخ',
  dateTo: 'تا تاریخ',
  time: 'انتخاب ساعت',
  notes: 'توضیحات',
} as const;

export const FIELD_META = {
  bird: {
    label: 'پرنده',
    placeholder: SELECT_PLACEHOLDER,
    modalTitle: 'انتخاب پرنده',
  },
  breed: {
    label: 'نژاد',
    placeholder: SELECT_PLACEHOLDER,
    modalTitle: 'انتخاب نژاد',
  },
  flock: {
    base: {
      label: 'گله',
      placeholder: SELECT_PLACEHOLDER,
      modalTitle: 'انتخاب گله',
    },
    origin: {
      label: 'گله مبدأ',
      placeholder: SELECT_PLACEHOLDER,
      modalTitle: 'انتخاب گله مبدأ',
    },
    destination: {
      label: 'گله مقصد',
      placeholder: SELECT_PLACEHOLDER,
      modalTitle: 'انتخاب گله مقصد',
    },
    destinationOptional: {
      label: 'گله مقصد (اختیاری)',
      placeholder: '— بدون گله (سربار کل) —',
      modalTitle: 'انتخاب گله مقصد',
    },
    attachExisting: {
      label: 'اتصال به گله موجود',
      placeholder: '— ایجاد گله جدید —',
      modalTitle: 'انتخاب گله',
    },
  },
  hatch: {
    origin: {
      label: 'هچ مبدأ',
      placeholder: SELECT_PLACEHOLDER,
      modalTitle: 'انتخاب هچ مبدأ',
    },
  },
  hall: {
    base: {
      label: 'سالن',
      placeholder: SELECT_PLACEHOLDER,
      modalTitle: 'انتخاب سالن',
    },
    destination: {
      label: 'سالن مقصد',
      placeholder: SELECT_PLACEHOLDER,
      modalTitle: 'انتخاب سالن مقصد',
    },
    installed: {
      label: 'سالن استقرار',
      placeholder: '— بدون سالن —',
      modalTitle: 'انتخاب سالن استقرار',
    },
    relatedOptional: {
      label: 'سالن مرتبط (اختیاری)',
      placeholder: SELECT_PLACEHOLDER,
      modalTitle: 'انتخاب سالن مرتبط',
    },
  },
  zone: {
    base: {
      label: 'بخش',
      placeholder: '— بدون بخش —',
      modalTitle: 'انتخاب بخش',
    },
    destinationOptional: {
      label: 'بخش مقصد (اختیاری)',
      placeholder: SELECT_PLACEHOLDER,
      modalTitle: 'انتخاب بخش مقصد',
    },
  },
  category: {
    label: 'دسته',
    placeholder: SELECT_PLACEHOLDER,
    modalTitle: 'انتخاب دسته',
  },
  unit: {
    label: 'واحد',
    placeholder: SELECT_PLACEHOLDER,
    modalTitle: 'انتخاب واحد',
  },
  priceUnit: {
    label: 'قیمت بر حسب',
    placeholder: SELECT_PLACEHOLDER,
    modalTitle: 'انتخاب مبنای قیمت',
  },
  stockItem: {
    decrease: {
      label: 'کاهش از انبار',
      placeholder: SELECT_PLACEHOLDER,
      modalTitle: 'انتخاب کالای انبار',
    },
    increase: {
      label: 'افزودن به انبار',
      placeholder: SELECT_PLACEHOLDER,
      modalTitle: 'انتخاب کالای انبار',
    },
  },
  equipment: {
    category: {
      label: 'دسته تجهیزات',
      placeholder: SELECT_PLACEHOLDER,
      modalTitle: 'انتخاب دسته تجهیزات',
    },
    kind: {
      label: 'نوع تجهیز',
      placeholder: SELECT_PLACEHOLDER,
      modalTitle: 'انتخاب نوع تجهیز',
    },
  },
  // فیلدهای پویا (وابسته به واحد یا جهت معامله)
  unitPrice: (unitLabel: string) => ({
    label: `قیمت هر ${unitLabel}`,
    placeholder: 'قیمت',
  }),
  flockByDirection: (isPurchase: boolean) =>
    isPurchase ? FIELD_META.flock.destination : FIELD_META.flock.origin,
} as const;
