/**
 * EggEntriesPage — ورودی تخم به دستگاه‌های انکوباسیون (Multi-row + Draft Auto-Save)
 */
import ProgressTracker from '../../shr/components/ProgressTracker';
import { useState, useMemo, useEffect } from 'react';
import {
  useInc, DEAL_LABEL, ENTRY_STATUS_LABEL, addDaysJalali,
  daysAgo, daysToHatch, isLockdown, isHatchWindow,
  incubationDays, daysFromProfiles, jalaliToDate, type EggEntry, type DealType
} from './store';
import { useBrd } from '../brd/store';
import { useFlk } from '../flk/store';
import { useCtc } from '../ctc/store';
import { useTra } from '../tra/store';
import { useEgg } from '../egg/store';
import { Btn, BtnRow, Empty, Field, Grid2, Input, Modal, MoneyField, NumField, PageContainer, SectionTitle, Select, Tag , Textarea } from '../../shr/components/ui';
import TimePicker from '../../shr/components/TimePicker';
import ExpandableCard, { InfoItem, StatBox, Dot } from '../../shr/components/ExpandableCard';
import DatePicker from '../../shr/components/DatePicker';
import { toFa, toEn } from '../../shr/utils/fa';
import { clampPercent, complement } from '../../shr/utils/smart';
import { showAlert, showConfirmAsync } from '../../cor/store/dialog';
import { showToast, toastMsg } from '../../cor/store/toast';
import SmartSelect from '../../shr/components/SmartSelect';
import { useFilterSort, FilterBar, getIncEntriesConfig } from '../../shr/filter';
import { todayJalali, Row, chip } from './helpers';
import EggEntryModal from './components/EggEntryModal';
import { makeRow, type DraftRow } from './types-eggentries';
import { nowTime, flockReadyForEggs, calcEntryDateForSyncHatch } from './api/eggEntriesCalc';
import { useSet } from '../set/store';

const DRAFT_KEY = (devId: string) => 'pm-inc-egg-draft-' + devId;

function calcDeviceUsage(
  device: any,
  entries: any[],
  newEntry?: { birdName: string; count: number }
): { used: number; total: number; percent: number } {
  const caps: any[] = device?.capacityByBird || [];
  if (caps.length === 0) return { used: 0, total: 0, percent: 0 };
  const refCap = Math.max(...caps.map(c => c.capacity || 0));
  if (refCap === 0) return { used: 0, total: 0, percent: 0 };
  const byBird: Record<string, number> = {};
  caps.forEach(c => {
    if (!c.birdName) return;
    const factor = (c.capacity && c.capacity > 0) ? (refCap / c.capacity) : 1;
    byBird[c.birdName] = factor;
  });
  let used = 0;
  entries.forEach(e => {
    if (e.status === 'failed') return;
    const factor = byBird[e.__birdName || ''];
    if (!factor) return;
    used += (e.count || 0) * factor;
  });
  if (newEntry) {
    const factor = byBird[newEntry.birdName];
    if (factor) used += newEntry.count * factor;
  }
  return {
    used: Math.round(used * 10) / 10,
    total: refCap,
    percent: Math.round((used / refCap) * 100),
  };
}

export default function EggEntriesPage({ initialDevice = '', onGoTo, active = true }: { initialDevice?: string; onGoTo?: (t: any, payload?: { entry?: string }) => void; active?: boolean } = {}) {
  const { devices, eggEntries, candlings, hatches, addEntry, updateEntry, deleteEntry } = useInc();
  const { birds, breeds } = useBrd();
  const { flocks } = useFlk();
  const { contacts } = useCtc();
  const { addInvoice, deleteInvoice } = useTra();
  const { addProduction, deleteProduction } = useEgg();

  const [open, setOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const _profiles = useSet((s: any) => s.incubationProfiles) || [];
  const _birdsById = useMemo(() => {
    const m: Record<string, any> = {};
    (birds || []).forEach((b: any) => { m[b.id] = b; });
    return m;
  }, [birds]);

  const _contactsById = useMemo(() => {
    const m: Record<string, any> = {};
    (contacts || []).forEach((cc: any) => { m[cc.id] = cc; });
    return m;
  }, [contacts]);

  const daysByName = useMemo(() => {
    const map = new Map<string, number>();
    birds.forEach((b: any) => map.set(b.name, daysFromProfiles(b.name, _profiles)));
    return map;
  }, [birds, _profiles]);
  const _daysLookup = (name: string | undefined): number => {
    if (!name) return 21;
    return daysByName.get(name) || daysFromProfiles(name, _profiles);
  };


  // ═══ Bulk mode state ═══
  const [multiDeviceId, setMultiDeviceId] = useState('');
  const [hideHatchTip, setHideHatchTip] = useState(() => { try { return localStorage.getItem('pm-inc-hide-hatch-tip') === '1'; } catch { return false; } });
  const [draftRows, setDraftRows] = useState<DraftRow[]>([]);
  const [undoRow, setUndoRow] = useState<{ row: DraftRow; idx: number } | null>(null);
  const [currentRow, setCurrentRow] = useState<DraftRow>(() => makeRow());
  const [editingRowId, setEditingRowId] = useState<string | null>(null);

  // ═══ Draft Auto-Load when device changes ═══
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

  // ═══ Migration خودکار: تاریخ میلادی → شمسی ═══
  useEffect(() => {
    const toJalali = (miladi: string): string => {
      try {
        const p = miladi.split('/').map(x => parseInt(x, 10));
        if (p.length !== 3) return miladi;
        const date = new Date(p[0], p[1] - 1, p[2]);
        const fmt = new Intl.DateTimeFormat('en-US-u-ca-persian', { year: 'numeric', month: '2-digit', day: '2-digit' });
        const parts = fmt.formatToParts(date);
        const jy = parseInt(parts.find(x => x.type === 'year')?.value || '0');
        const jm = parseInt(parts.find(x => x.type === 'month')?.value || '0');
        const jd = parseInt(parts.find(x => x.type === 'day')?.value || '0');
        return jy + '/' + String(jm).padStart(2, '0') + '/' + String(jd).padStart(2, '0');
      } catch { return miladi; }
    };

    eggEntries.forEach(e => {
      const ed = String(e.entryDate || '');
      const m = ed.match(/^(\d{4})\/(\d{2})\/(\d{2})$/);
      if (m && parseInt(m[1]) > 1900 && parseInt(m[1]) < 2100) {
        const jalaliDate = toJalali(ed);
        if (jalaliDate && jalaliDate !== ed) {
          updateEntry(e.id, { entryDate: jalaliDate, expectedHatchDate: '' } as any);
        }
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  // ═══ Draft Auto-Save ═══
  useEffect(() => {
    if (!open || !multiDeviceId) return;
    try {
      if (draftRows.length === 0) localStorage.removeItem(DRAFT_KEY(multiDeviceId));
      else localStorage.setItem(DRAFT_KEY(multiDeviceId), JSON.stringify(draftRows));
    } catch {}
  }, [draftRows, open, multiDeviceId]);

  const suppliers = useMemo(() => (contacts || []).filter((p: any) => (p.roles || []).includes('supplier')), [contacts]);
  const allPersons = contacts || [];

  const openMulti = () => {
    if (devices.length === 0) { showAlert('اول یک دستگاه بسازید'); return; }
    if (birds.length === 0) { showAlert('اول پرنده بسازید'); return; }
    setMultiDeviceId(initialDevice || devices[0].id);
    setDraftRows([]);
    setCurrentRow({ ...makeRow(), birdId: birds[0].id, entryDate: todayJalali(), entryTime: nowTime() });
    setEditingRowId(null);
    setOpen(true);
  };

  const setD = (k: string, v: string) => setCurrentRow(f => ({ ...f, dealData: { ...f.dealData, [k]: v } }));
  const num = (s: string) => s ? parseFloat(toEn(s).replace('٫', '.')) || null : null;
  const int = (s: string) => s ? parseInt(toEn(s)) || null : null;

  const addRowToList = async () => {
    const cnt = parseInt(toEn(currentRow.count)) || 0;
    if (!currentRow.count.trim()) { showAlert('تعداد تخم اجباری است'); return; }
    if (cnt <= 0) { showAlert('تعداد باید بزرگتر از صفر باشد', '❌ خطا'); return; }
    if (!currentRow.entryDate.trim()) { showAlert('تاریخ ورود اجباری است'); return; }
    if (currentRow.dealType === 'purchase' && !currentRow.dealData.sellerId) { showAlert('فروشنده اجباری است'); return; }
    if (currentRow.dealType === 'partnership' && !currentRow.dealData.partnerId) { showAlert('شریک اجباری است'); return; }
    if (currentRow.dealType === 'own' && !currentRow.flockId) { showAlert('گله اجباری است'); return; }

    // ═══ چک آماده بودن گله برای تخم‌گذاری ═══
    if (currentRow.dealType === 'own' && currentRow.flockId) {
      const flk = flocks.find((f: any) => f.id === currentRow.flockId);
      const brd = birds.find(b => b.id === currentRow.birdId);
      const ready = flockReadyForEggs(flk, brd);
      if (!ready.ready) {
        showAlert('این گله هنوز به سن تخم‌گذاری نرسیده.\n\nسن فعلی — ' + toFa(ready.ageDays) + ' روز\nحداقل — ' + toFa(ready.minAge) + ' روز\n\n' + toFa(ready.daysLeft) + ' روز مانده', '⛔ گله آماده نیست');
        return;
      }
    }

    // ═══ چک هچ همزمان (اختیاری) ═══
    // اگه چند ردیف با پرنده‌های متفاوت تو یه دستگاه هستن،
    // تاریخ ورود باید طوری باشه که روز هچ یکسان بشه
    if (draftRows.length > 0 && currentRow.entryDate) {
      const curBird = birds.find(b => b.id === currentRow.birdId);
      const curHatchDate = addDaysJalali(currentRow.entryDate, incubationDays(curBird?.name || 'مرغ'));
      // چک کن آیا ردیف دیگه‌ای با هچ متفاوت هست
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

    // ═══ چک ظرفیت ═══
    const device = devices.find(d => d.id === multiDeviceId);
    if (device) {
      const bird = birds.find(b => b.id === currentRow.birdId);
      const refCap = Math.max(...(device.capacityByBird || []).map((c: any) => c.capacity || 0));
      if (refCap > 0 && bird) {
        // محاسبه استفاده با این ردیف جدید (نه ردیف فعلی)
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
        // ردیف‌های دیگر (به جز ردیف در حال ویرایش)
        draftRows.forEach(r => {
          if (editingRowId && r._id === editingRowId) return;
          const b = birds.find(x => x.id === r.birdId);
          if (!b) return;
          const cap = (device.capacityByBird || []).find((c: any) => c.birdName === b.name);
          if (!cap?.capacity) return;
          used += (parseInt(toEn(r.count)) || 0) * (refCap / cap.capacity);
        });
        // این ردیف جدید
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
    toastMsg.deleted('ردیف')
  };

  const undoRemoveRow = () => {
    if (!undoRow) return;
    setDraftRows(rows => {
      const next = [...rows];
      next.splice(undoRow.idx, 0, undoRow.row);
      return next;
    });
    setUndoRow(null);
    toastMsg.restored('ردیف')
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

        // ═══ اتصالات خودکار ═══
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

    // پاک کردن draft
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

  const breedsForBird = useMemo(
    () => breeds.filter(b => b.birdId === currentRow.birdId),
    [breeds, currentRow.birdId]
  );

  // ═══ محاسبه استفاده دستگاه در فرم ═══
  const draftUsage = useMemo(() => {
    const device = devices.find(d => d.id === multiDeviceId);
    if (!device) return { used: 0, total: 0, percent: 0 };
    const allEntries = eggEntries.map(x => ({ ...x, __birdName: (birds.find(b => b.id === x.birdId)?.name) || '' }));
    let used = 0;
    const refCap = Math.max(...(device.capacityByBird || []).map((c: any) => c.capacity || 0));
    if (refCap === 0) return { used: 0, total: 0, percent: 0 };
    // فعلی
    allEntries.forEach(e => {
      if (e.status === 'failed') return;
      const cap = (device.capacityByBird || []).find((c: any) => c.birdName === e.__birdName);
      if (!cap?.capacity) return;
      used += (e.count || 0) * (refCap / cap.capacity);
    });
    // draft
    draftRows.forEach(r => {
      const bird = birds.find(b => b.id === r.birdId);
      if (!bird) return;
      const cap = (device.capacityByBird || []).find((c: any) => c.birdName === bird.name);
      if (!cap?.capacity) return;
      used += (parseInt(toEn(r.count)) || 0) * (refCap / cap.capacity);
    });
    return {
      used: Math.round(used * 10) / 10,
      total: refCap,
      percent: Math.round((used / refCap) * 100),
    };
  }, [multiDeviceId, draftRows, eggEntries, birds, devices]);

  // ═══ Live Usage — شامل ردیف در حال تایپ ═══
  const liveUsage = useMemo(() => {
    const device = devices.find(d => d.id === multiDeviceId);
    if (!device) return null;
    const refCap = Math.max(...(device.capacityByBird || []).map((c: any) => c.capacity || 0));
    if (refCap === 0) return null;

    let used = 0;
    // ورودی‌های ثبت‌شده
    eggEntries.forEach(e => {
      if (e.status === 'failed') return;
      const birdName = (birds.find(b => b.id === e.birdId)?.name) || '';
      const cap = (device.capacityByBird || []).find((c: any) => c.birdName === birdName);
      if (!cap?.capacity) return;
      used += (e.count || 0) * (refCap / cap.capacity);
    });
    // ردیف‌های draft (به جز ردیفی که الان ویرایش می‌شه)
    draftRows.forEach(r => {
      if (editingRowId && r._id === editingRowId) return;
      const b = birds.find(x => x.id === r.birdId);
      if (!b) return;
      const cap = (device.capacityByBird || []).find((c: any) => c.birdName === b.name);
      if (!cap?.capacity) return;
      used += (parseInt(toEn(r.count)) || 0) * (refCap / cap.capacity);
    });
    // ردیف در حال ویرایش/تایپ
    const curCnt = parseInt(toEn(currentRow.count)) || 0;
    const curBird = birds.find(b => b.id === currentRow.birdId);
    if (curBird && curCnt > 0) {
      const cap = (device.capacityByBird || []).find((c: any) => c.birdName === curBird.name);
      if (cap?.capacity) {
        used += curCnt * (refCap / cap.capacity);
      }
    }

    return {
      used: Math.round(used * 10) / 10,
      total: refCap,
      percent: Math.round((used / refCap) * 100),
      remaining: Math.round((refCap - used) * 10) / 10,
    };
  }, [multiDeviceId, draftRows, eggEntries, birds, devices, currentRow.birdId, currentRow.count, editingRowId]);

  // ═══ فیلتر لیست ═══
  // فیلتر/مرتب (FilterBar)
  const config = useMemo(
    () => getIncEntriesConfig({
      devices: devices.map(d => ({ id: d.id, name: d.name })),
      birds: birds.map(b => ({ id: b.id, name: b.name })),
    }),
    [devices, birds]
  );
  const { filtered: list, filters, setFilter, clearFilter, sort, setSort, toggleSort,
          resetAll, hasActiveFilters, total, count } = useFilterSort<EggEntry>({
    items: eggEntries,
    filters: config.filterDefs,
    sorts: config.sortDefs,
    persistKey: config.persistKey,
    initialSort: config.initialSort,
  });
  const multiDevice = devices.find(d => d.id === multiDeviceId);

  const renderRowSummary = (row: DraftRow, idx: number) => {
    const bird = birds.find(b => b.id === row.birdId);
    const sellerName = (row.dealData.sellerId && (contacts.find((c: any) => c.id === row.dealData.sellerId) as any)?.name) || '';
    const partnerName = (row.dealData.partnerId && (contacts.find((c: any) => c.id === row.dealData.partnerId) as any)?.name) || '';
    const flockName = row.flockId ? flocks.find((f: any) => f.id === row.flockId)?.name : '';
    const consigneeName = (row.dealData.consigneeId && (contacts.find((c: any) => c.id === row.dealData.consigneeId) as any)?.name) || '';
    const lessorName = (row.dealData.lessorId && (contacts.find((c: any) => c.id === row.dealData.lessorId) as any)?.name) || '';
    const party = sellerName || partnerName || flockName || consigneeName || lessorName || '—';

    return (
      <div key={row._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 6, padding: 'var(--pad-normal)', background: 'var(--input-bg)', borderRadius: 'var(--r-sm)', marginBottom: 4 }}>
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
          <span style={{ fontSize: 'var(--fs-sm)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {toFa(idx + 1)}. {DEAL_LABEL[row.dealType]} · {bird?.name || '—'} · {toFa(row.count || 0)} تخم
          </span>
          <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {party} · {toFa(row.entryDate)}
          </span>
        </div>
        <button type="button" onClick={() => editRow(row)} aria-label="ویرایش ردیف" style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', color: 'var(--text)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 'var(--fs-sm)', padding: '6px 10px', minWidth: 36, minHeight: 36, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>✏️</button>
        <button type="button" onClick={() => removeRow(row._id)} aria-label="حذف ردیف" style={{ background: 'none', border: '1px solid var(--danger)', borderRadius: 'var(--r-sm)', color: 'var(--danger)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 'var(--fs-sm)', padding: '6px 10px', minWidth: 36, minHeight: 36, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
      </div>
    );
  };

  return (
    <PageContainer>
      {undoRow && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '10px 14px', marginBottom: 8,
          background: 'var(--warn-soft)', border: '1px solid var(--warn)',
          borderRadius: 'var(--r-md)', fontSize: 'var(--fs-sm)',
        }}>
          <span>ردیف حذف شد</span>
          <button type="button" onClick={undoRemoveRow} aria-label="بازگردانی ردیف" style={{
            background: 'none', border: 'none', color: 'var(--warn)',
            fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
            fontSize: 'var(--fs-sm)', padding: '4px 10px',
          }}>بازگردانی</button>
        </div>
      )}
      <FilterBar
        filterDefs={config.filterDefs}
        sortDefs={config.sortDefs}
        filterState={filters}
        sortState={sort}
        setFilter={setFilter}
        clearFilter={clearFilter}
        setSort={setSort}
        toggleSort={toggleSort}
        resetAll={resetAll}
        hasActiveFilters={hasActiveFilters}
        total={total}
        count={count}
      />

      {list.length === 0 ? (
        <Empty icon={<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><ellipse cx="12" cy="14" rx="7" ry="9"/></svg>}
          title={eggEntries.length === 0 ? 'هنوز تخمی وارد دستگاه نشده' : 'ورودی مطابق فیلتر نیست'}
          desc={devices.length === 0 ? 'اول یک دستگاه بسازید.' : 'اولین بچ خود را ثبت کنید.'}
          action={<Btn variant="primary" onClick={openMulti}>+ ورود تخم</Btn>} />
      ) : (
        <>
          {list.map((e, i) => {
            const dev = devices.find(d => d.id === e.deviceId);
            const bird = birds.find(b => b.id === e.birdId);
            const breed = breeds.find(b => b.id === e.breedId);
            const age = daysAgo(e.entryDate);
            const expHatch = addDaysJalali(e.entryDate, (_daysLookup(bird?.name) || 21));
            const remain = daysToHatch(expHatch);
            const locked = isLockdown({ ...e, expectedHatchDate: expHatch });
            const hatchWindow = isHatchWindow({ ...e, expectedHatchDate: expHatch });
            const myHatch = hatches.find(h => h.eggEntryId === e.id);
            const isOpen = expandedId === e.id;

            let accent: any = 'accent';
            if (hatchWindow) accent = 'purple';
            else if (locked) accent = 'warn';

            let statusLabel = '';
            let statusTone: any = 'muted';
            const totalDays = (_daysLookup(bird?.name) || 21);
            if (myHatch) { statusLabel = '✅ هچ‌شده'; statusTone = 'green'; }
            else if (hatchWindow) { statusLabel = '🐣 پنجره هچ'; statusTone = 'purple'; }
            else if (locked) { statusLabel = '🔒 Lock-down'; statusTone = 'amber'; }
            else if (remain > 0) { statusLabel = toFa(remain) + ' روز مانده'; statusTone = 'accent'; }
            else if (remain === 0) { statusLabel = '🎯 امروز هچ'; statusTone = 'purple'; }
            else { statusLabel = '⚠️ گذشته از موعد هچ'; statusTone = 'amber'; }

            const partnerName = (e.dealData?.partnerId && (contacts.find((c: any) => c.id === e.dealData.partnerId) as any)?.name) || e.dealData?.partnerName || '';
            const sellerName = (e.dealData?.sellerId && (contacts.find((c: any) => c.id === e.dealData.sellerId) as any)?.name) || e.dealData?.sellerName || '';
            const consigneeName = (e.dealData?.consigneeId && (contacts.find((c: any) => c.id === e.dealData.consigneeId) as any)?.name) || e.dealData?.consigneeName || '';
            const lessorName = (e.dealData?.lessorId && (contacts.find((c: any) => c.id === e.dealData.lessorId) as any)?.name) || '';

            return (
              <ExpandableCard key={e.id} accent={accent} index={toFa(i + 1)} iconEmoji="🥚"
                title={toFa(e.count || 0) + ' تخم · ' + (bird?.name || '—') + (breed ? ' (' + breed.name + ')' : '')}
                subtitle={dev?.name || '—'}
                isOpen={isOpen} onToggle={() => setExpandedId(isOpen ? null : e.id)}
                badge={<Tag tone={statusTone}>{statusLabel}</Tag>}
                stats={<>
                  <StatBox icon="⏳" label="مانده" value={toFa(remain) + ' روز'} tone={remain <= 3 ? 'warn' : 'default'} />
                  <Dot />
                  <StatBox icon="📊" label="پیشرفت" value={toFa(Math.min(100, Math.round(age / Math.max(1, (_daysLookup(bird?.name) || 21)) * 100))) + '٪'} tone="accent" />
                </>}
              >
                {(() => {
                  const b = birds.find(x => x.id === e.birdId);
                  const total = (_daysLookup(b?.name) || 21);
                  const lbl = hatchWindow ? 'پنجره هچ باز است' : locked ? 'در Lock-down' : ('روز ' + toFa(age) + ' از ' + toFa(total));
                  return <ProgressTracker current={age} target={total} label={lbl} unit="روز" color={hatchWindow ? 'purple' : locked ? 'warn' : 'accent'} />;
                })()}

                <div style={{ fontSize: 'var(--fs-base)', color: 'var(--text)', fontWeight: 700, letterSpacing: '.3px' }}><span style={{ fontSize: '1.05em', lineHeight: 1, display: 'inline-block', marginLeft: 4 }}>📋</span> مشخصات</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <Row l="دستگاه" v={dev?.name || '—'} />
                  <Row l="پرنده" v={(bird?.name || '—') + (breed ? ' · ' + breed.name : '')} />
                  <Row l="تعداد" v={toFa(e.count || 0) + ' تخم'} />
                  <Row l="تاریخ ورود" v={toFa(e.entryDate)} />
                  <Row l="هچ پیش‌بینی" v={toFa(expHatch)} />
                  {e.trayNumbers && <Row l="طبقات" v={e.trayNumbers} />}
                  <Row l="وضعیت" v={ENTRY_STATUS_LABEL[e.status]} />
                </div>

                <div style={{ fontSize: 'var(--fs-base)', color: 'var(--text)', fontWeight: 700, letterSpacing: '.3px' }}>🤝 منبع</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <Row l="نوع" v={DEAL_LABEL[e.dealType]} />
                  {e.dealType === 'own' && (e as any).flockId && <Row l="گله" v={(flocks.find((f: any) => f.id === (e as any).flockId)?.name) || '—'} />}
                  {e.dealType === 'purchase' && sellerName && <Row l="فروشنده" v={String(sellerName)} />}
                  {e.dealType === 'partnership' && partnerName && <Row l="شریک" v={String(partnerName)} />}
                  {e.dealType === 'partnership' && e.dealData.partnerPercent && <Row l="درصد شریک" v={toFa(e.dealData.partnerPercent) + '٪'} />}
                  {e.dealType === 'rent' && lessorName && <Row l="اجاره‌دهنده" v={String(lessorName)} />}
                  {e.dealType === 'rent' && e.dealData.rentAmount && <Row l="اجاره" v={toFa(Number(e.dealData.rentAmount).toLocaleString('fa-IR')) + ' ت'} />}
                  {e.dealType === 'consignment' && consigneeName && <Row l="امانت‌دار" v={String(consigneeName)} />}
                  {(e as any).dealStatus === 'withdrawn' && (
                    <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--danger)', fontWeight: 700, padding: '4px 8px', background: 'var(--danger-soft)', borderRadius: 'var(--r-sm)' }}>
                      ⚠️ کنار کشیده {((e as any).dealWithdrawnAt ? ' (' + toFa((e as any).dealWithdrawnAt) + ')' : '')}
                    </div>
                  )}
                </div>

                {(e.unitPrice || e.totalPrice || (e as any).shippingCost) && (
                  <>
                    <div style={{ fontSize: 'var(--fs-base)', color: 'var(--text)', fontWeight: 700, letterSpacing: '.3px' }}><span style={{ fontSize: '1.05em', lineHeight: 1, display: 'inline-block', marginLeft: 4 }}>💰</span> مالی</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {e.unitPrice && <Row l="قیمت هر تخم" v={toFa(e.unitPrice.toLocaleString('fa-IR')) + ' ت'} />}
                      {(e as any).shippingCost && <Row l="هزینه حمل" v={toFa((e as any).shippingCost.toLocaleString('fa-IR')) + ' ت'} />}
                      {e.totalPrice && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--fs-sm)', padding: 'var(--pad-normal)', background: 'var(--input-bg)', color: 'var(--text)', borderRadius: 'var(--r-sm)', fontWeight: 700 }}>
                          <span>جمع تخم:</span><span>{toFa(e.totalPrice.toLocaleString('fa-IR'))} ت</span>
                        </div>
                      )}
                    </div>
                  </>
                )}

                {e.notes && (
                  <>
                    <div style={{ fontSize: 'var(--fs-base)', color: 'var(--text)', fontWeight: 700, letterSpacing: '.3px' }}><span style={{ fontSize: '1.05em', lineHeight: 1, display: 'inline-block', marginLeft: 4 }}>📝</span> یادداشت</div>
                    <div style={{ fontSize: 'var(--fs-sm)', lineHeight: 1.7, padding: 'var(--pad-normal)', background: 'var(--input-bg)', borderRadius: 'var(--r-sm)' }}>{e.notes}</div>
                  </>
                )}

                <div style={{ display: 'flex', gap: 6, paddingTop: 4 }}>
                  <Btn size="sm" onClick={() => openEdit(e)} style={{ flex: 1 }}>ویرایش</Btn>
                  <Btn size="sm" onClick={async () => {
                      const ok = await showConfirmAsync('تأیید حذف', 'این ورودی تخم حذف شود؟', { danger: true });
                      if (!ok) return;
                      deleteEntryWithCascade(e.id);
                    }} aria-label="حذف ورودی" style={{ flex: 1 }}>حذف</Btn>
                </div>
              </ExpandableCard>
            );
          })}
          <Btn variant="primary" full onClick={openMulti}>+ ورود تخم</Btn>
        </>
      )}

      <EggEntryModal
        open={open}
        onClose={() => setOpen(false)}
        editingRowId={editingRowId}
        hideHatchTip={hideHatchTip}
        setHideHatchTip={setHideHatchTip}
        multiDeviceId={multiDeviceId}
        setMultiDeviceId={setMultiDeviceId}
        draftRows={draftRows}
        currentRow={currentRow}
        setCurrentRow={setCurrentRow}
        devices={devices}
        birds={birds}
        breeds={breeds}
        flocks={flocks}
        contacts={contacts}
        suppliers={suppliers}
        allPersons={allPersons}
        breedsForBird={breedsForBird}
        liveUsage={liveUsage}
        setD={setD}
        addRowToList={addRowToList}
        editRow={editRow}
        removeRow={removeRow}
        saveAll={saveAll}
        resetCurrentRow={() => { setEditingRowId(null); setCurrentRow({ ...makeRow(), birdId: birds[0]?.id || '', entryDate: todayJalali(), entryTime: nowTime() }); }}
      />
    </PageContainer>
  );
}



