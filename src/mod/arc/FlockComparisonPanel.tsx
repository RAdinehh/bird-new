import { useState, useMemo, useEffect } from 'react';
import {
  Btn,
  Tag,
  Select,
  TabButton,
  SummaryCard,
  SummarySection,
  SummaryRow,
  AlertBox,
  Empty,
  Modal,
} from '../../shr/components/ui';
import SelectSheetShell from '../../shr/components/SelectSheetShell';
import { toFa } from '../../shr/utils/fa';
import { exportTableToCSV, printHTML, printTemplate } from '../../shr/utils/export';
import { toastMsg } from '../../cor/store/toast';
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
type BetterRule = 'higher' | 'lower';
type TagTone = 'blue' | 'gray' | 'green' | 'purple' | 'red' | 'warn' | 'info' | 'accent' | 'danger' | 'amber' | 'dim';

interface SavedComparisonPreset {
  id: string;
  title: string;
  flockIds: string[];
  baselineId: string;
}

interface MetricSpec {
  key: string;
  label: string;
  ruleText: string;
  better: BetterRule;
  unit: string;
  decimals: number;
}

const PRESETS_KEY = 'pm-arc-saved-comparisons-v1';
const MIN_FLOCKS = 2;
const MAX_FLOCKS = 4;
const ARCHIVE_FILTER_THRESHOLD = 5;

const COMPARISON_METRICS: MetricSpec[] = [
  { key: 'epef', label: 'شاخص تولید', ruleText: 'بیشتر بهتر', better: 'higher', unit: '', decimals: 0 },
  { key: 'fcr', label: 'ضریب تبدیل', ruleText: 'کمتر بهتر', better: 'lower', unit: '', decimals: 2 },
  { key: 'livabilityPct', label: 'زنده‌مانی', ruleText: 'بیشتر بهتر', better: 'higher', unit: '٪', decimals: 1 },
  { key: 'brokenEggRatePct', label: 'تخم شکسته', ruleText: 'کمتر بهتر', better: 'lower', unit: '٪', decimals: 1 },
  { key: 'initialCost', label: 'هزینه اولیه گله', ruleText: 'کمتر بهتر', better: 'lower', unit: '', decimals: 0 },
  { key: 'recordedCost', label: 'هزینه تمام‌شده گله', ruleText: 'کمتر بهتر', better: 'lower', unit: '', decimals: 0 },
  { key: 'recordedRevenue', label: 'درآمد ثبت‌شده', ruleText: 'بیشتر بهتر', better: 'higher', unit: '', decimals: 0 },
  { key: 'totalMortality', label: 'کل تلفات', ruleText: 'کمتر بهتر', better: 'lower', unit: '', decimals: 0 },
  { key: 'totalFeedKg', label: 'کل دان', ruleText: 'کمتر بهتر', better: 'lower', unit: 'kg', decimals: 0 },
  { key: 'totalEggs', label: 'کل تخم', ruleText: 'بیشتر بهتر', better: 'higher', unit: '', decimals: 0 },
];

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
  const formatted = Number(val).toLocaleString('fa-IR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  return unit ? `${toFa(formatted)} ${unit}` : toFa(formatted);
}

function formatPctFa(pct: number): string {
  const sign = pct > 0 ? '+' : pct < 0 ? '-' : '';
  const formatted = Math.abs(pct).toLocaleString('fa-IR', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
  return `${sign}${toFa(formatted)}٪`;
}

function readPresets(): SavedComparisonPreset[] {
  try {
    const raw = localStorage.getItem(PRESETS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writePresets(presets: SavedComparisonPreset[]): void {
  try {
    localStorage.setItem(PRESETS_KEY, JSON.stringify(presets));
  } catch {
    // ignore storage errors
  }
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
  const [panelOpen, setPanelOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [filter, setFilter] = useState<CandidateFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [presets, setPresets] = useState<SavedComparisonPreset[]>(() => readPresets());

  useEffect(() => {
    writePresets(presets);
  }, [presets]);

  const showArchiveFilterControls = candidates.length > ARCHIVE_FILTER_THRESHOLD;

  const filteredCandidates = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return candidates.filter((c) => {
      if (filter === 'active' && !c.isActive) return false;
      if (filter === 'archived' && c.isActive) return false;
      if (q && !c.label.toLowerCase().includes(q) && !c.metric.flockName.toLowerCase().includes(q)) {
        return false;
      }
      return true;
    });
  }, [candidates, filter, searchQuery]);

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
  const selectedCount = orderedCandidates.length;
  const canCompare = selectedCount >= MIN_FLOCKS && selectedCount <= MAX_FLOCKS;

  const hasMixedProduction = useMemo(() => {
    if (!canCompare) return false;
    const types = new Set(
      orderedCandidates
        .map((c) => c.metric.productionType)
        .filter((pt): pt is NonNullable<ComparableFlockMetric['productionType']> => Boolean(pt))
    );
    return types.size > 1;
  }, [canCompare, orderedCandidates]);

  const handleSetReference = (nextRefId: string) => {
    if (!candidates.some((c) => c.id === nextRefId)) return;
    if (!selectedIds.includes(nextRefId)) {
      if (selectedIds.length >= MAX_FLOCKS) {
        const removable = selectedIds.find((id) => id !== baselineId);
        const nextIds = removable
          ? [...selectedIds.filter((id) => id !== removable), nextRefId]
          : [nextRefId, ...selectedIds.slice(0, MAX_FLOCKS - 1)];
        onSelectPreset(nextIds, nextRefId);
        return;
      }
      onSelectPreset([...selectedIds, nextRefId], nextRefId);
      return;
    }
    onChangeBaseline(nextRefId);
  };

  const handleToggleInPicker = (targetId: string) => {
    if (targetId === effectiveBaselineId) {
      toastMsg.info('این گله هم‌اکنون مرجع است؛ برای تغییر، «مرجع» را بزنید');
      return;
    }
    const isAlreadySelected = selectedIds.includes(targetId);
    if (!isAlreadySelected && selectedIds.length >= MAX_FLOCKS) {
      toastMsg.warn(`حداکثر ${toFa(MAX_FLOCKS)} گله در کل قابل مقایسه است`);
      return;
    }
    onToggleFlock(targetId);
  };

  const summaryInfo = useMemo(() => {
    if (!canCompare || !refCandidate) return null;
    const comparables = orderedCandidates.slice(1);

    const scored = comparables.map((item) => {
      let comparableCount = 0;
      let betterCount = 0;
      let worseCount = 0;
      let netAdvantagePct = 0;
      const betterLabels: string[] = [];

      for (const spec of COMPARISON_METRICS) {
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
          betterLabels.push(spec.label);
        } else {
          worseCount += 1;
        }
      }

      const passPct = comparableCount > 0 ? Math.round((betterCount / comparableCount) * 100) : 0;
      return {
        candidate: item,
        comparableCount,
        betterCount,
        worseCount,
        passPct,
        netAdvantagePct,
        betterLabels,
      };
    });

    const sorted = [...scored].sort((a, b) => {
      if (b.betterCount !== a.betterCount) return b.betterCount - a.betterCount;
      if (b.passPct !== a.passPct) return b.passPct - a.passPct;
      if (b.netAdvantagePct !== a.netAdvantagePct) return b.netAdvantagePct - a.netAdvantagePct;
      return a.worseCount - b.worseCount;
    });

    const winner = sorted[0] ?? null;
    const hasBetter = Boolean(winner && winner.betterCount > 0);
    return { scored, winner, hasBetter };
  }, [canCompare, refCandidate, orderedCandidates]);

  const handleSavePreset = () => {
    if (!canCompare || !refCandidate) {
      toastMsg.info(`حداقل ${toFa(MIN_FLOCKS)} و حداکثر ${toFa(MAX_FLOCKS)} گله انتخاب کنید`);
      return;
    }
    const ids = orderedCandidates.map((c) => c.id);
    const next: SavedComparisonPreset = {
      id: String(Date.now()),
      title: `مقایسه ${toFa(ids.length)} گله (${refCandidate.label})`,
      flockIds: ids,
      baselineId: refCandidate.id,
    };
    setPresets((prev) => [next, ...prev.slice(0, 14)]);
    toastMsg.saved('مقایسه ذخیره شد');
  };

  const handleDeletePreset = (id: string) => {
    setPresets((prev) => prev.filter((p) => p.id !== id));
    toastMsg.deleted('مقایسه ذخیره‌شده');
  };

  const handleExportCSV = () => {
    if (!canCompare || !refCandidate) return;
    const headers = ['شاخص', ...orderedCandidates.map((c) => c.label)];
    const rows = COMPARISON_METRICS.map((spec) => [
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
      .map((c, idx) => `<th>${c.label}${idx === 0 ? ' (مرجع)' : ''}</th>`)
      .join('');
    const bodyRows = COMPARISON_METRICS.map((spec) => {
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
          <h1>گزارش مقایسه گله‌ها (${toFa(orderedCandidates.length)} گله)</h1>
          <div class="farm-info">مرجع: ${refCandidate.label} • ${toFa(new Date().toLocaleDateString('fa-IR'))}</div>
        </div>
      </div>
      <table>
        <thead><tr><th>شاخص</th>${headCells}</tr></thead>
        <tbody>${bodyRows}</tbody>
      </table>
    `;
    printHTML(printTemplate('گزارش مقایسه گله‌ها', htmlBody));
  };

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
      <div className="flex-between" style={{ flexWrap: 'wrap', gap: 8 }}>
        <div>
          <div style={{ fontWeight: 700, fontSize: 'var(--fs-base)', color: 'var(--text)' }}>
            مقایسه گله‌ها ({toFa(MIN_FLOCKS)} تا {toFa(MAX_FLOCKS)} گله)
          </div>
          {refCandidate && (
            <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', marginTop: 2 }}>
              مرجع: {refCandidate.label} • {toFa(orderedCandidates.length)} گله
            </div>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Btn size="sm" onClick={() => setHelpOpen(true)}>
            راهنما
          </Btn>
          <Btn
            size="sm"
            variant={panelOpen ? 'primary' : undefined}
            onClick={() => setPanelOpen((v) => !v)}
          >
            {panelOpen ? 'بستن مقایسه' : 'نمایش مقایسه'}
          </Btn>
        </div>
      </div>

      {panelOpen && (
        <div className="stack" style={{ gap: 'var(--gap-md)' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: 8,
            }}
          >
            <div
              style={{
                background: 'var(--input-bg, var(--card-solid))',
                border: '1px solid var(--border)',
                borderRadius: 'var(--r-md)',
                padding: 8,
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
              }}
            >
              <div className="flex-between" style={{ fontSize: 'var(--fs-xs)', fontWeight: 700 }}>
                <span>گله‌های انتخاب‌شده</span>
                <span style={{ color: 'var(--muted)' }}>
                  {toFa(selectedCount)} از {toFa(MAX_FLOCKS)}
                </span>
              </div>
              <div className="flex-between" style={{ gap: 8 }}>
                <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)' }}>
                  {toFa(candidates.length)} گله فعال و آرشیو
                </span>
                <Btn size="sm" variant="primary" onClick={() => setPickerOpen(true)}>
                  انتخاب گله‌ها
                </Btn>
              </div>
            </div>

            {candidates.length > 0 && (
              <div
                style={{
                  background: 'var(--input-bg, var(--card-solid))',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--r-md)',
                  padding: 8,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                }}
              >
                <span style={{ fontSize: 'var(--fs-xs)', fontWeight: 700 }}>
                  گله مرجع (فعال یا آرشیو)
                </span>
                <Select
                  value={effectiveBaselineId}
                  onChange={(e) => handleSetReference(e.target.value)}
                >
                  {candidates.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label} ({c.isActive ? 'فعال' : 'آرشیو'})
                    </option>
                  ))}
                </Select>
              </div>
            )}
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
                    <span>{item.label}</span>
                    {isRef ? (
                      <span style={{ color: 'var(--accent)', fontSize: 10 }}>مرجع</span>
                    ) : (
                      orderedCandidates.length > MIN_FLOCKS && (
                        <button
                          type="button"
                          aria-label={`حذف ${item.label}`}
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

          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <Btn size="sm" disabled={!canCompare} onClick={handleSavePreset}>
              ذخیره مقایسه
            </Btn>
            <Btn size="sm" disabled={!canCompare} onClick={handleExportCSV}>
              خروجی CSV
            </Btn>
            <Btn size="sm" disabled={!canCompare} onClick={handleExportPDF}>
              خروجی PDF
            </Btn>
          </div>

          {presets.length > 0 && (
            <SummaryCard tone="info" title="مقایسه‌های ذخیره‌شده">
              {presets.map((p) => (
                <div
                  key={p.id}
                  className="flex-between"
                  style={{ paddingTop: 4, borderTop: '1px dashed var(--info-border)', gap: 8 }}
                >
                  <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--text)', fontWeight: 600 }}>
                    {p.title}
                  </span>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <Btn size="sm" onClick={() => onSelectPreset(p.flockIds, p.baselineId)}>
                      باز کردن
                    </Btn>
                    <Btn size="sm" onClick={() => handleDeletePreset(p.id)}>
                      حذف
                    </Btn>
                  </div>
                </div>
              ))}
            </SummaryCard>
          )}

          {!canCompare ? (
            <AlertBox tone="info" variant="flat" size="xs">
              برای نمایش مقایسه، حداقل {toFa(MIN_FLOCKS)} و حداکثر {toFa(MAX_FLOCKS)} گله انتخاب کنید.
            </AlertBox>
          ) : (
            <div className="stack" style={{ gap: 'var(--gap-sm)' }}>
              {summaryInfo && refCandidate && (
                <div
                  style={{
                    background: 'var(--input-bg, var(--card-solid))',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--r-md)',
                    padding: '9px 11px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6,
                  }}
                >
                  <div className="flex-between" style={{ fontSize: 'var(--fs-xs)', fontWeight: 700 }}>
                    <span>
                      بهترین عملکرد:{' '}
                      {summaryInfo.hasBetter && summaryInfo.winner
                        ? summaryInfo.winner.candidate.label
                        : refCandidate.label}
                    </span>
                    <Tag tone={summaryInfo.hasBetter ? 'green' : 'info'}>
                      {summaryInfo.hasBetter ? 'برتر' : 'مرجع'}
                    </Tag>
                  </div>

                  <p style={{ margin: 0, fontSize: 'var(--fs-xs)', color: 'var(--muted)' }}>
                    {summaryInfo.hasBetter && summaryInfo.winner
                      ? `بهتر در ${toFa(summaryInfo.winner.betterCount)} از ${toFa(
                          summaryInfo.winner.comparableCount
                        )} شاخص (${summaryInfo.winner.betterLabels.slice(0, 3).join('، ')}).`
                      : 'هیچ گله‌ای شاخص بهتری نسبت به مرجع ثبت نکرد.'}
                  </p>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {summaryInfo.scored.map((entry) => (
                      <span
                        key={entry.candidate.id}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '4px 8px',
                          borderRadius: 'var(--r-sm)',
                          border: '1px solid var(--border)',
                          background: 'var(--card-solid)',
                          fontSize: 'var(--fs-xs)',
                        }}
                      >
                        <span>{entry.candidate.label}:</span>
                        <strong style={{ direction: 'ltr', unicodeBidi: 'isolate' }}>
                          {toFa(entry.betterCount)}/{toFa(entry.comparableCount)}
                        </strong>
                        <span style={{ color: 'var(--muted)' }}>({toFa(entry.passPct)}٪)</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {hasMixedProduction && (
                <AlertBox tone="warn" variant="flat" size="xs">
                  نوع تولید گله‌ها متفاوت است؛ شاخص‌های نامرتبط «ثبت نشده» نمایش داده می‌شوند.
                </AlertBox>
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
                    minWidth: orderedCandidates.length > 3 ? 520 : '100%',
                  }}
                >
                  <thead>
                    <tr style={{ background: 'var(--input-bg, var(--card-solid))' }}>
                      <th
                        style={{
                          padding: '6px 5px',
                          borderBottom: '1px solid var(--border)',
                          borderLeft: '1px solid var(--border)',
                          textAlign: 'center',
                          fontSize: 'var(--fs-xs)',
                        }}
                      >
                        <div>شاخص</div>
                        <div style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 400 }}>قاعده</div>
                      </th>
                      {orderedCandidates.map((c, idx) => {
                        const isRef = idx === 0;
                        return (
                          <th
                            key={c.id}
                            style={{
                              padding: '6px 5px',
                              borderBottom: '1px solid var(--border)',
                              borderLeft: '1px solid var(--border)',
                              textAlign: 'center',
                              fontSize: 'var(--fs-xs)',
                            }}
                          >
                            <div style={{ fontWeight: 700 }}>{c.label}</div>
                            {isRef && (
                              <div style={{ marginTop: 3 }}>
                                <Tag tone="info">مرجع</Tag>
                              </div>
                            )}
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {COMPARISON_METRICS.map((spec, rIdx) => {
                      const refVal = refCandidate ? extractNumericMetric(refCandidate.metric, spec.key) : null;
                      return (
                        <tr
                          key={spec.key}
                          style={{
                            background: rIdx % 2 === 1 ? 'var(--input-bg, transparent)' : 'transparent',
                          }}
                        >
                          <td
                            style={{
                              padding: '6px 5px',
                              borderBottom: '1px solid var(--border)',
                              borderLeft: '1px solid var(--border)',
                              textAlign: 'center',
                            }}
                          >
                            <div style={{ fontSize: 'var(--fs-xs)', fontWeight: 700 }}>{spec.label}</div>
                            <div style={{ fontSize: 10, color: 'var(--muted)' }}>{spec.ruleText}</div>
                          </td>

                          {orderedCandidates.map((c, idx) => {
                            const isRef = idx === 0;
                            const val = extractNumericMetric(c.metric, spec.key);

                            if (val === null) {
                              return (
                                <td
                                  key={c.id}
                                  style={{
                                    padding: '6px 5px',
                                    borderBottom: '1px solid var(--border)',
                                    borderLeft: '1px solid var(--border)',
                                    textAlign: 'center',
                                    fontSize: 'var(--fs-xs)',
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
                                    padding: '6px 5px',
                                    borderBottom: '1px solid var(--border)',
                                    borderLeft: '1px solid var(--border)',
                                    textAlign: 'center',
                                  }}
                                >
                                  <div style={{ fontWeight: 700, fontSize: 'var(--fs-xs)' }}>
                                    {formatNumFa(val, spec.decimals, spec.unit)}
                                  </div>
                                  <div style={{ fontSize: 10, color: 'var(--muted)' }}>—</div>
                                </td>
                              );
                            }

                            if (refVal === null || refVal === 0) {
                              return (
                                <td
                                  key={c.id}
                                  style={{
                                    padding: '6px 5px',
                                    borderBottom: '1px solid var(--border)',
                                    borderLeft: '1px solid var(--border)',
                                    textAlign: 'center',
                                  }}
                                >
                                  <div style={{ fontWeight: 700, fontSize: 'var(--fs-xs)' }}>
                                    {formatNumFa(val, spec.decimals, spec.unit)}
                                  </div>
                                  <div style={{ fontSize: 10, color: 'var(--muted)' }}>بدون مبنا</div>
                                </td>
                              );
                            }

                            const diff = val - refVal;
                            const pct = (diff / Math.abs(refVal)) * 100;
                            const isEqual = Math.abs(diff) < 1e-9;
                            const isBetter = isEqual ? null : spec.better === 'lower' ? diff < 0 : diff > 0;
                            const tone: TagTone = isEqual
                              ? 'gray'
                              : isBetter
                              ? 'green'
                              : 'red';
                            const statusLabel = isEqual ? 'برابر' : isBetter ? 'بهتر' : 'ضعیف‌تر';

                            return (
                              <td
                                key={c.id}
                                style={{
                                  padding: '6px 5px',
                                  borderBottom: '1px solid var(--border)',
                                  borderLeft: '1px solid var(--border)',
                                  textAlign: 'center',
                                }}
                              >
                                <div style={{ fontWeight: 700, fontSize: 'var(--fs-xs)' }}>
                                  {formatNumFa(val, spec.decimals, spec.unit)}
                                </div>
                                <div style={{ fontSize: 10, color: 'var(--muted)' }}>
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
            </div>
          )}
        </div>
      )}

      <SelectSheetShell
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        title="انتخاب مرجع و گله‌های مقایسه"
        subtitle={`${toFa(filteredCandidates.length)} گله • ${toFa(MIN_FLOCKS)} تا ${toFa(MAX_FLOCKS)} گله`}
        searchable={candidates.length > ARCHIVE_FILTER_THRESHOLD}
        searchNode={
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="جستجوی نام گله..."
            style={{
              width: '100%',
              padding: '6px 10px',
              borderRadius: 'var(--r-md)',
              border: '1px solid var(--border)',
              background: 'var(--input-bg, var(--card-solid))',
              color: 'var(--text)',
              fontSize: 'var(--fs-xs)',
              fontFamily: 'inherit',
            }}
          />
        }
      >
        {showArchiveFilterControls && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
            <TabButton active={filter === 'all'} onClick={() => setFilter('all')}>
              همه ({toFa(candidates.length)})
            </TabButton>
            <TabButton active={filter === 'active'} onClick={() => setFilter('active')}>
              فعال ({toFa(candidates.filter((c) => c.isActive).length)})
            </TabButton>
            <TabButton active={filter === 'archived'} onClick={() => setFilter('archived')}>
              آرشیو ({toFa(candidates.filter((c) => !c.isActive).length)})
            </TabButton>
          </div>
        )}

        {filteredCandidates.length === 0 ? (
          <Empty
            icon="🐔"
            title="گله‌ای یافت نشد"
            desc="فیلتر یا عبارت جستجو را تغییر دهید."
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {filteredCandidates.map((c) => {
              const isRef = c.id === effectiveBaselineId;
              const isCompared = selectedIds.includes(c.id) && !isRef;
              const isActiveFlock = activeFlockIds.has(c.id) || c.isActive;
              return (
                <div
                  key={c.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 8,
                    padding: '8px 10px',
                    borderRadius: 'var(--r-md)',
                    border: `1px solid ${isRef ? 'var(--accent-border)' : 'var(--border)'}`,
                    background: isRef ? 'var(--accent-soft)' : 'var(--card-solid)',
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 'var(--fs-xs)', fontWeight: 700 }}>{c.label}</div>
                    <div style={{ fontSize: 10, color: 'var(--muted)' }}>
                      {isActiveFlock ? 'فعال' : 'آرشیو'}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    <Btn
                      size="sm"
                      variant={isRef ? 'primary' : undefined}
                      onClick={() => handleSetReference(c.id)}
                    >
                      مرجع
                    </Btn>
                    {!isRef && (
                      <Btn
                        size="sm"
                        variant={isCompared ? 'primary' : undefined}
                        onClick={() => handleToggleInPicker(c.id)}
                      >
                        {isCompared ? 'در مقایسه' : '+ مقایسه'}
                      </Btn>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </SelectSheetShell>

      <Modal
        open={helpOpen}
        onClose={() => setHelpOpen(false)}
        title="راهنمای مقایسه گله‌ها"
        footer={
          <Btn variant="primary" onClick={() => setHelpOpen(false)}>
            متوجه شدم
          </Btn>
        }
      >
        <SummarySection first title="مرجع و گله‌های مقایسه">
          <SummaryRow
            label="حداقل و حداکثر"
            value={`${toFa(MIN_FLOCKS)} تا ${toFa(MAX_FLOCKS)} گله (فعال یا آرشیو)`}
          />
          <SummaryRow
            label="ستون مرجع"
            value="همیشه اول می‌آید و هم‌زمان در لیست مقایسه تکرار نمی‌شود"
          />
        </SummarySection>
        <SummarySection title="امتیازدهی و بهترین عملکرد">
          <SummaryRow
            label="قاعده شاخص‌ها"
            value="در هزینه، تلفات و ضریب تبدیل کمتر بهتر است؛ در درآمد، زنده‌مانی و تخم بیشتر بهتر است"
          />
          <SummaryRow
            label="بهترین عملکرد"
            value="گله‌ای با بیشترین تعداد شاخص برتر نسبت به مرجع انتخاب می‌شود"
          />
        </SummarySection>
      </Modal>
    </div>
  );
}
