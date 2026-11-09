import { useMemo, useRef } from 'react';
import type { GroupDef } from './configs/_types';

export interface GroupedResult<T> {
  key: string;
  title: string;
  items: T[];
}

/**
 * useGroupedList — گروه‌بندی داینامیک
 * - groupBy='none' یا groupDefs=undefined → null (بدون گروه)
 * - در غیر این صورت → [{key, title, items}] با حفظ ترتیب اصلی list
 */
export function useGroupedList<T>(opts: {
  list: T[];
  groupDefs?: GroupDef<T>[];
  groupBy: string;
  ctx?: any;
}): GroupedResult<T>[] | null {
  const { list, groupDefs, groupBy, ctx } = opts;
  const ctxRef = useRef(ctx);
  ctxRef.current = ctx;

  return useMemo(() => {
    if (groupBy === 'none' || !groupDefs) return null;
    const gDef = groupDefs.find(g => g.key === groupBy);
    if (!gDef) return null;

    const groups: Record<string, T[]> = {};
    for (const item of list) {
      const k = gDef.getKey(item);
      if (!groups[k]) groups[k] = [];
      groups[k].push(item);
    }
    return Object.entries(groups).map(([key, items]) => ({
      key,
      title: gDef.getLabel(key, ctxRef.current),
      items,
    }));
  }, [list, groupDefs, groupBy]);
}
