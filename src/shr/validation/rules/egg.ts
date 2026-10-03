/**
 * validation/rules/egg.ts — قوانین تخم‌گذاری
 *
 * قوانین:
 * - همه اعداد صحیح ≥ 0
 * - حداقل یک عدد > 0
 * - مجموع تخم سالم ≤ تعداد گله (context-aware)
 * - کل تخم ≤ تعداد گله × 1.3
 * - وزن اعشاری بین 0-200 گرم
 * - تاریخ در آینده نباشد
 */
import { z } from 'zod';
import {
  intRange, persianDateNotFuture, requiredId, optionalStr,
} from '../helpers';
import type { ValidationContext } from '../types';

const MAX_EGG = 100000;

interface EggRaw {
  flockId: string;
  date: string;
  eatingCount: number;
  fertileCount: number;
  brokenCount: number;
  softCount: number;
  dirtyCount: number;
  avgWeight: number | null;
  notes: string;
}

export function createEggSchema(context: ValidationContext = {}) {
  return z.object({
    flockId: requiredId('گله'),
    date: persianDateNotFuture('تاریخ'),
    eatingCount: intRange('تخم خوراکی', 0, MAX_EGG),
    fertileCount: intRange('تخم نطفه‌دار', 0, MAX_EGG),
    brokenCount: intRange('تخم شکسته', 0, MAX_EGG),
    softCount: intRange('تخم نرم', 0, MAX_EGG),
    dirtyCount: intRange('تخم کثیف', 0, MAX_EGG),
    avgWeight: z.union([
      z.literal(''),
      z.undefined(),
      z.null(),
      z.coerce.number(),
    ]).transform(v => (v === '' || v === undefined || v === null) ? null : Number(v))
      .refine(v => v === null || (v >= 0 && v <= 200), 'وزن باید بین ۰ تا ۲۰۰ گرم باشد'),
    notes: optionalStr(1000),
  }).superRefine((data, ctx) => {
    const d = data as unknown as EggRaw;
    const healthy = d.eatingCount + d.fertileCount;
    const total = healthy + d.brokenCount + d.softCount + d.dirtyCount;

    if (total === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'حداقل یک عدد وارد کنید',
        path: ['eatingCount'],
      });
    }

    if (context.flockCount && context.flockCount > 0) {
      if (healthy > context.flockCount) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `مجموع سالم (${healthy.toLocaleString('fa-IR')}) از تعداد گله (${context.flockCount.toLocaleString('fa-IR')}) بیشتر است`,
          path: ['eatingCount'],
        });
      }
      if (total > Math.ceil(context.flockCount * 1.3)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `کل تخم (${total.toLocaleString('fa-IR')}) با تعداد گله (${context.flockCount.toLocaleString('fa-IR')}) همخوانی ندارد`,
          path: ['_'],
        });
      }
      // Hen-Day بیولوژیکی: حداکثر ۱۰۲٪
      const liveBirds = context.flockCurrentCount ?? context.flockCount;
      if (liveBirds > 0) {
        const rate = (healthy / liveBirds) * 100;
        if (rate > 102) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `نرخ تخم‌گذاری ${rate.toFixed(1)}٪ غیرممکن است (حداکثر ۱۰۲٪)`,
            path: ['eatingCount'],
          });
        }
      }
    }
  });
}

export type EggFormData = z.infer<ReturnType<typeof createEggSchema>>;
