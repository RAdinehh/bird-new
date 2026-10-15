/**
 * useFlocksForm — state و منطق فرم گله
 */
import { useState } from 'react';
import { toFa, toEn } from '../../../shr/utils/fa';
import { showAlert, showConfirmAsync } from '../../../cor/store/dialog';
import { DEFAULT_LAYING_START } from '../store';
import type { Flock } from '../store';
import type { F } from '../types-flocks';
import { emptyForm } from '../types-flocks';
import { checkHallCapacity } from '../api/hallCapacity';

export interface UseFlocksFormParams {
  birds: any[];
  halls: any[];
  flocks: any[];
  breedStd: any;
  add: (f: any) => void;
  update: (id: string, patch: any) => void;
}

export function useFlocksForm({ birds, halls, flocks, breedStd, add, update }: UseFlocksFormParams) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<F>(emptyForm());
  const [layingFromStd, setLayingFromStd] = useState(false);
  const [err, setErr] = useState('');
  const [saveAttempted, setSaveAttempted] = useState(false);

  const num = (s: string) => s ? parseFloat(toEn(s).replace('٫', '.')) || null : null;
  const int = (s: string) => s ? parseInt(toEn(s)) || null : null;

  const openNew = () => {
    if (birds.length === 0) { showAlert('اول پرنده بسازید'); return; }
    if (halls.length === 0) { showAlert('اول سالن بسازید'); return; }
    const lastF = flocks.slice().sort((a, b) => (b.startDate || '').localeCompare(a.startDate || ''))[0];
    setForm({
      ...emptyForm(),
      birdId: lastF?.birdId || birds[0].id,
      hallId: lastF?.hallId || halls[0].id,
      ...(lastF?.breedId ? { breedId: lastF.breedId } : {}),
    });
    setLayingFromStd(false);
    setErr(''); setSaveAttempted(false); setOpen(true);
  };

  const openEdit = (f: Flock) => {
    setForm({
      id: f.id, name: f.name, type: f.type, birdId: f.birdId, breedId: f.breedId,
      hallId: f.hallId, zoneId: f.zoneId,
      initialCount: f.initialCount ? toFa(f.initialCount) : '',
      currentCount: f.currentCount ? toFa(f.currentCount) : '',
      maleCount: f.maleCount ? toFa(f.maleCount) : '',
      femaleCount: f.femaleCount ? toFa(f.femaleCount) : '',
      layingStartDay: f.layingStartDay ? toFa(f.layingStartDay) : '',
      vaccineScheduleId: f.vaccineScheduleId || '',
      hatchDate: f.hatchDate || '', purchaseDate: f.purchaseDate || '', startDate: f.startDate || '',
      source: f.source,
      purchasePrice: f.purchasePrice ? toFa(f.purchasePrice) : '',
      deliveryCost: f.deliveryCost ? toFa(f.deliveryCost) : '',
      otherCosts: f.otherCosts ? toFa(f.otherCosts) : '',
      status: f.status, notes: f.notes
    });
    setLayingFromStd(false);
    setErr(''); setSaveAttempted(false); setOpen(true);
  };

  const save = async () => {
    setSaveAttempted(true);
    if (!form.id) {
      const _trimmed = form.name.trim();
      const _dup = flocks.find((x) => x.name.trim() === _trimmed);
      if (_dup) {
        showAlert(
          `گله‌ای با نام «${_dup.name}» قبلاً ثبت شده. لطفاً نام دیگری انتخاب کنید یا همان را ویرایش کنید.`,
          '❌ نام تکراری'
        );
        return;
      }
    }

    if (!form.name.trim()) { setErr('نام گله اجباری است'); return; }

    const _init = int(form.initialCount) || 0;
    const _curr = int(form.currentCount) || _init;
    const _male = int(form.maleCount) || 0;
    const _female = int(form.femaleCount) || 0;

    if (_curr > _init) {
      setErr(`تعداد فعلی (${toFa(_curr)}) نمی‌تواند بیشتر از تعداد اولیه (${toFa(_init)}) باشد`);
      return;
    }
    if (form.type === 'breeder' && (_male + _female) > _init) {
      setErr(`مجموع خروس (${toFa(_male)}) و مرغ (${toFa(_female)}) بیشتر از تعداد اولیه است`);
      return;
    }
    if (!form.birdId) { setErr('پرنده اجباری است'); return; }
    if (!form.startDate.trim() && !form.hatchDate.trim() && !form.purchaseDate.trim()) {
      setErr('حداقل یکی از تاریخ‌های هچ، خرید یا شروع را وارد کنید'); return;
    }

    const data = {
      name: form.name.trim(), type: form.type,
      birdId: form.birdId, breedId: form.breedId,
      hallId: form.hallId, zoneId: form.zoneId,
      initialCount: int(form.initialCount),
      currentCount: int(form.currentCount) || int(form.initialCount),
      maleCount: int(form.maleCount), femaleCount: int(form.femaleCount),
      layingStartDay: form.layingStartDay.trim() === ''
        ? (breedStd.byBreedId(form.breedId)?.biology?.layingStartDay ?? DEFAULT_LAYING_START)
        : (int(form.layingStartDay) || DEFAULT_LAYING_START),
      endOfCycleDay: breedStd.byBreedId(form.breedId)?.biology?.endOfCycleDay ?? null,
      hatchDate: form.hatchDate.trim(), purchaseDate: form.purchaseDate.trim(),
      startDate: form.startDate.trim(), source: form.source,
      purchasePrice: num(form.purchasePrice),
      deliveryCost: num(form.deliveryCost),
      otherCosts: num(form.otherCosts),
      vaccineScheduleId: form.vaccineScheduleId,
      status: form.status, notes: form.notes.trim()
    };

    const newCount = data.currentCount || data.initialCount || 0;
    const cap = checkHallCapacity(form.hallId, newCount, flocks, halls, breedStd, form.id || undefined, form.breedId);
    if (cap && !cap.ok) {
      const ok = await showConfirmAsync(
        '⚠️ ظرفیت سالن پر می‌شود',
        (cap.mode === 'area'
          ? `فضای سالن: ${cap.capacity} m²\nفعلی: ${cap.current} m²\nبعد از این گله: ${cap.total} m²\nاضافه‌بار: ${cap.over} m²\n`
          : `ظرفیت سالن: ${cap.capacity} پرنده\nفعلی: ${cap.current} پرنده\nبعد از این گله: ${cap.total} پرنده\nاضافه‌بار: ${cap.over} پرنده\n`) +
        (cap.note ? `\n⚠️ ${cap.note}\n` : '') + '\n' +
        `آیا می‌خواهید ادامه دهید؟`,
        { danger: true, confirmText: 'بله، ادامه' }
      );
      if (!ok) return;
    }

    if (form.id) update(form.id, data); else add(data);
    setOpen(false);
  };

  return {
    open, setOpen, form, setForm, layingFromStd, setLayingFromStd, err, setErr,
    saveAttempted, setSaveAttempted,
    num, int, openNew, openEdit, save,
  };
}
