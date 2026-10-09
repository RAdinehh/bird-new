/**
 * OverridableField.tsx — فیلد سه حالته (Override)
 *
 * رفتار:
 *   🔒 حالت پیش‌فرض: مقدار استاندارد، قفل، خاکستری
 *   ✏️ کاربر ✏️ می‌زنه: فیلد فعال می‌شه
 *   ⚠️ بعد از تغییر: بج نارنجی با مقدار استاندارد اصلی
 *   🔄 دکمه بازگشت: حذف override، برگشت به استاندارد
 *
 * طبق استاندارد PRIMA Poultry + mTech Systems
 */
import { useState, useEffect } from 'react';

interface Props {
  label: string;
  /** مقدار نهایی (شامل override) */
  value: any;
  /** مقدار استاندارد اصلی */
  defaultValue: any;
  /** ذخیره override */
  onOverride: (v: any) => void;
  /** حذف override (بازگشت به استاندارد) */
  onClear: () => void;
  /** نوع فیلد */
  type?: 'number' | 'text';
  /** واحد نمایش */
  unit?: string;
  /** placeholder */
  placeholder?: string;
  /** حداقل/حداکثر (برای number) */
  min?: number;
  max?: number;
  /** استایل ورودی */
  style?: React.CSSProperties;
}

const baseInputStyle: React.CSSProperties = {
  width: '100%',
  height: 38,
  padding: '0 12px',
  background: 'var(--input-bg)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--r-md)',
  color: 'var(--text)',
  fontFamily: 'inherit',
  fontSize: 'var(--fs-base)',
  fontWeight: 600,
  textAlign: 'center',
  outline: 'none',
  boxSizing: 'border-box',
  direction: 'rtl',
};

function parseNum(text: string): number | null {
  const en = text
    .replace(/[۰-۹]/g, d => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
    .replace(/[٫،]/g, '.')
    .replace(/[^\d.-]/g, '');
  const n = parseFloat(en);
  return isNaN(n) ? null : n;
}

export default function OverridableField({
  label, value, defaultValue, onOverride, onClear,
  type = 'number', unit, placeholder, min, max, style,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');

  // آیا override فعاله؟
  const hasOverride = JSON.stringify(value) !== JSON.stringify(defaultValue);

  // شروع ویرایش
  const startEdit = () => {
    setDraft(value == null || value === '' ? '' : String(value));
    setEditing(true);
  };

  // ذخیره
  const save = () => {
    if (type === 'number') {
      const n = parseDraft(draft);
      if (n === null) {
        onClear();
      } else {
        let final: number | null = n;
        if (min !== undefined && final < min) final = min;
        if (max !== undefined && final > max) final = max;
        onOverride(final);
      }
    } else {
      onOverride(draft.trim());
    }
    setEditing(false);
  };

  // لغو
  const cancel = () => {
    setEditing(false);
    setDraft('');
  };

  // بازگشت به استاندارد
  const reset = () => {
    onClear();
    setEditing(false);
  };

  function parseDraft(text: string): number | null {
    if (!text.trim()) return null;
    const en = text
      .replace(/[۰-۹]/g, d => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
      .replace(/[٫،]/g, '.')
      .replace(/[^\d.-]/g, '');
    const n = parseFloat(en);
    return isNaN(n) ? null : n;
  }

  // حالت نمایش
  const displayValue = value == null || value === ''
    ? '—'
    : `${value}${unit ? ' ' + unit : ''}`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
      {/* Label + دکمه‌ها */}
      <div style={{
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', gap: 6,
      }}>
        <span style={{
          fontSize: 11.5, color: 'var(--muted)', fontWeight: 600,
        }}>{label}</span>

        <div style={{ display: 'flex', gap: 4 }}>
          {hasOverride && !editing && (
            <button
              type="button"
              onClick={reset}
              title="بازگشت به استاندارد"
              aria-label="بازگشت به استاندارد"
              style={{
                width: 26, height: 26,
                background: 'var(--input-bg)',
                border: '1px solid var(--border)',
                borderRadius: 8,
                color: 'var(--muted)',
                cursor: 'pointer',
                fontFamily: 'inherit',
                fontSize: 12,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 0,
              }}
            >🔄</button>
          )}
          {!editing && (
            <button
              type="button"
              onClick={startEdit}
              title="ویرایش"
              aria-label="ویرایش"
              style={{
                width: 26, height: 26,
                background: hasOverride ? 'var(--warn-soft)' : 'var(--input-bg)',
                border: '1px solid ' + (hasOverride ? 'var(--warn)' : 'var(--border)'),
                borderRadius: 8,
                color: hasOverride ? 'var(--warn)' : 'var(--muted)',
                cursor: 'pointer',
                fontFamily: 'inherit',
                fontSize: 12,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 0,
              }}
            >✏️</button>
          )}
        </div>
      </div>

      {/* حالت نمایش (قفل) */}
      {!editing && (
        <div style={{
          ...baseInputStyle,
          background: hasOverride ? 'var(--warn-soft)' : 'var(--input-bg)',
          borderColor: hasOverride ? 'var(--warn)' : 'var(--border)',
          color: hasOverride ? 'var(--warn)' : 'var(--text)',
          fontWeight: hasOverride ? 700 : 600,
          cursor: 'default',
          opacity: hasOverride ? 1 : 0.85,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          ...(style || {}),
        }}>
          {displayValue}
        </div>
      )}

      {/* حالت ویرایش */}
      {editing && (
        <>
          <input
            type={type === 'number' ? 'text' : 'text'}
            inputMode={type === 'number' ? 'decimal' : 'text'}
            value={draft}
            onChange={e => setDraft(e.target.value)}
            placeholder={placeholder}
            autoFocus
            onKeyDown={e => {
              if (e.key === 'Enter') save();
              else if (e.key === 'Escape') cancel();
            }}
            style={{
              ...baseInputStyle,
              borderColor: 'var(--accent)',
              borderWidth: 2,
              ...(style || {}),
            }}
          />

          {/* بج هشدار + دکمه‌های تأیید/لغو */}
          <div style={{
            display: 'flex', alignItems: 'center',
            gap: 6, fontSize: 11,
          }}>
            <span style={{
              flex: 1,
              color: 'var(--warn)',
              fontWeight: 600,
            }}>
              ⚠️ استاندارد: {defaultValue ?? '—'}{unit ? ' ' + unit : ''}
            </span>
            <button
              type="button"
              onClick={cancel}
              style={{
                minWidth: 44, minHeight: 26,
                padding: '0 8px',
                background: 'var(--input-bg)',
                border: '1px solid var(--border)',
                borderRadius: 6,
                color: 'var(--muted)',
                cursor: 'pointer',
                fontFamily: 'inherit',
                fontSize: 11,
                fontWeight: 600,
              }}
            >لغو</button>
            <button
              type="button"
              onClick={save}
              style={{
                minWidth: 44, minHeight: 26,
                padding: '0 8px',
                background: 'var(--accent)',
                border: 'none',
                borderRadius: 6,
                color: '#fff',
                cursor: 'pointer',
                fontFamily: 'inherit',
                fontSize: 11,
                fontWeight: 700,
              }}
            >ذخیره</button>
          </div>
        </>
      )}
    </div>
  );
}
