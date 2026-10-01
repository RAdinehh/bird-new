declare global {
  interface Window {
    __modalDepth?: number;
  }
}

import React, {useRef, useCallback, useEffect, forwardRef} from 'react';
import { createPortal } from 'react-dom';
import { formatNumWhileTyping, numberToWords, parseFaNum } from '../utils/fa';

type BtnVariant = 'primary' | 'ghost' | 'danger' | 'outline';
interface BtnProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: BtnVariant;
  size?: 'md' | 'sm';
  full?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
}
export const Btn = forwardRef<HTMLButtonElement, BtnProps>(({  variant = 'ghost', size = 'md', full, style, children, icon, loading, disabled, ...rest  }, ref) => {
  const variants: Record<BtnVariant, React.CSSProperties> = {
    primary: { background: 'var(--accent)', color: 'var(--avatar-text)' },
    ghost: { background: 'var(--btn-bg)', color: 'var(--muted)', border: '1px solid var(--border)' },
    danger: { background: 'var(--danger)', color: '#fff' },
    outline: { background: 'transparent', color: 'var(--accent)', border: '1.5px solid var(--accent-border)' }
  };
  const isDisabled = disabled || loading;
  return (
    <button ref={ref} {...rest} disabled={isDisabled} style={{
      height: size === 'sm' ? 32 : 38,
      padding: size === 'sm' ? '0 12px' : '0 16px',
      borderRadius: 'var(--r-md)', fontFamily: 'inherit',
      fontSize: size === 'sm' ? 'var(--fs-sm)' : 'var(--fs-base)',
      fontWeight: 600,
      cursor: isDisabled ? 'not-allowed' : 'pointer',
      opacity: isDisabled ? 0.55 : 1,
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
      width: full ? '100%' : undefined,
      ...variants[variant], ...style
    }}>
      {loading ? <span style={{ display: 'inline-flex' }}>⏳</span> : icon ? <span style={{ display: 'inline-flex' }}>{icon}</span> : null}
      {children}
    </button>
  );
});
Btn.displayName = 'Btn';

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

  // Local editing state — preserves what user types (esp. decimal separator)
  const [isEditing, setIsEditing] = React.useState(false);
  const [localValue, setLocalValue] = React.useState<string>('');
  const parentValueStr = (value === undefined || value === null) ? '' : String(value);
  const displayValue = isEditing ? localValue : parentValueStr;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let v = e.target.value;
    if (effectiveMode === 'number') v = formatNumWhileTyping(v);
    setLocalValue(v);
    if (autoClamp && (min !== undefined || max !== undefined) && v) {
      const n = parseFaNum(v);
      let cn = n;
      if (min !== undefined) cn = Math.max(min, cn);
      if (max !== undefined) cn = Math.min(max, cn);
      if (cn !== n) { v = formatNumWhileTyping(String(cn)); setLocalValue(v); }
    }
    if (onChange) {
      const fake = { ...e, target: { ...e.target, value: v } } as React.ChangeEvent<HTMLInputElement>;
      onChange(fake);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') return;
    e.preventDefault();

    // همه فیلدهای قابل فوکوس
    const all = Array.from(
      document.querySelectorAll<HTMLElement>(
        'input:not([disabled]):not([readonly]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), button:not([disabled])'
      )
    ).filter(el => {
      // visible check
      if (!el.offsetParent && el.offsetWidth === 0) return false;
      // تو modal‌های بسته نباشه
      const style = window.getComputedStyle(el);
      if (style.display === 'none' || style.visibility === 'hidden') return false;
      return true;
    });

    const current = e.currentTarget;
    const idx = all.indexOf(current);

    if (idx >= 0 && idx < all.length - 1) {
      all[idx + 1].focus();
    } else {
      current.blur();
    }
  };

  const handleFocus = (_e: React.FocusEvent<HTMLInputElement>) => {
    setIsEditing(true);
    setLocalValue(parentValueStr);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsEditing(false);
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
        <input enterKeyHint="next" onKeyDown={handleKeyDown}           dir={(rest as any).dir || undefined}
          {...rest}
          value={displayValue}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          inputMode={rest.inputMode || (effectiveMode === 'number' ? 'decimal' : undefined)}
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
      position: 'relative', background: 'var(--card)',
      border: '1px solid var(--border)', borderRadius: 'var(--r-lg)',
      padding: 'var(--sp-3) var(--sp-4)', overflow: 'hidden',
      cursor: onClick ? 'pointer' : 'default', minWidth: 0, ...style
    }}>
      <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: 4, background: colors[accent] }} />
      {children}
    </div>
  );
}

export function Tag({
  tone = 'gray',
  children,
}: {
  tone?: 'green' | 'amber' | 'red' | 'blue' | 'gray' | 'purple' | 'accent' | 'warn' | 'danger' | 'info' | 'dim';
  children: React.ReactNode;
}) {
  const tones: Record<string, { bg: string; color: string }> = {
    green: { bg: 'var(--accent-soft)', color: 'var(--accent)' },
    accent: { bg: 'var(--accent-soft)', color: 'var(--accent)' },
    amber: { bg: 'var(--warn-soft)', color: 'var(--warn)' },
    warn: { bg: 'var(--warn-soft)', color: 'var(--warn)' },
    red: { bg: 'var(--danger-soft)', color: 'var(--danger)' },
    danger: { bg: 'var(--danger-soft)', color: 'var(--danger)' },
    blue: { bg: 'var(--info-soft)', color: 'var(--info)' },
    info: { bg: 'var(--info-soft)', color: 'var(--info)' },
    gray: { bg: 'var(--input-bg)', color: 'var(--muted)' },
    dim: { bg: 'var(--input-bg)', color: 'var(--dim)' },
    purple: { bg: 'var(--purple-soft)', color: 'var(--purple)' },
  };
  const t = tones[tone] || tones.gray;
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        fontSize: 'var(--fs-xs)',
        fontWeight: 700,
        padding: '3px 8px',
        borderRadius: 'var(--r-sm)',
        background: t.bg,
        color: t.color,
        whiteSpace: 'nowrap',
        lineHeight: 1.5,
      }}
    >
      {children}
    </span>
  );
}

interface EmptyProps {
  icon: React.ReactNode;
  title: string;
  desc: string;
  action?: React.ReactNode;
  tone?: 'accent' | 'warn' | 'info' | 'danger';
}

export function Empty({ icon, title, desc, action, tone = 'accent' }: EmptyProps) {
  const toneBg: Record<string, string> = {
    accent: 'var(--accent-soft)',
    warn: 'var(--warn-soft)',
    info: 'var(--info-soft)',
    danger: 'var(--danger-soft)',
  };
  const toneColor: Record<string, string> = {
    accent: 'var(--accent)',
    warn: 'var(--warn)',
    info: 'var(--info)',
    danger: 'var(--danger)',
  };

  return (
    <div
      role="status"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 20px',
        textAlign: 'center',
        gap: 12,
      }}
    >
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: 'var(--r-xl)',
          background: toneBg[tone],
          color: toneColor[tone],
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
        aria-hidden="true"
      >
        {icon}
      </div>
      <div style={{ fontSize: 'var(--fs-lg)', fontWeight: 700 }}>{title}</div>
      <div
        style={{
          fontSize: 'var(--fs-base)',
          color: 'var(--muted)',
          lineHeight: 1.8,
          maxWidth: 280,
        }}
      >
        {desc}
      </div>
      {action}
    </div>
  );
}

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  preventClose?: boolean;
}

const MODAL_SIZES: Record<'sm' | 'md' | 'lg', number> = {
  sm: 320,
  md: 480,
  lg: 640,
};

export function Modal({
  open, onClose, title, children, footer,
  size = 'md', preventClose = false,
}: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);
  const focusedRef = useRef(false);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const preventCloseRef = useRef(preventClose);
  preventCloseRef.current = preventClose;
  const titleId = useRef<string>('modal-title-' + Math.random().toString(36).slice(2, 9));

  // ─── Snap / drag (mobile bottom-sheet) ───
  const [snap, setSnap] = React.useState<'partial' | 'full'>('partial');
  const [dragY, setDragY] = React.useState(0);
  const [dragging, setDragging] = React.useState(false);
  const dragActive = useRef(false);
  const dragStartY = useRef(0);
  const dragLastY = useRef(0);
  const dragStartT = useRef(0);
  const rafRef = useRef(0);

  React.useEffect(() => {
    if (open) { setSnap('partial'); setDragY(0); setDragging(false); if (modalRef.current) modalRef.current.style.transform = ''; }
  }, [open]);

  const onDragStart = (e: React.TouchEvent) => {
    dragActive.current = true;
    dragStartY.current = e.touches[0].clientY;
    dragLastY.current = 0;
    dragStartT.current = Date.now();
    if (modalRef.current) modalRef.current.style.transition = 'none';
  };
  const onDragMove = (e: React.TouchEvent) => {
    if (!dragActive.current) return;
    const touchY = e.touches[0].clientY;
    const min = snap === 'full' ? 0 : -240;
    const dy = Math.max(min, Math.min(560, touchY - dragStartY.current));
    dragLastY.current = dy;
    if (rafRef.current) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = 0;
      if (modalRef.current) {
        modalRef.current.style.transform = `translateY(${dragLastY.current}px)`;
      }
    });
  };
  const onDragEnd = () => {
    if (!dragActive.current) return;
    dragActive.current = false;
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = 0; }
    const dy = dragLastY.current;
    const dt = Math.max(1, Date.now() - dragStartT.current);
    const v = dy / dt;
    const fast = Math.abs(v) > 0.5;
    const el = modalRef.current;
    if (!el) return;

    if (snap === 'partial') {
      if (dy < -60 || (fast && v < -0.4)) {
        setSnap('full');
        el.style.transition = 'transform 300ms cubic-bezier(.2,.9,.3,1)';
        el.style.transform = '';
        return;
      }
      if (dy > 110 || (fast && v > 0.5)) {
        el.style.transition = 'transform 240ms ease-out';
        el.style.transform = `translateY(${window.innerHeight}px)`;
        setTimeout(() => {
          if (!preventCloseRef.current) onCloseRef.current();
        }, 240);
        return;
      }
    } else {
      if (dy > 60 || (fast && v > 0.4)) {
        setSnap('partial');
        el.style.transition = 'transform 300ms cubic-bezier(.2,.9,.3,1)';
        el.style.transform = '';
        return;
      }
    }
    el.style.transition = 'transform 300ms cubic-bezier(.2,.9,.3,1)';
    el.style.transform = '';
  };

  // Esc + body scroll lock + focus return
  useEffect(() => {
    if (!open) return;
    window.__modalDepth = (window.__modalDepth || 0) + 1;

    previousFocus.current = document.activeElement as HTMLElement;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !preventCloseRef.current) {
        onCloseRef.current();
      }
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';

    // autofocus فقط بار اول
    if (!focusedRef.current) {
      focusedRef.current = true;
      setTimeout(() => {
        // ۱. ترجیح: input/textarea/select
        let target = modalRef.current?.querySelector(
          'input:not([type="hidden"]):not([disabled]), textarea:not([disabled]), select:not([disabled])'
        ) as HTMLElement | null;
        
        // ۲. اگه input نبود، آخرین دکمه (معمولاً confirm در footer)
        // این روش X (که اول Modal هست) رو skip می‌کنه
        if (!target) {
          const btns = modalRef.current?.querySelectorAll('button:not([disabled])');
          if (btns && btns.length > 0) {
            // از آخر به اول — footer buttons معمولاً آخرین‌ها هستن
            for (let i = btns.length - 1; i >= 0; i--) {
              const btn = btns[i] as HTMLElement;
              const text = (btn.textContent || '').trim();
              const aria = btn.getAttribute('aria-label') || '';
              // skip X (✕، ×، X، آیکون بستن)
              const isClose = /^[✕×xX]$/.test(text) 
                || aria.includes('بستن') 
                || aria.includes('close')
                || aria.includes('Close');
              if (!isClose) {
                target = btn;
                break;
              }
            }
          }
        }
        target?.focus();
      }, 100);
    }

    return () => {
      window.__modalDepth = Math.max(0, (window.__modalDepth || 0) - 1);
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
      // برگشت focus
      try {
        previousFocus.current?.focus();
      } catch {
        /* silent */
      }
    };
  }, [open]);

  // Focus trap: Tab / Shift+Tab
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key !== 'Tab') return;
    const focusables = modalRef.current?.querySelectorAll(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    if (!focusables || focusables.length === 0) return;

    const first = focusables[0] as HTMLElement;
    const last = focusables[focusables.length - 1] as HTMLElement;
    const active = document.activeElement;

    if (e.shiftKey) {
      if (active === first) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (active === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }, []);

  // تشخیص prefers-reduced-motion
  const [prefersReduced, setPrefersReduced] = React.useState(false);
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
  const noAnim = prefersReduced;

  if (!open) return null;

  const maxWidth = MODAL_SIZES[size] || MODAL_SIZES.md;
  const isFull = snap === 'full';

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget && !preventClose) onClose();
      }}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'var(--overlay)',
        zIndex: 100 + (window.__modalDepth || 0),
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
      }}
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId.current}
        onKeyDown={handleKeyDown}
        style={{
          background: 'var(--card-solid)',
          borderTopLeftRadius: isFull ? 0 : 'var(--r-2xl)',
          borderTopRightRadius: isFull ? 0 : 'var(--r-2xl)',
          boxSizing: 'border-box',
          paddingTop: 'env(safe-area-inset-top, 0px)',
          width: '100%',
          maxWidth,
          maxHeight: isFull ? '100%' : '85vh',
          height: isFull ? '100%' : undefined,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          transition: 'max-height 320ms cubic-bezier(.2,.9,.3,1), height 320ms cubic-bezier(.2,.9,.3,1), border-radius 220ms ease, transform 300ms cubic-bezier(.2,.9,.3,1)',
        }}
      >
        {/* Drag handle (فقط موبایل) */}
        <div
          onTouchStart={onDragStart}
          onTouchMove={onDragMove}
          onTouchEnd={onDragEnd}
          onTouchCancel={onDragEnd}
          style={{
            padding: '14px 0 10px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            cursor: 'grab',
            touchAction: 'none',
            userSelect: 'none',
            WebkitUserSelect: 'none',
            flexShrink: 0,
          }}
        >
          <div style={{
            width: 48, height: 5, borderRadius: 3,
            background: 'var(--border)',
          }} />
        </div>
        {/* Header */}
        <div
          style={{
            padding: 'calc(10px + env(safe-area-inset-top)) 14px 10px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            flexShrink: 0,
          }}
        >
          <div
            id={titleId.current}
            style={{ flex: 1, fontSize: 'var(--fs-lg)', fontWeight: 700 }}
          >
            {title}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="بستن"
            style={{
              width: 32,
              height: 32,
              borderRadius: 'var(--r-md)',
              background: 'var(--btn-bg)',
              border: '1px solid var(--border)',
              color: 'var(--muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: 'inherit',
              fontSize: 14,
              outline: 'none',
            }}
            onFocus={(e) => {
              e.currentTarget.style.boxShadow = '0 0 0 2px var(--accent-soft)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div
          style={{
            padding: '0 14px 14px 14px',
            overflowY: 'auto',
            overscrollBehavior: 'contain',
            WebkitOverflowScrolling: 'touch',
            flex: 1,
            minHeight: 0,
          }}
        >
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div
            style={{
              padding: '10px 14px 18px',
              borderTop: '1px solid var(--border)',
              flexShrink: 0,
            }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

export function PageContainer({ children }: { children: React.ReactNode }) {
  return <div style={{ padding: 'var(--sp-3)', display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)' }}>{children}</div>;
}

export function Chip({
  active,
  onClick,
  children,
  tone = 'accent',
}: {
  active?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
  tone?: 'accent' | 'warn' | 'danger' | 'info' | 'purple';
}) {
  const activeBg: Record<string, string> = {
    accent: 'var(--accent-soft)',
    warn: 'var(--warn-soft)',
    danger: 'var(--danger-soft)',
    info: 'var(--info-soft)',
    purple: 'var(--purple-soft)',
  };
  const activeBorder: Record<string, string> = {
    accent: 'var(--accent-border)',
    warn: 'var(--warn)',
    danger: 'var(--danger)',
    info: 'var(--info)',
    purple: 'var(--purple)',
  };
  const activeColor: Record<string, string> = {
    accent: 'var(--accent)',
    warn: 'var(--warn)',
    danger: 'var(--danger)',
    info: 'var(--info)',
    purple: 'var(--purple)',
  };

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      style={{
        padding: '6px 11px',
        fontSize: 'var(--fs-sm)',
        background: active ? activeBg[tone] : 'var(--btn-bg)',
        border: '1px solid ' + (active ? activeBorder[tone] : 'var(--border)'),
        borderRadius: 'var(--r-sm)',
        color: active ? activeColor[tone] : 'var(--muted)',
        fontWeight: active ? 600 : 500,
        cursor: 'pointer',
        fontFamily: 'inherit',
        whiteSpace: 'nowrap',
        outline: 'none',
      }}
      onFocus={(e) => {
        e.currentTarget.style.boxShadow = '0 0 0 2px var(--accent-soft)';
      }}
      onBlur={(e) => {
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      {children}
    </button>
  );
}

// ═══════════════════════════════════════════
// فاز ۰.۹ — کامپوننت‌های تقویتی
// ═══════════════════════════════════════════

export function MoneyField({ value, ...props }: Omit<InputProps, 'mode' | 'dir' | 'inputMode' | 'unit' | 'min' | 'showWords'>) {
  const displayValue = value !== undefined && value !== null && String(value) !== ''
    ? formatNumWhileTyping(String(value))
    : '';
  return <Input mode="number" dir="ltr" inputMode="numeric" unit="تومان" min={0} showWords autoClamp value={displayValue} {...props} />;
}

export function PhoneField({ maxLength = 11, ...props }: Omit<InputProps, 'unit' | 'inputMode'> & { maxLength?: number }) {
  return <Input dir="ltr" inputMode="numeric" maxLength={maxLength} {...props} />;
}

export function DigitField({ maxLength, ...props }: Omit<InputProps, 'unit' | 'inputMode' | 'mode' | 'min' | 'max'> & { maxLength: number }) {
  return <Input dir="ltr" inputMode="numeric" maxLength={maxLength} {...props} />;
}

export function NumField(props: Omit<InputProps, 'mode' | 'dir' | 'inputMode'>) {
  return <Input mode="number" dir="ltr" inputMode="decimal" min={0} {...props} />;
}

export function PercentField(props: Omit<InputProps, 'mode' | 'dir' | 'inputMode' | 'unit' | 'min' | 'max'>) {
  return <Input mode="number" dir="ltr" inputMode="decimal" unit="٪" min={0} max={100} {...props} />;
}


interface TextareaProps extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'onChange'> {
  error?: string;
  warn?: string;
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
}

export function Textarea({ error, warn, style, rows = 3, ...rest }: TextareaProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
      <textarea rows={rows} {...rest} style={{
        width: '100%', minWidth: 0, minHeight: 80,
        background: 'var(--input-bg)',
        border: '1px solid ' + (error ? 'var(--danger)' : warn ? 'var(--warn)' : 'var(--border)'),
        borderRadius: 'var(--r-md)', padding: '10px 12px',
        color: 'var(--text)', fontFamily: 'inherit',
        fontSize: 'var(--fs-base)', outline: 'none',
        resize: 'vertical', ...style
      }} />
      {error && <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--danger)' }}>✕ {error}</div>}
      {warn && !error && <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--warn)' }}>⚠ {warn}</div>}
    </div>
  );
}

export function Checkbox({ checked, onChange, label, disabled, ariaLabel }: {
  checked: boolean; onChange: (v: boolean) => void;
  label?: string; disabled?: boolean; ariaLabel?: string;
}) {
  return (
    <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8,
      cursor: disabled ? 'not-allowed' : 'pointer',
      opacity: disabled ? 0.55 : 1, userSelect: 'none' }}>
      <input type="checkbox" checked={checked}
        onChange={e => onChange(e.target.checked)} disabled={disabled}
        aria-label={ariaLabel || label}
        style={{ width: 18, height: 18, accentColor: 'var(--accent)',
          cursor: disabled ? 'not-allowed' : 'pointer', margin: 0 }} />
      {label && <span style={{ fontSize: 'var(--fs-base)', color: 'var(--text)' }}>{label}</span>}
    </label>
  );
}

export function RadioGroup<T extends string | number>({
  value, onChange, options, direction = 'column', disabled, name
}: {
  value: T; onChange: (v: T) => void;
  options: { value: T; label: string }[];
  direction?: 'row' | 'column'; disabled?: boolean; name?: string;
}) {
  const groupName = name || 'radio-' + Math.random().toString(36).slice(2, 8);
  return (
    <div role="radiogroup" style={{ display: 'flex',
      flexDirection: direction === 'row' ? 'row' : 'column',
      gap: direction === 'row' ? 16 : 8, flexWrap: 'wrap' }}>
      {options.map(opt => (
        <label key={String(opt.value)} style={{ display: 'inline-flex',
          alignItems: 'center', gap: 8,
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.55 : 1, userSelect: 'none' }}>
          <input type="radio" name={groupName} value={String(opt.value)}
            checked={value === opt.value} onChange={() => onChange(opt.value)}
            disabled={disabled}
            style={{ width: 18, height: 18, accentColor: 'var(--accent)',
              cursor: disabled ? 'not-allowed' : 'pointer', margin: 0 }} />
          <span style={{ fontSize: 'var(--fs-base)', color: 'var(--text)' }}>{opt.label}</span>
        </label>
      ))}
    </div>
  );
}


export function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ paddingTop: 10, marginTop: 4, borderTop: '1px dashed var(--border)', fontSize: 'var(--fs-sm)', fontWeight: 700, color: 'var(--muted)' }}>{children}</div>
  );
}

/** ErrorBox — نمایش خطا با کادر قرمز */
export function ErrorBox({ children }: { children: React.ReactNode }) {
  if (!children) return null;
  return (
    <div style={{
      padding: '8px 12px',
      background: 'var(--danger-soft)',
      border: '1px solid var(--danger)',
      borderRadius: 'var(--r-md)',
      color: 'var(--danger)',
      fontSize: 'var(--fs-sm)',
      fontWeight: 600,
      display: 'flex',
      alignItems: 'center',
      gap: 8,
    }}>
      <span style={{ fontSize: 16, flexShrink: 0 }}>⚠️</span>
      <span style={{ flex: 1 }}>{children}</span>
    </div>
  );
}


/** DeleteBtn — دکمه حذف استاندارد (44×44 touch target) */
export function DeleteBtn({ onClick, title = 'حذف', size = 'md' }: {
  onClick: () => void; title?: string; size?: 'sm' | 'md';
}) {
  const dim = size === 'sm' ? 44 : 44;
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={title}
      style={{
        background: 'var(--danger-soft)',
        border: '1px solid var(--danger)',
        color: 'var(--danger)',
        cursor: 'pointer',
        borderRadius: 'var(--r-sm)',
        width: dim,
        height: dim,
        minWidth: dim,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: size === 'sm' ? 11 : 13,
        lineHeight: 1,
        padding: 0,
        flexShrink: 0,
        fontFamily: 'inherit',
        fontWeight: 700,
      }}
    >
      ✕
    </button>
  );
}


/* ═══════════════════════════════════════════════════════════════
   Sheet — پاپ‌آپ کوچک از پایین صفحه
   با createPortal روی body رندر میشه، پس داخل گروه‌ها گیر نمی‌کنه
   ═══════════════════════════════════════════════════════════════ */
export function Sheet({
  open, onClose, title, footer, children,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  footer?: React.ReactNode;
  children: React.ReactNode;
}) {
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(15,23,42,.45)',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 420,
          background: 'var(--card-solid, #fff)',
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          padding: '10px 14px 18px',
          boxShadow: '0 -8px 30px rgba(0,0,0,.25)',
          maxHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'center', padding: '2px 0 4px' }}>
          <div style={{ width: 40, height: 4, borderRadius: 2, background: 'var(--dim)', opacity: 0.5 }} />
        </div>
        {title ? (
          <div style={{ fontSize: 'var(--fs-md)', fontWeight: 700, textAlign: 'right', paddingBottom: 2 }}>
            {title}
          </div>
        ) : null}
        <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 6, minHeight: 0 }}>
          {children}
        </div>
        {footer ? <div style={{ paddingTop: 4 }}>{footer}</div> : null}
      </div>
    </div>,
    document.body
  );
}
