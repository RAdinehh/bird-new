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
import InvoiceSmartSummary from './InvoiceSmartSummary';
import { type CheckStatus } from '../store';
import { CATEGORIES, generateInstallments, type InvoiceItem, type Payment } from '../store';
import { UNIT_LABEL } from '../../whs/store';
import type { F } from '../types-invoice';
import { useCtc } from '../../ctc/store';
import { computePartyCredit } from '../store';
import { getTodayJalali } from '../calc';

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

const getUnitForCategory = (cat: string): string => {
  switch (cat) {
    case 'chick': return 'pcs';
    case 'adult': return 'pcs';
    case 'egg': return 'pcs';
    case 'fertile_egg': return 'pcs';
    case 'broken': return 'pcs';
    case 'feed': return 'kg';
    case 'medicine': return 'ml';
    case 'equipment': return 'pcs';
    case 'manure': return 'kg';
    default: return 'pcs';
  }
};

export default function InvoiceFormModal(props: InvoiceFormModalProps) {
  const {
    open, setOpen, form, setForm, isPurchase,
    parties, flocks, whsItems, vErrors, err, onNewFlock,
    total, paid, rem,
    save, addItem, updateItem, removeItem,
    addPayment, updatePayment, removePayment,
  } = props;

  const _contacts = useCtc(s => s.contacts);
  const _currentPartyCredit = (() => {
    if (!form.partyId) return 0;
    const c = _contacts.find(x => x.id === form.partyId);
    return c?.creditBalance || 0;
  })();
  const _canUseCredit = _currentPartyCredit > 0.5 && rem > 0.5;
  const _handleUseCredit = () => {
    if (!_canUseCredit) return;
    const useAmount = Math.min(_currentPartyCredit, rem);
    setForm(f => ({
      ...f,
      payments: [...f.payments, {
        id: crypto.randomUUID(),
        date: form.date || '',
        amount: useAmount,
        method: 'cash' as const,
        type: 'advance' as const,
        checkNo: '', bank: '', dueDate: '',
        notes: 'استفاده از اعتبار طرف حساب',
      }],
    }));
  };

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
            <Select value={form.category} onChange={e => {
              const newCat = e.target.value;
              // ═══ جادوی آبشاری: واحد همه اقلامی که دسته اختصاصی ندارند را آپدیت کن ═══
              const newUnit = getUnitForCategory(newCat);
              const newItems = form.items.map(it => {
                if (!it.category) return { ...it, unit: newUnit };
                return it;
              });
              setForm({ ...form, category: newCat, items: newItems });
            }}>
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
              <option value="stock">📦 خرید از موجودی</option>
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
        {form.items.length === 0 && (
          <div style={{ textAlign: 'center', padding: 'var(--sp-4)', color: 'var(--muted)', fontSize: 'var(--fs-sm)', background: 'var(--card)', borderRadius: 'var(--r-sm)', marginBottom: 'var(--sp-2)' }}>
            هنوز کالایی اضافه نکرده‌اید. روی دکمه زیر بزنید.
          </div>
        )}
        {form.items.map((it, idx) => (
          <div key={it.id} style={{
            padding: 'var(--sp-3)',
            background: 'var(--card)',
            borderTop: '1px solid var(--border)',
            borderBottom: '1px solid var(--border)',
            borderLeft: '1px solid var(--border)',
            borderRight: (['chick', 'adult'].includes(it.category || form.category)) ? '4px solid var(--purple)' :
                        (['feed', 'medicine', 'equipment'].includes(it.category || form.category)) ? '4px solid var(--accent)' :
                        (['egg', 'fertile_egg'].includes(it.category || form.category)) ? '4px solid var(--warn)' :
                        '4px solid var(--border)',
            borderRadius: 'var(--r-lg)',
            marginBottom: 'var(--sp-2)',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 'var(--fs-base)', color: 'var(--text)', fontWeight: 700, letterSpacing: '.3px' }}>قلم {toFa(idx + 1)}</span>
              <button type="button" onClick={() => removeItem(it.id)} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 'var(--fs-base)' }}>✕</button>
            </div>

            <div style={{ paddingTop: 12, fontSize: 'var(--fs-base)', fontWeight: 700, color: 'var(--text)', letterSpacing: '.3px', borderTop: '1px dashed var(--border)', marginBottom: 4 }}>
              📦 مشخصات پایه
            </div>

            <Input placeholder="توضیح (مثلاً: تخم نطفه‌دار نژاد راس)" value={it.description} onChange={e => updateItem(it.id, { description: e.target.value })} />

            <Grid2>
              <Field label="تعداد"><NumField value={toFa(String(it.quantity))} onChange={e => updateItem(it.id, { quantity: parseFloat(toEn(e.target.value).replace('٫','.')) || 0 })} min={0} /></Field>
              <Field label="واحد">
                <Select value={it.unit || 'pcs'} onChange={e => updateItem(it.id, { unit: e.target.value })}>
                  {Object.entries(UNIT_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </Select>
              </Field>
            </Grid2>

            <Grid2>
              <Field label="قیمت واحد"><MoneyField value={toFa(String(it.unitPrice))} onChange={e => updateItem(it.id, { unitPrice: parseFloat(toEn(e.target.value).replace('٫','.')) || 0 })} /></Field>
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

            <Field label="دستهٔ این قلم" hint="خالی = همان دستهٔ فاکتور (برای فاکتور مختلط)">
              <Select value={it.category || ''} onChange={e => {
                  const newCat = e.target.value;
                  // واحد بر اساس دسته جدیدِ قلم (یا دسته هدر اگر قلم خالی شد) تعیین می‌شود
                  const targetCat = newCat || form.category;
                  const newUnit = getUnitForCategory(targetCat);
                  updateItem(it.id, { category: newCat || undefined, unit: newUnit });
                }}>
                <option value="">همان فاکتور — {(() => {
                  const saleOnly = ['manure', 'broken', 'fertile_egg'];
                  const list = saleOnly.includes(form.category) ? CATEGORIES.sale : CATEGORIES.purchase;
                  const found = list.find(x => x[0] === form.category);
                  return found ? found[1] : form.category;
                })()}</option>
                {(() => {
                  const saleOnly = ['manure', 'broken', 'fertile_egg'];
                  const list = saleOnly.includes(form.category) ? CATEGORIES.sale : CATEGORIES.purchase;
                  return list.map(([k, v]) => <option key={k} value={k}>{v}</option>);
                })()}
              </Select>
            </Field>

            <ItemDetailsForm
              category={it.category || form.category}
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

            {whsItems.length > 0 && !['chick', 'egg', 'fertile_egg', 'adult'].includes(it.category || form.category) && (
              <>
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 'var(--fs-xs)', color: 'var(--muted)', cursor: 'pointer' }}>
                  <input type="checkbox" checked={!!it.itemId}
                    onChange={e => {
                      if (e.target.checked) {
                        const first = whsItems[0];
                        if (first) {
                          const patch: any = {
                            itemId: first.id,
                            description: it.description || first.name,
                            unit: first.unit,
                          };
                          if (first.storage && !it.storage) patch.storage = first.storage;
                          if (first.expireDate && !it.expiryDate) patch.expiryDate = first.expireDate;
                          updateItem(it.id, patch);
                        }
                      } else {
                        updateItem(it.id, { itemId: '' });
                      }
                    }}
                    style={{ cursor: 'pointer', accentColor: 'var(--accent)' }} />
                  اتصال به انبار
                </label>
                {it.itemId && (
                  <SmartSelect
                    value={it.itemId}
                    onChange={v => {
                      const w = whsItems.find(x => x.id === v);
                      if (!w) {
                        updateItem(it.id, { itemId: v });
                        return;
                      }
                      const patch: any = {
                        itemId: v,
                        description: it.description || w.name,
                        unit: w.unit,
                      };
                      if (w.storage && !it.storage) patch.storage = w.storage;
                      if (w.expireDate && !it.expiryDate) patch.expiryDate = w.expireDate;
                      updateItem(it.id, patch);
                    }}
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
        <Btn type="button" onClick={addItem} style={{
            width: '100%',
            height: 38,
            boxSizing: 'border-box',
            padding: '0 12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 'var(--sp-2)',
            background: 'transparent',
            border: 'none', outline: '1.5px dashed var(--border-solid)', outlineOffset: '-1.5px',
            borderRadius: 'var(--r-md)',
            color: 'var(--muted)',
            fontSize: 'var(--fs-sm)',
            fontWeight: 600,
            cursor: 'pointer',
            marginTop: 'var(--sp-2)',
            marginBottom: 'var(--sp-2)',
          }}>
          <span style={{ fontSize: 18, lineHeight: 1, color: 'var(--accent)', fontWeight: 700 }}>+</span>
          افزودن قلم
        </Btn>


        <AccordionSection
          title="شرایط پرداخت"
          icon="📅"
          defaultOpen={form.paymentTerms !== 'cash' || form.isPreorder}
          summary={
            form.isPreorder ? 'پیش‌فروش'
            : form.paymentTerms === 'cash' ? 'نقدی'
            : form.paymentTerms === 'installment' ? `${toFa(form.installmentCount || '۰')} قسط`
            : 'توافقی'
          }
        >
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
          {form.paymentTerms !== 'cash' && (
            <Field label="سرسید (خودکار)">
              <Input placeholder="خودکار محاسبه می‌شود" readOnly value={toFa(form.dueDate)} style={{ textAlign: 'right' }} />
            </Field>
          )}
          {form.paymentTerms === 'custom' && (
            <Field label="تاریخ سرسید" required>
              <DatePicker value={form.customDueDate} onChange={v => setForm({...form, customDueDate: v, dueDate: v})}  autoToday />
            </Field>
          )}
        </Grid2>
        
        {form.paymentTerms !== 'cash' && (
          <>
            <div style={{ fontWeight: 700, fontSize: 'var(--fs-sm)', color: 'var(--muted)', marginTop: 8, marginBottom: 4 }}>
              💰 تخفیف نقدی (اختیاری)
            </div>
            <Grid2>
              <Field label="درصد تخفیف" hint="اگر زودتر پرداخت شود">
                <NumField placeholder="مثلاً — ۲" value={form.cashDiscountPct || ''} onChange={e => setForm({...form, cashDiscountPct: e.target.value})} unit="٪" min={0} max={100} />
              </Field>
              <Field label="مهلت (روز)" hint="چند روز از تاریخ فاکتور">
                <NumField placeholder="مثلاً — ۱۰" value={form.cashDiscountDays || ''} onChange={e => setForm({...form, cashDiscountDays: e.target.value})} unit="روز" min={0} />
              </Field>
            </Grid2>
            {form.cashDiscountPct && form.cashDiscountDays && total > 0 && (
              <div style={{
                padding: 'var(--pad-tight)', background: 'var(--accent-soft)',
                borderRadius: 'var(--r-sm)', fontSize: 'var(--fs-xs)',
                color: 'var(--accent)', textAlign: 'center',
                marginTop: 4, fontWeight: 600,
              }}>
                💰 تا {toFa(form.cashDiscountDays)} روز: تخفیف {toFa(form.cashDiscountPct)}٪ (≈ {toFa(Math.round(total * parseFloat(toEn(form.cashDiscountPct)) / 100).toLocaleString('fa-IR'))} ت)
              </div>
            )}
          </>
        )}

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

        {form.paymentTerms === 'installment' && (() => {
          const toEnLocal = (s: string) => s.replace(/[۰-۹]/g, (d: string) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)));
          const cnt = parseInt(toEnLocal(form.installmentCount)) || 0;
          const gap = parseInt(toEnLocal(form.installmentGapDays)) || 30;
          const advanceAmt = form.isPreorder && form.advanceType === 'amount'
            ? (parseFloat(toEnLocal(form.advanceValue).replace('٫','.')) || 0) : 0;
          const totalLocal = form.items.reduce((acc, it) => {
            const base = (it.quantity || 0) * (it.unitPrice || 0);
            let disc = 0;
            if (it.discountType === 'percent') disc = base * ((it.discountValue || 0) / 100);
            else if (it.discountType === 'amount') disc = it.discountValue || 0;
            return acc + Math.max(0, base - disc) + (it.shipping || 0);
          }, 0);
          const preview = generateInstallments(totalLocal, cnt, gap, form.date, advanceAmt);
          if (preview.length === 0) return null;
          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 8 }}>
              <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', marginBottom: 4 }}>📅 پیش‌نمایش اقساط</div>
              {preview.map(inst => (
                <div key={inst.id} style={{
                  display: 'flex', justifyContent: 'space-between',
                  padding: 'var(--pad-tight)', background: 'var(--input-bg)',
                  borderRadius: 'var(--r-sm)', fontSize: 'var(--fs-xs)',
                  color: 'var(--text)',
                }}>
                  <span>قسط {inst.number}</span>
                  <span style={{ color: 'var(--muted)' }}>{inst.dueDate}</span>
                  <span style={{ fontWeight: 700 }}>{inst.amount.toLocaleString('fa-IR')} ت</span>
                </div>
              ))}
            </div>
          );
        })()}

        </div>
        </AccordionSection>

        <AccordionSection
          title={`پرداخت‌ها — ${toFa(paid.toLocaleString('fa-IR'))} از ${toFa(total.toLocaleString('fa-IR'))}`}
          icon="💳"
          defaultOpen={form.payments.length > 0}
          key={`payments-${form.payments.length}`} // Force remount when length changes
        >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {form.payments.map(p => (
          <div key={p.id} style={{
            padding: 'var(--sp-3)',
            background: 'var(--card)',
            borderTop: '1px solid var(--border)',
            borderBottom: '1px solid var(--border)',
            borderLeft: '1px solid var(--border)',
            borderRight: p.type === 'refund' ? '4px solid var(--danger)' :
                        p.type === 'advance' ? '4px solid var(--purple)' :
                        p.method === 'check' ? '4px solid var(--info)' :
                        '4px solid var(--accent)',
            borderRadius: 'var(--r-lg)',
            marginBottom: 'var(--sp-2)',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 'var(--fs-base)', color: 'var(--text)', fontWeight: 700, letterSpacing: '.3px' }}>پرداخت</span>
              <button type="button" onClick={() => removePayment(p.id)} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontFamily: 'inherit' }}>✕</button>
            </div>
            <Grid2>
              <Field label="نوع پرداخت">
                <Select value={p.type || 'regular'} onChange={e => updatePayment(p.id, { type: e.target.value as 'regular' | 'advance' | 'refund' | 'settlement' })}>
                  <option value="regular">💵 پرداخت عادی</option>
                  <option value="advance">📌 پیش‌پرداخت</option>
                  <option value="settlement">✅ تسویه قسط</option>
                  <option value="refund">↩️ عودت وجه</option>
                </Select>
              </Field>
              <Field label="روش">
                <Select value={p.method} onChange={e => updatePayment(p.id, { method: e.target.value as 'cash' | 'card' | 'check' })}>
                  <option value="cash">نقدی</option>
                  <option value="card">کارت</option>
                  <option value="check">چک</option>
                </Select>
              </Field>
            </Grid2>

            <Grid2>
              <Field label="مبلغ" hint={rem > 0 && p.type !== 'refund' ? `باقی‌مانده فاکتور: ${toFa(rem.toLocaleString('fa-IR'))} ت` : undefined}>
                <div style={{ display: 'flex', gap: 4, alignItems: 'stretch' }}>
                  <div style={{ flex: 1 }}>
                    <MoneyField placeholder="مثلاً — ۲٬۵۰۰٬۰۰۰" value={toFa(String(p.amount))} onChange={e => updatePayment(p.id, { amount: parseFloat(toEn(e.target.value).replace('٫','.')) || 0 })} />
                  </div>
                  {rem > 0 && p.type !== 'refund' && (
                    <Btn size="sm" variant="outline" onClick={() => updatePayment(p.id, { amount: rem })} style={{ flexShrink: 0, whiteSpace: 'nowrap' }}>
                      تسویه کل
                    </Btn>
                  )}
                </div>
              </Field>
              <Field label="تاریخ">
                <DatePicker value={p.date} onChange={v => updatePayment(p.id, { date: v })}  autoToday />
              </Field>
            </Grid2>
            {p.method === 'check' && (
              <>
                <Grid2>
                  <Field label="شماره چک"><Input placeholder="مثلاً — ۰۰۱" value={p.checkNo} onChange={e => updatePayment(p.id, { checkNo: e.target.value })} dir="ltr" /></Field>
                  <Field label="بانک"><Input placeholder="مثلاً — ملی" value={p.bank} onChange={e => updatePayment(p.id, { bank: e.target.value })} /></Field>
                </Grid2>
                <Field label="سرسید"><DatePicker value={p.dueDate} onChange={v => updatePayment(p.id, { dueDate: v })}  autoToday /></Field>
                <Field label="وضعیت چک">
                  <Select value={p.status || 'pending'} onChange={e => {
                  const newStatus = e.target.value as CheckStatus;
                  const patch: Partial<Payment> = { status: newStatus };
                  if (newStatus === 'bounced') {
                    patch.bouncedDate = getTodayJalali();
                    patch.clearedDate = '';
                  } else if (newStatus === 'cleared') {
                    patch.clearedDate = getTodayJalali();
                    patch.bouncedDate = '';
                  } else {
                    patch.bouncedDate = '';
                    patch.clearedDate = '';
                  }
                  updatePayment(p.id, patch);
                }}>
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
        <Btn type="button" onClick={addPayment} style={{
            width: '100%',
            height: 38,
            boxSizing: 'border-box',
            padding: '0 12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 'var(--sp-2)',
            background: 'transparent',
            border: 'none', outline: '1.5px dashed var(--border-solid)', outlineOffset: '-1.5px',
            borderRadius: 'var(--r-md)',
            color: 'var(--muted)',
            fontSize: 'var(--fs-sm)',
            fontWeight: 600,
            cursor: 'pointer',
            marginTop: 'var(--sp-2)',
            marginBottom: 'var(--sp-2)',
          }}>
          <span style={{ fontSize: 18, lineHeight: 1, color: 'var(--accent)', fontWeight: 700 }}>+</span>
          افزودن پرداخت
        </Btn>
        </div>
        </AccordionSection>

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

        {/* 🆕 خلاصه فاکتور قبل از ذخیره */}
        <div style={{ marginTop: 'var(--sp-4)', padding: 'var(--sp-3)', background: 'var(--card)', borderRadius: 'var(--r-lg)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--fs-sm)' }}>
            <span style={{ color: 'var(--muted)' }}>جمع کل فاکتور:</span>
            <span style={{ fontWeight: 700 }}>{toFa(total.toLocaleString('fa-IR'))} ت</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--fs-sm)', color: rem > 0.5 ? 'var(--warn)' : 'var(--accent)', fontWeight: 700 }}>
            <span>مانده نهایی:</span>
            <span>{toFa(rem.toLocaleString('fa-IR'))} ت</span>
          </div>
        </div>

        <InvoiceSmartSummary form={form} total={total} paid={paid} />

        <ErrorBox>{err}</ErrorBox>
      </Modal>
  );
}
