import type { ChangeEvent } from 'react';
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

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    let v = e.target.value;
    // اعداد فارسی → انگلیسی
    v = v.replace(/[۰-۹]/g, d => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)));
    // همه جداکننده‌ها → نقطه انگلیسی
    v = v.replace(/[٫،,]/g, '.');
    // فقط عدد، نقطه، منفی
    v = v.replace(/[^\d.-]/g, '');
    // فقط یه نقطه و فقط یه منفی در ابتدا
    const parts = v.split('.');
    if (parts.length > 2) {
      v = parts[0] + '.' + parts.slice(1).join('');
    }
    // اگر خالی یا فقط علامت
    if (v === '' || v === '-' || v === '.') {
      onChange(null);
      return;
    }
    const n = Number(v);
    if (isNaN(n)) return;
    onChange(isTemp ? toCelsius(n, tempUnit) : n);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
      <span style={{
        fontSize: 11,
        color: 'var(--muted)',
        fontWeight: 600,
        textAlign: 'right',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <input
          type="text"
          inputMode="decimal"
          value={displayValue === null || displayValue === undefined ? '' : String(displayValue)}
          onChange={handleChange}
          style={{
            flex: 1,
            height: 32,
            padding: '0 6px',
            background: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--r-sm)',
            color: 'var(--text)',
            fontFamily: 'inherit',
            fontSize: 13,
            fontWeight: 600,
            textAlign: 'center',
            outline: 'none',
            fontVariantNumeric: 'tabular-nums',
            direction: 'ltr',
            minWidth: 0,
          }}
        />
        <span style={{
          fontSize: 10,
          color: 'var(--muted)',
          flexShrink: 0,
          minWidth: 24,
          textAlign: 'left',
        }}>{displayUnit}</span>
      </div>
    </div>
  );
}
