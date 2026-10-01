import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  format, parse, addMonths, subMonths, getDate, setDate, setMonth,
  setYear, getYear, getMonth, startOfMonth, endOfMonth,
} from 'date-fns-jalali';
import { Btn, Sheet } from './ui';
import { toFa } from '../utils/fa';
import { useSet } from '../../mod/set/store';

const MONTHS = ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'];
const WEEKDAYS = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'];

const toLatin = (s: string) =>
  s.replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)));

interface Props {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  error?: string;
  warn?: string;
  compact?: boolean;
  min?: string;
  max?: string;
  autoToday?: boolean;
}


export default function DatePicker({
  value,
  onChange,
  placeholder = 'انتخاب تاریخ',
  disabled = false,
  required = false,
  error,
  warn,
  compact = false,
  min,
  max,
  autoToday = false,
}: Props) {
  const [open, setOpen] = useState(false);

  const lowPower = useSet((st: any) => st.lowPowerMode);
  const [prefersReduced, setPrefersReduced] = useState(false);
  useEffect(() => {
    try {
      const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
      setPrefersReduced(mq.matches);
      const handler = (e: MediaQueryListEvent) => setPrefersReduced(e.matches);
      mq.addEventListener('change', handler);
      return () => mq.removeEventListener('change', handler);
    } catch { /* silent */ }
  }, []);
  const noAnim = !!(lowPower || prefersReduced);

  const today = new Date();
  const todayStr = format(today, 'yyyy/MM/dd');

  const [cursor, setCursor] = useState<Date>(() => {
    if (value) {
      try {
        const p = parse(toLatin(value), 'yyyy/MM/dd', new Date());
        if (!isNaN(p.getTime())) return p;
      } catch { /* silent */ }
    }
    return today;
  });

  // autoToday: اگه value خالیه، خودکار امروز رو ست کن
  useEffect(() => {
    if (autoToday && !value && !disabled) {
      onChange(todayStr);
    }
  }, [autoToday, disabled]);

  // هر بار باز شدن: اگه value بود بریم همون، وگرنه امروز
  useEffect(() => {
    if (!open) return;
    if (value) {
      try {
        const p = parse(toLatin(value), 'yyyy/MM/dd', new Date());
        if (!isNaN(p.getTime())) { setCursor(p); return; }
      } catch { /* silent */ }
    }
    setCursor(new Date());
  }, [open]);

  const currentYear = getYear(new Date());
  const years = useMemo(
    () => Array.from({ length: 31 }, (_, i) => currentYear - 15 + i),
    [currentYear]
  );

  const year = getYear(cursor);
  const month = getMonth(cursor);
  const monthStart = startOfMonth(cursor);
  const monthEnd = endOfMonth(cursor);
  const daysInMonth = getDate(monthEnd);
  const firstCol = (monthStart.getDay() + 1) % 7;

  const isInRange = (dateStr: string) => {
    if (min && dateStr < min) return false;
    if (max && dateStr > max) return false;
    return true;
  };

  const handleSelect = (day: number) => {
    const d = setDate(cursor, day);
    const dStr = format(d, 'yyyy/MM/dd');
    if (!isInRange(dStr)) return;
    onChange(dStr);
    setOpen(false);
  };

  const borderColor = error ? 'var(--danger)' : warn ? 'var(--warn)' : 'var(--border)';
  const height = compact ? 32 : 38;

  return (
    <>
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen(true)}
        aria-haspopup="dialog"
        aria-label={required ? `${placeholder} (اجباری)` : placeholder}
        aria-invalid={!!error}
        style={{
          width: '100%',
          height,
          background: 'var(--input-bg)',
          border: `1px solid ${borderColor}`,
          borderRadius: 'var(--r-md)',
          padding: compact ? '0 10px' : '0 12px',
          color: value ? 'var(--text)' : 'var(--dim)',
          fontFamily: 'inherit',
          fontSize: compact ? 'var(--fs-sm)' : 'var(--fs-base)',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.55 : 1,
          textAlign: 'right',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
          minWidth: 0,
          outline: 'none',
        }}
        onFocus={(e) => { if (!disabled) e.currentTarget.style.boxShadow = '0 0 0 2px var(--accent-soft)'; }}
        onBlur={(e) => { e.currentTarget.style.boxShadow = 'none'; }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {value ? toFa(value) : placeholder}
          {required && !value ? <span style={{ color: 'var(--danger)', marginRight: 4 }}>*</span> : null}
        </span>
        <svg width={compact ? 13 : 15} height={compact ? 13 : 15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, color: 'var(--dim)' }} aria-hidden="true">
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <path d="M16 2v4M8 2v4M3 10h18" />
        </svg>
      </button>

      {(error || warn) && (
        <div style={{ fontSize: 'var(--fs-xs)', color: error ? 'var(--danger)' : 'var(--warn)', marginTop: 4 }}>
          {error ? `✕ ${error}` : `⚠ ${warn}`}
        </div>
      )}

      <Sheet
        open={open}
        onClose={() => setOpen(false)}
        title="انتخاب تاریخ"
        footer={
          <div style={{ display: 'flex', gap: 6 }}>
            <Btn
              onClick={() => { if (isInRange(todayStr)) { onChange(todayStr); setOpen(false); } }}
              style={{ flex: 1, height: 34 }}
            >امروز</Btn>
            <Btn
              onClick={() => { onChange(''); setOpen(false); }}
              style={{ flex: 1, height: 34 }}
            >پاک</Btn>
          </div>
        }>
        {/* ═══ هدر فشرده: ‹ ماه سال › با Select مستقیم ═══ */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '0 0 4px' }}>
          <button
            type="button"
            onClick={() => setCursor(subMonths(cursor, 1))}
            aria-label="ماه قبل"
            style={{ width: 32, height: 32, background: 'var(--btn-bg)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', color: 'var(--muted)', cursor: 'pointer', fontSize: 16, fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
          >›</button>
          <select
            value={String(month)}
            onChange={(e) => setCursor(setMonth(cursor, +e.target.value))}
            aria-label="ماه"
            style={{ flex: 2, height: 32, background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', padding: '0 4px', color: 'var(--text)', fontFamily: 'inherit', fontSize: 'var(--fs-sm)', fontWeight: 700, minWidth: 0 }}
          >
            {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
          </select>
          <select
            value={String(year)}
            onChange={(e) => setCursor(setYear(cursor, +e.target.value))}
            aria-label="سال"
            style={{ flex: 1.2, height: 32, background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', padding: '0 4px', color: 'var(--text)', fontFamily: 'inherit', fontSize: 'var(--fs-sm)', fontWeight: 700, minWidth: 0 }}
          >
            {years.map((y) => <option key={y} value={y}>{toFa(y)}</option>)}
          </select>
          <button
            type="button"
            onClick={() => setCursor(addMonths(cursor, 1))}
            aria-label="ماه بعد"
            style={{ width: 32, height: 32, background: 'var(--btn-bg)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', color: 'var(--muted)', cursor: 'pointer', fontSize: 16, fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
          >‹</button>
        </div>

        {/* ═══ روزهای هفته ═══ */}
        <div role="row" style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, marginTop: 4 }}>
          {WEEKDAYS.map((w, i) => (
            <div key={i} role="columnheader" style={{ textAlign: 'center', fontSize: 10, color: i === 6 ? 'var(--danger)' : 'var(--dim)', padding: '2px 0', fontWeight: 700 }}>
              {w}
            </div>
          ))}
        </div>

        {/* ═══ روزها ═══ */}
        <div role="grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
          {Array.from({ length: firstCol }).map((_, i) => (
            <div key={`e-${i}`} aria-hidden="true" />
          ))}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const d = setDate(cursor, day);
            const dayStr = format(d, 'yyyy/MM/dd');
            const isSelected = dayStr === value;
            const isToday = dayStr === todayStr;
            const isFriday = d.getDay() === 5;
            const isDisabled = !isInRange(dayStr);

            return (
              <button
                key={day}
                type="button"
                onClick={() => handleSelect(day)}
                disabled={isDisabled}
                aria-label={`${toFa(day)} ${MONTHS[month]} ${toFa(year)}`}
                aria-selected={isSelected}
                aria-current={isToday ? 'date' : undefined}
                style={{
                  height: 36,
                  padding: 0,
                  background: isSelected ? 'var(--accent)' : 'transparent',
                  border: isToday && !isSelected ? '1.5px solid var(--accent)' : '1px solid transparent',
                  borderRadius: 'var(--r-sm)',
                  cursor: isDisabled ? 'not-allowed' : 'pointer',
                  color: isDisabled ? 'var(--dim)' : isSelected ? 'var(--avatar-text)' : isFriday ? 'var(--danger)' : 'var(--text)',
                  fontFamily: 'inherit',
                  fontSize: 'var(--fs-base)',
                  fontWeight: isSelected || isToday ? 700 : 500,
                  opacity: isDisabled ? 0.35 : 1,
                  transition: noAnim ? 'none' : 'background var(--dur-fast)',
                  outline: 'none',
                }}
                onFocus={(e) => { if (!isDisabled && !isSelected) e.currentTarget.style.boxShadow = '0 0 0 2px var(--accent-soft)'; }}
                onBlur={(e) => { e.currentTarget.style.boxShadow = 'none'; }}
              >
                {toFa(day)}
              </button>
            );
          })}
        </div>
      </Sheet>

    </>
  );
}
