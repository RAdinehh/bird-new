import { NumField } from './Input';
import { Select } from './Select';
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
}

export function QuantityUnitInput({ value, onChange, unit, onUnitChange, options, error, placeholder }: Props) {
  const currentUnit = options.find(o => o.value === unit);
  const baseUnitOpt = options.find(o => o.factor === 1) || options[0];

  const numStr = String(value);
  const numVal = parseFloat(toEn(numStr));
  const isValidNum = !isNaN(numVal) && numVal > 0;
  const showPreview = isValidNum && currentUnit && currentUnit.factor !== 1 && baseUnitOpt;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <NumField
            placeholder={placeholder || '۰'}
            value={value}
            onChange={e => onChange(e.target.value)}
            error={error}
            min={0}
          />
        </div>
        {options.length > 1 && (
          <div style={{ width: 80, flexShrink: 0 }}>
            <Select value={unit} onChange={e => onUnitChange(e.target.value)}>
              {options.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </Select>
          </div>
        )}
      </div>
      {showPreview && (
        <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--accent)', fontWeight: 600, paddingRight: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          💡 {toFa(numVal)} {currentUnit?.label} = {toFa(numVal * (currentUnit?.factor || 1))} {baseUnitOpt?.label}
        </div>
      )}
    </div>
  );
}
