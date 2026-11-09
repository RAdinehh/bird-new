/**
 * useDlgSave — منطق ذخیره‌سازی ثبت روزانه
 *
 * همه‌ی cascadeها (whs, egg)، اعتبارسنجی و emit event اینجاست.
 */
import { useDlg } from '../store';
import { useWhs, type Movement } from '../../whs/store';
import { useFed } from '../../fed/store';
import { useEgg, type EggProduction } from '../../egg/store';
import { checkStock } from '../api/checkStock';
import { buildFeedMovements, buildVaccineMovement, buildMedicationMovement } from '../api/toWhs';
import { buildLogData } from '../api/buildData';
import { extractEvents } from '../api/extractEvents';
import { decideEggAction } from '../api/toEgg';
import { bus } from '../../../cor/events';
import { showConfirmAsync } from '../../../cor/store/dialog';
import { toastMsg } from '../../../cor/store/toast';
import { atomicTransaction, dlgStore, whsStore, eggStore, flkStore } from '../../../cor/atomic';
import { outbox } from '../../../cor/outbox';
import { toFa } from '../../../shr/utils/fa';
import { recordHistory } from '../../../shr/intelligence';
import type { F } from '../types';
import type { DailyLog } from '../store';
import { format as formatJ, addDays, parse as parseJ } from 'date-fns-jalali';
import type { Flock } from '../../flk/store';
import { useFlk } from '../../flk/store';
import { getBirdAgeAt } from '../../flk/helpers-store';
import type { Dispatch, SetStateAction } from 'react';

export interface UseDlgSaveParams {
  form: F;
  setForm: Dispatch<SetStateAction<F>>;
  saving: boolean;
  setSaving: (v: boolean) => void;
  setErr: (v: string) => void;
  setOpen: (v: boolean) => void;
  selectedFlock: Flock | undefined;
  flockAliveCount: number;
  isLayerFlock: boolean;
  num: (s: string) => number | null;
  int: (s: string) => number | null;
}


export interface DeleteSnapshot {
  feedMovements: Movement[];
  vaccineMovements: Array<{ vaccineId: string; movement: Movement }>;
  medicationMovements: Array<{ medicationId: string; movement: Movement }>;
  production: EggProduction | null;
}

/** افزودن N روز به تاریخ شمسی YYYY/MM/DD */
function findPreviousRemaining(
  logs: DailyLog[],
  form: { flockId: string; date: string; entryTime: string; id?: string },
): number | null {
  const candidates = logs.filter(
    (l) =>
      l.flockId === form.flockId &&
      l.id !== form.id &&
      (l.date < form.date ||
        (l.date === form.date && l.entryTime < form.entryTime)),
  );
  if (candidates.length === 0) return null;
  const latest = candidates.sort((a, b) => {
    const d = b.date.localeCompare(a.date);
    if (d !== 0) return d;
    return b.entryTime.localeCompare(a.entryTime);
  })[0];
  return latest.feedRemaining;
}

function addJalaliDays(dateStr: string, days: number): string {
  if (!dateStr) return '';
  try {
    const en = dateStr.replace(/[۰-۹]/g, (d: string) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)));
    const base = parseJ(en, 'yyyy/MM/dd', new Date());
    if (isNaN(base.getTime())) return '';
    return formatJ(addDays(base, days), 'yyyy/MM/dd');
  } catch { return ''; }
}

/**
 * B4-Recalc — recompute activeWithdrawal از همه لاگ‌های فلک
 *
 * قبلاً (B1c-minimal): activeWithdrawal از max(existing, new) محاسبه می‌شد.
 * باگ: logId اشتباه + پاک نشدن در حذف.
 *
 * این تابع: از همه لاگ‌های فلک max(until) را حساب می‌کند و ownerLogId را ست می‌کند.
 */
function recomputeActiveWithdrawal(
  logs: DailyLog[],
  flockId: string,
): void {
  if (!flockId) return;
  const flk = useFlk.getState();
  const flock = flk.flocks.find(f => f.id === flockId);
  if (!flock) return;

  const whsItems = useWhs.getState().items;
  const flockLogs = logs.filter(l => l.flockId === flockId);

  let maxUntil = '';
  let ownerLogId = '';
  let ownerMedName = '';
  let ownerDays = 0;
  let ownerStartedAt = '';

  for (const log of flockLogs) {
    for (const med of log.medications || []) {
      const days = med.withdrawalDays || 0;
      if (days <= 0) continue;
      // 🆕 herbal safety: گیاهی پرهیز ندارد (اگرچه فیلد مخفی است، ولی داده قدیمی ممکن است)
      if (med.itemId) {
        const __medItem = whsItems.find(x => x.id === med.itemId);
        if (__medItem?.category === 'herbal') continue;
      }
      const until = addJalaliDays(log.date, days);
      if (!until) continue;
      if (until > maxUntil) {
        maxUntil = until;
        ownerLogId = log.id;
        ownerMedName = med.name || 'دارو';
        ownerDays = days;
        ownerStartedAt = log.date;
      }
    }
  }

  if (maxUntil) {
    flk.update(flockId, {
      activeWithdrawal: {
        until: maxUntil,
        medicine: ownerMedName,
        days: ownerDays,
        startedAt: ownerStartedAt,
        logId: ownerLogId,
      },
    });
  } else if (flock.activeWithdrawal) {
    flk.update(flockId, { activeWithdrawal: undefined });
  }
}

export function useDlgSave(params: UseDlgSaveParams) {
  const {
    form, saving, setSaving, setOpen,
    selectedFlock, flockAliveCount, isLayerFlock, num, int,
  } = params;

  const { logs, add, update, remove } = useDlg();
  const { items: whsItems, addMovement, deleteMovement } = useWhs();
  const { formulas, ingredients } = useFed();
  const { addProduction, updateProduction, deleteProduction, findByLogId } = useEgg();

  const save = async (): Promise<boolean> => {
    if (saving) return false;
    setSaving(true);

    // D5.5/B1b — flockId/date قفل در ویرایش
    if (form.id) {
      const oldLog = logs.find(l => l.id === form.id);
      if (oldLog) {
        if (oldLog.flockId !== form.flockId) {
          toastMsg.error('گله در ویرایش قابل تغییر نیست — لاگ را حذف و مجدد ثبت کنید');
          setSaving(false);
          return false;
        }
        if (oldLog.date !== form.date) {
          toastMsg.error('تاریخ در ویرایش قابل تغییر نیست — لاگ را حذف و مجدد ثبت کنید');
          setSaving(false);
          return false;
        }
      }
    }

    // Phase 1 — Pre-flight (بدون mutation)
    const shortages = checkStock({
      vaccines: form.vaccines,
      medications: form.medications,
      feedSourceType: form.feedSourceType,
      feedSourceId: form.feedSourceId,
      feedDelivered: form.feedDelivered,
      whsItems,
      formulas,
      ingredients,
    });
    if (shortages.length > 0) {
      const txt = shortages.map(s => `• ${s.name}: نیاز ${toFa(s.need)} ${s.unit}، موجودی ${toFa(s.have)} ${s.unit}`);
      const ok = await showConfirmAsync(
        'موجودی انبار کافی نیست',
        txt.join('\n') + '\n\nاگه ادامه بدی، موجودی صفر می‌شه ولی کمبود ثبت نمی‌شه.',
        { danger: true },
      );
      if (!ok) { setSaving(false); return false; }
    }

    // Pre-compute (pure)
    const feedAmt = num(form.feedDelivered);
    const birdAgeDays = selectedFlock ? getBirdAgeAt(selectedFlock, form.date) : null;
    const previousRemainingKg = findPreviousRemaining(logs, form);
    const oldLogSnapshot = form.id ? (logs.find(l => l.id === form.id) || null) : null;

    let finalData: Omit<DailyLog, 'id' | 'status' | 'createdAt' | 'updatedAt'> | null = null;

    // Phase 2-6 — Execute atomic
    const result = await atomicTransaction<string>({
      stores: [dlgStore, whsStore, eggStore, flkStore],
      execute: () => {
        // ۳) حذف movementهای قدیمی دان
        if (form.feedMovementIds.length > 0) {
          form.feedMovementIds.forEach(id => deleteMovement(id));
        }

        // ۴) ساخت movementهای جدید دان
        const newMovementIds: string[] = [];
        if (form.feedSourceId && feedAmt && feedAmt > 0) {
          const feedData = buildFeedMovements({
            feedSourceType: form.feedSourceType,
            feedSourceId: form.feedSourceId,
            feedDelivered: feedAmt,
            flockName: selectedFlock?.name || '',
            formulas,
            ingredients,
          });
          feedData.forEach(d => {
            const item = whsItems.find(x => x.id === d.itemId);
            const price = Number(item?.lastPrice) || Number(item?.avgPrice) || 0;
            const mid = addMovement({
              itemId: d.itemId, type: 'out',
              quantity: d.quantity, unitPrice: price, reason: 'consumption',
              date: form.date, partyId: '',
              notes: d.notes,
              flockId: form.flockId || undefined,
            });
            if (!mid) throw new Error(`حرکت انبار برای "${d.notes}" ساخته نشد`);
            newMovementIds.push(mid);
          });
        }

        // ۵) حذف movementهای قدیمی واکسن/دارو
        if (form.id && oldLogSnapshot) {
          oldLogSnapshot.vaccines?.forEach(v => {
            if (v.movementId) deleteMovement(v.movementId);
          });
          oldLogSnapshot.medications?.forEach(m => {
            if (m.movementId) deleteMovement(m.movementId);
          });
        }

        // ۶) ساخت movementهای جدید واکسن/دارو
        const processedVaccines = form.vaccines.map(v => {
          const d = buildVaccineMovement(v);
          if (!d) return { ...v, movementId: '' };
          const vacItem = whsItems.find(x => x.id === d.itemId);
          const vacPrice = Number(vacItem?.lastPrice) || Number(vacItem?.avgPrice) || 0;
          const mid = addMovement({ ...d, type: 'out', unitPrice: vacPrice, reason: 'consumption', date: form.date, partyId: '', flockId: form.flockId || undefined });
          if (!mid) throw new Error('حرکت واکسن ساخته نشد');
          return { ...v, movementId: mid };
        });
        const processedMedications = form.medications.map(m => {
          const d = buildMedicationMovement(m);
          if (!d) return { ...m, movementId: '' };
          const medItem = whsItems.find(x => x.id === d.itemId);
          const medPrice = Number(medItem?.lastPrice) || Number(medItem?.avgPrice) || 0;
          const mid = addMovement({ ...d, type: 'out', unitPrice: medPrice, reason: 'consumption', date: form.date, partyId: '', flockId: form.flockId || undefined });
          if (!mid) throw new Error('حرکت دارو ساخته نشد');
          return { ...m, movementId: mid };
        });

        // ۷) ساخت داده نهایی + ذخیره
        const data = buildLogData({
          form,
          processedVaccines,
          processedMedications,
          feedMovementIds: newMovementIds,
          birdAgeDays,
          previousRemainingKg,
          flockAliveCount,
        });
        finalData = data;

        let logId: string;
        if (form.id) {
          update(form.id, data);
          logId = form.id;
        } else {
          logId = add(data);
          // 🆕 v16 — رویدادهای اولیه (الگوی FlockEvent)
          try {
            const initialEvents = extractEvents({ ...data, id: logId } as any);
            for (const ev of initialEvents) {
              useDlg.getState().addEvent(logId, ev);
            }
          } catch { /* silent */ }
        }

        // ۸) activeWithdrawal — recompute از همه لاگ‌ها (B4-Recalc)
        if (form.flockId) {
          const freshLogs = useDlg.getState().logs;
          recomputeActiveWithdrawal(freshLogs, form.flockId);
        }

        // ۹) sync با egg
        const action = decideEggAction({
          input: {
            logId,
            flockId: form.flockId,
            date: form.date,
            isLayerFlock,
            eatingEggs: int(form.eatingEggs) || 0,
            fertileEggs: int(form.fertileEggs) || 0,
            brokenEggs: int(form.brokenEggs) || 0,
            otherEggs: int(form.otherEggs) || 0,
          },
          existing: findByLogId(logId),
        });
        if (action.type === 'add') addProduction(action.data);
        else if (action.type === 'update') updateProduction(action.id, action.data);
        else if (action.type === 'delete') deleteProduction(action.id);

        return logId;
      },
      // Phase 7 — Commit (فقط بعد از موفقیت ۱۰۰٪)
      onSuccess: (logId) => {
        if (finalData) {
          void outbox.publish('dlg:deaths:recorded', {
            logId,
            flockId: finalData.flockId,
            date: finalData.date,
            count: finalData.deathsCount || 0,
            deaths: finalData.deaths || [],
            isEdit: !!form.id,
            prevCount: oldLogSnapshot?.deathsCount || 0,
            prevFlockId: oldLogSnapshot?.flockId,
          });

          // 🅰️ Phase F-A — 4 events (publish-only، بدون consumer فعلی)
          if (finalData.feedSourceId && (finalData.feedDelivered || 0) > 0) {
            void outbox.publish('dlg:feed:consumed', {
              logId,
              flockId: finalData.flockId,
              date: finalData.date,
              itemId: finalData.feedSourceId,
              quantity: finalData.feedDelivered || 0,
              isFormula: finalData.feedSourceType === 'formula',
            });
          }

          const __eggTotal = (finalData.eatingEggs || 0) + (finalData.fertileEggs || 0) + (finalData.brokenEggs || 0) + (finalData.otherEggs || 0);
          if (__eggTotal > 0) {
            void outbox.publish('dlg:egg:recorded', {
              logId,
              flockId: finalData.flockId,
              date: finalData.date,
              eating: finalData.eatingEggs || 0,
              fertile: finalData.fertileEggs || 0,
              broken: finalData.brokenEggs || 0,
              other: finalData.otherEggs || 0,
            });
          }

          for (const v of finalData.vaccines || []) {
            if (v.itemId && v.quantity && v.quantity > 0) {
              void outbox.publish('dlg:vaccine:given', {
                logId,
                flockId: finalData.flockId,
                date: finalData.date,
                itemId: v.itemId,
                quantity: v.quantity,
                name: v.name || '',
              });
            }
          }

          for (const m of finalData.medications || []) {
            if (m.itemId && m.quantity && m.quantity > 0) {
              void outbox.publish('dlg:medication:given', {
                logId,
                flockId: finalData.flockId,
                date: finalData.date,
                itemId: m.itemId,
                quantity: m.quantity,
                name: m.name || '',
              });
            }
          }
        }

        toastMsg.saved('ثبت روزانه');

        try {
          const ctxIntel = { flockSize: flockAliveCount, currentCount: flockAliveCount, femaleCount: selectedFlock?.femaleCount ?? undefined };
          const recN = (p: string, v: number | null) => {
            if (v !== null && Number.isFinite(v) && v > 0) recordHistory(p, v, ctxIntel);
          };
          recN('dlg.feedDelivered', num(form.feedDelivered));
          recN('dlg.feedRemaining', num(form.feedRemaining));
          recN('dlg.waterAmount', num(form.waterAmount));
          recN('dlg.waterFillCount', num(form.waterFillCount));
          recN('dlg.waterFillVolume', num(form.waterFillVolume));
          if (finalData) {
            recN('dlg.temperature', typeof finalData.temperature === 'number' ? finalData.temperature : null);
            recN('dlg.humidity', typeof finalData.humidity === 'number' ? finalData.humidity : null);
            recN('dlg.deathsCount', Number(finalData.deathsCount) || null);
          }
          recN('dlg.temperatureMin', num(form.temperatureMin));
          recN('dlg.temperatureMax', num(form.temperatureMax));
          recN('dlg.eatingEggs', int(form.eatingEggs));
          recN('dlg.fertileEggs', int(form.fertileEggs));
          recN('dlg.brokenEggs', int(form.brokenEggs));
          recN('dlg.otherEggs', int(form.otherEggs));
          recN('egg.eatingCount', int(form.eatingEggs));
          recN('egg.fertileCount', int(form.fertileEggs));
          recN('egg.brokenCount', int(form.brokenEggs));
        } catch { /* silent */ }
      },
      onError: (err) => {
        toastMsg.error('خطا در ذخیره — همه تغییرات لغو شد: ' + err.message);
      },
    });

    setSaving(false);

    if (!result.ok) return false;

    setOpen(false);
    return true;
  };

  /** منطق حذف */
  const deleteLog = async (
    l: DailyLog,
    opts: { skipConfirm?: boolean } = {},
  ): Promise<{
    ok: boolean;
    undoData: DailyLog | null;
    hadCascades: boolean;
    snapshot?: DeleteSnapshot;
  }> => {
    // D5.5/B3 — تأیید (در bulk delete skip می‌شود)
    if (!opts.skipConfirm) {
      const ok = await showConfirmAsync('تأیید حذف', 'این ثبت روزانه و داده‌های مرتبط حذف شوند؟', { danger: true });
      if (!ok) return { ok: false, undoData: null, hadCascades: false };
    }

    const log = logs.find(x => x.id === l.id);
    if (!log) return { ok: false, undoData: null, hadCascades: false };

    const hadCascades =
      (log.feedMovementIds?.length || 0) > 0 ||
      (log.vaccines || []).some(v => !!v.movementId) ||
      (log.medications || []).some(m => !!m.movementId) ||
      !!findByLogId(log.id);

    // E.4b — snapshot قبل از حذف
    const snapshot: DeleteSnapshot | undefined = hadCascades ? (() => {
      const movementsMap = new Map(useWhs.getState().movements.map((m: Movement) => [m.id, m]));
      const feedMovements = (log.feedMovementIds || [])
        .map((id) => movementsMap.get(id))
        .filter((m): m is Movement => !!m);
      const vaccineMovements = (log.vaccines || [])
        .filter((v) => !!v.movementId)
        .map((v) => ({ vaccineId: v.id, movement: movementsMap.get(v.movementId!) }))
        .filter((x): x is { vaccineId: string; movement: Movement } => !!x.movement);
      const medicationMovements = (log.medications || [])
        .filter((m) => !!m.movementId)
        .map((m) => ({ medicationId: m.id, movement: movementsMap.get(m.movementId!) }))
        .filter((x): x is { medicationId: string; movement: Movement } => !!x.movement);
      return { feedMovements, vaccineMovements, medicationMovements, production: findByLogId(log.id) || null };
    })() : undefined;

    // D5.5/B3 — atomic (cascade + remove + outbox)
    const result = await atomicTransaction<string>({
      stores: [dlgStore, whsStore, eggStore, flkStore],
      execute: () => {
        // حذف movement‌های دان
        if (log.feedMovementIds) {
          log.feedMovementIds.forEach(id => deleteMovement(id));
        }

        // حذف movement‌های واکسن/دارو
        log.vaccines?.forEach(v => {
          if (v.movementId) deleteMovement(v.movementId);
        });
        log.medications?.forEach(m => {
          if (m.movementId) deleteMovement(m.movementId);
        });

        // حذف production تخم
        const prod = findByLogId(log.id);
        if (prod) deleteProduction(prod.id);

        // حذف خود لاگ (D5.5/B3 — داخل atomic)
        remove(log.id);

        // B4-Recalc — recompute activeWithdrawal بعد از حذف
        const freshLogs = useDlg.getState().logs;
        recomputeActiveWithdrawal(freshLogs, log.flockId);

        return log.id;
      },
      onSuccess: (logId) => {
        const prod = findByLogId(logId);
        void outbox.publish('dlg:log:deleted', {
          logId,
          flockId: log.flockId,
          date: log.date,
          deathsCount: log.deathsCount || 0,
          feedMovementIds: log.feedMovementIds || [],
          eggProductionId: prod?.id,
        });
      },
      onError: (err) => {
        toastMsg.error('خطا در حذف — همه‌چیز لغو شد: ' + err.message);
      },
    });

    if (!result.ok) return { ok: false, undoData: null, hadCascades };
    return { ok: true, undoData: log, hadCascades, snapshot };
  };

  const restoreLogFull = async (log: DailyLog, snapshot: DeleteSnapshot): Promise<boolean> => {
    const result = await atomicTransaction<string>({
      stores: [dlgStore, whsStore, eggStore, flkStore],
      execute: () => {
        const newFeedIds: string[] = [];
        for (const mv of snapshot.feedMovements) {
          const { id: _oid, createdAt: _oc, ...mvData } = mv;
          const nid = addMovement(mvData);
          if (nid) newFeedIds.push(nid);
        }
        const vacMap = new Map<string, string>();
        for (const vm of snapshot.vaccineMovements) {
          const { id: _oid, createdAt: _oc, ...mvData } = vm.movement;
          const nid = addMovement(mvData);
          if (nid) vacMap.set(vm.vaccineId, nid);
        }
        const medMap = new Map<string, string>();
        for (const mm of snapshot.medicationMovements) {
          const { id: _oid, createdAt: _oc, ...mvData } = mm.movement;
          const nid = addMovement(mvData);
          if (nid) medMap.set(mm.medicationId, nid);
        }
        const updatedLog: DailyLog = {
          ...log,
          feedMovementIds: newFeedIds,
          vaccines: (log.vaccines || []).map((v) => ({ ...v, movementId: vacMap.get(v.id) || '' })),
          medications: (log.medications || []).map((m) => ({ ...m, movementId: medMap.get(m.id) || '' })),
        };
        const newLogId = add(updatedLog);
        if (snapshot.production) {
          const { id: _oid, createdAt: _oc, sourceLogId: _os, ...prodData } = snapshot.production;
          addProduction({ ...prodData, sourceLogId: newLogId });
        }
        const freshLogs = useDlg.getState().logs;
        recomputeActiveWithdrawal(freshLogs, log.flockId);
        return newLogId;
      },
      onError: (err) => {
        toastMsg.error('خطا در بازگردانی: ' + err.message);
      },
    });
    return result.ok;
  };

  return { save, deleteLog, restoreLogFull };
}
