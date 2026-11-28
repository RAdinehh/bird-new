import { resolveCategoryIconKey } from '../../../shr/components/uiIconRegistry';
import { OptionIcon } from '../../../shr/components/OptionIcon';
import SmartSelect from '../../../shr/components/SmartSelect';
/**
 * AggregateTabPanel.tsx — تب «جمع‌بندی» در /dlg
 *
 * نمایش جدول تجمیع هفتگی/ماهانه از لاگ‌های فعال.
 * خواندن-فقط — بدون ویرایش.
 * applyCorrections روی هر لاگ اعمال می‌شود.
 */
import { useFormat, getGlobalFormat } from '../../../shr/units/useFormat';

import { useState, useMemo, useEffect } from 'react';
import type { CSSProperties } from 'react';
import { applyCorrections } from '../api/applyCorrections';
import type { DailyLog } from '../store';
import type { Flock } from '../../flk/store';
import { Empty } from '../../../shr/components/ui';
import { toFa } from '../../../shr/utils/fa';
import { toCSV } from '../../../shr/utils/export';
import { Select } from '../../../shr/components/ui/Select';

type Period = 'week' | 'month';

interface Props {
  active: boolean;
  logs: DailyLog[];
  flocks: Flock[];
}

interface Bucket {
  key: string;
  label: string;
  rangeStart: string;
  rangeEnd: string;
  logCount: number;
  deaths: number;
  feed: number;
  water: number;
  eggsTotal: number;
  tempSum: number;
  tempCount: number;
  humSum: number;
  humCount: number;
  avgTemp: number | null;
  avgHumidity: number | null;
  waterToFeed: number | null;
}

function toEnDigits(str: string): string {
  return str
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 1776))
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 1632));
}

function jalaliMonthDays(year: number, month: number): number {
  if (month <= 6) return 31;
  if (month <= 11) return 30;
  const leapRemainders = [1, 5, 9, 13, 17, 22, 26, 30];
  return leapRemainders.includes(year % 33) ? 30 : 29;
}

function parseJalaliDate(date: unknown): { y: number; m: number; d: number } | null {
  if (typeof date !== 'string' || !date.trim()) return null;
  const parts = toEnDigits(date.trim()).split('/');
  if (parts.length !== 3) return null;
  const y = parseInt(parts[0] ?? '', 10);
  const m = parseInt(parts[1] ?? '', 10);
  const d = parseInt(parts[2] ?? '', 10);
  if (Number.isNaN(y) || Number.isNaN(m) || Number.isNaN(d)) return null;
  if (y < 1 || m < 1 || m > 12 || d < 1 || d > 31) return null;
  return { y, m, d };
}

function jalaliToJdn(y: number, m: number, d: number): number {
  const epbase = y - (y >= 0 ? 474 : 473);
  const epyear = 474 + (epbase % 2820);
  return (
    d +
    (m <= 7 ? (m - 1) * 31 : (m - 1) * 30 + 6) +
    Math.floor((epyear * 682 - 110) / 2816) +
    (epyear - 1) * 365 +
    Math.floor(epbase / 2820) * 1029983 +
    1948320
  );
}

function jdnToJalali(jdn: number): { y: number; m: number; d: number } {
  const depoch = jdn - jalaliToJdn(475, 1, 1);
  const cycle = Math.floor(depoch / 1029983);
  const cyear = depoch % 1029983;
  let ycycle = 0;
  if (cyear === 1029982) {
    ycycle = 2820;
  } else {
    const aux1 = Math.floor(cyear / 366);
    const aux2 = cyear % 366;
    ycycle = Math.floor(((2134 * aux1) + (2816 * aux2) + 2815) / 1028522) + aux1 + 1;
  }
  const y = ycycle + cycle * 2820 + 474;
  const yf = y >= 0 ? y : y + 1;
  const yearStart = jalaliToJdn(yf, 1, 1);
  const dayOfYear = jdn - yearStart + 1;
  const m = dayOfYear <= 186 ? Math.ceil(dayOfYear / 31) : Math.ceil((dayOfYear - 186) / 30) + 6;
  const monthStart = jalaliToJdn(yf, m, 1);
  const d = jdn - monthStart + 1;
  return { y: yf, m, d };
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function fmtJalali(y: number, m: number, d: number): string {
  return `${String(y).padStart(4, "0")}/${pad2(m)}/${pad2(d)}`;
}

// در تقویم ایرانی JDN % 7 === 2 برابر با شنبه است؛ شروع هفته 7 روزه را روی شنبه قرار می‌دهیم
function weekStartJdn(jdn: number): number {
  const saturdayOffset = (((jdn - 2) % 7) + 7) % 7;
  return jdn - saturdayOffset;
}

function bucketKey(date: unknown, period: Period): string | null {
  const parsed = parseJalaliDate(date);
  if (!parsed) return null;
  const yStr = String(parsed.y).padStart(4, "0");
  const mStr = pad2(parsed.m);
  if (period === "month") return `${yStr}/${mStr}`;
  const jdn = jalaliToJdn(parsed.y, parsed.m, parsed.d);
  const startJdn = weekStartJdn(jdn);
  const start = jdnToJalali(startJdn);
  // کلید شامل سال/ماه شروع هفته + شمارنده روز پیوسته برای مرتب‌سازی و یکتایی بدون تداخل ماه
  return `${String(start.y).padStart(4, "0")}/${pad2(start.m)}/W${startJdn}`;
}

function bucketLabel(key: string, period: Period): string {
  const parts = key.split("/");
  const y = parts[0] ?? "";
  const m = parts[1] ?? "";
  if (period === "month") {
    return `${getGlobalFormat().code(y)}/${getGlobalFormat().code(m)}`;
  }
  const wToken = parts[2] ?? "";
  const startJdn = parseInt(wToken.replace(/^W/, ""), 10);
  if (Number.isFinite(startJdn)) {
    const start = jdnToJalali(startJdn);
    const yearStartJdn = jalaliToJdn(start.y, 1, 1);
    const weekOfYear = Math.max(1, Math.floor((startJdn - yearStartJdn) / 7) + 1);
    return `${getGlobalFormat().code(String(start.y).padStart(4, "0"))}/${getGlobalFormat().code(pad2(start.m))} · هفتهٔ ${getGlobalFormat().code(weekOfYear)}`;
  }
  return `${getGlobalFormat().code(y)}/${getGlobalFormat().code(m)} · هفته`;
}

function bucketRange(date: string, period: Period): { start: string; end: string } {
  const parsed = parseJalaliDate(date);
  if (!parsed) return { start: date, end: date };
  const yStr = String(parsed.y).padStart(4, "0");
  const mStr = pad2(parsed.m);
  const maxDays = jalaliMonthDays(parsed.y, parsed.m);
  if (period === "month") {
    return {
      start: `${yStr}/${mStr}/01`,
      end: `${yStr}/${mStr}/${pad2(maxDays)}`,
    };
  }
  const jdn = jalaliToJdn(parsed.y, parsed.m, parsed.d);
  const startJdn = weekStartJdn(jdn);
  const sDate = jdnToJalali(startJdn);
  const eDate = jdnToJalali(startJdn + 6);
  return {
    start: fmtJalali(sDate.y, sDate.m, sDate.d),
    end: fmtJalali(eDate.y, eDate.m, eDate.d),
  };
}

function fmtNum(val: number, decimals = 1): string {
  if (typeof val !== 'number' || !Number.isFinite(val)) return getGlobalFormat().num(0);
  const factor = Math.pow(10, decimals);
  const rounded = Math.round(val * factor) / factor;
  return getGlobalFormat().code(rounded);
}

function fmtFixed(val: number, decimals = 1): string {
  if (typeof val !== 'number' || !Number.isFinite(val)) return getGlobalFormat().num(0);
  return getGlobalFormat().code(val.toFixed(decimals));
}

function renderPeriodCell(label: string) {
  const parts = label.split('·').map((x) => x.trim()).filter(Boolean);
  if (parts.length >= 2) {
    return (
      <span
        style={{
          display: 'inline-flex',
          flexDirection: 'column',
          alignItems: 'center', textAlign: 'center',
          gap: 2,
          lineHeight: 1.25,
        }}
      >
        <bdi style={{ fontWeight: 700, color: 'var(--text)' }}>{parts[0]}</bdi>
        <span style={{ fontSize: 'calc(var(--fs-xs) - 1px)', color: 'var(--muted)', fontWeight: 500 }}>
          {parts.slice(1).join(' · ')}
        </span>
      </span>
    );
  }
  return <bdi style={{ fontWeight: 700, color: 'var(--text)' }}>{label}</bdi>;
}

export default function AggregateTabPanel({ active, logs, flocks }: Props) {
  const fmt = useFormat();
  const [period, setPeriod] = useState<Period>('week');
  const [flockFilter, setFlockFilter] = useState<string>('');
  const [showAllCols, setShowAllCols] = useState<boolean>(false);
  const [visibleCount, setVisibleCount] = useState<number>(12);
  const [selectedPeriodKeys, setSelectedPeriodKeys] = useState<string[]>([]);
  const [periodPickerOpen, setPeriodPickerOpen] = useState<boolean>(false);
  const [pickerYearFilter, setPickerYearFilter] = useState<string>("");
  const [pickerQuery, setPickerQuery] = useState<string>("");

  const buckets: Bucket[] = useMemo(() => {
    const map = new Map<string, Bucket>();

    for (const raw of logs) {
      if ((raw.status || 'active') !== 'active') continue;
      if (flockFilter && raw.flockId !== flockFilter) continue;

      const log = applyCorrections(raw);
      const key = bucketKey(log.date, period);
      if (!key) continue;

      let b = map.get(key);
      if (!b) {
        const range = bucketRange(log.date, period);
        b = {
          key,
          label: bucketLabel(key, period),
          rangeStart: range.start,
          rangeEnd: range.end,
          logCount: 0,
          deaths: 0,
          feed: 0,
          water: 0,
          eggsTotal: 0,
          tempSum: 0,
          tempCount: 0,
          humSum: 0,
          humCount: 0,
          avgTemp: null,
          avgHumidity: null,
          waterToFeed: null,
        };
        map.set(key, b);
      }

      b.logCount++;
      b.deaths += Number(log.deathsCount) || 0;
      b.feed += Number(log.feedConsumed ?? log.feedDelivered ?? 0) || 0;
      b.water += Number(log.waterAmount) || 0;
      b.eggsTotal +=
        (Number(log.eatingEggs) || 0) +
        (Number(log.fertileEggs) || 0) +
        (Number(log.brokenEggs) || 0) +
        (Number(log.otherEggs) || 0);

      if (typeof log.temperature === 'number' && Number.isFinite(log.temperature)) {
        b.tempSum += log.temperature;
        b.tempCount++;
      }
      if (typeof log.humidity === 'number' && Number.isFinite(log.humidity)) {
        b.humSum += log.humidity;
        b.humCount++;
      }
    }

    const list = Array.from(map.values())
        .map((b) => ({
          ...b,
          avgTemp: b.tempCount > 0 ? b.tempSum / b.tempCount : null,
          avgHumidity: b.humCount > 0 ? b.humSum / b.humCount : null,
          waterToFeed: b.feed > 0 && b.water > 0 ? b.water / b.feed : null,
        }))
        .sort((a, b) => {
          const byStart = (b.rangeStart || "").localeCompare(a.rangeStart || "", "en", { numeric: true });
          if (byStart !== 0) return byStart;
          const byEnd = (b.rangeEnd || "").localeCompare(a.rangeEnd || "", "en", { numeric: true });
          if (byEnd !== 0) return byEnd;
          return (b.key || "").localeCompare(a.key || "", "en", { numeric: true });
        });

    // مرتب‌سازی دقیق زمانی (جدیدترین دوره در بالا)
    return list.sort((a, b) => b.key.localeCompare(a.key));
  }, [logs, period, flockFilter]);

  useEffect(() => {
    const years = Array.from(new Set(buckets.map((b) => b.key.split("/")[0]).filter(Boolean)));
    if (pickerYearFilter && !years.includes(pickerYearFilter)) {
      setPickerYearFilter("");
    }
    const validSet = new Set(buckets.map((b) => b.key));
    setSelectedPeriodKeys((prev) => {
      const next = prev.filter((k) => validSet.has(k));
      return next.length === prev.length ? prev : next;
    });
  }, [buckets, pickerYearFilter]);

  const visibleBuckets = useMemo(() => {
    if (selectedPeriodKeys.length === 0) return buckets;
    const picked = new Set(selectedPeriodKeys);
    const filtered = buckets.filter((b) => picked.has(b.key));
    return filtered.length > 0 ? filtered : buckets;
  }, [buckets, selectedPeriodKeys]);

  const totals = useMemo(() => {
    let logCount = 0;
    let deaths = 0;
    let feed = 0;
    let water = 0;
    let eggsTotal = 0;
    let tempSum = 0;
    let tempCount = 0;
    let humSum = 0;
    let humCount = 0;

    for (const b of visibleBuckets) {
      logCount += b.logCount;
      deaths += b.deaths;
      feed += b.feed;
      water += b.water;
      eggsTotal += b.eggsTotal;
      tempSum += b.tempSum;
      tempCount += b.tempCount;
      humSum += b.humSum;
      humCount += b.humCount;
    }

    return {
      logCount,
      deaths,
      feed,
      water,
      eggsTotal,
      avgTemp: tempCount > 0 ? tempSum / tempCount : null,
      avgHumidity: humCount > 0 ? humSum / humCount : null,
      waterToFeed: feed > 0 && water > 0 ? water / feed : null,
    };
  }, [buckets]);

  const handleExportCSV = () => {
    if (buckets.length === 0) return;
    const headers = [
      'دوره', 'از', 'تا', 'تعداد لاگ', 'تلفات',
      'دان (kg)', 'آب (L)', 'نسبت آب/دان', 'تخم', 'دما °C', 'رطوبت ٪',
    ];
    const rows = buckets.map((b) => [
      b.label,
      b.rangeStart,
      b.rangeEnd,
      b.logCount,
      b.deaths,
      Math.round(b.feed * 10) / 10,
      Math.round(b.water * 10) / 10,
      b.waterToFeed !== null ? b.waterToFeed.toFixed(2) : '',
      b.eggsTotal,
      b.avgTemp !== null ? b.avgTemp.toFixed(1) : '',
      b.avgHumidity !== null ? b.avgHumidity.toFixed(1) : '',
    ]);
    const rawCsv = toCSV(headers, rows);
    const csv = rawCsv.startsWith('\uFEFF') ? rawCsv : `\uFEFF${rawCsv}`;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dlg-aggregate-${period}-${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!active) return null;

  const activeFlocks = flocks.filter((f) => f.status === 'active' && !f.paused);
  const showFlockSelect = activeFlocks.length > 1;
  const stickyDivider = '1px solid var(--border)';
  const opaqueSurfaceBg = 'var(--surface-2, var(--card-solid, #fff))';
  const opaqueCardBg = 'var(--card-solid, #fff)';
  const activePickedCount = selectedPeriodKeys.filter((k) =>
    buckets.some((b) => b.key === k)
  ).length;
  const availableYears = Array.from(
    new Set(buckets.map((b) => b.key.split("/")[0]).filter(Boolean))
  ).sort((a, b) => b.localeCompare(a));
  const normalizedQuery = toEnDigits(pickerQuery.trim()).toLowerCase();
  const filteredPickerBuckets = buckets.filter((b) => {
    if (pickerYearFilter && !b.key.startsWith(`${pickerYearFilter}/`)) return false;
    if (!normalizedQuery) return true;
    const hay = `${toEnDigits(b.label).toLowerCase()} ${b.key.toLowerCase()} ${b.rangeStart} ${b.rangeEnd}`;
    return hay.includes(normalizedQuery);
  });
  const togglePeriodKey = (key: string) => {
    setSelectedPeriodKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* هدر کنترل‌ها: تک‌ردیفه، غیرفشرده و قابل اسکرول افقی */}
      <div
        style={{
          width: '100%',
          boxSizing: 'border-box',
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--r-lg, 12px)',
          padding: 6,
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
          overflowX: 'auto',
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            minWidth: 'max-content',
          }}
        >
          {/* ۱. سوییچ هفتگی / ماهانه */}
          <div
            role="group"
            aria-label="بازه جمع‌بندی"
            style={{
              ...CTRL_BASE,
              width: 'auto',
              minWidth: 108,
              flexShrink: 0,
              padding: 2,
              gap: 2,
              display: 'inline-flex',
              alignItems: 'stretch',
            }}
          >
            <button
              type="button"
              aria-pressed={period === 'week'}
              onClick={() => setPeriod('week')}
              style={{ ...periodBtn(period === 'week'), padding: '0 10px' }}
            >
              هفتگی
            </button>
            <button
              type="button"
              aria-pressed={period === 'month'}
              onClick={() => setPeriod('month')}
              style={{ ...periodBtn(period === 'month'), padding: '0 10px' }}
            >
              ماهانه
            </button>
          </div>

          {/* ۲. فیلتر گله */}
          {showFlockSelect && (
            <div style={{ position: 'relative', flexShrink: 0, height: 36 }}>
              <SmartSelect
                value={flockFilter}
                onChange={v => setFlockFilter(v)}
                options={[
                  { value: '', label: 'همه گله‌ها' },
                  ...activeFlocks.map(f => ({ value: f.id, label: f.name })),
                ]}
                placeholder="همه گله‌ها"
                modalTitle="فیلتر گله"
                compact
                height={36}
              />
              <svg
                aria-hidden="true"
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--muted)"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{
                  position: 'absolute',
                  insetInlineEnd: 8,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  pointerEvents: 'none',
                }}
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            </div>
          )}

          {/* ۳. انتخاب چند ماه یا هفته */}
          <button
            type="button"
            aria-expanded={periodPickerOpen}
            disabled={buckets.length === 0}
            onClick={() => setPeriodPickerOpen((o) => !o)}
            style={{
              ...CTRL_BASE,
              width: 'auto',
              flexShrink: 0,
              padding: '0 11px',
              opacity: buckets.length === 0 ? 0.45 : 1,
              cursor: buckets.length === 0 ? 'not-allowed' : 'pointer',
              background:
                activePickedCount > 0 || periodPickerOpen
                  ? 'var(--accent-soft, rgba(22, 163, 74, 0.10))'
                  : 'var(--card)',
              color:
                activePickedCount > 0 || periodPickerOpen
                  ? 'var(--accent)'
                  : 'var(--text)',
              border:
                activePickedCount > 0 || periodPickerOpen
                  ? '1px solid var(--accent)'
                  : '1px solid var(--border)',
            }}
          >
            {activePickedCount > 0 ? `${fmt.count(activePickedCount)} دوره` : 'انتخاب دوره'}
          </button>

          {/* ۴. تغییر تعداد ستون‌ها */}
          <button
            type="button"
            aria-pressed={showAllCols}
            onClick={() => setShowAllCols((v) => !v)}
            style={{
              ...CTRL_BASE,
              width: 'auto',
              flexShrink: 0,
              padding: '0 11px',
              background: showAllCols
                ? 'var(--accent-soft, rgba(22, 163, 74, 0.10))'
                : 'var(--card)',
              color: showAllCols ? 'var(--accent)' : 'var(--text)',
              border: showAllCols
                ? '1px solid var(--accent)'
                : '1px solid var(--border)',
            }}
          >
            {showAllCols ? 'ستون‌های کمتر' : 'همه ستون‌ها'}
          </button>

          {/* ۵. <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><OptionIcon icon="export_report" size={16} /><span><span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><OptionIcon icon="export_report" size={16} /><span><span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><OptionIcon icon={resolveCategoryIconKey('export', 'csv')} size={16} /><span>خروجی CSV</span></span></span></span></span></span> */}
          <button
            type="button"
            disabled={visibleBuckets.length === 0}
            onClick={handleExportCSV}
            style={{
              ...CTRL_BASE,
              width: 'auto',
              flexShrink: 0,
              padding: '0 11px',
              opacity: visibleBuckets.length === 0 ? 0.45 : 1,
              cursor: visibleBuckets.length === 0 ? 'not-allowed' : 'pointer',
            }}
          >
            خروجی CSV
          </button>
        </div>
      </div>

      {/* پنل انتخاب چند ماه یا هفته دلخواه (سازگار با داده‌های کم و چندساله) */}
      {periodPickerOpen && buckets.length > 0 && (
        <div
          style={{
            background: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--r-lg, 12px)',
            padding: '8px 10px',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            boxShadow: '0 4px 14px rgba(0, 0, 0, 0.05)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 8,
              fontSize: 'var(--fs-xs)',
            }}
          >
            <span style={{ color: 'var(--muted)', fontWeight: 600 }}>
              {activePickedCount > 0
                ? `${fmt.count(activePickedCount)} دوره از ${fmt.count(buckets.length)} انتخاب شده`
                : `همه دوره‌ها نمایش داده می‌شوند (${fmt.count(buckets.length)} دوره)`}
            </span>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              {filteredPickerBuckets.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    const targetKeys = filteredPickerBuckets.map((b) => b.key);
                    setSelectedPeriodKeys((prev) =>
                      Array.from(new Set([...prev, ...targetKeys]))
                    );
                  }}
                  style={{
                    padding: '3px 8px',
                    fontSize: 'calc(var(--fs-xs) - 0.5px)',
                    fontWeight: 600,
                    fontFamily: 'inherit',
                    borderRadius: 'var(--r-md)',
                    border: '1px solid var(--border)',
                    background: 'var(--card)',
                    color: 'var(--text)',
                    cursor: 'pointer',
                  }}
                >
                  انتخاب نمایش‌داده‌شده‌ها
                </button>
              )}
              {activePickedCount > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedPeriodKeys([])}
                  style={{
                    padding: '3px 8px',
                    fontSize: 'calc(var(--fs-xs) - 0.5px)',
                    fontWeight: 600,
                    fontFamily: 'inherit',
                    borderRadius: 'var(--r-md)',
                    border: '1px solid var(--accent)',
                    background: 'var(--accent-soft, rgba(22, 163, 74, 0.10))',
                    color: 'var(--accent)',
                    cursor: 'pointer',
                  }}
                >
                  همه دوره‌ها
                </button>
              )}
              <button
                type="button"
                aria-label="بستن انتخاب دوره"
                onClick={() => setPeriodPickerOpen(false)}
                style={{
                  width: 22,
                  height: 22,
                  padding: 0,
                  fontSize: '13px',
                  lineHeight: 1,
                  fontFamily: 'inherit',
                  borderRadius: 'var(--r-md)',
                  border: '1px solid var(--border)',
                  background: 'var(--card)',
                  color: 'var(--muted)',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                ×
              </button>
            </div>
          </div>

          {(availableYears.length > 1 || buckets.length > 10) && (
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                gap: 6,
              }}
            >
              {availableYears.length > 1 && (
                <div style={{ display: 'inline-flex', flexWrap: 'wrap', gap: 4 }}>
                  <button
                    type="button"
                    onClick={() => setPickerYearFilter("")}
                    style={{
                      padding: '2px 7px',
                      fontSize: 'calc(var(--fs-xs) - 0.5px)',
                      fontWeight: pickerYearFilter === "" ? 700 : 500,
                      fontFamily: 'inherit',
                      borderRadius: 'var(--r-md)',
                      border: pickerYearFilter === "" ? '1px solid var(--accent)' : '1px solid var(--border)',
                      background: pickerYearFilter === "" ? 'var(--accent-soft, rgba(22, 163, 74, 0.10))' : 'var(--card)',
                      color: pickerYearFilter === "" ? 'var(--accent)' : 'var(--text)',
                      cursor: 'pointer',
                    }}
                  >
                    همه سال‌ها
                  </button>
                  {availableYears.map((yr) => {
                    const activeYr = pickerYearFilter === yr;
                    return (
                      <button
                        key={yr}
                        type="button"
                        onClick={() => setPickerYearFilter(activeYr ? "" : yr)}
                        style={{
                          padding: '2px 7px',
                          fontSize: 'calc(var(--fs-xs) - 0.5px)',
                          fontWeight: activeYr ? 700 : 500,
                          fontFamily: 'inherit',
                          borderRadius: 'var(--r-md)',
                          border: activeYr ? '1px solid var(--accent)' : '1px solid var(--border)',
                          background: activeYr ? 'var(--accent-soft, rgba(22, 163, 74, 0.10))' : 'var(--card)',
                          color: activeYr ? 'var(--accent)' : 'var(--text)',
                          cursor: 'pointer',
                        }}
                      >
                        {fmt.code(yr)}
                      </button>
                    );
                  })}
                </div>
              )}

              {buckets.length > 10 && (
                <input
                  type="search"
                  value={pickerQuery}
                  onChange={(e) => setPickerQuery(e.target.value)}
                  placeholder="جستجوی ماه یا هفته..."
                  aria-label="جستجوی ماه یا هفته"
                  style={{
                    flex: '1 1 130px',
                    minWidth: 110,
                    height: 24,
                    padding: '0 8px',
                    fontSize: 'var(--fs-xs)',
                    fontFamily: 'inherit',
                    color: 'var(--text)',
                    background: 'var(--input-bg, var(--card))',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--r-md)',
                    boxSizing: 'border-box',
                  }}
                />
              )}
            </div>
          )}

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
              gap: 6,
              maxHeight: 168,
              overflowY: 'auto',
              paddingInlineEnd: 2,
            }}
          >
            {filteredPickerBuckets.length === 0 ? (
              <div
                style={{
                  gridColumn: '1 / -1',
                  padding: '10px 6px',
                  textAlign: 'center',
                  fontSize: 'var(--fs-xs)',
                  color: 'var(--muted)',
                }}
              >
                دوره‌ای با این فیلتر پیدا نشد.
              </div>
            ) : (
              filteredPickerBuckets.map((b) => {
                const isSelected =
                  activePickedCount === 0 ? false : selectedPeriodKeys.includes(b.key);
                return (
                  <button
                    key={b.key}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => togglePeriodKey(b.key)}
                    style={{
                      padding: '5px 6px',
                      fontSize: 'calc(var(--fs-xs) - 0.5px)',
                      fontWeight: isSelected ? 700 : 500,
                      fontFamily: 'inherit',
                      borderRadius: 'var(--r-md)',
                      border: isSelected ? '1px solid var(--accent)' : '1px solid var(--border)',
                      background: isSelected ? 'var(--accent)' : 'var(--card)',
                      color: isSelected ? 'white' : 'var(--text)',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      textAlign: 'center',
                    }}
                  >
                    {b.label}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* حالت خالی */}
      {buckets.length === 0 && (
        <Empty
          icon={
            <svg
              width="30"
              height="30"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
            >
              <path d="M3 3v18h18" />
              <path d="m7 12 4-4 4 4 4-4" />
            </svg>
          }
          title="داده‌ای برای جمع‌بندی نیست"
          desc="پس از ثبت اولین لاگ روزانه، خلاصه هفتگی یا ماهانه اینجا نمایش داده می‌شود."
        />
      )}

      {/* جدول داده‌ها */}
      {buckets.length > 0 && (
        <div
          style={{
            background: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--r-lg, 12px)',
            overflow: 'hidden',
            boxShadow: '0 6px 20px rgba(0, 0, 0, 0.06)',
          }}
        >
          <div style={{ width: '100%', maxHeight: 460, overflow: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <table
              style={{
                width: '100%',
                minWidth: showAllCols ? 540 : '100%',
                tableLayout: showAllCols ? 'auto' : 'fixed',
                borderCollapse: 'separate',
                borderSpacing: 0,
                fontSize: 'var(--fs-sm)',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {!showAllCols && (
                <colgroup>
                  <col style={{ width: '20%' }} />
                  <col style={{ width: '10%' }} />
                  <col style={{ width: '12%' }} />
                  <col style={{ width: '17%' }} />
                  <col style={{ width: '15%' }} />
                  <col style={{ width: '13%' }} />
                  <col style={{ width: '13%' }} />
                </colgroup>
              )}

              <thead style={{ position: 'sticky', top: 0, zIndex: 5 }}>
                <tr style={{ background: 'var(--surface-2, var(--input-bg, var(--card-solid, #fff)))' }}>
                  <th
                    style={{
                      ...TH,
                      textAlign: 'center',
                                            width: showAllCols ? '1%' : undefined, minWidth: showAllCols ? 64 : 74, whiteSpace: 'nowrap',
                      position: 'sticky',
                      insetInlineStart: 0,
                      zIndex: 4,
                      background: 'var(--surface-2, var(--input-bg, var(--card-solid, #fff)))',
                      paddingInline: showAllCols ? 4 : 6, borderInlineEnd: stickyDivider,
                    }}
                  >
                    دوره
                  </th>
                  <th style={TH}>ثبت</th>
                  <th style={TH}>تلفات</th>
                  <th style={TH}>دان</th>
                  <th style={TH}>آب</th>
                  {showAllCols && <th style={TH}>آب/دان</th>}
                  <th style={TH}>تخم</th>
                  <th style={{ ...TH, paddingInlineEnd: 8 }}>دما</th>
                  {showAllCols && (
                    <th style={{ ...TH, paddingInlineEnd: 8 }}>رطوبت</th>
                  )}
                </tr>
              </thead>

              <tbody>
                {visibleBuckets.slice(0, visibleCount).map((b) => (
                  <tr key={b.key} style={{ background: 'var(--card-solid, #fff)' }}>
                    <td
                      style={{
                        ...TD,
                        textAlign: 'center',
                                              width: showAllCols ? '1%' : undefined, minWidth: showAllCols ? 64 : 74, whiteSpace: 'nowrap',
                      position: 'sticky',
                        insetInlineStart: 0,
                        zIndex: 3,
                        background: opaqueCardBg,
                        paddingInline: showAllCols ? 4 : 6, borderInlineEnd: stickyDivider,
                        borderBottom: '1px solid var(--border-strong, rgba(15, 23, 42, 0.18))',
                      }}
                    >
                      {renderPeriodCell(b.label)}
                    </td>

                    <td
                      style={{
                        ...TD,
                        borderBottom: '1px solid var(--border-strong, rgba(15, 23, 42, 0.18))',
                        color: b.logCount > 0 ? 'var(--text)' : 'var(--muted)',
                        fontWeight: b.logCount > 0 ? 600 : 400,
                      }}
                    >
                      {fmt.count(b.logCount)}
                    </td>

                    <td
                      style={{
                        ...TD,
                        borderBottom: '1px solid var(--border-strong, rgba(15, 23, 42, 0.18))',
                        color: b.deaths > 0 ? 'var(--danger)' : 'var(--muted)',
                        fontWeight: b.deaths > 0 ? 700 : 400,
                      }}
                    >
                      {fmt.count(b.deaths)}
                    </td>

                    <td style={{ ...TD, borderBottom: '1px solid var(--border-strong, rgba(15, 23, 42, 0.18))' }}>
                      <span
                        dir="ltr"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'baseline',
                          gap: 3,
                          whiteSpace: 'nowrap',
                          color: b.feed > 0 ? 'var(--text)' : 'var(--muted)',
                          fontWeight: b.feed > 0 ? 600 : 400,
                        }}
                      >
                        <bdi style={unitCell}>{fmtNum(b.feed)}</bdi>
                        <span style={unitTag}>kg</span>
                      </span>
                    </td>

                    <td style={{ ...TD, borderBottom: '1px solid var(--border-strong, rgba(15, 23, 42, 0.18))' }}>
                      <span
                        dir="ltr"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'baseline',
                          gap: 3,
                          whiteSpace: 'nowrap',
                          color: b.water > 0 ? 'var(--text)' : 'var(--muted)',
                          fontWeight: b.water > 0 ? 600 : 400,
                        }}
                      >
                        <bdi style={unitCell}>{fmtNum(b.water)}</bdi>
                        <span style={unitTag}>L</span>
                      </span>
                    </td>

                    {showAllCols && (
                      <td
                        style={{
                          ...TD,
                          borderBottom: '1px solid var(--border-strong, rgba(15, 23, 42, 0.18))',
                          color: b.waterToFeed !== null ? 'var(--text)' : 'var(--muted)',
                          fontWeight: b.waterToFeed !== null ? 600 : 400,
                        }}
                      >
                        {b.waterToFeed !== null ? (
                          <bdi>{fmtFixed(b.waterToFeed, 2)}</bdi>
                        ) : (
                          '—'
                        )}
                      </td>
                    )}

                    <td
                      style={{
                        ...TD,
                        borderBottom: '1px solid var(--border-strong, rgba(15, 23, 42, 0.18))',
                        color: b.eggsTotal > 0 ? 'var(--text)' : 'var(--muted)',
                        fontWeight: b.eggsTotal > 0 ? 600 : 400,
                      }}
                    >
                      {fmt.count(b.eggsTotal)}
                    </td>

                    <td
                      style={{
                        ...TD,
                        paddingInlineEnd: 8,
                        borderBottom: '1px solid var(--border-strong, rgba(15, 23, 42, 0.18))',
                        color: b.avgTemp !== null ? 'var(--text)' : 'var(--muted)',
                        fontWeight: b.avgTemp !== null ? 600 : 400,
                      }}
                    >
                      {b.avgTemp !== null ? (
                        <bdi>{fmtFixed(b.avgTemp, 1)}°</bdi>
                      ) : (
                        '—'
                      )}
                    </td>

                    {showAllCols && (
                      <td
                        style={{
                          ...TD,
                          paddingInlineEnd: 8,
                          borderBottom: '1px solid var(--border-strong, rgba(15, 23, 42, 0.18))',
                          color: b.avgHumidity !== null ? 'var(--text)' : 'var(--muted)',
                          fontWeight: b.avgHumidity !== null ? 600 : 400,
                        }}
                      >
                        {b.avgHumidity !== null ? (
                          <bdi>{fmtFixed(b.avgHumidity, 1)}٪</bdi>
                        ) : (
                          '—'
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>

              <tfoot style={{ position: 'sticky', bottom: 0, zIndex: 5 }}>
                <tr
                  style={{
                    background: 'var(--surface-2, var(--input-bg, var(--card-solid, #fff)))',
                    fontWeight: 700,
                  }}
                >
                  <td
                    style={{
                      ...TD,
                      textAlign: 'center',
                                            width: showAllCols ? '1%' : undefined, minWidth: showAllCols ? 64 : 74, whiteSpace: 'nowrap',
                      position: 'sticky',
                      insetInlineStart: 0,
                      zIndex: 4,
                      background: 'var(--surface-2, var(--input-bg, var(--card-solid, #fff)))',
                      paddingInline: showAllCols ? 4 : 6, borderInlineEnd: stickyDivider,
                      borderTop: '1px solid var(--border)',
                      color: 'var(--text)',
                      fontWeight: 700,
                    }}
                  >
                    {showAllCols ? (
                      <span style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', lineHeight: 1.2, fontSize: 'calc(var(--fs-xs) - 1px)' }}>
                        <span>جمع /</span>
                        <span>میانگین</span>
                      </span>
                    ) : (
                      'جمع کل'
                    )}
                  </td>

                  <td
                    style={{
                      ...TD,
                      borderTop: '1px solid var(--border)',
                      color: totals.logCount > 0 ? 'var(--text)' : 'var(--muted)',
                      fontWeight: 700,
                    }}
                  >
                    {fmt.count(totals.logCount)}
                  </td>

                  <td
                    style={{
                      ...TD,
                      borderTop: '1px solid var(--border)',
                      color: totals.deaths > 0 ? 'var(--danger)' : 'var(--muted)',
                      fontWeight: 700,
                    }}
                  >
                    {fmt.count(totals.deaths)}
                  </td>

                  <td style={{ ...TD, borderTop: '1px solid var(--border)' }}>
                    <span
                      dir="ltr"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'baseline',
                        gap: 3,
                        whiteSpace: 'nowrap',
                        color: totals.feed > 0 ? 'var(--text)' : 'var(--muted)',
                        fontWeight: totals.feed > 0 ? 700 : 400,
                      }}
                    >
                      <bdi style={unitCell}>{fmtNum(totals.feed)}</bdi>
                      <span style={unitTag}>kg</span>
                    </span>
                  </td>

                  <td style={{ ...TD, borderTop: '1px solid var(--border)' }}>
                    <span
                      dir="ltr"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'baseline',
                        gap: 3,
                        whiteSpace: 'nowrap',
                        color: totals.water > 0 ? 'var(--text)' : 'var(--muted)',
                        fontWeight: totals.water > 0 ? 700 : 400,
                      }}
                    >
                      <bdi style={unitCell}>{fmtNum(totals.water)}</bdi>
                      <span style={unitTag}>L</span>
                    </span>
                  </td>

                  {showAllCols && (
                    <td
                      style={{
                        ...TD,
                        borderTop: '1px solid var(--border)',
                        color: totals.waterToFeed !== null ? 'var(--text)' : 'var(--muted)',
                        fontWeight: totals.waterToFeed !== null ? 700 : 400,
                      }}
                    >
                      {totals.waterToFeed !== null ? (
                        <bdi>{fmtFixed(totals.waterToFeed, 2)}</bdi>
                      ) : (
                        '—'
                      )}
                    </td>
                  )}

                  <td
                    style={{
                      ...TD,
                      borderTop: '1px solid var(--border)',
                      color: totals.eggsTotal > 0 ? 'var(--text)' : 'var(--muted)',
                      fontWeight: totals.eggsTotal > 0 ? 700 : 400,
                    }}
                  >
                    {fmt.count(totals.eggsTotal)}
                  </td>

                  <td
                    style={{
                      ...TD,
                      paddingInlineEnd: 8,
                      borderTop: '1px solid var(--border)',
                      color: totals.avgTemp !== null ? 'var(--text)' : 'var(--muted)',
                      fontWeight: totals.avgTemp !== null ? 700 : 400,
                    }}
                  >
                    {totals.avgTemp !== null ? (
                      <bdi>{fmtFixed(totals.avgTemp, 1)}°</bdi>
                    ) : (
                      '—'
                    )}
                  </td>

                  {showAllCols && (
                    <td
                      style={{
                        ...TD,
                        paddingInlineEnd: 8,
                        borderTop: '1px solid var(--border)',
                        color: totals.avgHumidity !== null ? 'var(--text)' : 'var(--muted)',
                        fontWeight: totals.avgHumidity !== null ? 700 : 400,
                      }}
                    >
                      {totals.avgHumidity !== null ? (
                        <bdi>{fmtFixed(totals.avgHumidity, 1)}٪</bdi>
                      ) : (
                        '—'
                      )}
                    </td>
                  )}
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

const CTRL_BASE: CSSProperties = {
  height: 36,
  minHeight: 36,
  width: '100%',
  minWidth: 0,
  boxSizing: 'border-box',
  background: 'var(--card-solid, var(--card))',
  border: '1px solid var(--border)',
  borderRadius: 'var(--r-md)',
  fontFamily: 'inherit',
  fontSize: 'var(--fs-xs)',
  fontWeight: 600,
  lineHeight: 1.2,
  color: 'var(--text)',
  whiteSpace: 'nowrap',
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'background 0.15s ease, color 0.15s ease, border-color 0.15s ease',
};

function periodBtn(active: boolean): CSSProperties {
  return {
    flex: 1,
    minWidth: 0,
    height: '100%',
    padding: '0 8px',
    background: active ? 'var(--accent)' : 'transparent',
    color: active ? '#fff' : 'var(--text)',
    border: 'none',
    borderRadius: 'calc(var(--r-md) - 3px)',
    cursor: 'pointer',
    fontFamily: 'inherit',
    fontSize: 'var(--fs-xs)',
    fontWeight: 600,
    lineHeight: 1.2,
    whiteSpace: 'nowrap',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: active ? '0 1px 2px rgba(0, 0, 0, 0.14)' : 'none',
    transition: 'background 0.15s ease, color 0.15s ease',
  };
}

const unitCell: CSSProperties = {
  fontVariantNumeric: 'tabular-nums',
  whiteSpace: 'nowrap',
};

const unitTag: CSSProperties = {
  fontSize: 'var(--fs-xs)',
  color: 'var(--muted)',
  fontWeight: 500,
  whiteSpace: 'nowrap',
};

const TH: CSSProperties = {
  padding: '8px 6px',
  fontSize: 'var(--fs-xs)',
  fontWeight: 700,
  color: 'var(--muted)',
  textAlign: 'center',
  whiteSpace: 'nowrap',
  borderBottom: '1px solid var(--border)',
};

const TD: CSSProperties = {
  padding: '8px 6px',
  fontSize: 'var(--fs-sm)',
  fontWeight: 500,
  color: 'var(--text)',
  textAlign: 'center',
  verticalAlign: 'middle',
  whiteSpace: 'nowrap',
  fontVariantNumeric: 'tabular-nums',
};
