/**
 * FlockPickerSheet.tsx — انتخاب‌گر گله برای ثبت امروز
 * استاندارد: Batch-Centric + ExpandableCard (L10)
 */
import { useMemo, useState } from 'react';
import { Sheet, CardActions, Tag } from '../../../shr/components/ui';
import ExpandableCard from '../../../shr/components/ExpandableCard';
import { toFa } from '../../../shr/utils/fa';
import { useBrd } from '../../brd/store';
import { getAgeDays, type Flock } from '../../flk/store';
import type { DailyLog } from '../store';

const TYPE_LABEL: Record<string, { icon: string; label: string }> = {
  layer:   { icon: '🥚', label: 'تخم‌گذار' },
  broiler: { icon: '🍗', label: 'گوشتی' },
  breeder: { icon: '🧬', label: 'مادر' },
};

const ACCENT_MAP: Record<string, 'accent' | 'warn' | 'purple'> = {
  layer: 'accent', broiler: 'warn', breeder: 'purple',
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
        l.flockId === f.id && l.date === todayStr && (l.status || 'active') === 'active'
      );
      const deathsToday = existingLogs.reduce((a, l) => a + (l.deathsCount || 0), 0);
      const breed = f.breedKind === 'mixed' ? (f.breedLabel || 'مختلط') : (breeds.find(b => b.id === f.breedId)?.name || '');
      const age = getAgeDays(f);
      const alive = f.currentCount || 0;
      return { flock: f, existingLogs, deathsToday, breed, age, alive };
    });
  }, [flocks, logs, todayStr, breeds]);

  const pending = items.filter(s => s.existingLogs.length === 0).length;

  return (
    <Sheet open={open} onClose={onClose} title="ثبت امروز — انتخاب گله">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: '4px 0', maxHeight: '60vh', overflowY: 'auto' }}>
        <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--muted)', marginBottom: 8 }}>
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
            <ExpandableCard
              key={flock.id}
              accent={ACCENT_MAP[flock.type] || 'accent'}
              iconEmoji={typeInfo.icon}
              title={flock.name || '—'}
              subtitle={metaParts.join(' • ')}
              badge={
                hasLogs
                  ? <Tag tone="accent">✅ {toFa(existingLogs.length)} ثبت</Tag>
                  : <Tag tone="warn">⬜ ثبت نشده</Tag>
              }
              isOpen={isExpanded}
              onToggle={() => {
                if (!hasLogs) { onAdd(flock.id); onClose(); }
                else setExpandedFlockId(isExpanded ? null : flock.id);
              }}
            >
              <CardActions
                actions={[
                  ...existingLogs.map(log => ({
                    label: `✏️ ویرایش ${toFa(log.entryTime || '—')}`,
                    variant: 'outline' as const,
                    onClick: () => { onEdit(log); onClose(); },
                  })),
                  {
                    label: '➕ ثبت جدید',
                    variant: 'primary' as const,
                    onClick: () => { onAdd(flock.id); onClose(); },
                  },
                ]}
              />
            </ExpandableCard>
          );
        })}
      </div>
    </Sheet>
  );
}
