/**
 * ApplyAdvanceModal.tsx — تخصیص پیش‌پرداخت به فاکتور موجود
 * الگو: FIFO (قدیمی‌ترین اول) | استاندارد: SAP FI-AR credit memo
 */
import { useState, useMemo, useEffect } from 'react';
import { Modal, Btn, BtnRow, Input } from '../../../shr/components/ui';
import { useTra, buildAdvanceAllocations, computeUnappliedAdvances, type Invoice } from '../store';
import { useCtc } from '../../ctc/store';
import { toFa, toEn } from '../../../shr/utils/fa';
import { getTodayJalali, remaining } from '../calc';
import { toastMsg } from '../../../cor/store/toast';
import { showConfirmAsync } from '../../../cor/store/dialog';

interface Props {
  open: boolean;
  onClose: () => void;
  invoice: Invoice | null;
}

export default function ApplyAdvanceModal({ open, onClose, invoice }: Props) {
  const updateInvoice = useTra(s => s.updateInvoice);
  const partyPayments = useTra(s => s.partyPayments);
  const allocations = useTra(s => s.allocations);
  const contacts = useCtc(s => s.contacts);

  const [amountStr, setAmountStr] = useState('');

  const party = invoice ? contacts.find(c => c.id === invoice.partyId) : null;
  const rem = invoice ? remaining(invoice, allocations) : 0;
  const unapplied = invoice ? computeUnappliedAdvances(invoice.partyId) : 0;
  const maxAmount = Math.min(rem, unapplied);

  useEffect(() => {
    if (open && invoice) setAmountStr(String(Math.floor(maxAmount)));
  }, [open, invoice?.id, maxAmount]);

  const advanceAllocs = useMemo(() => {
    if (!invoice) return [];
    const amount = parseInt(toEn(amountStr)) || 0;
    if (amount <= 0) return [];
    return buildAdvanceAllocations(invoice.partyId, amount, getTodayJalali());
  }, [invoice, amountStr]);

  const totalAllocated = advanceAllocs.reduce((a, b) => a + b.amount, 0);

  const handleSave = async () => {
    if (!invoice) return;
    if (totalAllocated <= 0) { toastMsg.error('مبلغ نامعتبر'); return; }
    if (totalAllocated > rem + 0.5) { toastMsg.error('مبلغ بیشتر از باقی‌مانده'); return; }

    const ok = await showConfirmAsync(
      'مصرف پیش‌پرداخت',
      `${toFa(totalAllocated.toLocaleString('fa-IR'))} تومان پیش‌پرداخت به این فاکتور تخصیص می‌یابد؟`,
      { confirmText: 'تخصیص' }
    );
    if (!ok) return;

    const today = getTodayJalali();
    const newPayments = advanceAllocs.map(a => ({
      id: crypto.randomUUID(),
      date: today,
      amount: a.amount,
      method: 'cash' as const,
      type: 'advance' as const,
      partyPaymentId: a.partyPaymentId,
      checkNo: '',
      bank: '',
      dueDate: '',
      notes: 'مصرف از پیش‌پرداخت',
    }));

    try {
      updateInvoice(invoice.id, {
        payments: [...(invoice.payments || []), ...newPayments],
      });
      toastMsg.success('پیش‌پرداخت تخصیص یافت');
      onClose();
    } catch (e) {
      console.error('[ApplyAdvance]', e);
      toastMsg.error('خطا در تخصیص');
    }
  };

  if (!invoice) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="⚡ مصرف پیش‌پرداخت"
      size="md"
      footer={
        <BtnRow>
          <Btn variant="primary" onClick={() => void handleSave()} disabled={totalAllocated <= 0}>
            تخصیص {toFa(totalAllocated.toLocaleString('fa-IR'))} ت
          </Btn>
          <Btn onClick={onClose}>لغو</Btn>
        </BtnRow>
      }
    >
      <div style={{ padding: 12, background: 'var(--input-bg)', borderRadius: 'var(--r-sm)', marginBottom: 12 }}>
        <div style={{ fontSize: 'var(--fs-sm)', fontWeight: 700 }}>{party?.name || '—'}</div>
        <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', marginTop: 4 }}>
          فاکتور {invoice.number} — باقی‌مانده: {toFa(rem.toLocaleString('fa-IR'))} ت
        </div>
        <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--accent)', marginTop: 4, fontWeight: 600 }}>
          ⚡ پیش‌پرداخت موجود: {toFa(unapplied.toLocaleString('fa-IR'))} ت
        </div>
      </div>

      <div style={{ fontSize: 'var(--fs-sm)', fontWeight: 500, color: 'var(--muted)', marginBottom: 6 }}>
        مبلغ تخصیص (حداکثر {toFa(maxAmount.toLocaleString('fa-IR'))})
      </div>
      <Input
        value={toFa(amountStr)}
        onChange={e => setAmountStr(toEn(e.target.value.replace(/[^0-9۰-۹]/g, '')))}
        inputMode="tel"
        unit="تومان"
      />

      {advanceAllocs.length > 0 && (
        <div style={{ marginTop: 12, padding: 8, background: 'var(--accent-soft)', borderRadius: 'var(--r-sm)' }}>
          <div style={{ fontSize: 'var(--fs-xs)', fontWeight: 600, marginBottom: 4 }}>
            📊 تخصیص FIFO (قدیمی‌ترین اول):
          </div>
          {advanceAllocs.map(a => {
            const pp = partyPayments.find(p => p.id === a.partyPaymentId);
            return (
              <div key={a.partyPaymentId} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--fs-xs)', padding: '2px 0' }}>
                <span>{pp?.date || '—'}</span>
                <span style={{ fontWeight: 600 }}>{toFa(a.amount.toLocaleString('fa-IR'))} ت</span>
              </div>
            );
          })}
        </div>
      )}
    </Modal>
  );
}
