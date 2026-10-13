/**
 * DealsPage — معاملات خاص
 */
import { useState, useMemo , useEffect } from 'react';
import { useFab } from '../../shr/hooks/useFab';
import { useTra, DEAL_LABEL, type Deal, type DealType } from './store';
import { useCtc } from '../ctc/store';
import { Btn, BtnRow, Empty, Field,
  Grid2, Modal, NumField,
  PageContainer, Select, Tag, ErrorBox , Textarea } from '../../shr/components/ui';import SmartSelect from '../../shr/components/SmartSelect';;
import ExpandableCard from '../../shr/components/ExpandableCard';
import { useMultiSelect } from '../../shr/multiSelect/useMultiSelect';
import { useFilterSort, FilterBar, getTraDealsConfig } from '../../shr/filter';
import MultiSelectBar from '../../shr/multiSelect/MultiSelectBar';
import DatePicker from '../../shr/components/DatePicker';
import { toFa, toEn } from '../../shr/utils/fa';
import { showAlert, showConfirmAsync } from '../../cor/store/dialog';
import UndoBar from '../../cor/ui/UndoBar';
import { toastMsg } from '../../cor/store/toast';
import { format as formatJ } from 'date-fns-jalali';
import { logAction } from '../../cor/logger/auditLog';

interface F {
  id?: string;
  type: DealType; date: string; partyId: string;
  description: string; value: string; percent: string;
  dueDate: string;
  status: 'open' | 'settled' | 'cancelled';
  notes: string;
}

const empty = (): F => ({
  type: 'consignment', date: '', partyId: '',
  description: '', value: '', percent: '',
  dueDate: '',
  status: 'open',
  notes: ''
});

const STATUS_LABEL: Record<string, string> = {
  open: 'باز', settled: 'تسویه‌شده', cancelled: 'لغوشده'
};

export default function DealsPage({ active = true }: { active?: boolean } = {}) {
  const { deals, addDeal, updateDeal, deleteDeal } = useTra();
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
          resetAll, hasActiveFilters, total, count } = useFilterSort<Deal>({
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
      const backups: any[] = [];
      for (const id of ids) {
        const it = deals.find(x => x.id === id);
        if (!it) continue;
        backups.push(it);
        try { deleteDeal(id); } catch {}
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

    if (contacts.length === 0) { showAlert('اول یک مخاطب بسازید'); return; }
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
      notes: d.notes || ''
    });
    setErr(''); setOpen(true);
  };

  const num = (s: string) => s ? parseFloat(toEn(s).replace('٫','.')) || 0 : 0;

  const save = () => {
    if (form.partyId === '') { setErr('طرف معامله اجباری است'); return; }
    if (form.date.trim() === '') { setErr('تاریخ اجباری است'); return; }
    if (form.description.trim() === '') { setErr('توضیحات اجباری است'); return; }

    let pct: number | null = null;
    if (form.percent.trim() !== '') {
      const raw = num(form.percent);
      pct = Math.max(0, Math.min(100, raw));
    }

    const data = {
      type: form.type,
      date: form.date.trim(),
      partyId: form.partyId,
      description: form.description.trim(),
      value: num(form.value),
      percent: pct,
      dueDate: form.dueDate.trim(),
      status: form.status,
      notes: form.notes.trim()
    };
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

  return (
    <PageContainer>
      {undoData && (
        <UndoBar
          label="حذف شد"
          onUndo={undoDelete}
          onDismiss={() => setUndoData(null)}
        />
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
          icon={<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><path d="M16 3h5v5M8 21H3v-5M21 3l-7 7M3 21l7-7"/></svg>}
          title="معامله‌ای ثبت نشده"
          desc="امانی، شراکتی، تهاتر، توافقی — همه از این‌جا."
          action={<Btn variant="primary" onClick={openNew}>+ ثبت معامله</Btn>}
        />
      ) : (
        <>
          {list.map((d, i) => {
            const party = contacts.find(c => c.id === d.partyId);
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
                subtitle={`${party?.name || '—'} · ${toFa(d.date)}`}
                isOpen={isOpen}
                onToggle={() => setExpandedId(isOpen ? null : d.id)}
                badge={<Tag tone={d.status === 'settled' ? 'green' : d.status === 'cancelled' ? 'gray' : 'amber'}>{STATUS_LABEL[d.status]}</Tag>}
                stats={
                  <>
                    {d.value > 0 && <span>ارزش: <b style={{ color: 'var(--text)' }}>{toFa(d.value.toLocaleString('fa-IR'))} ت</b></span>}
                    {d.percent !== null && d.percent !== undefined && <span>درصد: <b style={{ color: 'var(--text)' }}>{toFa(d.percent)}٪</b></span>}
                    {d.dueDate ? <span>سرسید: <b style={{ color: 'var(--text)' }}>{toFa(d.dueDate)}</b></span> : null}
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
                    {d.value > 0 ? <Row l="ارزش کل" v={`${toFa(d.value.toLocaleString('fa-IR'))} ت`} /> : null}
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
                          const ok = await showConfirmAsync('تأیید حذف', 'این معامله حذف شود؟', { danger: true });
                          if (!ok) return;
                          deleteDeal(d.id);
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
        <Grid2>
          <Field label="نوع معامله" required>
            <Select value={form.type} onChange={e => setForm({...form, type: e.target.value as DealType})}>
              {(Object.keys(DEAL_LABEL) as DealType[]).map(t => <option key={t} value={t}>{DEAL_LABEL[t]}</option>)}
            </Select>
          </Field>
          <Field label="تاریخ" required>
            <DatePicker value={form.date} onChange={v => setForm({...form, date: v})}  autoToday />
          </Field>
        </Grid2>

        <Field label="طرف معامله" required>
          <SmartSelect
              value={form.partyId}
              onChange={v => setForm({...form, partyId: v})}
              options={contacts.map(c => ({
                value: c.id,
                label: c.name,
                subtitle: c.phone || undefined,
              }))}
              placeholder="— انتخاب کنید —"
              modalTitle="انتخاب طرف معامله"
              autoThreshold={6}
            />
        </Field>

        <Field label="توضیحات" required>
            <Textarea placeholder="مثلاً — ۲۰۰ کیلو تخم امانی به مغازه..." value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
          </Field>

        <Grid2>
          <Field label="ارزش (تومان)">
            <NumField value={form.value} onChange={e => setForm({...form, value: e.target.value})} unit="ت" min={0} />
          </Field>
          <Field label="درصد" hint="۰ تا ۱۰۰">
            <NumField placeholder="مثلاً — ۱۰" value={form.percent} onChange={e => {
              const raw = parseFloat(toEn(e.target.value).replace('٫','.')) || 0;
              const v = Math.max(0, Math.min(100, raw));
              setForm({...form, percent: v === 0 ? '' : String(v)});
            }} unit="٪" min={0} />
          </Field>
        </Grid2>

        <Field label="سرسید">
          <DatePicker value={form.dueDate} onChange={v => setForm({...form, dueDate: v})}  autoToday />
        </Field>

        <Field label="وضعیت">
          <Select value={form.status} onChange={e => setForm({...form, status: e.target.value as 'open' | 'settled' | 'cancelled'})}>
            <option value="open">باز</option>
            <option value="settled">تسویه‌شده</option>
            <option value="cancelled">لغوشده</option>
          </Select>
        </Field>

        <Field label="یادداشت">
            <Textarea placeholder="..." value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} />
          </Field>

        <ErrorBox>{err}</ErrorBox>
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
