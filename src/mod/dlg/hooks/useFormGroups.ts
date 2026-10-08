/**
 * useFormGroups — مدیریت state گروه‌های باز/بسته فرم
 */
import { useState } from 'react';

export function useFormGroups(initial: Record<string, boolean>) {
  const [groups, setGroups] = useState<Record<string, boolean>>(initial);
  const toggle = (id: string) => setGroups(g => ({ ...g, [id]: !g[id] }));
  const openOnly = (id: string) => setGroups(g => {
    const next: Record<string, boolean> = {};
    for (const k of Object.keys(g)) next[k] = k === id;
    next[id] = true;
    return next;
  });
  const closeAll = () => setGroups({});
  const openAll = (ids: string[]) => setGroups(Object.fromEntries(ids.map(i => [i, true])));
  return { groups, toggle, openOnly, closeAll, openAll };
}

export { AccordionSection } from '../../../shr/components/AccordionSection';

