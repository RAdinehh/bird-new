/**
 * helpers.tsx — ماژول cal
 */
import { TYPE_COLORS, TYPE_LABELS, type CalEvent } from './store';
import {
  IconEgg, IconLock, IconSyringe, IconClock, IconDollar,
  IconBank, IconNote, IconPin, IconLeaf, IconBell, IconTag, IconCalendar,
} from '../../shr/icons';

export function CalEventIcon({ name, size = 20 }: { name?: string; size?: number }) {
  switch (name) {
    case 'egg': return <IconEgg size={size} />;
    case 'lock': return <IconLock size={size} />;
    case 'syringe': return <IconSyringe size={size} />;
    case 'clock': return <IconClock size={size} />;
    case 'dollar': return <IconDollar size={size} />;
    case 'bank': return <IconBank size={size} />;
    case 'note': return <IconNote size={size} />;
    case 'pin': return <IconPin size={size} />;
    case 'leaf': return <IconLeaf size={size} />;
    case 'bell': return <IconBell size={size} />;
    default: return <IconCalendar size={size} />;
  }
}

export function AutoEventCard({ event }: { event: CalEvent }) {
  const colors = TYPE_COLORS[event.type];

  return (
    <div style={{
      background: 'var(--card)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--r-lg)',
      padding: 'var(--pad-comfy)',
      display: 'flex',
      gap: 12,
      alignItems: 'flex-start',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <div style={{
        position: 'absolute', top: 0, right: 0, bottom: 0, width: 4,
        background: colors.dot
      }} />

      <div style={{
        width: 40, height: 40,
        borderRadius: 'var(--r-md)',
        background: colors.bg,
        color: colors.text,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0
      }}>
        <CalEventIcon name={event.icon} size={20} />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 'var(--fs-base)', fontWeight: 700, marginBottom: 4,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
        }}>
          {event.title}
        </div>
        <div style={{
          fontSize: 'var(--fs-xs)', color: 'var(--muted)',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
        }}>
          {event.subtitle}
        </div>
        <div style={{
          fontSize: 'var(--fs-xs)', color: 'var(--dim)', marginTop: 4,
          display: 'flex', gap: 8
        }}>
          <span style={{ color: colors.text, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            <IconTag size={12} /> {TYPE_LABELS[event.type]}
          </span>
        </div>
      </div>
    </div>
  );
}
