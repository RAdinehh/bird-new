/**
 * api/hallCapacity.ts — چک ظرفیت سالن برای گله
 */
import type { Flock } from '../store';
import type { Hall } from '../../hal/store';
import type { useBreedStandard } from '../../../shr/hooks/useBreedStandard';

type BreedStd = ReturnType<typeof useBreedStandard>;

export interface HallCapacityResult {
  ok: boolean;
  capacity: number;
  current: number;
  total: number;
  over: number;
  mode: 'count' | 'area';
  note?: string;
}

export function checkHallCapacity(
  hallId: string,
  newCount: number,
  flocks: Flock[],
  halls: Hall[],
  breedStd: BreedStd,
  excludeFlockId?: string,
  newBreedId?: string,
): HallCapacityResult | null {
  if (!hallId || !newCount) return null;
  const hall = halls.find(h => h.id === hallId);
  if (!hall) return null;

  const area = (hall.length || 0) * (hall.width || 0);
  const hasArea = area > 0;

  if (hasArea) {
    let usedArea = 0;
    let hasUnknownDensity = false;
    const activeFlocks = (flocks || []).filter(f => f.hallId === hallId && f.status === 'active' && f.id !== excludeFlockId);

    for (const f of activeFlocks) {
      const std = breedStd.byBreedId(f.breedId);
      const density = std?.space?.densityMax;
      const count = f.currentCount || f.initialCount || 0;
      if (density && density > 0) {
        usedArea += count / density;
      } else {
        hasUnknownDensity = true;
      }
    }

    const newStd = newBreedId ? breedStd.byBreedId(newBreedId) : null;
    const newDensity = newStd?.space?.densityMax;
    if (newDensity && newDensity > 0) {
      usedArea += newCount / newDensity;
    } else {
      hasUnknownDensity = true;
    }

    const over = usedArea - area;
    return {
      ok: over <= 0 && !hasUnknownDensity,
      capacity: Math.round(area),
      current: Math.round(usedArea - (newDensity && newDensity > 0 ? newCount / newDensity : 0)),
      total: Math.round(usedArea),
      over: over > 0 ? Math.round(over) : 0,
      mode: 'area',
      note: hasUnknownDensity ? 'بعضی نژادها تراکم تعریف نشده — دقیق نیست' : undefined,
    };
  }

  if (!hall.capacity) return null;
  const current = (flocks || [])
    .filter(f => f.hallId === hallId && f.status === 'active' && f.id !== excludeFlockId)
    .reduce((sum, f) => sum + (f.currentCount || f.initialCount || 0), 0);
  const total = current + newCount;
  const over = total - hall.capacity;
  return {
    ok: over <= 0,
    capacity: hall.capacity,
    current,
    total,
    over: over > 0 ? over : 0,
    mode: 'count',
  };
}
