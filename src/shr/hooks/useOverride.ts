/**
 * useOverride — Hook مشترک برای تشخیص Override
 *
 * استفاده (۲ خط):
 *   const { hint } = useOverride({ current, stdValue, onReset, unit, decimals });
 *   <OverrideHint {...hint} />
 */

import { useMemo } from 'react';

export interface UseOverrideParams {
  current: number | null | undefined;
  stdValue: number | null | undefined;
  onReset: () => void;
  unit?: string;
  decimals?: number;
}

export interface OverrideHintProps {
  overridden: boolean;
  stdValue: number | null;
  unit?: string;
  decimals?: number;
  onReset: () => void;
}

export function useOverride({
  current, stdValue, onReset, unit, decimals = 0,
}: UseOverrideParams): { hint: OverrideHintProps } {
  const hint = useMemo<OverrideHintProps>(() => {
    const overridden =
      stdValue != null &&
      current != null &&
      Number(current) !== Number(stdValue);
    return {
      overridden,
      stdValue: stdValue ?? null,
      unit,
      decimals,
      onReset,
    };
  }, [current, stdValue, onReset, unit, decimals]);

  return { hint };
}
