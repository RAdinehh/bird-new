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
  // جدید
  disabled?: boolean;
  required?: boolean;
  error?: string;
  warn?: string;
  compact?: boolean;
  groupLabels?: Record<string, string>;
  groupIcons?: Record<string, string>;
  emptyMode?: 'warning' | 'select';
}

export default function DependentSelect({
  value,
  onChange,
  parentValue,
  parentLabel,
  options,
  emptyListMessage,
  placeholder = '— انتخاب کنید —',
  modalTitle,
  autoThreshold = 8,
  disabled = false,
  required = false,
  error,
  warn,
  compact = false,
  groupLabels = {},
  groupIcons = {},
  emptyMode = 'warning',
}: Props) {
  const height = compact ? 32 : 38;
  const fontSize = compact ? 'var(--fs-sm)' : 'var(--fs-base)';
  const borderColor = error
    ? 'var(--danger)'
    : warn
    ? 'var(--warn)'
    : 'var(--border)';

  // حالت ۱: والد انتخاب نشده
  if (!parentValue) {
    return (
      <div
        role="status"
        aria-live="polite"
        title={emptyListMessage || `موردی برای «${parentLabel}» انتخاب‌شده وجود ندارد`}
        style={{
          height: 38, boxSizing: 'border-box',
          padding: '0 12px',
          background: 'var(--warn-soft)',
          border: '1px dashed var(--warn)',
          borderRadius: 'var(--r-md)',
          fontSize: 11,
          color: 'var(--warn)',
          fontWeight: 600,
          display: 'flex', alignItems: 'center',
          overflow: 'hidden',
        }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          ⚠️ {emptyListMessage || `موردی برای «${parentLabel}» انتخاب‌شده وجود ندارد`}
        </span>
      </div>
    );
  }

  // حالت ۳: لیست کوتاه → Select
  if (options.length <= autoThreshold) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
        <Select
          value={value}
          onChange={e => onChange(e.target.value)}
          disabled={disabled}
          aria-label={placeholder}
          aria-invalid={!!error}
          aria-required={required}
          style={{
            height,
            fontSize,
            borderColor,
            opacity: disabled ? 0.55 : 1,
          }}
        >
          <option value="">{placeholder}</option>
          {options.map(o => (
            <option key={o.value} value={o.value}>
              {o.label}
              {o.subtitle ? ` — ${o.subtitle}` : ''}
            </option>
          ))}
        </Select>
        {(error || warn) && (
          <div
            style={{
              fontSize: 'var(--fs-xs)',
              color: error ? 'var(--danger)' : 'var(--warn)',
            }}
          >
            {error ? `✕ ${error}` : `⚠ ${warn}`}
          </div>
        )}
      </div>
    );
  }

  // حالت ۴: لیست بلند → SmartSelect
  return (
    <SmartSelect
      value={value}
      onChange={onChange}
      options={options}
      placeholder={placeholder}
      modalTitle={modalTitle || `انتخاب ${parentLabel}`}
      autoThreshold={autoThreshold}
      disabled={disabled}
      required={required}
      error={error}
      warn={warn}
      compact={compact}
      groupLabels={groupLabels}
      groupIcons={groupIcons}
    />
  );
}
