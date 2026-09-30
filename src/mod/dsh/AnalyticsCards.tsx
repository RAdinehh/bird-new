// AnalyticsCards.tsx — sections 2+3+4 (سلامت، تولید، مالی)
import { SectionTitle, KpiCard, MiniStat } from './cards';
import { LineChart } from '../../shr/components/Charts';
import { toFa } from '../../shr/utils/fa';

interface Props {
  survivalRate: number;
  survivalTone: 'accent' | 'warn' | 'danger' | 'info';
  henDay7: number;
  henDayTone: 'accent' | 'warn' | 'danger' | 'info';
  brokenRate7: number;
  brokenTone: 'accent' | 'warn' | 'danger' | 'info';
  cumulativeMortality: number;
  eggTrend: any[];
  trendDays: number;
  setTrendDays: (d: 7 | 30 | 90) => void;
  fcr: number;
  waterFeedRatio: number;
  weightMetrics: any;
  costPerEgg: number;
  salesThisMonth: number;
  purchasesThisMonth: number;
  profit: number;
  receivables: number;
  inventoryValue: number;
  momComparison: any;
  nav: (p: string) => void;
}

export default function AnalyticsCards({
  survivalRate,
  survivalTone,
  henDay7,
  henDayTone,
  brokenRate7,
  brokenTone,
  cumulativeMortality,
  eggTrend,
  trendDays,
  setTrendDays,
  fcr,
  waterFeedRatio,
  weightMetrics,
  costPerEgg,
  salesThisMonth,
  purchasesThisMonth,
  profit,
  receivables,
  inventoryValue,
  momComparison,
  nav,
}: Props) {
  return (
    <>
                <SectionTitle>❤️ سلامت گله</SectionTitle>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
                  <MiniStat
                    label="نرخ زنده‌مانی"
                    value={survivalRate}
                    suffix="٪"
                    color={survivalTone}
                  />
                  <MiniStat
                    label="تلفات تجمعی"
                    value={cumulativeMortality}
                    suffix="٪"
                    color={cumulativeMortality <= 5 ? 'accent' : cumulativeMortality <= 10 ? 'warn' : 'danger'}
                  />
                  <MiniStat
                    label="Hen-Day ۷ روز"
                    value={henDay7}
                    suffix="٪"
                    color={henDayTone}
                  />
                  <MiniStat
                    label="تخم شکسته"
                    value={brokenRate7}
                    suffix="٪"
                    color={brokenTone}
                  />
                </div>

                {/* ============ ۳. عملکرد تولیدی ============ */}
                <SectionTitle>📊 عملکرد تولیدی</SectionTitle>
                <div style={{
                  background: 'var(--card)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--r-lg)',
                  padding: '10px 12px'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 6,
                    gap: 8,
                  }}>
                    <div style={{ fontSize: 'var(--fs-sm)', fontWeight: 700 }}>
                      🥚 روند تخم‌گذاری
                    </div>
                    <div style={{ display: 'flex', gap: 3 }}>
                      {([7, 30, 90] as const).map(d => (
                        <button
                          key={d}
                          onClick={() => setTrendDays(d)}
                          style={{
                            padding: '3px 8px',
                            fontSize: 'var(--fs-xs)',
                            background: trendDays === d ? 'var(--accent-soft)' : 'var(--btn-bg)',
                            border: `1px solid ${trendDays === d ? 'var(--accent-border)' : 'var(--border)'}`,
                            borderRadius: 'var(--r-sm)',
                            color: trendDays === d ? 'var(--accent)' : 'var(--muted)',
                            fontWeight: trendDays === d ? 700 : 500,
                            cursor: 'pointer',
                            fontFamily: 'inherit',
                          }}
                        >
                          {toFa(d)}
                        </button>
                      ))}
                    </div>
                  </div>
                  <LineChart data={eggTrend} color="var(--accent)" height={120} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 4 }}>
                  <MiniStat
                    label="FCR ماه"
                    value={fcr}
                    suffix=""
                    color={fcr === 0 ? 'info' : fcr <= 1.9 ? 'accent' : fcr <= 2.3 ? 'warn' : 'danger'}
                  />
                  <MiniStat
                    label="آب/دان"
                    value={waterFeedRatio}
                    suffix=""
                    color={waterFeedRatio === 0 ? 'info' : waterFeedRatio >= 1.6 && waterFeedRatio <= 2.2 ? 'accent' : 'warn'}
                  />
                  <MiniStat
                    label="هزینه/تخم"
                    value={costPerEgg}
                    suffix="ت"
                    color="info"
                    noFormat
                  />
                </div>

                {weightMetrics.hasData && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 4 }}>
                    <MiniStat
                      label="میانگین وزن"
                      value={weightMetrics.avgWeight}
                      suffix="kg"
                      color="info"
                    />
                    <MiniStat
                      label="ADG"
                      value={weightMetrics.adg}
                      suffix="گرم/روز"
                      color="accent"
                    />
                    <MiniStat
                      label="CV"
                      value={weightMetrics.cv}
                      suffix="٪"
                      color={weightMetrics.cv <= 10 ? 'accent' : weightMetrics.cv <= 15 ? 'warn' : 'danger'}
                    />
                  </div>
                )}

                {/* ============ ۴. مالی ============ */}
                <SectionTitle>💰 مالی این ماه</SectionTitle>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
                  <KpiCard
                    icon="📥"
                    label={`فروش ماه ${momComparison.salesChange !== 0 ? (momComparison.salesChange > 0 ? '📈' : '📉') : ''}`}
                    value={salesThisMonth}
                    unit={`تومان${momComparison.salesChange !== 0 ? ` · ${momComparison.salesChange > 0 ? '+' : ''}${toFa(momComparison.salesChange)}٪` : ''}`}
                    color="accent"
                    onClick={() => nav('/tra')}
                  />
                  <KpiCard
                    icon="📤"
                    label={`خرید ماه ${momComparison.purchaseChange !== 0 ? (momComparison.purchaseChange > 0 ? '📈' : '📉') : ''}`}
                    value={purchasesThisMonth}
                    unit={`تومان${momComparison.purchaseChange !== 0 ? ` · ${momComparison.purchaseChange > 0 ? '+' : ''}${toFa(momComparison.purchaseChange)}٪` : ''}`}
                    color="warn"
                    onClick={() => nav('/tra')}
                  />
                  <KpiCard
                    icon={profit >= 0 ? '📈' : '📉'}
                    label={profit >= 0 ? 'سود ماه' : 'زیان ماه'}
                    value={Math.abs(profit)}
                    unit="تومان"
                    color={profit >= 0 ? 'accent' : 'danger'}
                    onClick={() => nav('/rep')}
                  />
                  <KpiCard
                    icon="📦"
                    label="ارزش انبار"
                    value={inventoryValue}
                    unit="تومان"
                    color="info"
                    onClick={() => nav('/whs')}
                  />
                </div>

                {receivables > 0 ? (
                  <div
                    onClick={() => nav('/tra')}
                    style={{
                      padding: '8px 10px',
                      background: 'var(--accent-soft)',
                      border: '1px solid var(--accent-border)',
                      borderRadius: 'var(--r-md)',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      cursor: 'pointer'
                    }}
                  >
                    <span style={{ fontSize: 'var(--fs-sm)', color: 'var(--accent)', fontWeight: 700 }}>
                      📥 طلب از مشتریان
                    </span>
                    <span style={{ fontSize: 'var(--fs-md)', color: 'var(--accent)', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                      {toFa(receivables.toLocaleString('fa-IR'))} ت
                    </span>
                  </div>
                ) : null}
    </>
  );
}