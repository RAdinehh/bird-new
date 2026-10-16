/**
 * api/hallCapacity.ts — چک ظرفیت سالن/بخش برای گله
 *
 * منطق:
 *  ۱. گله با بخش + بخش ظرفیت داره → چک ظرفیت بخش
 *  ۲. گله بدون بخش → چک ظرفیت باقی‌مونده سالن (منهای بخش‌ها)
 *  ۳. اگه سالن area داره و ظرفیت عددی نداره → چک area
 */
import type { Flock } from '../store';
import type { Hall, Zone } from '../../hal/store';
import type { useBreedStandard } from '../../../shr/hooks/useBreedStandard';

type BreedStd = ReturnType<typeof useBreedStandard>;

export interface ZoneBreakdown {
  id: string;
  name: string;
  capacity: number;
  used: number;
  remaining: number;
  isCurrent: boolean;
}

export interface HallCapacityResult {
  ok: boolean;
  capacity: number;
  current: number;
  total: number;
  over: number;
  remaining: number;
  mode: 'count' | 'area';
  scope: 'hall' | 'zone';
  scopeName: string;
  /** 🆕 تقسیم‌بندی ظرفیت به بخش‌ها */
  breakdown?: {
    hallName: string;
    hallCapacity: number;
    /** ظرفیت بخش‌های رزرو‌شده */
    zones: ZoneBreakdown[];
    /** ظرفیت باقی‌مونده برای گله‌های بدون بخش */
    noZone: {
      capacity: number;
      used: number;
      remaining: number;
      isCurrent: boolean;
    };
  };
  note?: string;
}

export function checkHallCapacity(
  hallId: string,
  zoneId: string | undefined,
  newCount: number,
  flocks: Flock[],
  halls: Hall[],
  zones: Zone[],
  breedStd: BreedStd,
  excludeFlockId?: string,
  newBreedId?: string,
): HallCapacityResult | null {
  if (!hallId || !newCount) return null;
  const hall = halls.find(h => h.id === hallId);
  if (!hall) return null;

  const zone = zoneId ? zones.find(z => z.id === zoneId) : null;
  const activeFlocks = (flocks || []).filter(
    f => f.hallId === hallId && f.status === 'active' && f.id !== excludeFlockId,
  );
  const hallZones = zones.filter(z => z.hallId === hallId && !z.archived);

  // ═══════════ ۱. گله با بخش + بخش ظرفیت عددی داره ═══════════
  if (zone && zone.capacity && zone.capacity > 0) {
    const inZone = activeFlocks.filter(f => f.zoneId === zone.id);
    const current = inZone.reduce((sum, f) => sum + (f.currentCount || f.initialCount || 0), 0);
    const total = current + newCount;
    const over = total - zone.capacity;

    return {
      ok: over <= 0,
      capacity: zone.capacity,
      current,
      total,
      over: over > 0 ? over : 0,
      remaining: Math.max(0, zone.capacity - total),
      mode: 'count',
      scope: 'zone',
      scopeName: zone.name,
      breakdown: buildBreakdown(hall, hallZones, activeFlocks, zone.id),
    };
  }

  // ═══════════ ۲. گله بدون بخش → ظرفیت باقی‌مونده سالن ═══════════
  // 🆕 hallCap = max(hall.capacity, مجموع بخش‌ها)
  const zonesSum = hallZones.reduce((sum, z) => sum + (z.capacity || 0), 0);
  const hallCap = Math.max(hall.capacity || 0, zonesSum);

  if (hallCap > 0) {
    // 🆕 بدون بخش → فقط گله‌های بدون بخش
    const withoutZone = activeFlocks.filter(f => !f.zoneId);
    const current = withoutZone.reduce((sum, f) => sum + (f.currentCount || f.initialCount || 0), 0);
    const total = current + newCount;

    // 🆕 ظرفیت باقی‌مونده برای گله‌های بدون بخش
    const noZoneCap = Math.max(0, hallCap - zonesSum);
    const over = total - noZoneCap;

    return {
      ok: over <= 0,
      capacity: noZoneCap,
      current,
      total,
      over: over > 0 ? over : 0,
      remaining: Math.max(0, noZoneCap - total),
      mode: 'count',
      scope: 'hall',
      scopeName: hall.name,
      breakdown: buildBreakdown(hall, hallZones, activeFlocks, undefined),
      note: noZoneCap === 0 && zonesSum > 0
        ? 'ظرفیت سالن به‌طور کامل به بخش‌ها اختصاص یافته — برای گله بدون بخش، ابتدا بخش‌ها رو کوچک‌تر کن'
        : undefined,
    };
  }

  // ═══════════ ۳. سالن area داره (بدون ظرفیت عددی) ═══════════
  const area = (hall.length || 0) * (hall.width || 0);
  if (area > 0) {
    let usedArea = 0;
    let hasUnknownDensity = false;

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
      remaining: Math.max(0, Math.round(area - usedArea)),
      mode: 'area',
      scope: 'hall',
      scopeName: hall.name,
      note: hasUnknownDensity ? 'بعضی نژادها تراکم تعریف نشده — دقیق نیست' : undefined,
    };
  }

  return null;
}

/** 🆕 ساخت breakdown — تقسیم ظرفیت سالن به بخش‌ها */
function buildBreakdown(
  hall: Hall,
  hallZones: Zone[],
  activeFlocks: Flock[],
  currentZoneId: string | undefined,
): HallCapacityResult['breakdown'] {
  // 🆕 fallback به مجموع بخش‌ها
  const hallCap = (hall.capacity && hall.capacity > 0)
    ? hall.capacity
    : hallZones.reduce((sum, z) => sum + (z.capacity || 0), 0);
  if (hallCap <= 0) return undefined;

  const zonesBreakdown: ZoneBreakdown[] = hallZones
    .filter(z => (z.capacity || 0) > 0)
    .map(z => {
      const used = activeFlocks
        .filter(f => f.zoneId === z.id)
        .reduce((sum, f) => sum + (f.currentCount || f.initialCount || 0), 0);
      const cap = z.capacity || 0;
      return {
        id: z.id,
        name: z.name,
        capacity: cap,
        used,
        remaining: Math.max(0, cap - used),
        isCurrent: currentZoneId === z.id,
      };
    });

  const reservedByZones = zonesBreakdown.reduce((sum, z) => sum + z.capacity, 0);
  const noZoneCap = Math.max(0, hallCap - reservedByZones);
  const noZoneUsed = activeFlocks
    .filter(f => !f.zoneId)
    .reduce((sum, f) => sum + (f.currentCount || f.initialCount || 0), 0);

  return {
    hallName: hall.name,
    hallCapacity: hallCap,
    zones: zonesBreakdown,
    noZone: {
      capacity: noZoneCap,
      used: noZoneUsed,
      remaining: Math.max(0, noZoneCap - noZoneUsed),
      isCurrent: currentZoneId === undefined,
    },
  };
}
