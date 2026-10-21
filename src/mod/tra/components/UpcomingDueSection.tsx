import { dueTone, dueLabel } from '../helpers';
import { remaining, type Invoice } from '../store';
import { toFa } from '../../../shr/utils/fa';

interface Props {
  upcoming: Array<{ inv: Invoice; days: number | null }>;
  contacts: Array<{ id: string; name?: string }>;
  showUpcoming: boolean;
  onToggle: () => void;
  onDefer: (inv: Invoice) => void;
}

export default function UpcomingDueSection({ upcoming, contacts, showUpcoming, onToggle, onDefer }: Props) {
  if (upcoming.length === 0) return null;
  return (
    <div style={{ background: 'var(--card)', border: '1px solid var(--amber)', borderRadius: 'var(--r-md)', overflow: 'hidden' }}>
      <div role="button" tabIndex={0} onClick={onToggle} style={{ padding: 'var(--pad-normal)', display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', background: 'var(--warn-soft)' }}>
        <span style={{ fontSize: 'var(--fs-sm)', fontWeight: 700, color: 'var(--warn)' }}>⏰ {toFa(upcoming.length)} سرسید نزدیک</span>
        <div style={{ flex: 1 }} />
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--warn)" strokeWidth="2.5" strokeLinecap="round" style={{ transform: showUpcoming ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform .2s' }}>
          <path d="m6 9 6 6 6-6" />
        </svg>
      </div>
      <div style={{ display: 'grid', gridTemplateRows: showUpcoming ? '1fr' : '0fr', transition: 'grid-template-rows 250ms cubic-bezier(.16,1,.3,1)' }}>
        <div style={{ overflow: 'hidden' }}>
          <div style={{ padding: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
            {upcoming.map(({ inv, days }) => {
              const party = contacts.find(c => c.id === inv.partyId);
              const tone = dueTone(days);
              return (
                <div key={inv.id} style={{ padding: 'var(--pad-tight)', background: `var(--${tone}-soft, var(--input-bg))`, border: `1px solid var(--${tone})`, borderRadius: 'var(--r-sm)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 'var(--fs-sm)', fontWeight: 600, color: `var(--${tone})` }}>{party?.name || '—'}</div>
                    <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', marginTop: 1 }}>{dueLabel(days)}</div>
                  </div>
                  <div style={{ fontSize: 'var(--fs-sm)', fontWeight: 700, color: `var(--${tone})`, flexShrink: 0 }}>{toFa(remaining(inv).toLocaleString('fa-IR'))} ت</div>
                  <button type="button" onClick={() => onDefer(inv)} style={{ padding: '3px 8px', background: 'transparent', border: `1px solid var(--${tone})`, borderRadius: 'var(--r-sm)', color: `var(--${tone})`, fontSize: 'var(--fs-xs)', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 }}>⏰</button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
