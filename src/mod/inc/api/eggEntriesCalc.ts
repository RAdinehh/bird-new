/**
 * api/eggEntriesCalc.ts — توابع خالص EggEntriesPage
 */
import { addDaysJalali, jalaliToDate } from '../store';

/** ساعت فعلی به صورت HH:MM */
export function nowTime(): string {
  const d = new Date();
  return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
}

export interface FlockReadyResult {
  ready: boolean;
  ageDays: number;
  minAge: number;
  daysLeft: number;
}

/** چک آماده بودن گله برای تخم‌گذاری */
export function flockReadyForEggs(flock: any, _bird: any): FlockReadyResult {
  const startDate = flock?.hatchDate || flock?.purchaseDate || flock?.startDate || '';
  if (!startDate) return { ready: true, ageDays: 0, minAge: 0, daysLeft: 0 };
  try {
    const start = jalaliToDate(startDate);
    if (!start) return { ready: true, ageDays: 0, minAge: 0, daysLeft: 0 };
    const today = new Date();
    const ageDays = Math.max(0, Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
    const minAge = flock?.layingStartDay || 140;
    return {
      ready: ageDays >= minAge,
      ageDays,
      minAge,
      daysLeft: Math.max(0, minAge - ageDays),
    };
  } catch { return { ready: true, ageDays: 0, minAge: 0, daysLeft: 0 }; }
}

/** محاسبه تاریخ ورود برای هچ همزمان */
export function calcEntryDateForSyncHatch(targetHatchDate: string, totalDays: number): string {
  if (!targetHatchDate || !totalDays) return '';
  return addDaysJalali(targetHatchDate, -totalDays);
}

/** کلید localStorage برای draft هر دستگاه */
export const DRAFT_KEY = (devId: string) => 'pm-inc-egg-draft-' + devId;

/** محاسبه استفاده‌ی دستگاه (بر اساس ظرفیت‌های مختلف پرنده‌ها) */
export function calcDeviceUsage(
  device: any,
  entries: any[],
  newEntry?: { birdName: string; count: number }
): { used: number; total: number; percent: number } {
  const caps: any[] = device?.capacityByBird || [];
  if (caps.length === 0) return { used: 0, total: 0, percent: 0 };
  const refCap = Math.max(...caps.map(c => c.capacity || 0));
  if (refCap === 0) return { used: 0, total: 0, percent: 0 };
  const byBird: Record<string, number> = {};
  caps.forEach(c => {
    if (!c.birdName) return;
    const factor = (c.capacity && c.capacity > 0) ? (refCap / c.capacity) : 1;
    byBird[c.birdName] = factor;
  });
  let used = 0;
  entries.forEach(e => {
    if (e.status === 'failed') return;
    const factor = byBird[e.__birdName || ''];
    if (!factor) return;
    used += (e.count || 0) * factor;
  });
  if (newEntry) {
    const factor = byBird[newEntry.birdName];
    if (factor) used += newEntry.count * factor;
  }
  return {
    used: Math.round(used * 10) / 10,
    total: refCap,
    percent: Math.round((used / refCap) * 100),
  };
}
