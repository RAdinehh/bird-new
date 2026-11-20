/** filter/configs/arc.tsx */
import { IconFolder, IconActivity, IconTag, IconChart, IconClock, IconUser, IconCalendar } from '../../icons';
import { type Flock, getAgeDays as flkGetAgeDays } from '../../../mod/flk/store';
import type { FilterConfig } from './_types';
import { format as formatJalali } from 'date-fns-jalali';

function toComparableJalaliDate(raw?: string): string {
  if (!raw) return '';
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


export function getArcArchiveConfig(ctx: {
  birds: Array<{ id: string; name: string }>;
  halls: Array<{ id: string; name: string }>;
}): FilterConfig<Flock> {
  return {
    filterDefs: [
      {
        key: 'period', label: 'دوره زمانی', kind: 'dateRange',
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
