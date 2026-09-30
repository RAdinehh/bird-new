import { useMemo } from 'react';
import { useFlk, getAgeDays, getLifecycle } from '../flk/store';
import { useBrd } from '../brd/store';
import { useEgg, healthyCount, henDayRate, brokenRate } from '../egg/store';
import { useDlg } from '../dlg/store';
import { BarChart, LineChart } from '../../shr/components/Charts';
import { PageContainer, Tag } from '../../shr/components/ui';
import { toFa } from '../../shr/utils/fa';

export default function FlockReportPage() {
  const { flocks } = useFlk();
  const { birds } = useBrd();
  const { productions } = useEgg();
  const { logs } = useDlg();

  const activeFlocks = flocks.filter(f => f.status === 'active');

  if (activeFlocks.length === 0) {
    return (
      <PageContainer>
        <div style={{ padding: 60, textAlign: 'center', fontSize: 'var(--fs-sm)', color: 'var(--muted)', lineHeight: 1.8 }}>
          هنوز گله فعالی وجود ندارد
        </div>
      </PageContainer>
    );
  }

  // داده‌ی هر گله
  const flockData = useMemo(() => activeFlocks.map(f => {
    const myProductions = productions.filter(p => p.flockId === f.id);
    const myLogs = logs.filter(l => l.flockId === f.id);
    const flockCount = f.currentCount || f.initialCount || 0;
    const totalEggs = myProductions.reduce((a, p) => a + healthyCount(p), 0);
    const totalDeaths = myLogs.reduce((a, l) => a + (l.deaths || []).reduce((b, x) => b + (x.count || 0), 0), 0);
    const totalFeed = myLogs.reduce((a, l) => a + (l.feedAmount || 0), 0);
    const initialCount = f.initialCount || 0;
    const mortality = initialCount > 0 ? (totalDeaths / initialCount) * 100 : 0;
    const avgHenDay = myProductions.length > 0
      ? myProductions.reduce((a, p) => a + henDayRate(p, flockCount), 0) / myProductions.length
      : 0;
    const avgBroken = myProductions.length > 0
      ? myProductions.reduce((a, p) => a + brokenRate(p), 0) / myProductions.length
      : 0;
    const bird = birds.find(b => b.id === f.birdId);
    const lc = getLifecycle(f.type, getAgeDays(f));

    return {
      flock: f,
      bird,
      ageDays: getAgeDays(f),
      lifecycle: lc,
      flockCount,
      totalEggs,
      totalDeaths,
      totalFeed,
      mortality,
      avgHenDay,
      avgBroken,
      productionsCount: myProductions.length,
      logsCount: myLogs.length
    };
  }), [activeFlocks, productions, logs, birds]);

  // نمودار مقایسه‌ی گله‌ها بر اساس تخم
  const eggsChart = flockData.map(d => ({
    label: d.flock.name.slice(0, 8),
    value: d.totalEggs
  }));

  // نمودار مرگ‌ومیر
  const mortalityChart = flockData.map(d => ({
    label: d.flock.name.slice(0, 8),
    value: Math.round(d.mortality * 10) / 10
  }));

  // نمودار Hen-Day
  const henDayChart = flockData.map(d => ({
    label: d.flock.name.slice(0, 8),
    value: Math.round(d.avgHenDay * 10) / 10
  }));

  return (
    <PageContainer>
      {/* خلاصه */}
      <div style={{
        padding: '14px 16px',
        background: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--r-lg)'
      }}>
        <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--muted)', marginBottom: 6 }}>
          گله‌های فعال
        </div>
        <div style={{ fontSize: 'var(--fs-2xl)', fontWeight: 700, color: 'var(--accent)' }}>
          {toFa(activeFlocks.length)} گله
        </div>
        <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', marginTop: 4 }}>
          جمع پرنده: {toFa(activeFlocks.reduce((a, f) => a + (f.currentCount || f.initialCount || 0), 0).toLocaleString('fa-IR'))}
        </div>
      </div>

      {/* کارت هر گله */}
      {flockData.map((d, i) => (
        <div key={d.flock.id} style={{
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--r-lg)',
          padding: '14px 16px',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{
            position: 'absolute', top: 0, right: 0, bottom: 0, width: 4,
            background: d.lifecycle.color === 'green' ? 'var(--accent)' :
              d.lifecycle.color === 'amber' ? 'var(--warn)' :
              d.lifecycle.color === 'blue' ? 'var(--info)' : 'var(--dim)'
          }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 'var(--r-md)',
              background: 'var(--accent-soft)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 'var(--fs-md)', position: 'relative'
            }}>
              🐔
              <span style={{
                position: 'absolute', top: -4, left: -4, width: 18, height: 18,
                borderRadius: '50%', background: 'var(--accent)',
                color: 'var(--avatar-text)', fontSize: 'var(--fs-xs)', fontWeight: 800,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '2px solid var(--card-solid)'
              }}>{toFa(i + 1)}</span>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 'var(--fs-base)', fontWeight: 700 }}>{d.flock.name}</div>
              <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', marginTop: 2 }}>
                {d.bird?.name || '—'} · {toFa(d.ageDays)} روز · {d.lifecycle.label}
              </div>
            </div>
            <Tag tone={d.lifecycle.color === 'green' ? 'green' : d.lifecycle.color === 'amber' ? 'amber' : 'blue'}>
              {toFa(d.flockCount)} پرنده
            </Tag>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            <Stat label="🥚 تخم کل" value={toFa(d.totalEggs.toLocaleString('fa-IR'))} color="accent" />
            <Stat label="💀 مرگ‌ومیر" value={toFa(d.mortality.toFixed(1)) + '٪'} color="danger" />
            <Stat label="📊 Hen-Day" value={toFa(d.avgHenDay.toFixed(1)) + '٪'} color="info" />
            <Stat label="🌾 دان مصرفی" value={toFa(d.totalFeed.toLocaleString('fa-IR')) + ' kg'} color="warn" />
            {d.avgBroken > 0 ? <Stat label="💔 شکسته" value={toFa(d.avgBroken.toFixed(1)) + '٪'} color="warn" /> : null}
            <Stat label="📋 رکوردها" value={toFa(d.productionsCount + d.logsCount)} color="accent" />
          </div>
        </div>
      ))}

      {flockData.length > 1 ? (
        <>
          <Section title="🥚 مقایسه تخم‌گذاری گله‌ها">
            <BarChart data={eggsChart} color="var(--accent)" />
          </Section>

          <Section title="💀 مقایسه مرگ‌ومیر">
            <BarChart data={mortalityChart} color="var(--danger)" />
          </Section>

          <Section title="📊 مقایسه Hen-Day">
            <BarChart data={henDayChart} color="var(--info)" />
          </Section>
        </>
      ) : null}
    </PageContainer>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color: 'accent' | 'warn' | 'danger' | 'info' }) {
  return (
    <div style={{
      padding: 'var(--pad-normal)',
      background: 'var(--' + color + '-soft)',
      borderRadius: 'var(--r-sm)',
      border: '1px solid var(--' + color + ')'
    }}>
      <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--' + color + ')', fontWeight: 700 }}>{label}</div>
      <div style={{ fontSize: 'var(--fs-sm)', fontWeight: 700, color: 'var(--' + color + ')', marginTop: 2 }}>
        {value}
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: 'var(--card)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--r-lg)',
      padding: '14px 16px'
    }}>
      <div style={{ fontSize: 'var(--fs-base)', fontWeight: 700, marginBottom: 4 }}>{title}</div>
      {children}
    </div>
  );
}
