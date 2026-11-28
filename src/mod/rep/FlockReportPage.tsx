import { resolveCategoryIconKey } from '../../shr/components/uiIconRegistry';
import { OptionIcon } from '../../shr/components/OptionIcon';
import { useFormat } from '../../shr/units/useFormat';
import { useMemo } from 'react';
import { useFlk, getAgeDays, getLifecycle } from '../flk/store';
import { useBrd } from '../brd/store';
import { useEgg, healthyCount, henDayRate, brokenRate } from '../egg/store';
import { useDlg } from '../dlg/store';
import { BarChart } from '../../shr/components/Charts';
import { PageContainer, Tag, Btn } from '../../shr/components/ui';
import { exportTableToCSV } from '../../shr/utils/export';
import { toFa } from '../../shr/utils/fa';
import { StatCard, Section } from './helpers';
import { applyCorrections } from '../dlg/api/applyCorrections';
import HelpBanner from '../../shr/components/HelpBanner';

export default function FlockReportPage() {
  const fmt = useFormat();
  const { flocks } = useFlk();
  const { birds } = useBrd();
  const { productions } = useEgg();
  const { logs } = useDlg();

  const activeFlocks = flocks.filter(f => f.status === 'active');

  if (activeFlocks.length === 0) {
    return (
      <PageContainer>
      <HelpBanner
        id="rep-flock-guide"
        icon="flock"
        title="راهنمای گزارش گله"
        description="شاخص‌های عملکرد، مصرف خوراک، تلفات، درآمد و هزینه‌های هر گله را به‌صورت یکجا بررسی و گزارش تهیه کنید."
        tone="info"
      />
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
    const totalFeed = myLogs.map(applyCorrections).reduce((a, l) => a + (l.feedConsumed ?? l.feedDelivered ?? 0), 0);
    const initialCount = f.initialCount || 0;
    const mortality = initialCount > 0 ? (totalDeaths / initialCount) * 100 : 0;
    const avgHenDay = myProductions.length > 0
      ? myProductions.reduce((a, p) => a + henDayRate(p, flockCount), 0) / myProductions.length
      : 0;
    const avgBroken = myProductions.length > 0
      ? myProductions.reduce((a, p) => a + brokenRate(p), 0) / myProductions.length
      : 0;
    const bird = birds.find(b => b.id === f.birdId);
    const lc = getLifecycle(f.type, getAgeDays(f), f.endOfCycleDay ?? null, null);

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

  // نمودار تلفات
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
      <HelpBanner
        id="rep-flock-guide"
        icon="flock"
        title="راهنمای گزارش گله"
        description="شاخص‌های عملکرد، مصرف خوراک، تلفات، درآمد و هزینه‌های هر گله را به‌صورت یکجا بررسی و گزارش تهیه کنید."
        tone="info"
      />
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
          {fmt.count(activeFlocks.length)} گله
        </div>
        <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', marginTop: 4 }}>
          جمع پرنده: {fmt.count(activeFlocks.reduce((a, f) => a + (f.currentCount || f.initialCount || 0), 0))}
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
              d.lifecycle.color === 'blue' ? 'var(--accent)' : 'var(--dim)'
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
              }}>{fmt.count(i + 1)}</span>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 'var(--fs-base)', fontWeight: 700 }}>{d.flock.name}</div>
              <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', marginTop: 2 }}>
                {d.bird?.name || '—'} • {fmt.day(d.ageDays)} روز • {d.lifecycle.label}
              </div>
            </div>
            <Tag tone={d.lifecycle.color === 'green' ? 'green' : d.lifecycle.color === 'amber' ? 'amber' : 'blue'}>
              {fmt.count(d.flockCount)} پرنده
            </Tag>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            <StatCard icon="egg" label="تخم کل" value={fmt.count(d.totalEggs)} color="accent" />
            <StatCard icon="mortality" label="تلفات" value={fmt.code(d.mortality.toFixed(1)) + '٪'} color="danger" />
            <StatCard icon="egg" label="نرخ تخم‌گذاری" value={fmt.code(d.avgHenDay.toFixed(1)) + '٪'} color="info" />
            <StatCard icon="feed" label="دان مصرفی" value={fmt.num(d.totalFeed) + ' kg'} color="warn" />
            {d.avgBroken > 0 ? <StatCard icon="broken_egg" label="شکسته" value={fmt.code(d.avgBroken.toFixed(1)) + '٪'} color="warn" /> : null}
            <StatCard icon="📋" label="رکوردها" value={fmt.count(d.productionsCount + d.logsCount)} color="accent" />
          </div>
        </div>
      ))}

      {flockData.length > 1 ? (
        <>
          <Section title={<span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><OptionIcon icon={resolveCategoryIconKey('production', 'egg')} size={16} /><span>مقایسه تخم‌گذاری گله‌ها</span></span>}>
            <BarChart data={eggsChart} color="var(--accent)" />
          </Section>

          <Section title={<span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><OptionIcon icon={resolveCategoryIconKey('production', 'mortality')} size={16} /><span>مقایسه مرگ‌ومیر</span></span>}>
            <BarChart data={mortalityChart} color="var(--danger)" />
          </Section>

          <Section title={<span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><OptionIcon icon={resolveCategoryIconKey('analytics', 'hen_day')} size={16} /><span>مقایسه نرخ تخم‌گذاری</span></span>}>
            <BarChart data={henDayChart} color="var(--accent)" />
          </Section>
        </>
      ) : null}
          <Section title={<span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><OptionIcon icon={resolveCategoryIconKey('export', 'csv')} size={18} /><span>خروجی CSV</span></span>}>
        <Btn full variant="primary" onClick={() => {
          const headers = ['گله', 'نوع', 'تعداد', 'تخم کل', 'تلفات٪', 'تخم‌گذاری٪', 'دان (kg)', 'شکسته٪', 'رکوردها'];
          const rows = flockData.map(d => [
            d.flock.name,
            d.flock.type,
            d.flockCount,
            d.totalEggs,
            d.mortality.toFixed(1),
            d.avgHenDay.toFixed(1),
            d.totalFeed,
            d.avgBroken.toFixed(1),
            d.productionsCount + d.logsCount,
          ]);
          exportTableToCSV('گزارش-گله‌ها', headers, rows);
        }}>دانلود CSV</Btn>
      </Section>
</PageContainer>
  );
}
