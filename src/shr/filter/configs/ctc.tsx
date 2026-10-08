/** filter/configs/ctc.tsx */
import { IconTag, IconClock, IconUser } from '../../icons';
import { type Person, type Role, ROLE_LABEL } from '../../../mod/ctc/store';
import type { FilterConfig } from './_types';

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
