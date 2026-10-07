/**
 * filter/types.ts — تایپ‌های سیستم فیلتر مرکزی
 */
import type { ReactNode } from 'react';

export type FilterKind = 'enum' | 'dateRange' | 'numberRange' | 'boolean';

export interface FilterOption {
  value: string;
  label: string;
  /** می‌تونه SVG component، ایموجی string، یا هر ReactNode باشه */
  icon?: ReactNode;
}

export interface FilterDef<T> {
  key: string;
  label: string;
  /** آیکون گروه — می‌تونه emoji string یا SVG component باشه */
  icon?: ReactNode;
  kind: FilterKind;
  /** برای enum */
  options?: FilterOption[];
  /** تابع استخراج مقدار از آیتم */
  getValue: (item: T) => string | number | boolean | null | undefined;
  /** آیا فیلتر چند انتخابی؟ (پیش‌فرض: تکی) */
  multi?: boolean;
  /**
   * چیدمان نمایش در Sheet:
   * - 'rows'  → ردیف‌های بلند با چک‌باکس/رادیو (پیش‌فرض برای تک‌انتخابی)
   * - 'chips' → چیپ‌های افقی (پیش‌فرض برای چند‌انتخابی)
   */
  layout?: 'rows' | 'chips';
  /** نمایش فقط وقتی که این شرط true باشد */
  visible?: (item: T) => boolean;
}

export interface SortDef<T> {
  key: string;
  label: string;
  /** آیکون — emoji یا SVG */
  icon?: ReactNode;
  /** توضیح کوتاه — مثل «از الف به ی» */
  hint?: string;
  compare: (a: T, b: T) => number;
}

export type SortDirection = 'asc' | 'desc';

export interface SortState {
  key: string;
  dir: SortDirection;
}

export interface FilterState {
  [key: string]: string | string[] | [string, string] | [number, number] | boolean | null;
}

export interface UseFilterSortOptions<T> {
  items: T[];
  /** کلیدهایی که در جستجو استفاده می‌شن */
  searchKeys?: (keyof T)[] | ((item: T) => string);
  filters?: FilterDef<T>[];
  sorts?: SortDef<T>[];
  /** ذخیره state در localStorage (کلید یکتا) */
  persistKey?: string;
  /** فیلتر پیش‌فرض */
  initialFilters?: FilterState;
  /** مرتب‌سازی پیش‌فرض */
  initialSort?: SortState;
}

export interface UseFilterSortResult<T> {
  /** لیست فیلترشده و مرتب */
  filtered: T[];
  /** تعداد کل */
  total: number;
  /** تعداد نمایش‌داده‌شده */
  count: number;
  /** ایا فیلتری فعال هست؟ */
  hasActiveFilters: boolean;
  // جستجو
  search: string;
  setSearch: (s: string) => void;
  // فیلتر
  filters: FilterState;
  setFilter: (key: string, value: any) => void;
  clearFilter: (key: string) => void;
  // مرتب‌سازی
  sort: SortState | null;
  setSort: (s: SortState | null) => void;
  toggleSort: (key: string) => void;
  // پاک کردن همه
  resetAll: () => void;
}
