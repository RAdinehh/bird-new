/**
 * DealPayModal.tsx — ثبت پرداخت/دریافت برای یک معامله
 * استاندارد Odoo/SAP: ثبت پرداخت مستقل از فرم ویرایش
 */
import { useState, useEffect } from 'react';
import { Modal, Btn, BtnRow, Field, Grid2, MoneyField, Select, Textarea } from '../../../shr/components/ui';
import DatePicker from '../../../shr/components/DatePicker';
import { toEn } from '../../../shr/utils/fa';
import { getTodayJalali, computeDealBalance } from '../calc';
import { toastMsg } from '../../../cor/store/toast';
import { useTra } from '../store';
import type { Deal, DealPayment } from '../types';

interface Props {
  open: boolean;
  onClose: () => void;
  deal: Deal | null;
}

export default function DealPayModal({ open, onClose, deal }: Props) {
  const { updateDeal } = useTra();
  const [date, setDate] = useState(getTodayJalali());
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<'cash' | 'card' | 'check'>('cash');
  const [direction, setDirection] = useState<'in' | 'out'>('in');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (!deal || !open) return;
    const bal = computeDealBalance(deal).balance;
    setAmount(String(Math.abs(bal)));
    setDirection(bal >= 0 ? 'in' : 'out');
    setDate(getTodayJalali());
    setMethod('cash');
    setNotes('');
  }, [deal, open]);

  const handleSave = () => {
    if (!deal) return;
    const amt = parseFloat(toEn(amount));
    if (!amt || amt <= 0) {
      toastMsg.error('مبلغ معتبر وارد کنید');
      return;
    }
    const newPayment: DealPayment = {
      id: crypto.randomUUID(),
      date,
      amount: amt,
      direction,
      method,
      notes: notes.trim() || undefined,
    };
    updateDeal(deal.id, {
      payments: [...(deal.payments || []), newPayment],
    });
    toastMsg.success('پرداخت ثبت شد');
    onClose();
  };

  if (!deal) return null;

  return (
    <Modal open={open} onClose={onClose} title="💳 ثبت پرداخت معامله" size="md">
      <Grid2>
        <Field label="تاریخ" required>
          <DatePicker value={date} onChange={setDate} />
        </Field>
        <Field label="مبلغ" required>
          <MoneyField value={amount} onChange={(e) => setAmount(e.target.value)} />
        </Field>
      </Grid2>
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
