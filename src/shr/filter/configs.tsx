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
  CATEGORY_LABEL, CATEGORY_ICON, stockWarning, expiryWarning, MOVEMENT_REASON,
  type Item, type ItemCategory, type Movement, type MovementType,
} from '../../mod/whs/store';
import type { Person, Role } from '../../mod/ctc/store';
import type { Breed, Bird } from '../../mod/brd/store';
import type { Zone, Hall, Equipment } from '../../mod/hal/store';
import { EQUIP_LABELS } from '../../mod/hal/store';
import { ROLE_LABEL, CUSTOMER_TYPES, SUPPLIER_TYPES } from '../../mod/ctc/store';
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

// ═══════════════════════════════════════════════════
// whs/WarningsPage — هشدارهای انبار
// ═══════════════════════════════════════════════════
export function getWhsWarningsConfig(): FilterConfig<Item> {
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
        key: 'warnKind', label: 'نوع هشدار', kind: 'enum',
        icon: <IconActivity size={18} />,
        options: [
          { value: 'expired', label: 'منقضی', icon: '⛔' },
          { value: 'critical', label: 'تمام‌شده', icon: '🔴' },
          { value: 'soon', label: 'نزدیک انقضا', icon: '⏰' },
          { value: 'low', label: 'موجودی کم', icon: '⚠' },
        ],
        getValue: (it: Item) => {
          const exp = it.expireDate ? expiryWarning(it) : 'ok';
          const stock = stockWarning(it);
          if (exp === 'expired') return 'expired';
          if (stock === 'critical') return 'critical';
          if (exp === 'soon') return 'soon';
          if (stock === 'low') return 'low';
          return '';
        },
        multi: true,
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
        key: 'expireDate', label: 'تاریخ انقضا', icon: <IconCalendar size={18} />,
        hint: 'نزدیک‌ترین انقضا اول',
        compare: (a: Item, b: Item) => (a.expireDate || '').localeCompare(b.expireDate || ''),
      },
    ],
    persistKey: 'whs-warnings',
    initialSort: { key: 'expireDate', dir: 'asc' },
  };
}

// ═══════════════════════════════════════════════════
// ctc/ContactsPage — مخاطبین
// ═══════════════════════════════════════════════════
export function getCtcContactsConfig(): FilterConfig<Person> {
  return {
    filterDefs: [
      {
        key: 'role', label: 'نقش', kind: 'enum',
        icon: <IconUser size={18} />,
        options: (Object.keys(ROLE_LABEL) as Role[]).map(r => ({
          value: r,
          label: ROLE_LABEL[r],
        })),
        getValue: (p: Person) => p.roles[0] || '',
        multi: true,
      },
      {
        key: 'city', label: 'شهر', kind: 'enum',
        icon: <IconTag size={18} />,
        options: [
          // شهرها به صورت داینامیک از داده‌ها میاد
          // فعلاً این فیلد خالی می‌مونه و در صورت نیاز پر می‌شه
        ],
        getValue: (p: Person) => p.city || '',
        layout: 'chips',
      },
    ],
    sortDefs: [
      {
        key: 'name', label: 'نام', icon: <IconTag size={18} />,
        hint: 'از الف به ی',
        compare: (a: Person, b: Person) => a.name.localeCompare(b.name, 'fa'),
      },
      {
        key: 'city', label: 'شهر', icon: <IconUser size={18} />,
        hint: 'بر اساس شهر',
        compare: (a: Person, b: Person) => (a.city || '').localeCompare(b.city || '', 'fa'),
      },
      {
        key: 'createdAt', label: 'جدیدترین', icon: <IconClock size={18} />,
        hint: 'بر اساس تاریخ ایجاد',
        compare: (a: Person, b: Person) => (a.createdAt || '').localeCompare(b.createdAt || ''),
      },
    ],
    persistKey: 'ctc-contacts',
    initialSort: { key: 'name', dir: 'asc' },
  };
}

// ═══════════════════════════════════════════════════
// brd/BreedsPage — نژادها
// ═══════════════════════════════════════════════════
export function getBrdBreedsConfig(ctx: { birds: Bird[] }): FilterConfig<Breed> {
  return {
    filterDefs: [
      {
        key: 'birdId', label: 'پرنده', kind: 'enum',
        icon: <IconUser size={18} />,
        options: ctx.birds.map(b => ({ value: b.id, label: b.name })),
        getValue: (br: Breed) => br.birdId || '',
      },
      {
        key: 'hasStandard', label: 'استاندارد', kind: 'enum',
        icon: <IconActivity size={18} />,
        options: [
          { value: 'yes', label: 'دارد' },
          { value: 'no', label: 'ندارد' },
        ],
        getValue: (br: Breed) => br.standardKey ? 'yes' : 'no',
      },
    ],
    sortDefs: [
      {
        key: 'name', label: 'نام نژاد', icon: <IconTag size={18} />,
        hint: 'از الف به ی',
        compare: (a: Breed, b: Breed) => (a.name || '').localeCompare(b.name || '', 'fa'),
      },
      {
        key: 'fcr', label: 'FCR', icon: <IconChart size={18} />,
        hint: 'ضریب تبدیل خوراک',
        compare: (a: Breed, b: Breed) => (a.fcr || 0) - (b.fcr || 0),
      },
      {
        key: 'createdAt', label: 'جدیدترین', icon: <IconClock size={18} />,
        hint: 'بر اساس تاریخ ایجاد',
        compare: (a: Breed, b: Breed) => (a.createdAt || '').localeCompare(b.createdAt || ''),
      },
    ],
    persistKey: 'brd-breeds',
    initialSort: { key: 'name', dir: 'asc' },
  };
}

// ═══════════════════════════════════════════════════
// brd/BirdsPage — پرنده‌ها
// ═══════════════════════════════════════════════════
export function getBrdBirdsConfig(ctx: { breeds: Breed[] }): FilterConfig<Bird> {
  return {
    filterDefs: [
      {
        key: 'hasBreeds', label: 'نژاد', kind: 'enum',
        icon: <IconActivity size={18} />,
        options: [
          { value: 'yes', label: 'دارد' },
          { value: 'no', label: 'ندارد' },
        ],
        getValue: (b: Bird) => ctx.breeds.some(x => x.birdId === b.id) ? 'yes' : 'no',
      },
      {
        key: 'hasCycle', label: 'چرخه', kind: 'enum',
        icon: <IconClock size={18} />,
        options: [
          { value: 'yes', label: 'تعریف شده' },
          { value: 'no', label: 'تعریف نشده' },
        ],
        getValue: (b: Bird) => (b.cycleDays && b.cycleDays > 0) ? 'yes' : 'no',
      },
    ],
    sortDefs: [
      {
        key: 'name', label: 'نام', icon: <IconTag size={18} />,
        hint: 'از الف به ی',
        compare: (a: Bird, b: Bird) => (a.name || '').localeCompare(b.name || '', 'fa'),
      },
      {
        key: 'cycleDays', label: 'طول چرخه', icon: <IconClock size={18} />,
        hint: 'بر اساس تعداد روز',
        compare: (a: Bird, b: Bird) => (a.cycleDays || 0) - (b.cycleDays || 0),
      },
      {
        key: 'createdAt', label: 'جدیدترین', icon: <IconClock size={18} />,
        hint: 'بر اساس تاریخ ایجاد',
        compare: (a: Bird, b: Bird) => (a.createdAt || '').localeCompare(b.createdAt || ''),
      },
    ],
    persistKey: 'brd-birds',
    initialSort: { key: 'name', dir: 'asc' },
  };
}

// ═══════════════════════════════════════════════════
// hal/ZonesPage — بخش‌های سالن
// ═══════════════════════════════════════════════════
export function getHalZonesConfig(ctx: { halls: Hall[] }): FilterConfig<Zone> {
  return {
    filterDefs: [
      {
        key: 'hallId', label: 'سالن', kind: 'enum',
        icon: <IconUser size={18} />,
        options: ctx.halls.map(h => ({ value: h.id, label: h.name })),
        getValue: (z: Zone) => z.hallId || '',
      },
      {
        key: 'hasCapacity', label: 'ظرفیت', kind: 'enum',
        icon: <IconChart size={18} />,
        options: [
          { value: 'yes', label: 'تعریف شده' },
          { value: 'no', label: 'تعریف نشده' },
        ],
        getValue: (z: Zone) => (z.capacity && z.capacity > 0) ? 'yes' : 'no',
      },
    ],
    sortDefs: [
      {
        key: 'name', label: 'نام', icon: <IconTag size={18} />,
        hint: 'از الف به ی',
        compare: (a: Zone, b: Zone) => (a.name || '').localeCompare(b.name || '', 'fa'),
      },
      {
        key: 'capacity', label: 'ظرفیت', icon: <IconChart size={18} />,
        hint: 'بر اساس تعداد',
        compare: (a: Zone, b: Zone) => (a.capacity || 0) - (b.capacity || 0),
      },
      {
        key: 'createdAt', label: 'جدیدترین', icon: <IconClock size={18} />,
        hint: 'بر اساس تاریخ ایجاد',
        compare: (a: Zone, b: Zone) => (a.createdAt || '').localeCompare(b.createdAt || ''),
      },
    ],
    persistKey: 'hal-zones',
    initialSort: { key: 'name', dir: 'asc' },
  };
}

// ═══════════════════════════════════════════════════
// hal/HallsPage — سالن‌ها
// ═══════════════════════════════════════════════════
export function getHalHallsConfig(ctx: {
  birdNames: Array<{ id: string; name: string }>;
  zones: Zone[];
  equipment: Array<{ id: string; hallId?: string }>;
  flocks: Array<{ id: string; hallId?: string; status: string }>;
}): FilterConfig<Hall> {
  return {
    filterDefs: [
      {
        key: 'birdId', label: 'پرنده', kind: 'enum',
        icon: <IconUser size={18} />,
        options: ctx.birdNames.map(b => ({ value: b.id, label: b.name })),
        getValue: (h: Hall) => h.birdId || '',
      },
      {
        key: 'hasZone', label: 'بخش', kind: 'enum',
        icon: <IconActivity size={18} />,
        options: [
          { value: 'yes', label: 'دارد' },
          { value: 'no', label: 'ندارد' },
        ],
        getValue: (h: Hall) => ctx.zones.some(z => z.hallId === h.id) ? 'yes' : 'no',
      },
      {
        key: 'hasEquip', label: 'تجهیزات', kind: 'enum',
        icon: <IconPackage size={18} />,
        options: [
          { value: 'yes', label: 'دارد' },
          { value: 'no', label: 'ندارد' },
        ],
        getValue: (h: Hall) => ctx.equipment.some(e => e.hallId === h.id) ? 'yes' : 'no',
      },
      {
        key: 'hasFlock', label: 'گله فعال', kind: 'enum',
        icon: <IconActivity size={18} />,
        options: [
          { value: 'yes', label: 'دارد' },
          { value: 'no', label: 'ندارد' },
        ],
        getValue: (h: Hall) => ctx.flocks.some(f => f.hallId === h.id && f.status === 'active') ? 'yes' : 'no',
      },
    ],
    sortDefs: [
      {
        key: 'name', label: 'نام سالن', icon: <IconTag size={18} />,
        hint: 'از الف به ی',
        compare: (a: Hall, b: Hall) => (a.name || '').localeCompare(b.name || '', 'fa'),
      },
      {
        key: 'area', label: 'مساحت', icon: <IconChart size={18} />,
        hint: 'طول × عرض',
        compare: (a: Hall, b: Hall) => ((a.length || 0) * (a.width || 0)) - ((b.length || 0) * (b.width || 0)),
      },
      {
        key: 'capacity', label: 'ظرفیت', icon: <IconChart size={18} />,
        hint: 'بر اساس تعداد پرنده',
        compare: (a: Hall, b: Hall) => (a.capacity || 0) - (b.capacity || 0),
      },
      {
        key: 'createdAt', label: 'جدیدترین', icon: <IconClock size={18} />,
        hint: 'بر اساس تاریخ ایجاد',
        compare: (a: Hall, b: Hall) => (a.createdAt || '').localeCompare(b.createdAt || ''),
      },
    ],
    persistKey: 'hal-halls',
    initialSort: { key: 'name', dir: 'asc' },
  };
}

// ═══════════════════════════════════════════════════
// hal/EquipmentPage — تجهیزات
// ═══════════════════════════════════════════════════
export function getHalEquipmentConfig(ctx: { halls: Hall[] }): FilterConfig<Equipment> {
  const KIND_LABELS: Record<string, string> = {
    asset: 'دارایی',
    consumable: 'مصرفی',
    system: 'سیستمی',
  };
  return {
    filterDefs: [
      {
        key: 'hallId', label: 'سالن', kind: 'enum',
        icon: <IconUser size={18} />,
        options: ctx.halls.map(h => ({ value: h.id, label: h.name })),
        getValue: (e: Equipment) => e.hallId || '',
      },
      {
        key: 'kind', label: 'نوع', kind: 'enum',
        icon: <IconActivity size={18} />,
        options: Object.keys(KIND_LABELS).map(k => ({ value: k, label: KIND_LABELS[k] })),
        getValue: (e: Equipment) => e.kind || 'asset',
      },
      {
        key: 'category', label: 'دسته', kind: 'enum',
        icon: <IconFolder size={18} />,
        options: Object.entries(EQUIP_LABELS || {}).map(([k, v]: any) => ({
          value: k,
          label: v.name || v.label || k,
        })),
        getValue: (e: Equipment) => e.category || '',
        multi: true,
      },
      {
        key: 'hasWarranty', label: 'گارانتی', kind: 'enum',
        icon: <IconClock size={18} />,
        options: [
          { value: 'yes', label: 'دارد' },
          { value: 'no', label: 'ندارد' },
        ],
        getValue: (e: Equipment) => (e.warranty && e.warranty > 0) ? 'yes' : 'no',
      },
    ],
    sortDefs: [
      {
        key: 'name', label: 'نام', icon: <IconTag size={18} />,
        hint: 'از الف به ی',
        compare: (a: Equipment, b: Equipment) => (a.name || '').localeCompare(b.name || '', 'fa'),
      },
      {
        key: 'count', label: 'تعداد', icon: <IconChart size={18} />,
        hint: 'بر اساس تعداد',
        compare: (a: Equipment, b: Equipment) => (a.count || 0) - (b.count || 0),
      },
      {
        key: 'value', label: 'ارزش', icon: <IconDollar size={18} />,
        hint: 'تعداد × قیمت',
        compare: (a: Equipment, b: Equipment) => ((a.count || 0) * (a.unitPrice || 0)) - ((b.count || 0) * (b.unitPrice || 0)),
      },
      {
        key: 'purchasedAt', label: 'تاریخ خرید', icon: <IconCalendar size={18} />,
        hint: 'قدیمی‌ترین اول',
        compare: (a: Equipment, b: Equipment) => (a.purchasedAt || '').localeCompare(b.purchasedAt || ''),
      },
      {
        key: 'createdAt', label: 'جدیدترین', icon: <IconClock size={18} />,
        hint: 'بر اساس تاریخ ایجاد',
        compare: (a: Equipment, b: Equipment) => (a.createdAt || '').localeCompare(b.createdAt || ''),
      },
    ],
    persistKey: 'hal-equipment',
    initialSort: { key: 'name', dir: 'asc' },
  };
}
