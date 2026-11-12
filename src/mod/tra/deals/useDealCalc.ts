import { useMemo } from 'react';
import { calcDealCommission, getTodayJalali } from '../calc';
import type { F } from './types';
import type { Deal } from '../store';

export function useDealCalc(form: F) {
  return useMemo(() => {
    const out = form.deliveries.filter(d => d.type === 'out').reduce((s, d) => s + (Number(d.quantity) || 0), 0);
    const ret = form.deliveries.filter(d => d.type === 'return').reduce((s, d) => s + (Number(d.quantity) || 0), 0);
    const loss = form.deliveries.filter(d => d.type === 'loss').reduce((s, d) => s + (Number(d.quantity) || 0), 0);
    const totalDelivered = out - ret - loss;
    const totalSold = form.sales.reduce((s, x) => s + (Number(x.quantity) || 0), 0);
    const inHand = totalDelivered - totalSold;
    const totalSales = form.sales.reduce((s, x) => s + ((Number(x.quantity) || 0) * (Number(x.unitPrice) || 0)), 0);
    const commission = calcDealCommission(form.settlementType, Number(form.settlementValue) || 0, totalSales, totalSold, form.startDate || form.date, form.endDate || getTodayJalali());
    const myShare = totalSales - commission;
    const paidIn = form.payments.filter(p => p.direction === 'in').reduce((s, p) => s + (Number(p.amount) || 0), 0);
    const paidOut = form.payments.filter(p => p.direction === 'out').reduce((s, p) => s + (Number(p.amount) || 0), 0);
    const balance = myShare - paidIn + paidOut;
    const perGood: Record<string, { name: string; delivered: number; sold: number; inHand: number }> = {};
    for (const g of form.goods) {
      const gOut = form.deliveries.filter(d => d.goodId === g.id && d.type === 'out').reduce((s, d) => s + (Number(d.quantity) || 0), 0);
      const gRet = form.deliveries.filter(d => d.goodId === g.id && d.type === 'return').reduce((s, d) => s + (Number(d.quantity) || 0), 0);
      const gLoss = form.deliveries.filter(d => d.goodId === g.id && d.type === 'loss').reduce((s, d) => s + (Number(d.quantity) || 0), 0);
      const gSold = form.sales.filter(x => x.goodId === g.id).reduce((s, x) => s + (Number(x.quantity) || 0), 0);
      const gDelivered = gOut - gRet - gLoss;
      perGood[g.id] = { name: g.name || '—', delivered: gDelivered, sold: gSold, inHand: gDelivered - gSold };
    }
    return { totalDelivered, totalSold, inHand, totalSales, commission, myShare, paidIn, paidOut, balance, perGood };
  }, [form.deliveries, form.sales, form.payments, form.settlementType, form.settlementValue, form.goods]);
}

export function useDealStats(deals: Deal[]) {
  return useMemo(() => {
    let active = 0, settled = 0, cancelled = 0, totalBalance = 0;
    for (const d of deals) {
      if (d.status === 'cancelled') { cancelled++; continue; }
      if (d.status === 'settled') { settled++; continue; }
      active++;
      const sales = (d.sales || []).reduce((s, x) => s + ((Number(x.quantity) || 0) * (Number(x.unitPrice) || 0)), 0);
      const totalQty = (d.sales || []).reduce((s, x) => s + (Number(x.quantity) || 0), 0);
      const comm = calcDealCommission(d.settlementType, d.settlementValue, sales, totalQty, d.startDate || d.date, d.endDate || getTodayJalali());
      const myShare = sales - comm;
      const paidIn = (d.payments || []).filter(p => p.direction === 'in').reduce((s, p) => s + (Number(p.amount) || 0), 0);
      const paidOut = (d.payments || []).filter(p => p.direction === 'out').reduce((s, p) => s + (Number(p.amount) || 0), 0);
      totalBalance += myShare - paidIn + paidOut;
    }
    return { active, settled, cancelled, totalBalance };
  }, [deals]);
}
