import { describe, it, expect } from 'vitest';
import {
  computeFlockSummary,
  toComparableFlockMetric,
  compareFlockMetrics,
  type FlockArchiveSummary,
} from '../cor/storage/historyArchive';

describe('سناریوهای مقایسه ۲ گله و ۳ گله', () => {
  const flockA: FlockArchiveSummary = {
    flockId: 'flk-1',
    flockName: 'گله ۱ (مرجع ۸۰ روزه)',
    productionType: 'layer',
    firstDate: '2026-01-01',
    lastDate: '2026-03-21',
    archivedAt: 1770000000000,
    durationDays: 80,
    logCount: 72, // 90% coverage
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
  };

  const flockB: FlockArchiveSummary = {
    flockId: 'flk-2',
    flockName: 'گله ۲ (کوتاه ۳۰ روزه با لاگ و مالی ناقص)',
    productionType: 'broiler',
    firstDate: '2026-04-01',
    lastDate: '2026-04-30',
    archivedAt: 1771000000000,
    durationDays: 30,
    logCount: 15, // 50% coverage (< 80%)
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
  };

  const flockC: FlockArchiveSummary = {
    flockId: 'flk-3',
    flockName: 'گله ۳ (بلند ۱۴۵ روزه)',
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
  };

  it('مقایسه ۲ گله (مرجع ۸۰ روزه در برابر گله ۳۰ روزه ناقص)', () => {
    const report = compareFlockMetrics(
      [toComparableFlockMetric(flockA), toComparableFlockMetric(flockB)],
      'flk-1'
    );

    expect(report.totalFlocks).toBe(2);
    expect(report.itemsWithWarningsCount).toBe(1);

    const itemB = report.items.find((i) => i.metric.flockId === 'flk-2')!;
    expect(itemB.deltaDailyNet).toBe(-60000);
    expect(itemB.dataCompleteness.level).toBe('partial');
    expect(itemB.warnings.length).toBeGreaterThan(0);
  });

  it('مقایسه ۳ گله با رده‌های طول دوره متفاوت', () => {
    const report = compareFlockMetrics(
      [
        toComparableFlockMetric(flockA),
        toComparableFlockMetric(flockB),
        toComparableFlockMetric(flockC),
      ],
      'flk-1'
    );

    expect(report.totalFlocks).toBe(3);
    expect(report.durationBucketsPresent).toEqual([
      'medium-cycle',
      'short-cycle',
      'long-cycle',
    ]);
  });

  it('تولید خلاصه از روی لاگ‌های خام با computeFlockSummary', () => {
    const summary = computeFlockSummary(
      'flk-raw',
      [
        { flockId: 'flk-raw', date: '2026-05-01', deathsCount: 2, feedConsumed: 110, eggsCount: 0 } as never,
        { flockId: 'flk-raw', date: '2026-05-02', deathsCount: 1, feedConsumed: 115, eggsCount: 0 } as never,
      ],
      { flockName: 'گله تستی خام' }
    );
    expect(summary.flockId).toBe('flk-raw');
    expect(summary.totalMortality).toBe(3);
    expect(summary.totalFeedKg).toBe(225);
  });
});
