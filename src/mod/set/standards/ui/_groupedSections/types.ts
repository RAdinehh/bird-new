/**
 * types.ts — انواع مشترک گروه‌های استاندارد
 */
import type { BirdStandard } from '../../types';

export interface SectionProps {
  std: BirdStandard;
  def: BirdStandard;
  isChanged: boolean;      // آیا این گروه تغییر کرده
  updateBird: (patch: Partial<BirdStandard>) => void;
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
