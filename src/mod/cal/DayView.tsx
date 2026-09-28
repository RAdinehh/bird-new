import { eventsOfDay, TYPE_COLORS, TYPE_LABELS, statusOf, type CalEvent } from './store';
import { useManual } from './manual';
import ManualEventCard from './ManualEventCard';
import { toFa } from '../../shr/utils/fa';

interface Props {
  date: string;
  events: CalEvent[];
  onBack: () => void;
  onChanged?: () => void;
}

export default function DayView({ date, events, onBack, onChanged }: Props) {
  const manualAll = useManual(s => s.events);
  const manualDay = manualAll.filter(e => e.date === date);
  const autoEvents = eventsOfDay(events, date).filter(e => !e.id.startsWith('manual-'));

  const parts = date.split('/');
  const monthNames = ['فروردین','اردیبهشت','خرداد','تیر','مرداد','شهریور','مهر','آبان','آذر','دی','بهمن','اسفند'];
  const monthName = monthNames[parseInt(parts[1]) - 1] || '';

  const totalCount = manualDay.length + autoEvents.length;

  return (
    <div style={{ padding: 'var(--sp-3)', display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>
      {/* هدر */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        background: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--r-lg)',
        padding: '12px 14px'
      }}>
        <button type="button" onClick={onBack} style={{
          width: 34, height: 34, borderRadius: 10,
          background: 'var(--btn-bg)', border: '1px solid var(--border)',
          color: 'var(--muted)', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 0, flexShrink: 0
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="m9 18 6-6-6-6" />
          </svg>
        </button>

        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 'var(--fs-lg)', fontWeight: 700 }}>
            {toFa(parts[2])} {monthName} {toFa(parts[0])}
          </div>
          <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', marginTop: 2 }}>
            {toFa(totalCount)} رویداد
          </div>
        </div>
      </div>

      {/* رویدادهای دستی (اول — چون قابل ویرایش هستند) */}
      {manualDay.length > 0 ? (
        <div>
          <div style={{
            fontSize: 'var(--fs-xs)', fontWeight: 700, color: 'var(--muted)',
            padding: '4px 4px 8px', display: 'flex', alignItems: 'center', gap: 6
          }}>
            <span>📌 رویدادهای شما</span>
            <span style={{ color: 'var(--dim)' }}>({toFa(manualDay.length)})</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {manualDay.map(m => (
              <ManualEventCard key={m.id} event={m} onChanged={onChanged || (() => {})} />
            ))}
          </div>
        </div>
      ) : null}

      {/* رویدادهای خودکار */}
      {autoEvents.length > 0 ? (
        <div>
          <div style={{
            fontSize: 'var(--fs-xs)', fontWeight: 700, color: 'var(--muted)',
            padding: '4px 4px 8px', display: 'flex', alignItems: 'center', gap: 6
          }}>
            <span>🔔 رویدادهای سیستم</span>
            <span style={{ color: 'var(--dim)' }}>({toFa(autoEvents.length)})</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {autoEvents.map(e => (
              <AutoEventCard key={e.id} event={e} />
            ))}
          </div>
        </div>
      ) : null}

      {/* خالی */}
      {totalCount === 0 ? (
        <div style={{
          padding: '40px 20px', textAlign: 'center',
          background: 'var(--card)', border: '1px solid var(--border)',
          borderRadius: 'var(--r-lg)'
        }}>
          <div style={{ fontSize: 44, marginBottom: 12 }}>📭</div>
          <div style={{ fontSize: 'var(--fs-base)', fontWeight: 700, marginBottom: 6 }}>
            رویدادی در این روز نیست
          </div>
          <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)' }}>
            برای افزودن رویداد، از دکمه‌ی + استفاده کنید
          </div>
        </div>
      ) : null}
    </div>
  );
}

/** کارت رویدادهای سیستمی (بدون ویرایش) */
function AutoEventCard({ event }: { event: CalEvent }) {
  const colors = TYPE_COLORS[event.type];

  return (
    <div style={{
      background: 'var(--card)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--r-lg)',
      padding: '12px 14px',
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
        fontSize: 18, flexShrink: 0
      }}>
        {event.icon}
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
          <span style={{ color: colors.text }}>🏷 {TYPE_LABELS[event.type]}</span>
        </div>
      </div>
    </div>
  );
}
