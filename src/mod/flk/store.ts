import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuid } from 'uuid';
import { parse, differenceInDays } from 'date-fns-jalali';
import { toEn } from '../../shr/utils/fa';
import { todayJ } from './api/flocksCalc';
import { showToast } from '../../cor/store/toast';

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

export type FlockDealType = 'own' | 'partnership' | 'consignment' | 'rent';

export interface FlockDealData {
  partnerId?: string;
  partnerShare?: number;
  consignorId?: string;
  lessorId?: string;
  rentAmount?: number;
  rentPeriod?: 'monthly' | 'season' | 'total';
  dealId?: string;
}

export type FlockGroupType = 'season' | 'breed' | 'cohort' | 'farm' | 'owner' | 'custom' | 'smart';

export interface FlockGroupRule {
  type?: FlockType;
  status?: FlockStatus;
  hallId?: string;
  breedId?: string;
  birdId?: string;
  source?: string;
  dealType?: FlockDealType;
  minAge?: number;
  maxAge?: number;
}

export interface FlockGroup {
  id: string;
  name: string;
  type: FlockGroupType;
  description?: string;
  color?: string;
  parentGroupId?: string;
  rule?: FlockGroupRule;
  archived?: boolean;
  sortOrder?: number;
  createdAt: string;
  updatedAt: string;
}

export interface FlockGroupMember {
  groupId: string;
  flockId: string;
  joinedAt: string;
  leftAt?: string;
  role?: 'primary' | 'secondary';
  weight?: number;
  notes?: string;
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
  hatchId?: string;
  sourceCategory?: string;
  createdAt: string;
  updatedAt: string;
  // 💼 مدل بهره‌برداری
  dealType?: FlockDealType;
  dealData?: FlockDealData;
}

interface State {
  flocks: Flock[];
  groups: FlockGroup[];
  groupMembers: FlockGroupMember[];
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

  // 🆕 Groups
  addGroup: (g: Omit<FlockGroup, 'id' | 'createdAt' | 'updatedAt'>) => string;
  updateGroup: (id: string, patch: Partial<FlockGroup>) => void;
  archiveGroup: (id: string) => void;
  restoreGroup: (id: string) => void;
  deleteGroup: (id: string) => void;
  moveGroup: (groupId: string, newParentId: string | null) => void;

  // 🆕 Group Members
  addToGroup: (groupId: string, flockId: string, opts?: { role?: 'primary' | 'secondary'; weight?: number; notes?: string }) => void;
  removeFromGroup: (groupId: string, flockId: string) => void;
  getFlocksInGroup: (groupId: string, includeDescendants?: boolean) => Flock[];
  getGroupsForFlock: (flockId: string) => FlockGroup[];
  getGroupPath: (groupId: string) => FlockGroup[];
}

const now = () => new Date().toISOString();

// 🆕 types برای migrate (داده legacy — تایپ دقیق معلوم نیست)
type LegacyEvent = {
  id: string;
  type: string;
  date: string;
  count: number;
  reason?: string;
  linkedEventId?: string;
  createdAt: string;
  updatedAt?: string;
  version?: number;
  revoked?: boolean;
  revokedBy?: string;
  [key: string]: unknown;
};

type LegacyFlock = {
  id: string;
  type: string;
  initialCount: number | null;
  currentCount: number | null;
  events?: LegacyEvent[];
  layingStartDay?: number | null;
  endOfCycleDay?: number | null;
  maleCount?: number | null;
  femaleCount?: number | null;
  dealType?: string;
  dealData?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  [key: string]: unknown;
};

type PersistedFlk = {
  state?: { flocks?: LegacyFlock[] };
  flocks?: LegacyFlock[];
};

export const useFlk = create<State>()(
  persist(
    (set, get) => ({
      flocks: [],
      groups: [],
      groupMembers: [],
      add: (f) => {
        const id = uuid();
        set({ flocks: [...get().flocks, {...f, id, createdAt: now(), updatedAt: now()}] });
        return id;
      },
      update: (id, patch) => set({ flocks: get().flocks.map(x => x.id === id ? {...x, ...patch, updatedAt: now()} : x) }),
      remove: (id) => {
        const f = get().flocks.find(x => x.id === id);
        if (f?.sourceInvoiceId) {
          showToast('این گله فاکتور خرید دارد — ابتدا فاکتور را حذف کنید', 'error');
          return;
        }
        if (f?.hatchId) {
          showToast('این گله از هچ ساخته شده — ابتدا هچ را حذف کنید', 'error');
          return;
        }
        if (f?.dealData?.partnerId || f?.dealData?.consignorId || f?.dealData?.lessorId) {
          showToast('این گله شراکت/امانی/اجاره دارد — ابتدا مدل بهره‌برداری را حذف کنید', 'error');
          return;
        }
        set({ flocks: get().flocks.filter(x => x.id !== id) });
      },
      archive: (id, reason) => set({ flocks: get().flocks.map(x => x.id === id ? {...x, status: 'archived', endDate: x.endDate || now(), archivedReason: reason || '', updatedAt: now()} : x) }),
      restore: (id) => set({ flocks: get().flocks.map(x => x.id === id ? {...x, status: 'active', endDate: '', archivedReason: '', updatedAt: now()} : x) }),
      toggleHidden: (id) => set({ flocks: get().flocks.map(x => x.id === id ? {...x, hidden: !x.hidden, updatedAt: now()} : x) }),
      togglePaused: (id) => set({ flocks: get().flocks.map(x => x.id === id ? {...x, paused: !x.paused, updatedAt: now()} : x) }),

      // ═══ 🆕 Groups ═══
      addGroup: (g) => {
        const id = uuid();
        set({ groups: [...get().groups, { ...g, id, createdAt: now(), updatedAt: now() }] });
        return id;
      },
      updateGroup: (id, patch) => set({
        groups: get().groups.map(x => x.id === id ? { ...x, ...patch, updatedAt: now() } : x),
      }),
      archiveGroup: (id) => set({
        groups: get().groups.map(x => x.id === id ? { ...x, archived: true, updatedAt: now() } : x),
      }),
      restoreGroup: (id) => set({
        groups: get().groups.map(x => x.id === id ? { ...x, archived: false, updatedAt: now() } : x),
      }),
      deleteGroup: (id) => set({
        groups: get().groups.filter(x => x.id !== id),
        groupMembers: get().groupMembers.filter(m => m.groupId !== id),
      }),
      moveGroup: (groupId, newParentId) => {
        if (newParentId) {
          let cur: string | undefined = newParentId;
          const seen = new Set<string>();
          while (cur) {
            if (cur === groupId) {
              showToast('گروه نمی‌تواند والد خودش باشد', 'error');
              return;
            }
            if (seen.has(cur)) break;
            seen.add(cur);
            cur = get().groups.find(g => g.id === cur)?.parentGroupId;
          }
        }
        set({
          groups: get().groups.map(x => x.id === groupId ? { ...x, parentGroupId: newParentId || undefined, updatedAt: now() } : x),
        });
      },

      // ═══ 🆕 Group Members ═══
      addToGroup: (groupId, flockId, opts) => {
        const exists = get().groupMembers.some(m => m.groupId === groupId && m.flockId === flockId && !m.leftAt);
        if (exists) return;
        const member: FlockGroupMember = {
          groupId, flockId, joinedAt: now(),
          role: opts?.role, weight: opts?.weight, notes: opts?.notes,
        };
        set({ groupMembers: [...get().groupMembers, member] });
      },
      removeFromGroup: (groupId, flockId) => set({
        groupMembers: get().groupMembers.map(m =>
          m.groupId === groupId && m.flockId === flockId && !m.leftAt
            ? { ...m, leftAt: now() }
            : m
        ),
      }),
      getFlocksInGroup: (groupId, includeDescendants) => {
        const state = get();
        const group = state.groups.find(g => g.id === groupId);
        
        // 🆕 Smart groups — همیشه live computed
        if (group?.type === 'smart' && group.rule) {
          const matched = state.flocks.filter(f => matchesGroupRule(f, group.rule!));
          if (!includeDescendants) return matched;
          const children = state.groups.filter(g => g.parentGroupId === groupId && !g.archived);
          const all = [...matched];
          for (const child of children) {
            all.push(...state.getFlocksInGroup(child.id, true));
          }
          const seen = new Set<string>();
          return all.filter(f => {
            if (seen.has(f.id)) return false;
            seen.add(f.id);
            return true;
          });
        }
        
        // Manual groups — از groupMembers
        const directIds = state.groupMembers
          .filter(m => m.groupId === groupId && !m.leftAt)
          .map(m => m.flockId);
        let allIds = directIds;
        if (includeDescendants) {
          const children = state.groups.filter(g => g.parentGroupId === groupId && !g.archived);
          for (const child of children) {
            const cf = state.getFlocksInGroup(child.id, true);
            allIds = [...allIds, ...cf.map(f => f.id)];
          }
        }
        return state.flocks.filter(f => allIds.includes(f.id));
      },
      getGroupsForFlock: (flockId) => {
        const state = get();
        const flock = state.flocks.find(f => f.id === flockId);
        if (!flock) return [];
        const gids = state.groupMembers
          .filter(m => m.flockId === flockId && !m.leftAt)
          .map(m => m.groupId);
        return state.groups.filter(g => {
          if (g.archived) return false;
          if (g.type === 'smart' && g.rule) return matchesGroupRule(flock, g.rule);
          return gids.includes(g.id);
        });
      },
      getGroupPath: (groupId) => {
        const path: FlockGroup[] = [];
        let cur: string | undefined = groupId;
        const seen = new Set<string>();
        while (cur) {
          if (seen.has(cur)) break;
          seen.add(cur);
          const g = get().groups.find(x => x.id === cur);
          if (!g) break;
          path.unshift(g);
          cur = g.parentGroupId;
        }
        return path;
      },

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
            version: 7,
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
      migrate: (persistedInput: unknown, version: number) => {
        const persisted = persistedInput as PersistedFlk;
        const state: { flocks?: LegacyFlock[] } = (persisted && persisted.state ? persisted.state : persisted) as { flocks?: LegacyFlock[] };
        if (!state || !state.flocks) return persistedInput as State;

        // ─── v0 → v1: نسخه‌گذاری رویدادها ───
        if (version < 1) {
          state.flocks = state.flocks.map((f: LegacyFlock) => ({
            ...f,
            events: (f.events || []).map((e: LegacyEvent) => ({
              ...e,
              version: 1,
              updatedAt: e.updatedAt || e.createdAt,
            })),
          }));
        }

        // ─── v1 → v2: تبدیل تاریخ ISO به شمسی ───
        if (version < 2) {
          state.flocks = state.flocks.map((f: LegacyFlock) => ({
            ...f,
            events: (f.events || []).map((e: LegacyEvent) => ({
              ...e,
              date: toJalali(e.date),
            })),
          }));
        }

        // ─── v2 → v3: پاکسازی متن رویدادها ───
        if (version < 3) {
          state.flocks = state.flocks.map((f: LegacyFlock) => ({
            ...f,
            events: (f.events || []).map((e: LegacyEvent) => {
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
          state.flocks = state.flocks.map((f: LegacyFlock) => {
            const initial = f.initialCount || 0;
            const events = (f.events || []).slice().sort((a: LegacyEvent, b: LegacyEvent) =>
              (a.createdAt || '').localeCompare(b.createdAt || '')
            );

            // پیدا کردن event های لغو شده (originalIds که correction دارن)
            const revokedMap = new Map<string, string>(); // originalId -> revokeEventId
            const seenRevokes = new Set<string>();
            events.forEach((e: LegacyEvent) => {
              if (e.linkedEventId && !seenRevokes.has(e.linkedEventId)) {
                revokedMap.set(e.linkedEventId, e.id);
                seenRevokes.add(e.linkedEventId);
              }
            });

            // حذف لغوهای تکراری (فقط اولین لغو باقی بمونه)
            const dedupedEvents = events.filter((e: LegacyEvent) => {
              if (!e.linkedEventId) return true;
              return revokedMap.get(e.linkedEventId) === e.id;
            });

            // بازمحاسبه currentCount از اول
            let computed = initial;
            dedupedEvents.forEach((e: LegacyEvent) => {
              const isRevoke = !!e.linkedEventId;
              if (e.type === 'death' || e.type === 'sell' || e.type === 'cull') {
                computed -= e.count;
              } else if (e.type === 'add' || e.type === 'transfer') {
                computed += e.count;
              } else if (e.type === 'correction') {
                // correction معکوس
                if (isRevoke) {
                  // علامت رو از event اصلی می‌گیریم
                  const orig = dedupedEvents.find((x: LegacyEvent) => x.id === e.linkedEventId);
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
            const marked = dedupedEvents.map((e: LegacyEvent) => ({
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


        // ─── v4 → v5: clean-up فیلدهای یتیم ───
        if (version < 5) {
          state.flocks = state.flocks.map((f: LegacyFlock) => ({
            ...f,
            layingStartDay: (f.type === 'layer' || f.type === 'breeder') ? (f.layingStartDay ?? 0) : 0,
            endOfCycleDay: (f.type === 'layer' || f.type === 'breeder') ? (f.endOfCycleDay ?? null) : null,
            maleCount: f.type === 'breeder' ? (f.maleCount ?? null) : null,
            femaleCount: f.type === 'breeder' ? (f.femaleCount ?? null) : null,
          }));
        }

        // ─── v5 → v6: default dealType ───
        if (version < 6) {
          state.flocks = state.flocks.map((f: LegacyFlock) => ({
            ...f,
            dealType: f.dealType || 'own',
            dealData: f.dealData || {},
          }));
        }

        // ─── v6 → v7: groups + groupMembers ───
        if (version < 7) {
          if (!(state as any).groups) (state as any).groups = [];
          if (!(state as any).groupMembers) (state as any).groupMembers = [];
        }

        return persistedInput as State;
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

function matchesGroupRule(flock: Flock, rule: FlockGroupRule): boolean {
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
