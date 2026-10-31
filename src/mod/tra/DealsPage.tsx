/**
 * DealsPage — معاملات خاص
 */
import { useState, useMemo , useEffect } from 'react';
import { useFab } from '../../shr/hooks/useFab';
import { useTra, DEAL_LABEL, type Deal, type DealType, type SettlementType, type DealGood, type DealDelivery, type DealSale, type DealPayment, type Settlement } from './store';
import { generateDealNumber } from './calc';
import { Row, SectionTitle, chip } from './helpers';
import { useNavigate } from 'react-router-dom';
import { useCtc } from '../ctc/store';
import { useFlk, getAgeDays, getLifecycle } from '../flk/store';
import { useInc } from '../inc/store';
import { useWhs, UNIT_LABEL } from '../whs/store';
import { Btn, BtnRow, CardActions, Empty, Field, Input, MoneyField, PercentField,
  Grid2, Modal, NumField,
  PageContainer, Select, Tag, ErrorBox , Textarea } from '../../shr/components/ui';import SmartSelect from '../../shr/components/SmartSelect';
import EntityLink from '../../shr/components/EntityLink';
import { BadgeOverflow, type BadgeItem } from '../../shr/components/ui/BadgeOverflow';
import { FieldHint } from '../../shr/intelligence';;
import ExpandableCard from '../../shr/components/ExpandableCard';
import { useMultiSelect } from '../../shr/multiSelect/useMultiSelect';
import { useFilterSort, FilterBar, getTraDealsConfig } from '../../shr/filter';
import MultiSelectBar from '../../shr/multiSelect/MultiSelectBar';
import DatePicker from '../../shr/components/DatePicker';
import TimePicker from '../../shr/components/TimePicker';
import SettlementModal from './components/SettlementModal';
import { createInvoiceFromSettlement } from './settlement';
import { applyDealMovements } from './applyDeal';
import DealRecycleBinModal from './components/DealRecycleBinModal';
import SettlementPrint from './components/SettlementPrint';
import { toFa, toEn } from '../../shr/utils/fa';
import { showConfirmAsync } from '../../cor/store/dialog';
import UndoBar from '../../cor/ui/UndoBar';
import { toastMsg } from '../../cor/store/toast';
import { parse as parseJ, format as formatJ } from 'date-fns-jalali';
import { logAction } from '../../cor/logger/auditLog';
import { useValidation } from '../../shr/validation/useValidation';
import { useFormErrors } from '../../shr/hooks/useFormErrors';
import { DealSchema } from '../../shr/validation/rules/tra';
import { HELP } from '../../shr/help/helpTexts';

interface F {
  id?: string;
  type: DealType; date: string; partyId: string;
  description: string; value: string; percent: string;
  dueDate: string;
  status: 'open' | 'settled' | 'cancelled';
  notes: string;
  dealNumber: string;
  startDate: string;
  endDate: string;
  settlementType: SettlementType | '';
  settlementValue: string;
  cancelReason: string;
  goods: DealGood[];
  deliveries: DealDelivery[];
  sales: DealSale[];
  payments: DealPayment[];
}

const empty = (): F => ({
  type: 'consignment', date: '', partyId: '',
  description: '', value: '', percent: '',
  dueDate: '',
  status: 'open',
  notes: '',
  dealNumber: '', startDate: '', endDate: '',
  settlementType: 'percent', settlementValue: '', cancelReason: '',
  goods: [], deliveries: [], sales: [], payments: [],
});

const STATUS_LABEL: Record<string, string> = {
  open: 'باز', settled: 'تسویه‌شده', cancelled: 'لغوشده'
};

export default function DealsPage({ active = true }: { active?: boolean } = {}) {
  const navigate = useNavigate();
  const { deals, invoices, addDeal, updateDeal, deleteDeal, addSettlement, updateSettlement, undoSettlement, reopenSettlement, settlements, addInvoice, reopenDeal, listDeletedDeals } = useTra();
  const { flocks } = useFlk();
  const { hatches } = useInc();

  const getSourceInfo = (g: DealGood) => {
    if (g.source === 'flock' && g.existingFlockId) {
      const f = flocks.find(x => x.id === g.existingFlockId);
      if (f) {
        const age = getAgeDays(f);
        const lc = getLifecycle(f.type, age, f.endOfCycleDay ?? null, null, f.layingStartDay ?? null);
        const typeLabel = f.type === 'layer' ? 'تخم‌گذار' : f.type === 'broiler' ? 'گوشتی' : 'مادر';
        return {
          available: Number(f.currentCount || 0),
          label: 'گله ' + f.name,
          rows: [
            ['نوع', typeLabel],
            ['سن', toFa(age) + ' روز'],
            ['فاز', lc.label],
            ['وضعیت', f.status === 'active' ? 'فعال' : 'غیرفعال'],
          ] as Array<[string, string]>,
        };
      }
    }
    if (g.source === 'hatch' && g.hatchId) {
      const h = hatches.find(x => x.id === g.hatchId);
      if (h) {
        return {
          available: Number(h.hatched || 0),
          label: 'هچ ' + h.date,
          rows: [
            ['تاریخ هچ', toFa(h.date)],
            ['هچ موفق', toFa(h.hatched || 0) + ' جوجه'],
            ['نطفه‌داری نشده', toFa(h.unhatched || 0)],
          ] as Array<[string, string]>,
        };
      }
    }
    if (g.stockItemId) {
      const it = whsItems.find(x => x.id === g.stockItemId);
      if (it) {
        return {
          available: Number(it.currentStock || 0),
          label: 'انبار ' + it.name,
          rows: [
            ['واحد', (UNIT_LABEL as any)[it.unit] || it.unit],
            ['قیمت آخرین', (it.lastPrice || 0) > 0 ? toFa(Number(it.lastPrice).toLocaleString('fa-IR')) + ' ت' : '—'],
          ] as Array<[string, string]>,
        };
      }
    }
    if (g.linkedItemId) {
      const it = whsItems.find(x => x.id === g.linkedItemId);
      if (it) {
        return {
          available: Number(it.currentStock || 0),
          label: 'انبار ' + it.name,
          rows: [
            ['واحد', (UNIT_LABEL as any)[it.unit] || it.unit],
          ] as Array<[string, string]>,
        };
      }
    }
    return null;
  };
  const whsItems = useWhs(s => s.items);
  const { contacts } = useCtc();

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<F>(empty());
  const [err, setErr] = useState('');
  const [undoData, setUndoData] = useState<{ item: any | any[] } | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [settlementOpen, setSettlementOpen] = useState(false);
  const [recycleOpen, setRecycleOpen] = useState(false);
  const [printSettlement, setPrintSettlement] = useState<{ settlement: Settlement; deal: Deal } | null>(null);
  const [settlementDeal, setSettlementDeal] = useState<Deal | null>(null);

  // فیلتر/مرتب
  const config = useMemo(() => {
    const partyNames: Record<string, string> = {};
    deals.forEach(d => {
      if (d.partyId && !partyNames[d.partyId]) {
        const c = contacts.find(x => x.id === d.partyId);
        if (c) partyNames[d.partyId] = c.name;
      }
    });
    return getTraDealsConfig({ partyNames });
  }, [deals, contacts]);
  const { filtered: list, filters, setFilter, clearFilter, sort, setSort, toggleSort,
          resetAll, hasActiveFilters, total, count, sortStack, appendSort } = useFilterSort<Deal>({
    items: deals,
    filters: config.filterDefs,
    sorts: config.sortDefs,
    persistKey: config.persistKey,
    initialSort: config.initialSort,
  });

  const undoDelete = () => {
    if (!undoData) return;
    const raw = (undoData as any).item;
    const arr: any[] = Array.isArray(raw) ? raw : [raw];
    try {
      for (const it of arr) {
        try { addDeal(it); } catch {}
      }
      toastMsg.restoredBulk(arr.length, 'مورد')
    } catch { toastMsg.error('بازگردانی ناموفق') }
    setUndoData(null);
  };
  // ─── Multi-Select ───
  const ms = useMultiSelect({
    items: list,
    getId: (x: any) => x.id,
    onDelete: async (ids: string[]) => {
      const ok = await showConfirmAsync('حذف گروهی', toFa(ids.length) + ' معامله حذف شوند؟', { danger: true });
      if (!ok) return;
      const _lInvC = ids.filter(id => invoices.some((inv: any) => inv.relatedDealId === id)).length;
      const _lFlkC = ids.filter(id => flocks.some((f: any) => f.dealData?.dealId === id)).length;
      if (_lInvC > 0 || _lFlkC > 0) {
        const _ptB: string[] = [];
        if (_lInvC > 0) _ptB.push(toFa(_lInvC) + ' معامله به فاکتور');
        if (_lFlkC > 0) _ptB.push(toFa(_lFlkC) + ' معامله به گله');
        const ok2 = await showConfirmAsync('هشدار', _ptB.join(' و ') + ' وصله. با حذف، این ارتباط قطع می‌شه. ادامه؟', { danger: true });
        if (!ok2) return;
      }

      const backups: any[] = [];
      for (const id of ids) {
        const it = deals.find(x => x.id === id);
        if (!it) continue;
        backups.push(it);
        try { handleDeleteDeal(id); } catch {}
      }
      if (backups.length > 0) {
        setUndoData({ item: backups });
        setTimeout(() => setUndoData((cur: any) => cur && Array.isArray(cur.item) && cur.item.length === backups.length ? null : cur), 8000);
      }
      toastMsg.deletedBulk(backups.length, 'معامله')
    },
  });

  useEffect(() => {
    if (ms.selectionMode) setExpandedId(null);
  }, [ms.selectionMode]);


  const openNew = () => {    const lastRec = deals.filter(d => d.partyId).sort((a, b) => (b.date || '').localeCompare(a.date || ''))[0];
    const defaultX = lastRec?.partyId || '';
    const today = formatJ(new Date(), 'yyyy/MM/dd');

    if (contacts.length === 0) { toastMsg.error('اول یک مخاطب بسازید'); return; }
    const defaultDue = (() => {
      const d = new Date();
      d.setDate(d.getDate() + 30);
      return formatJ(d, 'yyyy/MM/dd');
    })();
    setForm({ ...empty(), partyId: defaultX || contacts[0].id, date: today, dueDate: defaultDue, dealNumber: generateDealNumber(today, deals) });
    setErr(''); setOpen(true);
  };
  useFab(active ? { label: 'افزودن معامله', onClick: openNew } : null);

  const openEdit = (d: Deal) => {
    setForm({
      id: d.id, type: d.type, date: d.date, partyId: d.partyId,
      description: d.description,
      value: d.value ? toFa(d.value) : '',
      percent: d.percent === null || d.percent === undefined ? '' : toFa(d.percent),
      dueDate: d.dueDate || '',
      status: d.status,
      notes: d.notes || '',
      dealNumber: d.dealNumber || '',
      startDate: d.startDate || '',
      endDate: d.endDate || '',
      settlementType: (d.settlementType || '') as SettlementType | '',
      settlementValue: d.settlementValue ? toFa(d.settlementValue) : '',
      cancelReason: d.cancelReason || '',
      goods: d.goods || [],
      deliveries: d.deliveries || [],
      sales: d.sales || [],
      payments: d.payments || [],
    });
    setErr(''); setOpen(true);
  };

  const num = (s: string) => s ? parseFloat(toEn(s).replace('٫','.')) || 0 : 0;

  const { errors: vErrors } = useValidation(DealSchema, {
    type: form.type,
    date: form.date || '',
    partyId: form.partyId || '',
    description: form.description || '',
    value: form.value.trim() ? num(form.value) : undefined,
    percent: form.percent.trim() ? num(form.percent) : null,
    dueDate: form.dueDate || '',
    status: form.status,
    notes: form.notes || '',
    dealNumber: form.dealNumber || '',
    startDate: form.startDate || '',
    endDate: form.endDate || '',
    settlementType: (form.settlementType || undefined) as SettlementType | undefined,
    settlementValue: form.settlementValue.trim() ? num(form.settlementValue) : null,
    cancelReason: form.cancelReason || '',
    goods: form.goods,
    deliveries: form.deliveries,
    sales: form.sales,
    payments: form.payments,
  });
  const { showError, markTouched, attemptSave } = useFormErrors(vErrors);

  const handleDeleteFromCard = async (d: Deal) => {
    const invCount = invoices.filter((inv: any) => inv.relatedDealId === d.id).length;
    const flkCount = flocks.filter((f: any) => f.dealData?.dealId === d.id).length;
    let extraMsg = '';
    if (invCount > 0 || flkCount > 0) {
      const parts: string[] = [];
      if (invCount > 0) parts.push(toFa(invCount) + ' فاکتور');
      if (flkCount > 0) parts.push(toFa(flkCount) + ' گله');
      extraMsg = '\n\n⚠️ این معامله به ' + parts.join(' و ') + ' وصله. با حذف، این ارتباط قطع می‌شه.';
    }
    const ok = await showConfirmAsync('تأیید حذف', 'این معامله حذف شود؟' + extraMsg, { danger: true });
    if (!ok) return;
    handleDeleteDeal(d.id);
    logAction('delete', 'tra', 'حذف از معاملات');
    toastMsg.deleted('معامله');
  };

  const handleDeleteDeal = (id: string): void => {
    const deal = deals.find(d => d.id === id);
    if (deal?.deliveries && deal.deliveries.length > 0) {
      const whs = useWhs.getState();
      const flkState = useFlk.getState();
      for (const dv of deal.deliveries) {
        if (dv.whsMovementId) {
          try { whs.deleteMovement(dv.whsMovementId); } catch (e) { console.error('[deals->whs] deleteMovement (delete) failed:', e); }
        }
        if (dv.flockDeductedQuantity && dv.flockSourceId) {
          const flock = flkState.flocks.find(f => f.id === dv.flockSourceId);
          if (flock) {
            try { flkState.update(flock.id, { currentCount: (flock.currentCount || 0) - dv.flockDeductedQuantity }); } catch (e) { console.error('[deals->flk] reverse failed:', e); }
          }
        }
      }
    }
    deleteDeal(id);
  };

  // applyDealMovements moved to ./applyDeal (test extraction)


  const dealAging = (d: Deal): { days: number; tone: 'ok' | 'warn' | 'danger' } | null => {
    if (d.status === 'settled' || d.status === 'cancelled') return null;
    const target = d.dueDate || d.startDate || d.date;
    if (!target) return null;
    try {
      const en = target.replace(/[۰-۹]/g, (c: string) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(c)));
      const t = parseJ(en, 'yyyy/MM/dd', new Date());
      if (isNaN(t.getTime())) return null;
      const days = Math.floor((Date.now() - t.getTime()) / 86400000);
      if (days <= 0) return null;
      const tone: 'ok' | 'warn' | 'danger' = days < 30 ? 'ok' : days < 60 ? 'warn' : 'danger';
      return { days, tone };
    } catch { return null; }
  };

  const handleReopenDeal = async (deal: Deal) => {
  const statusLabel = deal.status === 'settled' ? 'تسویه‌شده' : 'لغو‌شده';
  const ok = await showConfirmAsync(
    'بازگشایی معامله',
    'این معامله از حالت «' + statusLabel + '» به «باز» برگردانده شود؟',
    { danger: false }
  );
  if (!ok) return;
  const success = reopenDeal(deal.id, 'بازگشایی توسط کاربر');
  if (!success) {
    toastMsg.error('بازگشایی ناموفق');
    return;
  }
  logAction('update', 'tra', 'بازگشایی معامله ' + (deal.dealNumber || deal.id));
  setTimeout(() => {
    openEdit({ ...deal, status: 'open' } as Deal);
  }, 100);
};

const handleConvertSettlement = async (settlement: Settlement, deal: Deal) => {
    if (settlement.invoiceId) {
      navigate('/tra?tab=sales&relatedDealId=' + deal.id);
      return;
    }
    const okConfirm = await showConfirmAsync('تبدیل به فاکتور', 'تسویه دوره‌ی ' + settlement.periodStart + ' تا ' + settlement.periodEnd + ' به فاکتور فروش تبدیل شود؟', { danger: false });
    if (!okConfirm) return;
    try {
      const invoiceData = createInvoiceFromSettlement(deal, settlement);
      const invId = addInvoice(invoiceData);
      updateSettlement(settlement.id, { status: 'invoiced', invoiceId: invId });
      toastMsg.success('فاکتور با موفقیت صادر شد');
    } catch (e) {
      console.error('[deals] convert settlement failed:', e);
      const msg = e instanceof Error ? e.message : String(e);
      toastMsg.error('خطا در تبدیل: ' + msg);
    }
  };

  const save = () => {
    attemptSave();
    if (Object.keys(vErrors).length > 0) { setErr(''); return; }

    // 🆕 Duplicate dealNumber check
    if (form.dealNumber.trim()) {
      const _dup = deals.find(d => d.id !== form.id && (d.dealNumber || '').trim() === form.dealNumber.trim());
      if (_dup) {
        setErr('شماره قرارداد «' + form.dealNumber.trim() + '» قبلاً استفاده شده — شماره دیگری انتخاب کنید');
        return;
      }
    }

    const pct: number | null = form.percent.trim() !== '' ? num(form.percent) : null;

    const data = {
      type: form.type,
      date: form.date.trim(),
      partyId: form.partyId,
      description: form.description.trim(),
      value: num(form.value),
      percent: pct,
      dueDate: form.dueDate.trim(),
      status: form.status,
      notes: form.notes.trim(),
      dealNumber: form.dealNumber.trim() || undefined,
      startDate: form.startDate.trim() || undefined,
      endDate: form.endDate.trim() || undefined,
      settlementType: (form.settlementType || undefined) as SettlementType | undefined,
      settlementValue: form.settlementValue.trim() ? num(form.settlementValue) : null,
      cancelReason: form.cancelReason.trim() || undefined,
      goods: form.goods,
      deliveries: form.deliveries,
      sales: form.sales,
      payments: form.payments,
    };
    const oldDeal = form.id ? deals.find(d => d.id === form.id) : undefined;
    try {
      if (form.settlementType !== 'barter' && form.dueDate) {
        if (form.date && form.dueDate < form.date) {
          setErr('سرسید نمی‌تواند قبل از تاریخ ایجاد باشد');
          return;
        }
        if (form.endDate && form.dueDate > form.endDate) {
          // warning only — not blocking, but reasonable to have dueDate >= endDate
          // Skip for now — will add as warning later
        }
      }
      for (const _g of form.goods) {
        const _si = getSourceInfo(_g);
        if (_si && Number(_g.quantity) > _si.available) {
          setErr('موجودی «' + _g.name + '» در ' + _si.label + ' کافی نیست — موجودی: ' + _si.available + '، درخواستی: ' + _g.quantity);
          return;
        }
      }
      applyDealMovements(form, oldDeal);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setErr('ذخیره ناموفق: ' + msg);
      return;
    }

    if (form.id === undefined) {
      addDeal(data);
    } else {
      updateDeal(form.id, data);
    }
    setOpen(false);
  };

  const accentFor = (status: string): 'accent' | 'warn' | 'dim' => {
    if (status === 'settled') return 'accent';
    if (status === 'cancelled') return 'dim';
    return 'warn';
  };

  const calc = useMemo(() => {
    const out = form.deliveries.filter(d => d.type === 'out').reduce((s, d) => s + (Number(d.quantity) || 0), 0);
    const ret = form.deliveries.filter(d => d.type === 'return').reduce((s, d) => s + (Number(d.quantity) || 0), 0);
    const loss = form.deliveries.filter(d => d.type === 'loss').reduce((s, d) => s + (Number(d.quantity) || 0), 0);
    const totalDelivered = out - ret - loss;
    const totalSold = form.sales.reduce((s, x) => s + (Number(x.quantity) || 0), 0);
    const inHand = totalDelivered - totalSold;
    const totalSales = form.sales.reduce((s, x) => s + ((Number(x.quantity) || 0) * (Number(x.unitPrice) || 0)), 0);
    const pct = Number(form.settlementValue) || 0;
    const commission = (form.settlementType === 'percent') ? Math.round(totalSales * pct / 100) : 0;
    const myShare = totalSales - commission;
    const paidIn = form.payments.filter(p => p.direction === 'in').reduce((s, p) => s + (Number(p.amount) || 0), 0);
    const paidOut = form.payments.filter(p => p.direction === 'out').reduce((s, p) => s + (Number(p.amount) || 0), 0);
    const balance = myShare - paidIn + paidOut;
    // Phase C — per-good breakdown (به تفکیک کالا)
    const perGood: Record<string, { name: string; delivered: number; sold: number; inHand: number }> = {};
    for (const g of form.goods) {
      const gOut = form.deliveries.filter(d => d.goodId === g.id && d.type === 'out').reduce((s, d) => s + (Number(d.quantity) || 0), 0);
      const gRet = form.deliveries.filter(d => d.goodId === g.id && d.type === 'return').reduce((s, d) => s + (Number(d.quantity) || 0), 0);
      const gLoss = form.deliveries.filter(d => d.goodId === g.id && d.type === 'loss').reduce((s, d) => s + (Number(d.quantity) || 0), 0);
      const gSold = form.sales.filter(x => x.goodId === g.id).reduce((s, x) => s + (Number(x.quantity) || 0), 0);
      const gDelivered = gOut - gRet - gLoss;
      perGood[g.id] = { name: g.name || '—', delivered: gDelivered, sold: gSold, inHand: gDelivered - gSold };
    }
    return { totalDelivered, totalSold, inHand, totalSales, commission, myShare, paidIn, paidOut, balance, perGood };
  }, [form.deliveries, form.sales, form.payments, form.settlementType, form.settlementValue, form.goods]);

  const stats = useMemo(() => {
    let active = 0, settled = 0, cancelled = 0, totalBalance = 0;
    for (const d of deals) {
      if (d.status === 'cancelled') { cancelled++; continue; }
      if (d.status === 'settled') { settled++; continue; }
      active++;
      const sales = (d.sales || []).reduce((s, x) => s + ((Number(x.quantity) || 0) * (Number(x.unitPrice) || 0)), 0);
      const pct = Number(d.settlementValue) || 0;
      const comm = (d.settlementType === 'percent') ? Math.round(sales * pct / 100) : 0;
      const myShare = sales - comm;
      const paidIn = (d.payments || []).filter(p => p.direction === 'in').reduce((s, p) => s + (Number(p.amount) || 0), 0);
      const paidOut = (d.payments || []).filter(p => p.direction === 'out').reduce((s, p) => s + (Number(p.amount) || 0), 0);
      totalBalance += myShare - paidIn + paidOut;
    }
    return { active, settled, cancelled, totalBalance };
  }, [deals]);

  return (
    <PageContainer>
      {undoData && (
        <UndoBar
          label="حذف شد"
          onUndo={undoDelete}
          onDismiss={() => setUndoData(null)}
        />
      )}
      {/* KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, marginBottom: 8 }}>
        <div style={{ padding: 'var(--pad-normal)', background: 'var(--accent-soft)', borderRadius: 'var(--r-md)', textAlign: 'center' }}>
          <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', marginBottom: 2 }}>فعال</div>
          <div style={{ fontSize: 'var(--fs-xl)', fontWeight: 700, color: 'var(--accent)' }}>{toFa(stats.active)}</div>
        </div>
        <div style={{ padding: 'var(--pad-normal)', background: 'var(--info-soft)', borderRadius: 'var(--r-md)', textAlign: 'center' }}>
          <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', marginBottom: 2 }}>تسویه‌شده</div>
          <div style={{ fontSize: 'var(--fs-xl)', fontWeight: 700, color: 'var(--info)' }}>{toFa(stats.settled)}</div>
        </div>
        <div style={{ padding: 'var(--pad-normal)', background: 'var(--danger-soft)', borderRadius: 'var(--r-md)', textAlign: 'center' }}>
          <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', marginBottom: 2 }}>لغو‌شده</div>
          <div style={{ fontSize: 'var(--fs-xl)', fontWeight: 700, color: 'var(--danger)' }}>{toFa(stats.cancelled)}</div>
        </div>
      </div>
      {stats.totalBalance !== 0 && (
        <div style={{ padding: 'var(--pad-normal)', background: stats.totalBalance > 0 ? 'var(--warn-soft)' : 'var(--accent-soft)', borderRadius: 'var(--r-md)', textAlign: 'center', marginBottom: 8, fontSize: 'var(--fs-sm)' }}>
          مجموع مانده‌های فعال: <b style={{ color: stats.totalBalance > 0 ? 'var(--warn)' : 'var(--accent)' }}>{toFa(Math.abs(stats.totalBalance).toLocaleString('fa-IR'))} تومان</b>
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
        toggleSort={toggleSort} sortStack={sortStack} appendSort={appendSort}
        recycleCount={listDeletedDeals().length}
        onOpenRecycleBin={() => setRecycleOpen(true)}
        recycleLabel="معامله"
        resetAll={resetAll}
        hasActiveFilters={hasActiveFilters}
        total={total}
        count={count}
      />

      {!ms.selectionMode && list.length > 1 && (
        <div style={{ fontSize: 'var(--fs-2xs)', color: 'var(--dim)', textAlign: 'center', paddingBottom: 2 }}>
          برای انتخاب چندتایی، روی یک کارت نگه دارید
        </div>
      )}

      {ms.selectionMode && list.length > 1 && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
          <button type="button"
            onClick={ms.selectedIds.size === list.length ? ms.clearSelection : ms.selectAll}
            style={{ padding: '4px 10px', background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', color: 'var(--muted)', fontFamily: 'inherit', fontSize: 'var(--fs-2xs)', fontWeight: 600, cursor: 'pointer' }}>
            {ms.selectedIds.size === list.length ? 'لغو انتخاب همه' : 'انتخاب همه'}
          </button>
        </div>
      )}

      {list.length === 0 ? (
        <Empty
          icon={<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><path d="M16 3h5v5M8 21H3v-5M21 3l-7 7M3 21l7-7"/></svg>}
          title="معامله‌ای ثبت نشده"
          desc="امانی، شراکتی، تهاتر، توافقی — همه از این‌جا."
          action={<Btn variant="primary" onClick={openNew}>+ ثبت معامله</Btn>}
        />
      ) : (
        <>
          {list.map((d, i) => {
            const party = contacts.find(c => c.id === d.partyId);
            const relatedInvoices = invoices.filter((inv: any) => inv.relatedDealId === d.id);
            const relatedFlocks = flocks.filter((f: any) => f.dealData?.dealId === d.id);
            const accent = accentFor(d.status);
            const isOpen = !ms.selectionMode && expandedId === d.id;
            const dealBadges: BadgeItem[] = [];
            dealBadges.push({ key: 'status', node: <Tag tone={d.status === 'settled' ? 'green' : d.status === 'cancelled' ? 'gray' : 'amber'}>{STATUS_LABEL[d.status]}</Tag> });
            const _ag = dealAging(d);
            if (_ag) {
              const _tone = _ag.tone === 'ok' ? 'green' : _ag.tone === 'warn' ? 'amber' : 'danger';
              dealBadges.push({ key: 'age', node: <Tag tone={_tone as any}>⏳ {toFa(_ag.days)} روز</Tag> });
            }
            if (relatedInvoices.length > 0) {
              dealBadges.push({ key: 'inv', node: <Tag tone="info">📄 {toFa(relatedInvoices.length)} فاکتور</Tag> });
            }
            if (relatedFlocks.length > 0) {
              dealBadges.push({ key: 'flk', node: <Tag tone="green">🐔 {toFa(relatedFlocks.length)} گله</Tag> });
            }
            return (
              <ExpandableCard
                key={d.id}
                id={d.id}
                ms={ms}
                accent={accent}
                index={toFa(i + 1)}
                iconEmoji="🤝"
                title={`${DEAL_LABEL[d.type]} — ${d.description}`}
                subtitle={`${party?.name || '—'} • ${toFa(d.date)}`}
                isOpen={isOpen}
                onToggle={() => setExpandedId(isOpen ? null : d.id)}
                badge={<BadgeOverflow badges={dealBadges} max={2} modalTitle={`برچسب‌های معامله #${d.dealNumber || '—'}`} />}
                stats={
                  <>
                    {d.value > 0 && <span>ارزش: <b style={{ color: 'var(--text)' }}>{toFa(d.value.toLocaleString('fa-IR'))} تومان</b></span>}
                    {d.percent !== null && d.percent !== undefined && <span>درصد: <b style={{ color: 'var(--text)' }}>{toFa(d.percent)}٪</b></span>}
                    {d.dueDate ? <span>سرسید: <b style={{ color: 'var(--text)' }}>{toFa(d.dueDate)}</b></span> : null}
                  </>
                }
              >
                {(d.dealNumber || d.startDate || d.settlementType) && (
                  <>
                    <SectionTitle><span style={{ fontSize: '1.05em', lineHeight: 1, display: 'inline-block', marginLeft: 4 }}>📋</span> اطلاعات قرارداد</SectionTitle>
                    <Grid2>
                      {d.dealNumber ? <Row l="شماره قرارداد" v={toFa(d.dealNumber)} /> : null}
                      {d.startDate ? <Row l="دوره" v={d.endDate ? `${toFa(d.startDate)} تا ${toFa(d.endDate)}` : toFa(d.startDate)} /> : null}
                      {d.settlementType ? <Row l="نوع تسویه" v={d.settlementType === 'percent' ? 'کمیسیون درصدی' : d.settlementType === 'barter' ? 'تهاتر مستقیم' : d.settlementType} /> : null}
                      {d.settlementValue ? <Row l="مقدار تسویه" v={toFa(d.settlementValue)} /> : null}
                    </Grid2>
                  </>
                )}

                {(d.goods && d.goods.length > 0) && (
                  <>
                    <SectionTitle><span style={{ fontSize: '1.05em', lineHeight: 1, display: 'inline-block', marginLeft: 4 }}>📦</span> کالاها و موجودی</SectionTitle>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {d.goods.map(g => {
                        const out = (d.deliveries || []).filter(dv => dv.goodId === g.id && dv.type === 'out').reduce((s, dv) => s + (Number(dv.quantity) || 0), 0);
                        const ret = (d.deliveries || []).filter(dv => dv.goodId === g.id && dv.type === 'return').reduce((s, dv) => s + (Number(dv.quantity) || 0), 0);
                        const loss = (d.deliveries || []).filter(dv => dv.goodId === g.id && dv.type === 'loss').reduce((s, dv) => s + (Number(dv.quantity) || 0), 0);
                        const delivered = out - ret - loss;
                        const sold = (d.sales || []).filter(s => s.goodId === g.id).reduce((s, x) => s + (Number(x.quantity) || 0), 0);
                        const inHand = delivered - sold;
                        return (
                          <Row key={g.id} l={g.name} v={`تحویل: ${toFa(delivered)} | فروش: ${toFa(sold)} | مانده: ${toFa(inHand)}`} />
                        );
                      })}
                    </div>
                  </>
                )}

                <SectionTitle><span style={{ fontSize: '1.05em', lineHeight: 1, display: 'inline-block', marginLeft: 4 }}>💰</span> خلاصه مالی</SectionTitle>
                <Grid2>
                  <Row l="فروش کل" v={`${toFa((d.sales || []).reduce((s, x) => s + ((Number(x.quantity) || 0) * (Number(x.unitPrice) || 0)), 0).toLocaleString('fa-IR'))} ت`} />
                  <Row l="دریافت‌شده" v={`${toFa((d.payments || []).filter(p => p.direction === 'in').reduce((s, p) => s + (Number(p.amount) || 0), 0).toLocaleString('fa-IR'))} ت`} />
                </Grid2>

                <SectionTitle><span style={{ fontSize: '1.05em', lineHeight: 1, display: 'inline-block', marginLeft: 4 }}>📝</span> توضیحات</SectionTitle>
                <div style={{ fontSize: 'var(--fs-sm)', lineHeight: 1.7, padding: 'var(--pad-normal)', background: 'var(--input-bg)', borderRadius: 'var(--r-sm)' }}>{d.description}</div>

                {d.notes ? (
                  <>
                    <SectionTitle><span style={{ fontSize: '1.05em', lineHeight: 1, display: 'inline-block', marginLeft: 4 }}>📝</span> یادداشت</SectionTitle>
                    <div style={{ fontSize: 'var(--fs-sm)', lineHeight: 1.7, padding: 'var(--pad-normal)', background: 'var(--input-bg)', borderRadius: 'var(--r-sm)' }}>{d.notes}</div>
                  </>
                ) : null}
                {(() => {
                  const dealSettlements = settlements.filter(s => s.dealId === d.id);
                  if (dealSettlements.length === 0) return null;
                  return (
                    <>
                      <SectionTitle><span style={{ fontSize: '1.05em', lineHeight: 1, display: 'inline-block', marginLeft: 4 }}>📅</span> تسویه‌های دوره‌ای ({toFa(dealSettlements.length)})</SectionTitle>
                      {dealSettlements.map((st: any) => {
                        const statusLabel = st.status === 'draft' ? 'پیش‌نویس' : st.status === 'confirmed' ? 'تأییدشده' : 'فاکتورشده';
                        const statusColor = st.status === 'draft' ? 'var(--muted)' : st.status === 'confirmed' ? 'var(--info)' : 'var(--accent)';
                        const netTxt = toFa(Number(st.netPayable || 0).toLocaleString('fa-IR'));
                        return (
                          <div key={st.id} style={{ padding: 'var(--pad-tight)', background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', display: 'flex', flexDirection: 'column', gap: 4, fontSize: 'var(--fs-xs)', marginBottom: 4 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ color: 'var(--muted)' }}>{toFa(st.periodStart)} — {toFa(st.periodEnd)}</span>
                              <span style={{ fontWeight: 700, color: statusColor }}>{statusLabel}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 4 }}>
                              <span style={{ fontWeight: 700, color: 'var(--accent)' }}>خالص: {netTxt} ت</span>
                              <div style={{ display: 'flex', gap: 4 }}>
                                <Btn size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); setPrintSettlement({ settlement: st, deal: d }); }}>🖨️ چاپ</Btn>
                                <Btn size="sm" variant={st.invoiceId ? 'outline' : 'primary'} onClick={(e) => { e.stopPropagation(); handleConvertSettlement(st, d); }}>
                                  {st.invoiceId ? '📄 مشاهده فاکتور' : '🧾 تبدیل به فاکتور'}
                                </Btn>
                              </div>
                            </div>
                            {st.invoiceId && (
                              <Row l="فاکتور فروش" v={<EntityLink type="invoice" id={st.invoiceId} label="مشاهده" />} />
                            )}
                            {st.status === 'invoiced' && (
                              <BtnRow><Btn size="sm" variant="danger" onClick={async (e) => {
                                e.stopPropagation();
                                const ok = await showConfirmAsync('لغو تبدیل به فاکتور', 'فاکتور مربوطه حذف می‌شه و تسویه به «تأییدشده» برمی‌گرده. ادامه؟', { danger: true });
                                if (!ok) return;
                                try {
                                  undoSettlement(st.id);
                                  toastMsg.success('تسویه به تأییدشده برگشت');
                                } catch (err) {
                                  toastMsg.error(err instanceof Error ? err.message : 'خطا در لغو');
                                }
                              }}>↩️ لغو تبدیل</Btn></BtnRow>
                            )}
                            {st.status === 'confirmed' && (
                              <BtnRow><Btn size="sm" variant="outline" onClick={async (e) => {
                                e.stopPropagation();
                                const ok = await showConfirmAsync('بازگشت به پیش‌نویس', 'این تسویه به پیش‌نویس برمی‌گرده و قابل ویرایش می‌شه. ادامه؟', { danger: false });
                                if (!ok) return;
                                try {
                                  reopenSettlement(st.id);
                                  toastMsg.success('تسویه به پیش‌نویس برگشت');
                                } catch (err) {
                                  toastMsg.error(err instanceof Error ? err.message : 'خطا');
                                }
                              }}>✏️ بازگشت به پیش‌نویس</Btn></BtnRow>
                            )}
                          </div>
                        );
                      })}
                    </>
                  );
                })()}
                
                <CardActions actions={[
                  {
                    label: d.status === 'open' ? 'تسویه شد' : '🔓 بازگشایی',
                    variant: d.status === 'open' ? 'outline' : 'primary',
                    onClick: () => d.status === 'open' ? updateDeal(d.id, { status: 'settled' }) : handleReopenDeal(d),
                  },
                  {
                    label: '📅 تسویه',
                    variant: 'outline',
                    onClick: () => { setSettlementDeal(d); setSettlementOpen(true); },
                  },
                  {
                    label: 'ویرایش',
                    variant: 'outline',
                    hidden: d.status !== 'open',
                    onClick: () => openEdit(d),
                  },
                  {
                    label: 'حذف',
                    variant: 'danger',
                    onClick: () => { void handleDeleteFromCard(d); },
                  },
                ]} />
              </ExpandableCard>
            );
          })}
        </>
      )}

            <DealRecycleBinModal open={recycleOpen} onClose={() => setRecycleOpen(false)} />
      {printSettlement && (
        <SettlementPrint
          settlement={printSettlement.settlement}
          deal={printSettlement.deal}
          onClose={() => setPrintSettlement(null)}
        />
      )}
      
      <SettlementModal
        key={settlementDeal?.id || 'none'}
        open={settlementOpen}
        deal={settlementDeal}
        onClose={() => { setSettlementOpen(false); setSettlementDeal(null); }}
        onSave={(s) => {
          try {
            addSettlement(s);
            setSettlementOpen(false);
            setSettlementDeal(null);
          } catch (e) {
            toastMsg.error(e instanceof Error ? e.message : 'خطا در ذخیره تسویه');
          }
        }}
      />
      <MultiSelectBar ms={ms} deleteLabel="حذف" />

      {ms.selectionMode && <div style={{ height: 90 }} />}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={form.id ? 'ویرایش معامله' : 'ثبت معامله خاص'}
        footer={<BtnRow><Btn variant="primary" onClick={save}>ذخیره</Btn><Btn onClick={() => setOpen(false)}>لغو</Btn></BtnRow>}
      >
        {/* ═══ 📋 اطلاعات قرارداد ═══ */}
        <div style={{ paddingTop: 8, marginTop: 4, borderTop: '1px dashed var(--border)', fontSize: 'var(--fs-base)', fontWeight: 700, color: 'var(--text)', letterSpacing: '.3px' }}>📋 اطلاعات قرارداد</div>

        <Grid2>
          <Field label="شماره قرارداد" error={showError?.('dealNumber')} onTouch={() => markTouched?.('dealNumber')}>
            <Input placeholder="۱۴۰۴-۰۰۱" value={form.dealNumber} onChange={e => setForm({...form, dealNumber: e.target.value})} />
          </Field>
          <Field label="نوع معامله" required help={HELP.tra.deal.type} error={showError?.('type')} onTouch={() => markTouched?.('type')}>
            <Select value={form.type} onChange={e => {
                const newType = e.target.value as DealType;
                const updates: Partial<F> = { type: newType };
                if (!form.settlementType) {
                  if (newType === 'consignment') updates.settlementType = 'percent';
                  else if (newType === 'barter') updates.settlementType = 'barter';
                  else if (newType === 'partnership') updates.settlementType = 'percent';
                }
                setForm(f => ({ ...f, ...updates }));
              }}>
              {(Object.keys(DEAL_LABEL) as DealType[]).map(t => <option key={t} value={t}>{DEAL_LABEL[t]}</option>)}
            </Select>
          </Field>
        </Grid2>

        <Grid2>
          <Field label="تاریخ ایجاد" required error={showError?.('date')} onTouch={() => markTouched?.('date')}>
            <DatePicker value={form.date} onChange={v => setForm({...form, date: v})} autoToday />
          </Field>
          <Field label="طرف قرارداد" required error={showError?.('partyId')} onTouch={() => markTouched?.('partyId')}>
            <SmartSelect
              value={form.partyId}
              onChange={v => setForm({...form, partyId: v})}
              options={contacts.filter(c => c.roles?.includes('customer')).map(c => ({ value: c.id, label: c.name, subtitle: c.phone || undefined }))}
              placeholder="— انتخاب کنید —"
              modalTitle="انتخاب طرف معامله"
              autoThreshold={6}
            />
          </Field>
        </Grid2>

        <Field label="توضیحات" required error={showError?.('description')} onTouch={() => markTouched?.('description')}>
          <Textarea placeholder="توضیح معامله..." value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
        </Field>

        {/* ═══ 📅 محدوده زمانی ═══ */}
        <div style={{ paddingTop: 8, marginTop: 4, borderTop: '1px dashed var(--border)', fontSize: 'var(--fs-base)', fontWeight: 700, color: 'var(--text)', letterSpacing: '.3px' }}>📅 محدوده زمانی</div>

        <Grid2>
          <Field label="تاریخ شروع" error={showError?.('startDate')} onTouch={() => markTouched?.('startDate')}>
            <DatePicker value={form.startDate} onChange={v => setForm({...form, startDate: v})} placeholder="از چه تاریخی؟" />
          </Field>
          <Field label="تاریخ پایان" error={showError?.('endDate')} onTouch={() => markTouched?.('endDate')}>
            <DatePicker value={form.endDate} onChange={v => setForm({...form, endDate: v})} placeholder="تا چه تاریخی؟" />
          </Field>
        </Grid2>

        {/* ═══ 💰 مالی و تسویه ═══ */}
        <div style={{ paddingTop: 8, marginTop: 4, borderTop: '1px dashed var(--border)', fontSize: 'var(--fs-base)', fontWeight: 700, color: 'var(--text)', letterSpacing: '.3px' }}>💰 مالی و تسویه</div>

        <Grid2>
          <Field label="مبلغ قرارداد" error={showError?.('value')} onTouch={() => markTouched?.('value')}>
            <MoneyField value={form.value} onChange={e => setForm({...form, value: e.target.value})} min={0} max={1_000_000_000_000_000} />
            {Number(form.value) > 0 && <FieldHint fieldPath="tra.deal.value" value={form.value} />}
          </Field>
          {form.settlementType !== 'barter' ? (
            <Field label="مهلت پرداخت (سرسید)" hint="تاریخی که طرف باید پول را پرداخت کند" error={showError?.('dueDate')} onTouch={() => markTouched?.('dueDate')}>
              <DatePicker value={form.dueDate} onChange={v => setForm({...form, dueDate: v})} autoToday />
            </Field>
          ) : <div />}
        </Grid2>

        <Grid2>
          <Field label="نوع تسویه" help={HELP.tra.deal.settlementType} error={showError?.('settlementType')} onTouch={() => markTouched?.('settlementType')}>
            <Select value={form.settlementType || 'percent'} onChange={e => setForm({...form, settlementType: e.target.value as SettlementType})}>
              <option value="percent">💰 درصدی</option>
              <option value="per_unit">💵 به ازای هر واحد</option>
              <option value="fixed">📋 مبلغ ثابت</option>
              <option value="rental">📅 ماهانه</option>
              <option value="barter">🔄 تهاتر</option>
            </Select>
          </Field>
          {form.settlementType && form.settlementType !== 'barter' && (
          <Field label={form.settlementType === 'percent' ? 'درصد کمیسیون طرف' : 'مقدار تسویه'} error={showError?.('settlementValue')} onTouch={() => markTouched?.('settlementValue')}>
            {form.settlementType === 'percent' ? (
              <PercentField
                placeholder="۱۰"
                value={form.settlementValue}
                onChange={e => setForm({...form, settlementValue: e.target.value})}
              />
            ) : (
              <MoneyField
                placeholder="۵۰۰۰۰۰۰"
                value={form.settlementValue}
                onChange={e => setForm({...form, settlementValue: e.target.value})}
                min={0}
                max={1_000_000_000_000}
              />
            )}
          </Field>
        )}

        {form.settlementType === 'percent' && Number(form.settlementValue) > 0 && calc.totalSales > 0 && (
          <div style={{ padding: '8px 12px', background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', fontSize: 'var(--fs-xs)', display: 'flex', flexDirection: 'column', gap: 4, marginTop: 4 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--muted)' }}>📊 کمیسیون طرف:</span>
              <span style={{ fontWeight: 700, color: 'var(--warn)' }}>{toFa(Math.round(calc.totalSales * Number(form.settlementValue) / 100).toLocaleString('fa-IR'))} ت</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--muted)' }}>💰 سهم شما:</span>
              <span style={{ fontWeight: 700, color: 'var(--accent)' }}>{toFa(Math.round(calc.totalSales * (100 - Number(form.settlementValue)) / 100).toLocaleString('fa-IR'))} ت</span>
            </div>
          </div>
        )}

          {form.type === 'partnership' && (
            <Field label="درصد" hint="۰ تا ۱۰۰" error={showError?.('percent')} onTouch={() => markTouched?.('percent')}>
              <PercentField placeholder="۱۰" value={form.percent} onChange={e => setForm({...form, percent: e.target.value})} />
            </Field>
          )}
        </Grid2>

        

        {/* ═══ 📊 وضعیت ═══ */}
        <div style={{ paddingTop: 8, marginTop: 4, borderTop: '1px dashed var(--border)', fontSize: 'var(--fs-base)', fontWeight: 700, color: 'var(--text)', letterSpacing: '.3px' }}>📊 وضعیت</div>

        <Field label="وضعیت" help={HELP.tra.deal.status} error={showError?.('status')} onTouch={() => markTouched?.('status')}>
          <Select value={form.status} onChange={e => setForm({...form, status: e.target.value as 'open' | 'settled' | 'cancelled'})}>
            <option value="open">باز</option>
            <option value="settled">تسویه‌شده</option>
            <option value="cancelled">لغوشده</option>
          </Select>
        </Field>

        {form.status === 'cancelled' && (
          <Field label="دلیل لغو" required error={showError?.('cancelReason')} onTouch={() => markTouched?.('cancelReason')}>
            <Textarea placeholder="چرا لغو شد؟" value={form.cancelReason} onChange={e => setForm({...form, cancelReason: e.target.value})} />
          </Field>
        )}

              {/* کالاهای تحویلی */}
      <div style={{ paddingTop: 12, marginTop: 4, borderTop: '1px dashed var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <span style={{ fontSize: 'var(--fs-base)', fontWeight: 700, color: 'var(--text)', letterSpacing: '.3px' }}>📦 کالاهای تحویلی</span>
      </div>

      {form.goods.map((g, gi) => (
        <div key={g.id} style={{ padding: 'var(--pad-normal)', background: 'var(--card-solid)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', fontWeight: 700 }}>کالای {toFa(gi + 1)}</span>
            <button type="button" onClick={() => setForm(f => ({ ...f, goods: f.goods.filter(x => x.id !== g.id), deliveries: f.deliveries.filter(x => x.goodId !== g.id), sales: f.sales.filter(x => x.goodId !== g.id) }))} style={{ background: 'var(--danger-soft)', border: '1px solid var(--danger)', color: 'var(--danger)', cursor: 'pointer', borderRadius: 'var(--r-sm)', width: 28, height: 28, padding: 0, fontFamily: 'inherit', fontWeight: 700 }}>✕</button>
          </div>
          <Field label="دسته کالا" hint="انتخاب دسته، منبع کالا را تعیین می‌کند" error={showError?.(`goods.${gi}.category`)} onTouch={() => markTouched?.(`goods.${gi}.category`)}>
            <Select value={g.category || ''} onChange={e => {
              const newCat = (e.target.value || undefined) as any;
              const DEFAULT_NAMES: Record<string, string> = {
                chick: 'جوجه یک‌روزه', adult: 'پرنده بالغ', egg: 'تخم خوراکی', fertile_egg: 'تخم نطفه‌دار'
              };
              setForm(f => ({ ...f, goods: f.goods.map(x => {
                if (x.id !== g.id) return x;
                const prevDef = x.category ? (DEFAULT_NAMES[x.category] || '') : '';
                const shouldUpdate = !x.name.trim() || x.name === prevDef;
                const newName = shouldUpdate ? (DEFAULT_NAMES[newCat || ''] || '') : x.name;
                // برای feed/medicine/equipment: اگه نام خالی، خالی بمونه (کاربر خودش تایپ می‌کنه)
                const keepEmpty = ['feed', 'medicine', 'equipment', 'other'].includes(newCat || '');
                return { 
                  ...x, 
                  category: newCat, 
                  source: undefined,
                  existingFlockId: undefined,
                  hatchId: undefined,
                  stockItemId: undefined,
                  linkedItemId: undefined,
                  name: keepEmpty && shouldUpdate ? '' : newName 
                };
              }) }));
            }}>
              <optgroup label="🌱 دام و طیور — پیگیری چند مرحله‌ای">
                <option value="chick">🐣 جوجه یک‌روزه</option>
                <option value="adult">🐔 پرنده بالغ</option>
                <option value="egg">🥚 تخم خوراکی</option>
                <option value="fertile_egg">🥚 تخم نطفه‌دار</option>
              </optgroup>
              <optgroup label="📦 کالاهای فروش و مصرف انبار">
                <option value="feed">🌾 دان و خوراک</option>
                <option value="medicine">💊 دارو / واکسن</option>
                <option value="equipment">🔧 تجهیزات</option>
                <option value="other">📋 سایر</option>
              </optgroup>
            </Select>
          </Field>
          {(g.category === 'chick') && (
              <>
                <Field label="منبع جوجه" required>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                    <button type="button" onClick={() => setForm(f => ({ ...f, goods: f.goods.map(x => x.id === g.id ? { ...x, source: 'flock', hatchId: undefined } : x) }))} style={{ padding: '8px', background: g.source === 'flock' ? 'var(--accent-soft)' : 'var(--input-bg)', border: '1px solid ' + (g.source === 'flock' ? 'var(--accent-border)' : 'var(--border)'), borderRadius: 'var(--r-sm)', color: g.source === 'flock' ? 'var(--accent)' : 'var(--muted)', fontWeight: g.source === 'flock' ? 700 : 500, fontFamily: 'inherit', fontSize: 'var(--fs-xs)', cursor: 'pointer' }}>🐔 گله موجود</button>
                    <button type="button" onClick={() => setForm(f => ({ ...f, goods: f.goods.map(x => x.id === g.id ? { ...x, source: 'hatch', existingFlockId: undefined } : x) }))} style={{ padding: '8px', background: g.source === 'hatch' ? 'var(--accent-soft)' : 'var(--input-bg)', border: '1px solid ' + (g.source === 'hatch' ? 'var(--accent-border)' : 'var(--border)'), borderRadius: 'var(--r-sm)', color: g.source === 'hatch' ? 'var(--accent)' : 'var(--muted)', fontWeight: g.source === 'hatch' ? 700 : 500, fontFamily: 'inherit', fontSize: 'var(--fs-xs)', cursor: 'pointer' }}>🐣 هچری</button>
                  </div>
                </Field>
                {g.source === 'flock' && (
                  <Field label="گله مبدأ" required hint={g.existingFlockId ? (() => {
                    const f = flocks.find(x => x.id === g.existingFlockId);
                    if (!f) return undefined;
                    const age = getAgeDays(f);
                    const lc = getLifecycle(f.type, age, f.endOfCycleDay ?? null, null, f.layingStartDay ?? null);
                    const fType = f.type === 'layer' ? 'تخم‌گذار' : f.type === 'broiler' ? 'گوشتی' : 'مادر';
                    return '📊 موجودی: ' + toFa(f.currentCount || 0) + ' | سن: ' + toFa(age) + ' روز | ' + fType + ' | ' + lc.label;
                  })() : undefined}>
                    <Select value={g.existingFlockId || ''} onChange={e => setForm(f => ({ ...f, goods: f.goods.map(x => x.id === g.id ? { ...x, existingFlockId: e.target.value || undefined } : x) }))}>
                      <option value="">— انتخاب —</option>
                      {flocks.filter(f => f.status === 'active').map(f => {
                        const hasStock = (f.currentCount || 0) > 0;
                        return (
                          <option key={f.id} value={f.id} disabled={!hasStock}>
                            {f.name} — {toFa(f.currentCount || 0)} پرنده{!hasStock ? ' (ناموجود)' : ''}
                          </option>
                        );
                      })}
                    </Select>
                  </Field>
                )}
                {g.source === 'hatch' && (
                  <>
                  {hatches.length === 0 && (
                    <div style={{ padding: 'var(--pad-tight)', background: 'var(--danger-soft)', border: '1px solid var(--danger)', borderRadius: 'var(--r-sm)', fontSize: 'var(--fs-xs)', color: 'var(--danger)', fontWeight: 700, marginBottom: 4 }}>
                      ⚠️ هیچ هچری‌ای ثبت نشده — ابتدا از «جوجه‌کشی» جوجه تولید کنید
                    </div>
                  )}
                  {hatches.length > 0 && !hatches.some(h => (h.hatched || 0) > 0) && (
                    <div style={{ padding: 'var(--pad-tight)', background: 'var(--warn-soft)', border: '1px solid var(--warn)', borderRadius: 'var(--r-sm)', fontSize: 'var(--fs-xs)', color: 'var(--warn)', fontWeight: 700, marginBottom: 4 }}>
                      ⚠️ همه هچ‌ها خالی هستن (هچ موفق صفر) — ابتدا از «جوجه‌کشی» ثبت کنید
                    </div>
                  )}
                  <Field label="هچ مبدأ" required hint={g.hatchId ? (() => {
                    const h = hatches.find(x => x.id === g.hatchId);
                    if (!h) return undefined;
                    return '📊 هچ موفق: ' + toFa(h.hatched || 0) + ' جوجه | نطفه‌داری نشده: ' + toFa(h.unhatched || 0);
                  })() : undefined}>
                    <Select value={g.hatchId || ''} onChange={e => setForm(f => ({ ...f, goods: f.goods.map(x => x.id === g.id ? { ...x, hatchId: e.target.value || undefined } : x) }))} disabled={hatches.length === 0}>
                      <option value="">— انتخاب —</option>
                      {hatches.map(h => {
                        const hasStock = (h.hatched || 0) > 0;
                        return (
                          <option key={h.id} value={h.id} disabled={!hasStock}>
                            {toFa(h.date)} — {toFa(h.hatched || 0)} جوجه{!hasStock ? ' (ناموجود)' : ''}
                          </option>
                        );
                      })}
                    </Select>
                  </Field>
                  </>
                )}
              </>
            )}
            {g.category === 'adult' && (
              <Field label="گله مبدأ" required>
                <Select value={g.existingFlockId || ''} onChange={e => setForm(f => ({ ...f, goods: f.goods.map(x => x.id === g.id ? { ...x, existingFlockId: e.target.value || undefined } : x) }))}>
                  <option value="">— انتخاب —</option>
                  {flocks.filter(f => f.status === 'active').map(f => {
                        const hasStock = (f.currentCount || 0) > 0;
                        return (
                          <option key={f.id} value={f.id} disabled={!hasStock}>
                            {f.name} — {toFa(f.currentCount || 0)} پرنده{!hasStock ? ' (ناموجود)' : ''}
                          </option>
                        );
                      })}
                </Select>
              </Field>
            )}
            {(g.category === 'egg' || g.category === 'fertile_egg') && (() => {
              const eggItems = whsItems.filter((w: any) => w.category === 'egg');
              const noEgg = eggItems.length === 0;
              const noStock = !noEgg && !eggItems.some((it: any) => Number(it.currentStock) > 0);
              return (
                <>
                  {noEgg && (
                    <div style={{ padding: 'var(--pad-tight)', background: 'var(--danger-soft)', border: '1px solid var(--danger)', borderRadius: 'var(--r-sm)', fontSize: 'var(--fs-xs)', color: 'var(--danger)', fontWeight: 700, marginBottom: 4 }}>
                      ⚠️ هیچ تخمی در انبار موجود نیست — ابتدا از «ثبت روزانه» تخم‌گذاری را ثبت کنید یا از «خرید» تخم بخرید
                    </div>
                  )}
                  {noStock && (
                    <div style={{ padding: 'var(--pad-tight)', background: 'var(--warn-soft)', border: '1px solid var(--warn)', borderRadius: 'var(--r-sm)', fontSize: 'var(--fs-xs)', color: 'var(--warn)', fontWeight: 700, marginBottom: 4 }}>
                      ⚠️ موجودی تخم در انبار صفر است — ابتدا از «ثبت روزانه» تخم ثبت کنید
                    </div>
                  )}
                  <Field label="کالای تخم (انبار)" required hint={g.stockItemId ? '📊 تخم تولیدشده از گله — کاهش از انبار' : undefined}>
                    <Select value={g.stockItemId || ''} onChange={e => { const v = e.target.value || undefined; setForm(f => ({ ...f, goods: f.goods.map(x => x.id === g.id ? { ...x, stockItemId: v, linkedItemId: v } : x) })) }} disabled={noEgg}>
                      <option value="">{noEgg ? '— هیچ تخمی موجود نیست —' : '— انتخاب —'}</option>
                      {eggItems.map((it: any) => (
                        <option key={it.id} value={it.id} disabled={Number(it.currentStock) <= 0}>
                          {it.name} — {toFa(it.currentStock)} {(UNIT_LABEL as any)[it.unit] || ''}{Number(it.currentStock) <= 0 ? ' (ناموجود)' : ''}
                        </option>
                      ))}
                    </Select>
                  </Field>
                </>
              );
            })()}
            
                        {(g.category === 'feed' || g.category === 'medicine' || g.category === 'equipment' || g.category === 'other') && (() => {
              const filteredItems = whsItems.filter((w: any) => {
                if (g.category === 'feed') return w.category === 'feed';
                if (g.category === 'medicine') return w.category === 'medicine' || w.category === 'vaccine' || w.category === 'herbal';
                if (g.category === 'equipment') return w.category === 'equipment';
                return true;
              });
              const noItems = filteredItems.length === 0;
              const noStock = !noItems && !filteredItems.some((it: any) => Number(it.currentStock) > 0);
              const catLabelMap: Record<string, string> = { feed: 'دان', medicine: 'دارو/واکسن', equipment: 'تجهیزات', other: 'کالای انباری' };
              const catName = catLabelMap[g.category || 'other'] || 'کالا';
              const showEmptyWarning = noItems && g.category !== 'other';
              return (
                <>
                  {showEmptyWarning && (
                    <div style={{ padding: 'var(--pad-tight)', background: 'var(--danger-soft)', border: '1px solid var(--danger)', borderRadius: 'var(--r-sm)', fontSize: 'var(--fs-xs)', color: 'var(--danger)', fontWeight: 700, marginBottom: 4 }}>
                      ⚠️ هیچ «{catName}»ی در انبار موجود نیست — ابتدا از «خرید» ثبت کنید
                    </div>
                  )}
                  {noStock && (
                    <div style={{ padding: 'var(--pad-tight)', background: 'var(--warn-soft)', border: '1px solid var(--warn)', borderRadius: 'var(--r-sm)', fontSize: 'var(--fs-xs)', color: 'var(--warn)', fontWeight: 700, marginBottom: 4 }}>
                      ⚠️ موجودی «{catName}» صفر است — ابتدا از «خرید» ثبت کنید
                    </div>
                  )}
                  <Field label="کالای انبار" required>
                    <Select value={g.stockItemId || ''} onChange={e => { const v = e.target.value || undefined; setForm(f => ({ ...f, goods: f.goods.map(x => x.id === g.id ? { ...x, stockItemId: v, linkedItemId: v } : x) })) }} disabled={showEmptyWarning}>
                      <option value="">{showEmptyWarning ? '— هیچ کالایی موجود نیست —' : '— انتخاب —'}</option>
                      {filteredItems.map((it: any) => (
                        <option key={it.id} value={it.id} disabled={Number(it.currentStock) <= 0}>
                          {it.name} — {toFa(it.currentStock)} {(UNIT_LABEL as any)[it.unit] || ''}{Number(it.currentStock) <= 0 ? ' (ناموجود)' : ''}
                        </option>
                      ))}
                    </Select>
                  </Field>
                </>
              );
            })()}
            {!g.category && (
              <Field label="کالای انبار" hint="برای کاهش از موجودی">
                <Select value={g.linkedItemId || ''} onChange={e => setForm(f => ({ ...f, goods: f.goods.map(x => x.id === g.id ? { ...x, linkedItemId: e.target.value || undefined } : x) }))}>
                  <option value="">— بدون اتصال —</option>
                  {whsItems.map((it: any) => (
                    <option key={it.id} value={it.id}>{it.name} — {toFa(it.currentStock)} {(UNIT_LABEL as any)[it.unit] || ''}</option>
                  ))}
                </Select>
              </Field>
            )}

          <Grid2>
            <Field label="نام کالا" required error={showError?.(`goods.${gi}.name`)} onTouch={() => markTouched?.(`goods.${gi}.name`)}>
              <Input placeholder="جوجه یک‌روزه" value={g.name} onChange={e => setForm(f => ({ ...f, goods: f.goods.map(x => x.id === g.id ? { ...x, name: e.target.value } : x) }))} />
            </Field>
            <Field label="واحد" error={showError?.(`goods.${gi}.unit`)} onTouch={() => markTouched?.(`goods.${gi}.unit`)}>
              <Select value={g.unit} onChange={e => setForm(f => ({ ...f, goods: f.goods.map(x => x.id === g.id ? { ...x, unit: e.target.value as any } : x) }))}>
                <option value="pcs">عدد</option>
                <option value="kg">کیلوگرم</option>
                <option value="ton">تن</option>
                <option value="bag">کیسه</option>
                <option value="L">لیتر</option>
                <option value="carton">کارتن</option>
              </Select>
            </Field>
          </Grid2>
          <Grid2>
            <Field label="مقدار" required error={showError?.(`goods.${gi}.quantity`)} onTouch={() => markTouched?.(`goods.${gi}.quantity`)}>
              <NumField placeholder="۱۰۰۰" value={String(g.quantity || '')} onChange={e => setForm(f => ({ ...f, goods: f.goods.map(x => x.id === g.id ? { ...x, quantity: Number(toEn(e.target.value)) || 0 } : x) }))} min={1} max={1_000_000} />
              {(() => {
                const srcInfo = getSourceInfo(g);
                if (!srcInfo) return null;
                const isEmpty = srcInfo.available === 0;
                const over = Number(g.quantity) > srcInfo.available;
                const danger = over || isEmpty;
                return (
                  <div style={{ fontSize: 'var(--fs-xs)', marginTop: 4, fontWeight: 600, color: danger ? 'var(--danger)' : 'var(--accent)' }}>
                    {isEmpty
                      ? '🔴 ' + srcInfo.label + ' ناموجود است'
                      : over
                        ? '🔴 بیش از موجودی ' + srcInfo.label + ': ' + toFa(srcInfo.available)
                        : '📊 موجودی ' + srcInfo.label + ': ' + toFa(srcInfo.available)}
                  </div>
                );
              })()}
              {Number(g.quantity) > 0 && <FieldHint fieldPath="tra.deal.quantity" value={g.quantity} />}
            </Field>
            <Field label="قیمت تخمینی" error={showError?.(`goods.${gi}.estimatedPrice`)} onTouch={() => markTouched?.(`goods.${gi}.estimatedPrice`)}>
              <NumField placeholder="۱۵۰۰۰" value={String(g.estimatedPrice || '')} onChange={e => setForm(f => ({ ...f, goods: f.goods.map(x => x.id === g.id ? { ...x, estimatedPrice: Number(toEn(e.target.value)) || 0 } : x) }))} unit="تومان" min={0} max={1_000_000_000_000} />
              {Number(g.estimatedPrice) > 0 && <FieldHint fieldPath="tra.deal.unitPrice" value={g.estimatedPrice} />}
            </Field>
          </Grid2>
        </div>
      ))}

      <button type="button" onClick={() => setForm(f => ({ ...f, goods: [...f.goods, { id: crypto.randomUUID(), name: 'جوجه یک‌روزه', quantity: 0, unit: 'pcs', estimatedPrice: 0, category: 'chick' }] }))} style={{ width: '100%', height: 40, padding: 0, boxSizing: 'border-box', background: 'transparent', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', color: 'var(--text)', fontFamily: 'inherit', fontSize: 'var(--fs-sm)', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 4 }}>+ {form.goods.length === 0 ? 'افزودن اولین کالا' : 'افزودن کالای دیگر'}</button>

      {/* تحویل‌ها */}
      {form.goods.length > 0 && (
        <>
          <div style={{ paddingTop: 12, marginTop: 4, borderTop: '1px dashed var(--border)', fontSize: 'var(--fs-base)', fontWeight: 700, color: 'var(--text)', letterSpacing: '.3px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span>📤 تحویل‌ها</span>
          </div>
            {(() => {
              const outs = form.deliveries.filter(d => d.type === 'out').reduce((s, d) => s + (Number(d.quantity) || 0), 0);
              const rets = form.deliveries.filter(d => d.type === 'return').reduce((s, d) => s + (Number(d.quantity) || 0), 0);
              const loss = form.deliveries.filter(d => d.type === 'loss').reduce((s, d) => s + (Number(d.quantity) || 0), 0);
              const net = outs - rets - loss;
              return net !== 0 ? <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--accent)', fontWeight: 700 }}>خالص: {toFa(net.toLocaleString('fa-IR'))}</span> : null;
            })()}
          </div>

          {form.deliveries.map((dv, di) => (
            <div key={dv.id} style={{ padding: 'var(--pad-normal)', background: 'var(--card-solid)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', fontWeight: 700 }}>تحویل {toFa(di + 1)}</span>
                <button type="button" onClick={() => setForm(f => ({ ...f, deliveries: f.deliveries.filter(x => x.id !== dv.id) }))} style={{ background: 'var(--danger-soft)', border: '1px solid var(--danger)', color: 'var(--danger)', cursor: 'pointer', borderRadius: 'var(--r-sm)', width: 28, height: 28, padding: 0, fontFamily: 'inherit', fontWeight: 700 }}>✕</button>
              </div>
              <Grid2>
                <Field label="تاریخ" required error={showError?.(`deliveries.${di}.date`)} onTouch={() => markTouched?.(`deliveries.${di}.date`)}>
                  <DatePicker value={dv.date} onChange={v => setForm(f => ({ ...f, deliveries: f.deliveries.map(x => x.id === dv.id ? { ...x, date: v } : x) }))} autoToday />
                </Field>
                <Field label="ساعت" hint="اختیاری — برای تمایز چند تحویل هم‌روز" error={showError?.(`deliveries.${di}.time`)} onTouch={() => markTouched?.(`deliveries.${di}.time`)}>
                  <TimePicker value={dv.time || ''} onChange={v => setForm(f => ({ ...f, deliveries: f.deliveries.map(x => x.id === dv.id ? { ...x, time: v } : x) }))} />
                </Field>
              </Grid2>
              <Grid2>
                <Field label="نوع" required error={showError?.(`deliveries.${di}.type`)} onTouch={() => markTouched?.(`deliveries.${di}.type`)}>
                  <Select value={dv.type} onChange={e => setForm(f => ({ ...f, deliveries: f.deliveries.map(x => x.id === dv.id ? { ...x, type: e.target.value as any } : x) }))}>
                    <option value="out">تحویل به طرف</option>
                    <option value="return">برگشت از طرف</option>
                    <option value="loss">تلفات</option>
                    <option value="in">📥 دریافت از طرف (تهاتر)</option>
                  </Select>
                </Field>
                <Field label="کالا" required error={showError?.(`deliveries.${di}.goodId`)} onTouch={() => markTouched?.(`deliveries.${di}.goodId`)}>
                  <Select value={dv.goodId} onChange={e => setForm(f => ({ ...f, deliveries: f.deliveries.map(x => x.id === dv.id ? { ...x, goodId: e.target.value } : x) }))}>
                    <option value="">— انتخاب —</option>
                    {form.goods.map(g => <option key={g.id} value={g.id}>{g.name || '—'}</option>)}
                  </Select>
                </Field>
              </Grid2>
              <Field label="مقدار" required error={showError?.(`deliveries.${di}.quantity`)} onTouch={() => markTouched?.(`deliveries.${di}.quantity`)}>
                <NumField placeholder="۵۰۰" value={String(dv.quantity || '')} onChange={e => setForm(f => ({ ...f, deliveries: f.deliveries.map(x => x.id === dv.id ? { ...x, quantity: Number(toEn(e.target.value)) || 0 } : x) }))} min={1} max={1_000_000} />
                {Number(dv.quantity) > 0 && <FieldHint fieldPath="tra.deal.quantity" value={dv.quantity} />}
              </Field>
              {dv.type === 'in' && (
                <Field label="در عوض تحویل" hint="این دریافت، در عوض کدام تحویل است؟ (تهاتر)">
                  <Select value={dv.linkedDeliveryId || ''} onChange={e => setForm(f => ({ ...f, deliveries: f.deliveries.map(x => x.id === dv.id ? { ...x, linkedDeliveryId: e.target.value || undefined } : x) }))}>
                    <option value="">— بدون لینک —</option>
                    {form.deliveries.filter(x => x.id !== dv.id && x.type === 'out').map(x => {
                      const idx = form.deliveries.findIndex(y => y.id === x.id);
                      const linkedGoodName = form.goods.find(g => g.id === x.goodId)?.name || '—';
                      return (
                        <option key={x.id} value={x.id}>
                          تحویل {toFa(idx + 1)} — {linkedGoodName} ({toFa(x.quantity)})
                        </option>
                      );
                    })}
                  </Select>
                </Field>
              )}
              {(() => {
                const linkedGood = form.goods.find(x => x.id === dv.goodId);
                if (!linkedGood?.linkedItemId || dv.type === 'in') return null;
                return (
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 'var(--fs-sm)', color: 'var(--muted)', fontWeight: 600, cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={!!dv.whsEnabled}
                      onChange={e => setForm(f => ({ ...f, deliveries: f.deliveries.map(x => x.id === dv.id ? { ...x, whsEnabled: e.target.checked } : x) }))}
                      style={{ width: 18, height: 18, accentColor: 'var(--accent)' }}
                    />
                    کاهش از موجودی انبار
                  </label>
                );
              })()}
            </div>
          ))}
          <button type="button" onClick={() => setForm(f => ({ ...f, deliveries: [...f.deliveries, { id: crypto.randomUUID(), goodId: f.goods[0]?.id || '', date: form.date || formatJ(new Date(), 'yyyy/MM/dd'), time: formatJ(new Date(), 'HH:mm'), type: 'out', quantity: 0, notes: '' }] }))} style={{ width: '100%', height: 40, padding: 0, boxSizing: 'border-box', background: 'transparent', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', color: 'var(--text)', fontFamily: 'inherit', fontSize: 'var(--fs-sm)', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 4 }}>+ {form.deliveries.length === 0 ? 'افزودن اولین تحویل' : 'افزودن تحویل دیگر'}</button>
        </>
      )}

      {/* فروش‌ها */}
      {form.goods.length > 0 && form.settlementType !== 'barter' && (
        <>
          <div style={{ paddingTop: 12, marginTop: 4, borderTop: '1px dashed var(--border)', fontSize: 'var(--fs-base)', fontWeight: 700, color: 'var(--text)', letterSpacing: '.3px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span>💰 فروش‌ها</span>
          </div>
            {(() => {
              const tot = form.sales.reduce((s, x) => s + ((Number(x.quantity) || 0) * (Number(x.unitPrice) || 0)), 0);
              return tot > 0 ? <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--accent)', fontWeight: 700 }}>{toFa(tot.toLocaleString('fa-IR'))} ت</span> : null;
            })()}
          </div>

          {form.sales.map((s, si) => {
            const total = (Number(s.quantity) || 0) * (Number(s.unitPrice) || 0);
            return (
              <div key={s.id} style={{ padding: 'var(--pad-normal)', background: 'var(--card-solid)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--accent)', fontWeight: 700 }}>فروش {toFa(si + 1)} — {toFa(total.toLocaleString('fa-IR'))} تومان</span>
                  <button type="button" onClick={() => setForm(f => ({ ...f, sales: f.sales.filter(x => x.id !== s.id) }))} style={{ background: 'var(--danger-soft)', border: '1px solid var(--danger)', color: 'var(--danger)', cursor: 'pointer', borderRadius: 'var(--r-sm)', width: 28, height: 28, padding: 0, fontFamily: 'inherit', fontWeight: 700 }}>✕</button>
                </div>
                <Grid2>
                  <Field label="تاریخ" required error={showError?.(`sales.${si}.date`)} onTouch={() => markTouched?.(`sales.${si}.date`)}>
                    <DatePicker value={s.date} onChange={v => setForm(f => ({ ...f, sales: f.sales.map(x => x.id === s.id ? { ...x, date: v } : x) }))} autoToday />
                  </Field>
                  <Field label="کالا" required error={showError?.(`sales.${si}.goodId`)} onTouch={() => markTouched?.(`sales.${si}.goodId`)}>
                    <Select value={s.goodId} onChange={e => setForm(f => ({ ...f, sales: f.sales.map(x => x.id === s.id ? { ...x, goodId: e.target.value } : x) }))}>
                      <option value="">— انتخاب —</option>
                      {form.goods.map(g => <option key={g.id} value={g.id}>{g.name || '—'}</option>)}
                    </Select>
                  </Field>
                </Grid2>
                <Grid2>
                  <Field label="مقدار" required error={showError?.(`sales.${si}.quantity`)} onTouch={() => markTouched?.(`sales.${si}.quantity`)}>
                    <NumField placeholder="۳۰۰" value={String(s.quantity || '')} onChange={e => setForm(f => ({ ...f, sales: f.sales.map(x => x.id === s.id ? { ...x, quantity: Number(toEn(e.target.value)) || 0 } : x) }))} min={1} max={1_000_000} />
                    {Number(s.quantity) > 0 && <FieldHint fieldPath="tra.deal.quantity" value={s.quantity} />}
                  </Field>
                  <Field label="قیمت واحد" required error={showError?.(`sales.${si}.unitPrice`)} onTouch={() => markTouched?.(`sales.${si}.unitPrice`)}>
                    <NumField placeholder="۲۰۰۰۰" value={String(s.unitPrice || '')} onChange={e => setForm(f => ({ ...f, sales: f.sales.map(x => x.id === s.id ? { ...x, unitPrice: Number(toEn(e.target.value)) || 0 } : x) }))} unit="تومان" min={0} max={1_000_000_000_000} />
                    {Number(s.unitPrice) > 0 && <FieldHint fieldPath="tra.deal.unitPrice" value={s.unitPrice} />}
                  </Field>
                </Grid2>
              </div>
            );
          })}
          <button type="button" onClick={() => setForm(f => ({ ...f, sales: [...f.sales, { id: crypto.randomUUID(), goodId: f.goods[0]?.id || '', date: form.date || formatJ(new Date(), 'yyyy/MM/dd'), time: formatJ(new Date(), 'HH:mm'), quantity: 0, unitPrice: 0 }] }))} style={{ width: '100%', height: 40, padding: 0, boxSizing: 'border-box', background: 'transparent', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', color: 'var(--text)', fontFamily: 'inherit', fontSize: 'var(--fs-sm)', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 4 }}>+ {form.sales.length === 0 ? 'افزودن اولین فروش' : 'افزودن فروش دیگر'}</button>
        </>
      )}

      {/* پرداخت‌ها — شرطی */}
      {form.settlementType !== 'barter' && (form.sales.length > 0 || form.payments.length > 0 || form.type === 'conditional') && (
        <>
      <div style={{ paddingTop: 12, marginTop: 4, borderTop: '1px dashed var(--border)', fontSize: 'var(--fs-base)', fontWeight: 700, color: 'var(--text)', letterSpacing: '.3px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>💳 پرداخت‌ها</span>
        {(() => {
          const pin = form.payments.filter(p => p.direction === 'in').reduce((s, p) => s + (Number(p.amount) || 0), 0);
          const pout = form.payments.filter(p => p.direction === 'out').reduce((s, p) => s + (Number(p.amount) || 0), 0);
          if (pin === 0 && pout === 0) return null;
          return (
            <span style={{ display: 'flex', gap: 8, fontSize: 'var(--fs-xs)', fontWeight: 700 }}>
              {pin > 0 && <span style={{ color: 'var(--accent)' }}>↑ {toFa(pin.toLocaleString('fa-IR'))}</span>}
              {pout > 0 && <span style={{ color: 'var(--warn)' }}>↓ {toFa(pout.toLocaleString('fa-IR'))}</span>}
            </span>
          );
        })()}
      </div>

      {form.payments.map((p, pi) => (
        <div key={p.id} style={{ padding: 'var(--pad-normal)', background: 'var(--card-solid)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 'var(--fs-xs)', color: p.direction === 'in' ? 'var(--accent)' : 'var(--warn)', fontWeight: 700 }}>
              {p.direction === 'in' ? '↑ دریافت' : '↓ پرداخت'} {toFa(pi + 1)}
            </span>
            <button type="button" onClick={() => setForm(f => ({ ...f, payments: f.payments.filter(x => x.id !== p.id) }))} style={{ background: 'var(--danger-soft)', border: '1px solid var(--danger)', color: 'var(--danger)', cursor: 'pointer', borderRadius: 'var(--r-sm)', width: 28, height: 28, padding: 0, fontFamily: 'inherit', fontWeight: 700 }}>✕</button>
          </div>
          <Grid2>
            <Field label="تاریخ" required error={showError?.(`payments.${pi}.date`)} onTouch={() => markTouched?.(`payments.${pi}.date`)}>
              <DatePicker value={p.date} onChange={v => setForm(f => ({ ...f, payments: f.payments.map(x => x.id === p.id ? { ...x, date: v } : x) }))} autoToday />
            </Field>
            <Field label="مبلغ" required error={showError?.(`payments.${pi}.amount`)} onTouch={() => markTouched?.(`payments.${pi}.amount`)}>
              <MoneyField showWords={false} placeholder="مبلغ" value={p.amount > 0 ? toFa(String(p.amount)) : ''} onChange={e => { 
                const raw = parseFloat(toEn(e.target.value).replace('٫', '.')) || 0; 
                const otherPaidIn = form.payments.filter(x => x.direction === 'in' && x.id !== p.id).reduce((s, x) => s + (Number(x.amount) || 0), 0);
                const otherPaidOut = form.payments.filter(x => x.direction === 'out' && x.id !== p.id).reduce((s, x) => s + (Number(x.amount) || 0), 0);
                const rem = calc.myShare - otherPaidIn + otherPaidOut;
                const val = (p.direction === 'in' && rem > 0) ? Math.min(raw, rem) : raw;
                setForm(f => ({ ...f, payments: f.payments.map(x => x.id === p.id ? { ...x, amount: val } : x) })); 
              }} />
              {(() => {
                if (p.direction !== 'in') return null;
                const otherPaidIn = form.payments.filter(x => x.direction === 'in' && x.id !== p.id).reduce((s, x) => s + (Number(x.amount) || 0), 0);
                const otherPaidOut = form.payments.filter(x => x.direction === 'out' && x.id !== p.id).reduce((s, x) => s + (Number(x.amount) || 0), 0);
                const rem = calc.myShare - otherPaidIn + otherPaidOut;
                if (rem <= 0.5) return null;
                return (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                    <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)' }}>باقی‌مانده: {toFa(rem.toLocaleString('fa-IR'))} تومان</span>
                    <button type="button" onClick={() => {
                      setForm(f => ({ ...f, payments: f.payments.map(x => x.id === p.id ? { ...x, amount: rem } : x) }));
                    }} style={{ background: 'none', border: 'none', color: 'var(--accent)', fontSize: 'var(--fs-xs)', fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', textDecoration: 'underline', whiteSpace: 'nowrap' }}>تسویه کل</button>
                  </div>
                );
              })()}
              {Number(p.amount) > 0 && <FieldHint fieldPath="tra.deal.payment" value={p.amount} />}
            </Field>
          </Grid2>
          <Grid2>
            <Field label="جهت" error={showError?.(`payments.${pi}.direction`)} onTouch={() => markTouched?.(`payments.${pi}.direction`)}>
              <Select value={p.direction} onChange={e => setForm(f => ({ ...f, payments: f.payments.map(x => x.id === p.id ? { ...x, direction: e.target.value as any } : x) }))}>
                <option value="in">↑ دریافت از طرف</option>
                <option value="out">↓ پرداخت به طرف</option>
              </Select>
            </Field>
            <Field label="روش" error={showError?.(`payments.${pi}.method`)} onTouch={() => markTouched?.(`payments.${pi}.method`)}>
              <Select value={p.method} onChange={e => setForm(f => ({ ...f, payments: f.payments.map(x => x.id === p.id ? { ...x, method: e.target.value as any } : x) }))}>
                <option value="cash">💵 نقدی</option>
                <option value="card">💳 کارت</option>
                <option value="check">📄 چک</option>
              </Select>
            </Field>
          </Grid2>
        </div>
      ))}
      <button type="button" onClick={() => setForm(f => ({ ...f, payments: [...f.payments, { id: crypto.randomUUID(), date: form.date || '', amount: 0, direction: 'in', method: 'cash', notes: '' }] }))} style={{ background: 'transparent', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', color: 'var(--accent, var(--text))', fontFamily: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, width: '100%', height: 40, padding: 0, boxSizing: 'border-box', fontSize: 'var(--fs-sm)', fontWeight: 600, marginTop: 4 }}>+ {form.payments.length === 0 ? 'افزودن اولین پرداخت' : 'افزودن پرداخت دیگر'}</button>
        </>
      )}

      {/* خلاصه مالی */}
      {(calc.totalDelivered > 0 || calc.totalSold > 0 || calc.totalSales > 0 || calc.paidIn > 0 || calc.paidOut > 0) && (
        <div style={{ padding: '10px 12px', background: 'var(--accent-soft)', border: '1px solid var(--accent-border)', borderRadius: 'var(--r-md)', display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
          
          <div style={{ fontWeight: 700, color: 'var(--accent)', fontSize: 'var(--fs-sm)' }}>🧮 خلاصه مالی</div>
          
          {calc.inHand < 0 && (
            <div style={{ padding: '6px', background: 'var(--danger-soft)', color: 'var(--danger)', border: '1px solid var(--danger)', borderRadius: 'var(--r-sm)', fontSize: 'var(--fs-xs)', fontWeight: 700, textAlign: 'center' }}>
              ⚠️ فروش از موجودی بیشتر است — ذخیره ممکن نیست.
            </div>
          )}

          {/* بخش عملیاتی */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 4, paddingBottom: 6, borderBottom: '1px dashed var(--accent-border)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
              <span style={{ color: 'var(--muted)', fontSize: 'var(--fs-xs)' }}>کل تحویلی</span>
              <span style={{ fontWeight: 700, fontSize: 'var(--fs-sm)' }}>{toFa(calc.totalDelivered.toLocaleString('fa-IR'))}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, borderRight: '1px dashed var(--accent-border)', borderLeft: '1px dashed var(--accent-border)' }}>
              <span style={{ color: 'var(--muted)', fontSize: 'var(--fs-xs)' }}>فروش کل</span>
              <span style={{ fontWeight: 700, fontSize: 'var(--fs-sm)' }}>{toFa(calc.totalSold.toLocaleString('fa-IR'))}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
              <span style={{ color: 'var(--muted)', fontSize: 'var(--fs-xs)' }}>در دست طرف</span>
              <span style={{ fontWeight: 700, fontSize: 'var(--fs-sm)', color: calc.inHand < 0 ? 'var(--danger)' : 'inherit' }}>{toFa(calc.inHand.toLocaleString('fa-IR'))}</span>
            </div>
          </div>

          {/* بخش تفکیک کالاها */}
          {form.goods.length > 0 && (() => {
            const rows = form.goods
              .map(g => ({ g, pg: calc.perGood[g.id] }))
              .filter(r => r.pg && (r.pg.delivered !== 0 || r.pg.sold !== 0));
            if (rows.length === 0) return null;
            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, paddingBottom: 6, borderBottom: '1px dashed var(--accent-border)' }}>
                {rows.map(({ g, pg }) => {
                  if (!pg) return null;
                  return (
                    <div key={g.id} style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%' }}>
                      <span style={{ fontWeight: 600, fontSize: 'var(--fs-sm)', color: 'var(--text)', flexShrink: 0, maxWidth: '40%', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{pg.name}</span>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flex: 1 }}>
                        <span style={{ color: 'var(--muted)', fontSize: 'var(--fs-xs)' }}>تحویل {toFa(pg.delivered)}</span>
                        <span style={{ color: 'var(--muted)', fontSize: 'var(--fs-xs)' }}>فروش {toFa(pg.sold)}</span>
                        <span style={{ fontWeight: 700, fontSize: 'var(--fs-xs)', color: pg.inHand < 0 ? 'var(--danger)' : 'var(--accent)' }}>مانده {toFa(pg.inHand)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}

          {/* بخش مالی */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--muted)', fontSize: 'var(--fs-xs)' }}>فروش (مبلغ):</span>
              <span style={{ fontWeight: 700, fontSize: 'var(--fs-sm)' }}>{toFa(calc.totalSales.toLocaleString('fa-IR'))}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--muted)', fontSize: 'var(--fs-xs)' }}>سهم من:</span>
              <span style={{ fontWeight: 700, fontSize: 'var(--fs-sm)' }}>{toFa(calc.myShare.toLocaleString('fa-IR'))}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--muted)', fontSize: 'var(--fs-xs)' }}>دریافتی:</span>
              <span style={{ fontWeight: 700, fontSize: 'var(--fs-sm)', color: 'var(--accent)' }}>{toFa(calc.paidIn.toLocaleString('fa-IR'))}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--muted)', fontSize: 'var(--fs-xs)' }}>مانده:</span>
              <span style={{ fontWeight: 700, fontSize: 'var(--fs-sm)', color: Math.abs(calc.balance) < 0.01 ? 'var(--accent)' : calc.balance > 0 ? 'var(--warn)' : 'var(--danger)' }}>{toFa(Math.abs(calc.balance).toLocaleString('fa-IR'))}</span>
            </div>
          </div>

          {calc.commission > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 4, borderTop: '1px dashed var(--accent-border)' }}>
              <span style={{ color: 'var(--muted)', fontSize: 'var(--fs-xs)' }}>کمیسیون:</span>
              <span style={{ fontWeight: 700, fontSize: 'var(--fs-sm)', color: 'var(--warn)' }}>{toFa(calc.commission.toLocaleString('fa-IR'))}</span>
            </div>
          )}

        </div>
      )}

      <Field label="یادداشت" error={showError?.('notes')} onTouch={() => markTouched?.('notes')}>
            <Textarea placeholder="توضیحات..." value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} />
          </Field>

        {err && <ErrorBox>{err}</ErrorBox>}
      </Modal>
    </PageContainer>
  );
}
