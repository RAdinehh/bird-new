/**
 * UnmergeFlocksModal — انتخاب گله برای بازگردانی از ادغام
 * هر گله با اطلاعات کامل (تعداد، جنسیت، سن، اصل)
 */
import { useState, useMemo } from 'react';
import { Modal, Btn, BtnRow } from '../../../shr/components/ui';
import { toastMsg } from '../../../cor/store/toast';
import { showConfirmAsync } from '../../../cor/store/dialog';
import { toFa, formatNumWhileTyping } from '../../../shr/utils/fa';
import { Row } from '../helpers';
import { useFlk } from '../store';

interface Props {
  open: boolean;
  onClose: () => void;
  targetFlockId: string;
}

const fmtInt = (n: number | undefined | null): string => formatNumWhileTyping(String(n || 0)) || '۰';

export default function UnmergeFlocksModal({ open, onClose, targetFlockId }: Props) {
  const allFlocks = useFlk(s => s.flocks);
  const unmergeFlocks = useFlk(s => s.unmergeFlocks);

  const target = allFlocks.find(f => f.id === targetFlockId);
  const sources = useMemo(
    () => (target?.mergedInfo?.sources || []).filter((s: any) => s.flockId !== targetFlockId),
    [target, targetFlockId]
  );

  const [selectedId, setSelectedId] = useState<string>('');

  const effectiveSelectedId = sources.some((s: any) => s.flockId === selectedId)
    ? selectedId
    : (sources[0]?.flockId || '');

  const selectedSrc = sources.find((s: any) => s.flockId === effectiveSelectedId);

  const handleConfirm = async () => {
    if (!selectedSrc) return;
    const ok = await showConfirmAsync(
      'تأیید بازگردانی',
      `گله «${selectedSrc.flockName}» با ${toFa(selectedSrc.count || 0)} پرنده به حالت فعال بازمی‌گردد.`,
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
      title="بازگردانی گله ادغام‌شده"
      size="md"
      footer={
        sources.length > 0
          ? <BtnRow><Btn variant="primary" onClick={handleConfirm} disabled={!effectiveSelectedId}>♻️ بازگردانی</Btn><Btn onClick={onClose}>انصراف</Btn></BtnRow>
          : <BtnRow><Btn onClick={onClose}>بستن</Btn></BtnRow>
      }
    >
      {sources.length === 0 ? (
        <div style={{ padding: 'var(--pad-normal)', textAlign: 'center', color: 'var(--muted)', fontSize: 'var(--fs-sm)' }}>
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
                <div
                  key={src.flockId}
                  onClick={() => setSelectedId(src.flockId)}
                  style={{
                    padding: 'var(--pad-normal)',
                    background: isSelected ? 'var(--accent-soft)' : 'var(--input-bg)',
                    border: '1px solid ' + (isSelected ? 'var(--accent)' : 'var(--border)'),
                    borderRadius: 'var(--r-md)',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input
                      type="radio"
                      name="unmerge-source"
                      checked={isSelected}
                      onChange={() => setSelectedId(src.flockId)}
                      onClick={(e) => e.stopPropagation()}
                      style={{ accentColor: 'var(--accent)' }}
                    />
                    <span style={{ fontWeight: 700, fontSize: 'var(--fs-sm)', flex: 1 }}>{src.flockName}</span>
                    {isSelected && <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--accent)', fontWeight: 700 }}>انتخاب‌شده</span>}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-1)' }}>
                    <Row l="تعداد فعلی" v={fmtInt(src.count)} />
                    <Row l="تعداد اولیه" v={fmtInt(src.initialCount || src.count)} />
                    <Row l="نر" v={fmtInt(src.maleCount)} />
                    <Row l="ماده" v={fmtInt(src.femaleCount)} />
                    <Row l="نامشخص" v={fmtInt(src.unknownCount)} />
                    <Row l="سن" v={`${fmtInt(Math.round(src.ageDays || 0))} روز`} />
                  </div>
                </div>
              );
            })}
          </div>

          {selectedSrc && (
            <div style={{
              marginTop: 12,
              padding: 'var(--pad-normal)',
              background: 'var(--accent-soft)',
              border: '1px solid var(--accent-border)',
              borderRadius: 'var(--r-md)',
              fontSize: 'var(--fs-xs)',
              color: 'var(--accent)',
              fontWeight: 600,
            }}>
              ℹ️ «{selectedSrc.flockName}» با {fmtInt(selectedSrc.count)} پرنده به حالت فعال بازمی‌گردد.
            </div>
          )}
        </>
      )}
    </Modal>
  );
}
