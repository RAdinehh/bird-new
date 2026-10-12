/**
 * _source.ts — تشخیص منبع داده هر فیلد
 *
 * طبق FOUNDATION بخش ۱۵ (Single Resolver):
 *   همه‌ی خوانش‌ها از standard از طریق resolveStandard.
 *
 * منابع ممکن:
 *   standard — مقدار با استاندارد یکی ئه
 *   parent   — مقدار از والد (پرنده)
 *   manual   — کاربر دستی وارد کرده
 *   none     — خالی
 */
import type { SourceType } from '../../shr/components/SourceBadge';
import { DEFAULT_STANDARDS } from '../set/standards/data';
import { resolveStandard } from './_display-values';

export interface SourceInfo {
  source: SourceType;
  label?: string;
}

// ═══ helpers خصوصی ═══
function getCycle(breed: { standardKey?: string }, cs?: any, co?: any): number | null {
  const std = resolveStandard(breed.standardKey, cs, co);
  return std?.biology?.cullDay ?? null;
}

function getLastFcr(breed: { standardKey?: string }, cs?: any, co?: any): number | null {
  const std = resolveStandard(breed.standardKey, cs, co);
  const last = std?.growth?.weightByAge?.slice(-1)?.[0];
  return last?.fcr ?? null;
}

function getStdLabel(std: any): string {
  return std?.nameFa || std?.nameEn || '';
}

// ═══ cycleDays ═══
export function detectCycleDaysSource(
  cycleDays: number | null | undefined,
  standardKey?: string,
  customStandards?: Record<string, any>,
  customOverrides?: Record<string, any>,
): SourceInfo {
  if (!cycleDays) return { source: 'none' };

  // ۱. چک استاندارد مشخص
  if (standardKey) {
    const std = resolveStandard(standardKey, customStandards, customOverrides);
    if (std?.biology?.cullDay === cycleDays) {
      return { source: 'standard', label: getStdLabel(std) };
    }
  }

  // ۲. چک همه استانداردها (اگه standardKey نبود)
  const allKeys = new Set([
    ...Object.keys(DEFAULT_STANDARDS),
    ...Object.keys(customStandards || {}),
  ]);
  for (const k of allKeys) {
    const std = resolveStandard(k, customStandards, customOverrides);
    if (std?.biology?.cullDay === cycleDays) {
      return { source: 'standard', label: getStdLabel(std) };
    }
  }

  return { source: 'manual' };
}

// ═══ FCR ═══
export function detectFcrSource(
  fcr: number | null | undefined,
  standardKey?: string,
  customStandards?: Record<string, any>,
  customOverrides?: Record<string, any>,
): SourceInfo {
  if (!fcr) return { source: 'none' };

  // ۱. چک استاندارد مشخص
  if (standardKey) {
    const std = resolveStandard(standardKey, customStandards, customOverrides);
    const last = std?.growth?.weightByAge?.slice(-1)?.[0];
    if (last?.fcr === fcr) {
      return { source: 'standard', label: getStdLabel(std) };
    }
  }

  // ۲. همه
  const allKeys = new Set([
    ...Object.keys(DEFAULT_STANDARDS),
    ...Object.keys(customStandards || {}),
  ]);
  for (const k of allKeys) {
    const std = resolveStandard(k, customStandards, customOverrides);
    const last = std?.growth?.weightByAge?.slice(-1)?.[0];
    if (last?.fcr === fcr) {
      return { source: 'standard', label: getStdLabel(std) };
    }
  }

  return { source: 'manual' };
}

// ═══ Breed FCR ═══
export function detectBreedFcrSource(
  fcr: number | null | undefined,
  standardKey?: string,
  parentFcr?: number | null,
  customStandards?: Record<string, any>,
  customOverrides?: Record<string, any>,
): SourceInfo {
  if (!fcr) return { source: 'none' };

  if (standardKey) {
    const std = resolveStandard(standardKey, customStandards, customOverrides);
    const last = std?.growth?.weightByAge?.slice(-1)?.[0];
    if (last?.fcr === fcr) {
      return { source: 'standard', label: getStdLabel(std) };
    }
  }

  const allKeys = new Set([
    ...Object.keys(DEFAULT_STANDARDS),
    ...Object.keys(customStandards || {}),
  ]);
  for (const k of allKeys) {
    const std = resolveStandard(k, customStandards, customOverrides);
    const last = std?.growth?.weightByAge?.slice(-1)?.[0];
    if (last?.fcr === fcr) {
      return { source: 'standard', label: getStdLabel(std) };
    }
  }

  if (parentFcr && parentFcr === fcr) {
    return { source: 'parent' };
  }

  return { source: 'manual' };
}

// ═══ Override Detection ═══
function getStandardValue(
  standardKey: string | undefined,
  field: 'cycleDays' | 'fcr',
  customStandards?: Record<string, any>,
  customOverrides?: Record<string, any>,
): { value: number | null; label: string } {
  if (!standardKey) return { value: null, label: '' };
  const std = resolveStandard(standardKey, customStandards, customOverrides);
  if (!std) return { value: null, label: '' };

  const label = getStdLabel(std);
  if (field === 'cycleDays') {
    return { value: std?.biology?.cullDay ?? null, label };
  }
  const last = std?.growth?.weightByAge?.slice(-1)?.[0];
  return { value: last?.fcr ?? null, label };
}

export function getOverrideInfo(
  current: number | null | undefined,
  standardKey: string | undefined,
  field: 'cycleDays' | 'fcr',
  customStandards?: Record<string, any>,
  customOverrides?: Record<string, any>,
): { overridden: boolean; stdValue: number | null; stdLabel: string } {
  const { value: stdValue, label: stdLabel } = getStandardValue(
    standardKey, field, customStandards, customOverrides
  );
  if (stdValue == null || current == null) {
    return { overridden: false, stdValue: null, stdLabel: '' };
  }
  return { overridden: current !== stdValue, stdValue, stdLabel };
}

// ═══ Breed FCR Baseline ═══
export function getBreedFcrBaseline(
  standardKey: string | undefined,
  parentFcr: number | null | undefined,
  customStandards?: Record<string, any>,
  customOverrides?: Record<string, any>,
): { value: number | null; label: string; kind: 'standard' | 'parent' | 'none' } {
  if (standardKey) {
    const std = resolveStandard(standardKey, customStandards, customOverrides);
    const last = std?.growth?.weightByAge?.slice(-1)?.[0];
    if (last?.fcr != null) {
      return { value: last.fcr, label: getStdLabel(std), kind: 'standard' };
    }
  }
  if (parentFcr != null) {
    return { value: parentFcr, label: 'والد', kind: 'parent' };
  }
  return { value: null, label: '', kind: 'none' };
}
