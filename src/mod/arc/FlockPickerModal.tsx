/**
 * FlockPickerModal.tsx — مودال انتخاب گله برای مقایسه و مرجع
 * (استخراج‌شده از FlockComparisonPanel.tsx — فاز رفکتور)
 */
import { useState, useMemo } from 'react';
import { Tag, Modal, Input, Empty } from '../../shr/components/ui';
import { IconSearch } from '../../shr/icons';
import { toFa } from '../../shr/utils/fa';
import { toastMsg } from '../../cor/store/toast';
import {
  type ComparisonCandidate,
  type CandidateFilter,
  type PickerMode,
  ARCHIVE_FILTER_THRESHOLD,
  MAX_FLOCKS,
  cleanCandidateTitle,
} from './comparisonHelpers';

interface Props {
  open: boolean;
  mode: PickerMode;
  candidates: ComparisonCandidate[];
  selectedIds: string[];
  effectiveBaselineId: string;
  activeFlockIds: Set<string>;
  onClose: () => void;
  onToggleFlock: (flockId: string) => void;
  onSetReference: (flockId: string) => void;
}

export default function FlockPickerModal({
  open,
  mode,
  candidates,
  selectedIds,
  effectiveBaselineId,
  activeFlockIds,
  onClose,
  onToggleFlock,
  onSetReference,
}: Props) {
  const [filter, setFilter] = useState<CandidateFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const getTitle = (c: ComparisonCandidate) => cleanCandidateTitle(c.label, c.metric.flockName);
  const getIsActive = (c: ComparisonCandidate) => activeFlockIds.has(c.id) || c.isActive;
  const getDays = (c: ComparisonCandidate) => c.metric.durationDays ?? c.metric.logCount;

  const showFilterControls = candidates.length > ARCHIVE_FILTER_THRESHOLD;

  const filteredCandidates = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return candidates.filter((c) => {
      const active = getIsActive(c);
      if (filter === 'active' && !active) return false;
      if (filter === 'archived' && active) return false;
      const title = getTitle(c).toLowerCase();
      if (
        q &&
        !title.includes(q) &&
        !c.label.toLowerCase().includes(q) &&
        !c.metric.flockName.toLowerCase().includes(q)
      ) {
        return false;
      }
      return true;
    });
  }, [candidates, filter, searchQuery, activeFlockIds]);

  const groupedCandidates = useMemo(() => {
    const map = new Map<string, ComparisonCandidate[]>();
    filteredCandidates.forEach((c) => {
      const date = c.metric.firstDate || c.metric.lastDate || '';
      const year = date.slice(0, 4) || 'نامشخص';
      if (!map.has(year)) map.set(year, []);
      map.get(year)!.push(c);
    });
    return Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0])); // نزولی
  }, [filteredCandidates]);

  const handleToggleInPicker = (targetId: string) => {
    if (targetId === effectiveBaselineId) {
      toastMsg.info('این گله هم‌اکنون مرجع است');
      return;
    }
    const isAlreadySelected = selectedIds.includes(targetId);
    if (!isAlreadySelected && selectedIds.length >= MAX_FLOCKS) {
      toastMsg.warn(`حداکثر ${toFa(MAX_FLOCKS)} گله در کل قابل مقایسه است`);
      return;
    }
    onToggleFlock(targetId);
  };

  const title = mode === 'baseline' ? 'انتخاب گله مرجع' : 'انتخاب گله‌های مقایسه';

  return (
    <Modal open={open} onClose={onClose} title={title}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {candidates.length > ARCHIVE_FILTER_THRESHOLD && (
          <div style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }}>
              <IconSearch size={16} />
            </div>
            <Input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="جستجوی نام گله..."
              mode="text"
              style={{ paddingRight: 32 }}
            />
          </div>
        )}

        {showFilterControls && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {(['all', 'active', 'archived'] as CandidateFilter[]).map((f) => {
              const active = filter === f;
              const count = f === 'all'
                ? candidates.length
                : f === 'active'
                  ? candidates.filter(getIsActive).length
                  : candidates.filter((c) => !getIsActive(c)).length;
              const label = f === 'all' ? 'همه' : f === 'active' ? 'فعال' : 'آرشیو';
              return (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFilter(f)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 'var(--r-sm)',
                    border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
                    background: active ? 'var(--accent-soft)' : 'var(--card-solid)',
                    color: active ? 'var(--accent)' : 'var(--muted)',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    fontSize: 'var(--fs-sm)',
                    fontWeight: active ? 700 : 600,
                  }}
                >
                  {label} ({toFa(count)})
                </button>
              );
            })}
          </div>
        )}

        {filteredCandidates.length === 0 ? (
          <Empty icon="🐔" title="گله‌ای یافت نشد" desc="فیلتر یا جستجو را تغییر دهید." />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {groupedCandidates.map(([year, items]) => (
              <div key={year} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ fontSize: 'var(--fs-xs)', fontWeight: 700, color: 'var(--muted)', borderBottom: '1px solid var(--border)', paddingBottom: 4, marginBottom: 2 }}>
                  سال {toFa(year)}
                </div>
                {items.map((c) => {
              const isRef = c.id === effectiveBaselineId;
              const isSelected = selectedIds.includes(c.id);
              const isActiveFlock = getIsActive(c);

              if (mode === 'baseline') {
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => onSetReference(c.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 8,
                      width: '100%',
                      padding: '10px',
                      background: isRef ? 'var(--accent-soft)' : 'var(--card-solid)',
                      border: `1px solid ${isRef ? 'var(--accent-border)' : 'var(--border)'}`,
                      borderRadius: 'var(--r-md)',
                      cursor: 'pointer',
                      textAlign: 'right',
                      fontFamily: 'inherit',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 'var(--fs-base)', color: 'var(--text)' }}>
                        {getTitle(c)}
                      </div>
                      <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', marginTop: 2 }}>
                        {isActiveFlock ? 'فعال' : 'آرشیو'} • {toFa(getDays(c))} روز
                      </div>
                    </div>
                    <Tag tone={isRef ? 'info' : isActiveFlock ? 'green' : 'gray'}>
                      {isRef ? 'مرجع' : isActiveFlock ? 'فعال' : 'آرشیو'}
                    </Tag>
                  </button>
                );
              }

              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => handleToggleInPicker(c.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 8,
                    width: '100%',
                    padding: '10px',
                    background: isSelected ? 'var(--accent-soft)' : 'var(--card-solid)',
                    border: `1px solid ${isSelected ? 'var(--accent-border)' : 'var(--border)'}`,
                    borderRadius: 'var(--r-md)',
                    cursor: 'pointer',
                    textAlign: 'right',
                    fontFamily: 'inherit',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 'var(--fs-base)', color: 'var(--text)' }}>
                      {getTitle(c)}
                    </div>
                    <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', marginTop: 2 }}>
                      {isActiveFlock ? 'فعال' : 'آرشیو'} • {toFa(getDays(c))} روز
                    </div>
                  </div>
                  <Tag tone={isRef ? 'info' : isSelected ? 'green' : 'gray'}>
                    {isRef ? 'مرجع' : isSelected ? 'انتخاب‌شده' : 'انتخاب'}
                  </Tag>
                </button>
              );
                })}
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}
