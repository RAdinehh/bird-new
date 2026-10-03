/**
 * validation/helpers.ts — اسکیماهای پایه و ابزارها
 */
import { z } from 'zod';
import type { ValidationResult, ValidationIssue } from './types';

// ═══════════════════════════════════════════════
// پاک‌سازی ورودی
// ═══════════════════════════════════════════════

export function sanitizeNumber(val: unknown): unknown {
  if (typeof val === 'number') return Number.isFinite(val) ? val : undefined;
  if (typeof val === 'string') {
    const clean = val
      .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 1776))
      .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 1632))
      .replace(/[،,]/g, '')
      .replace(/[\s\u200C]/g, '')
      .trim();
    if (clean === '') return undefined;
    const num = Number(clean);
    return Number.isFinite(num) ? num : undefined;
  }
  return val;
}

export const poultryInt = z.preprocess(
  sanitizeNumber,
  z.number({ invalid_type_error: 'لطفاً عدد صحیح معتبر وارد کنید' })
    .int('مقدار باید عدد صحیح باشد'),
);

export const poultryFloat = z.preprocess(
  sanitizeNumber,
  z.number({ invalid_type_error: 'لطفاً عدد معتبر وارد کنید' }),
);

// ═══════════════════════════════════════════════
// اعداد
// ═══════════════════════════════════════════════

export const intNonNeg = (label: string, max = 1_000_000) =>
  poultryInt.pipe(z.number().min(0, `${label} نمی‌تواند منفی باشد`).max(max, `${label} بیش از حد بزرگ است`));

export const intPos = (label: string, max = 1_000_000) =>
  poultryInt.pipe(z.number().min(1, `${label} باید بیشتر از صفر باشد`).max(max, `${label} بیش از حد بزرگ است`));

export const intRange = (label: string, min: number, max: number) =>
  poultryInt.pipe(z.number()
    .min(min, `${label} باید حداقل ${min.toLocaleString('fa-IR')} باشد`)
    .max(max, `${label} باید حداکثر ${max.toLocaleString('fa-IR')} باشد`));

export const floatNonNeg = (label: string, max = 1_000_000) =>
  poultryFloat.pipe(z.number().min(0, `${label} نمی‌تواند منفی باشد`).max(max, `${label} بیش از حد بزرگ است`));

export const floatPos = (label: string, max = 1_000_000) =>
  poultryFloat.pipe(z.number().min(0.0001, `${label} باید بیشتر از صفر باشد`).max(max, `${label} بیش از حد بزرگ است`));

export const floatRange = (label: string, min: number, max: number) =>
  poultryFloat.pipe(z.number()
    .min(min, `${label} باید حداقل ${min.toLocaleString('fa-IR')} باشد`)
    .max(max, `${label} باید حداکثر ${max.toLocaleString('fa-IR')} باشد`));

export const intOpt = (label: string, max = 1_000_000) =>
  z.union([
    z.literal(''),
    z.undefined(),
    z.null(),
    poultryInt.pipe(z.number().min(0, `${label} منفی نباشد`).max(max, `${label} بیش از حد بزرگ`)),
  ]).transform(v => (v === '' || v === undefined || v === null) ? null : Number(v));

// ═══════════════════════════════════════════════
// تاریخ شمسی
// ═══════════════════════════════════════════════

const JALALI_RE = /^14\d{2}[-/](0[1-9]|1[0-2])[-/](0[1-9]|[12]\d|3[01])$/;

export const persianDate = (label = 'تاریخ') =>
  z.string({ required_error: `${label} اجباری است` })
    .regex(JALALI_RE, `${label} باید به شکل ۱۴۰۵/۰۷/۱۱ باشد`);

export const persianDateOpt = (label = 'تاریخ') =>
  z.union([
    z.literal(''),
    z.undefined(),
    z.string().regex(JALALI_RE, `${label} نامعتبر است`),
  ]).transform(v => v ?? '');

function todayJalali(): string {
  const d = new Date();
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;
}

export const persianDateNotFuture = (label = 'تاریخ') =>
  z.string({ required_error: `${label} اجباری است` })
    .regex(JALALI_RE, `${label} نامعتبر است`)
    .refine(v => v <= todayJalali(), `${label} نمی‌تواند در آینده باشد`);

export const persianDatePast = (label = 'تاریخ') =>
  z.string({ required_error: `${label} اجباری است` })
    .regex(JALALI_RE, `${label} نامعتبر است`)
    .refine(v => v <= todayJalali(), `${label} باید امروز یا قبل‌تر باشد`);

export const persianDateMinMax = (label: string, min: string, max: string) =>
  z.string({ required_error: `${label} اجباری است` })
    .regex(JALALI_RE, `${label} نامعتبر است`)
    .refine(v => v >= min, `${label} نمی‌تواند قبل از ${min} باشد`)
    .refine(v => v <= max, `${label} نمی‌تواند بعد از ${max} باشد`);

// ═══════════════════════════════════════════════
// رشته‌ها و انتخاب‌ها
// ═══════════════════════════════════════════════

export const requiredStr = (label: string, min = 1, max = 500) =>
  z.string({ required_error: `${label} اجباری است` })
    .trim()
    .min(min, `${label} باید حداقل ${min} کاراکتر باشد`)
    .max(max, `${label} بیش از حد طولانی است`);

export const optionalStr = (max = 2000) =>
  z.string().max(max, 'متن بیش از حد طولانی است').optional().default('');

export const requiredId = (label: string) =>
  z.string({ required_error: `${label} اجباری است` })
    .min(1, `${label} اجباری است`);

export const optionalId = () => z.string().optional().default('');

export const oneOf = <T extends readonly [string, ...string[]]>(label: string, values: T) =>
  z.enum(values, { errorMap: () => ({ message: `${label} نامعتبر است` }) }) as unknown as z.ZodType<T[number]>;

export const bool = () => z.boolean().optional().default(false);

export const phoneIR = (label = 'شماره تماس') =>
  z.string()
    .regex(/^09\d{9}$/, `${label} باید با ۰۹ شروع شده و ۱۱ رقم باشد`)
    .optional()
    .or(z.literal(''));

// ═══════════════════════════════════════════════
// ابزارها
// ═══════════════════════════════════════════════

export function validate<T>(schema: z.ZodSchema<T>, data: any): ValidationResult {
  const result = schema.safeParse(data);
  if (result.success) return { ok: true, errors: {} };
  const errors: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const key = issue.path.join('.') || '_';
    if (!errors[key]) errors[key] = issue.message;
  }
  return { ok: false, errors };
}

export function issues<T>(schema: z.ZodSchema<T>, data: any): ValidationIssue[] {
  const result = schema.safeParse(data);
  if (result.success) return [];
  return result.error.issues.map(issue => ({
    path: issue.path.join('.') || '_',
    message: issue.message,
    severity: 'error' as const,
  }));
}

/** میانگین وزنی */
export function avgWeight(totalKg: number, count: number): number {
  if (count <= 0) return 0;
  return (totalKg * 1000) / count; // گرم
}
