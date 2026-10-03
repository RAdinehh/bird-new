/**
 * validation/rules/fed.ts — جیره‌نویسی، مواد اولیه، فرمول
 *
 * قوانین:
 * - مجموع درصدها = 100% (با خطای 0.1)
 * - درصد هر قلم بین minPercent-maxPercent
 * - حداقل 2 قلم
 */
import { z } from 'zod';
import {
  requiredStr, optionalStr, optionalId, requiredId,
  floatNonNeg, floatPos, floatRange, intNonNeg,
} from '../helpers';
import { RATION } from '../biological';
import type { ValidationContext } from '../types';

const CATEGORIES = ['energy', 'protein', 'mineral', 'vitamin', 'amino', 'additive'] as const;

export const IngredientSchema = z.object({
  name: requiredStr('نام ماده', 2, 60),
  category: z.enum(CATEGORIES),
  protein: floatRange('پروتئین', 0, 100),
  energy: floatRange('انرژی', 0, 5000),
  fat: floatRange('چربی', 0, 100),
  fiber: floatRange('فیبر', 0, 100),
  calcium: floatRange('کلسیم', 0, 50),
  phosphorus: floatRange('فسفر', 0, 50),
  methionine: floatRange('متیونین', 0, 10),
  lysine: floatRange('لیزین', 0, 10),
  minPercent: floatRange('حداقل درصد', 0, 100),
  maxPercent: floatRange('حداکثر درصد', 0, 100),
  price: floatNonNeg('قیمت', 100_000_000),
  stockItemId: optionalId(),
  isCore: z.boolean().optional().default(false),
  isHidden: z.boolean().optional().default(false),
  standardKey: optionalId(),
  notes: optionalStr(500),
}).superRefine((data, ctx) => {
  const d = data as any;
  if (d.minPercent > d.maxPercent) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'حداقل درصد نمی‌تواند از حداکثر بیشتر باشد',
      path: ['minPercent'],
    });
  }
});

export const RequirementSchema = z.object({
  name: requiredStr('نام نیاز', 2, 60),
  birdType: requiredStr('نوع پرنده', 1, 30),
  stage: requiredStr('مرحله', 1, 30),
  protein: floatRange('پروتئین', 0, 100),
  energy: floatRange('انرژی', 0, 5000),
  calcium: floatRange('کلسیم', 0, 50),
  phosphorus: floatRange('فسفر', 0, 50),
  methionine: floatRange('متیونین', 0, 10),
  lysine: floatRange('لیزین', 0, 10),
  notes: optionalStr(500),
});

export function createFormulaSchema(ctx: ValidationContext = {}) {
  return z.object({
    name: requiredStr('نام جیره', 2, 60),
    requirementId: optionalId(),
    date: optionalStr(20),
    status: z.enum(['draft', 'active', 'archived']).default('active'),
    lines: z.array(z.object({
      id: z.string(),
      ingredientId: requiredId('ماده'),
      percent: floatRange('درصد', 0, 100),
    })).min(2, 'حداقل ۲ ماده اولیه لازم است'),
    notes: optionalStr(1000),
  }).superRefine((data, ctx) => {
    const d = data as any;
    const sum = (d.lines || []).reduce((a: number, l: any) => a + (Number(l.percent) || 0), 0);
    const target = RATION.inclusionSumPct.target;
    const tol = RATION.inclusionSumPct.tolerance;
    if (Math.abs(sum - target) > tol) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `مجموع درصدها (${sum.toFixed(2)}٪) باید دقیقاً ${target}٪ باشد`,
        path: ['lines'],
      });
    }
    // چک تکراری نبودن ماده
    const ids = (d.lines || []).map((l: any) => l.ingredientId).filter(Boolean);
    const dup = ids.filter((v: string, i: number) => ids.indexOf(v) !== i);
    if (dup.length > 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'هر ماده اولیه فقط یک بار می‌تواند در جیره باشد',
        path: ['lines'],
      });
    }
  });
}

export type IngredientFormData = z.infer<typeof IngredientSchema>;
export type RequirementFormData = z.infer<typeof RequirementSchema>;
export type FormulaFormData = z.infer<ReturnType<typeof createFormulaSchema>>;
