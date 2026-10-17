/**
 * useFilterSort — هوک مرکزی فیلتر، جستجو، مرتب‌سازی
 */
import { useState, useMemo, useCallback, useEffect } from 'react';
import type {
  UseFilterSortOptions, UseFilterSortResult, FilterState, SortState,
} from './types';

const LS_PREFIX = 'pm-filter-';

function loadPersisted<T>(key: string, fallback: T): T {
  if (!key) return fallback;
  try {
    const raw = localStorage.getItem(LS_PREFIX + key);
    return raw ? { ...fallback, ...JSON.parse(raw) } : fallback;
  } catch { return fallback; }
}

export function useFilterSort<T>(opts: UseFilterSortOptions<T>): UseFilterSortResult<T> {
  const {
    items, searchKeys, filters = [], sorts = [],
    persistKey, initialFilters = {}, initialSort,
  } = opts;

  const [search, setSearch] = useState<string>('');
  const [filterState, setFilterState] = useState<FilterState>(() =>
    loadPersisted(persistKey || '', initialFilters)
  );
  const [sortState, setSortState] = useState<SortState | null>(() => {
    if (!persistKey) return initialSort || null;
    try {
      const raw = localStorage.getItem(LS_PREFIX + persistKey + '-sort');
      return raw ? JSON.parse(raw) : (initialSort || null);
    } catch { return initialSort || null; }
  });

  // ذخیره در localStorage
  useEffect(() => {
    if (!persistKey) return;
    try { localStorage.setItem(LS_PREFIX + persistKey, JSON.stringify(filterState)); } catch {}
  }, [persistKey, filterState]);
  useEffect(() => {
    if (!persistKey) return;
    try {
      if (sortState) localStorage.setItem(LS_PREFIX + persistKey + '-sort', JSON.stringify(sortState));
      else localStorage.removeItem(LS_PREFIX + persistKey + '-sort');
    } catch {}
  }, [persistKey, sortState]);

  const setFilter = useCallback((key: string, value: any) => {
    setFilterState(s => ({ ...s, [key]: value }));
  }, []);

  const clearFilter = useCallback((key: string) => {
    setFilterState(s => {
      const next = { ...s };
      delete next[key];
      return next;
    });
  }, []);

  const toggleSort = useCallback((key: string) => {
    setSortState(cur => {
      if (!cur || cur.key !== key) return { key, dir: 'asc' };
      if (cur.dir === 'asc') return { key, dir: 'desc' };
      return null; // سه حالت: asc → desc → null
    });
  }, []);

  const resetAll = useCallback(() => {
    setSearch('');
    setFilterState({});
    setSortState(null);
  }, []);

  // استخراج متن جستجو
  const getSearchText = useCallback((item: T): string => {
    if (typeof searchKeys === 'function') return searchKeys(item);
    if (Array.isArray(searchKeys)) {
      return searchKeys.map(k => String(item[k] ?? '')).join(' ').toLowerCase();
    }
    return '';
  }, [searchKeys]);

  const filtered = useMemo(() => {
    let result = [...items];

    // جستجو
    const q = search.trim().toLowerCase();
    if (q) {
      result = result.filter(it => getSearchText(it).includes(q));
    }

    // فیلترها
    for (const def of filters) {
      const val = filterState[def.key];
      if (val === undefined || val === null || val === '' ||
          (Array.isArray(val) && val.length === 0) ||
          (Array.isArray(val) && val.every(v => v === ''))) continue;

      result = result.filter(item => {
        const v = def.getValue(item);
        if (def.kind === 'enum') {
          // 🆕 پشتیبانی از multi-membership
          const values = def.getValues
            ? def.getValues(item).map(x => String(x))
            : [String(v ?? '')];
          if (Array.isArray(val)) {
            return (val as string[]).some(selected => values.includes(selected));
          }
          return values.includes(String(val));
        }
        if (def.kind === 'boolean') {
          return Boolean(v) === Boolean(val);
        }
        if (def.kind === 'numberRange') {
          const [min, max] = val as [number, number];
          const n = Number(v ?? 0);
          if (min != null && n < min) return false;
          if (max != null && n > max) return false;
          return true;
        }
        if (def.kind === 'dateRange') {
          const [from, to] = val as [string, string];
          const s = String(v ?? '');
          if (from && s < from) return false;
          if (to && s > to) return false;
          return true;
        }
        return true;
      });
    }

    // مرتب‌سازی
    if (sortState) {
      const def = sorts.find(s => s.key === sortState.key);
      if (def) {
        result.sort((a, b) => {
          const c = def.compare(a, b);
          return sortState.dir === 'asc' ? c : -c;
        });
      }
    }

    return result;
  }, [items, search, filterState, sortState, filters, sorts, getSearchText]);

  // ⚠️ sort ≠ filter — sortState به‌عنوان active filter حساب نمی‌شود
  const hasActiveFilters = !!search ||
    Object.values(filterState).some(v => v !== undefined && v !== null && v !== '' &&
      (!Array.isArray(v) || v.length > 0));

  return {
    filtered,
    total: items.length,
    count: filtered.length,
    hasActiveFilters,
    search, setSearch,
    filters: filterState, setFilter, clearFilter,
    sort: sortState, setSort: setSortState, toggleSort,
    resetAll,
  };
}
