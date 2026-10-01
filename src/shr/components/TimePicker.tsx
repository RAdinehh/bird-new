import { useState, useEffect, useRef } from 'react';
import { Btn, Sheet } from './ui';
import { toFa } from '../utils/fa';

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));
const ITEM_H = 40;
const VISIBLE = 5;

interface Props {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  error?: string;
  warn?: string;
  compact?: boolean;
}

function parseTime(v: string): [string, string] {
  if (!v) return ['00', '00'];
  const parts = v.split(':');
  const h = (parts[0] || '00').padStart(2, '0');
  const m = (parts[1] || '00').padStart(2, '0');
  return [h, m];
}

function WheelColumn({
  values, value, onChange, ariaLabel,
}: {
  values: string[];
  value: string;
  onChange: (v: string) => void;
  ariaLabel: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const suppress = useRef(false);

  useEffect(() => {
    if (!ref.current) return;
    const idx = values.indexOf(value);
    if (idx < 0) return;
    suppress.current = true;
    requestAnimationFrame(() => {
      if (ref.current) ref.current.scrollTop = idx * ITEM_H;
      setTimeout(() => { suppress.current = false; }, 120);
    });
  }, []);

  const onScroll = () => {
    if (!ref.current || suppress.current) return;
    const idx = Math.round(ref.current.scrollTop / ITEM_H);
    const clamped = Math.max(0, Math.min(values.length - 1, idx));
    const v = values[clamped];
    if (v !== value) onChange(v);
  };

  return (
    <div
      ref={ref}
      onScroll={onScroll}
      role="listbox"
      aria-label={ariaLabel}
      className="tp-wheel"
      style={{
        height: ITEM_H * VISIBLE,
        overflowY: 'scroll',
        scrollSnapType: 'y mandatory',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
        WebkitOverflowScrolling: 'touch',
      }}
    >
      <div style={{ height: ITEM_H * 2 }} />
      {values.map((v) => {
        const active = v === value;
        return (
          <div
            key={v}
            role="option"
            aria-selected={active}
            style={{
              height: ITEM_H,
              scrollSnapAlign: 'center',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: active ? 24 : 18,
              fontWeight: active ? 700 : 500,
              color: active ? 'var(--accent)' : 'var(--muted)',
              transition: 'font-size 140ms ease, color 140ms ease',
            }}
          >
            {toFa(v)}
          </div>
        );
      })}
      <div style={{ height: ITEM_H * 2 }} />
    </div>
  );
}

export default function TimePicker({
  value,
  onChange,
  placeholder = 'انتخاب ساعت',
  disabled = false,
  required = false,
  error,
  warn,
  compact = false,
}: Props) {
  const [open, setOpen] = useState(false);
  const [hour, setHour] = useState('00');
  const [minute, setMinute] = useState('00');

  useEffect(() => {
    if (open) {
      const [h, m] = parseTime(value);
      setHour(h);
      setMinute(m);
    }
  }, [open, value]);

  const setNow = () => {
    const d = new Date();
    setHour(String(d.getHours()).padStart(2, '0'));
    setMinute(String(d.getMinutes()).padStart(2, '0'));
  };

  const confirm = () => {
    onChange(hour + ':' + minute);
    setOpen(false);
  };

  const clear = () => {
    onChange('');
    setOpen(false);
  };

  const borderColor = error ? 'var(--danger)' : warn ? 'var(--warn)' : 'var(--border)';
  const height = compact ? 32 : 38;

  return (
    <>
      <style>{`.tp-wheel::-webkit-scrollbar { display: none; }`}</style>

      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen(true)}
        aria-label={placeholder}
        style={{
          width: '100%',
          height,
          background: 'var(--input-bg)',
          border: '1px solid ' + borderColor,
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
          {value ? toFa(value) : placeholder}
          {required && !value ? <span style={{ color: 'var(--danger)', marginRight: 4 }}>*</span> : null}
        </span>
        <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, color: 'var(--dim)' }}>
          <circle cx="12" cy="12" r="10" />
          <path d="M12 7v5l3 2" />
        </svg>
      </button>

      {(error || warn) && (
        <div style={{ fontSize: 'var(--fs-xs)', color: error ? 'var(--danger)' : 'var(--warn)', marginTop: 4 }}>
          {error ? '✕ ' + error : '⚠ ' + warn}
        </div>
      )}

      <Sheet open={open} onClose={() => setOpen(false)} title="انتخاب ساعت">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center', paddingTop: 4 }}>
          <div style={{ fontSize: 42, fontWeight: 800, color: 'var(--accent)', letterSpacing: 2, direction: 'ltr', fontVariantNumeric: 'tabular-nums' }}>
            {toFa(hour)}:{toFa(minute)}
          </div>

          <div style={{ position: 'relative', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, width: '100%', maxWidth: 240, direction: 'ltr' }}>
            <div style={{
              position: 'absolute',
              top: ITEM_H * 2,
              left: 0,
              right: 0,
              height: ITEM_H,
              background: 'var(--accent-soft)',
              borderTop: '1px solid var(--accent-border)',
              borderBottom: '1px solid var(--accent-border)',
              borderRadius: 'var(--r-sm)',
              pointerEvents: 'none',
              zIndex: 0,
            }} />
            <div style={{ position: 'relative', zIndex: 1 }}>
              <WheelColumn values={HOURS} value={hour} onChange={setHour} ariaLabel="ساعت" />
            </div>
            <div style={{ position: 'relative', zIndex: 1 }}>
              <WheelColumn values={MINUTES} value={minute} onChange={setMinute} ariaLabel="دقیقه" />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, width: '100%', maxWidth: 240, textAlign: 'center', marginTop: -6, direction: 'ltr' }}>
            <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', fontWeight: 700 }}>ساعت</div>
            <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', fontWeight: 700 }}>دقیقه</div>
          </div>

          <div style={{ display: 'flex', gap: 8, width: '100%', marginTop: 4 }}>
            <Btn full variant="primary" onClick={confirm}>✓ تأیید</Btn>
          </div>
          <div style={{ display: 'flex', gap: 8, width: '100%' }}>
            <Btn onClick={setNow} style={{ flex: 1 }}>⏱ اکنون</Btn>
            <Btn onClick={clear} style={{ flex: 1 }}>پاک</Btn>
          </div>
        </div>
      </Sheet>
    </>
  );
}
