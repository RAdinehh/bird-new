import { bus } from '../../cor/events';
import { useFlk } from './store';

export function registerFlkHandlers(): () => void {
  const off1 = bus.on('dlg:deaths:recorded', (data, meta) => {
    try {
      const flkState = useFlk.getState();
      const { flockId, date, count, deaths, isEdit, prevCount, prevFlockId } = data;

      if (isEdit && prevFlockId && prevFlockId !== flockId && (prevCount || 0) > 0) {
        const oldFlock = flkState.flocks.find(f => f.id === prevFlockId);
        if (oldFlock) {
          flkState.update(prevFlockId, {
            currentCount: (oldFlock.currentCount ?? 0) + (prevCount || 0),
          });
        }
      }

      const sameFlock = isEdit && prevFlockId === flockId;
      const delta = sameFlock ? (count - (prevCount || 0)) : count;
      if (delta === 0) return;

      const flock = flkState.flocks.find(f => f.id === flockId);
      if (!flock) return;

      flkState.update(flockId, {
        currentCount: Math.max(0, (flock.currentCount ?? 0) - delta),
      });

      if (delta > 0) {
        const causeMap: Record<string, string> = {
          disease_respiratory: 'بیماری تنفسی',
          disease_digestive: 'بیماری گوارشی',
          disease_other: 'بیماری دیگر',
          heat: 'گرمازدگی',
          cold: 'سرمازدگی',
          suffocation: 'خفگی',
          cannibalism: 'پرنده‌خواری',
          predator: 'شکارچی',
          injury: 'آسیب',
          weak: 'ضعف',
          deformity: 'نقص مادرزادی',
          old_age: 'پیری',
          unknown: 'نامشخص',
        };
        const causes = (deaths || [])
          .map((d: any) => causeMap[d.cause] || d.cause)
          .filter((x: string) => x && x !== '—')
          .join('، ');

        flkState.addEvent(flockId, {
          date,
          type: 'death',
          count: delta,
          sex: 'mixed',
          reason: causes || undefined,
          notes: 'ثبت روزانه',
        });
      }

      if (meta.traceId) {
        try { console.debug(`[flk] deaths cascade: delta=${delta}`, meta.traceId); } catch {}
      }
    } catch (e) {
      try { console.error('[flk] handler failed:', e); } catch {}
    }
  });

  const off2 = bus.on('dlg:log:deleted', (data) => {
    try {
      const { flockId, deathsCount } = data;
      if (!flockId || !deathsCount || deathsCount <= 0) return;
      const flkState = useFlk.getState();
      const flock = flkState.flocks.find(f => f.id === flockId);
      if (!flock) return;
      flkState.update(flockId, {
        currentCount: (flock.currentCount ?? 0) + deathsCount,
      });
    } catch (e) {
      try { console.error('[flk] delete handler failed:', e); } catch {}
    }
  });

  return () => { off1(); off2(); };
}
