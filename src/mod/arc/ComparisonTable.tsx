/**
 * ComparisonTable.tsx — جدول مقایسه + بهترین گله + هشدارها
 * (استخراج‌شده از FlockComparisonPanel.tsx — فاز رفکتور)
 */
import { useMemo } from 'react';
import { Tag } from '../../shr/components/ui';
import { toFa } from '../../shr/utils/fa';
import {
  type ComparisonCandidate,
  type MetricSpec,
  type TagTone,
  COMPARISON_METRICS,
  MIN_FLOCKS,
  MAX_FLOCKS,
  cleanCandidateTitle,
  extractNumericMetric,
  formatNumFa,
  formatPctFa,
  getPeriodAlignmentInfo,
} from './comparisonHelpers';

interface Props {
  orderedCandidates: ComparisonCandidate[];
  refCandidate: ComparisonCandidate | null;
}

export default function ComparisonTable({ orderedCandidates, refCandidate }: Props) {
  const getTitle = (c: ComparisonCandidate) => cleanCandidateTitle(c.label, c.metric.flockName);

  const selectedCount = orderedCandidates.length;
  const canCompare = selectedCount >= MIN_FLOCKS && selectedCount <= MAX_FLOCKS;

  // ─── مرتب‌سازی شاخص‌ها (شاخص‌های ثبت‌شده بالا) ───
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

  // ─── بررسی نوع تولید متفاوت ───
  const hasMixedProduction = useMemo(() => {
    if (!canCompare) return false;
    const types = new Set(
      orderedCandidates
        .map((c) => c.metric.productionType)
        .filter((pt): pt is NonNullable<ComparisonCandidate['metric']['productionType']> => Boolean(pt))
    );
    return types.size > 1;
  }, [canCompare, orderedCandidates]);

  // ─── بهترین گله (فقط اگر نوع تولید یکسان باشد) ───
  const bestFlockInfo = useMemo(() => {
    if (!canCompare || !refCandidate || hasMixedProduction) return null;
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

        if (isBetter) betterCount += 1;
        else worseCount += 1;
      }

      return { candidate: item, comparableCount, betterCount, worseCount, netAdvantagePct };
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
        summary: 'هیچ گله‌ای شاخص بهتری نسبت به مرجع ثبت نکرد.',
      };
    }

    return {
      title: getTitle(winner.candidate),
      badge: 'برتر',
      tone: 'green' as TagTone,
      summary: `بهتر در ${toFa(winner.betterCount)} از ${toFa(winner.comparableCount)} شاخص نسبت به مرجع.`,
    };
  }, [canCompare, refCandidate, orderedCandidates, sortedMetrics, hasMixedProduction]);

  // ─── سناریوهای پیچیده: اختلاف طول دوره، گله فعال در برابر آرشیو سرد، پوشش لاگ ───
  const scenarioWarnings = useMemo(() => {
    if (!canCompare || !refCandidate) return [] as string[];
    const warnings: string[] = [];
    const refInfo = getPeriodAlignmentInfo(refCandidate);

    for (const c of orderedCandidates.slice(1)) {
      const info = getPeriodAlignmentInfo(c);
      const name = getTitle(c);

      if (refCandidate.isActive !== c.isActive) {
        warnings.push(
          `مقایسه ترکیبی (${refCandidate.isActive ? 'مرجع فعال' : 'مرجع آرشیو سرد'} در برابر «${name}» ${c.isActive ? 'فعال' : 'آرشیو سرد'}): در ارزیابی اعداد تجمعی دقت کنید.`
        );
      }

      if (
        refInfo.durationDays !== null &&
        info.durationDays !== null &&
        Math.abs(refInfo.durationDays - info.durationDays) >= 7
      ) {
        warnings.push(
          `اختلاف طول دوره بین مرجع (${toFa(refInfo.durationDays)} روز) و «${name}» (${toFa(info.durationDays)} روز).`
        );
      }

      if (info.lowCoverage && info.coveragePct !== null) {
        warnings.push(
          `پوشش ثبت لاگ «${name}» (${toFa(info.coveragePct)}٪) کمتر از حد استاندارد ۸۰٪ است.`
        );
      }
    }

    if (refInfo.lowCoverage && refInfo.coveragePct !== null) {
      warnings.push(
        `پوشش ثبت لاگ گله مرجع «${getTitle(refCandidate)}» (${toFa(refInfo.coveragePct)}٪) کمتر از حد استاندارد ۸۰٪ است.`
      );
    }

    return Array.from(new Set(warnings));
  }, [canCompare, refCandidate, orderedCandidates]);

  // ─── حالت انتخاب نشده ───
  if (!canCompare) {
    return (
      <div
        style={{
          padding: '12px 14px',
          background: 'var(--info-soft)',
          border: '1px solid var(--info)',
          borderRadius: 'var(--r-md)',
          fontSize: 'var(--fs-xs)',
          color: 'var(--text)',
        }}
      >
        برای نمایش مقایسه، حداقل {toFa(MIN_FLOCKS)} و حداکثر {toFa(MAX_FLOCKS)} گله انتخاب کنید.
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-sm)' }}>
      {scenarioWarnings.length > 0 && (
        <div
          style={{
            marginBottom: 10,
            padding: '8px 12px',
            borderRadius: 'var(--r-md)',
            background: 'var(--warn-soft, rgba(245, 158, 11, 0.12))',
            border: '1px solid var(--warn, #d97706)',
            fontSize: 'var(--fs-xs)',
            lineHeight: 1.7,
          }}
        >
          <div style={{ fontWeight: 700, marginBottom: 4 }}>
            توجه به شرایط مقایسه و داده‌های آرشیو سرد:
          </div>
          {scenarioWarnings.map((w, idx) => (
            <div key={idx}>• {w}</div>
          ))}
        </div>
      )}

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
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 'var(--fs-xs)', fontWeight: 700 }}>
            <span>بهترین عملکرد: {bestFlockInfo.title}</span>
            <Tag tone={bestFlockInfo.tone}>{bestFlockInfo.badge}</Tag>
          </div>
          <p style={{ margin: 0, fontSize: 'var(--fs-xs)', color: 'var(--muted)' }}>
            {bestFlockInfo.summary}
          </p>
        </div>
      )}

      {hasMixedProduction && (
        <div
          style={{
            padding: '10px 12px',
            background: 'var(--warn-soft)',
            border: '1px solid var(--warn)',
            borderRadius: 'var(--r-md)',
            fontSize: 'var(--fs-xs)',
            color: 'var(--warn)',
            fontWeight: 600,
          }}
        >
          ⚠ نوع تولید گله‌ها متفاوت است؛ شاخص‌های نامرتبط «ثبت نشده» نمایش داده می‌شوند.
        </div>
      )}

      {/* ─── جدول ─── */}
      <div
        style={{
          width: '100%',
          border: '1px solid var(--border)',
          borderRadius: 'var(--r-md)',
          overflowX: 'auto',
          background: 'var(--card-solid)',
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
          <thead>
            <tr style={{ background: 'var(--card)' }}>
              <th
                style={{
                  width: 84,
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
                      minWidth: 74,
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
            {sortedMetrics.map((spec: MetricSpec, rIdx) => {
              const refVal = refCandidate ? extractNumericMetric(refCandidate.metric, spec.key) : null;
              return (
                <tr
                  key={spec.key}
                  style={{ background: rIdx % 2 === 1 ? 'var(--card)' : 'transparent' }}
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
    </div>
  );
}
