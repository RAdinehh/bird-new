import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuid } from 'uuid';
import { parse, differenceInDays } from 'date-fns-jalali';
import { toEn } from '../../shr/utils/fa';

export type FlockType = 'layer' | 'broiler' | 'breeder';
export type FlockStatus = 'active' | 'archived' | 'sold';

export interface Flock {
  id: string;
  name: string;
  type: FlockType;
  birdId: string;
  breedId: string;
  hallId: string;
  zoneId: string;
  initialCount: number | null;
  currentCount: number | null;
  maleCount: number | null;
  femaleCount: number | null;
  layingStartDay: number; // سن شروع تخم‌گذاری (روز) — قابل ویرایش کاربر
  vaccineScheduleId: string; // شناسه قالب واکسن (اختیاری)
  hatchDate: string;      // تاریخ هچ (اگر از جوجه‌کشی خودت)
  purchaseDate: string;   // تاریخ خرید
  startDate: string;      // تاریخ شروع نگهداری
  endDate: string;
  source: string;
  purchasePrice: number | null;    // قیمت هر پرنده
  deliveryCost: number | null;     // هزینه حمل
  otherCosts: number | null;       // سایر هزینه‌ها
  status: FlockStatus;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

interface State {
  flocks: Flock[];
  add: (f: Omit<Flock, 'id'|'createdAt'|'updatedAt'>) => void;
  update: (id: string, patch: Partial<Flock>) => void;
  remove: (id: string) => void;
  archive: (id: string) => void;
  restore: (id: string) => void;
}

const now = () => new Date().toISOString();

export const useFlk = create<State>()(
  persist(
    (set, get) => ({
      flocks: [],
      add: (f) => set({ flocks: [...get().flocks, {...f, id: uuid(), createdAt: now(), updatedAt: now()}] }),
      update: (id, patch) => set({ flocks: get().flocks.map(x => x.id === id ? {...x, ...patch, updatedAt: now()} : x) }),
      remove: (id) => set({ flocks: get().flocks.filter(x => x.id !== id) }),
      archive: (id) => set({ flocks: get().flocks.map(x => x.id === id ? {...x, status: 'archived', endDate: new Date().toISOString().slice(0,10), updatedAt: now()} : x) }),
      restore: (id) => set({ flocks: get().flocks.map(x => x.id === id ? {...x, status: 'active', endDate: '', updatedAt: now()} : x) })
    }),
    { name: 'pm-flk' }
  )
);

export const TYPE_LABEL: Record<FlockType, string> = { layer: 'تخم‌گذار', broiler: 'گوشتی', breeder: 'مادر' };
export const STATUS_LABEL: Record<FlockStatus, string> = { active: 'فعال', archived: 'آرشیو', sold: 'فروخته‌شده' };
export const SOURCE_LABEL: Record<string, string> = { purchase: 'خریداری', hatch: 'جوجه‌کشی خودم', previous: 'گله‌ی قبلی' };

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

export interface Lifecycle {
  stage: string; label: string;
  color: 'blue' | 'amber' | 'green' | 'gray';
  progress: number;
}

export function getLifecycle(type: FlockType, ageDays: number, endOfCycleDay?: number | null): Lifecycle {
  const cycle = endOfCycleDay && endOfCycleDay > 0 ? endOfCycleDay : (type === 'broiler' ? 42 : 500);
  const p = (ageDays / cycle) * 100;

  if (type === 'broiler') {
    if (ageDays <= 7) return { stage: 'chick', label: 'جوجه یک‌روزه', color: 'blue', progress: p };
    if (ageDays <= 21) return { stage: 'growing', label: 'رشد سریع', color: 'blue', progress: p };
    if (ageDays <= cycle) return { stage: 'finisher', label: 'فینیشر', color: 'amber', progress: p };
    return { stage: 'end', label: 'پایان دوره', color: 'gray', progress: 100 };
  }

  if (ageDays <= 7) return { stage: 'chick1', label: 'جوجه یک‌روزه', color: 'blue', progress: p };
  if (ageDays <= 28) return { stage: 'chick2', label: 'جوجه نوزاد', color: 'blue', progress: p };
  if (ageDays <= 70) return { stage: 'growing', label: 'در حال رشد', color: 'blue', progress: p };
  if (ageDays <= 120) return { stage: 'grower', label: 'گروور', color: 'amber', progress: p };
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

/** آیا گله آماده تخم‌گذاری است؟ (۱۴۰ روز برای تخم‌گذار) */
export const LAYING_START_DAY = 140;

/** سن شروع تخم‌گذاری این گله — اگر کاربر پر کرده، آن، وگرنه پیش‌فرض */
export function getLayingStartDay(f: Flock, fallback = LAYING_START_DAY): number {
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
