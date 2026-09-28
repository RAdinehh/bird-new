import { useState, useMemo } from 'react';
import { useTra, CATEGORIES, PAYMENT_LABEL, itemTotal, itemsSum, paidSum, invoiceStatus, remaining, STATUS_LABEL, type Invoice, type InvoiceItem, type Payment , calcDueDate } from './store';
import { useWhs, UNIT_LABEL } from '../whs/store';
import SmartSelect from '../../shr/components/SmartSelect';
import { useCtc } from '../ctc/store';
import { Btn, BtnRow, Empty, Field, Grid2, Grid3, Input, Modal, PageContainer, Select, Tag } from '../../shr/components/ui'
import ExpandableCard from '../../shr/components/ExpandableCard';
import DatePicker from '../../shr/components/DatePicker';
import InvoicePrint from './InvoicePrint';
import { toFa, toEn } from '../../shr/utils/fa';
import { showAlert } from '../../cor/store/dialog';

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
  dueDate: string;
  payments: Payment[];
  notes: string;
}

const empty = (): F => ({
   date: '', partyId: '', category: 'chick',
  items: [],
  discount: '', shipping: '',
  paymentTerms: 'cash', installmentCount: '1', installmentGapDays: '30',
  customDueDate: '', paymentNote: '',
  dueDate: '',
  payments: [],
  notes: ''
});

export default function SalesPage() {
  const { invoices, addInvoice, updateInvoice, deleteInvoice } = useTra();
  const { contacts } = useCtc();
  const { items: whsItems } = useWhs();
  const customers = contacts.filter(c => c.roles.includes('customer'));

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<F>(empty());
  const [err, setErr] = useState('');
  const [delId, setDelId] = useState<string | null>(null);
  const [filterCat, setFilterCat] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [printId, setPrintId] = useState<string | null>(null);

  const list = useMemo(() => {
    let arr = invoices.filter(i => i.type === 'sale');
    if (filterCat) arr = arr.filter(i => i.category === filterCat);
    return arr.sort((a, b) => b.date.localeCompare(a.date));
  }, [invoices, filterCat]);

  const openNew = () => {
    if (customers.length === 0) { showAlert('اول یک مشتری در مخاطبین بسازید'); return; }
    setForm({ ...empty(), partyId: customers[0].id });
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
      paymentNote: inv.paymentNote || '',
      payments: inv.payments || [],
      notes: inv.notes || ''
    });
    setErr(''); setOpen(true);
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
    if (form.partyId === '') { setErr('مشتری اجباری است'); return; }
    if (form.date.trim() === '') { setErr('تاریخ اجباری است'); return; }
    if (form.items.length === 0) { setErr('حداقل یک قلم اضافه کنید'); return; }
    if (paid > total) { setErr('مجموع پرداخت‌ها از قیمت نهایی بیشتر است'); return; }

    const data = {
      type: 'sale' as const,

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
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
        <button onClick={() => setFilterCat('')} style={chip(filterCat === '')}>
          همه ({toFa(invoices.filter(i => i.type === 'sale').length)})
        </button>
        {CATEGORIES.sale.map(([v, l]) => {
          const c = invoices.filter(i => i.type === 'sale' && i.category === v).length;
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
          icon={<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></svg>}
          title="هنوز فروشی ثبت نشده"
          desc={customers.length === 0 ? 'اول از ماژول مخاطبین یک مشتری بسازید.' : 'اولین فروش خود را ثبت کنید.'}
          action={<Btn variant="primary" onClick={openNew}>+ ثبت فروش</Btn>}
        />
      ) : (
        <>
          {list.map((inv, i) => {
            const cus = contacts.find(c => c.id === inv.partyId);
            const st = invoiceStatus(inv);
            const rem2 = remaining(inv);
            const catLabel = CATEGORIES.sale.find(x => x[0] === inv.category)?.[1] || inv.category;
            const accent = st === 'paid' ? 'accent' : rem2 > 0 ? 'warn' : 'dim';
            const isOpen = expandedId === inv.id;
            return (
              <ExpandableCard
                key={inv.id}
                accent={accent}
                index={toFa(i + 1)}
                iconEmoji="💰"
                title={`${catLabel} — ${toFa(inv.total.toLocaleString('fa-IR'))} ت`}
                subtitle={`${cus?.name || '—'} · ${toFa(inv.date)}${inv.number ? ` · ${inv.number}` : ''}`}
                isOpen={isOpen}
                onToggle={() => setExpandedId(isOpen ? null : inv.id)}
                badge={<Tag tone={st === 'paid' ? 'green' : st === 'partial' ? 'amber' : 'red'}>{STATUS_LABEL[st]}</Tag>}
                summary={
                  <>
                    <span>کل: <b style={{ color: 'var(--text)' }}>{toFa(inv.total.toLocaleString('fa-IR'))} ت</b></span>
                    {rem2 > 0 && <span style={{ color: 'var(--warn)' }}>طلب: <b>{toFa(rem2.toLocaleString('fa-IR'))}</b></span>}
                    {inv.items.length > 0 && <span>{toFa(inv.items.length)} قلم</span>}
                  </>
                }
              >
                <SectionTitle>📋 اطلاعات فاکتور</SectionTitle>
                <Row l="مشتری" v={cus?.name || '—'} />
                <Row l="تاریخ" v={toFa(inv.date)} />
                {inv.number ? <Row l="شماره" v={inv.number} /> : null}
                {inv.dueDate ? <Row l="سرسید" v={toFa(inv.dueDate)} /> : null}

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
                <Row l="دریافت‌شده" v={`${toFa(paidSum(inv.payments || []).toLocaleString('fa-IR'))} ت`} />
                {rem2 > 0 ? (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--fs-sm)', padding: '8px 10px', background: 'var(--warn-soft)', color: 'var(--warn)', borderRadius: 'var(--r-sm)', fontWeight: 700 }}>
                    <span>طلب:</span>
                    <span>{toFa(rem2.toLocaleString('fa-IR'))} ت</span>
                  </div>
                ) : null}

                {(inv.payments || []).length > 0 ? (
                  <>
                    <SectionTitle>💳 دریافت‌ها</SectionTitle>
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
          <Btn variant="primary" full onClick={openNew}>+ ثبت فروش</Btn>
        </>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={form.id ? 'ویرایش فروش' : 'ثبت فروش'}
        footer={<BtnRow><Btn variant="primary" onClick={save}>ذخیره</Btn><Btn onClick={() => setOpen(false)}>لغو</Btn></BtnRow>}
      >
        <Field label="تاریخ" required><DatePicker value={form.date} onChange={v => setForm({...form, date: v})} /></Field>

        <Grid2>
          <Field label="مشتری" required>
            <SmartSelect
              value={form.partyId}
              onChange={v => setForm({...form, partyId: v})}
              options={customers.map(c => ({
                value: c.id,
                label: c.name,
                subtitle: c.phone || undefined,
              }))}
              placeholder="— انتخاب کنید —"
              modalTitle="انتخاب مشتری"
              autoThreshold={6}
            />
          </Field>
          <Field label="دسته">
            <Select value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
              {CATEGORIES.sale.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </Select>
          </Field>
        </Grid2>

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
              <Field label="واحد"><Input placeholder="شانه" value={it.unit} onChange={e => updateItem(it.id, { unit: e.target.value })} /></Field>
              <Field label="تعداد"><Input mode="number" value={String(it.quantity)} onChange={e => updateItem(it.id, { quantity: parseFloat(toEn(e.target.value).replace('٫','.')) || 0 })} /></Field>
              <Field label="قیمت"><Input mode="number" value={String(it.unitPrice)} onChange={e => updateItem(it.id, { unitPrice: parseFloat(toEn(e.target.value).replace('٫','.')) || 0 })} /></Field>
            </Grid3>

            {/* اتصال به انبار (اختیاری) */}
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

        <SectionTitle>📅 شرایط پرداخت</SectionTitle>
        <Field label="نوع پرداخت" required>
          <Select value={form.paymentTerms} onChange={e => {
            const terms = e.target.value as 'cash' | 'installment' | 'custom';
            setForm(f => {
              const newForm = { ...f, paymentTerms: terms };
              // محاسبه خودکار سرسید
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

        {form.paymentTerms === 'custom' && (
          <Field label="تاریخ سرسید (توافقی)" required>
            <DatePicker value={form.customDueDate} onChange={v => setForm({...form, customDueDate: v, dueDate: v})} />
          </Field>
        )}

        {form.paymentTerms !== 'custom' && (
          <Field label="سرسید (خودکار)" hint="به‌طور خودکار محاسبه شد">
            <Input readOnly value={form.dueDate} dir="ltr" />
          </Field>
        )}

        <Field label="یادداشت پرداخت" hint="مثلاً: توافق شد اول ماه پرداخت شود">
          <Input placeholder="..." value={form.paymentNote} onChange={e => setForm({...form, paymentNote: e.target.value})} />
        </Field>

        <SectionTitle>💳 دریافت‌ها — {toFa(paid.toLocaleString('fa-IR'))} از {toFa(total.toLocaleString('fa-IR'))}</SectionTitle>

        {form.payments.map(p => (
          <div key={p.id} style={{ padding: '10px 12px', background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', fontWeight: 700 }}>دریافت</span>
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

        <Btn size="sm" full onClick={addPayment}>+ افزودن دریافت</Btn>

        {rem > 0 ? (
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--fs-sm)', padding: '8px 10px', background: 'var(--warn-soft)', color: 'var(--warn)', borderRadius: 'var(--r-sm)', fontWeight: 700 }}>
            <span>طلب:</span>
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
        title="حذف فروش"
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
