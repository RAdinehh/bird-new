import { Modal, Btn } from '../../../shr/components/ui';
import { toFa } from '../../../shr/utils/fa';
import { useTra } from '../store';
import { toastMsg } from '../../../cor/store/toast';
import { logAction } from '../../../cor/logger/auditLog';
import { listRecycleBin, type RecycleBinEntry } from '../../../shr/utils/recycleBin';
import type { DeletedInvoiceSnapshot } from '../types';

interface Props {
  open: boolean;
  onClose: () => void;
}

function daysLeft(expiresAt: string): number {
  const ms = new Date(expiresAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}

export default function RecycleBinModal({ open, onClose }: Props) {
  const { restoreInvoice } = useTra();
  const entries: RecycleBinEntry<DeletedInvoiceSnapshot>[] = open
    ? listRecycleBin<DeletedInvoiceSnapshot>('tra')
    : [];

  const handleRestore = (id: string) => {
    const ok = restoreInvoice(id);
    if (ok) {
      toastMsg.restored('فاکتور');
      try { logAction('restore', 'tra', 'بازیابی فاکتور از سبد: ' + id); } catch { /* silent */ }
    } else {
      toastMsg.error('بازیابی ناموفق');
    }
  };

  const title =
    entries.length > 0
      ? '🗑️ سبد بازیابی (' + toFa(entries.length) + ')'
      : '🗑️ سبد بازیابی';

  return (
    <Modal open={open} onClose={onClose} title={title} size="md">
      {entries.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 24, color: 'var(--muted)' }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>🗑️</div>
          <div style={{ fontWeight: 700 }}>سبد بازیابی خالی است</div>
          <div style={{ fontSize: 'var(--fs-xs)', marginTop: 4 }}>
            فاکتورهای حذف‌شده تا ۳۰ روز اینجا می‌مانند
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {entries.map((e) => {
            const inv = e.item.invoice;
            const days = daysLeft(e.expiresAt);
            const isSale = inv.type === 'sale';
            return (
              <div
                key={inv.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: 10,
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--r-md)',
                  background: 'var(--card-solid, #fff)',
                }}
              >
                <span style={{ fontSize: 18 }}>{isSale ? '📤' : '📥'}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 'var(--fs-sm)' }}>
                    {isSale ? 'فروش' : 'خرید'}
                    {inv.number ? ' — ' + inv.number : ''}
                  </div>
                  <div
                    style={{
                      fontSize: 'var(--fs-xs)',
                      color: 'var(--muted)',
                      marginTop: 2,
                    }}
                  >
                    {toFa(inv.date)} •{' '}
                    {toFa(inv.total.toLocaleString('fa-IR'))} تومان •{' '}
                    {toFa(days)} روز مونده
                  </div>
                </div>
                <Btn
                  size="sm"
                  variant="outline"
                  onClick={() => handleRestore(inv.id)}
                >
                  ↩️ بازیابی
                </Btn>
              </div>
            );
          })}
        </div>
      )}
    </Modal>
  );
}
