/** filter/configs/arc.tsx */
import { IconFolder, IconActivity, IconTag, IconChart, IconClock, IconUser, IconCalendar } from '../../icons';
import { type Flock, getAgeDays as flkGetAgeDays } from '../../../mod/flk/store';
import type { ArchiveRecord } from '../../../cor/storage/historyArchive';
import type { FilterConfig } from './_types';
import { format as formatJalali } from 'date-fns-jalali';

export interface ArcStoreEntry {
  storeKey: 'flk' | 'tra' | 'whs' | 'inc';
  storeLabel: string;
  record: ArchiveRecord;
}

function toComparableJalaliDate(raw?: string | number): string {
  if (raw === undefined || raw === null || raw === '') return '';
  if (typeof raw === 'number') {
    if (!Number.isFinite(raw) || raw <= 0) return '';
    const d = new Date(raw);
    return Number.isNaN(d.getTime()) ? '' : formatJalali(d, 'yyyy/MM/dd');
  }
  const trimmed = raw.trim();
  if (/^1[34]\d{2}\/\d{2}\/\d{2}/.test(trimmed)) {
    return trimmed.slice(0, 10);
  }
  const d = new Date(trimmed);
  if (!Number.isNaN(d.getTime())) {
    return formatJalali(d, 'yyyy/MM/dd');
  }
  return trimmed.slice(0, 10);
}

/** برچسب مرجع یکپارچه برای دلایل آرشیو سرد و روزانه در کل سامانه */
export const ARCHIVE_REASON_LABELS: Record<string, string> = {
  age: 'قدیمی',
  'flock-closed': 'بستن گله',
  'count-threshold': 'حد تعداد',
  ancient: 'خیلی قدیمی',
  manual: 'آرشیو دستی',
};

const ARCHIVE_REASON_OPTIONS = Object.entries(ARCHIVE_REASON_LABELS).map(([value, label]) => ({ value, label }));

const STORE_OPTIONS = [
  { value: 'flk', label: 'گله‌ها' },
  { value: 'tra', label: 'معاملات' },
  { value: 'whs', label: 'انبار' },
  { value: 'inc', label: 'جوجه‌کشی' },
];

export function getArcArchiveConfig(ctx: {
  birds: Array<{ id: string; name: string }>;
  halls: Array<{ id: string; name: string }>;
}): FilterConfig<Flock> {
  return {
    filterDefs: [
      {
        key: 'archivedDate', label: 'تاریخ آرشیو', kind: 'dateRange',
        icon: <IconCalendar size={18} />,
        getValue: (f: Flock) => toComparableJalaliDate(f.updatedAt || f.startDate || ''),
      },
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

export function getArcLogsConfig(ctx: {
  flocks: Array<{ id: string; name: string }>;
}): FilterConfig<ArchiveRecord> {
  return {
    filterDefs: [
      {
        key: 'archivedDate', label: 'تاریخ آرشیو', kind: 'dateRange',
        icon: <IconCalendar size={18} />,
        getValue: (r: ArchiveRecord) => toComparableJalaliDate(r.archivedAt || r.date || ''),
      },
      {
        key: 'dateRange', label: 'بازه تاریخ ثبت', kind: 'dateRange',
        icon: <IconCalendar size={18} />,
        getValue: (r: ArchiveRecord) => toComparableJalaliDate(r.date || ''),
      },
      {
        key: 'flockId', label: 'گله', kind: 'enum',
        icon: <IconUser size={18} />,
        options: ctx.flocks.map(f => ({ value: f.id, label: f.name })),
        getValue: (r: ArchiveRecord) => r.flockId || '',
        multi: true,
      },
      {
        key: 'reason', label: 'دلیل آرشیو', kind: 'enum',
        icon: <IconTag size={18} />,
        options: ARCHIVE_REASON_OPTIONS,
        getValue: (r: ArchiveRecord) => r.reason || '',
        multi: true,
      },
      {
        key: 'hasDeaths', label: 'تلفات', kind: 'enum',
        icon: <IconActivity size={18} />,
        options: [
          { value: 'yes', label: 'دارد' },
          { value: 'no', label: 'ندارد' },
        ],
        getValue: (r: ArchiveRecord) => {
          const deaths = r.log?.deaths || [];
          return deaths.some(d => (d.count || 0) > 0) ? 'yes' : 'no';
        },
      },
    ],
    sortDefs: [
      {
        key: 'archivedAt', label: 'تاریخ آرشیو', icon: <IconClock size={18} />,
        hint: 'جدیدترین بایگانی اول',
        compare: (a: ArchiveRecord, b: ArchiveRecord) => (a.archivedAt || 0) - (b.archivedAt || 0),
      },
      {
        key: 'date', label: 'تاریخ ثبت', icon: <IconCalendar size={18} />,
        hint: 'جدیدترین ثبت اول',
        compare: (a: ArchiveRecord, b: ArchiveRecord) => (a.date || '').localeCompare(b.date || ''),
      },
      {
        key: 'deaths', label: 'تعداد تلفات', icon: <IconChart size={18} />,
        hint: 'بر اساس تلفات ثبت‌شده',
        compare: (a: ArchiveRecord, b: ArchiveRecord) => {
          const aSum = (a.log?.deaths || []).reduce((s, d) => s + (d.count || 0), 0);
          const bSum = (b.log?.deaths || []).reduce((s, d) => s + (d.count || 0), 0);
          return aSum - bSum;
        },
      },
    ],
    persistKey: 'arc-logs',
    initialSort: { key: 'archivedAt', dir: 'desc' },
  };
}

export function getArcStoresConfig(): FilterConfig<ArcStoreEntry> {
  return {
    filterDefs: [
      {
        key: 'archivedDate', label: 'تاریخ آرشیو', kind: 'dateRange',
        icon: <IconCalendar size={18} />,
        getValue: (e: ArcStoreEntry) => toComparableJalaliDate(e.record?.archivedAt || e.record?.date || ''),
      },
      {
        key: 'storeKey', label: 'بخش / مخزن', kind: 'enum',
        icon: <IconFolder size={18} />,
        options: STORE_OPTIONS,
        getValue: (e: ArcStoreEntry) => e.storeKey,
        multi: true,
      },
      {
        key: 'reason', label: 'دلیل آرشیو', kind: 'enum',
        icon: <IconTag size={18} />,
        options: ARCHIVE_REASON_OPTIONS,
        getValue: (e: ArcStoreEntry) => e.record?.reason || '',
        multi: true,
      },
    ],
    sortDefs: [
      {
        key: 'archivedAt', label: 'تاریخ آرشیو', icon: <IconClock size={18} />,
        hint: 'جدیدترین بایگانی اول',
        compare: (a: ArcStoreEntry, b: ArcStoreEntry) => (a.record?.archivedAt || 0) - (b.record?.archivedAt || 0),
      },
      {
        key: 'store', label: 'مخزن', icon: <IconFolder size={18} />,
        hint: 'بر اساس نام بخش',
        compare: (a: ArcStoreEntry, b: ArcStoreEntry) => (a.storeLabel || '').localeCompare(b.storeLabel || '', 'fa'),
      },
    ],
    persistKey: 'arc-stores',
    initialSort: { key: 'archivedAt', dir: 'desc' },
  };
}
