/**
 * useInvoiceForm — state و منطق فرم فاکتور
 */
import { useState, useMemo } from 'react';
import { format as formatJ } from 'date-fns-jalali';
import { toFa, toEn } from '../../../shr/utils/fa';
import { paidSum, calcItemTotal, generateInstallments, type Invoice, type InvoiceItem, type Payment } from '../store';
import { createInvoiceSchema } from '../../../shr/validation/rules/tra';
import { recordHistory } from '../../../shr/intelligence';
import { emptyForm as empty, type F } from '../types-invoice';
import { toastMsg } from '../../../cor/store/toast';
import { showConfirmAsync } from '../../../cor/store/dialog';

// ═══ نقشه اختصاصی واحد برای دسته‌های فاکتور (خرید/فروش) ═══
function getUnitForCategory(cat: string): string {
  switch (cat) {
    case 'chick': return 'pcs'; // عدد
    case 'adult': return 'pcs';
    case 'egg': return 'pcs';
    case 'fertile_egg': return 'pcs';
    case 'broken': return 'pcs';
    case 'feed': return 'kg'; // کیلوگرم
    case 'medicine': return 'ml'; // بسته (یا ویال)
    case 'equipment': return 'pcs';
    case 'manure': return 'kg';
    default: return 'pcs';
  }
}

export function useInvoiceForm(params: {
  kind: 'purchase' | 'sale';
  invoices: Invoice[];
  contacts: any[];
  addInvoice: (i: any) => string | undefined;
  updateInvoice: (id: string, patch: any) => void;
}) {
  // invoices از پارامترها گرفته می‌شود اما در openNew استفاده نمی‌شود
  // (جلوگیری از کپی داده‌ی قبلی در فرم جدید)
  const { kind, contacts, addInvoice, updateInvoice } = params;
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
  const total = useMemo(
    () => form.items.reduce((acc, it) => {
      const base = (it.quantity || 0) * (it.unitPrice || 0);
      let disc = 0;
      if (it.discountType === 'percent') disc = base * ((it.discountValue || 0) / 100);
      else if (it.discountType === 'amount') disc = it.discountValue || 0;
      return acc + Math.max(0, base - disc) + (it.shipping || 0);
    }, 0),
    [form.items]
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
      nx.total = calcItemTotal(nx.quantity, nx.unitPrice, nx.discountType, nx.discountValue) + (nx.shipping || 0);
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
      payments: form.payments || [],
      dueDate: form.dueDate || '',
      relatedFlockId: form.relatedFlockId || '',
      relatedEntryId: '',
      notes: form.notes?.trim() || '',
      paymentTerms: form.paymentTerms,
      isPreorder: form.isPreorder,
      deliveryDate: form.deliveryDate || '',
    };
    const zodResult = createInvoiceSchema({}).safeParse(validationData);
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
        if (['feed', 'medicine', 'equipment'].includes(cat) && !it.itemId) {
          warnings.push(`• ${label}: به انبار وصل نیست — در موجودی انبار ثبت نمی‌شود.`);
        }
      } else {
        if ((cat === 'chick' || cat === 'adult') && !it.flockId) {
          warnings.push(`• ${label} (${cat === 'chick' ? 'جوجه' : 'بالغ'}): گله مبدا انتخاب نشده — از موجودی گله کم نمی‌شود.`);
        }
      }
    });
    if (warnings.length > 0) {
      const ok = await showConfirmAsync(
        '⚠️ پیش‌نیازهای تکمیل نشده',
        warnings.join('\n') + '\n\nاگر ادامه دهید، این اقلام در بخش‌های مربوطه (گله/انبار) ثبت نمی‌شوند.\nادامه می‌دهید؟',
        { danger: true }
      );
      if (!ok) return;
    }
    // ────────────────────────────────────────
    const data: any = {
      type: kind, date: form.date, partyId: form.partyId, category: form.category,
      items: cleanedItems, discount: 0, shipping: 0, total, payments: form.payments,
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
      data.installments = generateInstallments(total, cnt, gap, form.date, advance);
    } else {
      data.installments = [];
    }
    if (form.id) {
      updateInvoice(form.id, data);
    } else {
      addInvoice(data);
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
