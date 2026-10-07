/**
 * filter/configs.ts — کانفیگ‌های مرکزی فیلتر/مرتب برای همه ماژول‌ها
 *
 * هر صفحه یه تابع این‌جا داره که filterDefs + sortDefs برمی‌گردونه.
 * برای تغییر فیلترهای هر صفحه، همین فایل رو ویرایش کن.
 */
import type { ReactNode } from 'react';
import {
  IconFolder, IconActivity, IconTag, IconChart, IconDollar, IconClock,
  IconUser, IconCalendar, IconPackage,
} from '../icons';
import {
  CATEGORY_LABEL, CATEGORY_ICON, stockWarning, MOVEMENT_REASON,
  type Item, type ItemCategory, type Movement, type MovementType,
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


// ═══════════════════════════════════════════════════
// whs/MovesPage — گردش انبار
// ═══════════════════════════════════════════════════
export function getWhsMovesConfig(ctx: { items: Item[] }): FilterConfig<Movement> {
  const itemCategoryOf = (m: Movement): string => {
    const it = ctx.items.find(x => x.id === m.itemId);
    return it?.category || '';
  };

  return {
    filterDefs: [
      {
        key: 'type', label: 'نوع', kind: 'enum',
        icon: <IconActivity size={18} />,
        options: [
          { value: 'in', label: 'ورود', icon: '📥' },
          { value: 'out', label: 'خروج', icon: '📤' },
        ],
        getValue: (m: Movement) => m.type,
      },
      {
        key: 'reason', label: 'دلیل', kind: 'enum',
        icon: <IconTag size={18} />,
        options: (Object.keys(MOVEMENT_REASON) as Array<keyof typeof MOVEMENT_REASON>).map(r => ({
          value: r,
          label: MOVEMENT_REASON[r],
        })),
        getValue: (m: Movement) => m.reason,
        multi: true,
      },
      {
        key: 'category', label: 'دسته کالا', kind: 'enum',
        icon: <IconFolder size={18} />,
        options: (Object.keys(CATEGORY_LABEL) as ItemCategory[]).map(c => ({
          value: c,
          label: CATEGORY_LABEL[c],
          icon: CATEGORY_ICON[c],
        })),
        getValue: itemCategoryOf,
        multi: true,
      },
    ],
    sortDefs: [
      {
        key: 'date', label: 'تاریخ', icon: <IconCalendar size={18} />,
        hint: 'بر اساس تاریخ ثبت',
        compare: (a: Movement, b: Movement) => (a.date || '').localeCompare(b.date || ''),
      },
      {
        key: 'quantity', label: 'مقدار', icon: <IconChart size={18} />,
        hint: 'بر اساس تعداد',
        compare: (a: Movement, b: Movement) => (a.quantity || 0) - (b.quantity || 0),
      },
      {
        key: 'unitPrice', label: 'قیمت واحد', icon: <IconDollar size={18} />,
        hint: 'قیمت هر واحد',
        compare: (a: Movement, b: Movement) => (a.unitPrice || 0) - (b.unitPrice || 0),
      },
    ],
    persistKey: 'whs-moves',
    initialSort: { key: 'date', dir: 'desc' },
  };
}
