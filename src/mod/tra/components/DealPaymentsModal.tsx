/**
 * DealPaymentsModal.tsx — مرکز عملیات پرداخت‌های معامله (استاندارد ERP)
 */
import { useState } from 'react';
import { Modal, Btn, BtnRow, Field, Grid2, MoneyField, Select, Textarea, ErrorBox, SectionTitle, Tag } from '../../../shr/components/ui';
import DatePicker from '../../../shr/components/DatePicker';
import { toFa, toEn } from '../../../shr/utils/fa';
import { showConfirmAsync } from '../../../cor/store/dialog';
import { getTodayJalali } from '../calc';
import type { DealPayment } from '../types';

interface Props {
  open: boolean;
  onClose: () => void;
  payments: DealPayment[];
  onUpdate: (payments: DealPayment[]) => void;
}

const METHOD_LABEL: Record<string, string> = {
  cash: 'نقدی',
  card: 'کارت',
  check: 'چک',
};

function fmtMoney(n: number): string {
  return `${toFa((Number(n) || 0).toLocaleString('fa-IR'))} ت`;
}

export default function DealPaymentsModal({ open, onClose, payments, onUpdate }: Props) {
  const [adding, setAdding] = useState(false);
  const [date, setDate] = useState(getTodayJalali());
  const [amount, setAmount] = useState('');
  const [payMethod, setPayMethod] = useState<'cash' | 'card' | 'check'>('cash');
  const [payDirection, setPayDirection] = useState<'in' | 'out'>('in');
  const [notes, setNotes] = useState('');
  const [err, setErr] = useState('');

  const totalIn = payments.filter(p => p.direction === 'in').reduce((s, p) => s + (Number(p.amount) || 0), 0);
  const totalOut = payments.filter(p => p.direction === 'out').reduce((s, p) => s + (Number(p.amount) || 0), 0);
  const net = totalIn - totalOut;
  const sorted = [...payments].sort((a, b) => (b.date || '').localeCompare(a.date || ''));

  const handleAdd = () => {
    setErr('');
    const amt = parseFloat(toEn(amount));
    if (!date) { setErr('تاریخ الزامی است'); return; }
    if (!amt || amt <= 0) { setErr('مبلغ معتبر وارد کنید'); return; }

    const newPayment: DealPayment = {
      id: crypto.randomUUID(),
      date,
      amount: amt,
      method: payMethod,
      direction: payDirection,
      notes: notes.trim() || undefined,
    };
    onUpdate([...payments, newPayment]);
    setAdding(false);
    setAmount(''); setNotes(''); setErr('');
  };

  const handleRemove = async (id: string) => {
    const ok = await showConfirmAsync('حذف این پرداخت؟', 'این عملیات قابل بازگشت نیست');
    if (ok) onUpdate(payments.filter(p => p.id !== id));
  };

  return (
    <Modal open={open} onClose={onClose} title="📥 مرکز پرداخت‌های معامله" size="md">
      {!adding ? (
        <>
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--sp-2)',
            padding: 'var(--pad-normal)', background: 'var(--input-bg)',
            borderRadius: 'var(--r-sm)', marginBottom: 'var(--sp-3)', fontSize: 'var(--fs-sm)',
          }}>
            <div>
              <div style={{ color: 'var(--muted)', fontSize: 'var(--fs-xs)' }}>دریافت</div>
              <div style={{ fontWeight: 700, color: 'var(--accent)' }}>{fmtMoney(totalIn)}</div>
            </div>
            <div>
              <div style={{ color: 'var(--muted)', fontSize: 'var(--fs-xs)' }}>پرداخت</div>
              <div style={{ fontWeight: 700, color: 'var(--warn)' }}>{fmtMoney(totalOut)}</div>
            </div>
            <div>
              <div style={{ color: 'var(--muted)', fontSize: 'var(--fs-xs)' }}>خالص</div>
              <div style={{ fontWeight: 700 }}>{fmtMoney(net)}</div>
            </div>
          </div>

          {payments.length === 0 ? (
            <div style={{ padding: 'var(--sp-4)', textAlign: 'center', color: 'var(--muted)', fontSize: 'var(--fs-sm)' }}>
              پرداختی ثبت نشده است.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-2)' }}>
              {sorted.map(p => (
                <div key={p.id} style={{
                  padding: 'var(--pad-normal)', background: 'var(--card)',
                  border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', fontSize: 'var(--fs-sm)',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                    <span style={{ color: 'var(--muted)' }}>{toFa(p.date || '—')}</span>
                    <Tag tone={p.direction === 'in' ? 'green' : 'amber'}>
                      {p.direction === 'in' ? '📥 دریافت' : '📤 پرداخت'}
                    </Tag>
                    <span style={{ fontWeight: 700 }}>{fmtMoney(p.amount)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6, color: 'var(--muted)', fontSize: 'var(--fs-xs)' }}>
                    <span>روش: {METHOD_LABEL[p.method] || p.method}</span>
                    {p.notes && <span style={{ textAlign: 'left', flex: 1 }}>💬 {p.notes}</span>}
                    <Btn size="sm" variant="outline" onClick={() => handleRemove(p.id)} style={{ color: 'var(--danger)', borderColor: 'var(--danger)', padding: '0 6px', minHeight: 22, height: 22, fontSize: 11 }}>✕</Btn>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div style={{ marginTop: 'var(--sp-4)' }}>
            <Btn variant="primary" onClick={() => setAdding(true)} style={{ width: '100%' }}>➕ ثبت پرداخت جدید</Btn>
          </div>
        </>
      ) : (
        <>
          <SectionTitle>ثبت پرداخت جدید</SectionTitle>
          <Grid2>
            <Field label="تاریخ" required>
              <DatePicker value={date} onChange={setDate} />
            </Field>
            <Field label="مبلغ" required>
              <MoneyField value={amount} onChange={e => setAmount(e.target.value)} />
            </Field>
          </Grid2>
          <Grid2>
            <Field label="جهت">
              <Select value={payDirection} onChange={e => setPayDirection(e.target.value as 'in' | 'out')}>
                <option value="in">📥 دریافت</option>
                <option value="out">📤 پرداخت</option>
              </Select>
            </Field>
            <Field label="روش">
              <Select value={payMethod} onChange={e => setPayMethod(e.target.value as 'cash' | 'card' | 'check')}>
                <option value="cash">نقدی</option>
                <option value="card">کارت</option>
                <option value="check">چک</option>
              </Select>
            </Field>
          </Grid2>
          <Field label="توضیحات">
            <Textarea value={notes} onChange={e => setNotes(e.target.value)} />
          </Field>
          {err && <ErrorBox>{err}</ErrorBox>}
          <BtnRow>
            <Btn variant="outline" onClick={() => setAdding(false)}>انصراف</Btn>
            <Btn variant="primary" onClick={handleAdd}>ثبت</Btn>
          </BtnRow>
        </>
      )}
    </Modal>
  );
}
