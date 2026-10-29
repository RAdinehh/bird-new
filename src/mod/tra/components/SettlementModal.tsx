/**
 * SettlementModal.tsx — Phase E.2b
 * مودال تسویه دوره‌ای — انتخاب بازه + پیش‌نمایش زنده
 */
import { useState, useMemo, useEffect } from 'react';
import { format as formatJ } from 'date-fns-jalali';
import { Btn, BtnRow, Modal, Field, ErrorBox } from '../../../shr/components/ui';
import DatePicker from '../../../shr/components/DatePicker';
import { toFa } from '../../../shr/utils/fa';
import { computeSettlement } from '../settlement';
import type { Deal, Settlement } from '../types';

interface Props {
  open: boolean;
  deal: Deal | null;
  onClose: () => void;
  onSave: (s: Omit<Settlement, 'id' | 'createdAt' | 'updatedAt'>) => void;
}

function todayJ(): string {
  return formatJ(new Date(), 'yyyy/MM/dd');
}

export default function SettlementModal({ open, deal, onClose, onSave }: Props) {
  const [periodStart, setPeriodStart] = useState('');
  const [periodEnd, setPeriodEnd] = useState('');
  const [err, setErr] = useState('');

  useEffect(() => {
    if (open && deal) {
      const start = deal.startDate || deal.date || todayJ();
      let end = deal.endDate || todayJ();
      if (end < start) end = start;
      setPeriodStart(start);
      setPeriodEnd(end);
      setErr('');
    }
  }, [open, deal?.id, deal?.startDate, deal?.endDate, deal?.date]);

  const computed = useMemo(() => {
    if (!deal || !periodStart || !periodEnd) return null;
    return computeSettlement(deal, periodStart, periodEnd);
  }, [deal, periodStart, periodEnd]);

  const handleSave = () => {
    if (!computed) {
      setErr('در این بازه داده‌ای برای تسویه وجود ندارد');
      return;
    }
    onSave(computed);
    onClose();
  };

  if (!deal) return null;

  const titleText = deal.dealNumber || deal.description || 'معامله';

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={'تسویه دوره‌ای — ' + titleText}
      footer={
        <BtnRow>
          <Btn variant="primary" onClick={handleSave}>ایجاد تسویه</Btn>
          <Btn onClick={onClose}>لغو</Btn>
        </BtnRow>
      }
    >
      <div style={{ paddingTop: 8, marginTop: 4, borderTop: '1px dashed var(--border)', fontSize: 'var(--fs-base)', fontWeight: 700, color: 'var(--text)', letterSpacing: '.3px' }}>
        📅 بازه‌ی تسویه
      </div>

      <Field label="از تاریخ" required>
        <DatePicker value={periodStart} onChange={v => { setPeriodStart(v); setErr(''); if (periodEnd && v > periodEnd) setPeriodEnd(v); }} max={periodEnd} autoToday />
      </Field>
      <Field label="تا تاریخ" required>
        <DatePicker value={periodEnd} onChange={v => { setPeriodEnd(v); setErr(''); }} min={periodStart} autoToday />
      </Field>

      <div style={{ paddingTop: 12, marginTop: 4, borderTop: '1px dashed var(--border)', fontSize: 'var(--fs-base)', fontWeight: 700, color: 'var(--text)', letterSpacing: '.3px' }}>
        🧮 پیش‌نمایش تسویه
      </div>

      {computed === null ? (
        <div style={{ padding: 'var(--pad-comfy)', background: 'var(--input-bg)', border: '1px dashed var(--border)', borderRadius: 'var(--r-md)', fontSize: 'var(--fs-sm)', color: 'var(--muted)', textAlign: 'center' }}>
          داده‌ای برای پیش‌نمایش نیست
        </div>
      ) : (
        <div style={{ padding: 'var(--pad-comfy)', background: 'var(--accent-soft)', border: '1px solid var(--accent-border)', borderRadius: 'var(--r-md)', display: 'flex', flexDirection: 'column', gap: 4, fontSize: 'var(--fs-sm)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>تعداد تحویل:</span>
            <span style={{ fontWeight: 700 }}>{toFa(computed.deliveriesSnapshot.length)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>تعداد فروش:</span>
            <span style={{ fontWeight: 700 }}>{toFa(computed.salesSnapshot.length)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>تعداد پرداخت:</span>
            <span style={{ fontWeight: 700 }}>{toFa(computed.paymentsSnapshot.length)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--accent-border)', paddingTop: 4, marginTop: 4 }}>
            <span>فروش کل:</span>
            <span style={{ fontWeight: 700 }}>{toFa(computed.grossSales.toLocaleString('fa-IR'))} ت</span>
          </div>
          {computed.commission > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>کمیسیون:</span>
              <span style={{ fontWeight: 700, color: 'var(--warn)' }}>{toFa(computed.commission.toLocaleString('fa-IR'))} ت</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>خالص قابل پرداخت:</span>
            <span style={{ fontWeight: 700, color: 'var(--accent)' }}>{toFa(computed.netPayable.toLocaleString('fa-IR'))} ت</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>دریافت‌شده:</span>
            <span style={{ fontWeight: 700 }}>{toFa(computed.paidAmount.toLocaleString('fa-IR'))} ت</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--accent-border)', paddingTop: 4, marginTop: 4, fontWeight: 700, color: (computed.netPayable - computed.paidAmount) > 0 ? 'var(--danger)' : 'var(--accent)' }}>
            <span>مانده:</span>
            <span>{toFa(Math.abs(computed.netPayable - computed.paidAmount).toLocaleString('fa-IR'))} ت</span>
          </div>
        </div>
      )}

      {err && <ErrorBox>{err}</ErrorBox>}
    </Modal>
  );
}
