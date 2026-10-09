/**
 * _source.ts — تشخیص منبع داده هر فیلد
 *
 * چطور تشخیص می‌ده:
 *   standard — اگه standardKey وصل باشه و مقدار با استاندارد یکی باشه
 *   preset   — اگه مقدار با BIRD_PRESETS یکی باشه
 *   parent   — اگه مقدار از والد (پرنده) گرفته شده باشه
 *   manual   — اگه کاربر دستی وارد کرده (هیچ تطابقی نیست)
 *   none     — اگه خالی
 */
import type { SourceType } from '../../shr/components/SourceBadge';
import { DEFAULT_STANDARDS } from '../set/standards/data';
import { BIRD_PRESETS } from './presets';

export interface SourceInfo {
  source: SourceType;
  /** نام دقیق منبع — مثلاً «Ross 308» یا «مرغ» */
  label?: string;
}

/**
 * تشخیص منبع مقدار cycleDays
 */
export function detectCycleDaysSource(
  cycleDays: number | null | undefined,
  standardKey?: string,
  birdName?: string,
): SourceInfo {
  if (!cycleDays) return { source: 'none' };

  // ۱. چک استاندارد
  if (standardKey) {
    const std = (DEFAULT_STANDARDS as any)[standardKey];
    const stdCycle = std?.biology?.cullDay;
    if (stdCycle && stdCycle === cycleDays) {
      return { source: 'standard', label: std.nameFa || std.nameEn };
    }
  }

  // ۲. چک همه استانداردها (اگه standardKey نبود ولی مقدار با یکی هماهنگ بود)
  for (const [k, std] of Object.entries(DEFAULT_STANDARDS as any)) {
    const stdCycle = (std as any)?.biology?.cullDay;
    if (stdCycle === cycleDays) {
      return { source: 'standard', label: (std as any).nameFa };
    }
  }

  // ۳. چک preset بر اساس اسم پرنده
  if (birdName) {
    const preset = (BIRD_PRESETS as any)[birdName.trim()];
    if (preset?.cycleDays === cycleDays) {
      return { source: 'preset', label: birdName.trim() };
    }
  }

  // ۴. چک همه presetها
  for (const [name, p] of Object.entries(BIRD_PRESETS)) {
    if (p.cycleDays === cycleDays) {
      return { source: 'preset', label: name };
    }
  }

  // ۵. دستی
  return { source: 'manual' };
}

/**
 * تشخیص منبع مقدار FCR
 */
export function detectFcrSource(
  fcr: number | null | undefined,
  standardKey?: string,
  birdName?: string,
): SourceInfo {
  if (!fcr) return { source: 'none' };

  // ۱. چک استاندارد — آخرین مقدار fcr در growth
  if (standardKey) {
    const std = (DEFAULT_STANDARDS as any)[standardKey];
    const lastGrowth = std?.growth?.weightByAge?.[std.growth.weightByAge.length - 1];
    if (lastGrowth?.fcr === fcr) {
      return { source: 'standard', label: std.nameFa || std.nameEn };
    }
  }

  // ۲. چک همه استانداردها
  for (const [k, std] of Object.entries(DEFAULT_STANDARDS as any)) {
    const lastGrowth = (std as any)?.growth?.weightByAge?.slice(-1)?.[0];
    if (lastGrowth?.fcr === fcr) {
      return { source: 'standard', label: (std as any).nameFa };
    }
  }

  // ۳. preset بر اساس اسم پرنده
  if (birdName) {
    const preset = (BIRD_PRESETS as any)[birdName.trim()];
    if (preset?.fcrStandard === fcr) {
      return { source: 'preset', label: birdName.trim() };
    }
  }

  // ۴. همه presetها
  for (const [name, p] of Object.entries(BIRD_PRESETS)) {
    if (p.fcrStandard === fcr) {
      return { source: 'preset', label: name };
    }
  }

  // ۵. دستی
  return { source: 'manual' };
}

/**
 * تشخیص منبع FCR نژاد — می‌تونه از پرنده والد ارث برده باشه
 */
export function detectBreedFcrSource(
  fcr: number | null | undefined,
  standardKey?: string,
  parentFcr?: number | null,
): SourceInfo {
  if (!fcr) return { source: 'none' };

  // ۱. استاندارد
  if (standardKey) {
    const std = (DEFAULT_STANDARDS as any)[standardKey];
    const lastGrowth = std?.growth?.weightByAge?.[std.growth.weightByAge.length - 1];
    if (lastGrowth?.fcr === fcr) {
      return { source: 'standard', label: std.nameFa || std.nameEn };
    }
  }

  // ۲. همه استانداردها
  for (const [, std] of Object.entries(DEFAULT_STANDARDS as any)) {
    const lastGrowth = (std as any)?.growth?.weightByAge?.slice(-1)?.[0];
    if (lastGrowth?.fcr === fcr) {
      return { source: 'standard', label: (std as any).nameFa };
    }
  }

  // ۳. از پرنده والد
  if (parentFcr && parentFcr === fcr) {
    return { source: 'parent' };
  }

  // ۴. دستی
  return { source: 'manual' };
}


// ═══ Override Detection ═══
export function getStandardValue(
  standardKey: string | undefined,
  field: 'cycleDays' | 'fcr',
  birdName?: string,
): { value: number | null; label: string } {
  // ۱. اول standardKey
  if (standardKey) {
    const std = (DEFAULT_STANDARDS as any)[standardKey];
    if (std) {
      const label = std.nameFa || std.nameEn || '';
      if (field === 'cycleDays') {
        return { value: std?.biology?.cullDay ?? null, label };
      }
      const last = std?.growth?.weightByAge?.[std.growth.weightByAge.length - 1];
      return { value: last?.fcr ?? null, label };
    }
  }
  // ۲. اگه standardKey نبود، از preset با اسم پرنده
  if (birdName) {
    const preset = (BIRD_PRESETS as any)[birdName.trim()];
    if (preset) {
      return {
        value: field === 'cycleDays' ? (preset.cycleDays ?? null) : (preset.fcrStandard ?? null),
        label: preset.name,
      };
    }
  }
  return { value: null, label: '' };
}

export function getOverrideInfo(
  current: number | null | undefined,
  standardKey: string | undefined,
  field: 'cycleDays' | 'fcr',
  birdName?: string,
): { overridden: boolean; stdValue: number | null; stdLabel: string } {
  const { value: stdValue, label: stdLabel } = getStandardValue(standardKey, field, birdName);
  if (stdValue == null || current == null) {
    return { overridden: false, stdValue: null, stdLabel: '' };
  }
  return { overridden: current !== stdValue, stdValue, stdLabel };
}
