import { useFormat } from '../../shr/units/useFormat';
import { useHal } from '../hal/store';
import { kindForType } from '../hal/api/equipmentCalc';
/**
 * InvoicePage — صفحه مشترک خرید و فروش
 */
import { useState, useMemo, useEffect, useRef } from 'react';
import { useInvoiceSelection } from './hooks/useInvoiceSelection';
import { useFab } from '../../shr/hooks/useFab';
import {
  useTra, CATEGORIES, paidSum, remaining, STATUS_LABEL,
  WORKFLOW_LABEL, calcDueDate, CHECK_STATUS_LABEL, nextWorkflowStatus, workflowTone,
  type Invoice, type WorkflowStatus,
} from './store';
import { getTodayJalali } from './calc';
import { useWhs } from '../whs/store';
import { useFlk } from '../flk/store';
import { useCtc } from '../ctc/store';
import { Btn, Empty, PageContainer, Tag } from '../../shr/components/ui';
import ExpandableCard from '../../shr/components/ExpandableCard';
import { useFilterSort, FilterBar, getTraInvoicesConfig } from '../../shr/filter';
import { useGroupedList } from '../../shr/filter/useGroupedList';
import MultiSelectBar from '../../shr/multiSelect/MultiSelectBar';
import HelpBanner from '../../shr/components/HelpBanner';
import InvoicePrint from './InvoicePrint';
import { toFa, toEn } from '../../shr/utils/fa';
import { showConfirmAsync } from '../../cor/store/dialog';
import UndoBar from '../../cor/ui/UndoBar';
import { toastMsg } from '../../cor/store/toast';
import { Row, SectionTitle } from './helpers';
import { logAction } from '../../cor/logger/auditLog';
import { useSearchParams } from 'react-router-dom';
import { useValidation } from '../../shr/validation/useValidation';
import { createInvoiceSchema } from '../../shr/validation/rules/tra';
import { emptyForm as empty } from './types-invoice';
import { useInvoiceForm } from './hooks/useInvoiceForm';
import { differenceInCalendarDays } from 'date-fns-jalali';
import { parseJalali } from '../../shr/date/jalali';
import TransferModal from './components/TransferModal';
import InvoiceCard from './components/InvoiceCard';
import InvoiceFormModal from './components/InvoiceFormModal';
import { showPromptAsync } from '../../cor/store/dialog';
import DisputeModal from './components/DisputeModal';
import RecycleBinModal from './components/RecycleBinModal';
import { AccordionSection } from '../../shr/components/AccordionSection';
import FlockCreateStandalone from '../flk/components/FlockCreateStandalone';

export default function InvoicePage({ kind, active = true }: { kind: 'purchase' | 'sale'; active?: boolean }) {
  const fmt = useFormat();
  const isPurchase = kind === 'purchase';
  const { invoices: _allInvoices, deals, addInvoice, updateInvoice, deleteInvoice, reopenInvoice, allocations, resolveDispute, writeOffInvoice, settlements } = useTra();
  const { contacts } = useCtc();
  const { flocks } = useFlk();
  const { items: whsItems } = useWhs();
  const [undoData, setUndoData] = useState<{ item: any | any[] } | null>(null);
  const [recycleOpen, setRecycleOpen] = useState(false);
  const [disputeTarget, setDisputeTarget] = useState<Invoice | null>(null);
  const [groupBy, setGroupBy] = useState<string>('none');
  const { listDeletedInvoices } = useTra();
  const recycleCount = listDeletedInvoices().length;
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [printId, setPrintId] = useState<string | null>(null);
  const [transferModal, setTransferModal] = useState<{ id: string; to: WorkflowStatus } | null>(null);
  const [newFlockModalOpen, setNewFlockModalOpen] = useState(false);
  const [transferNote, setTransferNote] = useState('');
  const [transferDate, setTransferDate] = useState('');
  const [transferDateError, setTransferDateError] = useState('');
  const [searchParams, setSearchParams] = useSearchParams();
  const relatedDealIdFilter = searchParams.get('relatedDealId') || '';
  const invoices = useMemo(() => {
    if (!relatedDealIdFilter) return _allInvoices;
    return _allInvoices.filter((inv: any) => inv.relatedDealId === relatedDealIdFilter);
  }, [_allInvoices, relatedDealIdFilter]);
  const clearRelatedDealId = () => {
    const next = new URLSearchParams(searchParams);
    next.delete('relatedDealId');
    setSearchParams(next, { replace: true });
  };

  // ⭐ hook فرم فاکتور
  const {
    open, setOpen, form, setForm, err, setErr, parties,
    total, paid, rem,
    addItem, updateItem, removeItem,
    addPayment, updatePayment, removePayment,
    openNew, openEdit, save,
  } = useInvoiceForm({ kind, invoices, contacts, flocks, whsItems, allocations, addInvoice, updateInvoice });

  // 🆕 باز کردن فرم ویرایش از URL (از Aging در ReceivablesPage)
  // ⚠️ روش dedupe: nonce `_t` در URL + sessionStorage
  //   - هر بار EntityLink یک `_t` جدید می‌دهد → click موفق
  //   - refresh همان `_t` را می‌آورد → sessionStorage می‌گوید «قبلاً پردازش شده» → باز نمی‌شود
  const processedEditRef = useRef<string | null>(null);
  useEffect(() => {
    if (!active) return;
    const editId = searchParams.get('edit');
    if (!editId) {
      processedEditRef.current = null;
      // پاکسازی session keys — URL دیگر edit ندارد
      try {
        Object.keys(sessionStorage).forEach(k => {
          if (k.startsWith('tra-edit-')) sessionStorage.removeItem(k);
        });
      } catch { /* silent */ }
      return;
    }

    const nonce = searchParams.get('_t') || '';
    const key = `${editId}:${nonce}`;
    if (processedEditRef.current === key) return;  // double-processing (StrictMode)

    // refresh detection: همان URL قبلاً در این session پردازش شده
    const sessionKey = `tra-edit-${key}`;
    try {
      if (sessionStorage.getItem(sessionKey)) {
        // قبلاً پردازش شد (refresh) → پاک URL، باز نکن
        const next = new URLSearchParams(searchParams);
        next.delete('edit');
        next.delete('_t');
        setSearchParams(next, { replace: true });
        return;
      }
    } catch { /* silent */ }

    const inv = _allInvoices.find(i => i.id === editId);
    if (!inv) return;
    if (inv.type !== kind) return;

    processedEditRef.current = key;
    try { sessionStorage.setItem(sessionKey, '1'); } catch { /* silent */ }
    openEdit(inv);
    const next = new URLSearchParams(searchParams);
    next.delete('edit');
    next.delete('_t');
    setSearchParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, active, kind]);

  // آبشار: اگه partyId دیگه در لیست فیلترشده نیست، پاک شه
  useEffect(() => {
    if (!open || !form.partyId) return;
    if (!parties.some(p => p.id === form.partyId)) {
      setForm(f => ({ ...f, partyId: '' }));
    }
  }, [parties, form.partyId, open]);

  // بازکردن خودکار از URL (از EquipmentPage) — خواندن کامل تمام فیلدهای تجهیز از useHal
  useEffect(() => {
    if (!isPurchase) return;
    const flag = searchParams.get('_tra');
    if (flag !== 'equip') return;

    const equipmentId = searchParams.get('equipmentId') || '';
    if (!equipmentId) return;

    const eq = useHal.getState().equipment.find(x => x.id === equipmentId);
    const name = eq?.name || searchParams.get('name') || 'تجهیز';
    const qty = eq?.count || parseInt(searchParams.get('qty') || '1') || 1;
    const price = eq?.unitPrice || parseInt(searchParams.get('price') || '0') || 0;
    const invoiceDate = eq?.purchasedAt || getTodayJalali();

    setForm({
      ...empty(true),
      date: invoiceDate,
      dueDate: invoiceDate,
      partyId: eq?.supplierId || '',
      category: 'equipment',
      notes: eq?.notes || '',
      items: [{
        id: crypto.randomUUID(),
        category: 'equipment',
        description: name,
        unit: eq?.unit || 'pcs',
        quantity: qty,
        unitPrice: price,
        total: qty * price,
        equipmentId,
        equipmentKind: (() => {
          const raw = eq?.kind || (eq ? kindForType(eq.type) : undefined);
          return raw === 'consumable' ? 'consumable' : 'asset';
        })(),
        equipmentType: (() => {
          const raw = eq?.kind || (eq ? kindForType(eq.type) : undefined);
          return raw === 'consumable' ? 'consumable' : 'asset';
        })(),
        equipmentCategory: (() => {
          const validCats = ['ventilation', 'feeding', 'watering', 'lighting', 'cage', 'other'];
          if (eq?.category && validCats.includes(eq.category)) return eq.category;
          if (eq?.category === 'drinking') return 'watering';
          return 'other';
        })(),
        hallId: eq?.hallId || '',
        zoneId: eq?.zoneId || '',
        brand: eq?.brand || '',
        model: eq?.model || '',
        warrantyMonths: eq?.warranty ?? null,
      } as any],
    });
    setErr('');
    setOpen(true);

    try {
      const next = new URLSearchParams(searchParams);
      next.delete('_tra');
      next.delete('equipmentId');
      setSearchParams(next, { replace: true });
    } catch {}
  }, [searchParams, isPurchase]);
  useEffect(() => {
    if (!open) return;
    setForm(f => {
      if (!f.date) return f;
      let newDue = f.dueDate;
      if (f.paymentTerms === 'cash') newDue = f.date;
      else if (f.paymentTerms === 'custom') newDue = f.customDueDate || f.date;
      else if (f.paymentTerms === 'installment') {
        const gap = parseInt(toEn(f.installmentGapDays)) || 30;
        newDue = calcDueDate('installment', f.date, '', gap);
      }
      return newDue !== f.dueDate ? { ...f, dueDate: newDue } : f;
    });
  }, [open, form.date, form.paymentTerms, form.customDueDate, form.installmentGapDays]);
  const kindFiltered = useMemo(() => invoices.filter(i => i.type === kind), [invoices, kind]);

  const config = useMemo(() => {
    const partyNames: Record<string, string> = {};
    kindFiltered.forEach(i => {
      if (i.partyId && !partyNames[i.partyId]) {
        const c = parties.find(x => x.id === i.partyId);
        if (c) partyNames[i.partyId] = c.name;
      }
    });
    const cats = isPurchase
      ? (CATEGORIES.purchase as Array<[string, string]>)
      : (CATEGORIES.sale as Array<[string, string]>);
    return getTraInvoicesConfig({ partyNames, categories: cats });
  }, [kindFiltered, parties, isPurchase]);
  const fsResult = useFilterSort<Invoice>({
    items: kindFiltered,
    filters: config.filterDefs,
    sorts: config.sortDefs,
    persistKey: config.persistKey,
    initialSort: config.initialSort,
  });
  const { filtered: list, filters, setFilter, clearFilter, sort, setSort, toggleSort,
          resetAll, hasActiveFilters, total: totalFiltered, count, sortStack, appendSort } = fsResult;

  // 🆕 گروه‌بندی از هوک مشترک
  const grouped = useGroupedList({
    list,
    groupDefs: config.groupDefs,
    groupBy,
    ctx: {
      partyNames: Object.fromEntries(parties.map(p => [p.id, p.name])),
      categories: CATEGORIES[isPurchase ? 'purchase' : 'sale'],
    },
  });
  const groupedList = useMemo(
    () => grouped ? [...grouped].sort((a, b) => a.title.localeCompare(b.title, 'fa')) : null,
    [grouped],
  );
  const undoDelete = () => {
    if (!undoData) return;
    const arr = Array.isArray((undoData as any).item) ? (undoData as any).item : [(undoData as any).item];
    try { arr.forEach((it: any) => { try { addInvoice(it); } catch {} }); toastMsg.restoredBulk(arr.length, 'مورد'); }
    catch { toastMsg.error('بازگردانی ناموفق'); }
    setUndoData(null);
  };
  const ms = useInvoiceSelection({
    list,
    invoices,
    deleteInvoice,
    setUndoData,
    flocks,
    settlements,
  });

  useEffect(() => {
    if (ms.selectionMode) setExpandedId(null);
  }, [ms.selectionMode]);

  useFab(active && invoices.length > 0 ? { label: 'ثبت فاکتور', onClick: openNew, wakeMode: false } : null);

  // ═══ اعتبارسنجی زنده ═══
  // 🆕 Filter empty items/payments to match save() behavior in useInvoiceForm.ts
  const _cleanItemsForValidation = form.items.filter(it =>
    !((Number(it.quantity) || 0) === 0 && (Number(it.unitPrice) || 0) === 0 && !String(it.description || '').trim())
  );
  const _cleanPaymentsForValidation = form.payments.filter(pp => (Number(pp.amount) || 0) > 0);

  const { errors: vErrors } = useValidation(
    createInvoiceSchema({ flocks, whsItems, contacts, invoices, allocations, isEdit: !!form.id }),
    {
      type: kind,
      date: form.date || '',
      partyId: form.partyId || '',
      category: form.category || '',
      items: _cleanItemsForValidation.map(it => ({
        ...it,
        category: it.category || form.category,
      })),
      discount: 0,
      shipping: 0,
      total: Number(total) || 0,
      payments: _cleanPaymentsForValidation.map(pp => ({
        date: pp.date || '',
        amount: Number(pp.amount) || 0,
        method: pp.method,
        checkNo: pp.checkNo || '',
        bank: pp.bank || '',
        dueDate: pp.dueDate || '',
        notes: pp.notes || '',
        status: pp.status || 'pending',
      })),
      dueDate: form.dueDate || '',
      deliveryDate: form.deliveryDate || '',
      isPreorder: form.isPreorder ?? false,
      relatedFlockId: '',
      relatedEntryId: '',
      relatedDealId: '',
      notes: form.notes || '',
      paymentTerms: form.paymentTerms,
      workflowStatus: 'draft',
    },
  );

  // 🆕 per-field validation (show errors after touch or save attempt)
  const [saveAttempted, setSaveAttempted] = useState(false);
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());
  const markTouched = (f: string) => setTouchedFields((prev) => { const n = new Set(prev); n.add(f); return n; });
  const isRequiredError = (msg: string) =>
    msg.includes('اجباری') ||
    msg.includes('را وارد کنید') ||
    msg.includes('را انتخاب کنید') ||
    msg.includes('لطفاً');
  const showError = (f: string) => {
    if (!saveAttempted && !touchedFields.has(f)) return undefined;
    const err = vErrors[f];
    if (!err) return undefined;
    if (!saveAttempted && isRequiredError(err)) return undefined;
    return err;
  };

  // 🆕 ریست خطاها هنگام تغییر دسته (تا ذخیره زده نشده، فرم تمیز است)
  useEffect(() => {
    setSaveAttempted(false);
    setTouchedFields(new Set());
  }, [form.category]);

  const doTransfer = async () => {
    if (!transferModal) return;
    const inv = invoices.find(i => i.id === transferModal.id);
    if (!inv) return;

    setTransferDateError('');
    const rawDate = transferDate.trim();
    if (!rawDate) {
      setTransferDateError('لطفاً تاریخ را انتخاب کنید.');
      return;
    }

    const parsedTransfer = parseJalali(rawDate);
    if (!parsedTransfer) {
      setTransferDateError('فرمت تاریخ واردشده معتبر نیست.');
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffFromToday = differenceInCalendarDays(parsedTransfer, today);

    if (diffFromToday > 0) {
      setTransferDateError(`تاریخ نمی‌تواند در آینده (${fmt.date(rawDate)}) باشد.`);
      return;
    }

    if (inv.date) {
      const parsedInvDate = parseJalali(inv.date.trim());
      if (parsedInvDate && differenceInCalendarDays(parsedTransfer, parsedInvDate) < 0) {
        setTransferDateError(`تاریخ نمی‌تواند قبل از تاریخ ثبت فاکتور (${fmt.date(inv.date)}) باشد.`);
        return;
      }
    }

    if (diffFromToday < -90) {
      const pastDays = Math.abs(diffFromToday);
      const okOld = await showConfirmAsync(
        '⚠️ هشدار تاریخ قدیمی',
        `تاریخ انتخاب‌شده (${fmt.date(rawDate)}) مربوط به ${fmt.count(pastDays)} روز قبل است.\nآیا از ثبت با این تاریخ مطمئن هستید؟`,
        { confirmText: 'بله، تأیید' }
      );
      if (!okOld) return;
    }
    const patch: Partial<Invoice> = { workflowStatus: transferModal.to };
    if (transferModal.to === 'confirmed') patch.confirmedAt = transferDate || new Date().toISOString();
    else if (transferModal.to === 'received') {
      patch.receivedAt = transferDate || new Date().toISOString();
      patch.receivedNote = transferNote;
    } else if (transferModal.to === 'paid') {
      if (inv.disputeStatus === 'open') {
        toastMsg.error('این فاکتور دارای اختلاف باز است — ابتدا اختلاف را حل کنید');
        setTransferModal(null);
        return;
      }
      // 🆕 فیکس: اگه باقی‌مانده داره، اجازه نده
      const rem = remaining(inv, allocations);
      if (rem > 0) {
        toastMsg.error('فاکتور هنوز تسویه نشده — ابتدا پرداخت را کامل کنید');
        setTransferModal(null);
        return;
      }
      patch.paidAt = transferDate || new Date().toISOString();
      patch.paidNote = transferNote;
    }
    updateInvoice(inv.id, patch);
    setTransferModal(null); setTransferNote(''); setTransferDate(''); setTransferDateError('');
  };

  
  const handleReopen = async (inv: Invoice) => {
    const ok = await showConfirmAsync(
      'بازگشایی فاکتور',
      'این فاکتور پرداخت شده است.\n\nبا بازگشایی:\n• وضعیت به «تایید شده» برمی‌گردد\n• می‌توانید فیلدها را ویرایش کنید\n• پس از ویرایش باید دوباره پرداخت ثبت کنید\n\nادامه می‌دهید؟',
      { confirmText: 'بازگشایی' }
    );
    if (!ok) return;
    reopenInvoice(inv.id);
    try { logAction('update', 'tra', 'بازگشایی فاکتور ' + (inv.number || inv.id)); } catch {}
    setTimeout(() => {
      const fresh = useTra.getState().invoices.find(i => i.id === inv.id);
      if (fresh) openEdit(fresh);
      else openEdit(inv);
    }, 100);
  };

return (
    <PageContainer bottomPad={100}>
      {undoData && (
        <UndoBar
          label="حذف شد"
          onUndo={undoDelete}
          onDismiss={() => setUndoData(null)}
        />
      )}
      <HelpBanner
        id={isPurchase ? 'purchases-intro' : 'sales-intro'}
        icon={isPurchase ? '📥' : '📤'}
        title={isPurchase ? 'راهنمای خرید' : 'راهنمای فروش'}
        description={isPurchase
          ? 'فاکتورهای خرید خوراک، دارو، تجهیزات و سایر اقلام را ثبت و وضعیت پرداخت و مانده بدهی به فروشنده را پیگیری کنید؛ در صورت نیاز، خرید را به انبار یا هزینهٔ گله متصل کنید.'
          : 'فاکتورهای فروش محصول (تخم، مرغ، جوجه و...) را ثبت، وضعیت تسویه و مانده طلب از مشتری را پیگیری و در صورت مرتبط بودن، درآمد را به گله وصل کنید.'}
        tone="info"
      />


      {/* 🆕 Deep Link banner */}
      {relatedDealIdFilter && (
        <div style={{
          padding: 'var(--pad-normal)', marginBottom: 8,
          background: 'var(--accent-soft)', border: '1px solid var(--accent-border)',
          borderRadius: 'var(--r-md)', display: 'flex',
          justifyContent: 'space-between', alignItems: 'center',
          fontSize: 'var(--fs-sm)', fontWeight: 600,
        }}>
          <span>🔍 فیلتر: فاکتورهای مربوط به معامله</span>
          <button type="button" onClick={clearRelatedDealId}
            style={{ background: 'transparent', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 'var(--fs-sm)', fontWeight: 700, padding: '4px 8px' }}>
            ✕ پاک کردن
          </button>
        </div>
      )}
      {/* FilterBar */}
      <FilterBar
        filterDefs={config.filterDefs}
        sortDefs={config.sortDefs}
        filterState={filters}
        sortState={sort}
        setFilter={setFilter}
        clearFilter={clearFilter}
        setSort={setSort}
        toggleSort={toggleSort} sortStack={sortStack} appendSort={appendSort} groupBy={groupBy} setGroupBy={setGroupBy} recycleCount={recycleCount} onOpenRecycleBin={() => setRecycleOpen(true)}
        resetAll={resetAll}
        hasActiveFilters={hasActiveFilters}
        total={totalFiltered}
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
          icon={<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><path d="M12 2v20M5 8h14M5 16h14"/></svg>}
          title={isPurchase ? 'خریدی ثبت نشده' : 'فروشی ثبت نشده'}
          desc={isPurchase ? 'اولین خرید خود را ثبت کنید.' : 'اولین فروش خود را ثبت کنید.'}
          action={<Btn variant="primary" onClick={openNew}>{isPurchase ? '+ ثبت خرید' : '+ ثبت فروش'}</Btn>}
        />
      ) : groupedList ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {groupedList.map(group => (
            <AccordionSection 
              key={group.title} 
              title={group.title} 
              icon="📁" 
              summary={`${fmt.count(group.items.length)} مورد`}
              defaultOpen={true}
            >
              {group.items.map((inv, i) => {
                const party = parties.find(c => c.id === inv.partyId);
                const isOpen = !ms.selectionMode && expandedId === inv.id;
                return (
                  <InvoiceCard
                    key={inv.id}
                    inv={inv}
                    partyName={party?.name}
                    isOpen={isOpen}
                    ms={ms}
                    onToggle={() => setExpandedId(isOpen ? null : inv.id)}
                    onTransferClick={() => setTransferModal({ id: inv.id, to: nextWorkflowStatus(inv.workflowStatus)! })}
                    onReopen={remaining(inv, allocations) <= 0 ? () => handleReopen(inv) : undefined}
                    onEdit={remaining(inv, allocations) > 0 && !inv.paidAt && inv.disputeStatus !== 'open' ? () => openEdit(inv) : undefined}
          onDispute={inv.disputeStatus !== 'open' && remaining(inv, allocations) > 0 ? () => setDisputeTarget(inv) : undefined}
          onResolveDispute={inv.disputeStatus === 'open' ? () => resolveDispute(inv.id) : undefined}
          onWriteOff={!inv.writtenOff && inv.disputeStatus !== 'open' && remaining(inv, allocations) > 0 ? async () => {
            const pendingChecks = (inv.payments || []).filter(p => p.method === 'check' && (p as any).checkStatus === 'pending');
            if (pendingChecks.length > 0) {
              toastMsg.error('این فاکتور چک پاس‌نشده دارد — ابتدا وضعیت چک را مشخص یا برگشت بزنید');
              return;
            }
            const rem = remaining(inv, allocations);
            const reason = await showPromptAsync(
              isPurchase ? 'بخشش مانده' : 'حذف بدحساب',
              isPurchase
                ? `مبلغ ${fmt.money(rem, { withUnit: false })} تومان به عنوان بخشش مانده توسط فروشنده از بدهی کسر می‌شود.`
                : `مبلغ ${fmt.money(rem, { withUnit: false })} تومان به عنوان بدحساب حذف می‌شود.`,
              {
                label: 'دلیل',
                placeholder: isPurchase ? 'مثلاً: تخفیف تسویه / رند کردن فاکتور' : 'مثلاً: وصول نشد — مبلغ کم',
                required: true,
                multiline: true,
                rows: 2,
                danger: !isPurchase,
                confirmText: isPurchase ? 'ثبت بخشش' : 'حذف کن',
              },
            );
            if (!reason || !reason.trim()) return;
            writeOffInvoice(inv.id, rem, reason.trim());
            toastMsg.success(isPurchase ? 'بخشش مانده ثبت شد' : 'مبلغ به عنوان بدحساب حذف شد');
          } : undefined}
                    index={i}
                  />
                );
              })}
            </AccordionSection>
          ))}
        </div>
      ) : (
        <>
          {list.map((inv, i) => {
            const party = parties.find(c => c.id === inv.partyId);
            const isOpen = !ms.selectionMode && expandedId === inv.id;
            return (
              <InvoiceCard
                key={inv.id}
                inv={inv}
                partyName={party?.name}
                isOpen={isOpen}
                ms={ms}
                onToggle={() => setExpandedId(isOpen ? null : inv.id)}
                onTransferClick={() => setTransferModal({ id: inv.id, to: nextWorkflowStatus(inv.workflowStatus)! })}
                onReopen={remaining(inv, allocations) <= 0 ? () => handleReopen(inv) : undefined}
                onEdit={remaining(inv, allocations) > 0 && !inv.paidAt && inv.disputeStatus !== 'open' ? () => openEdit(inv) : undefined}
          onDispute={inv.disputeStatus !== 'open' && remaining(inv, allocations) > 0 ? () => setDisputeTarget(inv) : undefined}
          onResolveDispute={inv.disputeStatus === 'open' ? () => resolveDispute(inv.id) : undefined}
          onWriteOff={!inv.writtenOff && inv.disputeStatus !== 'open' && remaining(inv, allocations) > 0 ? async () => {
            const pendingChecks = (inv.payments || []).filter(p => p.method === 'check' && (p as any).checkStatus === 'pending');
            if (pendingChecks.length > 0) {
              toastMsg.error('این فاکتور چک پاس‌نشده دارد — ابتدا وضعیت چک را مشخص یا برگشت بزنید');
              return;
            }
            const rem = remaining(inv, allocations);
            const reason = await showPromptAsync(
              isPurchase ? 'بخشش مانده' : 'حذف بدحساب',
              isPurchase
                ? `مبلغ ${fmt.money(rem, { withUnit: false })} تومان به عنوان بخشش مانده توسط فروشنده از بدهی کسر می‌شود.`
                : `مبلغ ${fmt.money(rem, { withUnit: false })} تومان به عنوان بدحساب حذف می‌شود.`,
              {
                label: 'دلیل',
                placeholder: isPurchase ? 'مثلاً: تخفیف تسویه / رند کردن فاکتور' : 'مثلاً: وصول نشد — مبلغ کم',
                required: true,
                multiline: true,
                rows: 2,
                danger: !isPurchase,
                confirmText: isPurchase ? 'ثبت بخشش' : 'حذف کن',
              },
            );
            if (!reason || !reason.trim()) return;
            writeOffInvoice(inv.id, rem, reason.trim());
            toastMsg.success(isPurchase ? 'بخشش مانده ثبت شد' : 'مبلغ به عنوان بدحساب حذف شد');
          } : undefined}
                index={i}
              />
            );
          })}
        </>
      )}

      {/* ============ Modal اصلی فرم ============ */}
      <MultiSelectBar ms={ms} deleteLabel="حذف" />

      {ms.selectionMode && <div style={{ height: 90 }} />}

      <InvoiceFormModal
        open={open}
        setOpen={(v: boolean) => { if (!v) { setSaveAttempted(false); setTouchedFields(new Set()); } setOpen(v); }}
        form={form}
        setForm={setForm}
        onNewFlock={() => setNewFlockModalOpen(true)}
        isPurchase={isPurchase}
        parties={parties}
        flocks={flocks}
        whsItems={whsItems}
        deals={deals || []}
        vErrors={{ ...(saveAttempted ? vErrors : {}) }}
        err={err}
        total={total}
        paid={paid}
        rem={rem}
        save={async () => {
          setSaveAttempted(true);
          if (Object.keys(vErrors).length > 0) return;
          try {
            await save();
          } catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            toastMsg.error('❌ ' + msg);
            setErr(msg);
          }
        }}
        addItem={addItem}
        updateItem={updateItem}
        removeItem={removeItem}
        addPayment={addPayment}
        updatePayment={updatePayment}
        removePayment={removePayment}
      />
      <DisputeModal open={!!disputeTarget} onClose={() => setDisputeTarget(null)} invoice={disputeTarget} />


      <FlockCreateStandalone
        open={newFlockModalOpen}
        onClose={() => setNewFlockModalOpen(false)}
        onSaved={(id) => setForm(f => ({ ...f, relatedFlockId: id }))}
      />

      {/* Modal انتقال workflow */}
      <TransferModal
        transferModal={transferModal}
        transferNote={transferNote}
        transferDate={transferDate}
        setTransferNote={setTransferNote}
        setTransferDate={v => { setTransferDate(v); if (transferDateError) setTransferDateError(''); }}
        dateError={transferDateError}
        onClose={() => { setTransferModal(null); setTransferNote(''); setTransferDate(''); setTransferDateError(''); }}
        onConfirm={doTransfer}
      />

      {/* چاپ */}
      {printId && (() => {
        const inv = invoices.find(i => i.id === printId);
        if (!inv) return null;
        return <InvoicePrint invoice={inv} onClose={() => setPrintId(null)} />;
      })()}
      <RecycleBinModal open={recycleOpen} onClose={() => setRecycleOpen(false)} />
    </PageContainer>
  );
}