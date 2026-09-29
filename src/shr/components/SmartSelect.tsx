import { useState, useMemo, useEffect } from 'react';
import { Modal, Input, Select } from './ui';
import { toFa } from '../utils/fa';
import { useSet } from '../../mod/set/store';

export interface SmartOption {
  value: string;
  label: string;
  subtitle?: string;
  group?: string;
  disabled?: boolean;
}

interface Props {
  value: string;
  onChange: (value: string) => void;
  options: SmartOption[];
  placeholder?: string;
  groupLabels?: Record<string, string>;
  groupIcons?: Record<string, string>;
  autoThreshold?: number;
  disabled?: boolean;
  modalTitle?: string;
  // جدید
  required?: boolean;
  error?: string;
  warn?: string;
  compact?: boolean;
}

export default function SmartSelect({
  value,
  onChange,
  options,
  placeholder = '— انتخاب کنید —',
  groupLabels = {},
  groupIcons = {},
  autoThreshold = 8,
  disabled = false,
  modalTitle = 'انتخاب',
  required = false,
  error,
  warn,
  compact = false,
}: Props) {
  const [open, setOpen] = useState(false);
  const [activeGroup, setActiveGroup] = useState('');
  const [query, setQuery] = useState('');

  // lowPowerMode + prefers-reduced-motion
  const lowPower = useSet((st: any) => st.lowPowerMode);
  const [prefersReduced, setPrefersReduced] = useState(false);
  useEffect(() => {
    try {
      const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
      setPrefersReduced(mq.matches);
      const handler = (e: MediaQueryListEvent) => setPrefersReduced(e.matches);
      mq.addEventListener('change', handler);
      return () => mq.removeEventListener('change', handler);
    } catch {
      /* silent */
    }
  }, []);
  const noAnim = !!(lowPower || prefersReduced);

  // Groups
  const groups = useMemo(
    () => Array.from(new Set(options.map(o => o.group).filter(Boolean))) as string[],
    [options]
  );

  const countByGroup = useMemo(() => {
    const m: Record<string, number> = {};
    options.forEach(o => {
      if (o.group) m[o.group] = (m[o.group] || 0) + 1;
    });
    return m;
  }, [options]);

  const filtered = useMemo(() => {
    let arr = options;
    if (activeGroup) arr = arr.filter(o => o.group === activeGroup);
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      arr = arr.filter(
        o =>
          o.label.toLowerCase().includes(q) ||
          (o.subtitle?.toLowerCase() || '').includes(q)
      );
    }
    return arr;
  }, [options, activeGroup, query]);

  // border color
  const borderColor = error
    ? 'var(--danger)'
    : warn
    ? 'var(--warn)'
    : 'var(--border)';

  const height = compact ? 32 : 38;
  const fontSize = compact ? 'var(--fs-sm)' : 'var(--fs-base)';

  // ========== لیست کوتاه — Select بومی ==========
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
            borderColor,
            height,
            fontSize,
            opacity: disabled ? 0.55 : 1,
          }}
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

  // ========== لیست بلند — Modal با جستجو ==========
  const current = options.find(o => o.value === value);

  const handlePick = (val: string) => {
    onChange(val);
    setOpen(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
      {/* Trigger */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          if (disabled) return;
          setOpen(true);
          setQuery('');
          setActiveGroup('');
        }}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={required ? `${placeholder} (اجباری)` : placeholder}
        aria-invalid={!!error}
        aria-required={required}
        style={{
          width: '100%',
          height,
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
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 8,
          minWidth: 0,
          outline: 'none',
          transition: noAnim ? 'none' : 'border-color var(--dur-base)',
        }}
        onFocus={e => {
          if (!disabled) {
            e.currentTarget.style.boxShadow = '0 0 0 2px var(--accent-soft)';
          }
        }}
        onBlur={e => {
          e.currentTarget.style.boxShadow = 'none';
        }}
      >
        <span
          style={{
            fontWeight: current ? 600 : 400,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {current ? current.label : placeholder}
          {required && !current ? (
            <span style={{ color: 'var(--danger)', marginRight: 4 }}> *</span>
          ) : null}
        </span>
        <span
          aria-hidden="true"
          style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', flexShrink: 0 }}
        >
          ▾
        </span>
      </button>

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

      {/* Modal */}
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={modalTitle}
        footer={null}
      >
        {/* Groups */}
        {groups.length > 1 && (
          <div
            role="tablist"
            style={{
              display: 'flex',
              gap: 6,
              overflowX: 'auto',
              paddingBottom: 8,
              marginBottom: 4,
              borderBottom: '1px solid var(--border)',
            }}
          >
            <button
              type="button"
              onClick={() => setActiveGroup('')}
              style={chip(activeGroup === '')}
              aria-pressed={activeGroup === ''}
            >
              همه ({toFa(options.length)})
            </button>
            {groups.map(g => (
              <button
                key={g}
                type="button"
                onClick={() => setActiveGroup(g)}
                style={chip(activeGroup === g)}
                aria-pressed={activeGroup === g}
              >
                {groupIcons[g] ? groupIcons[g] + ' ' : ''}
                {groupLabels[g] || g} ({toFa(countByGroup[g] || 0)})
              </button>
            ))}
          </div>
        )}

        {/* Search */}
        <div style={{ marginTop: 6, marginBottom: 6 }}>
          <Input
            placeholder="🔍 جستجو..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            aria-label="جستجو در گزینه‌ها"
          />
        </div>

        {/* List */}
        <div
          role="listbox"
          aria-label={modalTitle}
          style={{
            maxHeight: '55vh',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
          }}
        >
          {filtered.length === 0 ? (
            <div
              style={{
                padding: 24,
                textAlign: 'center',
                color: 'var(--muted)',
                fontSize: 'var(--fs-sm)',
                lineHeight: 1.8,
              }}
            >
              🔍
              <div style={{ marginTop: 6 }}>چیزی پیدا نشد</div>
              {query ? (
                <div style={{ fontSize: 'var(--fs-xs)', marginTop: 4 }}>
                  «{query}» در گزینه‌ها نیست
                </div>
              ) : null}
            </div>
          ) : (
            filtered.map(o => {
              const isSelected = o.value === value;
              return (
                <button
                  key={o.value}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  disabled={o.disabled}
                  onClick={() => handlePick(o.value)}
                  style={{
                    width: '100%',
                    textAlign: 'right',
                    padding: compact ? '8px 10px' : '10px 12px',
                    background: isSelected ? 'var(--accent-soft)' : 'var(--input-bg)',
                    border: '1px solid ' + (isSelected ? 'var(--accent-border)' : 'var(--border)'),
                    borderRadius: 'var(--r-md)',
                    cursor: o.disabled ? 'not-allowed' : 'pointer',
                    fontFamily: 'inherit',
                    fontSize: 'var(--fs-base)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 8,
                    color: isSelected ? 'var(--accent)' : 'var(--text)',
                    opacity: o.disabled ? 0.5 : 1,
                    outline: 'none',
                    transition: noAnim ? 'none' : 'background var(--dur-fast)',
                  }}
                  onFocus={e => {
                    e.currentTarget.style.boxShadow = '0 0 0 2px var(--accent-soft)';
                  }}
                  onBlur={e => {
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <span style={{ fontWeight: 600 }}>{o.label}</span>
                  {o.subtitle && (
                    <span
                      style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', flexShrink: 0 }}
                    >
                      {o.subtitle}
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>
      </Modal>
    </div>
  );
}

function chip(active: boolean): React.CSSProperties {
  return {
    padding: '6px 11px',
    fontSize: 'var(--fs-sm)',
    background: active ? 'var(--accent-soft)' : 'var(--btn-bg)',
    border: '1px solid ' + (active ? 'var(--accent-border)' : 'var(--border)'),
    borderRadius: 'var(--r-sm)',
    color: active ? 'var(--accent)' : 'var(--muted)',
    fontWeight: active ? 600 : 500,
    cursor: 'pointer',
    fontFamily: 'inherit',
    whiteSpace: 'nowrap',
    outline: 'none',
  };
}
