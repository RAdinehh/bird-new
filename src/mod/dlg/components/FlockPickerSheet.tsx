/**
 * FlockPickerSheet.tsx — انتخاب‌گر گله برای ثبت امروز
 * استاندارد: Batch-Centric — کاربر گله انتخاب می‌کنه
 */
import { useMemo } from 'react';
import { Sheet } from '../../../shr/components/ui';
import { toFa } from '../../../shr/utils/fa';
import type { Flock } from '../../flk/store';
import type { DailyLog } from '../store';

interface Props {
  open: boolean;
  onClose: () => void;
  flocks: Flock[];
  logs: DailyLog[];
  todayStr: string;
  onSelect: (flock: Flock, existing: DailyLog | null) => void;
}

export default function FlockPickerSheet({ open, onClose, flocks, logs, todayStr, onSelect }: Props) {
  const status = useMemo(() => {
    return flocks.map(f => {
      const existing = logs.find(l =>
        l.flockId === f.id &&
        l.date === todayStr &&
        (l.status || 'active') === 'active'
      );
      return { flock: f, existing: existing || null };
    });
  }, [flocks, logs, todayStr]);

  const pending = status.filter(s => !s.existing).length;

  return (
    <Sheet open={open} onClose={onClose} title="ثبت امروز — انتخاب گله">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '4px 0' }}>
        <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--muted)', marginBottom: 4 }}>
          {toFa(pending)} گله از {toFa(flocks.length)} منتظر ثبت
        </div>
        {status.length === 0 && (
          <div style={{ padding: 24, textAlign: 'center', color: 'var(--muted)' }}>
            هیچ گله فعالی نداری
          </div>
        )}
        {status.map(({ flock, existing }) => (
          <button
            key={flock.id}
            type="button"
            onClick={() => { onSelect(flock, existing); onClose(); }}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '12px 14px',
              background: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--r-md)',
              fontFamily: 'inherit',
              fontSize: 'var(--fs-sm)',
              cursor: 'pointer',
              textAlign: 'right',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0, flex: 1 }}>
              <b style={{ color: 'var(--text)' }}>{flock.name || '—'}</b>
              <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)' }}>
                {toFa(flock.currentCount || 0)} پرنده
              </span>
            </div>
            {existing ? (
              <span style={{ padding: '3px 8px', borderRadius: 4, background: 'var(--accent-soft)', color: 'var(--accent)', fontSize: 'var(--fs-xs)', fontWeight: 700 }}>
                ✅ ثبت شده{existing.entryTime ? ' ' + toFa(existing.entryTime) : ''}
              </span>
            ) : (
              <span style={{ padding: '3px 8px', borderRadius: 4, background: 'var(--warn-soft)', color: 'var(--warn)', fontSize: 'var(--fs-xs)', fontWeight: 700 }}>
                ⬜ ثبت نشده
              </span>
            )}
          </button>
        ))}
      </div>
    </Sheet>
  );
}
