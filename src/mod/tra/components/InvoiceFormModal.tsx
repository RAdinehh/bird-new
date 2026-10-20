/**
 * InvoiceFormModal — فرم ثبت/ویرایش فاکتور (طراحی تمیز و استاندارد)
 */
import React, { useState, useEffect } from 'react';
import { toFa, toEn } from '../../../shr/utils/fa';
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

  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
  const [expandedPaymentId, setExpandedPaymentId] = useState<string | null>(null);
  const [showPaymentSection, setShowPaymentSection] = useState(false);

  // باز کردن خودکار قلم جدید به همراه تنظیمات تکمیلی آن
  const prevLengthRef = React.useRef(form.items.length);
  useEffect(() => {
    if (form.items.length > prevLengthRef.current) {
      // یک قلم جدید اضافه شده است
      const lastItem = form.items[form.items.length - 1];
      if (lastItem) {
        setExpandedItemId(lastItem.id);
      }
    }
    prevLengthRef.current = form.items.length;
  }, [form.items.length]);

  const prevPaymentsLengthRef = React.useRef(form.payments.length);
  useEffect(() => {
    if (form.payments.length > prevPaymentsLengthRef.current) {
      const lastPayment = form.payments[form.payments.length - 1];
      if (lastPayment) {
        setExpandedPaymentId(lastPayment.id);
      }
    }
    prevPaymentsLengthRef.current = form.payments.length;
  }, [form.payments.length]);

  return (
    <Modal
      open={open} onClose={() => setOpen(false)}
      title={form.id ? (isPurchase ? 'ویرایش خرید' : 'ویرایش فروش') : (isPurchase ? 'ثبت خرید' : 'ثبت فروش')}
      footer={<BtnRow><Btn variant="primary" onClick={save}>ذخیره فاکتور</Btn><Btn onClick={() => setOpen(false)}>لغو</Btn></BtnRow>}
    >
      {/* ====== اطلاعات پایه ====== */}
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

      {/* ====== اقلام ====== */}
      <SectionTitle>
        <span style={{ fontSize: 'var(--fs-sm)', lineHeight: 1, display: 'inline-block', marginLeft: 4 }}>📦</span> اقلام {total > 0 && `— جمع: ${toFa(total.toLocaleString('fa-IR'))} ت`}
      </SectionTitle>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-2)', marginBottom: 'var(--sp-3)' }}>
        
        
        {form.items.map((it, idx) => {
          const isExpanded = expandedItemId === it.id;
          const cat = it.category || form.category;
          
          return (
            <div key={it.id} style={{ 
              background: 'var(--card-solid)',
              border: isExpanded ? '1.5px solid var(--accent)' : '1px solid var(--border)', 
              borderRadius: 'var(--r-md)', 
              padding: 'var(--sp-3)',  marginBottom: 'var(--sp-2)',
              display: 'flex', 
              flexDirection: 'column', 
              gap: 'var(--sp-3)',
              transition: 'all 0.2s',
            }}>
              {/* هدر قلم */}
              <div 
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: isExpanded ? 'default' : 'pointer' }}
                onClick={() => setExpandedItemId(isExpanded ? null : it.id)}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <span style={{ fontSize: 'var(--fs-base)', fontWeight: 800, color: 'var(--text)' }}>
                    {it.description || (cat === 'chick' ? 'جوجه یک‌روزه' : cat === 'egg' || cat === 'fertile_egg' ? 'تخم نطفه‌دار' : 'قلم جدید')}
                  </span>
                  <span style={{ fontSize: 'var(--fs-sm)', color: 'var(--muted)' }}>
                    {it.quantity > 0 || it.unitPrice > 0
                      ? `${toFa(it.quantity)} ${(UNIT_LABEL as any)[it.unit || 'pcs'] || 'عدد'} × ${toFa(it.unitPrice)} ت`
                      : 'در حال ویرایش...'}
                  </span>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
                  <span style={{ fontSize: 'var(--fs-base)', fontWeight: 800, color: it.total > 0 ? 'var(--accent)' : 'var(--muted)' }}>
                    {toFa(it.total.toLocaleString('fa-IR'))} ت
                  </span>
                  <button 
                    type="button" 
                    onClick={(e) => { e.stopPropagation(); removeItem(it.id); }} 
                    style={{ 
                      background: 'var(--danger-soft)', 
                      border: '1px solid var(--danger)', 
                      color: 'var(--danger)', 
                      cursor: 'pointer', 
                      borderRadius: 'var(--r-sm)', 
                      width: 28, 
                      height: 28, 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      fontSize: 12, 
                      padding: 0, 
                      flexShrink: 0, 
                      fontFamily: 'inherit', 
                      fontWeight: 700
                    }}
                    title="حذف قلم"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* بدنه قلم */}
              {isExpanded && (
                <div style={{ marginTop: 'var(--sp-1)', display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
                  
                  {form.isMixed && (
                  <Grid2>
                    
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
                  )}

                  <Grid2>
                    <Field label="تعداد">
                      <NumField value={toFa(String(it.quantity))} onChange={e => updateItem(it.id, { quantity: parseFloat(toEn(e.target.value).replace('٫','.')) || 0 })} min={0} max={getQuantityMax(cat)} />
                    </Field>
                    <Field label="قیمت واحد">
                      <MoneyField placeholder={getPricePlaceholder(cat)} value={toFa(String(it.unitPrice))} onChange={e => updateItem(it.id, { unitPrice: parseFloat(toEn(e.target.value).replace('٫','.')) || 0 })} />
                    </Field>
                  </Grid2>

                  <Grid2>
                    <Field label="نام فروشنده این قلم" hint="خالی = فروشنده اصلی فاکتور">
                      <SmartSelect
                        value={it.itemPartyId || ''}
                        onChange={v => updateItem(it.id, { itemPartyId: v })}
                        options={parties.map(c => ({ value: c.id, label: c.name }))}
                        placeholder="— انتخاب کنید —" modalTitle="انتخاب فروشنده" autoThreshold={6}
                      />
                    </Field>
                    <Field label="هزینه حمل این قلم">
                      <MoneyField placeholder="مثلاً — ۵۰٬۰۰۰" value={String(it.shipping || '')} onChange={e => updateItem(it.id, { shipping: parseFloat(toEn(e.target.value).replace('٫','.')) || 0 })} min={0} />
                    </Field>
                  </Grid2>

                  <Grid2>
                    <Field label="تخفیف این قلم">
                      <MoneyField placeholder="مثلاً — ۱۰٬۰۰۰" value={String(it.discountValue || '')} onChange={e => updateItem(it.id, { discountType: 'amount', discountValue: parseFloat(toEn(e.target.value).replace('٫','.')) || 0 })} />
                    </Field>
                    <Field label="مبلغ کل این قلم">
                      <div style={{ height: 38, display: 'flex', alignItems: 'center', fontWeight: 800, color: 'var(--accent)', direction: 'ltr' }}>
                        {toFa(it.total.toLocaleString('fa-IR'))} ت
                      </div>
                    </Field>
                  </Grid2>

                  {isExpanded && (
                    <div style={{ paddingTop: 'var(--sp-2)' }}>
                      <ItemDetailsForm
                        category={cat}
                        item={it}
                        invoiceDate={form.date}
                        updateItem={(patch: Record<string, unknown>) => updateItem(it.id, patch as Record<string, unknown>)}
                        isPurchase={true}
                      />
                    </div>
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
            width: '100%', height: 40, padding: 0, boxSizing: 'border-box', background: 'var(--accent-soft)', 
            border: '1.5px dashed var(--accent-border)', borderRadius: 'var(--r-md)', 
            color: 'var(--accent)', fontFamily: 'inherit', fontSize: 'var(--fs-sm)', 
            fontWeight: 700, cursor: 'pointer', display: 'flex', 
            alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 4
          }}
        >
          <span style={{ fontSize: 20, lineHeight: 1 }}>+</span> 
          {form.items.length === 0 ? 'افزودن اولین قلم' : 'افزودن قلم دیگر'}
        </button>
      </div>

      {/* ⚙️ دکمه تنظیم شرایط پرداخت (وقتی قیمت هنوز وارد نشده) */}
      {form.items.length > 0 && total === 0 && !showPaymentSection && (
        <button 
          type="button" 
          onClick={() => setShowPaymentSection(true)}
          style={{
            width: '100%', height: 38, marginBottom: 'var(--sp-4)',
            background: 'var(--accent-soft)', border: '1.5px dashed var(--accent-border)',
            borderRadius: 'var(--r-md)', color: 'var(--accent)',
            fontFamily: 'inherit', fontSize: 'var(--fs-sm)', fontWeight: 700,
            cursor: 'pointer', display: 'flex', alignItems: 'center',
            justifyContent: 'center', gap: 6
          }}
        >
          ⚙️ تنظیم شرایط پرداخت (اختیاری)
        </button>
      )}

      {/* ====== پرداخت و تسویه ====== */}
      {(total > 0 || showPaymentSection) && form.items.length > 0 && (
        <>
          <SectionTitle><span style={{ fontSize: 'var(--fs-sm)', lineHeight: 1, display: 'inline-block', marginLeft: 4 }}>💳</span> پرداخت و تسویه</SectionTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)', marginBottom: 'var(--sp-4)' }}>

            {/* خلاصه مالی */}
            {total > 0 && (
              <div style={{ padding: 'var(--sp-2) 0', borderBottom: '1px dashed var(--border)', display: 'flex', flexDirection: 'column', gap: 4 }}>
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
            )}

            {/* کادر شرایط پرداخت */}
            <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--r-md)', padding: 'var(--sp-3)', display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
              <div style={{ fontSize: 'var(--fs-sm)', fontWeight: 700, color: 'var(--text)', paddingBottom: 'var(--sp-2)', borderBottom: '1px dashed var(--border)' }}>
                💳 شرایط پرداخت
              </div>

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
                <Field label="شرایط پرداخت" required>
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

              {form.paymentTerms === 'cash' && (
                <div style={{ padding: '8px 12px', fontSize: 'var(--fs-xs)', color: 'var(--muted)', textAlign: 'center', fontWeight: 600 }}>
                  💡 پرداخت نقدی — نیازی به تنظیمات اضافه نیست
                </div>
              )}

              {form.paymentTerms !== 'cash' && (
                <>
                  <div style={{ fontWeight: 700, fontSize: 'var(--fs-sm)', color: 'var(--muted)', marginTop: 4 }}>
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
                    <div style={{ padding: 'var(--pad-tight)', background: 'var(--accent-soft)', borderRadius: 'var(--r-sm)', fontSize: 'var(--fs-xs)', color: 'var(--accent)', textAlign: 'center', fontWeight: 600 }}>
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
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 4 }}>
                    <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', marginBottom: 4 }}>📅 پیش‌نمایش اقساط</div>
                    {preview.map(inst => (
                      <div key={inst.id} style={{ display: 'flex', justifyContent: 'space-between', padding: 'var(--pad-tight)', background: 'var(--bg)', borderRadius: 'var(--r-sm)', fontSize: 'var(--fs-xs)', color: 'var(--text)' }}>
                        <span>قسط {inst.number}</span>
                        <span style={{ color: 'var(--muted)' }}>{inst.dueDate}</span>
                        <span style={{ fontWeight: 700 }}>{inst.amount.toLocaleString('fa-IR')} ت</span>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>

            {/* پرداخت‌های ثبت‌شده */}
            {form.payments.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-2)' }}>
                <div style={{ fontSize: 'var(--fs-sm)', fontWeight: 700, color: 'var(--text)' }}>
                  💳 پرداخت‌های ثبت‌شده
                </div>
                {form.payments.map((p, idx) => {
                  const isExpanded = expandedPaymentId === p.id;
                  const methodLabel = p.method === 'cash' ? '💵 نقدی' : p.method === 'card' ? '💳 کارت' : '📄 چک';
                  return (
                    <div key={p.id} style={{ padding: isExpanded ? 'var(--sp-3)' : 'var(--sp-2) var(--sp-3)', background: 'transparent', border: isExpanded ? '1.5px solid var(--accent)' : '1px solid var(--border)', borderRadius: 'var(--r-md)', transition: 'all 0.2s' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: isExpanded ? 'default' : 'pointer' }} onClick={() => setExpandedPaymentId(isExpanded ? null : p.id)}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <span style={{ fontSize: 'var(--fs-base)', fontWeight: 700, color: 'var(--text)' }}>
                            پرداخت {toFa(idx + 1)} — {methodLabel}
                          </span>
                          <span style={{ fontSize: 'var(--fs-sm)', color: 'var(--muted)' }}>
                            {p.amount > 0 ? `${toFa(p.date)}` : 'در حال ویرایش...'}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
                          <span style={{ fontSize: 'var(--fs-base)', fontWeight: 800, color: p.amount > 0 ? 'var(--accent)' : 'var(--muted)' }}>{p.amount > 0 ? toFa(p.amount.toLocaleString('fa-IR')) + ' ت' : '—'}</span>
                          <button type="button" onClick={(e) => { e.stopPropagation(); removePayment(p.id); }} style={{ background: 'var(--danger-soft)', border: '1px solid var(--danger)', color: 'var(--danger)', cursor: 'pointer', borderRadius: 'var(--r-sm)', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, padding: 0, flexShrink: 0, fontFamily: 'inherit', fontWeight: 700 }}>✕</button>
                        </div>
                      </div>
                      {isExpanded && (
                        <div style={{ marginTop: 'var(--sp-2)', display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
                          <Grid2>
                            <Field label="نوع پرداخت">
                              <Select value={p.type || 'regular'} onChange={e => updatePayment(p.id, { type: e.target.value as 'regular' | 'advance' | 'refund' | 'settlement' })}>
                                <option value="regular">💵 پرداخت عادی</option>
                                <option value="advance">📌 پیش‌پرداخت</option>
                                <option value="settlement">✅ تسویه قسط</option>
                                <option value="refund">↩️ عودت وجه</option>
                              </Select>
                            </Field>
                            <Field label="روش پرداخت">
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
                              <MoneyField placeholder="مثلاً — ۲٬۵۰۰٬۰۰۰" value={toFa(String(p.amount))} onChange={e => { const raw = parseFloat(toEn(e.target.value).replace('٫','.')) || 0; const val = (p.type !== 'refund' && rem > 0) ? Math.min(raw, rem) : raw; updatePayment(p.id, { amount: val }); }} />
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4, padding: '0 4px' }}>
                                <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)' }}>{rem > 0 && p.type !== 'refund' ? `باقی‌مانده: ${toFa(rem.toLocaleString('fa-IR'))} ت` : ''}</span>
                                {rem > 0 && p.type !== 'refund' && (<button type="button" onClick={() => updatePayment(p.id, { amount: (p.amount || 0) + rem })} style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: 'var(--fs-xs)', fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', textDecoration: 'underline', whiteSpace: 'nowrap' }}>تسویه کل</button>)}
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
                                  <Select value={p.status || 'pending'} onChange={e => { const newStatus = e.target.value as CheckStatus; const patch: Partial<Payment> = { status: newStatus }; if (newStatus === 'bounced') { patch.bouncedDate = getTodayJalali(); patch.clearedDate = ''; } else if (newStatus === 'cleared') { patch.clearedDate = getTodayJalali(); patch.bouncedDate = ''; } else { patch.bouncedDate = ''; patch.clearedDate = ''; } updatePayment(p.id, patch); }}>
                                    <option value="pending">🟡 در جریان</option>
                                    <option value="cleared">✅ نقد شد</option>
                                    <option value="bounced">❌ برگشتی</option>
                                  </Select>
                                </Field>
                              </Grid2>
                              {p.status === 'cleared' && (<Field label="تاریخ نقد شدن"><DatePicker value={p.clearedDate || ''} onChange={v => updatePayment(p.id, { clearedDate: v })}  autoToday /></Field>)}
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* دکمه افزودن پرداخت */}
            <button type="button" onClick={addPayment} style={{ width: '100%', height: 40, padding: 0, boxSizing: 'border-box', background: 'var(--accent-soft)', border: '1.5px dashed var(--accent-border)', borderRadius: 'var(--r-md)', color: 'var(--accent)', fontFamily: 'inherit', fontSize: 'var(--fs-sm)', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 4 }}>
              <span style={{ fontSize: 20, lineHeight: 1 }}>+</span> 
              {form.payments.length === 0 ? 'افزودن اولین پرداخت' : 'افزودن پرداخت دیگر'}
            </button>

          </div>
        </>
      )}

      {form.items.length > 0 && total > 0 && <InvoiceSmartSummary form={form} total={total} paid={paid} />}

      {/* ====== یادداشت ====== */}
      <SectionTitle><span style={{ fontSize: 'var(--fs-sm)', lineHeight: 1, display: 'inline-block', marginLeft: 4 }}>📝</span> یادداشت</SectionTitle>
      <Field label="یادداشت">
        <Textarea placeholder="..." rows={3} minRows={3} value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} />
      </Field>
      <ErrorBox>{err}</ErrorBox>
    </Modal>
  );
}
