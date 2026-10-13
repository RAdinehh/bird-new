/**
 * useHatchForm — state و منطق فرم ثبت/ویرایش هچ
 */
import { useState, useMemo } from 'react';
import { format as formatJ } from 'date-fns-jalali';
import { toFa, toEn } from '../../../shr/utils/fa';
import { showAlert } from '../../../cor/store/dialog';
import { calcCurrentFertile } from '../api/hatchCalc';
import type { HatchResult } from '../store';

export interface HatchRowData {
  hatched: string; unhatched: string; deadInShell: string; pipped: string; other: string;
  gradeA: string; gradeB: string; maleCount: string; femaleCount: string;
  unknownCount: string; avgWeight: string; notes: string;
}

export const emptyRow = (): HatchRowData => ({
  hatched: '', unhatched: '', deadInShell: '', pipped: '', other: '',
  gradeA: '', gradeB: '', maleCount: '', femaleCount: '',
  unknownCount: '', avgWeight: '', notes: '',
});

export interface UseHatchFormParams {
  eggEntries: any[];
  candlings: any[];
  hatches: HatchResult[];
  entriesById: Record<string, any>;
  addHatch: (h: any) => void;
  updateHatch: (id: string, patch: any) => void;
}

export function useHatchForm(p: UseHatchFormParams) {
  const { eggEntries, candlings, entriesById, addHatch, updateHatch } = p;

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formDate, setFormDate] = useState('');
  const [formEntryId, setFormEntryId] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [entriesData, setEntriesData] = useState<Record<string, any>>({});
  const [err, setErr] = useState('');

  const int = (s: string) => s ? parseInt(toEn(s)) || null : null;
  const num = (s: string) => s ? parseFloat(toEn(s).replace('٫', '.')) || null : null;
  const todayJ = () => { const d = new Date(); return formatJ(d, 'yyyy/MM/dd'); };

  const dataFor = (id: string) => entriesData[id] || emptyRow();
  const updateData = (id: string, patch: any) =>
    setEntriesData(d => ({ ...d, [id]: { ...(d[id] || emptyRow()), ...patch } }));

  const toggleEntry = (id: string) => {
    const isSelected = selectedIds.has(id);
    const newSet = new Set(selectedIds);
    if (isSelected) {
      newSet.delete(id);
      const newData = { ...entriesData };
      delete newData[id];
      setEntriesData(newData);
      setSelectedIds(newSet);
    } else {
      newSet.add(id);
      const entry = entriesById[id];
      const calc = calcCurrentFertile(id, entry?.count || 0, candlings);
      setEntriesData({ ...entriesData, [id]: { ...emptyRow(), hatched: calc.fertile > 0 ? String(calc.fertile) : '' } });
      setSelectedIds(newSet);
    }
  };

  const openNew = (preId?: string) => {
    if (eggEntries.length === 0) { showAlert('اول یک ورودی تخم بسازید'); return; }
    setEditingId(null);
    setFormDate(todayJ());
    setFormEntryId(preId || eggEntries[0].id);
    const data: Record<string, any> = {};
    if (preId) data[preId] = emptyRow();
    setEntriesData(data);
    setSelectedIds(preId ? new Set([preId]) : new Set());
    setErr(''); setOpen(true);
  };

  const openEdit = (h: HatchResult) => {
    setEditingId(h.id);
    setFormDate(h.date);
    setFormEntryId(h.eggEntryId);
    setSelectedIds(new Set([h.eggEntryId]));
    setEntriesData({ [h.eggEntryId]: {
      hatched: h.hatched ? toFa(h.hatched) : '', unhatched: h.unhatched ? toFa(h.unhatched) : '',
      deadInShell: h.deadInShell ? toFa(h.deadInShell) : '', pipped: h.pipped ? toFa(h.pipped) : '',
      other: h.other ? toFa(h.other) : '', gradeA: h.gradeA ? toFa(h.gradeA) : '', gradeB: h.gradeB ? toFa(h.gradeB) : '',
      maleCount: h.maleCount ? toFa(h.maleCount) : '', femaleCount: h.femaleCount ? toFa(h.femaleCount) : '',
      unknownCount: h.unknownCount ? toFa(h.unknownCount) : '', avgWeight: h.avgWeight ? toFa(h.avgWeight) : '', notes: h.notes
    }});
    setErr(''); setOpen(true);
  };

  const vErrors = useMemo(() => {
    const errs: Record<string, string> = {};
    for (const [entryId, d] of Object.entries(entriesData || {})) {
      const hatched = parseInt(toEn(d.hatched || '0')) || 0;
      const unhatched = parseInt(toEn(d.unhatched || '0')) || 0;
      const deadInShell = parseInt(toEn(d.deadInShell || '0')) || 0;
      const gradeA = parseInt(toEn(d.gradeA || '0')) || 0;
      const gradeB = parseInt(toEn(d.gradeB || '0')) || 0;
      const male = parseInt(toEn(d.maleCount || '0')) || 0;
      const female = parseInt(toEn(d.femaleCount || '0')) || 0;
      const unknown = parseInt(toEn(d.unknownCount || '0')) || 0;
      const avgW = parseFloat(toEn(d.avgWeight || '0')) || 0;
      if (hatched < 0 || unhatched < 0 || deadInShell < 0) errs['neg_' + entryId] = 'مقادیر منفی مجاز نیست';
      if ((gradeA + gradeB) > 0 && (gradeA + gradeB) !== hatched) errs['grade_' + entryId] = 'مجموع درجه A + B باید برابر تعداد جوجه باشد';
      if ((male + female + unknown) > 0 && (male + female + unknown) !== hatched) errs['sex_' + entryId] = 'مجموع نر + ماده + نامعلوم باید برابر تعداد جوجه باشد';
      if (avgW > 0 && (avgW < 20 || avgW > 60)) errs['avgW_' + entryId] = 'وزن جوجه باید بین ۲۰ تا ۶۰ گرم باشد';
    }
    return errs;
  }, [entriesData]);

  const save = () => {
    if (!formDate.trim()) { setErr('تاریخ اجباری است'); return; }
    if (editingId) {
      const d = dataFor(formEntryId);
      const hatchedNum = int(d.hatched) || 0;
      const hasHatched = hatchedNum > 0;
      updateHatch(editingId, {
        date: formDate,
        hatched: int(d.hatched), unhatched: int(d.unhatched),
        deadInShell: int(d.deadInShell), pipped: int(d.pipped), other: int(d.other),
        gradeA: hasHatched ? int(d.gradeA) : null,
        gradeB: hasHatched ? int(d.gradeB) : null,
        maleCount: hasHatched ? int(d.maleCount) : null,
        femaleCount: hasHatched ? int(d.femaleCount) : null,
        unknownCount: hasHatched ? int(d.unknownCount) : null,
        avgWeight: hasHatched ? num(d.avgWeight) : null,
        notes: d.notes || ''
      } as any);
      setOpen(false); return;
    }
    if (selectedIds.size === 0) { setErr('حداقل یک ورودی انتخاب کنید'); return; }
    let saved = 0;
    Array.from(selectedIds).forEach(id => {
      const d = dataFor(id);
      const hatchedNum = int(d.hatched) || 0;
      const hasHatched = hatchedNum > 0;
      addHatch({
        eggEntryId: id, date: formDate,
        hatched: int(d.hatched), unhatched: int(d.unhatched),
        deadInShell: int(d.deadInShell), pipped: int(d.pipped), other: int(d.other),
        gradeA: hasHatched ? int(d.gradeA) : null,
        gradeB: hasHatched ? int(d.gradeB) : null,
        maleCount: hasHatched ? int(d.maleCount) : null,
        femaleCount: hasHatched ? int(d.femaleCount) : null,
        unknownCount: hasHatched ? int(d.unknownCount) : null,
        avgWeight: hasHatched ? num(d.avgWeight) : null,
        notes: d.notes || ''
      } as any);
      saved++;
    });
    setOpen(false);
    showAlert(toFa(saved) + ' نتیجه هچ ثبت شد', '✅ موفق');
  };

  return {
    open, setOpen, editingId, setEditingId, formDate, setFormDate,
    formEntryId, setFormEntryId, selectedIds, setSelectedIds,
    entriesData, setEntriesData, err, setErr,
    dataFor, updateData, toggleEntry, openNew, openEdit, vErrors, save,
  };
}
