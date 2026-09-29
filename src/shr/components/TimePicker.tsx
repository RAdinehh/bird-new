import { useState, useEffect } from 'react';
import { Btn, Modal } from './ui';
import { toFa, toEn, formatNumWhileTyping } from '../utils/fa';
import { useSet } from '../../mod/set/store';

interface Props {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  // جدید
  disabled?: boolean;
  required?: boolean;
  error?: string;
  warn?: string;
  compact?: boolean;
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

  // lowPowerMode + prefers-reduced-motion
  const lowPower = useSet((st: any) => st.lowPowerMode);
  const [prefersReduced, setPrefersReduced] = useState(false);
  useEffect(() => {
    try {
      const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
      setPrefersReduced(mq.matches);
      const handler = (e: MediaQueryListEvent) => setPrefersReduced(e.matches);
      mq.addEventListener('change', handler);
      return () => mq.removeEventListener('change', handler);
    } catch {
      /* silent */
    }
  }, []);
  const noAnim = !!(lowPower || prefersReduced);

  const parseTime = () => {
    const parts = (value || '')
      .replace(/[۰-۹]/g, d => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
      .split(':');
    const h = parseInt(parts[0]) || 0;
    const m = parseInt(parts[1]) || 0;
    return { h: Math.min(23, Math.max(0, h)), m: Math.min(59, Math.max(0, m)) };
  };

  const [hour, setHour] = useState(() => parseTime().h);
  const [minute, setMinute] = useState(() => parseTime().m);

  const openPicker = () => {
    if (disabled) return;
    const p = parseTime();
    setHour(p.h);
    setMinute(p.m);
    setOpen(true);
  };

  const confirm = () => {
    const h = String(hour).padStart(2, '0');
    const m = String(minute).padStart(2, '0');
    onChange(`${h}:${m}`);
    setOpen(false);
  };

  const setNow = () => {
    const now = new Date();
    setHour(now.getHours());
    setMinute(now.getMinutes());
  };

  const changeMinute = (raw: string) => {
    const en = toEn(raw).replace(/\D/g, '');
    if (!en) {
      setMinute(0);
      return;
    }
    const n = parseInt(en);
    setMinute(Math.min(59, Math.max(0, n)));
  };

  const quickMinutes = [0, 15, 30, 45];

  const height = compact ? 32 : 38;
  const fontSize = compact ? 'var(--fs-sm)' : 'var(--fs-base)';

  const borderColor = error
    ? 'var(--danger)'
    : warn
    ? 'var(--warn)'
    : 'var(--border)';

  return (
    <>
      <button
        type="button"
        disabled={disabled}
        onClick={openPicker}
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
          fontSize,
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.55 : 1,
          textAlign: 'right',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
          minWidth: 0,
          outline: 'none',
          transition: noAnim ? 'none' : 'border-color var(--dur-base)',
        }}
        onFocus={e => {
          if (!disabled) {
            e.currentTarget.style.boxShadow = '0 0 0 2px var(--accent-soft)';
          }
        }}
        onBlur={e => {
          e.currentTarget.style.boxShadow = 'none';
        }}
      >
        <span
          style={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {value ? toFa(value) : placeholder}
          {required && !value ? (
            <span style={{ color: 'var(--danger)', marginRight: 4 }}> *</span>
          ) : null}
        </span>
        <svg
          width={compact ? 13 : 15}
          height={compact ? 13 : 15}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          style={{ flexShrink: 0, color: 'var(--dim)' }}
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M12 6v6l4 2" />
        </svg>
      </button>

      {(error || warn) && (
        <div
          style={{
            fontSize: 'var(--fs-xs)',
            color: error ? 'var(--danger)' : 'var(--warn)',
            marginTop: 4,
          }}
        >
          {error ? `✕ ${error}` : `⚠ ${warn}`}
        </div>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="انتخاب ساعت"
        footer={
          <div style={{ display: 'flex', flexDirection: 'row-reverse', gap: 8 }}>
            <Btn variant="primary" onClick={confirm}>تأیید</Btn>
            <Btn onClick={setNow}>الان</Btn>
            <Btn
              onClick={() => {
                onChange('');
                setOpen(false);
              }}
            >
              پاک کردن
            </Btn>
          </div>
        }
      >
        {/* نمایش بزرگ — aria-live */}
        <div
          aria-live="polite"
          aria-atomic="true"
          style={{
            padding: '14px',
            background: 'var(--accent-soft)',
            border: '1px solid var(--accent-border)',
            borderRadius: 'var(--r-md)',
            textAlign: 'center',
            fontSize: 36,
            fontWeight: 700,
            color: 'var(--accent)',
            fontVariantNumeric: 'tabular-nums',
            letterSpacing: 3,
            direction: 'ltr',
          }}
        >
          {toFa(String(hour).padStart(2, '0'))}:{toFa(String(minute).padStart(2, '0'))}
        </div>

        {/* ساعت */}
        <div
          style={{
            fontSize: 'var(--fs-sm)',
            color: 'var(--muted)',
            fontWeight: 700,
            marginTop: 4,
            display: 'flex',
            justifyContent: 'space-between',
          }}
        >
          <span>ساعت</span>
          <span style={{ fontSize: 'var(--fs-xs)', fontWeight: 400 }}>۰ تا ۲۳</span>
        </div>
        <div
          role="group"
          aria-label="انتخاب ساعت"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(6, 1fr)',
            gap: 4,
          }}
        >
          {Array.from({ length: 24 }).map((_, h) => (
            <button
              key={h}
              type="button"
              onClick={() => setHour(h)}
              aria-pressed={hour === h}
              aria-label={`ساعت ${toFa(h)}`}
              style={{
                padding: '8px 2px',
                background: hour === h ? 'var(--accent)' : 'var(--input-bg)',
                border: `1px solid ${hour === h ? 'var(--accent)' : 'var(--border)'}`,
                borderRadius: 'var(--r-sm)',
                color: hour === h ? 'var(--avatar-text)' : 'var(--text)',
                fontFamily: 'inherit',
                fontSize: 'var(--fs-base)',
                fontWeight: hour === h ? 700 : 500,
                cursor: 'pointer',
                fontVariantNumeric: 'tabular-nums',
                outline: 'none',
                transition: noAnim ? 'none' : 'background var(--dur-fast)',
              }}
              onFocus={e => {
                e.currentTarget.style.boxShadow = '0 0 0 2px var(--accent-soft)';
              }}
              onBlur={e => {
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              {toFa(String(h).padStart(2, '0'))}
            </button>
          ))}
        </div>

        {/* دقیقه */}
        <div
          style={{
            fontSize: 'var(--fs-sm)',
            color: 'var(--muted)',
            fontWeight: 700,
            marginTop: 10,
            display: 'flex',
            justifyContent: 'space-between',
          }}
        >
          <span>دقیقه</span>
          <span style={{ fontSize: 'var(--fs-xs)', fontWeight: 400 }}>تایپ یا از دکمه‌ها</span>
        </div>

        <div style={{ display: 'flex', gap: 6 }}>
          {/* فیلد ورودی دقیقه */}
          <div
            style={{
              flex: 1,
              height: 42,
              background: 'var(--input-bg)',
              border: '1px solid var(--accent-border)',
              borderRadius: 'var(--r-md)',
              padding: '0 12px',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              minWidth: 0,
            }}
          >
            <span
              aria-hidden="true"
              style={{
                fontSize: 'var(--fs-lg)',
                color: 'var(--accent)',
                fontWeight: 700,
              }}
            >
              :
            </span>
            <input
              type="text"
              inputMode="numeric"
              dir="ltr"
              value={formatNumWhileTyping(String(minute))}
              onChange={e => changeMinute(e.target.value)}
              onFocus={e => e.target.select()}
              placeholder="۰۰"
              aria-label="دقیقه (۰ تا ۵۹)"
              style={{
                flex: 1,
                minWidth: 0,
                background: 'none',
                border: 'none',
                outline: 'none',
                color: 'var(--accent)',
                fontFamily: 'inherit',
                fontSize: 20,
                fontWeight: 700,
                textAlign: 'center',
                fontVariantNumeric: 'tabular-nums',
              }}
            />
            <span
              aria-hidden="true"
              style={{ fontSize: 'var(--fs-xs)', color: 'var(--dim)' }}
            >
              دقیقه
            </span>
          </div>

          {/* دکمه‌های سریع */}
          {quickMinutes.map(m => (
            <button
              key={m}
              type="button"
              onClick={() => setMinute(m)}
              aria-pressed={minute === m}
              aria-label={`${toFa(m)} دقیقه`}
              style={{
                width: 42,
                height: 42,
                background: minute === m ? 'var(--accent)' : 'var(--btn-bg)',
                border: `1px solid ${minute === m ? 'var(--accent)' : 'var(--border)'}`,
                borderRadius: 'var(--r-md)',
                color: minute === m ? 'var(--avatar-text)' : 'var(--muted)',
                fontFamily: 'inherit',
                fontSize: 'var(--fs-sm)',
                fontWeight: 700,
                cursor: 'pointer',
                fontVariantNumeric: 'tabular-nums',
                flexShrink: 0,
                outline: 'none',
                transition: noAnim ? 'none' : 'background var(--dur-fast)',
              }}
              onFocus={e => {
                e.currentTarget.style.boxShadow = '0 0 0 2px var(--accent-soft)';
              }}
              onBlur={e => {
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              {toFa(String(m).padStart(2, '0'))}
            </button>
          ))}
        </div>

        {/* راهنما */}
        <div
          style={{
            fontSize: 'var(--fs-xs)',
            color: 'var(--dim)',
            textAlign: 'center',
            marginTop: 2,
          }}
        >
          هر عددی بین ۰۰ تا ۵۹ وارد کنید — مثلاً ۱۶
        </div>
      </Modal>
    </>
  );
}
