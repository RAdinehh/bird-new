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
  children: React.ReactNode;
}
export function Field({ label, required, hint, autoFrom, error, warning, children }: FieldProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
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
      {hint && (
        <div style={{
          fontSize: 'var(--fs-xs)',
          color: 'var(--dim)',
          lineHeight: 1.5,
          paddingRight: 2,
        }}>{hint}</div>
      )}
      {autoFrom && (
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          fontSize: 11,
          color: 'var(--accent)',
          background: 'var(--accent-soft)',
          border: '1px solid var(--accent-border)',
          borderRadius: 8,
          padding: '2px 8px',
          fontWeight: 700,
          alignSelf: 'flex-start',
          marginRight: 2,
          lineHeight: 1.6,
        }}>
          <span aria-hidden="true">✨</span>
          <span>از {autoFrom}</span>
        </div>
      )}
      {error && (
        <div style={{
          fontSize: 11,
          color: 'var(--danger)',
          fontWeight: 600,
          paddingRight: 2,
          lineHeight: 1.5,
          display: 'flex',
          alignItems: 'center',
          gap: 4,
        }}>
          <span aria-hidden="true">⚠️</span>
          <span>{error}</span>
        </div>
      )}
      {!error && warning && (
        <div style={{
          fontSize: 11,
          color: 'var(--warn)',
          fontWeight: 600,
          paddingRight: 2,
          lineHeight: 1.5,
          display: 'flex',
          alignItems: 'center',
          gap: 4,
        }}>
          <span aria-hidden="true">💡</span>
          <span>{warning}</span>
        </div>
      )}
    </div>
  );
}
