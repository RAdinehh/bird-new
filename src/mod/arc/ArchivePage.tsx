import { useState, useMemo, useEffect } from 'react';
import { useFlk, getAgeDays, calcCosts, formatAge, SOURCE_LABEL, type Flock } from '../flk/store';
import { useBrd } from '../brd/store';
import { useHal } from '../hal/store';
import { Btn, Empty, PageContainer, Tag, Row, TabButton } from '../../shr/components/ui';
import FlockComparisonPanel, { type ComparisonCandidate } from './FlockComparisonPanel';
import ExpandableCard from '../../shr/components/ExpandableCard';
import { toFa } from '../../shr/utils/fa';
import { formatJalali } from '../../shr/date/jalali';
import { toastMsg } from '../../cor/store/toast';
import { showConfirmAsync } from '../../cor/store/dialog';
import { useFilterSort, FilterBar, getArcArchiveConfig, getArcLogsConfig, getArcStoresConfig, type ArcStoreEntry } from '../../shr/filter';
import { useDlg, type DailyLog } from '../dlg/store';
import { useWhs } from '../whs/store';
import { restoreTraInvoices } from '../tra/store';
import { restoreIncBatches } from '../inc/store';
import {
  listArchived,
  listFlockSummaries,
  classifyDurationBucket,
  toComparableFlockMetric,
  compareFlockMetrics,
  ARCHIVE_STORES,
  type ArchiveRecord,
  type FlockArchiveSummary,
  type ComparableFlockMetric,
  type ComparableFinancialSnapshot,
  type FlockDurationBucket,
} from '../../cor/storage/historyArchive';

type Kind = 'flocks' | 'logs' | 'stores';

interface StoreArchiveEntry {
  storeKey: 'flk' | 'tra' | 'whs' | 'inc';
  storeLabel: string;
  record: ArchiveRecord;
}

function formatArchiveIsoLabel(val: unknown): string {
  if (typeof val !== 'string' || !val.trim()) return '';
  const d = new Date(val);
  if (Number.isNaN(d.getTime())) return val;
  try {
    const datePart = d.toLocaleDateString('fa-IR');
    const timePart = d.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });
    return `${formatArchiveIsoLabel(datePart) || toFa(datePart)} • ${toFa(timePart)}`;
  } catch {
    return val.slice(0, 10);
  }
}

export default function ArchivePage() {
  const { flocks, restore, remove } = useFlk();
  const { birds, breeds } = useBrd();
  const { halls } = useHal();
  const { restoreMovements } = useWhs();

  const [kind, setKind] = useState<Kind>('flocks');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [arcTick, setArcTick] = useState(0);

  // ── تب دفتر روزانه: بارگذاری از pm-archive
  const { restoreArchived, restoreFlockLogs, logs: hotLogs } = useDlg();
  const [arcLogs, setArcLogs] = useState<ArchiveRecord[]>([]);
  const [arcLoading, setArcLoading] = useState(false);

  // ── تب سایر مخازن: tra_invoices / whs_moves / inc_batches
  const [storeEntries, setStoreEntries] = useState<StoreArchiveEntry[]>([]);
  const [storesLoading, setStoresLoading] = useState(false);
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [storeFilter, setStoreFilter] = useState<'all' | StoreArchiveEntry['storeKey']>('all');

  // ── خلاصه‌های سرد و گزارش مقایسه چندگله
  const [flockSummaries, setFlockSummaries] = useState<FlockArchiveSummary[]>([]);
  const [selectedCompareIds, setSelectedCompareIds] = useState<string[]>([]);
  const [baselineFlockId, setBaselineFlockId] = useState<string>('');
  const [showComparison, setShowComparison] = useState<boolean>(false);
  const [sampleCompareFlocks, setSampleCompareFlocks] = useState<
    Array<{ id: string; label: string; metric: ComparableFlockMetric; isActive: boolean }>
  >([]);
  const [sampleNotice, setSampleNotice] = useState<string | null>(null);

  useEffect(() => {
    if (kind !== 'flocks') return;
    let alive = true;
    listFlockSummaries()
      .then((rows) => {
        if (!alive) return;
        setFlockSummaries(rows);
        setSelectedCompareIds((prev) => {
          if (prev.length > 0) return prev.filter((id) => rows.some((r) => r.flockId === id));
          return rows.map((r) => r.flockId);
        });
        setBaselineFlockId((prev) => {
          if (prev && rows.some((r) => r.flockId === prev)) return prev;
          return rows[0]?.flockId ?? '';
        });
      })
      .catch((e) => console.error('[ArchivePage] listFlockSummaries failed:', e));
    return () => {
      alive = false;
    };
  }, [kind, arcTick]);

  const activeFlocksRaw = useMemo(
    () => flocks.filter((f) => f.status !== 'archived' && f.status !== 'sold'),
    [flocks]
  );

  const activeComparableMap = useMemo(() => {
    const map = new Map<string, { metric: ComparableFlockMetric; isActiveFlock: boolean }>();
    for (const f of activeFlocksRaw) {
      const fLogs = hotLogs.filter((l) => l.flockId === f.id);
      const sortedDates = fLogs
        .map((l) => l.date)
        .filter((d): d is string => Boolean(d))
        .sort();
      const firstDate = sortedDates[0] ?? null;
      const lastDate = sortedDates[sortedDates.length - 1] ?? null;

      const rawAge = typeof getAgeDays === 'function' ? getAgeDays(f) : null;
      const days =
        typeof rawAge === 'number' && Number.isFinite(rawAge) && rawAge > 0
          ? rawAge
          : fLogs.length > 0
            ? fLogs.length
            : null;

      const totalMortality = fLogs.reduce(
        (acc, l) => acc + (Number((l as { deathsCount?: number }).deathsCount) || 0),
        0
      );
      const totalFeedKg = fLogs.reduce(
        (acc, l) => acc + (Number((l as { feedConsumed?: number }).feedConsumed) || 0),
        0
      );
      const totalEggs = fLogs.reduce(
        (acc, l) => acc + (Number((l as { eggsCount?: number }).eggsCount) || 0),
        0
      );
      const totalBrokenEggs = fLogs.reduce(
        (acc, l) => acc + (Number((l as { brokenEggsCount?: number }).brokenEggsCount) || 0),
        0
      );

      const logCoveragePct =
        days && days > 0 ? Number(Math.min(100, (fLogs.length / days) * 100).toFixed(1)) : null;

      const dailyMortalityRate =
        days && days > 0 ? Number((totalMortality / days).toFixed(3)) : null;
      const dailyFeedKg =
        days && days > 0 ? Number((totalFeedKg / days).toFixed(3)) : null;
      const dailyEggs =
        days && days > 0 && totalEggs > 0 ? Number((totalEggs / days).toFixed(2)) : null;
      const brokenEggRatePct =
        totalEggs > 0
          ? Number(Math.min(100, Math.max(0, (totalBrokenEggs / totalEggs) * 100)).toFixed(2))
          : null;
      const feedKgPerEgg =
        totalEggs > 0 && totalFeedKg > 0 ? Number((totalFeedKg / totalEggs).toFixed(4)) : null;

      const costs = typeof calcCosts === 'function' ? calcCosts(f) : null;
      const financial =
        costs && typeof costs === 'object'
          ? {
              recordedCost: Number((costs as { totalCost?: number }).totalCost) || 0,
              recordedRevenue: Number((costs as { totalRevenue?: number }).totalRevenue) || 0,
              recordedNet: Number((costs as { netProfit?: number }).netProfit) || 0,
              dailyNet:
                days && days > 0
                  ? Number(((Number((costs as { netProfit?: number }).netProfit) || 0) / days).toFixed(2))
                  : null,
              isComplete: false,
            }
          : null;

      const metric: ComparableFlockMetric = {
        flockId: f.id,
        flockName: `${f.name || f.id} [فعال]`,
        breedName: f.breedId,
        productionType: (f as { productionType?: FlockArchiveSummary['productionType'] }).productionType,
        source: 'cold-summary',
        firstDate,
        lastDate,
        archivedAt: 0,
        durationDays: days,
        durationBucket: classifyDurationBucket(days) as FlockDurationBucket,
        logCount: fLogs.length,
        logCoveragePct,
        totalMortality,
        totalFeedKg,
        totalEggs,
        totalBrokenEggs,
        livabilityPct: null,
        fcr: null,
        epef: null,
        dailyMortalityRate,
        dailyFeedKg,
        dailyEggs,
        brokenEggRatePct,
        feedKgPerEgg,
        financial,
        dataAvailability: {
          hasMortality: totalMortality > 0,
          hasFeed: totalFeedKg > 0,
          hasEggs: totalEggs > 0,
          hasFinancial: financial !== null,
          hasPerformanceIndices: false,
        },
      };

      map.set(f.id, { metric, isActiveFlock: true });
    }
    return map;
  }, [activeFlocksRaw, hotLogs]);

  const buildSampleComparisonSet = () => {
    const now = Date.now();
    const makeFin = (
      cost: number,
      rev: number,
      days: number
    ): ComparableFinancialSnapshot => {
      const net = rev - cost;
      return {
        recordedCost: cost,
        recordedRevenue: rev,
        recordedNet: net,
        dailyNet: days > 0 ? net / days : null,
        isComplete: true,
      };
    };

    const g1: ComparableFlockMetric = {
      flockId: '__demo_flock_1__',
      flockName: 'سالن A-۱۰۱ (مرجع)',
      breedName: 'های‌لاین W-36',
      productionType: 'layer' as ComparableFlockMetric['productionType'],
      source: 'cold-summary',
      firstDate: '1404/06/01',
      lastDate: '1404/07/30',
      archivedAt: now - 86400000 * 10,
      durationDays: 60,
      durationBucket: 'medium-cycle',
      logCount: 60,
      logCoveragePct: 100,
      totalMortality: 120,
      totalFeedKg: 14400,
      totalEggs: 48000,
      totalBrokenEggs: 480,
      livabilityPct: 97.6,
      fcr: 1.72,
      epef: null,
      dailyMortalityRate: 2.0,
      dailyFeedKg: 240,
      dailyEggs: 800,
      brokenEggRatePct: 1.0,
      feedKgPerEgg: 0.3,
      financial: makeFin(960000000, 1290000000, 60),
      dataAvailability: {
        hasMortality: true,
        hasFeed: true,
        hasEggs: true,
        hasFinancial: true,
        hasPerformanceIndices: true,
      },
    };

    const g2: ComparableFlockMetric = {
      flockId: '__demo_flock_2__',
      flockName: 'سالن B-۱۰۲ (کارآمدتر)',
      breedName: 'های‌لاین W-36',
      productionType: 'layer' as ComparableFlockMetric['productionType'],
      source: 'cold-summary',
      firstDate: '1404/07/01',
      lastDate: '1404/08/28',
      archivedAt: now - 86400000 * 5,
      durationDays: 58,
      durationBucket: 'medium-cycle',
      logCount: 58,
      logCoveragePct: 100,
      totalMortality: 75,
      totalFeedKg: 13050,
      totalEggs: 48720,
      totalBrokenEggs: 340,
      livabilityPct: 98.5,
      fcr: 1.61,
      epef: null,
      dailyMortalityRate: 1.29,
      dailyFeedKg: 225,
      dailyEggs: 840,
      brokenEggRatePct: 0.7,
      feedKgPerEgg: 0.268,
      financial: makeFin(910000000, 1345000000, 58),
      dataAvailability: {
        hasMortality: true,
        hasFeed: true,
        hasEggs: true,
        hasFinancial: true,
        hasPerformanceIndices: true,
      },
    };

    const g3: ComparableFlockMetric = {
      flockId: '__demo_flock_3__',
      flockName: 'سالن C-۱۰۳ (پرمصرف)',
      breedName: 'لوهمن LSL',
      productionType: 'layer' as ComparableFlockMetric['productionType'],
      source: 'cold-summary',
      firstDate: '1404/05/10',
      lastDate: '1404/07/10',
      archivedAt: now - 86400000 * 15,
      durationDays: 62,
      durationBucket: 'medium-cycle',
      logCount: 60,
      logCoveragePct: 96.8,
      totalMortality: 210,
      totalFeedKg: 16430,
      totalEggs: 45260,
      totalBrokenEggs: 905,
      livabilityPct: 95.8,
      fcr: 1.89,
      epef: null,
      dailyMortalityRate: 3.39,
      dailyFeedKg: 265,
      dailyEggs: 730,
      brokenEggRatePct: 2.0,
      feedKgPerEgg: 0.363,
      financial: makeFin(1080000000, 1210000000, 62),
      dataAvailability: {
        hasMortality: true,
        hasFeed: true,
        hasEggs: true,
        hasFinancial: true,
        hasPerformanceIndices: true,
      },
    };

    const g4Active: ComparableFlockMetric = {
      flockId: '__demo_flock_4_active__',
      flockName: 'سالن D-۱۰۴ (فعال)',
      breedName: 'راس ۳۰۸',
      productionType: 'broiler' as ComparableFlockMetric['productionType'],
      source: 'cold-summary',
      firstDate: '1404/08/10',
      lastDate: '1404/09/03',
      archivedAt: 0,
      durationDays: 24,
      durationBucket: 'short-cycle',
      logCount: 24,
      logCoveragePct: 100,
      totalMortality: 42,
      totalFeedKg: 4920,
      totalEggs: 0,
      totalBrokenEggs: 0,
      livabilityPct: 98.2,
      fcr: 1.54,
      epef: 335,
      dailyMortalityRate: 1.75,
      dailyFeedKg: 205,
      dailyEggs: 0,
      brokenEggRatePct: null,
      feedKgPerEgg: null,
      financial: makeFin(310000000, 420000000, 24),
      dataAvailability: {
        hasMortality: true,
        hasFeed: true,
        hasEggs: false,
        hasFinancial: true,
        hasPerformanceIndices: true,
      },
    };

    return [
      { id: g1.flockId, label: `${g1.flockName} (آرشیو • ۶۰ روز)`, metric: g1, isActive: false },
      { id: g2.flockId, label: `${g2.flockName} (آرشیو • ۵۸ روز)`, metric: g2, isActive: false },
      { id: g3.flockId, label: `${g3.flockName} (آرشیو • ۶۲ روز)`, metric: g3, isActive: false },
      { id: g4Active.flockId, label: `${g4Active.flockName} (۲۴ روز)`, metric: g4Active, isActive: true },
    ];
  };

  const handleLoadSampleComparison = () => {
    const items = buildSampleComparisonSet();
    setSampleCompareFlocks(items);
    setSelectedCompareIds(items.map((x) => x.id));
    setBaselineFlockId(items[0].id);
    setSampleNotice('۴ گلهٔ نمونه برای تست مقایسه بارگذاری شد (فقط در حافظهٔ نمایشی — بدون تغییر در دیتای واقعی).');
  };

  const handleClearSampleComparison = () => {
    const sampleIds = new Set(sampleCompareFlocks.map((x) => x.id));
    setSampleCompareFlocks([]);
    setSelectedCompareIds((prev) => prev.filter((id) => !sampleIds.has(id)));
    setBaselineFlockId((prev) => (sampleIds.has(prev) ? '' : prev));
    setSampleNotice('داده‌های نمونهٔ مقایسه از حافظه پاک شدند.');
  };

  const allComparableCandidates = useMemo(() => {
    const archivedEntries = flockSummaries.map((s) => ({
      id: s.flockId,
      label: `${s.flockName || s.flockId} (آرشیو • ${toFa(s.durationDays ?? s.logCount)} روز)`,
      metric: toComparableFlockMetric(s),
      isActive: false,
    }));
    const activeEntries = Array.from(activeComparableMap.values()).map(({ metric }) => ({
      id: metric.flockId,
      label: `${metric.flockName} (${toFa(metric.durationDays ?? metric.logCount)} روز)`,
      metric,
      isActive: true,
    }));
    return [...sampleCompareFlocks, ...archivedEntries, ...activeEntries];
  }, [flockSummaries, activeComparableMap, sampleCompareFlocks]);

  const comparableMetrics: ComparableFlockMetric[] = useMemo(() => {
    const activeIds = new Set(
      selectedCompareIds.length > 0
        ? selectedCompareIds
        : allComparableCandidates.map((c) => c.id)
    );
    return allComparableCandidates
      .filter((c) => activeIds.has(c.id))
      .map((c) => {
        if (!c.isActive) return c.metric;
        return {
          ...c.metric,
        };
      });
  }, [allComparableCandidates, selectedCompareIds]);

  const comparisonReport = useMemo(() => {
    if (comparableMetrics.length < 2) return null;
    return compareFlockMetrics(comparableMetrics, baselineFlockId || undefined);
  }, [comparableMetrics, baselineFlockId]);

  const toggleCompareFlock = (flockId: string) => {
    setSelectedCompareIds((prev) => {
      if (prev.includes(flockId)) {
        return prev.filter((id) => id !== flockId);
      }
      return [...prev, flockId];
    });
  };

  useEffect(() => {
    if (kind !== 'logs') return;
    let alive = true;
    setArcLoading(true);
    listArchived(undefined, ARCHIVE_STORES.dlg)
      .then(rows => { if (alive) setArcLogs(rows); })
      .catch(e => console.error('[ArchivePage] listArchived failed:', e))
      .finally(() => { if (alive) setArcLoading(false); });
    return () => { alive = false; };
  }, [kind, arcTick]);

  useEffect(() => {
    if (kind !== 'stores') return;
    let alive = true;
    setStoresLoading(true);
    Promise.all([
      listArchived(undefined, ARCHIVE_STORES.flk).then(rows =>
        rows.map(record => ({ storeKey: 'flk' as const, storeLabel: 'گله‌های بسته', record }))
      ),
      listArchived(undefined, ARCHIVE_STORES.tra).then(rows =>
        rows.map(record => ({ storeKey: 'tra' as const, storeLabel: 'معاملات', record }))
      ),
      listArchived(undefined, ARCHIVE_STORES.whs).then(rows =>
        rows.map(record => ({ storeKey: 'whs' as const, storeLabel: 'انبار', record }))
      ),
      listArchived(undefined, ARCHIVE_STORES.inc).then(rows =>
        rows.map(record => ({ storeKey: 'inc' as const, storeLabel: 'جوجه‌کشی', record }))
      ),
    ])
      .then(([flkRows, traRows, whsRows, incRows]) => {
        if (!alive) return;
        const combined = [...flkRows, ...traRows, ...whsRows, ...incRows].sort(
          (a, b) => (b.record.archivedAt || 0) - (a.record.archivedAt || 0)
        );
        setStoreEntries(combined);
      })
      .catch(e => console.error('[ArchivePage] store archives load failed:', e))
      .finally(() => { if (alive) setStoresLoading(false); });
    return () => { alive = false; };
  }, [kind, arcTick]);

  // مرحله ۱: pre-filter آرشیو
  const archivedRaw = useMemo(
    () => flocks.filter(f => f.status === 'archived' || f.status === 'sold'),
    [flocks]
  );

  // مرحله ۲: FilterBar
  const config = useMemo(
    () => getArcArchiveConfig({
      birds: birds.map(b => ({ id: b.id, name: b.name })),
      halls: halls.map(h => ({ id: h.id, name: h.name })),
    }),
    [birds, halls]
  );
  const { filtered: archivedFlocks, filters, setFilter, clearFilter, sort, setSort, toggleSort,
          resetAll, hasActiveFilters, total: totalFiltered, count } = useFilterSort<Flock>({
    items: archivedRaw,
    filters: config.filterDefs,
    sorts: config.sortDefs,
    persistKey: config.persistKey,
    initialSort: config.initialSort,
  });

  const logsConfig = useMemo(
    () => getArcLogsConfig({ flocks: flocks.map(f => ({ id: f.id, name: f.name })) }),
    [flocks]
  );
  const logsFilterSort = useFilterSort<ArchiveRecord>({
    items: arcLogs,
    filters: logsConfig.filterDefs,
    sorts: logsConfig.sortDefs,
    persistKey: logsConfig.persistKey,
    initialSort: logsConfig.initialSort,
  });

  const storesConfig = useMemo(() => getArcStoresConfig(), []);
  const storesFilterSort = useFilterSort<ArcStoreEntry>({
    items: storeEntries,
    filters: storesConfig.filterDefs,
    sorts: storesConfig.sortDefs,
    persistKey: storesConfig.persistKey,
    initialSort: storesConfig.initialSort,
  });

  const handleRestoreStoreEntry = async (entry: StoreArchiveEntry) => {
    setRestoringId(entry.record.id);
    try {
      let countRestored = 0;
      if (entry.storeKey === 'flk') {
                    await restore(entry.record.id);
                    countRestored = 1;
                  } else if (entry.storeKey === 'tra') {
                    countRestored = await restoreTraInvoices([entry.record.id]);
                  } else if (entry.storeKey === 'whs') {
                    countRestored = await restoreMovements([entry.record.id]);
                  } else if (entry.storeKey === 'inc') {
                    countRestored = await restoreIncBatches([entry.record.id]);
                  }
      if (countRestored > 0) {
        toastMsg.saved(`آیتم «${entry.storeLabel}» بازیابی شد`);
        setArcTick(t => t + 1);
      }
    } finally {
      setRestoringId(null);
    }
  };

  const statLabel =
    kind === 'flocks'
      ? 'گلهٔ آرشیو‌شده'
      : kind === 'logs'
      ? 'ثبت آرشیو‌شده'
      : 'رکورد سایر مخازن';

  const statValue =
    kind === 'flocks'
      ? archivedFlocks.length
      : kind === 'logs'
      ? logsFilterSort.filtered.length
      : storesFilterSort.filtered.length;

  return (
    <PageContainer>
      <div style={{
        display: 'flex', gap: 4, padding: 4,
        background: 'var(--input-bg)', borderRadius: 'var(--r-md)',
        border: '1px solid var(--border)',
      }}>
        <TabButton active={kind === 'flocks'} onClick={() => { setKind('flocks'); setExpandedId(null); }}>
          🗄 گله‌ها
        </TabButton>
        <TabButton active={kind === 'logs'} onClick={() => { setKind('logs'); setExpandedId(null); }}>
          📒 دفتر روزانه
        </TabButton>
        <TabButton active={kind === 'stores'} onClick={() => { setKind('stores'); setExpandedId(null); }}>
          📦 سایر مخازن
        </TabButton>
      </div>

      {/* آمار کلی جمع‌وجور */}
      <div style={{
        padding: '10px 14px',
        background: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--r-md)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          <span style={{ fontSize: 18, lineHeight: 1, flexShrink: 0 }}>
            {kind === 'flocks' ? '🗄' : kind === 'logs' ? '📒' : '📦'}
          </span>
          <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', fontWeight: 600 }}>
            {statLabel}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          {kind === 'logs' && arcLogs.length > 0 && (
            <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)' }}>
              در {toFa(new Set(arcLogs.map(r => r.flockId || '—')).size)} گله
            </span>
          )}
          {kind === 'stores' && storeEntries.length > 0 && (
            <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)' }}>
              {toFa(new Set(storeEntries.map(e => e.storeKey)).size)} مخزن فعال
            </span>
          )}
          <span style={{ fontSize: 'var(--fs-lg)', fontWeight: 800, color: 'var(--text)' }}>
            {toFa(statValue)}
          </span>
        </div>
      </div>

      {kind === 'flocks' && <FilterBar
        filterDefs={config.filterDefs}
        sortDefs={config.sortDefs}
        filterState={filters}
        sortState={sort}
        setFilter={setFilter}
        clearFilter={clearFilter}
        setSort={setSort}
        toggleSort={toggleSort}
        resetAll={resetAll}
        hasActiveFilters={hasActiveFilters}
        total={totalFiltered}
        count={count}
      />}

      {kind === 'logs' && (
        <FilterBar
          filterDefs={logsConfig.filterDefs}
          sortDefs={logsConfig.sortDefs}
          filterState={logsFilterSort.filters}
          sortState={logsFilterSort.sort}
          setFilter={logsFilterSort.setFilter}
          clearFilter={logsFilterSort.clearFilter}
          setSort={logsFilterSort.setSort}
          toggleSort={logsFilterSort.toggleSort}
          resetAll={logsFilterSort.resetAll}
          hasActiveFilters={logsFilterSort.hasActiveFilters}
          total={logsFilterSort.total}
          count={logsFilterSort.count}
        />
      )}

      {kind === 'stores' && (
        <FilterBar
          filterDefs={storesConfig.filterDefs}
          sortDefs={storesConfig.sortDefs}
          filterState={storesFilterSort.filters}
          sortState={storesFilterSort.sort}
          setFilter={storesFilterSort.setFilter}
          clearFilter={storesFilterSort.clearFilter}
          setSort={storesFilterSort.setSort}
          toggleSort={storesFilterSort.toggleSort}
          resetAll={storesFilterSort.resetAll}
          hasActiveFilters={storesFilterSort.hasActiveFilters}
          total={storesFilterSort.total}
          count={storesFilterSort.count}
        />
      )}

      {kind === 'logs' ? (
        <LogsArchiveTab
          rows={logsFilterSort.filtered}
          loading={arcLoading}
          hotLogs={hotLogs}
          onRestoreOne={async (id) => {
            await restoreArchived(id);
            setArcTick(t => t + 1);
          }}
          onRestoreFlock={async (flockId) => {
            await restoreFlockLogs(flockId);
            setArcTick(t => t + 1);
          }}
        />
      ) : kind === 'stores' ? (
                storesLoading ? (
                  <div style={{ padding: 24, textAlign: 'center', color: 'var(--muted)', fontSize: 'var(--fs-sm)' }}>در حال بارگذاری…</div>
                ) : storeEntries.length === 0 ? (
                  <Empty
                    icon={<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><path d="M21 8v13H3V8M1 3h22v5H1zM10 12h4"/></svg>}
                    title="مخزن سرد دیگری خالی است"
                    desc="رکوردهای آرشیو‌شدهٔ معاملات، انبار، جوجه‌کشی و گله‌های بسته این‌جا نمایش داده می‌شوند."
                  />
                ) : (() => {
                  const countsByStore = storeEntries.reduce<Record<string, number>>((acc, item) => {
                    acc[item.storeKey] = (acc[item.storeKey] || 0) + 1;
                    return acc;
                  }, {});
                  const availableStoreKeys = (['flk', 'tra', 'whs', 'inc'] as const).filter(k => (countsByStore[k] || 0) > 0);
                  const activeStoreKey = storeFilter !== 'all' && availableStoreKeys.includes(storeFilter) ? storeFilter : 'all';
                  const baseStoreEntries = storesFilterSort.filtered;
                  const visibleEntries = activeStoreKey === 'all'
                    ? baseStoreEntries
                    : baseStoreEntries.filter(item => item.storeKey === activeStoreKey);

                  const describeEntry = (entry: StoreArchiveEntry): string => {
                    const raw = (entry.record?.log || {}) as unknown as Record<string, unknown>;
                    if (entry.storeKey === 'flk') {
                      const name = typeof raw.name === 'string' && raw.name.trim() ? raw.name.trim() : entry.record.id;
                      const count = Number(raw.currentCount ?? raw.initialCount ?? 0);
                      return count > 0 ? `${name} • ${toFa(count)} قطعه` : name;
                    }
                    if (entry.storeKey === 'tra') {
                      const title = typeof raw.title === 'string' && raw.title.trim()
                        ? raw.title.trim()
                        : typeof raw.description === 'string' && raw.description.trim()
                          ? raw.description.trim()
                          : entry.record.id;
                      const amt = Number(raw.amount ?? raw.total ?? 0);
                      return amt > 0 ? `${title} • ${toFa(Math.round(amt).toLocaleString('fa-IR'))} ت` : title;
                    }
                    if (entry.storeKey === 'whs') {
                      const itemName = typeof raw.itemName === 'string' && raw.itemName.trim()
                        ? raw.itemName.trim()
                        : typeof raw.name === 'string' && raw.name.trim()
                          ? raw.name.trim()
                          : entry.record.id;
                      const qty = Number(raw.qty ?? raw.quantity ?? raw.weightKg ?? 0);
                      return qty > 0 ? `${itemName} • ${toFa(qty)}` : itemName;
                    }
                    const batchTitle = typeof raw.title === 'string' && raw.title.trim()
                      ? raw.title.trim()
                      : typeof raw.batchCode === 'string' && raw.batchCode.trim()
                        ? `دسته ${raw.batchCode.trim()}`
                        : entry.record.id;
                    const eggs = Number(raw.eggsCount ?? raw.count ?? 0);
                    return eggs > 0 ? `${batchTitle} • ${toFa(eggs)} تخم` : batchTitle;
                  };

                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {availableStoreKeys.length > 1 && (
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          <Btn
                            size="sm"
                            variant={activeStoreKey === 'all' ? 'primary' : 'ghost'}
                            onClick={() => setStoreFilter('all')}
                          >
                            همه ({toFa(storeEntries.length)})
                          </Btn>
                          {availableStoreKeys.map(k => {
                            const label = storeEntries.find(x => x.storeKey === k)?.storeLabel || k;
                            return (
                              <Btn
                                key={k}
                                size="sm"
                                variant={activeStoreKey === k ? 'primary' : 'ghost'}
                                onClick={() => setStoreFilter(k)}
                              >
                                {label} ({toFa(countsByStore[k] || 0)})
                              </Btn>
                            );
                          })}
                        </div>
                      )}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {visibleEntries.map((entry) => {
                          const { storeKey, storeLabel, record } = entry;
                          const isBusy = restoringId === record.id;
                          return (
                            <div
                              key={`${storeKey}-${record.id}`}
                              style={{
                                background: 'var(--card)',
                                border: '1px solid var(--border)',
                                borderRadius: 'var(--r-lg)',
                                padding: '12px 14px',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                gap: 8,
                              }}
                            >
                              <div style={{ minWidth: 0 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                                  <Tag tone="gray">{storeLabel}</Tag>
                                  <span style={{ fontWeight: 700, fontSize: 'var(--fs-sm)', color: 'var(--text)' }}>
                                    {toFa(describeEntry(entry))}
                                  </span>
                                </div>
                                <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', marginTop: 4 }}>
                                  شناسه: {toFa(record.id)} • مرجع: {toFa(record.flockId || '—')} • تاریخ: {formatArchiveIsoLabel(record.date || '—') || toFa(record.date || '—')}
                                </div>
                              </div>
                              <Btn
                                disabled={isBusy}
                                onClick={() => handleRestoreStoreEntry(entry)}
                              >
                                {isBusy ? '…' : 'بازگردانی'}
                              </Btn>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()
      ) : (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginBottom: 12, alignItems: 'center' }}>
            <span className="muted" style={{ fontSize: 12 }}>
              {sampleNotice
                ? sampleNotice
                : sampleCompareFlocks.length > 0
                  ? `حالت تست بصری فعال است (${toFa(sampleCompareFlocks.length)} گلهٔ نمونه در حافظه — بدون تغییر در دیتای واقعی).`
                  : 'برای تست بصری مقایسه با داده‌های متنوع، می‌توانید مجموعهٔ نمونه را بارگذاری کنید.'}
            </span>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <Btn size="sm" variant="ghost" onClick={handleLoadSampleComparison}>
                بارگذاری ۴ گله نمونه (تست)
              </Btn>
              {sampleCompareFlocks.length > 0 && (
                <Btn size="sm" variant="ghost" onClick={handleClearSampleComparison}>
                  پاک‌سازی نمونه
                </Btn>
              )}
            </div>
          </div>
          {allComparableCandidates.length >= 2 && (
            <FlockComparisonPanel
                candidates={allComparableCandidates as ComparisonCandidate[]}
                selectedIds={selectedCompareIds}
                onToggleFlock={toggleCompareFlock}
                onSelectPreset={(ids, baseId) => {
                  const nextIds = Array.from(new Set(ids)).slice(0, 4);
                  setSelectedCompareIds(nextIds);
                  if (baseId && nextIds.includes(baseId)) {
                    setBaselineFlockId(baseId);
                  } else if (nextIds[0]) {
                    setBaselineFlockId(nextIds[0]);
                  }
                }}
                baselineId={baselineFlockId}
                onChangeBaseline={setBaselineFlockId}
                activeFlockIds={new Set([
                  ...Array.from(activeComparableMap.keys()),
                  ...sampleCompareFlocks.filter((x) => x.isActive).map((x) => x.id),
                ])}
              />
          )}
          {archivedFlocks.length === 0 && sampleCompareFlocks.length === 0 && (
            <Empty
              icon={<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><path d="M21 8v13H3V8M1 3h22v5H1zM10 12h4"/></svg>}
              title="آرشیو خالی است"
              desc="آیتم‌هایی که آرشیو می‌کنید این‌جا نمایش داده می‌شوند یا با دکمهٔ بالا ۴ گلهٔ نمونه بسازید."
            />
          )}
          {archivedFlocks.map((f, i) => {
            const bird = birds.find(b => b.id === f.birdId);
            const breed = breeds.find(b => b.id === f.breedId);
            const hall = halls.find(h => h.id === f.hallId);
            const ageDays = getAgeDays(f);
            const costs = calcCosts(f);
            const isOpen = expandedId === f.id;
            const statusLabel = f.status === 'sold' ? 'فروخته‌شده' : 'آرشیو';

            return (
              <ExpandableCard
                key={f.id}
                accent="dim"
                index={toFa(i + 1)}
                iconEmoji="🗄"
                title={f.name}
                subtitle={(bird?.name || '—') + (breed ? ' • ' + breed.name : '') + (hall ? ' • ' + hall.name : '')}
                isOpen={isOpen}
                onToggle={() => setExpandedId(isOpen ? null : f.id)}
                badge={<Tag tone={f.status === 'sold' ? 'green' : 'gray'}>{statusLabel}</Tag>}
                stats={
                  <>
                    <span>سن نهایی: <b style={{ color: 'var(--text)' }}>{toFa(ageDays)} روز</b></span>
                    {f.currentCount ? <span>تعداد: <b style={{ color: 'var(--text)' }}>{toFa(f.currentCount)}</b></span> : null}
                    {f.updatedAt ? <span>آرشیو: <b style={{ color: 'var(--text)' }}>{formatArchiveIsoLabel(f.updatedAt.slice(0, 10)) || toFa(f.updatedAt.slice(0, 10))}</b></span> : null}
                  </>
                }
              >
                <SectionTitle><span style={{ fontSize: '1.05em', lineHeight: 1, display: 'inline-block', marginLeft: 4 }}>📋</span> اطلاعات گله</SectionTitle>
                <Row l="پرنده" v={bird?.name || '—'} />
                <Row l="نژاد" v={breed?.name || '—'} />
                <Row l="سالن" v={hall?.name || '—'} />
                <Row l="نوع" v={f.type === 'layer' ? 'تخم‌گذار' : f.type === 'broiler' ? 'گوشتی' : 'مادر'} />
                <Row l="منبع" v={SOURCE_LABEL[f.source] || '—'} />
                <Row l="تعداد اولیه" v={f.initialCount ? toFa(f.initialCount) : '—'} />
                {f.currentCount ? <Row l="تعداد نهایی" v={toFa(f.currentCount)} /> : null}
                <Row l="سن نهایی" v={toFa(ageDays) + ' روز (' + formatAge(ageDays) + ')'} />

                <SectionTitle><span style={{ fontSize: '1.05em', lineHeight: 1, display: 'inline-block', marginLeft: 4 }}>📅</span> تاریخ‌ها</SectionTitle>
                {f.hatchDate ? <Row l="هچ" v={toFa(f.hatchDate)} /> : null}
                {f.purchaseDate ? <Row l="خرید" v={toFa(f.purchaseDate)} /> : null}
                {f.startDate ? <Row l="شروع" v={toFa(f.startDate)} /> : null}

                {costs.total > 0 ? (
                  <>
                    <SectionTitle><span style={{ fontSize: '1.05em', lineHeight: 1, display: 'inline-block', marginLeft: 4 }}>💰</span> هزینه‌ها</SectionTitle>
                    <Row l="جمع کل" v={toFa(costs.total.toLocaleString('fa-IR')) + ' ت'} />
                    {costs.perBird > 0 ? <Row l="هر پرنده" v={toFa(Math.round(costs.perBird).toLocaleString('fa-IR')) + ' ت'} /> : null}
                  </>
                ) : null}

                {f.notes ? (
                  <>
                    <SectionTitle><span style={{ fontSize: '1.05em', lineHeight: 1, display: 'inline-block', marginLeft: 4 }}>📝</span> یادداشت</SectionTitle>
                    <div style={{ fontSize: 'var(--fs-sm)', lineHeight: 1.7, padding: 'var(--pad-normal)', background: 'var(--input-bg)', borderRadius: 'var(--r-sm)' }}>{f.notes}</div>
                  </>
                ) : null}

                <div style={{ display: 'flex', gap: 6, paddingTop: 4 }}>
                  <Btn size="sm" onClick={async () => { await restore(f.id); setExpandedId(null); setArcTick(t => t + 1); toastMsg.saved('گله بازیابی شد'); }} style={{ flex: 1 }}>🔄 بازیابی</Btn>
                  <Btn size="sm" onClick={async () => {
                          const ok = await showConfirmAsync('حذف نهایی گله', 'حذف کامل «' + f.name + '»؟\n\nاین عمل قابل بازگشت نیست. برای همیشه پاک می‌شود.', { danger: true, confirmText: 'حذف کن' });
                          if (!ok) return;
                          remove(f.id);
                          toastMsg.deleted('گله')
                        }} style={{ flex: 1 }}>🗑 حذف نهایی</Btn>
                </div>
              </ExpandableCard>
            );
          })}
        </>
      )}
    </PageContainer>
  );
}

// ═══ تب دفتر روزانهٔ آرشیو‌شده ═══
const REASON_LABEL: Record<string, string> = {
  age: 'قدیمی',
  'flock-closed': 'بستن گله',
  'count-threshold': 'حد تعداد',
  ancient: 'خیلی قدیمی',
};

function LogsArchiveTab({
  rows, loading, hotLogs, onRestoreOne, onRestoreFlock,
}: {
  rows: ArchiveRecord[];
  loading: boolean;
  hotLogs: DailyLog[];
  onRestoreOne: (id: string) => Promise<void>;
  onRestoreFlock: (flockId: string) => Promise<void>;
}) {
  const { flocks } = useFlk();
  const [busy, setBusy] = useState<string | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  const groups = useMemo(() => {
    const m = new Map<string, ArchiveRecord[]>();
    for (const r of rows) {
      const k = r.flockId || '—';
      if (!m.has(k)) m.set(k, []);
      m.get(k)!.push(r);
    }
    return Array.from(m.entries()).sort((a, b) => b[1].length - a[1].length);
  }, [rows]);

  if (loading) {
    return <div style={{ padding: 24, textAlign: 'center', color: 'var(--muted)', fontSize: 'var(--fs-sm)' }}>در حال بارگذاری…</div>;
  }

  if (rows.length === 0) {
    return (
      <Empty
        icon={<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><path d="M21 8v13H3V8M1 3h22v5H1zM10 12h4"/></svg>}
        title="آرشیو دفتر روزانه خالی است"
        desc="ثبت‌های قدیمی یا دفتر روزانهٔ گله‌های بسته‌شده این‌جا نگهداری می‌شوند."
      />
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {groups.map(([flockId, items]) => {
        const flock = flocks.find(f => f.id === flockId);
        const hotCount = hotLogs.filter(l => l.flockId === flockId).length;
        const sortedDates = items.map(r => r.date).filter(Boolean).sort();
        const firstDate = sortedDates[0]
          ? (formatArchiveIsoLabel(sortedDates[0]) || toFa(sortedDates[0]))
          : '—';
        const lastDate = sortedDates[sortedDates.length - 1]
          ? (formatArchiveIsoLabel(sortedDates[sortedDates.length - 1]) || toFa(sortedDates[sortedDates.length - 1]))
          : '—';
        const isBusy = busy === flockId;

        return (
          <div key={flockId} style={{
            background: 'var(--card)', border: '1px solid var(--border)',
            borderRadius: 'var(--r-lg)', padding: '12px 14px',
          }}>
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              gap: 10, flexWrap: 'wrap',
            }}>
              <div style={{ minWidth: 0, flex: '1 1 180px' }}>
                <div style={{ fontWeight: 700, fontSize: 'var(--fs-base)', color: 'var(--text)' }}>
                  {flock?.name || ('گلهٔ ' + toFa(flockId))}
                </div>
                <div style={{
                  fontSize: 'var(--fs-xs)', color: 'var(--muted)', marginTop: 3,
                  display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center',
                }}>
                  <span><b style={{ color: 'var(--text)' }}>{toFa(items.length)}</b> ثبت</span>
                  <span>•</span>
                  <span>بازه: {firstDate === lastDate ? firstDate : `${firstDate} تا ${lastDate}`}</span>
                  {hotCount > 0 ? <span>• {toFa(hotCount)} ثبت فعال</span> : null}
                </div>
              </div>
              <Btn
                size="sm"
                disabled={isBusy}
                style={{ flexShrink: 0, whiteSpace: 'nowrap' }}
                onClick={async () => {
                  setBusy(flockId);
                  try { await onRestoreFlock(flockId); }
                  finally { setBusy(null); }
                }}
              >
                {isBusy ? '…' : '🔄 بازگردانی همه'}
              </Btn>
            </div>

            <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 4 }}>
              {(expandedGroups[flockId] ? items : items.slice(0, 5)).map(r => (
                <div key={r.id} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8,
                  fontSize: 'var(--fs-xs)', color: 'var(--muted)',
                  padding: '6px 0', borderTop: '1px dashed var(--border)',
                }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap',
                    minWidth: 0, flex: 1,
                  }}>
                    <span style={{ color: 'var(--text)', fontWeight: 600, whiteSpace: 'nowrap' }}>
                      {formatArchiveIsoLabel(r.date) || toFa(r.date)}
                    </span>
                    <Tag tone="gray">{REASON_LABEL[r.reason] || r.reason}</Tag>
                  </div>
                  <Btn
                    size="sm"
                    disabled={busy === r.id}
                    style={{ flexShrink: 0, whiteSpace: 'nowrap' }}
                    onClick={async () => {
                      setBusy(r.id);
                      try { await onRestoreOne(r.id); }
                      finally { setBusy(null); }
                    }}
                  >
                    {busy === r.id ? '…' : 'بازگردانی'}
                  </Btn>
                </div>
              ))}
              {items.length > 5 ? (
                <div style={{ paddingTop: 6 }}>
                  <Btn
                    size="sm"
                    variant="ghost"
                    onClick={() => setExpandedGroups(prev => ({ ...prev, [flockId]: !prev[flockId] }))}
                  >
                    {expandedGroups[flockId] ? 'بستن لیست' : 'نمایش همه (' + toFa(items.length - 5) + ' مورد دیگر)'}
                  </Btn>
                </div>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ paddingTop: 12, marginTop: 4, borderTop: '1px dashed var(--border)', fontSize: 'var(--fs-base)', fontWeight: 700, color: 'var(--text)', letterSpacing: '.3px' }}>{children}</div>
  );
}
