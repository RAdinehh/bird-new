/**
 * useFlocksKpi — محاسبه KPI گله‌ها
 * الگو: هم‌راستا با hal (۳ کارت پایه)
 */
import { useMemo } from 'react';
import type { Flock } from '../store';

export interface FlocksKpi {
  totalFlocks: number;
  totalBirds: number;
  totalValue: number;
}

export function useFlocksKpi(flocks: Flock[]): FlocksKpi {
  return useMemo(() => {
    // همه گله‌های زنده (بدون archive/sold)
    const live = flocks.filter(f => f.status !== 'archived' && f.status !== 'sold' && !f.paused);

    const totalBirds = live.reduce((sum, f) => sum + (f.currentCount || f.initialCount || 0), 0);

    const totalValue = live.reduce((sum, f) => {
      const count = f.initialCount || 0;
      const price = f.purchasePrice || 0;
      return sum + (count * price);
    }, 0);

    return {
      totalFlocks: live.length,
      totalBirds,
      totalValue,
    };
  }, [flocks]);
}
