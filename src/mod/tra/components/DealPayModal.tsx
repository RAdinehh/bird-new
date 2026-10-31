/**
 * DealPayModal.tsx v2 — ثبت پرداخت/دریافت برای یک معامله
 * استاندارد Odoo/SAP: quick amounts + partial hint + check details
 */
import { useState, useEffect, useMemo } from 'react';
import { Modal, Btn, BtnRow, Field, Grid2, MoneyField, Select, Textarea } from '../../../shr/components/ui';
import DatePicker from '../../../shr/components/DatePicker';
import { toEn, toFa } from '../../../shr/utils/fa';
import { getTodayJalali, computeDealBalance } from '../calc';
import { toastMsg } from '../../../cor/store/toast';
import { getDealPaymentFormSchema } from '../../../shr/validation/rules/tra';
import { FieldHint } from '../../../shr/intelligence';
import { useTra } from '../store';
import type { Deal, DealPayment } from '../types';

interface Props {
  open: boolean;
  onClose: () => void;
  deal: Deal | null;
}

export default function DealPayModal({ open, onClose, deal }: Props) {
  const { deals, updateDeal } = useTra();
  const liveDeal = deal ? deals.find(d => d.id === deal.id) : null;
  const effectiveDeal = liveDeal || deal;
  const [date, setDate] = useState(getTodayJalali());
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<'cash' | 'card' | 'check'>('cash');
  const [direction, setDirection] = useState<'in' | 'out'>('in');
  const [notes, setNotes] = useState('');
  const [checkNo, setCheckNo] = useState('');
  const [bank, setBank] = useState('');
  const [checkDue, setCheckDue] = useState('');

  const bal = useMemo(() => (effectiveDeal ? Math.abs(computeDealBalance(effectiveDeal).balance) : 0), [effectiveDeal]);

  useEffect(() => {
    if (!effectiveDeal || !open) return;
    const balance = computeDealBalance(effectiveDeal).balance;
    setAmount(String(Math.abs(balance)));
    setDirection(balance >= 0 ? 'in' : 'out');
    setDate(getTodayJalali());
    setMethod('cash');
    setNotes('');
    setCheckNo('');
    setBank('');
    setCheckDue('');
  }, [effectiveDeal, open]);

  const entered = parseFloat(toEn(amount)) || 0;
  const remaining = bal - entered;
  const quickSet = (pct: number) => setAmount(String(Math.round(bal * pct)));

  const formErrors = useMemo(() => {
    const result = getDealPaymentFormSchema(bal).safeParse({
      date,
      amount: entered,
      direction,
      method,
      notes: notes.trim(),
      checkNo: checkNo.trim(),
      bank: bank.trim(),
      dueDate: checkDue,
    });
    if (result.success) return {};
    const errs: Record<string, string> = {};
    for (const issue of result.error.issues) {
      const key = String(issue.path[0] || '');
      if (key && !errs[key]) errs[key] = issue.message;
    }
    return errs;
  }, [date, entered, direction, method, notes, checkNo, bank, checkDue, bal]);

  const handleSave = () => {
    if (!effectiveDeal) return;
    if (Object.keys(formErrors).length > 0) {
      const firstErr = Object.values(formErrors)[0];
      toastMsg.warn(firstErr || 'لطفاً خطاها را برطرف کنید');
      return;
    }
    const newPayment: DealPayment = {
      id: crypto.randomUUID(),
      date,
      amount: entered,
      direction,
      method,
      notes: notes.trim() || undefined,
      checkNo: method === 'check' ? checkNo.trim() : undefined,
      bank: method === 'check' ? bank.trim() : undefined,
      dueDate: method === 'check' ? checkDue : undefined,
    };
    updateDeal(effectiveDeal.id, { payments: [...(effectiveDeal.payments || []), newPayment] });
    toastMsg.saved();
    onClose();
  };

  if (!effectiveDeal) return null;

  const isIn = direction === 'in';
  const title = isIn ? '💳 ثبت دریافت' : '💳 ثبت پرداخت';

  return (
    <Modal open={open} onClose={onClose} title={title} size="md">
      <div style={{
        padding: 'var(--pad-normal)',
        background: 'var(--input-bg)',
        borderRadius: 'var(--r-sm)',
        marginBottom: 'var(--sp-3)',
        fontSize: 'var(--fs-sm)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <span style={{ color: 'var(--muted)' }}>بدهی فعلی</span>
        <b style={{ fontVariantNumeric: 'tabular-nums' }}>{toFa(bal.toLocaleString('fa-IR'))} ت</b>
      </div>

      <Grid2>
        <Field label="تاریخ" required error={formErrors.date}>
          <DatePicker value={date} onChange={setDate} />
        </Field>
        <Field label="مبلغ" required error={formErrors.amount}>
          <MoneyField value={amount} onChange={(e) => setAmount(e.target.value)} />
        </Field>
      </Grid2>

      {entered > 0 && <FieldHint fieldPath="tra.deal.payment" value={entered} />}

      <div style={{ display: 'flex', gap: 4, marginTop: 6, marginBottom: 8, flexWrap: 'wrap' }}>
        {[25, 50, 75, 100].map(pct => (
          <button
            key={pct}
            type="button"
            onClick={() => quickSet(pct / 100)}
            style={{
              flex: 1,
              minWidth: 56,
              padding: '6px 4px',
              fontSize: 'var(--fs-xs)',
              background: 'var(--input-bg)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--r-sm)',
              color: 'var(--text)',
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            {pct === 100 ? 'کل' : `${toFa(pct)}٪`}
          </button>
        ))}
      </div>

      {entered > 0 && entered < bal && (
        <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--warn)', marginBottom: 8 }}>
          ↳ باقی‌مانده: <b>{toFa(remaining.toLocaleString('fa-IR'))} ت</b>
        </div>
      )}
      {entered > bal && bal > 0 && (
        <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--danger)', marginBottom: 8 }}>
          ⚠ مبلغ وارد شده بیشتر از بدهی است
        </div>
      )}
      {entered === bal && bal > 0 && (
        <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--accent)', marginBottom: 8 }}>
          ✓ این پرداخت کل بدهی را تسویه می‌کند
        </div>
      )}

      <Grid2>
        <Field label="جهت">
          <Select value={direction} onChange={e => setDirection(e.target.value as 'in' | 'out')}>
            <option value="in">📥 دریافت از طرف</option>
            <option value="out">📤 پرداخت به طرف</option>
          </Select>
        </Field>
        <Field label="روش">
          <Select value={method} onChange={e => setMethod(e.target.value as 'cash' | 'card' | 'check')}>
            <option value="cash">نقدی</option>
            <option value="card">کارت</option>
            <option value="check">چک</option>
          </Select>
        </Field>
      </Grid2>

      {method === 'check' && (
        <>
          <Grid2>
            <Field label="شماره چک" required error={formErrors.checkNo}>
              <input
                value={checkNo}
                onChange={e => setCheckNo(e.target.value)}
                placeholder="۱۲۳۴۵۶"
                style={{
                  width: '100%',
                  padding: 'var(--pad-normal)',
                  background: 'var(--input-bg)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--r-sm)',
                  fontSize: 'var(--fs-sm)',
                  fontFamily: 'inherit',
                  boxSizing: 'border-box',
                }}
              />
            </Field>
            <Field label="بانک" error={formErrors.bank}>
              <input
                value={bank}
                onChange={e => setBank(e.target.value)}
                placeholder="ملی، صادرات..."
                style={{
                  width: '100%',
                  padding: 'var(--pad-normal)',
                  background: 'var(--input-bg)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--r-sm)',
                  fontSize: 'var(--fs-sm)',
                  fontFamily: 'inherit',
                  boxSizing: 'border-box',
                }}
              />
            </Field>
          </Grid2>
          <Field label="سرسید چک" error={formErrors.dueDate}>
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
