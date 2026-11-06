/**
 * UnmergeFlocksModal — انتخاب گله برای بازگردانی از ادغام
 */
import { useState, useMemo } from 'react';
import { Modal, Btn, BtnRow } from '../../../shr/components/ui';
import { toastMsg } from '../../../cor/store/toast';
import { showConfirmAsync } from '../../../cor/store/dialog';
import { toFa } from '../../../shr/utils/fa';
import { useFlk } from '../store';

interface Props {
  open: boolean;
  onClose: () => void;
  targetFlockId: string;
}

export default function UnmergeFlocksModal({ open, onClose, targetFlockId }: Props) {
  const allFlocks = useFlk(s => s.flocks);
  const unmergeFlocks = useFlk(s => s.unmergeFlocks);

  const target = allFlocks.find(f => f.id === targetFlockId);
  const sources = useMemo(
    () => (target?.mergedInfo?.sources || []).filter((s: any) => s.flockId !== targetFlockId),
    [target, targetFlockId]
  );

  const [selectedId, setSelectedId] = useState<string>('');

  // اگر sources تغییر کرد و انتخاب قبلی معتبر نیست، اولین را انتخاب کن
  const effectiveSelectedId = sources.some((s: any) => s.flockId === selectedId)
    ? selectedId
    : (sources[0]?.flockId || '');

  const handleConfirm = async () => {
    if (!effectiveSelectedId) return;
    const src = sources.find((s: any) => s.flockId === effectiveSelectedId);
    if (!src) return;
    const ok = await showConfirmAsync(
      'تأیید بازگردانی',
      `گله «${src.flockName}» با ${toFa(src.count || 0)} پرنده به حالت فعال بازمی‌گردد.`,
      { confirmText: 'بازگردانی' }
    );
    if (!ok) return;
    try {
      unmergeFlocks(targetFlockId, effectiveSelectedId);
      toastMsg.success('گله بازگردانده شد');
      onClose();
    } catch (e) {
      console.error('[UnmergeFlocksModal]', e);
      toastMsg.error('خطا در بازگردانی');
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="🔓 بازگردانی گله ادغام‌شده"
      footer={
        sources.length > 0
          ? <BtnRow><Btn variant="primary" onClick={handleConfirm} disabled={!effectiveSelectedId}>بازگردانی</Btn><Btn onClick={onClose}>انصراف</Btn></BtnRow>
          : <BtnRow><Btn onClick={onClose}>بستن</Btn></BtnRow>
      }
    >
      {sources.length === 0 ? (
        <div style={{
          padding: 'var(--pad-normal)', textAlign: 'center',
          color: 'var(--muted)', fontSize: 'var(--fs-sm)',
        }}>
          هیچ گله‌ای برای بازگردانی نیست.
        </div>
      ) : (
        <>
          <div style={{
            padding: 'var(--pad-normal)',
            background: 'var(--info-soft, rgba(2,132,199,.08))',
            border: '1px solid var(--info, #0284c7)',
            borderRadius: 'var(--r-md)',
            fontSize: 'var(--fs-sm)',
            marginBottom: 12,
          }}>
            انتخاب کنید کدام گله از این ادغام خارج شود.
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {sources.map((src: any) => {
              const isSelected = src.flockId === effectiveSelectedId;
              return (
                <label key={src.flockId} style={{
                  display: 'flex', alignItems: 'center', gap: 'var(--sp-2)',
                  padding: 'var(--pad-normal)',
                  background: isSelected ? 'var(--accent-soft)' : 'var(--input-bg)',
                  border: '1px solid ' + (isSelected ? 'var(--accent)' : 'var(--border)'),
                  borderRadius: 'var(--r-md)',
                  cursor: 'pointer',
                }}>
                  <input
                    type="radio"
                    name="unmerge-source"
                    checked={isSelected}
                    onChange={() => setSelectedId(src.flockId)}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 'var(--fs-sm)' }}>{src.flockName}</div>
                    <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)' }}>
                      {toFa(src.count || 0)} پرنده • سن {toFa(Math.round(src.ageDays || 0))} روز
                    </div>
                  </div>
                </label>
              );
            })}
          </div>
        </>
      )}
    </Modal>
  );
}
