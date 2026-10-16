/** components/ui/Field.tsx */
import React from 'react';

interface FieldProps {
  label: React.ReactNode;
  required?: boolean;
  hint?: string;
  /** 🆕 اگه فیلد خودکار از ماژول دیگه پر شده — نام ماژول */
  autoFrom?: string;
  /** 🆕 پیام خطای اعتبارسنجی — قرمز */
  error?: string;
  /** 🆕 پیام هشدار — زرد */
  warning?: string;
  /** 🆕 وقتی کاربر از فیلد خارج شد (blur) */
  onTouch?: () => void;
  children: React.ReactNode;
}
export function Field({ label, required, hint, autoFrom, error, warning, onTouch, children }: FieldProps) {
  return (
    <div
      style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}
      onBlurCapture={onTouch}
    >
      <label style={{
        fontSize: 'var(--fs-sm)',
        color: 'var(--muted)',
        fontWeight: 600,
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        paddingRight: 2,
      }}>
        {label}{required && <span style={{ color: 'var(--danger)', fontSize: '1.2em', fontWeight: 700, lineHeight: 1 }} aria-label="اجباری">*</span>}
        {autoFrom ? (
          <span style={{
            width: 6, height: 6, borderRadius: '50%',
            background: 'var(--accent)', display: 'inline-block',
            flexShrink: 0,
          }} aria-label={'از ' + autoFrom} />
        ) : null}
      </label>
      {children}
      {(hint || autoFrom) && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          gap: 'var(--sp-2)',
          paddingRight: 2,
        }}>
          {autoFrom && (
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              fontSize: 'var(--fs-xs)',
              color: 'var(--accent)',
              background: 'var(--accent-soft)',
              border: '1px solid var(--accent-border)',
              borderRadius: 'var(--r-sm)',
              padding: '2px 8px',
              fontWeight: 700,
              lineHeight: 1.6,
              flexShrink: 0,
            }}>
              <span aria-hidden="true">✨</span>
              <span>از {autoFrom}</span>
            </span>
          )}
          {hint && (
            <span style={{
              fontSize: 'var(--fs-xs)',
              color: 'var(--dim)',
              lineHeight: 1.5,
            }}>{hint}</span>
          )}
        </div>
      )}
      {error && (
        <div style={{
          fontSize: 'var(--fs-xs)',
          color: 'var(--danger)',
          fontWeight: 600,
          paddingRight: 2,
          lineHeight: 1.5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-start',
          gap: 4,
          textAlign: 'right',
          width: '100%',
        }} dir="rtl">
          <span>{error}</span>
        </div>
      )}
      {!error && warning && (
        <div style={{
          fontSize: 'var(--fs-xs)',
          color: 'var(--warn)',
          fontWeight: 600,
          paddingRight: 2,
          lineHeight: 1.5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-start',
          gap: 4,
          textAlign: 'right',
          width: '100%',
        }} dir="rtl">
          <span aria-hidden="true">💡</span>
          <span>{warning}</span>
        </div>
      )}
    </div>
  );
}
