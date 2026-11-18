/**
 * historyArchive.ts — آرشیو سرد (Cold Storage) برای داده‌های قدیمی
 * استاندارد: Hot/Cold Tiering (Azure/S3/Databricks) + الگوی Odoo (حذف فیزیکی نمی‌شود)
 *
 * قواعد تصویب‌شده:
 *  - هرگز حذف نکن، همیشه نگه دار، فقط جابه‌جا کن.
 *  - این فایل فقط می‌نویسد و می‌خواند. حذف از hot کار لایهٔ ۲ است.
 *  - Repository خالص: ورودی‌محور، بدون وابستگی به dlg/store.
 *  - DB مستقل از pm-state تا نسخه‌بندی آن دست نخورد.
 */
import { openDB, type IDBPDatabase } from 'idb';
import type { DailyLog } from '../../mod/dlg/store';
import { jalaliToDate } from '../../mod/flk/helpers-store';

const DB_NAME = 'pm-archive';
const DB_VERSION = 2;
export const DEFAULT_STORE = 'dlg_logs';
export const ARCHIVE_STORES = {
  dlg: 'dlg_logs',
  tra: 'tra_invoices',
  flk: 'flk_closed',
  whs: 'whs_moves',
} as const;
export type ArchiveStoreName = typeof ARCHIVE_STORES[keyof typeof ARCHIVE_STORES];

const STORE_SUMMARIES = 'summaries';
const ALL_STORES = Object.values(ARCHIVE_STORES);

/** پیش‌فرض آستانه — قابل تغییر از طریق opts.months (بعد از اندازه‌گیری لایه ۰) */
export const ARCHIVE_AFTER_MONTHS = 6;

/**
 * آستانهٔ دوگانه — مبنا: اندازه‌گیری لایه ۰ (StorageBenchTab)
 *   0.125 ms/لاگ → ۱۰۰ms ≈ ۸۰۰ لاگ؛ ۶ ماه ≈ ۱۸۳ لاگ ≈ ۲۳ms
 * الگو: Elastic ILM / S3 Lifecycle / Azure Blob → هرکدام اول رسید (OR)
 * trimTo: هیسترزیس — بعد از آرشیو تا ۶۰۰ پایین بیا تا هر روز آرشیو نشود
 */
export const ARCHIVE_POLICY = {
  maxAgeMonths: 6,
  maxHotLogs: 800,
  trimTo: 600,
} as const;

/** یک رکورد آرشیو = لاگ اصلی + متادیتای جابه‌جایی (برای ممیزی ALCOA+) */
export type ArchiveReason = 'age' | 'flock-closed' | 'count-threshold' | 'ancient';

export interface ArchiveRecord {
  id: string;
  flockId: string;
  date: string;
  archivedAt: number;
  reason: ArchiveReason;
  log: DailyLog;
}

export interface ArchiveStats {
  count: number;
  oldestDate: string | null;
  newestDate: string | null;
}

export interface ArchiveOptions {
  now?: Date;
  months?: number;
  dryRun?: boolean;
  reason?: ArchiveReason;
}

export interface ArchiveResult {
  archivedCount: number;
  keptCount: number;
  skippedCount: number;
  archivedIds: string[];
}

export interface SplitResult {
  toArchive: DailyLog[];
  keep: DailyLog[];
  skipped: DailyLog[];
}

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDB(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        for (const name of ALL_STORES) {
          if (!db.objectStoreNames.contains(name)) {
            const store = db.createObjectStore(name, { keyPath: 'id' });
            store.createIndex('flockId', 'flockId');
            store.createIndex('date', 'date');
            store.createIndex('archivedAt', 'archivedAt');
          }
        }
        if (!db.objectStoreNames.contains(STORE_SUMMARIES)) {
          db.createObjectStore(STORE_SUMMARIES, { keyPath: 'flockId' });
        }
      },
    });
  }
  return dbPromise;
}

/** تاریخ شمسی لاگ → Date. نامعتبر → null (بدون حدس). */
export function parseLogDate(date: string): Date | null {
  if (!date) return null;
  return jalaliToDate(date);
}

/** N ماه قبل از now، با محاسبهٔ تقویمی (نه ۳۰ روز ثابت). */
export function monthsAgo(now: Date, months: number): Date {
  const d = new Date(now.getTime());
  d.setMonth(d.getMonth() - months);
  return d;
}

/**
 * تفکیک خالص لاگ‌ها به سه سبد — بدون DB، کاملاً تست‌پذیر.
 * - toArchive: تاریخ معتبر و قدیمی‌تر از cutoff
 * - keep: تاریخ معتبر و جدیدتر یا مساوی cutoff
 * - skipped: تاریخ نامعتبر یا id خالی → امن در hot می‌ماند
 */
export function splitForArchive(logs: DailyLog[], cutoff: Date): SplitResult {
  const toArchive: DailyLog[] = [];
  const keep: DailyLog[] = [];
  const skipped: DailyLog[] = [];

  for (const log of logs) {
    if (!log || !log.id) {
      skipped.push(log);
      continue;
    }
    const d = parseLogDate(log.date);
    if (!d) {
      skipped.push(log);
      continue;
    }
    // ممیزی (ALCOA+ / 21 CFR Part 11): لاگ دارای اصلاحات یا تلفات هرگز آرشیو نمی‌شود
    const audit = ((log as any).corrections?.length ?? 0) > 0
               || ((log as any).deaths?.length ?? 0) > 0;
    if (audit) { keep.push(log); continue; }

    if (d.getTime() < cutoff.getTime()) toArchive.push(log);
    else keep.push(log);
  }

  return { toArchive, keep, skipped };
}

/**
 * نوشتن لاگ‌های کهنه در آرشیو سرد.
 * فقط می‌نویسد — هیچ لاگی از hot حذف نمی‌شود.
 */
export async function archiveLogs(
  logs: DailyLog[],
  opts: ArchiveOptions = {},
  storeName: string = DEFAULT_STORE
): Promise<ArchiveResult> {
  const now = opts.now ?? new Date();
  const months = opts.months ?? ARCHIVE_POLICY.maxAgeMonths;
  const cutoff = monthsAgo(now, months);
  const { toArchive, keep, skipped } = splitForArchive(logs, cutoff);

  const result: ArchiveResult = {
    archivedCount: 0,
    keptCount: keep.length,
    skippedCount: skipped.length,
    archivedIds: [],
  };

  if (opts.dryRun || toArchive.length === 0) {
    result.archivedCount = opts.dryRun ? toArchive.length : 0;
    if (opts.dryRun) result.archivedIds = toArchive.map(l => l.id);
    return result;
  }

  const archivedAt = now.getTime();
  const db = await getDB();
  const tx = db.transaction(storeName, 'readwrite');
  const store = tx.objectStore(storeName);

  for (const log of toArchive) {
    const record: ArchiveRecord = {
      id: log.id,
      flockId: log.flockId,
      date: log.date,
      archivedAt,
      reason: opts.reason ?? 'age',
      log,
    };
    await store.put(record);
    result.archivedIds.push(log.id);
  }

  await tx.done;
  result.archivedCount = result.archivedIds.length;
  return result;
}

/** خواندن یک رکورد آرشیو با شناسه. */
export async function getArchived(id: string, storeName: string = DEFAULT_STORE): Promise<ArchiveRecord | null> {
  if (!id) return null;
  const db = await getDB();
  const rec = await db.get(storeName, id);
  return rec || null;
}

export interface ListOptions {
  flockId?: string;
  fromDate?: string;
  toDate?: string;
  limit?: number;
  offset?: number;
}

/**
 * فهرست رکوردهای آرشیو، مرتب نزولی بر اساس تاریخ.
 * فیلتر بازه روی رشتهٔ شمسی انجام می‌شود (مقایسهٔ لغوی معتبر است چون yyyy/MM/dd).
 */
export async function listArchived(opts: ListOptions = {}, storeName: string = DEFAULT_STORE): Promise<ArchiveRecord[]> {
  const db = await getDB();
  let rows: ArchiveRecord[];
  if (opts.flockId) {
    rows = (await db.getAllFromIndex(storeName, 'flockId', opts.flockId)) as ArchiveRecord[];
  } else {
    rows = (await db.getAll(storeName)) as ArchiveRecord[];
  }

  if (opts.fromDate) rows = rows.filter(r => r.date >= opts.fromDate!);
  if (opts.toDate) rows = rows.filter(r => r.date <= opts.toDate!);

  rows.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));

  const offset = opts.offset ?? 0;
  const limit = opts.limit ?? 100;
  return rows.slice(offset, offset + limit);
}

/** آمار آرشیو: تعداد و قدیمی‌ترین/جدیدترین تاریخ. */
export async function getArchiveStats(storeName: string = DEFAULT_STORE): Promise<ArchiveStats> {
  const db = await getDB();
  const count = await db.count(storeName);
  if (count === 0) return { count: 0, oldestDate: null, newestDate: null };

  const keys = (await db.getAllKeysFromIndex(storeName, 'date')) as string[];
  const sorted = keys.slice().sort();
  return {
    count,
    oldestDate: sorted[0] ?? null,
    newestDate: sorted[sorted.length - 1] ?? null,
  };
}

/**
 * بازگردانی یک رکورد از آرشیو — فقط خواندن و برگرداندن، بدون حذف.
 * حذف از آرشیو تصمیم جداگانه است (هرگز خودکار).
 */
export async function restoreFromArchive(id: string, storeName: string = DEFAULT_STORE): Promise<DailyLog | null> {
  const rec = await getArchived(id, storeName);
  return rec ? rec.log : null;
}

/**
 * حذف دائمی از آرشیو — فقط برای سیاست نگهداشت قانونی.
 * پیش‌فرض: هیچ‌وقت صدا زده نمی‌شود. اگر صدا زده شد، صریح و آگاهانه است.
 */
export async function purgeArchive(beforeDate: string, storeName: string = DEFAULT_STORE): Promise<number> {
  if (!beforeDate) return 0;
  const db = await getDB();
  const all = (await db.getAll(storeName)) as ArchiveRecord[];
  const victims = all.filter(r => r.date < beforeDate);
  if (victims.length === 0) return 0;

  const tx = db.transaction(storeName, 'readwrite');
  const store = tx.objectStore(storeName);
  for (const r of victims) await store.delete(r.id);
  await tx.done;
  return victims.length;
}

/** تعداد رکوردهای آرشیو — برای معیار پذیرش (hot + archive = کل). */
export async function countArchived(storeName: string = DEFAULT_STORE): Promise<number> {
  const db = await getDB();
  return db.count(storeName);
}

// ═══════════════════════════════════════════════════════════════
// لایه ۳ — آرشیو سه‌سطحی (سطح ۱: گله بسته)
// ═══════════════════════════════════════════════════════════════

/**
 * سطح ۱ — آرشیو فوری گله بسته.
 * تمام لاگ‌های گله‌ای که به status=archived/sold رفته را آرشیو می‌کند.
 * (بدون توجه به تاریخ — چون گله بسته شده)
 */
export async function archiveClosedFlock(logs: DailyLog[], storeName: string = DEFAULT_STORE): Promise<ArchiveResult> {
  return archiveLogs(logs, { months: 0, reason: 'flock-closed' }, storeName);
}

/**
 * حذف چند شناسه از آرشیو — برای بازگردانی (انتقال، نه کپی).
 * وقتی لاگ از آرشیو به hot برمی‌گردد، دیگر نباید در آرشیو بماند
 * (تا در مقایسه‌ها دوبار شمرده نشود).
 */
export async function purgeArchiveIds(ids: string[], storeName: string = DEFAULT_STORE): Promise<number> {
  if (ids.length === 0) return 0;
  const db = await getDB();
  const tx = db.transaction(storeName, 'readwrite');
  const store = tx.objectStore(storeName);
  for (const id of ids) await store.delete(id);
  await tx.done;
  return ids.length;
}

