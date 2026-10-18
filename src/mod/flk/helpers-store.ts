/**
 * helpers-store.ts — برچسب‌ها و توابع کمکی flk
 * جدا شده از store.ts
 */
import { toEn } from '../../shr/utils/fa';
import { parse, differenceInDays, differenceInCalendarDays } from 'date-fns-jalali';
import type { Flock, FlockType, FlockStatus, FlockGroupRule } from './store';

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

  if (ageDays <= 7) return { stage: 'chick1', label: 'جوجه', color: 'blue', progress: p };
  if (ageDays <= 90) return { stage: 'chick2', label: 'نیمچه', color: 'blue', progress: p };
  if (ageDays <= 120) return { stage: 'grower', label: 'پولت', color: 'amber', progress: p };
  if (ageDays <= 140) return { stage: 'prelayer', label: 'پیش‌تخم‌گذار', color: 'amber', progress: p };
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
  if (!male || !female) return '—';
  const r = female / male;
  return `۱ به ${r.toFixed(1)}`;
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

/** محاسبه‌ی هزینه‌ها */
export function calcCosts(f: Flock) {
  const birdCost = (f.initialCount || 0) * (f.purchasePrice || 0);
  const delivery = f.deliveryCost || 0;
  const other = f.otherCosts || 0;
  const total = birdCost + delivery + other;
  const perBird = f.initialCount ? total / f.initialCount : 0;
  return { birdCost, delivery, other, total, perBird };
}

