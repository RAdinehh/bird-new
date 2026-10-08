/** انواع مشترک فیلتر */
import type { FilterDef, SortDef, SortState } from '../types';

export type { FilterDef, SortDef, SortState } from '../types';

/** خروجی مشترک همه کانفیگ‌ها */
export interface FilterConfig<T> {
  filterDefs: FilterDef<T>[];
  sortDefs: SortDef<T>[];
  persistKey: string;
  initialSort?: SortState;
}
