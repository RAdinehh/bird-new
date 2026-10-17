import { bus } from '../../cor/events';
import { useWhs } from './store';
import type { TraInvoiceItemRef } from '../../cor/events/events';

/**
 * applyInvoiceMovements — اثر فاکتور روی انبار
 * movementId روی رفرنس items ست می‌شود (mutable ref).
 */
function applyInvoiceMovements(
  invoice: any,
  items: TraInvoiceItemRef[],
  prevItems?: TraInvoiceItemRef[],
): void {
  const whs = useWhs.getState();

  if (prevItems) {
    prevItems.forEach(it => {
      if (it.movementId) {
        try { whs.deleteMovement(it.movementId); } catch (e) {}
      }
    });
  }

  items.forEach(it => {
    if (!it.itemId || !it.quantity || it.quantity <= 0) {
      it.movementId = '';
      return;
    }
    try {
      const mid = whs.addMovement({
        itemId: it.itemId,
        type: invoice.type === 'purchase' ? 'in' : 'out',
        quantity: it.quantity,
        unitPrice: it.unitPrice || 0,
        reason: invoice.type === 'purchase' ? 'purchase' : 'sale',
        date: invoice.date,
        partyId: invoice.partyId || '',
        notes: `فاکتور ${invoice.number || ''} — ${it.description || ''}`,
      });
      it.movementId = mid;
    } catch (e) {
      it.movementId = '';
      try { console.error('[whs] addMovement failed:', e); } catch {}
    }
  });
}

function deleteInvoiceMovements(items: TraInvoiceItemRef[]): void {
  const whs = useWhs.getState();
  items.forEach(it => {
    if (it.movementId) {
      try { whs.deleteMovement(it.movementId); } catch (e) {}
    }
  });
}

export function registerWhsHandlers(): () => void {
  const off1 = bus.on('tra:invoice:created', (data, meta) => {
    try {
      if (!data.items || data.items.length === 0) return;
      applyInvoiceMovements(data.invoice, data.items);
      if (meta.traceId) {
        try { console.debug('[whs] invoice:created', meta.traceId); } catch {}
      }
    } catch (e) {
      try { console.error('[whs] created handler failed:', e); } catch {}
    }
  });

  const off2 = bus.on('tra:invoice:updated', (data, meta) => {
    try {
      if (!data.items) return;
      applyInvoiceMovements(data.invoice, data.items, data.prevItems);
      if (meta.traceId) {
        try { console.debug('[whs] invoice:updated', meta.traceId); } catch {}
      }
    } catch (e) {
      try { console.error('[whs] updated handler failed:', e); } catch {}
    }
  });

  const off3 = bus.on('tra:invoice:deleted', (data, meta) => {
    try {
      if (!data.items) return;
      deleteInvoiceMovements(data.items);
      if (meta.traceId) {
        try { console.debug('[whs] invoice:deleted', meta.traceId); } catch {}
      }
    } catch (e) {
      try { console.error('[whs] deleted handler failed:', e); } catch {}
    }
  });

  return () => { off1(); off2(); off3(); };
}
