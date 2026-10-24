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
  const [visibleCount, setVisibleCount] = useState(20); // 🆕 نمایش ۲۰ کارت در ابتدا

  useEffect(() => {
    if (open) {
      const list = listRecycleBin<DeletedInvoiceSnapshot>('tra');
      setEntries(list.sort((a, b) => new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime()));
      setVisibleCount(20); // 🆕 ریست به ۲۰
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
      
      // 🆕 ۱. حذف فوری آیتم از لیست سبد بازیابی (تا کاربر ببیند از سبد خارج شد)
      setEntries(prev => prev.filter(e => e.item.invoice.id !== id));
      
      // 🆕 ۲. بستن خودکار پنجره سبد بازیابی (استاندارد ERP)
      onClose();
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
            <Btn size="sm" variant="outline" onClick={handleClearAll} style={{ color: 'var(--danger)', borderColor: 'var(--danger)', fontSize: 11, padding: '2px 8px', minHeight: 28 }}>🗑️ خالی کردن سبد</Btn>
          </div>
          {entries.slice(0, visibleCount).map((e) => {
            const inv = e.item.invoice;
            const days = daysLeft(e.expiresAt);
            const isSale = inv.type === 'sale';

            const catList = CATEGORIES[inv.type] || [];
            const catLabel = catList.find((c: [string, string]) => c[0] === inv.category)?.[1] || inv.category;
            const party = contacts.find(c => c.id === inv.partyId);
            const partyName = party?.name || 'ناشناس';
            const itemsText = inv.items.map(it => it.description).filter(Boolean).slice(0, 2).join('، ');
            const linkedFlocks = e.item.linkedFlocks || [];
            const hasFlock = linkedFlocks.length > 0;
            
            // 🆕 استاندارد ERP: فقط پرنده‌ها (جوجه و بالغ) باید به گله وصل شوند
            const isBirdCategory = ['chick', 'adult'].includes(inv.category);

            const isUrgent = days <= 7;
            const badgeBg = isUrgent ? 'var(--danger-soft)' : 'var(--warn-soft)';
            const badgeColor = isUrgent ? 'var(--danger)' : 'var(--warn)';

            return (
              <div key={inv.id} style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: 10, border: '1px solid var(--border)', borderRadius: 'var(--r-md)', background: 'var(--card-solid)' }}>
                {/* ردیف اول: تیتر (نام و وضعیت) */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 16 }}>{isSale ? '📤' : '📥'}</span>
                    <div style={{ fontWeight: 700, fontSize: 'var(--fs-sm)', color: 'var(--text)' }}>
                      {partyName} — {catLabel}
                    </div>
                  </div>
                  {isBirdCategory ? (
                    hasFlock ? (
                      <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 'var(--r-sm)', background: 'var(--accent-soft)', color: 'var(--accent)', fontWeight: 700 }}>🔗 متصل به گله</span>
                    ) : (
                      <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 'var(--r-sm)', background: 'var(--warn-soft)', color: 'var(--warn)', fontWeight: 700 }}>بدون گله</span>
                    )
                  ) : (
                    <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 'var(--r-sm)', background: 'var(--input-bg)', color: 'var(--muted)', fontWeight: 700 }}>📦 کالای انباری</span>
                  )}
                </div>

                {/* ردیف دوم: جزئیات کالا و قیمت */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 4 }}>
                  <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', flex: 1, minWidth: '50%' }}>
                    اقلام: {itemsText || '—'}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ color: 'var(--text)', fontWeight: 700, fontSize: 'var(--fs-sm)' }}>{toFa(inv.total.toLocaleString('fa-IR'))} تومان</span>
                    <span style={{ padding: '2px 6px', borderRadius: 'var(--r-sm)', background: badgeBg, color: badgeColor, fontWeight: 700, fontSize: 10 }}>{toFa(days)} روز مونده</span>
                  </div>
                </div>

                {/* ردیف سوم: متادیتا و دکمه‌ها */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 2, borderTop: '1px dashed var(--border)', paddingTop: 6 }}>
                  <div style={{ fontSize: 10, color: 'var(--dim)', lineHeight: 1.4 }}>
                    <div>فاکتور: {inv.number} • {toFa(inv.date)}</div>
                    <div>🗑️ حذف: {new Date(e.deletedAt).toLocaleString('fa-IR', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <Btn size="sm" variant="outline" onClick={() => handleDeleteSingle(inv.id)} style={{ color: 'var(--danger)', borderColor: 'var(--danger)', minHeight: 28, height: 28, padding: '0 8px', fontSize: 11 }}>
                      🗑️ حذف
                    </Btn>
                    <Btn size="sm" variant="primary" onClick={() => handleRestore(inv.id)} style={{ minHeight: 28, height: 28, padding: '0 8px', fontSize: 11 }}>
                      ↩️ بازیابی
                    </Btn>
                  </div>
                </div>
              </div>
            );
          })}
          
          {/* 🆕 دکمه نمایش بیشتر برای لیست‌های طولانی */}
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
