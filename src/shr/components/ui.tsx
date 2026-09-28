import React, { useEffect } from 'react';
import { formatNumWhileTyping, numberToWords, parseFaNum } from '../utils/fa';

type BtnVariant = 'primary' | 'ghost' | 'danger' | 'outline';
interface BtnProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: BtnVariant; size?: 'md' | 'sm'; full?: boolean;
}
export function Btn({ variant = 'ghost', size = 'md', full, style, children, ...rest }: BtnProps) {
  const variants: Record<BtnVariant, React.CSSProperties> = {
    primary: { background: 'var(--accent)', color: 'var(--avatar-text)' },
    ghost: { background: 'var(--btn-bg)', color: 'var(--muted)', border: '1px solid var(--border)' },
    danger: { background: 'var(--danger)', color: '#fff' },
    outline: { background: 'transparent', color: 'var(--accent)', border: '1.5px solid var(--accent-border)' }
  };
  return (
    <button {...rest} style={{
      height: size === 'sm' ? 32 : 38,
      padding: size === 'sm' ? '0 12px' : '0 16px',
      borderRadius: 'var(--r-md)', fontFamily: 'inherit',
      fontSize: size === 'sm' ? 'var(--fs-sm)' : 'var(--fs-base)',
      fontWeight: 600, cursor: 'pointer',
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
      width: full ? '100%' : undefined,
      ...variants[variant], ...style
    }}>{children}</button>
  );
}

export function BtnRow({ children }: { children: React.ReactNode }) {
  return <div style={{ display: 'flex', gap: 'var(--sp-2)' }}>{children}</div>;
}

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  unit?: string; error?: string; warn?: string;
  mode?: 'text' | 'number';
  showWords?: boolean;
  min?: number;
  max?: number;
  autoClamp?: boolean; // اگر true باشد، در همان تایپ محدود می‌کند
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function Input({ unit, error, warn, mode = 'text', showWords, min, max, autoClamp, style, value, onChange, onBlur, ...rest }: InputProps) {
  // اگر inputMode عددی بود، خودکار حالت number فعال شود
  const effectiveMode = mode === 'text' && rest.inputMode === 'numeric' ? 'number' : mode;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let v = e.target.value;
    if (effectiveMode === 'number') v = formatNumWhileTyping(v);
    if (autoClamp && (min !== undefined || max !== undefined) && v) {
      const n = parseFaNum(v);
      let cn = n;
      if (min !== undefined) cn = Math.max(min, cn);
      if (max !== undefined) cn = Math.min(max, cn);
      if (cn !== n) v = formatNumWhileTyping(String(cn));
    }
    if (onChange) {
      const fake = { ...e, target: { ...e.target, value: v } } as React.ChangeEvent<HTMLInputElement>;
      onChange(fake);
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    // در blur: اگر مقدار خارج از محدوده بود، اصلاح کن
    if ((min !== undefined || max !== undefined) && value) {
      const n = parseFaNum(String(value));
      let cn = n;
      if (min !== undefined) cn = Math.max(min, cn);
      if (max !== undefined) cn = Math.min(max, cn);
      if (cn !== n && onChange) {
        const fake = { ...e, target: { ...e.target, value: formatNumWhileTyping(String(cn)) } } as any;
        onChange(fake);
      }
    }
    if (onBlur) onBlur(e);
  };

  const show = showWords ?? (effectiveMode === 'number');
  let wordsText = '';
  if (show && value && value !== '') {
    const n = parseFaNum(value);
    // فقط برای اعداد بالا از ۱۰۰٬۰۰۰ نمایش داده شود
    if (n >= 100000) wordsText = numberToWords(n);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
      <div style={{
        width: '100%', minWidth: 0, height: 38,
        background: 'var(--input-bg)',
        border: `1px solid ${error ? 'var(--danger)' : warn ? 'var(--warn)' : 'var(--border)'}`,
        borderRadius: 'var(--r-md)', padding: '0 12px',
        display: 'flex', alignItems: 'center', gap: 8, overflow: 'hidden'
      }}>
        <input
          {...rest}
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          onFocus={e => {
            // auto-select محتوا با کلیک
            const t = e.target;
            if (!t.readOnly && !t.disabled) {
              setTimeout(() => t.select(), 0);
            }
          }}
          inputMode={effectiveMode === 'number' ? 'numeric' : rest.inputMode}
          style={{
            flex: '1 1 0%', width: '100%', minWidth: 0,
            background: 'none', border: 'none', outline: 'none',
            color: 'var(--text)', fontFamily: 'inherit', fontSize: 'var(--fs-base)',
            textOverflow: 'ellipsis', ...style
          }}
        />
        {unit && <span style={{ fontSize: 'var(--fs-sm)', color: 'var(--dim)', flexShrink: 0 }}>{unit}</span>}
      </div>
      {wordsText && (
        <div style={{
          fontSize: 'var(--fs-xs)', color: 'var(--accent)', fontWeight: 600,
          padding: '5px 10px', background: 'var(--accent-soft)',
          borderRadius: 'var(--r-sm)',
          display: 'flex', alignItems: 'center', gap: 6,
          border: '1px solid var(--accent-border)'
        }}>
          <span>💬</span><span>{wordsText}</span>
        </div>
      )}
      {error && <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--danger)' }}>✕ {error}</div>}
      {warn && !error && <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--warn)' }}>⚠ {warn}</div>}
    </div>
  );
}

export function Select({ children, style, ...rest }: React.SelectHTMLAttributes<HTMLSelectElement> & { children: React.ReactNode }) {
  return (
    <div style={{
      width: '100%', height: 38, background: 'var(--input-bg)',
      border: '1px solid var(--border)', borderRadius: 'var(--r-md)',
      padding: '0 12px', display: 'flex', alignItems: 'center', overflow: 'hidden'
    }}>
      <select {...rest} style={{
        flex: 1, width: '100%', minWidth: 0, background: 'none', border: 'none',
        outline: 'none', color: 'var(--text)', fontFamily: 'inherit',
        fontSize: 'var(--fs-base)', ...style
      }}>{children}</select>
    </div>
  );
}

interface FieldProps { label: string; required?: boolean; hint?: string; children: React.ReactNode; }
export function Field({ label, required, hint, children }: FieldProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5, minWidth: 0 }}>
      <label style={{ fontSize: 'var(--fs-sm)', color: 'var(--muted)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
        {label}{required && <span style={{ color: 'var(--danger)' }}>*</span>}
      </label>
      {children}
      {hint && <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--dim)' }}>{hint}</div>}
    </div>
  );
}

export function Grid2({ children }: { children: React.ReactNode }) {
  return <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: 'var(--sp-2)' }}>{children}</div>;
}
export function Grid3({ children }: { children: React.ReactNode }) {
  return <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr) minmax(0,1fr)', gap: 'var(--sp-2)' }}>{children}</div>;
}

interface CardProps {
  accent?: 'accent' | 'warn' | 'dim' | 'purple';
  onClick?: () => void; children: React.ReactNode; style?: React.CSSProperties;
}
export function Card({ accent = 'accent', onClick, children, style }: CardProps) {
  const colors = { accent: 'var(--accent)', warn: 'var(--warn)', dim: 'var(--dim)', purple: 'var(--purple)' };
  return (
    <div onClick={onClick} style={{
      position: 'relative', background: 'var(--card)', backdropFilter: 'blur(8px)',
      border: '1px solid var(--border)', borderRadius: 'var(--r-lg)',
      padding: 'var(--sp-3) var(--sp-4)', overflow: 'hidden',
      cursor: onClick ? 'pointer' : 'default', minWidth: 0, ...style
    }}>
      <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: 4, background: colors[accent] }} />
      {children}
    </div>
  );
}

export function Tag({ tone = 'gray', children }: { tone?: 'green'|'amber'|'red'|'blue'|'gray'|'purple'; children: React.ReactNode }) {
  const tones = {
    green: { bg: 'var(--accent-soft)', color: 'var(--accent)' },
    amber: { bg: 'var(--warn-soft)', color: 'var(--warn)' },
    red: { bg: 'var(--danger-soft)', color: 'var(--danger)' },
    blue: { bg: 'var(--info-soft)', color: 'var(--info)' },
    gray: { bg: 'var(--input-bg)', color: 'var(--muted)' },
    purple: { bg: 'var(--purple-soft)', color: 'var(--purple)' }
  };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      fontSize: 'var(--fs-xs)', fontWeight: 700, padding: '3px 8px', borderRadius: 6,
      background: tones[tone].bg, color: tones[tone].color
    }}>{children}</span>
  );
}

interface EmptyProps { icon: React.ReactNode; title: string; desc: string; action?: React.ReactNode; }
export function Empty({ icon, title, desc, action }: EmptyProps) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: '48px 20px', textAlign: 'center', gap: 12
    }}>
      <div style={{
        width: 64, height: 64, borderRadius: 'var(--r-xl)',
        background: 'var(--accent-soft)', color: 'var(--accent)',
        display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}>{icon}</div>
      <div style={{ fontSize: 'var(--fs-lg)', fontWeight: 700 }}>{title}</div>
      <div style={{ fontSize: 'var(--fs-base)', color: 'var(--muted)', lineHeight: 1.8, maxWidth: 280 }}>{desc}</div>
      {action}
    </div>
  );
}

interface ModalProps { open: boolean; onClose: () => void; title: string; children: React.ReactNode; footer?: React.ReactNode; }
export function Modal({ open, onClose, title, children, footer }: ModalProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (open) { document.addEventListener('keydown', onKey); document.body.style.overflow = 'hidden'; }
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div onClick={(e) => { if (e.target === e.currentTarget) onClose(); }} style={{
      position: 'fixed', inset: 0, background: 'var(--overlay)', zIndex: 100,
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center'
    }}>
      <div style={{
        background: 'var(--card-solid)', borderTopLeftRadius: 'var(--r-2xl)',
        borderTopRightRadius: 'var(--r-2xl)', width: '100%', maxWidth: 480, maxHeight: '90vh',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
        animation: 'pmSlideUp var(--dur-enter) var(--ease-out)'
      }}>
        <div style={{
          padding: '14px 20px', borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0
        }}>
          <div style={{ flex: 1, fontSize: 'var(--fs-lg)', fontWeight: 700 }}>{title}</div>
          <button onClick={onClose} style={{
            width: 32, height: 32, borderRadius: 'var(--r-md)',
            background: 'var(--btn-bg)', border: '1px solid var(--border)',
            color: 'var(--muted)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: 'inherit', fontSize: 14
          }}>✕</button>
        </div>
        <div style={{
          padding: '20px', overflowY: 'auto',
          display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)'
        }}>{children}</div>
        {footer && (
          <div style={{ padding: '12px 20px 24px', borderTop: '1px solid var(--border)', flexShrink: 0 }}>{footer}</div>
        )}
      </div>
    </div>
  );
}

export function PageContainer({ children }: { children: React.ReactNode }) {
  return <div style={{ padding: 'var(--sp-3)', display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>{children}</div>;
}

export function Chip({ active, onClick, children }: { active?: boolean; onClick?: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} style={{
      padding: '6px 11px', fontSize: 'var(--fs-sm)',
      background: active ? 'var(--accent-soft)' : 'var(--btn-bg)',
      border: `1px solid ${active ? 'var(--accent-border)' : 'var(--border)'}`,
      borderRadius: 'var(--r-sm)', color: active ? 'var(--accent)' : 'var(--muted)',
      fontWeight: active ? 600 : 500, cursor: 'pointer', fontFamily: 'inherit',
      display: 'inline-flex', alignItems: 'center', gap: 5
    }}>{children}</button>
  );
}
