/** filter/configs/brd.tsx */
import { IconActivity, IconTag, IconChart, IconClock, IconUser } from '../../icons';
import type { Breed, Bird } from '../../../mod/brd/store';
import type { FilterConfig } from './_types';

export function getBrdBreedsConfig(ctx: { birds: Bird[] }): FilterConfig<Breed> {
  return {
    filterDefs: [
      {
        key: 'birdId', label: 'پرنده', kind: 'enum',
        icon: <IconUser size={18} />,
        options: ctx.birds.map(b => ({ value: b.id, label: b.name })),
        getValue: (br: Breed) => br.birdId || '',
      },
      {
        key: 'hasStandard', label: 'استاندارد', kind: 'enum',
        icon: <IconActivity size={18} />,
        options: [
          { value: 'yes', label: 'دارد' },
          { value: 'no', label: 'ندارد' },
        ],
        getValue: (br: Breed) => br.standardKey ? 'yes' : 'no',
      },
    ],
    sortDefs: [
      {
        key: 'name', label: 'نام نژاد', icon: <IconTag size={18} />,
        hint: 'از الف به ی',
        compare: (a: Breed, b: Breed) => (a.name || '').localeCompare(b.name || '', 'fa'),
      },
      {
        key: 'fcr', label: 'FCR', icon: <IconChart size={18} />,
        hint: 'ضریب تبدیل خوراک',
        compare: (a: Breed, b: Breed) => (a.fcr || 0) - (b.fcr || 0),
      },
      {
        key: 'createdAt', label: 'جدیدترین', icon: <IconClock size={18} />,
        hint: 'بر اساس تاریخ ایجاد',
        compare: (a: Breed, b: Breed) => (a.createdAt || '').localeCompare(b.createdAt || ''),
      },
    ],
    persistKey: 'brd-breeds',
    initialSort: { key: 'name', dir: 'asc' },
  };
}

// ═══════════════════════════════════════════════════
// brd/BirdsPage — پرنده‌ها
// ═══════════════════════════════════════════════════
export function getBrdBirdsConfig(ctx: { breeds: Breed[] }): FilterConfig<Bird> {
  return {
    filterDefs: [
      {
        key: 'hasBreeds', label: 'نژاد', kind: 'enum',
        icon: <IconActivity size={18} />,
        options: [
          { value: 'yes', label: 'دارد' },
          { value: 'no', label: 'ندارد' },
        ],
        getValue: (b: Bird) => ctx.breeds.some(x => x.birdId === b.id) ? 'yes' : 'no',
      },
    ],
    sortDefs: [
      {
        key: 'name', label: 'نام', icon: <IconTag size={18} />,
        hint: 'از الف به ی',
        compare: (a: Bird, b: Bird) => (a.name || '').localeCompare(b.name || '', 'fa'),
      },
      {
        key: 'createdAt', label: 'جدیدترین', icon: <IconClock size={18} />,
        hint: 'بر اساس تاریخ ایجاد',
        compare: (a: Bird, b: Bird) => (a.createdAt || '').localeCompare(b.createdAt || ''),
      },
    ],
    persistKey: 'brd-birds',
    initialSort: { key: 'name', dir: 'asc' },
  };
}
