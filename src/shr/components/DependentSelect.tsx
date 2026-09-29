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
        style={{
          height,
          padding: compact ? '0 10px' : '0 12px',
          background: 'var(--input-bg)',
          border: '1px dashed var(--border)',
          borderRadius: 'var(--r-md)',
          fontSize,
          color: 'var(--muted)',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          opacity: disabled ? 0.55 : 1,
        }}
      >
        <span aria-hidden="true">🔒</span>
        <span>ابتدا «{parentLabel}» را انتخاب کنید</span>
      </div>
    );
  }

  // حالت ۲: لیست خالی
  if (options.length === 0) {
    return (
      <div
        role="status"
        aria-live="polite"
        style={{
          height: 'auto',
          padding: '10px 12px',
          background: 'var(--warn-soft)',
          border: '1px dashed var(--warn)',
          borderRadius: 'var(--r-md)',
          fontSize,
          color: 'var(--warn)',
          fontWeight: 600,
        }}
      >
        ⚠️ {emptyListMessage || `موردی برای «${parentLabel}» انتخاب‌شده وجود ندارد`}
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
