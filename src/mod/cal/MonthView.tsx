import { useState, useMemo } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths, parse } from 'date-fns-jalali';
import { eventsOfDay, TYPE_COLORS, type CalEvent, type EventType } from './store';
import { toFa } from '../../shr/utils/fa';

const MONTHS = ['فروردین','اردیبهشت','خرداد','تیر','مرداد','شهریور','مهر','آبان','آذر','دی','بهمن','اسفند'];
const WEEKDAYS = ['ش','ی','د','س','چ','پ','ج'];

interface Props {
  events: CalEvent[];
  onDayClick: (date: string) => void;
  filter: EventType | 'all';
}

export default function MonthView({ events, onDayClick, filter }: Props) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const todayStr = format(new Date(), 'yyyy/MM/dd');
  const year = parseInt(format(currentDate, 'yyyy'));
  const month = parseInt(format(currentDate, 'MM'));
  const monthName = MONTHS[month - 1] || '';

  // روزهای ماه
  const days = useMemo(() => {
    const start = startOfMonth(currentDate);
    const end = endOfMonth(currentDate);
    return eachDayOfInterval({ start, end });
  }, [currentDate]);

  // اولین ستون در گرید
  // date-fns-jalali getDay: 0=یکشنبه, 1=دوشنبه, ..., 6=شنبه
  // ما می‌خواهیم شنبه=0:
  const dowMap: Record<number, number> = { 6: 0, 0: 1, 1: 2, 2: 3, 3: 4, 4: 5, 5: 6 };
  const startCol = days.length > 0 ? dowMap[getDay(days[0])] : 0;

  // فیلتر رویدادها
  const filtered = useMemo(() => {
    if (filter === 'all') return events;
    return events.filter(e => e.type === filter);
  }, [events, filter]);

  // تعداد رویدادهای این ماه
  const monthKey = String(year) + '/' + String(month).padStart(2, '0');
  const monthEventsCount = filtered.filter(e => e.date.startsWith(monthKey)).length;

  const goPrev = () => setCurrentDate(subMonths(currentDate, 1));
  const goNext = () => setCurrentDate(addMonths(currentDate, 1));
  const goToday = () => setCurrentDate(new Date());

  return (
    <div style={{ padding: 'var(--sp-3)', display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>

      {/* هدر ماه */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        background: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--r-lg)',
        padding: 'var(--pad-normal)'
      }}>
        <button type="button" onClick={goPrev} style={navBtn}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="m9 18 6-6-6-6" />
          </svg>
        </button>

        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: 'var(--fs-lg)', fontWeight: 700, color: 'var(--accent)' }}>
            {monthName} {toFa(year)}
          </div>
          <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', marginTop: 2 }}>
            {toFa(monthEventsCount)} رویداد این ماه
          </div>
        </div>

        <button type="button" onClick={goNext} style={navBtn}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="m15 18-6-6 6-6" />
          </svg>
        </button>
      </div>

      {/* دکمه امروز */}
      <button
        type="button"
        onClick={goToday}
        style={{
          alignSelf: 'center',
          padding: '6px 16px',
          background: 'var(--accent-soft)',
          border: '1px solid var(--accent-border)',
          borderRadius: 8,
          color: 'var(--accent)',
          fontSize: 'var(--fs-sm)',
          fontWeight: 700,
          cursor: 'pointer',
          fontFamily: 'inherit'
        }}
      >
        📅 امروز ({toFa(format(new Date(), 'd MMMM'))})
      </button>

      {/* گرید */}
      <div style={{
        background: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--r-lg)',
        padding: '12px 8px'
      }}>
        {/* روزهای هفته */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 6 }}>
          {WEEKDAYS.map((w, i) => (
            <div key={i} style={{
              textAlign: 'center',
              fontSize: 'var(--fs-xs)',
              color: i === 6 ? 'var(--danger)' : 'var(--dim)',
              fontWeight: 700,
              padding: '4px 0'
            }}>{w}</div>
          ))}
        </div>

        {/* روزها */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
          {/* سلول‌های خالی */}
          {Array.from({ length: startCol }).map((_, i) => (
            <div key={'empty-' + i} style={{ aspectRatio: '1' }} />
          ))}

          {/* روزهای واقعی */}
          {days.map((day) => {
            const dayStr = format(day, 'yyyy/MM/dd');
            const dayNum = parseInt(format(day, 'd'));
            const isToday = dayStr === todayStr;
            const isFriday = getDay(day) === 5; // جمعه در تقویم شمسی
            const dayEvents = eventsOfDay(filtered, dayStr);
            const hasEvents = dayEvents.length > 0;

            return (
              <button
                key={dayStr}
                type="button"
                onClick={() => onDayClick(dayStr)}
                style={{
                  aspectRatio: '1',
                  background: isToday ? 'var(--accent)' : (hasEvents ? 'var(--input-bg)' : 'transparent'),
                  border: isToday ? '2px solid var(--accent)' : '1px solid ' + (hasEvents ? 'var(--border)' : 'transparent'),
                  borderRadius: 8,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  padding: 2,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 2,
                  position: 'relative'
                }}
              >
                <span style={{
                  fontSize: 'var(--fs-base)',
                  fontWeight: isToday ? 700 : (hasEvents ? 600 : 400),
                  color: isToday ? 'var(--avatar-text)' : (isFriday ? 'var(--danger)' : 'var(--text)'),
                  lineHeight: 1
                }}>
                  {toFa(dayNum)}
                </span>

                {/* نقاط رویداد */}
                {hasEvents ? (
                  <div style={{ display: 'flex', gap: 2, marginTop: 1 }}>
                    {dayEvents.slice(0, 3).map((e, idx) => {
                      const color = TYPE_COLORS[e.type]?.dot || 'var(--dim)';
                      return (
                        <span
                          key={idx}
                          style={{
                            width: 5,
                            height: 36,
                            borderRadius: '50%',
                            background: isToday ? 'var(--avatar-text)' : color
                          }}
                        />
                      );
                    })}
                  </div>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      {/* راهنمای رنگ */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 10,
        padding: 'var(--pad-normal)',
        background: 'var(--input-bg)',
        borderRadius: 'var(--r-md)',
        justifyContent: 'center'
      }}>
        {Object.entries(TYPE_COLORS).map(([type, c]) => (
          <div key={type} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 8, height: 36, borderRadius: '50%', background: c.dot }} />
            <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)' }}>
              {type === 'hatch' ? 'جوجه‌کشی' :
               type === 'vaccine' ? 'واکسن' :
               type === 'payment' ? 'مالی' :
               type === 'daily' ? 'روزانه' : 'سایر'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

const navBtn: React.CSSProperties = {
  width: 32,
  height: 32,
  borderRadius: 8,
  background: 'var(--btn-bg)',
  border: '1px solid var(--border)',
  color: 'var(--muted)',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 0,
  flexShrink: 0
};
