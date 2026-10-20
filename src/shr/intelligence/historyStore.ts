/**
 * intelligence/historyStore.ts — ذخیره و تحلیل تاریخچه
 *
 * تاریخچه در localStorage نگهداری می‌شود (TTL=180 روز).
 * برای تست، از in-memory fallback استفاده می‌شود.
 */
import type {
  FieldHistory, FieldHistoryEntry, FieldStats,
  AnalysisContext, HistoryStorage,
} from './types';

const STORAGE_KEY = 'bird-intel-history-v1';
const HISTORY_LIMIT = 100;  // حداکثر ۱۰۰ رکورد per field
const TTL_DAYS = 180;

// ══════════════════════════════════════════════════════════════════
// In-memory fallback (برای تست و محیط‌های بدون localStorage)
// ══════════════════════════════════════════════════════════════════
const memStore: Record<string, FieldHistory> = {};

function getLocalStorage(): Storage | null {
  try {
    if (typeof localStorage !== 'undefined') return localStorage;
  } catch { /* silent */ }
  return null;
}

export const localHistoryStore: HistoryStorage = {
  get(fieldPath) {
    const ls = getLocalStorage();
    if (!ls) return memStore[fieldPath] ?? null;
    try {
      const raw = ls.getItem(STORAGE_KEY);
      if (!raw) return null;
      const all = JSON.parse(raw) as Record<string, FieldHistory>;
      return all[fieldPath] ?? null;
    } catch { return null; }
  },
  set(fieldPath, h) {
    const ls = getLocalStorage();
    if (!ls) { memStore[fieldPath] = h; return; }
    try {
      const raw = ls.getItem(STORAGE_KEY);
      const all = raw ? (JSON.parse(raw) as Record<string, FieldHistory>) : {};
      all[fieldPath] = h;
      ls.setItem(STORAGE_KEY, JSON.stringify(all));
    } catch { memStore[fieldPath] = h; }
  },
  clear() {
    const ls = getLocalStorage();
    if (ls) { try { ls.removeItem(STORAGE_KEY); } catch { /* silent */ } }
    Object.keys(memStore).forEach(k => delete memStore[k]);
  },
};

// ══════════════════════════════════════════════════════════════════
// محاسبه آمار
// ══════════════════════════════════════════════════════════════════
function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = (sorted.length - 1) * p;
  const lo = Math.floor(idx), hi = Math.ceil(idx);
  if (lo === hi) return sorted[lo];
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo);
}

export function computeStats(values: number[]): FieldStats | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const n = sorted.length;
  const mean = values.reduce((s, x) => s + x, 0) / n;
  const median = percentile(sorted, 0.5);
  const variance = values.reduce((s, x) => s + (x - mean) ** 2, 0) / n;
  const std = Math.sqrt(variance);
  const cv = mean > 0 ? std / mean : 0;

  // Structural break: ۳ داده آخر > ۳۰٪ بالاتر از میانگین قبلی
  let structuralBreak = false;
  let recentMean: number | undefined;
  if (n >= 6) {
    const older = values.slice(0, n - 3);
    const recent = values.slice(-3);
    const olderMean = older.reduce((s, x) => s + x, 0) / older.length;
    const rMean = recent.reduce((s, x) => s + x, 0) / recent.length;
    if (olderMean > 0 && rMean > olderMean * 1.3 && recent.every(v => v > olderMean * 1.1)) {
      structuralBreak = true;
      recentMean = rMean;
    }
  }

  return {
    count: n,
    mean,
    median,
    std,
    cv,
    p25: percentile(sorted, 0.25),
    p75: percentile(sorted, 0.75),
    min: sorted[0],
    max: sorted[n - 1],
    lastApproach: values.length > 0 ? values[values.length - 1] : null,
    structuralBreak,
    recentMean,
  };
}

// ══════════════════════════════════════════════════════════════════
// API اصلی
// ══════════════════════════════════════════════════════════════════
export interface HistoryOptions {
  store?: HistoryStorage;
  today?: string;  // برای تست
}

function isExpired(dateStr: string, todayStr: string): boolean {
  // پشتیبانی از ISO میلادی "2026-10-20" و شمسی "1404/07/29"
  if (!dateStr || !todayStr) return false;
  const parse = (s: string): [number, number, number] | null => {
    const m = s.trim().match(/^(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})/);
    return m ? [+m[1], +m[2], +m[3]] : null;
  };
  const a = parse(dateStr);
  const b = parse(todayStr);
  if (!a || !b) return false;
  const aGregorian = a[0] >= 1900;
  const bGregorian = b[0] >= 1900;
  if (aGregorian !== bGregorian) return false;
  if (aGregorian) {
    const ta = Date.UTC(a[0], a[1] - 1, a[2]);
    const tb = Date.UTC(b[0], b[1] - 1, b[2]);
    return (tb - ta) / 86400000 > TTL_DAYS;
  }
  const days = (b[0] - a[0]) * 365 + (b[1] - a[1]) * 30 + (b[2] - a[2]);
  return days > TTL_DAYS;
}

export function recordHistory(
  fieldPath: string,
  value: number,
  ctx: AnalysisContext,
  opts: HistoryOptions = {},
): void {
  const store = opts.store ?? localHistoryStore;
  const today = opts.today ?? new Date().toISOString().slice(0, 10);
  const existing = store.get(fieldPath);

  // حذف مقادیر منقضی
  const freshValues: FieldHistoryEntry[] = (existing?.values ?? [])
    .filter(e => !isExpired(e.date, today));

  freshValues.push({
    v: value,
    ctx: { ...ctx },
    date: today,
    confirmed: false,
    outlier: false,
  });

  // محدود به HISTORY_LIMIT
  const trimmed = freshValues.slice(-HISTORY_LIMIT);

  // محاسبه stats جدید
  const stats = computeStats(trimmed.map(e => e.v));

  store.set(fieldPath, {
    values: trimmed,
    stats,
    lastUpdate: today,
  });
}

export function getHistory(fieldPath: string, opts: HistoryOptions = {}): FieldHistory | null {
  const store = opts.store ?? localHistoryStore;
  const h = store.get(fieldPath);
  if (!h) return null;
  const today = opts.today ?? new Date().toISOString().slice(0, 10);
  const fresh = h.values.filter(e => !isExpired(e.date, today));
  if (fresh.length === 0) return null;
  return {
    ...h,
    values: fresh,
    stats: computeStats(fresh.map(e => e.v)),
  };
}

export function markConfirmed(
  fieldPath: string,
  value: number,
  opts: HistoryOptions = {},
): void {
  const store = opts.store ?? localHistoryStore;
  const h = store.get(fieldPath);
  if (!h) return;
  // آخرین رکورد با همون مقدار رو confirmed کن
  const idx = [...h.values].reverse().findIndex(e => e.v === value);
  if (idx !== -1) {
    h.values[h.values.length - 1 - idx].confirmed = true;
    store.set(fieldPath, h);
  }
}

export function clearHistory(opts: HistoryOptions = {}): void {
  (opts.store ?? localHistoryStore).clear();
}

/** کاربر الگوی مشخصی داره؟ (برای percent ها) */
export function getUserPattern(
  fieldPath: string,
  opts: HistoryOptions = {},
): { mean: number; std: number; cv: number; count: number } | null {
  const h = getHistory(fieldPath, opts);
  if (!h?.stats) return null;
  return {
    mean: h.stats.mean,
    std: h.stats.std,
    cv: h.stats.cv,
    count: h.stats.count,
  };
}

export { HISTORY_LIMIT, TTL_DAYS };
