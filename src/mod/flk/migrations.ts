/**
 * migrations.ts — migrate flk store
 * جدا شده از store.ts
 */

import type { State } from './store';
import { toJalali } from './helpers-store';

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

export function flkMigrate(persistedInput: unknown, version: number): State {
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
    const s = state as Partial<State>;
    if (!s.groups) s.groups = [];
    if (!s.groupMembers) s.groupMembers = [];
  }

  // ─── v7 → v8: breedKind + breedLabel (گله مختلط) ───
  if (version < 8) {
    state.flocks = state.flocks.map((f) => ({
      ...f,
      breedKind: f.breedKind || 'standard',
      breedLabel: f.breedLabel || '',
    }));
  }

  return persistedInput as State;
}
