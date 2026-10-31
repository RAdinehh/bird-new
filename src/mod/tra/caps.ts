/**
 * tra/caps.ts — سقف (Cap) برای فیلدهای معامله
 * استاندارد: SAP ATP (Available to Promise), Odoo Free Qty
 *
 * تصمیمات این جلسه:
 * ۱. source change → quantity reset (UI layer)
 * ۲. سقف بین معاملات (ATP)
 * ۳. sale بدون delivery = block
 * ۴. pcs باید integer باشد
 */
import type { Deal, DealGood, DealDelivery, DealSale, DealPayment } from './types';

/**
 * آیا دو Good از یک منبع میان؟
 * دو Good از یک منبع اگر: source, category, flockId, hatchId, stockItemId یکسان باشد
 */
function sameSource(a: DealGood, b: DealGood): boolean {
  if ((a.source || 'flock') !== (b.source || 'flock')) return false;
  if (a.category !== b.category) return false;
  if (a.existingFlockId !== b.existingFlockId) return false;
  if (a.hatchId !== b.hatchId) return false;
  if (a.stockItemId !== b.stockItemId) return false;
  return true;
}

/**
 * تحویل خالص برای یک good (out - return - loss)
 */
function netDeliveredForGood(good: DealGood, deliveries: DealDelivery[]): number {
  const dvs = deliveries.filter(d => d.goodId === good.id);
  const out = dvs.filter(d => d.type === 'out').reduce((s, d) => s + (d.quantity || 0), 0);
  const ret = dvs.filter(d => d.type === 'return').reduce((s, d) => s + (d.quantity || 0), 0);
  const loss = dvs.filter(d => d.type === 'loss').reduce((s, d) => s + (d.quantity || 0), 0);
  return out - ret - loss;
}

/**
 * سقف Goods — ATP (Available to Promise)
 * = sourceAvailable − Σ(سایر deals' remaining allocations)
 *
 * منطق:
 *  - deals canceled نباید حساب بشن
 *  - deals settled که تحویل کامل دارن: allocation = 0 (خودشون توی currentCount اعمال شدن)
 *  - deals settled با تحویل جزئی: allocation = باقیمانده (هنوز توی currentCount اعمال نشدن)
 *  - deals open: allocation = goods.quantity − delivered
 */
export function computeGoodsCap(
  good: DealGood,
  currentDealId: string,
  allDeals: Deal[],
  sourceAvailable: number
): number {
  let otherAllocations = 0;
  for (const deal of allDeals) {
    if (deal.id === currentDealId) continue;
    if (deal.status === 'cancelled') continue;
    for (const g of deal.goods || []) {
      if (!sameSource(g, good)) continue;
      const delivered = netDeliveredForGood(g, deal.deliveries || []);
      otherAllocations += Math.max(0, (g.quantity || 0) - delivered);
    }
  }
  return Math.max(0, sourceAvailable - otherAllocations);
}

/**
 * سقف تحویل — Free Qty
 * = goods.quantity − netDelivered
 */
export function computeDeliveryCap(good: DealGood, deliveries: DealDelivery[]): number {
  const netDelivered = netDeliveredForGood(good, deliveries);
  return Math.max(0, (good.quantity || 0) - netDelivered);
}

/**
 * سقف فروش — Delivered Qty
 * = netDelivered − Σ(previous sales)
 *
 * تصمیم ۴: sale > delivered = 0 (block در UI)
 */
export function computeSaleCap(
  goodId: string,
  deliveries: DealDelivery[],
  sales: DealSale[]
): number {
  const dvs = deliveries.filter(d => d.goodId === goodId);
  const out = dvs.filter(d => d.type === 'out').reduce((s, d) => s + (d.quantity || 0), 0);
  const ret = dvs.filter(d => d.type === 'return').reduce((s, d) => s + (d.quantity || 0), 0);
  const loss = dvs.filter(d => d.type === 'loss').reduce((s, d) => s + (d.quantity || 0), 0);
  const netDelivered = out - ret - loss;

  const totalSold = sales
    .filter(s => s.goodId === goodId)
    .reduce((s, x) => s + (x.quantity || 0), 0);

  return Math.max(0, netDelivered - totalSold);
}

/**
 * سقف پرداخت — Remaining Amount
 * = myShare − Σ(payments in) + Σ(refunds)
 */
export function computePaymentCap(
  myShare: number,
  payments: DealPayment[]
): number {
  let paidIn = 0;
  let refunds = 0;
  for (const p of payments) {
    if (p.direction === 'in') paidIn += p.amount || 0;
    if ((p as { type?: string }).type === 'refund') refunds += p.amount || 0;
  }
  return Math.max(0, myShare - paidIn + refunds);
}
