/**
 * useFlocksForm — state و منطق فرم گله
 */
import { useState } from 'react';
import { toFa, toEn } from '../../../shr/utils/fa';
import { toastMsg } from '../../../cor/store/toast';
import { logAction } from '../../../cor/logger/auditLog';
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
      unknownCount: f.unknownCount ? toFa(f.unknownCount) : '',
      layingStartDay: f.layingStartDay ? toFa(f.layingStartDay) : '',
      endOfCycleDay: f.endOfCycleDay ? toFa(f.endOfCycleDay) : '',
      vaccineScheduleId: f.vaccineScheduleId || '',
      hatchDate: f.hatchDate || '', purchaseDate: f.purchaseDate || '', startDate: f.startDate || '',
      source: f.source,
      purchasePrice: f.purchasePrice ? toFa(f.purchasePrice) : '',
      deliveryCost: f.deliveryCost ? toFa(f.deliveryCost) : '',
      otherCosts: f.otherCosts ? toFa(f.otherCosts) : '',
      status: f.status, notes: f.notes,
      dealType: f.dealType || 'own',
      partnerId: f.dealData?.partnerId || '',
      partnerShare: f.dealData?.partnerShare ? toFa(f.dealData.partnerShare) : '',
      consignorId: f.dealData?.consignorId || '',
      lessorId: f.dealData?.lessorId || '',
      rentAmount: f.dealData?.rentAmount ? toFa(f.dealData.rentAmount) : '',
      rentPeriod: f.dealData?.rentPeriod || 'monthly',
      dealId: f.dealData?.dealId || '',
      sourceInvoiceId: f.sourceInvoiceId || '',
      hatchId: f.hatchId || ''
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
    const _unknown = int(form.unknownCount || '') || 0;

    if (_curr > _init) {
      setErr(`تعداد فعلی (${toFa(_curr)}) نمی‌تواند بیشتر از تعداد اولیه (${toFa(_init)}) باشد`);
      return;
    }
    if (form.type === 'breeder' && (_male + _female + _unknown) > _init) {
      setErr(`مجموع خروس (${toFa(_male)})، مرغ (${toFa(_female)}) و نامشخص (${toFa(_unknown)}) بیشتر از تعداد اولیه است`);
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
    // 🆕 Deal validation
    if (form.dealType === 'partnership' && !form.partnerId) {
      setErr('انتخاب شریک برای گله شراکتی اجباری است');
      return;
    }
    if (form.dealType === 'consignment' && !form.consignorId) {
      setErr('انتخاب امانت‌دهنده برای گله امانی اجباری است');
      return;
    }
    if (form.dealType === 'rent') {
      if (!form.lessorId) {
        setErr('انتخاب موجر برای گله اجاره‌ای اجباری است');
        return;
      }
      if (!form.rentAmount || !num(form.rentAmount)) {
        setErr('مبلغ اجاره اجباری است');
        return;
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
        ? (form.endOfCycleDay && form.endOfCycleDay.trim() !== ''
            ? (int(form.endOfCycleDay) || null)
            : (breedStd.byBreedId(form.breedId)?.biology?.endOfCycleDay ?? null))
        : null,
      maleCount: form.type === 'breeder' ? int(form.maleCount) : null,
      femaleCount: form.type === 'breeder' ? int(form.femaleCount) : null,
      unknownCount: int(form.unknownCount || '') || null,
      hatchDate: form.hatchDate.trim(), purchaseDate: form.purchaseDate.trim(),
      startDate: form.startDate.trim(), source: form.source,
      purchasePrice: num(form.purchasePrice),
      deliveryCost: num(form.deliveryCost),
      otherCosts: num(form.otherCosts),
      vaccineScheduleId: form.vaccineScheduleId,
      status: form.status, notes: form.notes.trim(),
      dealType: (form.dealType || 'own') as 'own' | 'partnership' | 'consignment' | 'rent',
      dealData: (form.dealType || 'own') === 'own' ? undefined : {
        partnerId: form.dealType === 'partnership' ? form.partnerId : undefined,
        partnerShare: form.dealType === 'partnership' ? (int(form.partnerShare) || undefined) : undefined,
        consignorId: form.dealType === 'consignment' ? form.consignorId : undefined,
        lessorId: form.dealType === 'rent' ? form.lessorId : undefined,
        rentAmount: form.dealType === 'rent' ? (num(form.rentAmount) || undefined) : undefined,
        rentPeriod: form.dealType === 'rent' ? ((form.rentPeriod || 'monthly') as 'monthly' | 'season' | 'total') : undefined,
        dealId: form.dealId || undefined,
      },
    };

    // 🆕 حذف شده — warning به صورت inline در Modal نمایش داده می‌شه
    // (کاربر آزاده بیش از ظرفیت ثبت کنه)

    let savedId = form.id || '';
    let isNew = false;
    if (form.id) {
      update(form.id, data);
      logAction('update', 'flk', 'ویرایش گله: ' + data.name);
    } else {
      savedId = add(data);
      isNew = true;
      logAction('add', 'flk', 'افزودن گله: ' + data.name + ' (' + (data.initialCount || 0) + ' پرنده)');
    }
    setOpen(false);
    return { id: savedId, isNew };
  };

  return {
    open, setOpen, form, setForm, layingFromStd, setLayingFromStd, err, setErr,
    num, int, openNew, openEdit, save,
  };
}
