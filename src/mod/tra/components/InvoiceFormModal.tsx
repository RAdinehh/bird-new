/**
 * InvoiceFormModal — فرم ثبت/ویرایش فاکتور
 */
import { toFa, toEn } from '../../../shr/utils/fa';
import {
  Btn, BtnRow, Field, Grid2, Input, Modal, MoneyField, NumField,
  SectionTitle, Select, Textarea, ErrorBox,
} from '../../../shr/components/ui';
import DatePicker from '../../../shr/components/DatePicker';
import SmartSelect from '../../../shr/components/SmartSelect';
import { AccordionSection } from '../../../shr/components/AccordionSection';
import ItemDetailsForm from '../../../shr/components/ItemDetailsForm';
import { type CheckStatus } from '../store';
import { CATEGORIES, type InvoiceItem, type Payment } from '../store';
import { UNIT_LABEL } from '../../whs/store';
import type { F } from '../types-invoice';

export interface InvoiceFormModalProps {
  open: boolean;
  setOpen: (v: boolean) => void;
  form: F;
  setForm: React.Dispatch<React.SetStateAction<F>>;
  isPurchase: boolean;
  parties: any[];
  flocks: any[];
  whsItems: any[];
  vErrors: Record<string, string>;
  err: string;
  total: number;
  paid: number;
  rem: number;
  save: () => void;
  addItem: () => void;
  updateItem: (id: string, patch: Partial<InvoiceItem>) => void;
  removeItem: (id: string) => void;
  addPayment: () => void;
  updatePayment: (id: string, patch: Partial<Payment>) => void;
  removePayment: (id: string) => void;
  /** 🆕 باز کردن مودال ساخت گله جدید */
  onNewFlock?: () => void;
}

export default function InvoiceFormModal(props: InvoiceFormModalProps) {
  const {
    open, setOpen, form, setForm, isPurchase,
    parties, flocks, whsItems, vErrors, err, onNewFlock,
    total, paid, rem,
    save, addItem, updateItem, removeItem,
    addPayment, updatePayment, removePayment,
  } = props;

  return (
      <Modal
        open={open} onClose={() => setOpen(false)}
        title={form.id ? (isPurchase ? 'ویرایش خرید' : 'ویرایش فروش') : (isPurchase ? 'ثبت خرید' : 'ثبت فروش')}
        footer={<BtnRow><Btn variant="primary" onClick={save}>ذخیره</Btn><Btn onClick={() => setOpen(false)}>لغو</Btn></BtnRow>}
      >
        <SectionTitle><span style={{ fontSize: 'var(--fs-sm)', lineHeight: 1, display: 'inline-block', marginLeft: 4 }}>📋</span> اطلاعات پایه</SectionTitle>
        <Grid2>
          <Field label="تاریخ" required error={vErrors.date}>
            <DatePicker value={form.date} onChange={v => setForm({...form, date: v})}  autoToday />
          </Field>
          <Field label="دسته">
            <Select value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
              {(isPurchase ? CATEGORIES.purchase : CATEGORIES.sale).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </Select>
          </Field>
        </Grid2>
        <Grid2>
          <Field label={isPurchase ? 'فروشنده' : 'مشتری'} required error={vErrors.partyId}>
            <SmartSelect
              value={form.partyId}
              onChange={v => setForm({...form, partyId: v})}
              options={parties.map(c => ({ value: c.id, label: c.name, subtitle: c.phone || undefined }))}
              placeholder="— انتخاب کنید —" modalTitle={isPurchase ? 'انتخاب فروشنده' : 'انتخاب مشتری'} autoThreshold={6}
            />
          </Field>
          <Field label="نوع سفارش">
            <Select value={form.isPreorder ? 'preorder' : 'stock'} onChange={e => setForm({ ...form, isPreorder: e.target.value === 'preorder' })}>
              <option value="stock">📦 از موجودی</option>
              <option value="preorder">📅 پیش‌خرید</option>
            </Select>
          </Field>
        </Grid2>



        {form.isPreorder && (
          <Field label="تاریخ تحویل" required>
            <DatePicker value={form.deliveryDate} onChange={v => setForm({...form, deliveryDate: v})}  autoToday />
          </Field>
        )}

        <SectionTitle><span style={{ fontSize: 'var(--fs-sm)', lineHeight: 1, display: 'inline-block', marginLeft: 4 }}>📦</span> اقلام — جمع: {toFa(total.toLocaleString('fa-IR'))} ت</SectionTitle>
        {form.items.map((it, idx) => (
          <div key={it.id} style={{ padding: 'var(--pad-normal) 0', borderBottom: '1px dashed var(--border)', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 'var(--fs-base)', color: 'var(--text)', fontWeight: 700, letterSpacing: '.3px' }}>قلم {toFa(idx + 1)}</span>
              <button type="button" onClick={() => removeItem(it.id)} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 'var(--fs-base)' }}>✕</button>
            </div>

            <div style={{ paddingTop: 12, fontSize: 'var(--fs-base)', fontWeight: 700, color: 'var(--text)', letterSpacing: '.3px', borderTop: '1px dashed var(--border)', marginBottom: 4 }}>
              📦 مشخصات پایه
            </div>

            <Input placeholder="توضیح (مثلاً: تخم نطفه‌دار نژاد راس)" value={it.description} onChange={e => updateItem(it.id, { description: e.target.value })} />

            <Grid2>
              <Field label="تعداد"><NumField value={String(it.quantity)} onChange={e => updateItem(it.id, { quantity: parseFloat(toEn(e.target.value).replace('٫','.')) || 0 })} min={0} /></Field>
              <Field label="واحد">
                <Select value={it.unit || 'pcs'} onChange={e => updateItem(it.id, { unit: e.target.value })}>
                  {Object.entries(UNIT_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </Select>
              </Field>
            </Grid2>

            <Grid2>
              <Field label="قیمت واحد"><MoneyField value={String(it.unitPrice)} onChange={e => updateItem(it.id, { unitPrice: parseFloat(toEn(e.target.value).replace('٫','.')) || 0 })} /></Field>
              <Field label="تخفیف">
                <MoneyField placeholder="مثلاً — ۱۰٬۰۰۰" value={String(it.discountValue || '')} onChange={e => updateItem(it.id, { discountType: 'amount', discountValue: parseFloat(toEn(e.target.value).replace('٫','.')) || 0 })} />
              </Field>
            </Grid2>

            <Grid2>
              <Field label="حمل">
                <MoneyField placeholder="مثلاً — ۵۰٬۰۰۰" value={String(it.shipping || '')} onChange={e => updateItem(it.id, { shipping: parseFloat(toEn(e.target.value).replace('٫','.')) || 0 })} />
              </Field>
              <div /> {/* Spacer برای هم‌ترازی دو ستونه */}
            </Grid2>

            <ItemDetailsForm
              category={form.category}
              item={it}
              updateItem={(patch: Record<string, unknown>) => updateItem(it.id, patch as Record<string, unknown>)}
              isPurchase={true}
              sellerSlot={
                <Field label="فروشنده این قلم" hint="خالی = فروشنده اصلی">
                  <SmartSelect
                    value={it.itemPartyId || ''}
                    onChange={v => updateItem(it.id, { itemPartyId: v })}
                    options={parties.map(c => ({ value: c.id, label: c.name }))}
                    placeholder="— همان اصلی —" modalTitle="انتخاب فروشنده" autoThreshold={6}
                  />
                </Field>
              }
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
                    options={whsItems.map(w => ({ value: w.id, label: w.name, subtitle: `موجودی ${toFa(w.currentStock)} ${(UNIT_LABEL as any)[w.unit]}`, group: w.category }))}
                    placeholder="— انتخاب کالا —" modalTitle="انتخاب کالای انبار" autoThreshold={6}
                  />
                )}
              </>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--fs-base)', color: 'var(--accent)', fontWeight: 700, letterSpacing: '.3px', paddingTop: 4, borderTop: '1px dashed var(--border)' }}>
              <span>جمع قلم:</span>
              <span>{toFa(it.total.toLocaleString('fa-IR'))} ت</span>
            </div>
          </div>
        ))}
        <Btn size="sm" full onClick={addItem}>+ افزودن قلم</Btn>


        <SectionTitle><span style={{ fontSize: 'var(--fs-sm)', lineHeight: 1, display: 'inline-block', marginLeft: 4 }}>📅</span> شرایط پرداخت</SectionTitle>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {form.isPreorder && (
          <Grid2>
            <Field label="نوع پیش‌پرداخت">
              <Select value={form.advanceType} onChange={e => setForm({...form, advanceType: e.target.value as 'percent' | 'amount'})}>
                <option value="percent">درصد (٪)</option>
                <option value="amount">مبلغ (ت)</option>
              </Select>
            </Field>
            <Field label="مقدار پیش‌پرداخت">
              <NumField placeholder="مثلاً — ۱۰۰" value={form.advanceValue} onChange={e => setForm({...form, advanceValue: e.target.value})} unit={form.advanceType === 'percent' ? '٪' : 'ت'} min={0} />
            </Field>
          </Grid2>
        )}
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
              <Input placeholder="خودکار محاسبه می‌شود" readOnly value={form.dueDate} dir="ltr" />
            </Field>
          )}
          {form.paymentTerms === 'custom' && (
            <Field label="تاریخ سرسید" required>
              <DatePicker value={form.customDueDate} onChange={v => setForm({...form, customDueDate: v, dueDate: v})}  autoToday />
            </Field>
          )}
        </Grid2>

        {form.paymentTerms === 'installment' && (
          <Grid2>
            <Field label="تعداد اقساط" required>
              <NumField placeholder="مثلاً — ۱۰۰" value={form.installmentCount} onChange={e => setForm({...form, installmentCount: e.target.value})} unit="قسط" min={0} />
            </Field>
            <Field label="فاصله" required>
              <NumField placeholder="مثلاً — ۷" value={form.installmentGapDays} onChange={e => setForm({...form, installmentGapDays: e.target.value})} unit="روز" min={0} />
            </Field>
          </Grid2>
        )}

        </div>

        <SectionTitle><span style={{ fontSize: 'var(--fs-sm)', lineHeight: 1, display: 'inline-block', marginLeft: 4 }}>💳</span> پرداخت‌ها — {toFa(paid.toLocaleString('fa-IR'))} از {toFa(total.toLocaleString('fa-IR'))}</SectionTitle>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {form.payments.map(p => (
          <div key={p.id} style={{ padding: 'var(--pad-normal) 0', borderBottom: '1px dashed var(--border)', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 'var(--fs-base)', color: 'var(--text)', fontWeight: 700, letterSpacing: '.3px' }}>پرداخت</span>
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
                <MoneyField placeholder="مثلاً — ۲٬۵۰۰٬۰۰۰" value={String(p.amount)} onChange={e => updatePayment(p.id, { amount: parseFloat(toEn(e.target.value).replace('٫','.')) || 0 })} />
              </Field>
            </Grid2>
            <Field label="تاریخ">
              <DatePicker value={p.date} onChange={v => updatePayment(p.id, { date: v })}  autoToday />
            </Field>
            {p.method === 'check' && (
              <>
                <Grid2>
                  <Field label="شماره چک"><Input placeholder="مثلاً — ۰۰۱" value={p.checkNo} onChange={e => updatePayment(p.id, { checkNo: e.target.value })} dir="ltr" /></Field>
                  <Field label="بانک"><Input placeholder="مثلاً — ملی" value={p.bank} onChange={e => updatePayment(p.id, { bank: e.target.value })} /></Field>
                </Grid2>
                <Field label="سرسید"><DatePicker value={p.dueDate} onChange={v => updatePayment(p.id, { dueDate: v })}  autoToday /></Field>
                <Field label="وضعیت چک">
                  <Select value={p.status || 'pending'} onChange={e => updatePayment(p.id, { status: e.target.value as CheckStatus })}>
                    <option value="pending">🟡 در جریان</option>
                    <option value="cleared">✅ نقد شد</option>
                    <option value="bounced">❌ برگشتی</option>
                  </Select>
                </Field>
                {p.status === 'cleared' && (
                  <Field label="تاریخ نقد"><DatePicker value={p.clearedDate || ''} onChange={v => updatePayment(p.id, { clearedDate: v })}  autoToday /></Field>
                )}
              </>
            )}
          </div>
        ))}
        <Btn size="sm" full onClick={addPayment}>+ افزودن پرداخت</Btn>
        </div>

        {rem > 0 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--fs-sm)', padding: 'var(--pad-normal)', background: 'var(--warn-soft)', color: 'var(--warn)', borderRadius: 'var(--r-sm)', fontWeight: 700 }}>
            <span>مانده:</span>
            <span>{toFa(rem.toLocaleString('fa-IR'))} ت</span>
          </div>
        )}

        <SectionTitle><span style={{ fontSize: 'var(--fs-sm)', lineHeight: 1, display: 'inline-block', marginLeft: 4 }}>📝</span> یادداشت</SectionTitle>
        <Field label="یادداشت">
            <Textarea placeholder="..." value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} />
          </Field>

        <ErrorBox>{err}</ErrorBox>
      </Modal>
  );
}
