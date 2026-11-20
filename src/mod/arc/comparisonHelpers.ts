/**
 * comparisonHelpers.ts — توابع کمکی و ثابت‌های مقایسه گله‌ها
 * (استخراج‌شده از FlockComparisonPanel.tsx — فاز رفکتور)
 */
import { safeStorage } from '../../shr/utils/storage';
import { HELP } from '../../shr/help/helpTexts';
import type { ComparableFlockMetric } from '../../cor/storage/historyArchive';

export type CandidateFilter = 'all' | 'archived' | 'active';
export type PickerMode = 'compare' | 'baseline' | null;
export type BetterRule = 'higher' | 'lower';
export type TagTone =
  | 'blue' | 'gray' | 'green' | 'purple' | 'red' | 'warn'
  | 'info' | 'accent' | 'danger' | 'amber' | 'dim';

export interface ComparisonCandidate {
  id: string;
  label: string;
  metric: ComparableFlockMetric;
  isActive: boolean;
}

export interface MetricSpec {
  key: string;
  label: string;
  ruleText: string;
  better: BetterRule;
  unit: string;
  decimals: number;
}

export const MIN_FLOCKS = 2;
export const MAX_FLOCKS = 4;
export const ARCHIVE_FILTER_THRESHOLD = 5;

export const DEFAULT_COMPARISON_HELP =
  '**مقایسه گله‌ها (۲ تا ۴ گله):** یک گله را به عنوان **مرجع** (فعال یا آرشیو) انتخاب کنید و سایر گله‌ها را با آن بسنجید. ستون اول همیشه مرجع است و تکراری نمی‌آید.\n**امتیازدهی:** در هزینه، تلفات و ضریب تبدیل **کمتر بهتر** و در درآمد، زنده‌مانی و تخم **بیشتر بهتر** است. شاخص‌های ثبت‌نشده به پایین جدول منتقل می‌شوند.';

export const COMPARISON_HELP_TEXT =
  (HELP as unknown as { arc?: { comparison?: { overview?: string } } }).arc?.comparison?.overview ??
  DEFAULT_COMPARISON_HELP;

export const COMPARISON_METRICS: MetricSpec[] = [
  { key: 'epef', label: 'شاخص تولید', ruleText: 'بیشتر بهتر', better: 'higher', unit: '', decimals: 0 },
  { key: 'fcr', label: 'ضریب تبدیل', ruleText: 'کمتر بهتر', better: 'lower', unit: '', decimals: 2 },
  { key: 'livabilityPct', label: 'زنده‌مانی', ruleText: 'بیشتر بهتر', better: 'higher', unit: '٪', decimals: 1 },
  { key: 'brokenEggRatePct', label: 'تخم شکسته', ruleText: 'کمتر بهتر', better: 'lower', unit: '٪', decimals: 1 },
  { key: 'initialCost', label: 'هزینه اولیه', ruleText: 'کمتر بهتر', better: 'lower', unit: '', decimals: 0 },
  { key: 'recordedCost', label: 'هزینه تمام‌شده', ruleText: 'کمتر بهتر', better: 'lower', unit: '', decimals: 0 },
  { key: 'recordedRevenue', label: 'درآمد ثبت‌شده', ruleText: 'بیشتر بهتر', better: 'higher', unit: '', decimals: 0 },
  { key: 'totalMortality', label: 'کل تلفات', ruleText: 'کمتر بهتر', better: 'lower', unit: '', decimals: 0 },
  { key: 'totalFeedKg', label: 'کل دان', ruleText: 'کمتر بهتر', better: 'lower', unit: 'kg', decimals: 0 },
  { key: 'totalEggs', label: 'کل تخم', ruleText: 'بیشتر بهتر', better: 'higher', unit: '', decimals: 0 },
];

export function cleanCandidateTitle(rawLabel: string, fallbackName: string): string {
  const cleaned = rawLabel
    .replace(/\s*\[(?:فعال|آرشیو)\]\s*/g, ' ')
    .replace(/\s*\((?:فعال|آرشیو)(?:\s*[•·-]\s*[^)]*)?\)\s*/g, ' ')
    .replace(/\s*\(\d+\s*روز\)\s*/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return cleaned || fallbackName || rawLabel;
}

export function extractNumericMetric(metric: ComparableFlockMetric, key: string): number | null {
  const rec = metric as unknown as Record<string, unknown>;
  const raw = rec[key];
  if (typeof raw === 'number' && !Number.isNaN(raw)) return raw;
  const fin = metric.financial as unknown as Record<string, unknown> | undefined;
  if (fin && typeof fin[key] === 'number' && !Number.isNaN(fin[key] as number)) {
    return fin[key] as number;
  }
  return null;
}

export function formatNumFa(val: number | null, decimals: number, unit: string): string {
  if (val === null || Number.isNaN(val)) return 'ثبت نشده';
  const formatted = Number(val).toLocaleString('fa-IR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  return unit ? `${formatted} ${unit}` : formatted;
}

export function formatPctFa(pct: number): string {
  const sign = pct > 0 ? '+' : pct < 0 ? '-' : '';
  const formatted = Math.abs(pct).toLocaleString('fa-IR', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
  return `${sign}${formatted}٪`;
}

export interface PeriodAlignmentInfo {
  durationDays: number | null;
  coveragePct: number | null;
  lowCoverage: boolean;
  isActive: boolean;
}

export function getPeriodAlignmentInfo(candidate: ComparisonCandidate): PeriodAlignmentInfo {
  const m = candidate.metric as unknown as Record<string, unknown>;
  const rawDays =
    typeof m.durationDays === 'number' && !Number.isNaN(m.durationDays)
      ? m.durationDays
      : typeof m.ageDays === 'number' && !Number.isNaN(m.ageDays)
      ? m.ageDays
      : null;

  const rawCov =
    typeof m.logCoveragePct === 'number' && !Number.isNaN(m.logCoveragePct)
      ? m.logCoveragePct
      : null;

  return {
    durationDays: rawDays,
    coveragePct: rawCov,
    lowCoverage: rawCov !== null && rawCov < 80,
    isActive: candidate.isActive,
  };
}
