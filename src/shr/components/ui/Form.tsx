/** components/ui/Form.tsx */
import React from 'react';

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
      <span style={{ flex: 1, textAlign: 'right', lineHeight: 1.6 }}>{children}</span>
      <span style={{ fontSize: 16, flexShrink: 0 }}>⚠️</span>
    </div>
  );
}
