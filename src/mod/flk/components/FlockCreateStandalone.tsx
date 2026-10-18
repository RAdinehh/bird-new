/**
 * FlockCreateStandalone — wrapper مستقل برای FlocksModal
 * فقط برای ساخت گله جدید از ماژول‌های دیگر (tra, inc, ...)
 * همه hookها و validation داخلی مدیریت می‌شن — تنها open/onClose/onSaved از بیرون.
 */
import { useState, useEffect, useMemo, useRef } from 'react';
import { useFlk } from '../store';
import { useBrd } from '../../brd/store';
import { useHal } from '../../hal/store';
import { useTra } from '../../tra/store';
import { useSet } from '../../set/store';
import { useFlocksForm } from '../hooks/useFlocksForm';
import { useBreedStandard } from '../../../shr/hooks/useBreedStandard';
import { useFormat } from '../../../shr/units';
import { useValidation } from '../../../shr/validation/useValidation';
import { useFormErrors } from '../../../shr/hooks/useFormErrors';
import { createFlkSchema } from '../../../shr/validation/rules/flk';
import { toEn } from '../../../shr/utils/fa';
import FlocksModal from './FlocksModal';

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: (flockId: string) => void;
}

export default function FlockCreateStandalone({ open, onClose, onSaved }: Props) {
  const fmt = useFormat();
  const breedStd = useBreedStandard();
  const { flocks, add } = useFlk();
  const vaccineEnabled = useSet(s => s.features?.vaccine !== false);
  const { birds: _birdsRaw, breeds } = useBrd();
  const { halls: _hallsRaw, zones } = useHal();
  const { invoices } = useTra();

  // dedupe پرنده/سالن (مثل FlocksPage)
  const birds = useMemo(() => {
    const seen = new Set<string>();
    return _birdsRaw.filter(b => {
      const k = (b.name || '').trim().toLowerCase();
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  }, [_birdsRaw]);

  const halls = useMemo(() => {
    const seen = new Set<string>();
    return _hallsRaw.filter(h => {
      const k = (h.name || '').trim().toLowerCase();
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  }, [_hallsRaw]);

  const {
    setOpen: setFormOpen, form, setForm, layingFromStd, setLayingFromStd, err,
    openNew, save,
  } = useFlocksForm({ birds, halls, flocks, breedStd, add, update: () => {} });

  // وقتی open شد → فرم را ریست کن (فقط بار اول)
  const prevOpenRef = useRef(false);
  useEffect(() => {
    if (open && !prevOpenRef.current) {
      openNew();
    }
    prevOpenRef.current = open;
  }, [open, openNew]);

  const num = (s: string) => (s ? parseFloat(toEn(s).replace('٫', '.')) || null : null);
  const int = (s: string) => (s ? parseInt(toEn(s)) || null : null);

  const existingNames = useMemo(
    () => flocks
      .filter(f => f.id !== form.id)
      .map(f => f.name.trim().toLowerCase())
      .filter(Boolean),
    [flocks, form.id],
  );

  const flkSchema = useMemo(() => createFlkSchema({ existingNames }), [existingNames]);

  const { errors: vErrors } = useValidation(flkSchema, {
    name: form.name || '',
    type: form.type,
    birdId: form.birdId || '',
    breedId: form.breedId || '',
    hallId: form.hallId || '',
    zoneId: form.zoneId || '',
    initialCount: form.initialCount ? int(form.initialCount) : undefined,
    currentCount: form.currentCount ? int(form.currentCount) : undefined,
    maleCount: int(form.maleCount) ?? 0,
    femaleCount: int(form.femaleCount) ?? 0,
    layingStartDay: form.layingStartDay ? int(form.layingStartDay) : undefined,
    endOfCycleDay: form.endOfCycleDay ? int(form.endOfCycleDay) : undefined,
    vaccineScheduleId: form.vaccineScheduleId || '',
    hatchDate: form.hatchDate || '',
    purchaseDate: form.purchaseDate || '',
    startDate: form.startDate || '',
    source: form.source,
    purchasePrice: form.purchasePrice ? num(form.purchasePrice) : undefined,
    deliveryCost: form.deliveryCost ? num(form.deliveryCost) : undefined,
    otherCosts: form.otherCosts ? num(form.otherCosts) : undefined,
    status: form.status,
    notes: form.notes || '',
  });

  const { showError, markTouched, isValid, attemptSave } = useFormErrors(vErrors);

  const breedsForBird = useMemo(() => breeds.filter(b => b.birdId === form.birdId), [breeds, form.birdId]);
  const zonesForHall = useMemo(() => zones.filter(z => z.hallId === form.hallId), [zones, form.hallId]);

  const handleSave = async () => {
    attemptSave();
    if (Object.keys(vErrors).length > 0) return;
    const result = await save();
    if (result?.isNew) {
      onSaved(result.id);
    }
    onClose();
    setFormOpen(false);
  };

  const handleClose = () => {
    onClose();
    setFormOpen(false);
  };

  return (
    <FlocksModal
      open={open}
      onClose={handleClose}
      form={form}
      setForm={setForm}
      layingFromStd={layingFromStd}
      setLayingFromStd={setLayingFromStd}
      err={err}
      vErrors={vErrors}
      showError={showError}
      markTouched={markTouched}
      isValid={isValid}
      hallCapacity={null}
      birds={birds}
      breedsForBird={breedsForBird}
      halls={halls}
      zonesForHall={zonesForHall}
      breedStd={breedStd}
      vaccineEnabled={vaccineEnabled}
      fmt={fmt}
      onSave={handleSave}
    />
  );
}
