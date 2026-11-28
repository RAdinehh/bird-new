import { resolveCategoryIconKey } from '../../shr/components/uiIconRegistry';
import { OptionIcon } from '../../shr/components/OptionIcon';
import { useFormat } from '../../shr/units/useFormat';
import { useMemo } from 'react';
import { useEgg } from '../egg/store';
import { useDlg } from '../dlg/store';
import { useFlk } from '../flk/store';
import { eggsInMonth, feedInMonth, deathsInMonth, lastMonths, monthLabel } from './analytics';
import { BarChart, DualBarChart, LineChart } from '../../shr/components/Charts';
import { PageContainer, Btn } from '../../shr/components/ui';
import { exportTableToCSV } from '../../shr/utils/export';
import { toFa } from '../../shr/utils/fa';
import { StatCard, Section } from './helpers';
import HelpBanner from '../../shr/components/HelpBanner';

export default function ProductionPage() {
  const fmt = useFormat();
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
      <HelpBanner
        id="rep-production-guide"
        icon="profit_trend"
        title="راهنمای گزارش تولید"
        description="آمار ماهانهٔ تولید تخم، مصرف خوراک و تلفات را کنار هم ببینید و جدول یا گزارش تحلیلی دریافت کنید."
        tone="info"
      />
      {/* ۳ کارت اصلی */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
        <StatCard icon="egg" label="تخم کل" value={totalEggs} unit="عدد" color="accent" />
        <StatCard icon="feed" label="دان کل" value={totalFeed} unit="kg" color="warn" />
        <StatCard icon="mortality" label="تلفات" value={totalDeaths} unit="پرنده" color="danger" />
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
            {fmt.count(Math.round(totalEggs / 180))} عدد
          </span>
        </div>
      ) : null}

      {/* نمودار تخم */}
      <Section title={<span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><OptionIcon icon={resolveCategoryIconKey('period', '6m')} size={18} /><span>تولید تخم ۶ ماه</span></span>}>
        <BarChart data={eggData} color="var(--accent)" />
      </Section>

      {/* نمودار دان */}
      <Section title={<span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><OptionIcon icon={resolveCategoryIconKey('period', '6m')} size={18} /><span>مصرف دان ۶ ماه</span></span>}>
        <BarChart data={feedData} color="var(--warn)" />
      </Section>

      {/* مقایسه تخم و دان */}
      <Section title={<span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><OptionIcon icon={resolveCategoryIconKey('analytics', 'egg_feed')} size={16} /><span>مقایسه تخم و دان</span></span>}>
        <DualBarChart data={productionVsFeed} colorA="var(--accent)" colorB="var(--warn)" labelA="تخم" labelB="دان (kg)" />
      </Section>

      {/* Hen-Day */}
      {henDayData.some(d => d.value > 0) ? (
        <Section title={<span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><OptionIcon icon={resolveCategoryIconKey('analytics', 'hen_day')} size={16} /><span>نرخ تخم‌گذاری (Hen-Day)</span></span>}>
          <LineChart data={henDayData} color="var(--accent)" />
        </Section>
      ) : null}

      {/* FCR */}
      {fcrData.some(d => d.value > 0) ? (
        <Section title={<span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><OptionIcon icon={resolveCategoryIconKey('compare', 'fcr')} size={16} /><span>FCR (ضریب تبدیل)</span></span>}>
          <LineChart data={fcrData} color="var(--accent)" />
          <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', textAlign: 'center', marginTop: 4 }}>
            محاسبه: دان مصرفی / وزن تخم‌های تولیدی
          </div>
        </Section>
      ) : null}

      {/* نمودار تلفات */}
      {totalDeaths > 0 ? (
        <Section title={<span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><OptionIcon icon={resolveCategoryIconKey('period', '6m')} size={18} /><span>تلفات ۶ ماه</span></span>}>
          <BarChart data={deathData} color="var(--danger)" />
        </Section>
      ) : null}
          <Section title={<span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><OptionIcon icon={resolveCategoryIconKey('export', 'csv')} size={18} /><span>خروجی CSV</span></span>}>
        <Btn full variant="primary" onClick={() => {
          const headers = ['ماه', 'تخم سالم', 'دان (kg)', 'تلفات'];
          const rows = months.map(m => {
            const e = eggsInMonth(productions, m);
            const fd = feedInMonth(logs, m);
            const dd = deathsInMonth(logs, m);
            return [monthLabel(m), e.healthy, fd, dd];
          });
          exportTableToCSV('گزارش-تولید', headers, rows);
        }}>دانلود CSV</Btn>
      </Section>
</PageContainer>
  );
}
