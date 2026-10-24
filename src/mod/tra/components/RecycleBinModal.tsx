import { Modal, Btn } from '../../../shr/components/ui';
import { toFa } from '../../../shr/utils/fa';
import { useTra, CATEGORIES } from '../store';
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

            // 🆕 استخراج نام دسته کالا از CATEGORIES
            const catList = CATEGORIES[inv.type] || [];
            const catLabel = catList.find((c: [string, string]) => c[0] === inv.category)?.[1] || inv.category;

            // 🆕 استخراج نام اقلام (حداکثر ۲ مورد)
            const itemsText = inv.items
              .map(it => it.description)
              .filter(Boolean)
              .slice(0, 2)
              .join('، ');

            // 🆕 بررسی وضعیت اتصال به گله
            const linkedFlocks = e.item.linkedFlocks || [];
            const hasFlock = linkedFlocks.length > 0;

            return (
              <div
                key={inv.id}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                  padding: 10,
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--r-md)',
                  background: 'var(--card-solid, #fff)',
                }}
              >
                {/* ردیف بالا: آیکون، عنوان و وضعیت گله */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 18 }}>{isSale ? '📤' : '📥'}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 'var(--fs-sm)' }}>
                      {isSale ? 'فروش' : 'خرید'}
                      {inv.number ? ' — ' + inv.number : ''}
                    </div>
                  </div>
                  {hasFlock ? (
                    <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 'var(--r-sm)', background: 'var(--accent-soft)', color: 'var(--accent)', fontWeight: 700 }}>
                      🔗 متصل به گله
                    </span>
                  ) : (
                    <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 'var(--r-sm)', background: 'var(--input-bg)', color: 'var(--muted)', fontWeight: 700 }}>
                      بدون گله
                    </span>
                  )}
                </div>

                {/* ردیف میانی: دسته و اقلام */}
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', fontSize: 'var(--fs-xs)' }}>
                  <span style={{ background: 'var(--input-bg)', padding: '2px 6px', borderRadius: 'var(--r-sm)', color: 'var(--text)' }}>
                    <b>دسته:</b> {catLabel}
                  </span>
                  {itemsText && (
                    <span style={{ background: 'var(--input-bg)', padding: '2px 6px', borderRadius: 'var(--r-sm)', color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}>
                      <b>اقلام:</b> {itemsText}
                    </span>
                  )}
                </div>

                {/* ردیف پایین: تاریخ، مبلغ، روزهای باقی‌مانده و دکمه */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 }}>
                  <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)' }}>
                    {toFa(inv.date)} • {toFa(inv.total.toLocaleString('fa-IR'))} تومان • {toFa(days)} روز مونده
                  </div>
                  <Btn
                    size="sm"
                    variant="outline"
                    onClick={() => handleRestore(inv.id)}
                  >
                    ↩️ بازیابی
                  </Btn>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Modal>
  );
}
