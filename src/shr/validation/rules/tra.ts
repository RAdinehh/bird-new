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
  if (!d.date || String(d.date).trim() === '') {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'تاریخ پرداخت اجباری است', path: ['date'] });
  }
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
  const vFlocks = (ctx as any).flocks as any[] | undefined;
  const vWhsItems = (ctx as any).whsItems as any[] | undefined;
  const vContacts = (ctx as any).contacts as any[] | undefined;
  const vIsEdit = !!(ctx as any).isEdit;
  return z.object({
    type: oneOf('نوع فاکتور', ['purchase', 'sale'] as const),
    date: persianDateOpt('تاریخ'),
    partyId: requiredId('طرف حساب'),
    category: requiredStr('دسته', 1, 40),
    items: z.array(z.object({
      id: z.string(),
      description: optionalStr(200),
      unit: optionalStr(20),
      unitWeight: z.number().min(0).optional().nullable(),
      quantity: floatPos('تعداد', 1_000_000),
      unitPrice: floatNonNeg('قیمت واحد', 1_000_000_000_000),
      total: floatNonNeg('جمع قلم', 1_000_000_000_000_000),
      itemId: optionalId(),
      movementId: optionalId(),
      // 🆕 فیلدهای گم‌شده (Phase A)
      category: optionalStr(40),
      medicineType: optionalStr(30),
      liveWeight: z.union([z.literal(''), z.null(), z.undefined(), z.coerce.number().min(0)]).optional().transform(v => (v === '' || v === null || v === undefined) ? null : Number(v)),
      priceUnit: optionalStr(20),
      saleReason: optionalStr(50),
      equipmentId: optionalId(),
      eggTypes: z.array(z.any()).optional(),
      sourceType: optionalStr(20),
      stockItemId: optionalId(),
      baseQuantity: z.union([z.literal(''), z.null(), z.undefined(), z.coerce.number().min(0)]).optional().transform(v => (v === '' || v === null || v === undefined) ? null : Number(v)),
      healthyCount: z.union([z.literal(''), z.null(), z.undefined(), z.coerce.number().int().min(0)]).optional().transform(v => (v === '' || v === null || v === undefined) ? null : Number(v)),
      existingFlockId: optionalId(),
      deviceId: optionalId(),
      equipmentStatus: optionalStr(20),
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
      if (false && Math.abs(expected - (Number(it.total) || 0)) > 100) {
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

      // ۲. medicineType — فرم فیلد ندارد، اجبار حذف شد (Phase A)

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
      // ۴. سایر: نوع هزینه اجباری — فقط خرید (در فروش field مخفی است)
      if (itCat === 'other' && d.type === 'purchase' && !it.costType) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'نوع هزینه اجباری است', path: ['items', String(i), 'costType'] });
      }
    }

    // 🆕 فروش: چک‌های اختصاصی
    if (d.type === 'sale') {
      for (let i = 0; i < (d.items || []).length; i++) {
        const it = d.items[i];
        const itCat = it.category || d.category;
        const p = (f: string) => ['items', String(i), f];

        // ۱. فروش پرنده: گله مبدأ اجباری
        if (it.birdId && !it.flockId) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'برای فروش پرنده، انتخاب گله مبدأ اجباری است', path: p('flockId') });
        }

        // ۲. adult sale: دلیل فروش اجباری
        if (itCat === 'adult' && !it.saleReason) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'دلیل فروش برای پرنده بالغ اجباری است', path: p('saleReason') });
        }

        // ۳. sale: stockItemId اجباری برای دسته‌های انباری
        const STOCK_NEEDED = ['feed', 'medicine', 'vaccine', 'herbal', 'manure', 'broken'];
        if (STOCK_NEEDED.includes(itCat) && !it.stockItemId) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'انتخاب کالای انبار برای فروش اجباری است', path: p('stockItemId') });
        }

        // ۴. equipment sale: equipmentId اجباری
        if (itCat === 'equipment' && !it.equipmentId) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'انتخاب تجهیز موجود برای فروش اجباری است', path: p('equipmentId') });
        }

        // ۵. withdrawalDays باید null در sale
        if (it.withdrawalDays != null && Number(it.withdrawalDays) > 0) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'دوره پرهیز فقط در خرید ثبت می‌شود', path: p('withdrawalDays') });
        }
      }
    }

    // 🆕 priceUnit = perKg → liveWeight اجباری (همه انواع)
    for (let i = 0; i < (d.items || []).length; i++) {
      const it = d.items[i];
      if (it.priceUnit === 'perKg' && (it.liveWeight == null || Number(it.liveWeight) <= 0)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'برای قیمت به ازای کیلوگرم، وزن زنده اجباری است', path: ['items', String(i), 'liveWeight'] });
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

    // 🆕 Phase B: Cross-module validation
    // 1. طرف حساب — نقش مناسب
    if (vContacts && d.partyId) {
      const party = vContacts.find((c: any) => c.id === d.partyId);
      if (party) {
        const needRole = d.type === 'sale' ? 'customer' : 'supplier';
        if (!Array.isArray(party.roles) || !party.roles.includes(needRole)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: d.type === 'sale'
              ? 'طرف حساب باید نقش «مشتری» داشته باشد'
              : 'طرف حساب باید نقش «فروشنده» داشته باشد',
            path: ['partyId'],
          });
        }
      }
    }

    // 2.5 🆕 سقف اعتبار مشتری (فقط فروش، فقط ایجاد)
    if (d.type === 'sale' && !vIsEdit && vContacts && d.partyId) {
      const party = vContacts.find((c: any) => c.id === d.partyId);
      if (party && party.creditLimit && party.creditLimit > 0) {
        // محاسبه بدهی فعلی از ctx اگر invoices پاس داده شده باشه
        const vInvoices = (ctx as any).invoices as any[] | undefined;
        const vAllocations = (ctx as any).allocations as any[] | undefined;
        if (vInvoices) {
          // محاسبه ساده بدهی: sum(total - paid) برای فاکتورهای sale تسویه‌نشده
          let currentDebt = 0;
          for (const inv of vInvoices) {
            if (inv.partyId !== d.partyId || inv.type !== 'sale') continue;
            const total = Number(inv.total) || 0;
            const paid = (inv.payments || []).reduce((s: number, p: any) => {
              if (p.method === 'check' && p.status === 'bounced') return s;
              if (p.method === 'check' && p.status === 'pending') return s;
              if (p.type === 'refund') return s - (Number(p.amount) || 0);
              return s + (Number(p.amount) || 0);
            }, 0);
            currentDebt += Math.max(0, total - paid);
          }
          const newTotal = Number(d.total) || 0;
          const afterSale = currentDebt + newTotal;
          if (afterSale > party.creditLimit) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: `سقف اعتبار مشتری (${party.creditLimit.toLocaleString('fa-IR')} تومان) — بدهی فعلی: ${currentDebt.toLocaleString('fa-IR')}، این فاکتور: ${newTotal.toLocaleString('fa-IR')}`,
              path: ['partyId'],
            });
          }
        }
      }
    }

    // 2. فروش: موجودی گله/انبار + دوره پرهیز (فقط ایجاد، نه ویرایش)
    if (d.type === 'sale' && !vIsEdit) {
      const todayParts = new Intl.DateTimeFormat('en-u-ca-persian', { year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date());
      const todayJ = `${todayParts.find(x => x.type === 'year')?.value || '0'}/${todayParts.find(x => x.type === 'month')?.value || '01'}/${todayParts.find(x => x.type === 'day')?.value || '01'}`;

      for (let i = 0; i < (d.items || []).length; i++) {
        const it = d.items[i];
        const itCat = it.category || d.category;
        const p = (f: string) => ['items', String(i), f];

        // موجودی گله + دوره پرهیز (chick / adult)
        if (['chick', 'adult'].includes(itCat) && it.flockId && vFlocks) {
          const flock = vFlocks.find((f: any) => f.id === it.flockId);
          if (flock) {
            const qty = Number(it.quantity) || 0;
            const cur = Number(flock.currentCount ?? 0);
            if (qty > cur) {
              ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: `تعداد فروش (${qty}) بیش از موجودی گله (${cur}) است`,
                path: p('quantity'),
              });
            }
            const aw = flock.activeWithdrawal;
            if (aw && aw.until && String(aw.until) >= todayJ) {
              ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: `گله در دوره پرهیز دارویی است (تا ${aw.until}) — فروش ممنوع`,
                path: p('flockId'),
              });
            }
          }
        }

        // موجودی انبار
        if (it.stockItemId && vWhsItems) {
          const w = vWhsItems.find((x: any) => x.id === it.stockItemId);
          if (w) {
            const qty = Number(it.quantity) || 0;
            const cur = Number(w.currentStock ?? 0);
            if (qty > cur) {
              ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: `تعداد فروش (${qty}) بیش از موجودی انبار (${cur}) است`,
                path: p('quantity'),
              });
            }
          }
        }
      }
    }
  });
}

export type PaymentFormData = z.infer<typeof PaymentSchema>;
export type InvoiceFormData = z.infer<ReturnType<typeof createInvoiceSchema>>;
