import { useState, useEffect, useMemo } from 'react';
import {
  format, parse, addMonths, subMonths, getDate, setDate, setMonth,
  setYear, getYear, getMonth, startOfMonth, endOfMonth,
} from 'date-fns-jalali';
import { Btn, Modal } from './ui';
import { useFormat } from '../units/useFormat';
import { useSet } from '../../mod/set/store';

const JALALI_MONTHS = ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'];
const GREG_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const JALALI_WEEKDAYS = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'];
const GREG_WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

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
  const [view, setView] = useState<'days' | 'months' | 'years'>('days');
  const [pending, setPending] = useState(value || '');
  const fmt = useFormat();
  const isGregorian = fmt.units.dateFormat === 'gregorian';
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

  const parseValueToDate = (val?: string): Date | null => {
    if (!val) return null;
    try {
      const p = parse(toLatin(val), 'yyyy/MM/dd', new Date());
      return isNaN(p.getTime()) ? null : p;
    } catch {
      return null;
    }
  };

  const [cursor, setCursor] = useState<Date>(() => parseValueToDate(value) || today);

  useEffect(() => {
    if (autoToday && !value && !disabled) {
      onChange(todayStr);
    }
  }, [autoToday, disabled]);

  useEffect(() => {
    if (!open) return;
    setCursor(parseValueToDate(value) || new Date());
    setView('days');
  }, [open]);

  useEffect(() => {
    if (open) setPending(value || '');
  }, [open, value]);

  const isInRange = (dateStr: string) => {
    if (min && dateStr < min) return false;
    if (max && dateStr > max) return false;
    return true;
  };

  const borderColor = error ? 'var(--danger)' : warn ? 'var(--warn)' : 'var(--border)';
  const height = compact ? 32 : 38;

  const months = isGregorian ? GREG_MONTHS : JALALI_MONTHS;
  const weekdays = isGregorian ? GREG_WEEKDAYS : JALALI_WEEKDAYS;

  const { year, month, daysInMonth, firstCol, years } = useMemo(() => {
    if (!isGregorian) {
      const cy = getYear(new Date());
      const minY = cy - 15; const maxY = Math.max(cy + 15, 1440); const yrList = Array.from({ length: maxY - minY + 1 }, (_, i) => minY + i);
      const y = getYear(cursor);
      const m = getMonth(cursor);
      const mStart = startOfMonth(cursor);
      const mEnd = endOfMonth(cursor);
      return {
        year: y,
        month: m,
        daysInMonth: getDate(mEnd),
        firstCol: (mStart.getDay() + 1) % 7,
        years: yrList,
      };
    }
    const cy = new Date().getFullYear();
    const minY = cy - 15; const maxY = Math.max(cy + 15, 2061); const yrList = Array.from({ length: maxY - minY + 1 }, (_, i) => minY + i);
    const y = cursor.getFullYear();
    const m = cursor.getMonth();
    const first = new Date(y, m, 1);
    const last = new Date(y, m + 1, 0);
    return {
      year: y,
      month: m,
      daysInMonth: last.getDate(),
      firstCol: first.getDay(),
      years: yrList,
    };
  }, [cursor, isGregorian]);

  const syncPendingToCursor = (nextCursor: Date) => {
    const base = parseValueToDate(pending) || cursor;
    let nextDate: Date;
    if (!isGregorian) {
      const maxDay = getDate(endOfMonth(nextCursor));
      const targetDay = Math.min(getDate(base), maxDay);
      nextDate = setDate(startOfMonth(nextCursor), targetDay);
    } else {
      const maxDay = new Date(nextCursor.getFullYear(), nextCursor.getMonth() + 1, 0).getDate();
      const targetDay = Math.min(base.getDate(), maxDay);
      nextDate = new Date(nextCursor.getFullYear(), nextCursor.getMonth(), targetDay);
    }
    const nextStr = format(nextDate, 'yyyy/MM/dd');
    if (isInRange(nextStr)) setPending(nextStr);
  };

  const stepMonth = (delta: number) => {
    const next = !isGregorian
      ? (delta > 0 ? addMonths(cursor, 1) : subMonths(cursor, 1))
      : new Date(cursor.getFullYear(), cursor.getMonth() + delta, 1);
    setCursor(next);
    syncPendingToCursor(next);
  };

  const changeMonth = (mIdx: number) => {
    const next = !isGregorian
      ? setMonth(startOfMonth(cursor), mIdx)
      : new Date(cursor.getFullYear(), mIdx, 1);
    setCursor(next);
    syncPendingToCursor(next);
    setView('days');
  };

  const changeYear = (yr: number) => {
    const next = !isGregorian
      ? setYear(startOfMonth(cursor), yr)
      : new Date(yr, cursor.getMonth(), 1);
    setCursor(next);
    syncPendingToCursor(next);
    setView('days');
  };

  const buildDateObj = (day: number): Date => {
    if (!isGregorian) return setDate(cursor, day);
    return new Date(cursor.getFullYear(), cursor.getMonth(), day);
  };

  const handleSelect = (day: number) => {
    const d = buildDateObj(day);
    const dStr = format(d, 'yyyy/MM/dd');
    if (!isInRange(dStr)) return;
    setPending(dStr);
  };

  const formatCellDay = (_d: Date, dayNum: number) => {
    if (!isGregorian) return fmt.count(dayNum);
    return fmt.raw.digits(String(dayNum), fmt.units.numberFormat);
  };

  const formatYearOption = (yr: number) => {
    return fmt.raw.digits(String(yr), fmt.units.numberFormat);
  };

  const displayTriggerText = value ? fmt.date(value) : placeholder;

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
          height, boxSizing: 'border-box',
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
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {displayTriggerText}
          {required && !value ? <span style={{ color: 'var(--danger)', marginRight: 4 }}>*</span> : null}
        </span>
        <svg width={compact ? 13 : 15} height={compact ? 13 : 15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, color: 'var(--dim)' }} aria-hidden="true">
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <path d="M16 2v4M8 2v4M3 10h18" />
        </svg>
      </button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="انتخاب تاریخ"
        size="md"
        fullWidth
        z={10050}
        footer={
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <Btn
              variant="primary"
              full
              disabled={!pending}
              onClick={() => { if (pending && isInRange(pending)) { onChange(pending); setOpen(false); } }}
              style={{ height: 38 }}
            >✓ تأیید</Btn>
            <div style={{ display: 'flex', gap: 6 }}>
              <Btn
                onClick={() => { if (isInRange(todayStr)) { setPending(todayStr); setCursor(new Date()); setView('days'); } }}
                style={{ flex: 1, height: 34 }}
              >امروز</Btn>
              <Btn
                onClick={() => { setPending(''); }}
                style={{ flex: 1, height: 34 }}
              >پاک</Btn>
            </div>
          </div>
        }
      >
        {/* ═══ هدر: فلش چپ | ماه | سال | فلش راست ═══ */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingBottom: 8 }}>
          <button
            type="button"
            onClick={() => stepMonth(-1)}
            aria-label="ماه قبل"
            style={{ width: 34, height: 34, background: 'var(--btn-bg)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', color: 'var(--muted)', cursor: 'pointer', fontSize: 16, fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
          >›</button>
          <button
            type="button"
            onClick={() => setView(view === 'months' ? 'days' : 'months')}
            aria-label="انتخاب ماه"
            style={{
              flex: 1.5, height: 34,
              background: view === 'months' ? 'var(--accent)' : 'var(--input-bg)',
              color: view === 'months' ? '#fff' : 'var(--text)',
              border: '1px solid var(--border)', borderRadius: 'var(--r-md)',
              padding: '0 8px', fontFamily: 'inherit', fontSize: 'var(--fs-sm)', fontWeight: 700,
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', minWidth: 0,
            }}
          >
            <span>{months[month]}</span>
            <span style={{ fontSize: 11, opacity: 0.75 }}>▾</span>
          </button>
          <button
            type="button"
            onClick={() => setView(view === 'years' ? 'days' : 'years')}
            aria-label="انتخاب سال"
            style={{
              flex: 1, height: 34,
              background: view === 'years' ? 'var(--accent)' : 'var(--input-bg)',
              color: view === 'years' ? '#fff' : 'var(--text)',
              border: '1px solid var(--border)', borderRadius: 'var(--r-md)',
              padding: '0 8px', fontFamily: 'inherit', fontSize: 'var(--fs-sm)', fontWeight: 700,
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', minWidth: 0,
            }}
          >
            <span>{formatYearOption(year)}</span>
            <span style={{ fontSize: 11, opacity: 0.75 }}>▾</span>
          </button>
          <button
            type="button"
            onClick={() => stepMonth(1)}
            aria-label="ماه بعد"
            style={{ width: 34, height: 34, background: 'var(--btn-bg)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', color: 'var(--muted)', cursor: 'pointer', fontSize: 16, fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
          >‹</button>
        </div>

        {/* ═══ نمای انتخاب ماه ═══ */}
        {view === 'months' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, padding: '6px 0' }}>
            {months.map((m, i) => {
              const active = i === month;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => changeMonth(i)}
                  style={{
                    height: 38,
                    background: active ? 'var(--accent)' : 'var(--input-bg)',
                    color: active ? '#fff' : 'var(--text)',
                    border: active ? '1px solid var(--accent)' : '1px solid var(--border)',
                    borderRadius: 'var(--r-md)',
                    fontFamily: 'inherit',
                    fontSize: 'var(--fs-sm)',
                    fontWeight: active ? 700 : 500,
                    cursor: 'pointer',
                  }}
                >
                  {m}
                </button>
              );
            })}
          </div>
        )}

        {/* ═══ نمای انتخاب سال ═══ */}
        {view === 'years' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6, padding: '6px 0', maxHeight: 220, overflowY: 'auto' }}>
            {years.map((y) => {
              const active = y === year;
              return (
                <button
                  key={y}
                  type="button"
                  onClick={() => changeYear(y)}
                  style={{
                    height: 36,
                    background: active ? 'var(--accent)' : 'var(--input-bg)',
                    color: active ? '#fff' : 'var(--text)',
                    border: active ? '1px solid var(--accent)' : '1px solid var(--border)',
                    borderRadius: 'var(--r-md)',
                    fontFamily: 'inherit',
                    fontSize: 'var(--fs-sm)',
                    fontWeight: active ? 700 : 500,
                    cursor: 'pointer',
                  }}
                >
                  {formatYearOption(y)}
                </button>
              );
            })}
          </div>
        )}

        {/* ═══ نمای انتخاب روز ═══ */}
        {view === 'days' && (
          <>
            <div role="row" style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, marginTop: 2 }}>
              {weekdays.map((w, i) => (
                <div key={i} role="columnheader" style={{ textAlign: 'center', fontSize: 10, color: (!isGregorian && i === 6) || (isGregorian && i === 0) ? 'var(--danger)' : 'var(--dim)', padding: '2px 0', fontWeight: 700 }}>
                  {w}
                </div>
              ))}
            </div>

            <div role="grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
              {Array.from({ length: firstCol }).map((_, i) => (
                <div key={`e-${i}`} aria-hidden="true" />
              ))}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const d = buildDateObj(day);
                const dayStr = format(d, 'yyyy/MM/dd');
                const isSelected = dayStr === pending;
                const isToday = dayStr === todayStr;
                const isFriday = d.getDay() === 5;
                const isDisabled = !isInRange(dayStr);

                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => handleSelect(day)}
                    disabled={isDisabled}
                    aria-label={`${formatCellDay(d, day)} ${months[month]} ${formatYearOption(year)}`}
                    aria-selected={isSelected}
                    aria-current={isToday ? 'date' : undefined}
                    style={{
                      height: 34,
                      padding: 0,
                      background: isSelected ? 'var(--accent)' : 'transparent',
                      color: isSelected
                        ? '#fff'
                        : isDisabled
                          ? 'var(--dim)'
                          : isFriday
                            ? 'var(--danger)'
                            : 'var(--text)',
                      border: isToday && !isSelected ? '1px solid var(--accent)' : '1px solid transparent',
                      borderRadius: 'var(--r-md)',
                      fontFamily: 'inherit',
                      fontSize: 'var(--fs-sm)',
                      fontWeight: isSelected || isToday ? 700 : 500,
                      cursor: isDisabled ? 'not-allowed' : 'pointer',
                      opacity: isDisabled ? 0.35 : 1,
                      transition: noAnim ? 'none' : 'background 0.12s ease',
                    }}
                  >
                    {formatCellDay(d, day)}
                  </button>
                );
              })}
            </div>
          </>
        )}

        {/* پیش‌نمایش تاریخ انتخاب‌شده */}
        {pending && (
          <div style={{
            marginTop: 10,
            padding: '6px 10px',
            background: 'var(--input-bg)',
            borderRadius: 'var(--r-sm)',
            fontSize: 'var(--fs-xs)',
            color: 'var(--muted)',
            textAlign: 'center',
          }}>
            انتخاب‌شده: <b style={{ color: 'var(--text)' }}>{fmt.date(pending)}</b>
            {isGregorian && (
              <span style={{ marginRight: 8, color: 'var(--dim)' }}>
                ({fmt.raw.digits(pending, fmt.units.numberFormat)} شمسی)
              </span>
            )}
          </div>
        )}
      </Modal>
    </>
  );
}
