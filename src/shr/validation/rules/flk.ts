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
import {
  intPos, intNonNeg, intRange, floatNonNeg, floatRange,
  persianDatePast, persianDateOpt, requiredId, optionalId,
  requiredStr, optionalStr,
} from '../helpers';
import { EGG, GROWTH } from '../biological';
import type { ValidationContext } from '../types';

export function createFlkSchema(_context: ValidationContext = {}) {
  return z.object({
    name: requiredStr('نام گله', 2, 50),
    type: z.enum(['layer', 'broiler', 'breeder']),
    birdId: requiredId('پرنده'),
    breedId: requiredId('نژاد'),
    hallId: optionalId(),
    zoneId: optionalId(),

    initialCount: intPos('تعداد اولیه', 100000),
    currentCount: intPos('تعداد فعلی', 100000),
    maleCount: intNonNeg('تعداد نر', 100000),
    femaleCount: intNonNeg('تعداد ماده', 100000),

    layingStartDay: intRange('سن تخم‌گذاری', 100, 250),
    endOfCycleDay: intNonNeg('پایان چرخه', 1000),
    vaccineScheduleId: optionalId(),

    hatchDate: persianDateOpt('تاریخ هچ'),
    purchaseDate: persianDateOpt('تاریخ خرید'),
    startDate: persianDateOpt('تاریخ شروع'),

    source: z.enum(['purchase', 'hatch']).default('purchase'),

    purchasePrice: floatNonNeg('قیمت هر پرنده', 100_000_000),
    deliveryCost: floatNonNeg('هزینه حمل', 1_000_000_000),
    otherCosts: floatNonNeg('سایر هزینه‌ها', 1_000_000_000),

    status: z.enum(['active', 'archived', 'sold', 'merged']).default('active'),
    notes: optionalStr(1000),
  }).superRefine((data, ctx) => {
    const d = data as any;

    // نر + ماده = کل (اگه هر دو پر شده)
    if (d.maleCount > 0 && d.femaleCount > 0) {
      if (d.maleCount + d.femaleCount !== d.initialCount) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `مجموع نر (${d.maleCount.toLocaleString('fa-IR')}) و ماده (${d.femaleCount.toLocaleString('fa-IR')}) با تعداد اولیه (${d.initialCount.toLocaleString('fa-IR')}) یکسان نیست`,
          path: ['initialCount'],
        });
      }
    }

    // تعداد فعلی ≤ تعداد اولیه
    if (d.currentCount > d.initialCount) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `تعداد فعلی (${d.currentCount.toLocaleString('fa-IR')}) نمی‌تواند از تعداد اولیه بیشتر باشد`,
        path: ['currentCount'],
      });
    }

    // endOfCycleDay > layingStartDay
    if (d.endOfCycleDay > 0 && d.endOfCycleDay <= d.layingStartDay) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `سن پایان چرخه (${d.endOfCycleDay}) باید بیشتر از سن تخم‌گذاری (${d.layingStartDay}) باشد`,
        path: ['endOfCycleDay'],
      });
    }

    // تاریخ هچ در آینده نباشد
    const today = (() => {
      const dt = new Date();
      return `${dt.getFullYear()}/${String(dt.getMonth() + 1).padStart(2, '0')}/${String(dt.getDate()).padStart(2, '0')}`;
    })();
    if (d.hatchDate && d.hatchDate > today) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'تاریخ هچ نمی‌تواند در آینده باشد',
        path: ['hatchDate'],
      });
    }
    if (d.purchaseDate && d.purchaseDate > today) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'تاریخ خرید نمی‌تواند در آینده باشد',
        path: ['purchaseDate'],
      });
    }

    // منبع hatch → hatchDate اجباری
    if (d.source === 'hatch' && !d.hatchDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'برای منبع «جوجه‌کشی خودم» تاریخ هچ اجباری است',
        path: ['hatchDate'],
      });
    }
    // منبع purchase → purchaseDate اجباری
    if (d.source === 'purchase' && !d.purchaseDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'برای منبع «خریداری» تاریخ خرید اجباری است',
        path: ['purchaseDate'],
      });
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
