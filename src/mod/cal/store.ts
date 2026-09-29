import { useInc, daysToHatch, isLockdown, isHatchWindow } from '../inc/store';
import { useDlg } from '../dlg/store';
import { useTra, remaining } from '../tra/store';
import { useWhs, expiryWarning, daysToExpiry } from '../whs/store';
import { useBrd } from '../brd/store';
import { useFlk, getEffectiveStartDate } from '../flk/store';
import { getSchedule } from './vaccineSchedules';
import { toEn } from '../../shr/utils/fa';
import { format, parse, differenceInDays } from 'date-fns-jalali';

export type EventType = 'hatch' | 'vaccine' | 'payment' | 'daily' | 'finance';
export type EventStatus = 'past' | 'today' | 'future' | 'overdue';

export interface CalEvent {
  id: string;
  date: string;       // 1405/07/15
  type: EventType;
  title: string;
  subtitle: string;
  status: EventStatus;
  icon: string;
  refId: string;
}

/** تاریخ امروز شمسی */
export function todayJalali(): string {
  return format(new Date(), 'yyyy/MM/dd');
}

/** تبدیل شمسی به Date */
export function jalaliToDate(s: string): Date | null {
  if (s === '' || s == null) return null;
  try {
    const d = parse(toEn(s), 'yyyy/MM/dd', new Date());
    return isNaN(d.getTime()) ? null : d;
  } catch { return null; }
}

/** تاریخ شمسی → ISO برای مقایسه */
export function jalaliToKey(s: string): string {
  if (s === '' || s == null) return '';
  const p = toEn(s).split('/');
  if (p.length !== 3) return '';
  return p[0] + String(p[1]).padStart(2, '0') + String(p[2]).padStart(2, '0');
}

/** اختلاف روز از امروز */
export function daysFromToday(s: string): number {
  const d = jalaliToDate(s);
  if (d === null) return 999;
  return differenceInDays(d, new Date());
}

/** تعیین وضعیت */
export function statusOf(date: string): EventStatus {
  const diff = daysFromToday(date);
  if (diff < 0) return 'past';
  if (diff === 0) return 'today';
  if (diff <= 30) return 'future';
  return 'future';
}


/** اضافه n روز به تاریخ شمسی */
function addDaysJalali(dateStr: string, days: number): string {
  const d = jalaliToDate(dateStr);
  if (!d) return '';
  d.setDate(d.getDate() + days);
  return format(d, 'yyyy/MM/dd');
}

/** جمع‌آوری همه‌ی رویدادها از همه‌ی storeها */
export function collectEvents(): CalEvent[] {
  const events: CalEvent[] = [];
  const today = todayJalali();

  // ============ ۱. جوجه‌کشی ============
  try {
    const eggEntries = useInc.getState().eggEntries || [];
    const birds = useBrd.getState().birds || [];

    eggEntries.forEach(entry => {
      if (entry.status === 'done' || entry.status === 'hatched') return;

      const bird = birds.find((b: any) => b.id === entry.birdId);
      const birdName = bird ? bird.name : '—';
      const days = daysToHatch(entry.expectedHatchDate);

      // هچ نهایی
      if (days >= 0) {
        events.push({
          id: 'hatch-' + entry.id,
          date: entry.expectedHatchDate,
          type: 'hatch',
          title: 'هچ ' + birdName,
          subtitle: (entry.count || 0) + ' تخم — ' + days + ' روز مانده',
          status: days === 0 ? 'today' : (days < 0 ? 'past' : 'future'),
          icon: '🐣',
          refId: entry.id
        });
      }

      // پنجره‌ی هچ (۲ روز قبل)
      if (days <= 2 && days >= 0) {
        const wd = new Date();
        wd.setDate(wd.getDate() + (days - 2));
        const wdStr = wd.getFullYear() + '/' + String(wd.getMonth() + 1).padStart(2, '0') + '/' + String(wd.getDate()).padStart(2, '0');
        events.push({
          id: 'hatchwin-' + entry.id,
          date: wdStr,
          type: 'hatch',
          title: '🐣 پنجره‌ی هچ',
          subtitle: (entry.count || 0) + ' تخم',
          status: 'today',
          icon: '🐣',
          refId: entry.id
        });
      }

      // Lock-down (روز ۱۸)
      const age = daysToHatch(entry.entryDate) * -1;
      if (age === 18) {
        events.push({
          id: 'lock-' + entry.id,
          date: today,
          type: 'hatch',
          title: '🔒 Lock-down',
          subtitle: (entry.count || 0) + ' تخم — چرخش قطع',
          status: 'today',
          icon: '🔒',
          refId: entry.id
        });
      }
    });
  } catch (e) { /* ignore */ }

  // ============ ۲. واکسن و دارو ============
  try {
    const logs = useDlg.getState().logs || [];
    logs.forEach((log: any) => {
      const vaccines = log.vaccines || [];
      vaccines.forEach((v: any, i: number) => {
        if (v.name) {
          events.push({
            id: 'vac-' + log.id + '-' + i,
            date: log.date,
            type: 'vaccine',
            title: '💉 ' + v.name,
            subtitle: (v.dose || '') + ' — ' + (v.method || ''),
            status: statusOf(log.date),
            icon: '💉',
            refId: log.id
          });
        }
      });
    });

    // واکسن‌های انبار نزدیک انقضا
    const whsItems = useWhs.getState().items || [];
    whsItems.forEach((item: any) => {
      if ((item.category === 'vaccine' || item.category === 'medicine') && item.expireDate) {
        const days = daysToExpiry(item.expireDate);
        if (days !== null && days >= 0) {
          events.push({
            id: 'vac-exp-' + item.id,
            date: item.expireDate,
            type: 'vaccine',
            title: '⏰ انقضای ' + item.name,
            subtitle: days + ' روز مانده',
            status: days <= 30 ? 'today' : 'future',
            icon: '⏰',
            refId: item.id
          });
        }
      }
    });
  } catch (e) { /* ignore */ }

  // ============ ۳. مالی — سرسید ============
  try {
    const invoices = useTra.getState().invoices || [];
    invoices.forEach((inv: any) => {
      const rem = remaining(inv);
      if (rem > 0) {
        // سرسید
        if (inv.dueDate) {
          events.push({
            id: 'due-' + inv.id,
            date: inv.dueDate,
            type: 'payment',
            title: inv.type === 'sale' ? '📥 دریافت از مشتری' : '📤 پرداخت به فروشنده',
            subtitle: rem.toLocaleString('fa-IR') + ' ت — فاکتور ' + (inv.number || '—'),
            status: daysFromToday(inv.dueDate) < 0 ? 'overdue' : statusOf(inv.dueDate),
            icon: '💰',
            refId: inv.id
          });
        }

        // چک‌ها
        const payments = inv.payments || [];
        payments.forEach((p: any) => {
          if (p.method === 'check' && p.dueDate) {
            events.push({
              id: 'check-' + inv.id + '-' + p.id,
              date: p.dueDate,
              type: 'payment',
              title: '🏦 سرسید چک',
              subtitle: p.amount.toLocaleString('fa-IR') + ' ت' + (p.bank ? ' — ' + p.bank : ''),
              status: daysFromToday(p.dueDate) < 0 ? 'overdue' : statusOf(p.dueDate),
              icon: '🏦',
              refId: inv.id
            });
          }
        });
      }
    });
  } catch (e) { /* ignore */ }

  // ============ ۴. کار روزانه — پیش‌فرض ============
  // اگر ثبت روزانه امروز انجام نشده، یادآور
  try {
    const logs = useDlg.getState().logs || [];
    const hasToday = logs.some((l: any) => l.date === today);
    if (!hasToday) {
      events.push({
        id: 'daily-' + today,
        date: today,
        type: 'daily',
        title: '📋 ثبت روزانه امروز',
        subtitle: 'ثبت نشده — یادآور',
        status: 'today',
        icon: '📋',
        refId: today
      });
    }
  } catch (e) { /* ignore */ }

  // ============ ۵. رویدادهای دستی کاربر ============
  try {
    const manualRaw = localStorage.getItem('pm-cal-manual');
    if (manualRaw) {
      const parsed = JSON.parse(manualRaw);
      const manual = (parsed.state && parsed.state.events) || [];
      manual.forEach((m: any) => {
        if (m.done) return; // انجام‌شده‌ها را نشان نده

        events.push({
          id: 'manual-' + m.id,
          date: m.date,
          type: m.type || 'daily',
          title: m.title,
          subtitle: (m.time ? '⏰ ' + m.time + ' — ' : '') + (m.notes || 'رویداد دستی'),
          status: statusOf(m.date),
          icon: '📌',
          refId: m.id
        });
      });
    }
  } catch (e) { /* ignore */ }

  // مرتب‌سازی بر اساس تاریخ
  events.sort((a, b) => jalaliToKey(a.date).localeCompare(jalaliToKey(b.date)));


  // ============ ۵. واکسن‌های قالب گله ============
  try {
    const flocks = useFlk.getState().flocks || [];
    flocks.forEach((flock: any) => {
      if (flock.status !== 'active') return;
      if (!flock.vaccineScheduleId) return;

      const schedule = getSchedule(flock.vaccineScheduleId);
      if (!schedule) return;

      const startDate = getEffectiveStartDate(flock);
      if (!startDate) return;

      schedule.items.forEach((item, idx) => {
        const date = addDaysJalali(startDate, item.day);
        if (!date) return;
        const diff = daysFromToday(date);
        // فقط رویدادهای آینده یا ۱۴ روز گذشته
        if (diff < -14) return;

        events.push({
          id: 'vac-sched-' + flock.id + '-' + idx,
          date,
          type: 'vaccine',
          title: '💉 ' + item.name,
          subtitle: flock.name + ' — روز ' + item.day + ' · ' + item.method,
          status: diff < 0 ? 'past' : diff === 0 ? 'today' : 'future',
          icon: '💉',
          refId: flock.id,
        });
      });
    });
  } catch (e) { /* ignore */ }

  return events;
}

/** رویدادهای یک روز خاص */
export function eventsOfDay(all: CalEvent[], date: string): CalEvent[] {
  const key = jalaliToKey(date);
  return all.filter(e => jalaliToKey(e.date) === key);
}

/** رنگ هر نوع رویداد */
export const TYPE_COLORS: Record<EventType, { dot: string; bg: string; text: string }> = {
  hatch:   { dot: 'var(--purple)', bg: 'var(--purple-soft)', text: 'var(--purple)' },
  vaccine: { dot: 'var(--info)',   bg: 'var(--info-soft)',   text: 'var(--info)' },
  payment: { dot: 'var(--warn)',   bg: 'var(--warn-soft)',   text: 'var(--warn)' },
  daily:   { dot: 'var(--accent)', bg: 'var(--accent-soft)', text: 'var(--accent)' },
  finance: { dot: 'var(--danger)', bg: 'var(--danger-soft)', text: 'var(--danger)' }
};

export const TYPE_LABELS: Record<EventType, string> = {
  hatch: 'جوجه‌کشی',
  vaccine: 'واکسن',
  payment: 'مالی',
  daily: 'روزانه',
  finance: 'سایر'
};
