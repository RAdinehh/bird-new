/**
 * OverridableField.tsx — فیلد استاندارد قابل تغییر
 *
 * طبق تنظیمات کاربر (units.numberFormat):
 *   - fa: اعداد فارسی با جداکننده هزار
 *   - en: اعداد انگلیسی
 *
 * طراحی:
 *   ✅ بدون ✏️ — فیلد مستقیم قابل ویرایش
 *   ✅ نمایش طبق تنظیم کاربر
 *   ✅ ورودی قبول هر دو فارسی/انگلیسی
 *   ✅ زرد + متن «تغییر یافته» وقتی override
 *   ✅ دکمه 🔄 سمت چپ (فقط وقتی تغییر کرده)
 */
import { useState, useEffect } from 'react';
import { useFormat } from '../../../../../shr/units/useFormat';

interface Props {
  label: string;
  value: any;
  defaultValue: any;
  onOverride: (v: any) => void;
  onClear: () => void;
  type?: 'number' | 'text';
  unit?: string;
  placeholder?: string;
  min?: number;
  max?: number;
}

const FA_DIGITS = '۰۱۲۳۴۵۶۷۸۹';

function toEnDigits(text: string): string {
  return text
    .replace(/[۰-۹]/g, d => String(FA_DIGITS.indexOf(d)))
    .replace(/[٬,،]/g, '')
    .replace(/٫/g, '.');
}

function parseNum(text: string): number | null {
  if (!text || !text.trim()) return null;
  const en = toEnDigits(text).replace(/[^\d.-]/g, '');
  if (!en) return null;
  const n = parseFloat(en);
  return isNaN(n) ? null : n;
}

export default function OverridableField({
  label, value, defaultValue, onOverride, onClear,
  type = 'number', unit, placeholder, min, max,
}: Props) {
  const fmt = useFormat();

  // آیا override فعاله؟
  const hasOverride = JSON.stringify(value) !== JSON.stringify(defaultValue);

  // نمایش مقدار طبق تنظیم کاربر
  const displayValue = (() => {
    if (value == null || value === '') return '';
    if (type === 'number' && typeof value === 'number') {
      return fmt.int(value);  // 🆕 از تنظیمات کاربر استفاده می‌کنه
    }
    return String(value);
  })();

  const displayDefault = (() => {
    if (defaultValue == null || defaultValue === '') return '—';
    if (type === 'number' && typeof defaultValue === 'number') {
      return fmt.int(defaultValue);
    }
    return String(defaultValue);
  })();

  const [draft, setDraft] = useState(displayValue);
  const [focused, setFocused] = useState(false);

  // وقتی value از بیرون عوض شد، draft رو آپدیت کن (فقط وقتی فوکوس نیست)
  useEffect(() => {
    if (!focused) setDraft(displayValue);
  }, [value, focused, displayValue]);

  // ذخیره هنگام blur یا Enter
  const commit = () => {
    setFocused(false);
    if (type === 'number') {
      const n = parseNum(draft);
      if (n === null) {
        if (hasOverride) onClear();
        setDraft(defaultValue == null ? '' : fmt.int(defaultValue));
      } else {
        let final = n;
        if (min !== undefined && final < min) final = min;
        if (max !== undefined && final > max) final = max;
        if (final !== defaultValue) {
          onOverride(final);
          setDraft(fmt.int(final));
        } else {
          if (hasOverride) onClear();
          setDraft(fmt.int(final));
        }
      }
    } else {
      const v = draft.trim();
      if (!v) {
        if (hasOverride) onClear();
      } else if (v !== defaultValue) {
        onOverride(v);
      } else if (hasOverride) {
        onClear();
      }
    }
  };

  const reset = () => {
    onClear();
    const v = defaultValue == null ? '' : (type === 'number' && typeof defaultValue === 'number' ? fmt.int(defaultValue) : String(defaultValue));
    setDraft(v);
    setFocused(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0 }}>
      {/* Label + دکمه بازگشت */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, minHeight: 18 }}>
        <span style={{
          fontSize: 11.5, color: 'var(--muted)', fontWeight: 600,
          flex: 1, textAlign: 'right',
        }}>{label}</span>

        {hasOverride && (
          <button
            type="button"
            onClick={reset}
            title={`بازگشت به استاندارد (${displayDefault})`}
            aria-label="بازگشت به استاندارد"
            style={{
              width: 44, height: 44,
              marginInline: -11, marginBlock: -11,
              background: 'transparent',
              border: 'none',
              color: 'var(--warn)',
              cursor: 'pointer',
              fontFamily: 'inherit',
              fontSize: 13,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 0,
              flexShrink: 0,
            }}
          >🔄</button>
        )}
      </div>

      {/* Input */}
      <div style={{ position: 'relative' }}>
        <input
          type="text"
          inputMode={type === 'number' ? 'decimal' : 'text'}
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={commit}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              e.preventDefault();
              commit();
              // Enter → برو فیلد بعدی
              const form = (e.target as HTMLElement).closest('[data-fields-group]') || document.body;
              const inputs = Array.from(form.querySelectorAll('input:not([type="hidden"])')) as HTMLElement[];
              const idx = inputs.indexOf(e.target as HTMLElement);
              if (idx >= 0 && idx + 1 < inputs.length) {
                inputs[idx + 1].focus();
              } else {
                (e.target as HTMLInputElement).blur();
              }
            } else if (e.key === 'Escape') {
              setDraft(displayValue);
              (e.target as HTMLInputElement).blur();
            }
          }}
          placeholder={placeholder || (defaultValue != null ? displayDefault : '')}
          style={{
            width: '100%',
            height: 38,
            padding: unit ? '0 45px 0 12px' : '0 12px',
            background: hasOverride ? 'var(--warn-soft, #fef3c7)' : 'var(--input-bg)',
            border: '1px solid ' + (hasOverride ? 'var(--warn)' : (focused ? 'var(--accent)' : 'var(--border)')),
            borderRadius: 'var(--r-md)',
            color: hasOverride ? 'var(--warn)' : 'var(--text)',
            fontFamily: 'inherit',
            fontSize: 'var(--fs-base)',
            fontWeight: hasOverride ? 700 : 600,
            textAlign: 'center',
            outline: 'none',
            boxSizing: 'border-box',
            direction: 'rtl',
            transition: 'background .15s ease, border-color .15s ease',
          }}
        />
        {unit && (
          <span style={{
            position: 'absolute',
            right: 12,
            top: '50%',
            transform: 'translateY(-50%)',
            fontSize: 11,
            color: hasOverride ? 'var(--warn)' : 'var(--muted)',
            pointerEvents: 'none',
            fontWeight: 500,
          }}>{unit}</span>
        )}
      </div>

      {/* پیام تغییر */}
      {hasOverride && (
        <div style={{
          fontSize: 10,
          color: 'var(--warn)',
          fontWeight: 600,
          paddingRight: 4,
          lineHeight: 1.4,
        }}>
          تغییر یافته · استاندارد: {displayDefault}{unit ? ' ' + unit : ''}
        </div>
      )}
    </div>
  );
}
