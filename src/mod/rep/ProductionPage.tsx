import { useMemo } from 'react';
import { useEgg, healthyCount } from '../egg/store';
import { useDlg } from '../dlg/store';
import { useFlk } from '../flk/store';
import { eggsInMonth, feedInMonth, deathsInMonth, lastMonths, monthLabel } from './analytics';
import { BarChart, DualBarChart, LineChart } from '../../shr/components/Charts';
import { PageContainer } from '../../shr/components/ui';
import { toFa } from '../../shr/utils/fa';
import { StatCard, Section } from './helpers';

export default function ProductionPage() {
  const { productions } = useEgg();
  const { logs } = useDlg();
  const { flocks } = useFlk();

  const months = useMemo(() => lastMonths(6), []);

  const eggData = useMemo(
    () => months.map(m => {
      const e = eggsInMonth(productions, m);
      return { label: monthLabel(m), value: e.healthy };
    }),
    [productions, months]
  );

  const totalEggs = eggData.reduce((a, d) => a + d.value, 0);

  const feedData = useMemo(
    () => months.map(m => ({ label: monthLabel(m), value: feedInMonth(logs, m) })),
    [logs, months]
  );

  const totalFeed = feedData.reduce((a, d) => a + d.value, 0);

  const deathData = useMemo(
    () => months.map(m => ({ label: monthLabel(m), value: deathsInMonth(logs, m) })),
    [logs, months]
  );

  const totalDeaths = deathData.reduce((a, d) => a + d.value, 0);

  // تولید و مصرف
  const productionVsFeed = useMemo(
    () => months.map(m => ({
      label: monthLabel(m),
      a: eggsInMonth(productions, m).healthy,
      b: feedInMonth(logs, m)
    })),
    [productions, logs, months]
  );

  // نرخ تخم‌گذاری Hen-Day
  const henDayData = useMemo(
    () => months.map(m => {
      const e = eggsInMonth(productions, m);
      const avgBirds = flocks.filter(f => f.status === 'active').reduce((a, f) => a + (f.currentCount || f.initialCount || 0), 0);
      const rate = avgBirds > 0 && e.days > 0 ? (e.healthy / (avgBirds * e.days)) * 100 : 0;
      return { label: monthLabel(m), value: Math.round(rate * 10) / 10 };
    }),
    [productions, flocks, months]
  );

  // FCR تخمینی
  const fcrData = useMemo(
    () => months.map(m => {
      const feed = feedInMonth(logs, m);
      const e = eggsInMonth(productions, m);
      // تخمین: هر تخم ۶۰ گرم
      const gain = (e.healthy * 60) / 1000; // کیلوگرم
      const fcr = gain > 0 ? feed / gain : 0;
      return { label: monthLabel(m), value: Math.round(fcr * 100) / 100 };
    }),
    [logs, productions, months]
  );

  if (productions.length === 0 && logs.length === 0) {
    return (
      <PageContainer>
        <div style={{ padding: 60, textAlign: 'center', fontSize: 'var(--fs-sm)', color: 'var(--muted)', lineHeight: 1.8 }}>
          هنوز داده‌ای برای تولید ثبت نشده
          <br />
          <span style={{ fontSize: 'var(--fs-xs)' }}>ابتدا در ماژول تخم و ثبت روزانه داده وارد کنید</span>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      {/* ۳ کارت اصلی */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
        <StatCard label="🥚 تخم کل" value={totalEggs} unit="عدد" color="accent" />
        <StatCard label="🌾 دان کل" value={totalFeed} unit="kg" color="warn" />
        <StatCard label="💀 تلفات" value={totalDeaths} unit="پرنده" color="danger" />
      </div>

      {/* میانگین روزانه */}
      {totalEggs > 0 ? (
        <div style={{
          padding: 'var(--pad-comfy)',
          background: 'var(--accent-soft)',
          border: '1px solid var(--accent-border)',
          borderRadius: 'var(--r-md)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        }}>
          <span style={{ fontSize: 'var(--fs-sm)', color: 'var(--accent)', fontWeight: 700 }}>
            میانگین تخم روزانه
          </span>
          <span style={{ fontSize: 'var(--fs-md)', color: 'var(--accent)', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
            {toFa(Math.round(totalEggs / 180).toLocaleString('fa-IR'))} عدد
          </span>
        </div>
      ) : null}

      {/* نمودار تخم */}
      <Section title="🥚 تولید تخم ۶ ماه">
        <BarChart data={eggData} color="var(--accent)" />
      </Section>

      {/* نمودار دان */}
      <Section title="🌾 مصرف دان ۶ ماه">
        <BarChart data={feedData} color="var(--warn)" />
      </Section>

      {/* مقایسه تخم و دان */}
      <Section title="📊 مقایسه تخم و دان">
        <DualBarChart data={productionVsFeed} colorA="var(--accent)" colorB="var(--warn)" labelA="تخم" labelB="دان (kg)" />
      </Section>

      {/* Hen-Day */}
      {henDayData.some(d => d.value > 0) ? (
        <Section title="📈 نرخ تخم‌گذاری (Hen-Day)">
          <LineChart data={henDayData} color="var(--accent)" />
        </Section>
      ) : null}

      {/* FCR */}
      {fcrData.some(d => d.value > 0) ? (
        <Section title="⚖ FCR (ضریب تبدیل)">
          <LineChart data={fcrData} color="var(--accent)" />
          <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', textAlign: 'center', marginTop: 4 }}>
            محاسبه: دان مصرفی / وزن تخم‌های تولیدی
          </div>
        </Section>
      ) : null}

      {/* نمودار تلفات */}
      {totalDeaths > 0 ? (
        <Section title="💀 تلفات ۶ ماه">
          <BarChart data={deathData} color="var(--danger)" />
        </Section>
      ) : null}
    </PageContainer>
  );
}
