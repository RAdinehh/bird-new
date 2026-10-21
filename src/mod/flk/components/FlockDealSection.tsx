/**
 * FlockDealSection.tsx — مدل بهره‌برداری (مالکیت، شراکت، امانی، اجاره)
 */
import { Field, Grid2, MoneyField, NumField, Select } from '../../../shr/components/ui';
import { toFa, toEn } from '../../../shr/utils/fa';
import { useCtc } from '../../ctc/store';
import { useTra } from '../../tra/store';
import type { F } from '../types-flocks';
import { HELP } from '../../../shr/help/helpTexts';
import DatePicker from '../../../shr/components/DatePicker';
import { FieldHint } from '../../../shr/intelligence';
import { parse as parseJ, addDays, format as formatJ } from 'date-fns-jalali';
import { todayJ } from '../api/flocksCalc';

interface Props {
  form: F;
  setForm: (updater: F | ((prev: F) => F)) => void;
  showError?: (field: string) => string | undefined;
  markTouched?: (field: string) => void;
}

const DEAL_TYPE_LABEL: Record<string, string> = {
  own: '🏠 مالکیت کامل (خودم)',
  partnership: '🤝 شراکتی',
  consignment: '📦 امانی',
  rent: '📋 اجاره‌ای',
};

const DIVIDER = {
  paddingTop: 8,
  fontSize: 'var(--fs-base)',
  fontWeight: 700,
  color: 'var(--text)',
  letterSpacing: '.3px',
  borderTop: '1px dashed var(--border)',
} as const;

const DISABLED_FIELD = {
  height: 38,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  padding: '0 12px',
  background: 'var(--input-bg)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--r-md)',
  fontSize: 'var(--fs-base)',
  fontWeight: 700,
  color: 'var(--muted)',
} as const;

export default function FlockDealSection({ form, setForm, showError, markTouched }: Props) {
  const contacts = useCtc((s: { contacts: Array<{ id: string; name: string }> }) => s.contacts) || [];
  const deals = useTra((s: { deals: Array<{ id: string; type: string; date: string }> }) => s.deals) || [];

  const partnerShare = parseInt(toEn(form.partnerShare || '')) || 0;
  const rentAmountNum = parseFloat(toEn(form.rentAmount).replace('٫', '.').replace(/[,٬]/g, '')) || 0;
  const rentPaidTotal = (form.rentPayments || []).reduce((a, p) => a + (Number(p.amount) || 0), 0);
  
  const calcDays = (() => {
    if (!form.rentStartDate || !form.rentEndDate) return 0;
    try {
      const s = parseJ(toEn(form.rentStartDate), 'yyyy/MM/dd', new Date());
      const e = parseJ(toEn(form.rentEndDate), 'yyyy/MM/dd', new Date());
      if (!isNaN(s.getTime()) && !isNaN(e.getTime())) {
        return Math.max(0, Math.floor((e.getTime() - s.getTime()) / 86400000));
      }
    } catch {}
    return 0;
  })();

  const totalRentAmount = (() => {
    if (form.rentPeriod === 'total') return rentAmountNum;
    if (!calcDays) return rentAmountNum;
    if (form.rentPeriod === 'season') return rentAmountNum * Math.max(1, Math.ceil(calcDays / 90));
    return rentAmountNum * Math.max(1, Math.ceil(calcDays / 30));
  })();

  const rentOutstanding = Math.max(0, totalRentAmount - rentPaidTotal);

  // 🆕 سقف داینامیک پرداخت‌ها
  const maxPayments = (() => {
    let days = 0;
    if (form.rentStartDate && form.rentEndDate) {
      try {
        const s = parseJ(toEn(form.rentStartDate), 'yyyy/MM/dd', new Date());
        const e = parseJ(toEn(form.rentEndDate), 'yyyy/MM/dd', new Date());
        if (!isNaN(s.getTime()) && !isNaN(e.getTime())) {
          days = Math.max(0, Math.floor((e.getTime() - s.getTime()) / 86400000));
        }
      } catch {}
    }
    if (!days) return form.rentPeriod === 'total' ? 10 : 20;
    if (form.rentPeriod === 'total') return 10;
    if (form.rentPeriod === 'season') return Math.min(60, Math.max(8, Math.ceil(days / 90) * 3 + 2));
    return Math.min(60, Math.max(12, Math.ceil(days / 30) * 2 + 2));
  })();
  const paymentCount = (form.rentPayments || []).length;
  const canAddPayment = paymentCount < maxPayments;
  const nearLimit = paymentCount >= Math.floor(maxPayments * 0.8);
  const cycleEnd = (() => {
    try {
      if (!form.hatchDate || !form.endOfCycleDay) return '';
      const hatch = parseJ(toEn(form.hatchDate), 'yyyy/MM/dd', new Date());
      if (isNaN(hatch.getTime())) return '';
      const days = parseInt(toEn(form.endOfCycleDay)) || 0;
      if (days <= 0) return '';
      return formatJ(addDays(hatch, days), 'yyyy/MM/dd');
    } catch { return ''; }
  })();
  const rentEndWarn = !!(cycleEnd && form.rentEndDate && form.rentEndDate > cycleEnd);
  const myShare = Math.max(0, 100 - partnerShare);

  const relevantDeals = deals.filter((d) => {
    if (form.dealType === 'partnership') return d.type === 'partnership';
    if (form.dealType === 'consignment') return d.type === 'consignment';
    return false;
  });

  return (
    <>
      <div style={DIVIDER}>💼 مدل بهره‌برداری</div>

      <Field label="نوع مالکیت" help={HELP.flk.ownership.type}>
        <Select value={form.dealType || 'own'} onChange={e => {
              const newType = e.target.value;
              const patch: any = { dealType: newType };
              if (newType === 'rent' && !form.rentStartDate && form.startDate) {
                patch.rentStartDate = form.startDate;
              }
              setForm({ ...form, ...patch });
            }}>
          {Object.entries(DEAL_TYPE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </Select>
      </Field>

      {form.dealType === 'partnership' && (
        <>
          <Field label="شریک" required help={HELP.flk.ownership.partner}>
            <Select value={form.partnerId || ''} onChange={e => setForm({ ...form, partnerId: e.target.value })}>
              <option value="">— انتخاب —</option>
              {contacts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
          </Field>
          <Grid2>
            <Field label="سهم شریک" help={HELP.flk.ownership.partnerShare}>
              <NumField value={form.partnerShare || ''} onChange={e => setForm({ ...form, partnerShare: e.target.value })} unit="٪" min={0} max={100} />
            </Field>
            <Field label="سهم من" hint="خودکار">
              <div style={DISABLED_FIELD}>{toFa(String(myShare))}٪</div>
            </Field>
          </Grid2>
        </>
      )}

      {form.dealType === 'consignment' && (
        <Field label="امانت‌دهنده" required help={HELP.flk.ownership.consignor}>
          <Select value={form.consignorId || ''} onChange={e => setForm({ ...form, consignorId: e.target.value })}>
            <option value="">— انتخاب —</option>
            {contacts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
        </Field>
      )}

      {form.dealType === 'rent' && (
        <>
          <Field label="موجر (اجاره‌دهنده)" required help={HELP.flk.ownership.lessor}>
            <Select value={form.lessorId || ''} onChange={e => setForm({ ...form, lessorId: e.target.value })}>
              <option value="">— انتخاب —</option>
              {contacts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
          </Field>
          <Grid2>
            <Field label="مبلغ اجاره" required help={HELP.flk.ownership.rentAmount} onTouch={() => markTouched?.('rentAmount')}>
              <MoneyField placeholder={form.rentPeriod === 'total' ? 'مبلغ کل دوره' : 'مبلغ هر دوره'} value={form.rentAmount || ''} onChange={e => setForm({ ...form, rentAmount: e.target.value })} />
            
              {rentAmountNum > 0 && <FieldHint fieldPath="flk.rentAmount" value={rentAmountNum} />}
            </Field>
            <Field label="دوره" help={HELP.flk.ownership.rentPeriod}>
              <Select value={form.rentPeriod || 'monthly'} onChange={e => setForm({ ...form, rentPeriod: e.target.value })}>
                <option value="monthly">ماهانه</option>
                <option value="season">فصلی</option>
                <option value="total">کل دوره</option>
              </Select>
            </Field>
          </Grid2>
          <Grid2>
            <Field label="شروع اجاره" required help={HELP.flk.ownership.rentStartDate}>
              <DatePicker placeholder="از چه تاریخی؟" value={form.rentStartDate || ''} onChange={v => setForm({ ...form, rentStartDate: v })} autoToday />
            </Field>
            {form.rentPeriod === 'total' && (
              <Field label="پایان قرارداد" required help={HELP.flk.ownership.rentEndDate} error={form.rentStartDate && form.rentEndDate && form.rentStartDate >= form.rentEndDate ? 'باید بعد از شروع باشد' : undefined}>
                <DatePicker placeholder="تا چه تاریخی؟" value={form.rentEndDate || ''} onChange={v => setForm({ ...form, rentEndDate: v })} min={form.rentStartDate} />
                {rentEndWarn && (
                  <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--warn)', paddingRight: 2, marginTop: 4 }}>
                    ⚠️ پایان اجاره بعد از پایان چرخه گله ({cycleEnd}) — مطمئن شو قرارداد رو تمدید می‌کنی
                  </div>
                )}
              </Field>
            )}
          </Grid2>

          <div style={DIVIDER}>💳 پرداخت‌های اجاره</div>
          {(form.rentPayments || []).length === 0 ? (
            <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', textAlign: 'center', padding: '6px 0' }}>
              هنوز پرداختی ثبت نشده
            </div>
          ) : (
            (form.rentPayments || []).map((p, idx) => (
              <div key={p.id} style={{ display: 'flex', gap: 6, alignItems: 'flex-start' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <DatePicker value={p.date} min={form.rentStartDate || undefined} max={form.rentEndDate || undefined} onChange={v => {
                    const updated = (form.rentPayments || []).map((x, i) => i === idx ? { ...x, date: v } : x);
                    setForm({ ...form, rentPayments: updated });
                  }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <MoneyField placeholder="مبلغ پرداخت" value={p.amount > 0 ? toFa(String(p.amount)) : ''} onChange={e => {
                    const raw = parseFloat(toEn(e.target.value).replace('٫','.')) || 0;
                    const updated = (form.rentPayments || []).map((x, i) => i === idx ? { ...x, amount: raw } : x);
                    setForm({ ...form, rentPayments: updated });
                  }} />
                
                {p.amount > 0 && rentAmountNum > 0 && (
                  <FieldHint fieldPath="flk.rentPayments.amount" value={p.amount} context={{ rentAmount: rentAmountNum }} />
                )}
                </div>
                <button type="button" onClick={() => {
                  const updated = (form.rentPayments || []).filter((_, i) => i !== idx);
                  setForm({ ...form, rentPayments: updated });
                }} style={{ background: 'var(--danger-soft)', border: '1px solid var(--danger)', color: 'var(--danger)', cursor: 'pointer', borderRadius: 'var(--r-sm)', width: 32, height: 38, padding: 0, fontFamily: 'inherit', fontWeight: 700, flexShrink: 0 }}>✕</button>
              </div>
            ))
          )}
          {canAddPayment ? (
            <button type="button" onClick={() => {
              const newP = { id: crypto.randomUUID(), date: todayJ(), amount: 0, notes: '' };
              setForm({ ...form, rentPayments: [...(form.rentPayments || []), newP] });
            }} style={{ width: '100%', height: 38, background: 'transparent', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', color: 'var(--text)', fontFamily: 'inherit', fontSize: 'var(--fs-sm)', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              + افزودن پرداخت {nearLimit && <span style={{ color: 'var(--warn)', fontSize: 'var(--fs-xs)' }}>({paymentCount}/{maxPayments})</span>}
            </button>
          ) : (
            <div style={{ width: '100%', height: 38, background: 'var(--bg)', border: '1px dashed var(--border)', borderRadius: 'var(--r-md)', color: 'var(--muted)', fontFamily: 'inherit', fontSize: 'var(--fs-sm)', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              🔒 حداکثر {maxPayments} پرداخت
            </div>
          )}
          {nearLimit && canAddPayment && (
            <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--warn)', textAlign: 'center' }}>
              ⚠️ {paymentCount} از {maxPayments} پرداخت — نزدیک به حداکثر
            </div>
          )}
          {(form.rentPayments || []).length > 0 && (
            <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', textAlign: 'center' }}>
              جمع پرداخت‌ها: {toFa((form.rentPayments || []).reduce((a, p) => a + (p.amount || 0), 0).toLocaleString('fa-IR'))} تومان{showError && showError('rentPayments') && (<span style={{ display: 'block', marginTop: 4, color: 'var(--danger)', fontWeight: 600, fontSize: 'var(--fs-xs)' }}>⚠️ {showError('rentPayments')}</span>)}
            </div>
          )}
        </>
      )}

      {relevantDeals.length > 0 && (
        <Field label="لینک به قرارداد (اختیاری)" hint="قرارداد مالی موجود در tra">
          <Select value={form.dealId || ''} onChange={e => setForm({ ...form, dealId: e.target.value })}>
            <option value="">— بدون لینک —</option>
            {relevantDeals.map(d => <option key={d.id} value={d.id}>#{d.id.slice(0, 6)} · {d.date || ''}</option>)}
          </Select>
        </Field>
      )}
    </>
  );
}
