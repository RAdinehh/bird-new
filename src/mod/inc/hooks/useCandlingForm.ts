/**
 * useCandlingForm — مدیریت state فرم کندلینگ
 *
 * همه‌ی منطق openNew/openEdit/save/toggle/updateEntryData اینجاست.
 */
import { useState } from 'react';
import { toEn, toFa } from '../../../shr/utils/fa';
import { toastMsg } from '../../../cor/store/toast';
import { todayJalali } from '../helpers';
import { calcAvailableBase, type CandlingLike } from '../api/calc';
import type { Candling } from '../store';

export interface EntryData {
  alive: string;
  infertile: string;
  dead: string;
  broken: string;
  infertileReason: string;
  deadReason: string;
  notes: string;
}

export const emptyData = (): EntryData => ({
  alive: '', infertile: '', dead: '', broken: '',
  infertileReason: '', deadReason: '', notes: '',
});

export interface UseCandlingFormParams {
  eggEntries: any[];
  devices: { id: string; name: string }[];
  candlings: CandlingLike[];
  addCandling: (c: any) => void;
  updateCandling: (id: string, patch: any) => void;
}

export function useCandlingForm({
  eggEntries, devices, candlings, addCandling, updateCandling,
}: UseCandlingFormParams) {
  const [open, setOpen] = useState(false);
  const [modalDevice, setModalDevice] = useState('');
  const [modalDay, setModalDay] = useState('');
  const [modalDate, setModalDate] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [entriesData, setEntriesData] = useState<Record<string, EntryData>>({});
  const [err, setErr] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  const nextDayFor = (eggEntryId: string): number => {
    const stages = candlings.filter(c => c.eggEntryId === eggEntryId).map(c => c.stage);
    if (stages.length === 0) return 7;
    return Math.max(...stages) + 3;
  };

  const openNew = (preEntryId?: string, entriesById?: Record<string, any>) => {
    if (eggEntries.length === 0) { toastMsg.error('اول یک ورودی تخم ثبت کنید'); return; }
    const initialDev = preEntryId && entriesById
      ? entriesById[preEntryId]?.deviceId || devices[0]?.id || ''
      : devices[0]?.id || '';
    setModalDevice(initialDev);
    setSelectedIds(preEntryId ? new Set([preEntryId]) : new Set());
    const data: Record<string, EntryData> = {};
    if (preEntryId) data[preEntryId] = emptyData();
    setEntriesData(data);
    setModalDay(preEntryId ? String(nextDayFor(preEntryId)) : '7');
    setModalDate(todayJalali());
    setEditingId(null);
    setErr('');
    setOpen(true);
  };

  const openEdit = (c: Candling) => {
    setEditingId(c.id);
    setModalDevice('');
    setSelectedIds(new Set([c.eggEntryId]));
    setEntriesData({
      [c.eggEntryId]: {
        alive: c.alive ? toFa(c.alive) : '',
        infertile: c.infertile ? toFa(c.infertile) : '',
        dead: c.dead ? toFa(c.dead) : '',
        broken: c.broken ? toFa(c.broken) : '',
        infertileReason: c.infertileReason || '',
        deadReason: c.deadReason || '',
        notes: c.notes || '',
      },
    });
    setModalDay(String(c.stage));
    setModalDate(c.date);
    setErr('');
    setOpen(true);
  };

  const toggleEntry = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        setEntriesData(d => { const nd = { ...d }; delete nd[id]; return nd; });
      } else {
        next.add(id);
        setEntriesData(d => ({ ...d, [id]: emptyData() }));
      }
      return next;
    });
  };

  const updateEntryData = (id: string, patch: Partial<EntryData>) => {
    setEntriesData(d => ({ ...d, [id]: { ...(d[id] || emptyData()), ...patch } }));
  };

  const save = (
    entriesById: Record<string, any>,
  ): { ok: boolean; savedCount: number } => {
    if (!modalDate.trim()) { setErr('تاریخ را وارد کنید'); return { ok: false, savedCount: 0 }; }
    if (!modalDay.trim()) { setErr('روز انکوباسیون را وارد کنید'); return { ok: false, savedCount: 0 }; }
    const dayNum = parseInt(toEn(modalDay)) || 0;
    if (dayNum <= 0 || dayNum > 30) { setErr('روز باید بین ۱ تا ۳۰ باشد'); return { ok: false, savedCount: 0 }; }
    if (selectedIds.size === 0) { setErr('حداقل یک ورودی انتخاب کنید'); return { ok: false, savedCount: 0 }; }

    // حالت ویرایش
    if (editingId) {
      const entry = entriesById[editingId];
      const baseInfo = calcAvailableBase(editingId, dayNum, editingId, candlings, entry?.count || 0);
      const d = entriesData[editingId] || emptyData();
      const _inf = parseInt(toEn(d.infertile)) || 0;
      const _dead = parseInt(toEn(d.dead)) || 0;
      const _brk = parseInt(toEn(d.broken)) || 0;
      const _alive = Math.max(0, (baseInfo.base || 0) - _inf - _dead - _brk);
      if (_inf + _dead + _brk === 0 && _alive === 0) { setErr('حداقل یک مقدار وارد کنید'); return { ok: false, savedCount: 0 }; }
      if (_inf + _dead + _brk > baseInfo.base) { setErr('مجموع بیشتر از مبنا'); return { ok: false, savedCount: 0 }; }
      updateCandling(editingId, {
        stage: dayNum, date: modalDate,
        alive: _alive,
        infertile: _inf,
        dead: _dead,
        broken: _brk,
        infertileReason: d.infertileReason,
        deadReason: d.deadReason,
        notes: d.notes,
      });
      setOpen(false);
      setEditingId(null);
      toastMsg.saved('کندلینگ');
      setEntriesData({});
      return { ok: true, savedCount: 1 };
    }

    // حالت جدید
    let saved = 0;
    let hasError = false;
    Array.from(selectedIds).forEach(id => {
      const entry = entriesById[id];
      if (!entry) return;
      const d = entriesData[id] || emptyData();
      const _inf = parseInt(toEn(d.infertile)) || 0;
      const _dead = parseInt(toEn(d.dead)) || 0;
      const _brk = parseInt(toEn(d.broken)) || 0;
      const baseInfo = calcAvailableBase(id, dayNum, null, candlings, entry.count || 0);
      const sum = _inf + _dead + _brk;
      if (sum === 0) { hasError = true; return; }
      if (baseInfo.base && sum > baseInfo.base) { hasError = true; return; }
      addCandling({
        eggEntryId: id, stage: dayNum, date: modalDate,
        alive: parseInt(toEn(d.alive)) || null,
        infertile: _inf || null,
        dead: _dead || null,
        broken: _brk || null,
        infertileReason: d.infertileReason,
        deadReason: d.deadReason,
        notes: d.notes,
      });
      saved++;
    });

    if (hasError && saved === 0) { setErr('هیچ کندلینگی ذخیره نشد'); return { ok: false, savedCount: 0 }; }
    setOpen(false);
    return { ok: true, savedCount: saved };
  };

  const close = () => {
    setOpen(false);
    setEditingId(null);
  };

  return {
    // state
    open, modalDevice, modalDay, modalDate, selectedIds, entriesData, err, editingId,
    // setters
    setOpen, setModalDevice, setModalDay, setModalDate, setSelectedIds, setEntriesData, setErr,
    // actions
    openNew, openEdit, toggleEntry, updateEntryData, save, close,
    // helpers
    nextDayFor,
  };
}
