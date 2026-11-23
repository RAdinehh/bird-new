import { useFormat, getGlobalFormat } from '../../shr/units/useFormat';
import { useState, useMemo, useEffect } from 'react';
import {
  Btn,
  Tag,
  TabButton,
  SummaryCard,
  Empty,
  HelpIcon,
  CardSection,
} from '../../shr/components/ui';
import SelectSheetShell, { SheetGroup } from '../../shr/components/SelectSheetShell';
import { toFa } from '../../shr/utils/fa';
import { normalizeDigits, formatJalali } from '../../shr/date/jalali';
import { exportTableToCSV, printHTML, printTemplate } from '../../shr/utils/export';
import { toastMsg } from '../../cor/store/toast';
import { HELP } from '../../shr/help/helpTexts';
import type { ComparableFlockMetric } from '../../cor/storage/historyArchive';

export interface ComparisonCandidate {
  id: string;
  label: string;
  metric: ComparableFlockMetric;
  isActive: boolean;
}

interface FlockComparisonPanelProps {
  candidates: ComparisonCandidate[];
  selectedIds: string[];
  onToggleFlock: (flockId: string) => void;
  onSelectPreset: (flockIds: string[], baselineId?: string) => void;
  baselineId: string;
  onChangeBaseline: (flockId: string) => void;
  activeFlockIds: Set<string>;
}

type CandidateFilter = 'all' | 'archived' | 'active';
type PickerMode = 'compare' | 'baseline' | null;
type BetterRule = 'higher' | 'lower';
type TagTone =
  | 'blue'
  | 'gray'
  | 'green'
  | 'purple'
  | 'red'
  | 'warn'
  | 'info'
  | 'accent'
  | 'danger'
  | 'amber'
  | 'dim';

interface MetricSpec {
  key: string;
  label: string;
  ruleText: string;
  better: BetterRule;
  unit: string;
  decimals: number;
}

const MIN_FLOCKS = 2;
const MAX_FLOCKS = 4;
const MAX_OTHER_FLOCKS = MAX_FLOCKS - 1;
const ARCHIVE_FILTER_THRESHOLD = 5;

const DEFAULT_COMPARISON_HELP =
  '**مقایسه گله‌ها (۲ تا ۴ گله):** ابتدا **گله مرجع** را انتخاب کنید و سپس حداکثر **۳ گله** دیگر را برای مقایسه با آن برگزینید.\n**امتیازدهی:** در هزینه، تلفات و ضریب تبدیل **کمتر بهتر** و در درآمد، زنده‌مانی و تخم **بیشتر بهتر** است. شاخص‌های ثبت‌نشده به پایین جدول منتقل می‌شوند.';

const COMPARISON_HELP_TEXT =
  (HELP as unknown as { arc?: { comparison?: { overview?: string } } }).arc?.comparison?.overview ??
  DEFAULT_COMPARISON_HELP;

const COMPARISON_METRICS: MetricSpec[] = [
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

function cleanCandidateTitle(rawLabel: string, fallbackName: string): string {
  const withoutParens = rawLabel
    .replace(/\s*\[(?:فعال|آرشیو)\]\s*/g, ' ')
    .replace(/\s*\([^)]*\)\s*/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return withoutParens || fallbackName || rawLabel;
}

function extractCandidateYear(metric: ComparableFlockMetric): string {
  const dateStr = metric.lastDate || metric.firstDate || '';
  if (dateStr) {
    const norm = normalizeDigits(dateStr).trim();
    const match = norm.match(/^(1[34]\d{2})[/-]/);
    if (match) return match[1];
    const parsed = new Date(dateStr);
    if (!Number.isNaN(parsed.getTime())) {
      const j = formatJalali(parsed);
      const jMatch = normalizeDigits(j).match(/^(1[34]\d{2})[/-]/);
      if (jMatch) return jMatch[1];
    }
  }
  if (typeof metric.archivedAt === 'number' && metric.archivedAt > 0) {
    const j = formatJalali(new Date(metric.archivedAt));
    const jMatch = normalizeDigits(j).match(/^(1[34]\d{2})[/-]/);
    if (jMatch) return jMatch[1];
  }
  return 'نامشخص';
}

function extractNumericMetric(metric: ComparableFlockMetric, key: string): number | null {
  const rec = metric as unknown as Record<string, unknown>;
  const raw = rec[key];
  if (typeof raw === 'number' && !Number.isNaN(raw)) return raw;
  const fin = metric.financial as unknown as Record<string, unknown> | undefined;
  if (fin && typeof fin[key] === 'number' && !Number.isNaN(fin[key] as number)) {
    return fin[key] as number;
  }
  return null;
}

function formatNumFa(val: number | null, decimals: number, unit: string): string {
  if (val === null || Number.isNaN(val)) return 'ثبت نشده';
  const formatted = getGlobalFormat().num(Number(val));
  return unit ? `${formatted} ${unit}` : formatted;
}

function formatPctFa(pct: number): string {
  const sign = pct > 0 ? '+' : pct < 0 ? '-' : '';
  const formatted = getGlobalFormat().num(Math.abs(pct));
  return `${sign}${formatted}٪`;
}

export default function FlockComparisonPanel({
  candidates,
  selectedIds,
  onToggleFlock,
  onSelectPreset,
  baselineId,
  onChangeBaseline,
  activeFlockIds,
}: FlockComparisonPanelProps) {
  const fmt = useFormat();
  const [panelOpen, setPanelOpen] = useState(false);
  const [pickerMode, setPickerMode] = useState<PickerMode>(null);
  const [filter, setFilter] = useState<CandidateFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const showArchiveFilterControls = candidates.length > ARCHIVE_FILTER_THRESHOLD;

  const getTitle = (c: ComparisonCandidate) => cleanCandidateTitle(c.label, c.metric.flockName);
  const getIsActive = (c: ComparisonCandidate) => activeFlockIds.has(c.id) || c.isActive;
  const getDays = (c: ComparisonCandidate) => c.metric.durationDays ?? c.metric.logCount;

  const filteredCandidates = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return candidates.filter((c) => {
      const active = getIsActive(c);
      if (filter === 'active' && !active) return false;
      if (filter === 'archived' && active) return false;
      const title = getTitle(c).toLowerCase();
      if (
        q &&
        !title.includes(q) &&
        !c.label.toLowerCase().includes(q) &&
        !c.metric.flockName.toLowerCase().includes(q)
      ) {
        return false;
      }
      return true;
    });
  }, [candidates, filter, searchQuery, activeFlockIds]);

  const selectedCandidates = useMemo(() => {
    const cappedIds = selectedIds.slice(0, MAX_FLOCKS);
    return candidates.filter((c) => cappedIds.includes(c.id));
  }, [candidates, selectedIds]);

  const effectiveBaselineId = useMemo(() => {
    if (selectedCandidates.some((c) => c.id === baselineId)) return baselineId;
    return selectedCandidates[0]?.id ?? '';
  }, [selectedCandidates, baselineId]);

  const orderedCandidates = useMemo(() => {
    const refItem = selectedCandidates.find((c) => c.id === effectiveBaselineId) ?? null;
    if (!refItem) return [] as ComparisonCandidate[];
    const others = selectedCandidates.filter((c) => c.id !== refItem.id);
    return [refItem, ...others];
  }, [selectedCandidates, effectiveBaselineId]);

  const refCandidate = orderedCandidates[0] ?? null;
  const otherCandidates = useMemo(
    () => orderedCandidates.filter((c) => c.id !== refCandidate?.id),
    [orderedCandidates, refCandidate]
  );

  const selectedCount = orderedCandidates.length;
  const canCompare = selectedCount >= MIN_FLOCKS && selectedCount <= MAX_FLOCKS;

  const sortedMetrics = useMemo(() => {
    return COMPARISON_METRICS.map((spec, idx) => {
      const hasAnyValue = orderedCandidates.some(
        (c) => extractNumericMetric(c.metric, spec.key) !== null
      );
      return { spec, idx, hasAnyValue };
    })
      .sort((a, b) => {
        if (a.hasAnyValue === b.hasAnyValue) return a.idx - b.idx;
        return a.hasAnyValue ? -1 : 1;
      })
      .map((item) => item.spec);
  }, [orderedCandidates]);

  const groupedByYear = useMemo(() => {
    const map = new Map<string, ComparisonCandidate[]>();
    for (const c of filteredCandidates) {
      const yr = extractCandidateYear(c.metric);
      const list = map.get(yr) ?? [];
      list.push(c);
      map.set(yr, list);
    }
    const entries = Array.from(map.entries());
    entries.sort(([a], [b]) => {
      if (a === 'نامشخص') return 1;
      if (b === 'نامشخص') return -1;
      return Number(b) - Number(a);
    });
    return entries;
  }, [filteredCandidates]);

  const handleOpenPicker = (mode: Exclude<PickerMode, null>) => {
    setSearchQuery('');
    setFilter('all');
    setPickerMode(mode);
  };

  const handleSetReference = (nextRefId: string) => {
    if (!candidates.some((c) => c.id === nextRefId)) return;
    if (!selectedIds.includes(nextRefId)) {
      if (selectedIds.length >= MAX_FLOCKS) {
        const removable = selectedIds.find((id) => id !== baselineId);
        const nextIds = removable
          ? [...selectedIds.filter((id) => id !== removable), nextRefId]
          : [nextRefId, ...selectedIds.slice(0, MAX_FLOCKS - 1)];
        onSelectPreset(nextIds, nextRefId);
        setPickerMode(null);
        return;
      }
      onSelectPreset([...selectedIds, nextRefId], nextRefId);
      setPickerMode(null);
      return;
    }
    onChangeBaseline(nextRefId);
    setPickerMode(null);
  };

  const handleToggleInPicker = (targetId: string) => {
    if (targetId === effectiveBaselineId) {
      toastMsg.info('این گله مرجع است');
      return;
    }
    const isAlreadySelected = selectedIds.includes(targetId);
    if (!isAlreadySelected && otherCandidates.length >= MAX_OTHER_FLOCKS) {
      toastMsg.warn(`علاوه بر گله مرجع، حداکثر ${fmt.count(MAX_OTHER_FLOCKS)} گله قابل انتخاب است`);
      return;
    }
    onToggleFlock(targetId);
  };

  const bestFlockInfo = useMemo(() => {
    if (!canCompare || !refCandidate) return null;
    const comparables = orderedCandidates.slice(1);

    const scored = comparables.map((item) => {
      let comparableCount = 0;
      let betterCount = 0;
      let worseCount = 0;
      let netAdvantagePct = 0;

      for (const spec of sortedMetrics) {
        const val = extractNumericMetric(item.metric, spec.key);
        const refVal = extractNumericMetric(refCandidate.metric, spec.key);
        if (val === null || refVal === null) continue;
        comparableCount += 1;

        const diff = val - refVal;
        if (Math.abs(diff) < 1e-9) continue;

        const isBetter = spec.better === 'lower' ? diff < 0 : diff > 0;
        const relPct = refVal !== 0 ? (diff / Math.abs(refVal)) * 100 : 0;
        netAdvantagePct += spec.better === 'lower' ? -relPct : relPct;

        if (isBetter) {
          betterCount += 1;
        } else {
          worseCount += 1;
        }
      }

      return {
        candidate: item,
        comparableCount,
        betterCount,
        worseCount,
        netAdvantagePct,
      };
    });

    const sorted = [...scored].sort((a, b) => {
      if (b.betterCount !== a.betterCount) return b.betterCount - a.betterCount;
      if (b.netAdvantagePct !== a.netAdvantagePct) return b.netAdvantagePct - a.netAdvantagePct;
      return a.worseCount - b.worseCount;
    });

    const winner = sorted[0] ?? null;
    if (!winner || winner.betterCount <= 0) {
      return {
        title: getTitle(refCandidate),
        badge: 'مرجع',
        tone: 'info' as TagTone,
        summary: 'هیچ گله مقایسه‌ای در شاخص‌های ثبت‌شده عملکرد بهتری نسبت به مرجع نداشته است.',
        ruleNote: 'معیار انتخاب: در هزینه، تلفات و ضریب تبدیل مقدار کمتر و در درآمد، زنده‌مانی و تخم مقدار بیشتر امتیاز مثبت می‌گیرد.',
      };
    }

    return {
      title: getTitle(winner.candidate),
      badge: 'برتر',
      tone: 'green' as TagTone,
      summary: `این گله در ${fmt.count(winner.betterCount)} شاخص از ${fmt.count(winner.comparableCount)} شاخص قابل مقایسه، نتیجه بهتری نسبت به گله مرجع (${getTitle(refCandidate)}) ثبت کرده است.`,
      ruleNote: 'معیار انتخاب: در هزینه، تلفات و ضریب تبدیل مقدار کمتر و در درآمد، زنده‌مانی و تخم مقدار بیشتر امتیاز مثبت می‌گیرد.',
    };
  }, [canCompare, refCandidate, orderedCandidates, sortedMetrics]);

  const handleExportCSV = () => {
    if (!canCompare || !refCandidate) return;
    const headers = ['شاخص', ...orderedCandidates.map((c) => getTitle(c))];
    const rows = sortedMetrics.map((spec) => [
      spec.label,
      ...orderedCandidates.map((c) => {
        const v = extractNumericMetric(c.metric, spec.key);
        return v !== null ? String(v) : 'ثبت نشده';
      }),
    ]);
    exportTableToCSV('مقایسه-گله‌ها', headers, rows);
  };

  const handleExportPDF = () => {
    if (!canCompare || !refCandidate) return;
    const headCells = orderedCandidates
      .map((c, idx) => `<th>${getTitle(c)}${idx === 0 ? ' (مرجع)' : ''}</th>`)
      .join('');
    const bodyRows = sortedMetrics.map((spec) => {
      const cells = orderedCandidates
        .map((c) => {
          const v = extractNumericMetric(c.metric, spec.key);
          return `<td>${formatNumFa(v, spec.decimals, spec.unit)}</td>`;
        })
        .join('');
      return `<tr><td>${spec.label}</td>${cells}</tr>`;
    }).join('');

    const htmlBody = `
      <div class="header">
        <div>
          <h1>گزارش مقایسه گله‌ها (${fmt.count(orderedCandidates.length)} گله)</h1>
          <div class="farm-info">مرجع: ${getTitle(refCandidate)} • ${fmt.code(new Date().toLocaleDateString('fa-IR'))}</div>
        </div>
      </div>
      <table>
        <thead><tr><th>شاخص</th>${headCells}</tr></thead>
        <tbody>${bodyRows}</tbody>
      </table>
    `;
    printHTML(printTemplate('گزارش مقایسه گله‌ها', htmlBody));
  };

  const otherSummaryText = useMemo(() => {
    if (otherCandidates.length === 0) return 'انتخاب گله‌های مقایسه';
    return otherCandidates.map((c) => getTitle(c)).join('، ');
  }, [otherCandidates]);

  return (
    <div
      style={{
        background: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--r-lg)',
        padding: 'var(--pad-comfy)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--gap-sm)',
      }}
    >
      <div className="flex-between" style={{ gap: 8 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              fontWeight: 700,
              fontSize: 'var(--fs-base)',
              color: 'var(--text)',
            }}
          >
            <span>مقایسه گله‌ها</span>
            <HelpIcon text={COMPARISON_HELP_TEXT} />
          </div>
          {refCandidate && (
            <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)' }}>
              مرجع: {getTitle(refCandidate)} • {fmt.count(orderedCandidates.length)} از {fmt.count(MAX_FLOCKS)} گله
            </div>
          )}
        </div>

        <Btn
          size="sm"
          variant={panelOpen ? 'primary' : undefined}
          onClick={() => setPanelOpen((v) => !v)}
        >
          {panelOpen ? 'بستن مقایسه' : 'نمایش مقایسه'}
        </Btn>
      </div>

      {panelOpen && (
        <div className="stack" style={{ gap: 'var(--gap-md)' }}>
          <CardSection title="انتخاب گله‌ها" first>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {candidates.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <label style={{ fontSize: 'var(--fs-xs)', fontWeight: 700, color: 'var(--text)' }}>
                    انتخاب گله مرجع
                  </label>
                  <button
                    type="button"
                    onClick={() => handleOpenPicker('baseline')}
                    style={{
                      width: '100%',
                      padding: '8px 10px',
                      borderRadius: 'var(--r-md)',
                      border: '1px solid var(--border)',
                      background: 'var(--card-solid)',
                      color: 'var(--text)',
                      fontSize: 'var(--fs-xs)',
                      fontWeight: 600,
                      fontFamily: 'inherit',
                      textAlign: 'right',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 8,
                    }}
                  >
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {refCandidate ? getTitle(refCandidate) : 'انتخاب نشده'}
                    </span>
                    <span style={{ color: 'var(--muted)', flexShrink: 0 }}>▾</span>
                  </button>
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: 'var(--fs-xs)', fontWeight: 700, color: 'var(--text)' }}>
                  انتخاب گله‌های مقایسه ({fmt.count(otherCandidates.length)} از {fmt.count(MAX_OTHER_FLOCKS)})
                </label>
                <button
                  type="button"
                  onClick={() => handleOpenPicker('compare')}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: 'var(--r-md)',
                    border: '1px solid var(--border)',
                    background: 'var(--card-solid)',
                    color: 'var(--text)',
                    fontSize: 'var(--fs-xs)',
                    fontWeight: 600,
                    fontFamily: 'inherit',
                    textAlign: 'right',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 8,
                  }}
                >
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {otherSummaryText}
                  </span>
                  <span style={{ color: 'var(--muted)', flexShrink: 0 }}>▾</span>
                </button>
              </div>

              {orderedCandidates.length > 0 && (
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {orderedCandidates.map((item, idx) => {
                    const isRef = idx === 0;
                    return (
                      <span
                        key={item.id}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '4px 8px',
                          borderRadius: 'var(--r-sm)',
                          border: `1px solid ${isRef ? 'var(--accent-border)' : 'var(--border)'}`,
                          background: isRef ? 'var(--accent-soft)' : 'var(--card-solid)',
                          fontSize: 'var(--fs-xs)',
                          fontWeight: 600,
                        }}
                      >
                        <span>{getTitle(item)}</span>
                        {isRef ? (
                          <span style={{ color: 'var(--accent)', fontSize: 10 }}>مرجع</span>
                        ) : (
                          orderedCandidates.length > MIN_FLOCKS && (
                            <button
                              type="button"
                              aria-label={`حذف ${getTitle(item)}`}
                              onClick={() => onToggleFlock(item.id)}
                              style={{
                                border: 'none',
                                background: 'transparent',
                                color: 'var(--muted)',
                                fontWeight: 700,
                                cursor: 'pointer',
                                padding: '0 2px',
                              }}
                            >
                              ×
                            </button>
                          )
                        )}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
          </CardSection>

          <CardSection title="عملکرد و جدول مقایسه">
            {!canCompare ? (
              <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)' }}>
                گله مرجع و حداقل {fmt.count(MIN_FLOCKS - 1)} تا حداکثر {fmt.count(MAX_OTHER_FLOCKS)} گله دیگر برای مقایسه انتخاب کنید.
              </div>
            ) : (
              <div className="stack" style={{ gap: 'var(--gap-sm)' }}>
                {bestFlockInfo && (
                  <div
                    style={{
                      background: 'var(--card-solid)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--r-md)',
                      padding: '8px 10px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 4,
                    }}
                  >
                    <div className="flex-between" style={{ fontSize: 'var(--fs-xs)', fontWeight: 700 }}>
                      <span>بهترین عملکرد: {bestFlockInfo.title}</span>
                      <Tag tone={bestFlockInfo.tone}>{bestFlockInfo.badge}</Tag>
                    </div>
                    <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text)' }}>
                      {bestFlockInfo.summary}
                    </div>
                    <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)' }}>
                      {bestFlockInfo.ruleNote}
                    </div>
                  </div>
                )}

                <div
                  style={{
                    width: '100%',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--r-md)',
                    overflowX: 'auto',
                    background: 'var(--card-solid)',
                  }}
                >
                  <table
                    style={{
                      width: '100%',
                      borderCollapse: 'collapse',
                      tableLayout: 'fixed',
                    }}
                  >
                    <thead>
                      <tr style={{ background: 'var(--card)' }}>
                        <th
                          style={{
                            width: 82,
                            padding: '5px 4px',
                            borderBottom: '1px solid var(--border)',
                            borderLeft: '1px solid var(--border)',
                            textAlign: 'center',
                            fontSize: 11,
                          }}
                        >
                          <div>شاخص</div>
                          <div style={{ fontSize: 9.5, color: 'var(--muted)', fontWeight: 400 }}>قاعده</div>
                        </th>
                        {orderedCandidates.map((c, idx) => {
                          const isRef = idx === 0;
                          return (
                            <th
                              key={c.id}
                              style={{
                                minWidth: 72,
                                padding: '5px 4px',
                                borderBottom: '1px solid var(--border)',
                                borderLeft: '1px solid var(--border)',
                                textAlign: 'center',
                                fontSize: 11,
                              }}
                            >
                              <div style={{ fontWeight: 700, wordBreak: 'break-word' }}>{getTitle(c)}</div>
                              {isRef && (
                                <div style={{ marginTop: 2 }}>
                                  <Tag tone="info">مرجع</Tag>
                                </div>
                              )}
                            </th>
                          );
                        })}
                      </tr>
                    </thead>
                    <tbody>
                      {sortedMetrics.map((spec, rIdx) => {
                        const refVal = refCandidate ? extractNumericMetric(refCandidate.metric, spec.key) : null;
                        return (
                          <tr
                            key={spec.key}
                            style={{
                              background: rIdx % 2 === 1 ? 'var(--card)' : 'transparent',
                            }}
                          >
                            <td
                              style={{
                                padding: '5px 4px',
                                borderBottom: '1px solid var(--border)',
                                borderLeft: '1px solid var(--border)',
                                textAlign: 'center',
                              }}
                            >
                              <div style={{ fontSize: 11, fontWeight: 700 }}>{spec.label}</div>
                              <div style={{ fontSize: 9.5, color: 'var(--muted)' }}>{spec.ruleText}</div>
                            </td>

                            {orderedCandidates.map((c, idx) => {
                              const isRef = idx === 0;
                              const val = extractNumericMetric(c.metric, spec.key);

                              if (val === null) {
                                return (
                                  <td
                                    key={c.id}
                                    style={{
                                      padding: '5px 4px',
                                      borderBottom: '1px solid var(--border)',
                                      borderLeft: '1px solid var(--border)',
                                      textAlign: 'center',
                                      fontSize: 11,
                                      color: 'var(--muted)',
                                    }}
                                  >
                                    ثبت نشده
                                  </td>
                                );
                              }

                              if (isRef) {
                                return (
                                  <td
                                    key={c.id}
                                    style={{
                                      padding: '5px 4px',
                                      borderBottom: '1px solid var(--border)',
                                      borderLeft: '1px solid var(--border)',
                                      textAlign: 'center',
                                    }}
                                  >
                                    <div style={{ fontWeight: 700, fontSize: 11 }}>
                                      {formatNumFa(val, spec.decimals, spec.unit)}
                                    </div>
                                    <div style={{ fontSize: 9.5, color: 'var(--muted)' }}>—</div>
                                  </td>
                                );
                              }

                              if (refVal === null || refVal === 0) {
                                return (
                                  <td
                                    key={c.id}
                                    style={{
                                      padding: '5px 4px',
                                      borderBottom: '1px solid var(--border)',
                                      borderLeft: '1px solid var(--border)',
                                      textAlign: 'center',
                                    }}
                                  >
                                    <div style={{ fontWeight: 700, fontSize: 11 }}>
                                      {formatNumFa(val, spec.decimals, spec.unit)}
                                    </div>
                                    <div style={{ fontSize: 9.5, color: 'var(--muted)' }}>بدون مبنا</div>
                                  </td>
                                );
                              }

                              const diff = val - refVal;
                              const pct = (diff / Math.abs(refVal)) * 100;
                              const isEqual = Math.abs(diff) < 1e-9;
                              const isBetter = isEqual ? null : spec.better === 'lower' ? diff < 0 : diff > 0;
                              const tone: TagTone = isEqual ? 'gray' : isBetter ? 'green' : 'red';
                              const statusLabel = isEqual ? 'برابر' : isBetter ? 'بهتر' : 'ضعیف‌تر';

                              return (
                                <td
                                  key={c.id}
                                  style={{
                                    padding: '5px 4px',
                                    borderBottom: '1px solid var(--border)',
                                    borderLeft: '1px solid var(--border)',
                                    textAlign: 'center',
                                  }}
                                >
                                  <div style={{ fontWeight: 700, fontSize: 11 }}>
                                    {formatNumFa(val, spec.decimals, spec.unit)}
                                  </div>
                                  <div style={{ fontSize: 9.5, color: 'var(--muted)' }}>
                                    {formatPctFa(pct)}
                                  </div>
                                  <div style={{ marginTop: 2 }}>
                                    <Tag tone={tone}>{statusLabel}</Tag>
                                  </div>
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)' }}>
                  شاخص‌های فاقد مقدار به‌صورت خودکار در پایین جدول قرار می‌گیرند.
                </div>
              </div>
            )}
          </CardSection>

          <CardSection
            title="خروجی گزارش"
            meta={`${fmt.count(orderedCandidates.length)} از ${fmt.count(MAX_FLOCKS)} گله`}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <Btn size="sm" variant="primary" disabled={!canCompare} onClick={handleExportCSV}>
                  خروجی CSV
                </Btn>
                <Btn size="sm" variant="primary" disabled={!canCompare} onClick={handleExportPDF}>
                  خروجی PDF
                </Btn>
              </div>
            </div>
          </CardSection>
        </div>
      )}

      <SelectSheetShell
        open={pickerMode !== null}
        onClose={() => setPickerMode(null)}
        title={pickerMode === 'baseline' ? 'انتخاب گله مرجع' : 'انتخاب گله‌های مقایسه'}
        subtitle={
          pickerMode === 'baseline'
            ? `${fmt.count(filteredCandidates.length)} گله`
            : `${fmt.count(otherCandidates.length)} از ${fmt.count(MAX_OTHER_FLOCKS)} گله دیگر`
        }
        searchable={candidates.length > ARCHIVE_FILTER_THRESHOLD}
        onSearchClear={() => setSearchQuery('')}
        searchNode={
          <div style={{ padding: '4px 2px' }}>
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="جستجوی نام گله..."
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: 'var(--r-md)',
                border: '1px solid var(--border)',
                background: 'var(--card-solid)',
                color: 'var(--text)',
                fontSize: 'var(--fs-sm)',
                fontFamily: 'inherit',
                boxSizing: 'border-box',
              }}
            />
          </div>
        }
        footer={
          <Btn size="sm" full onClick={() => setPickerMode(null)}>
            بستن
          </Btn>
        }
      >
        {showArchiveFilterControls && (
          <div
            style={{
              display: 'flex',
              gap: 6,
              flexWrap: 'wrap',
              padding: '6px 8px',
              borderRadius: 'var(--r-md)',
              border: '1px solid var(--border)',
              background: 'var(--card)',
            }}
          >
            <TabButton active={filter === 'all'} onClick={() => setFilter('all')}>
              همه ({fmt.count(candidates.length)})
            </TabButton>
            <TabButton active={filter === 'active'} onClick={() => setFilter('active')}>
              فعال ({fmt.count(candidates.filter((c) => getIsActive(c)).length)})
            </TabButton>
            <TabButton active={filter === 'archived'} onClick={() => setFilter('archived')}>
              آرشیو ({fmt.count(candidates.filter((c) => !getIsActive(c)).length)})
            </TabButton>
          </div>
        )}

        {groupedByYear.length === 0 ? (
          <Empty icon="🐔" title="گله‌ای یافت نشد" desc="فیلتر یا جستجو را تغییر دهید." />
        ) : (
          groupedByYear.map(([yearLabel, yearItems]) => (
            <SheetGroup
              key={yearLabel}
              title={yearLabel === 'نامشخص' ? 'سال نامشخص' : `سال ${fmt.code(yearLabel)}`}
              count={yearItems.length}
            >
              {yearItems.map((c) => {
                const isRef = c.id === effectiveBaselineId;
                const isSelected = selectedIds.includes(c.id);
                const isActiveFlock = getIsActive(c);
                const statusText = isActiveFlock ? 'گله فعال' : 'آرشیو شده است';
                const daysText = `${fmt.day(getDays(c))} روز`;
                const checked = pickerMode === 'baseline' ? isRef : isSelected;

                return (
                  <button
                    key={c.id}
                    type="button"
                    aria-selected={checked}
                    onClick={() =>
                      pickerMode === 'baseline'
                        ? handleSetReference(c.id)
                        : handleToggleInPicker(c.id)
                    }
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 10,
                      width: '100%',
                      padding: '10px 12px',
                      background: checked ? 'var(--accent-soft)' : 'var(--card-solid)',
                      border: 'none',
                      borderBottom: '1px solid var(--border)',
                      fontFamily: 'inherit',
                      textAlign: 'right',
                      cursor: 'pointer',
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0, flex: 1 }}>
                      <span
                        style={{
                          fontSize: 'var(--fs-base)',
                          fontWeight: 700,
                          color: checked ? 'var(--accent)' : 'var(--text)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {getTitle(c)}
                      </span>
                      <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)' }}>
                        {statusText} • {daysText}
                      </span>
                    </div>

                    {checked && (
                      <span style={{ color: 'var(--accent)', fontSize: 15, fontWeight: 800, flexShrink: 0 }}>
                        ✓
                      </span>
                    )}
                  </button>
                );
              })}
            </SheetGroup>
          ))
        )}
      </SelectSheetShell>
    </div>
  );
}
