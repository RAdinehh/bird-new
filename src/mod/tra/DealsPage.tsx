/**
 * DealsPage — معاملات خاص
 */
import { useState, useMemo } from 'react';
import { useTra, DEAL_LABEL, type Deal, type DealType } from './store';
import { useCtc } from '../ctc/store';
import { Btn, BtnRow, Empty, Field,
  Grid2, Input, Modal, NumField,
  PageContainer, Select, Tag, ErrorBox } from '../../shr/components/ui';import SmartSelect from '../../shr/components/SmartSelect';;
import ExpandableCard from '../../shr/components/ExpandableCard';
import DatePicker from '../../shr/components/DatePicker';
import { toFa, toEn } from '../../shr/utils/fa';
import { showAlert } from '../../cor/store/dialog';

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

export default function DealsPage() {
  const { deals, addDeal, updateDeal, deleteDeal } = useTra();
  const { contacts } = useCtc();

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<F>(empty());
  const [err, setErr] = useState('');
  const [delId, setDelId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<DealType | ''>('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const list = useMemo(() => {
    let arr = deals;
    if (filterType) arr = arr.filter(d => d.type === filterType);
    return arr.sort((a, b) => b.date.localeCompare(a.date));
  }, [deals, filterType]);

  const openNew = () => {
    if (contacts.length === 0) { showAlert('اول یک مخاطب بسازید'); return; }
    setForm({ ...empty(), partyId: contacts[0].id });
    setErr(''); setOpen(true);
  };

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

  const target = delId ? deals.find(d => d.id === delId) : null;

  const accentFor = (status: string): 'accent' | 'warn' | 'dim' => {
    if (status === 'settled') return 'accent';
    if (status === 'cancelled') return 'dim';
    return 'warn';
  };

  return (
    <PageContainer>
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
        <button onClick={() => setFilterType('')} style={chip(filterType === '')}>
          همه ({toFa(deals.length)})
        </button>
        {(Object.keys(DEAL_LABEL) as DealType[]).map(t => {
          const c = deals.filter(d => d.type === t).length;
          if (c === 0) return null;
          return (
            <button key={t} onClick={() => setFilterType(t)} style={chip(filterType === t)}>
              {DEAL_LABEL[t]} ({toFa(c)})
            </button>
          );
        })}
      </div>

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
            const isOpen = expandedId === d.id;
            return (
              <ExpandableCard
                key={d.id}
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
                <SectionTitle>📋 اطلاعات معامله</SectionTitle>
                <Row l="نوع" v={DEAL_LABEL[d.type]} />
                <Row l="طرف معامله" v={party?.name || '—'} />
                <Row l="تاریخ" v={toFa(d.date)} />
                {d.dueDate ? <Row l="سرسید" v={toFa(d.dueDate)} /> : null}
                <Row l="وضعیت" v={STATUS_LABEL[d.status]} />

                <SectionTitle>📝 توضیحات</SectionTitle>
                <div style={{ fontSize: 'var(--fs-sm)', lineHeight: 1.7, padding: 'var(--pad-normal)', background: 'var(--input-bg)', borderRadius: 'var(--r-sm)' }}>{d.description}</div>

                {(d.value > 0 || (d.percent !== null && d.percent !== undefined)) ? (
                  <>
                    <SectionTitle>💰 مالی</SectionTitle>
                    {d.value > 0 ? <Row l="ارزش کل" v={`${toFa(d.value.toLocaleString('fa-IR'))} ت`} /> : null}
                    {d.percent !== null && d.percent !== undefined ? <Row l="درصد" v={`${toFa(d.percent)}٪`} /> : null}
                  </>
                ) : null}

                {d.notes ? (
                  <>
                    <SectionTitle>📝 یادداشت</SectionTitle>
                    <div style={{ fontSize: 'var(--fs-sm)', lineHeight: 1.7, padding: 'var(--pad-normal)', background: 'var(--input-bg)', borderRadius: 'var(--r-sm)' }}>{d.notes}</div>
                  </>
                ) : null}

                <div style={{ display: 'flex', gap: 6, paddingTop: 4 }}>
                  {d.status !== 'settled' ? (
                    <Btn size="sm" onClick={() => updateDeal(d.id, { status: 'settled' })} style={{ flex: 1 }}>تسویه شد</Btn>
                  ) : null}
                  <Btn size="sm" onClick={() => openEdit(d)} style={{ flex: 1 }}>ویرایش</Btn>
                  <Btn size="sm" onClick={() => setDelId(d.id)} style={{ flex: 1 }}>حذف</Btn>
                </div>
              </ExpandableCard>
            );
          })}
          <Btn variant="primary" full onClick={openNew}>+ ثبت معامله</Btn>
        </>
      )}

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
            <DatePicker value={form.date} onChange={v => setForm({...form, date: v})} />
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
          <Input placeholder="مثلاً — ۲۰۰ کیلو تخم امانی به مغازه..." value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
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
          <DatePicker value={form.dueDate} onChange={v => setForm({...form, dueDate: v})} />
        </Field>

        <Field label="وضعیت">
          <Select value={form.status} onChange={e => setForm({...form, status: e.target.value as 'open' | 'settled' | 'cancelled'})}>
            <option value="open">باز</option>
            <option value="settled">تسویه‌شده</option>
            <option value="cancelled">لغوشده</option>
          </Select>
        </Field>

        <Field label="یادداشت">
          <Input placeholder="..." value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} />
        </Field>

        <ErrorBox>{err}</ErrorBox>
      </Modal>

      <Modal
        open={delId !== null}
        onClose={() => setDelId(null)}
        title="حذف معامله"
        footer={<BtnRow><Btn variant="danger" onClick={() => { if (delId) deleteDeal(delId); setDelId(null); }}>حذف کن</Btn><Btn onClick={() => setDelId(null)}>لغو</Btn></BtnRow>}
      >
        <div style={{ textAlign: 'center', fontSize: 'var(--fs-md)' }}>حذف <b>{target?.description}</b>؟</div>
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
      paddingTop: 10, marginTop: 4,
      borderTop: '1px dashed var(--border)',
      fontSize: 'var(--fs-sm)', fontWeight: 700, color: 'var(--muted)'
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
