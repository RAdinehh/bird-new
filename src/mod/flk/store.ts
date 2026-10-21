import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuid } from 'uuid';
import { parse, differenceInDays } from 'date-fns-jalali';
import { todayJ } from './api/flocksCalc';
import { showToast } from '../../cor/store/toast';
import { matchesGroupRule, EVENT_LABEL } from './helpers-store';
import { flkMigrate } from './migrations';
import type { FlockType, FlockStatus, FlockEvent, FlockEventReasonCode, FlockEventSex, FlockMergeSource, FlockMergeInfo, FlockDealType, FlockDealData, FlockGroupType, FlockGroupRule, FlockGroup, FlockGroupMember } from './types-store';
export * from './types-store';
export * from './helpers-store';

export interface Flock {
  id: string;
  name: string;
  type: FlockType;
  birdId: string;
  breedId: string;
  /** 🆕 standard یا mixed — خالی = standard برای سازگاری */
  breedKind?: 'standard' | 'mixed';
  /** 🆕 نام محلی برای گله مختلط */
  breedLabel?: string;
  hallId: string;
  zoneId: string;
  initialCount: number | null;
  currentCount: number | null;
  maleCount: number | null;
  femaleCount: number | null;
  /** 🆕 پرنده‌های با جنسیت نامشخص (مخلوط) */
  unknownCount?: number | null;
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
  /** شماره بچ هچری (اگر از خرید جوجه ساخته شده) */
  hatcheryBatchNo?: string;
  /** وزن اولیه جوجه به گرم */
  chickWeight?: number | null;
  createdAt: string;
  updatedAt: string;
  // 💼 مدل بهره‌برداری
  dealType?: FlockDealType;
  dealData?: FlockDealData;
  // 🆕 دوره پرهیز دارو (اختیاری — نمایش فقط اگر features.withdrawal = true)
  activeWithdrawal?: {
    until: string;        // تاریخ شمسی پایان دوره پرهیز
    medicine: string;     // نام داروی اصلی
    days: number;         // تعداد روز پرهیز
    startedAt: string;    // تاریخ شروع دوره
    logId: string;        // شناسه لاگ ثبت روزانه مبدأ
  };
}

export interface State {
  flocks: Flock[];
  groups: FlockGroup[];
  groupMembers: FlockGroupMember[];
  addEvent: (flockId: string, ev: Omit<FlockEvent, 'id'|'flockId'|'createdAt'>) => void;
  addCorrection: (flockId: string, delta: number, reasonCode: FlockEventReasonCode, reasonLabel: string, notes: string) => void;
  revokeEvent: (flockId: string, eventId: string) => void;
  removeEvent: (flockId: string, eventId: string) => void;
  mergeFlocks: (targetId: string, sourceId: string, opts: { targetAgeDays: number; sourceAgeDays: number; hatchDate?: string }) => void;
  unmergeFlocks: (targetId: string) => void;
  add: (f: Omit<Flock, 'id'|'createdAt'|'updatedAt'>) => string;
  repairFlockCounts: () => number;
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
      repairFlockCounts: () => {
        let fixed = 0;
        set({
          flocks: get().flocks.map((f: any) => {
            // Fix only flocks where currentCount > initialCount (bug artifact)
            if (f.currentCount != null && f.initialCount != null && f.currentCount > f.initialCount) {
              fixed++;
              return { ...f, currentCount: f.initialCount };
            }
            return f;
          }),
        });
        return fixed;
      },
      update: (id, patch) => set({ flocks: get().flocks.map(x => x.id === id ? {...x, ...patch, updatedAt: now()} : x) }),
      remove: (id) => {
        // 🆕 حذف مستقیم — تأیید و هشدار لینک‌ها در UI گرفته می‌شه
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
      }),
      unmergeFlocks: (targetId) => {
        const state = get();
        const target = state.flocks.find(f => f.id === targetId);
        if (!target || !target.mergedInfo || !target.mergedInfo.sources || target.mergedInfo.sources.length < 2) return;
        const sources = target.mergedInfo.sources;
        const lastSource = sources[sources.length - 1];
        const remainingSources = sources.slice(0, -1);
        set({
          flocks: state.flocks.map(f => {
            if (f.id === lastSource.flockId) {
              return {
                ...f,
                status: 'active' as FlockStatus,
                mergedInto: undefined,
                currentCount: lastSource.count,
                initialCount: lastSource.count,
                updatedAt: now(),
              };
            }
            if (f.id !== targetId) return f;
            return {
              ...f,
              currentCount: Math.max(0, (f.currentCount || 0) - lastSource.count),
              initialCount: Math.max(0, (f.initialCount || 0) - lastSource.count),
              mergedInfo: remainingSources.length > 1
                ? { ...f.mergedInfo!, sources: remainingSources }
                : undefined,
              updatedAt: now(),
            };
          }),
        });
      },
    }),
    {
      name: 'pm-flk',
      version: 9,
      migrate: flkMigrate,
    }
  )
);