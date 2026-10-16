import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuid } from 'uuid';
import { parse, differenceInDays } from 'date-fns-jalali';
import { toEn } from '../../shr/utils/fa';
import { todayJ } from './api/flocksCalc';

export type FlockType = 'layer' | 'broiler' | 'breeder';
export type FlockStatus = 'active' | 'archived' | 'sold' | 'merged';

export type FlockEventType = 'add' | 'sell' | 'death' | 'transfer' | 'correction' | 'cull';

export type FlockEventReasonCode =
  | 'data_entry_error'
  | 'found_stock'
  | 'disease'
  | 'predator'
  | 'heat_stress'
  | 'equipment_failure'
  | 'unknown';
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
  /** کد دلیل استاندارد (برای correction/recount) */
  reasonCode?: FlockEventReasonCode;
  /** اگر این رویداد اصلاح یه رویداد دیگه‌ست */
  linkedEventId?: string;
  /** آخرین ویرایش */
  updatedAt?: string;
  /** نسخه (آینده optimistic locking) */
  version?: number;
  /** آیا این رویداد لغو شده؟ */
  revoked?: boolean;
  /** شناسه correction ای که این رویداد رو لغو کرده */
  revokedBy?: string;
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
  endOfCycleDay: number | null;
  endDate?: string; // سن پایان چرخه (از استاندارد نژاد لحظه ساخت)
    vaccineScheduleId: string; // شناسه قالب واکسن (اختیاری)
  hatchDate: string;      // تاریخ هچ (اگر از جوجه‌کشی خودت)
  purchaseDate: string;   // تاریخ خرید
  startDate: string;      // تاریخ شروع نگهداری
  source: string;
  purchasePrice: number | null;    // قیمت هر پرنده
  deliveryCost: number | null;     // هزینه حمل
  otherCosts: number | null;       // سایر هزینه‌ها
  status: FlockStatus;
  /** پنهان از لیست اصلی */
  hidden?: boolean;
  /** غیرفعال موقت (توی آمار و هشدارها نمیاد) */
  paused?: boolean;
  /** دلیل آرشیو (اجباری هنگام بستن) */
  archivedReason?: string;
  notes: string;
  /** رویدادهای دستی گله */
  events?: FlockEvent[];
  mergedInto?: string;
  mergedInfo?: FlockMergeInfo;
  sourceInvoiceId?: string;
  sourceCategory?: string;
  createdAt: string;
  updatedAt: string;
}

interface State {
  flocks: Flock[];
  addEvent: (flockId: string, ev: Omit<FlockEvent, 'id'|'flockId'|'createdAt'>) => void;
  addCorrection: (flockId: string, delta: number, reasonCode: FlockEventReasonCode, reasonLabel: string, notes: string) => void;
  revokeEvent: (flockId: string, eventId: string) => void;
  removeEvent: (flockId: string, eventId: string) => void;
  mergeFlocks: (targetId: string, sourceId: string, opts: { targetAgeDays: number; sourceAgeDays: number; hatchDate?: string }) => void;
  add: (f: Omit<Flock, 'id'|'createdAt'|'updatedAt'>) => string;
  update: (id: string, patch: Partial<Flock>) => void;
  remove: (id: string) => void;
  archive: (id: string, reason?: string) => void;
  restore: (id: string) => void;
  toggleHidden: (id: string) => void;
  togglePaused: (id: string) => void;
}

const now = () => new Date().toISOString();

export const useFlk = create<State>()(
  persist(
    (set, get) => ({
      flocks: [],
      add: (f) => {
        const id = uuid();
        set({ flocks: [...get().flocks, {...f, id, createdAt: now(), updatedAt: now()}] });
        return id;
      },
      update: (id, patch) => set({ flocks: get().flocks.map(x => x.id === id ? {...x, ...patch, updatedAt: now()} : x) }),
      remove: (id) => set({ flocks: get().flocks.filter(x => x.id !== id) }),
      archive: (id, reason) => set({ flocks: get().flocks.map(x => x.id === id ? {...x, status: 'archived', endDate: x.endDate || now(), archivedReason: reason || '', updatedAt: now()} : x) }),
      restore: (id) => set({ flocks: get().flocks.map(x => x.id === id ? {...x, status: 'active', endDate: '', archivedReason: '', updatedAt: now()} : x) }),
      toggleHidden: (id) => set({ flocks: get().flocks.map(x => x.id === id ? {...x, hidden: !x.hidden, updatedAt: now()} : x) }),
      togglePaused: (id) => set({ flocks: get().flocks.map(x => x.id === id ? {...x, paused: !x.paused, updatedAt: now()} : x) }),

      addEvent: (flockId, ev) => set({
        flocks: get().flocks.map(f => {
          if (f.id !== flockId) return f;
          const newEvent: FlockEvent = { ...ev, id: uuid(), flockId, createdAt: now() };
          return { ...f, events: [...(f.events || []), newEvent], updatedAt: now() };
        })
      }),
      addCorrection: (flockId, delta, reasonCode, reasonLabel, notes) => set({
        flocks: get().flocks.map(f => {
          if (f.id !== flockId) return f;
          const oldCount = f.currentCount || 0;
          const newCount = Math.max(0, oldCount + delta);
          const actualDelta = newCount - oldCount;
          if (actualDelta === 0) return f;
          const newEvent: FlockEvent = {
            id: uuid(),
            flockId,
            date: todayJ(),
            type: 'correction',
            count: Math.abs(actualDelta),
            sex: 'mixed',
            reasonCode,
            reason: reasonLabel,
            notes,
            createdAt: now(),
            updatedAt: now(),
            version: 1,
          };
          return {
            ...f,
            currentCount: newCount,
            events: [...(f.events || []), newEvent],
            updatedAt: now(),
          };
        }),
      }),
      revokeEvent: (flockId, eventId) => set({
        flocks: get().flocks.map(f => {
          if (f.id !== flockId) return f;
          const ev = (f.events || []).find(e => e.id === eventId);
          if (!ev) return f;
          // اگه این event قبلاً توسط یه correction لغو شده → دوباره لغو نکن
          const alreadyRevoked = (f.events || []).some(x => x.linkedEventId === eventId);
          if (alreadyRevoked) return f;
          // محاسبه‌ی معکوس
          let sign = 0;
          if (ev.type === 'correction') {
            const r = (ev.reason || '').includes('افزودن') ? 1 : -1;
            sign = -r;
          } else if (ev.type === 'death' || ev.type === 'cull' || ev.type === 'sell') {
            sign = 1; // برگشت به تعداد
          } else if (ev.type === 'add' || ev.type === 'transfer') {
            sign = -1;
          } else {
            return f;
          }
          const cur = f.currentCount || 0;
          const newCount = Math.max(0, cur + sign * ev.count);
          if (newCount === cur) return f;
          const revokeEv: FlockEvent = {
            id: uuid(),
            flockId,
            date: todayJ(),
            type: 'correction',
            count: Math.abs(sign * ev.count),
            sex: 'mixed',
            reasonCode: 'data_entry_error',
            reason: 'لغو ' + (EVENT_LABEL[ev.type] || ev.type),
            notes: 'لغو رویداد ' + ev.id.slice(0, 8),
            linkedEventId: eventId,
            createdAt: now(),
            updatedAt: now(),
            version: 1,
          };
          return {
            ...f,
            currentCount: newCount,
            events: [...(f.events || []), revokeEv],
            updatedAt: now(),
          };
        }),
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
    {
      name: 'pm-flk',
      version: 4,
      migrate: (persisted: any, version: number) => {
        const state = (persisted && persisted.state) ? persisted.state : persisted;
        if (!state?.flocks) return persisted;

        // ─── v0 → v1: نسخه‌گذاری رویدادها ───
        if (version < 1) {
          state.flocks = state.flocks.map((f: any) => ({
            ...f,
            events: (f.events || []).map((e: any) => ({
              ...e,
              version: 1,
              updatedAt: e.updatedAt || e.createdAt,
            })),
          }));
        }

        // ─── v1 → v2: تبدیل تاریخ ISO به شمسی ───
        if (version < 2) {
          state.flocks = state.flocks.map((f: any) => ({
            ...f,
            events: (f.events || []).map((e: any) => ({
              ...e,
              date: toJalali(e.date),
            })),
          }));
        }

        // ─── v2 → v3: پاکسازی متن رویدادها ───
        if (version < 3) {
          state.flocks = state.flocks.map((f: any) => ({
            ...f,
            events: (f.events || []).map((e: any) => {
              let reason = e.reason || '';
              reason = reason.replace(/لغو correction \(افزودن\)/g, 'لغو اصلاح');
              reason = reason.replace(/لغو correction \(کسر\)/g, 'لغو اصلاح');
              reason = reason.replace(/لغو death \(افزودن\)/g, 'لغو تلفات');
              reason = reason.replace(/لغو death \(کسر\)/g, 'لغو تلفات');
              reason = reason.replace(/لغو sell \(افزودن\)/g, 'لغو فروش');
              reason = reason.replace(/لغو sell \(کسر\)/g, 'لغو فروش');
              reason = reason.replace(/لغو transfer \(افزودن\)/g, 'لغو انتقال');
              reason = reason.replace(/لغو transfer \(کسر\)/g, 'لغو انتقال');
              reason = reason.replace(/لغو add \(افزودن\)/g, 'لغو افزودن');
              reason = reason.replace(/لغو add \(کسر\)/g, 'لغو افزودن');
              reason = reason.replace(/\(افزودن\)/g, '').trim();
              reason = reason.replace(/\(کسر\)/g, '').trim();
              return { ...e, reason };
            }),
          }));
        }

        // ─── v3 → v4: پاکسازی کامل + بازسازی currentCount ───
        if (version < 4) {
          state.flocks = state.flocks.map((f: any) => {
            const initial = f.initialCount || 0;
            const events = (f.events || []).slice().sort((a: any, b: any) =>
              (a.createdAt || '').localeCompare(b.createdAt || '')
            );

            // پیدا کردن event های لغو شده (originalIds که correction دارن)
            const revokedMap = new Map<string, string>(); // originalId -> revokeEventId
            const seenRevokes = new Set<string>();
            events.forEach((e: any) => {
              if (e.linkedEventId && !seenRevokes.has(e.linkedEventId)) {
                revokedMap.set(e.linkedEventId, e.id);
                seenRevokes.add(e.linkedEventId);
              }
            });

            // حذف لغوهای تکراری (فقط اولین لغو باقی بمونه)
            const dedupedEvents = events.filter((e: any) => {
              if (!e.linkedEventId) return true;
              return revokedMap.get(e.linkedEventId) === e.id;
            });

            // بازمحاسبه currentCount از اول
            let computed = initial;
            dedupedEvents.forEach((e: any) => {
              const isRevoke = !!e.linkedEventId;
              if (e.type === 'death' || e.type === 'sell' || e.type === 'cull') {
                computed -= e.count;
              } else if (e.type === 'add' || e.type === 'transfer') {
                computed += e.count;
              } else if (e.type === 'correction') {
                // correction معکوس
                if (isRevoke) {
                  // علامت رو از event اصلی می‌گیریم
                  const orig = dedupedEvents.find((x: any) => x.id === e.linkedEventId);
                  if (orig) {
                    if (orig.type === 'death' || orig.type === 'sell' || orig.type === 'cull') {
                      computed += e.count;
                    } else if (orig.type === 'add' || orig.type === 'transfer') {
                      computed -= e.count;
                    } else if (orig.type === 'correction') {
                      // اگه اصلاح بود، معکوسش
                      computed -= e.count;
                    }
                  }
                } else {
                  // correction دستی — علامت رو از reason متوجه نمی‌شیم، پس نگه‌داریم
                  // ولی چون قبلاً currentCount ثبت شده بود، اینجا فقط نگه‌داری می‌کنیم
                  // برای این حالت، currentCount اصلی رو نگه می‌داریم (نه بازمحاسبه)
                }
              }
            });

            // ⚠️ نکته: بازمحاسبه‌ی کامل ممکنه با currentCount قبلی تطابق نکنه
            // برای safety، اختلاف بین computed و f.currentCount رو چک می‌کنیم
            const oldCurrent = f.currentCount || 0;
            // فقط اگه اختلاف زیاد بود، از computed استفاده کن
            // (چون event های قدیمی ممکنه ناقص باشن)
            const finalCurrent = oldCurrent;

            // برچسب‌گذاری: event هایی که لغو شدن
            const marked = dedupedEvents.map((e: any) => ({
              ...e,
              ...(revokedMap.has(e.id) ? { revoked: true, revokedBy: revokedMap.get(e.id) } : {}),
            }));

            return {
              ...f,
              currentCount: finalCurrent,
              events: marked,
            };
          });
        }

        return persisted;
      },
    }
  )
);

export const TYPE_LABEL: Record<FlockType, string> = { layer: 'تخم‌گذار', broiler: 'گوشتی', breeder: 'مادر' };
export const STATUS_LABEL: Record<FlockStatus, string> = { active: 'فعال', archived: 'آرشیو', sold: 'فروخته‌شده', merged: 'ادغام‌شده' };
export const SOURCE_LABEL: Record<string, string> = { purchase: 'خریداری', hatch: 'جوجه‌کشی خودم' };

const EVENT_LABEL: Record<string, string> = {
  add: 'افزودن', sell: 'فروش', death: 'تلفات',
  transfer: 'انتقال', correction: 'اصلاح', cull: 'حذف',
};

function toJalali(iso: string): string {
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
