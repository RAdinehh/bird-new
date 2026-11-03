/**
 * formulas.ts — تنها منبع حقیقت برای محاسبات business tra
 * ═════════════════════════════════════════════════════════════
 * هرجا محاسبه‌ای لازم شد، از اینجا بگیر.
 * duplicate logic = باگ آینده.
 * ═════════════════════════════════════════════════════════════
 */
import { remaining, paidSumAllocated, computeCashDiscount, agingBucket, type AgingBucket } from './calc';
import { daysUntilDue } from './helpers';
import type { Invoice } from './types';

/**
 * اعتبار طرف‌حساب — SINGLE SOURCE OF TRUTH
 * مثبت = پیش‌پرداخت (customer paid extra)
 * منفی = بدهی به ما
 *
 * این تابع، فرمول canonical هست که computePartyCredit هم ازش استفاده می‌کنه.
 */
export function partyBalance(
  partyId: string,
  invoices: Invoice[],
  allocations?: any[]
): number {
  if (!partyId) return 0;
  return invoices
    .filter(inv => inv.partyId === partyId)
    .reduce((acc, inv) => {
      const total = inv.total || 0;
      const paid = paidSumAllocated(inv, allocations);
      const writtenOff = inv.writtenOffAmount || 0;
      const cashDiscount = computeCashDiscount(inv);
      return acc + ((paid + writtenOff) - (total - cashDiscount));
    }, 0);
}

/**
 * Aging bucket از dueDate — SINGLE SOURCE OF TRUTH
 * استاندارد Accounting (FASB): aging of receivables از dueDate، نه invoice date
 */
export function agingBucketFromDue(inv: Invoice): AgingBucket {
  return agingBucket(overdueDays(inv));
}

/** آیا فاکتور overdue است؟ */
export function isOverdue(inv: Invoice): boolean {
  const d = daysUntilDue(inv);
  return d !== null && d < 0;
}

/** روزهای overdue (positive) — ۰ اگه هنوز سرسید نرسیده */
export function overdueDays(inv: Invoice): number {
  const d = daysUntilDue(inv);
  return d !== null && d < 0 ? -d : 0;
}
