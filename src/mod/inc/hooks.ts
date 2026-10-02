/**
 * hooks.ts — هوک‌های reactive برای انکوباسیون
 * از standards (تنظیمات) می‌خونه
 */

import { useSet } from '../set/store';
import { getIncubation } from '../set/standards';
import { getIncubationDefault, normalizeBird } from './helpers';

export interface ResolvedProfile {
  birdName: string;
  setterTemp: number;
  setterHumidity: number;
  hatcherTemp: number;
  hatcherHumidity: number;
  totalDays: number;
  lockdownDay: number;
  isCustom: boolean;
}

/**
 * هوک reactive — پروفایل انکوباسیون رو از standards می‌خونه
 * وقتی کاربر تو تنظیمات تغییر بده، همه جا فوراً آپدیت می‌شه
 */
export function useIncubationProfile(birdName: string | undefined): ResolvedProfile {
  const settings = useSet();
  const custom = (settings as any).customStandards || {};
  const fallback = getIncubationDefault(birdName || 'مرغ');

  const inc = getIncubation(birdName || '', { customStandards: custom });

  if (inc) {
    return {
      birdName: birdName || 'مرغ',
      setterTemp: inc.setterTemp,
      setterHumidity: inc.setterHumidity,
      hatcherTemp: inc.hatcherTemp,
      hatcherHumidity: inc.hatcherHumidity,
      totalDays: inc.totalDays,
      lockdownDay: inc.lockdownDay,
      isCustom: false,  // استاندارد پیش‌فرض (نه سفارشی)
    };
  }

  return {
    birdName: birdName || 'مرغ',
    ...fallback,
    isCustom: false,
  };
}

export { normalizeBird };
