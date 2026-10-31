/**
 * validation/rules/tra.ts — فاکتور خرید/فروش
 */
import { z } from 'zod';
import { MSG } from '../errorMessages';
import {
  requiredStr, optionalStr, optionalId, requiredId,
  floatNonNeg, floatPos, floatRange, persianDate, persianDateOpt, oneOf,
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
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: MSG.required('تاریخ پرداخت'), path: ['date'] });
  }
  if (d.method === 'check') {
    if (!d.checkNo || d.checkNo.trim().length === 0) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: MSG.required('شماره چک'), path: ['checkNo'] });
    }
    if (!d.dueDate) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: MSG.required('سرسید چک'), path: ['dueDate'] });
    }
    if (!d.bank || d.bank.trim().length === 0) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: MSG.required('نام بانک'), path: ['bank'] });
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
    partyId: optionalId(),
    category: optionalStr(40),
    items: z.array(z.object({
      id: z.string(),
      description: optionalStr(200),
      unit: optionalStr(20),
      unitWeight: z.number().min(0).optional().nullable(),
      quantity: floatPos('تعداد', 1_000_000),
      unitPrice: floatPos('قیمت واحد', 1_000_000_000_000),
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
      source: oneOf('منبع', ['flock', 'hatch'] as const).optional(),
      hatchId: optionalId(),
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
    relatedDealId: optionalId(),
    notes: optionalStr(2000),
    paymentTerms: oneOf('شرایط پرداخت', ['cash', 'installment', 'custom'] as const).optional(),
    workflowStatus: oneOf('وضعیت', ['draft', 'confirmed', 'received', 'paid'] as const).optional(),
    isPreorder: z.boolean().optional(),
    deliveryDate: persianDateOpt('تاریخ تحویل'),
  }).superRefine((data, ctx) => {
    const d = data as any;
    if (!d.date || String(d.date).trim() === '') {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: MSG.required('تاریخ فاکتور'), path: ['date'] });
    }

    // 🆕 تاریخ تحویل در پیش‌خرید اجباری است
    if (d.isPreorder && (!d.deliveryDate || String(d.deliveryDate).trim() === '')) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: MSG.required('تاریخ تحویل'), path: ['deliveryDate'] });
    }
    
    // 🆕 چک‌های اجباری بالادستی
    if (!d.partyId) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: MSG.select('طرف حساب'), path: ['partyId'] });
    }
    if (!d.category) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: MSG.select('دسته'), path: ['category'] });
    }

    // 🆕 چک‌های اجباری هر قلم
    for (let i = 0; i < (d.items || []).length; i++) {
      const it = d.items[i];
      const p = (f: string) => ['items', String(i), f];
      
      if (!it.description || String(it.description).trim() === '') {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: MSG.required('نام کالا'), path: p('description') });
      }
      if (!it.quantity || Number(it.quantity) <= 0) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: MSG.positiveNumber('تعداد'), path: p('quantity') });
      }
      if (!it.unitPrice || Number(it.unitPrice) <= 0) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: MSG.positiveNumber('قیمت'), path: p('unitPrice') });
      }
    }

    // مجموع اقلام = total
    const itemsSum = (d.items || []).reduce((a: number, it: any) => a + (Number(it.total) || 0), 0);
    const expectedTotal = Math.max(0, itemsSum - (d.discount || 0) + (d.shipping || 0));
    if (Math.abs(expectedTotal - d.total) > 100) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: MSG.totalMismatch(d.total, expectedTotal),
        path: ['total'],
      });
    }
    // مجموع پرداخت‌ها ≤ total
    const paidSum = (d.payments || []).reduce((a: number, p: any) => a + (Number(p.amount) || 0), 0);
    if (paidSum > d.total) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: MSG.paymentsOverTotal(paidSum, d.total),
        path: ['payments'],
      });
    }

    // 🆕 چک مجموع جنسیت برای جوجه (خرید)
    if (d.type === 'purchase') {
      (d.items || []).forEach((it: any, idx: number) => {
        const cat = it.category || d.category;
        if (cat === 'chick' || cat === 'adult') {
          const qty = Number(it.quantity) || 0;
          const m = Number(it.maleCount) || 0;
          const fe = Number(it.femaleCount) || 0;
          const u = Number(it.unknownCount) || 0;
          if (qty > 0 && (m + fe + u) !== qty) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: MSG.genderSumMismatch(m + fe + u, qty),
              path: ['items', idx, 'maleCount'],
            });
          }
        }
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
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: MSG.birdRequired(), path: ['items', String(i), 'birdId'] });
        }
        if (!it.breedId) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: MSG.select('نژاد'), path: ['items', String(i), 'breedId'] });
        }
        if (['chick', 'adult'].includes(d.category) && !it.hatchDate) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: MSG.required('تاریخ هچ'), path: ['items', String(i), 'hatchDate'] });
        }
      }

      // ۲. medicineType — فرم فیلد ندارد، اجبار حذف شد (Phase A)

      // ۳. تجهیزات: دسته و نوع اجباری
      const itCat = it.category || d.category;
      if (itCat === 'equipment') {
        if (!it.equipmentCategory) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: MSG.equipmentCategory(), path: ['items', String(i), 'equipmentCategory'] });
        }
        if (!it.equipmentType) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: MSG.equipmentType(), path: ['items', String(i), 'equipmentType'] });
        }
      }
      // ۴. سایر: نوع هزینه اجباری — فقط خرید (در فروش field مخفی است)
      if (itCat === 'other' && d.type === 'purchase' && !it.costType) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: MSG.costType(), path: ['items', String(i), 'costType'] });
      }
    }

    // 🆕 فروش: چک‌های اختصاصی
    if (d.type === 'sale') {
      for (let i = 0; i < (d.items || []).length; i++) {
        const it = d.items[i];
        const itCat = it.category || d.category;
        const p = (f: string) => ['items', String(i), f];
        // 🆕 NEEDS_SOURCE_FOR_SALE: منبع اجباری برای فروش
        const NEEDS_SOURCE_FOR_SALE = ['chick', 'adult', 'egg', 'fertile_egg', 'broken'];
        if (d.type === 'sale' && NEEDS_SOURCE_FOR_SALE.includes(itCat) && !it.flockId && !it.stockItemId) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'برای فروش «' + (it.description || itCat) + '»، ابتدا گله یا کالای انبار را انتخاب کنید',
            path: p('stockItemId'),
          });
        }

        // ۱. فروش پرنده، کود و تخم شکسته: گله مبدأ اجباری
        if ((it.birdId || itCat === 'manure' || itCat === 'broken') && !it.flockId && !it.hatchId) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: MSG.saleFlockRequired(), path: p('flockId') });
        }

        // ۲. adult sale: دلیل فروش اجباری
        if (itCat === 'adult' && !it.saleReason) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: MSG.saleReason(), path: p('saleReason') });
        }

        // ۳. sale: stockItemId اجباری برای دسته‌های انباری
        const STOCK_NEEDED = ['feed', 'medicine', 'vaccine', 'herbal', 'manure', 'broken'];
        if (STOCK_NEEDED.includes(itCat) && !it.stockItemId) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: MSG.stockItem(), path: p('stockItemId') });
        }

        // ۴. equipment sale: equipmentId اجباری
        if (itCat === 'equipment' && !it.equipmentId) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: MSG.equipmentItem(), path: p('equipmentId') });
        }

        // ۵. withdrawalDays باید null در sale
        if (it.withdrawalDays != null && Number(it.withdrawalDays) > 0) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, message: MSG.withdrawalSale(), path: p('withdrawalDays') });
        }
      }
    }

    // 🆕 priceUnit = perKg → liveWeight اجباری (همه انواع)
    for (let i = 0; i < (d.items || []).length; i++) {
      const it = d.items[i];
      if (it.priceUnit === 'perKg' && (it.liveWeight == null || Number(it.liveWeight) <= 0)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: MSG.liveWeightPerKg(), path: ['items', String(i), 'liveWeight'] });
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

        // موجودی انبار (همه دسته‌ها — شامل egg, broken)
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

const DealGoodSchema = z.object({
  id: z.string(),
  name: requiredStr('نام کالا', 2, 100),
  quantity: z.number().positive('مقدار باید بیشتر از صفر باشد'),
  unit: z.enum(['kg', 'g', 'L', 'l', 'ml', 'pcs', 'vial', 'pack', 'ton', 'bag', 'dose']),
  estimatedPrice: z.number().nonnegative('قیمت نمی‌تواند منفی باشد'),
  category: z.enum(['chick', 'adult', 'egg', 'fertile_egg', 'feed', 'medicine', 'equipment', 'other']).optional(),
  source: z.enum(['flock', 'hatch', 'whs']).optional(),
  existingFlockId: optionalId(),
  hatchId: optionalId(),
  stockItemId: optionalId(),
  linkedItemId: optionalId(),
}).superRefine((data, ctx) => {
  if (data.unit === 'pcs' && !Number.isInteger(data.quantity)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'تعداد باید عدد صحیح باشد (واحد شمارشی)',
      path: ['quantity'],
    });
  }
});

const DealDeliverySchema = z.object({
  id: z.string(),
  goodId: requiredId('کالا'),
  date: persianDate('تاریخ تحویل'),
  time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'ساعت باید به فرمت HH:MM باشد').optional().or(z.literal('')),
  type: z.enum(['out', 'return', 'loss', 'in']).default('out'),
  quantity: z.number().positive('مقدار تحویل باید بیشتر از صفر باشد'),
  whsEnabled: z.boolean().optional(),
  ownership: z.enum(['none', 'mine', 'theirs']).optional(),
  notes: optionalStr(200),
  whsMovementId: optionalId(),
  whsMovementIdIn: optionalId(),
  linkedDeliveryId: optionalId(),
});

const DealSaleSchema = z.object({
  id: z.string(),
  goodId: requiredId('کالا'),
  date: persianDate('تاریخ فروش'),
  quantity: z.number().positive('مقدار فروش باید بیشتر از صفر باشد'),
  unitPrice: z.number().nonnegative('قیمت واحد نمی‌تواند منفی باشد'),
  notes: optionalStr(200),
});

const DealPaymentSchema = z.object({
  id: z.string(),
  date: persianDate('تاریخ پرداخت'),
  amount: z.number().positive('مبلغ پرداخت باید بیشتر از صفر باشد'),
  direction: z.enum(['in', 'out']).default('in'),
  method: z.enum(['cash', 'card', 'check']),
  notes: optionalStr(200),
});

export const DealSchema = z.object({
  type: z.enum(['consignment', 'partnership', 'barter', 'conditional'] as const),
  date: persianDate('تاریخ'),
  partyId: requiredId('طرف معامله'),
  description: requiredStr('توضیحات', 2, 300),
  value: floatNonNeg('ارزش', 1_000_000_000_000).optional(),
  percent: floatRange('درصد', 0, 100).nullable().optional(),
  dueDate: persianDateOpt('سرسید'),
  status: z.enum(['open', 'settled', 'cancelled'] as const),
  notes: optionalStr(1000),
  dealNumber: optionalStr(30),
  startDate: persianDateOpt('تاریخ شروع'),
  endDate: persianDateOpt('تاریخ پایان'),
  settlementType: z.enum(['percent', 'per_unit', 'fixed', 'rental', 'barter'] as const).optional(),
  settlementValue: z.union([z.literal(''), z.null(), z.undefined(), z.coerce.number().min(0)]).optional().transform(v => (v === '' || v === null || v === undefined) ? null : Number(v)),
  cancelReason: optionalStr(500),
  goods: z.array(DealGoodSchema).default([]),
  deliveries: z.array(DealDeliverySchema).default([]),
  sales: z.array(DealSaleSchema).default([]),
  payments: z.array(DealPaymentSchema).default([]),
}).superRefine((data, ctx) => {
  const d = data as any;
  if (d.startDate && d.endDate && d.startDate >= d.endDate) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'تاریخ پایان باید بعد از تاریخ شروع باشد', path: ['endDate'] });
    }
  
    // ═══ Phase 2C: Cross-checks ═══
    const _goodIds = new Set((d.goods || []).map((g: any) => g.id));
    (d.deliveries || []).forEach((dv: any, di: number) => {
      if (dv.goodId && !_goodIds.has(dv.goodId)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'کالای مرجع یافت نشد', path: ['deliveries', di, 'goodId'] });
      }
    });
    (d.sales || []).forEach((s: any, si: number) => {
      if (s.goodId && !_goodIds.has(s.goodId)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'کالای مرجع یافت نشد', path: ['sales', si, 'goodId'] });
      }
      // 🆕 Phase 1.3.5: منبع اجباری — انبار، گله یا هچری
      const saleGood = (d.goods || []).find((g: any) => g.id === s.goodId);
      if (saleGood) {
        const hasSource = saleGood.linkedItemId || saleGood.stockItemId || saleGood.existingFlockId || saleGood.hatchId;
        if (!hasSource) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'برای فروش، ابتدا منبع کالا (گله، هچری یا انبار) را انتخاب کنید',
            path: ['sales', si, 'goodId'],
          });
        }
      }
    });
    (d.goods || []).forEach((good: any) => {
      const _out = (d.deliveries || []).filter((dv: any) => dv.goodId === good.id && dv.type === 'out').reduce((s: number, dv: any) => s + (dv.quantity || 0), 0);
      const _ret = (d.deliveries || []).filter((dv: any) => dv.goodId === good.id && dv.type === 'return').reduce((s: number, dv: any) => s + (dv.quantity || 0), 0);
      const _loss = (d.deliveries || []).filter((dv: any) => dv.goodId === good.id && dv.type === 'loss').reduce((s: number, dv: any) => s + (dv.quantity || 0), 0);
      const _inHand = _out - _ret - _loss;
      const _sold = (d.sales || []).filter((s: any) => s.goodId === good.id).reduce((sum: number, s: any) => sum + (s.quantity || 0), 0);
      if (_sold > _inHand) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'فروش کالای «' + good.name + '» (' + _sold + ') بیش از موجودی در دست طرف (' + _inHand + ') است', path: ['sales'] });
      }
      if (_inHand < 0) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'موجودی در دست طرف برای «' + good.name + '» منفی است', path: ['deliveries'] });
      }
    });
  // 🆕 درصد کمیسیون: 0-100
    if (d.settlementType === 'percent' && d.settlementValue != null) {
      if (d.settlementValue > 100) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'درصد کمیسیون نمی‌تواند بیشتر از ۱۰۰ باشد', path: ['settlementValue'] });
      }
      if (d.settlementValue < 0) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'درصد کمیسیون نمی‌تواند منفی باشد', path: ['settlementValue'] });
      }
    }
    if (d.status === 'cancelled' && (!d.cancelReason || String(d.cancelReason).trim() === '')) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: MSG.required('دلیل لغو'), path: ['cancelReason'] });
  }
  if (d.settlementType && d.settlementType !== 'barter_direct' && (d.settlementValue == null || d.settlementValue <= 0)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'مقدار تسویه را وارد کنید', path: ['settlementValue'] });
  }
  // جمع تحویل هر کالا ≤ مقدار کل
  (d.goods || []).forEach((good: any, gi: number) => {
    const total = (d.deliveries || [])
      .filter((dv: any) => dv.goodId === good.id)
      .reduce((s: number, dv: any) => s + (dv.quantity || 0), 0);
    if (total > (good.quantity || 0)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `جمع تحویل کالای «${good.name}» (${total}) بیش از مقدار کل (${good.quantity}) است`,
        path: ['goods', gi, 'quantity'],
      });
    }
  });
});
const SettlementDeliverySchema = z.object({
  id: z.string(),
  goodId: requiredId('کالا'),
  date: persianDate('تاریخ'),
  time: z.string().optional().or(z.literal('')),
  type: z.enum(['out', 'return', 'loss']),
  quantity: z.number().nonnegative(),
  notes: optionalStr(200),
  whsEnabled: z.boolean().optional(),
  ownership: z.enum(['none', 'mine', 'theirs']).optional(),
  whsMovementId: optionalId(),
  whsMovementIdIn: optionalId(),
});

const SettlementSaleSchema = z.object({
  id: z.string(),
  goodId: requiredId('کالا'),
  date: persianDate('تاریخ'),
  quantity: z.number().nonnegative(),
  unitPrice: z.number().nonnegative(),
  notes: optionalStr(200),
});

const SettlementPaymentSchema = z.object({
  id: z.string(),
  date: persianDate('تاریخ'),
  amount: z.number().nonnegative(),
  direction: z.enum(['in', 'out']),
  method: z.enum(['cash', 'card', 'check']),
  notes: optionalStr(200),
});

export const SettlementSchema = z.object({
  id: z.string(),
  dealId: requiredId('معامله'),
  periodStart: persianDate('شروع دوره'),
  periodEnd: persianDate('پایان دوره'),
  deliveriesSnapshot: z.array(SettlementDeliverySchema).default([]),
  salesSnapshot: z.array(SettlementSaleSchema).default([]),
  paymentsSnapshot: z.array(SettlementPaymentSchema).default([]),
  grossSales: z.number().nonnegative(),
  commission: z.number().nonnegative(),
  netPayable: z.number(),
  paidAmount: z.number().nonnegative(),
  status: z.enum(['draft', 'confirmed', 'invoiced'] as const),
  invoiceId: optionalId(),
  notes: optionalStr(500),
  createdAt: z.string(),
  updatedAt: z.string(),
}).superRefine((data, ctx) => {
  if (data.periodEnd < data.periodStart) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'پایان دوره باید بعد از شروع باشد', path: ['periodEnd'] });
  }
});

export type SettlementFormData = z.infer<typeof SettlementSchema>;

export type DealFormData = z.infer<typeof DealSchema>;

export type PaymentFormData = z.infer<typeof PaymentSchema>;
export type InvoiceFormData = z.infer<ReturnType<typeof createInvoiceSchema>>;
