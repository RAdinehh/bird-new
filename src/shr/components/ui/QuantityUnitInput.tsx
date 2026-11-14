import { NumField } from './Input';
import { Select } from './Select';
import { Field } from './Field';
import { toFa, toEn } from '../../utils/fa';

export interface UnitOption {
  value: string;
  label: string;
  factor: number;
}

interface Props {
  value: string | number;
  onChange: (val: string) => void;
  unit: string;
  onUnitChange: (unit: string) => void;
  options: UnitOption[];
  error?: string;
  placeholder?: string;
  onTouch?: () => void;
}

export function QuantityUnitInput({ value, onChange, unit, onUnitChange, options, error, placeholder, onTouch }: Props) {
  const currentUnit = options.find(o => o.value === unit);
  const baseUnitOpt = options.find(o => o.factor === 1) || options[0];

  const numStr = String(value);
  const numVal = parseFloat(toEn(numStr));
  const isValidNum = !isNaN(numVal) && numVal > 0;
  const showPreview = isValidNum && currentUnit && currentUnit.factor !== 1 && baseUnitOpt;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0 }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <Field label="مقدار مصرفی" error={error} onTouch={onTouch}>
            <NumField
              placeholder={placeholder || '۰'}
              value={value}
              onChange={e => onChange(e.target.value)}
              min={0}
            />
          </Field>
        </div>
        {options.length > 1 && (
          <div style={{ width: 85, flexShrink: 0 }}>
            <Field label="واحد">
              <Select value={unit} onChange={e => onUnitChange(e.target.value)}>
                {options.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </Select>
            </Field>
          </div>
        )}
      </div>
      {showPreview && (
        <div style={{
          padding: '4px 8px',
          background: 'var(--warn-soft, rgba(255, 193, 7, 0.1))',
          border: '1px solid var(--warn-border, rgba(255, 193, 7, 0.3))',
          borderRadius: 'var(--r-sm)',
          fontSize: 'var(--fs-xs)',
          color: 'var(--warn-text, #b07d00)',
          fontWeight: 600,
          textAlign: 'center'
        }}>
          💡 {toFa(numVal)} {currentUnit?.label} = {toFa(numVal * (currentUnit?.factor || 1))} {baseUnitOpt?.label}
        </div>
      )}
    </div>
  );
}
