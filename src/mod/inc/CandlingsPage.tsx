import { useState } from 'react';
import { useInc, type Candling } from './store';
import { useBrd } from '../brd/store';
import { Btn, BtnRow, Empty, Field, Grid2, Grid3, Input, Modal, NumField, PageContainer, Select, Tag } from '../../shr/components/ui';
import ExpandableCard from '../../shr/components/ExpandableCard';
import DatePicker from '../../shr/components/DatePicker';
import { toFa, toEn } from '../../shr/utils/fa';
import { showAlert } from '../../cor/store/dialog';

const INFERTILE_REASONS: [string, string][] = [
  ['', '—'], ['season', 'فصل'], ['rooster_age', 'سن خروس'], ['nutrition', 'تغذیه'], ['genetics', 'ژنتیک'], ['storage', 'نگهداری تخم']
];
const DEAD_REASONS: [string, string][] = [
  ['', '—'], ['temp_fluctuation', 'نوسان دما'], ['humidity', 'رطوبت نامناسب'], ['ventilation', 'تهویه ضعیف'], ['genetics', 'ژنتیک'], ['infection', 'عفونت']
];

export default function CandlingsPage() {
  const { eggEntries, candlings, addCandling, updateCandling, deleteCandling } = useInc();
  const { birds } = useBrd();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ id:'', eggEntryId:'', stage:'1', date:'', alive:'', infertile:'', dead:'', broken:'', infertileReason:'', deadReason:'', notes:'' });
  const [err, setErr] = useState('');
  const [delId, setDelId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const openNew = () => {
    if (eggEntries.length === 0) { showAlert('اول یک ورودی تخم ثبت کنید'); return; }
    setForm({ id:'', eggEntryId: eggEntries[0].id, stage:'1', date:'', alive:'', infertile:'', dead:'', broken:'', infertileReason:'', deadReason:'', notes:'' });
    setErr(''); setOpen(true);
  };
  const openEdit = (c: Candling) => {
    setForm({
      id: c.id, eggEntryId: c.eggEntryId, stage: String(c.stage), date: c.date,
      alive: c.alive ? toFa(c.alive) : '', infertile: c.infertile ? toFa(c.infertile) : '',
      dead: c.dead ? toFa(c.dead) : '', broken: c.broken ? toFa(c.broken) : '',
      infertileReason: c.infertileReason, deadReason: c.deadReason, notes: c.notes
    });
    setErr(''); setOpen(true);
  };
  const int = (s: string) => s ? parseInt(toEn(s)) || null : null;
  const selectedEntry = eggEntries.find(e => e.id === form.eggEntryId);
  const totalCount = selectedEntry?.count || 0;
  const sum = (parseInt(toEn(form.alive||''))||0) + (parseInt(toEn(form.infertile||''))||0) + (parseInt(toEn(form.dead||''))||0) + (parseInt(toEn(form.broken||''))||0);
  const save = () => {
    if (!form.date.trim()) { setErr('تاریخ اجباری است'); return; }
    if (totalCount && sum > totalCount) { setErr(`جمع اعداد (${toFa(sum)}) از تعداد کل تخم‌ها (${toFa(totalCount)}) بیشتر است`); return; }
    const data = {
      eggEntryId: form.eggEntryId,
      stage: parseInt(form.stage) as 1|2|3,
      date: form.date,
      alive: int(form.alive), infertile: int(form.infertile),
      dead: int(form.dead), broken: int(form.broken),
      infertileReason: form.infertileReason, deadReason: form.deadReason,
      notes: form.notes
    };
    if (form.id) updateCandling(form.id, data); else addCandling(data);
    setOpen(false);
  };
  const target = delId ? candlings.find(c => c.id === delId) : null;

  return (
    <PageContainer>
      {candlings.length === 0 ? (
        <Empty icon={<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>}
          title="کندلینگی ثبت نشده" desc="کندلینگ در روزهای ۷، ۱۲ و ۱۸ انجام می‌شود."
          action={<Btn variant="primary" onClick={openNew}>+ ثبت کندلینگ</Btn>} />
      ) : (
        <>
          {candlings.map((c, i) => {
            const entry = eggEntries.find(e => e.id === c.eggEntryId);
            const bird = entry ? birds.find(b => b.id === entry.birdId) : null;
            const isOpen = expandedId === c.id;
            const total = (c.alive || 0) + (c.infertile || 0) + (c.dead || 0) + (c.broken || 0);
            const fertilePercent = entry?.count ? ((c.alive || 0) / entry.count * 100) : 0;
            return (
              <ExpandableCard key={c.id} accent="accent" index={toFa(i + 1)} iconEmoji="🔍"
                title={`مرحله ${toFa(c.stage)} — ${bird?.name || '—'}`}
                subtitle={`${toFa(c.date)} · ${entry ? toFa(entry.count || 0) + ' تخم' : ''}`}
                isOpen={isOpen} onToggle={() => setExpandedId(isOpen ? null : c.id)}
                badge={<Tag tone={c.stage === 1 ? 'blue' : c.stage === 2 ? 'amber' : 'purple'}>مرحله {toFa(c.stage)}</Tag>}
                summary={<>
                  <span>سالم: <b style={{ color: 'var(--accent)' }}>{toFa(c.alive || 0)}</b></span>
                  <span>بی‌نطفه: <b style={{ color: 'var(--warn)' }}>{toFa(c.infertile || 0)}</b></span>
                  <span>مرده: <b style={{ color: 'var(--danger)' }}>{toFa(c.dead || 0)}</b></span>
                </>}
              >
                <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', fontWeight: 700, letterSpacing: '.3px' }}>📊 نتیجه کندلینگ</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <Row l="سالم" v={toFa(c.alive || 0)} accent />
                  <Row l="بی‌نطفه" v={toFa(c.infertile || 0)} />
                  <Row l="مرده" v={toFa(c.dead || 0)} />
                  <Row l="شکسته" v={toFa(c.broken || 0)} />
                  <Row l="جمع" v={toFa(total)} />
                  {fertilePercent > 0 && <Row l="نرخ نطفه‌داری" v={`${toFa(fertilePercent.toFixed(1))}٪`} accent />}
                </div>

                {(c.infertileReason || c.deadReason) && (
                  <>
                    <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', fontWeight: 700, letterSpacing: '.3px' }}>🔎 دلایل</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {c.infertileReason && <Row l="بی‌نطفه" v={INFERTILE_REASONS.find(x => x[0] === c.infertileReason)?.[1] || '—'} />}
                      {c.deadReason && <Row l="مرده" v={DEAD_REASONS.find(x => x[0] === c.deadReason)?.[1] || '—'} />}
                    </div>
                  </>
                )}

                {c.notes && (
                  <>
                    <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', fontWeight: 700, letterSpacing: '.3px' }}>📝 یادداشت</div>
                    <div style={{ fontSize: 'var(--fs-sm)', lineHeight: 1.7, padding: '8px 10px', background: 'var(--input-bg)', borderRadius: 'var(--r-sm)' }}>{c.notes}</div>
                  </>
                )}

                <div style={{ display: 'flex', gap: 6, paddingTop: 4 }}>
                  <Btn size="sm" onClick={() => openEdit(c)} style={{ flex: 1 }}>ویرایش</Btn>
                  <Btn size="sm" onClick={() => setDelId(c.id)} style={{ flex: 1 }}>حذف</Btn>
                </div>
              </ExpandableCard>
            );
          })}
          <Btn variant="primary" full onClick={openNew}>+ ثبت کندلینگ</Btn>
        </>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={form.id ? 'ویرایش کندلینگ' : 'ثبت کندلینگ'}
        footer={<BtnRow><Btn variant="primary" onClick={save}>ذخیره</Btn><Btn onClick={() => setOpen(false)}>لغو</Btn></BtnRow>}>
        <Field label="ورودی تخم" required>
          <Select value={form.eggEntryId} onChange={e => setForm({...form, eggEntryId: e.target.value})}>
            {eggEntries.map(e => {
              const bird = birds.find(b => b.id === e.birdId);
              return <option key={e.id} value={e.id}>{bird?.name || '—'} · {toFa(e.entryDate)} · {toFa(e.count || 0)} تخم</option>;
            })}
          </Select>
        </Field>
        <Grid2>
          <Field label="مرحله" required>
            <Select value={form.stage} onChange={e => setForm({...form, stage: e.target.value})}>
              <option value="1">مرحله ۱ — روز ۷</option>
              <option value="2">مرحله ۲ — روز ۱۲</option>
              <option value="3">مرحله ۳ — روز ۱۸</option>
            </Select>
          </Field>
          <Field label="تاریخ" required>
            <DatePicker value={form.date} onChange={v => setForm({...form, date: v})} placeholder="انتخاب" />
          </Field>
        </Grid2>
        {totalCount > 0 && (
          <div style={{
            padding: '8px 12px', background: sum > totalCount ? 'var(--danger-soft)' : 'var(--accent-soft)',
            border: `1px solid ${sum > totalCount ? 'var(--danger)' : 'var(--accent-border)'}`,
            borderRadius: 'var(--r-md)',
            fontSize: 'var(--fs-sm)',
            color: sum > totalCount ? 'var(--danger)' : 'var(--accent)',
            fontWeight: 700, textAlign: 'center'
          }}>
            مجموع: {toFa(sum)} از {toFa(totalCount)} {sum > totalCount ? '— بیشتر از حد مجاز!' : ''}
          </div>
        )}
        <Grid2>
          <Field label="سالم"><NumField placeholder="۰" value={form.alive} onChange={e => setForm({...form, alive: e.target.value})} max={totalCount} min={0} /></Field>
          <Field label="بی‌نطفه"><NumField placeholder="۰" value={form.infertile} onChange={e => setForm({...form, infertile: e.target.value})} max={totalCount} min={0} /></Field>
        </Grid2>
        <Grid2>
          <Field label="مرده"><NumField placeholder="۰" value={form.dead} onChange={e => setForm({...form, dead: e.target.value})} max={totalCount} min={0} /></Field>
          <Field label="شکسته"><NumField placeholder="۰" value={form.broken} onChange={e => setForm({...form, broken: e.target.value})} max={totalCount} min={0} /></Field>
        </Grid2>
        <Grid2>
          <Field label="دلیل بی‌نطفه">
            <Select value={form.infertileReason} onChange={e => setForm({...form, infertileReason: e.target.value})}>
              {INFERTILE_REASONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </Select>
          </Field>
          <Field label="دلیل مرگ">
            <Select value={form.deadReason} onChange={e => setForm({...form, deadReason: e.target.value})}>
              {DEAD_REASONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </Select>
          </Field>
        </Grid2>
        <Field label="یادداشت"><Input placeholder="..." value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} /></Field>
        {err && <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--danger)' }}>✕ {err}</div>}
      </Modal>

      <Modal open={!!delId} onClose={() => setDelId(null)} title="حذف کندلینگ"
        footer={<BtnRow><Btn variant="danger" onClick={() => { if (delId) deleteCandling(delId); setDelId(null); }}>حذف کن</Btn><Btn onClick={() => setDelId(null)}>لغو</Btn></BtnRow>}>
        <div style={{ textAlign: 'center', fontSize: 'var(--fs-md)' }}>حذف مرحله {toFa(target?.stage || 0)}؟</div>
      </Modal>
    </PageContainer>
  );
}

function Row({ l, v, accent }: { l: string; v: string; accent?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--fs-sm)', padding: '6px 10px', background: accent ? 'var(--accent-soft)' : 'var(--input-bg)', borderRadius: 'var(--r-sm)', color: accent ? 'var(--accent)' : undefined, fontWeight: accent ? 700 : undefined }}>
      <span style={{ color: accent ? 'var(--accent)' : 'var(--muted)' }}>{l}:</span>
      <span style={{ fontWeight: 600, color: accent ? 'var(--accent)' : 'var(--text)' }}>{v}</span>
    </div>
  );
}
