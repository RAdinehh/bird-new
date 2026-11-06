/**
 * UnmergeFlocksModal — بازگردانی گله از ادغام
 * طراحی بر اساس استاندارد SAP/Odoo:
 * - جدول فشرده با هدر چسبان
 * - اسکرول داخلی برای بیش از ۵ منبع
 * - مرتب‌سازی بر اساس نام / تعداد / سن
 * - اطلاعات کلیدی در یک نگاه
 */
import { useState, useMemo } from 'react';
import { Modal, Btn, BtnRow } from '../../../shr/components/ui';
import { toastMsg } from '../../../cor/store/toast';
import { showConfirmAsync } from '../../../cor/store/dialog';
import { toFa, formatNumWhileTyping } from '../../../shr/utils/fa';
import { useFlk, getAgeDays } from '../store';

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

type SortKey = 'name' | 'count' | 'age';

export default function UnmergeFlocksModal({ open, onClose, targetFlockId }: Props) {
  const allFlocks = useFlk(s => s.flocks);
  const unmergeFlocks = useFlk(s => s.unmergeFlocks);

  const target = allFlocks.find(f => f.id === targetFlockId);

  const targetItem: SourceInfo | null = useMemo(() => {
    if (!target) return null;
    return {
      flockId: target.id,
      flockName: target.name,
      count: (target as any).currentCount || 0,
      initialCount: (target as any).initialCount || 0,
      maleCount: (target as any).maleCount || 0,
      femaleCount: (target as any).femaleCount || 0,
      unknownCount: (target as any).unknownCount || 0,
      ageDays: getAgeDays(target),
      isTarget: true,
    };
  }, [target]);

  const sourceItems: SourceInfo[] = useMemo(() => {
    if (!target?.mergedInfo?.sources) return [];
    return (target.mergedInfo.sources as any[])
      .filter(s => s.flockId !== targetFlockId)
      .map(s => ({ ...s, isTarget: false }));
  }, [target, targetFlockId]);

  // مرتب‌سازی
  const [sortKey, setSortKey] = useState<SortKey>('count');
  const sortedSources = useMemo(() => {
    return [...sourceItems].sort((a, b) => {
      if (sortKey === 'name') return (a.flockName || '').localeCompare(b.flockName || '', 'fa');
      if (sortKey === 'count') return (b.count || 0) - (a.count || 0);
      if (sortKey === 'age') return (b.ageDays || 0) - (a.ageDays || 0);
      return 0;
    });
  }, [sourceItems, sortKey]);

  const [selectedId, setSelectedId] = useState<string>('');

  const effectiveSelectedId = sortedSources.some(s => s.flockId === selectedId)
    ? selectedId
    : (sortedSources[0]?.flockId || '');

  const selectedSrc = sortedSources.find(s => s.flockId === effectiveSelectedId);

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

  const handleSortClick = (key: SortKey) => {
    setSortKey(key);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="بازگردانی گله ادغام‌شده"
      size="md"
      footer={
        sortedSources.length > 0
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
          {/* ── گله اصلی ── */}
          {targetItem && (
            <div style={{
              marginBottom: 10,
              padding: 'var(--pad-tight)',
              background: 'var(--input-bg)',
              border: '1px solid var(--border)',
              borderRight: '3px solid var(--info, #0284c7)',
              borderRadius: 'var(--r-md)',
              opacity: 0.85,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              flexWrap: 'wrap',
              fontSize: 'var(--fs-sm)',
            }}>
              <span style={{ fontWeight: 700 }}>{targetItem.flockName}</span>
              <span style={{
                fontSize: 'var(--fs-2xs)',
                color: 'var(--info, #0284c7)',
                background: 'var(--info-soft, rgba(2,132,199,.08))',
                border: '1px solid var(--info, #0284c7)',
                padding: '1px 6px',
                borderRadius: 4,
                fontWeight: 700,
              }}>گله اصلی</span>
              <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', marginRight: 'auto' }}>
                تعداد فعلی: <b>{fmtInt(targetItem.count)}</b> · سن: <b>{fmtInt(Math.round(targetItem.ageDays || 0))}</b> روز
              </span>
            </div>
          )}

          {/* ── خلاصه + مرتب‌سازی ── */}
          {sourceItems.length > 0 && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, flexWrap: 'wrap', gap: 6 }}>
                <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)' }}>
                  این گله از ادغام {toFa(sourceItems.length + 1)} گله ساخته شده. یکی را برای بازگردانی انتخاب کنید:
                </span>
                <div style={{ display: 'flex', gap: 4 }}>
                  {(['name', 'count', 'age'] as SortKey[]).map(k => (
                    <button
                      key={k}
                      type="button"
                      onClick={() => handleSortClick(k)}
                      style={{
                        padding: '2px 8px',
                        fontSize: 'var(--fs-2xs)',
                        background: sortKey === k ? 'var(--accent-soft)' : 'var(--btn-bg)',
                        border: `1px solid ${sortKey === k ? 'var(--accent-border)' : 'var(--border)'}`,
                        borderRadius: 'var(--r-sm)',
                        color: sortKey === k ? 'var(--accent)' : 'var(--muted)',
                        fontWeight: sortKey === k ? 700 : 500,
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                      }}
                    >
                      {k === 'name' ? 'نام' : k === 'count' ? 'تعداد' : 'سن'}
                    </button>
                  ))}
                </div>
              </div>

              {/* ── لیست فشرده با اسکرول داخلی ── */}
              <div style={{
                maxHeight: 260,
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
                paddingRight: 2,
              }}>
                {sortedSources.map(src => {
                  const isSelected = src.flockId === effectiveSelectedId;
                  const m = src.maleCount || 0;
                  const f = src.femaleCount || 0;
                  const u = src.unknownCount || 0;
                  const genderText = (m === 0 && f === 0 && u > 0) ? 'همه نامشخص'
                    : (u === 0 && (m > 0 || f > 0)) ? 'تفکیک‌شده'
                    : (m + f + u > 0) ? 'ترکیبی' : '—';
                  return (
                    <div
                      key={src.flockId}
                      onClick={() => setSelectedId(src.flockId)}
                      style={{
                        padding: '6px 10px',
                        background: isSelected ? 'var(--accent-soft)' : 'var(--input-bg)',
                        border: '1px solid ' + (isSelected ? 'var(--accent)' : 'var(--border)'),
                        borderRadius: 'var(--r-sm)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        fontSize: 'var(--fs-xs)',
                      }}
                    >
                      <input
                        type="radio"
                        name="unmerge-source"
                        checked={isSelected}
                        onChange={() => setSelectedId(src.flockId)}
                        onClick={(e) => e.stopPropagation()}
                        style={{ accentColor: 'var(--accent)', flexShrink: 0 }}
                      />
                      <span style={{ fontWeight: 700, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {src.flockName}
                      </span>
                      <span style={{ color: 'var(--muted)', flexShrink: 0 }}>
                        {fmtInt(src.count)} پرنده · {fmtInt(Math.round(src.ageDays || 0))} روز · {genderText}
                      </span>
                    </div>
                  );
                })}
              </div>

              {selectedSrc && (
                <div style={{
                  marginTop: 8,
                  padding: 'var(--pad-tight)',
                  background: 'var(--accent-soft)',
                  border: '1px solid var(--accent-border)',
                  borderRadius: 'var(--r-sm)',
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
