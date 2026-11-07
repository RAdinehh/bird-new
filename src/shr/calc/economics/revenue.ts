/**
 * economics/revenue.ts — درآمد
 *
 * دو منبع:
 *   - invoices: فاکتورهای فروش واقعی (دقیق)
 *   - prices: تخمین از قیمت بازار
 */
import type {
  InputInvoice,
  RevenueFromInvoicesParams,
  RevenueFromPricesParams,
  RevenueResult,
} from '../types';

export function calculateRevenueFromInvoices(
  params: RevenueFromInvoicesParams,
  aliveCount: number,
): RevenueResult {
  const { invoices, flockId, includeDraft = false } = params;

  let totalRevenue = 0;
  let count = 0;

  for (const inv of invoices) {
    if (inv.type !== 'sale') continue;
    if (inv.relatedFlockId !== flockId) continue;
    if (!includeDraft && inv.workflowStatus === 'draft') continue;
    totalRevenue += inv.total;
    count++;
  }

  const revenuePerBird =
    aliveCount > 0 ? Math.round((totalRevenue / aliveCount) * 100) / 100 : 0;

  return {
    totalRevenue: Math.round(totalRevenue * 100) / 100,
    revenuePerBird,
    source: count > 0 ? 'invoices' : 'none',
    count,
    hasData: count > 0,
  };
}

export function calculateRevenueFromPrices(
  params: RevenueFromPricesParams,
  aliveCount: number,
): RevenueResult {
  const {
    liveWeightKg = 0,
    pricePerKg = 0,
    eggsCount = 0,
    pricePerEgg = 0,
    culledCount = 0,
    culledPrice = 0,
  } = params;

  const meatRevenue = liveWeightKg * pricePerKg;
  const eggRevenue = eggsCount * pricePerEgg;
  const culledRevenue = culledCount * culledPrice;
  const totalRevenue = meatRevenue + eggRevenue + culledRevenue;

  const revenuePerBird =
    aliveCount > 0 ? Math.round((totalRevenue / aliveCount) * 100) / 100 : 0;

  return {
    totalRevenue: Math.round(totalRevenue * 100) / 100,
    revenuePerBird,
    source: totalRevenue > 0 ? 'prices' : 'none',
    count: 0,
    hasData: totalRevenue > 0,
  };
}

/**
 * Hybrid: اگر فاکتورها داده شدند، از آن‌ها استفاده کن؛ در غیر این صورت از prices.
 */
export function calculateRevenue(
  invoiceParams: RevenueFromInvoicesParams | null,
  priceParams: RevenueFromPricesParams | null,
  aliveCount: number,
): RevenueResult {
  if (invoiceParams) {
    const fromInv = calculateRevenueFromInvoices(invoiceParams, aliveCount);
    if (fromInv.hasData) return fromInv;
  }
  if (priceParams) {
    return calculateRevenueFromPrices(priceParams, aliveCount);
  }
  return {
    totalRevenue: 0,
    revenuePerBird: 0,
    source: 'none',
    count: 0,
    hasData: false,
  };
}
