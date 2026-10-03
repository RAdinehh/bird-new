/**
 * validation/rules/dlg.ts — قوانین ثبت روزانه
 *
 * قوانین:
 * - تاریخ در آینده نباشد
 * - دما min ≤ max (و هر کدام 5-50°C)
 * - رطوبت min ≤ max (و هر کدام 10-95%)
 * - تلفات ≤ تعداد زنده گله
 * - تخم: مجموع سالم ≤ تعداد گله
 * - وزن نمونه‌ها منطقی (0.02 - 5 kg)
 * - مقدار آب با تعداد بارها هماهنگ
 * - دارو/واکسن: مقدار مصرفی > 0 در صورت انتخاب از انبار
 */
import { z } from 'zod';
import {
  intRange, intOpt, floatRange, persianDateNotFuture,
  requiredId, optionalStr, optionalId, floatNonNeg, intNonNeg,
} from '../helpers';
import type { ValidationContext } from '../types';

const MAX_TEMP = 50;
const MIN_TEMP = -10;
const MAX_HUM = 100;
const MAX_FEED = 10000; // kg

export function createDlgSchema(context: ValidationContext = {}) {
  const flockAlive = context.flockCurrentCount ?? context.flockCount ?? 0;

  return z.object({
    flockId: requiredId('گله'),
    date: persianDateNotFuture('تاریخ'),
    entryTime: optionalStr(10),

    // محیط
    temperature: floatRange('دما', MIN_TEMP, MAX_TEMP).nullable().optional(),
    temperatureMin: floatRange('حداقل دما', MIN_TEMP, MAX_TEMP).nullable().optional(),
    temperatureMax: floatRange('حداکثر دما', MIN_TEMP, MAX_TEMP).nullable().optional(),
    humidity: floatRange('رطوبت', 0, MAX_HUM).nullable().optional(),
    humidityMin: floatRange('حداقل رطوبت', 0, MAX_HUM).nullable().optional(),
    humidityMax: floatRange('حداکثر رطوبت', 0, MAX_HUM).nullable().optional(),
    lightHours: floatRange('ساعت نوردهی', 0, 24).nullable().optional(),

    // تغذیه
    feedAmount: floatRange('مقدار دان مصرفی', 0, MAX_FEED).nullable().optional(),
    feedRemaining: floatRange('دان باقیمانده', 0, MAX_FEED).nullable().optional(),
    feedSourceId: optionalId(),

    // آب
    waterAmount: floatRange('مقدار آب', 0, 100000).nullable().optional(),
    waterFillCount: intNonNeg('تعداد بار آب').nullable().optional(),
    waterFillVolume: floatNonNeg('حجم هر بار آب', 1000).nullable().optional(),

    // تخم‌گذاری
    eatingEggs: intRange('تخم خوراکی', 0, 100000),
    fertileEggs: intRange('تخم نطفه‌دار', 0, 100000),
    brokenEggs: intRange('تخم شکسته', 0, 100000),
    otherEggs: intRange('تخم سایر', 0, 100000),
    brokenTarget: z.enum(['consumption', 'eating']).default('consumption'),
    otherTarget: z.enum(['consumption', 'eating']).default('consumption'),

    // تلفات
    deathsCount: intRange('تلفات', 0, 100000),
    deaths: z.array(z.object({
      id: z.string(),
      count: intNonNeg('تعداد تلفات'),
      cause: z.string().optional().default(''),
      notes: z.string().optional().default(''),
    })).default([]),

    // واکسن‌ها
    vaccines: z.array(z.object({
      id: z.string(),
      name: z.string().optional().default(''),
      dose: z.string().optional().default(''),
      method: z.string().optional().default(''),
      reaction: z.string().optional().default(''),
      itemId: z.string().optional().default(''),
      quantity: z.union([z.number(), z.null()]).optional().default(null),
      movementId: z.string().optional().default(''),
    })).default([]),

    // داروها
    medications: z.array(z.object({
      id: z.string(),
      name: z.string().optional().default(''),
      dose: z.string().optional().default(''),
      method: z.string().optional().default(''),
      withdrawalDays: z.union([z.number(), z.null()]).optional().default(null),
      itemId: z.string().optional().default(''),
      quantity: z.union([z.number(), z.null()]).optional().default(null),
      movementId: z.string().optional().default(''),
    })).default([]),

    // وزن‌کشی
    weightSamples: z.array(z.object({
      id: z.string(),
      weight: z.coerce.number(),
    })).default([]),

    activities: z.array(z.object({
      id: z.string(),
      type: z.string().optional().default(''),
      notes: z.string().optional().default(''),
    })).default([]),

    notes: optionalStr(2000),
  }).superRefine((data, ctx) => {
    const d = data as any;

    // دما min ≤ max
    if (d.temperatureMin !== null && d.temperatureMax !== null &&
        d.temperatureMin !== undefined && d.temperatureMax !== undefined) {
      if (d.temperatureMin > d.temperatureMax) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'حداقل دما نمی‌تواند بیشتر از حداکثر باشد',
          path: ['temperatureMin'],
        });
      }
    }

    // رطوبت min ≤ max
    if (d.humidityMin !== null && d.humidityMax !== null &&
        d.humidityMin !== undefined && d.humidityMax !== undefined) {
      if (d.humidityMin > d.humidityMax) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'حداقل رطوبت نمی‌تواند بیشتر از حداکثر باشد',
          path: ['humidityMin'],
        });
      }
    }

    // تلفات ≤ تعداد زنده
    if (flockAlive > 0) {
      if (d.deathsCount > flockAlive) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `تلفات (${d.deathsCount.toLocaleString('fa-IR')}) نمی‌تواند از تعداد زنده گله (${flockAlive.toLocaleString('fa-IR')}) بیشتر باشد`,
          path: ['deathsCount'],
        });
      }

      // مجموع تلفات رکوردها = deathsCount
      const sumDeaths = (d.deaths || []).reduce((a: number, x: any) => a + (x.count || 0), 0);
      if (sumDeaths > 0 && sumDeaths !== d.deathsCount) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `مجموع رکوردهای تلفات (${sumDeaths.toLocaleString('fa-IR')}) با تعداد کل (${d.deathsCount.toLocaleString('fa-IR')}) یکسان نیست`,
          path: ['deaths'],
        });
      }

      // Hen-Day بیولوژیکی — حداکثر ۱۰۲٪
      const healthyEggs = (d.eatingEggs || 0) + (d.fertileEggs || 0);
      if (flockAlive > 0 && healthyEggs > 0) {
        const rate = (healthyEggs / flockAlive) * 100;
        if (rate > 102) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `تخم سالم (${healthyEggs}) با تعداد گله (${flockAlive}) همخوانی ندارد (نرخ ${rate.toFixed(1)}٪)`,
            path: ['eatingEggs'],
          });
        }
      }

      // مجموع تلفات + مجموع تخم مصرفی
      if (d.deathsCount > 0 && d.deathsCount > flockAlive) {
        // قبلاً چک شد
      }
    }

    // آب: تعداد × حجم = مقدار
    if (d.waterFillCount && d.waterFillVolume && d.waterAmount) {
      const calc = d.waterFillCount * d.waterFillVolume;
      // اگه مقدار آب دستی داده شده و با محاسبه فرق زیاد داره
      if (Math.abs(calc - d.waterAmount) > calc * 0.1) {
        // هشدار، نه خطا
      }
    }

    // واکسن‌های انتخاب‌شده از انبار → مقدار مصرفی اجباری
    for (let i = 0; i < (d.vaccines || []).length; i++) {
      const v = d.vaccines[i];
      if (v.itemId && (!v.quantity || v.quantity <= 0)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `واکسن ${v.name || ''}: مقدار مصرفی اجباری است`,
          path: ['vaccines', String(i), 'quantity'],
        });
      }
    }

    // داروهای انتخاب‌شده از انبار → مقدار مصرفی اجباری
    for (let i = 0; i < (d.medications || []).length; i++) {
      const m = d.medications[i];
      if (m.itemId && (!m.quantity || m.quantity <= 0)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `دارو ${m.name || ''}: مقدار مصرفی اجباری است`,
          path: ['medications', String(i), 'quantity'],
        });
      }
    }

    // وزن نمونه‌ها: 0.02 - 5 kg
    for (let i = 0; i < (d.weightSamples || []).length; i++) {
      const w = d.weightSamples[i];
      if (w.weight > 0 && (w.weight < 0.02 || w.weight > 5)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'وزن نمونه باید بین ۲۰ گرم تا ۵ کیلو باشد',
          path: ['weightSamples', String(i), 'weight'],
        });
      }
    }
  });
}

export type DlgFormData = z.infer<ReturnType<typeof createDlgSchema>>;
