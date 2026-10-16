/** filter/configs/flk.tsx */
import { IconFolder, IconActivity, IconTag, IconChart, IconClock, IconUser } from '../../icons';
import { type Flock, isLayingReady, daysUntilLaying } from '../../../mod/flk/store';
import type { FilterConfig } from './_types';

export function getFlkFlocksConfig(ctx: {
  birds: Array<{ id: string; name: string }>;
  breeds: Array<{ id: string; name: string; birdId: string }>;
  halls: Array<{ id: string; name: string }>;
  zones: Array<{ id: string; name: string; hallId: string }>;
}): FilterConfig<Flock> {
  return {
    filterDefs: [
      // ═══ ۱. وضعیت ═══
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
      // ═══ ۲. آماده تخم‌گذاری (۳ حالت) ═══
      {
        key: 'ready', label: 'آماده تخم‌گذاری', kind: 'enum',
        icon: <IconChart size={18} />,
        options: [
          { value: 'ready', label: '✅ آماده' },
          { value: 'near',  label: '⏳ نزدیک' },
          { value: 'far',   label: '○ دور' },
        ],
        getValue: (f: Flock) => {
          if (f.type !== 'layer' && f.type !== 'breeder') return 'far';
          if (isLayingReady(f)) return 'ready';
          const remaining = daysUntilLaying(f);
          return remaining <= 60 ? 'near' : 'far';
        },
        multi: true,
      },
      // ═══ ۳. نوع گله ═══
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
      // ═══ ۴. نژاد ═══
      {
        key: 'breedId', label: 'نژاد', kind: 'enum',
        icon: <IconTag size={18} />,
        options: ctx.breeds.map(b => ({ value: b.id, label: b.name })),
        getValue: (f: Flock) => f.breedId || '',
        multi: true,
      },
      // ═══ ۵. پرنده ═══
      {
        key: 'birdId', label: 'پرنده', kind: 'enum',
        icon: <IconUser size={18} />,
        options: ctx.birds.map(b => ({ value: b.id, label: b.name })),
        getValue: (f: Flock) => f.birdId || '',
        multi: true,
      },
      // ═══ ۶. سالن (multi) ═══
      {
        key: 'hallId', label: 'سالن', kind: 'enum',
        icon: <IconFolder size={18} />,
        options: ctx.halls.map(h => ({ value: h.id, label: h.name })),
        getValue: (f: Flock) => f.hallId || '',
        multi: true,
      },
      // ═══ ۷. بخش (multi) ═══
      {
        key: 'zoneId', label: 'بخش', kind: 'enum',
        icon: <IconFolder size={18} />,
        options: ctx.zones.map(z => ({ value: z.id, label: z.name })),
        getValue: (f: Flock) => f.zoneId || '',
        multi: true,
      },
    ],
    sortDefs: [
      {
        key: 'name', label: 'نام گله', icon: <IconTag size={18} />,
        hint: 'از الف به ی',
        compare: (a: Flock, b: Flock) => (a.name || '').localeCompare(b.name || '', 'fa'),
      },
      {
        key: 'age', label: 'سن', icon: <IconClock size={18} />,
        hint: 'بر اساس سن گله',
        compare: (a: Flock, b: Flock) => {
          const ageA = a.startDate ? new Date(a.startDate).getTime() : 0;
          const ageB = b.startDate ? new Date(b.startDate).getTime() : 0;
          return ageB - ageA;
        },
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
