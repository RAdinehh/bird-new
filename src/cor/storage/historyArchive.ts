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
const DB_VERSION = 3;
export const DEFAULT_STORE = 'dlg_logs';
export const ARCHIVE_STORES = {
  dlg: 'dlg_logs',
  tra: 'tra_invoices',
  flk: 'flk_closed',
  whs: 'whs_moves',
  inc: 'inc_batches',
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

/** نسخهٔ قرارداد رکورد آرشیو سرد برای مهاجرت اسکیما و همگام‌سازی آینده */
export const ARCHIVE_SCHEMA_VERSION = 1;

/** وضعیت همگام‌سازی رکورد با سرور/ابر (آماده برای فاز آنلاین و چندکاربره) */
export type ArchiveSyncStatus = 'local' | 'pending' | 'synced' | 'conflict';

/** متادیتای اختیاری عامل و مجموعه برای ردپای ALCOA+ و چندکاربره شدن */
export interface ArchiveAuditMeta {
  actorId?: string;
  actorRole?: string;
  farmId?: string;
  tenantId?: string;
  revision?: number;
  updatedAt?: number;
  syncStatus?: ArchiveSyncStatus;
}

/** یک رکورد آرشیو = لاگ اصلی + متادیتای جابه‌جایی (برای ممیزی ALCOA+) */
export type ArchiveReason = 'age' | 'flock-closed' | 'count-threshold' | 'ancient' | 'manual';

export interface ArchiveRecord extends ArchiveAuditMeta {
  schemaVersion?: number;
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


/** نوشتن یک رکورد در استور مشخص‌شدهٔ دیتابیس pm-archive (یکپارچه با backup و listArchived). */
export async function putArchiveRecord(
  record: ArchiveRecord,
  storeName: string = DEFAULT_STORE,
): Promise<void> {
  if (!record || !record.id) return;
  const db = await getDB();
  const normalized: ArchiveRecord = {
    schemaVersion: ARCHIVE_SCHEMA_VERSION,
    syncStatus: 'local',
    revision: 1,
    updatedAt: record.archivedAt || Date.now(),
    ...record,
  };
  await db.put(storeName, normalized);
}


// ═══════════════════════════════════════════════════════════════
// سیاست نگهداشت و حفاظت از رکوردهای حساس (Retention & Guard)
// ═══════════════════════════════════════════════════════════════

/** حداقل دوره نگهداشت پیشنهادی برای سوابق آرشیوی (روز) */
export const ARCHIVE_RETENTION_DAYS = 90;

/**
 * تشخیص رکوردهایی که به دلیل داشتن تلفات یا اصلاحات ممیزی
 * در کار مرغداری باید در برابر حذف شتاب‌زده محافظت شوند.
 */
export function isProtectedArchiveRecord(rec: ArchiveRecord): boolean {
  const log = rec?.log as any;
  if (!log || typeof log !== 'object') return false;
  const mortality = Number(log.mortality ?? log.deathsCount ?? 0) || 0;
  const hasCorrections = Array.isArray(log.corrections) && log.corrections.length > 0;
  return mortality > 0 || hasCorrections || rec.reason === 'flock-closed';
}


// ═══════════════════════════════════════════════════════════════
// شاخص‌های نرمال‌شده برای مقایسه گله‌ها در طول دوره‌های متفاوت
// ═══════════════════════════════════════════════════════════════

export type FlockDurationBucket =
  | 'short-cycle'
  | 'medium-cycle'
  | 'long-cycle'
  | 'unknown';

export interface ComparableFinancialSnapshot {
  recordedCost: number;
  recordedRevenue: number;
  recordedNet: number;
  dailyNet: number | null;
  isComplete: boolean;
}

export interface ComparableDataAvailability {
  hasMortality: boolean;
  hasFeed: boolean;
  hasEggs: boolean;
  hasFinancial: boolean;
  hasPerformanceIndices: boolean;
}

export interface ComparableFlockMetric {
  flockId: string;
  flockName: string;
  breedName?: string;
  productionType?: FlockProductionType;
  source: 'cold-summary';
  firstDate: string | null;
  lastDate: string | null;
  archivedAt: number;
  durationDays: number | null;
  durationBucket: FlockDurationBucket;
  logCount: number;
  logCoveragePct: number | null;
  totalMortality: number;
  totalFeedKg: number;
  totalEggs: number;
  totalBrokenEggs: number;
  livabilityPct: number | null;
  fcr: number | null;
  epef: number | null;
  dailyMortalityRate: number | null;
  dailyFeedKg: number | null;
  dailyEggs: number | null;
  brokenEggRatePct: number | null;
  feedKgPerEgg: number | null;
  financial: ComparableFinancialSnapshot | null;
  dataAvailability: ComparableDataAvailability;
}

export function classifyDurationBucket(durationDays: number | null): FlockDurationBucket {
  if (typeof durationDays !== 'number' || !Number.isFinite(durationDays) || durationDays <= 0) {
    return 'unknown';
  }
  if (durationDays <= 45) return 'short-cycle';
  if (durationDays <= 120) return 'medium-cycle';
  return 'long-cycle';
}

export function toComparableFlockMetric(
  summary: FlockArchiveSummary
): ComparableFlockMetric {
  const days =
    typeof summary.durationDays === 'number' &&
    Number.isFinite(summary.durationDays) &&
    summary.durationDays > 0
      ? summary.durationDays
      : summary.logCount > 0
        ? summary.logCount
        : null;

  const logCoveragePct =
    days && days > 0 && summary.logCount >= 0
      ? Number(Math.min(100, (summary.logCount / days) * 100).toFixed(1))
      : null;

  const dailyMortalityRate =
    days && days > 0 ? Number((summary.totalMortality / days).toFixed(3)) : null;

  const dailyFeedKg =
    days && days > 0 ? Number((summary.totalFeedKg / days).toFixed(3)) : null;

  const dailyEggs =
    days && days > 0 && summary.totalEggs > 0
      ? Number((summary.totalEggs / days).toFixed(2))
      : null;

  const brokenEggRatePct =
    summary.totalEggs > 0
      ? Number(
          Math.min(100, Math.max(0, (summary.totalBrokenEggs / summary.totalEggs) * 100)).toFixed(2)
        )
      : null;

  const feedKgPerEgg =
    summary.totalEggs > 0 && summary.totalFeedKg > 0
      ? Number((summary.totalFeedKg / summary.totalEggs).toFixed(4))
      : null;

  const fm = summary.financialMetrics;
  const financial: ComparableFinancialSnapshot | null = fm
    ? {
        recordedCost: Number(fm.recordedCost) || 0,
        recordedRevenue: Number(fm.recordedRevenue) || 0,
        recordedNet: Number(fm.recordedNet) || 0,
        dailyNet:
          days && days > 0 ? Number(((Number(fm.recordedNet) || 0) / days).toFixed(2)) : null,
        isComplete: Boolean(fm.isComplete),
      }
    : null;

  const hasMortality = summary.totalMortality > 0;
  const hasFeed = summary.totalFeedKg > 0;
  const hasEggs = summary.totalEggs > 0;
  const hasFinancial = financial !== null;
  const hasPerformanceIndices =
    summary.livabilityPct !== null || summary.fcr !== null || summary.epef !== null;

  return {
    flockId: summary.flockId,
    flockName: summary.flockName || summary.flockId,
    breedName: summary.breedName,
    productionType: summary.productionType,
    source: 'cold-summary',
    firstDate: summary.firstDate ?? null,
    lastDate: summary.lastDate ?? null,
    archivedAt: summary.archivedAt,
    durationDays: days,
    durationBucket: classifyDurationBucket(days),
    logCount: summary.logCount,
    logCoveragePct,
    totalMortality: summary.totalMortality,
    totalFeedKg: summary.totalFeedKg,
    totalEggs: summary.totalEggs,
    totalBrokenEggs: summary.totalBrokenEggs,
    livabilityPct: summary.livabilityPct ?? null,
    fcr: summary.fcr ?? null,
    epef: summary.epef ?? null,
    dailyMortalityRate,
    dailyFeedKg,
    dailyEggs,
    brokenEggRatePct,
    feedKgPerEgg,
    financial,
    dataAvailability: {
      hasMortality,
      hasFeed,
      hasEggs,
      hasFinancial,
      hasPerformanceIndices,
    },
  };
}

// ═══════════════════════════════════════════════════════════════
// مقایسه چندگله جامع (اختلاف شاخص‌ها، کامل بودن داده و هشدارها)
// ═══════════════════════════════════════════════════════════════

export type ComparisonDataCompletenessLevel =
  | 'complete'
  | 'partial'
  | 'minimal';

export interface FlockComparisonDataCompleteness {
  level: ComparisonDataCompletenessLevel;
  hasCoreOperationalData: boolean;
  hasFinancialData: boolean;
  isFinancialComplete: boolean;
  hasAdequateLogCoverage: boolean;
  missingOrLimitingFactors: string[];
}

export interface FlockComparisonItem {
  metric: ComparableFlockMetric;
  isBaseline: boolean;
  deltaDailyMortalityRate: number | null;
  deltaDailyFeedKg: number | null;
  deltaDailyEggs: number | null;
  deltaDailyNet: number | null;
  deltaFeedKgPerEgg: number | null;
  deltaLivabilityPct: number | null;
  deltaFcr: number | null;
  dataCompleteness: FlockComparisonDataCompleteness;
  warnings: string[];
  hasWarnings: boolean;
}

export interface FlockComparisonReport {
  baselineFlockId: string;
  totalFlocks: number;
  itemsWithWarningsCount: number;
  durationBucketsPresent: FlockDurationBucket[];
  items: FlockComparisonItem[];
}

function diffOrNull(
  a: number | null | undefined,
  b: number | null | undefined,
  decimals = 3
): number | null {
  if (typeof a !== 'number' || !Number.isFinite(a)) return null;
  if (typeof b !== 'number' || !Number.isFinite(b)) return null;
  return Number((a - b).toFixed(decimals));
}

function evaluateComparisonCompleteness(
  metric: ComparableFlockMetric
): FlockComparisonDataCompleteness {
  const missingOrLimitingFactors: string[] = [];

  const hasCoreOperationalData =
    metric.dataAvailability.hasMortality ||
    metric.dataAvailability.hasFeed ||
    metric.dataAvailability.hasEggs ||
    metric.dataAvailability.hasPerformanceIndices;

  const hasFinancialData = Boolean(metric.financial);
  const isFinancialComplete = Boolean(metric.financial?.isComplete);

  const hasAdequateLogCoverage =
    typeof metric.logCoveragePct === 'number'
      ? metric.logCoveragePct >= 80
      : metric.logCount > 0;

  if (metric.logCount === 0) {
    missingOrLimitingFactors.push('هیچ لاگ روزانه‌ای ثبت نشده است.');
  } else if (typeof metric.logCoveragePct === 'number' && metric.logCoveragePct < 80) {
    missingOrLimitingFactors.push(
      `پوشش ثبت لاگ ${metric.logCoveragePct}% است (کمتر از ۸۰٪ دوره).`
    );
  }

  if (!hasCoreOperationalData) {
    missingOrLimitingFactors.push(
      'داده‌های شاخص عملیاتی (تلفات، دان، تخم یا شاخص‌های عملکرد) ثبت نشده است.'
    );
  }

  if (!hasFinancialData) {
    missingOrLimitingFactors.push('اطلاعات مالی برای این گله ثبت نشده است.');
  } else if (!isFinancialComplete) {
    missingOrLimitingFactors.push('اطلاعات مالی ثبت‌شده به‌عنوان کامل علامت نخورده است.');
  }

  let level: ComparisonDataCompletenessLevel = 'complete';
  if (!hasCoreOperationalData && !hasFinancialData) {
    level = 'minimal';
  } else if (missingOrLimitingFactors.length > 0) {
    level = 'partial';
  }

  return {
    level,
    hasCoreOperationalData,
    hasFinancialData,
    isFinancialComplete,
    hasAdequateLogCoverage,
    missingOrLimitingFactors,
  };
}

/**
 * مقایسه ساختاریافته چند گله (با طول دوره‌های متفاوت مانند ۳۰ روزه، ۸۰ روزه یا طولانی‌تر)
 * بر اساس شاخص‌های نرمال‌شده روزانه و نرخ‌ها همراه با اختلاف‌های تکمیلی،
 * وضعیت کامل بودن داده‌ها و هشدارهای مقایسه‌ای.
 */
export function compareFlockMetrics(
  metrics: ComparableFlockMetric[],
  baselineFlockId?: string
): FlockComparisonReport {
  if (!Array.isArray(metrics) || metrics.length === 0) {
    return {
      baselineFlockId: '',
      totalFlocks: 0,
      itemsWithWarningsCount: 0,
      durationBucketsPresent: [],
      items: [],
    };
  }

  const baseline =
    (baselineFlockId ? metrics.find((m) => m.flockId === baselineFlockId) : undefined) ??
    metrics[0];

  const baselineDailyNet = baseline.financial?.dailyNet ?? null;

  const items: FlockComparisonItem[] = metrics.map((m) => {
    const isBaseline = m.flockId === baseline.flockId;
    const warnings: string[] = [];
    const dataCompleteness = evaluateComparisonCompleteness(m);

    if (!isBaseline) {
      if (
        baseline.durationBucket !== 'unknown' &&
        m.durationBucket !== 'unknown' &&
        baseline.durationBucket !== m.durationBucket
      ) {
        warnings.push(
          `تفاوت رده طول دوره (${baseline.durationDays ?? '?'} روز در برابر ${m.durationDays ?? '?'} روز)؛ مقایسه بر پایه نرخ روزانه انجام شده است.`
        );
      } else if (
        typeof baseline.durationDays === 'number' &&
        typeof m.durationDays === 'number' &&
        baseline.durationDays > 0 &&
        m.durationDays > 0 &&
        Math.abs(baseline.durationDays - m.durationDays) >= 15
      ) {
        warnings.push(
          `اختلاف قابل‌توجه طول دوره (${baseline.durationDays} روز در برابر ${m.durationDays} روز)؛ در تفسیر اعداد کل دقت کنید.`
        );
      }

      if (
        baseline.productionType &&
        m.productionType &&
        baseline.productionType !== m.productionType
      ) {
        warnings.push(
          `تفاوت نوع بهره‌برداری گله (${baseline.productionType} در برابر ${m.productionType}).`
        );
      }

      if (!dataCompleteness.hasAdequateLogCoverage && m.logCount > 0) {
        warnings.push(
          `پوشش لاگ گله ${m.flockName} (${m.logCoveragePct ?? 0}%) پایین‌تر از حد مطلوب است.`
        );
      }

      if (m.financial && !m.financial.isComplete) {
        warnings.push(
          `اطلاعات مالی گله ${m.flockName} ناقص است؛ مقایسه خالص روزانه ممکن است قطعی نباشد.`
        );
      }

      if (
        baselineDailyNet !== null &&
        baselineDailyNet !== undefined &&
        (m.financial?.dailyNet === null || m.financial?.dailyNet === undefined)
      ) {
        warnings.push(
          `گله مرجع دارای خالص روزانه است اما برای ${m.flockName} داده مالی ثبت نشده است.`
        );
      }
    } else {
      if (!dataCompleteness.hasAdequateLogCoverage && m.logCount > 0) {
        warnings.push(
          `گله مرجع (${m.flockName}) دارای پوشش لاگ ${m.logCoveragePct ?? 0}% است.`
        );
      }
      if (m.financial && !m.financial.isComplete) {
        warnings.push(
          `اطلاعات مالی گله مرجع (${m.flockName}) به‌عنوان کامل ثبت نشده است.`
        );
      }
    }

    const itemDailyNet = m.financial?.dailyNet ?? null;

    return {
      metric: m,
      isBaseline,
      deltaDailyMortalityRate: diffOrNull(m.dailyMortalityRate, baseline.dailyMortalityRate, 3),
      deltaDailyFeedKg: diffOrNull(m.dailyFeedKg, baseline.dailyFeedKg, 3),
      deltaDailyEggs: diffOrNull(m.dailyEggs, baseline.dailyEggs, 2),
      deltaDailyNet: diffOrNull(itemDailyNet, baselineDailyNet, 2),
      deltaFeedKgPerEgg: diffOrNull(m.feedKgPerEgg, baseline.feedKgPerEgg, 4),
      deltaLivabilityPct: diffOrNull(m.livabilityPct, baseline.livabilityPct, 2),
      deltaFcr: diffOrNull(m.fcr, baseline.fcr, 3),
      dataCompleteness,
      warnings,
      hasWarnings: warnings.length > 0,
    };
  });

  const durationBucketsPresent = Array.from(
    new Set(metrics.map((m) => m.durationBucket))
  );

  const itemsWithWarningsCount = items.filter((item) => item.hasWarnings).length;

  return {
    baselineFlockId: baseline.flockId,
    totalFlocks: items.length,
    itemsWithWarningsCount,
    durationBucketsPresent,
    items,
  };
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
/**
 * بازگردانی اتمیک چند لاگ — خواندن + حذف از آرشیو در یک تراکنش.
 * اگر خطایی رخ دهد، IDBTransaction.abort() همه را برمی‌گرداند (MDN):
 * هیچ لاگی نیمه‌کاره نه از آرشیو حذف می‌شود نه گم می‌شود.
 */
export async function restoreManyFromArchive(
  ids: string[],
  storeName: string = DEFAULT_STORE
): Promise<DailyLog[]> {
  if (ids.length === 0) return [];
  const uniqueIds = Array.from(new Set(ids.filter(Boolean)));
  if (uniqueIds.length === 0) return [];
  const db = await getDB();
  const tx = db.transaction(storeName, 'readwrite');
  const store = tx.objectStore(storeName);
  const out: DailyLog[] = [];
  const foundIds: string[] = [];
  try {
    for (const id of uniqueIds) {
      const rec = (await store.get(id)) as ArchiveRecord | undefined;
      if (rec?.log) {
        out.push(rec.log);
        foundIds.push(id);
      }
    }
    for (const id of foundIds) await store.delete(id);
    await tx.done;
    return out;
  } catch (e) {
    try { tx.abort(); } catch { /* already done */ }
    throw e;
  }
}

export async function purgeArchiveIds(ids: string[], storeName: string = DEFAULT_STORE): Promise<number> {
  if (ids.length === 0) return 0;
  const db = await getDB();
  const tx = db.transaction(storeName, 'readwrite');
  const store = tx.objectStore(storeName);
  for (const id of ids) await store.delete(id);
  await tx.done;
  return ids.length;
}

// ═══════════════════════════════════════════════════════════════
// API پشتیبان‌گیری — برای backup.ts
// ═══════════════════════════════════════════════════════════════

/**
 * خروجی همه رکوردهای آرشیو (برای پشتیبان کامل).
 * بدون فیلتر، بدون صفحه‌بندی — تمام رکوردها.
 */
export async function exportArchiveRecords(storeName: string = DEFAULT_STORE): Promise<ArchiveRecord[]> {
  const db = await getDB();
  return (await db.getAll(storeName)) as ArchiveRecord[];
}

/**
 * وارد کردن دسته‌ای رکورد به آرشیو (برای بازیابی از پشتیبان).
 * - mode='replace': ابتدا پاک‌سازی کامل، بعد نوشتن همه
 * - mode='merge': فقط رکوردهای جدید (بر اساس id)
 *
 * @returns تعداد رکوردهای نوشته‌شده
 */

// ═══════════════════════════════════════════════════════════════
// مهاجرت نسخه (Schema Migration) و صحت‌سنجی رکوردهای سرد
// ═══════════════════════════════════════════════════════════════

export function isValidArchiveRecord(rec: unknown): rec is ArchiveRecord {
  if (!rec || typeof rec !== 'object') return false;
  const r = rec as Partial<ArchiveRecord>;
  return typeof r.id === 'string' && r.id.trim().length > 0 && Boolean(r.log && typeof r.log === 'object');
}

export function migrateArchiveRecord(raw: unknown): ArchiveRecord | null {
  if (!isValidArchiveRecord(raw)) return null;
  const r = raw as ArchiveRecord;
  const archivedAt = typeof r.archivedAt === 'number' && Number.isFinite(r.archivedAt) ? r.archivedAt : Date.now();
  return {
    ...r,
    schemaVersion: typeof r.schemaVersion === 'number' && r.schemaVersion > 0 ? r.schemaVersion : ARCHIVE_SCHEMA_VERSION,
    flockId: r.flockId || (r.log as any)?.flockId || '',
    date: r.date || (r.log as any)?.date || '',
    archivedAt,
    reason: r.reason || 'age',
    revision: typeof r.revision === 'number' && r.revision > 0 ? r.revision : 1,
    updatedAt: typeof r.updatedAt === 'number' && Number.isFinite(r.updatedAt) ? r.updatedAt : archivedAt,
    syncStatus: r.syncStatus || 'local',
  };
}

export function isValidFlockSummary(row: unknown): row is FlockArchiveSummary {
  if (!row || typeof row !== 'object') return false;
  const s = row as Partial<FlockArchiveSummary>;
  return typeof s.flockId === 'string' && s.flockId.trim().length > 0;
}

export function migrateFlockSummary(raw: unknown): FlockArchiveSummary | null {
  if (!isValidFlockSummary(raw)) return null;
  const s = raw as FlockArchiveSummary;
  const archivedAt = typeof s.archivedAt === 'number' && Number.isFinite(s.archivedAt) ? s.archivedAt : Date.now();
  return {
    ...s,
    schemaVersion: typeof s.schemaVersion === 'number' && s.schemaVersion > 0 ? s.schemaVersion : SUMMARY_SCHEMA_VERSION,
    archivedAt,
    logCount: typeof s.logCount === 'number' && Number.isFinite(s.logCount) ? s.logCount : 0,
    firstDate: s.firstDate ?? null,
    lastDate: s.lastDate ?? null,
    totalMortality: Number(s.totalMortality) || 0,
    totalFeedKg: Number(s.totalFeedKg) || 0,
    totalEggs: Number(s.totalEggs) || 0,
    totalBrokenEggs: Number(s.totalBrokenEggs) || 0,
  };
}

export async function importArchiveRecords(
  records: ArchiveRecord[],
  mode: 'replace' | 'merge',
  storeName: string = DEFAULT_STORE,
): Promise<number> {
  const validRecords = Array.isArray(records)
    ? records
        .map((rec) => migrateArchiveRecord(rec))
        .filter((rec): rec is ArchiveRecord => rec !== null)
    : [];

  if (mode !== 'replace' && validRecords.length === 0) return 0;

  const db = await getDB();
  const tx = db.transaction(storeName, 'readwrite');
  const store = tx.objectStore(storeName);

  if (mode === 'replace') {
    await store.clear();
  }

  let written = 0;
  for (const rec of validRecords) {
    if (mode === 'merge') {
      const existing = await store.get(rec.id);
      if (existing) continue;
    }
    await store.put(rec);
    written++;
  }

  await tx.done;
  return written;
}

/** پاک‌سازی کامل استور آرشیو (برای حالت replace) */
export async function clearArchive(storeName: string = DEFAULT_STORE): Promise<void> {
  const db = await getDB();
  await db.clear(storeName);
}
// ═══════════════════════════════════════════════════════════════
// لایه ۴ — خلاصه گله برای مقایسه و BI (استور summaries)
// ═══════════════════════════════════════════════════════════════

export const SUMMARY_SCHEMA_VERSION = 1;

export type FlockProductionType = 'layer' | 'broiler' | 'breeder' | 'hatchery' | 'other';

export interface FlockArchiveSummary {
  schemaVersion: number;
  flockId: string;
  flockName?: string;
  breedName?: string;
  productionType?: FlockProductionType;
  archivedAt: number;

  logCount: number;
  firstDate: string | null;
  lastDate: string | null;
  durationDays?: number | null;

  totalMortality: number;
  totalFeedKg: number;
  totalEggs: number;
  totalBrokenEggs: number;
  livabilityPct?: number | null;
  fcr?: number | null;
  epef?: number | null;

  hatcheryMetrics?: {
    totalSetEggs?: number;
    fertilePct?: number | null;
    hatchabilityPct?: number | null;
  };
  financialMetrics?: {
    recordedCost?: number;
    recordedRevenue?: number;
    recordedNet?: number;
    isComplete?: boolean;
  };
}

export function computeFlockSummary(
  flockId: string,
  logs: DailyLog[],
  meta?: {
    flockName?: string;
    breedName?: string;
    productionType?: FlockProductionType;
    durationDays?: number | null;
    livabilityPct?: number | null;
    avgWeightKg?: number | null;
    ageDays?: number | null;
    recordedCost?: number;
    recordedRevenue?: number;
    financialComplete?: boolean;
  },
  archivedAt: number = Date.now()
): FlockArchiveSummary {
  const validDates = logs
    .map((l) => l.date)
    .filter((d): d is string => Boolean(d))
    .sort();

  let totalMortality = 0;
  let totalFeedKg = 0;
  let totalEggs = 0;
  let totalBrokenEggs = 0;
  let latestWeightKgFromLogs: number | null = null;
  let maxBirdAgeDays = 0;

  for (const log of logs) {
    const anyLog = log as any;
    const deaths =
      typeof anyLog.deathsCount === 'number' && Number.isFinite(anyLog.deathsCount)
        ? anyLog.deathsCount
        : Array.isArray(anyLog.deaths)
          ? anyLog.deaths.reduce((acc: number, d: any) => acc + (Number(d?.count) || 0), 0)
          : Number(anyLog.mortality) || 0;
    totalMortality += Math.max(0, deaths);

    const feed =
      typeof anyLog.feedConsumed === 'number' && Number.isFinite(anyLog.feedConsumed)
        ? anyLog.feedConsumed
        : Number(anyLog.feedKg ?? anyLog.feedAmount ?? 0) || 0;
    totalFeedKg += Math.max(0, feed);

    const broken = Number(anyLog.brokenEggs) || 0;
    totalBrokenEggs += Math.max(0, broken);

    const splitEggs =
      (Number(anyLog.eatingEggs) || 0) +
      (Number(anyLog.fertileEggs) || 0) +
      (Number(anyLog.otherEggs) || 0);
    const eggs =
      splitEggs > 0
        ? splitEggs
        : Number(anyLog.eggTotal ?? anyLog.totalEggs ?? 0) || 0;
    totalEggs += Math.max(0, eggs);

    if (typeof anyLog.birdAgeDays === 'number' && anyLog.birdAgeDays > maxBirdAgeDays) {
      maxBirdAgeDays = anyLog.birdAgeDays;
    }

    if (Array.isArray(anyLog.weightSamples) && anyLog.weightSamples.length > 0) {
      const lastSample = anyLog.weightSamples[anyLog.weightSamples.length - 1];
      const rawW = Number(lastSample?.avgWeightKg ?? lastSample?.weightKg ?? lastSample?.weight ?? 0);
      if (rawW > 0) {
        // اگر وزن بر حسب گرم ثبت شده باشد (مثلاً 1850 به جای 1.85)، به کیلوگرم تبدیل می‌شود
        latestWeightKgFromLogs = rawW > 20 ? Number((rawW / 1000).toFixed(3)) : rawW;
      }
    }
  }

  const avgWeightKg =
    meta?.avgWeightKg && meta.avgWeightKg > 0
      ? meta.avgWeightKg
      : latestWeightKgFromLogs;
  const fcr =
    avgWeightKg && totalFeedKg > 0
      ? Number((totalFeedKg / avgWeightKg).toFixed(3))
      : null;

  const livabilityPct =
    typeof meta?.livabilityPct === 'number' && Number.isFinite(meta.livabilityPct)
      ? meta.livabilityPct
      : null;
  const ageDays =
    typeof meta?.ageDays === 'number' && meta.ageDays > 0
      ? meta.ageDays
      : maxBirdAgeDays > 0
        ? maxBirdAgeDays
        : null;

  const epef =
    livabilityPct !== null && avgWeightKg && ageDays && fcr && fcr > 0
      ? Number(((livabilityPct * avgWeightKg * 100) / (ageDays * fcr)).toFixed(1))
      : null;

  const hasFinancial =
    typeof meta?.recordedCost === 'number' || typeof meta?.recordedRevenue === 'number';
  const recordedCost = typeof meta?.recordedCost === 'number' ? meta.recordedCost : 0;
  const recordedRevenue = typeof meta?.recordedRevenue === 'number' ? meta.recordedRevenue : 0;

  return {
    schemaVersion: SUMMARY_SCHEMA_VERSION,
    flockId,
    flockName: meta?.flockName,
    breedName: meta?.breedName,
    productionType: meta?.productionType,
    archivedAt,
    logCount: logs.length,
    firstDate: validDates[0] ?? null,
    lastDate: validDates[validDates.length - 1] ?? null,
    durationDays: meta?.durationDays ?? ageDays ?? (logs.length > 0 ? logs.length : null),
    totalMortality,
    totalFeedKg,
    totalEggs,
    totalBrokenEggs,
    livabilityPct,
    fcr,
    epef,
    ...(hasFinancial
      ? {
          financialMetrics: {
            recordedCost,
            recordedRevenue,
            recordedNet: recordedRevenue - recordedCost,
            isComplete: Boolean(meta?.financialComplete),
          },
        }
      : {}),
  };
}

export async function saveFlockSummary(summary: FlockArchiveSummary): Promise<void> {
  if (!summary || !summary.flockId) return;
  const db = await getDB();
  await db.put(STORE_SUMMARIES, {
    ...summary,
    schemaVersion: summary.schemaVersion || SUMMARY_SCHEMA_VERSION,
  });
}

export async function getFlockSummary(flockId: string): Promise<FlockArchiveSummary | null> {
  if (!flockId) return null;
  const db = await getDB();
  const row = await db.get(STORE_SUMMARIES, flockId);
  return (row as FlockArchiveSummary) || null;
}

export async function listFlockSummaries(): Promise<FlockArchiveSummary[]> {
  const db = await getDB();
  const rows = (await db.getAll(STORE_SUMMARIES)) as FlockArchiveSummary[];
  return rows.sort((a, b) => (b.archivedAt || 0) - (a.archivedAt || 0));
}

export async function deleteFlockSummary(flockId: string): Promise<void> {
  if (!flockId) return;
  const db = await getDB();
  await db.delete(STORE_SUMMARIES, flockId);
}

export async function clearFlockSummaries(): Promise<void> {
  const db = await getDB();
  await db.clear(STORE_SUMMARIES);
}
