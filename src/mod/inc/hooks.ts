/**
 * hooks.ts — هوک‌های reactive برای انکوباسیون
 */
import { useSet } from '../set/store';
import { findProfile, getIncubationDefault, normalizeBird } from './helpers';

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
 * هوک reactive — پروفایل انکوباسیون رو از تنظیمات می‌خونه
 * وقتی کاربر تو تنظیمات تغییر بده، همه جا فوراً آپدیت می‌شه
 */
export function useIncubationProfile(birdName: string | undefined): ResolvedProfile {
  const settings = useSet();
  const profiles: any[] = (settings as any).incubationProfiles || [];
  const fallback = getIncubationDefault(birdName || 'مرغ');
  const found = findProfile(profiles, birdName || '');

  if (found) {
    return {
      birdName: found.birdName,
      setterTemp: found.setterTemp ?? fallback.setterTemp,
      setterHumidity: found.setterHumidity ?? fallback.setterHumidity,
      hatcherTemp: found.hatcherTemp ?? fallback.hatcherTemp,
      hatcherHumidity: found.hatcherHumidity ?? fallback.hatcherHumidity,
      totalDays: found.totalDays ?? fallback.totalDays,
      lockdownDay: found.lockdownDay ?? fallback.lockdownDay,
      isCustom: true,
    };
  }

  return {
    birdName: birdName || 'مرغ',
    ...fallback,
    isCustom: false,
  };
}

export { normalizeBird };
