/**
 * validation/rules/hal.ts — سالن، بخش، تجهیزات
 */
import { z } from 'zod';
import {
  requiredStr, optionalStr, optionalId, requiredId,
  floatNonNeg, floatPos, floatRange, intPos, intNonNeg, persianDateOpt,
} from '../helpers';
import { HALL, TEMP, HUMIDITY } from '../biological';
import type { ValidationContext } from '../types';

export function createHallSchema(_ctx: ValidationContext = {}) {
  return z.object({
    name: requiredStr('نام سالن', 2, 50),
    code: requiredStr('کد سالن', 1, 20),
    length: floatRange('طول', 0.5, 500).nullable().optional(),
    width: floatRange('عرض', 0.5, 200).nullable().optional(),
    height: floatRange('ارتفاع', 1, 20).nullable().optional(),
    capacity: floatRange('ظرفیت', HALL.capacityBirds.min, HALL.capacityBirds.max).nullable().optional(),
    targetTemp: floatRange('دمای هدف', TEMP.minRoom, TEMP.maxRoom).nullable().optional(),
    targetHumidity: floatRange('رطوبت هدف', HUMIDITY.min, HUMIDITY.max).nullable().optional(),
    ventilation: floatNonNeg('تهویه', 100000).nullable().optional(),
    light: floatRange('روشنایی', 0, 500).nullable().optional(),
    ventilationSystem: optionalStr(50),
    feederType: optionalStr(50),
    drinkerType: optionalStr(50),
    litterType: optionalStr(50),
    address: optionalStr(300),
    builtAt: persianDateOpt('تاریخ ساخت'),
    lastSanitizedAt: persianDateOpt('آخرین ضدعفونی'),
    notes: optionalStr(1000),
    birdId: optionalId(),
    breedId: optionalId(),
  }).superRefine((data, ctx) => {
    const d = data as any;
    // اگه length × width داریم، capacity نمی‌تونه بیشتر از حداکثر تراکم باشه
    if (d.length && d.width && d.capacity) {
      const area = d.length * d.width;
      const maxBirds = area * HALL.densityBirdsPerSqM.max;
      if (d.capacity > maxBirds) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `ظرفیت (${d.capacity}) برای مساحت ${area.toFixed(0)} متر مربع زیاد است`,
          path: ['capacity'],
        });
      }
    }
  });
}

export const ZoneSchema = z.object({
  hallId: requiredId('سالن'),
  name: requiredStr('نام بخش', 1, 50),
  capacity: floatNonNeg('ظرفیت', 100000).nullable().optional(),
  notes: optionalStr(500),
});

export const EquipmentSchema = z.object({
  hallId: requiredId('سالن'),
  type: requiredStr('نوع تجهیز', 1, 50),
  name: requiredStr('نام تجهیز', 1, 50),
  count: intPos('تعداد', 100000).nullable().optional(),
  unitPrice: floatNonNeg('قیمت واحد', 100_000_000_000).nullable().optional(),
  purchasedAt: persianDateOpt('تاریخ خرید'),
  warranty: floatNonNeg('گارانتی (ماه)', 200).nullable().optional(),
  capacity: floatNonNeg('ظرفیت', 1_000_000).nullable().optional(),
  efficiency: floatNonNeg('بازدهی', 10_000).nullable().optional(),
  notes: optionalStr(500),
});

export type HallFormData = z.infer<ReturnType<typeof createHallSchema>>;
export type ZoneFormData = z.infer<typeof ZoneSchema>;
export type EquipmentFormData = z.infer<typeof EquipmentSchema>;
