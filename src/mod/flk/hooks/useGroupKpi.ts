/**
 * useGroupKpi.ts — محاسبه KPI تجمیعی یک گروه
 * از source of truth موجود (flk + tra) استفاده می‌کنه
 */
import { useMemo } from 'react';
import { useFlk, calcCosts, getAgeDays, type Flock, type FlockStatus, type FlockType } from '../store';
import { useTra } from '../../tra/store';
import { getFlockRevenue } from '../api/flocksCalc';

export interface GroupFlockRow {
  id: string;
  name: string;
  type: FlockType;
  status: FlockStatus;
  currentCount: number;
  initialCount: number;
  ageDays: number;
  cost: number;
  revenue: number;
  profit: number;
}

export interface GroupKpi {
  flockCount: number;
  liveFlockCount: number;
  totalInitial: number;
  totalCurrent: number;
  totalDeaths: number;
  mortalityRate: number;
  totalCost: number;
  totalRevenue: number;
  totalProfit: number;
  byFlock: GroupFlockRow[];
}

const EMPTY: GroupKpi = {
  flockCount: 0,
  liveFlockCount: 0,
  totalInitial: 0,
  totalCurrent: 0,
  totalDeaths: 0,
  mortalityRate: 0,
  totalCost: 0,
  totalRevenue: 0,
  totalProfit: 0,
  byFlock: [],
};

export function useGroupKpi(groupId: string): GroupKpi {
  const groups = useFlk(s => s.groups);
  const getFlocksInGroup = useFlk(s => s.getFlocksInGroup);
  const invoices = useTra(s => s.invoices);

  return useMemo(() => {
    const group = groups.find(g => g.id === groupId);
    if (!group) return EMPTY;

    const flocks: Flock[] = getFlocksInGroup(groupId, true);
    if (flocks.length === 0) return EMPTY;

    const byFlock: GroupFlockRow[] = flocks.map(f => {
      const costs = calcCosts(f);
      const revenue = getFlockRevenue(f.id, invoices);
      return {
        id: f.id,
        name: f.name,
        type: f.type,
        status: f.status,
        currentCount: f.currentCount || 0,
        initialCount: f.initialCount || 0,
        ageDays: getAgeDays(f),
        cost: costs.total,
        revenue,
        profit: revenue - costs.total,
      };
    });

    const live = byFlock.filter(f => f.status === 'active');
    const totalInitial = live.reduce((s, f) => s + f.initialCount, 0);
    const totalCurrent = live.reduce((s, f) => s + f.currentCount, 0);
    const totalDeaths = Math.max(0, totalInitial - totalCurrent);
    const mortalityRate = totalInitial > 0 ? (totalDeaths / totalInitial) * 100 : 0;

    const totalCost = byFlock.reduce((s, f) => s + f.cost, 0);
    const totalRevenue = byFlock.reduce((s, f) => s + f.revenue, 0);
    const totalProfit = totalRevenue - totalCost;

    return {
      flockCount: byFlock.length,
      liveFlockCount: live.length,
      totalInitial,
      totalCurrent,
      totalDeaths,
      mortalityRate,
      totalCost,
      totalRevenue,
      totalProfit,
      byFlock,
    };
  }, [groupId, groups, invoices, getFlocksInGroup]);
}
