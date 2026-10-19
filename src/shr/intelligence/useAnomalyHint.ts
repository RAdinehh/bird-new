/**
 * intelligence/useAnomalyHint.ts
 *
 * Hook نمایش هشدار. Pure — بدون side effect.
 * برای ذخیره در تاریخچه از analyzeAndRecord استفاده کن.
 */
import { useMemo } from 'react';
import type { AnalysisContext, Warning } from './types';
import { analyzeAnomaly } from './anomalyDetector';

export function useAnomalyHint(
  fieldPath: string | undefined,
  value: number | null | undefined,
  context: AnalysisContext = {},
): Warning | null {
  const ctxKey = JSON.stringify(context);
  return useMemo(() => {
    if (!fieldPath) return null;
    if (value === null || value === undefined) return null;
    const n = typeof value === 'number' ? value : Number(value);
    if (!Number.isFinite(n) || n === 0) return null;
    try {
      return analyzeAnomaly(fieldPath, n, context);
    } catch {
      return null;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fieldPath, value, ctxKey]);
}
