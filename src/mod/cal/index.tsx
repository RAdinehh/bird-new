import { useState, useMemo } from 'react';
import { collectEvents, type EventType, type CalEvent } from './store';
import MonthView from './MonthView';
import DayView from './DayView';
import AddEventModal from './AddEventModal';
import { toFa } from '../../shr/utils/fa';

const FILTERS: { id: EventType | 'all'; label: string; icon: string }[] = [
  { id: 'all', label: 'همه', icon: '📋' },
  { id: 'hatch', label: 'جوجه‌کشی', icon: '🐣' },
  { id: 'vaccine', label: 'واکسن', icon: '💉' },
  { id: 'payment', label: 'مالی', icon: '💰' },
  { id: 'daily', label: 'روزانه', icon: '📋' }
];

export default function Cal() {
  const [filter, setFilter] = useState<EventType | 'all'>('all');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // جمع‌آوری رویدادها — هر بار با refreshKey از نو
  const events = useMemo<CalEvent[]>(() => {
    try {
      return collectEvents();
    } catch {
      return [];
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

  const handleAddClose = () => {
    setAddOpen(false);
    setRefreshKey(k => k + 1);
  };

  // اگر روز انتخاب شد، DayView نشان بده
  if (selectedDate) {
    return (
      <>
        <DayView
          date={selectedDate}
          events={events}
          onBack={() => setSelectedDate(null)}
          onChanged={() => setRefreshKey(k => k + 1)}
        />
        <button
          type="button"
          onClick={() => setAddOpen(true)}
          style={fabStyle}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </button>
        <AddEventModal
          open={addOpen}
          onClose={handleAddClose}
          prefillDate={selectedDate}
        />
      </>
    );
  }

  // شمارش هر نوع برای فیلتر
  const counts: Record<string, number> = { all: events.length };
  events.forEach(e => {
    counts[e.type] = (counts[e.type] || 0) + 1;
  });

  return (
    <div>
      {/* فیلترها */}
      <div style={{
        display: 'flex',
        gap: 6,
        padding: '12px',
        overflowX: 'auto',
        scrollbarWidth: 'none',
        background: 'var(--header-bg)',
        borderBottom: '1px solid var(--border)',
        position: 'sticky',
        top: 52,
        zIndex: 11
      }}>
        {FILTERS.map(f => {
          const count = counts[f.id] || 0;
          const active = filter === f.id;
          return (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              style={{
                padding: '7px 12px',
                fontSize: 'var(--fs-sm)',
                background: active ? 'var(--accent-soft)' : 'var(--btn-bg)',
                border: '1px solid ' + (active ? 'var(--accent-border)' : 'var(--border)'),
                borderRadius: 8,
                color: active ? 'var(--accent)' : 'var(--muted)',
                fontWeight: active ? 700 : 500,
                cursor: 'pointer',
                fontFamily: 'inherit',
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                whiteSpace: 'nowrap'
              }}
            >
              <span>{f.icon}</span>
              <span>{f.label}</span>
              {count > 0 ? (
                <span style={{
                  fontSize: 10,
                  background: active ? 'var(--accent)' : 'var(--input-bg)',
                  color: active ? 'var(--avatar-text)' : 'var(--dim)',
                  padding: '1px 5px',
                  borderRadius: 6,
                  fontWeight: 700,
                  minWidth: 16,
                  textAlign: 'center'
                }}>{toFa(count)}</span>
              ) : null}
            </button>
          );
        })}
      </div>

      {/* نمای ماه */}
      <MonthView
        events={events}
        onDayClick={(d) => setSelectedDate(d)}
        filter={filter}
      />

      {/* FAB */}
      <button
        type="button"
        onClick={() => setAddOpen(true)}
        style={fabStyle}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <path d="M12 5v14M5 12h14" />
        </svg>
      </button>

      <AddEventModal
        open={addOpen}
        onClose={handleAddClose}
      />
    </div>
  );
}

const fabStyle: React.CSSProperties = {
  position: 'fixed',
  bottom: 90,
  left: 16,
  width: 52,
  height: 52,
  borderRadius: 16,
  background: 'var(--accent)',
  color: 'var(--avatar-text)',
  border: 'none',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  boxShadow: 'var(--shadow)',
  zIndex: 30
};
