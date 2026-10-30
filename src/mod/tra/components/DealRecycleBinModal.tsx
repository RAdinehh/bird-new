/**
 * DealRecycleBinModal.tsx — سبد بازیافت معاملات
 * دقیقاً مطابق RecycleBinModal (فاکتورها)
 */
import { useState, useEffect } from 'react';
import { Modal, Btn } from '../../../shr/components/ui';
import { showConfirmAsync } from '../../../cor/store/dialog';
import { clearRecycleBin, removeFromRecycleBin, listRecycleBin, type RecycleBinEntry } from '../../../shr/utils/recycleBin';
import { toFa } from '../../../shr/utils/fa';
import { useTra, DEAL_LABEL } from '../store';
import { useCtc } from '../../ctc/store';
import { toastMsg } from '../../../cor/store/toast';
import { logAction } from '../../../cor/logger/auditLog';
import type { DeletedDealSnapshot } from '../types';

interface Props {
  open: boolean;
  onClose: () => void;
}

function daysLeft(expiresAt: string): number {
  const ms = new Date(expiresAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}

export default function DealRecycleBinModal({ open, onClose }: Props) {
  const { restoreDealFromBin } = useTra();
  const { contacts } = useCtc();
  const [entries, setEntries] = useState<RecycleBinEntry<DeletedDealSnapshot>[]>([]);
  const [visibleCount, setVisibleCount] = useState(20);

  useEffect(() => {
    if (open) {
      const list = listRecycleBin<DeletedDealSnapshot>('tra-deals');
      setEntries(list.sort((a, b) => new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime()));
      setVisibleCount(20);
    } else {
      setEntries([]);
    }
  }, [open]);

  const handleDeleteSingle = async (id: string) => {
    const ok = await showConfirmAsync(
      'حذف دائمی',
      'این معامله برای همیشه حذف شود؟ این عمل غیرقابل بازگشت است.',
      { danger: true, confirmText: 'حذف کن', cancelText: 'انصراف' }
    );
    if (!ok) return;
    removeFromRecycleBin<DeletedDealSnapshot>('tra-deals', (e) => e.deal.id === id);
    setEntries(prev => prev.filter(e => e.item.deal.id !== id));
    toastMsg.success('معامله برای همیشه حذف شد');
  };

  const handleClearAll = async () => {
    const ok = await showConfirmAsync(
      '⛔ حذف دائمی همه',
      'با این کار:\n• ارتباط معاملات با گله، هچری و انبار برای همیشه قطع می‌شود.\n• موجودی گله و انبار اصلاح‌شده باقی می‌ماند.\n• گزارشات مالی/آماری ناقص می‌شوند.\n\nآیا مطمئنید؟',
      { danger: true, confirmText: 'بله، همه را حذف کن', cancelText: 'انصراف' }
    );
    if (!ok) return;
    clearRecycleBin('tra-deals');
    setEntries([]);
    toastMsg.success('سبد بازیابی برای همیشه خالی شد');
  };

  const handleRestore = (id: string) => {
    const ok = restoreDealFromBin(id);
    if (ok) {
      toastMsg.restored('معامله');
      try { logAction('restore', 'tra', 'بازیابی معامله از سبد: ' + id); } catch { /* silent */ }
      setEntries(prev => prev.filter(e => e.item.deal.id !== id));
      onClose();
    } else {
      toastMsg.error('بازیابی ناموفق');
    }
  };

  const title = entries.length > 0
    ? '🗑️ سبد بازیافت (' + toFa(entries.length) + ')'
    : '🗑️ سبد بازیافت';

  return (
    <Modal open={open} onClose={onClose} title={title} size="md">
      {entries.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 24, color: 'var(--muted)' }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>🗑️</div>
          <div style={{ fontWeight: 700 }}>سبد بازیابی خالی است</div>
          <div style={{ fontSize: 'var(--fs-xs)', marginTop: 4 }}>
            معاملات حذف‌شده تا ۳۰ روز اینجا می‌مانند
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingBottom: 12, borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, background: 'var(--card-solid)', zIndex: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <span>🔄</span> مرتب‌سازی: نزدیک‌ترین به انقضا
              </span>
              <Btn size="sm" variant="outline" onClick={handleClearAll} style={{ color: 'var(--danger)', borderColor: 'var(--danger)', fontSize: 11, padding: '2px 8px', minHeight: 28 }}>
                🗑️ خالی کردن سبد
              </Btn>
            </div>
          </div>

          {entries.slice(0, visibleCount).map((entry) => {
            const deal = entry.item.deal;
            const party = contacts.find(c => c.id === deal.partyId);
            const partyName = party?.name || 'ناشناس';
            const days = daysLeft(entry.expiresAt);
            const isUrgent = days <= 7;
            const badgeBg = isUrgent ? 'var(--danger-soft)' : 'var(--warn-soft)';
            const badgeColor = isUrgent ? 'var(--danger)' : 'var(--warn)';
            const goodsText = (deal.goods || []).map(g => g.name).filter(Boolean).slice(0, 2).join('، ') || '—';
            const typeLabel = DEAL_LABEL[deal.type] || deal.type;
            const typeEmoji = deal.type === 'consignment' ? '📦' : deal.type === 'partnership' ? '🤝' : deal.type === 'barter' ? '🔄' : '📋';
            const statusLabel = deal.status === 'settled' ? '✓ تسویه‌شده' : deal.status === 'cancelled' ? '✕ لغو‌شده' : '● باز';

            return (
              <div key={deal.id} style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 12, border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', background: 'var(--card-solid)', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                {/* ردیف ۱: تیتر + بج */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 16 }}>{typeEmoji}</span>
                    <div style={{ fontWeight: 700, fontSize: 'var(--fs-sm)', color: 'var(--text)' }}>
                      {partyName} — {typeLabel}
                    </div>
                  </div>
                  <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 'var(--r-sm)', background: 'var(--input-bg)', color: 'var(--muted)', fontWeight: 700 }}>
                    {statusLabel}
                  </span>
                </div>

                {/* ردیف ۲: اقلام + مبلغ + روزها */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 4 }}>
                  <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', flex: 1, minWidth: '50%' }}>
                    اقلام: {goodsText}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ color: 'var(--text)', fontWeight: 700, fontSize: 'var(--fs-sm)' }}>
                      {toFa((deal.value || 0).toLocaleString('fa-IR'))} تومان
                    </span>
                    <span style={{ padding: '2px 6px', borderRadius: 'var(--r-sm)', background: badgeBg, color: badgeColor, fontWeight: 700, fontSize: 10 }}>
                      {toFa(days)} روز مونده
                    </span>
                  </div>
                </div>

                {/* ردیف ۳: متادیتا + دکمه‌ها */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 2, borderTop: '1px dashed var(--border)', paddingTop: 6 }}>
                  <div style={{ fontSize: 10, color: 'var(--dim)', lineHeight: 1.4 }}>
                    <div>معامله: {deal.dealNumber || 'بدون شماره'} • {toFa(deal.date)}</div>
                    <div>🗑️ حذف: {new Date(entry.deletedAt).toLocaleString('fa-IR', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <Btn size="sm" variant="outline" onClick={() => handleDeleteSingle(deal.id)} style={{ color: 'var(--danger)', borderColor: 'var(--danger)', minHeight: 28, height: 28, padding: '0 8px', fontSize: 11 }}>
                      🗑️ حذف
                    </Btn>
                    <Btn size="sm" variant="primary" onClick={() => handleRestore(deal.id)} style={{ minHeight: 28, height: 28, padding: '0 8px', fontSize: 11 }}>
                      ↩️ بازیابی
                    </Btn>
                  </div>
                </div>
              </div>
            );
          })}

          {entries.length > visibleCount && (
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: 12, marginBottom: 8 }}>
              <Btn size="sm" variant="outline" onClick={() => setVisibleCount(c => c + 20)}>
                نمایش ۲۰ مورد بعدی (از {toFa(entries.length - visibleCount)} مورد باقی‌مانده)
              </Btn>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
