/**
 * validation/helpers.ts — اسکیماهای پایه و ابزارها
 *
 * ⚠️ نکات مهم:
 * - همه‌ی اعداد با coerce تبدیل میشن (چون فرم‌ها رشته ذخیره می‌کنن)
 * - پیام‌ها به فارسی ساده برای کاربر نهایی
 * - پیام‌ها روی path مشخص می‌شن تا UI بتونه زیر فیلد درست نشون بده
 */
import { z } from 'zod';
import type { ValidationResult, ValidationIssue } from './types';

// ═══════════════════════════════════════════════
// اعداد
// ═══════════════════════════════════════════════

/** عدد صحیح ≥ 0 */
export const intNonNeg = (label: string, max = 1_000_000) =>
  z.coerce.number({ invalid_type_error: `${label} باید عدد باشد` })
    .int(`${label} باید عدد صحیح باشد`)
    .min(0, `${label} نمی‌تواند منفی باشد`)
    .max(max, `${label} بیش از حد بزرگ است`);

/** عدد صحیح > 0 */
export const intPos = (label: string, max = 1_000_000) =>
  z.coerce.number({ invalid_type_error: `${label} باید عدد باشد` })
    .int(`${label} باید عدد صحیح باشد`)
    .min(1, `${label} باید بیشتر از صفر باشد`)
    .max(max, `${label} بیش از حد بزرگ است`);

/** عدد صحیح در بازه */
export const intRange = (label: string, min: number, max: number) =>
  z.coerce.number({ invalid_type_error: `${label} باید عدد باشد` })
    .int(`${label} باید عدد صحیح باشد`)
    .min(min, `${label} باید حداقل ${min.toLocaleString('fa-IR')} باشد`)
    .max(max, `${label} باید حداکثر ${max.toLocaleString('fa-IR')} باشد`);

/** عدد اعشاری ≥ 0 */
export const floatNonNeg = (label: string, max = 1_000_000) =>
  z.coerce.number({ invalid_type_error: `${label} باید عدد باشد` })
    .min(0, `${label} نمی‌تواند منفی باشد`)
    .max(max, `${label} بیش از حد بزرگ است`);

/** عدد اعشاری > 0 */
export const floatPos = (label: string, max = 1_000_000) =>
  z.coerce.number({ invalid_type_error: `${label} باید عدد باشد` })
    .min(0.0001, `${label} باید بیشتر از صفر باشد`)
    .max(max, `${label} بیش از حد بزرگ است`);

/** عدد اعشاری در بازه */
export const floatRange = (label: string, min: number, max: number) =>
  z.coerce.number({ invalid_type_error: `${label} باید عدد باشد` })
    .min(min, `${label} باید حداقل ${min.toLocaleString('fa-IR')} باشد`)
    .max(max, `${label} باید حداکثر ${max.toLocaleString('fa-IR')} باشد`);

/** اختیاری — اگه خالی باشه null می‌شه */
export const intOpt = (label: string, max = 1_000_000) =>
  z.union([z.literal(''), z.coerce.number().int().min(0, `${label} منفی نباشه`).max(max)])
    .optional()
    .transform(v => (v === '' || v === undefined || v === null) ? null : Number(v));

// ═══════════════════════════════════════════════
// تاریخ (شمسی)
// ═══════════════════════════════════════════════

const JALALI_RE = /^\d{4}\/\d{2}\/\d{2}$/;

/** تاریخ شمسی */
export const jalaliDate = (label = 'تاریخ') =>
  z.string()
    .min(1, `${label} اجباری است`)
    .regex(JALALI_RE, `${label} باید به شکل ۱۴۰۵/۰۷/۱۱ باشد`);

/** تاریخ شمسی اختیاری */
export const jalaliDateOpt = (label = 'تاریخ') =>
  z.union([z.literal(''), z.string().regex(JALALI_RE, `${label} نامعتبر است`)])
    .optional()
    .default('');

/** تاریخ شمسی با محدوده */
export const jalaliDateMinMax = (label: string, min: string, max: string) =>
  z.string()
    .min(1, `${label} اجباری است`)
    .regex(JALALI_RE, `${label} نامعتبر است`)
    .refine(v => v >= min, { message: `${label} نمی‌تواند قبل از ${min} باشد` })
    .refine(v => v <= max, { message: `${label} نمی‌تواند بعد از ${max} باشد` });

/** تاریخ شمسی که در آینده نباشه */
export const jalaliDateNotFuture = (label = 'تاریخ', today?: string) =>
  z.string()
    .min(1, `${label} اجباری است`)
    .regex(JALALI_RE, `${label} نامعتبر است`)
    .refine(v => !today || v <= today, { message: `${label} نمی‌تواند در آینده باشد` });

// ═══════════════════════════════════════════════
// رشته‌ها
// ═══════════════════════════════════════════════

/** رشته اجباری */
export const requiredStr = (label: string, min = 1, max = 500) =>
  z.string()
    .min(min, `${label} اجباری است`)
    .max(max, `${label} بیش از حد طولانی است`);

/** رشته اختیاری */
export const optionalStr = (max = 2000) =>
  z.string().max(max, 'متن بیش از حد طولانی است').optional().default('');

/** آیتم اجباری (id از لیست) */
export const requiredId = (label: string) =>
  z.string().min(1, `${label} اجباری است`);

/** آیتم اختیاری (id از لیست) */
export const optionalId = () => z.string().optional().default('');

/** انتخاب از لیست محدود (enum) */
export const oneOf = <T extends string>(label: string, values: readonly T[]) =>
  z.enum(values as any, {
    invalid_type_error: `${label} نامعتبر است`,
    required_error: `${label} اجباری است`,
  }) as unknown as z.ZodType<T>;

/** چک‌باکس / بولین */
export const bool = () => z.boolean().optional().default(false);

// ═══════════════════════════════════════════════
// ابزارهای سراسری
// ═══════════════════════════════════════════════

/** اعتبارسنجی امن — بدون throw، نتیجه ساختاریافته */
export function validate<T>(
  schema: z.ZodSchema<T>,
  data: any,
): ValidationResult {
  const result = schema.safeParse(data);
  if (result.success) {
    return { ok: true, errors: {} };
  }
  const errors: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const key = issue.path.join('.') || '_';
    if (!errors[key]) errors[key] = issue.message;
  }
  return { ok: false, errors };
}

/** استخراج لیست خطاها با جزئیات */
export function issues<T>(schema: z.ZodSchema<T>, data: any): ValidationIssue[] {
  const result = schema.safeParse(data);
  if (result.success) return [];
  return result.error.issues.map(issue => ({
    path: issue.path.join('.') || '_',
    message: issue.message,
    severity: 'error' as const,
  }));
}

/** بررسی حداقل یک عدد مثبت در چند فیلد */
export function atLeastOne(schema: z.ZodEffects<any>, fields: string[], label = 'حداقل یک مقدار') {
  return schema.superRefine((data: any, ctx: any) => {
    const has = fields.some(f => Number(data[f]) > 0);
    if (!has) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: label,
        path: [fields[0]],
      });
    }
  });
}

/** جمع دو یا چند فیلد نباید از حد مشخص بیشتر باشد */
export function sumLessThan(schema: z.ZodEffects<any>, fields: string[], max: number, label = 'مجموع') {
  return schema.superRefine((data: any, ctx: any) => {
    const sum = fields.reduce((a, f) => a + (Number(data[f]) || 0), 0);
    if (sum > max) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `${label} (${sum.toLocaleString('fa-IR')}) نمی‌تواند از ${max.toLocaleString('fa-IR')} بیشتر باشد`,
        path: [fields[0]],
      });
    }
  });
}
