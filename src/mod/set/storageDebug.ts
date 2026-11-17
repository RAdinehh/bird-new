/**
 * خواندن آمار واقعی ذخیره‌سازی — فقط-خواندنی.
 * هیچ نوشتن/حذف/مهاجرت انجام نمی‌دهد.
 * موقت: بعد از اندازه‌گیری حذف می‌شود.
 */

export type KeySize = { key: string; bytes: number };

export type StorageStats = {
  ok: boolean;
  error?: string;
  dbBytes: number;
  keys: KeySize[];
  dlgBytes: number;
  logCount: number;
  avgBytes: number;
  byYear: Record<string, number>;
  byStatus: Record<string, number>;
  withCorrections: number;
  withDeaths: number;
  withEvents: number;
  totalEvents: number;
  usageMB: number;
  quotaMB: number;
  percent: number;
};

/** حجم واقعی یک مقدار، بر حسب بایت UTF-8 */
function byteSize(v: unknown): number {
  if (v == null) return 0;
  const s = typeof v === 'string' ? v : JSON.stringify(v);
  return new Blob([s]).size;
}

/** یک درخواست تنها روی object store «zustand» */
function req<T>(db: IDBDatabase, op: 'get' | 'getAllKeys', arg?: IDBValidKey): Promise<T> {
  return new Promise((res, rej) => {
    const tx = db.transaction('zustand', 'readonly');
    const store = tx.objectStore('zustand');
    const r = op === 'get' ? store.get(arg as IDBValidKey) : store.getAllKeys();
    r.onsuccess = () => res(r.result as T);
    r.onerror = () => rej(r.error ?? new Error('IDB request failed'));
  });
}

/** باز کردن دیتابیس — بدون ساختن دیتابیس جدید */
async function openExisting(): Promise<IDBDatabase> {
  const list = (await indexedDB.databases?.()) ?? [];
  if (!list.some((d) => d.name === 'pm-state')) {
    throw new Error('دیتابیس pm-state وجود ندارد — شاید مهاجرت به IDB هنوز انجام نشده');
  }
  return new Promise((res, rej) => {
    const r = indexedDB.open('pm-state');
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error ?? new Error('باز کردن دیتابیس ناموفق'));
  });
}

export async function readStorageStats(): Promise<StorageStats> {
  const base: StorageStats = {
    ok: false, dbBytes: 0, keys: [], dlgBytes: 0, logCount: 0, avgBytes: 0,
    byYear: {}, byStatus: {}, withCorrections: 0, withDeaths: 0,
    withEvents: 0, totalEvents: 0, usageMB: 0, quotaMB: 0, percent: 0,
  };

  let db: IDBDatabase;
  try {
    db = await openExisting();
  } catch (e) {
    return { ...base, error: e instanceof Error ? e.message : String(e) };
  }

  try {
    const allKeys = await req<IDBValidKey[]>(db, 'getAllKeys');
    const keys: KeySize[] = [];
    let dbBytes = 0;

    for (const k of allKeys) {
      const v = await req<unknown>(db, 'get', k);
      const b = byteSize(v);
      keys.push({ key: String(k), bytes: b });
      dbBytes += b;
    }
    keys.sort((a, b) => b.bytes - a.bytes);

    const raw = await req<unknown>(db, 'get', 'pm-dlg');
    const dlgBytes = byteSize(raw);

    let logs: any[] = [];
    try {
      const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
      logs = Array.isArray(parsed?.state?.logs) ? parsed.state.logs : [];
    } catch {
      logs = [];
    }

    const byYear: Record<string, number> = {};
    const byStatus: Record<string, number> = {};
    let withCorrections = 0, withDeaths = 0, withEvents = 0, totalEvents = 0;

    for (const l of logs) {
      const y = String(l?.date ?? '?').slice(0, 4) || '?';
      byYear[y] = (byYear[y] ?? 0) + 1;

      const s = l?.status ?? 'active';
      byStatus[s] = (byStatus[s] ?? 0) + 1;

      if (Array.isArray(l?.corrections) && l.corrections.length > 0) withCorrections++;
      const deathsCount = Number(l?.deathsCount ?? 0);
      const deathsArr = Array.isArray(l?.deaths) ? l.deaths : [];
      if (deathsCount > 0 || deathsArr.some((d: any) => Number(d?.count ?? 0) > 0)) withDeaths++;
      if (Array.isArray(l?.events) && l.events.length > 0) {
        withEvents++;
        totalEvents += l.events.length;
      }
    }

    let usageMB = 0, quotaMB = 0, percent = 0;
    try {
      const est = await navigator.storage?.estimate?.();
      if (est && est.quota) {
        usageMB = (est.usage ?? 0) / 1048576;
        quotaMB = est.quota / 1048576;
        percent = ((est.usage ?? 0) / est.quota) * 100;
      }
    } catch {
      /* estimate در دسترس نیست — صفر می‌ماند */
    }

    return {
      ok: true, dbBytes, keys, dlgBytes,
      logCount: logs.length,
      avgBytes: logs.length ? Math.round(dlgBytes / logs.length) : 0,
      byYear, byStatus, withCorrections, withDeaths, withEvents, totalEvents,
      usageMB, quotaMB, percent,
    };
  } catch (e) {
    return { ...base, error: e instanceof Error ? e.message : String(e) };
  } finally {
    db.close();
  }
}
