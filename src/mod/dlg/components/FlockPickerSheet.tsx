/**
 * FlockPickerSheet.tsx — انتخاب‌گر گله برای ثبت امروز
 * استاندارد: Batch-Centric — کاربر گله انتخاب می‌کند
 */
import { useMemo } from 'react';
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
  onSelect: (flock: Flock, existing: DailyLog | null) => void;
}

export default function FlockPickerSheet({ open, onClose, flocks, logs, todayStr, onSelect }: Props) {
  const { breeds } = useBrd();

  const items = useMemo(() => {
    return flocks.map(f => {
      const todayLogs = logs.filter(l =>
        l.flockId === f.id &&
        l.date === todayStr &&
        (l.status || 'active') === 'active'
      );
      const existing = todayLogs[0] || null;
      const deathsToday = todayLogs.reduce((a, l) => a + (l.deathsCount || 0), 0);
      const breed = f.breedKind === 'mixed'
        ? (f.breedLabel || 'مختلط')
        : (breeds.find(b => b.id === f.breedId)?.name || '');
      const age = getAgeDays(f);
      const alive = f.currentCount || 0;
      return { flock: f, existing, deathsToday, breed, age, alive };
    });
  }, [flocks, logs, todayStr, breeds]);

  const pending = items.filter(s => !s.existing).length;

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
        {items.map(({ flock, existing, deathsToday, breed, age, alive }) => {
          const typeInfo = TYPE_LABEL[flock.type] || { icon: '🐔', label: flock.type };
          const showBreed = !!breed && breed !== flock.name;
          const metaParts = [
            showBreed ? breed : null,
            `${typeInfo.icon} ${typeInfo.label}`,
            `${toFa(age)} روز`,
            `${toFa(alive)} زنده`,
            deathsToday > 0 ? `💀 ${toFa(deathsToday)}` : null,
          ].filter(Boolean) as string[];

          return (
            <button
              key={flock.id}
              type="button"
              onClick={() => { onSelect(flock, existing); onClose(); }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 4,
                padding: '8px 12px',
                background: 'var(--card)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--r-md)',
                fontFamily: 'inherit',
                fontSize: 'var(--fs-sm)',
                cursor: 'pointer',
                textAlign: 'right',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                <b style={{ color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0, flex: 1 }}>
                  {flock.name || '—'}
                </b>
                {existing ? (
                  <span style={{ padding: '2px 6px', borderRadius: 4, background: 'var(--accent-soft)', color: 'var(--accent)', fontSize: 'var(--fs-xs)', fontWeight: 700, flexShrink: 0 }}>
                    ✅ {existing.entryTime ? toFa(existing.entryTime) : 'ثبت شده'}
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
          );
        })}
      </div>
    </Sheet>
  );
}
