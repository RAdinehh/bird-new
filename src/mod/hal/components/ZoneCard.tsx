/**
 * ZoneCard — کارت بخش (استخراج‌شده از ZonesPage طبق FOUNDATION ۳.۳)
 */
import ExpandableCard from '../../../shr/components/ExpandableCard';
import EntityLink from '../../../shr/components/EntityLink';
import { Btn, Tag } from '../../../shr/components/ui';
import { Row, RowGrid } from '../helpers';
import { toFa } from '../../../shr/utils/fa';
import type { Zone, Hall } from '../store';
import type { Flock } from '../../flk/store';
import type { MultiSelectState } from '../../../shr/multiSelect/useMultiSelect';

interface Props {
  zone: Zone;
  index: number;
  hall?: Hall;
  flocks: Flock[];
  isOpen: boolean;
  onToggle: () => void;
  ms: MultiSelectState<Zone>;
  onEdit: () => void;
  onDelete: () => void;
}

export default function ZoneCard({
  zone: z, index, hall, flocks, isOpen, onToggle, ms, onEdit, onDelete,
}: Props) {
  return (
    <ExpandableCard
      id={z.id}
      ms={ms}
      accent="purple"
      index={toFa(index + 1)}
      iconEmoji="🗂"
      title={z.name}
      subtitle=""
      isOpen={isOpen}
      onToggle={onToggle}
      badge={z.capacity ? <Tag tone="purple">{toFa(z.capacity)} پرنده</Tag> : undefined}
      stats={<>
        <span>🏠 سالن: {hall ? <b><EntityLink type="hall" id={hall.id} label={hall.name} /></b> : <b style={{ color: 'var(--text)' }}>—</b>}</span>
        {z.capacity && <span>ظرفیت: <b style={{ color: 'var(--text)' }}>{toFa(z.capacity)}</b></span>}
      </>}
    >
      <div style={{ fontSize: 'var(--fs-base)', color: 'var(--text)', fontWeight: 700, letterSpacing: '.3px' }}>🗂 مشخصات بخش</div>
      <RowGrid>
        <Row l="سالن" v={hall ? <EntityLink type="hall" id={hall.id} label={hall.name} /> : '—'} />
        <Row l="ظرفیت" v={z.capacity ? `${toFa(z.capacity)} پرنده` : '—'} />
      </RowGrid>
      {flocks.length > 0 && (
        <>
          <div style={{ fontSize: 'var(--fs-base)', color: 'var(--text)', fontWeight: 700, letterSpacing: '.3px' }}>🐔 گله‌های این بخش ({toFa(flocks.length)})</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-1)' }}>
            {flocks.map((fl) => (
              <div key={fl.id} style={{ display: 'flex', justifyContent: 'space-between',
                 fontSize: 'var(--fs-sm)', padding: 'var(--pad-tight)', background: 'var(--input-bg)',
                 borderRadius: 'var(--r-sm)' }}>
                <span style={{ fontWeight: 600 }}>
                  <EntityLink type="flock" id={fl.id} label={fl.name} />
                </span>
                <span style={{ color: 'var(--muted)' }}>{toFa(fl.currentCount || fl.initialCount || 0)} پرنده</span>
              </div>
            ))}
          </div>
        </>
      )}
      {z.notes && (
        <>
          <div style={{ fontSize: 'var(--fs-base)', color: 'var(--text)', fontWeight: 700, letterSpacing: '.3px' }}>📝 یادداشت</div>
          <div style={{ fontSize: 'var(--fs-sm)', lineHeight: 1.7,
             padding: 'var(--pad-normal)', background: 'var(--input-bg)',
             borderRadius: 'var(--r-sm)' }}>{z.notes}</div>
        </>
      )}
      <div style={{ display: 'flex', gap: 'var(--sp-2)', paddingTop: 'var(--sp-1)' }}>
        <Btn size="sm" onClick={onEdit} style={{ flex: 1 }}>ویرایش</Btn>
        <Btn size="sm" onClick={onDelete} style={{ flex: 1 }}>حذف</Btn>
      </div>
    </ExpandableCard>
  );
}
