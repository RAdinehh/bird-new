/**
 * useFab — ثبت FAB برای ماژول فعلی
 *
 * استفاده:
 *   useFab({ label: 'افزودن گله', onClick: openNew });
 *   useFab(active ? { label: '...', onClick } : null);
 */
import { useEffect, useRef } from 'react';
import { useFabStore, type FabConfig } from '../../cor/ui/fabStore';

export function useFab(cfg: FabConfig | null) {
  const set = useFabStore(s => s.set);
  const myId = useRef('fab_' + Math.random().toString(36).slice(2, 10));

  useEffect(() => {
    const id = myId.current;
    if (!cfg || cfg.hidden) {
      set(null, id);
      return;
    }
    set(cfg, id);
    return () => set(null, id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cfg?.label, cfg?.hidden, cfg?.onClick]);
}
