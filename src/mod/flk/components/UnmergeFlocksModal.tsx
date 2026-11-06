/**
 * UnmergeFlocksModal — بازگردانی گله از ادغام
 * سلسله‌مراتب:
 *   ۱. گله اصلی (🏠) — target
 *   ۲. منابع ادغام‌شده (📦) — با مرتب‌سازی در header
 *   ۳. پیش‌بینی (📊) — نتیجه
 */
import { useState, useMemo } from 'react';
import { Modal, Btn, BtnRow } from '../../../shr/components/ui';
import { toastMsg } from '../../../cor/store/toast';
import { showConfirmAsync } from '../../../cor/store/dialog';
import { toFa, formatNumWhileTyping } from '../../../shr/utils/fa';
import { useFlk, getAgeDays } from '../store';
import { format as formatJ } from 'date-fns-jalali';

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

function normalizeGender(item: SourceInfo): SourceInfo {
  const c = item.count || 0;
  const m = item.maleCount || 0;
  const f = item.femaleCount || 0;
  let u = item.unknownCount || 0;
  if (m + f + u !== c) {
    u = Math.max(0, c - m - f);
  }
  return { ...item, unknownCount: u };
}

const cell = (label: string, value: React.ReactNode) => (
  <div style={{
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: 'var(--fs-xs)',
    gap: 6,
    padding: '3px 0',
    borderBottom: '1px dashed var(--border)',
  }}>
    <span style={{ color: 'var(--muted)', flexShrink: 0 }}>{label}:</span>
    <span style={{ fontWeight: 600, color: 'var(--text)', textAlign: 'left', fontVariantNumeric: 'tabular-nums' }}>{value}</span>
  </div>
);

export default function UnmergeFlocksModal({ open, onClose, targetFlockId }: Props) {
  const allFlocks = useFlk(s => s.flocks);
  const unmergeFlocks = useFlk(s => s.unmergeFlocks);

  const target = allFlocks.find(f => f.id === targetFlockId);

  const targetItem: SourceInfo | null = useMemo(() => {
    if (!target) return null;
    return normalizeGender({
      flockId: target.id,
      flockName: target.name,
      count: (target as any).currentCount || 0,
      initialCount: (target as any).initialCount || 0,
      maleCount: (target as any).maleCount || 0,
      femaleCount: (target as any).femaleCount || 0,
      unknownCount: (target as any).unknownCount || 0,
      ageDays: getAgeDays(target),
      isTarget: true,
    });
  }, [target]);

  const sourceItems: SourceInfo[] = useMemo(() => {
    if (!target?.mergedInfo?.sources) return [];
    return (target.mergedInfo.sources as any[])
      .filter(s => s.flockId !== targetFlockId)
      .map(s => normalizeGender({
        ...s,
        count: s.count || 0,
        initialCount: s.initialCount !== undefined ? s.initialCount : (s.count || 0),
        maleCount: s.maleCount || 0,
        femaleCount: s.femaleCount || 0,
        unknownCount: s.unknownCount || 0,
        isTarget: false,
      }));
  }, [target, targetFlockId]);

  // مرتب‌سازی ثابت: بزرگ‌ترین تعداد اول
  const sortedSources = useMemo(() => {
    const arr = [...sourceItems];
    arr.sort((a, b) => (b.count || 0) - (a.count || 0));
    return arr;
  }, [sourceItems]);

  const [selectedId, setSelectedId] = useState<string>('');
  const effectiveSelectedId = sortedSources.some(s => s.flockId === selectedId)
    ? selectedId
    : (sortedSources[0]?.flockId || '');
  const selectedSrc = sortedSources.find(s => s.flockId === effectiveSelectedId);

  const prediction = useMemo(() => {
    if (!selectedSrc || !targetItem) return null;
    const srcCount = selectedSrc.count || 0;
    return {
      sourceAfter: srcCount,
      targetAfter: Math.max(0, (targetItem.count || 0) - srcCount),
      remainingSources: sourceItems.length - 1,
    };
  }, [selectedSrc, targetItem, sourceItems.length]);

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

  const mergeDate = (() => {
    if (!target?.mergedInfo?.mergedAt) return '';
    try {
      return formatJ(new Date(target.mergedInfo.mergedAt), 'yyyy/MM/dd');
    } catch {
      return target.mergedInfo.mergedAt.slice(0, 10);
    }
  })();

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="بازگردانی گله ادغام‌شده"
      size="lg"
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* ═══ بخش ۱: گله اصلی ═══ */}
          {targetItem && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                <span style={{ fontSize: 'var(--fs-base)', fontWeight: 700, color: 'var(--text)' }}>🏠 گله اصلی (فعلی)</span>
                <span style={{ fontSize: 'var(--fs-2xs)', color: 'var(--info, #0284c7)', background: 'var(--info-soft, rgba(2,132,199,.08))', padding: '1px 6px', borderRadius: 4, fontWeight: 600 }}>فعال</span>
              </div>
              <div style={{ padding: 'var(--pad-normal)', background: 'var(--input-bg)', borderRadius: 'var(--r-md)', border: '1px solid var(--border)' }}>
                <div style={{ fontWeight: 700, fontSize: 'var(--fs-sm)', marginBottom: 8 }}>{targetItem.flockName}</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', columnGap: 12 }}>
                  {cell('تعداد فعلی', `${fmtInt(targetItem.count)} پرنده`)}
                  {cell('سن فعلی', `${fmtInt(Math.round(targetItem.ageDays || 0))} روز`)}
                  {target?.mergedInfo?.avgAgeDays != null && cell('سن میانگین وزنی', `${fmtInt(Math.round(target.mergedInfo.avgAgeDays))} روز`)}
                  {cell('نر', fmtInt(targetItem.maleCount))}
                  {cell('ماده', fmtInt(targetItem.femaleCount))}
                  {cell('نامشخص', fmtInt(targetItem.unknownCount))}
                  {mergeDate && cell('تاریخ ادغام', toFa(mergeDate))}
                </div>
              </div>
            </div>
          )}

          {/* ═══ بخش ۲: منابع ═══ */}
          {sourceItems.length > 0 && (
            <div>
              <div style={{ display: 'flex', alignItems: 'flex-end', marginBottom: 8, paddingBottom: 6, borderBottom: '1px solid var(--border)' }}>
                <div>
                  <span style={{ fontSize: 'var(--fs-base)', fontWeight: 700, color: 'var(--text)' }}>📦 منابع ادغام‌شده</span>
                  <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', marginRight: 6 }}>({toFa(sourceItems.length)} گله — مرتب بر اساس تعداد)</span>
                </div>
              </div>

              <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--warn)', marginBottom: 8, padding: '4px 8px', background: 'var(--warn-soft)', borderRadius: 'var(--r-sm)', lineHeight: 1.7 }}>
                ℹ️ <b>{toFa(sourceItems.length)} گله</b> در این گله ادغام شده‌اند. برای بازگردانی، یکی را انتخاب کنید:
              </div>

              <div style={{ maxHeight: 280, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8, paddingRight: 2 }}>
                {sortedSources.map((src, idx) => {
                  const isSelected = src.flockId === effectiveSelectedId;
                  const c = src.count || 0;
                  const m = src.maleCount || 0;
                  const f = src.femaleCount || 0;
                  const u = src.unknownCount || 0;
                  const genderStatus = c === 0 ? '—'
                    : (m === 0 && f === 0 && u === c) ? 'همه نامشخص'
                    : (u === 0 && (m + f === c)) ? 'تفکیک‌شده'
                    : 'ترکیبی';
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
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        <input
                          type="radio"
                          name="unmerge-source"
                          checked={isSelected}
                          onChange={() => setSelectedId(src.flockId)}
                          onClick={(e) => e.stopPropagation()}
                          style={{ accentColor: 'var(--accent)', flexShrink: 0 }}
                        />
                        <span style={{ fontWeight: 700, fontSize: 'var(--fs-sm)', flex: 1 }}>{toFa(idx + 1)}. {src.flockName}</span>
                        <span style={{ fontSize: 'var(--fs-2xs)', color: 'var(--muted)', background: 'var(--bg)', border: '1px solid var(--border)', padding: '1px 6px', borderRadius: 4, fontWeight: 600 }}>قبل از ادغام</span>
                        {isSelected && <span style={{ fontSize: 'var(--fs-2xs)', color: 'var(--accent)', fontWeight: 700 }}>انتخاب‌شده</span>}
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', columnGap: 12 }}>
                        {cell('تعداد', `${fmtInt(src.count)} پرنده`)}
                        {cell('سن', `${fmtInt(Math.round(src.ageDays || 0))} روز`)}
                        {cell('اولیه', fmtInt(src.initialCount))}
                        {cell('نامشخص', fmtInt(src.unknownCount))}
                        {cell('نر', fmtInt(src.maleCount))}
                        {cell('ماده', fmtInt(src.femaleCount))}
                        <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', paddingTop: 4 }}>
                          <span style={{ fontSize: 'var(--fs-2xs)', color: 'var(--muted)', background: 'var(--bg)', border: '1px solid var(--border)', padding: '1px 6px', borderRadius: 4, fontWeight: 600 }}>{genderStatus}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ═══ بخش ۳: پیش‌بینی ═══ */}
          {prediction && (
            <div style={{ padding: 'var(--pad-normal)', background: 'var(--accent-soft)', border: '1px solid var(--accent-border)', borderRadius: 'var(--r-md)', fontSize: 'var(--fs-xs)' }}>
              <div style={{ fontWeight: 700, color: 'var(--accent)', marginBottom: 4 }}>📊 پیش‌بینی بازگردانی:</div>
              <div style={{ color: 'var(--text)', lineHeight: 1.7 }}>
                • <b>{selectedSrc?.flockName}</b> ← فعال با <b>{fmtInt(prediction.sourceAfter)}</b> پرنده
                <br />
                • <b>{targetItem?.flockName}</b> ← <b>{fmtInt(prediction.targetAfter)}</b> پرنده ({fmtInt(targetItem?.count)} − {fmtInt(prediction.sourceAfter)})
                {prediction.remainingSources > 0 && (
                  <><br /><span style={{ color: 'var(--muted)' }}>• {toFa(prediction.remainingSources)} منبع دیگر همچنان در گله اصلی باقی می‌ماند</span></>
                )}
              </div>
            </div>
          )}

        </div>
      )}
    </Modal>
  );
}
