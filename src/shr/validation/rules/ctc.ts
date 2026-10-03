/**
 * validation/rules/ctc.ts — مخاطبین
 */
import { z } from 'zod';
import {
  requiredStr, optionalStr, phoneIR,
} from '../helpers';
import type { ValidationContext } from '../types';

export function createContactSchema(_ctx: ValidationContext = {}) {
  return z.object({
    name: requiredStr('نام', 2, 100),
    roles: z.array(z.enum(['customer', 'supplier', 'worker'])).min(1, 'حداقل یک نقش انتخاب کنید'),
    phone: phoneIR('شماره تماس'),
    landline: optionalStr(20),
    nationalCode: z.union([
      z.literal(''),
      z.string().regex(/^\d{10}$/, 'کد ملی باید ۱۰ رقم باشد'),
    ]).optional().default(''),
    province: optionalStr(50),
    city: optionalStr(50),
    address: optionalStr(300),
    bankName: optionalStr(80),
    cardNumber: z.union([
      z.literal(''),
      z.string().regex(/^\d{16}$/, 'شماره کارت باید ۱۶ رقم باشد'),
    ]).optional().default(''),
    iban: z.union([
      z.literal(''),
      z.string().regex(/^IR\d{24}$/, 'شبا باید با IR و ۲۴ رقم باشد'),
    ]).optional().default(''),
    creditLimit: z.union([
      z.literal(''),
      z.undefined(),
      z.coerce.number().min(0),
    ]).optional().transform(v => (v === '' || v === undefined) ? 0 : Number(v)),
    notes: optionalStr(1000),
  });
}

export type ContactFormData = z.infer<ReturnType<typeof createContactSchema>>;
