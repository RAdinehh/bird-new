/**
 * StatsPage — آمار و تحلیل تخم‌گذاری
 */
import { useState, useMemo } from 'react';
import { useEgg, healthyCount, henDayRate, type EggProduction } from './store';
import { useFlk } from '../flk/store';
import { PageContainer, Field, Select, Tag, Empty } from '../../shr/components/ui';
import ExpandableCard from '../../shr/components/ExpandableCard';
import { toFa } from '../../shr/utils/fa';

export default function StatsPage() {
  const { productions } = useEgg();
  const { flocks } = useFlk();

  const [filterFlock, setFilterFlock] = useState('');
  const [range, setRange] = useState<'7' | '30' | 'all'>('30');

  const activeFlocks = flocks.filter(f => f.status === 'active' && (f.type === 'layer' || f.type === 'breeder'));

  const filtered = useMemo(() => {
    let arr = [...productions];
    if (filterFlock) arr = arr.filter(p => p.flockId === filterFlock);
    if (range !== 'all') {
      const days = parseInt(range);
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - days);
      const cutoffStr = cutoff.toISOString().slice(0, 10).replace(/-/g, '/');
      arr = arr.filter(p => (p.date || '') >= cutoffStr);
    }
    return arr.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  }, [productions, filterFlock, range]);

  const stats = useMemo(() => {
    let eating = 0, fertile = 0, broken = 0, other = 0;
    let totalHealthy = 0, totalAll = 0;
    let henDaySum = 0, henDayCount = 0;
    let records = 0;
    for (const p of filtered) {
      eating += p.eatingCount || 0;
      fertile += p.fertileCount || 0;
      broken += p.brokenCount || 0;
      other += (p.softCount || 0) + (p.dirtyCount || 0);
      const healthy = (p.eatingCount || 0) + (p.fertileCount || 0);
      const all = healthy + (p.brokenCount || 0) + (p.softCount || 0) + (p.dirtyCount || 0);
      totalHealthy += healthy;
      totalAll += all;
      const flock = flocks.find(f => f.id === p.flockId);
      if (flock) {
        const fc = flock.currentCount || flock.initialCount || 0;
        if (fc > 0 && healthy > 0) {
          henDaySum += (healthy / fc) * 100;
          henDayCount++;
        }
      }
      records++;
    }
    const avgHenDay = henDayCount > 0 ? Math.round((henDaySum / henDayCount) * 10) / 10 : 0;
    const brokenPct = totalAll > 0 ? Math.round((broken / totalAll) * 1000) / 10 : 0;
    const fertilePct = totalHealthy > 0 ? Math.round((fertile / totalHealthy) * 1000) / 10 : 0;
    const eatingPct = totalHealthy > 0 ? Math.round((eating / totalHealthy) * 1000) / 10 : 0;
    return { eating, fertile, broken, other, totalHealthy, totalAll, avgHenDay, brokenPct, fertilePct, eatingPct, records };
  }, [filtered, flocks]);

  const rangeLabel = range === '7' ? '۷ روز اخیر' : range === '30' ? '۳۰ روز اخیر' : 'کل';

  return (
    <PageContainer>
      <div style={{ fontSize: 'var(--fs-base)', fontWeight: 700, color: 'var(--text)', paddingBottom: 4 }}>
        📊 آمار تخم‌گذاری — {rangeLabel}
      </div>

      <Select value={range} onChange={e => setRange(e.target.value as any)}>
        <option value="7">۷ روز اخیر</option>
        <option value="30">۳۰ روز اخیر</option>
        <option value="all">همه</option>
      </Select>

      <Select value={filterFlock} onChange={e => setFilterFlock(e.target.value)}>
        <option value="">همه گله‌ها</option>
        {activeFlocks.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
      </Select>

      {stats.records === 0 ? (
        <Empty
          icon={<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M3 3v18h18"/><path d="M7 14l4-4 4 4 5-5"/></svg>}
          title="آماری موجود نیست"
          desc="هنوز تخم‌گذاری ثبت نشده."
        />
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            <div style={{ padding: '14px 10px', textAlign: 'center', background: 'var(--accent-soft)', border: '1px solid var(--accent-border)', borderRadius: 'var(--r-md)' }}>
              <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--accent)', fontWeight: 700 }}>🥚 کل تخم</div>
              <div style={{ fontSize: 'var(--fs-xl)', fontWeight: 700, color: 'var(--accent)', marginTop: 4, fontVariantNumeric: 'tabular-nums' }}>{toFa(stats.totalAll.toLocaleString('fa-IR'))}</div>
              <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)' }}>عدد</div>
            </div>
            <div style={{ padding: '14px 10px', textAlign: 'center', background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)' }}>
              <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', fontWeight: 700 }}>📅 تعداد ثبت</div>
              <div style={{ fontSize: 'var(--fs-xl)', fontWeight: 700, color: 'var(--text)', marginTop: 4, fontVariantNumeric: 'tabular-nums' }}>{toFa(stats.records)}</div>
              <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)' }}>رکورد</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            <div style={{ padding: '12px 10px', textAlign: 'center', background: 'var(--accent-soft)', border: '1px solid var(--accent-border)', borderRadius: 'var(--r-md)' }}>
              <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--accent)', fontWeight: 700 }}>🥚 خوراکی</div>
              <div style={{ fontSize: 'var(--fs-lg)', fontWeight: 700, color: 'var(--accent)', marginTop: 4 }}>{toFa(stats.eating.toLocaleString('fa-IR'))}</div>
              {stats.totalHealthy > 0 && <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)' }}>{toFa(stats.eatingPct)}٪</div>}
            </div>
            <div style={{ padding: '12px 10px', textAlign: 'center', background: 'var(--purple-soft)', border: '1px solid var(--purple)', borderRadius: 'var(--r-md)' }}>
              <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--purple)', fontWeight: 700 }}>🌱 نطفه‌دار</div>
              <div style={{ fontSize: 'var(--fs-lg)', fontWeight: 700, color: 'var(--purple)', marginTop: 4 }}>{toFa(stats.fertile.toLocaleString('fa-IR'))}</div>
              {stats.totalHealthy > 0 && <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)' }}>{toFa(stats.fertilePct)}٪</div>}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            <div style={{ padding: '12px 10px', textAlign: 'center', background: 'var(--warn-soft)', border: '1px solid var(--warn)', borderRadius: 'var(--r-md)' }}>
              <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--warn)', fontWeight: 700 }}>💔 شکسته</div>
              <div style={{ fontSize: 'var(--fs-lg)', fontWeight: 700, color: 'var(--warn)', marginTop: 4 }}>{toFa(stats.broken.toLocaleString('fa-IR'))}</div>
              {stats.totalAll > 0 && <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)' }}>{toFa(stats.brokenPct)}٪</div>}
            </div>
            <div style={{ padding: '12px 10px', textAlign: 'center', background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)' }}>
              <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', fontWeight: 700 }}>📦 سایر</div>
              <div style={{ fontSize: 'var(--fs-lg)', fontWeight: 700, color: 'var(--text)', marginTop: 4 }}>{toFa(stats.other.toLocaleString('fa-IR'))}</div>
              <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)' }}>عدد</div>
            </div>
          </div>

          {stats.avgHenDay > 0 && (
            <div style={{ padding: 'var(--pad-normal)', background: 'var(--accent-soft)', border: '1px solid var(--accent-border)', borderRadius: 'var(--r-md)', textAlign: 'center' }}>
              <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', fontWeight: 700 }}>میانگین نرخ تخم‌گذاری (Hen-Day)</div>
              <div style={{ fontSize: 'var(--fs-xl)', fontWeight: 700, color: 'var(--accent)', marginTop: 4 }}>{toFa(stats.avgHenDay)}٪</div>
            </div>
          )}

          <div style={{ fontSize: 'var(--fs-base)', fontWeight: 700, color: 'var(--text)', paddingTop: 8 }}>
            📋 آخرین رکوردها
          </div>

          {filtered.slice(0, 20).map((p, i) => {
            const flock = flocks.find(f => f.id === p.flockId);
            const healthy = healthyCount(p);
            const fc = flock ? (flock.currentCount || flock.initialCount || 0) : 0;
            const rate = henDayRate(p, fc);
            return (
              <div key={p.id} style={{ padding: '10px 12px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 'var(--fs-sm)' }}>
                  <span style={{ fontWeight: 700, color: 'var(--text)' }}>{flock?.name || '—'}</span>
                  <span style={{ color: 'var(--muted)', fontSize: 'var(--fs-xs)' }}>{toFa(p.date)}</span>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', fontSize: 'var(--fs-xs)' }}>
                  <span style={{ color: 'var(--accent)' }}>🥚 {toFa(p.eatingCount || 0)}</span>
                  {p.fertileCount > 0 && <span style={{ color: 'var(--purple)' }}>🌱 {toFa(p.fertileCount)}</span>}
                  {p.brokenCount > 0 && <span style={{ color: 'var(--warn)' }}>💔 {toFa(p.brokenCount)}</span>}
                  {(p.softCount + p.dirtyCount) > 0 && <span style={{ color: 'var(--muted)' }}>📦 {toFa((p.softCount || 0) + (p.dirtyCount || 0))}</span>}
                  {rate > 0 && <span style={{ color: 'var(--muted)', marginRight: 'auto' }}>Hen-Day {toFa(rate.toFixed(1))}٪</span>}
                </div>
              </div>
            );
          })}
          {filtered.length > 20 && (
            <div style={{ textAlign: 'center', fontSize: 'var(--fs-xs)', color: 'var(--muted)', paddingTop: 8 }}>
              ... {toFa(filtered.length - 20)} رکورد دیگر
            </div>
          )}
        </>
      )}
    </PageContainer>
  );
}
