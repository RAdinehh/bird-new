/**
 * validation/rules/whs.ts — انبار، کالا، گردش
 */
import { z } from 'zod';
import {
  requiredStr, optionalStr, optionalId, requiredId,
  floatNonNeg, floatPos, intNonNeg, persianDateOpt, oneOf,
} from '../helpers';
import type { ValidationContext } from '../types';

const CATEGORIES = ['feed', 'medicine', 'vaccine', 'herbal', 'equipment', 'consumable', 'egg'] as const;
const UNITS = ['kg', 'g', 'L', 'ml', 'pcs', 'vial', 'pack'] as const;

export function createItemSchema(_ctx: ValidationContext = {}) {
  return z.object({
    name: requiredStr('نام کالا', 2, 80),
    category: oneOf('دسته', CATEGORIES),
    unit: oneOf('واحد', UNITS),
    minStock: floatNonNeg('حد هشدار', 1_000_000),
    currentStock: floatNonNeg('موجودی فعلی', 10_000_000),
    lastPrice: floatNonNeg('آخرین قیمت', 100_000_000_000),
    supplierId: optionalId(),
    expireDate: persianDateOpt('تاریخ انقضا'),
    withdrawalDays: intNonNeg('دوره منع مصرف (روز)', 365).nullable().optional(),
    batchNo: optionalStr(50),
    storage: oneOf('محل نگهداری', ['room', 'fridge', 'freezer'] as const).optional().default('room'),
    notes: optionalStr(1000),
  }).superRefine((data, ctx) => {
    const d = data as any;
    // دوره منع مصرف فقط برای دارو/واکسن
    if (d.withdrawalDays !== null && d.withdrawalDays !== undefined && d.withdrawalDays > 0) {
      if (d.category !== 'medicine' && d.category !== 'vaccine') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'دوره منع مصرف فقط برای دارو یا واکسن قابل تعریف است',
          path: ['withdrawalDays'],
        });
      }
    }
    // دارو/واکسن → محل نگهداری یخچالی
    if ((d.category === 'medicine' || d.category === 'vaccine') && d.storage === 'room') {
      // هشدار، خطا نیست — بعضی داروها در دمای اتاق نگهداری میشن
    }
  });
}

export function createMovementSchema(_ctx: ValidationContext = {}) {
  return z.object({
    itemId: requiredId('کالا'),
    type: oneOf('نوع گردش', ['in', 'out', 'adjust'] as const),
    quantity: floatPos('مقدار', 10_000_000),
    unitPrice: floatNonNeg('قیمت واحد', 1_000_000_000_000),
    reason: oneOf('دلیل', ['purchase', 'consumption', 'sale', 'loss', 'adjustment', 'return'] as const),
    date: persianDateOpt('تاریخ'),
    partyId: optionalId(),
    notes: optionalStr(500),
    flockId: optionalId(),
    sourceModule: oneOf('ماژول مبدأ', ['egg', 'dlg', 'tra', 'inc', 'fed', 'manual'] as const).optional(),
    sourceId: optionalId(),
    batchNo: optionalStr(50),
  });
}

export type ItemFormData = z.infer<ReturnType<typeof createItemSchema>>;
export type MovementFormData = z.infer<ReturnType<typeof createMovementSchema>>;
