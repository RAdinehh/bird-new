import { useAlt, type AlertLevel, type AlertCategory } from './store';
import { useWhs, stockWarning, expiryWarning, daysToExpiry } from '../whs/store';
import { useTra, remaining, ageDays, agingBucket } from '../tra/store';
import { useFlk, getAgeDays } from '../flk/store';
import { useBrd } from '../brd/store';
import { useDlg } from '../dlg/store';
import { useEgg, henDayRate } from '../egg/store';
import { useInc, daysToHatch, isHatchWindow } from '../inc/store';
import { calcWeightLossPct, isEstInRange, isCo2InRange, isO2InRange } from '../inc/api/hatchCalc';
import { toFa } from '../../shr/utils/fa';
import { format as formatJ, startOfDay, differenceInCalendarDays as diffCalDays, parse as parseJ} from 'date-fns-jalali';
import { useSet } from '../set/store';
import { getEffectiveEnv } from '../set/standards/resolve';
import { getStandardFor } from '../set/standards/index';
import type { BirdStandard } from '../set/standards/types';
import { today, jalaliDate, todayJalali, type RuleAlert } from './alerts-helpers';
import { detectIncAlerts } from './alerts-inc';
import { detectCycleAlerts } from './alerts-cycle';
import { detectWithdrawalAlerts } from './alerts-withdrawal';
import { daysUntilDue } from '../tra/helpers';

/** تشخیص همه‌ی هشدارهای خودکار */
export function detectAllAlerts(): RuleAlert[] {
  const alerts: RuleAlert[] = [];
  const _s = useSet.getState() as { features?: { vaccine?: boolean; medicine?: boolean; withdrawal?: boolean }; customStandards?: Record<string, BirdStandard> };
  const vaccineEnabled = _s.features?.vaccine !== false;
  const medicineEnabled = _s.features?.medicine !== false;

  // ============ ۱. انبار ============
  const whsItems = useWhs.getState().items;
  whsItems.forEach(item => {
    const sw = stockWarning(item);

    if (sw === 'critical') {
      alerts.push({
        level: 'critical',
        category: 'stock',
        title: 'موجودی تمام شد: ' + item.name,
        message: 'موجودی این قلم به صفر رسیده. برای تهیه اقدام کنید.',
        source: 'whs',
        sourceId: item.id + ':stock-critical',
        date: today(), notes: ''
      });
    } else if (sw === 'low') {
      alerts.push({
        level: 'important',
        category: 'stock',
        title: 'موجودی کم: ' + item.name,
        message: 'موجودی: ' + toFa(item.currentStock) + ' — حداقل: ' + toFa(item.minStock),
        source: 'whs',
        sourceId: item.id + ':stock-low',
        date: today(), notes: ''
      });
    }

    // انقضا — بر اساس دسته
    const cat = item.category;
    const isVaccine = cat === 'vaccine';
    const isMedicine = cat === 'medicine' || cat === 'herbal';
    if (isVaccine && !vaccineEnabled) return;
    if (isMedicine && !medicineEnabled) return;

    const ew = expiryWarning(item);
    const days = daysToExpiry(item.expireDate);
    const alertCat: AlertCategory = isVaccine ? 'vaccine' : isMedicine ? 'other' : 'stock';
    if (ew === 'expired') {
      alerts.push({
        level: 'critical',
        category: alertCat,
        title: 'منقضی‌شده: ' + item.name,
        message: 'تاریخ انقضا گذشته است. از مصرف خودداری کنید.',
        source: 'whs',
        sourceId: item.id + ':expired',
        date: today(), notes: ''
      });
    } else if (ew === 'soon' && days !== null) {
      alerts.push({
        level: 'important',
        category: alertCat,
        title: 'نزدیک انقضا: ' + item.name,
        message: toFa(days) + ' روز تا انقضا',
        source: 'whs',
        sourceId: item.id + ':expiring-soon',
        date: today(), notes: ''
      });
    }

    // ─── تجهیزات: گارانتی نزدیک پایان ───
    if (cat === 'equipment') {
      const eq = item;
      if (eq.warrantyUntil) {
        const wDays = daysToExpiry(eq.warrantyUntil);
        if (wDays !== null && wDays >= 0 && wDays <= 7) {
          alerts.push({
            level: 'important',
            category: 'other',
            title: 'گارانتی نزدیک پایان: ' + item.name,
            message: toFa(wDays) + ' روز تا پایان گارانتی — قبل از اتمام، بررسی کنید.',
            source: 'whs',
            sourceId: item.id + ':warranty-ending',
            date: today(), notes: ''
          });
        }
      }
      // ─── تجهیز خراب (بحرانی) ───
      if (eq.equipmentStatus === 'broken') {
        alerts.push({
          level: 'critical',
          category: 'other',
          title: 'تجهیز خراب: ' + item.name,
          message: 'این تجهیز خراب است — هرچه سریع‌تر بررسی کنید.',
          source: 'whs',
          sourceId: item.id + ':equip-broken',
          date: today(), notes: ''
        });
      }
      // ─── تجهیز در حال تعمیر (شامل هر دو مقدار) ───
      if (eq.equipmentStatus === 'repair' || eq.equipmentStatus === 'repairing') {
        alerts.push({
          level: 'important',
          category: 'other',
          title: 'تجهیز در تعمیر: ' + item.name,
          message: 'این تجهیز در حال تعمیر است — پیگیری کنید.',
          source: 'whs',
          sourceId: item.id + ':equip-repair',
          date: today(), notes: ''
        });
      }
      // ─── نیاز به سرویس ───
      if (eq.equipmentStatus === 'maintenance') {
        alerts.push({
          level: 'important',
          category: 'other',
          title: 'نیاز به سرویس: ' + item.name,
          message: 'این تجهیز نیاز به سرویس دارد.',
          source: 'whs',
          sourceId: item.id + ':equip-maintenance',
          date: today(), notes: ''
        });
      }
    }
  });

  // ============ ۲. معاملات ============
  const invoices = useTra.getState().invoices;
  invoices.forEach(inv => {
    const rem = remaining(inv);
    if (rem <= 0) return;

    const dUntil = daysUntilDue(inv);
    const days = dUntil !== null && dUntil < 0 ? -dUntil : 0;
    const bucket = agingBucket(days);

    if (inv.type === 'sale') {
      // طلب از مشتری
      if (bucket === '61-90' || bucket === '+90') {
        alerts.push({
          level: 'critical',
          category: 'payment',
          title: 'طلب معوق ' + toFa(days) + ' روزه',
          message: 'فاکتور ' + (inv.number || '—') + ' — مانده ' + toFa(rem.toLocaleString('fa-IR')) + ' ت',
          source: 'tra',
          sourceId: inv.id + ':overdue-receivable',
          date: today(), notes: ''
        });
      } else if (bucket === '31-60') {
        alerts.push({
          level: 'important',
          category: 'payment',
          title: 'طلب ' + toFa(days) + ' روزه',
          message: 'مانده ' + toFa(rem.toLocaleString('fa-IR')) + ' ت از ' + (inv.number || '—'),
          source: 'tra',
          sourceId: inv.id + ':receivable',
          date: today(), notes: ''
        });
      }
    } else if (inv.type === 'purchase') {
      // بدهی به فروشنده
      if (bucket === '61-90' || bucket === '+90') {
        alerts.push({
          level: 'critical',
          category: 'payment',
          title: 'بدهی معوق ' + toFa(days) + ' روزه',
          message: 'فاکتور ' + (inv.number || '—') + ' — مانده ' + toFa(rem.toLocaleString('fa-IR')) + ' ت',
          source: 'tra',
          sourceId: inv.id + ':overdue-payable',
          date: today(), notes: ''
        });
      } else if (bucket === '31-60') {
        alerts.push({
          level: 'important',
          category: 'payment',
          title: 'بدهی ' + toFa(days) + ' روزه',
          message: 'مانده ' + toFa(rem.toLocaleString('fa-IR')) + ' ت',
          source: 'tra',
          sourceId: inv.id + ':payable',
          date: today(), notes: ''
        });
      }
    }
  });

  // ============ ۳. گله ============
  const flocks = useFlk.getState().flocks.filter(f => f.status === 'active' && !f.paused);
  const birds = useBrd.getState().birds;
  flocks.forEach(flock => {
    const age = getAgeDays(flock);

    // ── هشدار چرخه زندگی (بر اساس cycleDays پرنده یا endOfCycleDay گله) ──
    const bird = birds.find(b => b.id === flock.birdId);
    const cycleDays =
      (flock.endOfCycleDay && flock.endOfCycleDay > 0) ? flock.endOfCycleDay :
      null;

    if (cycleDays && cycleDays > 0) {
      const progress = (age / cycleDays) * 100;

      // ≥ ۹۵٪ — پایان نزدیک (critical)
      if (progress >= 95 && progress < 100) {
        alerts.push({
          level: 'critical',
          category: 'other',
          title: 'پایان چرخه گله: ' + flock.name,
          message: 'سن: ' + toFa(age) + ' از ' + toFa(cycleDays) + ' روز (' + toFa(Math.round(progress)) + '٪) — آماده‌ی جایگزینی فوری',
          source: 'flk',
          sourceId: flock.id + ':end-cycle-95',
          date: today(), notes: ''
        });
      }
      // ≥ ۸۰٪ — نزدیک پایان (important)
      else if (progress >= 80 && progress < 95) {
        alerts.push({
          level: 'important',
          category: 'other',
          title: 'نزدیک پایان چرخه: ' + flock.name,
          message: 'سن: ' + toFa(age) + ' از ' + toFa(cycleDays) + ' روز (' + toFa(Math.round(progress)) + '٪) — برنامه‌ی جایگزینی',
          source: 'flk',
          sourceId: flock.id + ':end-cycle-80',
          date: today(), notes: ''
        });
      }
      // ≥ ۱۰۰٪ — گذشته از چرخه (info)
      else if (progress >= 100) {
        alerts.push({
          level: 'info',
          category: 'other',
          title: 'چرخه تمام شده: ' + flock.name,
          message: 'سن: ' + toFa(age) + ' روز (از ' + toFa(cycleDays) + ' روز گذشته)',
          source: 'flk',
          sourceId: flock.id + ':cycle-over',
          date: today(), notes: ''
        });
      }
    }

    // ── گله مادر — سن اوج (۳۵-۴۵ هفته) ──
    if (flock.type === 'breeder' && age >= 245 && age <= 315) {
      alerts.push({
        level: 'info',
        category: 'reproduction',
        title: 'گله مادر — آماده‌ی جوجه‌کشی: ' + flock.name,
        message: 'سن: ' + toFa(age) + ' روز — نطفه‌داری در اوج',
        source: 'flk',
        sourceId: flock.id + ':breeder-optimal',
        date: today(), notes: ''
      });
    }
  });

  // ============ ۴. ثبت روزانه — تلفات و دما ============
  const logs = useDlg.getState().logs;
  const todayStr = todayJalali();
  const recentLogs = logs.filter(l => {
    // ۳ روز اخیر
    const d = jalaliDate(l.date);
    if (!d) return false;
    const diff = diffCalDays(startOfDay(new Date()), d);
    return diff >= 0 && diff <= 3;
  });

  recentLogs.forEach(log => {
    const deaths = (log.deaths || []).reduce((a, x) => a + (x.count || 0), 0);
    const flock = flocks.find(f => f.id === log.flockId);
    const flockCount = flock ? (flock.currentCount || flock.initialCount || 0) : 0;
    const mortality = flockCount > 0 ? (deaths / flockCount) * 1000 : 0;

    // تلفات بالا
    // 🆕 حداکثر تلفات از standards بر اساس سن
    const birdForMort = birds.find(b => b.id === flock?.birdId);
    const customStandardsForMort = _s.customStandards || {};
    const flockAgeForMort = flock ? getAgeDays(flock) : 0;
    let maxMortalityPerThousand = 5;  // fallback
    try {
      const stdForMort = getEffectiveEnv(birdForMort?.name, flockAgeForMort, null, { customStandards: customStandardsForMort });
      // target از standards نیومده، از mortality جداگانه بخونیم
      const stdFull = getStandardFor(birdForMort?.name, { customStandards: customStandardsForMort });
      if (stdFull?.mortality && Array.isArray(stdFull.mortality)) {
        const range = stdFull.mortality.find((m) => flockAgeForMort >= m.dayFrom && flockAgeForMort <= m.dayTo);
        if (range?.maxPct) maxMortalityPerThousand = range.maxPct * 10;
      }
    } catch { /* silent */ }

    if (mortality > maxMortalityPerThousand) {
      alerts.push({
        level: 'critical',
        category: 'mortality',
        title: 'تلفات بالا در ' + (flock?.name || 'گله'),
        message: toFa(deaths) + ' مورد در ' + toFa(log.date) + ' (' + toFa(mortality.toFixed(1)) + ' در هزار، حداکثر ' + toFa(maxMortalityPerThousand.toFixed(1)) + ')',
        source: 'dlg',
        sourceId: log.id + ':high-mortality',
        date: log.date, notes: ''
      });
    } else if (mortality > maxMortalityPerThousand * 0.4) {
      alerts.push({
        level: 'important',
        category: 'mortality',
        title: 'افزایش تلفات',
        message: toFa(deaths) + ' مورد در ' + toFa(log.date),
        source: 'dlg',
        sourceId: log.id + ':mortality',
        date: log.date, notes: ''
      });
    }

    // دما غیرعادی
    if (log.temperature !== null && log.temperature !== undefined) {
      // 🆕 هدف از standards بر اساس سن گله
      const bird = birds.find(b => b.id === flock?.birdId);
      const customStandards = _s.customStandards || {};
      const flockAge = flock ? getAgeDays(flock) : 0;
      let target: number | null = null;
      try {
        const std = getEffectiveEnv(bird?.name, flockAge, null, { customStandards });
        target = std.temp?.target ?? null;
      } catch { /* silent */ }

      // ۱. بحرانی — از thresholds
      // 🆕 محدوده بحرانی از env[سن]
      const stdEnv = target !== null ? getEffectiveEnv(bird?.name, flockAge, null, { customStandards }) : null;
      const criticalLow = stdEnv?.temp?.min ?? 18;
      const criticalHigh = stdEnv?.temp?.max ?? 32;

      if (log.temperature < criticalLow || log.temperature > criticalHigh) {
        alerts.push({
          level: 'critical',
          category: 'temp',
          title: 'دمای بحرانی: ' + toFa(log.temperature) + '°C',
          message: 'در ' + (flock?.name || 'گله') + ' — محدوده: ' + toFa(criticalLow) + '-' + toFa(criticalHigh) + '°C — تاریخ ' + toFa(log.date),
          source: 'dlg',
          sourceId: log.id + ':temp-critical',
          date: log.date, notes: ''
        });
      }
      // داخل محدوده استاندارد → OK (هیچ هشداری)
    }
  });

  // ============ ۵. تخم‌گذاری ============
  const productions = useEgg.getState().productions;
  const recentProd = productions.filter(p => {
    const d = jalaliDate(p.date);
    if (!d) return false;
    const diff = diffCalDays(startOfDay(new Date()), d);
    return diff >= 0 && diff <= 7;
  });

  recentProd.forEach(p => {
    const flock = flocks.find(f => f.id === p.flockId);
    const flockCount = flock ? (flock.currentCount || flock.initialCount || 0) : 0;
    const rate = henDayRate(p, flockCount);

    if (rate > 0 && rate < 50 && flockCount > 100) {
      alerts.push({
        level: 'important',
        category: 'reproduction',
        title: 'افت تخم‌گذاری در ' + (flock?.name || 'گله'),
        message: 'نرخ: ' + toFa(rate.toFixed(1)) + '٪ در ' + toFa(p.date),
        source: 'egg',
        sourceId: p.id + ':low-rate',
        date: p.date, notes: ''
      });
    }
  });

  detectIncAlerts(alerts);
  detectCycleAlerts(alerts);
  if (_s.features?.withdrawal) detectWithdrawalAlerts(alerts);

  // اطمینان از وجود notes
  alerts.forEach(a => { if (a.notes === undefined) a.notes = ''; });

  return alerts;
}

/** اجرای تشخیص + به‌روزرسانی store */
export function runRules(): number {
  const detected = detectAllAlerts();
  const { findOrCreate } = useAlt.getState();

  detected.forEach(a => findOrCreate(a));

  return detected.length;
}
