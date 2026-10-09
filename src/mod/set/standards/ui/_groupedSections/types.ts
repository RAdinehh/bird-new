/**
 * types.ts — انواع مشترک گروه‌های استاندارد
 */
import type { BirdStandard } from '../../types';
import type { StandardOverrides } from '../../_override';
import { isOverridden as isOverriddenFn } from '../../_override';

export interface SectionProps {
  std: BirdStandard;
  def: BirdStandard;
  isChanged: boolean;
  updateBird: (patch: Partial<BirdStandard>) => void;

  // 🆕 Override
  overrides?: StandardOverrides;
  /** ذخیره override یه فیلد — مسیر به صورت dot notation */
  setOverride?: (path: string, value: any) => void;
  /** حذف override یه فیلد */
  clearOverride?: (path: string) => void;
}

// ═══ Helpers مشترک ═══
export function isChanged(a: unknown, b: unknown): boolean {
  try { return JSON.stringify(a) !== JSON.stringify(b); } catch { return false; }
}

export function parseNum(text: string): number | null {
  const en = text
    .replace(/[۰-۹]/g, d => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
    .replace(/[٫،]/g, '.')
    .replace(/[^\d.-]/g, '');
  const n = parseFloat(en);
  return isNaN(n) ? null : n;
}

/** 🆕 چک آیا یک فیلد override شده */
export function isFieldOverridden(overrides: StandardOverrides | undefined, path: string): boolean {
  return isOverriddenFn(overrides, path);
}
