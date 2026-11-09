/** انواع مشترک فیلتر */
import type { FilterDef, SortDef, SortState } from '../types';
import type React from 'react';

export type { FilterDef, SortDef, SortState } from '../types';

/** گروه‌بندی داینامیک */
export interface GroupDef<T> {
  key: string;
  label: string;
  icon?: React.ReactNode;
  getKey: (item: T) => string;
  getLabel: (key: string, ctx: any) => string;
}

/** خروجی مشترک همه کانفیگ‌ها */
export interface FilterConfig<T> {
  filterDefs: FilterDef<T>[];
  sortDefs: SortDef<T>[];
  groupDefs?: GroupDef<T>[];
  persistKey: string;
  initialSort?: SortState;
}
