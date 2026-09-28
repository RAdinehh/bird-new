import { useState, useMemo, useEffect } from 'react';
import { useTra, CATEGORIES, PAYMENT_LABEL, itemTotal, itemsSum, paidSum, invoiceStatus, remaining, STATUS_LABEL, type Invoice, type InvoiceItem, type Payment , calcDueDate , type WorkflowStatus, nextWorkflowStatus, workflowTone, WORKFLOW_LABEL, prevWorkflowStatus , calcItemTotal, calcItemDiscount } from './store';
import { useWhs, UNIT_LABEL } from '../whs/store';
import { useCtc } from '../ctc/store';
import { Btn, BtnRow, Empty, Field, Grid2, Grid3, Input, Modal, PageContainer, Select, Tag } from '../../shr/components/ui'
import SmartSelect from '../../shr/components/SmartSelect';
import ExpandableCard from '../../shr/components/ExpandableCard';
import DatePicker from '../../shr/components/DatePicker';
import InvoicePrint from './InvoicePrint';
import { toFa, toEn } from '../../shr/utils/fa';
import { showAlert } from '../../cor/store/dialog';
import HelpBanner from '../../shr/components/HelpBanner';

interface F {
  id?: string;
  date: string; partyId: string; category: string;
  items: InvoiceItem[];
  discount: string; shipping: string;
  paymentTerms: 'cash' | 'installment' | 'custom';
  installmentCount: string;
  installmentGapDays: string;
  customDueDate: string;
  paymentNote: string;
  isPreorder: boolean;
  deliveryDate: string;
  advanceType: 'percent' | 'amount';
  advanceValue: string;
  advanceNote: string;
  dueDate: string;
  payments: Payment[];
  notes: string;
}

const empty = (): F => ({
   date: '', partyId: '', category: 'egg',
  items: [],
  discount: '', shipping: '',
  paymentTerms: 'cash', installmentCount: '1', installmentGapDays: '30',
  customDueDate: '', paymentNote: '',
  isPreorder: false, deliveryDate: '',
  advanceType: 'percent', advanceValue: '', advanceNote: '',
  dueDate: '',
  payments: [],
  notes: ''
});

export default function PurchasesPage() {
  const { invoices, addInvoice, updateInvoice, deleteInvoice } = useTra();
  const { contacts } = useCtc();
  const { items: whsItems } = useWhs();
  const suppliers = contacts.filter(c => c.roles.includes('supplier'));

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<F>(empty());
  const [err, setErr] = useState('');
  const [delId, setDelId] = useState<string | null>(null);
  const [filterCat, setFilterCat] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // همگام‌سازی خودکار سرسید (syncDueDateEffect)
  useEffect(() => {
    if (!open) return;
    setForm(f => {
      if (!f.date) return f;
      let newDue = f.dueDate;
      if (f.paymentTerms === 'cash') {
        newDue = f.date;
      } else if (f.paymentTerms === 'custom') {
        newDue = f.customDueDate || f.date;
      } else if (f.paymentTerms === 'installment') {
        const gap = parseInt(toEn(f.installmentGapDays)) || 30;
        newDue = calcDueDate('installment', f.date, '', gap);
      }
      if (newDue !== f.dueDate) return { ...f, dueDate: newDue };
      return f;
    });
  }, [open, form.date, form.paymentTerms, form.customDueDate, form.installmentGapDays]);

  // همگام‌سازی خودکار سرسید
  useEffect(() => {
    if (!open) return;
    setForm(f => {
      if (f.paymentTerms === 'cash' && f.date !== f.dueDate) {
        return { ...f, dueDate: f.date };
      }
      if (f.paymentTerms === 'custom') {
        return { ...f, dueDate: f.customDueDate || f.date };
      }
      if (f.paymentTerms === 'installment') {
        const gap = parseInt(toEn(f.installmentGapDays)) || 30;
        const newDate = calcDueDate('installment', f.date, '', gap);
        if (newDate !== f.dueDate) return { ...f, dueDate: newDate };
      }
      return f;
    });
  }, [open, form.date, form.paymentTerms, form.customDueDate, form.installmentGapDays, form.installmentCount]);
  const [transferModal, setTransferModal] = useState<{ id: string; to: WorkflowStatus } | null>(null);
  const [transferNote, setTransferNote] = useState('');
  const [transferDate, setTransferDate] = useState('');
  const [printId, setPrintId] = useState<string | null>(null);

  const list = useMemo(() => {
    let arr = invoices.filter(i => i.type === 'purchase');
    if (filterCat) arr = arr.filter(i => i.category === filterCat);
    return arr.sort((a, b) => b.date.localeCompare(a.date));
  }, [invoices, filterCat]);

  const openNew = () => {
    if (suppliers.length === 0) { showAlert('اول یک فروشنده در مخاطبین بسازید'); return; }
    setForm({ ...empty(), partyId: suppliers[0].id });
    setErr(''); setOpen(true);
  };

  const openEdit = (inv: Invoice) => {
    setForm({
      id: inv.id,  date: inv.date, partyId: inv.partyId, category: inv.category,
      items: inv.items || [],
      discount: inv.discount ? toFa(inv.discount) : '',
      shipping: inv.shipping ? toFa(inv.shipping) : '',
      dueDate: inv.dueDate || '',
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
      advanceNote: '',
      paymentNote: inv.paymentNote || '',
      payments: inv.payments || [],
      notes: inv.notes || ''
    });
    setErr(''); setOpen(true);
  };

  const doTransfer = () => {
    if (!transferModal) return;
    const inv = invoices.find(i => i.id === transferModal.id);
    if (!inv) return;

    const patch: Partial<Invoice> = { workflowStatus: transferModal.to };

    if (transferModal.to === 'confirmed') {
      patch.confirmedAt = transferDate || new Date().toISOString();
    } else if (transferModal.to === 'received') {
      patch.receivedAt = transferDate || new Date().toISOString();
      patch.receivedNote = transferNote;
    } else if (transferModal.to === 'paid') {
      patch.paidAt = transferDate || new Date().toISOString();
      patch.paidNote = transferNote;
    }

    updateInvoice(inv.id, patch);
    setTransferModal(null);
    setTransferNote('');
    setTransferDate('');
  };

  const num = (s: string) => s ? parseFloat(toEn(s).replace('٫','.')) || 0 : 0;

  const subtotal = useMemo(() => itemsSum(form.items), [form.items]);
  const total = useMemo(() => subtotal - num(form.discount) + num(form.shipping), [subtotal, form]);
  const paid = useMemo(() => paidSum(form.payments), [form.payments]);
  const rem = Math.max(0, total - paid);

  const addItem = () => {
    setForm(f => ({ ...f, items: [...f.items, { id: crypto.randomUUID(), description:'', unit:'عدد', quantity:1, unitPrice:0, total:0, itemId:'', movementId:'' }] }));
  };
  const updateItem = (id: string, patch: Partial<InvoiceItem>) => {
    setForm(f => ({
      ...f,
      items: f.items.map(x => {
        if (x.id === id) {
          const nx = { ...x, ...patch };
          nx.total = itemTotal(nx.quantity, nx.unitPrice);
          return nx;
        }
        return x;
      })
    }));
  };
  const removeItem = (id: string) => setForm(f => ({ ...f, items: f.items.filter(x => x.id === id) }));

  const addPayment = () => {
    setForm(f => ({ ...f, payments: [...f.payments, { id: crypto.randomUUID(), date:'', amount:0, method:'cash', checkNo:'', bank:'', dueDate:'', notes:'' }] }));
  };
  const updatePayment = (id: string, patch: Partial<Payment>) => {
    setForm(f => ({ ...f, payments: f.payments.map(x => x.id === id ? { ...x, ...patch } : x) }));
  };
  const removePayment = (id: string) => setForm(f => ({ ...f, payments: f.payments.filter(x => x.id === id) }));

  const save = () => {
    if (form.partyId === '') { setErr('فروشنده اجباری است'); return; }
    if (form.date.trim() === '') { setErr('تاریخ اجباری است'); return; }
    if (form.items.length === 0) { setErr('حداقل یک قلم اضافه کنید'); return; }
    if (paid > total) { setErr('مجموع پرداخت‌ها از قیمت نهایی بیشتر است'); return; }

    const data = {
      type: 'purchase' as const,

      date: form.date.trim(),
      partyId: form.partyId,
      category: form.category,
      items: form.items,
      discount: num(form.discount),
      shipping: num(form.shipping),
      total,
      payments: form.payments,
      dueDate: form.dueDate.trim(),
      paymentTerms: form.paymentTerms,
      installmentCount: form.paymentTerms === 'installment' ? (parseInt(toEn(form.installmentCount)) || 1) : undefined,
      installmentGapDays: form.paymentTerms === 'installment' ? (parseInt(toEn(form.installmentGapDays)) || 30) : undefined,
      customDueDate: form.paymentTerms === 'custom' ? form.customDueDate : '',
      paymentNote: form.paymentNote.trim(),
      isPreorder: form.isPreorder,
      deliveryDate: form.isPreorder ? form.deliveryDate : '',
      advancePercent: form.isPreorder && form.advanceType === 'percent'
        ? (parseFloat(toEn(form.advanceValue).replace('٫','.')) || 0)
        : 0,
      advancePayment: form.isPreorder && form.advanceType === 'amount'
        ? (parseFloat(toEn(form.advanceValue).replace('٫','.')) || 0)
        : 0,
      relatedFlockId: '',
      relatedEntryId: '',
      notes: form.notes.trim()
    };
    if (form.id === undefined) {
      addInvoice(data);
    } else {
      updateInvoice(form.id, data);
    }
    setOpen(false);
  };

  const target = delId ? invoices.find(i => i.id === delId) : null;

  return (
    <PageContainer>
        <HelpBanner
          id="purchases-intro"
          icon="📥"
          title="ثبت خرید از فروشنده"
          description="اگر می‌خواهید این خرید به انبار اضافه شود، در بخش اقلام گزینه «اتصال به انبار» را فعال کنید. قیمت و تعداد از فاکتور به‌طور خودکار به انبار منتقل می‌شود."
          tone="success"
        />
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
        <button onClick={() => setFilterCat('')} style={chip(filterCat === '')}>
          همه ({toFa(invoices.filter(i => i.type === 'purchase').length)})
        </button>
        {CATEGORIES.purchase.map(([v, l]) => {
          const c = invoices.filter(i => i.type === 'purchase' && i.category === v).length;
          if (c === 0) return null;
          return (
            <button key={v} onClick={() => setFilterCat(v)} style={chip(filterCat === v)}>
              {l} ({toFa(c)})
            </button>
          );
        })}
      </div>

      {list.length === 0 ? (
        <Empty
          icon={<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><path d="M3 3h18v18H3zM3 9h18M9 21V9"/></svg>}
          title="هنوز خریدی ثبت نشده"
          desc={suppliers.length === 0 ? 'اول از ماژول مخاطبین یک فروشنده بسازید.' : 'اولین خرید خود را ثبت کنید.'}
          action={<Btn variant="primary" onClick={openNew}>+ ثبت خرید</Btn>}
        />
      ) : (
        <>
          {list.map((inv, i) => {
            const sup = contacts.find(c => c.id === inv.partyId);
            const st = invoiceStatus(inv);
            const rem2 = remaining(inv);
            const catLabel = CATEGORIES.purchase.find(x => x[0] === inv.category)?.[1] || inv.category;
            const accent = st === 'paid' ? 'accent' : rem2 > 0 ? 'warn' : 'dim';
            const isOpen = expandedId === inv.id;
            return (
              <ExpandableCard
                key={inv.id}
                accent={accent}
                index={toFa(i + 1)}
                iconEmoji="🛒"
                title={`${catLabel} — ${toFa(inv.total.toLocaleString('fa-IR'))} ت`}
                subtitle={`${sup?.name || '—'} · ${toFa(inv.date)}${inv.number ? ` · ${inv.number}` : ''}`}
                isOpen={isOpen}
                onToggle={() => setExpandedId(isOpen ? null : inv.id)}
                badge={
                  <div style={{ display: 'flex', gap: 4 }}>
                    <Tag tone={workflowTone(inv.workflowStatus)}>
                      {WORKFLOW_LABEL[inv.workflowStatus || 'draft']}
                    </Tag>
                    <Tag tone={st === 'paid' ? 'green' : st === 'partial' ? 'amber' : 'red'}>
                      {STATUS_LABEL[st]}
                    </Tag>
                  </div>
                }
                summary={
                  <>
                    <span>کل: <b style={{ color: 'var(--text)' }}>{toFa(inv.total.toLocaleString('fa-IR'))} ت</b></span>
                    {rem2 > 0 && <span style={{ color: 'var(--warn)' }}>مانده: <b>{toFa(rem2.toLocaleString('fa-IR'))}</b></span>}
                    {inv.items.length > 0 && <span>{toFa(inv.items.length)} قلم</span>}
                  </>
                }
              >
                <SectionTitle>📋 اطلاعات فاکتور</SectionTitle>
                <Row l="فروشنده" v={sup?.name || '—'} />
                <Row l="تاریخ" v={toFa(inv.date)} />
                {inv.number ? <Row l="شماره" v={inv.number} /> : null}
                {inv.dueDate ? <Row l="سرسید" v={toFa(inv.dueDate)} /> : null}
                {inv.isPreorder && inv.deliveryDate ? (
                  <>
                    <Row l="📅 تاریخ تحویل" v={toFa(inv.deliveryDate)} />
                    {inv.advancePercent && inv.advancePercent > 0 ? (
                      <Row l="💵 پیش‌پرداخت" v={`${toFa(inv.advancePercent)}٪`} />
                    ) : null}
                    {inv.advancePayment && inv.advancePayment > 0 ? (
                      <Row l="💵 پیش‌پرداخت" v={`${toFa(inv.advancePayment.toLocaleString('fa-IR'))} ت`} />
                    ) : null}
                  </>
                ) : null}

                {/* دکمه‌های workflow */}
                {nextWorkflowStatus(inv.workflowStatus) && (
                  <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                    <Btn
                      size="sm"
                      variant="primary"
                      full
                      onClick={() => {
                        const next = nextWorkflowStatus(inv.workflowStatus);
                        if (next) setTransferModal({ id: inv.id, to: next });
                      }}
                    >
                      ▶️ {WORKFLOW_LABEL[nextWorkflowStatus(inv.workflowStatus)!]}
                    </Btn>
                  </div>
                )}

                {inv.items.length > 0 ? (
                  <>
                    <SectionTitle>📦 اقلام</SectionTitle>
                    {inv.items.map(it => (
                      <div key={it.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--fs-sm)', padding: '6px 10px', background: 'var(--input-bg)', borderRadius: 'var(--r-sm)' }}>
                        <span>{it.description || '—'} × {toFa(it.quantity)}</span>
                        <span style={{ fontWeight: 600 }}>{toFa(it.total.toLocaleString('fa-IR'))} ت</span>
                      </div>
                    ))}
                  </>
                ) : null}

                <SectionTitle>💰 مالی</SectionTitle>
                {inv.discount > 0 ? <Row l="تخفیف" v={`${toFa(inv.discount.toLocaleString('fa-IR'))} ت`} /> : null}
                {inv.shipping > 0 ? <Row l="حمل" v={`${toFa(inv.shipping.toLocaleString('fa-IR'))} ت`} /> : null}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--fs-sm)', padding: '8px 10px', background: 'var(--accent-soft)', color: 'var(--accent)', borderRadius: 'var(--r-sm)', fontWeight: 700 }}>
                  <span>قیمت نهایی:</span>
                  <span>{toFa(inv.total.toLocaleString('fa-IR'))} ت</span>
                </div>
                <Row l="پرداخت‌شده" v={`${toFa(paidSum(inv.payments || []).toLocaleString('fa-IR'))} ت`} />
                {rem2 > 0 ? (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--fs-sm)', padding: '8px 10px', background: 'var(--warn-soft)', color: 'var(--warn)', borderRadius: 'var(--r-sm)', fontWeight: 700 }}>
                    <span>مانده:</span>
                    <span>{toFa(rem2.toLocaleString('fa-IR'))} ت</span>
                  </div>
                ) : null}

                {(inv.payments || []).length > 0 ? (
                  <>
                    <SectionTitle>💳 پرداخت‌ها</SectionTitle>
                    {inv.payments.map(p => (
                      <div key={p.id} style={{ fontSize: 'var(--fs-sm)', padding: '6px 10px', background: 'var(--input-bg)', borderRadius: 'var(--r-sm)', display: 'flex', justifyContent: 'space-between' }}>
                        <span>{PAYMENT_LABEL[p.method]}{p.date ? ` · ${toFa(p.date)}` : ''}</span>
                        <span style={{ fontWeight: 600 }}>{toFa(p.amount.toLocaleString('fa-IR'))} ت</span>
                      </div>
                    ))}
                  </>
                ) : null}

                {inv.notes ? (
                  <>
                    <SectionTitle>📝 یادداشت</SectionTitle>
                    <div style={{ fontSize: 'var(--fs-sm)', lineHeight: 1.7, padding: '8px 10px', background: 'var(--input-bg)', borderRadius: 'var(--r-sm)' }}>{inv.notes}</div>
                  </>
                ) : null}

                <div style={{ display: 'flex', gap: 6, paddingTop: 4 }}>
                  <Btn size="sm" onClick={() => setPrintId(inv.id)} style={{ flex: 1 }}>🖨 چاپ</Btn>
                  <Btn size="sm" onClick={() => openEdit(inv)} style={{ flex: 1 }}>ویرایش</Btn>
                  <Btn size="sm" onClick={() => setDelId(inv.id)} style={{ flex: 1 }}>حذف</Btn>
                </div>
              </ExpandableCard>
            );
          })}
          <Btn variant="primary" full onClick={openNew}>+ ثبت خرید</Btn>
        </>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={form.id ? 'ویرایش خرید' : 'ثبت خرید'}
        footer={<BtnRow><Btn variant="primary" onClick={save}>ذخیره</Btn><Btn onClick={() => setOpen(false)}>لغو</Btn></BtnRow>}
      >
        <Grid2>
          <Field label="تاریخ" required><DatePicker value={form.date} onChange={v => setForm({...form, date: v})} /></Field>
          <Field label="دسته">
            <Select value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
              {CATEGORIES.purchase.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </Select>
          </Field>
        </Grid2>

        <Field label="فروشنده" required>
          <SmartSelect
            value={form.partyId}
            onChange={v => setForm({...form, partyId: v})}
            options={suppliers.map(c => ({
              value: c.id,
              label: c.name,
              subtitle: c.phone || undefined,
            }))}
            placeholder="— انتخاب کنید —"
            modalTitle="انتخاب فروشنده"
            autoThreshold={6}
          />
        </Field>

        <SectionTitle>
          📦 اقلام — جمع: {toFa(subtotal.toLocaleString('fa-IR'))} ت
        </SectionTitle>

        {form.items.map((it, idx) => (
          <div key={it.id} style={{ padding: '10px 12px', background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', fontWeight: 700 }}>قلم {toFa(idx+1)}</span>
              <button type="button" onClick={() => removeItem(it.id)} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 14 }}>✕</button>
            </div>
            <Input placeholder="توضیح" value={it.description} onChange={e => updateItem(it.id, { description: e.target.value })} />
            <Grid3>
              <Field label="واحد"><Input placeholder="عدد" value={it.unit} onChange={e => updateItem(it.id, { unit: e.target.value })} /></Field>
              <Field label="تعداد"><Input mode="number" value={String(it.quantity)} onChange={e => updateItem(it.id, { quantity: parseFloat(toEn(e.target.value).replace('٫','.')) || 0 })} /></Field>
              <Field label="قیمت"><Input mode="number" value={String(it.unitPrice)} onChange={e => updateItem(it.id, { unitPrice: parseFloat(toEn(e.target.value).replace('٫','.')) || 0 })} /></Field>
            </Grid3>

            {/* تخفیف هر قلم (اختیاری) */}
            {it.discountType ? (
              <div style={{ padding: '8px 10px', background: 'var(--warn-soft)', borderRadius: 'var(--r-sm)', display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--warn)', fontWeight: 700 }}>💰 تخفیف قلم</span>
                  <button
                    type="button"
                    onClick={() => updateItem(it.id, { discountType: '', discountValue: 0 })}
                    style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12 }}
                  >
                    حذف تخفیف
                  </button>
                </div>
                <Grid2>
                  <Field label="نوع">
                    <Select
                      value={it.discountType || 'percent'}
                      onChange={e => updateItem(it.id, { discountType: e.target.value as 'percent' | 'amount' })}
                    >
                      <option value="percent">درصد (٪)</option>
                      <option value="amount">مبلغ (ت)</option>
                    </Select>
                  </Field>
                  <Field label="مقدار">
                    <Input
                      mode="number"
                      value={String(it.discountValue || '')}
                      onChange={e => updateItem(it.id, { discountValue: parseFloat(toEn(e.target.value).replace('٫','.')) || 0 })}
                      unit={it.discountType === 'percent' ? '٪' : 'ت'}
                    />
                  </Field>
                </Grid2>
                <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--warn)', fontWeight: 600, textAlign: 'left' }}>
                  تخفیف: {toFa(calcItemDiscount(it.quantity, it.unitPrice, it.discountType, it.discountValue).toLocaleString('fa-IR'))} ت
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => updateItem(it.id, { discountType: 'percent', discountValue: 0 })}
                style={{
                  padding: '4px 10px', background: 'transparent',
                  border: '1px dashed var(--border)', borderRadius: 'var(--r-sm)',
                  color: 'var(--muted)', cursor: 'pointer', fontFamily: 'inherit',
                  fontSize: 'var(--fs-xs)', alignSelf: 'flex-start'
                }}
              >
                + افزودن تخفیف
              </button>
            )}

            {whsItems.length > 0 && (
              <>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 'var(--fs-xs)', color: 'var(--muted)', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={!!it.itemId}
                    onChange={e => updateItem(it.id, { itemId: e.target.checked ? (whsItems[0]?.id || '') : '' })}
                    style={{ cursor: 'pointer', accentColor: 'var(--accent)' }}
                  />
                  اتصال به انبار
                </label>
                {it.itemId && (
                  <SmartSelect
                    value={it.itemId}
                    onChange={v => updateItem(it.id, { itemId: v })}
                    options={whsItems.map(w => ({
                      value: w.id,
                      label: w.name,
                      subtitle: `موجودی ${toFa(w.currentStock)} ${UNIT_LABEL[w.unit]}`,
                      group: w.category,
                    }))}
                    placeholder="— انتخاب کالا —"
                    modalTitle="انتخاب کالای انبار"
                    autoThreshold={6}
                  />
                )}
              </>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--fs-sm)', color: 'var(--accent)', fontWeight: 700 }}>
              <span>جمع:</span>
              <span>{toFa(it.total.toLocaleString('fa-IR'))} ت</span>
            </div>
          </div>
        ))}

        <Btn size="sm" full onClick={addItem}>+ افزودن قلم</Btn>

        <SectionTitle>💰 مالی</SectionTitle>
        <Grid2>
          <Field label="تخفیف"><Input mode="number" value={form.discount} onChange={e => setForm({...form, discount: e.target.value})} unit="ت" /></Field>
          <Field label="حمل"><Input mode="number" value={form.shipping} onChange={e => setForm({...form, shipping: e.target.value})} unit="ت" /></Field>
        </Grid2>
        <Field label="قیمت نهایی" hint="خودکار">
          <Input readOnly dir="ltr" value={toFa(total.toLocaleString('fa-IR'))} unit="ت" />
        </Field>

        <SectionTitle>📦 نوع سفارش</SectionTitle>
        <Field label="نوع سفارش">
          <Select value={form.isPreorder ? 'preorder' : 'stock'} onChange={e => {
            const isPre = e.target.value === 'preorder';
            setForm(f => ({ ...f, isPreorder: isPre }));
          }}>
            <option value="stock">📦 از موجودی (فوری)</option>
            <option value="preorder">📅 پیش‌فروش (تاریخ تحویل)</option>
          </Select>
        </Field>

        {form.isPreorder && (
          <>
            <Field label="تاریخ تحویل" required>
              <DatePicker value={form.deliveryDate} onChange={v => setForm({...form, deliveryDate: v})} />
            </Field>

            <SectionTitle>💵 پیش‌پرداخت</SectionTitle>
            <Grid2>
              <Field label="نوع پیش‌پرداخت">
                <Select value={form.advanceType} onChange={e => setForm({...form, advanceType: e.target.value as 'percent' | 'amount'})}>
                  <option value="percent">درصد (٪)</option>
                  <option value="amount">مبلغ ثابت (ت)</option>
                </Select>
              </Field>
              <Field label="مقدار" hint={form.advanceType === 'percent' ? 'درصد از کل' : 'مبلغ به تومان'}>
                <Input
                  mode="number"
                  value={form.advanceValue}
                  onChange={e => setForm({...form, advanceValue: e.target.value})}
                  unit={form.advanceType === 'percent' ? '٪' : 'ت'}
                />
              </Field>
            </Grid2>

            <Field label="یادداشت پیش‌فروش">
              <Input placeholder="مثلاً: تحویل درب مرغداری" value={form.advanceNote} onChange={e => setForm({...form, advanceNote: e.target.value})} />
            </Field>
          </>
        )}

        <SectionTitle>📅 شرایط پرداخت</SectionTitle>
        <Grid2>
          <Field label="نوع پرداخت" required>
            <Select value={form.paymentTerms} onChange={e => {
              const terms = e.target.value as 'cash' | 'installment' | 'custom';
              setForm(f => {
                const newForm = { ...f, paymentTerms: terms };
                if (terms === 'cash') newForm.dueDate = f.date;
                else if (terms === 'installment') {
                  newForm.dueDate = calcDueDate(terms, f.date, '', parseInt(toEn(f.installmentGapDays)) || 30);
                } else if (terms === 'custom') {
                  newForm.dueDate = f.customDueDate || f.date;
                }
                return newForm;
              });
            }}>
              <option value="cash">💵 نقدی</option>
              <option value="installment">📅 قسطی</option>
              <option value="custom">✏️ توافقی</option>
            </Select>
          </Field>

          {form.paymentTerms !== 'custom' && (
            <Field label="سرسید (خودکار)" hint="خودکار محاسبه شد">
              <Input readOnly value={form.dueDate} dir="ltr" />
            </Field>
          )}

          {form.paymentTerms === 'custom' && (
            <Field label="تاریخ سرسید (توافقی)" required>
              <DatePicker value={form.customDueDate} onChange={v => setForm({...form, customDueDate: v, dueDate: v})} />
            </Field>
          )}
        </Grid2>

        {form.paymentTerms === 'installment' && (
          <Grid2>
            <Field label="تعداد اقساط" required>
              <Input mode="number" value={form.installmentCount} onChange={e => setForm({...form, installmentCount: e.target.value})} unit="قسط" />
            </Field>
            <Field label="فاصله بین اقساط" required>
              <Input mode="number" value={form.installmentGapDays} onChange={e => setForm({...form, installmentGapDays: e.target.value})} unit="روز" />
            </Field>
          </Grid2>
        )}

        <Field label="یادداشت پرداخت" hint="مثلاً: توافق شد اول ماه پرداخت شود">
          <Input placeholder="..." value={form.paymentNote} onChange={e => setForm({...form, paymentNote: e.target.value})} />
        </Field>

        <SectionTitle>💳 پرداخت‌ها — {toFa(paid.toLocaleString('fa-IR'))} از {toFa(total.toLocaleString('fa-IR'))}</SectionTitle>

        {form.payments.map(p => (
          <div key={p.id} style={{ padding: '10px 12px', background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', fontWeight: 700 }}>پرداخت</span>
              <button type="button" onClick={() => removePayment(p.id)} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontFamily: 'inherit' }}>✕</button>
            </div>
            <Grid2>
              <Field label="روش">
                <Select value={p.method} onChange={e => updatePayment(p.id, { method: e.target.value as 'cash' | 'card' | 'check' })}>
                  <option value="cash">نقدی</option>
                  <option value="card">کارت</option>
                  <option value="check">چک</option>
                </Select>
              </Field>
              <Field label="مبلغ">
                <Input mode="number" value={String(p.amount)} onChange={e => updatePayment(p.id, { amount: parseFloat(toEn(e.target.value).replace('٫','.')) || 0 })} unit="ت" max={total - (paid - p.amount)} />
              </Field>
            </Grid2>
            <Field label="تاریخ"><DatePicker value={p.date} onChange={v => updatePayment(p.id, { date: v })} /></Field>
            {p.method === 'check' ? (
              <Grid3>
                <Field label="شماره چک"><Input placeholder="..." dir="ltr" value={p.checkNo} onChange={e => updatePayment(p.id, { checkNo: e.target.value })} /></Field>
                <Field label="بانک"><Input placeholder="..." value={p.bank} onChange={e => updatePayment(p.id, { bank: e.target.value })} /></Field>
                <Field label="سرسید چک"><DatePicker value={p.dueDate} onChange={v => updatePayment(p.id, { dueDate: v })} /></Field>
              </Grid3>
            ) : null}
          </div>
        ))}

        <Btn size="sm" full onClick={addPayment}>+ افزودن پرداخت</Btn>

        {rem > 0 ? (
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--fs-sm)', padding: '8px 10px', background: 'var(--warn-soft)', color: 'var(--warn)', borderRadius: 'var(--r-sm)', fontWeight: 700 }}>
            <span>مانده:</span>
            <span>{toFa(rem.toLocaleString('fa-IR'))} ت</span>
          </div>
        ) : null}

        <Field label="یادداشت"><Input placeholder="..." value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} /></Field>

        {err ? <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--danger)' }}>✕ {err}</div> : null}
      </Modal>

      {printId !== null && (() => {
        const inv = invoices.find(i => i.id === printId);
        if (inv === undefined) return null;
        return <InvoicePrint invoice={inv} onClose={() => setPrintId(null)} />;
      })()}

      <Modal
        open={delId !== null}
        onClose={() => setDelId(null)}
        title="حذف خرید"
        footer={<BtnRow><Btn variant="danger" onClick={() => { if (delId) deleteInvoice(delId); setDelId(null); }}>حذف کن</Btn><Btn onClick={() => setDelId(null)}>لغو</Btn></BtnRow>}
      >
        <div style={{ textAlign: 'center', fontSize: 'var(--fs-md)' }}>حذف فاکتور <b>{target?.number}</b>؟</div>
      </Modal>
    </PageContainer>
  );
}

function Row({ l, v }: { l: string; v: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--fs-sm)', padding: '6px 10px', background: 'var(--input-bg)', borderRadius: 'var(--r-sm)' }}>
      <span style={{ color: 'var(--muted)' }}>{l}:</span>
      <span style={{ fontWeight: 600, color: 'var(--text)' }}>{v}</span>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      paddingTop: 10, marginTop: 4,
      borderTop: '1px dashed var(--border)',
      fontSize: 'var(--fs-sm)', fontWeight: 700, color: 'var(--muted)',
      display: 'flex', justifyContent: 'space-between', alignItems: 'center'
    }}>{children}</div>
  );
}

function chip(active: boolean): React.CSSProperties {
  return {
    padding: '6px 11px', fontSize: 'var(--fs-sm)',
    background: active ? 'var(--accent-soft)' : 'var(--btn-bg)',
    border: `1px solid ${active ? 'var(--accent-border)' : 'var(--border)'}`,
    borderRadius: 'var(--r-sm)',
    color: active ? 'var(--accent)' : 'var(--muted)',
    fontWeight: active ? 600 : 500, cursor: 'pointer',
    fontFamily: 'inherit', whiteSpace: 'nowrap'
  };
}
