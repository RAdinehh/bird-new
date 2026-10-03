/**
 * StatsPage — آمار و تحلیل تخم‌گذاری
 * تمرکز روی: کیفیت تخم، رتبه‌بندی گله‌ها، رتبه‌بندی روزها، روند روزانه
 */
import { useState, useMemo } from 'react';
import { useEgg, type EggProduction } from './store';
import { useFlk } from '../flk/store';
import { PageContainer, Select, Empty } from '../../shr/components/ui';
import { toFa, toEn } from '../../shr/utils/fa';

type Range = '7' | '30' | '90' | 'all';

function toEnDate(d: string): string {
  return d.replace(/[۰-۹]/g, (x: string) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(x)));
}

function cutOff(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}/${m}/${dd}`;
}

export default function StatsPage() {
  const { productions } = useEgg();
  const { flocks } = useFlk();

  const [filterFlock, setFilterFlock] = useState('');
  const [range, setRange] = useState<Range>('30');

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

  const todayStr = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;
  }, []);

  // ============ KPI کل ============
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
    const brokenPct = total > 0 ? Math.round((broken / total) * 1000) / 10 : 0;
    const fertilePct = healthy > 0 ? Math.round((fertile / healthy) * 1000) / 10 : 0;
    const otherPct = total > 0 ? Math.round((other / total) * 1000) / 10 : 0;
    const dayCount = new Set(filtered.map(p => p.date)).size;
    const avgPerDay = dayCount > 0 ? Math.round(total / dayCount) : 0;
    return { eating, fertile, broken, other, healthy, total, brokenPct, fertilePct, otherPct, dayCount, avgPerDay };
  }, [filtered]);

  // ============ رتبه‌بندی گله‌ها ============
  const flockRank = useMemo(() => {
    const map = new Map<string, { name: string; total: number; healthy: number; broken: number; fertile: number; days: number }>();
    for (const p of filtered) {
      const k = p.flockId;
      const flock = flocks.find(f => f.id === k);
      if (!flock) continue;
      if (!map.has(k)) map.set(k, { name: flock.name, total: 0, healthy: 0, broken: 0, fertile: 0, days: 0 });
      const r = map.get(k)!;
      const h = (p.eatingCount || 0) + (p.fertileCount || 0);
      r.total += h + (p.brokenCount || 0) + (p.softCount || 0) + (p.dirtyCount || 0);
      r.healthy += h;
      r.broken += p.brokenCount || 0;
      r.fertile += p.fertileCount || 0;
      r.days += 1;
    }
    return [...map.values()].sort((a, b) => b.healthy - a.healthy);
  }, [filtered, flocks]);

  // ============ بهترین/بدترین روز ============
  const dayRank = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of filtered) {
      const d = p.date || '';
      const h = (p.eatingCount || 0) + (p.fertileCount || 0);
      map.set(d, (map.get(d) || 0) + h);
    }
    const arr = [...map.entries()].map(([date, healthy]) => ({ date, healthy })).sort((a, b) => b.healthy - a.healthy);
    return { best: arr.slice(0, 5), worst: arr.slice(-5).reverse(), all: arr };
  }, [filtered]);

  // ============ روند روزانه (۳۰ روز اخیر) ============
  const trend = useMemo(() => {
    const days: { date: string; healthy: number; broken: number }[] = [];
    const map = new Map<string, { healthy: number; broken: number }>();
    for (const p of filtered) {
      const d = p.date || '';
      if (!map.has(d)) map.set(d, { healthy: 0, broken: 0 });
      const r = map.get(d)!;
      r.healthy += (p.eatingCount || 0) + (p.fertileCount || 0);
      r.broken += p.brokenCount || 0;
    }
    const sorted = [...map.entries()].sort((a, b) => a[0].localeCompare(b[0])).slice(-30);
    for (const [date, v] of sorted) days.push({ date, healthy: v.healthy, broken: v.broken });
    const max = Math.max(...days.map(d => d.healthy), 1);
    return { days, max };
  }, [filtered]);

  // ============ هشدار افت تولید ============
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

  const rangeLabel = range === '7' ? '۷ روز' : range === '30' ? '۳۰ روز' : range === '90' ? '۹۰ روز' : 'کل';

  return (
    <PageContainer>
      <div style={{ fontSize: 'var(--fs-base)', fontWeight: 700, color: 'var(--text)' }}>
        📊 تحلیل تخم‌گذاری — {rangeLabel}
      </div>

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

      {stats.total === 0 ? (
        <Empty
          icon={<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M3 3v18h18"/><path d="M7 14l4-4 4 4 5-5"/></svg>}
          title="آماری موجود نیست"
          desc="هنوز تخم‌گذاری در این بازه ثبت نشده."
        />
      ) : (
        <>
          {/* هشدار افت تولید */}
          {alert && (
            <div style={{ padding: 'var(--pad-normal)', background: 'var(--danger-soft)', border: '1px solid var(--danger)', borderRadius: 'var(--r-md)', fontSize: 'var(--fs-sm)', color: 'var(--danger)', fontWeight: 700, textAlign: 'center', lineHeight: 1.7 }}>
              ⚠️ افت تولید {toFa(Math.abs(alert.drop))}٪ — ۳ روز اخیر میانگین {toFa(alert.avgLast)} تخم (قبلاً {toFa(alert.avgPrev)})
            </div>
          )}

          {/* KPI کل */}
          <div style={{ fontSize: 'var(--fs-base)', fontWeight: 700, color: 'var(--text)', paddingTop: 4 }}>
            📈 خلاصه {rangeLabel}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            <div style={{ padding: '14px 10px', textAlign: 'center', background: 'var(--accent-soft)', border: '1px solid var(--accent-border)', borderRadius: 'var(--r-md)' }}>
              <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--accent)', fontWeight: 700 }}>🥚 کل تخم</div>
              <div style={{ fontSize: 'var(--fs-xl)', fontWeight: 700, color: 'var(--accent)', marginTop: 4 }}>{toFa(stats.total.toLocaleString('fa-IR'))}</div>
            </div>
            <div style={{ padding: '14px 10px', textAlign: 'center', background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)' }}>
              <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', fontWeight: 700 }}>📅 میانگین روزانه</div>
              <div style={{ fontSize: 'var(--fs-xl)', fontWeight: 700, color: 'var(--text)', marginTop: 4 }}>{toFa(stats.avgPerDay.toLocaleString('fa-IR'))}</div>
            </div>
          </div>

          {/* کیفیت تخم */}
          <div style={{ fontSize: 'var(--fs-base)', fontWeight: 700, color: 'var(--text)', paddingTop: 4 }}>
            ⭐ کیفیت تخم
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
            <div style={{ padding: '10px 8px', textAlign: 'center', background: 'var(--purple-soft)', border: '1px solid var(--purple)', borderRadius: 'var(--r-md)' }}>
              <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--purple)', fontWeight: 700 }}>🌱 نطفه‌دار</div>
              <div style={{ fontSize: 'var(--fs-md)', fontWeight: 700, color: 'var(--purple)', marginTop: 4 }}>{toFa(stats.fertilePct)}٪</div>
              <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)' }}>{toFa(stats.fertile.toLocaleString('fa-IR'))} عدد</div>
            </div>
            <div style={{ padding: '10px 8px', textAlign: 'center', background: 'var(--warn-soft)', border: '1px solid var(--warn)', borderRadius: 'var(--r-md)' }}>
              <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--warn)', fontWeight: 700 }}>💔 شکسته</div>
              <div style={{ fontSize: 'var(--fs-md)', fontWeight: 700, color: 'var(--warn)', marginTop: 4 }}>{toFa(stats.brokenPct)}٪</div>
              <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)' }}>{toFa(stats.broken.toLocaleString('fa-IR'))} عدد</div>
            </div>
            <div style={{ padding: '10px 8px', textAlign: 'center', background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)' }}>
              <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', fontWeight: 700 }}>📦 سایر</div>
              <div style={{ fontSize: 'var(--fs-md)', fontWeight: 700, color: 'var(--text)', marginTop: 4 }}>{toFa(stats.otherPct)}٪</div>
              <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)' }}>{toFa(stats.other.toLocaleString('fa-IR'))} عدد</div>
            </div>
          </div>

          {/* روند روزانه */}
          {trend.days.length >= 2 && (
            <>
              <div style={{ fontSize: 'var(--fs-base)', fontWeight: 700, color: 'var(--text)', paddingTop: 4 }}>
                📈 روند روزانه (آخرین {toFa(trend.days.length)} روز)
              </div>
              <div style={{ padding: 'var(--pad-normal)', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', display: 'flex', alignItems: 'flex-end', gap: 2, height: 120 }}>
                {trend.days.map(d => (
                  <div key={d.date} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, minWidth: 0 }}>
                    {d.broken > 0 && (
                      <div style={{ width: '100%', height: `${(d.broken / trend.max) * 80}px`, background: 'var(--warn)', borderRadius: '2px 2px 0 0' }} title={`شکسته: ${d.broken}`} />
                    )}
                    <div style={{ width: '100%', height: `${(d.healthy / trend.max) * 80}px`, background: 'var(--accent)', borderRadius: '2px 2px 0 0' }} title={`سالم: ${d.healthy}`} />
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--fs-xs)', color: 'var(--muted)', padding: '0 4px' }}>
                <span>{toFa(trend.days[0]?.date)}</span>
                <span>{toFa(trend.days[trend.days.length - 1]?.date)}</span>
              </div>
            </>
          )}

          {/* رتبه‌بندی گله‌ها */}
          {flockRank.length >= 2 && (
            <>
              <div style={{ fontSize: 'var(--fs-base)', fontWeight: 700, color: 'var(--text)', paddingTop: 4 }}>
                🏆 رتبه‌بندی گله‌ها
              </div>
              {flockRank.map((r, i) => {
                const brokenPctF = r.total > 0 ? Math.round((r.broken / r.total) * 1000) / 10 : 0;
                const rank = i + 1;
                const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${toFa(rank)}`;
                return (
                  <div key={r.name} style={{ padding: '10px 12px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 'var(--fs-md)', minWidth: 30 }}>{medal}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 'var(--fs-sm)', fontWeight: 700, color: 'var(--text)' }}>{r.name}</div>
                      <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)' }}>
                        {toFa(r.healthy.toLocaleString('fa-IR'))} تخم سالم · {toFa(r.days)} روز
                      </div>
                    </div>
                    {brokenPctF > 0 && (
                      <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--warn)', fontWeight: 700 }}>{toFa(brokenPctF)}٪ شکسته</span>
                    )}
                  </div>
                );
              })}
            </>
          )}

          {/* بهترین روزها */}
          {dayRank.best.length > 0 && (
            <>
              <div style={{ fontSize: 'var(--fs-base)', fontWeight: 700, color: 'var(--text)', paddingTop: 4 }}>
                🌟 بهترین روزها
              </div>
              {dayRank.best.map((d, i) => (
                <div key={d.date} style={{ padding: '8px 12px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 'var(--fs-sm)' }}>
                  <span style={{ color: 'var(--muted)', fontSize: 'var(--fs-xs)' }}>{toFa(i + 1)}</span>
                  <span style={{ fontWeight: 700, color: 'var(--text)' }}>{toFa(d.date)}</span>
                  <span style={{ fontWeight: 700, color: 'var(--accent)' }}>{toFa(d.healthy.toLocaleString('fa-IR'))} تخم</span>
                </div>
              ))}
            </>
          )}
        </>
      )}
    </PageContainer>
  );
}
