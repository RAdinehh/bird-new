/**
 * validation/rules/hal.ts — سالن، بخش، تجهیزات
 */
import { z } from 'zod';
import {
  requiredStr, optionalStr, optionalId, requiredId,
  floatNonNeg, floatPos, floatRange, requiredFloatRange, intPos, intNonNeg, persianDateOpt,
} from '../helpers';
import { HALL, TEMP, HUMIDITY } from '../biological';
import type { ValidationContext } from '../types';

export function createHallSchema(_ctx: ValidationContext = {}) {
  return z.object({
    name: requiredStr('نام سالن', 2, 50),
    code: optionalStr(20),  // 🆕 خودکار از نام ساخته می‌شه
    length: requiredFloatRange('طول', 0.5, 500),
    width: requiredFloatRange('عرض', 0.5, 200),
    height: requiredFloatRange('ارتفاع', 1, 20),
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
    birdId: requiredId('پرنده'),
    breedId: requiredId('نژاد'),
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
  /** 🆕 بخش اختیاری */
  zoneId: optionalStr(50),
  // 🆕 نوع دارایی اختیاری — از type خودکار محاسبه می‌شه
  kind: z.enum(['asset', 'consumable']).optional(),
  // 🆕 ۱۴ دسته جدید
  category: z.enum([
    'ventilation', 'feeding', 'drinking', 'heating', 'lighting', 'litter', 'power', 'auxiliary',
    'water_treatment', 'safety', 'cleaning', 'hand_tools', 'weighing', 'cooling',
  ]),
  type: requiredStr('نوع تجهیز', 1, 50),
  name: requiredStr('نام تجهیز', 1, 50),
  // محدوده‌های واقعی صنعت مرغداری
  count: intNonNeg('تعداد', 100_000).nullable().optional(),
  unit: z.enum(['pcs', 'kg', 'm2', 'm', 'L']),
  unitPrice: floatNonNeg('قیمت واحد', 100_000_000_000).nullable().optional(),
  purchasedAt: persianDateOpt('تاریخ خرید'),
  warranty: floatNonNeg('گارانتی (ماه)', 120).nullable().optional(),
  // ظرفیت — حداکثر ۱۰ میلیون (برای فن بزرگ یا مخزن)
  capacity: floatNonNeg('ظرفیت', 10_000_000).nullable().optional(),
  efficiency: floatNonNeg('بازدهی', 10_000).nullable().optional(),
  consumeRate: z.enum(['once', 'per-cycle']).optional(),
  sourceInvoiceId: optionalStr(50),
  warehouseItemId: optionalStr(50),
  notes: optionalStr(500),
});

export type HallPayload = z.infer<ReturnType<typeof createHallSchema>>;
export type ZonePayload = z.infer<typeof ZoneSchema>;
export type EquipmentPayload = z.infer<typeof EquipmentSchema>;
