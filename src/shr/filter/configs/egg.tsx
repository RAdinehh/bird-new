/** filter/configs/egg.tsx */
import { IconActivity, IconChart, IconClock, IconUser, IconCalendar } from '../../icons';
import type { EggProduction } from '../../../mod/egg/store';
import type { FilterConfig } from './_types';

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
