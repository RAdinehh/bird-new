/**
 * validation/rules/tra.ts — فاکتور خرید/فروش
 */
import { z } from 'zod';
import {
  requiredStr, optionalStr, optionalId, requiredId,
  floatNonNeg, floatPos, persianDateOpt, oneOf,
} from '../helpers';
import type { ValidationContext } from '../types';

export const PaymentSchema = z.object({
  date: persianDateOpt('تاریخ پرداخت'),
  amount: floatPos('مبلغ', 1_000_000_000_000),
  method: oneOf('روش', ['cash', 'card', 'check'] as const),
  checkNo: optionalStr(50),
  bank: optionalStr(80),
  dueDate: persianDateOpt('سرسید'),
  notes: optionalStr(300),
  status: oneOf('وضعیت چک', ['pending', 'cleared', 'bounced'] as const).optional(),
}).superRefine((data, ctx) => {
  const d = data as any;
  if (d.method === 'check') {
    if (!d.checkNo || d.checkNo.trim().length === 0) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'شماره چک اجباری است', path: ['checkNo'] });
    }
    if (!d.dueDate) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'سرسید چک اجباری است', path: ['dueDate'] });
    }
    if (!d.bank || d.bank.trim().length === 0) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'نام بانک اجباری است', path: ['bank'] });
    }
  }
});

export function createInvoiceSchema(ctx: ValidationContext = {}) {
  return z.object({
    type: oneOf('نوع فاکتور', ['purchase', 'sale'] as const),
    date: persianDateOpt('تاریخ'),
    partyId: requiredId('طرف حساب'),
    category: requiredStr('دسته', 1, 40),
    items: z.array(z.object({
      id: z.string(),
      description: optionalStr(200),
      unit: optionalStr(20),
      quantity: floatPos('تعداد', 1_000_000),
      unitPrice: floatNonNeg('قیمت واحد', 1_000_000_000_000),
      total: floatNonNeg('جمع قلم', 1_000_000_000_000_000),
      itemId: optionalId(),
      movementId: optionalId(),
      discountType: optionalStr(10),
      discountValue: floatNonNeg('تخفیف', 1_000_000_000_000).optional(),
      shipping: floatNonNeg('حمل', 1_000_000_000_000).optional(),
      itemPartyId: optionalId(),
      // فیلدهای پرنده
      birdId: optionalId(),
      breedId: optionalId(),
      flockId: optionalId(),
      ageDays: z.union([z.literal(''), z.null(), z.undefined(), z.coerce.number().int().min(0).max(2000)]).optional().transform(v => (v === '' || v === null || v === undefined) ? null : Number(v)),
      maleCount: z.union([z.literal(''), z.null(), z.undefined(), z.coerce.number().int().min(0)]).optional().transform(v => (v === '' || v === null || v === undefined) ? null : Number(v)),
      femaleCount: z.union([z.literal(''), z.null(), z.undefined(), z.coerce.number().int().min(0)]).optional().transform(v => (v === '' || v === null || v === undefined) ? null : Number(v)),
      unknownCount: z.union([z.literal(''), z.null(), z.undefined(), z.coerce.number().int().min(0)]).optional().transform(v => (v === '' || v === null || v === undefined) ? null : Number(v)),
    })).min(1, 'حداقل یک قلم لازم است'),
    discount: floatNonNeg('تخفیف کل', 1_000_000_000_000).optional(),
    shipping: floatNonNeg('حمل', 1_000_000_000_000).optional(),
    total: floatNonNeg('جمع کل', 1_000_000_000_000_000),
    payments: z.array(PaymentSchema).default([]),
    dueDate: persianDateOpt('سرسید'),
    relatedFlockId: optionalId(),
    relatedEntryId: optionalId(),
    notes: optionalStr(2000),
    paymentTerms: oneOf('شرایط پرداخت', ['cash', 'installment', 'custom'] as const).optional(),
    workflowStatus: oneOf('وضعیت', ['draft', 'confirmed', 'received', 'paid'] as const).optional(),
  }).superRefine((data, ctx) => {
    const d = data as any;
    // مجموع اقلام = total
    const itemsSum = (d.items || []).reduce((a: number, it: any) => a + (Number(it.total) || 0), 0);
    const expectedTotal = Math.max(0, itemsSum - (d.discount || 0) + (d.shipping || 0));
    if (Math.abs(expectedTotal - d.total) > 100) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `جمع کل (${d.total.toLocaleString('fa-IR')}) با محاسبه اقلام (${expectedTotal.toLocaleString('fa-IR')}) همخوانی ندارد`,
        path: ['total'],
      });
    }
    // مجموع پرداخت‌ها ≤ total
    const paidSum = (d.payments || []).reduce((a: number, p: any) => a + (Number(p.amount) || 0), 0);
    if (paidSum > d.total) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `مجموع پرداخت‌ها (${paidSum.toLocaleString('fa-IR')}) از جمع کل (${d.total.toLocaleString('fa-IR')}) بیشتر است`,
        path: ['payments'],
      });
    }
    // هر قلم: total = quantity × unitPrice − تخفیف + حمل
    for (let i = 0; i < (d.items || []).length; i++) {
      const it = d.items[i];
      const base = (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0);
      let disc = 0;
      if (it.discountType === 'percent') disc = base * (Number(it.discountValue) || 0) / 100;
      else if (it.discountType === 'amount') disc = Number(it.discountValue) || 0;
      const expected = Math.max(0, base - disc) + (Number(it.shipping) || 0);
      if (Math.abs(expected - (Number(it.total) || 0)) > 100) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `قلم ${i + 1}: جمع محاسبه‌شده (${expected.toLocaleString('fa-IR')}) با مقدار وارد شده (${(Number(it.total) || 0).toLocaleString('fa-IR')}) نمی‌خواند`,
          path: ['items', String(i), 'total'],
        });
      }
    }
    // فروش پرنده باید گله داشته باشد
    if (d.type === 'sale') {
      for (let i = 0; i < (d.items || []).length; i++) {
        const it = d.items[i];
        if (it.birdId && !it.flockId) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'برای فروش پرنده، انتخاب گله مبدأ اجباری است',
            path: ['items', String(i), 'flockId'],
          });
        }
      }
    }
  });
}

export type PaymentFormData = z.infer<typeof PaymentSchema>;
export type InvoiceFormData = z.infer<ReturnType<typeof createInvoiceSchema>>;
