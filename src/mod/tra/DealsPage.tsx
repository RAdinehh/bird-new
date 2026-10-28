/**
 * DealsPage — معاملات خاص
 */
import { useState, useMemo , useEffect } from 'react';
import { useFab } from '../../shr/hooks/useFab';
import { useTra, DEAL_LABEL, type Deal, type DealType, type SettlementType, type DealGood, type DealDelivery, type DealSale, type DealPayment } from './store';
import { useNavigate } from 'react-router-dom';
import { useCtc } from '../ctc/store';
import { useFlk } from '../flk/store';
import { useWhs, UNIT_LABEL } from '../whs/store';
import { Btn, BtnRow, Empty, Field, Input, MoneyField, PercentField,
  Grid2, Modal, NumField,
  PageContainer, Select, Tag, ErrorBox , Textarea } from '../../shr/components/ui';import SmartSelect from '../../shr/components/SmartSelect';
import { FieldHint } from '../../shr/intelligence';;
import ExpandableCard from '../../shr/components/ExpandableCard';
import { useMultiSelect } from '../../shr/multiSelect/useMultiSelect';
import { useFilterSort, FilterBar, getTraDealsConfig } from '../../shr/filter';
import MultiSelectBar from '../../shr/multiSelect/MultiSelectBar';
import DatePicker from '../../shr/components/DatePicker';
import TimePicker from '../../shr/components/TimePicker';
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
  settlementType: '', settlementValue: '', cancelReason: '',
  goods: [], deliveries: [], sales: [], payments: [],
});

const STATUS_LABEL: Record<string, string> = {
  open: 'باز', settled: 'تسویه‌شده', cancelled: 'لغوشده'
};

export default function DealsPage({ active = true }: { active?: boolean } = {}) {
  const navigate = useNavigate();
  const { deals, invoices, addDeal, updateDeal, deleteDeal } = useTra();
  const { flocks } = useFlk();
  const whsItems = useWhs(s => s.items);
  const { contacts } = useCtc();

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<F>(empty());
  const [err, setErr] = useState('');
  const [undoData, setUndoData] = useState<{ item: any | any[] } | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

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
    setForm({ ...empty(), partyId: contacts[0].id });
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

  const handleDeleteDeal = (id: string): void => {
    const deal = deals.find(d => d.id === id);
    if (deal?.deliveries && deal.deliveries.length > 0) {
      const whs = useWhs.getState();
      for (const dv of deal.deliveries) {
        if (dv.whsMovementId) {
          try { whs.deleteMovement(dv.whsMovementId); } catch (e) { console.error('[deals->whs] deleteMovement (delete) failed:', e); }
        }
      }
    }
    deleteDeal(id);
  };

  const applyDealMovements = (formState: F, oldDeal?: Deal): void => {
    const whs = useWhs.getState();
    const oldDeliveries = oldDeal?.deliveries || [];

    // 1. Delete movements for removed/disabled deliveries
    for (const old of oldDeliveries) {
      if (!old.whsMovementId) continue;
      const current = formState.deliveries.find(d => d.id === old.id);
      if (!current || !current.whsEnabled) {
        try { whs.deleteMovement(old.whsMovementId); } catch (e) { console.error('[deals->whs] deleteMovement failed:', e); }
        if (current) current.whsMovementId = undefined;
      }
    }

    // 2. Delete movements for changed deliveries (will be re-added below)
    for (const dv of formState.deliveries) {
      if (!dv.whsEnabled || !dv.whsMovementId) continue;
      const old = oldDeliveries.find(d => d.id === dv.id);
      if (!old) continue;
      if (old.quantity === dv.quantity && old.type === dv.type && old.date === dv.date && (old.time || '') === (dv.time || '')) continue;
      try { whs.deleteMovement(dv.whsMovementId); } catch (e) { console.error('[deals->whs] deleteMovement failed:', e); }
      dv.whsMovementId = undefined;
    }

    // 3. Add movements for new enabled deliveries
    for (const dv of formState.deliveries) {
      if (!dv.whsEnabled) continue;
      if (dv.whsMovementId) continue;
      if (dv.type === 'loss') continue;
      const good = formState.goods.find(g => g.id === dv.goodId);
      if (!good?.linkedItemId) continue;

      try {
        const mid = whs.addMovement({
          itemId: good.linkedItemId,
          type: dv.type === 'out' ? 'out' : 'in',
          quantity: dv.quantity,
          unitPrice: 0,
          reason: dv.type === 'out' ? 'consumption' : 'return',
          date: dv.date || formState.date || '',
          partyId: formState.partyId || '',
          notes: `Deal ${formState.dealNumber || ''} - ${good.name}`,
          sourceModule: 'deal',
          sourceId: dv.id,
        });
        if (mid) dv.whsMovementId = mid;
      } catch (e) {
        console.error('[deals->whs] addMovement failed:', e);
      }
    }
  };

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
    applyDealMovements(form, oldDeal);

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
    const commission = (form.settlementType === 'commission_pct' || form.settlementType === 'profit_sharing') ? Math.round(totalSales * pct / 100) : 0;
    const myShare = totalSales - commission;
    const paidIn = form.payments.filter(p => p.direction === 'in').reduce((s, p) => s + (Number(p.amount) || 0), 0);
    const paidOut = form.payments.filter(p => p.direction === 'out').reduce((s, p) => s + (Number(p.amount) || 0), 0);
    const balance = myShare - paidIn + paidOut;
    return { totalDelivered, totalSold, inHand, totalSales, commission, myShare, paidIn, paidOut, balance };
  }, [form.deliveries, form.sales, form.payments, form.settlementType, form.settlementValue]);

  const stats = useMemo(() => {
    let active = 0, settled = 0, cancelled = 0, totalBalance = 0;
    for (const d of deals) {
      if (d.status === 'cancelled') { cancelled++; continue; }
      if (d.status === 'settled') { settled++; continue; }
      active++;
      const sales = (d.sales || []).reduce((s, x) => s + ((Number(x.quantity) || 0) * (Number(x.unitPrice) || 0)), 0);
      const pct = Number(d.settlementValue) || 0;
      const comm = (d.settlementType === 'commission_pct' || d.settlementType === 'profit_sharing') ? Math.round(sales * pct / 100) : 0;
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
                badge={<Tag tone={d.status === 'settled' ? 'green' : d.status === 'cancelled' ? 'gray' : 'amber'}>{STATUS_LABEL[d.status]}</Tag>}
                stats={
                  <>
                    {d.value > 0 && <span>ارزش: <b style={{ color: 'var(--text)' }}>{toFa(d.value.toLocaleString('fa-IR'))} تومان</b></span>}
                    {d.percent !== null && d.percent !== undefined && <span>درصد: <b style={{ color: 'var(--text)' }}>{toFa(d.percent)}٪</b></span>}
                    {d.dueDate ? <span>سرسید: <b style={{ color: 'var(--text)' }}>{toFa(d.dueDate)}</b></span> : null}
              {(() => {
                const ag = dealAging(d);
                if (!ag) return null;
                const bg = ag.tone === 'ok' ? 'var(--accent-soft)' : ag.tone === 'warn' ? 'var(--warn-soft)' : 'var(--danger-soft)';
                const fg = ag.tone === 'ok' ? 'var(--accent)' : ag.tone === 'warn' ? 'var(--warn)' : 'var(--danger)';
                return <span style={{ padding: '2px 8px', borderRadius: 4, background: bg, color: fg, fontWeight: 700, fontSize: 'var(--fs-xs)' }}>⏳ {toFa(ag.days)} روز</span>;
              })()}
              {relatedInvoices.length > 0 && (
                <button type="button" onClick={(e) => {
                  e.stopPropagation();
                  const tab = relatedInvoices[0]?.type === 'sale' ? 'sales' : 'purchases';
                  navigate(`/tra?tab=${tab}&relatedDealId=${d.id}`);
                }} style={{ background: 'transparent', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 'inherit', padding: 0, fontWeight: 600 }}>
                  📄 {toFa(relatedInvoices.length)} فاکتور
                </button>
              )}
              {relatedFlocks.length > 0 && <span>🐔 {toFa(relatedFlocks.length)} گله</span>}
                  </>
                }
              >
                <SectionTitle><span style={{ fontSize: '1.05em', lineHeight: 1, display: 'inline-block', marginLeft: 4 }}>📋</span> اطلاعات معامله</SectionTitle>
                <Row l="نوع" v={DEAL_LABEL[d.type]} />
                <Row l="طرف معامله" v={party?.name || '—'} />
                <Row l="تاریخ" v={toFa(d.date)} />
                {d.dueDate ? <Row l="سرسید" v={toFa(d.dueDate)} /> : null}
                <Row l="وضعیت" v={STATUS_LABEL[d.status]} />

                <SectionTitle><span style={{ fontSize: '1.05em', lineHeight: 1, display: 'inline-block', marginLeft: 4 }}>📝</span> توضیحات</SectionTitle>
                <div style={{ fontSize: 'var(--fs-sm)', lineHeight: 1.7, padding: 'var(--pad-normal)', background: 'var(--input-bg)', borderRadius: 'var(--r-sm)' }}>{d.description}</div>

                {(d.value > 0 || (d.percent !== null && d.percent !== undefined)) ? (
                  <>
                    <SectionTitle><span style={{ fontSize: '1.05em', lineHeight: 1, display: 'inline-block', marginLeft: 4 }}>💰</span> مالی</SectionTitle>
                    {d.value > 0 ? <Row l="ارزش کل" v={`${toFa(d.value.toLocaleString('fa-IR'))} تومان`} /> : null}
                    {d.percent !== null && d.percent !== undefined ? <Row l="درصد" v={`${toFa(d.percent)}٪`} /> : null}
                  </>
                ) : null}

                {d.notes ? (
                  <>
                    <SectionTitle><span style={{ fontSize: '1.05em', lineHeight: 1, display: 'inline-block', marginLeft: 4 }}>📝</span> یادداشت</SectionTitle>
                    <div style={{ fontSize: 'var(--fs-sm)', lineHeight: 1.7, padding: 'var(--pad-normal)', background: 'var(--input-bg)', borderRadius: 'var(--r-sm)' }}>{d.notes}</div>
                  </>
                ) : null}

                <div style={{ display: 'flex', gap: 6, paddingTop: 4 }}>
                  {d.status !== 'settled' ? (
                    <Btn size="sm" onClick={() => updateDeal(d.id, { status: 'settled' })} style={{ flex: 1 }}>تسویه شد</Btn>
                  ) : null}
                  <Btn size="sm" onClick={() => openEdit(d)} style={{ flex: 1 }}>ویرایش</Btn>
                  <Btn size="sm" onClick={async () => {
                          const _lInvS = invoices.filter((inv: any) => inv.relatedDealId === d.id).length;
                          const _lFlkS = flocks.filter((f: any) => f.dealData?.dealId === d.id).length;
                          let _exM = '';
                          if (_lInvS > 0 || _lFlkS > 0) {
                            const _ptS: string[] = [];
                            if (_lInvS > 0) _ptS.push(toFa(_lInvS) + ' فاکتور');
                            if (_lFlkS > 0) _ptS.push(toFa(_lFlkS) + ' گله');
                            _exM = '\n\n⚠️ این معامله به ' + _ptS.join(' و ') + ' وصله. با حذف، این ارتباط قطع می‌شه.';
                          }
                          const ok = await showConfirmAsync('تأیید حذف', 'این معامله حذف شود؟' + _exM, { danger: true });
                          if (!ok) return;
                          handleDeleteDeal(d.id);
                          logAction('delete', 'tra', 'حذف از معاملات');
                          toastMsg.deleted('معامله')
                        }} style={{ flex: 1 }}>حذف</Btn>
                </div>
              </ExpandableCard>
            );
          })}
        </>
      )}

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
          <Field label="نوع معامله" required error={showError?.('type')} onTouch={() => markTouched?.('type')}>
            <Select value={form.type} onChange={e => setForm({...form, type: e.target.value as DealType})}>
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
              options={contacts.map(c => ({ value: c.id, label: c.name, subtitle: c.phone || undefined }))}
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
          <Field label="مهلت پرداخت" error={showError?.('dueDate')} onTouch={() => markTouched?.('dueDate')}>
            <DatePicker value={form.dueDate} onChange={v => setForm({...form, dueDate: v})} autoToday />
          </Field>
        </Grid2>

        <Grid2>
          <Field label="نوع تسویه" help={HELP.tra.deal.settlementType} error={showError?.('settlementType')} onTouch={() => markTouched?.('settlementType')}>
            <Select value={form.settlementType || ''} onChange={e => setForm({...form, settlementType: e.target.value as SettlementType | ''})}>
              <option value="">— انتخاب —</option>
              <option value="commission_pct">💰 کمیسیون درصدی</option>
              <option value="commission_per_unit">💵 کمیسیون هر واحد</option>
              <option value="fixed_amount">📋 مبلغ ثابت</option>
              <option value="barter_direct">🔄 تهاتر مستقیم</option>
              <option value="profit_sharing">🤝 شراکت در سود</option>
              <option value="rental_monthly">📅 اجاره ماهانه</option>
              <option value="grower_fee_per_unit">🐔 دستمزد پرورش</option>
            </Select>
          </Field>
          {form.type === 'partnership' && (
            <Field label="درصد" hint="۰ تا ۱۰۰" error={showError?.('percent')} onTouch={() => markTouched?.('percent')}>
              <PercentField placeholder="۱۰" value={form.percent} onChange={e => setForm({...form, percent: e.target.value})} />
            </Field>
          )}
        </Grid2>

        {form.settlementType && form.settlementType !== 'barter_direct' && (
          <Field label={form.settlementType === 'commission_pct' || form.settlementType === 'profit_sharing' ? 'درصد تسویه' : 'مقدار تسویه'} error={showError?.('settlementValue')} onTouch={() => markTouched?.('settlementValue')}>
            {form.settlementType === 'commission_pct' || form.settlementType === 'profit_sharing' ? (
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
      <div style={{ paddingTop: 12, marginTop: 4, borderTop: '1px dashed var(--border)', fontSize: 'var(--fs-base)', fontWeight: 700, color: 'var(--text)', letterSpacing: '.3px' }}>📦 کالاهای تحویلی</div>

      {form.goods.map((g, gi) => (
        <div key={g.id} style={{ padding: 'var(--pad-normal)', background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', fontWeight: 700 }}>کالای {toFa(gi + 1)}</span>
            <button type="button" onClick={() => setForm(f => ({ ...f, goods: f.goods.filter(x => x.id !== g.id), deliveries: f.deliveries.filter(x => x.goodId !== g.id), sales: f.sales.filter(x => x.goodId !== g.id) }))} style={{ background: 'var(--danger-soft)', border: '1px solid var(--danger)', color: 'var(--danger)', cursor: 'pointer', borderRadius: 'var(--r-sm)', width: 28, height: 28, padding: 0, fontFamily: 'inherit', fontWeight: 700 }}>✕</button>
          </div>
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
              {Number(g.quantity) > 0 && <FieldHint fieldPath="tra.deal.quantity" value={g.quantity} />}
            </Field>
            <Field label="قیمت تخمینی" error={showError?.(`goods.${gi}.estimatedPrice`)} onTouch={() => markTouched?.(`goods.${gi}.estimatedPrice`)}>
              <NumField placeholder="۱۵۰۰۰" value={String(g.estimatedPrice || '')} onChange={e => setForm(f => ({ ...f, goods: f.goods.map(x => x.id === g.id ? { ...x, estimatedPrice: Number(toEn(e.target.value)) || 0 } : x) }))} unit="تومان" min={0} max={1_000_000_000_000} />
              {Number(g.estimatedPrice) > 0 && <FieldHint fieldPath="tra.deal.unitPrice" value={g.estimatedPrice} />}
            </Field>
          </Grid2>
          <Field label="کالای انبار" hint="برای کاهش از موجودی">
            <Select value={g.linkedItemId || ''} onChange={e => setForm(f => ({ ...f, goods: f.goods.map(x => x.id === g.id ? { ...x, linkedItemId: e.target.value || undefined } : x) }))}>
              <option value="">— بدون اتصال —</option>
              {whsItems.map((it: any) => (
                <option key={it.id} value={it.id}>
                  {it.name} — {toFa(it.currentStock)} {(UNIT_LABEL as any)[it.unit] || ''}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      ))}
      <Btn size="sm" full onClick={() => setForm(f => ({ ...f, goods: [...f.goods, { id: crypto.randomUUID(), name: '', quantity: 0, unit: 'pcs', estimatedPrice: 0 }] }))}>+ افزودن کالا</Btn>

      {/* تحویل‌ها */}
      {form.goods.length > 0 && (
        <>
          <div style={{ paddingTop: 12, marginTop: 4, borderTop: '1px dashed var(--border)', fontSize: 'var(--fs-base)', fontWeight: 700, color: 'var(--text)', letterSpacing: '.3px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>📤 تحویل‌ها</span>
            {(() => {
              const outs = form.deliveries.filter(d => d.type === 'out').reduce((s, d) => s + (Number(d.quantity) || 0), 0);
              const rets = form.deliveries.filter(d => d.type === 'return').reduce((s, d) => s + (Number(d.quantity) || 0), 0);
              const loss = form.deliveries.filter(d => d.type === 'loss').reduce((s, d) => s + (Number(d.quantity) || 0), 0);
              const net = outs - rets - loss;
              return net !== 0 ? <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--accent)', fontWeight: 700 }}>خالص: {toFa(net.toLocaleString('fa-IR'))}</span> : null;
            })()}
          </div>

          {form.deliveries.map((dv, di) => (
            <div key={dv.id} style={{ padding: 'var(--pad-normal)', background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', display: 'flex', flexDirection: 'column', gap: 6 }}>
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
              {(() => {
                const linkedGood = form.goods.find(x => x.id === dv.goodId);
                if (!linkedGood?.linkedItemId) return null;
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
          <Btn size="sm" full onClick={() => setForm(f => ({ ...f, deliveries: [...f.deliveries, { id: crypto.randomUUID(), goodId: f.goods[0]?.id || '', date: form.date || '', type: 'out', quantity: 0, notes: '' }] }))}>{form.deliveries.length === 0 ? '+ ثبت اولین تحویل' : '+ افزودن تحویل دیگر'}</Btn>
        </>
      )}

      {/* فروش‌ها */}
      {form.goods.length > 0 && (
        <>
          <div style={{ paddingTop: 12, marginTop: 4, borderTop: '1px dashed var(--border)', fontSize: 'var(--fs-base)', fontWeight: 700, color: 'var(--text)', letterSpacing: '.3px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>💰 فروش‌ها</span>
            {(() => {
              const tot = form.sales.reduce((s, x) => s + ((Number(x.quantity) || 0) * (Number(x.unitPrice) || 0)), 0);
              return tot > 0 ? <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--accent)', fontWeight: 700 }}>{toFa(tot.toLocaleString('fa-IR'))} ت</span> : null;
            })()}
          </div>

          {form.sales.map((s, si) => {
            const total = (Number(s.quantity) || 0) * (Number(s.unitPrice) || 0);
            return (
              <div key={s.id} style={{ padding: 'var(--pad-normal)', background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', display: 'flex', flexDirection: 'column', gap: 6 }}>
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
          <Btn size="sm" full onClick={() => setForm(f => ({ ...f, sales: [...f.sales, { id: crypto.randomUUID(), goodId: f.goods[0]?.id || '', date: form.date || '', quantity: 0, unitPrice: 0 }] }))}>{form.sales.length === 0 ? '+ ثبت اولین فروش' : '+ افزودن فروش دیگر'}</Btn>
        </>
      )}

      {/* پرداخت‌ها */}
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
        <div key={p.id} style={{ padding: 'var(--pad-normal)', background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', display: 'flex', flexDirection: 'column', gap: 6 }}>
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
              <MoneyField showWords={false} placeholder="مبلغ" value={p.amount > 0 ? toFa(String(p.amount)) : ''} onChange={e => { const raw = parseFloat(toEn(e.target.value).replace('٫', '.')) || 0; setForm(f => ({ ...f, payments: f.payments.map(x => x.id === p.id ? { ...x, amount: raw } : x) })); }} />
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
      <Btn size="sm" full onClick={() => setForm(f => ({ ...f, payments: [...f.payments, { id: crypto.randomUUID(), date: form.date || '', amount: 0, direction: 'in', method: 'cash', notes: '' }] }))}>{form.payments.length === 0 ? '+ ثبت اولین پرداخت' : '+ افزودن پرداخت دیگر'}</Btn>

      {/* خلاصه مالی */}
      {(form.goods.length > 0 || form.sales.length > 0) && (
        <div style={{ padding: 'var(--pad-comfy)', background: 'var(--accent-soft)', border: '1px solid var(--accent-border)', borderRadius: 'var(--r-md)', display: 'flex', flexDirection: 'column', gap: 4, fontSize: 'var(--fs-sm)', marginTop: 8 }}>
          <div style={{ fontWeight: 700, color: 'var(--accent)', marginBottom: 4 }}>🧮 خلاصه مالی</div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>کل تحویلی:</span><span style={{ fontWeight: 700 }}>{toFa(calc.totalDelivered.toLocaleString('fa-IR'))}</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>فروش کل (تعداد):</span><span style={{ fontWeight: 700 }}>{toFa(calc.totalSold.toLocaleString('fa-IR'))}</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>در دست طرف:</span><span style={{ fontWeight: 700 }}>{toFa(calc.inHand.toLocaleString('fa-IR'))}</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--accent-border)', paddingTop: 4, marginTop: 4 }}><span>فروش کل (مبلغ):</span><span style={{ fontWeight: 700 }}>{toFa(calc.totalSales.toLocaleString('fa-IR'))} ت</span></div>
          {calc.commission > 0 && <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>کمیسیون:</span><span style={{ fontWeight: 700, color: 'var(--warn)' }}>{toFa(calc.commission.toLocaleString('fa-IR'))} ت</span></div>}
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>سهم من:</span><span style={{ fontWeight: 700, color: 'var(--accent)' }}>{toFa(calc.myShare.toLocaleString('fa-IR'))} ت</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>دریافتی:</span><span style={{ fontWeight: 700 }}>{toFa(calc.paidIn.toLocaleString('fa-IR'))} ت</span></div>
          {calc.paidOut > 0 && <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>پرداختی:</span><span style={{ fontWeight: 700 }}>{toFa(calc.paidOut.toLocaleString('fa-IR'))} ت</span></div>}
          <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--accent-border)', paddingTop: 4, marginTop: 4, fontWeight: 700, color: calc.balance > 0 ? 'var(--danger)' : 'var(--accent)' }}>
            <span>مانده:</span><span>{toFa(calc.balance.toLocaleString('fa-IR'))} ت</span>
          </div>
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

function Row({ l, v }: { l: string; v: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--fs-sm)', padding: 'var(--pad-tight)', background: 'var(--input-bg)', borderRadius: 'var(--r-sm)' }}>
      <span style={{ color: 'var(--muted)' }}>{l}:</span>
      <span style={{ fontWeight: 600, color: 'var(--text)' }}>{v}</span>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      paddingTop: 12, marginTop: 4, borderTop: '1px dashed var(--border)', fontSize: 'var(--fs-base)', fontWeight: 700, color: 'var(--text)', letterSpacing: '.3px'
    }}>{children}</div>
  );
}

function chip(active: boolean): React.CSSProperties {
  return {
    padding: '6px 11px', fontSize: 'var(--fs-sm)',
    background: active ? 'var(--accent-soft)' : 'var(--btn-bg)',
    border: `1px solid ${active ? 'var(--accent-border)' : 'var(--border)'}`,
    borderRadius: 'var(--r-sm)',
    color: active ? 'var(--accent)' : 'var(--muted)',
    fontWeight: active ? 600 : 500, cursor: 'pointer',
    fontFamily: 'inherit', whiteSpace: 'nowrap'
  };
}
