/**
 * useEggEntriesForm — state + منطق فرم ورودی تخم
 *
 * شامل: bulk mode, draft rows, save + cascade invoice/production
 */
import { useState, useEffect } from 'react';
import { toFa, toEn } from '../../../shr/utils/fa';
import { showAlert, showConfirmAsync } from '../../../cor/store/dialog';
import { toastMsg } from '../../../cor/store/toast';
import { addDaysJalali, incubationDays } from '../store';
import type { EggEntry } from '../store';
import { makeRow, type DraftRow } from '../types-eggentries';
import { nowTime, flockReadyForEggs, DRAFT_KEY } from '../api/eggEntriesCalc';
import { todayJalali } from '../helpers';

export interface UseEggEntriesFormParams {
  devices: any[];
  birds: any[];
  eggEntries: any[];
  flocks: any[];
  initialDevice?: string;
  addEntry: (e: any) => string;
  updateEntry: (id: string, patch: any) => void;
  deleteEntry: (id: string) => void;
  addInvoice: (inv: any) => string | undefined;
  deleteInvoice: (id: string) => void;
  addProduction: (p: any) => string | undefined;
  deleteProduction: (id: string) => void;
  onGoTo?: (t: any, payload?: { entry?: string }) => void;
}

export function useEggEntriesForm(params: UseEggEntriesFormParams) {
  const {
    devices, birds, eggEntries, flocks, initialDevice,
    addEntry, updateEntry, deleteEntry,
    addInvoice, deleteInvoice, addProduction, deleteProduction,
    onGoTo,
  } = params;

  const [open, setOpen] = useState(false);
  const [multiDeviceId, setMultiDeviceId] = useState('');
  const [hideHatchTip, setHideHatchTip] = useState(() => {
    try { return localStorage.getItem('pm-inc-hide-hatch-tip') === '1'; } catch { return false; }
  });
  const [draftRows, setDraftRows] = useState<DraftRow[]>([]);
  const [undoRow, setUndoRow] = useState<{ row: DraftRow; idx: number } | null>(null);
  const [currentRow, setCurrentRow] = useState<DraftRow>(() => makeRow());
  const [editingRowId, setEditingRowId] = useState<string | null>(null);

  // Draft auto-load
  useEffect(() => {
    if (!open || !multiDeviceId) return;
    try {
      const saved = localStorage.getItem(DRAFT_KEY(multiDeviceId));
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) setDraftRows(parsed);
      } else {
        setDraftRows([]);
      }
    } catch {}
    setCurrentRow(makeRow());
    setEditingRowId(null);
  }, [open, multiDeviceId]);

  // Draft auto-save
  useEffect(() => {
    if (!open || !multiDeviceId) return;
    try {
      if (draftRows.length === 0) localStorage.removeItem(DRAFT_KEY(multiDeviceId));
      else localStorage.setItem(DRAFT_KEY(multiDeviceId), JSON.stringify(draftRows));
    } catch {}
  }, [draftRows, open, multiDeviceId]);

  const setD = (k: string, v: string) =>
    setCurrentRow(f => ({ ...f, dealData: { ...f.dealData, [k]: v } }));

  const num = (s: string) => s ? parseFloat(toEn(s).replace('٫', '.')) || null : null;
  const int = (s: string) => s ? parseInt(toEn(s)) || null : null;

  const openMulti = () => {
    if (devices.length === 0) { showAlert('اول یک دستگاه بسازید'); return; }
    if (birds.length === 0) { showAlert('اول پرنده بسازید'); return; }
    setMultiDeviceId(initialDevice || devices[0].id);
    setDraftRows([]);
    setCurrentRow({ ...makeRow(), birdId: birds[0].id, entryDate: todayJalali(), entryTime: nowTime() });
    setEditingRowId(null);
    setOpen(true);
  };

  const addRowToList = async () => {
    const cnt = parseInt(toEn(currentRow.count)) || 0;
    if (!currentRow.count.trim()) { showAlert('تعداد تخم اجباری است'); return; }
    if (cnt <= 0) { showAlert('تعداد باید بزرگتر از صفر باشد', '❌ خطا'); return; }
    if (!currentRow.entryDate.trim()) { showAlert('تاریخ ورود اجباری است'); return; }
    if (currentRow.dealType === 'purchase' && !currentRow.dealData.sellerId) { showAlert('فروشنده اجباری است'); return; }
    if (currentRow.dealType === 'partnership' && !currentRow.dealData.partnerId) { showAlert('شریک اجباری است'); return; }
    if (currentRow.dealType === 'own' && !currentRow.flockId) { showAlert('گله اجباری است'); return; }

    // چک آماده بودن گله
    if (currentRow.dealType === 'own' && currentRow.flockId) {
      const flk = flocks.find((f: any) => f.id === currentRow.flockId);
      const brd = birds.find(b => b.id === currentRow.birdId);
      const ready = flockReadyForEggs(flk, brd);
      if (!ready.ready) {
        showAlert('این گله هنوز به سن تخم‌گذاری نرسیده.\n\nسن فعلی — ' + toFa(ready.ageDays) + ' روز\nحداقل — ' + toFa(ready.minAge) + ' روز\n\n' + toFa(ready.daysLeft) + ' روز مانده', '⛔ گله آماده نیست');
        return;
      }
    }

    // چک هچ همزمان
    if (draftRows.length > 0 && currentRow.entryDate) {
      const curBird = birds.find(b => b.id === currentRow.birdId);
      const curHatchDate = addDaysJalali(currentRow.entryDate, incubationDays(curBird?.name || 'مرغ'));
      const conflicts: string[] = [];
      draftRows.forEach(r => {
        if (editingRowId && r._id === editingRowId) return;
        const rBird = birds.find(b => b.id === r.birdId);
        const rHatchDate = addDaysJalali(r.entryDate, incubationDays(rBird?.name || 'مرغ'));
        if (rHatchDate && curHatchDate && rHatchDate !== curHatchDate) {
          conflicts.push('ردیف ' + rBird?.name + ' → هچ ' + rHatchDate);
        }
      });
      if (conflicts.length > 0) {
        const msg = '⚠️ هچ همزمان نیست\n\n' +
          'هچ این ردیف — ' + curHatchDate + '\n' +
          'هچ ردیف‌های دیگر:\n' + conflicts.join('\n') + '\n\n' +
          '💡 برای هچ همزمان، پرنده دوره‌بلندتر رو زودتر وارد کن.\n\n' +
          'ادامه بدهم؟';
        if (!await showConfirmAsync('تأیید', msg)) return;
      }
    }

    // چک ظرفیت
    const device = devices.find(d => d.id === multiDeviceId);
    if (device) {
      const bird = birds.find(b => b.id === currentRow.birdId);
      const refCap = Math.max(...(device.capacityByBird || []).map((c: any) => c.capacity || 0));
      if (refCap > 0 && bird) {
        let used = 0;
        const __birdsById: Record<string, string> = {};
        for (const b of birds) __birdsById[b.id] = b.name;
        const allEntries = eggEntries.map(x => ({ ...x, __birdName: __birdsById[x.birdId] || '' }));
        allEntries.forEach(e => {
          if (e.status === 'failed') return;
          const cap = (device.capacityByBird || []).find((c: any) => c.birdName === e.__birdName);
          if (!cap?.capacity) return;
          used += (e.count || 0) * (refCap / cap.capacity);
        });
        draftRows.forEach(r => {
          if (editingRowId && r._id === editingRowId) return;
          const b = birds.find(x => x.id === r.birdId);
          if (!b) return;
          const cap = (device.capacityByBird || []).find((c: any) => c.birdName === b.name);
          if (!cap?.capacity) return;
          used += (parseInt(toEn(r.count)) || 0) * (refCap / cap.capacity);
        });
        const thisCap = (device.capacityByBird || []).find((c: any) => c.birdName === bird.name);
        if (thisCap?.capacity) {
          used += cnt * (refCap / thisCap.capacity);
        }
        const percent = Math.round((used / refCap) * 100);
        if (percent > 100) {
          const extra = Math.round((used - refCap) * 10) / 10;
          const ok = await showConfirmAsync('⚠️ با این ردیف، ظرفیت به ' + toFa(percent) + '٪ می‌رسد.\n' + 'واحد اضافی — ' + toFa(extra) + '\n\nادامه بدهم؟', 'تأیید');
          if (!ok) return;
        }
      }
    }

    if (editingRowId) {
      setDraftRows(rows => rows.map(r => r._id === editingRowId ? { ...currentRow, _id: editingRowId } : r));
      setEditingRowId(null);
    } else {
      setDraftRows(rows => [...rows, currentRow]);
    }
    setCurrentRow({ ...makeRow(), birdId: currentRow.birdId, entryDate: todayJalali(), entryTime: nowTime() });
  };

  const editRow = (row: DraftRow) => {
    setCurrentRow({ ...row });
    setEditingRowId(row._id);
  };

  const removeRow = async (id: string) => {
    const idx = draftRows.findIndex(r => r._id === id);
    if (idx < 0) return;
    const row = draftRows[idx];
    setDraftRows(rows => rows.filter(r => r._id !== id));
    setUndoRow({ row, idx });
    setTimeout(() => setUndoRow(cur => cur && cur.row._id === id ? null : cur), 6000);
    toastMsg.deleted('ردیف');
  };

  const undoRemoveRow = () => {
    if (!undoRow) return;
    setDraftRows(rows => {
      const next = [...rows];
      next.splice(undoRow.idx, 0, undoRow.row);
      return next;
    });
    setUndoRow(null);
    toastMsg.restored('ردیف');
  };

  const saveAll = async () => {
    if (draftRows.length === 0) { showAlert('حداقل یک ردیف اضافه کنید'); return; }
    const device = devices.find(d => d.id === multiDeviceId);
    if (!device) return;

    let savedCount = 0;
    draftRows.forEach(row => {
      try {
        const bird = birds.find(b => b.id === row.birdId);
        const birdName = bird?.name || 'مرغ';
        const expectedHatchDate = addDaysJalali(row.entryDate, incubationDays(birdName));
        const dealData: Record<string, any> = {};
        for (const [k, v] of Object.entries(row.dealData)) {
          const n = parseFloat(toEn(v).replace('٫', '.'));
          dealData[k] = !isNaN(n) && String(n) === toEn(v).replace('٫', '.') ? n : v;
        }
        const count = int(row.count);
        const unitPrice = num(row.unitPrice);
        const shippingCost = num(row.shippingCost);
        const data = {
          deviceId: multiDeviceId,
          hatchGroupId: '',
          birdId: row.birdId,
          breedId: row.breedId,
          count,
          entryDate: row.entryDate,
          entryTime: row.entryTime,
          expectedHatchDate,
          source: row.dealType === 'own' ? 'own' : 'external',
          dealType: row.dealType,
          dealStatus: row.dealStatus,
          dealWithdrawnAt: row.dealWithdrawnAt,
          dealWithdrawnReason: row.dealWithdrawnReason,
          dealData,
          flockId: row.flockId,
          trayNumbers: row.trayNumbers.trim(),
          unitPrice,
          totalPrice: count && unitPrice ? count * unitPrice : null,
          shippingCost,
          status: 'incubating' as const,
          notes: row.notes.trim(),
          generatedInvoiceId: '',
          generatedProductionId: '',
        };
        const newId = addEntry(data as any);

        const refIds: any = {};
        try {
          if (row.dealType === 'purchase' && row.dealData.sellerId) {
            const totalAmount = ((count || 0) * (unitPrice || 0)) + (shippingCost || 0);
            if (totalAmount > 0) {
              const invId = addInvoice({
                type: 'purchase', date: row.entryDate, partyId: row.dealData.sellerId, category: 'egg',
                items: [{ id: 'egg-' + Date.now(), name: 'تخم نطفه‌دار', quantity: count || 0, unit: 'عدد', unitPrice: unitPrice || 0, total: (count || 0) * (unitPrice || 0) }],
                total: totalAmount, payments: [], dueDate: row.entryDate,
                relatedFlockId: '', relatedEntryId: newId, notes: 'خرید تخم — ' + (device.name || ''),
              } as any);
              refIds.generatedInvoiceId = invId || '';
            }
          } else if (row.dealType === 'own' && row.flockId) {
            const prodId = addProduction({
              flockId: row.flockId, date: row.entryDate, totalCount: count || 0,
              brokenCount: 0, softCount: 0, dirtyCount: 0, avgWeight: null,
              notes: 'ورودی به جوجه‌کشی — ' + (device.name || ''),
            } as any);
            refIds.generatedProductionId = prodId || '';
          } else if (row.dealType === 'rent' && row.dealData.lessorId && row.dealData.rentAmount) {
            const rentAmount = parseFloat(toEn(row.dealData.rentAmount).replace('٫', '.')) || 0;
            if (rentAmount > 0) {
              const invId = addInvoice({
                type: 'purchase', date: row.entryDate, partyId: row.dealData.lessorId, category: 'service',
                items: [{ id: 'rent-' + Date.now(), name: 'اجاره دستگاه', quantity: 1, unit: 'خدمت', unitPrice: rentAmount, total: rentAmount }],
                total: rentAmount, payments: [], dueDate: row.dealData.rentDueDate || row.entryDate,
                relatedFlockId: '', relatedEntryId: newId, notes: 'اجاره — ' + (device.name || ''),
              } as any);
              refIds.generatedInvoiceId = invId || '';
            }
          }
        } catch {}
        if (newId && (refIds.generatedInvoiceId || refIds.generatedProductionId)) {
          updateEntry(newId, refIds);
        }
        savedCount++;
      } catch (err) {}
    });

    try { localStorage.removeItem(DRAFT_KEY(multiDeviceId)); } catch {}
    setDraftRows([]);
    setOpen(false);
    toastMsg.info(toFa(savedCount) + ' ورودی ثبت شد');
    if (onGoTo && await showConfirmAsync('تأیید', 'به کندلینگ برو؟')) {
      setTimeout(() => onGoTo('candlings'), 100);
    }
  };

  const openEdit = (e: EggEntry) => {
    const row: DraftRow = {
      _id: e.id,
      dealType: e.dealType,
      birdId: e.birdId,
      breedId: e.breedId,
      flockId: (e as any).flockId || '',
      count: e.count ? toFa(e.count) : '',
      trayNumbers: e.trayNumbers,
      unitPrice: e.unitPrice ? toFa(e.unitPrice) : '',
      shippingCost: (e as any).shippingCost ? toFa((e as any).shippingCost) : '',
      entryDate: e.entryDate,
      entryTime: (e as any).entryTime || nowTime(),
      notes: e.notes,
      dealData: Object.fromEntries(Object.entries(e.dealData || {}).map(([k, v]) => [k, v == null ? '' : String(v)])),
      dealStatus: (e as any).dealStatus || 'active',
      dealWithdrawnAt: (e as any).dealWithdrawnAt || '',
      dealWithdrawnReason: (e as any).dealWithdrawnReason || '',
      sampleWeightInitial: (e as any).sampleWeightInitial ? String((e as any).sampleWeightInitial) : '',
      sampleWeightCurrent: (e as any).sampleWeightCurrent ? String((e as any).sampleWeightCurrent) : '',
    };
    setMultiDeviceId(e.deviceId);
    setDraftRows([row]);
    setCurrentRow(row);
    setEditingRowId(row._id);
    setOpen(true);
  };

  const deleteEntryWithCascade = async (id: string) => {
    const entry = eggEntries.find(e => e.id === id) as any;
    if (!entry) return;
    let delInv = false, delProd = false;
    if (entry.generatedInvoiceId) {
      delInv = await showConfirmAsync('تأیید', 'این ورودی یک فاکتور در معاملات ساخته.\nتایید — فاکتور هم حذف شود\nلغو — فقط ورودی حذف شود', { danger: true });
    }
    if (entry.generatedProductionId) {
      delProd = await showConfirmAsync('تأیید', 'این ورودی یک رکورد تولید تخم ساخته.\nتایید — آن هم حذف شود\nلغو — فقط ورودی حذف شود', { danger: true });
    }
    if (delInv && entry.generatedInvoiceId) { try { deleteInvoice(entry.generatedInvoiceId); } catch {} }
    if (delProd && entry.generatedProductionId) { try { deleteProduction(entry.generatedProductionId); } catch {} }
    deleteEntry(id);
  };

  return {
    // state
    open, setOpen,
    multiDeviceId, setMultiDeviceId,
    hideHatchTip, setHideHatchTip,
    draftRows, setDraftRows,
    undoRow, setUndoRow,
    currentRow, setCurrentRow,
    editingRowId, setEditingRowId,
    // actions
    setD, openMulti, addRowToList, editRow, removeRow, undoRemoveRow,
    saveAll, openEdit, deleteEntryWithCascade,
    // helpers
    num, int,
  };
}
