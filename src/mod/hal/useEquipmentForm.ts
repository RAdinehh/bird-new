/**
 * useEquipmentForm — state و logic فرم تجهیزات
 */
import { useState } from 'react';
import { useFormDraft } from '../../shr/hooks/useFormDraft';
import { toEn } from '../../shr/utils/fa';
import { toastMsg } from '../../cor/store/toast';
import type { Equipment, EquipmentCategory, EquipmentStatus, EquipmentUnit } from './store';


/** 🆕 تایپ دقیق فرم تجهیزات (همه چیز string بجز enum ها) */
export interface EquipmentFormData {
  id: string;
  hallId: string;
  zoneId: string;
  category: EquipmentCategory;
  type: string;
  name: string;
  count: string;
  unit: EquipmentUnit;
  unitPrice: string;
  purchasedAt: string;
  warranty: string;
  notes: string;
  capacity: string;
  efficiency: string;
  consumeRate: '' | 'once' | 'per-cycle';
  status: EquipmentStatus;
  brand: string;
  supplierId: string;
}

export const EQUIP_FORM_DEFAULTS: EquipmentFormData = {
  id: '', hallId: '', zoneId: '', category: 'ventilation', type: '', name: '',
  count: '', unit: 'pcs', unitPrice: '', purchasedAt: '',
  warranty: '', notes: '', capacity: '', efficiency: '', consumeRate: '',
  status: 'active', brand: '', supplierId: '',
};

export function useEquipmentForm() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<EquipmentFormData>(EQUIP_FORM_DEFAULTS);
  const draft = useFormDraft<EquipmentFormData>('hal-equip', form, setForm);
  const [err, setErr] = useState('');
  const [autoFields, setAutoFields] = useState<Set<string>>(new Set());

  const markAuto = (field: string) => setAutoFields(s => new Set(s).add(field));
  const clearAuto = (field: string) => setAutoFields(s => { const n = new Set(s); n.delete(field); return n; });

  const buildPayload = () => ({
    hallId: form.hallId,
    category: form.category || 'auxiliary',
    type: form.type,
    name: form.name.trim(),
    count: form.count ? parseInt(toEn(form.count)) || null : null,
    unit: form.unit || 'pcs',
    unitPrice: form.unitPrice ? parseFloat(toEn(form.unitPrice).replace('٫','.')) || null : null,
    purchasedAt: form.purchasedAt.trim(),
    warranty: form.warranty ? parseInt(toEn(form.warranty)) || null : null,
    notes: form.notes.trim(),
    capacity: form.capacity ? parseFloat(toEn(form.capacity).replace('٫','.')) || null : null,
    efficiency: form.efficiency ? parseFloat(toEn(form.efficiency).replace('٫','.')) || null : null,
    consumeRate: (form.consumeRate === 'once' || form.consumeRate === 'per-cycle') ? form.consumeRate : undefined,
    status: form.status || 'active',
    brand: (form.brand || '').trim(),
    supplierId: (form.supplierId || '').trim() || undefined,
  });

  const openNew = () => {
    if (!draft.hasDraft) setForm({ ...EQUIP_FORM_DEFAULTS, hallId: form.hallId });
    setErr('');
    setOpen(true);
  };

  const openEdit = (e: Equipment) => {
    setForm({
      id: e.id, hallId: e.hallId, zoneId: (e as any).zoneId || '',
      category: e.category || 'lighting',
      type: e.type || '',
      name: e.name,
      count: e.count ? String(e.count) : '',
      unit: e.unit || 'pcs',
      unitPrice: e.unitPrice ? String(e.unitPrice) : '',
      purchasedAt: e.purchasedAt || '',
      warranty: e.warranty ? String(e.warranty) : '',
      notes: e.notes || '',
      capacity: e.capacity ? String(e.capacity) : '',
      efficiency: e.efficiency ? String(e.efficiency) : '',
      consumeRate: (e.consumeRate === 'once' || e.consumeRate === 'per-cycle') ? e.consumeRate : '',
      status: e.status || 'active',
      brand: e.brand || '',
      supplierId: e.supplierId || '',
    });
    setErr('');
    setOpen(true);
  };

  const save = (equipment: Equipment[], addEquip: (e: Omit<Equipment, 'id' | 'createdAt' | 'updatedAt'>) => string, updateEquip: (id: string, patch: Partial<Equipment>) => void) => {
    if (!form.id) {
      const _dup = equipment.find((x) =>
        x.hallId === form.hallId && x.name.trim() === form.name.trim()
      );
      if (_dup) {
        setErr(`تجهیزی با نام «${_dup.name}» توی این سالن هست`);
        return;
      }
    }
    if (!form.name.trim()) { setErr('نام تجهیز اجباری است'); return; }

    const data = buildPayload();
    if (form.id) updateEquip(form.id, data); else addEquip(data);
    draft.clear();
    setOpen(false);
  };

  const saveAndNext = (addEquip: (e: Omit<Equipment, 'id' | 'createdAt' | 'updatedAt'>) => string) => {
    if (!form.name.trim()) { setErr('نام تجهیز اجباری است'); return; }
    addEquip(buildPayload());
    toastMsg.added(form.name || 'تجهیز');
    setForm((f) => ({
      ...f,
      id: '', name: '', count: '', unitPrice: '', purchasedAt: '',
      warranty: '', notes: '', capacity: '', efficiency: '',
    }));
    draft.clear();
  };

  return {
    open, setOpen, form, setForm, draft, err, setErr,
    autoFields, markAuto, clearAuto,
    buildPayload, openNew, openEdit, save, saveAndNext,
  };
}
