/**
 * UnmergeFlocksModal — انتخاب گله برای بازگردانی از ادغام
 * - نمایش گله اصلی (target) در بالا (غیرقابل بازگردانی)
 * - نمایش منابع قابل انتخاب با اطلاعات کامل
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

interface SourceInfo {
  flockId: string;
  flockName: string;
  count?: number;
  initialCount?: number;
  maleCount?: number;
  femaleCount?: number;
  unknownCount?: number;
  ageDays?: number;
  isTarget: boolean;
}

export default function UnmergeFlocksModal({ open, onClose, targetFlockId }: Props) {
  const allFlocks = useFlk(s => s.flocks);
  const unmergeFlocks = useFlk(s => s.unmergeFlocks);

  const target = allFlocks.find(f => f.id === targetFlockId);

  const targetItem: SourceInfo | null = useMemo(() => {
    if (!target?.mergedInfo?.sources) return null;
    const t = target.mergedInfo.sources.find((s: any) => s.flockId === targetFlockId);
    return t ? { ...t, isTarget: true } : null;
  }, [target, targetFlockId]);

  const sourceItems: SourceInfo[] = useMemo(() => {
    if (!target?.mergedInfo?.sources) return [];
    return (target.mergedInfo.sources as any[])
      .filter(s => s.flockId !== targetFlockId)
      .map(s => ({ ...s, isTarget: false }));
  }, [target, targetFlockId]);

  const [selectedId, setSelectedId] = useState<string>('');

  const effectiveSelectedId = sourceItems.some(s => s.flockId === selectedId)
    ? selectedId
    : (sourceItems[0]?.flockId || '');

  const selectedSrc = sourceItems.find(s => s.flockId === effectiveSelectedId);

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

  const renderInfo = (item: SourceInfo, tone: 'accent' | 'muted') => (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-1)' }}>
      <Row l="تعداد فعلی" v={fmtInt(item.count)} />
      <Row l="تعداد اولیه" v={fmtInt(item.initialCount ?? item.count)} />
      <Row l="نر" v={fmtInt(item.maleCount)} />
      <Row l="ماده" v={fmtInt(item.femaleCount)} />
      <Row l="نامشخص" v={fmtInt(item.unknownCount)} />
      <Row l="سن" v={`${fmtInt(Math.round(item.ageDays || 0))} روز`} />
    </div>
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="بازگردانی گله ادغام‌شده"
      size="md"
      footer={
        sourceItems.length > 0
          ? <BtnRow><Btn variant="primary" onClick={handleConfirm} disabled={!effectiveSelectedId}>♻️ بازگردانی</Btn><Btn onClick={onClose}>انصراف</Btn></BtnRow>
          : <BtnRow><Btn onClick={onClose}>بستن</Btn></BtnRow>
      }
    >
      {sourceItems.length === 0 && !targetItem ? (
        <div style={{ padding: 'var(--pad-normal)', textAlign: 'center', color: 'var(--muted)', fontSize: 'var(--fs-sm)' }}>
          هیچ گله‌ای برای بازگردانی نیست.
        </div>
      ) : (
        <>
          {/* ── گله اصلی (target) ── */}
          {targetItem && (
            <div style={{
              marginBottom: 12,
              padding: 'var(--pad-normal)',
              background: 'var(--input-bg)',
              border: '1px solid var(--border)',
              borderRight: '3px solid var(--accent)',
              borderRadius: 'var(--r-md)',
              opacity: 0.85,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <span style={{ fontWeight: 700, fontSize: 'var(--fs-sm)' }}>{targetItem.flockName}</span>
                <span style={{
                  fontSize: 'var(--fs-2xs)',
                  color: 'var(--accent)',
                  background: 'var(--accent-soft)',
                  border: '1px solid var(--accent-border)',
                  padding: '1px 6px',
                  borderRadius: 4,
                  fontWeight: 700,
                }}>گله اصلی</span>
              </div>
              {renderInfo(targetItem, 'accent')}
              <div style={{ marginTop: 6, fontSize: 'var(--fs-xs)', color: 'var(--muted)' }}>
                ℹ️ این گله پس از بازگردانی منبع‌ها، فعال باقی می‌ماند.
              </div>
            </div>
          )}

          {/* ── منابع قابل بازگردانی ── */}
          {sourceItems.length > 0 && (
            <>
              <div style={{
                padding: 'var(--pad-normal)',
                background: 'var(--info-soft, rgba(2,132,199,.08))',
                border: '1px solid var(--info, #0284c7)',
                borderRadius: 'var(--r-md)',
                fontSize: 'var(--fs-sm)',
                marginBottom: 8,
              }}>
                انتخاب کنید کدام گله از این ادغام خارج شود:
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {sourceItems.map(src => {
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
                        {isSelected && (
                          <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--accent)', fontWeight: 700 }}>
                            انتخاب‌شده
                          </span>
                        )}
                      </div>
                      {renderInfo(src, 'muted')}
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
        </>
      )}
    </Modal>
  );
}
