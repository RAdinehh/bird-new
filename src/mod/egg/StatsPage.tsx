/**
 * StatsPage — آمار و تحلیل تخم‌گذاری
 */
import { useState, useMemo } from 'react';
import { useEgg } from './store';
import { useFlk } from '../flk/store';
import { PageContainer, Select, Empty } from '../../shr/components/ui';
import { toFa } from '../../shr/utils/fa';

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
    const brokenPct = total > 0 ? Math.round((broken / total) * 1000) / 10 : 0;
    const fertilePct = healthy > 0 ? Math.round((fertile / healthy) * 1000) / 10 : 0;
    const eatingPct = healthy > 0 ? Math.round((eating / healthy) * 1000) / 10 : 0;
    const otherPct = total > 0 ? Math.round((other / total) * 1000) / 10 : 0;
    const dayCount = new Set(filtered.map(p => p.date)).size;
    const avgPerDay = dayCount > 0 ? Math.round(total / dayCount) : 0;
    return { eating, fertile, broken, other, healthy, total, brokenPct, fertilePct, eatingPct, otherPct, dayCount, avgPerDay };
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

  const rangeLabel = range === '7' ? '۷ روز' : range === '30' ? '۳۰ روز' : range === '90' ? '۹۰ روز' : 'کل';

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
                <div style={{ fontSize: 'var(--fs-lg)', fontWeight: 700, color: 'var(--text)', marginTop: 2 }}>{toFa(stats.avgPerDay.toLocaleString('fa-IR'))}</div>
              </div>
              <span style={{ fontSize: '1.6em', opacity: 0.5 }}>📅</span>
            </div>
          </div>

          {/* کیفیت تخم — نوارهای compact */}
          <div style={{ padding: '12px 14px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 'var(--fs-base)', fontWeight: 700, color: 'var(--text)' }}>⭐ کیفیت تخم</span>
              <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)' }}>{rangeLabel}</span>
            </div>

            <QualityBar icon="🌱" label="نطفه‌دار" pct={stats.fertilePct} count={stats.fertile} total={stats.healthy} color="var(--purple)" />
            <QualityBar icon="🥚" label="خوراکی" pct={stats.eatingPct} count={stats.eating} total={stats.healthy} color="var(--accent)" />
            <QualityBar icon="💔" label="شکسته" pct={stats.brokenPct} count={stats.broken} total={stats.total} color="var(--warn)" />
            {stats.other > 0 && (
              <QualityBar icon="📦" label="سایر" pct={stats.otherPct} count={stats.other} total={stats.total} color="var(--muted)" />
            )}
          </div>

          {/* روند روزانه */}
          {trend.days.length >= 2 && (
            <div style={{ padding: '12px 14px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 'var(--fs-base)', fontWeight: 700, color: 'var(--text)' }}>📈 روند روزانه</span>
                <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)' }}>{toFa(trend.days.length)} روز</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 90 }}>
                {trend.days.map(d => (
                  <div key={d.date} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', gap: 0, minWidth: 0 }}>
                    {d.broken > 0 && (
                      <div style={{ width: '100%', height: `${Math.max(2, (d.broken / trend.max) * 70)}px`, background: 'var(--warn)', borderRadius: '2px 2px 0 0' }} title={`${d.date}: ${d.healthy} سالم + ${d.broken} شکسته`} />
                    )}
                    <div style={{ width: '100%', height: `${Math.max(2, (d.healthy / trend.max) * 70)}px`, background: 'var(--accent)', borderRadius: '2px 2px 0 0' }} title={`${d.date}: ${d.healthy} سالم`} />
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'var(--muted)' }}>
                <span>{toFa(shortDate(trend.days[0]?.date || ''))}</span>
                <span style={{ display: 'flex', gap: 8 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><span style={{ width: 8, height: 8, background: 'var(--accent)', borderRadius: 1 }} /> سالم</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><span style={{ width: 8, height: 8, background: 'var(--warn)', borderRadius: 1 }} /> شکسته</span>
                </span>
                <span>{toFa(shortDate(trend.days[trend.days.length - 1]?.date || ''))}</span>
              </div>
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
