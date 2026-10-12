/**
 * _source.ts — تشخیص منبع داده هر فیلد
 *
 * چطور تشخیص می‌ده:
 *   standard — مقدار با استاندارد (DEFAULT_STANDARDS) یکی ئه
 *   parent   — مقدار از والد (پرنده) گرفته شده
 *   manual   — کاربر دستی وارد کرده
 *   none     — خالی
 *
 * ⚠️ از BIRD_PRESETS استفاده نمی‌کنه — طبق FOUNDATION بخش ۵ (کامل بودن داده).
 */
import type { SourceType } from '../../shr/components/SourceBadge';
import { DEFAULT_STANDARDS } from '../set/standards/data';

export interface SourceInfo {
  source: SourceType;
  /** نام دقیق منبع — مثلاً «Ross 308» */
  label?: string;
}

/**
 * تشخیص منبع مقدار cycleDays
 */
export function detectCycleDaysSource(
  cycleDays: number | null | undefined,
  standardKey?: string,
  _birdName?: string,
): SourceInfo {
  if (!cycleDays) return { source: 'none' };

  // ۱. چک استاندارد مشخص (اگه standardKey داره)
  if (standardKey) {
    const std = (DEFAULT_STANDARDS as any)[standardKey];
    const stdCycle = std?.biology?.cullDay;
    if (stdCycle && stdCycle === cycleDays) {
      return { source: 'standard', label: std.nameFa || std.nameEn };
    }
  }

  // ۲. چک همه استانداردها (اگه standardKey نبود ولی مقدار با یکی هماهنگ بود)
  for (const [, std] of Object.entries(DEFAULT_STANDARDS as any)) {
    const stdCycle = (std as any)?.biology?.cullDay;
    if (stdCycle === cycleDays) {
      return { source: 'standard', label: (std as any).nameFa };
    }
  }

  // ۳. دستی
  return { source: 'manual' };
}

/**
 * تشخیص منبع مقدار FCR
 */
export function detectFcrSource(
  fcr: number | null | undefined,
  standardKey?: string,
  _birdName?: string,
): SourceInfo {
  if (!fcr) return { source: 'none' };

  // ۱. چک استاندارد مشخص
  if (standardKey) {
    const std = (DEFAULT_STANDARDS as any)[standardKey];
    const lastGrowth = std?.growth?.weightByAge?.[std.growth.weightByAge.length - 1];
    if (lastGrowth?.fcr === fcr) {
      return { source: 'standard', label: std.nameFa || std.nameEn };
    }
  }

  // ۲. چک همه استانداردها
  for (const [, std] of Object.entries(DEFAULT_STANDARDS as any)) {
    const lastGrowth = (std as any)?.growth?.weightByAge?.slice(-1)?.[0];
    if (lastGrowth?.fcr === fcr) {
      return { source: 'standard', label: (std as any).nameFa };
    }
  }

  // ۳. دستی
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

  // ۱. استاندارد مشخص
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
function getStandardValue(
  standardKey: string | undefined,
  field: 'cycleDays' | 'fcr',
): { value: number | null; label: string } {
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
  return { value: null, label: '' };
}

export function getOverrideInfo(
  current: number | null | undefined,
  standardKey: string | undefined,
  field: 'cycleDays' | 'fcr',
  birdName?: string,
): { overridden: boolean; stdValue: number | null; stdLabel: string } {
  const { value: stdValue, label: stdLabel } = getStandardValue(standardKey, field);
  if (stdValue == null || current == null) {
    return { overridden: false, stdValue: null, stdLabel: '' };
  }
  return { overridden: current !== stdValue, stdValue, stdLabel };
}


// ═══ Breed FCR Baseline ═══
/** مقدار مرجع FCR نژاد: اول standardKey، اگه نبود والد */
export function getBreedFcrBaseline(
  standardKey: string | undefined,
  parentFcr: number | null | undefined,
): { value: number | null; label: string; kind: 'standard' | 'parent' | 'none' } {
  if (standardKey) {
    const std = (DEFAULT_STANDARDS as any)[standardKey];
    if (std) {
      const last = std?.growth?.weightByAge?.[std.growth.weightByAge.length - 1];
      if (last?.fcr != null) {
        return { value: last.fcr, label: std.nameFa || std.nameEn || '', kind: 'standard' };
      }
    }
  }
  if (parentFcr != null) {
    return { value: parentFcr, label: 'والد', kind: 'parent' };
  }
  return { value: null, label: '', kind: 'none' };
}
