import { Select } from './ui';
import SmartSelect from './SmartSelect';

interface Opt {
  value: string;
  label: string;
  subtitle?: string;
  group?: string;
}

interface Props {
  value: string;
  onChange: (v: string) => void;
  parentValue: string;
  parentLabel: string;
  options: Opt[];
  emptyListMessage?: string;
  placeholder?: string;
  modalTitle?: string;
  autoThreshold?: number;
}

export default function DependentSelect({
  value, onChange, parentValue, parentLabel, options,
  emptyListMessage, placeholder = '— انتخاب کنید —',
  modalTitle, autoThreshold = 8,
}: Props) {
  if (!parentValue) {
    return (
      <div style={{
        padding: '10px 12px',
        background: 'var(--input-bg)',
        border: '1px dashed var(--border)',
        borderRadius: 'var(--r-sm)',
        fontSize: 'var(--fs-sm)',
        color: 'var(--muted)',
        display: 'flex', alignItems: 'center', gap: 6,
      }}>
        🔒 ابتدا «{parentLabel}» را انتخاب کنید
      </div>
    );
  }

  if (options.length === 0) {
    return (
      <div style={{
        padding: '10px 12px',
        background: 'var(--warn-soft)',
        border: '1px dashed var(--warn)',
        borderRadius: 'var(--r-sm)',
        fontSize: 'var(--fs-sm)',
        color: 'var(--warn)',
        fontWeight: 600,
      }}>
        ⚠️ {emptyListMessage || `موردی برای «${parentLabel}» انتخاب‌شده وجود ندارد`}
      </div>
    );
  }

  if (options.length <= autoThreshold) {
    return (
      <Select value={value} onChange={e => onChange(e.target.value)}>
        <option value="">{placeholder}</option>
        {options.map(o => (
          <option key={o.value} value={o.value}>
            {o.label}{o.subtitle ? ` — ${o.subtitle}` : ''}
          </option>
        ))}
      </Select>
    );
  }

  return (
    <SmartSelect
      value={value}
      onChange={onChange}
      options={options}
      placeholder={placeholder}
      modalTitle={modalTitle || `انتخاب ${parentLabel}`}
      autoThreshold={autoThreshold}
    />
  );
}
