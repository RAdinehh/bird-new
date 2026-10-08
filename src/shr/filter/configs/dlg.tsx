/** filter/configs/dlg.tsx */
import { IconActivity, IconChart, IconClock, IconUser, IconCalendar, IconPackage } from '../../icons';
import type { DailyLog } from '../../../mod/dlg/store';
import type { FilterConfig } from './_types';

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
