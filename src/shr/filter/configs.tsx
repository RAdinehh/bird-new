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
import {
  type Alert, LEVEL_LABEL as ALT_LEVEL_LABEL, CATEGORY_LABEL as ALT_CAT_LABEL,
} from '../../mod/alt/store';
import {
  type Deal, type Invoice,
  DEAL_LABEL as TRA_DEAL_LABEL,
  remaining as traRemaining, ageDays as traAgeDays, agingBucket as traAgingBucket,
  WORKFLOW_LABEL as TRA_WORKFLOW_LABEL,
} from '../../mod/tra/store';
import {
  type Ingredient, type Formula, type Requirement,
  CATEGORY_LABEL as FED_CAT_LABEL, CATEGORY_ICON as FED_CAT_ICON,
  STAGE_LABEL as FED_STAGE_LABEL,
} from '../../mod/fed/store';
import type { Breed, Bird } from '../../mod/brd/store';
import type { Zone, Hall, Equipment } from '../../mod/hal/store';
import { type Flock, isLayingReady, getAgeDays as flkGetAgeDays } from '../../mod/flk/store';
import type { EggProduction } from '../../mod/egg/store';
import type { DailyLog } from '../../mod/dlg/store';
import {
  type HatchResult, type Device, type EggEntry, type Candling,
  DEVICE_MODE_LABEL, DEVICE_STATUS_LABEL,
  DEAL_LABEL, ENTRY_STATUS_LABEL,
} from '../../mod/inc/store';
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

// ═══════════════════════════════════════════════════
// flk/FlocksPage — گله‌ها
// ═══════════════════════════════════════════════════
export function getFlkFlocksConfig(ctx: {
  birds: Array<{ id: string; name: string }>;
  halls: Array<{ id: string; name: string }>;
}): FilterConfig<Flock> {
  return {
    filterDefs: [
      {
        key: 'status', label: 'وضعیت', kind: 'enum',
        icon: <IconActivity size={18} />,
        options: [
          { value: 'active', label: 'فعال' },
          { value: 'hidden', label: 'پنهان' },
          { value: 'archived', label: 'آرشیو' },
          { value: 'sold', label: 'فروخته شده' },
        ],
        getValue: (f: Flock) => {
          if (f.status === 'archived' || f.status === 'sold') return f.status;
          if (f.hidden) return 'hidden';
          return 'active';
        },
        multi: true,
      },
      {
        key: 'type', label: 'نوع گله', kind: 'enum',
        icon: <IconTag size={18} />,
        options: [
          { value: 'layer', label: '🥚 تخم‌گذار' },
          { value: 'broiler', label: '🍗 گوشتی' },
          { value: 'breeder', label: '🧬 مادر' },
        ],
        getValue: (f: Flock) => f.type || '',
        multi: true,
      },
      {
        key: 'birdId', label: 'پرنده', kind: 'enum',
        icon: <IconUser size={18} />,
        options: ctx.birds.map(b => ({ value: b.id, label: b.name })),
        getValue: (f: Flock) => f.birdId || '',
        multi: true,
      },
      {
        key: 'hallId', label: 'سالن', kind: 'enum',
        icon: <IconFolder size={18} />,
        options: ctx.halls.map(h => ({ value: h.id, label: h.name })),
        getValue: (f: Flock) => f.hallId || '',
      },
      {
        key: 'ready', label: 'آماده تخم‌گذاری', kind: 'enum',
        icon: <IconChart size={18} />,
        options: [
          { value: 'yes', label: 'آماده' },
          { value: 'no', label: 'نزدیک' },
        ],
        getValue: (f: Flock) => isLayingReady(f) ? 'yes' : 'no',
      },
    ],
    sortDefs: [
      {
        key: 'name', label: 'نام گله', icon: <IconTag size={18} />,
        hint: 'از الف به ی',
        compare: (a: Flock, b: Flock) => (a.name || '').localeCompare(b.name || '', 'fa'),
      },
      {
        key: 'count', label: 'تعداد فعلی', icon: <IconChart size={18} />,
        hint: 'بر اساس تعداد پرنده',
        compare: (a: Flock, b: Flock) => (a.currentCount || 0) - (b.currentCount || 0),
      },
      {
        key: 'initialCount', label: 'تعداد اولیه', icon: <IconChart size={18} />,
        hint: 'بر اساس تعداد اولیه',
        compare: (a: Flock, b: Flock) => (a.initialCount || 0) - (b.initialCount || 0),
      },
      {
        key: 'createdAt', label: 'جدیدترین', icon: <IconClock size={18} />,
        hint: 'بر اساس تاریخ ایجاد',
        compare: (a: Flock, b: Flock) => (a.createdAt || '').localeCompare(b.createdAt || ''),
      },
    ],
    persistKey: 'flk-flocks',
    initialSort: { key: 'createdAt', dir: 'desc' },
  };
}

// ═══════════════════════════════════════════════════
// egg/ProductionsPage — تخم‌گذاری روزانه
// ═══════════════════════════════════════════════════
export function getEggProductionsConfig(ctx: {
  flocks: Array<{ id: string; name: string }>;
}): FilterConfig<EggProduction> {
  return {
    filterDefs: [
      {
        key: 'flockId', label: 'گله', kind: 'enum',
        icon: <IconUser size={18} />,
        options: ctx.flocks.map(f => ({ value: f.id, label: f.name })),
        getValue: (p: EggProduction) => p.flockId || '',
        multi: true,
      },
      {
        key: 'hasBroken', label: 'تخم شکسته', kind: 'enum',
        icon: <IconActivity size={18} />,
        options: [
          { value: 'yes', label: 'دارد' },
          { value: 'no', label: 'ندارد' },
        ],
        getValue: (p: EggProduction) => (p.brokenCount && p.brokenCount > 0) ? 'yes' : 'no',
      },
      {
        key: 'hasWeight', label: 'وزن ثبت شده', kind: 'enum',
        icon: <IconChart size={18} />,
        options: [
          { value: 'yes', label: 'ثبت شده' },
          { value: 'no', label: 'ثبت نشده' },
        ],
        getValue: (p: EggProduction) => (p.avgWeight && p.avgWeight > 0) ? 'yes' : 'no',
      },
    ],
    sortDefs: [
      {
        key: 'date', label: 'تاریخ', icon: <IconCalendar size={18} />,
        hint: 'جدیدترین اول',
        compare: (a: EggProduction, b: EggProduction) => (a.date || '').localeCompare(b.date || ''),
      },
      {
        key: 'total', label: 'کل تخم', icon: <IconChart size={18} />,
        hint: 'بر اساس تعداد کل',
        compare: (a: EggProduction, b: EggProduction) => (a.totalCount || 0) - (b.totalCount || 0),
      },
      {
        key: 'fertile', label: 'نطفه‌دار', icon: <IconChart size={18} />,
        hint: 'بر اساس تعداد نطفه‌دار',
        compare: (a: EggProduction, b: EggProduction) => (a.fertileCount || 0) - (b.fertileCount || 0),
      },
      {
        key: 'broken', label: 'شکسته', icon: <IconActivity size={18} />,
        hint: 'بر اساس تعداد شکسته',
        compare: (a: EggProduction, b: EggProduction) => (a.brokenCount || 0) - (b.brokenCount || 0),
      },
      {
        key: 'createdAt', label: 'جدیدترین ثبت', icon: <IconClock size={18} />,
        hint: 'بر اساس تاریخ ایجاد',
        compare: (a: EggProduction, b: EggProduction) => (a.createdAt || '').localeCompare(b.createdAt || ''),
      },
    ],
    persistKey: 'egg-productions',
    initialSort: { key: 'date', dir: 'desc' },
  };
}

// ═══════════════════════════════════════════════════
// dlg/DailyLogsPage — ثبت روزانه
// ═══════════════════════════════════════════════════
export function getDlgLogsConfig(ctx: {
  flocks: Array<{ id: string; name: string }>;
}): FilterConfig<DailyLog> {
  return {
    filterDefs: [
      {
        key: 'flockId', label: 'گله', kind: 'enum',
        icon: <IconUser size={18} />,
        options: ctx.flocks.map(f => ({ value: f.id, label: f.name })),
        getValue: (l: DailyLog) => l.flockId || '',
        multi: true,
      },
      {
        key: 'hasDeaths', label: 'تلفات', kind: 'enum',
        icon: <IconActivity size={18} />,
        options: [
          { value: 'yes', label: 'دارد' },
          { value: 'no', label: 'ندارد' },
        ],
        getValue: (l: DailyLog) => (l.deaths && l.deaths.length > 0 && l.deaths.some((d: any) => (d.count || 0) > 0)) ? 'yes' : 'no',
      },
      {
        key: 'hasVaccine', label: 'واکسن', kind: 'enum',
        icon: <IconPackage size={18} />,
        options: [
          { value: 'yes', label: 'دارد' },
          { value: 'no', label: 'ندارد' },
        ],
        getValue: (l: DailyLog) => (l.vaccines && l.vaccines.length > 0) ? 'yes' : 'no',
      },
      {
        key: 'hasMed', label: 'دارو', kind: 'enum',
        icon: <IconPackage size={18} />,
        options: [
          { value: 'yes', label: 'دارد' },
          { value: 'no', label: 'ندارد' },
        ],
        getValue: (l: DailyLog) => (l.medications && l.medications.length > 0) ? 'yes' : 'no',
      },
      {
        key: 'hasWeight', label: 'وزن‌کشی', kind: 'enum',
        icon: <IconChart size={18} />,
        options: [
          { value: 'yes', label: 'دارد' },
          { value: 'no', label: 'ندارد' },
        ],
        getValue: (l: DailyLog) => (l.weightSamples && l.weightSamples.length > 0) ? 'yes' : 'no',
      },
    ],
    sortDefs: [
      {
        key: 'date', label: 'تاریخ', icon: <IconCalendar size={18} />,
        hint: 'جدیدترین اول',
        compare: (a: DailyLog, b: DailyLog) => (a.date || '').localeCompare(b.date || ''),
      },
      {
        key: 'temperature', label: 'دما', icon: <IconChart size={18} />,
        hint: 'بر اساس دما',
        compare: (a: DailyLog, b: DailyLog) => (a.temperature || 0) - (b.temperature || 0),
      },
      {
        key: 'feedAmount', label: 'دان مصرفی', icon: <IconChart size={18} />,
        hint: 'بر اساس مقدار دان',
        compare: (a: DailyLog, b: DailyLog) => (a.feedAmount || 0) - (b.feedAmount || 0),
      },
      {
        key: 'createdAt', label: 'جدیدترین ثبت', icon: <IconClock size={18} />,
        hint: 'بر اساس تاریخ ایجاد',
        compare: (a: DailyLog, b: DailyLog) => (a.createdAt || '').localeCompare(b.createdAt || ''),
      },
    ],
    persistKey: 'dlg-logs',
    initialSort: { key: 'date', dir: 'desc' },
  };
}

// ═══════════════════════════════════════════════════
// inc/HatchesPage — هچ (نتیجه نهایی)
// ═══════════════════════════════════════════════════
export function getIncHatchesConfig(ctx: {
  devices: Array<{ id: string; name: string }>;
  eggEntriesById: Record<string, EggEntry>;
}): FilterConfig<HatchResult> {
  return {
    filterDefs: [
      {
        key: 'deviceId', label: 'دستگاه', kind: 'enum',
        icon: <IconPackage size={18} />,
        options: ctx.devices.map(d => ({ value: d.id, label: d.name })),
        getValue: (h: HatchResult) => {
          const entry = ctx.eggEntriesById[h.eggEntryId];
          return entry?.deviceId || '';
        },
        multi: true,
      },
      {
        key: 'hasGrade', label: 'درجه‌بندی', kind: 'enum',
        icon: <IconTag size={18} />,
        options: [
          { value: 'yes', label: 'دارد' },
          { value: 'no', label: 'ندارد' },
        ],
        getValue: (h: HatchResult) => (h.gradeA || h.gradeB) ? 'yes' : 'no',
      },
      {
        key: 'hasFlock', label: 'گله ساخته', kind: 'enum',
        icon: <IconActivity size={18} />,
        options: [
          { value: 'yes', label: 'ساخته شده' },
          { value: 'no', label: 'ساخته نشده' },
        ],
        getValue: (h: HatchResult) => h.generatedFlockId ? 'yes' : 'no',
      },
      {
        key: 'hasInvoice', label: 'فاکتور فروش', kind: 'enum',
        icon: <IconDollar size={18} />,
        options: [
          { value: 'yes', label: 'دارد' },
          { value: 'no', label: 'ندارد' },
        ],
        getValue: (h: HatchResult) => h.generatedInvoiceId ? 'yes' : 'no',
      },
    ],
    sortDefs: [
      {
        key: 'date', label: 'تاریخ', icon: <IconCalendar size={18} />,
        hint: 'جدیدترین اول',
        compare: (a: HatchResult, b: HatchResult) => (a.date || '').localeCompare(b.date || ''),
      },
      {
        key: 'hatched', label: 'تعداد هچ', icon: <IconChart size={18} />,
        hint: 'بر اساس تعداد جوجه',
        compare: (a: HatchResult, b: HatchResult) => (a.hatched || 0) - (b.hatched || 0),
      },
      {
        key: 'deadInShell', label: 'تلفات جنینی', icon: <IconChart size={18} />,
        hint: 'بر اساس تعداد',
        compare: (a: HatchResult, b: HatchResult) => (a.deadInShell || 0) - (b.deadInShell || 0),
      },
      {
        key: 'createdAt', label: 'جدیدترین ثبت', icon: <IconClock size={18} />,
        hint: 'بر اساس تاریخ ایجاد',
        compare: (a: HatchResult, b: HatchResult) => (a.createdAt || '').localeCompare(b.createdAt || ''),
      },
    ],
    persistKey: 'inc-hatches',
    initialSort: { key: 'date', dir: 'desc' },
  };
}

// ═══════════════════════════════════════════════════
// inc/DevicesPage — دستگاه‌های جوجه‌کشی
// ═══════════════════════════════════════════════════
export function getIncDevicesConfig(): FilterConfig<Device> {
  return {
    filterDefs: [
      {
        key: 'mode', label: 'حالت', kind: 'enum',
        icon: <IconActivity size={18} />,
        options: (Object.keys(DEVICE_MODE_LABEL) as Array<keyof typeof DEVICE_MODE_LABEL>).map(m => ({
          value: m,
          label: DEVICE_MODE_LABEL[m],
        })),
        getValue: (d: Device) => d.mode || 'setter',
        multi: true,
      },
      {
        key: 'status', label: 'وضعیت', kind: 'enum',
        icon: <IconTag size={18} />,
        options: (Object.keys(DEVICE_STATUS_LABEL) as Array<keyof typeof DEVICE_STATUS_LABEL>).map(s => ({
          value: s,
          label: DEVICE_STATUS_LABEL[s],
        })),
        getValue: (d: Device) => d.status || 'active',
        multi: true,
      },
      {
        key: 'hasWarranty', label: 'گارانتی', kind: 'enum',
        icon: <IconClock size={18} />,
        options: [
          { value: 'yes', label: 'دارد' },
          { value: 'no', label: 'ندارد' },
        ],
        getValue: (d: Device) => (d.warranty && d.warranty > 0) ? 'yes' : 'no',
      },
      {
        key: 'hasMaintenance', label: 'سابقه تعمیر', kind: 'enum',
        icon: <IconPackage size={18} />,
        options: [
          { value: 'yes', label: 'دارد' },
          { value: 'no', label: 'ندارد' },
        ],
        getValue: (d: Device) => (d.maintenanceLogs && d.maintenanceLogs.length > 0) ? 'yes' : 'no',
      },
    ],
    sortDefs: [
      {
        key: 'name', label: 'نام دستگاه', icon: <IconTag size={18} />,
        hint: 'از الف به ی',
        compare: (a: Device, b: Device) => (a.name || '').localeCompare(b.name || '', 'fa'),
      },
      {
        key: 'capacity', label: 'ظرفیت', icon: <IconChart size={18} />,
        hint: 'بر اساس تعداد تخم',
        compare: (a: Device, b: Device) => (a.capacity || 0) - (b.capacity || 0),
      },
      {
        key: 'price', label: 'قیمت خرید', icon: <IconDollar size={18} />,
        hint: 'ارزش دستگاه',
        compare: (a: Device, b: Device) => (a.price || 0) - (b.price || 0),
      },
      {
        key: 'purchasedAt', label: 'تاریخ خرید', icon: <IconCalendar size={18} />,
        hint: 'قدیمی‌ترین اول',
        compare: (a: Device, b: Device) => (a.purchasedAt || '').localeCompare(b.purchasedAt || ''),
      },
      {
        key: 'createdAt', label: 'جدیدترین', icon: <IconClock size={18} />,
        hint: 'بر اساس تاریخ ایجاد',
        compare: (a: Device, b: Device) => (a.createdAt || '').localeCompare(b.createdAt || ''),
      },
    ],
    persistKey: 'inc-devices',
    initialSort: { key: 'name', dir: 'asc' },
  };
}

// ═══════════════════════════════════════════════════
// inc/EggEntriesPage — ورودی تخم به دستگاه
// ═══════════════════════════════════════════════════
export function getIncEntriesConfig(ctx: {
  devices: Array<{ id: string; name: string }>;
  birds: Array<{ id: string; name: string }>;
}): FilterConfig<EggEntry> {
  return {
    filterDefs: [
      {
        key: 'deviceId', label: 'دستگاه', kind: 'enum',
        icon: <IconPackage size={18} />,
        options: ctx.devices.map(d => ({ value: d.id, label: d.name })),
        getValue: (e: EggEntry) => e.deviceId || '',
        multi: true,
      },
      {
        key: 'birdId', label: 'پرنده', kind: 'enum',
        icon: <IconUser size={18} />,
        options: ctx.birds.map(b => ({ value: b.id, label: b.name })),
        getValue: (e: EggEntry) => e.birdId || '',
        multi: true,
      },
      {
        key: 'dealType', label: 'منبع', kind: 'enum',
        icon: <IconTag size={18} />,
        options: (Object.keys(DEAL_LABEL) as Array<keyof typeof DEAL_LABEL>).map(d => ({
          value: d,
          label: DEAL_LABEL[d],
        })),
        getValue: (e: EggEntry) => e.dealType || 'own',
        multi: true,
      },
      {
        key: 'status', label: 'وضعیت', kind: 'enum',
        icon: <IconActivity size={18} />,
        options: (Object.keys(ENTRY_STATUS_LABEL) as Array<keyof typeof ENTRY_STATUS_LABEL>).map(s => ({
          value: s,
          label: ENTRY_STATUS_LABEL[s],
        })),
        getValue: (e: EggEntry) => e.status || 'incubating',
        multi: true,
      },
      {
        key: 'hasHatch', label: 'هچ شده', kind: 'enum',
        icon: <IconChart size={18} />,
        options: [
          { value: 'yes', label: 'هچ شده' },
          { value: 'no', label: 'هچ نشده' },
        ],
        getValue: (e: EggEntry) => (e.status === 'hatched' || e.status === 'done') ? 'yes' : 'no',
      },
    ],
    sortDefs: [
      {
        key: 'entryDate', label: 'تاریخ ورود', icon: <IconCalendar size={18} />,
        hint: 'جدیدترین اول',
        compare: (a: EggEntry, b: EggEntry) => (a.entryDate || '').localeCompare(b.entryDate || ''),
      },
      {
        key: 'count', label: 'تعداد تخم', icon: <IconChart size={18} />,
        hint: 'بر اساس تعداد',
        compare: (a: EggEntry, b: EggEntry) => (a.count || 0) - (b.count || 0),
      },
      {
        key: 'expectedHatchDate', label: 'تاریخ هچ', icon: <IconCalendar size={18} />,
        hint: 'نزدیک‌ترین هچ اول',
        compare: (a: EggEntry, b: EggEntry) => (a.expectedHatchDate || '').localeCompare(b.expectedHatchDate || ''),
      },
      {
        key: 'createdAt', label: 'جدیدترین ثبت', icon: <IconClock size={18} />,
        hint: 'بر اساس تاریخ ایجاد',
        compare: (a: EggEntry, b: EggEntry) => (a.createdAt || '').localeCompare(b.createdAt || ''),
      },
    ],
    persistKey: 'inc-entries',
    initialSort: { key: 'entryDate', dir: 'desc' },
  };
}

// ═══════════════════════════════════════════════════
// inc/CandlingsPage — کندلینگ
// ═══════════════════════════════════════════════════
export function getIncCandlingsConfig(ctx: {
  devices: Array<{ id: string; name: string }>;
  birds: Array<{ id: string; name: string }>;
  eggEntriesById: Record<string, EggEntry>;
}): FilterConfig<Candling> {
  return {
    filterDefs: [
      {
        key: 'deviceId', label: 'دستگاه', kind: 'enum',
        icon: <IconPackage size={18} />,
        options: ctx.devices.map(d => ({ value: d.id, label: d.name })),
        getValue: (c: Candling) => {
          const entry = ctx.eggEntriesById[c.eggEntryId];
          return entry?.deviceId || '';
        },
        multi: true,
      },
      {
        key: 'birdId', label: 'پرنده', kind: 'enum',
        icon: <IconUser size={18} />,
        options: ctx.birds.map(b => ({ value: b.id, label: b.name })),
        getValue: (c: Candling) => {
          const entry = ctx.eggEntriesById[c.eggEntryId];
          return entry?.birdId || '';
        },
        multi: true,
      },
      {
        key: 'stage', label: 'مرحله', kind: 'enum',
        icon: <IconChart size={18} />,
        options: [
          { value: '1', label: 'مرحله ۱' },
          { value: '2', label: 'مرحله ۲' },
          { value: '3', label: 'مرحله ۳' },
        ],
        getValue: (c: Candling) => String(c.stage || 1),
        multi: true,
      },
    ],
    sortDefs: [
      {
        key: 'date', label: 'تاریخ', icon: <IconCalendar size={18} />,
        hint: 'جدیدترین اول',
        compare: (a: Candling, b: Candling) => (a.date || '').localeCompare(b.date || ''),
      },
      {
        key: 'stage', label: 'مرحله', icon: <IconChart size={18} />,
        hint: 'بر اساس مرحله',
        compare: (a: Candling, b: Candling) => (a.stage || 0) - (b.stage || 0),
      },
      {
        key: 'alive', label: 'تعداد سالم', icon: <IconChart size={18} />,
        hint: 'بر اساس تعداد',
        compare: (a: Candling, b: Candling) => (a.alive || 0) - (b.alive || 0),
      },
      {
        key: 'createdAt', label: 'جدیدترین ثبت', icon: <IconClock size={18} />,
        hint: 'بر اساس تاریخ ایجاد',
        compare: (a: Candling, b: Candling) => (a.createdAt || '').localeCompare(b.createdAt || ''),
      },
    ],
    persistKey: 'inc-candlings',
    initialSort: { key: 'date', dir: 'desc' },
  };
}

// ═══════════════════════════════════════════════════
// fed/IngredientsPage — مواد اولیه جیره
// ═══════════════════════════════════════════════════
export function getFedIngredientsConfig(): FilterConfig<Ingredient> {
  return {
    filterDefs: [
      {
        key: 'category', label: 'دسته', kind: 'enum',
        icon: <IconFolder size={18} />,
        options: Object.keys(FED_CAT_LABEL).map(c => ({
          value: c,
          label: FED_CAT_LABEL[c as keyof typeof FED_CAT_LABEL],
          icon: FED_CAT_ICON[c as keyof typeof FED_CAT_ICON],
        })),
        getValue: (i: Ingredient) => i.category || '',
        multi: true,
      },
      {
        key: 'isCore', label: 'پیش‌فرض', kind: 'enum',
        icon: <IconTag size={18} />,
        options: [
          { value: 'yes', label: 'پیش‌فرض' },
          { value: 'no', label: 'سفارشی' },
        ],
        getValue: (i: Ingredient) => i.isCore ? 'yes' : 'no',
      },
      {
        key: 'hasStock', label: 'اتصال انبار', kind: 'enum',
        icon: <IconPackage size={18} />,
        options: [
          { value: 'yes', label: 'وصل شده' },
          { value: 'no', label: 'وصل نشده' },
        ],
        getValue: (i: Ingredient) => i.stockItemId ? 'yes' : 'no',
      },
    ],
    sortDefs: [
      {
        key: 'name', label: 'نام', icon: <IconTag size={18} />,
        hint: 'از الف به ی',
        compare: (a: Ingredient, b: Ingredient) => (a.name || '').localeCompare(b.name || '', 'fa'),
      },
      {
        key: 'protein', label: 'پروتئین', icon: <IconChart size={18} />,
        hint: 'درصد پروتئین',
        compare: (a: Ingredient, b: Ingredient) => (a.protein || 0) - (b.protein || 0),
      },
      {
        key: 'energy', label: 'انرژی', icon: <IconChart size={18} />,
        hint: 'انرژی متابولیزه',
        compare: (a: Ingredient, b: Ingredient) => (a.energy || 0) - (b.energy || 0),
      },
      {
        key: 'price', label: 'قیمت', icon: <IconDollar size={18} />,
        hint: 'قیمت هر واحد',
        compare: (a: Ingredient, b: Ingredient) => (a.price || 0) - (b.price || 0),
      },
      {
        key: 'createdAt', label: 'جدیدترین', icon: <IconClock size={18} />,
        hint: 'بر اساس تاریخ ایجاد',
        compare: (a: Ingredient, b: Ingredient) => (a.createdAt || '').localeCompare(b.createdAt || ''),
      },
    ],
    persistKey: 'fed-ingredients',
    initialSort: { key: 'name', dir: 'asc' },
  };
}

// ═══════════════════════════════════════════════════
// fed/FormulasPage — جیره‌ها
// ═══════════════════════════════════════════════════
export function getFedFormulasConfig(ctx: {
  requirements: Array<{ id: string; name: string; stage: string }>;
}): FilterConfig<Formula> {
  return {
    filterDefs: [
      {
        key: 'status', label: 'وضعیت', kind: 'enum',
        icon: <IconActivity size={18} />,
        options: [
          { value: 'draft', label: 'پیش‌نویس' },
          { value: 'active', label: 'فعال' },
          { value: 'archived', label: 'آرشیو' },
        ],
        getValue: (f: Formula) => f.status || 'draft',
        multi: true,
      },
      {
        key: 'stage', label: 'مرحله', kind: 'enum',
        icon: <IconChart size={18} />,
        options: Object.keys(FED_STAGE_LABEL).map(s => ({
          value: s,
          label: FED_STAGE_LABEL[s],
        })),
        getValue: (f: Formula) => {
          const req = ctx.requirements.find(r => r.id === f.requirementId);
          return req?.stage || '';
        },
        multi: true,
      },
      {
        key: 'requirementId', label: 'نیاز', kind: 'enum',
        icon: <IconTag size={18} />,
        options: ctx.requirements.map(r => ({ value: r.id, label: r.name })),
        getValue: (f: Formula) => f.requirementId || '',
        layout: 'chips',
      },
    ],
    sortDefs: [
      {
        key: 'date', label: 'تاریخ', icon: <IconCalendar size={18} />,
        hint: 'جدیدترین اول',
        compare: (a: Formula, b: Formula) => (a.date || '').localeCompare(b.date || ''),
      },
      {
        key: 'name', label: 'نام جیره', icon: <IconTag size={18} />,
        hint: 'از الف به ی',
        compare: (a: Formula, b: Formula) => (a.name || '').localeCompare(b.name || '', 'fa'),
      },
      {
        key: 'lineCount', label: 'تعداد مواد', icon: <IconChart size={18} />,
        hint: 'بر اساس تعداد مواد اولیه',
        compare: (a: Formula, b: Formula) => (a.lines?.length || 0) - (b.lines?.length || 0),
      },
      {
        key: 'createdAt', label: 'جدیدترین ثبت', icon: <IconClock size={18} />,
        hint: 'بر اساس تاریخ ایجاد',
        compare: (a: Formula, b: Formula) => (a.createdAt || '').localeCompare(b.createdAt || ''),
      },
    ],
    persistKey: 'fed-formulas',
    initialSort: { key: 'date', dir: 'desc' },
  };
}

// ═══════════════════════════════════════════════════
// fed/RequirementsPage — نیازهای غذایی
// ═══════════════════════════════════════════════════
export function getFedRequirementsConfig(ctx: {
  birdTypes: Array<{ value: string; label: string }>;
}): FilterConfig<Requirement> {
  return {
    filterDefs: [
      {
        key: 'stage', label: 'مرحله', kind: 'enum',
        icon: <IconChart size={18} />,
        options: Object.keys(FED_STAGE_LABEL).map(s => ({
          value: s,
          label: FED_STAGE_LABEL[s],
        })),
        getValue: (r: Requirement) => r.stage || '',
        multi: true,
      },
      {
        key: 'birdType', label: 'نوع پرنده', kind: 'enum',
        icon: <IconUser size={18} />,
        options: ctx.birdTypes,
        getValue: (r: Requirement) => r.birdType || '',
        multi: true,
      },
    ],
    sortDefs: [
      {
        key: 'name', label: 'نام', icon: <IconTag size={18} />,
        hint: 'از الف به ی',
        compare: (a: Requirement, b: Requirement) => (a.name || '').localeCompare(b.name || '', 'fa'),
      },
      {
        key: 'protein', label: 'پروتئین', icon: <IconChart size={18} />,
        hint: 'درصد پروتئین',
        compare: (a: Requirement, b: Requirement) => (a.protein || 0) - (b.protein || 0),
      },
      {
        key: 'energy', label: 'انرژی', icon: <IconChart size={18} />,
        hint: 'انرژی متابولیزه',
        compare: (a: Requirement, b: Requirement) => (a.energy || 0) - (b.energy || 0),
      },
      {
        key: 'createdAt', label: 'جدیدترین', icon: <IconClock size={18} />,
        hint: 'بر اساس تاریخ ایجاد',
        compare: (a: Requirement, b: Requirement) => (a.createdAt || '').localeCompare(b.createdAt || ''),
      },
    ],
    persistKey: 'fed-requirements',
    initialSort: { key: 'name', dir: 'asc' },
  };
}

// ═══════════════════════════════════════════════════
// tra/DealsPage — معاملات خاص
// ═══════════════════════════════════════════════════
export function getTraDealsConfig(ctx: {
  partyNames: Record<string, string>;
}): FilterConfig<Deal> {
  return {
    filterDefs: [
      {
        key: 'type', label: 'نوع', kind: 'enum',
        icon: <IconTag size={18} />,
        options: (Object.keys(TRA_DEAL_LABEL) as Array<keyof typeof TRA_DEAL_LABEL>).map(t => ({
          value: t,
          label: TRA_DEAL_LABEL[t],
        })),
        getValue: (d: Deal) => d.type || '',
        multi: true,
      },
      {
        key: 'status', label: 'وضعیت', kind: 'enum',
        icon: <IconActivity size={18} />,
        options: [
          { value: 'open', label: 'باز' },
          { value: 'settled', label: 'تسویه شده' },
          { value: 'cancelled', label: 'لغو شده' },
        ],
        getValue: (d: Deal) => d.status || 'open',
        multi: true,
      },
      {
        key: 'partyId', label: 'طرف معامله', kind: 'enum',
        icon: <IconUser size={18} />,
        options: Object.entries(ctx.partyNames).map(([id, name]) => ({ value: id, label: name })),
        getValue: (d: Deal) => d.partyId || '',
        layout: 'chips',
      },
    ],
    sortDefs: [
      {
        key: 'date', label: 'تاریخ', icon: <IconCalendar size={18} />,
        hint: 'جدیدترین اول',
        compare: (a: Deal, b: Deal) => (a.date || '').localeCompare(b.date || ''),
      },
      {
        key: 'value', label: 'مبلغ', icon: <IconDollar size={18} />,
        hint: 'ارزش معامله',
        compare: (a: Deal, b: Deal) => (a.value || 0) - (b.value || 0),
      },
      {
        key: 'dueDate', label: 'سرسید', icon: <IconCalendar size={18} />,
        hint: 'نزدیک‌ترین سرسید اول',
        compare: (a: Deal, b: Deal) => (a.dueDate || '').localeCompare(b.dueDate || ''),
      },
      {
        key: 'createdAt', label: 'جدیدترین ثبت', icon: <IconClock size={18} />,
        hint: 'بر اساس تاریخ ایجاد',
        compare: (a: Deal, b: Deal) => (a.createdAt || '').localeCompare(b.createdAt || ''),
      },
    ],
    persistKey: 'tra-deals',
    initialSort: { key: 'date', dir: 'desc' },
  };
}

// ═══════════════════════════════════════════════════
// tra/ReceivablesPage — مطالبات
// ═══════════════════════════════════════════════════
export function getTraReceivablesConfig(ctx: {
  partyNames: Record<string, string>;
}): FilterConfig<Invoice> {
  return {
    filterDefs: [
      {
        key: 'dueStatus', label: 'وضعیت سرسید', kind: 'enum',
        icon: <IconCalendar size={18} />,
        options: [
          { value: 'overdue', label: 'معوق' },
          { value: 'soon', label: 'نزدیک سرسید' },
        ],
        getValue: (i: Invoice) => {
          if (!i.dueDate) return '';
          const parts = i.dueDate.replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d).toString()).split('/');
          if (parts.length !== 3) return '';
          const d = new Date(+parts[0], +parts[1] - 1, +parts[2]);
          const days = Math.ceil((d.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
          if (days < 0) return 'overdue';
          if (days <= 7) return 'soon';
          return '';
        },
        multi: true,
      },
      {
        key: 'aging', label: 'سن بدهی', kind: 'enum',
        icon: <IconClock size={18} />,
        options: [
          { value: '0-15', label: '۰ تا ۱۵ روز' },
          { value: '16-30', label: '۱۶ تا ۳۰ روز' },
          { value: '31-60', label: '۳۱ تا ۶۰ روز' },
          { value: '61-90', label: '۶۱ تا ۹۰ روز' },
          { value: '+90', label: 'بیش از ۹۰ روز' },
        ],
        getValue: (i: Invoice) => traAgingBucket(traAgeDays(i)),
        multi: true,
      },
      {
        key: 'partyId', label: 'طرف معامله', kind: 'enum',
        icon: <IconUser size={18} />,
        options: Object.entries(ctx.partyNames).map(([id, name]) => ({ value: id, label: name })),
        getValue: (i: Invoice) => i.partyId || '',
        layout: 'chips',
      },
    ],
    sortDefs: [
      {
        key: 'dueDate', label: 'سرسید', icon: <IconCalendar size={18} />,
        hint: 'نزدیک‌ترین سرسید اول',
        compare: (a: Invoice, b: Invoice) => (a.dueDate || '').localeCompare(b.dueDate || ''),
      },
      {
        key: 'date', label: 'تاریخ فاکتور', icon: <IconCalendar size={18} />,
        hint: 'جدیدترین اول',
        compare: (a: Invoice, b: Invoice) => (a.date || '').localeCompare(b.date || ''),
      },
      {
        key: 'remaining', label: 'باقی‌مانده', icon: <IconDollar size={18} />,
        hint: 'مبلغ باقی‌مانده',
        compare: (a: Invoice, b: Invoice) => traRemaining(a) - traRemaining(b),
      },
      {
        key: 'total', label: 'مبلغ کل', icon: <IconDollar size={18} />,
        hint: 'مبلغ کل فاکتور',
        compare: (a: Invoice, b: Invoice) => (a.total || 0) - (b.total || 0),
      },
    ],
    persistKey: 'tra-receivables',
    initialSort: { key: 'dueDate', dir: 'asc' },
  };
}

// ═══════════════════════════════════════════════════
// tra/InvoicePage — فاکتورهای خرید/فروش
// ═══════════════════════════════════════════════════
export function getTraInvoicesConfig(ctx: {
  partyNames: Record<string, string>;
  categories: Array<[string, string]>;
}): FilterConfig<Invoice> {
  return {
    filterDefs: [
      {
        key: 'category', label: 'دسته', kind: 'enum',
        icon: <IconFolder size={18} />,
        options: ctx.categories.map(([v, l]) => ({ value: v, label: l })),
        getValue: (i: Invoice) => i.category || '',
        multi: true,
      },
      {
        key: 'workflow', label: 'وضعیت پرداخت', kind: 'enum',
        icon: <IconActivity size={18} />,
        options: (Object.keys(TRA_WORKFLOW_LABEL) as Array<keyof typeof TRA_WORKFLOW_LABEL>).map(w => ({
          value: w,
          label: TRA_WORKFLOW_LABEL[w],
        })),
        getValue: (i: Invoice) => i.workflowStatus || 'draft',
        multi: true,
      },
      {
        key: 'paymentStatus', label: 'وضعیت تسویه', kind: 'enum',
        icon: <IconDollar size={18} />,
        options: [
          { value: 'paid', label: 'تسویه شده' },
          { value: 'partial', label: 'جزئی' },
          { value: 'unpaid', label: 'تسویه نشده' },
        ],
        getValue: (i: Invoice) => {
          const rem = traRemaining(i);
          const total = i.total || 0;
          if (rem <= 0) return 'paid';
          if (rem < total) return 'partial';
          return 'unpaid';
        },
        multi: true,
      },
      {
        key: 'partyId', label: 'طرف معامله', kind: 'enum',
        icon: <IconUser size={18} />,
        options: Object.entries(ctx.partyNames).map(([id, name]) => ({ value: id, label: name })),
        getValue: (i: Invoice) => i.partyId || '',
        layout: 'chips',
      },
    ],
    sortDefs: [
      {
        key: 'date', label: 'تاریخ', icon: <IconCalendar size={18} />,
        hint: 'جدیدترین اول',
        compare: (a: Invoice, b: Invoice) => (a.date || '').localeCompare(b.date || ''),
      },
      {
        key: 'total', label: 'مبلغ کل', icon: <IconDollar size={18} />,
        hint: 'بر اساس مبلغ',
        compare: (a: Invoice, b: Invoice) => (a.total || 0) - (b.total || 0),
      },
      {
        key: 'remaining', label: 'باقی‌مانده', icon: <IconDollar size={18} />,
        hint: 'مبلغ باقی‌مانده',
        compare: (a: Invoice, b: Invoice) => traRemaining(a) - traRemaining(b),
      },
      {
        key: 'dueDate', label: 'سرسید', icon: <IconCalendar size={18} />,
        hint: 'نزدیک‌ترین سرسید اول',
        compare: (a: Invoice, b: Invoice) => (a.dueDate || '').localeCompare(b.dueDate || ''),
      },
    ],
    persistKey: 'tra-invoices',
    initialSort: { key: 'date', dir: 'desc' },
  };
}

// ═══════════════════════════════════════════════════
// alt/AlertsPage — هشدارها
// ═══════════════════════════════════════════════════
export function getAltAlertsConfig(): FilterConfig<Alert> {
  return {
    filterDefs: [
      {
        key: 'level', label: 'سطح', kind: 'enum',
        icon: <IconActivity size={18} />,
        options: (Object.keys(ALT_LEVEL_LABEL) as Array<keyof typeof ALT_LEVEL_LABEL>).map(l => ({
          value: l,
          label: ALT_LEVEL_LABEL[l],
        })),
        getValue: (a: Alert) => a.level || 'info',
        multi: true,
      },
      {
        key: 'category', label: 'دسته', kind: 'enum',
        icon: <IconFolder size={18} />,
        options: (Object.keys(ALT_CAT_LABEL) as Array<keyof typeof ALT_CAT_LABEL>).map(c => ({
          value: c,
          label: ALT_CAT_LABEL[c],
        })),
        getValue: (a: Alert) => a.category || '',
        multi: true,
      },
      {
        key: 'status', label: 'وضعیت', kind: 'enum',
        icon: <IconTag size={18} />,
        options: [
          { value: 'active', label: 'فعال' },
          { value: 'snoozed', label: 'به تعویق' },
          { value: 'dismissed', label: 'رد شده' },
        ],
        getValue: (a: Alert) => a.status || 'active',
        multi: true,
      },
    ],
    sortDefs: [
      {
        key: 'date', label: 'تاریخ', icon: <IconCalendar size={18} />,
        hint: 'جدیدترین اول',
        compare: (a: Alert, b: Alert) => (a.date || '').localeCompare(b.date || ''),
      },
      {
        key: 'level', label: 'سطح', icon: <IconActivity size={18} />,
        hint: 'بحرانی اول',
        compare: (a: Alert, b: Alert) => {
          const order: Record<string, number> = { critical: 0, important: 1, info: 2 };
          return (order[a.level] ?? 99) - (order[b.level] ?? 99);
        },
      },
      {
        key: 'category', label: 'دسته', icon: <IconFolder size={18} />,
        hint: 'بر اساس دسته',
        compare: (a: Alert, b: Alert) => (a.category || '').localeCompare(b.category || ''),
      },
      {
        key: 'createdAt', label: 'جدیدترین ثبت', icon: <IconClock size={18} />,
        hint: 'بر اساس تاریخ ایجاد',
        compare: (a: Alert, b: Alert) => (a.createdAt || '').localeCompare(b.createdAt || ''),
      },
    ],
    persistKey: 'alt-alerts',
    initialSort: { key: 'date', dir: 'desc' },
  };
}

// ═══════════════════════════════════════════════════
// arc/ArchivePage — آرشیو گله‌ها
// ═══════════════════════════════════════════════════
export function getArcArchiveConfig(ctx: {
  birds: Array<{ id: string; name: string }>;
  halls: Array<{ id: string; name: string }>;
}): FilterConfig<Flock> {
  return {
    filterDefs: [
      {
        key: 'status', label: 'وضعیت', kind: 'enum',
        icon: <IconActivity size={18} />,
        options: [
          { value: 'archived', label: 'آرشیو' },
          { value: 'sold', label: 'فروخته شده' },
        ],
        getValue: (f: Flock) => f.status || 'archived',
        multi: true,
      },
      {
        key: 'type', label: 'نوع گله', kind: 'enum',
        icon: <IconTag size={18} />,
        options: [
          { value: 'layer', label: '🥚 تخم‌گذار' },
          { value: 'broiler', label: '🍗 گوشتی' },
          { value: 'breeder', label: '🧬 مادر' },
        ],
        getValue: (f: Flock) => f.type || '',
        multi: true,
      },
      {
        key: 'birdId', label: 'پرنده', kind: 'enum',
        icon: <IconUser size={18} />,
        options: ctx.birds.map(b => ({ value: b.id, label: b.name })),
        getValue: (f: Flock) => f.birdId || '',
        multi: true,
      },
      {
        key: 'hallId', label: 'سالن', kind: 'enum',
        icon: <IconFolder size={18} />,
        options: ctx.halls.map(h => ({ value: h.id, label: h.name })),
        getValue: (f: Flock) => f.hallId || '',
        layout: 'chips',
      },
    ],
    sortDefs: [
      {
        key: 'updatedAt', label: 'تاریخ آرشیو', icon: <IconCalendar size={18} />,
        hint: 'جدیدترین آرشیو اول',
        compare: (a: Flock, b: Flock) => (a.updatedAt || '').localeCompare(b.updatedAt || ''),
      },
      {
        key: 'name', label: 'نام گله', icon: <IconTag size={18} />,
        hint: 'از الف به ی',
        compare: (a: Flock, b: Flock) => (a.name || '').localeCompare(b.name || '', 'fa'),
      },
      {
        key: 'age', label: 'سن نهایی', icon: <IconClock size={18} />,
        hint: 'بر اساس روز',
        compare: (a: Flock, b: Flock) => flkGetAgeDays(a) - flkGetAgeDays(b),
      },
      {
        key: 'count', label: 'تعداد نهایی', icon: <IconChart size={18} />,
        hint: 'بر اساس تعداد پرنده',
        compare: (a: Flock, b: Flock) => (a.currentCount || 0) - (b.currentCount || 0),
      },
    ],
    persistKey: 'arc-archive',
    initialSort: { key: 'updatedAt', dir: 'desc' },
  };
}
