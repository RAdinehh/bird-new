/**
 * sortGroup.tsx — کامپوننت‌های مشترک مرتب‌سازی و گروه‌بندی
 * الگوی استاندارد Google/Apple: dropdown کوچیک، آیکون‌دار
 */
import React, { useMemo } from 'react';

// ═══════════════════════════════════════════════
// Sort
// ═══════════════════════════════════════════════
export interface SortOption<T = any> {
  value: string;
  label: string;
  compare: (a: T, b: T) => number;
}

export function useSortedList<T>(items: T[], sortValue: string, options: SortOption<T>[]): T[] {
  return useMemo(() => {
    const opt = options.find(o => o.value === sortValue);
    if (!opt) return items;
    return [...items].sort(opt.compare);
  }, [items, sortValue, options]);
}

interface SortBarProps {
  value: string;
  onChange: (v: string) => void;
  options: SortOption[];
  label?: string;
}

export function SortBar({ value, onChange, options, label = 'مرتب‌سازی' }: SortBarProps) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      padding: '4px 8px',
      background: 'var(--input-bg)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--r-sm)',
      fontSize: 'var(--fs-xs)',
    }}>
      <span aria-hidden="true" style={{ color: 'var(--muted)' }}>⇅</span>
      <span style={{ color: 'var(--muted)', fontWeight: 600 }}>{label}:</span>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        aria-label={label}
        style={{
          flex: 1,
          background: 'transparent',
          border: 'none',
          color: 'var(--text)',
          fontFamily: 'inherit',
          fontSize: 'var(--fs-xs)',
          fontWeight: 700,
          cursor: 'pointer',
          outline: 'none',
          textAlign: 'right',
        }}
      >
        {options.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}

// ═══════════════════════════════════════════════
// Group
// ═══════════════════════════════════════════════
export interface GroupResult<T> {
  key: string;
  label: string;
  items: T[];
}

export function useGroupedList<T>(
  items: T[],
  groupBy: (item: T) => { key: string; label: string } | null
): GroupResult<T>[] {
  return useMemo(() => {
    const map = new Map<string, GroupResult<T>>();
    items.forEach(item => {
      const g = groupBy(item);
      if (!g) return;
      if (!map.has(g.key)) {
        map.set(g.key, { key: g.key, label: g.label, items: [] });
      }
      map.get(g.key)!.items.push(item);
    });
    return Array.from(map.values());
  }, [items, groupBy]);
}

interface GroupHeaderProps {
  label: string;
  count: number;
}

export function GroupHeader({ label, count }: GroupHeaderProps) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '6px 8px',
      background: 'var(--input-bg)',
      borderRadius: 'var(--r-sm)',
      border: '1px solid var(--border)',
      fontSize: 'var(--fs-xs)',
      fontWeight: 700,
      color: 'var(--muted)',
      marginTop: 4,
    }}>
      <span>{label}</span>
      <span style={{
        padding: '1px 8px',
        background: 'var(--accent-soft)',
        color: 'var(--accent)',
        borderRadius: 'var(--r-sm)',
        fontSize: 'var(--fs-xs)',
      }}>{count}</span>
    </div>
  );
}
