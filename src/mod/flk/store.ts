import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuid } from 'uuid';
import { parse, differenceInDays } from 'date-fns-jalali';
import { todayJ } from './api/flocksCalc';
import { showToast } from '../../cor/store/toast';
import { matchesGroupRule, EVENT_LABEL } from './helpers-store';
import { flkMigrate } from './migrations';
import type { FlockType, FlockStatus, FlockEvent, FlockEventReasonCode, FlockEventSex, FlockMergeSource, FlockMergeInfo, FlockDealType, FlockDealData, FlockGroupType, FlockGroupRule, FlockGroup, FlockGroupMember, ConsumptionEvent } from './types-store';
export * from './types-store';
export * from './helpers-store';

/** 🆕 رکورد یک تفکیک جنسیت */
export interface FlockSexingEvent {
  id: string;
  date: string;
  male: number;
  female: number;
  unknown: number;
  /** منبع تفکیک: خرید اولیه / جزئی / اصلاح / نهایی */
  source: 'purchase' | 'partial' | 'correction' | 'final';
  note?: string;
  createdAt: string;
}

/** 🆕 رکورد تغییر تعادل جنسیتی (audit trail) */
export interface FlockSexBalanceEvent {
  id: string;
  date: string;
  type: 'sexing' | 'death' | 'sale' | 'return' | 'correction' | 'merge' | 'unmerge' | 'pre_sexing_observation';
  before: { male: number; female: number; unknown: number };
  after: { male: number; female: number; unknown: number };
  delta: { male: number; female: number; unknown: number };
  reason?: string;
  note?: string;
  createdAt: string;
}

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
  /** 🆕 تاریخ اولین تفکیک جنسیت — null = هیچ‌وقت split نشده */
  genderSplitAt?: string | null;
  notes: string;
  /** رویدادهای دستی گله */
  events?: FlockEvent[];
  mergedInto?: string;
  mergedInfo?: FlockMergeInfo;
  sourceInvoiceId?: string;
  hatchId?: string;
  sourceCategory?: string;
  /** شماره بچ هچری (اگر از خرید جوجه ساخته شده) */
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
  /** 🆕 سن تفکیک override (روز) — null → از استاندارد نژاد */
  sexingAgeOverride?: number | null;
  /** 🆕 تاریخچه تفکیک‌ها */
  sexingEvents?: FlockSexingEvent[];
  /** 🆕 تاریخچه تغییرات تعادل جنسیتی (audit trail) */
  sexBalanceEvents?: FlockSexBalanceEvent[];
  /** 🆕 تعداد اولیه نر (لحظه خرید/تفکیک) */
  initialMaleCount?: number;
  /** 🆕 تعداد اولیه ماده */
  initialFemaleCount?: number;
}

export interface State {
  flocks: Flock[];
  groups: FlockGroup[];
  groupMembers: FlockGroupMember[];
  consumptionEvents: ConsumptionEvent[];
  addEvent: (flockId: string, ev: Omit<FlockEvent, 'id'|'flockId'|'createdAt'>) => void;
  // 🆕 فاز ۸a — ConsumptionEvent
  addConsumptionEvent: (ev: Omit<ConsumptionEvent, 'id' | 'createdAt' | 'updatedAt'>) => string;
  updateConsumptionEvent: (id: string, patch: Partial<ConsumptionEvent>) => void;
  removeConsumptionEvent: (id: string) => void;
  listConsumptionEvents: (flockId: string) => ConsumptionEvent[];
  /** 🆕 ثبت تفکیک جنسیت (تعادل پیوسته) */
  recordSexing: (flockId: string, params: {
    male: number;
    female: number;
    unknown: number;
    date: string;
    note?: string;
  }) => void;
  addCorrection: (flockId: string, delta: number, reasonCode: FlockEventReasonCode, reasonLabel: string, notes: string) => void;
  revokeEvent: (flockId: string, eventId: string) => void;
  removeEvent: (flockId: string, eventId: string) => void;
  mergeFlocks: (targetId: string, sourceId: string, opts: { targetAgeDays: number; sourceAgeDays: number; hatchDate?: string }) => void;
  unmergeFlocks: (targetId: string, sourceId?: string) => void;
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

export const useFlk = create<State>()(
  persist(
    (set, get) => ({
      flocks: [],
      groups: [],
      groupMembers: [],
      consumptionEvents: [],
      add: (f) => {
        const id = uuid();
        // 🆕 فیکس: auto genderSplitAt
        const hasSplit = ((f.maleCount ?? 0) > 0) || ((f.femaleCount ?? 0) > 0);
        const patch: any = { ...f };
        if (hasSplit && !patch.genderSplitAt) {
          patch.genderSplitAt = now();
        }
        // 🆕 فیکس: اگر split ولی initialMaleCount ست نشده (فاکتور خرید / ساخت دستی)
        if (patch.genderSplitAt && patch.initialMaleCount === undefined) {
          patch.initialMaleCount = patch.maleCount ?? 0;
          patch.initialFemaleCount = patch.femaleCount ?? 0;
        }
        set({ flocks: [...get().flocks, { ...patch, id, createdAt: now(), updatedAt: now() }] });
        return id;
      },
      update: (id, patch) => set({
        flocks: get().flocks.map(x => {
          if (x.id !== id) return x;
          const merged: any = { ...x, ...patch, updatedAt: now() };
          const m2 = merged.maleCount ?? 0;
          const fe = merged.femaleCount ?? 0;
          const cc = merged.currentCount ?? 0;
          if ((m2 > 0 || fe > 0) && !merged.genderSplitAt) merged.genderSplitAt = now();
          if (m2 === 0 && fe === 0 && merged.genderSplitAt) {
            merged.genderSplitAt = null;
            merged.unknownCount = cc;
          }
          const sum = m2 + fe + (merged.unknownCount ?? 0);
          if (sum !== cc && m2 + fe <= cc) merged.unknownCount = cc - m2 - fe;
          return merged;
        }),
      }),
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

      recordSexing: (flockId, params) => {
        const flock = get().flocks.find(f => f.id === flockId);
        if (!flock) return;

        const currentCount = flock.currentCount ?? 0;
        const before = {
          male: flock.maleCount ?? 0,
          female: flock.femaleCount ?? 0,
          unknown: flock.unknownCount ?? 0,
        };

        const newMale = Math.max(0, Math.floor(Number(params.male) || 0));
        const newFemale = Math.max(0, Math.floor(Number(params.female) || 0));
        const newUnknown = Math.max(0, Math.floor(Number(params.unknown) || 0));
        const total = newMale + newFemale + newUnknown;

        if (total !== currentCount) {
          throw new Error(`جمع (${newMale} + ${newFemale} + ${newUnknown} = ${total}) باید برابر تعداد زنده (${currentCount}) باشد — اختلاف: ${total - currentCount}`);
        }
        if (newMale + newFemale === 0) {
          throw new Error('حداقل یکی از نر یا ماده باید بیشتر از صفر باشد');
        }

        const after = { male: newMale, female: newFemale, unknown: newUnknown };
        const delta = {
          male: after.male - before.male,
          female: after.female - before.female,
          unknown: after.unknown - before.unknown,
        };

        const today = params.date;
        const isFirst = !flock.genderSplitAt;
        const isFinal = newUnknown === 0;

        let source: 'purchase' | 'partial' | 'correction' | 'final';
        if (isFirst && isFinal) source = 'purchase';
        else if (isFirst) source = 'partial';
        else if (isFinal && before.unknown > 0) source = 'final';
        else source = 'correction';

        const sexingEvent: FlockSexingEvent = {
          id: uuid(),
          date: today,
          male: newMale,
          female: newFemale,
          unknown: newUnknown,
          source,
          note: params.note,
          createdAt: now(),
        };

        const balanceEvent: FlockSexBalanceEvent = {
          id: uuid(),
          date: today,
          type: 'sexing',
          before,
          after,
          delta,
          note: params.note,
          createdAt: now(),
        };

        set({
          flocks: get().flocks.map(f => {
            if (f.id !== flockId) return f;
            return {
              ...f,
              maleCount: newMale,
              femaleCount: newFemale,
              unknownCount: newUnknown,
              genderSplitAt: f.genderSplitAt || today,
              sexingEvents: [...(f.sexingEvents || []), sexingEvent],
              sexBalanceEvents: [...(f.sexBalanceEvents || []), balanceEvent],
              initialMaleCount: f.initialMaleCount ?? newMale,
              initialFemaleCount: f.initialFemaleCount ?? newFemale,
              updatedAt: now(),
            };
          }),
        });
      },
      addEvent: (flockId, ev) => set({
        flocks: get().flocks.map(f => {
          if (f.id !== flockId) return f;
          const newEvent: FlockEvent = { ...ev, id: uuid(), flockId, createdAt: now() };
    const cur = f.currentCount ?? 0;
    let delta = 0;
    if (ev.type === 'death' || ev.type === 'cull' || ev.type === 'sell') delta = -ev.count;
    else if (ev.type === 'add' || ev.type === 'transfer') delta = +ev.count;
    const next = Math.max(0, cur + delta);
    // 🆕 audit: capture before
    const _before = {
      male: f.maleCount ?? 0,
      female: f.femaleCount ?? 0,
      unknown: f.unknownCount ?? 0,
    };
    const patch: any = { currentCount: next };
    const hasSplit = !!f.genderSplitAt;
    if (!hasSplit) {
      if (delta > 0 && (ev.sex === 'male' || ev.sex === 'female')) {
        patch.genderSplitAt = now();
        patch.maleCount = ev.sex === 'male' ? ev.count : 0;
        patch.femaleCount = ev.sex === 'female' ? ev.count : 0;
        patch.unknownCount = cur;
      } else {
        patch.unknownCount = next;
      }
    } else {
      if (delta >= 0) {
        // adding
        if (ev.sex === 'male') patch.maleCount = (f.maleCount ?? 0) + delta;
        else if (ev.sex === 'female') patch.femaleCount = (f.femaleCount ?? 0) + delta;
        else patch.unknownCount = (f.unknownCount ?? 0) + delta;
      } else {
        // subtracting — با redistribution برای حفظ invariant
        const want = Math.abs(delta);
        if (ev.sex === 'male') {
          const availM = f.maleCount ?? 0;
          const takeM = Math.min(availM, want);
          patch.maleCount = availM - takeM;
          const rem = want - takeM;
          if (rem > 0) {
            const availU = f.unknownCount ?? 0;
            const takeU = Math.min(availU, rem);
            patch.unknownCount = availU - takeU;
            const rem2 = rem - takeU;
            if (rem2 > 0) {
              patch.femaleCount = Math.max(0, (f.femaleCount ?? 0) - rem2);
            }
          }
        } else if (ev.sex === 'female') {
          const availF = f.femaleCount ?? 0;
          const takeF = Math.min(availF, want);
          patch.femaleCount = availF - takeF;
          const rem = want - takeF;
          if (rem > 0) {
            const availU = f.unknownCount ?? 0;
            const takeU = Math.min(availU, rem);
            patch.unknownCount = availU - takeU;
            const rem2 = rem - takeU;
            if (rem2 > 0) {
              patch.maleCount = Math.max(0, (f.maleCount ?? 0) - rem2);
            }
          }
        } else {
          // mixed → unknown first, then larger sex
          const availU = f.unknownCount ?? 0;
          const takeU = Math.min(availU, want);
          patch.unknownCount = availU - takeU;
          const rem = want - takeU;
          if (rem > 0) {
            const m = f.maleCount ?? 0;
            const fe = f.femaleCount ?? 0;
            if (fe >= m) patch.femaleCount = Math.max(0, fe - rem);
            else patch.maleCount = Math.max(0, m - rem);
          }
        }
      }
    }
    // 🆕 audit: capture after + delta
    const _after = {
      male: patch.maleCount ?? _before.male,
      female: patch.femaleCount ?? _before.female,
      unknown: patch.unknownCount ?? _before.unknown,
    };
    const _sdelta = {
      male: _after.male - _before.male,
      female: _after.female - _before.female,
      unknown: _after.unknown - _before.unknown,
    };
    const _hasChange = _sdelta.male !== 0 || _sdelta.female !== 0 || _sdelta.unknown !== 0;
    const _bType: 'death' | 'sale' | 'correction' = ev.type === 'death' ? 'death' : ev.type === 'sell' ? 'sale' : 'correction';
    const _newBalanceEvents = _hasChange
      ? [...(f.sexBalanceEvents || []), {
          id: uuid(),
          date: ev.date,
          type: _bType,
          before: _before,
          after: _after,
          delta: _sdelta,
          reason: ev.reason,
          note: ev.notes,
          createdAt: now(),
        }]
      : (f.sexBalanceEvents || []);
    return { ...f, ...patch, events: [...(f.events || []), newEvent], sexBalanceEvents: _newBalanceEvents, updatedAt: now() };
        })
      }),
      // 🆕 فاز ۸a — ConsumptionEvent
      addConsumptionEvent: (ev) => {
        const id = uuid();
        const nowTs = now();
        const newEv: ConsumptionEvent = {
          ...ev,
          id,
          createdAt: nowTs,
          updatedAt: nowTs,
        };
        set({ consumptionEvents: [...get().consumptionEvents, newEv] });
        return id;
      },
      updateConsumptionEvent: (id, patch) => set({
        consumptionEvents: get().consumptionEvents.map(e =>
          e.id === id ? { ...e, ...patch, updatedAt: now() } : e
        ),
      }),
      removeConsumptionEvent: (id) => set({
        consumptionEvents: get().consumptionEvents.filter(e => e.id !== id),
      }),
      listConsumptionEvents: (flockId) => {
        return get().consumptionEvents
          .filter(e => e.flockId === flockId)
          .sort((a, b) => b.date.localeCompare(a.date));
      },
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
            count: Math.abs(actualDelta), direction: actualDelta > 0 ? 1 : -1,
            sex: 'mixed',
            reasonCode,
            reason: reasonLabel,
            notes,
            createdAt: now(),
            updatedAt: now(),
            version: 7,
          };
          const patch: any = { currentCount: newCount };
          // 🆕 قدم ۳: sync gender
          const hasSplit = !!f.genderSplitAt;
          if (!hasSplit) {
            patch.unknownCount = newCount;
          } else {
            const nextU = (f.unknownCount ?? 0) + actualDelta;
            if (nextU >= 0) {
              patch.unknownCount = nextU;
            } else {
              const rem = -nextU;
              patch.unknownCount = 0;
              const m = f.maleCount ?? 0;
              const fe = f.femaleCount ?? 0;
              if (fe >= m) {
                patch.femaleCount = Math.max(0, fe - rem);
              } else {
                patch.maleCount = Math.max(0, m - rem);
              }
            }
          }
          return {
            ...f,
            ...patch,
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
            const dir = ev.direction ?? ((ev.reason || '').includes('افزودن') ? 1 : -1);
            sign = -dir;
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
            direction: sign as 1 | -1,
            sex: ev.sex,
            reasonCode: 'data_entry_error',
            reason: 'لغو ' + (EVENT_LABEL[ev.type] || ev.type),
            notes: 'لغو رویداد ' + ev.id.slice(0, 8),
            linkedEventId: eventId,
            createdAt: now(),
            updatedAt: now(),
            version: 1,
          };
          const patch: any = { currentCount: newCount };
          // 🆕 قدم ۴: sync gender (بر اساس ev.sex اصلی)
          const hasSplit = !!f.genderSplitAt;
          if (!hasSplit) {
            patch.unknownCount = newCount;
          } else {
            const actualDelta = newCount - cur;
            if (ev.sex === 'male') {
              patch.maleCount = Math.max(0, (f.maleCount ?? 0) + actualDelta);
            } else if (ev.sex === 'female') {
              patch.femaleCount = Math.max(0, (f.femaleCount ?? 0) + actualDelta);
            } else {
              const nextU = (f.unknownCount ?? 0) + actualDelta;
              if (nextU >= 0) {
                patch.unknownCount = nextU;
              } else {
                const rem = -nextU;
                patch.unknownCount = 0;
                const m = f.maleCount ?? 0;
                const fe = f.femaleCount ?? 0;
                if (fe >= m) {
                  patch.femaleCount = Math.max(0, fe - rem);
                } else {
                  patch.maleCount = Math.max(0, m - rem);
                }
              }
            }
            // اگه male و female صفر شدن → un-split
            const finalMale = patch.maleCount ?? f.maleCount ?? 0;
            const finalFemale = patch.femaleCount ?? f.femaleCount ?? 0;
            if (finalMale === 0 && finalFemale === 0) {
              patch.genderSplitAt = null;
              patch.unknownCount = newCount;
            }
          }
          return {
            ...f,
            ...patch,
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
      mergeFlocks: (targetId, sourceId, opts) => {
        const _st = get();
        const _t = _st.flocks.find(f => f.id === targetId);
        const _s = _st.flocks.find(f => f.id === sourceId);
        if (!_t || !_s) throw new Error('گله پیدا نشد');
        if ((_t as any).birdKind && (_s as any).birdKind && (_t as any).birdKind !== (_s as any).birdKind) throw new Error('پرنده متفاوت');
        if (_t.type !== _s.type) throw new Error('نوع گله متفاوت');
        set({
          flocks: get().flocks.map(f => {
            if (f.id === sourceId) return { ...f, status: 'merged' as FlockStatus, mergedInto: targetId, currentCount: 0, maleCount: 0, femaleCount: 0, unknownCount: 0, updatedAt: now() };
            if (f.id !== targetId) return f;
            const target = f;
            const source = get().flocks.find(x => x.id === sourceId);
            if (!source) return f;
            const mkSrc = (fl: any, age: number) => ({
              flockId: fl.id, flockName: fl.name,
              count: fl.currentCount || 0, ageDays: age,
              maleCount: fl.maleCount || 0, femaleCount: fl.femaleCount || 0,
              unknownCount: fl.unknownCount || 0, initialCount: fl.initialCount || 0,
              initialMaleCount: fl.initialMaleCount, initialFemaleCount: fl.initialFemaleCount,
              genderSplitAt: fl.genderSplitAt, sexingAgeOverride: fl.sexingAgeOverride,
              sexingEvents: fl.sexingEvents || [], sexBalanceEvents: fl.sexBalanceEvents || [],
            });
            const targetSources: any[] = (target as any).mergedInfo?.sources || [mkSrc(target, opts.targetAgeDays)];
            const newSources: any[] = [...targetSources, mkSrc(source, opts.sourceAgeDays)];
            const totalCount = newSources.reduce((s2, x) => s2 + x.count, 0);
            const weightedAge = newSources.reduce((s2, x) => s2 + x.count * x.ageDays, 0);
            const avgAgeDays = totalCount > 0 ? Math.round(weightedAge / totalCount) : 0;
            const _mb = { male: target.maleCount ?? 0, female: target.femaleCount ?? 0, unknown: target.unknownCount ?? 0 };
            const _ma = { male: _mb.male + (source.maleCount ?? 0), female: _mb.female + (source.femaleCount ?? 0), unknown: _mb.unknown + (source.unknownCount ?? 0) };
            const mergeAudit = {
              id: uuid(), date: todayJ(), type: 'merge' as const,
              before: _mb, after: _ma,
              delta: { male: _ma.male - _mb.male, female: _ma.female - _mb.female, unknown: _ma.unknown - _mb.unknown },
              note: 'ادغام ' + source.name, createdAt: now(),
            };
            return {
              ...target,
              initialCount: (target.initialCount || 0) + (source.initialCount || 0),
              currentCount: (target.currentCount || 0) + (source.currentCount || 0),
              maleCount: (target.maleCount || 0) + (source.maleCount || 0),
              femaleCount: (target.femaleCount || 0) + (source.femaleCount || 0),
              unknownCount: (target.unknownCount || 0) + (source.unknownCount || 0),
              genderSplitAt: (() => {
                const dates = [target.genderSplitAt, source.genderSplitAt].filter(Boolean) as string[];
                return dates.length > 0 ? dates.sort()[0] : null;
              })(),
              hatchDate: opts.hatchDate || target.hatchDate,
              mergedInfo: { sources: newSources, avgAgeDays, mergedAt: now() },
              sexBalanceEvents: [...(target.sexBalanceEvents || []), mergeAudit],
              updatedAt: now(),
            };
          }),
        });
      },
      unmergeFlocks: (targetId: string, sourceId?: string) => {
        const state = get();
        const target = state.flocks.find(f => f.id === targetId);
        if (!target || !target.mergedInfo || !target.mergedInfo.sources || target.mergedInfo.sources.length < 2) return;
        const srcs: any[] = (target.mergedInfo!.sources as any[]);
        const sourceToRestore: any = sourceId ? srcs.find((s: any) => s.flockId === sourceId) : srcs[srcs.length - 1];
        if (!sourceToRestore) return;
        const remainingSources = srcs.filter((s: any) => s.flockId !== sourceToRestore.flockId);
        const snap = {
          count: sourceToRestore.count || 0,
          initialCount: sourceToRestore.initialCount || sourceToRestore.count || 0,
          maleCount: sourceToRestore.maleCount || 0,
          femaleCount: sourceToRestore.femaleCount || 0,
          unknownCount: sourceToRestore.unknownCount !== undefined ? sourceToRestore.unknownCount : (sourceToRestore.count || 0),
          initialMaleCount: sourceToRestore.initialMaleCount,
          initialFemaleCount: sourceToRestore.initialFemaleCount,
          genderSplitAt: sourceToRestore.genderSplitAt,
          sexingAgeOverride: sourceToRestore.sexingAgeOverride,
          sexingEvents: sourceToRestore.sexingEvents || [],
          sexBalanceEvents: sourceToRestore.sexBalanceEvents || [],
        };
        const _ub = { male: target.maleCount ?? 0, female: target.femaleCount ?? 0, unknown: target.unknownCount ?? 0 };
        const _ua = { male: Math.max(0, _ub.male - snap.maleCount), female: Math.max(0, _ub.female - snap.femaleCount), unknown: Math.max(0, _ub.unknown - snap.unknownCount) };
        const unmergeAudit = {
          id: uuid(), date: todayJ(), type: 'unmerge' as const,
          before: _ub, after: _ua,
          delta: { male: _ua.male - _ub.male, female: _ua.female - _ub.female, unknown: _ua.unknown - _ub.unknown },
          note: 'بازگردانی ' + sourceToRestore.flockName, createdAt: now(),
        };
        set({
          flocks: state.flocks.map(f => {
            if (f.id === sourceToRestore.flockId) return {
              ...f, status: 'active' as FlockStatus, mergedInto: undefined,
              currentCount: snap.count, initialCount: snap.initialCount,
              maleCount: snap.maleCount, femaleCount: snap.femaleCount, unknownCount: snap.unknownCount,
              initialMaleCount: snap.initialMaleCount, initialFemaleCount: snap.initialFemaleCount,
              genderSplitAt: snap.genderSplitAt, sexingAgeOverride: snap.sexingAgeOverride,
              sexingEvents: snap.sexingEvents, sexBalanceEvents: snap.sexBalanceEvents, updatedAt: now(),
            };
            if (f.id !== targetId) return f;
            return {
              ...f,
              currentCount: Math.max(0, (f.currentCount || 0) - snap.count),
              initialCount: Math.max(0, (f.initialCount || 0) - snap.initialCount),
              maleCount: Math.max(0, (f.maleCount || 0) - snap.maleCount),
              femaleCount: Math.max(0, (f.femaleCount || 0) - snap.femaleCount),
              unknownCount: Math.max(0, (f.unknownCount || 0) - snap.unknownCount),
              mergedInfo: remainingSources.length > 1 ? { ...f.mergedInfo!, sources: remainingSources } : undefined,
              sexBalanceEvents: [...(f.sexBalanceEvents || []), unmergeAudit],
              updatedAt: now(),
            };
          }),
        });
      },
    }),
    {
      name: 'pm-flk',
      version: 13,
      migrate: flkMigrate,
    }
  )
);

/**
 * validateSexBalance — بررسی Invariant تعادل جنسیتی
 * قانون: maleCount + femaleCount + unknownCount === currentCount
 *
 * @returns true اگر معتبر، false اگر نقض شده
 */
export function validateSexBalance(f: {
  currentCount?: number | null;
  maleCount?: number | null;
  femaleCount?: number | null;
  unknownCount?: number | null;
}): boolean {
  const c = f.currentCount ?? 0;
  const m = f.maleCount ?? 0;
  const fe = f.femaleCount ?? 0;
  const u = f.unknownCount ?? 0;
  return m + fe + u === c;
}
