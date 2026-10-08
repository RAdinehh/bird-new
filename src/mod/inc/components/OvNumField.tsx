/**
 * OvNumField.tsx — فیلد عددی با تبدیل دما و نشانگر override
 */
import { useTempUnit, toUserTemp, toCelsius, round1 } from '../../../shr/utils/temp';
import { Field, NumField } from '../../../shr/components/ui';
import { toFa } from '../../../shr/utils/fa';

interface OvNumFieldProps {
  label: string;
  hint?: string;
  value: any;
  defValue?: any;
  onChange: (e: any) => void;
  unit?: string;
  min?: number;
  max?: number;
  placeholder?: string;
  isTemp?: boolean;
}

export default function OvNumField(props: OvNumFieldProps) {
  const { label, hint, value, defValue, onChange, unit, min, max, placeholder, isTemp } = props;
  const tempUnit = useTempUnit();

  const displayValue = isTemp
    ? (value == null || value === '' ? '' : String(toUserTemp(Number(value), tempUnit)))
    : String(value ?? '');

  const displayDef = isTemp && defValue != null
    ? toUserTemp(Number(defValue), tempUnit)
    : defValue;

  const displayUnit = isTemp
    ? (tempUnit === 'c' ? '°C' : '°F')
    : unit;

  const overridden = defValue != null && value != null && value !== ''
    && Math.abs(Number(value) - Number(defValue)) > 0.05;

  const dynamicHint = isTemp ? displayUnit : hint;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isTemp) { onChange(e); return; }
    let v = e.target.value;
    v = v.replace(/[۰-۹]/g, d => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)));
    v = v.replace(/[٫،]/g, '.');
    v = v.replace(/[^\d.-]/g, '');
    if (v === '' || v === '-' || v === '.') {
      onChange({ target: { value: '' } });
      return;
    }
    const n = Number(v);
    if (isNaN(n)) return;
    const celsius = toCelsius(n, tempUnit);
    if (celsius != null) {
      onChange({ target: { value: String(round1(celsius)) } });
    }
  };

  return (
    <Field label={label} hint={dynamicHint}>
      <div style={{ position: 'relative' }}>
        {isTemp ? (
          <input
            type="text"
            inputMode="decimal"
            value={displayValue}
            onChange={handleChange}
            onFocus={(e) => e.target.select()}
            style={{
              width: '100%', height: 38,
              padding: '0 12px',
              background: 'var(--input-bg)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--r-md)',
              color: 'var(--text)',
              fontFamily: 'inherit',
              fontSize: 'var(--fs-base)',
              fontWeight: 600,
              textAlign: 'right',
              outline: 'none',
              fontVariantNumeric: 'tabular-nums',
              direction: 'ltr',
            }}
          />
        ) : (
          <NumField value={String(value ?? '')} onChange={onChange} unit={unit} min={min} max={max} placeholder={placeholder} />
        )}
        {overridden && (
          <span title={`دستی — پیش‌فرض: ${toFa(String(displayDef))}${isTemp ? displayUnit : ''}`} style={{
            position: 'absolute', top: -2, left: -2,
            width: 8, height: 8, borderRadius: '50%',
            background: 'var(--warn)', cursor: 'help', zIndex: 2,
            boxShadow: '0 0 0 2px var(--card)',
          }} />
        )}
      </div>
    </Field>
  );
}
