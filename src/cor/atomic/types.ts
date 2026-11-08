/**
 * types.ts — typeهای Atomic Transaction
 *
 * الگوی «همه یا هیچ» برای ذخیره‌سازی چند-مرحله‌ای.
 * استاندارد SAP/Odoo: پیش‌گیری از data inconsistency در cascade.
 */

/**
 * Store قابل snapshot
 * هر store باید ۲ تابع provide کند: snapshot (خواندن) و restore (بازگردانی)
 */
export interface AtomicStore<T = any> {
  /** نام store (برای logging) */
  name: string;
  /** گرفتن snapshot (shallow — reference در Zustand امن است) */
  getSnapshot: () => T;
  /** بازگردانی snapshot (با setState) */
  restore: (snap: T) => void;
}

/**
 * گزینه‌های atomicTransaction
 */
export interface AtomicOptions<T> {
  /** Phase 1 — پیش از هر mutation (اختیاری) */
  preflight?: () => void | Promise<void>;

  /** کدام storeها snapshot شوند */
  stores: AtomicStore[];

  /** Phase 3 — اجرای cascade (اگر throw کند → rollback) */
  execute: () => T | Promise<T>;

  /** Phase 4 — بعد از موفقیت ۱۰۰٪ (اختیاری) */
  onSuccess?: (result: T) => void;

  /** Phase 5 — بعد از rollback (اختیاری) */
  onError?: (err: Error) => void;
}

/**
 * نتیجه atomicTransaction
 */
export interface AtomicResult<T> {
  /** آیا موفق بود؟ */
  ok: boolean;
  /** نتیجه execute (اگر موفق) */
  result?: T;
  /** خطا (اگر fail) */
  error?: Error;
  /** شناسه تراکنش — برای tracing و idempotency آینده */
  txid: string;
}
