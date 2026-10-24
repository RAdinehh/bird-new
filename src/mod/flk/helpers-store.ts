/**
 * helpers-store.ts — برچسب‌ها و توابع کمکی flk
 * جدا شده از store.ts
 */
import { toFa, toEn } from '../../shr/utils/fa';
import { parse, differenceInDays, differenceInCalendarDays } from 'date-fns-jalali';
import { todayJ } from './api/flocksCalc';
import type { Flock, FlockType, FlockStatus, FlockGroupRule } from './store';
import { useTra } from '../tra/store';

export const TYPE_LABEL: Record<FlockType, string> = { layer: 'تخم‌گذار', broiler: 'گوشتی', breeder: 'مادر' };
export const STATUS_LABEL: Record<FlockStatus, string> = { active: 'فعال', archived: 'آرشیو', sold: 'فروخته‌شده', merged: 'ادغام‌شده' };
export const SOURCE_LABEL: Record<string, string> = { purchase: 'خریداری', hatch: 'جوجه‌کشی خودم' };

export const EVENT_LABEL: Record<string, string> = {
  add: 'افزودن', sell: 'فروش', death: 'تلفات',
  transfer: 'انتقال', correction: 'اصلاح', cull: 'حذف',
};

export function toJalali(iso: string): string {
  if (!iso) return '';
  if (/^\d{4}\/\d{2}\/\d{2}/.test(iso)) return iso;
  try {
    const d = new Date(iso);
    const parts = new Intl.DateTimeFormat('en-u-ca-persian-nu-latn', { year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(d);
    const y = parts.find(p => p.type === 'year')?.value || '';
    const m = parts.find(p => p.type === 'month')?.value || '';
    const dd = parts.find(p => p.type === 'day')?.value || '';
    return y + '/' + m + '/' + dd;
  } catch { return iso; }
}

export function jalaliToDate(s: string): Date | null {
  if (!s) return null;
  const en = toEn(s).replace(/\//g, '/');
  const parts = en.split('/').map(p => parseInt(p));
  if (parts.length !== 3 || parts.some(isNaN)) return null;
  try {
    const d = parse(`${parts[0]}/${String(parts[1]).padStart(2,'0')}/${String(parts[2]).padStart(2,'0')}`, 'yyyy/MM/dd', new Date());
    if (isNaN(d.getTime())) return null;
    return d;
  } catch { return null; }
}

/** تاریخ مؤثر برای محاسبه سن — هچ، اگر نبود خرید، اگر نبود شروع */
export function getEffectiveStartDate(f: Flock): string {
  return f.hatchDate || f.purchaseDate || f.startDate;
}

export function getAgeDays(f: Flock): number {
  const d = jalaliToDate(getEffectiveStartDate(f));
  if (!d) return 0;
  return Math.max(0, differenceInDays(new Date(), d));
}

export function matchesGroupRule(flock: Flock, rule: FlockGroupRule): boolean {
  if (rule.type && flock.type !== rule.type) return false;
  if (rule.status && flock.status !== rule.status) return false;
  if (rule.hallId && flock.hallId !== rule.hallId) return false;
  if (rule.breedId && flock.breedId !== rule.breedId) return false;
  if (rule.birdId && flock.birdId !== rule.birdId) return false;
  if (rule.source && flock.source !== rule.source) return false;
  if (rule.dealType && flock.dealType !== rule.dealType) return false;
  if (rule.minAge !== undefined || rule.maxAge !== undefined) {
    const age = getAgeDays(flock);
    if (rule.minAge !== undefined && age < rule.minAge) return false;
    if (rule.maxAge !== undefined && age > rule.maxAge) return false;
  }
  return true;
}

export interface Lifecycle {
  stage: string; label: string;
  color: 'blue' | 'amber' | 'green' | 'gray';
  progress: number;
}

export function getLifecycle(
  type: FlockType,
  ageDays: number,
  endOfCycleDay?: number | null,
  birdCycleDays?: number | null,
  layingStartDay?: number | null,
): Lifecycle {
  // 🆕 fallback برای type نامعتبر (legacy/import)
  if (type !== 'layer' && type !== 'broiler' && type !== 'breeder') {
    type = 'layer';
  }

  // اولویت: endOfCycleDay گله > cycleDays پرنده > پیش‌فرض صنعتی
  const cycle =
    (endOfCycleDay && endOfCycleDay > 0) ? endOfCycleDay :
    (birdCycleDays && birdCycleDays > 0) ? birdCycleDays :
    (type === 'broiler' ? 42 : 700);
  const p = (ageDays / cycle) * 100;

  if (type === 'broiler') {
    if (ageDays <= 7) return { stage: 'chick', label: 'دوره آغازین', color: 'blue', progress: p };
    if (ageDays <= 21) return { stage: 'growing', label: 'دوره رشد', color: 'blue', progress: p };
    if (ageDays <= cycle) return { stage: 'finisher', label: 'دوره پایانی', color: 'amber', progress: p };
    return { stage: 'end', label: 'پایان دوره', color: 'gray', progress: 100 };
  }

  const start = layingStartDay && layingStartDay > 0 ? layingStartDay : 140;
  if (ageDays <= 28) return { stage: 'chick', label: 'جوجه', color: 'green', progress: p };
  if (ageDays <= start - 14) return { stage: 'grower', label: 'نیمچه', color: 'blue', progress: p };
  if (ageDays <= start) return { stage: 'prelayer', label: 'پیش‌تخم‌گذار', color: 'amber', progress: p };
  if (ageDays <= cycle) return { stage: 'layer', label: 'تخم‌گذار', color: 'green', progress: p };
  return { stage: 'end', label: 'پایان دوره', color: 'gray', progress: 100 };
}

export function formatAge(days: number): string {
  if (days < 7) return `${days} روز`;
  if (days < 30) return `${Math.floor(days / 7)} هفته`;
  if (days < 365) return `${Math.floor(days / 30)} ماه`;
  return `${Math.floor(days / 365)} سال`;
}

export function sexRatio(male: number | null, female: number | null): string {
  if (male == null || female == null) return '—';
  if (male === 0 && female === 0) return '—';
  if (male === 0) return `۰ : ${toFa(String(female))}`;
  if (female === 0) return `${toFa(String(male))} : ۰`;
  const r = female / male;
  if (r >= 1) {
    const rounded = r >= 10 ? Math.round(r) : Number(r.toFixed(1));
    return `${toFa('1')} : ${toFa(String(rounded))}`;
  }
  const inv = male / female;
  const rounded = inv >= 10 ? Math.round(inv) : Number(inv.toFixed(1));
  return `${toFa(String(rounded))} : ${toFa('1')}`;
}

/** سن پیش‌فرض تخم‌گذاری (اگه استاندارد نژاد موجود نبود) — استاندارد ایران */
export const DEFAULT_LAYING_START = 150;

/** سن شروع تخم‌گذاری این گله — اگر کاربر پر کرده، آن، وگرنه پیش‌فرض */
export function getLayingStartDay(f: Flock, fallback = DEFAULT_LAYING_START): number {
  if (f.layingStartDay && f.layingStartDay > 0) return f.layingStartDay;
  return fallback;
}

export function isLayingReady(f: Flock): boolean {
  if (f.type !== 'layer' && f.type !== 'breeder') return true;
  return getAgeDays(f) >= getLayingStartDay(f);
}

export function daysUntilLaying(f: Flock): number {
  if (f.type !== 'layer' && f.type !== 'breeder') return 0;
  return Math.max(0, getLayingStartDay(f) - getAgeDays(f));
}

function _toEnDigits(s: string): string {
  return s.replace(/[۰-۹]/g, d => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)));
}

function _daysBetween(start: string, end: string): number {
  if (!start || !end) return 0;
  try {
    const s = parse(_toEnDigits(start), 'yyyy/MM/dd', new Date());
    const e = parse(_toEnDigits(end), 'yyyy/MM/dd', new Date());
    if (isNaN(s.getTime()) || isNaN(e.getTime())) return 0;
    return Math.max(0, differenceInDays(e, s));
  } catch { return 0; }
}

export interface RentAccrual {
  owed: number;
  paid: number;
  outstanding: number;
  daysElapsed: number;
  totalDays: number;
  isActive: boolean;
}

/** محاسبه اجاره انباشته (Owed) بر اساس روزهای سپری‌شده */
export function calcRentAccrual(f: Flock): RentAccrual {
  const zero: RentAccrual = { owed: 0, paid: 0, outstanding: 0, daysElapsed: 0, totalDays: 0, isActive: false };
  if ((f as any).dealType !== 'rent') return zero;

  const dd = (f as any).dealData || {};
  const rentAmount = Number(dd.rentAmount) || 0;
  if (rentAmount <= 0) return zero;

  const period: 'monthly' | 'season' | 'total' = dd.rentPeriod || 'monthly';
  const startDate = dd.rentStartDate || f.startDate || f.purchaseDate || '';
  const endDate = dd.rentEndDate || '';

  const isActive = f.status === 'active';
  const effectiveEnd = f.status === 'active' ? todayJ() : (f.endDate || todayJ());

  if (!startDate) return zero;

  const daysElapsed = _daysBetween(startDate, effectiveEnd);
  let owed = 0;
  let totalDays = daysElapsed;

  if (period === 'total') {
    if (endDate) {
      totalDays = _daysBetween(startDate, endDate);
      owed = totalDays > 0 ? Math.round(rentAmount * Math.min(daysElapsed, totalDays) / totalDays) : rentAmount;
    } else {
      owed = rentAmount;
    }
  } else {
    const periodDays = period === 'season' ? 90 : 30;
    owed = rentAmount * Math.floor(daysElapsed / periodDays);
  }

  const paid = (dd.rentPayments || []).reduce((a: number, p: any) => a + (Number(p.amount) || 0), 0);
  const outstanding = Math.max(0, owed - paid);

  return { owed, paid, outstanding, daysElapsed, totalDays, isActive };
}

/** محاسبه‌ی هزینه‌ها — شامل هزینه‌های عملیاتی (دان، دارو، داروی گیاهی، واکسن) */
export function calcCosts(f: Flock) {
  const birdCost = (f.initialCount || 0) * (f.purchasePrice || 0);
  const delivery = f.deliveryCost || 0;
  const other = f.otherCosts || 0;
  const purchaseTotal = birdCost + delivery + other;

  const rentInfo = calcRentAccrual(f);
  const rentOwed = rentInfo.owed;
  const rentPaid = rentInfo.paid;

  // 🆕 هزینه‌های عملیاتی از فاکتورهای مرتبط با این گله
  const opBreakdown = { feed: 0, medicine: 0, herbal: 0, vaccine: 0 };
  let operationalCost = 0;
  try {
    const invoices = useTra.getState().invoices || [];
    for (const inv of invoices as any[]) {
      if (inv.type !== 'purchase') continue;
      const relatedFlockId = inv.relatedFlockId || '';
      for (const it of inv.items || []) {
        const isRelated = (it.flockId && it.flockId === f.id) || relatedFlockId === f.id;
        if (!isRelated) continue;
        const cat = it.category || inv.category;
        if (!(cat in opBreakdown)) continue;
        const amt = Number(it.total) || 0;
        (opBreakdown as any)[cat] += amt;
        operationalCost += amt;
      }
    }
  } catch (e) {
    console.error('[calcCosts] opCost failed:', e);
  }

  const grandTotalOwed = purchaseTotal + rentOwed + operationalCost;
  const grandTotalPaid = purchaseTotal + rentPaid;
  const perBird = f.initialCount ? purchaseTotal / f.initialCount : 0;
  const perBirdGrand = f.initialCount ? grandTotalOwed / f.initialCount : 0;

  return {
    birdCost, delivery, other,
    total: purchaseTotal,       // backward-compat
    purchaseTotal,
    rentOwed,
    rentPaid,
    rentInfo,
    operationalCost,            // 🆕
    opBreakdown,                // 🆕
    grandTotalOwed,
    grandTotalPaid,
    perBird,
    perBirdGrand,
  };
}

