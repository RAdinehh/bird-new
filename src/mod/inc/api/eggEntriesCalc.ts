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
