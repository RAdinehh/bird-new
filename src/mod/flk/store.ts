import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuid } from 'uuid';
import { parse, differenceInDays } from 'date-fns-jalali';
import { toEn } from '../../shr/utils/fa';

export type FlockType = 'layer' | 'broiler' | 'breeder';
export type FlockStatus = 'active' | 'archived' | 'sold' | 'merged';

export type FlockEventType = 'add' | 'sell' | 'death' | 'transfer';
export type FlockEventSex = 'male' | 'female' | 'mixed';

export interface FlockEvent {
  id: string;
  flockId: string;
  date: string;
  type: FlockEventType;
  count: number;
  sex: FlockEventSex;
  origin?: 'purchase' | 'hatch' | 'transfer';
  buyerId?: string;
  reason?: string;
  unitPrice?: number;
  totalPrice?: number;
  invoiceId?: string;
  hatchId?: string;
  notes: string;
  createdAt: string;
}

export interface FlockMergeSource {
  flockId: string;
  flockName: string;
  count: number;
  ageDays: number;
}

export interface FlockMergeInfo {
  sources: FlockMergeSource[];
  avgAgeDays: number;
  mergedAt: string;
}

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
  endOfCycleDay: number | null; // سن پایان چرخه (از استاندارد نژاد لحظه ساخت)
    vaccineScheduleId: string; // شناسه قالب واکسن (اختیاری)
  hatchDate: string;      // تاریخ هچ (اگر از جوجه‌کشی خودت)
  purchaseDate: string;   // تاریخ خرید
  startDate: string;      // تاریخ شروع نگهداری
  source: string;
  purchasePrice: number | null;    // قیمت هر پرنده
  deliveryCost: number | null;     // هزینه حمل
  otherCosts: number | null;       // سایر هزینه‌ها
  status: FlockStatus;
  notes: string;
  /** رویدادهای دستی گله */
  events?: FlockEvent[];
  mergedInto?: string;
  mergedInfo?: FlockMergeInfo;
  createdAt: string;
  updatedAt: string;
}

interface State {
  flocks: Flock[];
  addEvent: (flockId: string, ev: Omit<FlockEvent, 'id'|'flockId'|'createdAt'>) => void;
  removeEvent: (flockId: string, eventId: string) => void;
  mergeFlocks: (targetId: string, sourceId: string, opts: { targetAgeDays: number; sourceAgeDays: number; hatchDate?: string }) => void;
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
      archive: (id) => set({ flocks: get().flocks.map(x => x.id === id ? {...x, status: 'archived', updatedAt: now()} : x) }),
      restore: (id) => set({ flocks: get().flocks.map(x => x.id === id ? {...x, status: 'active', updatedAt: now()} : x) }),

      addEvent: (flockId, ev) => set({
        flocks: get().flocks.map(f => {
          if (f.id !== flockId) return f;
          const newEvent: FlockEvent = { ...ev, id: uuid(), flockId, createdAt: now() };
          return { ...f, events: [...(f.events || []), newEvent], updatedAt: now() };
        })
      }),
      removeEvent: (flockId, eventId) => set({
        flocks: get().flocks.map(f =>
          f.id === flockId
            ? { ...f, events: (f.events || []).filter(e => e.id !== eventId), updatedAt: now() }
            : f
        )
      }),
      mergeFlocks: (targetId, sourceId, opts) => set({
        flocks: get().flocks.map(f => {
          if (f.id === sourceId) {
            return {
              ...f,
              status: 'merged' as FlockStatus,
              mergedInto: targetId,
              currentCount: 0,
              updatedAt: now(),
            };
          }
          if (f.id !== targetId) return f;
          const target = f;
          const source = get().flocks.find(x => x.id === sourceId);
          if (!source) return f;
          const targetSources = target.mergedInfo?.sources || [{
            flockId: target.id,
            flockName: target.name,
            count: target.currentCount || 0,
            ageDays: opts.targetAgeDays,
          }];
          const newSources = [...targetSources, {
            flockId: source.id,
            flockName: source.name,
            count: source.currentCount || 0,
            ageDays: opts.sourceAgeDays,
          }];
          const totalCount = newSources.reduce((s, x) => s + x.count, 0);
          const weightedAge = newSources.reduce((s, x) => s + x.count * x.ageDays, 0);
          const avgAgeDays = totalCount > 0 ? Math.round((weightedAge / totalCount) * 10) / 10 : 0;
          return {
            ...target,
            initialCount: (target.initialCount || 0) + (source.initialCount || 0),
            currentCount: (target.currentCount || 0) + (source.currentCount || 0),
            hatchDate: opts.hatchDate || target.hatchDate,
            mergedInfo: { sources: newSources, avgAgeDays, mergedAt: now() },
            updatedAt: now(),
          };
        }),
      })
    }),
    { name: 'pm-flk' }
  )
);

export const TYPE_LABEL: Record<FlockType, string> = { layer: 'تخم‌گذار', broiler: 'گوشتی', breeder: 'مادر' };
export const STATUS_LABEL: Record<FlockStatus, string> = { active: 'فعال', archived: 'آرشیو', sold: 'فروخته‌شده', merged: 'ادغام‌شده' };
export const SOURCE_LABEL: Record<string, string> = { purchase: 'خریداری', hatch: 'جوجه‌کشی خودم' };

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
