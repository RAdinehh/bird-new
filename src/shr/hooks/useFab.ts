/**
 * useFab — ثبت FAB برای ماژول فعلی
 *
 * استفاده:
 *   useFab({ label: 'افزودن گله', onClick: openNew });
 *   useFab(active ? { label: '...', onClick } : null);
 */
import { useEffect } from 'react';
import { useFabStore, type FabConfig } from '../../cor/ui/fabStore';

export function useFab(cfg: FabConfig | null) {
  const setConfig = useFabStore(s => s.set);

  useEffect(() => {
    if (!cfg || cfg.hidden) {
      setConfig(null);
      return;
    }
    setConfig(cfg);
    return () => setConfig(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cfg?.label, cfg?.hidden, cfg?.onClick]);
}
