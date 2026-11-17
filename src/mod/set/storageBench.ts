/**
 * هارنس اندازه‌گیری کارایی ذخیره‌سازی — موقت.
 *
 * همان مسیر واقعی persist را شبیه‌سازی می‌کند:
 *   آرایه → JSON.stringify → IDB put → IDB get → JSON.parse
 *
 * قواعد ایمنی:
 *  - pm-state فقط خوانده می‌شود، هرگز نوشته نمی‌شود
 *  - نوشتن فقط در دیتابیس آزمایشی pm-bench
 *  - pm-bench در پایان هر اجرا حذف می‌شود
 */

const SRC_DB = 'pm-state';
const SRC_STORE = 'zustand';
const BENCH_DB = 'pm-bench';
const BENCH_STORE = 'bench';

export type BenchRow = {
  n: number;
  bytes: number;
  stringifyMs: number;
  putMs: number;
  getMs: number;
  parseMs: number;
  /** هزینهٔ افزودن یک لاگ = serialize + نوشتن کل آرایه */
  appendMs: number;
};

export type BenchResult =
  | { ok: true; row: BenchRow }
  | { ok: false; error: string };

/** یک درخواست روی یک store مشخص */
function req<T>(
  db: IDBDatabase,
  store: string,
  op: 'get' | 'put',
  arg: IDBValidKey | unknown,
  key?: IDBValidKey,
): Promise<T> {
  return new Promise((res, rej) => {
    const tx = db.transaction(store, op === 'put' ? 'readwrite' : 'readonly');
    const os = tx.objectStore(store);
    const r =
      op === 'get'
        ? os.get(arg as IDBValidKey)
        : os.put(arg, key as IDBValidKey);
    r.onsuccess = () => res(r.result as T);
    r.onerror = () => rej(r.error ?? new Error('IDB request failed'));
  });
}

function openDb(name: string, version?: number, upgrade?: (db: IDBDatabase) => void): Promise<IDBDatabase> {
  return new Promise((res, rej) => {
    const r = version ? indexedDB.open(name, version) : indexedDB.open(name);
    r.onupgradeneeded = () => upgrade?.(r.result);
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error ?? new Error(`باز کردن ${name} ناموفق`));
    r.onblocked = () => rej(new Error(`${name} قفل است — تب دیگری باز است`));
  });
}

/** خواندن لاگ‌های واقعی — فقط خواندنی */
async function readRealLogs(): Promise<unknown[]> {
  const db = await openDb(SRC_DB);
  try {
    const raw = await req<unknown>(db, SRC_STORE, 'get', 'pm-dlg');
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    const logs = (parsed as { state?: { logs?: unknown[] } })?.state?.logs;
    if (!Array.isArray(logs) || logs.length === 0) {
      throw new Error('هیچ لاگ واقعی پیدا نشد — هارنس به دادهٔ واقعی نیاز دارد');
    }
    return logs;
  } finally {
    db.close();
  }
}

/** تکثیر لاگ‌های واقعی تا رسیدن به n — فقط id عوض می‌شود */
function cloneTo(logs: unknown[], n: number): unknown[] {
  const out: unknown[] = new Array(n);
  for (let i = 0; i < n; i++) {
    const src = logs[i % logs.length] as Record<string, unknown>;
    out[i] = { ...src, id: `bench-${i}` };
  }
  return out;
}

/** حذف دیتابیس آزمایشی */
export async function deleteBenchDb(): Promise<void> {
  await new Promise<void>((res) => {
    const r = indexedDB.deleteDatabase(BENCH_DB);
    r.onsuccess = () => res();
    r.onerror = () => res();
    r.onblocked = () => res();
  });
}

export async function runBench(n: number): Promise<BenchResult> {
  if (n < 1) return { ok: false, error: 'n باید بزرگ‌تر از صفر باشد' };

  let realLogs: unknown[];
  try {
    realLogs = await readRealLogs();
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }

  let benchDb: IDBDatabase | null = null;
  try {
    const logs = cloneTo(realLogs, n);

    // شکل واقعی چیزی که persist می‌نویسد
    const payload = { state: { logs }, version: 16 };

    // ۱) serialize
    const t0 = performance.now();
    const json = JSON.stringify(payload);
    const t1 = performance.now();

    const bytes = new Blob([json]).size;

    // ۲) نوشتن
    benchDb = await openDb(BENCH_DB, 1, (db) => {
      if (!db.objectStoreNames.contains(BENCH_STORE)) db.createObjectStore(BENCH_STORE);
    });
    const t2 = performance.now();
    await req(benchDb, BENCH_STORE, 'put', json, 'pm-dlg');
    const t3 = performance.now();

    // ۳) خواندن
    const t4 = performance.now();
    const back = await req<string>(benchDb, BENCH_STORE, 'get', 'pm-dlg');
    const t5 = performance.now();

    // ۴) parse
    const t6 = performance.now();
    JSON.parse(back);
    const t7 = performance.now();

    return {
      ok: true,
      row: {
        n,
        bytes,
        stringifyMs: t1 - t0,
        putMs: t3 - t2,
        getMs: t5 - t4,
        parseMs: t7 - t6,
        // افزودن یک لاگ = همان serialize + نوشتن کل آرایه
        appendMs: (t1 - t0) + (t3 - t2),
      },
    };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  } finally {
    benchDb?.close();
    await deleteBenchDb();
  }
}
