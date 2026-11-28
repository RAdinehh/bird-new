import { resolveCategoryIconKey } from '../../shr/components/uiIconRegistry';
import { OptionIcon } from '../../shr/components/OptionIcon';
import { useFormat, getGlobalFormat } from '../../shr/units/useFormat';
import { useMemo } from 'react';
import { useTra } from '../tra/store';
import { salesInMonth, purchasesInMonth, cashInMonth, cashOutMonth, lastMonths, monthLabel, totalReceivables, totalPayables } from './analytics';
import { BarChart, DualBarChart, LineChart, PieChart } from '../../shr/components/Charts';
import { PageContainer } from '../../shr/components/ui';
import { toFa } from '../../shr/utils/fa';
import { pareto } from '../../shr/utils/pareto';
import ExportButtons from './ExportButtons';
import { StatCard, Section } from './helpers';
import HelpBanner from '../../shr/components/HelpBanner';


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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 'var(--pad-comfy)', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)' }}>
      <div style={{ fontSize: 'var(--fs-md)', fontWeight: 700 }}><span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><OptionIcon icon={resolveCategoryIconKey('analytics', 'pareto')} size={16} /><span>تحلیل Pareto — اقلام پرهزینه</span></span></div>
      <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', lineHeight: 1.7 }}>
        {getGlobalFormat().count(top80.length)} قلم اول = حدود ۸۰٪ کل خرید
      </div>
      {data.slice(0, 6).map((d, i) => (
        <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--fs-sm)' }}>
            <span style={{ fontWeight: d.cumulative <= 80 ? 700 : 400 }}>{d.label}</span>
            <span style={{ direction: 'ltr', color: d.cumulative <= 80 ? 'var(--danger)' : 'var(--muted)', fontWeight: 600 }}>
              {getGlobalFormat().num(d.percent)}٪
            </span>
          </div>
          <div style={{ height: 36, background: 'var(--input-bg)', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: d.percent + '%', background: d.cumulative <= 80 ? 'var(--danger)' : 'var(--muted)' }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function FinancialPage() {
  const fmt = useFormat();
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
      <HelpBanner
        id="rep-financial-guide"
        icon={resolveCategoryIconKey('finance', 'cashflow')}
        title="راهنمای گزارش مالی"
        description="جمع فروش و خرید، جریان نقدی، مطالبات و بدهی‌ها و سهم اقلام پرهزینه را در بازه‌های زمانی مختلف مشاهده و خروجی بگیرید."
        tone="info"
      />
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
      <HelpBanner
        id="rep-financial-guide"
        icon={resolveCategoryIconKey('finance', 'cashflow')}
        title="راهنمای گزارش مالی"
        description="جمع فروش و خرید، جریان نقدی، مطالبات و بدهی‌ها و سهم اقلام پرهزینه را در بازه‌های زمانی مختلف مشاهده و خروجی بگیرید."
        tone="info"
      />
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
            <div style={{ padding: 'var(--pad-comfy)', background: 'var(--accent-soft)',
               border: '1px solid var(--accent-border)', borderRadius: 'var(--r-md)' }}>
              <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--accent)', fontWeight: 700 }}><span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><OptionIcon icon={resolveCategoryIconKey('finance', 'receivable')} size={15} /><span>طلب از مشتریان</span></span></div>
              <div style={{ fontSize: 'var(--fs-lg)', fontWeight: 700, color: 'var(--accent)', marginTop: 4, fontVariantNumeric: 'tabular-nums' }}>
                {fmt.money(receivables, { withUnit: false })}
              </div>
              <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', marginTop: 2 }}>تومان</div>
            </div>
          ) : null}
          {payables > 0 ? (
            <div style={{ padding: 'var(--pad-comfy)', background: 'var(--warn-soft)', border: '1px solid var(--warn)', borderRadius: 'var(--r-md)' }}>
              <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--warn)', fontWeight: 700 }}><span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}><OptionIcon icon={resolveCategoryIconKey('finance', 'payable')} size={15} /><span>بدهی به فروشندگان</span></span></div>
              <div style={{ fontSize: 'var(--fs-lg)', fontWeight: 700, color: 'var(--warn)', marginTop: 4, fontVariantNumeric: 'tabular-nums' }}>
                {fmt.money(payables, { withUnit: false })}
              </div>
              <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', marginTop: 2 }}>تومان</div>
            </div>
          ) : null}
        </div>
      ) : null}

      {/* نمودار فروش */}
      <Section title={<span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><OptionIcon icon={resolveCategoryIconKey('period', '6m')} size={18} /><span>فروش ۶ ماه اخیر</span></span>}>
        <BarChart data={salesData} color="var(--accent)" />
      </Section>

      {/* نمودار خرید */}
      <Section title={<span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><OptionIcon icon={resolveCategoryIconKey('period', '6m')} size={18} /><span>خرید ۶ ماه اخیر</span></span>}>
        <BarChart data={purchaseData} color="var(--warn)" />
      </Section>

      {/* جریان نقدی */}
      <Section title={<span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><OptionIcon icon={resolveCategoryIconKey('finance', 'cashflow')} size={16} /><span>جریان نقدی</span></span>}>
        <DualBarChart data={cashData} colorA="var(--accent)" colorB="var(--danger)" labelA="دریافت" labelB="پرداخت" />
      </Section>

      {/* روند سود */}
      <Section title={<span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><OptionIcon icon={resolveCategoryIconKey('profit', 'trend')} size={18} /><span>روند سود</span></span>}>
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
        <Section title={<span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><OptionIcon icon={resolveCategoryIconKey('analytics', 'share')} size={16} /><span>سهم دسته‌ها در فروش</span></span>}>
          <PieChart data={catSales} />
        </Section>
      ) : null}

      {/* خروجی‌ها */}
      <div style={{ fontSize: 'var(--fs-base)', fontWeight: 700, color: 'var(--text)', padding: '4px 4px 8px' }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}><OptionIcon icon={resolveCategoryIconKey('export', 'report')} size={18} /><span>خروجی گرفتن</span></span>
      </div>
      <ExportButtons />
    </PageContainer>
  );
}
