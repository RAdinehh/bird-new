import { useMemo } from 'react';
import { useTra } from '../tra/store';
import { salesInMonth, purchasesInMonth, cashInMonth, cashOutMonth, lastMonths, monthLabel, totalReceivables, totalPayables } from './analytics';
import { BarChart, DualBarChart, LineChart, PieChart } from '../../shr/components/Charts';
import { PageContainer } from '../../shr/components/ui';
import { toFa } from '../../shr/utils/fa';
import { pareto } from '../../shr/utils/pareto';
import ExportButtons from './ExportButtons';


function ParetoCard({ invoices }: { invoices: any[] }) {
  const data = useMemo(() => {
    const map: Record<string, number> = {};
    invoices.filter((i: any) => i.type === 'purchase').forEach((inv: any) => {
      (inv.items || []).forEach((it: any) => {
        const name = it.name || 'سایر';
        const amount = it.total || ((it.quantity || 0) * (it.unitPrice || 0));
        map[name] = (map[name] || 0) + amount;
      });
    });
    const arr = Object.entries(map).map(([label, value]) => ({ label, value }));
    return pareto(arr);
  }, [invoices]);

  if (data.length === 0) return null;
  const top80 = data.filter((d, i) => i === 0 || data[i - 1].cumulative <= 80);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '12px 14px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)' }}>
      <div style={{ fontSize: 'var(--fs-md)', fontWeight: 700 }}>📊 تحلیل Pareto — اقلام پرهزینه</div>
      <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', lineHeight: 1.7 }}>
        {toFa(top80.length)} قلم اول = حدود ۸۰٪ کل خرید
      </div>
      {data.slice(0, 6).map((d, i) => (
        <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--fs-sm)' }}>
            <span style={{ fontWeight: d.cumulative <= 80 ? 700 : 400 }}>{d.label}</span>
            <span style={{ direction: 'ltr', color: d.cumulative <= 80 ? 'var(--danger)' : 'var(--muted)', fontWeight: 600 }}>
              {toFa(d.percent)}٪
            </span>
          </div>
          <div style={{ height: 4, background: 'var(--input-bg)', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: d.percent + '%', background: d.cumulative <= 80 ? 'var(--danger)' : 'var(--muted)' }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function FinancialPage() {
  const { invoices } = useTra();

  const months = useMemo(() => lastMonths(6), []);

  const salesData = useMemo(
    () => months.map(m => ({ label: monthLabel(m), value: salesInMonth(invoices, m) })),
    [invoices, months]
  );

  const purchaseData = useMemo(
    () => months.map(m => ({ label: monthLabel(m), value: purchasesInMonth(invoices, m) })),
    [invoices, months]
  );

  const cashData = useMemo(
    () => months.map(m => ({
      label: monthLabel(m),
      a: cashInMonth(invoices, m),
      b: cashOutMonth(invoices, m)
    })),
    [invoices, months]
  );

  const receivables = totalReceivables(invoices);
  const payables = totalPayables(invoices);
  const totalSales = salesData.reduce((a, d) => a + d.value, 0);
  const totalPurchases = purchaseData.reduce((a, d) => a + d.value, 0);
  const profit = totalSales - totalPurchases;

  // سهم دسته‌ها در فروش
  const catSales = useMemo(() => {
    const map: Record<string, number> = {};
    invoices.filter(i => i.type === 'sale').forEach(i => {
      map[i.category] = (map[i.category] || 0) + (i.total || 0);
    });
    const colors = ['#16a34a', '#0284c7', '#7c3aed', '#d97706', '#dc2626', '#64748b', '#0891b2'];
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([k, v], i) => ({ label: k, value: v, color: colors[i] }));
  }, [invoices]);

  if (invoices.length === 0) {
    return (
      <PageContainer>
      <ParetoCard invoices={invoices} />
        <div style={{ padding: 60, textAlign: 'center', fontSize: 'var(--fs-sm)', color: 'var(--muted)', lineHeight: 1.8 }}>
          هنوز معامله‌ای ثبت نشده
          <br />
          <span style={{ fontSize: 'var(--fs-xs)' }}>ابتدا در ماژول معاملات خرید یا فروش ثبت کنید</span>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      {/* ۳ کارت اصلی */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
        <StatCard label="فروش کل" value={totalSales} color="accent" />
        <StatCard label="خرید کل" value={totalPurchases} color="warn" />
        <StatCard label={profit >= 0 ? 'سود' : 'زیان'} value={Math.abs(profit)} color={profit >= 0 ? 'accent' : 'danger'} />
      </div>

      {/* طلب و بدهی */}
      {(receivables > 0 || payables > 0) ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
          {receivables > 0 ? (
            <div style={{ padding: '12px 14px', background: 'var(--accent-soft)',
               border: '1px solid var(--accent-border)', borderRadius: 'var(--r-md)' }}>
              <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--accent)', fontWeight: 700 }}>📥 طلب از مشتریان</div>
              <div style={{ fontSize: 'var(--fs-lg)', fontWeight: 700, color: 'var(--accent)', marginTop: 4, fontVariantNumeric: 'tabular-nums' }}>
                {toFa(receivables.toLocaleString('fa-IR'))}
              </div>
              <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', marginTop: 2 }}>تومان</div>
            </div>
          ) : null}
          {payables > 0 ? (
            <div style={{ padding: '12px 14px', background: 'var(--warn-soft)', border: '1px solid var(--warn)', borderRadius: 'var(--r-md)' }}>
              <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--warn)', fontWeight: 700 }}>📤 بدهی به فروشندگان</div>
              <div style={{ fontSize: 'var(--fs-lg)', fontWeight: 700, color: 'var(--warn)', marginTop: 4, fontVariantNumeric: 'tabular-nums' }}>
                {toFa(payables.toLocaleString('fa-IR'))}
              </div>
              <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', marginTop: 2 }}>تومان</div>
            </div>
          ) : null}
        </div>
      ) : null}

      {/* نمودار فروش */}
      <Section title="📊 فروش ۶ ماه اخیر">
        <BarChart data={salesData} color="var(--accent)" />
      </Section>

      {/* نمودار خرید */}
      <Section title="📊 خرید ۶ ماه اخیر">
        <BarChart data={purchaseData} color="var(--warn)" />
      </Section>

      {/* جریان نقدی */}
      <Section title="💵 جریان نقدی">
        <DualBarChart data={cashData} colorA="var(--accent)" colorB="var(--danger)" labelA="دریافت" labelB="پرداخت" />
      </Section>

      {/* روند سود */}
      <Section title="📈 روند سود">
        <LineChart
          data={months.map(m => ({
            label: monthLabel(m),
            value: salesInMonth(invoices, m) - purchasesInMonth(invoices, m)
          }))}
          color="var(--accent)"
        />
      </Section>

      {/* سهم دسته‌ها */}
      {catSales.length > 0 ? (
        <Section title="🎯 سهم دسته‌ها در فروش">
          <PieChart data={catSales} />
        </Section>
      ) : null}

      {/* خروجی‌ها */}
      <div style={{ fontSize: 'var(--fs-sm)', fontWeight: 700, color: 'var(--muted)', padding: '4px 4px 8px' }}>
        📤 خروجی گرفتن
      </div>
      <ExportButtons />
    </PageContainer>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: 'accent' | 'warn' | 'danger' }) {
  return (
    <div style={{
      padding: '12px 10px', textAlign: 'center',
      background: 'var(--' + color + '-soft)',
      border: '1px solid var(--' + color + ')',
      borderRadius: 'var(--r-md)'
    }}>
      <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--' + color + ')', fontWeight: 700 }}>{label}</div>
      <div style={{ fontSize: 'var(--fs-md)', fontWeight: 700, color: 'var(--' + color + ')', marginTop: 4, fontVariantNumeric: 'tabular-nums' }}>
        {toFa(value.toLocaleString('fa-IR'))}
      </div>
      <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', marginTop: 2 }}>تومان</div>
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
