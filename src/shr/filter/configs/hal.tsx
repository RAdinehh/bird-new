/** filter/configs/hal.tsx */
import { IconFolder, IconActivity, IconTag, IconChart, IconDollar, IconClock, IconUser, IconCalendar, IconPackage } from '../../icons';
import { type Zone, type Hall, type Equipment, EQUIP_LABELS } from '../../../mod/hal/store';
import type { FilterConfig } from './_types';

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
