import { PageContainer } from '../../shr/components/ui';
import BenchmarkCard from './BenchmarkCard';
import EquipmentCard from './EquipmentCard';
import QuickActions from './QuickActions';
import TopAlerts from './TopAlerts';
import TodayCard from './TodayCard';
import AnalyticsCards from './AnalyticsCards';
import ListCards from './ListCards';
import { useDashboardData } from './hooks/useDashboardData';

export default function Dashboard() {
  const {
    nav, selectedFlockId, setSelectedFlockId, trendDays, setTrendDays,
    invoices, contacts, productions, flocks, eggEntries, whsItems, alerts, birds, breeds, logs,
    today, thisMonth,
    activeFlocks, todayProd, eggsToday, brokenToday, todayLogs, deathsToday, feedToday, waterToday, tempToday, humidToday,
    daysUntilDue, upcomingDues, pendingChecks,
    aliveCount, totalInitial, survivalRate, cumulativeMortality,
    henDay7, brokenRate7, eggTrend, fcr, waterFeedRatio,
    salesThisMonth, purchasesThisMonth, profit, receivables, inventoryValue, costPerEgg,
    feedPerBirdGrams, waterPerBirdMl, weightMetrics, momComparison,
    benchmarkData, aggregatedAlerts, active, counts, stockAlerts, activeEntries, hasData,
    survivalTone, henDayTone, brokenTone,
  } = useDashboardData();

  return (
    <PageContainer>
      <TopAlerts aggregatedAlerts={aggregatedAlerts} upcomingDues={upcomingDues} pendingChecks={pendingChecks} contacts={contacts} invoices={invoices} activeFlocks={activeFlocks} daysUntilDue={daysUntilDue} nav={nav} />

      {/* ============ ۱. امروز در یک نگاه ============ */}
      {hasData ? (
        <>





          <TodayCard benchmarkData={benchmarkData} activeFlocks={activeFlocks} selectedFlockId={selectedFlockId} setSelectedFlockId={setSelectedFlockId} eggsToday={eggsToday} deathsToday={deathsToday} feedToday={feedToday} tempToday={tempToday} feedPerBirdGrams={feedPerBirdGrams} waterPerBirdMl={waterPerBirdMl} nav={nav} brokenToday={brokenToday} waterToday={waterToday} humidToday={humidToday} />

      <ListCards active={active} counts={counts} activeFlocks={activeFlocks} birds={birds} productions={productions} activeEntries={activeEntries} stockAlerts={stockAlerts} nav={nav} />

      <AnalyticsCards survivalRate={survivalRate} survivalTone={survivalTone} henDay7={henDay7} henDayTone={henDayTone} brokenRate7={brokenRate7} brokenTone={brokenTone} cumulativeMortality={cumulativeMortality} eggTrend={eggTrend} trendDays={trendDays} setTrendDays={setTrendDays} fcr={fcr} waterFeedRatio={waterFeedRatio} weightMetrics={weightMetrics} costPerEgg={costPerEgg} salesThisMonth={salesThisMonth} purchasesThisMonth={purchasesThisMonth} profit={profit} receivables={receivables} inventoryValue={inventoryValue} momComparison={momComparison} nav={nav} />

          <BenchmarkCard />
          <EquipmentCard nav={nav} />
        </>
      ) : null}
      <QuickActions />
    </PageContainer>
  );
}
