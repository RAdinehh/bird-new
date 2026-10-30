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
  const [periodStart, setPeriodStart] = useState<string>(() => deal?.startDate || deal?.date || todayJ());
  const [periodEnd, setPeriodEnd] = useState<string>(() => deal?.endDate || todayJ());
  const [err, setErr] = useState('');

  useEffect(() => {
    if (open && deal) {
      const start = deal.startDate || deal.date || todayJ();
      let end = deal.endDate || todayJ();
      if (end < start) end = start;
      console.log('[SettlementModal] deal:', deal.id, 'startDate:', deal.startDate, '→ using:', start, '| endDate:', deal.endDate, '→ using:', end);
      setPeriodStart(start);
      setPeriodEnd(end);
      setErr('');
    }
  }, [open, deal?.id, deal?.startDate, deal?.endDate, deal?.date]);

  // 🆕 Effective values — fallback اگر state خالی بود
  const effectiveStart = periodStart || deal?.startDate || deal?.date || todayJ();
  const effectiveEnd = periodEnd || deal?.endDate || todayJ();

  const computed = useMemo(() => {
    if (!deal || !effectiveStart || !effectiveEnd) return null;
    return computeSettlement(deal, effectiveStart, effectiveEnd);
  }, [deal, effectiveStart, effectiveEnd]);

  const handleSave = () => {
    if (!computed) {
      setErr('در این بازه داده‌ای برای تسویه وجود ندارد');
      return;
    }
    onSave(computed);
    // بستن مودال در DealsPage.onSave انجام می‌شه (بعد از موفقیت)
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
        <DatePicker value={effectiveStart} onChange={v => { setPeriodStart(v); setErr(''); if (periodEnd && v > periodEnd) setPeriodEnd(v); }} max={effectiveEnd} autoToday />
      </Field>
      <Field label="تا تاریخ" required>
        <DatePicker value={effectiveEnd} onChange={v => { setPeriodEnd(v); setErr(''); }} min={effectiveStart} autoToday />
      </Field>

      <div style={{ paddingTop: 12, marginTop: 4, borderTop: '1px dashed var(--border)', fontSize: 'var(--fs-base)', fontWeight: 700, color: 'var(--text)', letterSpacing: '.3px' }}>
        🧮 پیش‌نمایش تسویه
      </div>

      {computed === null ? (
        <div style={{ padding: 'var(--pad-comfy)', background: 'var(--input-bg)', border: '1px dashed var(--border)', borderRadius: 'var(--r-md)', fontSize: 'var(--fs-sm)', color: 'var(--muted)', textAlign: 'center' }}>
          داده‌ای برای پیش‌نمایش نیست
        </div>
      ) : (
        <div style={{ padding: 'var(--pad-normal)', background: 'var(--accent-soft)', border: '1px solid var(--accent-border)', borderRadius: 'var(--r-md)', display: 'flex', flexDirection: 'column', gap: 10, fontSize: 'var(--fs-sm)' }}>
          
          {/* KPI: تعداد عملیات */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, paddingBottom: 8, borderBottom: '1px dashed var(--accent-border)' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', marginBottom: 2 }}>تحویل</div>
              <div style={{ fontSize: 'var(--fs-base)', fontWeight: 700, color: 'var(--text)' }}>{toFa(computed.deliveriesSnapshot.length)}</div>
            </div>
            <div style={{ textAlign: 'center', borderRight: '1px dashed var(--accent-border)', borderLeft: '1px dashed var(--accent-border)' }}>
              <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', marginBottom: 2 }}>فروش</div>
              <div style={{ fontSize: 'var(--fs-base)', fontWeight: 700, color: 'var(--text)' }}>{toFa(computed.salesSnapshot.length)}</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', marginBottom: 2 }}>پرداخت</div>
              <div style={{ fontSize: 'var(--fs-base)', fontWeight: 700, color: 'var(--text)' }}>{toFa(computed.paymentsSnapshot.length)}</div>
            </div>
          </div>

          {/* خلاصه مالی */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--muted)' }}>فروش کل</span>
              <span style={{ fontWeight: 700, color: 'var(--text)' }}>{toFa(computed.grossSales.toLocaleString('fa-IR'))} ت</span>
            </div>
            {computed.commission > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--muted)' }}>کمیسیون</span>
                <span style={{ fontWeight: 700, color: 'var(--warn)' }}>{toFa(computed.commission.toLocaleString('fa-IR'))} ت</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--muted)' }}>دریافت‌شده</span>
              <span style={{ fontWeight: 700, color: 'var(--text)' }}>{toFa(computed.paidAmount.toLocaleString('fa-IR'))} ت</span>
            </div>
          </div>

          {/* جمع‌بندی نهایی */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, paddingTop: 8, marginTop: 2, borderTop: '1px dashed var(--accent-border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{ fontSize: 'var(--fs-sm)', fontWeight: 700, color: 'var(--accent)' }}>خالص قابل پرداخت</span>
              <span style={{ fontSize: 'var(--fs-lg)', fontWeight: 800, color: 'var(--accent)', lineHeight: 1 }}>
                {toFa(computed.netPayable.toLocaleString('fa-IR'))} <span style={{ fontSize: 'var(--fs-xs)', fontWeight: 600 }}>ت</span>
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{ fontSize: 'var(--fs-sm)', color: 'var(--muted)' }}>مانده نهایی</span>
              <span style={{ fontSize: 'var(--fs-md)', fontWeight: 800, color: (computed.netPayable - computed.paidAmount) > 0 ? 'var(--danger)' : 'var(--accent)' }}>
                {toFa(Math.abs(computed.netPayable - computed.paidAmount).toLocaleString('fa-IR'))} ت
              </span>
            </div>
          </div>
        </div>
      )}

      {err && <ErrorBox>{err}</ErrorBox>}
    </Modal>
  );
}
