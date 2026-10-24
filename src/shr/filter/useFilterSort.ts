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
  const [sortStack, setSortStack] = useState<SortState[]>(() => {
    if (!persistKey) return initialSort ? [initialSort] : [];
    try {
      const raw = localStorage.getItem(LS_PREFIX + persistKey + '-sort');
      if (!raw) return initialSort ? [initialSort] : [];
      const parsed = JSON.parse(raw);
      // 🆕 migration: single object → array (backward compat)
      if (Array.isArray(parsed)) return parsed;
      if (parsed && typeof parsed === 'object' && 'key' in parsed) return [parsed as SortState];
      return initialSort ? [initialSort] : [];
    } catch { return initialSort ? [initialSort] : []; }
  });

  // ذخیره در localStorage
  useEffect(() => {
    if (!persistKey) return;
    try { localStorage.setItem(LS_PREFIX + persistKey, JSON.stringify(filterState)); } catch {}
  }, [persistKey, filterState]);
  useEffect(() => {
    if (!persistKey) return;
    try {
      if (sortStack.length > 0) localStorage.setItem(LS_PREFIX + persistKey + '-sort', JSON.stringify(sortStack));
      else localStorage.removeItem(LS_PREFIX + persistKey + '-sort');
    } catch {}
  }, [persistKey, sortStack]);

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
    setSortStack(cur => {
      const first = cur[0];
      if (!first || first.key !== key) return [{ key, dir: 'asc' }];
      if (first.dir === 'asc') return [{ key, dir: 'desc' }];
      return []; // سه حالت: asc → desc → null
    });
  }, []);

  // 🆕 Multi-Sort: افزودن سطح بعدی
  const appendSort = useCallback((key: string) => {
    setSortStack(cur => {
      const idx = cur.findIndex(s => s.key === key);
      if (idx === -1) return [...cur, { key, dir: 'asc' }];
      const item = cur[idx];
      if (item.dir === 'asc') {
        const next = [...cur];
        next[idx] = { key, dir: 'desc' };
        return next;
      }
      return cur.filter((_, i) => i !== idx);
    });
  }, []);

  const removeSortLevel = useCallback((key: string) => {
    setSortStack(cur => cur.filter(s => s.key !== key));
  }, []);

  const setSort = useCallback(
    (s: SortState | null | ((prev: SortState | null) => SortState | null)) => {
      setSortStack(cur => {
        const prev = cur[0] ?? null;
        const next = typeof s === 'function' ? s(prev) : s;
        return next ? [next] : [];
      });
    },
    []
  );

  const resetAll = useCallback(() => {
    setSearch('');
    setFilterState({});
    setSortStack([]);
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

    // مرتب‌سازی — multi-level
    if (sortStack.length > 0) {
      result.sort((a, b) => {
        for (const level of sortStack) {
          const def = sorts.find(s => s.key === level.key);
          if (!def) continue;
          const c = def.compare(a, b);
          if (c !== 0) return level.dir === 'asc' ? c : -c;
        }
        return 0;
      });
    }

    return result;
  }, [items, search, filterState, sortStack, filters, sorts, getSearchText]);

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
    sort: sortStack[0] ?? null, setSort, toggleSort,
    sortStack, appendSort, removeSortLevel,
    resetAll,
  };
}
