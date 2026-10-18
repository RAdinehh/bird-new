/**
 * InvoicePage — صفحه مشترک خرید و فروش
 */
import { useState, useMemo, useEffect } from 'react';
import { useInvoiceSelection } from './hooks/useInvoiceSelection';
import { useFab } from '../../shr/hooks/useFab';
import {
  useTra, CATEGORIES, paidSum, remaining, STATUS_LABEL,
  WORKFLOW_LABEL, calcDueDate, CHECK_STATUS_LABEL, nextWorkflowStatus, workflowTone,
  type Invoice, type WorkflowStatus,
} from './store';
import { useWhs } from '../whs/store';
import { useFlk } from '../flk/store';
import { useCtc } from '../ctc/store';
import { Btn, Empty, PageContainer, Tag } from '../../shr/components/ui';
import ExpandableCard from '../../shr/components/ExpandableCard';
import { useFilterSort, FilterBar, getTraInvoicesConfig } from '../../shr/filter';
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
import TransferModal from './components/TransferModal';
import InvoiceFormModal from './components/InvoiceFormModal';
import FlockCreateStandalone from '../flk/components/FlockCreateStandalone';

export default function InvoicePage({ kind, active = true }: { kind: 'purchase' | 'sale'; active?: boolean }) {
  const isPurchase = kind === 'purchase';
  const { invoices, addInvoice, updateInvoice, deleteInvoice } = useTra();
  const { contacts } = useCtc();
  const { flocks } = useFlk();
  const { items: whsItems } = useWhs();
  const [undoData, setUndoData] = useState<{ item: any | any[] } | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [printId, setPrintId] = useState<string | null>(null);
  const [transferModal, setTransferModal] = useState<{ id: string; to: WorkflowStatus } | null>(null);
  const [newFlockModalOpen, setNewFlockModalOpen] = useState(false);
  const [transferNote, setTransferNote] = useState('');
  const [transferDate, setTransferDate] = useState('');
  const [searchParams, setSearchParams] = useSearchParams();

  // ⭐ hook فرم فاکتور
  const {
    open, setOpen, form, setForm, err, setErr, parties,
    total, paid, rem,
    addItem, updateItem, removeItem,
    addPayment, updatePayment, removePayment,
    openNew, openEdit, save,
  } = useInvoiceForm({ kind, invoices, contacts, addInvoice, updateInvoice });

  // آبشار: اگه partyId دیگه در لیست فیلترشده نیست، پاک شه
  useEffect(() => {
    if (!open || !form.partyId) return;
    if (!parties.some(p => p.id === form.partyId)) {
      setForm(f => ({ ...f, partyId: '' }));
    }
  }, [parties, form.partyId, open]);

  // بازکردن خودکار از URL (از EquipmentPage)
  useEffect(() => {
    if (!isPurchase) return;
    const flag = searchParams.get('_tra');
    if (flag !== 'equip') return;

    const equipmentId = searchParams.get('equipmentId') || '';
    const name = searchParams.get('name') || 'تجهیز';
    const qty = parseInt(searchParams.get('qty') || '1') || 1;
    const price = parseInt(searchParams.get('price') || '0') || 0;

    if (!equipmentId) return;

    const today = (() => {
      const d = new Date();
      return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;
    })();

    setForm({
      ...empty(true),
      date: today,
      category: 'equipment',
      items: [{
        id: crypto.randomUUID(),
        description: name,
        unit: 'عدد',
        quantity: qty,
        unitPrice: price,
        total: qty * price,
        equipmentId,
      } as any],
    });
    setErr('');
    setOpen(true);

    try { setSearchParams({}); } catch {}
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
          resetAll, hasActiveFilters, total: totalFiltered, count } = fsResult;
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
  });

  useEffect(() => {
    if (ms.selectionMode) setExpandedId(null);
  }, [ms.selectionMode]);

  useFab(active ? { label: 'ثبت فاکتور', onClick: openNew } : null);

  // ═══ اعتبارسنجی زنده ═══
  const { errors: vErrors } = useValidation(
    createInvoiceSchema({}),
    {
      type: kind,
      date: form.date || '',
      partyId: form.partyId || '',
      category: form.category || '',
      items: form.items.map(it => ({
        id: it.id,
        description: it.description || '',
        unit: it.unit || '',
        quantity: Number(it.quantity) || 0,
        unitPrice: Number(it.unitPrice) || 0,
        total: Number(it.total) || 0,
        itemId: it.itemId || '',
        movementId: it.movementId || '',
        discountType: it.discountType || '',
        discountValue: Number(it.discountValue) || 0,
        shipping: Number(it.shipping) || 0,
        itemPartyId: it.itemPartyId || '',
        birdId: it.birdId || '',
        breedId: it.breedId || '',
        flockId: it.flockId || '',
        ageDays: it.ageDays ?? null,
        maleCount: it.maleCount ?? null,
        femaleCount: it.femaleCount ?? null,
        unknownCount: it.unknownCount ?? null,
      })),
      discount: 0,
      shipping: 0,
      total: Number(total) || 0,
      payments: form.payments.map(pp => ({
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
      relatedFlockId: '',
      relatedEntryId: '',
      notes: form.notes || '',
      paymentTerms: form.paymentTerms,
      workflowStatus: 'draft',
    },
  );

  const doTransfer = () => {
    if (!transferModal) return;
    const inv = invoices.find(i => i.id === transferModal.id);
    if (!inv) return;
    const patch: Partial<Invoice> = { workflowStatus: transferModal.to };
    if (transferModal.to === 'confirmed') patch.confirmedAt = transferDate || new Date().toISOString();
    else if (transferModal.to === 'received') {
      patch.receivedAt = transferDate || new Date().toISOString();
      patch.receivedNote = transferNote;
    } else if (transferModal.to === 'paid') {
      patch.paidAt = transferDate || new Date().toISOString();
      patch.paidNote = transferNote;
    }
    updateInvoice(inv.id, patch);
    setTransferModal(null); setTransferNote(''); setTransferDate('');
  };

  return (
    <PageContainer>
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
        title={isPurchase ? 'ثبت خرید از فروشنده' : 'ثبت فروش به مشتری'}
        description={isPurchase ? 'اگر می‌خواهید این خرید به انبار اضافه شود، «اتصال به انبار» را فعال کنید.' : 'فروش از انبار یا تولید. برای ROI، گله را انتخاب کنید.'}
        tone="success"
      />

      {/* FilterBar */}
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
      ) : (
        <>
          {list.map((inv, i) => {
            const party = parties.find(c => c.id === inv.partyId);
            const isOpen = !ms.selectionMode && expandedId === inv.id;
            const rem2 = remaining(inv);
            const st = rem2 === 0 ? 'paid' : paidSum(inv.payments || []) > 0 ? 'partial' : 'unpaid';
            return (
              <ExpandableCard
                key={inv.id}
                id={inv.id}
                ms={ms}
                accent={rem2 === 0 ? 'accent' : 'warn'}
                index={toFa(i + 1)}
                iconEmoji="🛒"
                title={party?.name || '—'}
                subtitle={`${toFa(inv.date)}${inv.number ? ` • ${inv.number}` : ''}`}
                isOpen={isOpen}
                onToggle={() => setExpandedId(isOpen ? null : inv.id)}
                badge={
                  <div style={{ display: 'flex', gap: 4 }}>
                    <Tag tone={workflowTone(inv.workflowStatus)}>
                      {WORKFLOW_LABEL[inv.workflowStatus || 'draft']}
                    </Tag>
                    <Tag tone={st === 'paid' ? 'green' : st === 'partial' ? 'amber' : 'red'}>
                      {STATUS_LABEL[st as keyof typeof STATUS_LABEL] || '—'}
                    </Tag>
                  </div>
                }
                stats={
                  <>
                    <span>کل: <b>{toFa(inv.total.toLocaleString('fa-IR'))} ت</b></span>
                    {rem2 > 0 && <span style={{ color: 'var(--warn)' }}>مانده: <b>{toFa(rem2.toLocaleString('fa-IR'))}</b></span>}
                    {inv.items.length > 0 && <span>{toFa(inv.items.length)} قلم</span>}
                  </>
                }
              >
                <SectionTitle><span style={{ fontSize: 'var(--fs-sm)', lineHeight: 1, display: 'inline-block', marginLeft: 4 }}>📋</span> اطلاعات</SectionTitle>
                <Row l="فروشنده" v={party?.name || '—'} />
                <Row l="تاریخ" v={toFa(inv.date)} />
                {inv.number ? <Row l="شماره" v={inv.number} /> : null}
                {inv.dueDate ? <Row l="سرسید" v={toFa(inv.dueDate)} /> : null}
                {inv.isPreorder && inv.deliveryDate ? <Row l="📅 تاریخ تحویل" v={toFa(inv.deliveryDate)} /> : null}

                <SectionTitle><span style={{ fontSize: 'var(--fs-sm)', lineHeight: 1, display: 'inline-block', marginLeft: 4 }}>📦</span> اقلام</SectionTitle>
                {inv.items.map(it => (
                  <div key={it.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--fs-sm)', padding: 'var(--pad-tight)', background: 'var(--input-bg)', borderRadius: 'var(--r-sm)' }}>
                    <span>{it.description || '—'} × {toFa(it.quantity)}</span>
                    <span style={{ fontWeight: 600 }}>{toFa(it.total.toLocaleString('fa-IR'))} ت</span>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--fs-sm)', padding: 'var(--pad-normal)', background: 'var(--accent-soft)', color: 'var(--accent)', borderRadius: 'var(--r-sm)', fontWeight: 700 }}>
                  <span>جمع کل:</span>
                  <span>{toFa(inv.total.toLocaleString('fa-IR'))} ت</span>
                </div>

                {inv.payments && inv.payments.length > 0 && (
                  <>
                    <SectionTitle>💳 پرداخت‌ها</SectionTitle>
                    {inv.payments.map(p => (
                      <div key={p.id} style={{ padding: 'var(--pad-normal)', background: 'var(--input-bg)', borderRadius: 'var(--r-sm)', fontSize: 'var(--fs-sm)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>{p.method === 'cash' ? '💵 نقدی' : p.method === 'card' ? '💳 کارت' : '📄 چک'} • {toFa(p.date)}</span>
                          <span style={{ fontWeight: 600 }}>{toFa(p.amount.toLocaleString('fa-IR'))} ت</span>
                        </div>
                        {p.method === 'check' && (
                          <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', marginTop: 2 }}>
                            چک {p.checkNo} • {p.bank} • {CHECK_STATUS_LABEL[p.status || 'pending']}
                          </div>
                        )}
                      </div>
                    ))}
                  </>
                )}

                {nextWorkflowStatus(inv.workflowStatus) && (
                  <Btn
                    size="sm" variant="primary" full
                    onClick={() => setTransferModal({ id: inv.id, to: nextWorkflowStatus(inv.workflowStatus)! })}
                  >
                    ▶️ {WORKFLOW_LABEL[nextWorkflowStatus(inv.workflowStatus)!]}
                  </Btn>
                )}

                <div style={{ display: 'flex', gap: 6, paddingTop: 4 }}>
                  <Btn size="sm" onClick={() => setPrintId(inv.id)} style={{ flex: 1 }}>🖨 چاپ</Btn>
                  <Btn size="sm" onClick={() => openEdit(inv)} style={{ flex: 1 }}>ویرایش</Btn>
                  <Btn size="sm" onClick={async () => {
                          const ok = await showConfirmAsync('تأیید حذف', 'این فاکتور حذف شود؟', { danger: true });
                          if (!ok) return;
                          deleteInvoice(inv.id);
                          logAction('delete', 'tra', 'حذف از معاملات');
                          toastMsg.deleted('فاکتور')
                        }} style={{ flex: 1 }}>حذف</Btn>
                </div>
              </ExpandableCard>
            );
          })}
        </>
      )}

      {/* ============ Modal اصلی فرم ============ */}
      <MultiSelectBar ms={ms} deleteLabel="حذف" />

      {ms.selectionMode && <div style={{ height: 90 }} />}

      <InvoiceFormModal
        open={open}
        setOpen={setOpen}
        form={form}
        setForm={setForm}
        onNewFlock={() => setNewFlockModalOpen(true)}
        isPurchase={isPurchase}
        parties={parties}
        flocks={flocks}
        whsItems={whsItems}
        vErrors={vErrors}
        err={err}
        total={total}
        paid={paid}
        rem={rem}
        save={save}
        addItem={addItem}
        updateItem={updateItem}
        removeItem={removeItem}
        addPayment={addPayment}
        updatePayment={updatePayment}
        removePayment={removePayment}
      />

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
        setTransferDate={setTransferDate}
        onClose={() => { setTransferModal(null); setTransferNote(''); setTransferDate(''); }}
        onConfirm={doTransfer}
      />

      {/* چاپ */}
      {printId && (() => {
        const inv = invoices.find(i => i.id === printId);
        if (!inv) return null;
        return <InvoicePrint invoice={inv} onClose={() => setPrintId(null)} />;
      })()}
    </PageContainer>
  );
}
