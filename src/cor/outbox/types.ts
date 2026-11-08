/**
 * types.ts — Outbox Pattern types
 *
 * الگوی استاندارد SAP/Odoo: رویدادها در صف ذخیره می‌شوند،
 * processor آن‌ها را پردازش می‌کند (local الان، server آینده).
 *
 * مزیت‌ها:
 * - رویداد گم نمی‌شود (حتی اگر subscriber fail کند)
 * - Retry خودکار
 * - آماده server sync (آینده)
 */

/**
 * وضعیت رویداد در صف
 */
export type OutboxStatus = 'pending' | 'processing' | 'done' | 'failed';

/**
 * یک رویداد در صف
 */
export interface OutboxEvent {
  /** شناسه یکتا */
  id: string;
  /** نوع رویداد (مثل 'dlg:log:saved') */
  type: string;
  /** داده رویداد */
  payload: Record<string, unknown>;
  /** وضعیت */
  status: OutboxStatus;
  /** تعداد تلاش‌های انجام‌شده */
  attempts: number;
  /** حداکثر تلاش */
  maxAttempts: number;
  /** آخرین خطا (اگر failed) */
  lastError?: string;
  /** زمان ایجاد */
  createdAt: string;
  /** زمان آخرین تلاش */
  lastAttemptAt?: string;
  /** شناسه تراکنش مرتبط (اگر در atomic بود) */
  txid?: string;
}

/**
 * Processor — تابعی که یک رویداد را پردازش می‌کند
 * اگر throw کند → retry (تا maxAttempts)
 */
export type OutboxProcessor = (event: OutboxEvent) => Promise<void>;

/**
 * گزینه‌های publish
 */
export interface PublishOptions {
  /** حداکثر تلاش (پیش‌فرض: ۳) */
  maxAttempts?: number;
  /** شناسه تراکنش (اختیاری — برای tracing) */
  txid?: string;
}
