/**
 * SmartSelect.tsx — انتخاب‌گر ساده با SelectSheetShell
 *
 * دو حالت خودکار:
 *   - options ≤ autoThreshold (پیش‌فرض ۸) → Select بومی
 *   - options > autoThreshold → SelectSheetShell (لیست بلند)
 *
 * API ثابت (سازگاری با ۱۵ ماژول):
 *   value, onChange, options, placeholder, groupLabels, groupIcons,
 *   hierarchical, autoThreshold, disabled, modalTitle, required, error, warn, compact
 */

import { useState, useMemo } from 'react';
import { Select, Input } from './ui';
import { toFa } from '../utils/fa';
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
  /** 🆕 ارتفاع دلخواه (پیش‌فرض: ۳۸ غیر compact / ۳۲ compact) */
  height?: number;
}

export default function SmartSelect({
  value, onChange, options,
  placeholder = '— انتخاب کنید —',
  groupLabels = {}, groupIcons = {},
  hierarchical = false,
  autoThreshold = 8,
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

  // ═══ حالت ۱: لیست کوتاه — Select بومی ═══
  const [visibleCount, setVisibleCount] = useState(10);

  const groups = useMemo(
    () => Array.from(new Set(options.map(o => o.group).filter(Boolean))) as string[],
    [options],
  );

  const filtered = useMemo(() => {
    if (!query.trim()) return options;
    const q = query.trim().toLowerCase();
    return options.filter(o =>
      o.label.toLowerCase().includes(q) ||
      (o.subtitle?.toLowerCase() || '').includes(q),
    );
  }, [options, query]);

  // گروه‌بندی
  const grouped = useMemo(() => {
    const map: Record<string, SmartOption[]> = {};
    filtered.forEach(o => {
      const g = o.group || '_flat';
      if (!map[g]) map[g] = [];
      map[g].push(o);
    });
    return map;
  }, [filtered]);

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
          style={{ borderColor, height, fontSize, opacity: disabled ? 0.55 : 1 }}
        >
          <option value="">{placeholder}</option>
          {options.map(o => (
            <option key={o.value} value={o.value} disabled={o.disabled}>
              {o.label}
              {o.subtitle ? ` — ${o.subtitle}` : ''}
            </option>
          ))}
        </Select>
        {(error || warn) && (
          <div style={{ fontSize: 'var(--fs-xs)', color: error ? 'var(--danger)' : 'var(--warn)' }}>
            {error ? `✕ ${error}` : `⚠ ${warn}`}
          </div>
        )}
      </div>
    );
  }

  // ═══ حالت ۲: لیست بلند — SelectSheetShell ═══
  const current = options.find(o => o.value === value);
  const searchable = options.length > 5;


  const groupKeys = Object.keys(grouped);
  const hasGroups = groupKeys.length > 1 || (groupKeys.length === 1 && groupKeys[0] !== '_flat');

  const handlePick = (val: string) => {
    onChange(val);
    setOpen(false);
    setQuery('');
    setVisibleCount(10);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
      {/* Trigger */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => { if (disabled) return; setOpen(true); setQuery(''); setVisibleCount(10); }}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={required ? `${placeholder} (اجباری)` : placeholder}
        aria-invalid={!!error}
        aria-required={required}
        style={{
          width: '100%', height,
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

      {(error || warn) && (
        <div style={{ fontSize: 'var(--fs-xs)', color: error ? 'var(--danger)' : 'var(--warn)' }}>
          {error ? `✕ ${error}` : `⚠ ${warn}`}
        </div>
      )}

      <SelectSheetShell
        open={open}
        onClose={() => { setOpen(false); setQuery(''); setVisibleCount(10); }}
        title={modalTitle}
        subtitle={`${toFa(options.length)} مورد`}
        searchable={searchable}
        searchNode={
          <Input
            placeholder="جستجو..."
            value={query}
            onChange={e => { const v = e.target.value; setQuery(v); setVisibleCount(v.trim() ? 9999 : 10); }}
          />
        }
      >
        {filtered.length === 0 ? (
          <div style={{
            padding: '32px 12px', textAlign: 'center',
            color: 'var(--muted)', fontSize: 'var(--fs-base)',
          }}>
            <div style={{ fontSize: 28, marginBottom: 6, opacity: 0.5 }}>🔍</div>
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
                  icon={o.icon}
                  title={o.label}
                  selected={value === o.value}
                  onClick={() => !o.disabled && handlePick(o.value)}
                />
              ))}
            </SheetGroup>
          ))
        ) : (
          <>
            <SheetGroup title="" count={filtered.length}>
              {filtered.slice(0, visibleCount).map(o => (
                <SheetItem
                  key={o.value}
                  icon={o.icon}
                  title={o.label}
                  selected={value === o.value}
                  onClick={() => !o.disabled && handlePick(o.value)}
                />
              ))}
            </SheetGroup>
            {visibleCount < filtered.length && (
              <button
                type="button"
                onClick={() => setVisibleCount(c => c + 10)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: 'var(--input-bg)',
                  border: '1px dashed var(--border)',
                  borderRadius: 'var(--r-md)',
                  color: 'var(--text)',
                  fontFamily: 'inherit',
                  fontSize: 'var(--fs-sm)',
                  fontWeight: 700,
                  cursor: 'pointer',
                  marginTop: 4,
                }}
              >
                + نمایش {toFa(Math.min(10, filtered.length - visibleCount))} مورد بیشتر
                ({toFa(filtered.length - visibleCount)} باقی‌مانده)
              </button>
            )}
          </>
        )}
      </SelectSheetShell>
    </div>
  );
}
