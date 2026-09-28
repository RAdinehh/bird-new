import { useState } from 'react';
import { format, parse, addMonths, subMonths, getDate, setDate, setMonth, setYear, getYear, getMonth, startOfMonth, endOfMonth } from 'date-fns-jalali';
import { Btn, Modal } from './ui';
import { toFa } from '../utils/fa';

const MONTHS = ['فروردین','اردیبهشت','خرداد','تیر','مرداد','شهریور','مهر','آبان','آذر','دی','بهمن','اسفند'];
const WEEKDAYS = ['ش','ی','د','س','چ','پ','ج'];

interface Props {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}

export default function DatePicker({ value, onChange, placeholder = 'انتخاب تاریخ' }: Props) {
  const [open, setOpen] = useState(false);
  const today = new Date();
  const todayStr = format(today, 'yyyy/MM/dd');

  const [cursor, setCursor] = useState<Date>(() => {
    if (value) {
      try {
        const p = parse(value.replace(/[۰-۹]/g, d => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d))), 'yyyy/MM/dd', new Date());
        if (!isNaN(p.getTime())) return p;
      } catch {}
    }
    return today;
  });

  const year = getYear(cursor);
  const month = getMonth(cursor);
  const monthStart = startOfMonth(cursor);
  const monthEnd = endOfMonth(cursor);
  const daysInMonth = getDate(monthEnd);
  const firstCol = (monthStart.getDay() + 1) % 7;

  const years = Array.from({ length: 31 }, (_, i) => 1390 + i);

  const handleSelect = (day: number) => {
    const d = setDate(cursor, day);
    onChange(format(d, 'yyyy/MM/dd'));
    setOpen(false);
  };

  const displayValue = value ? toFa(value.replace(/[۰-۹]/g, d => d)) : placeholder;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        style={{
          width: '100%', height: 38,
          background: 'var(--input-bg)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--r-md)', padding: '0 12px',
          color: value ? 'var(--text)' : 'var(--dim)',
          fontFamily: 'inherit', fontSize: 'var(--fs-base)',
          cursor: 'pointer', textAlign: 'right',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: 8, minWidth: 0
        }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {value ? toFa(value) : placeholder}
        </span>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, color: 'var(--dim)' }}>
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <path d="M16 2v4M8 2v4M3 10h18" />
        </svg>
      </button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="انتخاب تاریخ"
        footer={
          <div style={{ display: 'flex', flexDirection: 'row-reverse', gap: 8 }}>
            <Btn variant="primary" onClick={() => { onChange(todayStr); setOpen(false); }}>امروز</Btn>
            <Btn onClick={() => { onChange(''); setOpen(false); }}>پاک کردن</Btn>
            <Btn onClick={() => setOpen(false)}>لغو</Btn>
          </div>
        }
      >
        {/* فیلد انتخاب‌شده */}
        <div style={{
          padding: '8px 12px',
          background: 'var(--accent-soft)',
          border: '1px solid var(--accent-border)',
          borderRadius: 'var(--r-md)',
          fontSize: 'var(--fs-base)', color: 'var(--accent)',
          fontWeight: 700, textAlign: 'center'
        }}>
          {value ? toFa(value) : 'تاریخی انتخاب نشده'}
        </div>

        {/* سال و ماه */}
        <div style={{ display: 'flex', gap: 8 }}>
          <select
            value={String(year)}
            onChange={e => setCursor(setYear(cursor, +e.target.value))}
            style={{
              flex: 1, height: 36, background: 'var(--input-bg)',
              border: '1px solid var(--border)', borderRadius: 'var(--r-md)',
              padding: '0 10px', color: 'var(--text)',
              fontFamily: 'inherit', fontSize: 'var(--fs-base)', fontWeight: 600
            }}
          >
            {years.map(y => <option key={y} value={y}>{toFa(y)}</option>)}
          </select>
          <select
            value={String(month)}
            onChange={e => setCursor(setMonth(cursor, +e.target.value))}
            style={{
              flex: 1, height: 36, background: 'var(--input-bg)',
              border: '1px solid var(--border)', borderRadius: 'var(--r-md)',
              padding: '0 10px', color: 'var(--text)',
              fontFamily: 'inherit', fontSize: 'var(--fs-base)', fontWeight: 600
            }}
          >
            {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
          </select>
        </div>

        {/* ناوبری ماه */}
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
          <button
            onClick={() => setCursor(subMonths(cursor, 1))}
            style={{
              flex: 1, height: 34, background: 'var(--btn-bg)',
              border: '1px solid var(--border)', borderRadius: 'var(--r-md)',
              color: 'var(--muted)', fontFamily: 'inherit', fontSize: 'var(--fs-sm)',
              cursor: 'pointer', fontWeight: 600
            }}
          >‹ ماه قبل</button>
          <button
            onClick={() => setCursor(addMonths(cursor, 1))}
            style={{
              flex: 1, height: 34, background: 'var(--btn-bg)',
              border: '1px solid var(--border)', borderRadius: 'var(--r-md)',
              color: 'var(--muted)', fontFamily: 'inherit', fontSize: 'var(--fs-sm)',
              cursor: 'pointer', fontWeight: 600
            }}
          >ماه بعد ›</button>
        </div>

        {/* روزهای هفته */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
          {WEEKDAYS.map((w, i) => (
            <div key={i} style={{
              textAlign: 'center', fontSize: 'var(--fs-xs)',
              color: i === 6 ? 'var(--danger)' : 'var(--dim)',
              padding: '4px 0', fontWeight: 700
            }}>{w}</div>
          ))}
        </div>

        {/* روزها */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
          {Array.from({ length: firstCol }).map((_, i) => <div key={`e-${i}`} />)}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const d = setDate(cursor, day);
            const dayStr = format(d, 'yyyy/MM/dd');
            const isSelected = dayStr === value;
            const isToday = dayStr === todayStr;
            const isFriday = d.getDay() === 5;

            return (
              <button
                key={day}
                onClick={() => handleSelect(day)}
                style={{
                  aspectRatio: '1',
                  background: isSelected ? 'var(--accent)' : isToday ? 'var(--accent-soft)' : 'transparent',
                  border: isToday && !isSelected ? '1px solid var(--accent-border)' : '1px solid transparent',
                  borderRadius: 'var(--r-sm)',
                  cursor: 'pointer',
                  color: isSelected ? 'var(--avatar-text)' : isFriday ? 'var(--danger)' : 'var(--text)',
                  fontFamily: 'inherit', fontSize: 'var(--fs-base)',
                  fontWeight: isSelected || isToday ? 700 : 400,
                  transition: 'background .1s'
                }}
              >
                {toFa(day)}
              </button>
            );
          })}
        </div>
      </Modal>
    </>
  );
}
