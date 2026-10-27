/**
 * validation/rules/flk.ts — قوانین گله
 *
 * قوانین:
 * - نام اجباری (2-50 کاراکتر)
 * - پرنده و نژاد و سالن اجباری
 * - تعداد اولیه > 0
 * - نر + ماده = کل (اگه پر شده)
 * - قیمت‌ها ≥ 0
 * - layingStartDay بین 100-250 روز
 * - endOfCycleDay > layingStartDay
 * - تاریخ هچ ≤ امروز
 * - FCR بین 1.0-5.0 (اگه پر شده)
 */
import { z } from 'zod';
import { format as formatJ } from 'date-fns-jalali';
import {
  intPos, intNonNeg, intRange, floatNonNeg, floatRange,
  persianDatePast, persianDateOpt, requiredId, optionalId,
  requiredStr, optionalStr,
} from '../helpers';
import { EGG, GROWTH } from '../biological';
import type { ValidationContext } from '../types';

export function createFlkSchema(context: ValidationContext = {}) {
  const existingNames = context.existingNames;
  return z.object({
    name: (existingNames && existingNames.length > 0)
      ? requiredStr('نام گله', 2, 50).refine(
          (v) => !existingNames.includes(v.trim().toLowerCase()),
          { message: 'نام گله تکراری است — نام دیگری انتخاب کنید' }
        )
      : requiredStr('نام گله', 2, 50),
    type: z.enum(['layer', 'broiler', 'breeder']),
    birdId: requiredId('پرنده'),
    breedId: requiredId('نژاد'),
    hallId: z.string().optional(),
    zoneId: optionalId(),

    initialCount: intPos('تعداد اولیه', 100000),
    // 🆕 تعداد فعلی اختیاری ئه — اگه خالی باشه، = تعداد اولیه فرض می‌شه
    currentCount: z.number().min(0, 'تعداد فعلی نمی‌تواند منفی باشد').optional().nullable(),
    maleCount: intNonNeg('تعداد نر', 100000),
    femaleCount: intNonNeg('تعداد ماده', 100000),
    unknownCount: intNonNeg('تعداد نامشخص', 100000),

    // 🆕 این دو فیلد فقط برای layer/breeder معنی دارن — برای broiler skip می‌شن
    layingStartDay: z.number().min(0, 'سن تخم‌گذاری نمی‌تواند منفی باشد').optional().nullable(),
    endOfCycleDay: z.number().min(0, 'سن پایان چرخه نمی‌تواند منفی باشد').optional().nullable(),
    vaccineScheduleId: optionalId(),

    hatchDate: persianDateOpt('تاریخ هچ').refine((v) => !v || v <= formatJ(new Date(), 'yyyy/MM/dd'), { message: 'تاریخ هچ باید امروز یا قبل‌تر باشد' }),
    purchaseDate: persianDateOpt('تاریخ خرید').refine((v) => !v || v <= formatJ(new Date(), 'yyyy/MM/dd'), { message: 'تاریخ خرید باید امروز یا قبل‌تر باشد' }),
    startDate: persianDateOpt('تاریخ شروع').refine((v) => !v || v <= formatJ(new Date(), 'yyyy/MM/dd'), { message: 'تاریخ شروع باید امروز یا قبل‌تر باشد' }),

    source: z.enum(['purchase', 'hatch']).default('purchase'),

    purchasePrice: z.number().min(1_000, 'قیمت هر پرنده باید حداقل ۱۰۰۰ باشد').max(5_000_000, 'قیمت هر پرنده بیش از حد بزرگ است').optional().nullable(),
    deliveryCost: z.number().min(0).max(500_000_000).optional().nullable(),
    otherCosts: z.number().min(0).max(500_000_000).optional().nullable(),

    status: z.enum(['active', 'archived', 'sold', 'merged']).default('active'),
    notes: optionalStr(1000),
    // 🆕 اجاره
    dealType: z.enum(['own', 'partnership', 'consignment', 'rent', 'barter']).optional(),
    partnerId: optionalId(),
    partnerShare: z.number().min(0, 'سهم شریک نمی‌تواند منفی باشد').max(100, 'سهم شریک بیشتر از ۱۰۰٪ نمی‌شود').optional().nullable(),
    consignorId: optionalId(),
    lessorId: optionalId(),
    rentAmount: z.number().min(0).optional().nullable(),
    rentStartDate: persianDateOpt('شروع اجاره'),
    rentEndDate: persianDateOpt('پایان قرارداد'),
    rentPeriod: z.enum(['monthly', 'season', 'total']).optional(),
    rentPayments: z.array(z.object({
      id: z.string(),
      date: z.string(),
      amount: z.number().min(0),
      notes: z.string().optional(),
    })).optional(),
    // 🆕 تهاتر
    barterPartyId: optionalId(),
    barterValue: z.number().min(0).optional().nullable(),
    barterDescription: optionalStr(500),
    barterStartDate: persianDateOpt('تاریخ شروع تهاتر'),
    barterEndDate: persianDateOpt('تاریخ پایان تهاتر'),
  }).superRefine((data, ctx) => {
    const d = data as any;

    // ═══ حداقل یکی از تاریخ‌ها ═══
    if (!d.hatchDate && !d.purchaseDate && !d.startDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'حداقل یکی از تاریخ‌های هچ، خرید یا شروع را وارد کنید',
        path: ['startDate'],
      });
    }

    // ═══ شروط مدل بهره‌برداری ═══
    if (d.dealType === 'partnership' && !d.partnerId) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'شریک را انتخاب کنید', path: ['partnerId'] });
    }
    if (d.dealType === 'consignment' && !d.consignorId) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'امانت‌دهنده را انتخاب کنید', path: ['consignorId'] });
    }
    if (d.dealType === 'rent') {
      if (!d.lessorId) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'موجر را انتخاب کنید', path: ['lessorId'] });
      }
      if (!d.rentAmount || d.rentAmount <= 0) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'مبلغ اجاره را وارد کنید', path: ['rentAmount'] });
      }
    }
    if (d.dealType === 'barter' && !d.barterPartyId) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'طرف تهاتر را انتخاب کنید', path: ['barterPartyId'] });
    }

    // نر + ماده = کل (اگه هر دو پر شده)
    const male = d.maleCount || 0;
    const female = d.femaleCount || 0;
    const unknown = d.unknownCount || 0;
    if (male > 0 || female > 0 || unknown > 0) {
      const targetCount = (d.currentCount != null && d.currentCount > 0) ? d.currentCount : d.initialCount;
      if (male + female + unknown !== targetCount) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `مجموع نر (${male.toLocaleString('fa-IR')}) + ماده (${female.toLocaleString('fa-IR')}) + نامشخص (${unknown.toLocaleString('fa-IR')}) = ${(male+female+unknown).toLocaleString('fa-IR')} — باید با تعداد فعلی (${targetCount.toLocaleString('fa-IR')}) برابر باشد`,
          path: ['maleCount'],
        });
      }
    }

    // تعداد فعلی ≤ تعداد اولیه (فقط اگه currentCount پر شده باشه)
    if (d.currentCount != null && d.currentCount > 0 && d.currentCount > d.initialCount) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `تعداد فعلی (${d.currentCount.toLocaleString('fa-IR')}) نمی‌تواند از تعداد اولیه بیشتر باشد`,
        path: ['currentCount'],
      });
    }

    // 🆕 چک‌های مربوط به layer/breeder فقط
    if (d.type === 'layer' || d.type === 'breeder') {
      // layingStartDay: 100-250 (فقط اگه پر باشه)
      if (d.layingStartDay != null && d.layingStartDay > 0 && (d.layingStartDay < 100 || d.layingStartDay > 250)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `سن تخم‌گذاری باید بین ۱۰۰ و ۲۵۰ روز باشد`,
          path: ['layingStartDay'],
        });
      }
      // endOfCycleDay: 35-700 (فقط اگه کاربر مقدار داده)
      if (d.endOfCycleDay != null && d.endOfCycleDay > 0 && (d.endOfCycleDay < 35 || d.endOfCycleDay > 700)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `سن پایان چرخه باید بین ۳۵ و ۷۰۰ روز باشد`,
          path: ['endOfCycleDay'],
        });
      }
      // endOfCycleDay > layingStartDay
      if (d.endOfCycleDay != null && d.endOfCycleDay > 0 &&
          d.layingStartDay != null && d.endOfCycleDay <= d.layingStartDay) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `سن پایان چرخه (${d.endOfCycleDay}) باید بیشتر از سن تخم‌گذاری (${d.layingStartDay}) باشد`,
          path: ['endOfCycleDay'],
        });
      }
    }

    // ═══ چک تناسب نژاد با نوع گله (سطح ۴: Conditional) ═══
    const breeds = (context as any).breeds as Array<{ id: string; name: string; purposes?: string[] }> | undefined;
    if (d.breedId && breeds) {
      const breed = breeds.find(b => b.id === d.breedId);
      if (breed?.purposes && breed.purposes.length > 0 && !breed.purposes.includes(d.type)) {
        const purposeLabels: Record<string, string> = { layer: 'تخم‌گذار', broiler: 'گوشتی', breeder: 'مادر', ornamental: 'تزئینی' };
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `نژاد «${breed.name}» برای «${purposeLabels[d.type] || d.type}» مناسب نیست`,
          path: ['breedId'],
        });
      }
    }

    // ═══ تاریخ‌ها ترتیب منطقی ═══
    // هچ ≤ خرید
    if (d.hatchDate && d.purchaseDate && d.hatchDate > d.purchaseDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'تاریخ هچ باید قبل از تاریخ خرید باشد',
        path: ['purchaseDate'],
      });
    }
    // هچ ≤ شروع نگهداری
    if (d.hatchDate && d.startDate && d.hatchDate > d.startDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'تاریخ هچ باید قبل از شروع نگهداری باشد',
        path: ['startDate'],
      });
    }
    // خرید ≤ شروع نگهداری
    if (d.purchaseDate && d.startDate && d.purchaseDate > d.startDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'تاریخ خرید باید قبل از شروع نگهداری باشد',
        path: ['startDate'],
      });
    }

    // تاریخ‌ها در آینده نباشند (Jalali comparison — fix: بود Gregorian)
    // منبع hatch → hatchDate اجباری
    if (d.source === 'hatch' && !d.hatchDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'برای منبع «جوجه‌کشی خودم» تاریخ هچ را وارد کنید',
        path: ['hatchDate'],
      });
    }
    // منبع purchase → purchaseDate اجباری
    if (d.source === 'purchase' && !d.purchaseDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'برای منبع «خریداری» تاریخ خرید را وارد کنید',
        path: ['purchaseDate'],
      });
    }

    // 🆕 اعتبارسنجی اجاره
    if (d.dealType === 'barter') {
      if (d.barterStartDate && d.barterEndDate && d.barterStartDate >= d.barterEndDate) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'تاریخ پایان تهاتر باید بعد از شروع باشد',
          path: ['barterEndDate'],
        });
      }
    }
    if (d.dealType === 'rent') {
      if (d.rentStartDate && d.rentEndDate && d.rentStartDate >= d.rentEndDate) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'پایان قرارداد باید بعد از شروع اجاره باشد',
          path: ['rentEndDate'],
        });
      }
      if (d.dealType === 'rent' && d.rentAmount > 0 && Array.isArray(d.rentPayments) && d.rentPayments.length > 0) {
        let totalRentAmount = d.rentAmount;
        if (d.rentPeriod !== 'total' && d.rentStartDate && d.rentEndDate) {
          const [sy, sm, sd] = d.rentStartDate.split('/').map(Number);
          const [ey, em, ed] = d.rentEndDate.split('/').map(Number);
          if (sy && sm && sd && ey && em && ed) {
            const s = Date.UTC(sy, sm - 1, sd);
            const e = Date.UTC(ey, em - 1, ed);
            const days = Math.max(0, Math.floor((e - s) / 86400000));
            if (days > 0) {
              if (d.rentPeriod === 'season') totalRentAmount = d.rentAmount * Math.max(1, Math.ceil(days / 90));
              else if (d.rentPeriod === 'monthly') totalRentAmount = d.rentAmount * Math.max(1, Math.ceil(days / 30));
            }
          }
        }
        const sum = d.rentPayments.reduce((a: number, p: any) => a + (Number(p.amount) || 0), 0);
        if (sum > totalRentAmount) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `جمع پرداخت‌ها (${sum.toLocaleString('fa-IR')}) از مبلغ کل اجاره (${totalRentAmount.toLocaleString('fa-IR')}) بیشتر است`,
            path: ['rentPayments'],
          });
        }
      }
      // 🆕 تاریخ پرداخت‌ها داخل بازه اجاره
      if (Array.isArray(d.rentPayments)) {
        for (let i = 0; i < d.rentPayments.length; i++) {
          const p = d.rentPayments[i];
          if (p.date && d.rentStartDate && p.date < d.rentStartDate) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: `تاریخ پرداخت ${i + 1} قبل از شروع اجاره است`,
              path: ['rentPayments'],
            });
            break;
          }
          if (p.date && d.rentEndDate && p.date > d.rentEndDate) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: `تاریخ پرداخت ${i + 1} بعد از پایان قرارداد است`,
              path: ['rentPayments'],
            });
            break;
          }
        }
      }
    }
  });
}

export type FlkFormData = z.infer<ReturnType<typeof createFlkSchema>>;

// ═══════════════════════════════════════════════
// قوانین نژاد (brd)
// ═══════════════════════════════════════════════
export function createBrdSchema(_context: ValidationContext = {}) {
  return z.object({
    name: requiredStr('نام نژاد', 2, 50),
    birdId: requiredId('پرنده'),
    fcr: z.union([
      z.literal(''),
      z.undefined(),
      z.coerce.number(),
    ]).transform(v => (v === '' || v === undefined) ? null : Number(v))
      .refine(v => v === null || (v >= GROWTH.fcr.min && v <= GROWTH.fcr.max),
        `FCR باید بین ${GROWTH.fcr.min} و ${GROWTH.fcr.max} باشد`),
    standardKey: optionalId(),
  });
}

export type BrdFormData = z.infer<ReturnType<typeof createBrdSchema>>;

// ═══════════════════════════════════════════════
// قوانین پرنده (brd)
// ═══════════════════════════════════════════════
export function createBirdSchema(_context: ValidationContext = {}) {
  return z.object({
    name: requiredStr('نام پرنده', 2, 50),
    category: z.enum(['layer', 'broiler', 'breeder', 'dual']).default('layer'),
    cycleDays: intRange('طول چرخه', 1, 2000),
    fcr: z.union([
      z.literal(''),
      z.undefined(),
      z.coerce.number(),
    ]).transform(v => (v === '' || v === undefined) ? null : Number(v))
      .refine(v => v === null || (v >= GROWTH.fcr.min && v <= GROWTH.fcr.max),
        `FCR باید بین ${GROWTH.fcr.min} و ${GROWTH.fcr.max} باشد`),
  });
}

export type BirdFormData = z.infer<ReturnType<typeof createBirdSchema>>;
