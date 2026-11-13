/**
 * useDashboardData — state و محاسبات Dashboard
 */
import { useState, useEffect, useMemo, useCallback } from 'react';
import { getBreedFcr } from '../../brd/_display-values';
import { useNavigate } from 'react-router-dom';
import { parse as parseJ, differenceInDays as diffDaysJ, format as formatJ } from 'date-fns-jalali';
import { useTra, remaining } from '../../tra/store';
import { useCtc } from '../../ctc/store';
import { useEgg, healthyCount } from '../../egg/store';
import { useFlk, getAgeDays } from '../../flk/store';
import { useInc, daysToHatch } from '../../inc/store';
import { useWhs, stockWarning, expiryWarning } from '../../whs/store';
import { useAlt, activeAlerts, countByLevel } from '../../alt/store';
import { runRules } from '../../alt/rules';
import { useBrd } from '../../brd/store';
import { useDlg, avgWeight as avgWeightFn, cvWeight as cvWeightFn } from '../../dlg/store';
import { applyCorrections } from '../../dlg/api/applyCorrections';
import { monthKey, currentMonth, todayJalali, dateDiffDays } from '../utils';
import { aggregateEggMetrics } from '../../../shr/calc/formulas/egg';
import { calculateWaterMetrics } from '../../../shr/calc/formulas/water';

function fcrBorder(diff: number): string {
  if (diff <= 0) return 'var(--accent-border)';
  if (diff <= 10) return 'var(--warn)';
  return 'var(--danger)';
}

function moneyUnit(change: number): string {
  if (change === 0) return 'تومان';
  const sign = change > 0 ? '+' : '';
  return `تومان • ${sign}${change}٪`;
}

// 🆕 استاندارد چرخه تخم‌گذاری (SAP)
const START_WINDOW_DAYS = 14;   // ۱۴ روز قبل از شروع تخم‌گذاری
const END_WINDOW_DAYS = 30;     // ۳۰ روز قبل از پایان چرخه
const FALLBACK_END_DAYS = 550;  // پایان پیش‌فرض breeder اگر کاربر تعریف نکرده

export function useDashboardData() {
  const nav = useNavigate();
const [, _setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => _setTick(x => x + 1), 30000);
    return () => clearInterval(t);
  }, []);
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
  const activeFlocks = useMemo(() => flocks.filter(f => f.status === 'active' && !f.paused), [flocks]);

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
  const effectiveTodayLogs = useMemo(() => todayLogs.map(applyCorrections), [todayLogs]);
  const deathsToday = effectiveTodayLogs.reduce((a, l) => a + (l.deathsCount || 0), 0);
  const feedToday = effectiveTodayLogs.reduce((a, l) => a + (l.feedDelivered || 0), 0);
  const waterToday = effectiveTodayLogs.reduce((a, l) => a + (l.waterAmount || 0), 0);
  const tempToday = effectiveTodayLogs.length > 0 ? (effectiveTodayLogs[0].temperature || 0) : 0;
  const humidToday = effectiveTodayLogs.length > 0 ? (effectiveTodayLogs[0].humidity || 0) : 0;

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
      (inv.payments || []).forEach((p) => {
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

  // 🆕 C3a — laying count: فقط layer/breeder + femaleCount برای گله sexed
  const layingAliveCount = useMemo(() =>
    activeFlocks
      .filter(f => f.type === 'layer' || f.type === 'breeder')
      .reduce((a, f) => {
        if (f.femaleCount && f.femaleCount > 0) return a + f.femaleCount;
        return a + (f.currentCount || f.initialCount || 0);
      }, 0),
    [activeFlocks]
  );

  const totalInitial = useMemo(() =>
    activeFlocks.reduce((a, f) => a + (f.initialCount || 0), 0),
    [activeFlocks]
  );

  const survivalRate = totalInitial > 0 ? (aliveCount / totalInitial) * 100 : 100;
  const cumulativeMortality = totalInitial > 0 ? ((totalInitial - aliveCount) / totalInitial) * 100 : 0;

  // Hen-Day + Broken Rate — ۷ روز، از aggregateEggMetrics (orphan connected)
  const eggMetrics7d = useMemo(() => {
    const last7 = productions.filter(p => dateDiffDays(p.date) <= 7);
    const days = Math.max(1, new Set(last7.map(p => p.date)).size);
    const healthy = last7.reduce((a, p) => a + healthyCount(p), 0);
    const broken = last7.reduce((a, p) => a + (p.brokenCount || 0), 0);
    const dirty = last7.reduce((a, p) => a + (p.softCount || 0) + (p.dirtyCount || 0), 0);
    return aggregateEggMetrics(
      days, healthy, broken, dirty,
      layingAliveCount, totalInitial, null, null
    );
  }, [productions, layingAliveCount, totalInitial]);

  const henDay7 = eggMetrics7d.henDayPct;
  const brokenRate7 = eggMetrics7d.brokenRatePct;

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

  // ─── FCR ماه — تفکیک بر اساس نوع گله (قانون: broiler ≠ layer) ───
  // FCR گوشتی: دان ÷ افزایش وزن بدن
  const fcrBroiler = useMemo(() => {
    const broilerFlocks = flocks.filter(f => f.type === 'broiler');
    if (broilerFlocks.length === 0) return 0;
    const broilerIds = new Set(broilerFlocks.map(f => f.id));
    const monthLogs = logs.filter(l => monthKey(l.date) === thisMonth && broilerIds.has(l.flockId));
    if (monthLogs.length === 0) return 0;
    const feed = monthLogs.map(applyCorrections).reduce((a, l) => a + (l.feedConsumed || l.feedDelivered || 0), 0);
    let totalGain = 0;
    for (const f of broilerFlocks) {
      const lastLog = [...monthLogs].reverse().find(l => l.flockId === f.id && l.weightSamples && l.weightSamples.length > 0);
      if (lastLog && lastLog.weightSamples) {
        const avgW = avgWeightFn(lastLog.weightSamples.map((w: any) => ({ id: w.id, weight: Number(w.weight) || 0 })));
        const chickW = (f.chickWeight ?? 40) / 1000;
        totalGain += (avgW - chickW) * (f.currentCount || 0);
      }
    }
    return totalGain > 0 ? Math.round((feed / totalGain) * 100) / 100 : 0;
  }, [logs, flocks, thisMonth]);

  // FCR تخم‌گذار/مادر: دان ÷ وزن تخم
  const fcrLayer = useMemo(() => {
    const layerFlocks = flocks.filter(f => f.type === 'layer' || f.type === 'breeder');
    if (layerFlocks.length === 0) return 0;
    const layerIds = new Set(layerFlocks.map(f => f.id));
    const monthLogs = logs.filter(l => monthKey(l.date) === thisMonth && layerIds.has(l.flockId));
    const monthProd = productions.filter(p => monthKey(p.date) === thisMonth && layerIds.has(p.flockId));
    const feed = monthLogs.map(applyCorrections).reduce((a, l) => a + (l.feedConsumed || l.feedDelivered || 0), 0);
    const eggsWeight = monthProd.reduce((a, p) => a + (p.totalCount || 0) * 0.06, 0);
    return eggsWeight > 0 ? Math.round((feed / eggsWeight) * 100) / 100 : 0;
  }, [logs, productions, flocks, thisMonth]);

  // فیلد قدیمی — سازگاری (اولویت به غیرصفر)
  const fcr = fcrBroiler > 0 ? fcrBroiler : fcrLayer;

  // نسبت آب به دان — از calculateWaterMetrics (orphan connected)
  const waterMetrics7d = useMemo(() => {
    const last7 = logs.filter(l => dateDiffDays(l.date) <= 7);
    const water = last7.reduce((a, l) => a + (l.waterAmount || 0), 0);
    const feed = last7.map(applyCorrections).reduce((a, l) => a + (l.feedConsumed || l.feedDelivered || 0), 0);
    return calculateWaterMetrics({
      waterAmountL: water,
      feedConsumedKg: feed,
      aliveCount,
      standardWaterFeedRatio: null,
    });
  }, [logs, aliveCount]);

  const waterFeedRatio = waterMetrics7d.waterFeedRatio;
  const waterFeedTone = waterMetrics7d.waterFeedTone;
  const waterFeedWarning = waterMetrics7d.warning;

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
    const totalFeed = last7.reduce((a, l) => a + (l.feedDelivered || 0), 0);
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

    // 🆕 یکسان‌سازی با dlg/store (calc orphan connected)
    const weightSamples = weights.map((w, i) => ({ id: `w${i}`, weight: w }));
    const avgKg = avgWeightFn(weightSamples);
    const cvPct = cvWeightFn(weightSamples);

    // ADG: میانگین وزن / سن گله (روز) — semantic متفاوت از calc.adgG
    const mean = weights.reduce((a, w) => a + w, 0) / weights.length;
    const flockId = lastWeightLog.flockId;
    const flock = activeFlocks.find(f => f.id === flockId);
    const ageDays = flock ? getAgeDays(flock) : 0;
    const adg = ageDays > 0 ? (mean * 1000) / ageDays : 0; // گرم در روز

    return {
      avgWeight: avgKg,
      cv: cvPct,
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

    // استاندارد: FCR پویا (override > standard)
    const fcrStandard = getBreedFcr(breed) || 0;

    // داده‌های این گله
    const flockLogs = logs.filter((l) => l.flockId === flock.id);
    const flockProd = productions.filter((p) => p.flockId === flock.id);

    const totalFeed = flockLogs.reduce((a, l) => a + (l.feedDelivered || 0), 0);
    const totalEggs = flockProd.reduce((a, p) => a + (p.totalCount || 0), 0);

    // 🆕 FCR بر اساس نوع گله (قانون: broiler = وزن بدن، layer/breeder = وزن تخم)
    let fcrActual = 0;
    if (flock.type === 'broiler') {
      // FCR گوشتی: دان ÷ افزایش وزن بدن
      const lastWeightsLog = [...flockLogs]
        .filter((l: any) => l.weightSamples && l.weightSamples.length > 0)
        .sort((a, b) => b.date.localeCompare(a.date))[0] as any;
      const weights = lastWeightsLog?.weightSamples || [];
      const avgW = weights.length > 0
        ? weights.reduce((a: number, w: any) => a + (Number(w.weight) || 0), 0) / weights.length
        : 0;
      const chickW = (flock.chickWeight ?? 40) / 1000; // گرم → کیلوگرم
      const currentCount = flock.currentCount || flock.initialCount || 0;
      const totalGain = (avgW - chickW) * currentCount;
      fcrActual = totalGain > 0 ? totalFeed / totalGain : 0;
    } else {
      // FCR تخم‌گذار/مادر: دان ÷ وزن تخم
      const eggMass = totalEggs * 0.06; // kg (میانگین ۶۰ گرم)
      fcrActual = eggMass > 0 ? totalFeed / eggMass : 0;
    }

    // Hen-Day این گله
    const aliveCount = flock.currentCount || flock.initialCount || 0;
    const flockHenDay = (() => {
      const last7 = flockProd.filter((p) => dateDiffDays(p.date) <= 7);
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

    // ۵. چرخه تخم‌گذاری (SAP 4-stage lifecycle)
    const layerBreeds = activeFlocks.filter(f =>
      (f.type === 'layer' || f.type === 'breeder') && f.status === 'active'
    );
    let startingSoon = 0;
    let endingSoon = 0;
    let stopped = 0;
    for (const f of layerBreeds) {
      const age = getAgeDays(f);
      const start = f.layingStartDay || 140;
      const end = f.endOfCycleDay || FALLBACK_END_DAYS;
      if (age > end) {
        stopped++;
      } else if (age >= end - END_WINDOW_DAYS) {
        endingSoon++;
      } else if (age >= start - START_WINDOW_DAYS && age < start) {
        startingSoon++;
      }
    }
    if (stopped > 0) {
      list.push({ icon: '⏹', label: 'تخم‌گذاری متوقف', count: stopped, tone: 'muted', route: '/flk' });
    }
    if (endingSoon > 0) {
      list.push({ icon: '🔚', label: 'پایان چرخه نزدیک', count: endingSoon, tone: 'danger', route: '/flk' });
    }
    if (startingSoon > 0) {
      list.push({ icon: '⏰', label: 'شروع تخم‌گذاری نزدیک', count: startingSoon, tone: 'warn', route: '/flk' });
    }

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

  return {
    nav,
    selectedFlockId, setSelectedFlockId, trendDays, setTrendDays,
    invoices, contacts, productions, flocks, eggEntries, whsItems, alerts, birds, breeds, logs,
    today, thisMonth,
    activeFlocks, todayProd, eggsToday, brokenToday, todayLogs, deathsToday, feedToday, waterToday, tempToday, humidToday,
    daysUntilDue, upcomingDues, pendingChecks,
    aliveCount, totalInitial, survivalRate, cumulativeMortality,
    henDay7, brokenRate7, eggTrend, fcr, fcrBroiler, fcrLayer, waterFeedRatio, waterFeedTone, waterFeedWarning,
    salesThisMonth, purchasesThisMonth, profit, receivables, inventoryValue, costPerEgg,
    feedPerBirdGrams, waterPerBirdMl, weightMetrics, momComparison,
    benchmarkData, aggregatedAlerts, active, counts, stockAlerts, activeEntries, hasData,
    survivalTone, henDayTone, brokenTone,
  };
}
