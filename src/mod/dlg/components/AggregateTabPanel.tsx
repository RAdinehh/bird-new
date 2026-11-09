/**
 * AggregateTabPanel.tsx — تب «جمع‌بندی» در /dlg
 *
 * نمایش جدول تجمیع هفتگی/ماهانه از لاگ‌های فعال.
 * خواندن-فقط — بدون ویرایش.
 * applyCorrections روی هر لاگ اعمال می‌شود.
 */
import { useState, useMemo } from 'react';
import type { CSSProperties } from 'react';
import { applyCorrections } from '../api/applyCorrections';
import type { DailyLog } from '../store';
import type { Flock } from '../../flk/store';
import { Empty, Btn } from '../../../shr/components/ui';
import { toFa } from '../../../shr/utils/fa';
import { toCSV } from '../../../shr/utils/export';

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
  avgTemp: number | null;
  avgHumidity: number | null;
}

function bucketKey(date: string, period: Period): string | null {
  const parts = date.split('/');
  if (parts.length !== 3) return null;
  const y = parts[0];
  const m = parts[1];
  const d = parseInt(parts[2], 10);
  if (isNaN(d) || d < 1) return null;
  if (period === 'month') return `${y}/${m}`;
  const w = Math.ceil(d / 7);
  return `${y}/${m}/W${w}`;
}

function bucketLabel(key: string, period: Period): string {
  if (period === 'month') {
    const [y, m] = key.split('/');
    return `${toFa(y)}/${toFa(m)}`;
  }
  const [y, m, w] = key.split('/');
  return `${toFa(y)}/${toFa(m)} هفته ${toFa(w.replace('W', ''))}`;
}

function bucketRange(date: string, period: Period): { start: string; end: string } {
  const parts = date.split('/');
  if (parts.length !== 3) return { start: date, end: date };
  if (period === 'month') {
    return { start: `${parts[0]}/${parts[1]}/01`, end: `${parts[0]}/${parts[1]}/31` };
  }
  const d = parseInt(parts[2], 10);
  const w = Math.ceil(d / 7);
  const startDay = (w - 1) * 7 + 1;
  const endDay = Math.min(w * 7, 31);
  return {
    start: `${parts[0]}/${parts[1]}/${String(startDay).padStart(2, '0')}`,
    end: `${parts[0]}/${parts[1]}/${String(endDay).padStart(2, '0')}`,
  };
}

export default function AggregateTabPanel({ active, logs, flocks }: Props) {
  const [period, setPeriod] = useState<Period>('week');
  const [flockFilter, setFlockFilter] = useState<string>('');

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
          avgTemp: null,
          avgHumidity: null,
        };
        map.set(key, b);
      }

      const prevTemp = b.avgTemp;
      const prevHum = b.avgHumidity;
      b.logCount++;
      b.deaths += log.deathsCount || 0;
      b.feed += log.feedConsumed ?? log.feedDelivered ?? 0;
      b.water += log.waterAmount || 0;
      b.eggsTotal +=
        (log.eatingEggs || 0) +
        (log.fertileEggs || 0) +
        (log.brokenEggs || 0) +
        (log.otherEggs || 0);

      if (log.temperature !== null && log.temperature !== undefined) {
        const n = b.logCount;
        b.avgTemp = ((prevTemp ?? 0) * (n - 1) + log.temperature) / n;
      }
      if (log.humidity !== null && log.humidity !== undefined) {
        const n = b.logCount;
        b.avgHumidity = ((prevHum ?? 0) * (n - 1) + log.humidity) / n;
      }
    }

    return Array.from(map.values()).sort((a, b) => b.key.localeCompare(a.key));
  }, [logs, period, flockFilter]);

  const handleExportCSV = () => {
    const headers = [
      'دوره', 'از', 'تا', 'تعداد لاگ', 'تلفات',
      'دان (kg)', 'آب (L)', 'تخم', 'دما °C', 'رطوبت ٪',
    ];
    const rows = buckets.map((b) => [
      b.label, b.rangeStart, b.rangeEnd, b.logCount, b.deaths,
      Math.round(b.feed * 10) / 10,
      Math.round(b.water * 10) / 10,
      b.eggsTotal,
      b.avgTemp !== null ? Math.round(b.avgTemp * 10) / 10 : '',
      b.avgHumidity !== null ? Math.round(b.avgHumidity * 10) / 10 : '',
    ]);
    const csv = toCSV(headers, rows);
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Controls */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{
          display: 'flex', gap: 0, background: 'var(--input-bg)',
          borderRadius: 'var(--r-md)', padding: 3,
          border: '1px solid var(--border)',
        }}>
          <button
            type="button"
            onClick={() => setPeriod('week')}
            style={periodBtn(period === 'week')}
          >هفتگی</button>
          <button
            type="button"
            onClick={() => setPeriod('month')}
            style={periodBtn(period === 'month')}
          >ماهانه</button>
        </div>

        {activeFlocks.length > 1 && (
          <select
            value={flockFilter}
            onChange={(e) => setFlockFilter(e.target.value)}
            aria-label="فیلتر گله"
            style={{
              padding: '6px 10px', background: 'var(--input-bg)',
              border: '1px solid var(--border)', borderRadius: 'var(--r-sm)',
              fontFamily: 'inherit', fontSize: 'var(--fs-sm)',
              color: 'var(--text)', cursor: 'pointer',
            }}
          >
            <option value="">همه گله‌ها</option>
            {activeFlocks.map((f) => (
              <option key={f.id} value={f.id}>{f.name}</option>
            ))}
          </select>
        )}

        <div style={{ marginInlineStart: 'auto' }}>
          <Btn variant="outline" onClick={handleExportCSV}>📤 CSV</Btn>
        </div>
      </div>

      {/* Empty */}
      {buckets.length === 0 && (
        <Empty
          icon={
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
              <path d="M3 3v18h18" />
              <path d="m7 12 4-4 4 4 4-4" />
            </svg>
          }
          title="داده‌ای برای جمع‌بندی نیست"
          desc="پس از ثبت اولین لاگ روزانه، خلاصه هفتگی/ماهانه اینجا نمایش داده می‌شود."
        />
      )}

      {/* Table */}
      {buckets.length > 0 && (
        <div style={{
          background: 'var(--card)', border: '1px solid var(--border)',
          borderRadius: 'var(--r-md)', overflow: 'hidden',
        }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--fs-sm)' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border)' }}>
                  <th style={TH}>دوره</th>
                  <th style={TH}>#</th>
                  <th style={TH}>تلفات</th>
                  <th style={TH}>دان</th>
                  <th style={TH}>آب</th>
                  <th style={TH}>تخم</th>
                  <th style={TH}>دما</th>
                  <th style={TH}>رطوبت</th>
                </tr>
              </thead>
              <tbody>
                {buckets.map((b) => (
                  <tr key={b.key} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={TD}>{b.label}</td>
                    <td style={TD}>{toFa(b.logCount)}</td>
                    <td style={{
                      ...TD,
                      color: b.deaths > 0 ? 'var(--danger)' : 'var(--muted)',
                      fontWeight: b.deaths > 0 ? 700 : 400,
                    }}>{toFa(b.deaths)}</td>
                    <td style={TD}>{toFa(Math.round(b.feed * 10) / 10)} kg</td>
                    <td style={TD}>{toFa(Math.round(b.water * 10) / 10)} L</td>
                    <td style={TD}>{toFa(b.eggsTotal)}</td>
                    <td style={TD}>{b.avgTemp !== null ? `${toFa(Math.round(b.avgTemp * 10) / 10)}°` : '—'}</td>
                    <td style={TD}>{b.avgHumidity !== null ? `${toFa(Math.round(b.avgHumidity * 10) / 10)}٪` : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function periodBtn(active: boolean): CSSProperties {
  return {
    padding: '6px 12px',
    background: active ? 'var(--accent)' : 'transparent',
    color: active ? 'white' : 'var(--muted)',
    border: 'none', borderRadius: 'var(--r-sm)',
    cursor: 'pointer', fontFamily: 'inherit',
    fontSize: 'var(--fs-sm)', fontWeight: 600,
  };
}

const TH: CSSProperties = {
  padding: '8px 6px', textAlign: 'start', fontWeight: 700,
  color: 'var(--muted)', fontSize: 'var(--fs-xs)',
};

const TD: CSSProperties = {
  padding: '8px 6px', fontFamily: 'monospace', fontWeight: 600,
};
