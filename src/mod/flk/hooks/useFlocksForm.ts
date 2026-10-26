/**
 * useFlocksForm — state و منطق فرم گله
 */
import { useState } from 'react';
import { toFa, toEn } from '../../../shr/utils/fa';
import { toastMsg } from '../../../cor/store/toast';
import { logAction } from '../../../cor/logger/auditLog';
import { recordHistory } from '../../../shr/intelligence';
import { DEFAULT_LAYING_START } from '../store';
import type { Flock } from '../store';
import { useTra } from '../../tra/store';
import type { Bird, Breed } from '../../brd/store';
import type { Hall } from '../../hal/store';
import type { useBreedStandard } from '../../../shr/hooks/useBreedStandard';

type BreedStd = ReturnType<typeof useBreedStandard>;
import type { F } from '../types-flocks';
import { emptyForm } from '../types-flocks';

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
      rentStartDate: f.dealData?.rentStartDate || f.startDate || '',
      rentEndDate: f.dealData?.rentEndDate || '',
      rentPayments: f.dealData?.rentPayments || [],
      rentPeriod: f.dealData?.rentPeriod || 'monthly',
      dealId: f.dealData?.dealId || '',
      sourceInvoiceId: f.sourceInvoiceId || '',
      hatchId: f.hatchId || ''
    });
    setLayingFromStd(false);
    setErr(''); setOpen(true);
  };

  const save = async () => {
    // Validation منتقل‌شده به Zod (rules/flk.ts superRefine):
    //   name، initialCount>0، currentCount>initialCount، breeder sum،
    //   birdId، deal rules، at-least-one-date، cross-dates، future purchase/hatch.
    // فقط store-dependent اینجا می‌مانند: نام تکراری در سالن، breed purpose mismatch،
    // و startDate در آینده (این یکی هنوز در Zod نیست — TODO).

    const dup = flocks.find(f =>
      f.id !== form.id &&
      (f.hallId || '') === (form.hallId || '') &&
      f.name.trim() === form.name.trim()
    );
    if (dup) {
      setErr('گله‌ای با همین نام در این سالن وجود دارد. نام دیگری انتخاب کنید.');
      return;
    }



    // breed/purpose mismatch به Zod منتقل شد (rules/flk.ts superRefine)
    // 🆕 Deal validation

    // 🆕 تعداد اولیه > ۰

    // 🆕 breeder: male + female > initial (block) — موجود
    // ⚠️ warning برای < initial در UI هست، اینجا بلاک نمی‌کنیم

    // 🆕 Backfill birdId/breedId from source invoice if empty
    let resolvedBirdId = form.birdId;
    let resolvedBreedId = form.breedId;
    if (form.sourceInvoiceId && (!resolvedBirdId || !resolvedBreedId)) {
      try {
        const inv = useTra.getState().invoices.find((i: any) => i.id === form.sourceInvoiceId);
        const srcItem = inv?.items?.find((it: any) => it.birdId || it.breedId);
        if (srcItem) {
          if (!resolvedBirdId && srcItem.birdId) resolvedBirdId = srcItem.birdId;
          if (!resolvedBreedId && srcItem.breedId) resolvedBreedId = srcItem.breedId;
        }
      } catch (e) { console.warn('[flk save] source-invoice backfill failed:', e); }
    }

    const data = {
      name: form.name.trim(), type: form.type,
      birdId: resolvedBirdId, breedId: resolvedBreedId,
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
        rentStartDate: form.dealType === 'rent' ? (form.rentStartDate || undefined) : undefined,
        rentEndDate: form.dealType === 'rent' ? (form.rentEndDate || undefined) : undefined,
        rentPayments: form.dealType === 'rent' ? (form.rentPayments || []) : undefined,
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
    // 🆕 ثبت تاریخچه هوش مصنوعی (null-safe)
    try {
      if (form.dealType === 'rent') {
        const rentAmt = num(form.rentAmount);
        if (rentAmt !== null && rentAmt > 0) {
          recordHistory('flk.rentAmount', rentAmt, {});
        }
      }
    } catch (e) { console.warn('[flk save] recordHistory failed:', e); }

    setOpen(false);
    return { id: savedId, isNew };
  };

  return {
    open, setOpen, form, setForm, layingFromStd, setLayingFromStd, err, setErr,
    num, int, openNew, openEdit, save,
  };
}
