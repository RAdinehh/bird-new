/**
 * PickInvoiceModal.tsx — انتخاب فاکتور خرید پرنده از tra
 * auto-fill: تعداد اولیه، تاریخ خرید، قیمت، پرنده، نژاد
 */
import { useMemo } from 'react';
import { Modal, Btn, BtnRow } from '../../../shr/components/ui';
import { useTra } from '../../tra/store';
import type { Invoice, InvoiceItem } from '../../tra/types';
import { toFa } from '../../../shr/utils/fa';

interface Props {
  open: boolean;
  onClose: () => void;
  onSelect: (invoice: Invoice) => void;
}

export default function PickInvoiceModal({ open, onClose, onSelect }: Props) {
  const invoices = useTra(s => s.invoices);

  // فاکتورهای خرید که آیتم پرنده دارن
  const birdInvoices = useMemo(() => {
    return (invoices || [])
      .filter((inv: Invoice) => inv.type === 'purchase' && inv.items?.some((it: InvoiceItem) => it.birdId))
      .slice()
      .sort((a: Invoice, b: Invoice) => (b.date || '').localeCompare(a.date || ''));
  }, [invoices]);

  const handlePick = (inv: Invoice) => {
    onSelect(inv);
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} title="📄 انتخاب فاکتور خرید پرنده">
      {birdInvoices.length === 0 ? (
        <div style={{ padding: 'var(--sp-8)', textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>📄</div>
          <div>هیچ فاکتور خرید پرنده‌ای پیدا نشد</div>
          <div style={{ fontSize: 11, marginTop: 4, opacity: 0.7 }}>ابتدا از بخش معاملات، فاکتور خرید پرنده ثبت کنید</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {birdInvoices.map((inv) => {
            const birdItems = (inv.items || []).filter((it: InvoiceItem) => it.birdId);
            const totalQty = birdItems.reduce((s: number, it: InvoiceItem) => s + (it.quantity || 0), 0);
            const firstBird = birdItems[0] || {};
            return (
              <button
                key={inv.id}
                type="button"
                onClick={() => handlePick(inv)}
                style={{
                  padding: 'var(--sp-3)',
                  background: 'var(--card)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--r-md)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  gap: 3,
                  textAlign: 'right',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  color: 'var(--text)',
                  width: '100%',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--accent)' }}>
                    {toFa(totalQty)} پرنده
                  </span>
                  <span style={{ fontFamily: 'monospace', fontSize: 11, color: 'var(--muted)' }}>
                    {toFa(inv.date)}
                  </span>
                </div>
                <div style={{ fontSize: 11, color: 'var(--muted)', display: 'flex', gap: 6, alignItems: 'center' }}>
                  {inv.number && <span>#{inv.number}</span>}
                  {firstBird.breedId && <span>· نژاد: {firstBird.breedId.slice(0, 6)}</span>}
                  {inv.total > 0 && <span>· {toFa(Math.round(inv.total).toLocaleString('fa-IR'))} ت</span>}
                </div>
              </button>
            );
          })}
        </div>
      )}

      <BtnRow>
        <Btn variant="primary" onClick={onClose}>بستن</Btn>
      </BtnRow>
    </Modal>
  );
}
