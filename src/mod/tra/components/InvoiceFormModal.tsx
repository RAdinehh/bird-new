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
import { HELP } from '../../../shr/help/helpTexts';
import InvoiceSmartSummary from './InvoiceSmartSummary';
import PaymentsSection from './PaymentsSection';
import { type CheckStatus } from '../store';
import { CATEGORIES, generateInstallments, type InvoiceItem, type Payment } from '../store';
import { UNIT_LABEL } from '../../whs/store';
import type { F } from '../types-invoice';
import { useCtc } from '../../ctc/store';
import { UOM_CATEGORIES, type UOMUnit } from '../hooks/useInvoiceForm';
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
          <DatePicker value={form.date} onChange={v => setForm(f => ({ ...f, date: v}))}  autoToday />
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
        <Field label="نوع سفارش" help={isPurchase ? HELP.tra.invoice.orderType : HELP.tra.invoice.orderTypeSale}>
          <Select
            value={(form.isPreorder && form.category !== 'other') ? 'preorder' : 'stock'}
            onChange={e => setForm(f => ({ ...f, isPreorder: e.target.value === 'preorder' }))}
          >
            <option value="stock">{isPurchase ? "📦 خرید از موجودی" : "📦 فروش از موجودی"}</option>
            {form.category !== 'other' && (
              <option value="preorder">{isPurchase ? "📅 پیش‌خرید" : "📅 پیش‌فروش"}</option>
            )}
          </Select>
        </Field>
        <Field label={isPurchase ? 'فروشنده' : 'مشتری'} required error={showError('partyId')} onTouch={() => markTouched('partyId')}>
          <SmartSelect
            value={form.partyId}
            onChange={v => setForm(f => ({ ...f, partyId: v}))}
            options={parties.map(cc => ({ value: cc.id, label: cc.name, subtitle: cc.phone || undefined }))}
            placeholder="— انتخاب کنید —" modalTitle={isPurchase ? 'انتخاب فروشنده' : 'انتخاب مشتری'} autoThreshold={6}
          />
        </Field>
      </Grid2>

      
      {form.isPreorder && (
        <Field label="تاریخ تحویل" required>
          <DatePicker value={form.deliveryDate} onChange={v => setForm(f => ({ ...f, deliveryDate: v}))}  autoToday />
        </Field>
      )}

      {/* ====== اقلام (گروه) ====== */}
      <div style={{
        border: '1.5px solid var(--border)',
        borderRadius: 'var(--r-md)',
        padding: 'var(--sp-3)',
        marginBottom: 'var(--sp-3)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--sp-2)',
      }}>
      {/* ====== اقلام ====== */}
      <SectionTitle>
        <span style={{ fontSize: 'var(--fs-sm)', lineHeight: 1, display: 'inline-block', marginLeft: 4 }}>📦</span> اقلام {total > 0 && `— جمع: ${toFa(total.toLocaleString('fa-IR'))} تومان`}
      </SectionTitle>
      <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', marginTop: 'var(--sp-1)', marginBottom: 'var(--sp-2)', paddingRight: 4, lineHeight: 1.4 }}>کالا یا خدمت اضافه کنید</div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-2)', marginBottom: 'var(--sp-3)' }}>
        
        
        {form.items.map((it, idx) => {
          const isExpanded = expandedItemId === it.id;
          const cat = it.category || form.category;
          
          return (
            <div key={it.id} style={{ 
              background: 'var(--card-solid)',
              border: '1px solid var(--border)', 
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
                      ? `${toFa(it.quantity)} ${(UNIT_LABEL as any)[it.unit || 'pcs'] || 'عدد'} × ${toFa(it.unitPrice)} تومان`
                      : ''}
                  </span>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
                  <span style={{ fontSize: 'var(--fs-base)', fontWeight: 800, color: it.total > 0 ? 'var(--accent)' : 'var(--muted)' }}>
                    {it.total > 0 ? `${toFa(it.total.toLocaleString('fa-IR'))} تومان` : ''}
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

                  {/* 🆕 ItemDetailsForm در بالا برای همه دسته‌ها */}
                  <ItemDetailsForm
                    category={cat}
                    item={it}
                    invoiceDate={form.date}
                    updateItem={(patch: Record<string, unknown>) => updateItem(it.id, patch as Record<string, unknown>)}
                    isPurchase={isPurchase}
                  />
                  

                  {(() => {
                    const uom = UOM_CATEGORIES[cat] || UOM_CATEGORIES.other;
                    const isSingleUnit = uom.units.length === 1;
                    const currentUnit = it.unit || uom.default;
                    const unitDef = uom.units.find((u: UOMUnit) => u.value === currentUnit);
                    const needsWeight = !!(unitDef && unitDef.factor === null);
                    const weightLabel = currentUnit === 'pack'
                      ? `وزن/حجم هر بسته (${uom.baseUnit === 'ml' ? 'میلی‌لیتر' : uom.baseUnit === 'dose' ? 'دوز' : 'گرم'})`
                      : currentUnit === 'vial'
                      ? `تعداد دوز هر ویال`
                      : `مقدار هر واحد (${uom.baseUnit})`;
                                        return (
                      <>
                        {isSingleUnit ? (
                          <Grid2>
                                                        <Field label="تعداد">
                              <NumField placeholder="تعداد" value={it.quantity > 0 ? toFa(String(it.quantity)) : ''} onChange={e => updateItem(it.id, { quantity: parseFloat(toEn(e.target.value).replace('٫','.')) || 0 })} min={0} max={getQuantityMax(cat)} />
                            </Field>
                          </Grid2>
                        ) : (
                          <>
                                                        <Grid2>
                              <Field label="تعداد">
                                <NumField placeholder="تعداد" value={it.quantity > 0 ? toFa(String(it.quantity)) : ''} onChange={e => updateItem(it.id, { quantity: parseFloat(toEn(e.target.value).replace('٫','.')) || 0 })} min={0} max={getQuantityMax(cat)} />
                              </Field>
                              <Field label="واحد">
                                <Select value={currentUnit} onChange={e => updateItem(it.id, { unit: e.target.value, unitWeight: null })}>
                                  {uom.units.map((u: UOMUnit) => <option key={u.value} value={u.value}>{u.label}</option>)}
                                </Select>
                              </Field>
                            </Grid2>
                          </>
                        )}
                        {needsWeight && (
                          <Field label={weightLabel} hint="لازم برای تبدیل به واحد پایه انبار و محاسبه قیمت">
                            <NumField
                              placeholder="مثلاً ۵۰۰"
                              value={it.unitWeight != null && it.unitWeight > 0 ? toFa(String(it.unitWeight)) : ''}
                              onChange={e => updateItem(it.id, { unitWeight: parseFloat(toEn(e.target.value).replace('٫','.')) || 0 })}
                              min={0}
                            />
                          </Field>
                        )}
                        {(() => {
                          const currentUnitDef = uom.units.find((u: UOMUnit) => u.value === currentUnit);
                          const currentUnitLabel = currentUnitDef?.label || 'واحد';
                          const factor = (currentUnitDef && currentUnitDef.factor !== null) ? currentUnitDef.factor : (it.unitWeight || 1);
                          // ⚠️ factor: از unitDef (ثابت) یا unitWeight (دستی) — برای بسته‌بندی (bag, vial)
                          const baseQty = (it.quantity || 0) * factor;
                          const liveTotal = baseQty * (it.unitPrice || 0);
                          const baseUnitLabel = uom.baseUnit === 'kg' ? 'کیلوگرم' : uom.baseUnit === 'g' ? 'گرم' : uom.baseUnit === 'ml' ? 'میلی‌لیتر' : uom.baseUnit === 'dose' ? 'دوز' : 'واحد';
                          return (
                            <>
                              <Grid2>
                                <Field label={`قیمت هر ${baseUnitLabel}`}>
                                  <MoneyField placeholder={getPricePlaceholder(cat)} value={it.unitPrice > 0 ? toFa(String(it.unitPrice)) : ''} onChange={e => updateItem(it.id, { unitPrice: parseFloat(toEn(e.target.value).replace('٫','.')) || 0 })} />
                                </Field>
                                <Field label="هزینه حمل این قلم">
                                  <MoneyField placeholder="مبلغ هزینه" value={String(it.shipping || '')} onChange={e => updateItem(it.id, { shipping: parseFloat(toEn(e.target.value).replace('٫','.')) || 0 })} min={0} />
                                </Field>
                              </Grid2>

                              {it.quantity > 0 && it.unitPrice > 0 && (
                                <div style={{
                                  marginTop: 'var(--sp-1)',
                                  padding: '10px 12px',
                                  background: 'var(--accent-soft)',
                                  border: '1px dashed var(--accent)',
                                  borderRadius: 'var(--r-md)',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: '6px'
                                }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--fs-sm)', color: 'var(--text)', fontWeight: 600 }}>
                                    <span>
                                      {toFa(it.quantity)} {currentUnitLabel}
                                      {factor !== 1 && !currentUnitLabel.includes(baseUnitLabel) ? ` (${toFa(baseQty)} ${baseUnitLabel})` : ''}
                                    </span>
                                    <span>× {toFa(it.unitPrice.toLocaleString('fa-IR'))} تومان</span>
                                  </div>
                                  <div style={{
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                    borderTop: '1px dashed var(--accent)', paddingTop: '6px', marginTop: '2px'
                                  }}>
                                    <span style={{ fontSize: 'var(--fs-sm)', fontWeight: 700, color: 'var(--accent)' }}>جمع محاسبه‌شده:</span>
                                    <span style={{ fontSize: 'var(--fs-md)', fontWeight: 800, color: 'var(--accent)' }}>
                                      {toFa(liveTotal.toLocaleString('fa-IR'))} تومان
                                    </span>
                                  </div>
                                </div>
                              )}
                            </>
                          );
                        })()}
                      </>
                    );
                  })()}

                  <Grid2>
                    <Field label="تخفیف این قلم">
                      <MoneyField placeholder="مبلغ" value={String(it.discountValue || '')} onChange={e => updateItem(it.id, { discountType: 'amount', discountValue: parseFloat(toEn(e.target.value).replace('٫','.')) || 0 })} />
                    </Field>
                    <Field label="مبلغ کل این قلم">
                      <div style={{ height: 38, display: 'flex', alignItems: 'center', fontWeight: 800, color: 'var(--accent)', direction: 'rtl', background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', padding: '0 12px', justifyContent: 'flex-end' }}>
                        {it.total > 0 ? `${toFa(it.total.toLocaleString('fa-IR'))} تومان` : ''}
                      </div>
                    </Field>
                  </Grid2>


                </div>
              )}
            </div>
          );
        })}

        <button 
          type="button" 
          onClick={addItem} 
          style={{
            width: '100%', height: 40, padding: 0, boxSizing: 'border-box', background: 'transparent', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', color: 'var(--text)', fontFamily: 'inherit', fontSize: 'var(--fs-sm)', 
            fontWeight: 700, cursor: 'pointer', display: 'flex', 
            alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 4
          }}
        >
          + {form.items.length === 0 ? 'افزودن اولین قلم' : 'افزودن قلم دیگر'}
        </button>
      </div>
      </div>

      {/* + دکمه تنظیم شرایط پرداخت (وقتی قیمت هنوز وارد نشده) */}
      {form.items.length > 0 && total === 0 && !showPaymentSection && (
        <button 
          type="button" 
          onClick={() => setShowPaymentSection(true)}
          style={{
            width: '100%', height: 40, marginBottom: 'var(--sp-4)',
            background: 'var(--card-solid)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', color: 'var(--text)',
            fontFamily: 'inherit', fontSize: 'var(--fs-sm)', fontWeight: 700,
            cursor: 'pointer', display: 'flex', alignItems: 'center',
            justifyContent: 'center', gap: 6
          }}
        >
          + تنظیم شرایط پرداخت (اختیاری)
        </button>
      )}

      {/* ====== پرداخت و تسویه ====== */}
      {(total > 0 || showPaymentSection) && form.items.length > 0 && (
        <div style={{
          border: '1.5px solid var(--border)',
          borderRadius: 'var(--r-md)',
          padding: 'var(--sp-3)',
        }}>
        <PaymentsSection
          form={form}
          setForm={setForm}
          total={total}
          paid={paid}
          rem={rem}
          expandedPaymentId={expandedPaymentId}
          setExpandedPaymentId={setExpandedPaymentId}
          addPayment={addPayment}
          updatePayment={updatePayment}
          removePayment={removePayment}
        />
        </div>
      )}

      {form.items.length > 0 && total > 0 && <InvoiceSmartSummary form={form} total={total} paid={paid} />}

      {/* ====== یادداشت ====== */}
      <SectionTitle><span style={{ fontSize: 'var(--fs-sm)', lineHeight: 1, display: 'inline-block', marginLeft: 4 }}>📝</span> یادداشت</SectionTitle>
      
      <Textarea placeholder="توضیحات این فاکتور" rows={3} minRows={3} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value}))} />
      <ErrorBox>{err}</ErrorBox>
    </Modal>
  );
}
