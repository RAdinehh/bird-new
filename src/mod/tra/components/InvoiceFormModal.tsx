/**
 * InvoiceFormModal — فرم ثبت/ویرایش فاکتور
 */
import React, { useState } from 'react';
import { toFa, toEn } from '../../../shr/utils/fa';
import { AnomalyHint, useAnomalyHint, analyzeAnomaly } from '../../../shr/intelligence';
import {
  Btn, BtnRow, Field, Grid2, Grid3, Input, Modal, MoneyField, NumField,
  SectionTitle, Select, Textarea, ErrorBox,
} from '../../../shr/components/ui';
import DatePicker from '../../../shr/components/DatePicker';
import SmartSelect from '../../../shr/components/SmartSelect';
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
  showError: (field: string) => string | undefined;
  markTouched: (field: string) => void;
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
  onNewFlock?: () => void;
}

const getDescriptionPlaceholder = (cat: string): string => {
  switch (cat) {
    case 'chick':       return 'مثلاً: جوجه یک‌روزه راس ۳۰۸';
    case 'adult':       return 'مثلاً: مرغ مادر بالغ';
    case 'egg':         return 'مثلاً: تخم نطفه‌دار نژاد راس';
    case 'fertile_egg': return 'مثلاً: تخم نطفه‌دار نژاد راس';
    case 'feed':        return 'مثلاً: دان استارتر پیشگامان';
    case 'medicine':    return 'مثلاً: داکسی‌سایکلین ۱۰۰ml';
    case 'equipment':   return 'مثلاً: فن تونلی ۱۲۰';
    case 'broken':      return 'مثلاً: تخم‌های شکسته';
    case 'manure':      return 'مثلاً: کود مرغی خشک';
    case 'other':       return 'مثلاً: هزینه حمل بار';
    default:            return 'توضیح';
  }
};

const getPricePlaceholder = (cat: string): string => {
  switch (cat) {
    case 'chick':       return 'قیمت هر جوجه';
    case 'adult':       return 'قیمت هر پرنده';
    case 'egg':         return 'قیمت هر تخم';
    case 'fertile_egg': return 'قیمت هر تخم';
    case 'feed':        return 'قیمت هر کیلو';
    case 'medicine':    return 'قیمت هر بسته';
    case 'equipment':   return 'قیمت هر عدد';
    default:            return 'مثلاً — ۱۰٬۰۰۰';
  }
};

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

const getUnitPriceMax = (cat: string): number => {
  switch (cat) {
    case 'chick': return 30000000;
    case 'adult': return 20000000;
    case 'egg':
    case 'fertile_egg': return 5000000;
    case 'feed': return 30000000;
    case 'medicine': return 200000000;
    case 'equipment': return 20000000000;
    case 'broken': return 5000000;
    case 'manure': return 5000000;
    case 'other': return 5000000000;
    default: return 100000000;
  }
};

const getQuantityMax = (cat: string): number | undefined => {
  switch (cat) {
    case 'chick': return 50000;
    case 'adult': return 100000;
    case 'egg':
    case 'fertile_egg': return 150000;
    case 'feed': return 20000;
    case 'medicine': return 5000;
    case 'equipment': return 500;
    default: return undefined;
  }
};

export default function InvoiceFormModal(props: InvoiceFormModalProps) {
  const {
    open, setOpen, form, setForm, isPurchase,
    parties, flocks, whsItems, vErrors, err, onNewFlock, showError, markTouched,
    total, paid, rem,
    save, addItem, updateItem, removeItem,
    addPayment, updatePayment, removePayment,
  } = props;

  const [expandedItemId, setExpandedItemId] = useState<string | null>(form.items[0]?.id || null);

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
      footer={<BtnRow><Btn variant="primary" onClick={save}>ذخیره فاکتور</Btn><Btn onClick={() => setOpen(false)}>لغو</Btn></BtnRow>}
    >
      <SectionTitle><span style={{ fontSize: 'var(--fs-sm)', lineHeight: 1, display: 'inline-block', marginLeft: 4 }}>📋</span> اطلاعات پایه</SectionTitle>
      
      <Grid2>
        <Field label="تاریخ فاکتور" required error={showError('date')} onTouch={() => markTouched('date')}>
          <DatePicker value={form.date} onChange={v => setForm({...form, date: v})}  autoToday />
        </Field>
        <Field label="دسته">
          <Select value={form.category} onChange={e => {
            const newCat = e.target.value;
            const newUnit = getUnitForCategory(newCat);
            const newItems = form.items.map(it => {
              if (!it.category) return { ...it, unit: newUnit };
              return it;
            });
            const isOther = newCat === 'other';
            setForm({
              ...form,
              category: newCat,
              items: newItems,
              isPreorder: isOther ? false : form.isPreorder,
              deliveryDate: isOther ? '' : form.deliveryDate,
              advanceValue: isOther ? '' : form.advanceValue,
            });
          }}>
            {(isPurchase ? CATEGORIES.purchase : CATEGORIES.sale).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </Select>
        </Field>
      </Grid2>
      
      <Grid2>
        <Field label="نوع سفارش">
          <Select
            value={(form.isPreorder && form.category !== 'other') ? 'preorder' : 'stock'}
            onChange={e => setForm({ ...form, isPreorder: e.target.value === 'preorder' })}
          >
            <option value="stock">📦 خرید از موجودی</option>
            {form.category !== 'other' && (
              <option value="preorder">📅 پیش‌خرید</option>
            )}
          </Select>
        </Field>
        <Field label={isPurchase ? 'فروشنده' : 'مشتری'} required error={showError('partyId')} onTouch={() => markTouched('partyId')}>
          <SmartSelect
            value={form.partyId}
            onChange={v => setForm({...form, partyId: v})}
            options={parties.map(cc => ({ value: cc.id, label: cc.name, subtitle: cc.phone || undefined }))}
            placeholder="— انتخاب کنید —" modalTitle={isPurchase ? 'انتخاب فروشنده' : 'انتخاب مشتری'} autoThreshold={6}
          />
        </Field>
      </Grid2>

      <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 'var(--fs-sm)', color: 'var(--muted)', cursor: 'pointer', marginTop: 8 }}>
        <input type="checkbox" checked={!!form.isMixed} onChange={e => setForm({...form, isMixed: e.target.checked})} />
        فاکتور مختلط (فروشنده هر قلم متفاوت است)
      </label>
      
      {form.isPreorder && (
        <Field label="تاریخ تحویل" required>
          <DatePicker value={form.deliveryDate} onChange={v => setForm({...form, deliveryDate: v})}  autoToday />
        </Field>
      )}

      <SectionTitle>
        <span style={{ fontSize: 'var(--fs-sm)', lineHeight: 1, display: 'inline-block', marginLeft: 4 }}>📦</span> اقلام — جمع: {toFa(total.toLocaleString('fa-IR'))} ت
      </SectionTitle>
      <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--r-md)', padding: 'var(--sp-3)', marginBottom: 'var(--sp-4)', background: 'var(--card-solid)' }}>
      
      {form.items.length === 0 && (
        <div style={{ textAlign: 'center', padding: 'var(--sp-4) 0', color: 'var(--muted)', fontSize: 'var(--fs-sm)' }}>
          هنوز کالایی اضافه نکرده‌اید. روی دکمه زیر بزنید.
        </div>
      )}
      
      {form.items.map((it, idx) => {
        const isExpanded = expandedItemId === it.id;
        const cat = it.category || form.category;
        
        return (
          <div key={it.id} style={{ 
            background: 'var(--card)', 
            borderRadius: 'var(--r-md)', 
            padding: isExpanded ? 'var(--sp-3)' : 'var(--sp-2) var(--sp-3)',
            marginBottom: 'var(--sp-2)',
            boxShadow: isExpanded ? '0 2px 8px rgba(0,0,0,0.05)' : 'none',
            border: isExpanded ? '1.5px solid var(--accent)' : '1px solid var(--border)',
            transition: 'all 0.2s',
          }}>
            {/* هدر قلم */}
            <div 
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: isExpanded ? 'default' : 'pointer' }}
              onClick={() => !isExpanded && setExpandedItemId(it.id)}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <span style={{ fontSize: 'var(--fs-base)', fontWeight: 700, color: 'var(--text)' }}>
                  {it.description || (cat === 'chick' ? 'جوجه یک‌روزه' : 'قلم جدید')}
                </span>
                {!isExpanded && (
                  <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)' }}>
                    {toFa(it.quantity)} عدد × {toFa(it.unitPrice)} ت
                  </span>
                )}
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 'var(--fs-base)', fontWeight: 700, color: 'var(--accent)' }}>
                  {toFa(it.total.toLocaleString('fa-IR'))} ت
                </span>
                {!isExpanded && (
                  <button 
                    type="button" 
                    onClick={(e) => { e.stopPropagation(); setExpandedItemId(it.id); }}
                    style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: 16 }}
                  >
                    ✏️
                  </button>
                )}
                <button 
                  type="button" 
                  onClick={(e) => { e.stopPropagation(); removeItem(it.id); }} 
                  style={{ 
                    background: 'var(--danger-soft)', border: '1px solid var(--danger-border)', 
                    color: 'var(--danger)', borderRadius: 'var(--r-sm)', width: 28, height: 28, 
                    display: 'flex', alignItems: 'center', justifyContent: 'center', 
                    cursor: 'pointer', fontSize: 10, fontWeight: 700 
                  }}
                >
                  ✕
                </button>
              </div>
            </div>

            {/* بدنه قلم (وقتی باز است) */}
            {isExpanded && (
              <div style={{ marginTop: 'var(--sp-3)', display: 'flex', flexDirection: 'column', gap: 'var(--sp-2)', borderTop: '1px dashed var(--border)', paddingTop: 'var(--sp-3)' }}>
                <Grid2>
                  <Field label="شرح">
                    <Input placeholder={getDescriptionPlaceholder(cat)} value={it.description} onChange={e => updateItem(it.id, { description: e.target.value })} />
                  </Field>
                  <Field label="دستهٔ این قلم" hint="خالی = همان دستهٔ فاکتور">
                    <Select value={it.category || ''} onChange={e => {
                      const newCat = e.target.value;
                      const targetCat = newCat || form.category;
                      const newUnit = getUnitForCategory(targetCat);
                      updateItem(it.id, { category: newCat || undefined, unit: newUnit });
                    }}>
                      <option value="">همان فاکتور</option>
                      {(() => {
                        const saleOnly = ['manure', 'broken', 'fertile_egg'];
                        const list = saleOnly.includes(form.category) ? CATEGORIES.sale : CATEGORIES.purchase;
                        return list.map(([k, v]) => <option key={k} value={k}>{v}</option>);
                      })()}
                    </Select>
                  </Field>
                </Grid2>

                <Grid2>
                  <Field label="تعداد">
                    <NumField value={toFa(String(it.quantity))} onChange={e => updateItem(it.id, { quantity: parseFloat(toEn(e.target.value).replace('٫','.')) || 0 })} min={0} max={getQuantityMax(cat)} />
                  </Field>
                  <Field label="واحد">
                    <Select value={it.unit || 'pcs'} onChange={e => updateItem(it.id, { unit: e.target.value })}>
                      {Object.entries(UNIT_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </Select>
                  </Field>
                </Grid2>

                <Grid2>
                  <Field label="قیمت واحد">
                    <MoneyField placeholder={getPricePlaceholder(cat)} value={toFa(String(it.unitPrice))} onChange={e => updateItem(it.id, { unitPrice: parseFloat(toEn(e.target.value).replace('٫','.')) || 0 })} />
                  </Field>
                  <Field label="تخفیف">
                    <MoneyField placeholder="مثلاً — ۱۰٬۰۰۰" value={String(it.discountValue || '')} onChange={e => updateItem(it.id, { discountType: 'amount', discountValue: parseFloat(toEn(e.target.value).replace('٫','.')) || 0 })} />
                  </Field>
                </Grid2>

                <ItemDetailsForm
                  category={cat}
                  item={it}
                  invoiceDate={form.date}
                  updateItem={(patch: Record<string, unknown>) => updateItem(it.id, patch as Record<string, unknown>)}
                  isPurchase={true}
                  sellerSlot={form.isMixed ? (
                    <Field label="فروشنده این قلم" hint="خالی = فروشنده اصلی">
                      <SmartSelect
                        value={it.itemPartyId || ''}
                        onChange={v => updateItem(it.id, { itemPartyId: v })}
                        options={parties.map(c => ({ value: c.id, label: c.name }))}
                        placeholder="— همان اصلی —" modalTitle="انتخاب فروشنده" autoThreshold={6}
                      />
                    </Field>
                  ) : undefined}
                />
                
                {whsItems.length > 0 && !['chick', 'egg', 'fertile_egg', 'adult'].includes(cat) && (
                  <>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 'var(--fs-xs)', color: 'var(--muted)', cursor: 'pointer', marginTop: 8 }}>
                      <input type="checkbox" checked={!!it.itemId} onChange={e => {
                        if (e.target.checked) {
                          const first = whsItems[0];
                          if (first) {
                            const patch: any = { itemId: first.id, description: it.description || first.name, unit: first.unit };
                            if (first.storage && !it.storage) patch.storage = first.storage;
                            if (first.expireDate && !it.expiryDate) patch.expiryDate = first.expireDate;
                            updateItem(it.id, patch);
                          }
                        } else {
                          updateItem(it.id, { itemId: '' });
                        }
                      }} style={{ cursor: 'pointer', accentColor: 'var(--accent)' }} />
                      اتصال به انبار
                    </label>
                    {it.itemId && (
                      <SmartSelect
                        value={it.itemId}
                        onChange={v => {
                          const w = whsItems.find(x => x.id === v);
                          if (!w) { updateItem(it.id, { itemId: v }); return; }
                          const patch: any = { itemId: v, description: it.description || w.name, unit: w.unit };
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
              </div>
            )}
          </div>
        );
      })}
      
      <button 
        type="button" 
        onClick={addItem} 
        style={{
          width: '100%', height: 42, boxSizing: 'border-box', padding: '0 12px',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--sp-2)',
          background: 'var(--btn-bg)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)',
          color: 'var(--text)', fontSize: 'var(--fs-sm)', fontWeight: 700,
          cursor: 'pointer', marginTop: 'var(--sp-2)', marginBottom: 'var(--sp-4)',
        }}
      >
        <span style={{ fontSize: 18, lineHeight: 1, color: 'var(--accent)' }}>+</span> افزودن قلم جدید
      </button>
      </div>

      <SectionTitle>
        <span style={{ fontSize: 'var(--fs-sm)', lineHeight: 1, display: 'inline-block', marginLeft: 4 }}>📅</span> شرایط پرداخت
      </SectionTitle>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-2)', paddingBottom: 'var(--sp-2)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-2)', paddingBottom: 'var(--sp-2)' }}>
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
            {form.paymentTerms !== 'cash' && form.paymentTerms !== 'custom' && (
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
                <Field label="تخفیف نقدی (٪)" hint="اگر زودتر پرداخت شود">
                  <NumField placeholder="مثلاً — ۲" value={form.cashDiscountPct || ''} onChange={e => setForm({...form, cashDiscountPct: e.target.value})} unit="٪" min={0} max={100} />
                </Field>
                <Field label="مهلت (روز)" hint="چند روز از تاریخ فاکتور">
                  <NumField placeholder="مثلاً — ۱۰" value={form.cashDiscountDays || ''} onChange={e => setForm({...form, cashDiscountDays: e.target.value})} unit="روز" min={0} />
                </Field>
              </Grid2>
              {form.cashDiscountPct && form.cashDiscountDays && total > 0 && (
                <div style={{ padding: 'var(--pad-tight)', background: 'var(--accent-soft)', borderRadius: 'var(--r-sm)', fontSize: 'var(--fs-xs)', color: 'var(--accent)', textAlign: 'center', marginTop: 4, fontWeight: 600 }}>
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
            const advanceAmt = form.isPreorder && form.advanceType === 'amount' ? (parseFloat(toEnLocal(form.advanceValue).replace('٫','.')) || 0) : 0;
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
                  <div key={inst.id} style={{ display: 'flex', justifyContent: 'space-between', padding: 'var(--pad-tight)', background: 'var(--input-bg)', borderRadius: 'var(--r-sm)', fontSize: 'var(--fs-xs)', color: 'var(--text)' }}>
                    <span>قسط {inst.number}</span>
                    <span style={{ color: 'var(--muted)' }}>{inst.dueDate}</span>
                    <span style={{ fontWeight: 700 }}>{inst.amount.toLocaleString('fa-IR')} ت</span>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
        </div>
      </div>

      <SectionTitle>
        <span style={{ fontSize: 'var(--fs-sm)', lineHeight: 1, display: 'inline-block', marginLeft: 4 }}>💳</span> پرداخت‌ها و تسویه
      </SectionTitle>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-2)', paddingBottom: 'var(--sp-2)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          
          {/* خلاصه مالی */}
          <div style={{ background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', padding: 'var(--sp-2) var(--sp-3)', display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--fs-sm)' }}>
              <span style={{ color: 'var(--muted)' }}>جمع کل فاکتور:</span>
              <span style={{ fontWeight: 700 }}>{toFa(total.toLocaleString('fa-IR'))} ت</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--fs-sm)' }}>
              <span style={{ color: 'var(--muted)' }}>پرداخت‌شده:</span>
              <span style={{ fontWeight: 700, color: 'var(--accent)' }}>{toFa(paid.toLocaleString('fa-IR'))} ت</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--fs-sm)' }}>
              <span style={{ color: 'var(--muted)' }}>مانده نهایی:</span>
              <span style={{ fontWeight: 700, color: rem > 0.5 ? 'var(--warn)' : 'var(--accent)' }}>{toFa(rem.toLocaleString('fa-IR'))} ت</span>
            </div>
          </div>

          {form.payments.map(p => (
            <div key={p.id} style={{ padding: 'var(--sp-3)', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', position: 'relative', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button type="button" onClick={() => removePayment(p.id)} style={{ position: 'absolute', top: 8, left: 8, background: 'var(--danger-soft)', border: '1px solid var(--danger-border)', color: 'var(--danger)', borderRadius: 'var(--r-sm)', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 10, fontWeight: 700 }}>✕</button>
              
              <div style={{ marginTop: 4 }}>
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
                  <Field label="تاریخ پرداخت">
                    <DatePicker value={p.date} onChange={v => updatePayment(p.id, { date: v })} min={toEn(form.date)} autoToday />
                  </Field>
                  <Field label="مبلغ">
                    <MoneyField
                      placeholder="مثلاً — ۲٬۵۰۰٬۰۰۰"
                      value={toFa(String(p.amount))}
                      onChange={e => {
                        const raw = parseFloat(toEn(e.target.value).replace('٫','.')) || 0;
                        const val = (p.type !== 'refund' && rem > 0) ? Math.min(raw, rem) : raw;
                        updatePayment(p.id, { amount: val });
                      }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4, padding: '0 4px' }}>
                      <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)' }}>{rem > 0 && p.type !== 'refund' ? `باقی‌مانده: ${toFa(rem.toLocaleString('fa-IR'))} ت` : ''}</span>
                      {rem > 0 && p.type !== 'refund' && (
                        <button type="button" onClick={() => updatePayment(p.id, { amount: (p.amount || 0) + rem })} style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: 'var(--fs-xs)', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', textDecoration: 'underline', whiteSpace: 'nowrap' }}>تسویه کل</button>
                      )}
                    </div>
                  </Field>
                </Grid2>

                {p.method === 'check' && (
                  <>
                    <Grid2>
                      <Field label="شماره چک"><Input placeholder="مثلاً — ۰۰۱" value={p.checkNo} onChange={e => updatePayment(p.id, { checkNo: e.target.value })} dir="ltr" /></Field>
                      <Field label="بانک"><Input placeholder="مثلاً — ملی" value={p.bank} onChange={e => updatePayment(p.id, { bank: e.target.value })} /></Field>
                    </Grid2>
                    <Grid2>
                      <Field label="سرسید"><DatePicker value={p.dueDate} onChange={v => updatePayment(p.id, { dueDate: v })}  autoToday /></Field>
                      <Field label="وضعیت چک">
                        <Select value={p.status || 'pending'} onChange={e => {
                          const newStatus = e.target.value as CheckStatus;
                          const patch: Partial<Payment> = { status: newStatus };
                          if (newStatus === 'bounced') { patch.bouncedDate = getTodayJalali(); patch.clearedDate = ''; }
                          else if (newStatus === 'cleared') { patch.clearedDate = getTodayJalali(); patch.bouncedDate = ''; }
                          else { patch.bouncedDate = ''; patch.clearedDate = ''; }
                          updatePayment(p.id, patch);
                        }}>
                          <option value="pending">🟡 در جریان</option>
                          <option value="cleared">✅ نقد شد</option>
                          <option value="bounced">❌ برگشتی</option>
                        </Select>
                      </Field>
                    </Grid2>
                    {p.status === 'cleared' && (
                      <Field label="تاریخ نقد شدن"><DatePicker value={p.clearedDate || ''} onChange={v => updatePayment(p.id, { clearedDate: v })}  autoToday /></Field>
                    )}
                  </>
                )}
              </div>
            </div>
          ))}

          <button type="button" onClick={addPayment} style={{ width: '100%', height: 42, boxSizing: 'border-box', padding: '0 12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'var(--sp-2)', background: 'var(--btn-bg)', border: '1px dashed var(--border)', borderRadius: 'var(--r-md)', color: 'var(--text)', fontSize: 'var(--fs-sm)', fontWeight: 700, cursor: 'pointer', marginTop: 'var(--sp-2)' }}>
            <span style={{ fontSize: 18, lineHeight: 1, color: 'var(--accent)' }}>+</span> افزودن پرداخت دیگر
          </button>
        </div>
      </div>

      <SectionTitle><span style={{ fontSize: 'var(--fs-sm)', lineHeight: 1, display: 'inline-block', marginLeft: 4 }}>📝</span> یادداشت</SectionTitle>
      <Field label="یادداشت">
        <Textarea placeholder="..." rows={3} minRows={3} value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} />
      </Field>

      <InvoiceSmartSummary form={form} total={total} paid={paid} />
      <ErrorBox>{err}</ErrorBox>
    </Modal>
  );
}
