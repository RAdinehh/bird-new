import type { FlockArchiveSummary } from '../cor/storage/historyArchive';
import type { Flock } from '../mod/flk/store';
import type { DailyLog } from '../mod/dlg/store';

export const COMPARISON_UI_COPY = {
  panelTitle: 'مقایسه جامع گله‌های آرشیو‌شده',
  openBtn: 'نمایش مقایسه',
  closeBtn: 'بستن مقایسه',
  baselineLabel: 'گله مرجع (Baseline):',
  minTwoHint: 'برای نمایش گزارش مقایسه، حداقل دو گله را انتخاب کنید.',
  activeTagSuffix: '[فعال]',
  activeWarningSubstring: 'این گله هنوز فعال است',
  completeBadge: 'داده کامل',
  partialBadge: 'داده جزئی',
  minimalBadge: 'داده حداقلی',
} as const;

export const FIXTURE_ARCHIVED_SUMMARIES: FlockArchiveSummary[] = [
  {
    flockId: 'arc-medium-ok',
    flockName: 'گله مرجع ۸۰ روزه',
    productionType: 'layer',
    firstDate: '2026-01-01',
    lastDate: '2026-03-21',
    archivedAt: 1770000000000,
    durationDays: 80,
    logCount: 72,
    totalMortality: 40,
    totalFeedKg: 8000,
    totalEggs: 4800,
    totalBrokenEggs: 96,
    livabilityPct: 96,
    fcr: 1.9,
    epef: 310,
    financialMetrics: {
      recordedCost: 16000000,
      recordedRevenue: 24000000,
      recordedNet: 8000000,
      isComplete: true,
    },
  },
  {
    flockId: 'arc-short-partial',
    flockName: 'گله کوتاه ۳۰ روزه ناقص',
    productionType: 'broiler',
    firstDate: '2026-04-01',
    lastDate: '2026-04-30',
    archivedAt: 1771000000000,
    durationDays: 30,
    logCount: 15,
    totalMortality: 30,
    totalFeedKg: 1800,
    totalEggs: 0,
    totalBrokenEggs: 0,
    livabilityPct: 92.5,
    fcr: 1.75,
    epef: 335,
    financialMetrics: {
      recordedCost: 5000000,
      recordedRevenue: 6200000,
      recordedNet: 1200000,
      isComplete: false,
    },
  },
  {
    flockId: 'arc-long-full',
    flockName: 'گله بلند ۱۴۵ روزه',
    productionType: 'layer',
    firstDate: '2025-08-01',
    lastDate: '2025-12-23',
    archivedAt: 1769000000000,
    durationDays: 145,
    logCount: 130,
    totalMortality: 90,
    totalFeedKg: 15950,
    totalEggs: 10150,
    totalBrokenEggs: 150,
    livabilityPct: 94.5,
    fcr: 2.05,
    epef: 295,
    financialMetrics: {
      recordedCost: 30000000,
      recordedRevenue: 44500000,
      recordedNet: 14500000,
      isComplete: true,
    },
  },
];

export const FIXTURE_ACTIVE_FLOCKS: Partial<Flock>[] = [
  {
    id: 'act-live-1',
    name: 'گله در حال پرورش',
    status: 'active' as Flock['status'],
    breedId: 'ross-308',
    initialCount: 1000,
    startDate: '2026-10-20',
  },
];

export const FIXTURE_ACTIVE_LOGS: Partial<DailyLog>[] = [
  {
    id: 'log-act-1',
    flockId: 'act-live-1',
    date: '2026-10-21',
    deathsCount: 2,
    feedConsumed: 95,
    eggsCount: 0,
  } as unknown as DailyLog,
  {
    id: 'log-act-2',
    flockId: 'act-live-1',
    date: '2026-10-22',
    deathsCount: 1,
    feedConsumed: 105,
    eggsCount: 0,
  } as unknown as DailyLog,
];
