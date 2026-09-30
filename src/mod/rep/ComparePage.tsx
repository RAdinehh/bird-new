import { useState, useMemo } from 'react';
import { useTra } from '../tra/store';
import { useEgg, healthyCount } from '../egg/store';
import { lastMonths, monthLabel, salesInMonth, purchasesInMonth, eggsInMonth, feedInMonth } from './analytics';
import { DualBarChart, BarChart } from '../../shr/components/Charts';
import { PageContainer, Select } from '../../shr/components/ui';
import { toFa } from '../../shr/utils/fa';
import { Section } from './helpers';

type Mode = 'month' | 'quarter' | 'year';

export default function ComparePage() {
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
        label: 'دوره ' + (quarters.length + 1),
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
      {/* انتخاب حالت */}
      <div style={{ display: 'flex', gap: 6 }}>
        <button onClick={() => setMode('month')} style={chip(mode === 'month')}>
          📅 ماهانه
        </button>
        <button onClick={() => setMode('quarter')} style={chip(mode === 'quarter')}>
          📊 سه‌ماهه
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
              🏆 بهترین ماه فروش
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{ fontSize: 'var(--fs-base)', fontWeight: 700 }}>{best.label}</span>
              <span style={{ fontSize: 'var(--fs-md)', fontWeight: 700, color: 'var(--accent)' }}>
                {toFa(best.sales.toLocaleString('fa-IR'))} ت
              </span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            <div style={{
              padding: 'var(--pad-comfy)',
              background: 'var(--info-soft)',
              border: '1px solid var(--info)',
              borderRadius: 'var(--r-md)'
            }}>
              <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--info)', fontWeight: 700 }}>
                میانگین فروش ماهانه
              </div>
              <div style={{ fontSize: 'var(--fs-md)', fontWeight: 700, color: 'var(--info)', marginTop: 4 }}>
                {toFa(Math.round(avgSales).toLocaleString('fa-IR'))} ت
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
                {toFa(Math.round(avgEggs).toLocaleString('fa-IR'))} عدد
              </div>
            </div>
          </div>
        </>
      ) : null}

      {/* نمودار فروش vs خرید */}
      <Section title="💰 فروش در مقابل خرید">
        <DualBarChart
          data={currentData.map(d => ({ label: d.label, a: d.sales, b: d.purchases }))}
          colorA="var(--accent)"
          colorB="var(--warn)"
          labelA="فروش"
          labelB="خرید"
        />
      </Section>

      {/* نمودار سود */}
      <Section title="📈 سود در طول زمان">
        <BarChart
          data={currentData.map(d => ({ label: d.label, value: d.sales - d.purchases }))}
          color="var(--accent)"
        />
      </Section>

      {/* نمودار تخم */}
      {currentData.some(d => d.eggs > 0) ? (
        <Section title="🥚 تولید تخم در طول زمان">
          <BarChart
            data={currentData.map(d => ({ label: d.label, value: d.eggs }))}
            color="var(--info)"
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
