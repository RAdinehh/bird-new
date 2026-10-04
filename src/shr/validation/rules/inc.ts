/**
 * validation/rules/inc.ts — جوجه‌کشی، نوربینی، نتیجه هچ
 */
import { z } from 'zod';
import {
  optionalStr, optionalId, requiredId, requiredStr,
  floatNonNeg, floatPos, floatRange, intNonNeg, intPos, persianDateOpt,
} from '../helpers';
import { HATCH, EGG } from '../biological';
import type { ValidationContext } from '../types';

export const EggEntrySchema = z.object({
  deviceId: requiredId('دستگاه'),
  hatchGroupId: optionalId(),
  birdId: requiredId('پرنده'),
  breedId: optionalId(),
  count: intPos('تعداد تخم', 1_000_000).nullable().optional(),
  entryDate: persianDateOpt('تاریخ ورود'),
  expectedHatchDate: persianDateOpt('تاریخ هچ مورد انتظار'),
  source: z.enum(['own', 'purchase', 'partnership', 'rent', 'consignment']).default('own'),
  dealType: optionalStr(30),
  dealStatus: optionalStr(30),
  trayNumbers: optionalStr(100),
  unitPrice: floatNonNeg('قیمت واحد', 1_000_000_000).nullable().optional(),
  totalPrice: floatNonNeg('قیمت کل', 100_000_000_000).nullable().optional(),
  shippingCost: floatNonNeg('هزینه حمل', 1_000_000_000).nullable().optional(),
  notes: optionalStr(1000),
});

export const CandlingSchema = z.object({
  eggEntryId: requiredId('ورودی تخم'),
  stage: intPos('مرحله', 10),
  date: persianDateOpt('تاریخ'),
  alive: intNonNeg('زنده', 1_000_000).nullable().optional(),
  infertile: intNonNeg('نطفه‌نگرفته', 1_000_000).nullable().optional(),
  dead: intNonNeg('تلف‌شده', 1_000_000).nullable().optional(),
  deadEarly: intNonNeg('تلف زود', 1_000_000).nullable().optional(),
  deadMid: intNonNeg('تلف میانی', 1_000_000).nullable().optional(),
  deadLate: intNonNeg('تلف دیر', 1_000_000).nullable().optional(),
  broken: intNonNeg('شکسته', 1_000_000).nullable().optional(),
  notes: optionalStr(500),
}).superRefine((data, ctx) => {
  const d = data as any;
  const alive = d.alive || 0;
  const infertile = d.infertile || 0;
  const dead = d.dead || 0;
  const deadSum = (d.deadEarly || 0) + (d.deadMid || 0) + (d.deadLate || 0);
  if (deadSum > 0 && dead > 0 && deadSum !== dead) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `مجموع تلف‌ها (${deadSum}) با «تلف‌شده» (${dead}) یکسان نیست`,
      path: ['dead'],
    });
  }
});

export const HatchResultSchema = z.object({
  eggEntryId: requiredId('ورودی تخم'),
  date: persianDateOpt('تاریخ هچ'),
  hatched: intNonNeg('تعداد جوجه', 1_000_000).nullable().optional(),
  unhatched: intNonNeg('هچ‌نشده', 1_000_000).nullable().optional(),
  deadInShell: intNonNeg('تلف در پوسته', 1_000_000).nullable().optional(),
  pipped: intNonNeg('نوک‌زده', 1_000_000).nullable().optional(),
  other: intNonNeg('سایر', 1_000_000).nullable().optional(),
  gradeA: intNonNeg('درجه A', 1_000_000).nullable().optional(),
  gradeB: intNonNeg('درجه B', 1_000_000).nullable().optional(),
  maleCount: intNonNeg('نر', 1_000_000).nullable().optional(),
  femaleCount: intNonNeg('ماده', 1_000_000).nullable().optional(),
  unknownCount: intNonNeg('نامعلوم', 1_000_000).nullable().optional(),
  avgWeight: floatRange('وزن میانگین (گرم)', HATCH.chickWeightGram.min, HATCH.chickWeightGram.max).nullable().optional(),
  generatedFlockId: optionalId(),
  generatedInvoiceId: optionalId(),
  notes: optionalStr(1000),
}).superRefine((data, ctx) => {
  const d = data as any;
  // جمع اجزا = hatched + unhatched + deadInShell + pipped + other
  const parts = (d.unhatched || 0) + (d.deadInShell || 0) + (d.pipped || 0) + (d.other || 0);
  // gradeA + gradeB باید = hatched
  if (d.gradeA !== null && d.gradeB !== null && d.hatched !== null) {
    if ((d.gradeA || 0) + (d.gradeB || 0) !== (d.hatched || 0)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'مجموع درجه A و B باید برابر با تعداد کل جوجه‌ها باشد',
        path: ['gradeA'],
      });
    }
  }
  // male + female + unknown = hatched
  if (d.maleCount !== null || d.femaleCount !== null) {
    const sum = (d.maleCount || 0) + (d.femaleCount || 0) + (d.unknownCount || 0);
    if (sum > 0 && d.hatched !== null && sum !== (d.hatched || 0)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `مجموع نر + ماده + نامعلوم (${sum}) با تعداد جوجه (${d.hatched || 0}) یکسان نیست`,
        path: ['maleCount'],
      });
    }
  }
});

export type EggEntryFormData = z.infer<typeof EggEntrySchema>;
export type CandlingFormData = z.infer<typeof CandlingSchema>;
export type HatchResultFormData = z.infer<typeof HatchResultSchema>;


// ═══════════════════════════════════════════════
// دستگاه جوجه‌کشی
// ═══════════════════════════════════════════════
export function createDeviceSchema(_ctx: ValidationContext = {}) {
  return z.object({
    name: requiredStr('نام دستگاه', 2, 80),
    mode: z.enum(['setter', 'hatcher', 'setter+hatcher']),
    status: z.enum(['active', 'idle', 'maintenance', 'broken']).default('active'),
    temp: floatRange('دما', 30, 42).nullable().optional(),
    humidity: floatRange('رطوبت', 20, 90).nullable().optional(),
    purchasedAt: persianDateOpt('تاریخ خرید'),
    price: floatNonNeg('قیمت', 100_000_000_000).nullable().optional(),
    warranty: intNonNeg('گارانتی (ماه)', 240).nullable().optional(),
    racks: intNonNeg('طبقه', 100).nullable().optional(),
    trays: intNonNeg('سینی', 1000).nullable().optional(),
    fans: intNonNeg('فن', 100).nullable().optional(),
    tempSensors: intNonNeg('سنسور دما', 100).nullable().optional(),
    humiditySensors: intNonNeg('سنسور رطوبت', 100).nullable().optional(),
    motorPower: floatNonNeg('قدرت موتور', 10000).nullable().optional(),
    extraCost: floatNonNeg('هزینه جانبی', 100_000_000_000).nullable().optional(),
    notes: optionalStr(1000),
  }).superRefine((data, ctx) => {
    const d = data as any;
    if (d.temp !== null && d.temp !== undefined) {
      if (d.mode === 'setter' && (d.temp < 37 || d.temp > 38.5)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'دمای ستر باید بین ۳۷ تا ۳۸.۵ باشد', path: ['temp'] });
      }
      if (d.mode === 'hatcher' && (d.temp < 36.5 || d.temp > 37.5)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'دمای هچر باید بین ۳۶.۵ تا ۳۷.۵ باشد', path: ['temp'] });
      }
    }
  });
}
