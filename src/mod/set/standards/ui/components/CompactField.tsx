/**
 * CompactField — فیلد کوچیک برای ادیتورها
 *
 * A11y: aria-label + focus ring
 * اعداد: نمایش فارسی، ورودی انگلیسی/فارسی
 */
import { useRef, useState } from 'react';
import { useTempUnit, toUserTemp, toCelsius, tempLabel } from '../../../../../shr/utils/temp';
import { useFormat } from '../../../../../shr/units/useFormat';

export function CompactField({
  label, value, onChange, unit, isTemp = false, decimals = 0,
}: {
  label: string;
  value: number | null;
  onChange: (v: number | null) => void;
  unit: string;
  isTemp?: boolean;
  /** 🆕 تعداد اعشار (پیش‌فرض 0) */
  decimals?: number;
}) {
  const tempUnit = useTempUnit();
  const fmt = useFormat();
  const inputRef = useRef<HTMLInputElement>(null);
  const [focused, setFocused] = useState(false);
  const [draft, setDraft] = useState<string | null>(null);

  const rawValue = isTemp ? toUserTemp(value, tempUnit) : value;
  const displayUnit = isTemp ? tempLabel(tempUnit) : unit;

  // نمایش: اگه کاربر در حالت تایپ نیست، از fmt استفاده کن
  const formattedValue = rawValue === null || rawValue === undefined
    ? ''
    : fmt.num(rawValue, { decimals });

  // مقدار فعلی input
  const inputValue = focused && draft !== null ? draft : formattedValue;

  const handleFocus = () => {
    setFocused(true);
    // در حالت فوکوس، متن انگلیسی نشون بده (برای راحتی تایپ)
    setDraft(rawValue === null || rawValue === undefined ? '' : String(rawValue));
  };

  const handleBlur = () => {
    setFocused(false);
    setDraft(null);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let v = e.target.value;
    // تبدیل فارسی به انگلیسی
    v = v.replace(/[۰-۹]/g, d => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)));
    v = v.replace(/[٫،,]/g, '.');
    v = v.replace(/[^\d.-]/g, '');
    const parts = v.split('.');
    if (parts.length > 2) v = parts[0] + '.' + parts.slice(1).join('');
    setDraft(v);

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
        border: '1px solid ' + (focused ? 'var(--accent)' : 'var(--border)'),
        boxShadow: focused ? '0 0 0 3px var(--accent-soft)' : 'none',
        transition: 'border-color .15s ease, box-shadow .15s ease',
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
          aria-label={`${label} (${displayUnit})`}
          value={inputValue}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
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
