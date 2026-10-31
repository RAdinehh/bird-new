/**
 * useInvoiceForm — state و منطق فرم فاکتور
 */
import { useEffect, useState, useMemo } from 'react';
import { verifyInvariantsIfDev } from '../../../shr/dev/invariants';
import { logAction } from '../../../cor/logger/auditLog';
import { format as formatJ } from 'date-fns-jalali';
import { toFa, toEn } from '../../../shr/utils/fa';
import { useFlk } from '../../flk/store';
import { paidSum, calcItemTotal, generateInstallments, type Invoice, type InvoiceItem, type Payment } from '../store';
import { createInvoiceSchema } from '../../../shr/validation/rules/tra';
import { recordHistory } from '../../../shr/intelligence';
import { emptyForm as empty, type F } from '../types-invoice';
import { toastMsg } from '../../../cor/store/toast';
import { showConfirmAsync } from '../../../cor/store/dialog';

import { checkHallCapacity } from '../../flk/api/hallCapacity';
import { useHal } from '../../hal/store';
import { useBreedStandard } from '../../../shr/hooks/useBreedStandard';


// ═══ نقشه استاندارد واحدها (UoM) بر اساس دسته‌بندی ═══
import { UOM_RULES, getDefaultUnit as _getDefaultUnit } from '../../../shr/units/uom';
export type { UOMUnit } from '../../../shr/units/uom';

// 🆕 منبع یکتای UOM — alias به shr/units/uom.ts
export const UOM_CATEGORIES = UOM_RULES;

/** آیا واحد انتخابی نیاز به ضریب دستی (unitWeight) دارد؟ */
export function unitNeedsWeight(cat: string, unit: string): boolean {
  const uom = UOM_CATEGORIES[cat];
  if (!uom) return false;
  const u = uom.units.find(x => x.value === unit);
  return !!u && u.factor === null;
}

/** ضریب تبدیل نهایی: از factor یا unitWeight */
export function resolveUomFactor(cat: string, unit: string, unitWeight?: number | null): number {
  const uom = UOM_CATEGORIES[cat];
  if (!uom) return 1;
  const u = uom.units.find(x => x.value === unit);
  if (!u) return 1;
  if (u.factor !== null) return u.factor;
  return unitWeight && unitWeight > 0 ? unitWeight : 1;
}

export function getUnitForCategory(cat: string): string {
  return UOM_CATEGORIES[cat]?.default || 'pcs';
}

export function useInvoiceForm(params: {
  kind: 'purchase' | 'sale';
  invoices: Invoice[];
  contacts: any[];
  flocks?: any[];
  whsItems?: any[];
  allocations?: any[];
  addInvoice: (i: any) => string | undefined;
  updateInvoice: (id: string, patch: any) => void;
}) {
  // invoices از پارامترها گرفته می‌شود اما در openNew استفاده نمی‌شود
  // (جلوگیری از کپی داده‌ی قبلی در فرم جدید)
  const { kind, contacts, flocks = [], whsItems = [], allocations = [], invoices = [], addInvoice, updateInvoice } = params;
  const isPurchase = kind === 'purchase';

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<F>(empty(isPurchase));
  const [err, setErr] = useState('');


  // محاسبه‌ی parties بر اساس form.category
  const parties = (() => {
    if (!isPurchase) return contacts.filter((c) => c.roles.includes('customer'));
    const allSuppliers = contacts.filter((c) => c.roles.includes('supplier'));
    const cat = form?.category || '';
    if (!cat || cat === 'other') return allSuppliers;
    const matching = allSuppliers.filter((c) =>
      Array.isArray(c.supplierTypes) && c.supplierTypes.includes(cat)
    );
    return matching.length > 0 ? matching : allSuppliers;
  })();

  const num = (s: string) => s ? parseFloat(toEn(s).replace('٫','.')) || 0 : 0;

  // محاسبات
  useEffect(() => {
    let changed = false;
    const newItems = form.items.map(it => {
      const cat = it.category || form.category;
      const unit = it.unit || 'pcs';
      const unitDef = UOM_CATEGORIES[cat]?.units.find((u: any) => u.value === unit);
      const factor = (() => {
        if (unitDef && unitDef.factor !== null) return unitDef.factor;
        if (it.unitWeight) return it.unitWeight;
        // 🆕 adult sale perKg: factor = liveWeight / quantity
        if ((it.priceUnit === 'perKg' || it.priceUnit === 'per_kg') && it.liveWeight && it.liveWeight > 0 && it.quantity && it.quantity > 0) {
          return it.liveWeight / it.quantity;
        }
        return 1;
      })();
      const expected = calcItemTotal(it.quantity || 0, it.unitPrice || 0, it.discountType, it.discountValue, factor) + (it.shipping || 0);
      if (Math.abs(expected - (it.total || 0)) > 0.1) {
        changed = true;
        return { ...it, total: expected };
      }
      return it;
    });
    if (changed) {
      setForm(f => ({ ...f, items: newItems }));
    }
  }, [form.items, form.category]);

  const total = useMemo(
    () => form.items.reduce((acc, it) => {
      const cat = it.category || form.category;
      const unit = it.unit || 'pcs';
      const unitDef = UOM_CATEGORIES[cat]?.units.find((u: any) => u.value === unit);
      const factor = (() => {
        if (unitDef && unitDef.factor !== null) return unitDef.factor;
        if (it.unitWeight) return it.unitWeight;
        // 🆕 adult sale perKg: factor = liveWeight / quantity
        if ((it.priceUnit === 'perKg' || it.priceUnit === 'per_kg') && it.liveWeight && it.liveWeight > 0 && it.quantity && it.quantity > 0) {
          return it.liveWeight / it.quantity;
        }
        return 1;
      })();
      return acc + calcItemTotal(it.quantity || 0, it.unitPrice || 0, it.discountType, it.discountValue, factor) + (it.shipping || 0);
    }, 0),
    [form.items, form.category]
  );
  const paid = useMemo(() => paidSum(form.payments), [form.payments]);
  const rem = Math.max(0, total - paid);

  // اقلام
  const addItem = () => setForm(f => {
    const cat = f.category || (isPurchase ? 'chick' : 'egg');
    const defaultUnit = getUnitForCategory(cat);
    return { ...f, items: [...f.items, {
      id: crypto.randomUUID(), description: '', unit: defaultUnit,
      quantity: 0, unitPrice: 0, total: 0, itemId: '', movementId: '',
      discountType: '', discountValue: 0, shipping: 0,
    }] };
  });
  const updateItem = (id: string, patch: Partial<InvoiceItem>) => {
    setForm(f => ({ ...f, items: f.items.map(x => {
      if (x.id !== id) return x;
      const nx = { ...x, ...patch };
      const cat = nx.category || f.category;
      const unit = nx.unit || 'pcs';
      const unitDef = UOM_CATEGORIES[cat]?.units.find((u: any) => u.value === unit);
      const factor = (() => {
        if (unitDef && unitDef.factor !== null) return unitDef.factor;
        if (nx.unitWeight) return nx.unitWeight;
        // 🆕 adult sale perKg: factor = liveWeight / quantity
        if ((nx.priceUnit === 'perKg' || nx.priceUnit === 'per_kg') && nx.liveWeight && nx.liveWeight > 0 && nx.quantity && nx.quantity > 0) {
          return nx.liveWeight / nx.quantity;
        }
        return 1;
      })();
      nx.total = calcItemTotal(nx.quantity, nx.unitPrice, nx.discountType, nx.discountValue, factor) + (nx.shipping || 0);
      return nx;
    }) }));
  };
  const removeItem = (id: string) => setForm(f => ({ ...f, items: f.items.filter(x => x.id !== id) }));

  // پرداخت‌ها
  const addPayment = () => setForm(f => ({ ...f, payments: [...f.payments, {
    id: crypto.randomUUID(), date: f.date, amount: 0, method: 'cash' as const,
    checkNo: '', bank: '', dueDate: '', notes: '',
  }] }));
  const updatePayment = (id: string, patch: Partial<Payment>) =>
    setForm(f => ({ ...f, payments: f.payments.map(x => x.id === id ? { ...x, ...patch } : x) }));
  const removePayment = (id: string) =>
    setForm(f => ({ ...f, payments: f.payments.filter(x => x.id !== id) }));

  // باز کردن فرم جدید — همیشه خالی (فقط تاریخ امروز)
  // ⚠️ هرگز داده‌ی فاکتور قبلی کپی نمی‌شود (جلوگیری از ساخت تصادفی رکورد تکراری)
  const openNew = () => {
    if (parties.length === 0) { toastMsg.error(isPurchase ? 'اول یک فروشنده بسازید' : 'اول یک مشتری بسازید'); return; }
    const today = formatJ(new Date(), 'yyyy/MM/dd');
    setForm({
      ...empty(isPurchase),
      date: today,
    });
    setErr(''); setOpen(true);
  };

  // ویرایش
  const openEdit = (inv: Invoice) => {
    if (inv.paidAt) {
      toastMsg.error('فاکتور تسویه‌شده — ابتدا Reopen کنید');
      return;
    }
    setForm({
      id: inv.id, date: inv.date, partyId: inv.partyId, category: inv.category,
      items: inv.items || [],
      paymentTerms: inv.paymentTerms || 'cash',
      installmentCount: inv.installmentCount ? toFa(inv.installmentCount) : '1',
      installmentGapDays: inv.installmentGapDays ? toFa(inv.installmentGapDays) : '30',
      customDueDate: inv.customDueDate || '',
      cashDiscountPct: inv.cashDiscountPct ? String(inv.cashDiscountPct) : '',
      cashDiscountDays: inv.cashDiscountDays ? String(inv.cashDiscountDays) : '',
      isPreorder: inv.isPreorder ?? false,
      deliveryDate: inv.deliveryDate || '',
      advanceType: (inv.advancePercent && inv.advancePercent > 0) ? 'percent' : 'amount',
      advanceValue: (inv.advancePercent && inv.advancePercent > 0)
        ? toFa(inv.advancePercent)
        : (inv.advancePayment ? toFa(inv.advancePayment) : ''),
      dueDate: inv.dueDate || '',
      payments: inv.payments || [],
      relatedFlockId: (inv as any).relatedFlockId || '',
      relatedDealId: (inv as any).relatedDealId || '',
      relatedSettlementId: (inv as any).relatedSettlementId,
      sourceType: (inv as any).sourceType,
      notes: inv.notes || '',
      installments: inv.installments || [],
    });
    setErr(''); setOpen(true);
  };

  // ذخیره
  const save = async () => {
    // ═══ فیلتر اقلام کاملاً خالی ═══
    const isEmptyItem = (it: any) =>
      (Number(it.quantity) || 0) === 0 &&
      (Number(it.unitPrice) || 0) === 0 &&
      !String(it.description || '').trim();

    const cleanedItems = (form.items || []).filter((it: any) => !isEmptyItem(it));
    if (cleanedItems.length === 0) {
      setErr('حداقل یک قلم با تعداد یا قیمت وارد کنید');
      return;
    }

    // ═══ فیلتر پرداخت‌های خالی ═══
    const cleanPayments = (form.payments || []).filter((p: any) => (Number(p.amount) || 0) > 0);

    // ═══ اعتبارسنجی Zod (منبع حقیقت) ═══
    const validationData = {
      type: kind,
      date: form.date || '',
      partyId: form.partyId || '',
      category: form.category || '',
      items: cleanedItems.map(it => ({
        ...it,
        category: it.category || form.category,
      })),
      discount: 0,
      shipping: 0,
      total,
      payments: cleanPayments,
      dueDate: form.dueDate || '',
      relatedFlockId: form.relatedFlockId || '',
      relatedEntryId: '',
      relatedDealId: (form as any).relatedDealId || '',
      relatedSettlementId: (form as any).relatedSettlementId,
      sourceType: (form as any).sourceType,
      notes: form.notes?.trim() || '',
      paymentTerms: form.paymentTerms,
      isPreorder: form.isPreorder,
      deliveryDate: form.deliveryDate || '',
    };
    const zodResult = createInvoiceSchema({ flocks, whsItems, contacts, invoices, allocations, isEdit: !!form.id } as any).safeParse(validationData);
    if (!zodResult.success) {
      const firstErr = zodResult.error.issues[0];
      const path = firstErr.path.join('.');
      const itemMatch = path.match(/^items\.(\d+)\./);
      const itemLabel = itemMatch ? `قلم ${toFa(parseInt(itemMatch[1]) + 1)}: ` : '';
      setErr(`${itemLabel}${firstErr.message}`);
      return;
    }
    // ═══ پایان اعتبارسنجی Zod ═══
    
    if (!form.partyId) { setErr(isPurchase ? 'فروشنده اجباری است' : 'مشتری اجباری است'); return; }
    if (!form.date.trim()) { setErr('تاریخ اجباری است'); return; }


    // ─── اعتبارسنجی نرم (Soft Validation) ───
    const warnings: string[] = [];
    cleanedItems.forEach((it, idx) => {
      const cat = it.category || form.category;
      const label = `قلم ${toFa(idx + 1)}`;
      if (kind === 'purchase') {
        if ((cat === 'chick' || cat === 'adult') && !it.breedId && !it.birdId) {
          warnings.push(`• ${label} (${cat === 'chick' ? 'جوجه' : 'بالغ'}): نژاد/پرنده انتخاب نشده — گله ساخته نمی‌شود.`);
        }
        if (['feed', 'medicine', 'vaccine', 'herbal', 'equipment', 'other'].includes(cat) && !it.itemId) {
          warnings.push(`• ${label}: به انبار وصل نیست — سیستم به طور خودکار کالای جدید ثبت می‌کند.`);
        }
      } else {
        if ((cat === 'chick' || cat === 'adult') && !it.flockId) {
          warnings.push(`• ${label} (${cat === 'chick' ? 'جوجه' : 'بالغ'}): گله مبدا انتخاب نشده — از موجودی گله کم نمی‌شود.`);
        }
      }
    });
    if (warnings.length > 0) {
      const ok = await showConfirmAsync(
        '⚠️ تأیید ذخیره فاکتور',
        warnings.join('\n') + '\n\nبا تأیید شما، سیستم به طور خودکار کالاهای جدید را در انبار ثبت و لینک می‌کند.\nادامه می‌دهید؟',
        {}
      );
      if (!ok) return;
    }
    // ────────────────────────────────────────
    // ═══ چک گله تکراری + دیالوگ تأیید (Odoo/SAP standard) ═══
    // 🆕 فیکس: اگر کاربر از قبل گله موجود را انتخاب کرده، پیام تکراری نده
    const hasExistingLink = cleanedItems.some((it: any) => it.existingFlockId);
    if (kind === 'purchase' && !hasExistingLink) {
      const flkState = useFlk.getState();
      const duplicates: Array<{ item: any; dup: any }> = [];
      for (const it of cleanedItems as any[]) {
        const cat = it.category || form.category;
        if (cat !== 'chick' && cat !== 'adult') continue;
        if (it.existingFlockId) continue;
        if (!it.birdId || !it.breedId) continue;
        const incomingHall = String(it.hallId || '');
        const dup = flkState.flocks.find((f: any) =>
          f.status === 'active' &&
          (f.birdId || '') === it.birdId &&
          (f.breedId || '') === it.breedId &&
          String(f.hallId || '') === incomingHall
        );
        if (dup) duplicates.push({ item: it, dup });
      }

      if (duplicates.length > 0) {
        const dup = duplicates[0].dup;
        const hallHint = dup.hallId ? '' : ' (بدون سالن)';
        const count = duplicates.length;
        const msg =
          `گله مشابه موجود است:\n«${dup.name}»${hallHint}\n` +
          `${toFa(dup.currentCount || 0)} پرنده\n\n` +
          (count > 1 ? `(${toFa(count)} مورد مشابه یافت شد)\n\n` : '') +
          `با تأیید، گله جدید ساخته می‌شود.\n` +
          `برای اتصال به گله موجود، «لغو» را بزنید و از «اتصال به گله» استفاده کنید.`;

        const ok = await showConfirmAsync('⚠️ گله تکراری', msg, {
          confirmText: 'ادامه بده',
          cancelText: 'لغو',
        });
        if (!ok) {
          return;
        }
        try {
          logAction('other', 'tra', `تایید ساخت گله تکراری — ${count} مورد: ${dup.name}`);
        } catch {}
      }
    }

    // ═══ 🆕 VALIDATION: چک ظرفیت سالن/بخش (Over-stocking & Transfer) ═══
    if (kind === 'purchase') {
      const flkState = useFlk.getState();
      const halState = useHal.getState();
      const breedStd = useBreedStandard();

      for (const it of cleanedItems) {
        const cat = it.category || form.category;
        if (cat !== 'chick' && cat !== 'adult') continue;
        
        const newCount = Number(it.healthyCount ?? it.quantity) || 0;
        if (newCount <= 0) continue;

        if (it.existingFlockId) {
          // جابه‌جایی یا افزایش گله موجود
          const f = flkState.flocks.find(x => x.id === it.existingFlockId);
          if (!f) continue;
          
          const targetHallId = it.hallId || f.hallId;
          const targetZoneId = it.zoneId !== undefined ? it.zoneId : f.zoneId;
          
          if (targetHallId) {
            const totalFutureCount = (f.currentCount || 0) + newCount;
            const capCheck = checkHallCapacity(
              targetHallId, targetZoneId, totalFutureCount, 
              flkState.flocks, halState.halls, halState.zones, 
              breedStd, it.existingFlockId, it.breedId || f.breedId // excludeFlockId: گله خودش را از ظرفیت قبلی کم می‌کند
            );

            if (capCheck && !capCheck.ok) {
              const scope = capCheck.scope === 'zone' ? `بخش ${capCheck.scopeName}` : `سالن ${capCheck.scopeName}`;
              const msg = `انتقال/افزایش گله به ${scope} ممکن نیست: ظرفیت تکمیل است.\n` +
                          `ظرفیت کل: ${toFa(capCheck.capacity)}\n` +
                          `استفاده شده (با احتساب انتقال): ${toFa(capCheck.current)}\n` +
                          `بیشبود: ${toFa(capCheck.over)} پرنده`;
              setErr(msg);
              return;
            }
          }
        } else {
          // ایجاد گله جدید
          const hallId = it.hallId || '';
          const zoneId = it.zoneId || '';
          
          if (hallId) {
            const capCheck = checkHallCapacity(
              hallId, zoneId, newCount, 
              flkState.flocks, halState.halls, halState.zones, 
              breedStd, undefined, it.breedId
            );

            if (capCheck && !capCheck.ok) {
              const scope = capCheck.scope === 'zone' ? `بخش ${capCheck.scopeName}` : `سالن ${capCheck.scopeName}`;
              const msg = `ظرفیت ${scope} تکمیل است.\n` +
                          `ظرفیت کل: ${toFa(capCheck.capacity)}\n` +
                          `استفاده شده: ${toFa(capCheck.current)}\n` +
                          `بیشبود: ${toFa(capCheck.over)} پرنده`;
              setErr(msg);
              return;
            }
          }
        }
      }
    }

    const data: any = {
      type: kind, date: form.date, partyId: form.partyId, category: form.category,
      items: cleanedItems, discount: 0, shipping: 0, total, payments: cleanPayments,
      dueDate: form.dueDate, relatedFlockId: form.relatedFlockId || '',
      relatedEntryId: '', notes: form.notes.trim(),
      paymentTerms: form.paymentTerms,
      installmentCount: form.paymentTerms === 'installment' ? (parseInt(toEn(form.installmentCount)) || 1) : undefined,
      installmentGapDays: form.paymentTerms === 'installment' ? (parseInt(toEn(form.installmentGapDays)) || 30) : undefined,
      customDueDate: form.paymentTerms === 'custom' ? form.customDueDate : '',
      cashDiscountPct: form.cashDiscountPct ? parseFloat(toEn(form.cashDiscountPct)) : undefined,
      cashDiscountDays: form.cashDiscountDays ? parseInt(toEn(form.cashDiscountDays)) : undefined,
      isPreorder: form.category === 'other' ? false : form.isPreorder,
      deliveryDate: (form.category !== 'other' && form.isPreorder) ? form.deliveryDate : '',
      advancePercent: form.isPreorder && form.advanceType === 'percent' ? num(form.advanceValue) : 0,
      advancePayment: form.isPreorder ? (
        form.advanceType === 'percent' 
          ? (total * (num(form.advanceValue) / 100)) 
          : num(form.advanceValue)
      ) : 0,
    };
    if (form.paymentTerms === 'installment') {
      const cnt = parseInt(toEn(form.installmentCount)) || 0;
      const gap = parseInt(toEn(form.installmentGapDays)) || 30;
      const advance = form.isPreorder ? (
        form.advanceType === 'percent' 
          ? (total * (num(form.advanceValue) / 100)) 
          : num(form.advanceValue)
      ) : 0;
      const savedInst = form.installments || [];
      const savedSum = savedInst.reduce((a: number, x: any) => a + (x.amount || 0), 0);
      const expectedSum = Math.max(0, total - advance);
      const isStale = savedInst.length !== cnt || Math.abs(savedSum - expectedSum) > 100;
      if (savedInst.length > 0 && !isStale) {
        data.installments = savedInst;
      } else {
        data.installments = generateInstallments(total, cnt, gap, form.date, advance);
      }
    } else {
      data.installments = [];
    }
    if (form.id) {
      updateInvoice(form.id, data);
      verifyInvariantsIfDev();
      verifyInvariantsIfDev();
    } else {
      try {
        addInvoice(data);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        setErr('ذخیره ناموفق: ' + msg);
        return;
      }
      verifyInvariantsIfDev();
      verifyInvariantsIfDev();
    }

    // ثبت تاریخچه برای سیستم هوشمند
    try {
      for (const it of form.items) {
        const cat = it.category || form.category;
        if (it.unitPrice && it.unitPrice > 0) recordHistory(`tra.price_${cat}`, it.unitPrice, {});
        if (it.quantity && it.quantity > 0) recordHistory('tra.quantity', it.quantity, {});
        if (it.discountValue && it.discountValue > 0) recordHistory('tra.discountValue', it.discountValue, {});
        if (it.shipping && it.shipping > 0) recordHistory('tra.shipping', it.shipping, {});
      }
    } catch { /* silent */ }

    // پاک کردن draft بعد از ذخیره موفق
    setOpen(false);
  };

  return {
    open, setOpen, form, setForm, err, setErr, parties,
    total, paid, rem, num,
    addItem, updateItem, removeItem,
    addPayment, updatePayment, removePayment,
    openNew, openEdit, save,
  };
}