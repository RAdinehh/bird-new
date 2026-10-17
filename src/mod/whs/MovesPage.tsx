import { useState, useMemo, useEffect } from 'react';
import MoveFormModal from './components/MoveFormModal';
import { useFab } from '../../shr/hooks/useFab';
import { useWhs, UNIT_LABEL, MOVEMENT_REASON, CATEGORY_ICON, type Movement, type MovementType, type MovementReason } from './store';
import { useCtc } from '../ctc/store';
import { Btn, Empty, PageContainer, Tag } from '../../shr/components/ui';;
import ExpandableCard from '../../shr/components/ExpandableCard';
import { useMultiSelect } from '../../shr/multiSelect/useMultiSelect';
import MultiSelectBar from '../../shr/multiSelect/MultiSelectBar';
import { toFa, toEn } from '../../shr/utils/fa';
import { showConfirmAsync } from '../../cor/store/dialog';
import UndoBar from '../../cor/ui/UndoBar';
import { toastMsg } from '../../cor/store/toast';
import HelpBanner from '../../shr/components/HelpBanner';
import { useNavigate } from 'react-router-dom';
import { Row, SectionTitle } from './helpers';
import { logAction } from '../../cor/logger/auditLog';
import { useValidation } from '../../shr/validation/useValidation';
import { useFilterSort, FilterBar, getWhsMovesConfig } from '../../shr/filter';
import { createMovementSchema } from '../../shr/validation/rules/whs';

interface F {
  id?: string;
  itemId: string;
  type: MovementType;
  quantity: string;
  unitPrice: string;
  reason: MovementReason;
  date: string;
  partyId: string;
  notes: string;
}

const REASONS_BY_TYPE: Record<MovementType, MovementReason[]> = {
  in:  ['purchase', 'gift', 'return', 'adjustment'],
  out: ['consumption', 'gift', 'loss', 'return', 'adjustment'],
  adjust: ['adjustment'],
};

export default function MovesPage({ active = true }: { active?: boolean } = {}) {
  const navigate = useNavigate();
  const { items, movements, addMovement, deleteMovement } = useWhs();
  const { contacts } = useCtc();

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<F>({
    itemId: '', type: 'in', quantity: '', unitPrice: '',
    reason: 'purchase', date: '', partyId: '', notes: ''
  });
  const [err, setErr] = useState('');
  const [undoData, setUndoData] = useState<{ item: any | any[] } | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // ─── فیلتر / مرتب‌سازی (از config مرکزی) ───
  const config = useMemo(
    () => getWhsMovesConfig({ items }),
    [items]
  );

  const { filtered: list, filters, setFilter, clearFilter,
          sort, setSort, toggleSort, resetAll, hasActiveFilters,
          total, count } = useFilterSort<Movement>({
    items: movements,
    filters: config.filterDefs,
    sorts: config.sortDefs,
    persistKey: config.persistKey,
    initialSort: config.initialSort,
  });

  // ─── Multi-Select ───
  const ms = useMultiSelect({
    items: list,
    getId: (x: any) => x.id,
    onDelete: async (ids: string[]) => {
      const ok = await showConfirmAsync('حذف گروهی', toFa(ids.length) + ' تراکنش حذف شوند؟', { danger: true });
      if (!ok) return;
      const backups: any[] = [];
      for (const id of ids) {
        const it = movements.find(x => x.id === id);
        if (!it) continue;
        backups.push(it);
        try { deleteMovement(id); } catch {}
      }
      if (backups.length > 0) {
        setUndoData({ item: backups });
        setTimeout(() => setUndoData((cur: any) => cur && Array.isArray(cur.item) && cur.item.length === backups.length ? null : cur), 8000);
      }
      toastMsg.deletedBulk(backups.length, 'تراکنش')
    },
  });

  useEffect(() => {
    if (ms.selectionMode) setExpandedId(null);
  }, [ms.selectionMode]);

  const undoDelete = () => {
    if (!undoData) return;
    const raw = (undoData as any).item;
    const arr: any[] = Array.isArray(raw) ? raw : [raw];
    try {
      for (const it of arr) {
        try { addMovement(it); } catch {}
      }
      toastMsg.restoredBulk(arr.length, 'مورد')
    } catch { toastMsg.error('بازگردانی ناموفق') }
    setUndoData(null);
  };

  const openNew = () => {
    if (items.length === 0) { toastMsg.error('اول یک قلم در انبار بسازید'); return; }
    setForm({
      itemId: items[0].id, type: 'in', quantity: '', unitPrice: '',
      reason: 'purchase', date: '', partyId: '', notes: ''
    });
    setErr(''); setOpen(true);
  };
  useFab(active ? { label: 'ثبت تراکنش', onClick: openNew } : null);

  const openEdit = (m: Movement) => {
    setForm({
      id: m.id, itemId: m.itemId, type: m.type,
      quantity: m.quantity ? toFa(m.quantity) : '',
      unitPrice: m.unitPrice ? toFa(m.unitPrice) : '',
      reason: m.reason, date: m.date,
      partyId: m.partyId || '', notes: m.notes || ''
    });
    setErr(''); setOpen(true);
  };

  const num = (s: string) => s ? parseFloat(toEn(s).replace('٫','.')) || 0 : 0;

  // ═══ اعتبارسنجی زنده ═══
  const { errors: vErrors } = useValidation(
    createMovementSchema(),
    {
      itemId: form.itemId || '',
      type: form.type,
      quantity: num(form.quantity),
      unitPrice: num(form.unitPrice),
      reason: form.reason,
      date: form.date || '',
      partyId: form.partyId || '',
      notes: form.notes || '',
      flockId: '',
      sourceModule: 'manual',
      sourceId: '',
      batchNo: '',
    },
  );

  const selectedItem = items.find(i => i.id === form.itemId);
  const currentStock = selectedItem ? selectedItem.currentStock : 0;

  const save = async () => {
    if (form.reason === 'purchase' && !form.partyId) {
      setErr('فروشنده اجباری است');
      return;
    }

    if (form.itemId === '') { setErr('کالا اجباری است'); return; }
    if (form.date.trim() === '') { setErr('تاریخ اجباری است'); return; }
    const qty = num(form.quantity);
    if (qty <= 0) { setErr('تعداد باید بیشتر از صفر باشد'); return; }
    if (form.type === 'out' && qty > currentStock) {
      const ok = await showConfirmAsync(
        '⚠️ موجودی کافی نیست',
        `موجودی فعلی: ${toFa(currentStock)} ${selectedItem ? UNIT_LABEL[selectedItem.unit] : ''}\n` +
        `مقدار خروج: ${toFa(qty)}\n\n` +
        `با ثبت این گردش، موجودی منفی می‌شود. ادامه می‌دهید؟`,
        { danger: true }
      );
      if (!ok) return;
    }

    const data = {
      itemId: form.itemId,
      type: form.type,
      quantity: qty,
      unitPrice: num(form.unitPrice),
      reason: form.reason,
      date: form.date.trim(),
      partyId: form.partyId,
      notes: form.notes.trim()
    };

    addMovement(data);
    setOpen(false);
  };

    // فیلتر مخاطبین بر اساس دلیل
  const isPurchase = form.reason === 'purchase';
  const isSale = form.reason === 'sale';
  const isAdjustment = form.reason === 'adjustment';
  const filteredContacts = isPurchase
    ? contacts.filter(c => c.roles.includes('supplier'))
    : isSale
      ? contacts.filter(c => c.roles.includes('customer'))
      : contacts;
  const partyRequired = isPurchase || isSale;
  const partyLabel = isPurchase
    ? 'فروشنده'
    : isSale
      ? 'مشتری'
      : 'طرف معامله';

  return (
    <PageContainer>
      {undoData && (
        <UndoBar
          label={(() => {
            const raw = (undoData as any).item;
            const arr: any[] = Array.isArray(raw) ? raw : [raw];
            if (arr.length === 1) {
              const it = arr[0];
              const name = it?.itemId ? (items.find(x => x.id === it.itemId)?.name || 'گردش') : 'گردش';
              return `«${name}» حذف شد`;
            }
            return `${toFa(arr.length)} گردش حذف شد`;
          })()}
          onUndo={undoDelete}
          onDismiss={() => setUndoData(null)}
        />
      )}
        <HelpBanner
          id="moves-intro"
          icon="⚠️"
          title="این صفحه فقط برای اصلاح دستی است"
          description="موارد استفاده — ضایعات (دان خراب شد)، شمارش دستی، هدیه، مرجوعی. برای خرید از فروشنده یا فروش به مشتری، از بخش «معاملات» استفاده کنید."
          tone="warn"
        actionLabel="برو به معاملات ←"
        onAction={() => navigate('/tra/purchases')}
        />
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
      {!ms.selectionMode && list.length > 1 && (
        <div style={{ fontSize: '10px', color: 'var(--dim)', textAlign: 'center', paddingBottom: 2 }}>
          برای انتخاب چندتایی، روی یک کارت نگه دارید
        </div>
      )}

      {ms.selectionMode && list.length > 1 && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
          <button type="button"
            onClick={ms.selectedIds.size === list.length ? ms.clearSelection : ms.selectAll}
            style={{ padding: '4px 10px', background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', color: 'var(--muted)', fontFamily: 'inherit', fontSize: '10px', fontWeight: 600, cursor: 'pointer' }}>
            {ms.selectedIds.size === list.length ? 'لغو انتخاب همه' : 'انتخاب همه'}
          </button>
        </div>
      )}

      {list.length === 0 ? (
        <Empty
          icon={<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><path d="M7 16V4M7 4l-4 4M7 4l4 4M17 8v12M17 20l4-4M17 20l-4-4"/></svg>}
          title="گردشی ثبت نشده"
          desc="ورود یا خروج کالا از انبار را ثبت کنید."
          action={<Btn variant="primary" onClick={openNew}>+ ثبت گردش</Btn>}
        />
      ) : (
        <>
          {list.map((m, i) => {
            const item = items.find(x => x.id === m.itemId);
            const party = contacts.find(c => c.id === m.partyId);
            const isOpen = !ms.selectionMode && expandedId === m.id;
            const accent = m.type === 'in' ? 'accent' : 'warn';
            const total = m.quantity * m.unitPrice;

            return (
              <ExpandableCard
                key={m.id}
                id={m.id}
                ms={ms}
                accent={accent}
                index={toFa(i + 1)}
                iconEmoji={m.type === 'in' ? '📥' : '📤'}
                title={item?.name || '—'}
                subtitle={`${toFa(m.date)} • ${MOVEMENT_REASON[m.reason]}`}
                isOpen={isOpen}
                onToggle={() => setExpandedId(isOpen ? null : m.id)}
                badge={<Tag tone={m.type === 'in' ? 'green' : 'amber'}>{m.type === 'in' ? 'ورود' : 'خروج'}</Tag>}
                stats={
                  <>
                    <span>مقدار: <b style={{ color: 'var(--text)' }}>{toFa(m.quantity)} {item ? UNIT_LABEL[item.unit] : ''}</b></span>
                    {m.unitPrice > 0 ? <span>قیمت: <b style={{ color: 'var(--text)' }}>{toFa(m.unitPrice.toLocaleString('fa-IR'))}</b></span> : null}
                    {total > 0 ? <span>جمع: <b style={{ color: 'var(--text)' }}>{toFa(total.toLocaleString('fa-IR'))} ت</b></span> : null}
                  </>
                }
              >
                <SectionTitle><span style={{ fontSize: '1.05em', lineHeight: 1, display: 'inline-block', marginLeft: 4 }}>📋</span> اطلاعات گردش</SectionTitle>
                <Row l="کالا" v={item ? `${CATEGORY_ICON[item.category]} ${item.name}` : '—'} />
                <Row l="نوع" v={m.type === 'in' ? 'ورود' : 'خروج'} />
                <Row l="دلیل" v={MOVEMENT_REASON[m.reason]} />
                <Row l="تاریخ" v={toFa(m.date)} />
                <Row l="مقدار" v={`${toFa(m.quantity)} ${item ? UNIT_LABEL[item.unit] : ''}`} />
                {party ? <Row l="طرف معامله" v={party.name} /> : null}

                {m.unitPrice > 0 ? (
                  <>
                    <SectionTitle><span style={{ fontSize: '1.05em', lineHeight: 1, display: 'inline-block', marginLeft: 4 }}>💰</span> مالی</SectionTitle>
                    <Row l="قیمت واحد" v={`${toFa(m.unitPrice.toLocaleString('fa-IR'))} ت`} />
                    <div style={{ display: 'flex', justifyContent: 'space-between',
                       fontSize: 'var(--fs-sm)', padding: 'var(--pad-normal)',
                       background: 'var(--accent-soft)', color: 'var(--accent)',
                       borderRadius: 'var(--r-sm)', fontWeight: 700 }}>
                      <span>جمع کل:</span>
                      <span>{toFa(total.toLocaleString('fa-IR'))} ت</span>
                    </div>
                  </>
                ) : null}

                {m.notes ? (
                  <>
                    <SectionTitle><span style={{ fontSize: '1.05em', lineHeight: 1, display: 'inline-block', marginLeft: 4 }}>📝</span> یادداشت</SectionTitle>
                    <div style={{ fontSize: 'var(--fs-sm)', lineHeight: 1.7,
                       padding: 'var(--pad-normal)', background: 'var(--input-bg)',
                       borderRadius: 'var(--r-sm)' }}>{m.notes}</div>
                  </>
                ) : null}

                <div style={{ display: 'flex', gap: 6, paddingTop: 4 }}>
                  <Btn size="sm" onClick={() => openEdit(m)} style={{ flex: 1 }}>ویرایش</Btn>
                  <Btn size="sm" onClick={async () => {
                    const idToDel = m.id; const ok = await showConfirmAsync('تأیید حذف', 'این مورد حذف شود؟', { danger: true }); if (!ok) return; const item = movements.find((x) => x.id === idToDel); if (item) { setUndoData({ item }); setTimeout(() => setUndoData((cur: any) => cur && cur.item.id === item.id ? null : cur), 6000); } deleteMovement(idToDel);
                    logAction('delete', 'whs', 'حذف از انبار');
                    const itemName = item ? (items.find(x => x.id === (item as any).itemId)?.name || 'گردش') : 'گردش';
                    toastMsg.deleted(itemName)
                    }} style={{ flex: 1 }}>حذف</Btn>
                </div>
              </ExpandableCard>
            );
          })}
        </>
      )}

      <MultiSelectBar ms={ms} deleteLabel="حذف" />

      {ms.selectionMode && <div style={{ height: 90 }} />}

      <MoveFormModal
        open={open}
        setOpen={setOpen}
        form={form}
        setForm={setForm}
        err={err}
        vErrors={vErrors}
        items={items}
        filteredContacts={filteredContacts}
        onSave={save}
      />
    </PageContainer>
  );
}
