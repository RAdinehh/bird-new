import { resolveCategoryIconKey } from '../../shr/components/uiIconRegistry';
import { OptionIcon } from '../../shr/components/OptionIcon';
import { useFormat } from '../../shr/units/useFormat';
import { useState, useMemo } from 'react';
import { useTra } from '../tra/store';
import { useEgg } from '../egg/store';
import { lastMonths, monthLabel, salesInMonth, purchasesInMonth, eggsInMonth, feedInMonth } from './analytics';
import { DualBarChart, BarChart } from '../../shr/components/Charts';
import { PageContainer } from '../../shr/components/ui';
import { toFa } from '../../shr/utils/fa';
import { Section } from './helpers';
import HelpBanner from '../../shr/components/HelpBanner';

type Mode = 'month' | 'quarter' | 'year';

export default function ComparePage() {
  const fmt = useFormat();
  const { invoices } = useTra();
  const { productions } = useEgg();

  const [mode, setMode] = useState<Mode>('month');

  const months = useMemo(() => lastMonths(12), []);

  // داده‌های ماهانه
  const monthlyData = useMemo(() => months.map(m => ({
    label: monthLabel(m),
    sales: salesInMonth(invoices, m),
    purchases: purchasesInMonth(invoices, m),
    eggs: eggsInMonth(productions, m).healthy,
    feed: feedInMonth([], m)
  })), [months, invoices, productions]);

  // داده‌های سه‌ماهه
  const quarterlyData = useMemo(() => {
    const quarters: { label: string; sales: number; purchases: number; eggs: number }[] = [];
    for (let i = 0; i < 12; i += 3) {
      const chunk = months.slice(i, i + 3);
      if (chunk.length === 0) continue;
      const sales = chunk.reduce((a, m) => a + salesInMonth(invoices, m), 0);
      const purchases = chunk.reduce((a, m) => a + purchasesInMonth(invoices, m), 0);
      const eggs = chunk.reduce((a, m) => a + eggsInMonth(productions, m).healthy, 0);
      quarters.push({
        label: 'دوره' + (quarters.length + 1),
        sales, purchases, eggs
      });
    }
    return quarters;
  }, [months, invoices, productions]);

  const currentData = mode === 'quarter' ? quarterlyData : monthlyData;

  // بهترین ماه
  const best = useMemo(() => {
    if (monthlyData.length === 0) return null;
    return monthlyData.reduce((a, b) => b.sales > a.sales ? b : a);
  }, [monthlyData]);

  // میانگین
  const avgSales = monthlyData.filter(d => d.sales > 0).length > 0
    ? monthlyData.reduce((a, d) => a + d.sales, 0) / monthlyData.filter(d => d.sales > 0).length
    : 0;

  const avgEggs = monthlyData.filter(d => d.eggs > 0).length > 0
    ? monthlyData.reduce((a, d) => a + d.eggs, 0) / monthlyData.filter(d => d.eggs > 0).length
    : 0;

  return (
    <PageContainer>
      <HelpBanner
        id="rep-compare-guide"
        icon="compare_scale"
        title="راهنمای مقایسه"
        description="عملکرد چند گله یا دورهٔ زمانی را از نظر تولید، مصرف، تلفات و شاخص‌های کلیدی با هم مقایسه کنید."
        tone="info"
      />
      {/* انتخاب حالت */}
      <div style={{ display: 'flex', gap: 6 }}>
        <button onClick={() => setMode('month')} style={chip(mode === 'month')}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><OptionIcon icon={resolveCategoryIconKey('period', '30d')} size={15} /><span>ماهانه</span></span>
        </button>
        <button onClick={() => setMode('quarter')} style={chip(mode === 'quarter')}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><OptionIcon icon={resolveCategoryIconKey('period', '3m')} size={17} /><span>سه‌ماهه</span></span>
        </button>
      </div>

      {/* خلاصه */}
      {best && avgSales > 0 ? (
        <>
          <div style={{
            padding: 'var(--pad-comfy)',
            background: 'var(--accent-soft)',
            border: '1px solid var(--accent-border)',
            borderRadius: 'var(--r-md)',
            display: 'flex', flexDirection: 'column', gap: 4
          }}>
            <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--accent)', fontWeight: 700 }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><OptionIcon icon={resolveCategoryIconKey('analytics', 'best_month')} size={15} /><span>بهترین ماه فروش</span></span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{ fontSize: 'var(--fs-base)', fontWeight: 700 }}>{best.label}</span>
              <span style={{ fontSize: 'var(--fs-md)', fontWeight: 700, color: 'var(--accent)' }}>
                {fmt.money(best.sales)}
              </span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            <div style={{
              padding: 'var(--pad-comfy)',
              background: 'var(--accent-soft)',
              border: '1px solid var(--accent-border)',
              borderRadius: 'var(--r-md)'
            }}>
              <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--accent)', fontWeight: 700 }}>
                میانگین فروش ماهانه
              </div>
              <div style={{ fontSize: 'var(--fs-md)', fontWeight: 700, color: 'var(--accent)', marginTop: 4 }}>
                {fmt.money(Math.round(avgSales))}
              </div>
            </div>
            <div style={{
              padding: 'var(--pad-comfy)',
              background: 'var(--accent-soft)',
              border: '1px solid var(--accent-border)',
              borderRadius: 'var(--r-md)'
            }}>
              <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--accent)', fontWeight: 700 }}>
                میانگین تخم ماهانه
              </div>
              <div style={{ fontSize: 'var(--fs-md)', fontWeight: 700, color: 'var(--accent)', marginTop: 4 }}>
                {fmt.count(Math.round(avgEggs))} عدد
              </div>
            </div>
          </div>
        </>
      ) : null}

      {/* نمودار فروش vs خرید */}
      <Section title={<span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><OptionIcon icon={resolveCategoryIconKey('finance', 'sales_vs_purchase')} size={16} /><span>فروش در مقابل خرید</span></span>}>
        <DualBarChart
          data={currentData.map(d => ({ label: d.label, a: d.sales, b: d.purchases }))}
          colorA="var(--accent)"
          colorB="var(--warn)"
          labelA="فروش"
          labelB="خرید"
        />
      </Section>

      {/* نمودار سود */}
      <Section title={<span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><OptionIcon icon={resolveCategoryIconKey('profit', 'timeline')} size={18} /><span>سود در طول زمان</span></span>}>
        <BarChart
          data={currentData.map(d => ({ label: d.label, value: d.sales - d.purchases }))}
          color="var(--accent)"
        />
      </Section>

      {/* نمودار تخم */}
      {currentData.some(d => d.eggs > 0) ? (
        <Section title={<span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><OptionIcon icon={resolveCategoryIconKey('production', 'egg')} size={16} /><span>تولید تخم در طول زمان</span></span>}>
          <BarChart
            data={currentData.map(d => ({ label: d.label, value: d.eggs }))}
            color="var(--accent)"
          />
        </Section>
      ) : null}
    </PageContainer>
  );
}

function chip(active: boolean): React.CSSProperties {
  return {
    flex: 1,
    padding: '9px 12px', fontSize: 'var(--fs-sm)',
    background: active ? 'var(--accent-soft)' : 'var(--btn-bg)',
    border: '1px solid ' + (active ? 'var(--accent-border)' : 'var(--border)'),
    borderRadius: 'var(--r-sm)',
    color: active ? 'var(--accent)' : 'var(--muted)',
    fontWeight: active ? 700 : 500, cursor: 'pointer',
    fontFamily: 'inherit'
  };
}
