import { useState, useEffect, useMemo, useCallback} from 'react';
import { parse as parseJ, differenceInDays as diffDaysJ, format as formatJ } from 'date-fns-jalali';
import { useNavigate } from 'react-router-dom';
import { useTra, remaining } from '../tra/store';
import { useCtc } from '../ctc/store';
import { useEgg, healthyCount } from '../egg/store';
import { useFlk, getAgeDays } from '../flk/store';
import { useInc, daysToHatch } from '../inc/store';
import { useWhs, stockWarning, expiryWarning } from '../whs/store';
import { useAlt, activeAlerts, countByLevel } from '../alt/store';
import { runRules } from '../alt/rules';
import { useBrd } from '../brd/store';
import { findBirdPreset } from '../brd/presets';
import { useDlg } from '../dlg/store';
import { PageContainer } from '../../shr/components/ui';
import { toFa } from '../../shr/utils/fa';
import BenchmarkCard from './BenchmarkCard';
import { monthKey, currentMonth, todayJalali, dateDiffDays } from './utils';
import QuickActions from './QuickActions';
import TopAlerts from './TopAlerts';
import TodayCard from './TodayCard';
import AnalyticsCards from './AnalyticsCards';
import ListCards from './ListCards';

function fcrBorder(diff: number): string {
  if (diff <= 0) return 'var(--accent-border)';
  if (diff <= 10) return 'var(--warn)';
  return 'var(--danger)';
}

function moneyUnit(change: number): string {
  if (change === 0) return 'تومان';
  const sign = change > 0 ? '+' : '';
  return `تومان · ${sign}${toFa(change)}٪`;
}

export default function Dashboard() {

  const [, _setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => _setTick(x => x + 1), 30000);
    return () => clearInterval(t);
  }, []);
  const nav = useNavigate();
  const [selectedFlockId, setSelectedFlockId] = useState<string>('');
  const [trendDays, setTrendDays] = useState<7 | 30 | 90>(7);

  const { invoices } = useTra();
  const { contacts } = useCtc();
  const { productions } = useEgg();
  const { flocks } = useFlk();
  const { eggEntries } = useInc();
  const { items: whsItems } = useWhs();
  const { alerts } = useAlt();
  const { birds, breeds } = useBrd();
  const { logs } = useDlg();

  useEffect(() => { runRules(); }, []);

  const today = todayJalali();
  const thisMonth = currentMonth();

  // ============ گله‌های فعال ============
  const activeFlocks = useMemo(() => flocks.filter(f => f.status === 'active'), [flocks]);

  // انتخاب خودکار اولین گله فعال
  useEffect(() => {
    if (!selectedFlockId && activeFlocks.length > 0) {
      setSelectedFlockId(activeFlocks[0].id);
    }
    if (selectedFlockId && !activeFlocks.find(f => f.id === selectedFlockId) && activeFlocks.length > 0) {
      setSelectedFlockId(activeFlocks[0].id);
    }
  }, [activeFlocks, selectedFlockId]);

  // ============ ۱. امروز در یک نگاه ============
  const todayProd = useMemo(() => productions.filter(p => p.date === today), [productions, today]);
  const eggsToday = todayProd.reduce((a, p) => a + (p.totalCount || 0), 0);
  const brokenToday = todayProd.reduce((a, p) => a + (p.brokenCount || 0), 0);

  const todayLogs = useMemo(() => logs.filter(l => l.date === today), [logs, today]);
  const deathsToday = todayLogs.reduce((a, l) => a + (l.deaths || []).reduce((b, x) => b + (x.count || 0), 0), 0);
  const feedToday = todayLogs.reduce((a, l) => a + (l.feedAmount || 0), 0);
  const waterToday = todayLogs.reduce((a, l) => a + (l.waterAmount || 0), 0);
  const tempToday = todayLogs.length > 0 ? (todayLogs[0].temperature || 0) : 0;
  const humidToday = todayLogs.length > 0 ? (todayLogs[0].humidity || 0) : 0;

  // ============ سرسیدهای نزدیک ============
  const daysUntilDue = useCallback((dueDate: string): number | null => {
    if (!dueDate) return null;
    try {
      const en = dueDate.replace(/[۰-۹]/g, (d: string) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)));
      const d = parseJ(en, 'yyyy/MM/dd', new Date());
      if (isNaN(d.getTime())) return null;
      return diffDaysJ(d, new Date());
    } catch {
      return null;
    }
  }, []);

  const upcomingDues = useMemo(() => {
    return invoices
      .filter(i => remaining(i) > 0 && i.dueDate && !i.remindersMuted)
      .map(i => ({ inv: i, days: daysUntilDue(i.dueDate) }))
      .filter(x => x.days !== null && x.days <= 7)
      .sort((a, b) => (a.days ?? 0) - (b.days ?? 0))
      .slice(0, 5);
  }, [invoices, daysUntilDue]);

  const pendingChecks = useMemo(() => {
    const list: { inv: any; pay: any }[] = [];
    invoices.filter(i => remaining(i) > 0).forEach(inv => {
      (inv.payments || []).forEach((p: any) => {
        if (p.method === 'check' && (!p.status || p.status === 'pending')) {
          list.push({ inv, pay: p });
        }
      });
    });
    return list.sort((a, b) => (a.pay.dueDate || '').localeCompare(b.pay.dueDate || '')).slice(0, 5);
  }, [invoices]);


  // ============ ۲. سلامت گله ============
  const aliveCount = useMemo(() =>
    activeFlocks.reduce((a, f) => a + (f.currentCount || f.initialCount || 0), 0),
    [activeFlocks]
  );

  const totalInitial = useMemo(() =>
    activeFlocks.reduce((a, f) => a + (f.initialCount || 0), 0),
    [activeFlocks]
  );

  const survivalRate = totalInitial > 0 ? (aliveCount / totalInitial) * 100 : 100;
  const cumulativeMortality = totalInitial > 0 ? ((totalInitial - aliveCount) / totalInitial) * 100 : 0;

  // Hen-Day — میانگین ۷ روز اخیر
  const henDay7 = useMemo(() => {
    const last7: any[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = formatJ(d, 'yyyy/MM/dd');
      const prods = productions.filter(p => p.date === key);
      prods.forEach(p => last7.push(p));
    }
    if (last7.length === 0 || aliveCount === 0) return 0;
    const totalHealthy = last7.reduce((a, p) => a + healthyCount(p), 0);
    const days = new Set(last7.map(p => p.date)).size;
    if (days === 0) return 0;
    return (totalHealthy / (aliveCount * days)) * 100;
  }, [productions, aliveCount]);

  // تخم شکسته درصد — ۷ روز
  const brokenRate7 = useMemo(() => {
    const last7 = productions.filter(p => dateDiffDays(p.date) <= 7);
    const total = last7.reduce((a, p) => a + (p.totalCount || 0) + (p.brokenCount || 0), 0);
    const broken = last7.reduce((a, p) => a + (p.brokenCount || 0), 0);
    if (total === 0) return 0;
    return (broken / total) * 100;
  }, [productions]);

  // ============ ۳. عملکرد تولیدی ============
  // روند ۷ روزه تخم
  const eggTrend = useMemo(() => {
    const days: { label: string; value: number }[] = [];
    for (let i = trendDays - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = formatJ(d, 'yyyy/MM/dd');
      const prods = productions.filter(p => p.date === key);
      const total = prods.reduce((a, p) => a + (p.totalCount || 0), 0);
      days.push({ label: formatJ(d, 'dd'), value: total });
    }
    return days;
  }, [productions, trendDays]);

  // FCR ماه
  const fcr = useMemo(() => {
    const monthLogs = logs.filter(l => monthKey(l.date) === thisMonth);
    const monthProd = productions.filter(p => monthKey(p.date) === thisMonth);
    const feed = monthLogs.reduce((a, l) => a + (l.feedAmount || 0), 0);
    const eggsWeight = monthProd.reduce((a, p) => a + (p.totalCount || 0) * 0.06, 0);
    if (eggsWeight <= 0) return 0;
    return Math.round((feed / eggsWeight) * 100) / 100;
  }, [logs, productions, thisMonth]);

  // نسبت آب به دان
  const waterFeedRatio = useMemo(() => {
    const last7 = logs.filter(l => dateDiffDays(l.date) <= 7);
    const water = last7.reduce((a, l) => a + (l.waterAmount || 0), 0);
    const feed = last7.reduce((a, l) => a + (l.feedAmount || 0), 0);
    if (feed === 0) return 0;
    return Math.round((water / feed) * 10) / 10;
  }, [logs]);

  // ============ ۴. مالی ============
  const salesThisMonth = useMemo(() =>
    invoices.filter(i => i.type === 'sale' && monthKey(i.date) === thisMonth)
      .reduce((a, i) => a + (i.total || 0), 0),
    [invoices, thisMonth]
  );

  const purchasesThisMonth = useMemo(() =>
    invoices.filter(i => i.type === 'purchase' && monthKey(i.date) === thisMonth)
      .reduce((a, i) => a + (i.total || 0), 0),
    [invoices, thisMonth]
  );

  const profit = salesThisMonth - purchasesThisMonth;

  const receivables = useMemo(() =>
    invoices.filter(i => i.type === 'sale').reduce((a, i) => a + remaining(i), 0),
    [invoices]
  );

  const inventoryValue = useMemo(() =>
    whsItems.reduce((a, i) => a + ((i.currentStock || 0) * (i.lastPrice || 0)), 0),
    [whsItems]
  );

  // هزینه هر تخم این ماه
  const costPerEgg = useMemo(() => {
    if (salesThisMonth === 0) return 0;
    const monthProd = productions.filter(p => monthKey(p.date) === thisMonth);
    const eggs = monthProd.reduce((a, p) => a + (p.totalCount || 0), 0);
    if (eggs === 0) return 0;
    return Math.round(purchasesThisMonth / eggs);
  }, [productions, purchasesThisMonth, thisMonth, salesThisMonth]);

  // ============ ۵. هشدارها ============
  // ============ KPIهای جهانی ============
  // مصرف دان/پرنده/روز (گرم)
  const feedPerBirdGrams = useMemo(() => {
    if (aliveCount === 0) return 0;
    const last7 = logs.filter(l => dateDiffDays(l.date) <= 7);
    if (last7.length === 0) return 0;
    const totalFeed = last7.reduce((a, l) => a + (l.feedAmount || 0), 0);
    const days = 7;
    // totalFeed (kg) / aliveCount / days * 1000 (گرم)
    return Math.round((totalFeed / aliveCount / days) * 1000);
  }, [logs, aliveCount]);

  // مصرف آب/پرنده/روز (میلی‌لیتر)
  const waterPerBirdMl = useMemo(() => {
    if (aliveCount === 0) return 0;
    const last7 = logs.filter(l => dateDiffDays(l.date) <= 7);
    if (last7.length === 0) return 0;
    const totalWater = last7.reduce((a, l) => a + (l.waterAmount || 0), 0);
    const days = 7;
    // totalWater (L) / aliveCount / days * 1000 (ml)
    return Math.round((totalWater / aliveCount / days) * 1000);
  }, [logs, aliveCount]);

  // ADG و CV% از آخرین وزن‌کشی
  const weightMetrics = useMemo(() => {
    const lastWeightLog = [...logs]
      .filter(l => l.weightSamples && l.weightSamples.length > 0)
      .sort((a, b) => b.date.localeCompare(a.date))[0];

    if (!lastWeightLog || !lastWeightLog.weightSamples) {
      return { avgWeight: 0, cv: 0, adg: 0, hasData: false };
    }

    const samples = lastWeightLog.weightSamples;
    const weights = samples.map(s => s.weight).filter(w => w > 0);
    if (weights.length === 0) return { avgWeight: 0, cv: 0, adg: 0, hasData: false };

    const mean = weights.reduce((a, w) => a + w, 0) / weights.length;
    const variance = weights.reduce((a, w) => a + Math.pow(w - mean, 2), 0) / weights.length;
    const stdDev = Math.sqrt(variance);
    const cv = mean > 0 ? (stdDev / mean) * 100 : 0;

    // ADG: میانگین وزن / سن گله (روز)
    const flockId = lastWeightLog.flockId;
    const flock = activeFlocks.find(f => f.id === flockId);
    const ageDays = flock ? getAgeDays(flock) : 0;
    const adg = ageDays > 0 ? (mean * 1000) / ageDays : 0; // گرم در روز

    return {
      avgWeight: Math.round(mean * 1000) / 1000,
      cv: Math.round(cv * 10) / 10,
      adg: Math.round(adg * 10) / 10,
      hasData: true,
    };
  }, [logs, activeFlocks]);

  // مقایسه ماه قبل
  const momComparison = useMemo(() => {
    const d = new Date();
    const prevMonth = d.getMonth() === 0
      ? `${d.getFullYear() - 1}/12`
      : `${d.getFullYear()}/${String(d.getMonth()).padStart(2, '0')}`;

    const prevSales = invoices.filter(i => i.type === 'sale' && i.date && i.date.startsWith(prevMonth)).reduce((a, i) => a + (i.total || 0), 0);
    const prevPurchases = invoices
      .filter(i => i.type === 'purchase' && i.date && i.date.startsWith(prevMonth))
      .reduce((a, i) => a + (i.total || 0), 0);

    const salesChange = prevSales > 0 ? ((salesThisMonth - prevSales) / prevSales) * 100 : 0;
    const purchaseChange = prevPurchases > 0 ? ((purchasesThisMonth - prevPurchases) / prevPurchases) * 100 : 0;

    return {
      salesChange: Math.round(salesChange),
      purchaseChange: Math.round(purchaseChange),
    };
  }, [invoices, salesThisMonth, purchasesThisMonth]);

  // ============ Benchmark نژاد ============
  const benchmarkData = useMemo(() => {
    const flock = activeFlocks.find(f => f.id === selectedFlockId);
    if (!flock) return null;

    const bird = birds.find(b => b.id === flock.birdId);
    const breed = breeds.find(b => b.id === flock.breedId);

    // استاندارد: اول breed.fcr، بعد preset نژاد پرنده
    const preset = bird ? findBirdPreset(bird.name) : undefined;
    const fcrStandard = breed?.fcr || preset?.fcrStandard || 0;

    // داده‌های این گله
    const flockLogs = logs.filter((l: any) => l.flockId === flock.id);
    const flockProd = productions.filter((p: any) => p.flockId === flock.id);

    const totalFeed = flockLogs.reduce((a, l) => a + (l.feedAmount || 0), 0);
    const totalEggs = flockProd.reduce((a, p) => a + (p.totalCount || 0), 0);
    const eggMass = totalEggs * 0.06; // kg (میانگین ۶۰ گرم)

    const fcrActual = eggMass > 0 ? totalFeed / eggMass : 0;

    // Hen-Day این گله
    const aliveCount = flock.currentCount || flock.initialCount || 0;
    const flockHenDay = (() => {
      const last7 = flockProd.filter((p: any) => dateDiffDays(p.date) <= 7);
      if (last7.length === 0 || aliveCount === 0) return 0;
      const sum = last7.reduce((a, p) => a + (p.totalCount || 0), 0);
      const days = 7;
      return (sum / aliveCount / days) * 100;
    })();

    // مقایسه
    const fcrDiff = fcrStandard > 0 && fcrActual > 0
      ? ((fcrActual - fcrStandard) / fcrStandard) * 100
      : 0;

    return {
      flock,
      bird,
      breed,
      fcrStandard,
      fcrActual: Math.round(fcrActual * 100) / 100,
      fcrDiff: Math.round(fcrDiff),
      henDay: Math.round(flockHenDay * 10) / 10,
      hasData: fcrStandard > 0 && fcrActual > 0,
    };
  }, [selectedFlockId, activeFlocks, birds, breeds, logs, productions]);

  // ============ هشدارهای تجمیعی ============
  const aggregatedAlerts = useMemo(() => {
    const list: { icon: string; label: string; count: number; tone: string; route: string }[] = [];

    // ۱. انبار: انقضا
    const expiring = whsItems.filter(i => {
      const w = expiryWarning(i);
      return w === 'soon' || w === 'expired';
    }).length;
    if (expiring > 0) list.push({ icon: '💊', label: 'قلم نزدیک انقضا', count: expiring, tone: 'danger', route: '/whs' });

    // ۲. انبار: زیر حد
    const lowStock = whsItems.filter(i => {
      const w = stockWarning(i);
      return w === 'low' || w === 'critical';
    }).length;
    if (lowStock > 0) list.push({ icon: '🌾', label: 'قلم زیر حد موجودی', count: lowStock, tone: 'warn', route: '/whs' });

    // ۳. جوجه‌کشی: هچ نزدیک
    const nearHatch = eggEntries.filter(e => {
      const d = daysToHatch(e as any);
      return d !== null && d !== undefined && d >= 0 && d <= 3 && e.status !== 'done' && e.status !== 'hatched';
    }).length;
    if (nearHatch > 0) list.push({ icon: '🐣', label: 'هچ در ۳ روز آینده', count: nearHatch, tone: 'info', route: '/inc' });

    // ۴. هشدارهای بحرانی
    const critical = activeAlerts(alerts).filter(a => a.level === 'critical').length;
    if (critical > 0) list.push({ icon: '🚨', label: 'هشدار بحرانی', count: critical, tone: 'danger', route: '/alt' });

    // ۵. گله آماده تخم‌گذاری
    const readyFlocks = activeFlocks.filter(f => {
      if (f.type !== 'layer' && f.type !== 'breeder') return false;
      const age = getAgeDays(f);
      const start = f.layingStartDay || 140;
      return age >= start && age <= start + 7;
    }).length;
    if (readyFlocks > 0) list.push({ icon: '🥚', label: 'گله آماده تخم‌گذاری', count: readyFlocks, tone: 'accent', route: '/flk' });

    return list;
  }, [whsItems, eggEntries, alerts, activeFlocks]);

  const active = useMemo(() => {
    const list = activeAlerts(alerts);
    const order: any = { critical: 0, important: 1, info: 2 };
    return list.sort((a, b) => order[a.level] - order[b.level]).slice(0, 4);
  }, [alerts]);

  const counts = countByLevel(alerts);

  const stockAlerts = useMemo(() =>
    whsItems.filter(i => stockWarning(i) !== 'ok' || expiryWarning(i) !== 'ok').length,
    [whsItems]
  );

  const activeEntries = useMemo(() =>
    eggEntries.filter(e => e.status !== 'done' && e.status !== 'hatched'),
    [eggEntries]
  );

  const hasData = aliveCount > 0 || invoices.length > 0 || productions.length > 0;

  // رنگ تلفات
  const survivalTone: 'accent' | 'warn' | 'danger' = survivalRate >= 95 ? 'accent' : survivalRate >= 90 ? 'warn' : 'danger';
  const henDayTone: 'accent' | 'warn' | 'danger' = henDay7 >= 80 ? 'accent' : henDay7 >= 60 ? 'warn' : 'danger';
  const brokenTone: 'accent' | 'warn' | 'danger' = brokenRate7 <= 3 ? 'accent' : brokenRate7 <= 6 ? 'warn' : 'danger';

  return (
    <PageContainer>
      <TopAlerts aggregatedAlerts={aggregatedAlerts} upcomingDues={upcomingDues} pendingChecks={pendingChecks} contacts={contacts} invoices={invoices} activeFlocks={activeFlocks} daysUntilDue={daysUntilDue} nav={nav} />

      {/* ============ ۱. امروز در یک نگاه ============ */}
      {hasData ? (
        <>
          <TodayCard benchmarkData={benchmarkData} activeFlocks={activeFlocks} selectedFlockId={selectedFlockId} setSelectedFlockId={setSelectedFlockId} eggsToday={eggsToday} deathsToday={deathsToday} feedToday={feedToday} tempToday={tempToday} feedPerBirdGrams={feedPerBirdGrams} waterPerBirdMl={waterPerBirdMl} nav={nav} brokenToday={brokenToday} waterToday={waterToday} humidToday={humidToday} />

      <AnalyticsCards survivalRate={survivalRate} survivalTone={survivalTone} henDay7={henDay7} henDayTone={henDayTone} brokenRate7={brokenRate7} brokenTone={brokenTone} cumulativeMortality={cumulativeMortality} eggTrend={eggTrend} trendDays={trendDays} setTrendDays={setTrendDays} fcr={fcr} waterFeedRatio={waterFeedRatio} weightMetrics={weightMetrics} costPerEgg={costPerEgg} salesThisMonth={salesThisMonth} purchasesThisMonth={purchasesThisMonth} profit={profit} receivables={receivables} inventoryValue={inventoryValue} momComparison={momComparison} nav={nav} />
        </>
      ) : null}

      <ListCards active={active} counts={counts} activeFlocks={activeFlocks} birds={birds} productions={productions} activeEntries={activeEntries} stockAlerts={stockAlerts} nav={nav} />
      <QuickActions />
    </PageContainer>
  );
}
