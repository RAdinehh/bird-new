/** filter/configs/alt.tsx */
import { IconFolder, IconActivity, IconTag, IconClock, IconCalendar } from '../../icons';
import { type Alert, LEVEL_LABEL as ALT_LEVEL_LABEL, CATEGORY_LABEL as ALT_CAT_LABEL } from '../../../mod/alt/store';
import type { FilterConfig } from './_types';

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
