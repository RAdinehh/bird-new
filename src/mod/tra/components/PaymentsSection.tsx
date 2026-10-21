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

interface Props {
  form: F;
  setForm: React.Dispatch<React.SetStateAction<F>>;
  total: number;
  paid: number;
  rem: number;
  expandedPaymentId: string | null;
  setExpandedPaymentId: (v: string | null) => void;
  addPayment: () => void;
  updatePayment: (id: string, patch: Partial<Payment>) => void;
  removePayment: (id: string) => void;
}

export default function PaymentsSection({
  form, setForm, total, paid, rem,
  expandedPaymentId, setExpandedPaymentId,
  addPayment, updatePayment, removePayment,
}: Props) {
  return (
    <>
<SectionTitle><span style={{ fontSize: 'var(--fs-sm)', lineHeight: 1, display: 'inline-block', marginLeft: 4 }}>💳</span> پرداخت و تسویه</SectionTitle>
      <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', marginTop: 'var(--sp-1)', marginBottom: 'var(--sp-2)', paddingRight: 4, lineHeight: 1.4 }}>نحوه تسویه و ثبت پرداخت‌ها</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)', marginBottom: 'var(--sp-4)' }}>

            {/* خلاصه مالی */}
            {total > 0 && (
              <div style={{ padding: 'var(--sp-2) 0', borderBottom: '1px dashed var(--border)', display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--fs-sm)' }}>
                  <span style={{ color: 'var(--muted)' }}>جمع کل فاکتور:</span>
                  <span style={{ fontWeight: 700 }}>{toFa(total.toLocaleString('fa-IR'))} تومان</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--fs-sm)' }}>
                  <span style={{ color: 'var(--muted)' }}>پرداخت‌شده:</span>
                  <span style={{ fontWeight: 700, color: 'var(--accent)' }}>{toFa(paid.toLocaleString('fa-IR'))} تومان</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--fs-sm)' }}>
                  <span style={{ color: 'var(--muted)' }}>مانده نهایی:</span>
                  <span style={{ fontWeight: 700, color: rem > 0.5 ? 'var(--warn)' : 'var(--accent)' }}>{toFa(rem.toLocaleString('fa-IR'))} تومان</span>
                </div>
              </div>
            )}

            {/* کادر شرایط پرداخت */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-2)' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>

              {form.isPreorder && (
                <Grid2>
                  <Field label="نوع پیش‌پرداخت">
                    <Select value={form.advanceType} onChange={e => setForm({...form, advanceType: e.target.value as 'percent' | 'amount'})}>
                      <option value="percent">درصد (٪)</option>
                      <option value="amount">مبلغ (ت)</option>
                    </Select>
                  </Field>
                  <Field label="مقدار پیش‌پرداخت">
                    <NumField placeholder="مثلاً ۵۰۰,۰۰۰" value={form.advanceValue} onChange={e => setForm({...form, advanceValue: e.target.value})} unit={form.advanceType === 'percent' ? '٪' : 'تومان'} min={0} />
                  </Field>
                </Grid2>
              )}

              <Grid2>
                <Field label="نوع تسویه">
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
                  <div style={{ fontWeight: 700, fontSize: 'var(--fs-sm)', color: 'var(--muted)', marginTop: 4 }}>
                    💰 تخفیف نقدی (اختیاری)
                  </div>
                  <Grid2>
                    <Field label="تخفیف نقدی (٪)" hint="اگر زودتر پرداخت شود">
                      <NumField placeholder="مثلاً ۲" value={form.cashDiscountPct || ''} onChange={e => setForm({...form, cashDiscountPct: e.target.value})} unit="٪" min={0} max={100} />
                    </Field>
                    <Field label="مهلت (روز)" hint="چند روز از تاریخ فاکتور">
                      <NumField placeholder="مثلاً ۱۰" value={form.cashDiscountDays || ''} onChange={e => setForm({...form, cashDiscountDays: e.target.value})} unit="روز" min={0} />
                    </Field>
                  </Grid2>
                  {form.cashDiscountPct && form.cashDiscountDays && total > 0 && (
                    <div style={{ padding: 'var(--pad-tight)', background: 'var(--accent-soft)', borderRadius: 'var(--r-sm)', fontSize: 'var(--fs-xs)', color: 'var(--accent)', textAlign: 'center', fontWeight: 600 }}>
                      💰 تا {toFa(form.cashDiscountDays)} روز: تخفیف {toFa(form.cashDiscountPct)}٪ (≈ {toFa(Math.round(total * parseFloat(toEn(form.cashDiscountPct)) / 100).toLocaleString('fa-IR'))} تومان)
                    </div>
                  )}
                </>
              )}

              {form.paymentTerms === 'installment' && (
                <Grid2>
                  <Field label="تعداد اقساط" required>
                    <NumField placeholder="مثلاً ۱۲" value={form.installmentCount} onChange={e => setForm({...form, installmentCount: e.target.value})} unit="قسط" min={0} />
                  </Field>
                  <Field label="فاصله" required>
                    <NumField placeholder="مثلاً ۳۰" value={form.installmentGapDays} onChange={e => setForm({...form, installmentGapDays: e.target.value})} unit="روز" min={0} />
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
                        <span style={{ fontWeight: 700 }}>{inst.amount.toLocaleString('fa-IR')} تومان</span>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div></div>

            {/* پرداخت‌های ثبت‌شده */}
            {form.payments.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-2)' }}>
                <div style={{ fontSize: 'var(--fs-sm)', fontWeight: 700, color: 'var(--text)' }}>
                  پرداخت‌های ثبت‌شده
                </div>
                {form.payments.map((p, idx) => {
                  const isExpanded = expandedPaymentId === p.id;
                  const methodLabel = p.method === 'cash' ? '💵 نقدی' : p.method === 'card' ? '💳 کارت' : '📄 چک';
                  return (
                    <div key={p.id} style={{ padding: isExpanded ? 'var(--sp-3)' : 'var(--sp-2) var(--sp-3)', background: 'transparent', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', transition: 'all 0.2s' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: isExpanded ? 'default' : 'pointer' }} onClick={() => setExpandedPaymentId(isExpanded ? null : p.id)}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <span style={{ fontSize: 'var(--fs-base)', fontWeight: 700, color: 'var(--text)' }}>
                            پرداخت {toFa(idx + 1)} — {methodLabel}
                          </span>
                          <span style={{ fontSize: 'var(--fs-sm)', color: 'var(--muted)' }}>
                            {toFa(p.date)}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-2)' }}>
                          <span style={{ fontSize: 'var(--fs-base)', fontWeight: 800, color: p.amount > 0 ? 'var(--accent)' : 'var(--muted)' }}>{p.amount > 0 ? toFa(p.amount.toLocaleString('fa-IR')) + ' تومان' : '—'}</span>
                          <button type="button" onClick={(e) => { e.stopPropagation(); removePayment(p.id); }} style={{ background: 'var(--danger-soft)', border: '1px solid var(--danger)', color: 'var(--danger)', cursor: 'pointer', borderRadius: 'var(--r-sm)', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, padding: 0, flexShrink: 0, fontFamily: 'inherit', fontWeight: 700 }}>✕</button>
                        </div>
                      </div>
                      {isExpanded && (
                        <div style={{ marginTop: 'var(--sp-2)', display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
                          <Grid2>
                            <Field label="نوع پرداخت">
                              <Select value={p.type || 'regular'} onChange={e => updatePayment(p.id, { type: e.target.value as 'regular' | 'refund' })}>
                                <option value="regular">💵 پرداخت عادی</option>
                                
                                
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
                              <MoneyField placeholder="مبلغ" value={p.amount > 0 ? toFa(String(p.amount)) : ''} onChange={e => { const raw = parseFloat(toEn(e.target.value).replace('٫','.')) || 0; const val = (p.type !== 'refund' && rem > 0) ? Math.min(raw, rem) : raw; updatePayment(p.id, { amount: val }); }} />
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4, padding: '0 4px' }}>
                                <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)' }}>{rem > 0 && p.type !== 'refund' ? `باقی‌مانده: ${toFa(rem.toLocaleString('fa-IR'))} تومان` : ''}</span>
                                {rem > 0 && p.type !== 'refund' && (<button type="button" onClick={() => updatePayment(p.id, { amount: (p.amount || 0) + rem })} style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: 'var(--fs-xs)', fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', textDecoration: 'underline', whiteSpace: 'nowrap' }}>تسویه کل</button>)}
                              </div>
                            </Field>
                          </Grid2>
                          {p.method === 'check' && (
                            <>
                              <Grid2>
                                <Field label="شماره چک"><Input placeholder="شماره چک" value={p.checkNo} onChange={e => updatePayment(p.id, { checkNo: e.target.value })} dir="ltr" /></Field>
                                <Field label="بانک"><Input placeholder="نام بانک" value={p.bank} onChange={e => updatePayment(p.id, { bank: e.target.value })} /></Field>
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
            <button type="button" onClick={addPayment} style={{ width: '100%', height: 40, padding: 0, boxSizing: 'border-box', background: 'var(--card-solid)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', color: 'var(--text)', fontFamily: 'inherit', fontSize: 'var(--fs-sm)', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 4 }}>
              + {form.payments.length === 0 ? 'افزودن اولین پرداخت' : 'افزودن پرداخت دیگر'}
            </button>

          </div>
    </>
  );
}
