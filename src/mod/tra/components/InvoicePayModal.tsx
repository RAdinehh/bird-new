/**
 * InvoicePayModal — ثبت سریع پرداخت/دریافت برای یک فاکتور
 * استاندارد Odoo/SAP: quick amounts + partial hint + check details
 */
import { useState, useEffect, useMemo } from 'react';
import { Modal, Btn, BtnRow, Field, Grid2, MoneyField, Select, Textarea } from '../../../shr/components/ui';
import DatePicker from '../../../shr/components/DatePicker';
import { toEn, toFa } from '../../../shr/utils/fa';
import { getTodayJalali, remaining } from '../calc';
import { toastMsg } from '../../../cor/store/toast';
import { getInvoicePaymentFormSchema } from '../../../shr/validation/rules/tra';
import { useValidation } from '../../../shr/validation/useValidation';
import { useFormErrors } from '../../../shr/hooks/useFormErrors';
import { FieldHint, recordHistory } from '../../../shr/intelligence';
import { useTra } from '../store';
import type { Invoice, Payment } from '../types';

interface Props {
  open: boolean;
  onClose: () => void;
  invoice: Invoice | null;
}

export default function InvoicePayModal({ open, onClose, invoice }: Props) {
  const { invoices, allocations, updateInvoice, addPartyPayment } = useTra();
  const liveInv = invoice ? invoices.find(i => i.id === invoice.id) : null;
  const effectiveInv = liveInv || invoice;
  const [date, setDate] = useState(getTodayJalali());
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<'cash' | 'card' | 'check'>('cash');
  const [notes, setNotes] = useState('');
  const [checkNo, setCheckNo] = useState('');
  const [bank, setBank] = useState('');
  const [checkDue, setCheckDue] = useState('');

  const rem = useMemo(
    () => (effectiveInv ? remaining(effectiveInv, allocations) : 0),
    [effectiveInv, allocations]
  );

  useEffect(() => {
    if (!effectiveInv || !open) return;
    setAmount(String(Math.max(0, rem)));
    setDate(getTodayJalali());
    setMethod('cash');
    setNotes('');
    setCheckNo('');
    setBank('');
    setCheckDue('');
  }, [effectiveInv, open, rem]);

  const entered = parseFloat(toEn(amount)) || 0;
  const remainingAfter = rem - entered;
  const quickSet = (pct: number) => setAmount(String(Math.round(rem * pct)));

  const schema = useMemo(() => getInvoicePaymentFormSchema(rem), [rem]);
  const { errors: vErrors } = useValidation(schema, {
    date, amount: entered, method,
    notes: notes.trim(), checkNo: checkNo.trim(), bank: bank.trim(), dueDate: checkDue,
  });
  const { showError, markTouched, attemptSave, reset: resetErrors } = useFormErrors(vErrors);

  useEffect(() => { if (open) resetErrors(); }, [open, resetErrors]);

  const handleSave = () => {
    if (!effectiveInv) return;
    attemptSave();
    if (Object.keys(vErrors).length > 0) return;
    try {
      let ppId: string | undefined;
      if (entered > 0) {
        ppId = addPartyPayment({
          partyId: effectiveInv.partyId, date, amount: entered, method,
          type: 'regular',
          checkNo: method === 'check' ? checkNo.trim() : '',
          bank: method === 'check' ? bank.trim() : '',
          dueDate: method === 'check' ? checkDue : '',
          notes: notes.trim() || `پرداخت فاکتور ${effectiveInv.number || ''}`,
          status: method === 'check' ? 'pending' : undefined,
        } as any);
      }
      const newPayment: Payment = {
        id: crypto.randomUUID(), date, amount: entered, method,
        checkNo: method === 'check' ? checkNo.trim() : '',
        bank: method === 'check' ? bank.trim() : '',
        dueDate: method === 'check' ? checkDue : '',
        notes: notes.trim() || '',
        status: method === 'check' ? 'pending' : undefined,
        type: 'regular',
        partyPaymentId: ppId,
      } as Payment;
      updateInvoice(effectiveInv.id, { payments: [...(effectiveInv.payments || []), newPayment] });
      if (entered > 0) recordHistory('tra.invoice.payment', entered, {});
      toastMsg.saved();
      onClose();
    } catch (e) {
      console.error('[InvoicePay]', e);
      toastMsg.error('خطا در ثبت پرداخت');
    }
  };

  if (!effectiveInv) return null;
  const isIn = effectiveInv.type === 'sale';
  const title = isIn ? '📥 ثبت دریافت' : '📤 ثبت پرداخت';

  return (
    <Modal open={open} onClose={onClose} title={title} size="md">
      <div style={{ padding: 'var(--pad-normal)', background: 'var(--input-bg)', borderRadius: 'var(--r-sm)', marginBottom: 'var(--sp-3)', fontSize: 'var(--fs-sm)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ color: 'var(--muted)' }}>مانده فاکتور</span>
        <b style={{ fontVariantNumeric: 'tabular-nums' }}>{toFa(rem.toLocaleString('fa-IR'))} ت</b>
      </div>

      <Grid2>
        <Field label="تاریخ" required error={showError('date')} onTouch={() => markTouched('date')}>
          <DatePicker value={date} onChange={setDate} />
        </Field>
        <Field label="مبلغ" required error={showError('amount')} onTouch={() => markTouched('amount')}>
          <MoneyField value={amount} onChange={(e) => setAmount(e.target.value)} />
        </Field>
      </Grid2>

      {entered > 0 && <FieldHint fieldPath="tra.invoice.payment" value={entered} />}

      <div style={{ display: 'flex', gap: 4, marginTop: 6, marginBottom: 8, flexWrap: 'wrap' }}>
        {[25, 50, 75, 100].map(pct => (
          <button key={pct} type="button" onClick={() => quickSet(pct / 100)}
            style={{ flex: 1, minWidth: 56, padding: '6px 4px', fontSize: 'var(--fs-xs)', background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', color: 'var(--text)', cursor: 'pointer', fontFamily: 'inherit' }}>
            {pct === 100 ? 'کل' : `${toFa(pct)}٪`}
          </button>
        ))}
      </div>

      {entered > 0 && entered < rem && (
        <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--warn)', marginBottom: 8 }}>
          ↳ باقی‌مانده: <b>{toFa(remainingAfter.toLocaleString('fa-IR'))} ت</b>
        </div>
      )}
      {entered === rem && rem > 0 && (
        <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--accent)', marginBottom: 8 }}>
          ✓ این پرداخت کل مانده را تسویه می‌کند
        </div>
      )}

      <Field label="روش">
        <Select value={method} onChange={e => setMethod(e.target.value as 'cash' | 'card' | 'check')}>
          <option value="cash">نقدی</option>
          <option value="card">کارت</option>
          <option value="check">چک</option>
        </Select>
      </Field>

      {method === 'check' && (
        <>
          <Grid2>
            <Field label="شماره چک" required error={showError('checkNo')} onTouch={() => markTouched('checkNo')}>
              <input value={checkNo} onChange={e => setCheckNo(e.target.value)} placeholder="۱۲۳۴۵۶"
                style={{ width: '100%', padding: 'var(--pad-normal)', background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', fontSize: 'var(--fs-sm)', fontFamily: 'inherit', boxSizing: 'border-box' }} />
            </Field>
            <Field label="بانک">
              <input value={bank} onChange={e => setBank(e.target.value)} placeholder="ملی، صادرات..."
                style={{ width: '100%', padding: 'var(--pad-normal)', background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', fontSize: 'var(--fs-sm)', fontFamily: 'inherit', boxSizing: 'border-box' }} />
            </Field>
          </Grid2>
          <Field label="سرسید چک">
            <DatePicker value={checkDue} onChange={setCheckDue} />
          </Field>
        </>
      )}

      <Field label="توضیحات">
        <Textarea value={notes} onChange={e => setNotes(e.target.value)} />
      </Field>

      <BtnRow>
        <Btn variant="outline" onClick={onClose}>انصراف</Btn>
        <Btn variant="primary" onClick={handleSave}>ثبت</Btn>
      </BtnRow>
    </Modal>
  );
}
