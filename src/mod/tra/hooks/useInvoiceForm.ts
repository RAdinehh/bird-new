/**
 * useInvoiceForm — state و منطق فرم فاکتور
 */
import { useState, useMemo } from 'react';
import { format as formatJ } from 'date-fns-jalali';
import { toFa, toEn } from '../../../shr/utils/fa';
import { showAlert } from '../../../cor/store/dialog';
import { paidSum, calcItemTotal, type Invoice, type InvoiceItem, type Payment } from '../store';
import { emptyForm as empty, type F } from '../types-invoice';
import { toastMsg } from '../../../cor/store/toast';

export function useInvoiceForm(params: {
  kind: 'purchase' | 'sale';
  invoices: Invoice[];
  contacts: any[];
  addInvoice: (i: any) => string | undefined;
  updateInvoice: (id: string, patch: any) => void;
}) {
  const { kind, invoices, contacts, addInvoice, updateInvoice } = params;
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
  const addItem = () => setForm(f => ({ ...f, items: [...f.items, {
    id: crypto.randomUUID(), description: '', unit: isPurchase ? 'عدد' : 'شانه',
    quantity: 1, unitPrice: 0, total: 0, itemId: '', movementId: '',
    discountType: '', discountValue: 0, shipping: 0,
  }] }));
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

  // باز کردن فرم جدید
  const openNew = () => {
    if (parties.length === 0) { toastMsg.error(isPurchase ? 'اول یک فروشنده بسازید' : 'اول یک مشتری بسازید'); return; }
    const today = formatJ(new Date(), 'yyyy/MM/dd');
    const lastInv = invoices.filter(i => i.type === kind && i.partyId).sort((a, b) => (b.date || '').localeCompare(a.date || ''))[0];
    const defaultParty = lastInv?.partyId || parties[0].id;
    const lastCatInv = invoices.filter(i => i.type === kind && i.category).sort((a, b) => (b.date || '').localeCompare(a.date || ''))[0];
    const defaultCat = lastCatInv?.category;
    const lastPayInv = invoices.filter(i => i.type === kind && i.paymentTerms).sort((a, b) => (b.date || '').localeCompare(a.date || ''))[0];
    const defaultPaymentTerms = lastPayInv?.paymentTerms;
    const lastItems = lastInv?.items || [];
    const defaultItems = lastItems.length > 0 ? lastItems.map(it => ({ ...it, id: crypto.randomUUID() })) : [];
    setForm({
      ...empty(isPurchase), date: today, partyId: defaultParty,
      ...(defaultCat ? { category: defaultCat } : {}),
      ...(defaultPaymentTerms ? { paymentTerms: defaultPaymentTerms } : {}),
      ...(defaultItems.length > 0 ? { items: defaultItems } : {}),
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
    });
    setErr(''); setOpen(true);
  };

  // ذخیره
  const save = () => {
    if (!form.partyId) { setErr(isPurchase ? 'فروشنده اجباری است' : 'مشتری اجباری است'); return; }
    if (!form.date.trim()) { setErr('تاریخ اجباری است'); return; }
    if (form.items.length === 0) { setErr('حداقل یک قلم اضافه کنید'); return; }
    const data: any = {
      type: kind, date: form.date, partyId: form.partyId, category: form.category,
      items: form.items, discount: 0, shipping: 0, total, payments: form.payments,
      dueDate: form.dueDate, relatedFlockId: form.relatedFlockId || '',
      relatedEntryId: '', notes: form.notes.trim(),
      paymentTerms: form.paymentTerms,
      installmentCount: form.paymentTerms === 'installment' ? (parseInt(toEn(form.installmentCount)) || 1) : undefined,
      installmentGapDays: form.paymentTerms === 'installment' ? (parseInt(toEn(form.installmentGapDays)) || 30) : undefined,
      customDueDate: form.paymentTerms === 'custom' ? form.customDueDate : '',
      isPreorder: form.isPreorder,
      deliveryDate: form.isPreorder ? form.deliveryDate : '',
      advancePercent: form.isPreorder && form.advanceType === 'percent' ? num(form.advanceValue) : 0,
      advancePayment: form.isPreorder && form.advanceType === 'amount' ? num(form.advanceValue) : 0,
    };
    if (form.id) updateInvoice(form.id, data); else addInvoice(data);
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
