import type { Invoice } from './types';

export interface InvoiceSplitResult {
  toArchive: Invoice[];
  keep: Invoice[];
  skipped: Invoice[];
}

export interface InvoiceArchiveOptions {
  cutoffIso?: string;
  requireSettled?: boolean;
}

function isInvoiceSettled(inv: Invoice): boolean {
  return Boolean(inv.paidAt) || inv.workflowStatus === 'paid';
}

function hasOpenDisputeOrPendingCheck(inv: Invoice): boolean {
  if (inv.disputeStatus === 'open') return true;
  const payments = inv.payments || [];
  return payments.some(
    p => p.method === 'check' && (p.status === 'in_transit' || p.status === 'bounced')
  );
}

/**
 * تفکیک خالص فاکتورها پیش از انتقال به مخزن tra_invoices بر اساس قفل تسویه،
 * نبود اختلاف باز / چک در جریان یا برگشتی، و مرز دوره مالی (cutoffIso).
 */
export function splitInvoicesForArchive(
  invoices: Invoice[],
  opts: InvoiceArchiveOptions = {}
): InvoiceSplitResult {
  const toArchive: Invoice[] = [];
  const keep: Invoice[] = [];
  const skipped: Invoice[] = [];
  const requireSettled = opts.requireSettled ?? true;

  for (const inv of invoices) {
    if (!inv || !inv.id || !inv.type) {
      skipped.push(inv);
      continue;
    }
    if (requireSettled && !isInvoiceSettled(inv)) {
      keep.push(inv);
      continue;
    }
    if (hasOpenDisputeOrPendingCheck(inv)) {
      keep.push(inv);
      continue;
    }
    if (opts.cutoffIso) {
      const marker = inv.paidAt || inv.date || inv.createdAt || '';
      if (!marker || marker > opts.cutoffIso) {
        keep.push(inv);
        continue;
      }
    }
    toArchive.push(inv);
  }

  return { toArchive, keep, skipped };
}
