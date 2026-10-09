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
import { intRange, intNonNeg, floatRange, floatNonNeg, requiredStr } from '../../../../../shr/validation/helpers';

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
  /** 🆕 بدون جداکننده هزار (برای سال، کد و ...) */
  noSeparator?: boolean;
  /** 🆕 تعداد اعشار (پیش‌فرض ۰ = عدد صحیح) */
  decimals?: number;
}

const FA_DIGITS = '۰۱۲۳۴۵۶۷۸۹';

function toEnDigits(text: string): string {
  return text
    .replace(/[۰-۹]/g, d => String(FA_DIGITS.indexOf(d)))
    .replace(/[٬,،]/g, '')
    .replace(/٫/g, '.');
}

function buildSchema(type: 'number' | 'text', label: string, min?: number, max?: number) {
  if (type === 'text') {
    return requiredStr(label, 1, 500);
  }
  // نوع عددی — انتخاب بین int/float
  const isFloat = (min !== undefined && !Number.isInteger(min)) || (max !== undefined && !Number.isInteger(max));
  const maxVal = max ?? 1000000;

  if (isFloat) {
    if (min !== undefined && min > 0) return floatRange(label, min, maxVal);
    return floatNonNeg(label, maxVal);
  }
  // صحیح
  if (min !== undefined && min > 0) return intRange(label, min, maxVal);
  return intNonNeg(label, maxVal);
}

export default function OverridableField({
  label, value, defaultValue, onOverride, onClear,
  type = 'number', unit, placeholder, min, max, noSeparator = false, decimals = 0,
}: Props) {
  const fmt = useFormat();

  /** 🆕 فرمت‌کننده با پشتیبانی از decimals */
  const fmtValue = (v: number) => {
    if (noSeparator) {
      return String(v).replace(/[0-9]/g, d => '۰۱۲۳۴۵۶۷۸۹'[+d]);
    }
    return decimals > 0 ? fmt.num(v, { decimals }) : fmt.int(v);
  };

  // آیا override فعاله؟
  const hasOverride = JSON.stringify(value) !== JSON.stringify(defaultValue);

  // نمایش مقدار طبق تنظیم کاربر
  const displayValue = (() => {
    if (value == null || value === '') return '';
    if (type === 'number' && typeof value === 'number') {
      return fmtValue(value);
    }
    return String(value);
  })();

  const displayDefault = (() => {
    if (defaultValue == null || defaultValue === '') return '—';
    if (type === 'number' && typeof defaultValue === 'number') {
      return fmtValue(defaultValue);
    }
    return String(defaultValue);
  })();

  const [draft, setDraft] = useState(displayValue);
  const [focused, setFocused] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // وقتی value از بیرون عوض شد، draft رو آپدیت کن (فقط وقتی فوکوس نیست)
  useEffect(() => {
    if (!focused) setDraft(displayValue);
  }, [value, focused, displayValue]);

  // ذخیره هنگام blur یا Enter — با Zod
  const commit = () => {
    setFocused(false);
    setError(null);

    // خالی → برگشت به استاندارد
    if (!draft || !draft.trim()) {
      if (hasOverride) onClear();
      setDraft(defaultValue == null ? '' : (type === 'number' && typeof defaultValue === 'number' ? fmtValue(defaultValue) : String(defaultValue)));
      return;
    }

    const schema = buildSchema(type, label, min, max);
    const input = type === 'number' ? toEnDigits(draft) : draft.trim();
    const result = schema.safeParse(input);

    if (!result.success) {
      const msg = result.error.errors[0]?.message || 'مقدار نامعتبر';
      setError(msg);
      setDraft(displayValue);  // برگردون به مقدار قبلی
      return;
    }

    const parsed = result.data as any;

    if (type === 'number') {
      if (parsed !== defaultValue) {
        onOverride(parsed);
        setDraft(fmt.int(parsed));
      } else {
        if (hasOverride) onClear();
        setDraft(fmtValue(parsed));
      }
    } else {
      if (parsed !== defaultValue) {
        onOverride(parsed);
      } else if (hasOverride) {
        onClear();
      }
    }
  };

  const reset = () => {
    onClear();
    const v = defaultValue == null ? '' : (type === 'number' && typeof defaultValue === 'number' ? fmtValue(defaultValue) : String(defaultValue));
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
          onChange={e => { setDraft(e.target.value); if (error) setError(null); }}
          onFocus={() => setFocused(true)}
          onBlur={commit}
          aria-label={label}
          aria-invalid={!!error}
          aria-describedby={error ? `err-${label.replace(/\s/g, '-')}` : undefined}
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
            border: '1px solid ' + (error ? 'var(--danger, #dc2626)' : hasOverride ? 'var(--warn)' : (focused ? 'var(--accent)' : 'var(--border)')),
            borderRadius: 'var(--r-md)',
            color: error ? 'var(--danger, #dc2626)' : hasOverride ? 'var(--warn)' : 'var(--text)',
            fontFamily: 'inherit',
            fontSize: 'var(--fs-base)',
            fontWeight: hasOverride ? 700 : 600,
            textAlign: 'center',
            outline: 'none',
            boxSizing: 'border-box',
            direction: 'rtl',
            transition: 'background .15s ease, border-color .15s ease, box-shadow .15s ease',
            boxShadow: focused && !error ? '0 0 0 3px var(--accent-soft)' : error ? '0 0 0 3px rgba(220,38,38,.15)' : 'none',
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

      {/* پیام خطا */}
      {error && (
        <div
          id={`err-${label.replace(/\s/g, '-')}`}
          role="alert"
          aria-live="polite"
          style={{
            fontSize: 10.5,
            color: 'var(--danger, #dc2626)',
            fontWeight: 700,
            paddingRight: 4,
            lineHeight: 1.4,
            display: 'flex',
            alignItems: 'center',
            gap: 3,
          }}>
          ⚠️ {error}
        </div>
      )}

      {/* پیام تغییر */}
      {hasOverride && !error && (
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
