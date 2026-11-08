/**
 * useDlgSave — منطق ذخیره‌سازی ثبت روزانه
 *
 * همه‌ی cascadeها (whs, egg)، اعتبارسنجی و emit event اینجاست.
 */
import { useDlg } from '../store';
import { useWhs } from '../../whs/store';
import { useFed } from '../../fed/store';
import { useEgg } from '../../egg/store';
import { checkStock } from '../api/checkStock';
import { buildFeedMovements, buildVaccineMovement, buildMedicationMovement } from '../api/toWhs';
import { buildLogData } from '../api/buildData';
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

export function useDlgSave(params: UseDlgSaveParams) {
  const {
    form, saving, setSaving, setOpen,
    selectedFlock, flockAliveCount, isLayerFlock, num, int,
  } = params;

  const { logs, add, update } = useDlg();
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
            } as any);
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
          const mid = addMovement({ ...d, type: 'out', unitPrice: vacPrice, reason: 'consumption', date: form.date, partyId: '', flockId: form.flockId || undefined } as any);
          if (!mid) throw new Error('حرکت واکسن ساخته نشد');
          return { ...v, movementId: mid };
        });
        const processedMedications = form.medications.map(m => {
          const d = buildMedicationMovement(m);
          if (!d) return { ...m, movementId: '' };
          const medItem = whsItems.find(x => x.id === d.itemId);
          const medPrice = Number(medItem?.lastPrice) || Number(medItem?.avgPrice) || 0;
          const mid = addMovement({ ...d, type: 'out', unitPrice: medPrice, reason: 'consumption', date: form.date, partyId: '', flockId: form.flockId || undefined } as any);
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
        });
        finalData = data;

        let logId: string;
        if (form.id) {
          update(form.id, data);
          logId = form.id;
        } else {
          logId = add(data);
        }

        // ۸) activeWithdrawal (با B1c-minimal)
        const meds = form.medications || [];
        const maxWithdrawal = meds.reduce((a, m) => Math.max(a, m.withdrawalDays || 0), 0);
        if (maxWithdrawal > 0 && form.flockId) {
          const until = addJalaliDays(form.date, maxWithdrawal);
          if (until) {
            const flk = useFlk.getState();
            const flock = flk.flocks.find(f => f.id === form.flockId);
            if (flock) {
              const existingUntil = flock.activeWithdrawal?.until || '';
              const finalUntil = existingUntil && existingUntil > until ? existingUntil : until;
              const medName = meds.find(m => (m.withdrawalDays || 0) === maxWithdrawal)?.name || 'دارو';
              flk.update(form.flockId, {
                activeWithdrawal: {
                  until: finalUntil,
                  medicine: medName,
                  days: maxWithdrawal,
                  startedAt: form.date,
                  logId,
                },
              } as any);
            }
          }
        } else if (form.flockId) {
          const flk = useFlk.getState();
          const flock = flk.flocks.find(f => f.id === form.flockId);
          if (flock?.activeWithdrawal?.logId === logId) {
            flk.update(form.flockId, { activeWithdrawal: undefined } as any);
          }
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
  const deleteLog = async (l: DailyLog): Promise<{
    ok: boolean;
    undoData: DailyLog | null;
  }> => {
    const ok = await showConfirmAsync('تأیید حذف', 'این ثبت روزانه و داده‌های مرتبط حذف شوند؟', { danger: true });
    if (!ok) return { ok: false, undoData: null };

    const log = logs.find(x => x.id === l.id);
    if (!log) return { ok: false, undoData: null };

    if (log.feedMovementIds) log.feedMovementIds.forEach(id => deleteMovement(id));
    const prod = findByLogId(log.id);
    if (prod) deleteProduction(prod.id);

    try {
      bus.emit('dlg:log:deleted', {
        logId: log.id,
        flockId: log.flockId,
        date: log.date,
        deathsCount: log.deathsCount || 0,
        feedMovementIds: log.feedMovementIds || [],
      }, { source: 'dlg/delete' });
    } catch { /* silent */ }

    return { ok: true, undoData: log };
  };

  return { save, deleteLog };
}
