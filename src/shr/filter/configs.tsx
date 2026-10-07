/**
 * filter/configs.ts — کانفیگ‌های مرکزی فیلتر/مرتب برای همه ماژول‌ها
 *
 * هر صفحه یه تابع این‌جا داره که filterDefs + sortDefs برمی‌گردونه.
 * برای تغییر فیلترهای هر صفحه، همین فایل رو ویرایش کن.
 */
import type { ReactNode } from 'react';
import {
  IconFolder, IconActivity, IconTag, IconChart, IconDollar, IconClock,
  IconUser, IconCalendar,
} from '../icons';
import {
  CATEGORY_LABEL, CATEGORY_ICON, stockWarning,
  type Item, type ItemCategory,
} from '../../mod/whs/store';
import type { Person } from '../../mod/ctc/store';
import type { FilterDef, SortDef, SortState } from './types';

/** خروجی مشترک همه کانفیگ‌ها */
export interface FilterConfig<T> {
  filterDefs: FilterDef<T>[];
  sortDefs: SortDef<T>[];
  persistKey: string;
  initialSort?: SortState;
}

// ═══════════════════════════════════════════════════
// whs/ItemsPage — اقلام انبار
// ═══════════════════════════════════════════════════
export function getWhsItemsConfig(ctx: { suppliers: Person[] }): FilterConfig<Item> {
  return {
    filterDefs: [
      {
        key: 'category', label: 'دسته', kind: 'enum',
        icon: <IconFolder size={18} />,
        options: (Object.keys(CATEGORY_LABEL) as ItemCategory[]).map(c => ({
          value: c,
          label: CATEGORY_LABEL[c],
          icon: CATEGORY_ICON[c],
        })),
        getValue: (it: Item) => it.category,
        multi: true,
      },
      {
        key: 'stockStatus', label: 'وضعیت موجودی', kind: 'enum',
        icon: <IconActivity size={18} />,
        options: [
          { value: 'critical', label: 'تمام شده' },
          { value: 'low', label: 'کم' },
          { value: 'ok', label: 'موجود' },
        ],
        getValue: (it: Item) => stockWarning(it),
      },
      {
        key: 'supplier', label: 'تأمین‌کننده', kind: 'enum',
        icon: <IconUser size={18} />,
        options: ctx.suppliers.map(c => ({ value: c.id, label: c.name })),
        getValue: (it: Item) => it.supplierId || '',
        layout: 'chips',
      },
    ],
    sortDefs: [
      {
        key: 'name', label: 'نام کالا', icon: <IconTag size={18} />,
        hint: 'از الف به ی',
        compare: (a: Item, b: Item) => a.name.localeCompare(b.name, 'fa'),
      },
      {
        key: 'stock', label: 'موجودی', icon: <IconChart size={18} />,
        hint: 'بر اساس تعداد',
        compare: (a: Item, b: Item) => (a.currentStock || 0) - (b.currentStock || 0),
      },
      {
        key: 'value', label: 'ارزش موجودی', icon: <IconDollar size={18} />,
        hint: 'موجودی × قیمت میانگین',
        compare: (a: Item, b: Item) => {
          // نگاشت موقت: از getAvgPrice در store استفاده نمی‌کنیم چون اینجا import سخت‌تره
          const aVal = (a.currentStock || 0) * (a.avgPrice ?? a.lastPrice ?? 0);
          const bVal = (b.currentStock || 0) * (b.avgPrice ?? b.lastPrice ?? 0);
          return aVal - bVal;
        },
      },
      {
        key: 'createdAt', label: 'جدیدترین', icon: <IconClock size={18} />,
        hint: 'بر اساس تاریخ ایجاد',
        compare: (a: Item, b: Item) => (a.createdAt || '').localeCompare(b.createdAt || ''),
      },
    ],
    persistKey: 'whs-items',
    initialSort: { key: 'createdAt', dir: 'desc' },
  };
}
