import { useState } from 'react';

interface FilterChip {
  id: string;
  label: string;
  value: string;
  onClear: () => void;
}

export function FilterChip({ id: _id, label, value, onClear }: FilterChip) {
  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4,
      padding: '4px 8px',
      background: 'var(--accent-soft)',
      border: '1px solid var(--accent-border)',
      borderRadius: 'var(--r-sm)',
      color: 'var(--accent)',
      fontSize: 'var(--fs-xs)',
      fontWeight: 600,
      whiteSpace: 'nowrap',
    }}>
      <span style={{ color: 'var(--muted)' }}>{label}:</span>
      <span>{value}</span>
      <button
        type="button"
        onClick={onClear}
        aria-label="حذف فیلتر"
        style={{
          background: 'none',
          border: 'none',
          color: 'var(--accent)',
          cursor: 'pointer',
          padding: '0 2px',
          fontFamily: 'inherit',
          fontSize: 12,
          fontWeight: 700,
        }}
      >✕</button>
    </div>
  );
}

interface BarProps {
  chips: FilterChip[];
  onClearAll?: () => void;
}

export function FilterBar({ chips, onClearAll }: BarProps) {
  if (chips.length === 0) return null;
  return (
    <div style={{
      display: 'flex',
      gap: 6,
      padding: '8px 12px',
      overflowX: 'auto',
      scrollbarWidth: 'none',
      alignItems: 'center',
      borderBottom: '1px solid var(--border)',
      background: 'var(--bg)',
    }}>
      <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', fontWeight: 700, flexShrink: 0 }}>
        فیلترها:
      </span>
      {chips.map(c => <FilterChip key={c.id} {...c} />)}
      {chips.length > 1 && onClearAll && (
        <button
          type="button"
          onClick={onClearAll}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--danger)',
            cursor: 'pointer',
            fontFamily: 'inherit',
            fontSize: 'var(--fs-xs)',
            fontWeight: 600,
            flexShrink: 0,
          }}
        >پاک کردن همه</button>
      )}
    </div>
  );
}

// ═══ SavedViews ═══
interface SavedView {
  name: string;
  params: string;
}

interface SVProps {
  module: string;
  currentParams: string;
  onLoad: (params: string) => void;
}

export function SavedViews({ module, currentParams, onLoad }: SVProps) {
  const KEY = `pm-savedviews-${module}`;
  const [views, setViews] = useState<SavedView[]>(() => {
    try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; }
  });
  const [naming, setNaming] = useState(false);
  const [name, setName] = useState('');

  const save = () => {
    if (!name.trim() || !currentParams) return;
    const next = [...views.filter(v => v.name !== name), { name: name.trim(), params: currentParams }];
    localStorage.setItem(KEY, JSON.stringify(next));
    setViews(next);
    setName('');
    setNaming(false);
  };

  const remove = (n: string) => {
    const next = views.filter(v => v.name !== n);
    localStorage.setItem(KEY, JSON.stringify(next));
    setViews(next);
  };

  return (
    <div style={{
      display: 'flex',
      gap: 6,
      padding: '6px 12px',
      overflowX: 'auto',
      scrollbarWidth: 'none',
      alignItems: 'center',
      borderBottom: '1px solid var(--border)',
      background: 'var(--bg)',
    }}>
      <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', fontWeight: 700, flexShrink: 0 }}>
        نمای ذخیره‌شده:
      </span>

      {views.map(v => (
        <button
          key={v.name}
          type="button"
          onClick={() => onLoad(v.params)}
          onContextMenu={(e) => { e.preventDefault(); remove(v.name); }}
          style={{
            padding: '4px 8px',
            background: 'var(--btn-bg)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--r-sm)',
            color: 'var(--text)',
            cursor: 'pointer',
            fontFamily: 'inherit',
            fontSize: 'var(--fs-xs)',
            fontWeight: 600,
            whiteSpace: 'nowrap',
          }}
        >{v.name}</button>
      ))}

      {naming ? (
        <>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') setNaming(false); }}
            placeholder="نام..."
            autoFocus
            style={{
              width: 90,
              padding: '4px 8px',
              background: 'var(--input-bg)',
              border: '1px solid var(--accent-border)',
              borderRadius: 'var(--r-sm)',
              color: 'var(--text)',
              fontFamily: 'inherit',
              fontSize: 'var(--fs-xs)',
              outline: 'none',
            }}
          />
          <button type="button" onClick={save} style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 'var(--fs-xs)', fontWeight: 700 }}>✓</button>
        </>
      ) : (
        currentParams && (
          <button
            type="button"
            onClick={() => setNaming(true)}
            style={{
              padding: '4px 8px',
              background: 'none',
              border: '1px dashed var(--border)',
              borderRadius: 'var(--r-sm)',
              color: 'var(--muted)',
              cursor: 'pointer',
              fontFamily: 'inherit',
              fontSize: 'var(--fs-xs)',
              whiteSpace: 'nowrap',
            }}
          >+ ذخیره</button>
        )
      )}
    </div>
  );
}
