/** filter/configs/inc.tsx */
import { IconActivity, IconTag, IconChart, IconDollar, IconClock, IconUser, IconCalendar, IconPackage } from '../../icons';
import { type HatchResult, type Device, type EggEntry, type Candling, DEVICE_MODE_LABEL, DEVICE_STATUS_LABEL, DEAL_LABEL, ENTRY_STATUS_LABEL } from '../../../mod/inc/store';
import type { FilterConfig } from './_types';

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
