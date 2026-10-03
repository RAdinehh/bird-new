import { useRef } from 'react';
import { useTempUnit, toUserTemp, toCelsius, tempLabel } from '../../../../../shr/utils/temp';

export function CompactField({
  label, value, onChange, unit, isTemp = false,
}: {
  label: string;
  value: number | null;
  onChange: (v: number | null) => void;
  unit: string;
  isTemp?: boolean;
}) {
  const tempUnit = useTempUnit();
  const displayValue = isTemp ? toUserTemp(value, tempUnit) : value;
  const displayUnit = isTemp ? tempLabel(tempUnit) : unit;
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let v = e.target.value;
    v = v.replace(/[۰-۹]/g, d => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)));
    v = v.replace(/[٫،]/g, '.');
    v = v.replace(/[^\d.-]/g, '');
    const parts = v.split('.');
    if (parts.length > 2) v = parts[0] + '.' + parts.slice(1).join('');
    if (v === '' || v === '-' || v === '.') {
      onChange(null);
      return;
    }
    const n = Number(v);
    if (isNaN(n)) return;
    onChange(isTemp ? toCelsius(n, tempUnit) : n);
  };

  return (
    <div
      onClick={() => inputRef.current?.focus()}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        minWidth: 0,
        padding: '8px 10px',
        background: 'var(--input-bg)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--r-md)',
        cursor: 'text',
      }}
    >
      <span style={{
        fontSize: 11,
        color: 'var(--muted)',
        fontWeight: 600,
        textAlign: 'right',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}>{label}</span>
      <div style={{
        display: 'flex',
        alignItems: 'baseline',
        justifyContent: 'center',
        gap: 4,
      }}>
        <input
          ref={inputRef}
          type="text"
          inputMode="decimal"
          value={displayValue === null || displayValue === undefined ? '' : String(displayValue)}
          onChange={handleChange}
          style={{
            width: 70,
            height: 22,
            padding: 0,
            background: 'transparent',
            border: 'none',
            color: 'var(--accent)',
            fontFamily: 'inherit',
            fontSize: 'var(--fs-base)',
            fontWeight: 700,
            textAlign: 'center',
            outline: 'none',
            fontVariantNumeric: 'tabular-nums',
            direction: 'rtl',
          }}
        />
        <span style={{
          fontSize: 11,
          color: 'var(--muted)',
          flexShrink: 0,
          fontWeight: 500,
          minWidth: 24,
          textAlign: 'left',
        }}>{displayUnit}</span>
      </div>
    </div>
  );
}
