import { useAlt, type AlertLevel, type AlertCategory } from './store';
import { useWhs, stockWarning, expiryWarning, daysToExpiry } from '../whs/store';
import { useTra, remaining, ageDays, agingBucket } from '../tra/store';
import { useFlk, getAgeDays } from '../flk/store';
import { useDlg } from '../dlg/store';
import { useEgg, henDayRate } from '../egg/store';
import { useInc, daysToHatch, isLockdown, isHatchWindow } from '../inc/store';
import { toFa } from '../../shr/utils/fa';
import { format as formatJ, startOfDay, differenceInCalendarDays as diffCalDays, parse as parseJ} from 'date-fns-jalali';
import { useSet } from '../set/store';

interface RuleAlert {
  level: AlertLevel;
  category: AlertCategory;
  title: string;
  message: string;
  source: string;
  sourceId: string;
  date: string;
  notes: string;
}

const today = () => new Date().toISOString().slice(0, 10);

/** تاریخ شمسی → Date (نرمال‌شده به 00:00 شمسی) */
function jalaliDate(s: string): Date | null {
  if (!s) return null;
  try {
    const en = s.replace(/[۰-۹]/g, d => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)));
    const d = parseJ(en, 'yyyy/MM/dd', new Date());
    if (isNaN(d.getTime())) return null;
    return startOfDay(d);
  } catch { return null; }
}
const todayJalali = () => {
  const d = new Date();
  return formatJ(d, 'yyyy/MM/dd');
};

/** تشخیص همه‌ی هشدارهای خودکار */


/** خواندن thresholds از store (با fallback) */
function getThresholds() {
  try {
    const s = useSet.getState();
    return s.thresholds || {
      eggDropPercent: 10,
      mortalityPerThousand: 5,
      tempDeviation: 2,
      humidityDeviation: 10,
      waterFeedMin: 1.6,
      waterFeedMax: 2.2,
      criticalTempHigh: 32,
      criticalTempLow: 18,
    };
  } catch {
    return {
      eggDropPercent: 10,
      mortalityPerThousand: 5,
      tempDeviation: 2,
      humidityDeviation: 10,
      waterFeedMin: 1.6,
      waterFeedMax: 2.2,
      criticalTempHigh: 32,
      criticalTempLow: 18,
    };
  }
}

export function detectAllAlerts(): RuleAlert[] {
  const alerts: RuleAlert[] = [];

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

    // انقضا
    const ew = expiryWarning(item);
    const days = daysToExpiry(item.expireDate);
    if (ew === 'expired') {
      alerts.push({
        level: 'critical',
        category: 'vaccine',
        title: 'منقضی‌شده: ' + item.name,
        message: 'تاریخ انقضا گذشته است. از مصرف خودداری کنید.',
        source: 'whs',
        sourceId: item.id + ':expired',
        date: today(), notes: ''
      });
    } else if (ew === 'soon' && days !== null) {
      alerts.push({
        level: 'important',
        category: 'vaccine',
        title: 'نزدیک انقضا: ' + item.name,
        message: toFa(days) + ' روز تا انقضا',
        source: 'whs',
        sourceId: item.id + ':expiring-soon',
        date: today(), notes: ''
      });
    }
  });

  // ============ ۲. معاملات ============
  const invoices = useTra.getState().invoices;
  invoices.forEach(inv => {
    const rem = remaining(inv);
    if (rem <= 0) return;

    const days = ageDays(inv);
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
  const flocks = useFlk.getState().flocks.filter(f => f.status === 'active');
  flocks.forEach(flock => {
    const age = getAgeDays(flock);

    // گله به پایان دوره نزدیک است
    if (flock.type === 'layer' && age > 450 && age < 500) {
      alerts.push({
        level: 'important',
        category: 'other',
        title: 'گله نزدیک پایان دوره: ' + flock.name,
        message: 'سن: ' + toFa(age) + ' روز — آماده‌ی جایگزینی',
        source: 'flk',
        sourceId: flock.id + ':end-of-cycle',
        date: today(), notes: ''
      });
    }

    // گله مادر — سن اوج
    if (flock.type === 'breeder' && age > 280 && age < 320) {
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
    if (mortality > 5) {
      alerts.push({
        level: 'critical',
        category: 'mortality',
        title: 'تلفات بالا در ' + (flock?.name || 'گله'),
        message: toFa(deaths) + ' مورد در ' + toFa(log.date) + ' (' + toFa(mortality.toFixed(1)) + ' در هزار)',
        source: 'dlg',
        sourceId: log.id + ':high-mortality',
        date: log.date, notes: ''
      });
    } else if (mortality > 2) {
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
      if (log.temperature < 15 || log.temperature > 30) {
        alerts.push({
          level: 'critical',
          category: 'temp',
          title: 'دمای بحرانی: ' + toFa(log.temperature) + '°C',
          message: 'در ' + (flock?.name || 'گله') + ' — تاریخ ' + toFa(log.date),
          source: 'dlg',
          sourceId: log.id + ':temp-critical',
          date: log.date, notes: ''
        });
      } else if (log.temperature < 18 || log.temperature > 26) {
        alerts.push({
          level: 'important',
          category: 'temp',
          title: 'دما خارج از محدوده: ' + toFa(log.temperature) + '°C',
          message: 'در ' + (flock?.name || 'گله'),
          source: 'dlg',
          sourceId: log.id + ':temp-warning',
          date: log.date, notes: ''
        });
      }
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

  // ============ ۶. جوجه‌کشی ============
  const entries = useInc.getState().eggEntries;

  entries.forEach(entry => {
    if (entry.status === 'done' || entry.status === 'hatched') return;

    const days = daysToHatch(entry.expectedHatchDate);

    // Lock-down امروز
    const entryDate = jalaliDate(entry.entryDate);
    const age = entryDate ? diffCalDays(startOfDay(new Date()), entryDate) : 0;

    if (age === 18) {
      alerts.push({
        level: 'important',
        category: 'reproduction',
        title: '🔒 Lock-down امروز',
        message: toFa(entry.count || 0) + ' تخم — چرخش قطع، رطوبت بالا',
        source: 'inc',
        sourceId: entry.id + ':lockdown',
        date: today(), notes: ''
      });
    }

    if (isHatchWindow(entry)) {
      alerts.push({
        level: 'critical',
        category: 'reproduction',
        title: '🐣 پنجره هچ باز است',
        message: toFa(entry.count || 0) + ' تخم — ' + (days <= 0 ? 'امروز' : toFa(days) + ' روز تا هچ'),
        source: 'inc',
        sourceId: entry.id + ':hatch-window',
        date: today(), notes: ''
      });
    } else if (days > 0 && days <= 3) {
      alerts.push({
        level: 'info',
        category: 'reproduction',
        title: '📅 نزدیک هچ',
        message: toFa(days) + ' روز تا هچ ' + toFa(entry.count || 0) + ' تخم',
        source: 'inc',
        sourceId: entry.id + ':hatch-near',
        date: today(), notes: ''
      });
    }
  });

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
