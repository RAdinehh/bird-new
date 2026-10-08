/** components/ui/Input.tsx */
import React, { useRef, useEffect, useState } from 'react';
import { formatNumWhileTyping, numberToWords, parseFaNum } from '../../utils/fa';

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  unit?: string; error?: string; warn?: string;
  mode?: 'text' | 'number';
  showWords?: boolean;
  min?: number;
  max?: number;
  autoClamp?: boolean; // اگر true باشد، در همان تایپ محدود می‌کند
  integer?: boolean; // فقط عدد صحیح (بدون اعشار)
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
    if (effectiveMode === 'number') {
      // اگر integer بود، نقطه/اعشار رو حذف کن
      if ((rest as any).integer) {
        const dot = ['٫', '.', ',']; 
        for (const d of dot) v = v.split(d).join('');
      }
      v = formatNumWhileTyping(v);
    }
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
          fontSize: 10,
          color: 'var(--muted)',
          lineHeight: 1.3,
          marginTop: -2,
          paddingRight: 2,
        }}>
          {wordsText}
        </div>
      )}
      {error && <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--danger)' }}>✕ {error}</div>}
      {warn && !error && <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--warn)' }}>⚠ {warn}</div>}
    </div>
  );
}
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
  const inputMode = (props as any).integer ? 'numeric' : 'decimal';
  return <Input mode="number" dir="ltr" inputMode={inputMode} min={0} {...props} />;
}
export function PercentField(props: Omit<InputProps, 'mode' | 'dir' | 'inputMode' | 'unit' | 'min' | 'max'>) {
  return <Input mode="number" dir="ltr" inputMode="decimal" unit="٪" min={0} max={100} {...props} />;
}
interface TextareaProps extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'onChange'> {
  error?: string;
  warn?: string;
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  rows?: number;
  autoGrow?: boolean;
  minRows?: number;
  maxHeight?: number;
}
export function Textarea({ error, warn, style, rows = 2, autoGrow = true, minRows = 2, maxHeight = 180, ...rest }: TextareaProps) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const value = (rest as any).value;
  
  // auto-grow
  useEffect(() => {
    if (!autoGrow || !ref.current) return;
    const el = ref.current;
    el.style.height = 'auto';
    const lineHeight = 22;
    const padding = 20; // 10 top + 10 bottom
    const minH = minRows * lineHeight + padding;
    const newH = Math.min(maxHeight, Math.max(minH, el.scrollHeight));
    el.style.height = newH + 'px';
    el.style.overflowY = el.scrollHeight > maxHeight ? 'auto' : 'hidden';
  }, [value, autoGrow, minRows, maxHeight]);
  
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
      <textarea ref={ref} rows={rows} {...rest} style={{
        width: '100%', minWidth: 0,
        background: 'var(--input-bg)',
        border: '1px solid ' + (error ? 'var(--danger)' : warn ? 'var(--warn)' : 'var(--border)'),
        borderRadius: 'var(--r-md)', padding: '10px 12px',
        color: 'var(--text)', fontFamily: 'inherit',
        fontSize: 'var(--fs-base)', outline: 'none',
        resize: 'none',
        overflowY: 'hidden',
        transition: 'height .1s',
        boxSizing: 'border-box',
        lineHeight: 1.55,
        ...style
      }} />
      {error && <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--danger)' }}>✕ {error}</div>}
      {warn && !error && <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--warn)' }}>⚠ {warn}</div>}
    </div>
  );
}
