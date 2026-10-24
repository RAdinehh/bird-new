import { useState, useEffect } from 'react';
import { Modal, Btn } from '../../../shr/components/ui';
import { useCtc } from '../../ctc/store';
import { BtnRow } from '../../../shr/components/ui/Btn';
import { showConfirmAsync } from '../../../cor/store/dialog';
import { clearRecycleBin, removeFromRecycleBin } from '../../../shr/utils/recycleBin';
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
  const { contacts } = useCtc();
  const [entries, setEntries] = useState<RecycleBinEntry<DeletedInvoiceSnapshot>[]>([]);

  useEffect(() => {
    if (open) {
      const list = listRecycleBin<DeletedInvoiceSnapshot>('tra');
      setEntries(list.sort((a, b) => new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime()));
    } else {
      setEntries([]);
    }
  }, [open]);

  const handleDeleteSingle = async (id: string) => {
    const ok = await showConfirmAsync('حذف دائمی', 'این فاکتور برای همیشه حذف شود؟ این عمل غیرقابل بازگشت است.', { danger: true, confirmText: 'حذف کن', cancelText: 'انصراف' });
    if (!ok) return;
    removeFromRecycleBin<DeletedInvoiceSnapshot>('tra', (snap) => snap.invoice.id === id);
    setEntries(prev => prev.filter(e => e.item.invoice.id !== id));
    toastMsg.success('فاکتور برای همیشه حذف شد');
  };

  const handleClearAll = async () => {
    const ok = await showConfirmAsync(
      '⛔ حذف دائمی همه',
      'با این کار:\n• ارتباط فاکتورها با گله و انبار برای همیشه قطع می‌شود.\n• بدهی طرف حساب و گزارشات مالی/آماری ناقص می‌شوند.\n• امکان بازگشت وجود ندارد.\n\nآیا مطمئنید؟',
      { danger: true, confirmText: 'بله، همه را حذف کن', cancelText: 'انصراف' }
    );
    if (!ok) return;
    clearRecycleBin('tra');
    setEntries([]);
    toastMsg.success('سبد بازیابی برای همیشه خالی شد');
  };

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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 4, borderBottom: '1px solid var(--border)' }}>
            <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)' }}>مرتب‌شده بر اساس نزدیک‌ترین به انقضا</span>
            <Btn size="sm" variant="danger" onClick={handleClearAll}>🗑️ خالی کردن سبد</Btn>
          </div>
          {entries.map((e) => {
            const inv = e.item.invoice;
            const days = daysLeft(e.expiresAt);
            const isSale = inv.type === 'sale';

            // استخراج اطلاعات
            const catList = CATEGORIES[inv.type] || [];
            const catLabel = catList.find((c: [string, string]) => c[0] === inv.category)?.[1] || inv.category;
            const party = contacts.find(c => c.id === inv.partyId);
            const partyName = party?.name || 'ناشناس';
            const itemsText = inv.items.map(it => it.description).filter(Boolean).slice(0, 2).join('، ');
            const linkedFlocks = e.item.linkedFlocks || [];
            const hasFlock = linkedFlocks.length > 0;

            // رنگ بج روزهای باقی‌مانده
            const isUrgent = days <= 7;
            const badgeBg = isUrgent ? 'var(--danger-soft)' : 'var(--warn-soft)';
            const badgeColor = isUrgent ? 'var(--danger)' : 'var(--warn)';

            return (
              <div key={inv.id} style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 12, border: '1px solid var(--border)', borderRadius: 'var(--r-md)', background: 'var(--card-solid)' }}>
                {/* ردیف اول: تیتر (طرف حساب + دسته) */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 20 }}>{isSale ? '📤' : '📥'}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 'var(--fs-base)', color: 'var(--text)' }}>
                      {partyName} — {catLabel}
                    </div>
                    <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)' }}>
                      فاکتور: {inv.number} • {toFa(inv.date)}
                    </div>
                  </div>
                  {hasFlock ? (
                    <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 'var(--r-sm)', background: 'var(--accent-soft)', color: 'var(--accent)', fontWeight: 700 }}>🔗 متصل به گله</span>
                  ) : (
                    <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 'var(--r-sm)', background: 'var(--input-bg)', color: 'var(--muted)', fontWeight: 700 }}>بدون گله</span>
                  )}
                </div>

                {/* ردیف دوم: اقلام */}
                <div style={{ fontSize: 'var(--fs-xs)' }}>
                  <span style={{ background: 'var(--input-bg)', padding: '2px 6px', borderRadius: 'var(--r-sm)' }}>اقلام: {itemsText || '—'}</span>
                </div>

                {/* ردیف سوم: مالی و زمان */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 'var(--fs-xs)', marginTop: 2 }}>
                  <span style={{ color: 'var(--text)', fontWeight: 700 }}>{toFa(inv.total.toLocaleString('fa-IR'))} تومان</span>
                  <span style={{ padding: '2px 6px', borderRadius: 'var(--r-sm)', background: badgeBg, color: badgeColor, fontWeight: 700 }}>
                    {toFa(days)} روز مونده
                  </span>
                </div>

                {/* ردیف چهارم: زمان دقیق حذف */}
                <div style={{ fontSize: 10, color: 'var(--dim)' }}>
                  🗑️ حذف شده در: {new Date(e.deletedAt).toLocaleString('fa-IR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                </div>

                {/* ردیف پنجم: دکمه‌ها (استاندارد) */}
                <BtnRow>
                  <Btn size="sm" variant="outline" onClick={() => handleDeleteSingle(inv.id)} style={{ color: 'var(--danger)', borderColor: 'var(--danger)' }}>
                    🗑️ حذف کامل
                  </Btn>
                  <Btn size="sm" variant="primary" onClick={() => handleRestore(inv.id)}>
                    ↩️ بازیابی
                  </Btn>
                </BtnRow>
              </div>
            );
          })}
        </div>
      )}
    </Modal>
  );
}
