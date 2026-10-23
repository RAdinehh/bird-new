/**
 * formulas.ts — تنها منبع حقیقت برای محاسبات business tra
 * ═════════════════════════════════════════════════════════════
 * هرجا محاسبه‌ای لازم شد، از اینجا بگیر.
 * duplicate logic = باگ آینده.
 * ═════════════════════════════════════════════════════════════
 */
import { remaining, paidSumAllocated, computeCashDiscount } from './calc';
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
      const cashDiscount = computeCashDiscount(inv);
      return acc + (paid - (total - cashDiscount));
    }, 0);
}

/**
 * Aging bucket از dueDate — SINGLE SOURCE OF TRUTH
 * استاندارد Accounting (FASB): aging of receivables از dueDate، نه invoice date
 */
export function agingBucketFromDue(
  inv: Invoice
): '0-15' | '16-30' | '31-60' | '61-90' | '+90' {
  const days = overdueDays(inv);
  if (days <= 15) return '0-15';
  if (days <= 30) return '16-30';
  if (days <= 60) return '31-60';
  if (days <= 90) return '61-90';
  return '+90';
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
