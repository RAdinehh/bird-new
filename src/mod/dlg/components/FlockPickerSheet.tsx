/**
 * FlockPickerSheet.tsx — انتخاب‌گر گله برای ثبت امروز
 * استاندارد: Batch-Centric + چند لاگ در روز (expandable)
 */
import { useMemo, useState } from 'react';
import { Sheet } from '../../../shr/components/ui';
import { toFa } from '../../../shr/utils/fa';
import { useBrd } from '../../brd/store';
import { getAgeDays, type Flock } from '../../flk/store';
import type { DailyLog } from '../store';

const TYPE_LABEL: Record<string, { icon: string; label: string }> = {
  layer:   { icon: '🥚', label: 'تخم‌گذار' },
  broiler: { icon: '🍗', label: 'گوشتی' },
  breeder: { icon: '🧬', label: 'مادر' },
};

interface Props {
  open: boolean;
  onClose: () => void;
  flocks: Flock[];
  logs: DailyLog[];
  todayStr: string;
  onEdit: (log: DailyLog) => void;
  onAdd: (flockId: string) => void;
}

export default function FlockPickerSheet({ open, onClose, flocks, logs, todayStr, onEdit, onAdd }: Props) {
  const { breeds } = useBrd();
  const [expandedFlockId, setExpandedFlockId] = useState<string | null>(null);

  const items = useMemo(() => {
    return flocks.map(f => {
      const existingLogs = logs.filter(l =>
        l.flockId === f.id &&
        l.date === todayStr &&
        (l.status || 'active') === 'active'
      );
      const deathsToday = existingLogs.reduce((a, l) => a + (l.deathsCount || 0), 0);
      const breed = f.breedKind === 'mixed'
        ? (f.breedLabel || 'مختلط')
        : (breeds.find(b => b.id === f.breedId)?.name || '');
      const age = getAgeDays(f);
      const alive = f.currentCount || 0;
      return { flock: f, existingLogs, deathsToday, breed, age, alive };
    });
  }, [flocks, logs, todayStr, breeds]);

  const pending = items.filter(s => s.existingLogs.length === 0).length;

  return (
    <Sheet open={open} onClose={onClose} title="ثبت امروز — انتخاب گله">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: '4px 0', maxHeight: '60vh', overflowY: 'auto' }}>
        <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--muted)', marginBottom: 4 }}>
          {toFa(pending)} گله از {toFa(flocks.length)} منتظر ثبت
        </div>
        {items.length === 0 && (
          <div style={{ padding: 24, textAlign: 'center', color: 'var(--muted)' }}>
            هیچ گله فعالی نداری
          </div>
        )}
        {items.map(({ flock, existingLogs, deathsToday, breed, age, alive }) => {
          const typeInfo = TYPE_LABEL[flock.type] || { icon: '🐔', label: flock.type };
          const showBreed = !!breed && breed !== flock.name;
          const hasLogs = existingLogs.length > 0;
          const isExpanded = expandedFlockId === flock.id;
          const metaParts = [
            showBreed ? breed : null,
            `${typeInfo.icon} ${typeInfo.label}`,
            `${toFa(age)} روز`,
            `${toFa(alive)} زنده`,
            deathsToday > 0 ? `💀 ${toFa(deathsToday)}` : null,
          ].filter(Boolean) as string[];

          return (
            <div key={flock.id}>
              <button
                type="button"
                onClick={() => {
                  if (!hasLogs) { onAdd(flock.id); onClose(); }
                  else setExpandedFlockId(isExpanded ? null : flock.id);
                }}
                style={{
                  display: 'flex', flexDirection: 'column', gap: 4,
                  padding: '8px 12px', background: 'var(--card)',
                  border: '1px solid var(--border)', borderRadius: 'var(--r-md)',
                  fontFamily: 'inherit', fontSize: 'var(--fs-sm)',
                  cursor: 'pointer', textAlign: 'right', width: '100%',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                  <b style={{ color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0, flex: 1 }}>
                    {flock.name || '—'}
                  </b>
                  {hasLogs ? (
                    <span style={{ padding: '2px 6px', borderRadius: 4, background: 'var(--accent-soft)', color: 'var(--accent)', fontSize: 'var(--fs-xs)', fontWeight: 700, flexShrink: 0 }}>
                      ✅ {toFa(existingLogs.length)} ثبت: {existingLogs.map(l => toFa(l.entryTime || '—')).join('، ')}
                    </span>
                  ) : (
                    <span style={{ padding: '2px 6px', borderRadius: 4, background: 'var(--warn-soft)', color: 'var(--warn)', fontSize: 'var(--fs-xs)', fontWeight: 700, flexShrink: 0 }}>
                      ⬜ ثبت نشده
                    </span>
                  )}
                </div>
                {metaParts.length > 0 && (
                  <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', wordBreak: 'break-word' }}>
                    {metaParts.join(' • ')}
                  </div>
                )}
              </button>
              {isExpanded && hasLogs && (
                <div style={{ padding: '6px 12px', background: 'var(--input-bg)', borderRadius: 'var(--r-md)', marginTop: 2, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {existingLogs.map(log => (
                    <button
                      key={log.id}
                      type="button"
                      onClick={() => { onEdit(log); onClose(); }}
                      style={{
                        padding: '8px 12px', background: 'var(--card)',
                        border: '1px solid var(--border)', borderRadius: 'var(--r-sm)',
                        fontFamily: 'inherit', fontSize: 'var(--fs-sm)',
                        cursor: 'pointer', textAlign: 'right',
                      }}
                    >
                      ✏️ ویرایش ثبت {toFa(log.entryTime || '—')}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => { onAdd(flock.id); onClose(); }}
                    style={{
                      padding: '8px 12px', background: 'var(--accent)',
                      color: '#fff', border: 'none', borderRadius: 'var(--r-sm)',
                      fontFamily: 'inherit', fontSize: 'var(--fs-sm)',
                      fontWeight: 600, cursor: 'pointer',
                    }}
                  >
                    ➕ ثبت جدید برای همین گله
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Sheet>
  );
}
