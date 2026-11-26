/**
 * SmartSelect.tsx — انتخاب‌گر یکپارچه روی SelectSheetShell (بدون منوی بومی اندروید)
 *
 * هر دو حالت از یک پوسته واحد (SelectSheetShell) استفاده می‌کنند:
 *   - ۱ تا ۴ گزینه (options.length <= autoThreshold) → placement="center" (وسط صفحه)
 *   - ۵ گزینه و بالاتر → placement="bottom" (شیت از پایین با اسکرول روان)
 */
import { useState, useMemo } from 'react';
import { Input } from './ui';
import { getGlobalFormat } from '../units/useFormat';
import SelectSheetShell, { SheetGroup, SheetItem } from './SelectSheetShell';

export interface SmartOption {
  value: string;
  label: string;
  subtitle?: string;
  group?: string;
  disabled?: boolean;
  icon?: string;
}

interface Props {
  value: string;
  onChange: (value: string) => void;
  options: SmartOption[];
  placeholder?: string;
  groupLabels?: Record<string, string>;
  groupIcons?: Record<string, string>;
  hierarchical?: boolean;
  autoThreshold?: number;
  disabled?: boolean;
  modalTitle?: string;
  required?: boolean;
  error?: string;
  warn?: string;
  compact?: boolean;
  /** ارتفاع دلخواه (پیش‌فرض: ۳۸ غیر compact / ۳۲ compact) */
  height?: number;
}

export default function SmartSelect({
  value, onChange, options,
  placeholder = '— انتخاب —',
  groupLabels = {}, groupIcons = {},
  autoThreshold = 4,
  disabled = false,
  modalTitle = 'انتخاب',
  required = false,
  error, warn,
  compact = false,
  height: customHeight,
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const borderColor = error ? 'var(--danger)' : warn ? 'var(--warn)' : 'var(--border)';
  const height = customHeight ?? (compact ? 32 : 38);
  const fontSize = compact ? 'var(--fs-sm)' : 'var(--fs-base)';

  const isShortList = options.length <= autoThreshold;
  const current = options.find(o => o.value === value);
  const canClear = !required && !!value;

  const filtered = useMemo(() => {
    if (!query.trim()) return options;
    const q = query.trim().toLowerCase();
    return options.filter(o =>
      o.label.toLowerCase().includes(q) ||
      (o.subtitle?.toLowerCase() || '').includes(q),
    );
  }, [options, query]);

  const grouped = useMemo(() => {
    const map: Record<string, SmartOption[]> = {};
    filtered.forEach(o => {
      const g = o.group || '_flat';
      if (!map[g]) map[g] = [];
      map[g].push(o);
    });
    return map;
  }, [filtered]);

  const groupKeys = Object.keys(grouped);
  const hasGroups = groupKeys.length > 1 || (groupKeys.length === 1 && groupKeys[0] !== '_flat');
  const searchable = !isShortList && options.length > 5;

  const handleClose = () => {
    setOpen(false);
    setQuery('');
  };

  const handlePick = (val: string) => {
    onChange(val);
    handleClose();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => { if (disabled) return; setOpen(true); setQuery(''); }}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={required ? `${placeholder} (اجباری)` : placeholder}
        aria-invalid={!!error}
        aria-required={required}
        style={{
          width: '100%', height, boxSizing: 'border-box',
          textAlign: 'right',
          padding: compact ? '0 10px' : '0 12px',
          background: 'var(--input-bg)',
          border: `1px solid ${borderColor}`,
          borderRadius: 'var(--r-md)',
          cursor: disabled ? 'not-allowed' : 'pointer',
          fontFamily: 'inherit',
          fontSize,
          color: current ? 'var(--text)' : 'var(--dim)',
          opacity: disabled ? 0.55 : 1,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          gap: 8, minWidth: 0, outline: 'none',
        }}
      >
        <span style={{
          fontWeight: 400,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {current ? current.label : placeholder}
          {required && !current ? (
            <span style={{ color: 'var(--danger)', marginRight: 4 }}> *</span>
          ) : null}
        </span>
        <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24"
          fill="none" stroke="var(--muted)" strokeWidth="2"
          strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      <SelectSheetShell
        open={open}
        onClose={handleClose}
        placement={isShortList ? 'center' : 'bottom'}
        flush={!hasGroups}
        title={modalTitle}
        subtitle={isShortList ? undefined : `${getGlobalFormat().count(options.length)} مورد`}
        onClear={canClear ? () => handlePick('') : undefined}
        searchable={searchable}
        onSearchClear={() => setQuery('')}
        searchNode={
          <Input
            placeholder="جستجو..."
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
        }
      >
        {filtered.length === 0 ? (
          <div style={{
            padding: '32px 12px', textAlign: 'center',
            color: 'var(--muted)', fontSize: 'var(--fs-base)',
          }}>
            <div>چیزی پیدا نشد</div>
          </div>
        ) : hasGroups ? (
          groupKeys.map(gKey => (
            <SheetGroup
              key={gKey}
              title={groupLabels[gKey] || gKey}
              icon={groupIcons[gKey] || undefined}
              count={grouped[gKey].length}
            >
              {grouped[gKey].map(o => (
                <SheetItem
                  key={o.value}
                  title={o.label}
                  subtitle={o.subtitle}
                  selected={value === o.value}
                  disabled={o.disabled}
                  onClick={() => !o.disabled && handlePick(o.value)}
                />
              ))}
            </SheetGroup>
          ))
        ) : (
          filtered.map(o => (
            <SheetItem
              key={o.value}
              title={o.label}
              subtitle={o.subtitle}
              selected={value === o.value}
              disabled={o.disabled}
              onClick={() => !o.disabled && handlePick(o.value)}
            />
          ))
        )}
      </SelectSheetShell>
    </div>
  );
}
