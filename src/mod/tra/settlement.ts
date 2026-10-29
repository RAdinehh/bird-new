/**
 * settlement.ts — Phase E.2a
 * محاسبه‌ی سند تسویه از یک Deal در بازه‌ی زمانی مشخص
 * طبق الگوی SAP MRKO: snapshot از داده‌های دوره
 */
import type { Deal, Settlement, DealDelivery, DealSale, DealPayment } from './types';

function inPeriod(date: string, start: string, end: string): boolean {
  if (!date) return false;
  // مقایسه رشته‌ای — فرض: همه‌ی تاریخ‌ها با فرمت یکسان (yyyy/MM/dd)
  return date >= start && date <= end;
}

export function computeSettlement(
  deal: Deal,
  periodStart: string,
  periodEnd: string
): Omit<Settlement, 'id' | 'createdAt' | 'updatedAt'> | null {
  if (!periodStart || !periodEnd) return null;
  if (periodEnd < periodStart) return null;

  const deliveries = (deal.deliveries || []).filter(d => inPeriod(d.date, periodStart, periodEnd));
  const sales = (deal.sales || []).filter(s => inPeriod(s.date, periodStart, periodEnd));
  const payments = (deal.payments || []).filter(p => inPeriod(p.date, periodStart, periodEnd));

  if (deliveries.length === 0 && sales.length === 0 && payments.length === 0) {
    return null;
  }

  const grossSales = sales.reduce((sum, s) =>
    sum + (Number(s.quantity) || 0) * (Number(s.unitPrice) || 0), 0
  );

  const settlementValue = Number(deal.settlementValue) || 0;
  const totalQty = sales.reduce((s, x) => s + (Number(x.quantity) || 0), 0);
  let commission = 0;
  if (deal.settlementType === 'commission_pct' || deal.settlementType === 'profit_sharing') {
    commission = Math.round(grossSales * settlementValue / 100);
  } else if (deal.settlementType === 'commission_per_unit') {
    commission = Math.round(totalQty * settlementValue);
  } else if (deal.settlementType === 'fixed_amount') {
    commission = Math.round(settlementValue);
  }

  const netPayable = grossSales - commission;
  const paidAmount = payments
    .filter(p => p.direction === 'in')
    .reduce((s, p) => s + (Number(p.amount) || 0), 0);

  return {
    dealId: deal.id,
    periodStart,
    periodEnd,
    deliveriesSnapshot: deliveries,
    salesSnapshot: sales,
    paymentsSnapshot: payments,
    grossSales,
    commission,
    netPayable,
    paidAmount,
    status: 'draft',
  };
}
