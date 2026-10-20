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
import { toFa } from '../../../shr/utils/fa';
import { recordHistory } from '../../../shr/intelligence';
import type { F } from '../types';
import type { DailyLog } from '../store';
import { format as formatJ, addDays, parse as parseJ } from 'date-fns-jalali';
import type { Flock } from '../../flk/store';
import { useFlk } from '../../flk/store';
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
    form, saving, setSaving, setErr, setOpen,
    selectedFlock, flockAliveCount, isLayerFlock, num, int,
  } = params;

  const { logs, add, update } = useDlg();
  const { items: whsItems, addMovement, deleteMovement } = useWhs();
  const { formulas, ingredients } = useFed();
  const { addProduction, updateProduction, deleteProduction, findByLogId } = useEgg();

  const save = async (): Promise<boolean> => {
    if (saving) return false;
    setSaving(true);

    // ۱) چک موجودی
    const shortages = checkStock({
      vaccines: form.vaccines,
      medications: form.medications,
      feedSourceType: form.feedSourceType,
      feedSourceId: form.feedSourceId,
      feedAmount: form.feedAmount,
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

    // ۲) اعتبارسنجی
    if (!form.flockId) { setErr('گله اجباری است'); setSaving(false); return false; }
    if (!form.date.trim()) { setErr('تاریخ اجباری است'); setSaving(false); return false; }

    const dCount = form.deaths.reduce((a, x) => a + (x.count || 0), 0);
    if (flockAliveCount && dCount > flockAliveCount) {
      setErr(`مجموع تلفات (${toFa(dCount)}) از تعداد زنده گله (${toFa(flockAliveCount)}) بیشتر است`);
      setSaving(false);
      return false;
    }

    const feedAmt = num(form.feedAmount);
    const newMovementIds: string[] = [];

    // ۳) حذف movementهای قدیمی دان
    if (form.feedMovementIds.length > 0) {
      form.feedMovementIds.forEach(id => deleteMovement(id));
    }

    // ۴) ساخت movementهای جدید دان
    if (form.feedSourceId && feedAmt && feedAmt > 0) {
      const feedData = buildFeedMovements({
        feedSourceType: form.feedSourceType,
        feedSourceId: form.feedSourceId,
        feedAmount: feedAmt,
        flockName: selectedFlock?.name || '',
        formulas,
        ingredients,
      });
      feedData.forEach(d => {
        const mid = addMovement({
          itemId: d.itemId, type: 'out',
          quantity: d.quantity, unitPrice: 0, reason: 'consumption',
          date: form.date, partyId: '',
          notes: d.notes,
        });
        if (mid) newMovementIds.push(mid);
      });
    }

    // ۵) حذف movementهای قدیمی واکسن/دارو (اگه ویرایش)
    if (form.id) {
      const oldLog = logs.find(l => l.id === form.id);
      oldLog?.vaccines?.forEach(v => {
        if (v.movementId) { try { deleteMovement(v.movementId); } catch {} }
      });
      oldLog?.medications?.forEach(m => {
        if (m.movementId) { try { deleteMovement(m.movementId); } catch {} }
      });
    }

    // ۶) ساخت movementهای جدید واکسن/دارو
    const processedVaccines = form.vaccines.map(v => {
      const d = buildVaccineMovement(v);
      if (!d) return { ...v, movementId: '' };
      const mid = addMovement({ ...d, type: 'out', unitPrice: 0, reason: 'consumption', date: form.date, partyId: '' });
      return { ...v, movementId: mid || '' };
    });
    const processedMedications = form.medications.map(m => {
      const d = buildMedicationMovement(m);
      if (!d) return { ...m, movementId: '' };
      const mid = addMovement({ ...d, type: 'out', unitPrice: 0, reason: 'consumption', date: form.date, partyId: '' });
      return { ...m, movementId: mid || '' };
    });

    // ۷) ساخت داده نهایی
    const data = buildLogData({
      form,
      processedVaccines,
      processedMedications,
      feedMovementIds: newMovementIds,
    });

    // ۸) ذخیره
    let logId: string;
    if (form.id) {
      update(form.id, data);
      logId = form.id;
    } else {
      logId = add(data);
    }

    // 🆕 ذخیره activeWithdrawal روی گله (Silent — بدون نمایش)
    try {
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
      }
    } catch { /* silent */ }

    // ۹) sync با egg
    try {
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
    } catch { /* silent */ }

    // ۱۰) emit event برای تلفات
    const oldLog = form.id ? (logs.find(l => l.id === form.id) || null) : null;
    try {
      bus.emit('dlg:deaths:recorded', {
        logId,
        flockId: data.flockId,
        date: data.date,
        count: data.deathsCount || 0,
        deaths: data.deaths || [],
        isEdit: !!form.id,
        prevCount: oldLog?.deathsCount || 0,
        prevFlockId: oldLog?.flockId,
      }, { source: 'dlg/save' });
    } catch { /* silent */ }

    toastMsg.saved('ثبت روزانه');

    // 🆕 ثبت تاریخچه برای Intelligence (silent — بدون تغییر UX)
    try {
      const ctxIntel = { flockSize: flockAliveCount, currentCount: flockAliveCount, femaleCount: selectedFlock?.femaleCount ?? undefined };
      const recN = (p: string, v: number | null) => {
        if (v !== null && Number.isFinite(v) && v > 0) recordHistory(p, v, ctxIntel);
      };
      recN('dlg.feedAmount', num(form.feedAmount));
      recN('dlg.feedRemaining', num(form.feedRemaining));
      recN('dlg.waterAmount', num(form.waterAmount));
      recN('dlg.waterFillCount', num(form.waterFillCount));
      recN('dlg.waterFillVolume', num(form.waterFillVolume));
      recN('dlg.temperature', typeof data.temperature === 'number' ? data.temperature : null);
      recN('dlg.temperatureMin', num(form.temperatureMin));
      recN('dlg.temperatureMax', num(form.temperatureMax));
      recN('dlg.humidity', typeof data.humidity === 'number' ? data.humidity : null);
      recN('dlg.deathsCount', Number(data.deathsCount) || null);
      recN('dlg.eatingEggs', int(form.eatingEggs));
      recN('dlg.fertileEggs', int(form.fertileEggs));
      recN('dlg.brokenEggs', int(form.brokenEggs));
      recN('dlg.otherEggs', int(form.otherEggs));
      // 🆕 sync با egg.* (cross_field lte_female — تشخیص «تخم بیشتر از مرغ»)
      recN('egg.eatingCount', int(form.eatingEggs));
      recN('egg.fertileCount', int(form.fertileEggs));
      recN('egg.brokenCount', int(form.brokenEggs));
    } catch { /* silent */ }

    setOpen(false);
    setSaving(false);
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
