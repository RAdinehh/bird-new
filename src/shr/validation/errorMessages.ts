/**
 * validation/errorMessages.ts — پیام‌های استاندارد خطا
 *
 * استاندارد GOV.UK: کوتاه، مثبت (فعل امری)، شامل اقدام
 */

const fa = (n: number) => Number(n).toLocaleString('fa-IR');

export const MSG = {
  // اجباری‌ها
  required: (label: string) => `${label} را وارد کنید.`,
  select: (label: string) => `${label} را انتخاب کنید.`,
  
  // منطقی و ریاضی
  totalMismatch: (entered: number, calculated: number) => 
    `جمع کل (${fa(entered)}) با محاسبه اقلام (${fa(calculated)}) برابر نیست.`,
  paymentsOverTotal: (paid: number, total: number) => 
    `مجموع پرداخت‌ها (${fa(paid)}) از جمع کل (${fa(total)}) بیشتر است.`,
  genderSumMismatch: (sum: number, total: number) => 
    `مجموع جنسیت‌ها (${fa(sum)}) با تعداد کل (${fa(total)}) برابر نیست.`,
    
  // اختصاصی
  birdRequired: () => 'پرنده را انتخاب کنید.',
  equipmentCategory: () => 'دسته تجهیزات را انتخاب کنید.',
  equipmentType: () => 'نوع تجهیز را انتخاب کنید.',
  costType: () => 'نوع هزینه را انتخاب کنید.',
  saleFlockRequired: () => 'گله مبدأ را انتخاب کنید.',
  saleReason: () => 'دلیل فروش را انتخاب کنید.',
  stockItem: () => 'کالای انبار را انتخاب کنید.',
  equipmentItem: () => 'تجهیز موجود را انتخاب کنید.',
  withdrawalSale: () => 'دوره پرهیز فقط در خرید ثبت می‌شود.',
  liveWeightPerKg: () => 'برای قیمت کیلویی، وزن زنده را وارد کنید.',
} as const;
