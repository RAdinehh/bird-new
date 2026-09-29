import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTra, remaining } from '../tra/store';
import { useCtc } from '../ctc/store';
import { useEgg, calcStock, henDayRate, healthyCount } from '../egg/store';
import { useFlk, getAgeDays, getLifecycle } from '../flk/store';
import { useInc, daysToHatch, isLockdown, isHatchWindow } from '../inc/store';
import { useWhs, stockWarning, expiryWarning } from '../whs/store';
import { useAlt, activeAlerts, LEVEL_ICON, LEVEL_LABEL, countByLevel } from '../alt/store';
import { runRules } from '../alt/rules';
import { useBrd } from '../brd/store';
import { findBirdPreset } from '../brd/presets';
import { useDlg } from '../dlg/store';
import { PageContainer, Tag } from '../../shr/components/ui';
import { LineChart } from '../../shr/components/Charts';
import { toFa } from '../../shr/utils/fa';

function toEnNum(s: string): number {
  return parseInt(s.replace(/[۰-۹]/g, d => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))) || 0;
}

function monthKey(date: string): string {
  if (date === '' || date == null) return '';
  const parts = date.replace(/[۰-۹]/g, d => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d))).split('/');
  if (parts.length !== 3) return '';
  return parts[0] + '/' + parts[1];
}

function currentMonth(): string {
  const d = new Date();
  return d.getFullYear() + '/' + String(d.getMonth() + 1).padStart(2, '0');
}

function todayJalali(): string {
  const d = new Date();
  return d.getFullYear() + '/' + String(d.getMonth() + 1).padStart(2, '0') + '/' + String(d.getDate()).padStart(2, '0');
}

function dateDiffDays(jalaliDate: string): number {
  if (jalaliDate === '' || jalaliDate == null) return 999;
  const parts = jalaliDate.replace(/[۰-۹]/g, d => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d))).split('/');
  if (parts.length !== 3) return 999;
  const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
  return Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24));
}


function fcrBg(diff: number): string {
  if (diff <= 0) return 'var(--accent-soft)';
  if (diff <= 10) return 'var(--warn-soft)';
  return 'var(--danger-soft)';
}

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
  const daysUntilDue = (dueDate: string): number | null => {
    if (!dueDate) return null;
    const parts = dueDate.replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d).toString()).split('/');
    if (parts.length !== 3) return null;
    const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    return Math.ceil((d.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  };

  const upcomingDues = useMemo(() => {
    return invoices
      .filter(i => remaining(i) > 0 && i.dueDate && !i.remindersMuted)
      .map(i => ({ inv: i, days: daysUntilDue(i.dueDate) }))
      .filter(x => x.days !== null && x.days <= 7)
      .sort((a, b) => (a.days ?? 0) - (b.days ?? 0))
      .slice(0, 5);
  }, [invoices]);

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

  const monthStats = useMemo(() => {
    const monthInvoices = invoices.filter(i => i.date && i.date.startsWith(thisMonth));
    const purchases = monthInvoices.filter(i => i.type === 'purchase').reduce((a, i) => a + (i.total || 0), 0);
    const sales = monthInvoices.filter(i => i.type === 'sale').reduce((a, i) => a + (i.total || 0), 0);
    return { purchases, sales, profit: sales - purchases };
  }, [invoices, thisMonth]);

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
      const key = d.getFullYear() + '/' + String(d.getMonth() + 1).padStart(2, '0') + '/' + String(d.getDate()).padStart(2, '0');
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
    const months = ['فروردین','اردیبهشت','خرداد','تیر','مرداد','شهریور','مهر','آبان','آذر','دی','بهمن','اسفند'];
    for (let i = trendDays - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.getFullYear() + '/' + String(d.getMonth() + 1).padStart(2, '0') + '/' + String(d.getDate()).padStart(2, '0');
      const prods = productions.filter(p => p.date === key);
      const total = prods.reduce((a, p) => a + (p.totalCount || 0), 0);
      days.push({ label: toFa(String(d.getDate())), value: total });
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
  const deathTone: 'accent' | 'warn' | 'danger' = deathsToday === 0 ? 'accent' : deathsToday <= 3 ? 'warn' : 'danger';
  const survivalTone: 'accent' | 'warn' | 'danger' = survivalRate >= 95 ? 'accent' : survivalRate >= 90 ? 'warn' : 'danger';
  const henDayTone: 'accent' | 'warn' | 'danger' = henDay7 >= 80 ? 'accent' : henDay7 >= 60 ? 'warn' : 'danger';
  const brokenTone: 'accent' | 'warn' | 'danger' = brokenRate7 <= 3 ? 'accent' : brokenRate7 <= 6 ? 'warn' : 'danger';

  return (
    <PageContainer>
      {/* 🚨 هشدارهای تجمیعی */}
      {aggregatedAlerts.length > 0 && (
        <div style={{
          background: 'var(--card)',
          border: '1px solid var(--danger)',
          borderRadius: 'var(--r-lg)',
          overflow: 'hidden',
        }}>
          <div style={{
            padding: '8px 12px',
            background: 'var(--danger-soft)',
            fontSize: 'var(--fs-sm)',
            fontWeight: 700,
            color: 'var(--danger)',
          }}>
            🚨 هشدارهای فوری ({toFa(aggregatedAlerts.length)})
          </div>
          <div style={{ padding: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
            {aggregatedAlerts.map((a, i) => (
              <div
                key={i}
                onClick={() => nav(a.route)}
                style={{
                  padding: '6px 10px',
                  background: `var(--${a.tone}-soft)`,
                  borderRadius: 'var(--r-sm)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  cursor: 'pointer',
                  fontSize: 'var(--fs-sm)',
                }}
              >
                <span style={{ color: `var(--${a.tone})`, fontWeight: 600 }}>
                  {a.icon} {a.label}
                </span>
                <span style={{ fontWeight: 700, color: `var(--${a.tone})` }}>
                  {toFa(a.count)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ⏰ سرسیدهای نزدیک */}
      {upcomingDues.length > 0 && (
        <div>
          <div style={{ fontSize: 'var(--fs-sm)', fontWeight: 700, color: 'var(--text)', paddingBottom: 4 }}>
            ⏰ سرسیدهای نزدیک ({toFa(upcomingDues.length)})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {upcomingDues.map(({ inv, days }) => {
              const party = contacts.find((c: any) => c.id === inv.partyId);
              const tone = (days ?? 0) < 0 ? 'danger' : (days ?? 0) <= 2 ? 'warn' : 'amber';
              return (
                <div
                  key={inv.id}
                  onClick={() => nav('/tra?tab=receivables')}
                  style={{
                    padding: '8px 12px',
                    background: `var(--${tone}-soft, var(--input-bg))`,
                    border: `1px solid var(--${tone})`,
                    borderRadius: 'var(--r-md)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: 'pointer',
                    fontSize: 'var(--fs-sm)',
                  }}
                >
                  <span style={{ fontWeight: 600, color: `var(--${tone})` }}>
                    {party?.name || '—'}
                  </span>
                  <span style={{ color: `var(--${tone})`, fontSize: 'var(--fs-xs)' }}>
                    {(days ?? 0) < 0 ? `${toFa(Math.abs(days ?? 0))} روز گذشته` : (days === 0 ? 'امروز' : `${toFa(days ?? 0)} روز مانده`)}
                  </span>
                  <span style={{ fontWeight: 700, color: `var(--${tone})` }}>
                    {toFa(remaining(inv).toLocaleString('fa-IR'))} ت
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 🏦 چک‌های در جریان */}
      {pendingChecks.length > 0 && (
        <div>
          <div style={{ fontSize: 'var(--fs-sm)', fontWeight: 700, color: 'var(--text)', paddingBottom: 4 }}>
            🏦 چک‌های در جریان ({toFa(pendingChecks.length)})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {pendingChecks.map(({ inv, pay }) => {
              const party = contacts.find((c: any) => c.id === inv.partyId);
              return (
                <div
                  key={pay.id}
                  onClick={() => nav('/tra?tab=receivables')}
                  style={{
                    padding: '8px 12px',
                    background: 'var(--input-bg)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--r-md)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: 'pointer',
                    fontSize: 'var(--fs-sm)',
                  }}
                >
                  <span style={{ fontWeight: 600 }}>{party?.name || '—'}</span>
                  <span style={{ color: 'var(--muted)', fontSize: 'var(--fs-xs)' }}>
                    چک {pay.checkNo || '—'} · {pay.bank || '—'}
                  </span>
                  <span style={{ fontWeight: 700, color: 'var(--amber)' }}>
                    {toFa(pay.amount.toLocaleString('fa-IR'))} ت
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeFlocks.length === 0 && invoices.length === 0 ? (
        <div style={{
          padding: 24, textAlign: 'center',
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--r-lg)'
        }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🐔</div>
          <div style={{ fontSize: 'var(--fs-lg)', fontWeight: 700, marginBottom: 8 }}>خوش آمدید</div>
          <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--muted)', lineHeight: 1.8, maxWidth: 300, margin: '0 auto' }}>
            برای شروع، از منوی بالا اولین پرنده یا سالن خود را بسازید.
          </div>
        </div>
      ) : null}

      {/* ============ ۱. امروز در یک نگاه ============ */}
      {hasData ? (
        <>
          {benchmarkData && activeFlocks.length > 0 && (
            <div style={{
              background: 'var(--card)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--r-lg)',
              padding: '10px 12px',
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 8,
                gap: 8,
              }}>
                <div style={{ fontSize: 'var(--fs-sm)', fontWeight: 700, color: 'var(--text)' }}>
                  🎯 Benchmark گله
                </div>
                {activeFlocks.length > 1 && (
                  <select
                    value={selectedFlockId}
                    onChange={e => setSelectedFlockId(e.target.value)}
                    style={{
                      padding: '4px 8px',
                      fontSize: 'var(--fs-xs)',
                      background: 'var(--input-bg)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--r-sm)',
                      color: 'var(--text)',
                      fontFamily: 'inherit',
                      maxWidth: 140,
                    }}
                  >
                    {activeFlocks.map(f => (
                      <option key={f.id} value={f.id}>{f.name}</option>
                    ))}
                  </select>
                )}
              </div>

              {benchmarkData.hasData ? (
                <>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 4,
                    marginBottom: 6,
                  }}>
                    <div style={{
                      padding: '6px 10px',
                      background: 'var(--input-bg)',
                      borderRadius: 'var(--r-sm)',
                    }}>
                      <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', fontWeight: 600 }}>
                        FCR فعلی
                      </div>
                      <div style={{
                        fontSize: 'var(--fs-md)',
                        fontWeight: 700,
                        color: benchmarkData.fcrDiff <= 0 ? 'var(--accent)' : benchmarkData.fcrDiff <= 10 ? 'var(--warn)' : 'var(--danger)',
                        fontVariantNumeric: 'tabular-nums',
                      }}>
                        {toFa(benchmarkData.fcrActual)}
                      </div>
                    </div>
                    <div style={{
                      padding: '6px 10px',
                      background: 'var(--input-bg)',
                      borderRadius: 'var(--r-sm)',
                    }}>
                      <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', fontWeight: 600 }}>
                        FCR استاندارد
                      </div>
                      <div style={{
                        fontSize: 'var(--fs-md)',
                        fontWeight: 700,
                        color: 'var(--text)',
                        fontVariantNumeric: 'tabular-nums',
                      }}>
                        {toFa(benchmarkData.fcrStandard)}
                      </div>
                    </div>
                  </div>

                  <div style={{
                    padding: '6px 10px',
                    background: benchmarkData.fcrDiff <= 0 ? 'var(--accent-soft)' : benchmarkData.fcrDiff <= 10 ? 'var(--warn-soft)' : 'var(--danger-soft)',
                    border: `1px solid ${benchmarkData.fcrDiff <= 0 ? 'var(--accent-border)' : benchmarkData.fcrDiff <= 10 ? 'var(--warn)' : 'var(--danger)'}`,
                    borderRadius: 'var(--r-sm)',
                    fontSize: 'var(--fs-xs)',
                    fontWeight: 700,
                    color: benchmarkData.fcrDiff <= 0 ? 'var(--accent)' : benchmarkData.fcrDiff <= 10 ? 'var(--warn)' : 'var(--danger)',
                    textAlign: 'center',
                  }}>
                    {benchmarkData.fcrDiff <= 0
                      ? `✅ بهتر از استاندارد (${toFa(Math.abs(benchmarkData.fcrDiff))}٪)`
                      : `⚠️ ${toFa(benchmarkData.fcrDiff)}٪ بالاتر از استاندارد`}
                  </div>

                  {benchmarkData.henDay > 0 && (
                    <div style={{
                      marginTop: 6,
                      padding: '6px 10px',
                      background: 'var(--input-bg)',
                      borderRadius: 'var(--r-sm)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: 'var(--fs-xs)',
                    }}>
                      <span style={{ color: 'var(--muted)' }}>Hen-Day این گله</span>
                      <span style={{
                        fontWeight: 700,
                        color: benchmarkData.henDay >= 80 ? 'var(--accent)' : benchmarkData.henDay >= 60 ? 'var(--warn)' : 'var(--danger)',
                      }}>
                        {toFa(benchmarkData.henDay)}٪
                      </span>
                    </div>
                  )}
                </>
              ) : (
                <div style={{
                  padding: '10px 12px',
                  background: 'var(--input-bg)',
                  borderRadius: 'var(--r-sm)',
                  fontSize: 'var(--fs-xs)',
                  color: 'var(--muted)',
                  textAlign: 'center',
                }}>
                  ⚠️ داده کافی برای Benchmark وجود ندارد
                  <div style={{ marginTop: 4 }}>
                    (نیاز به: ثبت روزانه + تخم‌گذاری + FCR نژاد)
                  </div>
                </div>
              )}
            </div>
          )}

          <SectionTitle>📅 امروز در یک نگاه</SectionTitle>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
            <KpiCard
              icon="🥚"
              label="تخم امروز"
              value={eggsToday}
              unit="عدد"
              color="accent"
              onClick={() => nav('/egg')}
            />
            <KpiCard
              icon="💀"
              label="تلفات امروز"
              value={deathsToday}
              unit="پرنده"
              color={deathTone}
              onClick={() => nav('/dlg')}
            />
            <KpiCard
              icon="🌾"
              label="دان امروز"
              value={feedToday}
              unit="kg"
              color="warn"
              onClick={() => nav('/dlg')}
            />
            <KpiCard
              icon="🌡"
              label="دمای سالن"
              value={tempToday}
              unit={tempToday > 0 ? '°C' : 'ثبت نشده'}
              color={tempToday > 26 || (tempToday > 0 && tempToday < 18) ? 'warn' : 'info'}
              noFormat
              onClick={() => nav('/dlg')}
            />
            <KpiCard
              icon="🌾"
              label="دان/پرنده"
              value={feedPerBirdGrams}
              unit="گرم در روز"
              color={feedPerBirdGrams > 0 && feedPerBirdGrams <= 150 ? 'accent' : 'warn'}
              noFormat
              onClick={() => nav('/dlg')}
            />
            <KpiCard
              icon="💧"
              label="آب/پرنده"
              value={waterPerBirdMl}
              unit="میلی‌لیتر در روز"
              color={waterPerBirdMl > 0 && waterPerBirdMl <= 300 ? 'info' : 'warn'}
              noFormat
              onClick={() => nav('/dlg')}
            />
          </div>

          {/* ============ ۲. سلامت گله ============ */}
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
      ) : null}

      {/* ============ ۵. هشدارها ============ */}
      {active.length > 0 ? (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 4px 8px' }}>
            <span style={{ fontSize: 'var(--fs-sm)', fontWeight: 700, color: 'var(--muted)' }}>
              🔔 هشدارهای فعال ({toFa(counts.total)})
            </span>
            <span onClick={() => nav('/alt')} style={{ fontSize: 'var(--fs-xs)', color: 'var(--accent)', cursor: 'pointer' }}>
              مشاهده همه ←
            </span>
          </div>
          <div style={{
            background: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--r-lg)',
            overflow: 'hidden'
          }}>
            {active.map((a, i) => (
              <div
                key={a.id}
                onClick={() => nav('/alt')}
                style={{
                  padding: '10px 14px',
                  borderBottom: i < active.length - 1 ? '1px solid var(--border)' : 'none',
                  display: 'flex', alignItems: 'center', gap: 10,
                  cursor: 'pointer'
                }}
              >
                <span style={{ fontSize: 16, flexShrink: 0 }}>{LEVEL_ICON[a.level]}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{
                    fontSize: 'var(--fs-sm)', fontWeight: 600,
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                  }}>
                    {a.title}
                  </div>
                  <div style={{
                    fontSize: 'var(--fs-xs)', color: 'var(--muted)', marginTop: 2,
                    whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                  }}>
                    {a.message}
                  </div>
                </div>
                <Tag tone={a.level === 'critical' ? 'red' : a.level === 'important' ? 'amber' : 'blue'}>
                  {LEVEL_LABEL[a.level]}
                </Tag>
              </div>
            ))}
          </div>
        </>
      ) : null}

      {/* ============ ۶. گله‌ها ============ */}
      {activeFlocks.length > 0 ? (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 4px 8px' }}>
            <span style={{ fontSize: 'var(--fs-sm)', fontWeight: 700, color: 'var(--muted)' }}>
              🐔 گله‌های فعال
            </span>
            <span onClick={() => nav('/flk')} style={{ fontSize: 'var(--fs-xs)', color: 'var(--accent)', cursor: 'pointer' }}>
              مشاهده همه ←
            </span>
          </div>
          <div style={{
            background: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--r-lg)',
            overflow: 'hidden'
          }}>
            {activeFlocks.slice(0, 3).map((f, i) => {
              const age = getAgeDays(f);
              const lc = getLifecycle(f.type, age);
              const bird = birds.find(b => b.id === f.birdId);
              const flockCount = f.currentCount || f.initialCount || 0;
              const flockProds = productions.filter(p => p.flockId === f.id && dateDiffDays(p.date) <= 7);
              const flockHenDay = flockProds.length > 0 && flockCount > 0
                ? (flockProds.reduce((a, p) => a + healthyCount(p), 0) / (flockCount * flockProds.length)) * 100
                : 0;

              return (
                <div
                  key={f.id}
                  onClick={() => nav('/flk')}
                  style={{
                    padding: '10px 14px',
                    borderBottom: i < Math.min(activeFlocks.length, 3) - 1 ? '1px solid var(--border)' : 'none',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 'var(--r-md)',
                      background: 'var(--accent-soft)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 16, flexShrink: 0
                    }}>🐔</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: 'var(--fs-sm)', fontWeight: 600,
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                      }}>
                        {f.name}
                      </div>
                      <div style={{
                        fontSize: 'var(--fs-xs)', color: 'var(--muted)', marginTop: 2,
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                      }}>
                        {bird?.name || '—'} · {toFa(age)} روز · {toFa(flockCount)} پرنده
                        {flockHenDay > 0 ? ' · ' + toFa(flockHenDay.toFixed(0)) + '٪' : ''}
                      </div>
                    </div>
                    <Tag tone={lc.color === 'green' ? 'green' : lc.color === 'amber' ? 'amber' : 'blue'}>
                      {lc.label}
                    </Tag>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : null}

      {/* ============ ۷. جوجه‌کشی فعال ============ */}
      {activeEntries.length > 0 ? (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 4px 8px' }}>
            <span style={{ fontSize: 'var(--fs-sm)', fontWeight: 700, color: 'var(--muted)' }}>
              🥚 جوجه‌کشی فعال ({toFa(activeEntries.length)})
            </span>
            <span onClick={() => nav('/inc')} style={{ fontSize: 'var(--fs-xs)', color: 'var(--accent)', cursor: 'pointer' }}>
              مشاهده ←
            </span>
          </div>
          <div style={{
            background: 'var(--card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--r-lg)',
            overflow: 'hidden'
          }}>
            {activeEntries.slice(0, 2).map((e, i) => {
              const days = daysToHatch(e.expectedHatchDate);
              const locked = isLockdown(e);
              const window = isHatchWindow(e);
              const bird = birds.find(b => b.id === e.birdId);

              return (
                <div
                  key={e.id}
                  onClick={() => nav('/inc')}
                  style={{
                    padding: '10px 14px',
                    borderBottom: i < Math.min(activeEntries.length, 2) - 1 ? '1px solid var(--border)' : 'none',
                    display: 'flex', alignItems: 'center', gap: 10,
                    cursor: 'pointer'
                  }}
                >
                  <div style={{
                    width: 36, height: 36, borderRadius: 'var(--r-md)',
                    background: window ? 'var(--purple-soft)' : locked ? 'var(--warn-soft)' : 'var(--accent-soft)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 16, flexShrink: 0
                  }}>🥚</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: 'var(--fs-sm)', fontWeight: 600,
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'
                    }}>
                      {toFa(e.count || 0)} تخم — {bird?.name || '—'}
                    </div>
                    <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', marginTop: 2 }}>
                      {window ? '🐣 پنجره هچ' : locked ? '🔒 Lock-down' : toFa(days) + ' روز مانده'}
                    </div>
                  </div>
                  {window ? <Tag tone="purple">هچ</Tag> : locked ? <Tag tone="amber">قفل</Tag> : <Tag tone="blue">{toFa(days)} روز</Tag>}
                </div>
              );
            })}
          </div>
        </>
      ) : null}

      {/* ============ ۸. هشدار انبار ============ */}
      {stockAlerts > 0 ? (
        <div
          onClick={() => nav('/whs')}
          style={{
            padding: '12px 14px',
            background: 'var(--warn-soft)',
            border: '1px solid var(--warn)',
            borderRadius: 'var(--r-md)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            cursor: 'pointer'
          }}
        >
          <span style={{ fontSize: 'var(--fs-sm)', color: 'var(--warn)', fontWeight: 700 }}>
            📦 هشدار انبار
          </span>
          <span style={{ fontSize: 'var(--fs-md)', color: 'var(--warn)', fontWeight: 700 }}>
            {toFa(stockAlerts)} قلم
          </span>
        </div>
      ) : null}

      {/* ============ ۹. دسترسی سریع ============ */}
      <SectionTitle>⚡ دسترسی سریع</SectionTitle>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 4 }}>
        <QuickAction icon="📋" label="ثبت روزانه" onClick={() => nav('/dlg')} />
        <QuickAction icon="🥚" label="جوجه‌کشی" onClick={() => nav('/inc')} />
        <QuickAction icon="🛒" label="معاملات" onClick={() => nav('/tra')} />
        <QuickAction icon="🥚" label="تخم" onClick={() => nav('/egg')} />
        <QuickAction icon="🌾" label="جیره" onClick={() => nav('/fed')} />
        <QuickAction icon="📊" label="گزارش" onClick={() => nav('/rep')} />
      </div>
    </PageContainer>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: 'var(--fs-sm)', fontWeight: 700, color: 'var(--muted)',
      padding: '8px 4px 8px', letterSpacing: '.5px'
    }}>{children}</div>
  );
}

function KpiCard({ icon, label, value, unit, color, onClick, noFormat }: {
  icon: string;
  label: string;
  value: number;
  unit: string;
  color: 'accent' | 'warn' | 'danger' | 'info';
  onClick?: () => void;
  noFormat?: boolean;
}) {
  return (
    <div
      onClick={onClick}
      style={{
        background: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--r-lg)',
        padding: '12px 14px',
        cursor: onClick ? 'pointer' : 'default'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
        <span style={{ fontSize: 16 }}>{icon}</span>
        <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', fontWeight: 600 }}>
          {label}
        </span>
      </div>
      <div style={{
        fontSize: 'var(--fs-xl)',
        fontWeight: 700,
        color: 'var(--' + color + ')',
        fontVariantNumeric: 'tabular-nums',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis'
      }}>
        {noFormat ? toFa(String(value)) : toFa(value.toLocaleString('fa-IR'))}
      </div>
      {unit ? (
        <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', marginTop: 2 }}>{unit}</div>
      ) : null}
    </div>
  );
}

function MiniStat({ label, value, suffix, color, noFormat }: {
  label: string;
  value: number;
  suffix: string;
  color: 'accent' | 'warn' | 'danger' | 'info';
  noFormat?: boolean;
}) {
  return (
    <div style={{
      padding: '7px 10px',
      background: 'var(--' + color + '-soft)',
      border: '1px solid var(--' + color + ')',
      borderRadius: 'var(--r-md)',
      textAlign: 'center'
    }}>
      <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--' + color + ')', fontWeight: 700 }}>
        {label}
      </div>
      <div style={{
        fontSize: 'var(--fs-md)', fontWeight: 700,
        color: 'var(--' + color + ')',
        marginTop: 4,
        fontVariantNumeric: 'tabular-nums'
      }}>
        {noFormat ? toFa(String(Math.round(value))) : toFa((Math.round(value * 100) / 100).toLocaleString('fa-IR'))}{suffix}
      </div>
    </div>
  );
}

function QuickAction({ icon, label, onClick }: { icon: string; label: string; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--r-md)',
        padding: '8px 6px',
        textAlign: 'center',
        cursor: 'pointer'
      }}
    >
      <div style={{ fontSize: 22 }}>{icon}</div>
      <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--text)', marginTop: 4, fontWeight: 600 }}>
        {label}
      </div>
    </div>
  );
}
