/**
 * DealRecycleBinModal.tsx — سبد بازیافت معاملات
 * بر اساس RecycleBinModal (فاکتورها) — ۳۰ روز نگه‌داری
 */
import { useState, useEffect } from 'react';
import { Modal, Btn } from '../../../shr/components/ui';
import { BtnRow } from '../../../shr/components/ui/Btn';
import { showConfirmAsync } from '../../../cor/store/dialog';
import { clearRecycleBin, removeFromRecycleBin, listRecycleBin, type RecycleBinEntry } from '../../../shr/utils/recycleBin';
import { toFa } from '../../../shr/utils/fa';
import { useTra } from '../store';
import { useCtc } from '../../ctc/store';
import { toastMsg } from '../../../cor/store/toast';
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

  useEffect(() => {
    if (open) {
      const list = listRecycleBin<DeletedDealSnapshot>('tra-deals');
      setEntries(list.sort((a, b) => new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime()));
    } else {
      setEntries([]);
    }
  }, [open]);

  const handleRestore = (id: string) => {
    const ok = restoreDealFromBin(id);
    if (ok) {
      toastMsg.success('معامله بازیابی شد');
      setEntries(prev => prev.filter(e => e.item.deal.id !== id));
    } else {
      toastMsg.error('بازیابی ناموفق — معامله از قبل موجود است');
    }
  };

  const handleDeleteForever = async (id: string) => {
    const ok = await showConfirmAsync('حذف دائمی', 'این معامله برای همیشه حذف شود؟', { danger: true });
    if (!ok) return;
    removeFromRecycleBin<DeletedDealSnapshot>('tra-deals', (e) => e.deal.id === id);
    setEntries(prev => prev.filter(e => e.item.deal.id !== id));
    toastMsg.success('برای همیشه حذف شد');
  };

  const handleClearAll = async () => {
    const ok = await showConfirmAsync('حذف همه', 'همه معاملات بازیافت‌شده برای همیشه حذف شوند؟', { danger: true });
    if (!ok) return;
    clearRecycleBin('tra-deals');
    setEntries([]);
    toastMsg.success('همه حذف شدند');
  };

  return (
    <Modal open={open} onClose={onClose} title={'🗑️ سبد بازیافت معاملات (' + toFa(entries.length) + ')'}>
      {entries.length === 0 ? (
        <div style={{ padding: 'var(--pad-comfy)', textAlign: 'center', color: 'var(--muted)' }}>
          سبد بازیافت خالی است
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {entries.map(entry => {
            const deal = entry.item.deal;
            const party = contacts.find(c => c.id === deal.partyId);
            const days = daysLeft(entry.expiresAt);
            return (
              <div key={deal.id} style={{ padding: 'var(--pad-normal)', background: 'var(--card-solid)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 700, fontSize: 'var(--fs-sm)' }}>{deal.dealNumber || 'بدون شماره'}</span>
                  <span style={{ fontSize: 'var(--fs-xs)', color: days < 7 ? 'var(--danger)' : 'var(--muted)' }}>
                    {toFa(days)} روز مانده
                  </span>
                </div>
                <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)' }}>
                  {party?.name || '—'} • {toFa(deal.date)}
                </div>
                <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                  <Btn size="sm" onClick={() => handleRestore(deal.id)} style={{ flex: 1 }}>♻️ بازیابی</Btn>
                  <Btn size="sm" variant="danger" onClick={() => handleDeleteForever(deal.id)} style={{ flex: 1 }}>حذف دائمی</Btn>
                </div>
              </div>
            );
          })}
          <BtnRow>
            <Btn variant="danger" onClick={handleClearAll}>حذف همه</Btn>
            <Btn onClick={onClose}>بستن</Btn>
          </BtnRow>
        </div>
      )}
    </Modal>
  );
}
