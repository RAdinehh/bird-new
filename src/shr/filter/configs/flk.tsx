/** filter/configs/flk.tsx */
import { IconFolder, IconActivity, IconTag, IconChart, IconClock, IconUser } from '../../icons';
import { type Flock, isLayingReady } from '../../../mod/flk/store';
import type { FilterConfig } from './_types';

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
