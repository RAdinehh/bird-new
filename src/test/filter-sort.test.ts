/**
 * filter-sort.test.ts — تست سیستم فیلتر مرکزی
 */
import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useFilterSort } from '../shr/filter/useFilterSort';

interface Item { id: string; name: string; category: string; stock: number; date: string; }

const items: Item[] = [
  { id: '1', name: 'ذرت',   category: 'feed',     stock: 100, date: '1405/07/01' },
  { id: '2', name: 'دارو',  category: 'medicine', stock: 5,   date: '1405/07/10' },
  { id: '3', name: 'واکسن', category: 'vaccine',  stock: 20,  date: '1405/07/05' },
  { id: '4', name: 'گندم',  category: 'feed',     stock: 50,  date: '1405/07/15' },
];

const filterDefs = [
  {
    key: 'category', label: 'دسته', kind: 'enum' as const,
    options: [
      { value: 'feed', label: 'دان' },
      { value: 'medicine', label: 'دارو' },
      { value: 'vaccine', label: 'واکسن' },
    ],
    getValue: (it: Item) => it.category,
  },
  {
    key: 'stock', label: 'موجودی', kind: 'numberRange' as const,
    getValue: (it: Item) => it.stock,
  },
];

const sortDefs = [
  { key: 'name',  label: 'نام',     compare: (a: Item, b: Item) => a.name.localeCompare(b.name) },
  { key: 'stock', label: 'موجودی',  compare: (a: Item, b: Item) => a.stock - b.stock },
  { key: 'date',  label: 'تاریخ',   compare: (a: Item, b: Item) => a.date.localeCompare(b.date) },
];

describe('useFilterSort — جستجو', () => {
  it('بدون جستجو → همه', () => {
    const { result } = renderHook(() => useFilterSort({ items, searchKeys: ['name'] }));
    expect(result.current.filtered).toHaveLength(4);
  });
  it('جستجوی ذرت → ۱ نتیجه', () => {
    const { result } = renderHook(() => useFilterSort({ items, searchKeys: ['name'] }));
    act(() => result.current.setSearch('ذرت'));
    expect(result.current.filtered).toHaveLength(1);
    expect(result.current.filtered[0].name).toBe('ذرت');
  });
  it('جستجو case-insensitive (فارسی مهم نیست)', () => {
    const { result } = renderHook(() => useFilterSort({ items, searchKeys: ['name'] }));
    act(() => result.current.setSearch('دارو'));
    expect(result.current.filtered).toHaveLength(1);
  });
  it('جستجوی تابع — چند فیلد', () => {
    const { result } = renderHook(() => useFilterSort({
      items, searchKeys: (it: Item) => `${it.name} ${it.category}`,
    }));
    act(() => result.current.setSearch('feed'));
    expect(result.current.filtered).toHaveLength(2);
  });
});

describe('useFilterSort — فیلتر enum تکی', () => {
  it('filter feed → ۲', () => {
    const { result } = renderHook(() => useFilterSort({ items, filters: filterDefs }));
    act(() => result.current.setFilter('category', 'feed'));
    expect(result.current.filtered).toHaveLength(2);
  });
  it('clear filter → بازگشت به ۴', () => {
    const { result } = renderHook(() => useFilterSort({ items, filters: filterDefs }));
    act(() => result.current.setFilter('category', 'feed'));
    act(() => result.current.clearFilter('category'));
    expect(result.current.filtered).toHaveLength(4);
  });
  it('مقدار خالی → نادیده گرفته می‌شه', () => {
    const { result } = renderHook(() => useFilterSort({ items, filters: filterDefs }));
    act(() => result.current.setFilter('category', ''));
    expect(result.current.filtered).toHaveLength(4);
  });
});

describe('useFilterSort — عددی', () => {
  it('stock >= 20 → ۳', () => {
    const { result } = renderHook(() => useFilterSort({ items, filters: filterDefs }));
    act(() => result.current.setFilter('stock', [20, null]));
    expect(result.current.filtered).toHaveLength(3);
  });
  it('stock بین ۱۰ تا ۶۰ → ۲', () => {
    const { result } = renderHook(() => useFilterSort({ items, filters: filterDefs }));
    act(() => result.current.setFilter('stock', [10, 60]));
    expect(result.current.filtered).toHaveLength(2);
  });
});

describe('useFilterSort — مرتب‌سازی', () => {
  it('toggleSort → asc', () => {
    const { result } = renderHook(() => useFilterSort({ items, sorts: sortDefs }));
    act(() => result.current.toggleSort('stock'));
    expect(result.current.filtered[0].stock).toBe(5);
  });
  it('toggleSort دوم → desc', () => {
    const { result } = renderHook(() => useFilterSort({ items, sorts: sortDefs }));
    act(() => result.current.toggleSort('stock'));
    act(() => result.current.toggleSort('stock'));
    expect(result.current.filtered[0].stock).toBe(100);
  });
  it('toggleSort سوم → null', () => {
    const { result } = renderHook(() => useFilterSort({ items, sorts: sortDefs }));
    act(() => result.current.toggleSort('stock'));
    act(() => result.current.toggleSort('stock'));
    act(() => result.current.toggleSort('stock'));
    expect(result.current.sort).toBeNull();
  });
  it('sort + filter با هم', () => {
    const { result } = renderHook(() => useFilterSort({ items, filters: filterDefs, sorts: sortDefs }));
    act(() => result.current.setFilter('category', 'feed'));
    act(() => result.current.toggleSort('stock'));
    expect(result.current.filtered.map(i => i.name)).toEqual(['گندم', 'ذرت']);
  });
});

describe('useFilterSort — reset', () => {
  it('resetAll همه رو پاک می‌کنه', () => {
    const { result } = renderHook(() => useFilterSort({ items, filters: filterDefs, sorts: sortDefs }));
    act(() => result.current.setSearch('ذرت'));
    act(() => result.current.setFilter('category', 'feed'));
    act(() => result.current.toggleSort('stock'));
    act(() => result.current.resetAll());
    expect(result.current.filtered).toHaveLength(4);
    expect(result.current.search).toBe('');
    expect(result.current.sort).toBeNull();
  });
});

describe('useFilterSort — counts', () => {
  it('total و count درست', () => {
    const { result } = renderHook(() => useFilterSort({ items, filters: filterDefs }));
    expect(result.current.total).toBe(4);
    act(() => result.current.setFilter('category', 'feed'));
    expect(result.current.count).toBe(2);
  });
  it('hasActiveFilters', () => {
    const { result } = renderHook(() => useFilterSort({ items, filters: filterDefs }));
    expect(result.current.hasActiveFilters).toBe(false);
    act(() => result.current.setSearch('ذرت'));
    expect(result.current.hasActiveFilters).toBe(true);
  });
});
