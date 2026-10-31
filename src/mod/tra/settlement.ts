/**
 * settlement.ts — Phase E.2a
 * محاسبه‌ی سند تسویه از یک Deal در بازه‌ی زمانی مشخص
 * طبق الگوی SAP MRKO: snapshot از داده‌های دوره
 */
import type { Deal, Settlement, DealDelivery, DealSale, DealPayment, Invoice, InvoiceItem, Payment } from './types';
import { useFlk } from '../flk/store';

function inPeriod(date: string, start: string, end: string): boolean {
  if (!date) return false;
  // مقایسه رشته‌ای — فرض: همه‌ی تاریخ‌ها با فرمت یکسان (yyyy/MM/dd)
  return date >= start && date <= end;
}

function monthsBetween(start: string, end: string): number {
  if (!start || !end) return 1;
  try {
    const norm = (s: string) => s.replace(/[۰-۹]/g, d => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)));
    const s = new Date(norm(start).replace(/\//g, '-'));
    const e = new Date(norm(end).replace(/\//g, '-'));
    if (isNaN(s.getTime()) || isNaN(e.getTime())) return 1;
    const months = (e.getFullYear() - s.getFullYear()) * 12 + (e.getMonth() - s.getMonth());
    return Math.max(1, months);
  } catch { return 1; }
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
  if (deal.settlementType === 'percent') {
    commission = Math.round(grossSales * settlementValue / 100);
  } else if (deal.settlementType === 'per_unit') {
    commission = Math.round(totalQty * settlementValue);
  } else if (deal.settlementType === 'fixed') {
    commission = Math.round(settlementValue);
  } else if (deal.settlementType === 'rental') {
    const months = monthsBetween(periodStart, periodEnd);
    commission = Math.round(settlementValue * months);
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


export function createInvoiceFromSettlement(
  deal: Deal,
  settlement: Settlement
): Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'> {
  const flkState = useFlk.getState();
  const items: InvoiceItem[] = settlement.salesSnapshot.map((s) => {
    const good = (deal.goods || []).find(g => g.id === s.goodId);
    const qty = Number(s.quantity) || 0;
    const price = Number(s.unitPrice) || 0;
    // 🆕 استخراج فیلدهای گله (chick/adult)
    const flock = good?.existingFlockId
      ? flkState.flocks.find(f => f.id === good.existingFlockId)
      : null;
    const cat = good?.category;
    return {
      id: s.id,
      description: good?.name || 'کالا',
      unit: good?.unit || 'pcs',
      quantity: qty,
      unitPrice: price,
      total: qty * price,
      category: cat,
      // 🆕 پرندگان — از گله
      birdId: flock?.birdId || '',
      breedId: flock?.breedId || '',
      flockId: good?.existingFlockId || '',
      flockName: flock?.name || '',
      // 🆕 توزیع تعداد — همه نامشخص (کاربر بعداً ویرایش می‌کنه)
      unknownCount: (cat === 'chick' || cat === 'adult') ? qty : null,
    };
  });
  
  const payments: Payment[] = settlement.paidAmount > 0
    ? [{
        id: 'inv-pay-' + settlement.id,
        date: settlement.periodEnd,
        amount: settlement.paidAmount,
        method: 'cash',
        checkNo: '',
        bank: '',
        dueDate: '',
        notes: 'از تسویه دوره‌ای',
        type: 'settlement',
      }]
    : [];
  
  // 🆕 اگر کمیسیون وجود دارد، به عنوان یک آیتم منفی اضافه می‌کنیم
  if (settlement.commission > 0) {
    items.push({
      id: 'comm-' + settlement.id,
      description: 'کمیسیون تسویه دوره‌ای',
      unit: 'service',
      quantity: 1,
      unitPrice: -settlement.commission,
      total: -settlement.commission,
    });
  }

  // 🆕 محاسبه category از items (نه hardcode)
  const itemCats = items.map(it => it.category).filter(Boolean) as string[];
  const uniqueCats = [...new Set(itemCats)];
  const primaryCategory = uniqueCats.length === 1 ? uniqueCats[0] : 'other';

  return {
    type: 'sale',
    date: settlement.periodEnd,
    partyId: deal.partyId || '',
    category: primaryCategory,
    items,
    discount: 0,
    shipping: 0,
    total: settlement.netPayable,
    payments,
    dueDate: settlement.periodEnd,
    relatedFlockId: '',
    relatedEntryId: '',
    relatedDealId: deal.id,
    relatedSettlementId: settlement.id,
    sourceType: 'settlement',
    notes: 'تسویه دوره‌ای ' + settlement.periodStart + ' تا ' + settlement.periodEnd + ' — کمیسیون: ' + settlement.commission + ' ت',
    workflowStatus: 'draft',
  };
}
