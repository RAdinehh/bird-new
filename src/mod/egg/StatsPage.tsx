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
type ChartType = 'bar' | 'line' | 'dual' | 'pie';

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
  const [chartType, setChartType] = useState<ChartType>('bar');

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
    const pct = (n: number) => total > 0 ? Math.round((n / total) * 1000) / 10 : 0;
    const brokenPct = pct(broken);
    const fertilePct = pct(fertile);
    const eatingPct = pct(eating);
    const otherPct = pct(other);
    const dayCount = new Set(filtered.map(p => p.date)).size;
    const avgHealthy = dayCount > 0 ? Math.round(healthy / dayCount) : 0;
    return { eating, fertile, broken, other, healthy, total, brokenPct, fertilePct, eatingPct, otherPct, dayCount, avgHealthy };
  }, [filtered]);

  const rangeLabel = range === '7' ? '۷ روز' : range === '30' ? '۳۰ روز' : range === '90' ? '۹۰ روز' : 'کل';

  const coverage = useMemo(() => {
    if (range === 'all') {
      const allDates = new Set(productions.map(p => p.date).filter(Boolean));
      return { days: allDates.size, rangeDays: 0, insufficient: false };
    }
    const rangeDays = parseInt(range);
    const allDates = new Set(filtered.map(p => p.date).filter(Boolean));
    return { days: allDates.size, rangeDays, insufficient: allDates.size < Math.min(3, rangeDays) };
  }, [filtered, range, productions]);

  const canAvg = coverage.days >= 2;
  const canWeekly = coverage.days >= 7;

  // توده تخم
  const eggMassKg = useMemo(() => Math.round((stats.healthy * 60) / 100) / 10, [stats.healthy]);

  // رتبه‌بندی گله‌ها
  const flockRank = useMemo(() => {
    const map = new Map<string, { name: string; total: number; healthy: number; broken: number; days: number }>();
    for (const p of filtered) {
      const flock = flocks.find(f => f.id === p.flockId);
      if (!flock) continue;
      if (!map.has(p.flockId)) map.set(p.flockId, { name: flock.name, total: 0, healthy: 0, broken: 0, days: 0 });
      const r = map.get(p.flockId)!;
      const h = (p.eatingCount || 0) + (p.fertileCount || 0);
      r.total += h + (p.brokenCount || 0) + (p.softCount || 0) + (p.dirtyCount || 0);
      r.healthy += h;
      r.broken += p.brokenCount || 0;
      r.days += 1;
    }
    return [...map.values()].sort((a, b) => b.healthy - a.healthy);
  }, [filtered, flocks]);

  // روند روزانه
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
    const min = days.length > 0 ? Math.min(...days.map(d => d.healthy)) : 0;
    const avg = days.length > 0 ? Math.round(days.reduce((a, d) => a + d.healthy, 0) / days.length) : 0;
    return { days, max, min, avg };
  }, [filtered]);

  // هشدار افت
  const alert = useMemo(() => {
    if (trend.days.length < 6) return null;
    const last3 = trend.days.slice(-3);
    const prev3 = trend.days.slice(-6, -3);
    const avgLast = last3.reduce((a, d) => a + d.healthy, 0) / last3.length;
    const avgPrev = prev3.reduce((a, d) => a + d.healthy, 0) / prev3.length;
    if (avgPrev === 0) return null;
    const drop = ((avgLast - avgPrev) / avgPrev) * 100;
    if (drop < -10) return { drop: Math.round(drop), avgLast: Math.round(avgLast), avgPrev: Math.round(avgPrev) };
    return null;
  }, [trend]);

  // بهترین روزها
  const dayRank = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of filtered) {
      const h = (p.eatingCount || 0) + (p.fertileCount || 0);
      map.set(p.date || '', (map.get(p.date || '') || 0) + h);
    }
    return [...map.entries()].map(([date, healthy]) => ({ date, healthy })).sort((a, b) => b.healthy - a.healthy).slice(0, 5);
  }, [filtered]);

  // بهترین روزهای هفته
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

  return (
    <PageContainer>
      {/* فیلترها */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
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
          {/* هشدارها */}
          {alert && (
            <div style={{ padding: '10px 14px', background: 'var(--danger-soft)', border: '1px solid var(--danger)', borderRadius: 'var(--r-md)', fontSize: 'var(--fs-sm)', color: 'var(--danger)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: '1.3em' }}>⚠️</span>
              <span style={{ flex: 1 }}>افت {toFa(Math.abs(alert.drop))}٪ تولید — ۳ روز اخیر {toFa(alert.avgLast)} تخم (قبلاً {toFa(alert.avgPrev)})</span>
            </div>
          )}
          {coverage.insufficient && range !== 'all' && (
            <div style={{ padding: '10px 14px', background: 'var(--warn-soft)', border: '1px dashed var(--warn)', borderRadius: 'var(--r-md)', fontSize: 'var(--fs-sm)', color: 'var(--warn)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: '1.3em' }}>💡</span>
              <span style={{ flex: 1 }}>فقط {toFa(coverage.days)} روز از {toFa(coverage.rangeDays)} روز داده دارید</span>
            </div>
          )}

          {/* خلاصه */}
          <Section icon="📊" title={`خلاصه ${rangeLabel}`} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <SummaryCard icon="🥚" label="کل تخم" value={toFa(stats.total.toLocaleString('fa-IR'))} sub={`در ${toFa(coverage.days)} روز`} tone="accent" />
            <SummaryCard icon="📅" label="میانگین روزانه" value={canAvg ? toFa(stats.avgHealthy.toLocaleString('fa-IR')) : '—'} sub={canAvg ? 'تخم سالم' : 'داده کم'} tone="info" />
            <SummaryCard icon="⚖️" label="توده تخم" value={`${toFa(eggMassKg.toLocaleString('fa-IR'))} kg`} sub="میانگین ۶۰ گرم" tone="purple" />
            <SummaryCard icon="⭐" label="نرخ نطفه‌دار" value={`${toFa(stats.fertilePct)}٪`} sub={`${toFa(stats.fertile.toLocaleString('fa-IR'))} تخم`} tone="purple" />
          </div>

          {/* کیفیت تخم */}
          <Section icon="⭐" title="کیفیت تخم" extra={rangeLabel} />
          <div style={{ padding: '14px 16px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <QualityBar icon="🌱" label="نطفه‌دار" pct={stats.fertilePct} count={stats.fertile} total={stats.total} color="var(--purple)" />
            <QualityBar icon="🥚" label="خوراکی" pct={stats.eatingPct} count={stats.eating} total={stats.total} color="var(--accent)" />
            <QualityBar icon="💔" label="شکسته" pct={stats.brokenPct} count={stats.broken} total={stats.total} color="var(--warn)" />
            {stats.other > 0 && (
              <QualityBar icon="📦" label="سایر" pct={stats.otherPct} count={stats.other} total={stats.total} color="var(--muted)" />
            )}
          </div>

          {/* روند روزانه */}
          {trend.days.length >= 2 && (
            <>
              <Section icon="📈" title="روند روزانه" extra={`${toFa(trend.days.length)} روز`} />
              <div style={{ padding: '14px 16px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', display: 'flex', flexDirection: 'column', gap: 12 }}>

                {/* انتخاب نوع نمودار */}
                <div style={{ display: 'flex', gap: 6 }}>
                  <ChartTab active={chartType === 'bar'} onClick={() => setChartType('bar')} icon="📊" label="میله‌ای" />
                  <ChartTab active={chartType === 'line'} onClick={() => setChartType('line')} icon="📈" label="خطی" />
                  <ChartTab active={chartType === 'dual'} onClick={() => setChartType('dual')} icon="📉" label="دو-ستونی" />
                  <ChartTab active={chartType === 'pie'} onClick={() => setChartType('pie')} icon="🥧" label="دایره‌ای" />
                </div>

                {/* نمودار */}
                {chartType === 'bar' && (
                  <BarChart data={trend.days.map(d => ({ label: shortDate(d.date), value: d.healthy }))} color="var(--accent)" height={150} />
                )}
                {chartType === 'line' && (
                  <LineChart data={trend.days.map(d => ({ label: shortDate(d.date), value: d.healthy }))} color="var(--accent)" height={150} />
                )}
                {chartType === 'dual' && (
                  <DualBarChart data={trend.days.map(d => ({ label: shortDate(d.date), a: d.healthy, b: d.broken }))} colorA="var(--accent)" colorB="var(--warn)" labelA="سالم" labelB="شکسته" height={150} />
                )}
                {chartType === 'pie' && (
                  <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 0' }}>
                    <PieChart
                      data={[
                        { label: 'خوراکی', value: stats.eating, color: 'var(--accent)' },
                        { label: 'نطفه‌دار', value: stats.fertile, color: 'var(--purple)' },
                        { label: 'شکسته', value: stats.broken, color: 'var(--warn)' },
                        { label: 'سایر', value: stats.other, color: 'var(--muted)' },
                      ].filter(x => x.value > 0)}
                      size={170}
                    />
                  </div>
                )}

                {/* خلاصه روند */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, paddingTop: 10, borderTop: '1px dashed var(--border)' }}>
                  <MiniStat label="بیشترین" value={toFa(trend.max.toLocaleString('fa-IR'))} color="var(--accent)" />
                  <MiniStat label="میانگین" value={toFa(trend.avg.toLocaleString('fa-IR'))} color="var(--text)" />
                  <MiniStat label="کمترین" value={toFa(trend.min.toLocaleString('fa-IR'))} color="var(--muted)" />
                </div>
              </div>
            </>
          )}

          {/* مقایسه گله‌ها */}
          {flockRank.length >= 2 && (
            <>
              <Section icon="🏆" title="رتبه‌بندی گله‌ها" />
              <div style={{ padding: '12px 14px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {flockRank.map((r, i) => {
                  const brokenPct = r.total > 0 ? Math.round((r.broken / r.total) * 1000) / 10 : 0;
                  const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${toFa(i + 1)}.`;
                  return (
                    <div key={r.name} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: i === 0 ? 'var(--accent-soft)' : 'var(--input-bg)', borderRadius: 'var(--r-sm)', border: i === 0 ? '1px solid var(--accent-border)' : '1px solid transparent' }}>
                      <span style={{ fontSize: '1.2em', minWidth: 28, textAlign: 'center' }}>{medal}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 'var(--fs-sm)', fontWeight: 700, color: 'var(--text)', marginBottom: 2 }}>{r.name}</div>
                        <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)' }}>{toFa(r.days)} روز ثبت</div>
                      </div>
                      <div style={{ textAlign: 'left' }}>
                        <div style={{ fontSize: 'var(--fs-md)', fontWeight: 700, color: 'var(--accent)' }}>{toFa(r.healthy.toLocaleString('fa-IR'))}</div>
                        <div style={{ fontSize: '10px', color: 'var(--muted)' }}>سالم{brokenPct > 0 ? ` · ${toFa(brokenPct)}٪ شکسته` : ''}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* الگوی روزهای هفته */}
          {byWeekday.length >= 3 && (
            <>
              <Section icon="📆" title="الگوی روزهای هفته" />
              <div style={{ padding: '12px 14px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', display: 'flex', flexDirection: 'column', gap: 6 }}>
                {byWeekday.map((d, i) => (
                  <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: i === 0 ? 'var(--accent-soft)' : 'var(--input-bg)', borderRadius: 'var(--r-sm)' }}>
                    <span style={{ flex: 1, fontWeight: i === 0 ? 700 : 600, color: i === 0 ? 'var(--accent)' : 'var(--text)', fontSize: 'var(--fs-sm)' }}>{d.name}</span>
                    <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)' }}>{toFa(d.total.toLocaleString('fa-IR'))} کل</span>
                    <span style={{ fontSize: 'var(--fs-sm)', fontWeight: 700, color: i === 0 ? 'var(--accent)' : 'var(--text)', minWidth: 60, textAlign: 'left' }}>{toFa(d.avg)}/روز</span>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* بهترین روزها */}
          {dayRank.length > 0 && (
            <>
              <Section icon="🌟" title="بهترین روزها" />
              <div style={{ padding: '12px 14px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', display: 'flex', flexDirection: 'column', gap: 6 }}>
                {dayRank.map((d, i) => (
                  <div key={d.date} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: 'var(--input-bg)', borderRadius: 'var(--r-sm)' }}>
                    <span style={{ minWidth: 26, color: 'var(--muted)', fontSize: 'var(--fs-sm)', textAlign: 'center', fontWeight: 600 }}>{toFa(i + 1)}</span>
                    <span style={{ flex: 1, color: 'var(--text)', fontSize: 'var(--fs-sm)' }}>{toFa(d.date)}</span>
                    <span style={{ color: 'var(--accent)', fontWeight: 700, fontSize: 'var(--fs-sm)' }}>{toFa(d.healthy.toLocaleString('fa-IR'))}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </PageContainer>
  );
}

// ============ Helpers ============

function Section({ icon, title, extra }: { icon: string; title: string; extra?: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: '1.15em' }}>{icon}</span>
        <span style={{ fontSize: 'var(--fs-base)', fontWeight: 700, color: 'var(--text)' }}>{title}</span>
      </div>
      {extra && <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)' }}>{extra}</span>}
    </div>
  );
}

function SummaryCard({ icon, label, value, sub, tone }: { icon: string; label: string; value: string; sub: string; tone: 'accent' | 'info' | 'purple' | 'warn' }) {
  const colors = {
    accent: { color: 'var(--accent)', border: 'var(--accent-border)', bg: 'var(--accent-soft)' },
    info: { color: '#3b82f6', border: 'rgba(59,130,246,0.35)', bg: 'rgba(59,130,246,0.08)' },
    purple: { color: 'var(--purple)', border: 'var(--purple)', bg: 'var(--purple-soft)' },
    warn: { color: 'var(--warn)', border: 'var(--warn)', bg: 'var(--warn-soft)' },
  }[tone];
  return (
    <div style={{ padding: '12px 14px', background: colors.bg, border: `1px solid ${colors.border}`, borderRadius: 'var(--r-md)', display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
      <span style={{ fontSize: '1.6em', flexShrink: 0 }}>{icon}</span>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0, flex: 1 }}>
        <div style={{ fontSize: 'var(--fs-xs)', color: colors.color, fontWeight: 700 }}>{label}</div>
        <div style={{ fontSize: 'var(--fs-md)', fontWeight: 700, color: 'var(--text)', fontVariantNumeric: 'tabular-nums' }}>{value}</div>
        <div style={{ fontSize: '10px', color: 'var(--muted)' }}>{sub}</div>
      </div>
    </div>
  );
}

function QualityBar({ icon, label, pct, count, total, color }: { icon: string; label: string; pct: number; count: number; total: number; color: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 'var(--fs-sm)' }}>
        <span>{icon}</span>
        <span style={{ color: 'var(--text)', fontWeight: 600, flex: 1 }}>{label}</span>
        <span style={{ color: 'var(--muted)', fontSize: '10px' }}>{toFa(count.toLocaleString('fa-IR'))}/{toFa(total.toLocaleString('fa-IR'))}</span>
        <span style={{ color, fontWeight: 700, minWidth: 48, textAlign: 'left', fontVariantNumeric: 'tabular-nums' }}>{toFa(pct)}٪</span>
      </div>
      <div style={{ height: 7, background: 'var(--input-bg)', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${Math.min(100, pct)}%`, background: color, borderRadius: 4, transition: 'width 250ms ease' }} />
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
        flex: 1, padding: '8px 4px',
        background: active ? 'var(--accent-soft)' : 'var(--btn-bg)',
        border: '1px solid ' + (active ? 'var(--accent-border)' : 'var(--border)'),
        borderRadius: 'var(--r-sm)',
        color: active ? 'var(--accent)' : 'var(--muted)',
        fontFamily: 'inherit', fontSize: 'var(--fs-xs)', fontWeight: 700,
        cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
      }}
    >
      <span>{icon}</span>
      <span>{label}</span>
    </button>
  );
}

function MiniStat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 'var(--fs-md)', fontWeight: 700, color, fontVariantNumeric: 'tabular-nums' }}>{value}</div>
    </div>
  );
}
