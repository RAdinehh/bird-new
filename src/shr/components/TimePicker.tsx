import { useState } from 'react';
import { Btn, Modal } from './ui';
import { toFa, toEn, formatNumWhileTyping } from '../utils/fa';

interface Props {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}

export default function TimePicker({ value, onChange, placeholder = 'انتخاب ساعت' }: Props) {
  const [open, setOpen] = useState(false);

  const parseTime = () => {
    const parts = (value || '').replace(/[۰-۹]/g, d => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d))).split(':');
    const h = parseInt(parts[0]) || 0;
    const m = parseInt(parts[1]) || 0;
    return { h: Math.min(23, Math.max(0, h)), m: Math.min(59, Math.max(0, m)) };
  };

  const [hour, setHour] = useState(() => parseTime().h);
  const [minute, setMinute] = useState(() => parseTime().m);

  const openPicker = () => {
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

  // تغییر دستی دقیقه
  const changeMinute = (raw: string) => {
    const en = toEn(raw).replace(/\D/g, '');
    if (!en) { setMinute(0); return; }
    const n = parseInt(en);
    setMinute(Math.min(59, Math.max(0, n)));
  };

  const quickMinutes = [0, 15, 30, 45];

  return (
    <>
      <button
        type="button"
        onClick={openPicker}
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
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
          style={{ flexShrink: 0, color: 'var(--dim)' }}>
          <circle cx="12" cy="12" r="10" />
          <path d="M12 6v6l4 2" />
        </svg>
      </button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="انتخاب ساعت"
        footer={
          <div style={{ display: 'flex', flexDirection: 'row-reverse', gap: 8 }}>
            <Btn variant="primary" onClick={confirm}>تأیید</Btn>
            <Btn onClick={setNow}>الان</Btn>
            <Btn onClick={() => { onChange(''); setOpen(false); }}>پاک کردن</Btn>
          </div>
        }
      >
        {/* نمایش بزرگ */}
        <div style={{
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
          direction: 'ltr'
        }}>
          {toFa(String(hour).padStart(2, '0'))}:{toFa(String(minute).padStart(2, '0'))}
        </div>

        {/* ساعت — جمع‌وجور */}
        <div style={{
          fontSize: 'var(--fs-sm)', color: 'var(--muted)', fontWeight: 700,
          marginTop: 4, display: 'flex', justifyContent: 'space-between'
        }}>
          <span>ساعت</span>
          <span style={{ fontSize: 'var(--fs-xs)', fontWeight: 400 }}>انتخاب کنید</span>
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(6, 1fr)',
          gap: 4
        }}>
          {Array.from({ length: 24 }).map((_, h) => (
            <button
              key={h}
              onClick={() => setHour(h)}
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
                fontVariantNumeric: 'tabular-nums'
              }}
            >
              {toFa(String(h).padStart(2, '0'))}
            </button>
          ))}
        </div>

        {/* دقیقه — فیلد ورودی + دکمه‌های سریع */}
        <div style={{
          fontSize: 'var(--fs-sm)', color: 'var(--muted)', fontWeight: 700,
          marginTop: 10, display: 'flex', justifyContent: 'space-between'
        }}>
          <span>دقیقه</span>
          <span style={{ fontSize: 'var(--fs-xs)', fontWeight: 400 }}>تایپ یا از دکمه‌ها</span>
        </div>

        <div style={{ display: 'flex', gap: 6 }}>
          {/* فیلد ورودی دقیقه */}
          <div style={{
            flex: 1,
            height: 42,
            background: 'var(--input-bg)',
            border: '1px solid var(--accent-border)',
            borderRadius: 'var(--r-md)',
            padding: '0 12px',
            display: 'flex', alignItems: 'center', gap: 6,
            minWidth: 0
          }}>
            <span style={{ fontSize: 'var(--fs-lg)', color: 'var(--accent)', fontWeight: 700 }}>:</span>
            <input
              type="text"
              inputMode="numeric"
              dir="ltr"
              value={formatNumWhileTyping(String(minute))}
              onChange={e => changeMinute(e.target.value)}
              onFocus={e => e.target.select()}
              placeholder="۰۰"
              style={{
                flex: 1,
                minWidth: 0,
                background: 'none', border: 'none', outline: 'none',
                color: 'var(--accent)',
                fontFamily: 'inherit',
                fontSize: 20,
                fontWeight: 700,
                textAlign: 'center',
                fontVariantNumeric: 'tabular-nums'
              }}
            />
            <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--dim)' }}>دقیقه</span>
          </div>

          {/* دکمه‌های سریع */}
          {quickMinutes.map(m => (
            <button
              key={m}
              onClick={() => setMinute(m)}
              style={{
                width: 42, height: 42,
                background: minute === m ? 'var(--accent)' : 'var(--btn-bg)',
                border: `1px solid ${minute === m ? 'var(--accent)' : 'var(--border)'}`,
                borderRadius: 'var(--r-md)',
                color: minute === m ? 'var(--avatar-text)' : 'var(--muted)',
                fontFamily: 'inherit',
                fontSize: 'var(--fs-sm)',
                fontWeight: 700,
                cursor: 'pointer',
                fontVariantNumeric: 'tabular-nums',
                flexShrink: 0
              }}
            >
              {toFa(String(m).padStart(2, '0'))}
            </button>
          ))}
        </div>

        {/* راهنما */}
        <div style={{
          fontSize: 'var(--fs-xs)',
          color: 'var(--dim)',
          textAlign: 'center',
          marginTop: 2
        }}>
          هر عددی بین ۰۰ تا ۵۹ وارد کنید — مثلاً ۱۶
        </div>
      </Modal>
    </>
  );
}
