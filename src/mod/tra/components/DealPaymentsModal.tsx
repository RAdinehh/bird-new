/**
 * DealPaymentsModal.tsx — مشاهده پرداخت‌های یک معامله (read-only)
 * ویرایش در فرم Deal انجام می‌شه؛ این modal فقط برای دیدن تاریخچه‌ست.
 */
import { Modal, Btn } from '../../../shr/components/ui';
import { toFa } from '../../../shr/utils/fa';
import type { DealPayment } from '../types';

interface Props {
  open: boolean;
  onClose: () => void;
  payments: DealPayment[];
}

const METHOD_LABEL: Record<string, string> = {
  cash: 'نقدی',
  card: 'کارت',
  check: 'چک',
};

function fmtMoney(n: number): string {
  return `${toFa((Number(n) || 0).toLocaleString('fa-IR'))} ت`;
}

export default function DealPaymentsModal({ open, onClose, payments }: Props) {
  const totalIn = payments.filter(p => p.direction === 'in').reduce((s, p) => s + (Number(p.amount) || 0), 0);
  const totalOut = payments.filter(p => p.direction === 'out').reduce((s, p) => s + (Number(p.amount) || 0), 0);
  const net = totalIn - totalOut;
  const sorted = [...payments].sort((a, b) => (b.date || '').localeCompare(a.date || ''));

  return (
    <Modal open={open} onClose={onClose} title="📥 پرداخت‌های این معامله" size="md">
      {payments.length === 0 ? (
        <div style={{ padding: 'var(--sp-4)', textAlign: 'center', color: 'var(--muted)', fontSize: 'var(--fs-sm)' }}>
          پرداختی ثبت نشده — در ویرایش معامله می‌تونی اضافه کنی.
        </div>
      ) : (
        <>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 'var(--sp-2)',
            padding: 'var(--pad-normal)',
            background: 'var(--input-bg)',
            borderRadius: 'var(--r-sm)',
            marginBottom: 'var(--sp-3)',
            fontSize: 'var(--fs-sm)',
          }}>
            <div>
              <div style={{ color: 'var(--muted)', fontSize: 'var(--fs-xs)' }}>دریافت</div>
              <div style={{ fontWeight: 700 }}>{fmtMoney(totalIn)}</div>
            </div>
            <div>
              <div style={{ color: 'var(--muted)', fontSize: 'var(--fs-xs)' }}>پرداخت</div>
              <div style={{ fontWeight: 700 }}>{fmtMoney(totalOut)}</div>
            </div>
            <div>
              <div style={{ color: 'var(--muted)', fontSize: 'var(--fs-xs)' }}>خالص</div>
              <div style={{ fontWeight: 700 }}>{fmtMoney(net)}</div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-2)' }}>
            {sorted.map(p => (
              <div
                key={p.id}
                style={{
                  padding: 'var(--pad-normal)',
                  background: 'var(--card)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--r-sm)',
                  fontSize: 'var(--fs-sm)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                  <span style={{ color: 'var(--muted)' }}>{toFa(p.date || '—')}</span>
                  <span style={{ fontWeight: 700 }}>
                    {p.direction === 'in' ? '📥 دریافت' : '📤 پرداخت'}
                  </span>
                  <span style={{ fontWeight: 700 }}>{fmtMoney(p.amount)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, color: 'var(--muted)', fontSize: 'var(--fs-xs)' }}>
                  <span>روش: {METHOD_LABEL[p.method] || p.method}</span>
                  {p.notes && <span style={{ textAlign: 'left' }}>💬 {p.notes}</span>}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <div style={{ marginTop: 'var(--sp-4)' }}>
        <Btn onClick={onClose} style={{ width: '100%' }}>بستن</Btn>
      </div>
    </Modal>
  );
}
