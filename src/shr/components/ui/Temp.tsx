/** components/ui/Temp.tsx */
import React from 'react';

export function TempInput({
  value,
  onChange,
  unit,
  disabled,
  height = 32,
  fontSize = 13,
}: {
  value: number | null;
  onChange: (celsius: number | null) => void;
  unit: 'c' | 'f';
  disabled?: boolean;
  height?: number;
  fontSize?: number;
}) {
  const displayed = value == null ? '' : (
    unit === 'c' ? value : Math.round((value * 9 / 5 + 32) * 10) / 10
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let v = e.target.value;
    v = v.replace(/[۰-۹]/g, (d: string) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)));
    v = v.replace(/[٫،]/g, '.');
    v = v.replace(/[^\d.-]/g, '');
    if (v === '' || v === '-' || v === '.') { onChange(null); return; }
    const n = Number(v);
    if (isNaN(n)) return;
    const celsius = unit === 'c' ? n : (n - 32) * 5 / 9;
    onChange(Math.round(celsius * 10) / 10);
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, minWidth: 0 }}>
      <input
        type="text"
        inputMode="decimal"
        disabled={disabled}
        value={String(displayed)}
        onChange={handleChange}
        onFocus={(e) => e.target.select()}
        style={{
          flex: 1,
          height,
          padding: '0 6px',
          background: 'var(--input-bg)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--r-sm)',
          color: 'var(--text)',
          fontFamily: 'inherit',
          fontSize,
          fontWeight: 600,
          textAlign: 'center',
          outline: 'none',
          fontVariantNumeric: 'tabular-nums',
          direction: 'ltr',
          minWidth: 0,
        }}
      />
      <span style={{
        fontSize: fontSize - 2,
        color: 'var(--muted)',
        flexShrink: 0,
        minWidth: 26,
        textAlign: 'left',
      }}>{unit === 'c' ? '°C' : '°F'}</span>
    </div>
  );
}
export function TempDisplay({
  value,
  unit,
  toFaFn,
  prefix = '',
  suffix = '',
}: {
  value: number | null;
  unit: 'c' | 'f';
  toFaFn: (v: any) => string;
  prefix?: string;
  suffix?: string;
}) {
  if (value == null) return <>{prefix}—{suffix}</>;
  const v = unit === 'c' ? value : Math.round((value * 9 / 5 + 32) * 10) / 10;
  return <>{prefix}{toFaFn(v)}{unit === 'c' ? '°C' : '°F'}{suffix}</>;
}
