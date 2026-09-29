import { useState, useMemo, useEffect } from 'react';
import {
  useTra, CATEGORIES, itemsSum, paidSum, remaining, STATUS_LABEL,
  WORKFLOW_LABEL, calcDueDate, calcItemTotal, calcItemDiscount,
  checkTone, CHECK_STATUS_LABEL, nextWorkflowStatus, workflowTone,
  type Invoice, type InvoiceItem, type Payment, type WorkflowStatus, type CheckStatus,
} from './store';
import { useWhs, UNIT_LABEL } from '../whs/store';
import { useCtc } from '../ctc/store';
import { Btn, BtnRow, Empty, Field, Grid2, Grid3, Input, Modal, NumField, PageContainer, Select, Tag } from '../../shr/components/ui';
import ExpandableCard from '../../shr/components/ExpandableCard';
import SmartSelect from '../../shr/components/SmartSelect';
import DatePicker from '../../shr/components/DatePicker';
import ItemDetailsForm from '../../shr/components/ItemDetailsForm';
import HelpBanner from '../../shr/components/HelpBanner';
import InvoicePrint from './InvoicePrint';
import { toFa, toEn } from '../../shr/utils/fa';
import { showAlert } from '../../cor/store/dialog';

interface F {
  id?: string;
  date: string;
  partyId: string;
  category: string;
  items: InvoiceItem[];
  paymentTerms: 'cash' | 'installment' | 'custom';
  installmentCount: string;
  installmentGapDays: string;
  customDueDate: string;
  isPreorder: boolean;
  deliveryDate: string;
  advanceType: 'percent' | 'amount';
  advanceValue: string;
  dueDate: string;
  payments: Payment[];
  notes: string;
}

const empty = (): F => ({
  date: '', partyId: '', category: 'egg', items: [],
  paymentTerms: 'cash', installmentCount: '1', installmentGapDays: '30',
  customDueDate: '', isPreorder: false, deliveryDate: '',
  advanceType: 'percent', advanceValue: '',
  dueDate: '', payments: [], notes: '',
});

export default function PurchasesPage() {
  const { invoices, addInvoice, updateInvoice, deleteInvoice } = useTra();
  const { contacts } = useCtc();
  const { items: whsItems } = useWhs();
  const suppliers = contacts.filter(c => c.roles.includes('supplier'));

  // ==== State ====
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<F>(empty());
  const [err, setErr] = useState('');
  const [delId, setDelId] = useState<string | null>(null);
  const [filterCat, setFilterCat] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [printId, setPrintId] = useState<string | null>(null);
  const [transferModal, setTransferModal] = useState<{ id: string; to: WorkflowStatus } | null>(null);
  const [transferNote, setTransferNote] = useState('');
  const [transferDate, setTransferDate] = useState('');

  // ==== سرسید خودکار ====
  useEffect(() => {
    if (!open) return;
    setForm(f => {
      if (!f.date) return f;
      let newDue = f.dueDate;
      if (f.paymentTerms === 'cash') newDue = f.date;
      else if (f.paymentTerms === 'custom') newDue = f.customDueDate || f.date;
      else if (f.paymentTerms === 'installment') {
        const gap = parseInt(toEn(f.installmentGapDays)) || 30;
        newDue = calcDueDate('installment', f.date, '', gap);
      }
      return newDue !== f.dueDate ? { ...f, dueDate: newDue } : f;
    });
  }, [open, form.date, form.paymentTerms, form.customDueDate, form.installmentGapDays]);

  // ==== Computed ====
  const list = useMemo(
    () => invoices.filter(i => i.type === 'purchase')
      .filter(i => !filterCat || i.category === filterCat)
      .sort((a, b) => b.date.localeCompare(a.date)),
    [invoices, filterCat]
  );

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
  const num = (s: string) => s ? parseFloat(toEn(s).replace('٫','.')) || 0 : 0;

  // ==== Handlers ====
  const openNew = () => {
    if (suppliers.length === 0) { showAlert('اول یک فروشنده در مخاطبین بسازید'); return; }
    setForm({ ...empty(), partyId: suppliers[0].id });
    setErr(''); setOpen(true);
  };

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
      notes: inv.notes || '',
    });
    setErr(''); setOpen(true);
  };

  const addItem = () => {
    setForm(f => ({ ...f, items: [...f.items, {
      id: crypto.randomUUID(),
      description: '', unit: 'عدد', quantity: 1, unitPrice: 0, total: 0,
      itemId: '', movementId: '', discountType: '', discountValue: 0, shipping: 0,
    }] }));
  };

  const updateItem = (id: string, patch: Partial<InvoiceItem>) => {
    setForm(f => ({ ...f, items: f.items.map(x => {
      if (x.id !== id) return x;
      const nx = { ...x, ...patch };
      nx.total = calcItemTotal(nx.quantity, nx.unitPrice, nx.discountType, nx.discountValue) + (nx.shipping || 0);
      return nx;
    }) }));
  };

  const removeItem = (id: string) => setForm(f => ({ ...f, items: f.items.filter(x => x.id !== id) }));

  const addPayment = () => setForm(f => ({ ...f, payments: [...f.payments, {
    id: crypto.randomUUID(), date: f.date, amount: 0, method: 'cash' as const,
    checkNo: '', bank: '', dueDate: '', notes: '',
  }] }));

  const updatePayment = (id: string, patch: Partial<Payment>) =>
    setForm(f => ({ ...f, payments: f.payments.map(p => p.id === id ? { ...p, ...patch } : p) }));

  const removePayment = (id: string) =>
    setForm(f => ({ ...f, payments: f.payments.filter(p => p.id !== id) }));

  const save = () => {
    if (!form.partyId) { setErr('فروشنده اجباری است'); return; }
    if (!form.date.trim()) { setErr('تاریخ اجباری است'); return; }
    if (form.items.length === 0) { setErr('حداقل یک قلم اضافه کنید'); return; }

    const data: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'> = {
      type: 'purchase',
      date: form.date, partyId: form.partyId, category: form.category,
      items: form.items, discount: 0, shipping: 0, total,
      payments: form.payments, dueDate: form.dueDate,
      relatedFlockId: '', relatedEntryId: '', notes: form.notes.trim(),
      paymentTerms: form.paymentTerms,
      installmentCount: form.paymentTerms === 'installment' ? (parseInt(toEn(form.installmentCount)) || 1) : undefined,
      installmentGapDays: form.paymentTerms === 'installment' ? (parseInt(toEn(form.installmentGapDays)) || 30) : undefined,
      customDueDate: form.paymentTerms === 'custom' ? form.customDueDate : '',
      isPreorder: form.isPreorder,
      deliveryDate: form.isPreorder ? form.deliveryDate : '',
      advancePercent: form.isPreorder && form.advanceType === 'percent' ? (num(form.advanceValue)) : 0,
      advancePayment: form.isPreorder && form.advanceType === 'amount' ? (num(form.advanceValue)) : 0,
    };
    if (form.id) updateInvoice(form.id, data); else addInvoice(data);
    setOpen(false);
  };

  const doTransfer = () => {
    if (!transferModal) return;
    const inv = invoices.find(i => i.id === transferModal.id);
    if (!inv) return;
    const patch: Partial<Invoice> = { workflowStatus: transferModal.to };
    if (transferModal.to === 'confirmed') patch.confirmedAt = transferDate || new Date().toISOString();
    else if (transferModal.to === 'received') {
      patch.receivedAt = transferDate || new Date().toISOString();
      patch.receivedNote = transferNote;
    } else if (transferModal.to === 'paid') {
      patch.paidAt = transferDate || new Date().toISOString();
      patch.paidNote = transferNote;
    }
    updateInvoice(inv.id, patch);
    setTransferModal(null); setTransferNote(''); setTransferDate('');
  };

  const target = delId ? invoices.find(i => i.id === delId) : null;

  return (
    <PageContainer>
      <HelpBanner
        id="purchases-intro"
        icon="📥"
        title="ثبت خرید از فروشنده"
        description="اگر می‌خواهید این خرید به انبار اضافه شود، در بخش اقلام گزینه «اتصال به انبار» را فعال کنید."
        tone="success"
      />

      {/* فیلتر دسته */}
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
        <button onClick={() => setFilterCat('')} style={chip(filterCat === '')}>همه</button>
        {CATEGORIES.purchase.map(([v, l]) => (
          <button key={v} onClick={() => setFilterCat(v)} style={chip(filterCat === v)}>{l}</button>
        ))}
      </div>

      {list.length === 0 ? (
        <Empty
          icon={<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><path d="M12 2v20M5 8h14M5 16h14"/></svg>}
          title="خریدی ثبت نشده"
          desc="اولین خرید خود را ثبت کنید."
          action={<Btn variant="primary" onClick={openNew}>+ ثبت خرید</Btn>}
        />
      ) : (
        <>
          {list.map((inv, i) => {
            const party = suppliers.find(c => c.id === inv.partyId);
            const isOpen = expandedId === inv.id;
            const rem2 = remaining(inv);
            const st = rem2 === 0 ? 'paid' : paidSum(inv.payments || []) > 0 ? 'partial' : 'unpaid';
            return (
              <ExpandableCard
                key={inv.id}
                accent={rem2 === 0 ? 'accent' : 'warn'}
                index={toFa(i + 1)}
                iconEmoji="🛒"
                title={party?.name || '—'}
                subtitle={`${toFa(inv.date)}${inv.number ? ` · ${inv.number}` : ''}`}
                isOpen={isOpen}
                onToggle={() => setExpandedId(isOpen ? null : inv.id)}
                badge={
                  <div style={{ display: 'flex', gap: 4 }}>
                    <Tag tone={workflowTone(inv.workflowStatus)}>
                      {WORKFLOW_LABEL[inv.workflowStatus || 'draft']}
                    </Tag>
                    <Tag tone={st === 'paid' ? 'green' : st === 'partial' ? 'amber' : 'red'}>
                      {STATUS_LABEL[st as keyof typeof STATUS_LABEL] || '—'}
                    </Tag>
                  </div>
                }
                summary={
                  <>
                    <span>کل: <b>{toFa(inv.total.toLocaleString('fa-IR'))} ت</b></span>
                    {rem2 > 0 && <span style={{ color: 'var(--warn)' }}>مانده: <b>{toFa(rem2.toLocaleString('fa-IR'))}</b></span>}
                    {inv.items.length > 0 && <span>{toFa(inv.items.length)} قلم</span>}
                  </>
                }
              >
                <SectionTitle>📋 اطلاعات</SectionTitle>
                <Row l="فروشنده" v={party?.name || '—'} />
                <Row l="تاریخ" v={toFa(inv.date)} />
                {inv.number ? <Row l="شماره" v={inv.number} /> : null}
                {inv.dueDate ? <Row l="سرسید" v={toFa(inv.dueDate)} /> : null}
                {inv.isPreorder && inv.deliveryDate ? <Row l="📅 تاریخ تحویل" v={toFa(inv.deliveryDate)} /> : null}

                <SectionTitle>📦 اقلام</SectionTitle>
                {inv.items.map(it => (
                  <div key={it.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--fs-sm)', padding: '6px 10px', background: 'var(--input-bg)', borderRadius: 'var(--r-sm)' }}>
                    <span>{it.description || '—'} × {toFa(it.quantity)}</span>
                    <span style={{ fontWeight: 600 }}>{toFa(it.total.toLocaleString('fa-IR'))} ت</span>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--fs-sm)', padding: '8px 10px', background: 'var(--accent-soft)', color: 'var(--accent)', borderRadius: 'var(--r-sm)', fontWeight: 700 }}>
                  <span>جمع کل:</span>
                  <span>{toFa(inv.total.toLocaleString('fa-IR'))} ت</span>
                </div>

                {inv.payments && inv.payments.length > 0 && (
                  <>
                    <SectionTitle>💳 پرداخت‌ها</SectionTitle>
                    {inv.payments.map(p => (
                      <div key={p.id} style={{ padding: '8px 10px', background: 'var(--input-bg)', borderRadius: 'var(--r-sm)', fontSize: 'var(--fs-sm)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>{p.method === 'cash' ? '💵 نقدی' : p.method === 'card' ? '💳 کارت' : '📄 چک'} · {toFa(p.date)}</span>
                          <span style={{ fontWeight: 600 }}>{toFa(p.amount.toLocaleString('fa-IR'))} ت</span>
                        </div>
                        {p.method === 'check' && (
                          <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', marginTop: 2 }}>
                            چک {p.checkNo} · {p.bank} · {CHECK_STATUS_LABEL[p.status || 'pending']}
                          </div>
                        )}
                      </div>
                    ))}
                  </>
                )}

                {nextWorkflowStatus(inv.workflowStatus) && (
                  <Btn
                    size="sm" variant="primary" full
                    onClick={() => setTransferModal({ id: inv.id, to: nextWorkflowStatus(inv.workflowStatus)! })}
                  >
                    ▶️ {WORKFLOW_LABEL[nextWorkflowStatus(inv.workflowStatus)!]}
                  </Btn>
                )}

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

      {/* ============ Modal اصلی فرم ============ */}
      <Modal
        open={open} onClose={() => setOpen(false)}
        title={form.id ? 'ویرایش خرید' : 'ثبت خرید جدید'}
        footer={<BtnRow><Btn onClick={() => setOpen(false)}>لغو</Btn><Btn variant="primary" onClick={save}>ذخیره</Btn></BtnRow>}
      >
        <SectionTitle>📋 اطلاعات پایه</SectionTitle>
        <Grid2>
          <Field label="تاریخ" required>
            <DatePicker value={form.date} onChange={v => setForm({...form, date: v})} />
          </Field>
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
            options={suppliers.map(c => ({ value: c.id, label: c.name, subtitle: c.phone || undefined }))}
            placeholder="— انتخاب کنید —" modalTitle="انتخاب فروشنده" autoThreshold={6}
          />
        </Field>

        <SectionTitle>📦 اقلام — جمع: {toFa(total.toLocaleString('fa-IR'))} ت</SectionTitle>
        {form.items.map((it, idx) => (
          <div key={it.id} style={{ padding: '10px 12px', background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', fontWeight: 700 }}>قلم {toFa(idx + 1)}</span>
              <button type="button" onClick={() => removeItem(it.id)} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 14 }}>✕</button>
            </div>

            <Input placeholder="توضیح" value={it.description} onChange={e => updateItem(it.id, { description: e.target.value })} />

            <Grid3>
              <Field label="واحد"><Input placeholder="عدد" value={it.unit} onChange={e => updateItem(it.id, { unit: e.target.value })} /></Field>
              <Field label="تعداد"><NumField value={String(it.quantity)} onChange={e => updateItem(it.id, { quantity: parseFloat(toEn(e.target.value).replace('٫','.')) || 0 })} min={0} /></Field>
              <Field label="قیمت"><NumField value={String(it.unitPrice)} onChange={e => updateItem(it.id, { unitPrice: parseFloat(toEn(e.target.value).replace('٫','.')) || 0 })} min={0} /></Field>
            </Grid3>

            <Grid2>
              <Field label="تخفیف">
                <NumField value={String(it.discountValue || '')} onChange={e => updateItem(it.id, { discountType: 'amount', discountValue: parseFloat(toEn(e.target.value).replace('٫','.')) || 0 })} unit="ت" min={0} />
              </Field>
              <Field label="حمل">
                <NumField value={String(it.shipping || '')} onChange={e => updateItem(it.id, { shipping: parseFloat(toEn(e.target.value).replace('٫','.')) || 0 })} unit="ت" min={0} />
              </Field>
            </Grid2>

            <Field label="فروشنده این قلم" hint="خالی = فروشنده اصلی">
              <SmartSelect
                value={it.itemPartyId || ''}
                onChange={v => updateItem(it.id, { itemPartyId: v })}
                options={suppliers.map(c => ({ value: c.id, label: c.name }))}
                placeholder="— همان اصلی —" modalTitle="انتخاب فروشنده" autoThreshold={6}
              />
            </Field>

            <ItemDetailsForm
              category={form.category}
              item={it}
              updateItem={(patch: any) => updateItem(it.id, patch)}
              isPurchase={true}
            />

            {whsItems.length > 0 && (
              <>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 'var(--fs-xs)', color: 'var(--muted)', cursor: 'pointer' }}>
                  <input type="checkbox" checked={!!it.itemId}
                    onChange={e => updateItem(it.id, { itemId: e.target.checked ? (whsItems[0]?.id || '') : '' })}
                    style={{ cursor: 'pointer', accentColor: 'var(--accent)' }} />
                  اتصال به انبار
                </label>
                {it.itemId && (
                  <SmartSelect
                    value={it.itemId}
                    onChange={v => updateItem(it.id, { itemId: v })}
                    options={whsItems.map(w => ({ value: w.id, label: w.name, subtitle: `موجودی ${toFa(w.currentStock)} ${UNIT_LABEL[w.unit]}`, group: w.category }))}
                    placeholder="— انتخاب کالا —" modalTitle="انتخاب کالای انبار" autoThreshold={6}
                  />
                )}
              </>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--fs-sm)', color: 'var(--accent)', fontWeight: 700, paddingTop: 4, borderTop: '1px dashed var(--border)' }}>
              <span>جمع قلم:</span>
              <span>{toFa(it.total.toLocaleString('fa-IR'))} ت</span>
            </div>
          </div>
        ))}
        <Btn size="sm" full onClick={addItem}>+ افزودن قلم</Btn>

        <SectionTitle>📦 نوع سفارش</SectionTitle>
        <Field label="نوع سفارش">
          <Select value={form.isPreorder ? 'preorder' : 'stock'} onChange={e => setForm({ ...form, isPreorder: e.target.value === 'preorder' })}>
            <option value="stock">📦 از موجودی (فوری)</option>
            <option value="preorder">📅 پیش‌خرید (تاریخ تحویل)</option>
          </Select>
        </Field>

        {form.isPreorder && (
          <>
            <Field label="تاریخ تحویل" required>
              <DatePicker value={form.deliveryDate} onChange={v => setForm({...form, deliveryDate: v})} />
            </Field>
            <Grid2>
              <Field label="نوع پیش‌پرداخت">
                <Select value={form.advanceType} onChange={e => setForm({...form, advanceType: e.target.value as 'percent' | 'amount'})}>
                  <option value="percent">درصد (٪)</option>
                  <option value="amount">مبلغ (ت)</option>
                </Select>
              </Field>
              <Field label="مقدار">
                <NumField value={form.advanceValue} onChange={e => setForm({...form, advanceValue: e.target.value})} unit={form.advanceType === 'percent' ? '٪' : 'ت'} min={0} />
              </Field>
            </Grid2>
          </>
        )}

        <SectionTitle>📅 شرایط پرداخت</SectionTitle>
        <Grid2>
          <Field label="نوع پرداخت" required>
            <Select value={form.paymentTerms} onChange={e => setForm({...form, paymentTerms: e.target.value as any})}>
              <option value="cash">💵 نقدی</option>
              <option value="installment">📅 قسطی</option>
              <option value="custom">✏️ توافقی</option>
            </Select>
          </Field>
          {form.paymentTerms !== 'custom' && (
            <Field label="سرسید (خودکار)">
              <Input readOnly value={form.dueDate} dir="ltr" />
            </Field>
          )}
          {form.paymentTerms === 'custom' && (
            <Field label="تاریخ سرسید" required>
              <DatePicker value={form.customDueDate} onChange={v => setForm({...form, customDueDate: v, dueDate: v})} />
            </Field>
          )}
        </Grid2>

        {form.paymentTerms === 'installment' && (
          <Grid2>
            <Field label="تعداد اقساط" required>
              <NumField value={form.installmentCount} onChange={e => setForm({...form, installmentCount: e.target.value})} unit="قسط" min={0} />
            </Field>
            <Field label="فاصله" required>
              <NumField value={form.installmentGapDays} onChange={e => setForm({...form, installmentGapDays: e.target.value})} unit="روز" min={0} />
            </Field>
          </Grid2>
        )}

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
                <NumField value={String(p.amount)} onChange={e => updatePayment(p.id, { amount: parseFloat(toEn(e.target.value).replace('٫','.')) || 0 })} unit="ت" min={0} />
              </Field>
            </Grid2>
            <Field label="تاریخ">
              <DatePicker value={p.date} onChange={v => updatePayment(p.id, { date: v })} />
            </Field>
            {p.method === 'check' && (
              <>
                <Grid3>
                  <Field label="شماره چک"><Input value={p.checkNo} onChange={e => updatePayment(p.id, { checkNo: e.target.value })} dir="ltr" /></Field>
                  <Field label="بانک"><Input value={p.bank} onChange={e => updatePayment(p.id, { bank: e.target.value })} /></Field>
                  <Field label="سرسید"><DatePicker value={p.dueDate} onChange={v => updatePayment(p.id, { dueDate: v })} /></Field>
                </Grid3>
                <Field label="وضعیت چک">
                  <Select value={p.status || 'pending'} onChange={e => updatePayment(p.id, { status: e.target.value as CheckStatus })}>
                    <option value="pending">🟡 در جریان</option>
                    <option value="cleared">✅ نقد شد</option>
                    <option value="bounced">❌ برگشتی</option>
                  </Select>
                </Field>
                {p.status === 'cleared' && (
                  <Field label="تاریخ نقد"><DatePicker value={p.clearedDate || ''} onChange={v => updatePayment(p.id, { clearedDate: v })} /></Field>
                )}
              </>
            )}
          </div>
        ))}
        <Btn size="sm" full onClick={addPayment}>+ افزودن پرداخت</Btn>

        {rem > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--fs-sm)', padding: '8px 10px', background: 'var(--warn-soft)', color: 'var(--warn)', borderRadius: 'var(--r-sm)', fontWeight: 700 }}>
            <span>مانده:</span>
            <span>{toFa(rem.toLocaleString('fa-IR'))} ت</span>
          </div>
        )}

        <SectionTitle>📝 یادداشت</SectionTitle>
        <Field label="یادداشت">
          <Input placeholder="..." value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} />
        </Field>

        {err && <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--danger)' }}>✕ {err}</div>}
      </Modal>

      {/* Modal انتقال workflow */}
      <Modal
        open={!!transferModal}
        onClose={() => { setTransferModal(null); setTransferNote(''); setTransferDate(''); }}
        title={transferModal ? `تغییر به ${WORKFLOW_LABEL[transferModal.to]}` : ''}
        footer={<BtnRow><Btn onClick={() => setTransferModal(null)}>لغو</Btn><Btn variant="primary" onClick={doTransfer}>تأیید</Btn></BtnRow>}
      >
        {transferModal && (
          <>
            <Field label="تاریخ"><DatePicker value={transferDate} onChange={v => setTransferDate(v)} /></Field>
            {(transferModal.to === 'received' || transferModal.to === 'paid') && (
              <Field label="یادداشت"><Input value={transferNote} onChange={e => setTransferNote(e.target.value)} /></Field>
            )}
          </>
        )}
      </Modal>

      {/* Modal حذف */}
      <Modal
        open={delId !== null} onClose={() => setDelId(null)} title="حذف خرید"
        footer={<BtnRow><Btn onClick={() => setDelId(null)}>لغو</Btn><Btn variant="danger" onClick={() => { if (delId) deleteInvoice(delId); setDelId(null); }}>حذف کن</Btn></BtnRow>}
      >
        <div style={{ textAlign: 'center', fontSize: 'var(--fs-md)' }}>حذف <b>{target?.number}</b>؟</div>
      </Modal>

      {/* چاپ */}
      {printId && (() => {
        const inv = invoices.find(i => i.id === printId);
        if (!inv) return null;
        return <InvoicePrint invoice={inv} onClose={() => setPrintId(null)} />;
      })()}
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
    <div style={{ paddingTop: 10, marginTop: 4, borderTop: '1px dashed var(--border)', fontSize: 'var(--fs-sm)', fontWeight: 700, color: 'var(--muted)' }}>
      {children}
    </div>
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
    fontFamily: 'inherit', whiteSpace: 'nowrap',
  };
}
