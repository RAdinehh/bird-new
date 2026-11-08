/**
 * transaction.ts — atomicTransaction
 *
 * الگوی Pre-flight → Snapshot → Execute → Rollback/Commit
 *
 * @example
 * const result = await atomicTransaction({
 *   preflight: () => checkStock(form),
 *   stores: [dlgStore, whsStore, eggStore, flkStore],
 *   execute: () => { executeCascade(); return logId; },
 *   onSuccess: (logId) => bus.emit('dlg:log:saved', { logId }),
 *   onError: (err) => toast.error(err.message),
 * });
 */
import { v4 as uuid } from 'uuid';
import type { AtomicOptions, AtomicOptionsSync, AtomicResult } from './types';

export async function atomicTransaction<T>(
  opts: AtomicOptions<T>,
): Promise<AtomicResult<T>> {
  const txid = uuid();

  // ═══ Phase 1: Pre-flight (بدون mutation)
  if (opts.preflight) {
    try {
      await opts.preflight();
    } catch (err) {
      const e = err instanceof Error ? err : new Error(String(err));
      console.error(`[atomic:${txid}] preflight failed:`, e);
      // onError صدا زده می‌شود چون pre-flight هم fail است
      try {
        opts.onError?.(e);
      } catch (handlerErr) {
        console.error(`[atomic:${txid}] onError failed:`, handlerErr);
      }
      return { ok: false, error: e, txid };
    }
  }

  // ═══ Phase 2: Snapshot (reference — safe with Zustand)
  const snapshots = new Map<string, any>();
  for (const store of opts.stores) {
    try {
      snapshots.set(store.name, store.getSnapshot());
    } catch (err) {
      console.error(`[atomic:${txid}] snapshot failed for ${store.name}:`, err);
      // اگر snapshot fail شود، هیچ mutation انجام نشده — return خطا
      const e = err instanceof Error ? err : new Error(String(err));
      try {
        opts.onError?.(e);
      } catch (handlerErr) {
        console.error(`[atomic:${txid}] onError failed:`, handlerErr);
      }
      return { ok: false, error: e, txid };
    }
  }

  // ═══ Phase 3: Execute
  try {
    const result = await opts.execute();

    // ═══ Phase 4: Commit (success)
    if (opts.onSuccess) {
      try {
        opts.onSuccess(result);
      } catch (handlerErr) {
        // onSuccess fail نباید rollback کند — داده ذخیره شده
        console.error(`[atomic:${txid}] onSuccess failed:`, handlerErr);
      }
    }

    return { ok: true, result, txid };
  } catch (err) {
    const e = err instanceof Error ? err : new Error(String(err));
    console.error(`[atomic:${txid}] execute failed, rolling back:`, e);

    // ═══ Phase 5: Rollback
    for (const store of opts.stores) {
      try {
        store.restore(snapshots.get(store.name));
      } catch (restoreErr) {
        // Rollback fail خطرناک است — log می‌کنیم
        console.error(`[atomic:${txid}] restore failed for ${store.name}:`, restoreErr);
      }
    }

    try {
      opts.onError?.(e);
    } catch (handlerErr) {
      console.error(`[atomic:${txid}] onError failed:`, handlerErr);
    }

    return { ok: false, error: e, txid };
  }
}


// ═══════════════════════════════════════════════════════════
// atomicTransactionSync — برای سناریوهای sync-only
// ═══════════════════════════════════════════════════════════

/**
 * atomicTransactionSync — نسخه sync از atomicTransaction
 *
 * استفاده: وقتی همه cascadeها sync هستند (Zustand set)
 * مثل: deleteInvoice (۱۵ cascade sync)
 *
 * preflight و execute sync هستند — اگر throw کنند، rollback sync.
 */
export function atomicTransactionSync<T>(
  opts: AtomicOptionsSync<T>,
): AtomicResult<T> {
  const txid = uuid();

  // ═══ Phase 1: Pre-flight
  if (opts.preflight) {
    try {
      opts.preflight();
    } catch (err) {
      const e = err instanceof Error ? err : new Error(String(err));
      console.error(`[atomicSync:${txid}] preflight failed:`, e);
      try {
        opts.onError?.(e);
      } catch (handlerErr) {
        console.error(`[atomicSync:${txid}] onError failed:`, handlerErr);
      }
      return { ok: false, error: e, txid };
    }
  }

  // ═══ Phase 2: Snapshot
  const snapshots = new Map<string, any>();
  for (const store of opts.stores) {
    try {
      snapshots.set(store.name, store.getSnapshot());
    } catch (err) {
      const e = err instanceof Error ? err : new Error(String(err));
      console.error(`[atomicSync:${txid}] snapshot failed for ${store.name}:`, e);
      try {
        opts.onError?.(e);
      } catch (handlerErr) {
        console.error(`[atomicSync:${txid}] onError failed:`, handlerErr);
      }
      return { ok: false, error: e, txid };
    }
  }

  // ═══ Phase 3: Execute
  try {
    const result = opts.execute();

    // ═══ Phase 4: Commit
    if (opts.onSuccess) {
      try {
        opts.onSuccess(result);
      } catch (handlerErr) {
        console.error(`[atomicSync:${txid}] onSuccess failed:`, handlerErr);
      }
    }

    return { ok: true, result, txid };
  } catch (err) {
    const e = err instanceof Error ? err : new Error(String(err));
    console.error(`[atomicSync:${txid}] execute failed, rolling back:`, e);

    // ═══ Phase 5: Rollback
    for (const store of opts.stores) {
      try {
        store.restore(snapshots.get(store.name));
      } catch (restoreErr) {
        console.error(`[atomicSync:${txid}] restore failed for ${store.name}:`, restoreErr);
      }
    }

    try {
      opts.onError?.(e);
    } catch (handlerErr) {
      console.error(`[atomicSync:${txid}] onError failed:`, handlerErr);
    }

    return { ok: false, error: e, txid };
  }
}
