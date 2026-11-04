/**
 * DeferHistoryModal — تاریخچه تعویق‌ها (Audit Trail)
 */
import { Modal, Btn, BtnRow, Empty } from '../../../shr/components/ui';
import { toFa } from '../../../shr/utils/fa';
import type { Deferral } from '../types';

interface Props {
  open: boolean;
  onClose: () => void;
  deferrals: Deferral[] | undefined;
  invoiceNumber: string;
  onVoidLatest?: () => void;
}

export default function DeferHistoryModal({ open, onClose, deferrals, invoiceNumber, onVoidLatest }: Props) {
  if (!open) return null;
  const list = deferrals || [];

  return (
    <Modal open={open} onClose={onClose} title="📋 تاریخچه تعویق‌ها" size="md"
      footer={<BtnRow><Btn onClick={onClose}>بستن</Btn></BtnRow>}
    >
      <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--muted)', marginBottom: 12 }}>
        فاکتور: {invoiceNumber}
      </div>

      {list.length === 0 ? (
        <Empty icon="📭" title="تاریخچه‌ای وجود ندارد" desc="تاکنون تعویقی ثبت نشده است." />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {list.slice().reverse().map((d, idx) => {
            const isLatest = idx === 0;
            return (
              <div key={d.id} style={{ padding: 12, background: 'var(--input-bg)', borderRadius: 'var(--r-sm)', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontSize: 'var(--fs-sm)', fontWeight: 700, color: 'var(--text)' }}>
                    🗓️ {toFa(d.fromDate)} ← {toFa(d.toDate)}
                  </span>
                  {isLatest && onVoidLatest && (
                    <button type="button" onClick={onVoidLatest} style={{ background: 'transparent', border: 'none', color: 'var(--danger)', fontSize: 'var(--fs-xs)', cursor: 'pointer', textDecoration: 'underline', fontFamily: 'inherit' }}>
                      🗑️ ابطال
                    </button>
                  )}
                </div>
                <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)' }}>📝 دلیل: {d.reason || '—'}</div>
                <div style={{ fontSize: 'var(--fs-2xs)', color: 'var(--dim)', marginTop: 4 }}>🕒 ثبت: {toFa(d.createdAt?.split('T')[0] || '—')}</div>
              </div>
            );
          })}
        </div>
      )}
    </Modal>
  );
}
