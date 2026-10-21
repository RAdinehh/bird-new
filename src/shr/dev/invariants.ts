/**
 * invariants.ts — Dev-only sanity checks (silent in production)
 * هر بار بعد از save/delete اجرا می‌شه، اگه ناسازگاری پیدا شد console.error می‌ده.
 */
import { useTra } from '../../mod/tra/store';
import { useWhs } from '../../mod/whs/store';
import { useFlk } from '../../mod/flk/store';
import { useHal } from '../../mod/hal/store';
import { useInc } from '../../mod/inc/store';

export function verifyInvariants(): string[] {
  const issues: string[] = [];
  const invoices = useTra.getState().invoices;
  const whs = useWhs.getState();
  const flk = useFlk.getState();
  const hal = useHal.getState();
  const inc = useInc.getState();

  // ۱. whs: sum(in) - sum(out) per itemId ≈ currentStock
  const movementsByItem = new Map<string, number>();
  for (const m of whs.movements) {
    const cur = movementsByItem.get(m.itemId) || 0;
    if (m.type === 'in') movementsByItem.set(m.itemId, cur + m.quantity);
    else if (m.type === 'out') movementsByItem.set(m.itemId, cur - m.quantity);
    else if (m.type === 'adjust') movementsByItem.set(m.itemId, m.quantity);
  }
  for (const item of whs.items) {
    const computed = movementsByItem.get(item.id) || 0;
    const actual = item.currentStock || 0;
    if (Math.abs(computed - actual) > 0.5) {
      issues.push(`whs: "${item.name}" computed=${computed} actual=${actual}`);
    }
  }

  // ۲. flk: sourceInvoiceId باید اشاره به فاکتور موجود کنه
  const invoiceIds = new Set(invoices.map(i => i.id));
  for (const f of flk.flocks) {
    if (f.sourceInvoiceId && !invoiceIds.has(f.sourceInvoiceId)) {
      issues.push(`flk: "${f.name}" references missing invoice`);
    }
  }

  // ۳. hal: همون
  for (const e of hal.equipment) {
    if (e.sourceInvoiceId && !invoiceIds.has(e.sourceInvoiceId)) {
      issues.push(`hal: "${e.name}" references missing invoice`);
    }
  }

  // ۴. inc: همون
  for (const e of inc.eggEntries) {
    if (e.sourceInvoiceId && !invoiceIds.has(e.sourceInvoiceId)) {
      issues.push(`inc: eggEntry references missing invoice`);
    }
  }

  // ۵. tra: payments غیرمنفی (به‌جز refund)
  for (const inv of invoices) {
    for (const p of inv.payments || []) {
      if ((p.amount || 0) < 0 && p.type !== 'refund') {
        issues.push(`tra: invoice ${inv.number || inv.id} has negative payment`);
      }
    }
  }

  if (issues.length > 0) {
    console.error('🚨 Invariants failed:', issues);
  }
  return issues;
}

export function verifyInvariantsIfDev(): void {
  try {
    if ((import.meta as any)?.env?.DEV) {
      verifyInvariants();
    }
  } catch {}
}
