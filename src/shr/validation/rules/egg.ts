/**
 * validation/rules/egg.ts — قوانین تخم‌گذاری
 *
 * قوانین:
 * - همه اعداد صحیح ≥ 0
 * - حداقل یک عدد > 0
 * - مجموع تخم سالم ≤ تعداد گله (اگه flockCount داده بشه)
 * - کل تخم ≤ تعداد گله × 1.3 (حاشیه تحمل)
 * - وزن اعشاری بین 0-200
 * - تاریخ در آینده نباشه
 */
import { z } from 'zod';
import {
  intRange, jalaliDateNotFuture, requiredId, floatRange,
  optionalStr,
} from '../helpers';
import type { ValidationContext } from '../types';

const MAX_EGG = 100000;

export function createEggSchema(context: ValidationContext = {}) {
  const today = (() => {
    const d = new Date();
    return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;
  })();

  return z.object({
    flockId: requiredId('گله'),
    date: jalaliDateNotFuture('تاریخ', today),
    eatingCount: intRange('تخم خوراکی', 0, MAX_EGG),
    fertileCount: intRange('تخم نطفه‌دار', 0, MAX_EGG),
    brokenCount: intRange('تخم شکسته', 0, MAX_EGG),
    softCount: intRange('تخم نرم', 0, MAX_EGG),
    dirtyCount: intRange('تخم کثیف', 0, MAX_EGG),
    avgWeight: z.union([z.literal(''), z.coerce.number()]).optional()
      .transform(v => (v === '' || v === undefined) ? null : Number(v))
      .refine(v => v === null || (v >= 0 && v <= 200), { message: 'وزن باید بین ۰ تا ۲۰۰ گرم باشد' }),
    notes: optionalStr(1000),
  }).superRefine((data, ctx) => {
    const healthy = data.eatingCount + data.fertileCount;
    const total = healthy + data.brokenCount + data.softCount + data.dirtyCount;

    // حداقل یک عدد
    if (total === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'حداقل یک عدد وارد کنید',
        path: ['eatingCount'],
      });
    }

    // چک تعداد گله
    if (context.flockCount && context.flockCount > 0) {
      if (healthy > context.flockCount) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `مجموع سالم (${healthy.toLocaleString('fa-IR')}) از تعداد گله (${context.flockCount.toLocaleString('fa-IR')}) بیشتر است`,
          path: ['eatingCount'],
        });
      }
      // حاشیه تحمل 30%
      if (total > Math.ceil(context.flockCount * 1.3)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `کل تخم (${total.toLocaleString('fa-IR')}) با تعداد گله (${context.flockCount.toLocaleString('fa-IR')}) همخوانی ندارد`,
          path: ['_'],
        });
      }
    }
  });
}

export type EggFormData = z.infer<ReturnType<typeof createEggSchema>>;
