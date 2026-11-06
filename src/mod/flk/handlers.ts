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

      if (delta < 0) {
      flkState.update(flockId, {
        currentCount: (flock.currentCount ?? 0) - delta,
      });
      }

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
          .map((d) => causeMap[d.cause] || d.cause)
          .filter((x: string) => x && x !== '—')
          .join('، ');

        // 🆕 Sex-aware: اگر non-edit و deaths دارای sex → چند رویداد
        const _hasSex = !isEdit && deaths && (deaths as any[]).some((d: any) => d.sex);
        if (_hasSex) {
          const _bySex: Record<'male' | 'female' | 'unknown', number> = { male: 0, female: 0, unknown: 0 };
          for (const _d of (deaths as any[])) {
            const _s = ((_d.sex || 'unknown') as 'male' | 'female' | 'unknown');
            _bySex[_s] += Number(_d.count) || 0;
          }
          const _sum = _bySex.male + _bySex.female + _bySex.unknown;
          if (_sum === delta && (_bySex.male > 0 || _bySex.female > 0)) {
            if (_bySex.male > 0) flkState.addEvent(flockId, { date, type: 'death', count: _bySex.male, sex: 'male', reason: causes || undefined, notes: 'ثبت روزانه (نر)' });
            if (_bySex.female > 0) flkState.addEvent(flockId, { date, type: 'death', count: _bySex.female, sex: 'female', reason: causes || undefined, notes: 'ثبت روزانه (ماده)' });
            if (_bySex.unknown > 0) flkState.addEvent(flockId, { date, type: 'death', count: _bySex.unknown, sex: 'mixed', reason: causes || undefined, notes: 'ثبت روزانه (نامشخص)' });
          } else {
            flkState.addEvent(flockId, { date, type: 'death', count: delta, sex: 'mixed', reason: causes || undefined, notes: 'ثبت روزانه' });
          }
        } else {
          flkState.addEvent(flockId, { date, type: 'death', count: delta, sex: 'mixed', reason: causes || undefined, notes: 'ثبت روزانه' });
        }
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
