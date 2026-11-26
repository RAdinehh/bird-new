/**
 * SmartSelect.tsx — انتخاب‌گر استاندارد بدون منوی بومی اندروید
 *
 * دو حالت خودکار:
 *   - options ≤ autoThreshold (پیش‌فرض ۴ → ۱ تا ۴ گزینه) → مودال جمع‌وجور وسط صفحه
 *   - options > autoThreshold (۵ گزینه به بالا) → SelectSheetShell (شیت از پایین)
 *
 * API ثابت (سازگاری کامل با همه ماژول‌ها):
 *   value, onChange, options, placeholder, groupLabels, groupIcons,
 *   hierarchical, autoThreshold, disabled, modalTitle, required, error, warn, compact, height
 */
import { useState, useMemo } from 'react';
import { Input, Modal } from './ui';
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
  const [visibleCount, setVisibleCount] = useState(10);

  const borderColor = error ? 'var(--danger)' : warn ? 'var(--warn)' : 'var(--border)';
  const height = customHeight ?? (compact ? 32 : 38);
  const fontSize = compact ? 'var(--fs-sm)' : 'var(--fs-base)';

  const isShortList = options.length <= autoThreshold;
  const current = options.find(o => o.value === value);
  const hasEmptyOption = options.some(o => o.value === '');
  const showClearOption = !required && !!placeholder && !hasEmptyOption;

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
  const searchable = options.length > 5;

  const handleClose = () => {
    setOpen(false);
    setQuery('');
    setVisibleCount(10);
  };

  const handlePick = (val: string) => {
    onChange(val);
    handleClose();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
      {/* Trigger یکدست برای هر دو حالت */}
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

      {/* حالت ۱: ۱ تا ۴ گزینه → مودال وسط صفحه */}
      {isShortList ? (
        <Modal
          open={open}
          onClose={handleClose}
          title={modalTitle}
          center
          size="sm"
          z={10000}
          contentGap={4}
        >
          <div role="listbox" style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {showClearOption && (
              <SheetItem
                title={placeholder}
                selected={!value}
                onClick={() => handlePick('')}
              />
            )}
            {options.map(o => (
              <SheetItem
                key={o.value}
                icon={o.icon}
                title={o.subtitle ? `${o.label} — ${o.subtitle}` : o.label}
                selected={value === o.value}
                onClick={() => !o.disabled && handlePick(o.value)}
              />
            ))}
          </div>
        </Modal>
      ) : (
        /* حالت ۲: ۵ گزینه و بالاتر → شیت پایین صفحه */
        <SelectSheetShell
          open={open}
          onClose={handleClose}
          title={modalTitle}
          subtitle={`${getGlobalFormat().count(options.length)} مورد`}
          searchable={searchable}
          onSearchClear={() => setQuery('')}
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
            <>
              {showClearOption && !query.trim() && (
                <SheetItem
                  title={placeholder}
                  selected={!value}
                  onClick={() => handlePick('')}
                />
              )}
              {groupKeys.map(gKey => (
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
                      title={o.subtitle ? `${o.label} — ${o.subtitle}` : o.label}
                      selected={value === o.value}
                      onClick={() => !o.disabled && handlePick(o.value)}
                    />
                  ))}
                </SheetGroup>
              ))}
            </>
          ) : (
            <>
              <SheetGroup title="" count={filtered.length}>
                {showClearOption && !query.trim() && (
                  <SheetItem
                    title={placeholder}
                    selected={!value}
                    onClick={() => handlePick('')}
                  />
                )}
                {filtered.slice(0, visibleCount).map(o => (
                  <SheetItem
                    key={o.value}
                    icon={o.icon}
                    title={o.subtitle ? `${o.label} — ${o.subtitle}` : o.label}
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
                  + نمایش {getGlobalFormat().count(Math.min(10, filtered.length - visibleCount))} مورد بیشتر
                  ({getGlobalFormat().count(filtered.length - visibleCount)} باقی‌مانده)
                </button>
              )}
            </>
          )}
        </SelectSheetShell>
      )}
    </div>
  );
}
