/**
 * intelligence/useAnomalyHint.ts — hook نمایش هشدار
 */
import { useMemo } from 'react';
import type { AnalysisContext, Warning } from './types';
import { analyzeAnomaly } from './anomalyDetector';

/** تبدیل مقدار به عدد (پشتیبانی از ارقام فارسی و جداکننده) */
export function parseNumericValue(v: number | string | null | undefined): number | null {
  if (v === null || v === undefined) return null;
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  const s = String(v).trim();
  if (!s) return null;
  const en = s.replace(/[۰-۹]/g, d => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)));
  const n = parseFloat(en.replace('٫', '.'));
  return Number.isFinite(n) ? n : null;
}

export function useAnomalyHint(
  fieldPath: string | undefined,
  value: number | string | null | undefined,
  context: AnalysisContext = {},
): Warning | null {
  const ctxKey = JSON.stringify(context);
  const valueKey = typeof value === 'number' ? value : String(value ?? '');
  return useMemo(() => {
    if (!fieldPath) return null;
    const n = parseNumericValue(value);
    if (n === null) return null;
    try {
      return analyzeAnomaly(fieldPath, n, context);
    } catch {
      return null;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fieldPath, valueKey, ctxKey]);
}
