/**
 * UpcomingDealsSection.tsx — معاملات با سرسید نزدیک
 * الگوی آینه‌ای از UpcomingDueSection (بدون onDefer چون deals Defer ندارند)
 */
import { dueTone, dueLabel } from '../helpers';
import { computeDealBalance, type Deal } from '../store';
import { toFa } from '../../../shr/utils/fa';

interface Props {
  deals: Array<{ deal: Deal; days: number | null }>;
  contacts: Array<{ id: string; name?: string }>;
  showUpcoming: boolean;
  onToggle: () => void;
}

export default function UpcomingDealsSection({ deals, contacts, showUpcoming, onToggle }: Props) {
  if (deals.length === 0) return null;
  return (
    <div style={{ background: 'var(--card)', border: '1px solid var(--amber)', borderRadius: 'var(--r-md)', overflow: 'hidden' }}>
      <div
        role="button"
        tabIndex={0}
        onClick={onToggle}
        style={{ padding: 'var(--pad-normal)', display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', background: 'var(--warn-soft)' }}
      >
        <span style={{ fontSize: 'var(--fs-sm)', fontWeight: 700, color: 'var(--warn)' }}>
          ⏰ {toFa(deals.length)} سرسید معامله
        </span>
        <div style={{ flex: 1 }} />
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--warn)"
          strokeWidth="2.5"
          strokeLinecap="round"
          style={{ transform: showUpcoming ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform .2s' }}
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </div>
      <div style={{ display: 'grid', gridTemplateRows: showUpcoming ? '1fr' : '0fr', transition: 'grid-template-rows 250ms cubic-bezier(.16,1,.3,1)' }}>
        <div style={{ overflow: 'hidden' }}>
          <div style={{ padding: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
            {deals.map(({ deal, days }) => {
              const party = contacts.find(c => c.id === deal.partyId);
              const tone = dueTone(days);
              const bal = computeDealBalance(deal).balance;
              return (
                <div
                  key={deal.id}
                  style={{
                    padding: 'var(--pad-tight)',
                    background: `var(--${tone}-soft, var(--input-bg))`,
                    border: `1px solid var(--${tone})`,
                    borderRadius: 'var(--r-sm)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 'var(--fs-sm)', fontWeight: 600, color: `var(--${tone})` }}>
                      {party?.name || '—'}
                    </div>
                    <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', marginTop: 1 }}>
                      {dueLabel(days)}
                    </div>
                  </div>
                  <div style={{ fontSize: 'var(--fs-sm)', fontWeight: 700, color: `var(--${tone})`, flexShrink: 0 }}>
                    {toFa(Math.abs(bal).toLocaleString('fa-IR'))} تومان
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
