/**
 * StatsPage — آمار و تحلیل تخم‌گذاری
 */
import { useState, useMemo } from 'react';
import { useEgg } from './store';
import { useFlk } from '../flk/store';
import { PageContainer, Select, Empty } from '../../shr/components/ui';
import { toFa } from '../../shr/utils/fa';
import { BarChart, LineChart, DualBarChart, PieChart } from '../../shr/components/Charts';

type Range = '7' | '30' | '90' | 'all';

function toEnDate(d: string): string {
  return d.replace(/[۰-۹]/g, (x: string) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(x)));
}

function cutOff(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;
}

function shortDate(d: string): string {
  const p = (d || '').split('/');
  if (p.length !== 3) return d;
  return `${p[1]}/${p[2]}`;
}

export default function StatsPage() {
  const { productions } = useEgg();
  const { flocks } = useFlk();
  const [filterFlock, setFilterFlock] = useState('');
  const [range, setRange] = useState<Range>('30');
  const [chartType, setChartType] = useState<'bar' | 'line' | 'dual' | 'pie'>('bar');

  const activeFlocks = flocks.filter(f => f.status === 'active' && (f.type === 'layer' || f.type === 'breeder'));

  const filtered = useMemo(() => {
    let arr = [...productions];
    if (filterFlock) arr = arr.filter(p => p.flockId === filterFlock);
    if (range !== 'all') {
      const cut = cutOff(parseInt(range));
      arr = arr.filter(p => toEnDate(p.date || '') >= cut);
    }
    return arr.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  }, [productions, filterFlock, range]);

  const stats = useMemo(() => {
    let eating = 0, fertile = 0, broken = 0, other = 0;
    for (const p of filtered) {
      eating += p.eatingCount || 0;
      fertile += p.fertileCount || 0;
      broken += p.brokenCount || 0;
      other += (p.softCount || 0) + (p.dirtyCount || 0);
    }
    const healthy = eating + fertile;
    const total = healthy + broken + other;
    // pctFixApplied — همه از total برای یکنواختی
    const brokenPct = total > 0 ? Math.round((broken / total) * 1000) / 10 : 0;
    const fertilePct = total > 0 ? Math.round((fertile / total) * 1000) / 10 : 0;
    const eatingPct = total > 0 ? Math.round((eating / total) * 1000) / 10 : 0;
    const otherPct = total > 0 ? Math.round((other / total) * 1000) / 10 : 0;
    const dayCount = new Set(filtered.map(p => p.date)).size;
    const avgHealthy = dayCount > 0 ? Math.round(healthy / dayCount) : 0;
    const avgTotal = dayCount > 0 ? Math.round(total / dayCount) : 0;
    return { eating, fertile, broken, other, healthy, total, brokenPct, fertilePct, eatingPct, otherPct, dayCount, avgHealthy, avgTotal };
  }, [filtered]);

  const flockRank = useMemo(() => {
    const map = new Map<string, { name: string; total: number; healthy: number; broken: number; days: number }>();
    for (const p of filtered) {
      const k = p.flockId;
      const flock = flocks.find(f => f.id === k);
      if (!flock) continue;
      if (!map.has(k)) map.set(k, { name: flock.name, total: 0, healthy: 0, broken: 0, days: 0 });
      const r = map.get(k)!;
      const h = (p.eatingCount || 0) + (p.fertileCount || 0);
      r.total += h + (p.brokenCount || 0) + (p.softCount || 0) + (p.dirtyCount || 0);
      r.healthy += h;
      r.broken += p.brokenCount || 0;
      r.days += 1;
    }
    return [...map.values()].sort((a, b) => b.healthy - a.healthy);
  }, [filtered, flocks]);

  const dayRank = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of filtered) {
      const d = p.date || '';
      const h = (p.eatingCount || 0) + (p.fertileCount || 0);
      map.set(d, (map.get(d) || 0) + h);
    }
    return [...map.entries()].map(([date, healthy]) => ({ date, healthy })).sort((a, b) => b.healthy - a.healthy);
  }, [filtered]);

  const trend = useMemo(() => {
    const map = new Map<string, { healthy: number; broken: number }>();
    for (const p of filtered) {
      const d = p.date || '';
      if (!map.has(d)) map.set(d, { healthy: 0, broken: 0 });
      const r = map.get(d)!;
      r.healthy += (p.eatingCount || 0) + (p.fertileCount || 0);
      r.broken += p.brokenCount || 0;
    }
    const sorted = [...map.entries()].sort((a, b) => a[0].localeCompare(b[0])).slice(-30);
    const days = sorted.map(([date, v]) => ({ date, healthy: v.healthy, broken: v.broken }));
    const max = Math.max(...days.map(d => d.healthy), 1);
    return { days, max };
  }, [filtered]);

  const alert = useMemo(() => {
    if (trend.days.length < 4) return null;
    const last3 = trend.days.slice(-3);
    const prev3 = trend.days.slice(-6, -3);
    if (prev3.length === 0) return null;
    const avgLast = last3.reduce((a, d) => a + d.healthy, 0) / last3.length;
    const avgPrev = prev3.reduce((a, d) => a + d.healthy, 0) / prev3.length;
    if (avgPrev === 0) return null;
    const drop = ((avgLast - avgPrev) / avgPrev) * 100;
    if (drop < -10) return { drop: Math.round(drop), avgLast: Math.round(avgLast), avgPrev: Math.round(avgPrev) };
    return null;
  }, [trend]);

  const weekly = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of filtered) {
      const d = toEnDate(p.date || '');
      const parts = d.split('/');
      if (parts.length !== 3) continue;
      const dt = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      const day = dt.getDay();
      const diff = (day + 1) % 7; // شنبه=0
      const start = new Date(dt);
      start.setDate(dt.getDate() - diff);
      const key = `${start.getFullYear()}/${String(start.getMonth() + 1).padStart(2, '0')}/${String(start.getDate()).padStart(2, '0')}`;
      const h = (p.eatingCount || 0) + (p.fertileCount || 0);
      map.set(key, (map.get(key) || 0) + h);
    }
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0])).slice(-8).map(([week, total]) => ({ week, total }));
  }, [filtered]);

  const monthly = useMemo(() => {
    const map = new Map<string, { total: number; fertile: number; broken: number }>();
    for (const p of filtered) {
      const d = toEnDate(p.date || '');
      const parts = d.split('/');
      if (parts.length !== 3) continue;
      const key = `${parts[0]}/${parts[1]}`;
      if (!map.has(key)) map.set(key, { total: 0, fertile: 0, broken: 0 });
      const r = map.get(key)!;
      r.total += (p.eatingCount || 0) + (p.fertileCount || 0);
      r.fertile += p.fertileCount || 0;
      r.broken += p.brokenCount || 0;
    }
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0])).slice(-6).map(([month, v]) => ({ month, ...v }));
  }, [filtered]);

  // دوره قبل (برای مقایسه)
  const prevRangeStats = useMemo(() => {
    if (range === 'all') return null;
    const rangeDays = parseInt(range);
    const startCur = cutOff(rangeDays);
    const startPrev = cutOff(rangeDays * 2);
    const prev = productions.filter(p => {
      const d = toEnDate(p.date || '');
      return d >= startPrev && d < startCur;
    });
    let healthy = 0, total = 0, broken = 0;
    for (const p of prev) {
      const h = (p.eatingCount || 0) + (p.fertileCount || 0);
      healthy += h;
      total += h + (p.brokenCount || 0) + (p.softCount || 0) + (p.dirtyCount || 0);
      broken += p.brokenCount || 0;
    }
    return { healthy, total, broken, count: prev.length };
  }, [productions, range]);

  // توده تخم (kg) — میانگین ۶۰ گرم
  const eggMassKg = useMemo(() => {
    const totalHealthy = stats.eating + stats.fertile;
    return Math.round((totalHealthy * 60) / 100) / 10;
  }, [stats]);

  // بهترین/بدترین روز هفته
  const byWeekday = useMemo(() => {
    const names = ['شنبه', 'یک‌شنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه'];
    const map = new Map<number, { total: number; days: number }>();
    for (const p of filtered) {
      const d = toEnDate(p.date || '');
      const parts = d.split('/');
      if (parts.length !== 3) continue;
      const dt = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      const day = (dt.getDay() + 1) % 7;
      if (!map.has(day)) map.set(day, { total: 0, days: 0 });
      const r = map.get(day)!;
      r.total += (p.eatingCount || 0) + (p.fertileCount || 0);
      r.days += 1;
    }
    const arr: { name: string; avg: number; total: number }[] = [];
    for (const [day, v] of map.entries()) {
      if (v.days === 0) continue;
      arr.push({ name: names[day], avg: Math.round(v.total / v.days), total: v.total });
    }
    arr.sort((a, b) => b.avg - a.avg);
    return arr;
  }, [filtered]);

  // پیش‌بینی هفته بعد (میانگین ۷ روز اخیر × ۷)
  const forecast = useMemo(() => {
    const last7 = trend.days.slice(-7);
    if (last7.length < 3) return null;
    const avg = last7.reduce((a, d) => a + d.healthy, 0) / last7.length;
    return { avg: Math.round(avg), next7: Math.round(avg * 7), days: last7.length };
  }, [trend]);

  const rangeLabel = range === '7' ? '۷ روز' : range === '30' ? '۳۰ روز' : range === '90' ? '۹۰ روز' : 'کل';

  // اعتبارسنجی دوره
  const coverage = useMemo(() => {
    if (range === 'all') {
      const allDates = new Set(productions.map(p => p.date).filter(Boolean));
      return { days: allDates.size, rangeDays: 0, pct: 100, insufficient: false };
    }
    const rangeDays = parseInt(range);
    const allDates = new Set(filtered.map(p => p.date).filter(Boolean));
    const pct = rangeDays > 0 ? Math.round((allDates.size / rangeDays) * 100) : 100;
    return {
      days: allDates.size,
      rangeDays,
      pct,
      insufficient: allDates.size < Math.min(3, rangeDays),
    };
  }, [filtered, range, productions]);

  // اگه تعداد روزهای داده < 3، میانگین معنی نداره
  const canAvg = coverage.days >= 2;
  const canWeekly = coverage.days >= 7;
  const canMonthly = coverage.days >= 20;

  return (
    <PageContainer>
      {/* فیلترها — کنار هم */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
        <Select value={range} onChange={e => setRange(e.target.value as Range)}>
          <option value="7">۷ روز اخیر</option>
          <option value="30">۳۰ روز اخیر</option>
          <option value="90">۹۰ روز اخیر</option>
          <option value="all">همه</option>
        </Select>
        <Select value={filterFlock} onChange={e => setFilterFlock(e.target.value)}>
          <option value="">همه گله‌ها</option>
          {activeFlocks.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
        </Select>
      </div>

      {stats.total === 0 ? (
        <Empty
          icon={<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M3 3v18h18"/><path d="M7 14l4-4 4 4 5-5"/></svg>}
          title="آماری موجود نیست"
          desc="هنوز تخم‌گذاری در این بازه ثبت نشده."
        />
      ) : (
        <>
          {alert && (
            <div style={{ padding: '10px 12px', background: 'var(--danger-soft)', border: '1px solid var(--danger)', borderRadius: 'var(--r-md)', fontSize: 'var(--fs-xs)', color: 'var(--danger)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: '1.2em' }}>⚠️</span>
              <span>افت {toFa(Math.abs(alert.drop))}٪ تولید — ۳ روز اخیر: {toFa(alert.avgLast)} (قبلاً {toFa(alert.avgPrev)})</span>
            </div>
          )}

          {/* هشدار پوشش داده */}
          {coverage.insufficient && range !== 'all' && (
            <div style={{ padding: '8px 12px', background: 'var(--warn-soft)', border: '1px dashed var(--warn)', borderRadius: 'var(--r-md)', fontSize: 'var(--fs-xs)', color: 'var(--warn)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: '1.2em' }}>💡</span>
              <span>فقط {toFa(coverage.days)} روز از {toFa(coverage.rangeDays)} روز بازه داده دارید — میانگین‌ها ممکنه دقیق نباشن</span>
            </div>
          )}

          {/* خلاصه compact — ۴ کارت */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            <div style={{ padding: '10px 12px', background: 'var(--accent-soft)', border: '1px solid var(--accent-border)', borderRadius: 'var(--r-md)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--accent)', fontWeight: 700 }}>کل تخم</div>
                <div style={{ fontSize: 'var(--fs-lg)', fontWeight: 700, color: 'var(--accent)', marginTop: 2 }}>{toFa(stats.total.toLocaleString('fa-IR'))}</div>
              </div>
              <span style={{ fontSize: '1.6em', opacity: 0.5 }}>🥚</span>
            </div>
            <div style={{ padding: '10px 12px', background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', fontWeight: 700 }}>میانگین روزانه</div>
                <div style={{ fontSize: 'var(--fs-lg)', fontWeight: 700, color: 'var(--text)', marginTop: 2 }}>
                  {canAvg ? toFa(stats.avgHealthy.toLocaleString('fa-IR')) : '—'}
                </div>
                <div style={{ fontSize: '10px', color: 'var(--muted)' }}>
                  {canAvg ? `سالم از ${toFa(coverage.days)} روز` : 'داده کافی نیست'}
                </div>
              </div>
              <span style={{ fontSize: '1.6em', opacity: 0.5 }}>📅</span>
            </div>
          </div>

          {/* توده تخم */}
          <div style={{ padding: '10px 12px', background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', fontWeight: 700 }}>توده تخم (تقریبی)</div>
              <div style={{ fontSize: 'var(--fs-lg)', fontWeight: 700, color: 'var(--text)', marginTop: 2 }}>{toFa(eggMassKg.toLocaleString('fa-IR'))} kg</div>
              <div style={{ fontSize: '10px', color: 'var(--muted)' }}>میانگین ۶۰ گرم/تخم</div>
            </div>
            <span style={{ fontSize: '1.6em', opacity: 0.5 }}>⚖️</span>
          </div>

          {/* مقایسه با دوره قبل */}
          {prevRangeStats && prevRangeStats.healthy > 0 && (
            <div style={{ padding: '10px 12px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontSize: 'var(--fs-sm)', fontWeight: 700, color: 'var(--text)' }}>📊 مقایسه با دوره قبل</span>
              <CompareRow label="تخم سالم" cur={stats.healthy} prev={prevRangeStats.healthy} />
              <CompareRow label="کل تخم" cur={stats.total} prev={prevRangeStats.total} />
              <CompareRow label="شکسته" cur={stats.broken} prev={prevRangeStats.broken} inverse />
            </div>
          )}

          {/* پیش‌بینی */}
          {forecast && (
            <div style={{ padding: '10px 12px', background: 'var(--accent-soft)', border: '1px solid var(--accent-border)', borderRadius: 'var(--r-md)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--accent)', fontWeight: 700 }}>🔮 پیش‌بینی هفته بعد</div>
                <div style={{ fontSize: 'var(--fs-lg)', fontWeight: 700, color: 'var(--accent)', marginTop: 2 }}>{toFa(forecast.next7.toLocaleString('fa-IR'))} تخم</div>
                <div style={{ fontSize: '10px', color: 'var(--muted)' }}>بر اساس میانگین {toFa(forecast.days)} روز اخیر ({toFa(forecast.avg)}/روز)</div>
              </div>
              <span style={{ fontSize: '1.6em', opacity: 0.5 }}>🔮</span>
            </div>
          )}

          {/* کیفیت تخم — نوارهای compact */}
          <div style={{ padding: '12px 14px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 'var(--fs-base)', fontWeight: 700, color: 'var(--text)' }}>⭐ کیفیت تخم</span>
              <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)' }}>{rangeLabel}</span>
            </div>

            <QualityBar icon="🌱" label="نطفه‌دار" pct={stats.fertilePct} count={stats.fertile} total={stats.total} color="var(--purple)" />
            <QualityBar icon="🥚" label="خوراکی" pct={stats.eatingPct} count={stats.eating} total={stats.total} color="var(--accent)" />
            <QualityBar icon="💔" label="شکسته" pct={stats.brokenPct} count={stats.broken} total={stats.total} color="var(--warn)" />
            {stats.other > 0 && (
              <QualityBar icon="📦" label="سایر" pct={stats.otherPct} count={stats.other} total={stats.total} color="var(--muted)" />
            )}
          </div>

          {/* روند روزانه — چند حالت */}
          {trend.days.length >= 2 && (
            <div style={{ padding: '12px 14px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
                <span style={{ fontSize: 'var(--fs-base)', fontWeight: 700, color: 'var(--text)' }}>📈 روند روزانه</span>
                <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)' }}>{toFa(trend.days.length)} روز</span>
              </div>

              {/* انتخاب نوع نمودار */}
              <div style={{ display: 'flex', gap: 4 }}>
                <ChartTab active={chartType === 'bar'} onClick={() => setChartType('bar')} icon="📊" label="میله‌ای" />
                <ChartTab active={chartType === 'line'} onClick={() => setChartType('line')} icon="📈" label="خطی" />
                <ChartTab active={chartType === 'dual'} onClick={() => setChartType('dual')} icon="📉" label="دو-ستونی" />
                <ChartTab active={chartType === 'pie'} onClick={() => setChartType('pie')} icon="🥧" label="دایره‌ای" />
              </div>

              {!canWeekly && (
                <div style={{ padding: '8px 10px', background: 'var(--input-bg)', borderRadius: 'var(--r-sm)', fontSize: 'var(--fs-xs)', color: 'var(--muted)', textAlign: 'center' }}>
                  💡 برای روند هفتگی، حداقل ۷ روز داده لازمه
                </div>
              )}

              {chartType === 'bar' && (
                <BarChart
                  data={trend.days.map(d => ({ label: shortDate(d.date), value: d.healthy }))}
                  color="var(--accent)"
                  height={140}
                />
              )}
              {chartType === 'line' && (
                <LineChart
                  data={trend.days.map(d => ({ label: shortDate(d.date), value: d.healthy }))}
                  color="var(--accent)"
                  height={140}
                />
              )}
              {chartType === 'dual' && (
                <DualBarChart
                  data={trend.days.map(d => ({ label: shortDate(d.date), a: d.healthy, b: d.broken }))}
                  colorA="var(--accent)"
                  colorB="var(--warn)"
                  labelA="سالم"
                  labelB="شکسته"
                  height={140}
                />
              )}
              {chartType === 'pie' && (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 0' }}>
                  {/* pieConsistencyApplied — درصد ۱ اعشاری یکسان با نوارها */}
                  <PieChart
                    data={[
                      { label: 'خوراکی', value: stats.eating, color: 'var(--accent)' },
                      { label: 'نطفه‌دار', value: stats.fertile, color: 'var(--purple)' },
                      { label: 'شکسته', value: stats.broken, color: 'var(--warn)' },
                      { label: 'سایر', value: stats.other, color: 'var(--muted)' },
                    ].filter(x => x.value > 0)}
                    size={160}
                  />
                </div>
              )}

              {/* خلاصه روند */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, paddingTop: 4, borderTop: '1px dashed var(--border)' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)' }}>بیشترین</div>
                  <div style={{ fontSize: 'var(--fs-md)', fontWeight: 700, color: 'var(--accent)' }}>{toFa(trend.max.toLocaleString('fa-IR'))}</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)' }}>کمترین</div>
                  <div style={{ fontSize: 'var(--fs-md)', fontWeight: 700, color: 'var(--text)' }}>{toFa(Math.min(...trend.days.map(d => d.healthy)).toLocaleString('fa-IR'))}</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)' }}>میانگین</div>
                  <div style={{ fontSize: 'var(--fs-md)', fontWeight: 700, color: 'var(--text)' }}>{toFa(Math.round(trend.days.reduce((a, d) => a + d.healthy, 0) / trend.days.length).toLocaleString('fa-IR'))}</div>
                </div>
              </div>
            </div>
          )}

          {/* نمودار هفتگی */}
          {canWeekly && weekly.length >= 2 && (
            <div style={{ padding: '12px 14px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span style={{ fontSize: 'var(--fs-base)', fontWeight: 700, color: 'var(--text)' }}>📆 روند هفتگی</span>
              <BarChart
                data={weekly.map(w => ({ label: shortDate(w.week), value: w.total }))}
                color="var(--purple)"
                height={120}
              />
            </div>
          )}

          {/* نمودار ماهانه */}
          {canMonthly && monthly.length >= 2 && (
            <div style={{ padding: '12px 14px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span style={{ fontSize: 'var(--fs-base)', fontWeight: 700, color: 'var(--text)' }}>📅 روند ماهانه</span>
              <BarChart
                data={monthly.map(m => ({ label: m.month.split('/')[1], value: m.total }))}
                color="var(--accent)"
                height={100}
              />
            </div>
          )}

          {/* رتبه‌بندی گله‌ها */}
          {flockRank.length >= 2 && (
            <div style={{ padding: '12px 14px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontSize: 'var(--fs-base)', fontWeight: 700, color: 'var(--text)' }}>🏆 رتبه‌بندی گله‌ها</span>
              {flockRank.map((r, i) => {
                const brokenPctF = r.total > 0 ? Math.round((r.broken / r.total) * 1000) / 10 : 0;
                const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${toFa(i + 1)}`;
                return (
                  <div key={r.name} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', background: 'var(--input-bg)', borderRadius: 'var(--r-sm)', fontSize: 'var(--fs-sm)' }}>
                    <span style={{ minWidth: 26, fontSize: '1em' }}>{medal}</span>
                    <span style={{ flex: 1, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.name}</span>
                    <span style={{ color: 'var(--accent)', fontWeight: 700 }}>{toFa(r.healthy.toLocaleString('fa-IR'))}</span>
                    {brokenPctF > 0 && <span style={{ color: 'var(--warn)', fontSize: 'var(--fs-xs)' }}>{toFa(brokenPctF)}٪</span>}
                  </div>
                );
              })}
            </div>
          )}

          {/* بهترین روزهای هفته */}
          {byWeekday.length >= 3 && (
            <div style={{ padding: '12px 14px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontSize: 'var(--fs-base)', fontWeight: 700, color: 'var(--text)' }}>📆 الگوی روزهای هفته</span>
              {byWeekday.map((d, i) => (
                <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', background: i === 0 ? 'var(--accent-soft)' : 'var(--input-bg)', borderRadius: 'var(--r-sm)', fontSize: 'var(--fs-sm)' }}>
                  <span style={{ flex: 1, fontWeight: i === 0 ? 700 : 500, color: i === 0 ? 'var(--accent)' : 'var(--text)' }}>{d.name}</span>
                  <span style={{ color: 'var(--muted)', fontSize: 'var(--fs-xs)' }}>{toFa(d.total)}</span>
                  <span style={{ color: i === 0 ? 'var(--accent)' : 'var(--text)', fontWeight: 700 }}>{toFa(d.avg)}/روز</span>
                </div>
              ))}
            </div>
          )}

          {/* بهترین روزها */}
          {dayRank.length > 0 && (
            <div style={{ padding: '12px 14px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontSize: 'var(--fs-base)', fontWeight: 700, color: 'var(--text)' }}>🌟 بهترین روزها</span>
              {dayRank.slice(0, 5).map((d, i) => (
                <div key={d.date} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', background: 'var(--input-bg)', borderRadius: 'var(--r-sm)', fontSize: 'var(--fs-sm)' }}>
                  <span style={{ minWidth: 26, color: 'var(--muted)', fontSize: 'var(--fs-xs)' }}>{toFa(i + 1)}</span>
                  <span style={{ flex: 1, color: 'var(--muted)', fontSize: 'var(--fs-xs)' }}>{toFa(d.date)}</span>
                  <span style={{ color: 'var(--accent)', fontWeight: 700 }}>{toFa(d.healthy.toLocaleString('fa-IR'))}</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </PageContainer>
  );
}

function QualityBar({ icon, label, pct, count, total, color }: { icon: string; label: string; pct: number; count: number; total: number; color: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 'var(--fs-xs)' }}>
        <span style={{ color: 'var(--text)', fontWeight: 600 }}>{icon} {label}</span>
        <span style={{ color: 'var(--muted)', fontSize: '10px' }}>{toFa(count.toLocaleString('fa-IR'))} از {toFa(total.toLocaleString('fa-IR'))}</span>
        <span style={{ color, fontWeight: 700, minWidth: 44, textAlign: 'left' }}>{toFa(pct)}٪</span>
      </div>
      <div style={{ height: 6, background: 'var(--input-bg)', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${Math.min(100, pct)}%`, background: color, borderRadius: 3, transition: 'width 250ms ease' }} />
      </div>
    </div>
  );
}


function ChartTab({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: string; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        flex: 1,
        padding: '6px 4px',
        background: active ? 'var(--accent-soft)' : 'var(--btn-bg)',
        border: '1px solid ' + (active ? 'var(--accent-border)' : 'var(--border)'),
        borderRadius: 'var(--r-md)',
        color: active ? 'var(--accent)' : 'var(--muted)',
        fontFamily: 'inherit',
        fontSize: 'var(--fs-xs)',
        fontWeight: 700,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 3,
      }}
    >
      <span>{icon}</span>
      <span>{label}</span>
    </button>
  );
}


function CompareRow({ label, cur, prev, inverse }: { label: string; cur: number; prev: number; inverse?: boolean }) {
  const diff = prev > 0 ? ((cur - prev) / prev) * 100 : 0;
  const rounded = Math.round(diff * 10) / 10;
  const good = inverse ? rounded < 0 : rounded > 0;
  const color = Math.abs(rounded) < 1 ? 'var(--muted)' : (good ? 'var(--accent)' : 'var(--danger)');
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 'var(--fs-xs)', padding: '4px 0' }}>
      <span style={{ color: 'var(--muted)', flex: 1 }}>{label}</span>
      <span style={{ color: 'var(--text)', fontWeight: 700, marginLeft: 8 }}>{toFa(cur.toLocaleString('fa-IR'))}</span>
      <span style={{ color: 'var(--muted)', marginLeft: 8, minWidth: 50, textAlign: 'left' }}>قبلاً {toFa(prev.toLocaleString('fa-IR'))}</span>
      <span style={{ color, fontWeight: 700, marginLeft: 8, minWidth: 50, textAlign: 'left' }}>
        {rounded > 0 ? '+' : ''}{toFa(rounded)}٪
      </span>
    </div>
  );
}
