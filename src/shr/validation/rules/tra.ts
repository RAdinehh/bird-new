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
  type: oneOf('نوع پرداخت', ['regular', 'advance', 'refund', 'settlement'] as const).optional(),
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
      
      birdId: optionalId(),
      breedId: optionalId(),
      flockId: optionalId(),
      ageDays: z.union([z.literal(''), z.null(), z.undefined(), z.coerce.number().int().min(0).max(2000)]).optional().transform(v => (v === '' || v === null || v === undefined) ? null : Number(v)),
      maleCount: z.union([z.literal(''), z.null(), z.undefined(), z.coerce.number().int().min(0)]).optional().transform(v => (v === '' || v === null || v === undefined) ? null : Number(v)),
      femaleCount: z.union([z.literal(''), z.null(), z.undefined(), z.coerce.number().int().min(0)]).optional().transform(v => (v === '' || v === null || v === undefined) ? null : Number(v)),
      unknownCount: z.union([z.literal(''), z.null(), z.undefined(), z.coerce.number().int().min(0)]).optional().transform(v => (v === '' || v === null || v === undefined) ? null : Number(v)),
      
      hatchDate: persianDateOpt('تاریخ هچ'),
      hatcheryBatchNo: optionalStr(50),
      chickWeight: floatNonNeg('وزن اولیه جوجه', 150).optional(),
      transportCost: floatNonNeg('هزینه حمل', 1_000_000_000).optional(),
      
      
      eggDate: persianDateOpt('تاریخ تخم'),
      eggWeight: floatNonNeg('وزن تخم', 200).optional(),
      brokenEggCount: floatNonNeg('تعداد شکسته', 100000).optional(),
      nonIncubableCount: floatNonNeg('تعداد غیرقابل جوجه‌کشی', 100000).optional(),
      
      storage: optionalStr(20),
      usageType: optionalStr(20),
      expiryDate: persianDateOpt('تاریخ انقضا'),
      withdrawalDays: z.union([z.literal(''), z.null(), z.undefined(), z.coerce.number().int().min(0)]).optional().transform(v => (v === '' || v === null || v === undefined) ? null : Number(v)),
      
      feedType: optionalStr(20),
      brand: optionalStr(50),
      protein: floatNonNeg('پروتئین', 100).optional(),
      energy: floatNonNeg('انرژی', 10000).optional(),
      bagWeight: floatNonNeg('وزن کیسه', 100).optional(),
      bagCount: floatNonNeg('تعداد کیسه', 10000).optional(),
      
      costType: optionalStr(30),
      equipmentCategory: optionalStr(50),
      equipmentType: optionalStr(50),
      equipmentKind: oneOf('نوع تجهیز', ['asset', 'consumable'] as const).optional(),
      model: optionalStr(50),
      serialNo: optionalStr(50),
      hallId: optionalId(),
      warrantyMonths: z.union([z.literal(''), z.null(), z.undefined(), z.coerce.number().int().min(0)]).optional().transform(v => (v === '' || v === null || v === undefined) ? null : Number(v)),
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
    if (!d.date || String(d.date).trim() === '') {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'تاریخ فاکتور اجباری است', path: ['date'] });
    }
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
    // اعتبارسنجی آبشاری بر اساس دسته (Category)
    for (let i = 0; i < (d.items || []).length; i++) {
      const it = d.items[i];
      
      // ۱. اگر دسته جوجه، پرنده بالغ یا تخم نطفه‌دار است -> انتخاب پرنده اجباری است
      const isBirdOrEgg = ['chick', 'adult'].includes(d.category) || 
        (d.type === 'purchase' && d.category === 'egg') || 
        (d.type === 'sale' && d.category === 'fertile_egg');
      if (isBirdOrEgg) {
        if (!it.birdId) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'انتخاب پرنده برای این دسته اجباری است',
            path: ['items', String(i), 'birdId'],
          });
        }
      }

      // ۲. اگر دسته دارو است -> انتخاب نوع دارو اجباری است
      if (d.category === 'medicine' && !it.medicineType) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'انتخاب نوع دارو اجباری است',
          path: ['items', String(i), 'medicineType'],
        });
      }

      // ۳. تجهیزات: دسته و نوع اجباری
      const itCat = it.category || d.category;
      if (itCat === 'equipment') {
        if (!it.equipmentCategory) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'دسته تجهیزات اجباری است', path: ['items', String(i), 'equipmentCategory'] });
        }
        if (!it.equipmentType) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'نوع تجهیز اجباری است', path: ['items', String(i), 'equipmentType'] });
        }
      }
      // ۴. سایر: نوع هزینه اجباری
      if (itCat === 'other' && !it.costType) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'نوع هزینه اجباری است', path: ['items', String(i), 'costType'] });
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
    
    // ── محدودیت قیمت واحد ──
    const CATEGORY_MAX_PRICE: Record<string, number> = {
      chick: 30000000,
      adult: 20000000,
      egg: 5000000,
      fertile_egg: 5000000,
      feed: 30000000,
      medicine: 200000000,
      equipment: 20000000000,
      broken: 5000000,
      manure: 5000000,
      other: 5000000000,
    };
    for (let i = 0; i < (d.items || []).length; i++) {
      const it = d.items[i];
      const cat = it.category || d.category;
      const p = (f: string) => ['items', String(i), f];
      
      const maxPrice = CATEGORY_MAX_PRICE[cat];
      if (maxPrice && Number(it.unitPrice) > maxPrice) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: `حداکثر قیمت واحد برای این دسته ${maxPrice.toLocaleString('fa-IR')} تومان است`, path: p('unitPrice') });
      }
      
      if (Number(it.shipping) > 10000000000) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'هزینه حمل حداکثر ۱۰ میلیارد تومان است', path: p('shipping') });
      }
    }
  });
}

export type PaymentFormData = z.infer<typeof PaymentSchema>;
export type InvoiceFormData = z.infer<ReturnType<typeof createInvoiceSchema>>;
