/**
 * useFlocksForm — state و منطق فرم گله
 */
import { useState } from 'react';
import { toFa, toEn } from '../../../shr/utils/fa';
import { toastMsg } from '../../../cor/store/toast';
import { DEFAULT_LAYING_START } from '../store';
import type { Flock } from '../store';
import { useBrd } from '../../brd/store';
import type { Bird, Breed } from '../../brd/store';
import type { Hall } from '../../hal/store';
import type { useBreedStandard } from '../../../shr/hooks/useBreedStandard';

type BreedStd = ReturnType<typeof useBreedStandard>;
import type { F } from '../types-flocks';
import { emptyForm } from '../types-flocks';
import { todayJ } from '../api/flocksCalc';

export interface UseFlocksFormParams {
  birds: Bird[];
  halls: Hall[];
  flocks: Flock[];
  breedStd: BreedStd;
  add: (f: Omit<Flock, 'id' | 'createdAt' | 'updatedAt'>) => string;
  update: (id: string, patch: Partial<Flock>) => void;
}

export function useFlocksForm({ birds, halls, flocks, breedStd, add, update }: UseFlocksFormParams) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<F>(emptyForm());
  const [layingFromStd, setLayingFromStd] = useState(false);
  const [err, setErr] = useState('');

  const num = (s: string) => s ? parseFloat(toEn(s).replace('٫', '.')) || null : null;
  const int = (s: string) => s ? parseInt(toEn(s)) || null : null;

  const openNew = () => {
    if (birds.length === 0) { toastMsg.error('اول پرنده بسازید'); return; }
    if (halls.length === 0) { toastMsg.error('اول سالن بسازید'); return; }
    const lastF = flocks.slice().sort((a, b) => (b.startDate || '').localeCompare(a.startDate || ''))[0];
    setForm({
      ...emptyForm(),
      birdId: lastF?.birdId || birds[0].id,
      hallId: lastF?.hallId || halls[0].id,
      ...(lastF?.breedId ? { breedId: lastF.breedId } : {}),
    });
    setLayingFromStd(false);
    setErr(''); setOpen(true);
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
      endOfCycleDay: f.endOfCycleDay ? toFa(f.endOfCycleDay) : '',
      vaccineScheduleId: f.vaccineScheduleId || '',
      hatchDate: f.hatchDate || '', purchaseDate: f.purchaseDate || '', startDate: f.startDate || '',
      source: f.source,
      purchasePrice: f.purchasePrice ? toFa(f.purchasePrice) : '',
      deliveryCost: f.deliveryCost ? toFa(f.deliveryCost) : '',
      otherCosts: f.otherCosts ? toFa(f.otherCosts) : '',
      status: f.status, notes: f.notes
    });
    setLayingFromStd(false);
    setErr(''); setOpen(true);
  };

  const save = async () => {
    if (!form.name.trim()) { setErr('نام گله اجباری است'); return; }

    const dup = flocks.find(f =>
      f.id !== form.id &&
      (f.hallId || '') === (form.hallId || '') &&
      f.name.trim() === form.name.trim()
    );
    if (dup) {
      setErr('گله‌ای با همین نام در این سالن وجود دارد. نام دیگری انتخاب کنید.');
      return;
    }

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

    if (form.breedId) {
      const allBreeds = useBrd.getState().breeds;
      const breed = allBreeds.find((b: Breed) => b.id === form.breedId);
      if (breed?.purposes && breed.purposes.length > 0) {
        if (!breed.purposes.includes(form.type)) {
          const purposeLabels: Record<string, string> = { layer: 'تخم‌گذار', broiler: 'گوشتی', breeder: 'مادر', ornamental: 'تزئینی' };
          setErr(
            'نژاد «' + breed.name + '» برای «' + (purposeLabels[form.type] || form.type) + '» مناسب نیست. ' +
            '(مناسب برای: ' + breed.purposes.map((p: string) => purposeLabels[p] || p).join('، ') + ')'
          );
          return;
        }
      }
    }
    if (!form.startDate.trim() && !form.hatchDate.trim() && !form.purchaseDate.trim()) {
      setErr('حداقل یکی از تاریخ‌های هچ، خرید یا شروع را وارد کنید'); return;
    }

    // 🆕 تعداد اولیه > ۰
    if (_init <= 0) {
      setErr('تعداد اولیه باید بیشتر از صفر باشد');
      return;
    }

    // 🆕 Cross-date: hatch ≤ purchase
    if (form.hatchDate.trim() && form.purchaseDate.trim() && form.hatchDate > form.purchaseDate) {
      setErr('تاریخ هچ نمی‌تواند بعد از تاریخ خرید باشد');
      return;
    }
    // 🆕 Cross-date: purchase ≤ start
    if (form.purchaseDate.trim() && form.startDate.trim() && form.purchaseDate > form.startDate) {
      setErr('تاریخ خرید نمی‌تواند بعد از تاریخ شروع نگهداری باشد');
      return;
    }
    // 🆕 Cross-date: hatch ≤ start
    if (form.hatchDate.trim() && form.startDate.trim() && form.hatchDate > form.startDate) {
      setErr('تاریخ هچ نمی‌تواند بعد از تاریخ شروع نگهداری باشد');
      return;
    }

    // 🆕 تاریخ‌های آینده
    const today = todayJ();
    if (form.startDate.trim() && form.startDate > today) {
      setErr('تاریخ شروع نگهداری نمی‌تواند در آینده باشد');
      return;
    }
    if (form.purchaseDate.trim() && form.purchaseDate > today) {
      setErr('تاریخ خرید نمی‌تواند در آینده باشد');
      return;
    }
    if (form.hatchDate.trim() && form.hatchDate > today) {
      setErr('تاریخ هچ نمی‌تواند در آینده باشد');
      return;
    }

    // 🆕 breeder: male + female > initial (block) — موجود
    // ⚠️ warning برای < initial در UI هست، اینجا بلاک نمی‌کنیم

    const data = {
      name: form.name.trim(), type: form.type,
      birdId: form.birdId, breedId: form.breedId,
      hallId: form.hallId, zoneId: form.zoneId,
      initialCount: int(form.initialCount),
      currentCount: int(form.currentCount) || int(form.initialCount),
      layingStartDay: (form.type === 'layer' || form.type === 'breeder')
        ? (form.layingStartDay.trim() === ''
            ? (breedStd.byBreedId(form.breedId)?.biology?.layingStartDay ?? DEFAULT_LAYING_START)
            : (int(form.layingStartDay) || DEFAULT_LAYING_START))
        : 0,
      endOfCycleDay: (form.type === 'layer' || form.type === 'breeder')
        ? (breedStd.byBreedId(form.breedId)?.biology?.endOfCycleDay ?? null)
        : null,
      maleCount: form.type === 'breeder' ? int(form.maleCount) : null,
      femaleCount: form.type === 'breeder' ? int(form.femaleCount) : null,
      hatchDate: form.hatchDate.trim(), purchaseDate: form.purchaseDate.trim(),
      startDate: form.startDate.trim(), source: form.source,
      purchasePrice: num(form.purchasePrice),
      deliveryCost: num(form.deliveryCost),
      otherCosts: num(form.otherCosts),
      vaccineScheduleId: form.vaccineScheduleId,
      status: form.status, notes: form.notes.trim()
    };

    // 🆕 حذف شده — warning به صورت inline در Modal نمایش داده می‌شه
    // (کاربر آزاده بیش از ظرفیت ثبت کنه)

    if (form.id) update(form.id, data); else add(data);
    setOpen(false);
  };

  return {
    open, setOpen, form, setForm, layingFromStd, setLayingFromStd, err, setErr,
    num, int, openNew, openEdit, save,
  };
}
