import { useState, useMemo } from 'react';
import { Modal, Input, Select } from './ui';
import { toFa } from '../utils/fa';

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
}

export default function SmartSelect({
  value, onChange, options,
  placeholder = '— انتخاب کنید —',
  groupLabels = {}, groupIcons = {},
  autoThreshold = 8, disabled = false,
  modalTitle = 'انتخاب',
}: Props) {
  const [open, setOpen] = useState(false);
  const [activeGroup, setActiveGroup] = useState('');
  const [query, setQuery] = useState('');

  const groups = useMemo(
    () => Array.from(new Set(options.map(o => o.group).filter(Boolean))) as string[],
    [options]
  );

  const countByGroup = useMemo(() => {
    const m: Record<string, number> = {};
    options.forEach(o => { if (o.group) m[o.group] = (m[o.group] || 0) + 1; });
    return m;
  }, [options]);

  const filtered = useMemo(() => {
    let arr = options;
    if (activeGroup) arr = arr.filter(o => o.group === activeGroup);
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      arr = arr.filter(o =>
        o.label.toLowerCase().includes(q) ||
        (o.subtitle?.toLowerCase() || '').includes(q)
      );
    }
    return arr;
  }, [options, activeGroup, query]);

  // لیست کوتاه — Select بومی
  if (options.length <= autoThreshold) {
    return (
      <Select value={value} onChange={e => onChange(e.target.value)} disabled={disabled}>
        <option value="">{placeholder}</option>
        {options.map(o => (
          <option key={o.value} value={o.value} disabled={o.disabled}>
            {o.label}{o.subtitle ? ` — ${o.subtitle}` : ''}
          </option>
        ))}
      </Select>
    );
  }

  // لیست بلند — Modal با جستجو
  const current = options.find(o => o.value === value);

  return (
    <>
      <button
        type="button"
        disabled={disabled}
        onClick={() => { setOpen(true); setQuery(''); setActiveGroup(''); }}
        style={{
          width: '100%', textAlign: 'right',
          padding: '10px 12px',
          background: 'var(--input-bg)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--r-sm)',
          cursor: disabled ? 'not-allowed' : 'pointer',
          fontFamily: 'inherit',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          fontSize: 'var(--fs-sm)',
          color: current ? 'var(--text)' : 'var(--muted)',
          opacity: disabled ? 0.5 : 1,
        }}
      >
        <span style={{ fontWeight: current ? 600 : 400 }}>
          {current ? current.label : placeholder}
        </span>
        <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)' }}>▾</span>
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title={modalTitle} footer={null}>
        {groups.length > 1 && (
          <div style={{
            display: 'flex', gap: 6, overflowX: 'auto',
            paddingBottom: 8, marginBottom: 4,
            borderBottom: '1px solid var(--border)'
          }}>
            <button onClick={() => setActiveGroup('')} style={chip(activeGroup === '')}>
              همه ({toFa(options.length)})
            </button>
            {groups.map(g => (
              <button key={g} onClick={() => setActiveGroup(g)} style={chip(activeGroup === g)}>
                {groupIcons[g] ? groupIcons[g] + ' ' : ''}{groupLabels[g] || g} ({toFa(countByGroup[g] || 0)})
              </button>
            ))}
          </div>
        )}

        <div style={{ marginTop: 6, marginBottom: 6 }}>
          <Input
            placeholder="🔍 جستجو..."
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
        </div>

        <div style={{ maxHeight: '55vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
          {filtered.length === 0 ? (
            <div style={{ padding: 20, textAlign: 'center', color: 'var(--muted)', fontSize: 'var(--fs-sm)' }}>
              چیزی پیدا نشد
            </div>
          ) : (
            filtered.map(o => (
              <button
                key={o.value}
                onClick={() => { onChange(o.value); setOpen(false); }}
                disabled={o.disabled}
                style={{
                  width: '100%', textAlign: 'right',
                  padding: '10px 12px',
                  background: o.value === value ? 'var(--accent-soft)' : 'var(--input-bg)',
                  border: '1px solid ' + (o.value === value ? 'var(--accent-border)' : 'var(--border)'),
                  borderRadius: 'var(--r-sm)',
                  cursor: o.disabled ? 'not-allowed' : 'pointer',
                  fontFamily: 'inherit', fontSize: 'var(--fs-sm)',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  color: o.value === value ? 'var(--accent)' : 'var(--text)',
                  opacity: o.disabled ? 0.5 : 1,
                }}
              >
                <span style={{ fontWeight: 600 }}>{o.label}</span>
                {o.subtitle && (
                  <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)' }}>{o.subtitle}</span>
                )}
              </button>
            ))
          )}
        </div>
      </Modal>
    </>
  );
}

function chip(active: boolean): React.CSSProperties {
  return {
    padding: '6px 11px', fontSize: 'var(--fs-sm)',
    background: active ? 'var(--accent-soft)' : 'var(--btn-bg)',
    border: '1px solid ' + (active ? 'var(--accent-border)' : 'var(--border)'),
    borderRadius: 'var(--r-sm)',
    color: active ? 'var(--accent)' : 'var(--muted)',
    fontWeight: active ? 600 : 500,
    cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap',
  };
}
