import { useState, useEffect } from 'react';
import { useInc, hatchRate, costPerChick, type HatchResult } from './store';
import { useBrd } from '../brd/store';
import { useFlk } from '../flk/store';
import { useNavigate } from 'react-router-dom';
import { Btn, BtnRow, Empty, Field, Grid2, Grid3, Input, Modal, NumField, PageContainer, Select, Tag } from '../../shr/components/ui';
import ExpandableCard from '../../shr/components/ExpandableCard';
import DatePicker from '../../shr/components/DatePicker';
import { toFa, toEn } from '../../shr/utils/fa';
import { showAlert } from '../../cor/store/dialog';

export default function HatchesPage({ initialEntry = '', onGoTo }: { initialEntry?: string; onGoTo?: (t: any) => void } = {}) {
  const { eggEntries, hatches, candlings, addHatch, updateHatch, deleteHatch } = useInc();
  const { birds } = useBrd();
  const nav = useNavigate();
  const { add: addFlock } = useFlk();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ id:'', eggEntryId:'', date:'', hatched:'', unhatched:'', deadInShell:'', pipped:'', other:'', notes:'' });
  const [err, setErr] = useState('');
  const [delId, setDelId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (initialEntry) {
      const exists = eggEntries.find(e => e.id === initialEntry);
      if (exists) { setForm(f => ({ ...f, eggEntryId: initialEntry })); setOpen(true); }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialEntry]);

  const openNew = () => {
    if (eggEntries.length === 0) { showAlert('اول یک ورودی تخم بسازید'); return; }
    setForm({ id:'', eggEntryId: eggEntries[0].id, date:'', hatched:'', unhatched:'', deadInShell:'', pipped:'', other:'', notes:'' });
    setErr(''); setOpen(true);
  };
  const openEdit = (h: HatchResult) => {
    setForm({
      id: h.id, eggEntryId: h.eggEntryId, date: h.date,
      hatched: h.hatched ? toFa(h.hatched) : '',
      unhatched: h.unhatched ? toFa(h.unhatched) : '',
      deadInShell: h.deadInShell ? toFa(h.deadInShell) : '',
      pipped: h.pipped ? toFa(h.pipped) : '',
      other: h.other ? toFa(h.other) : '',
      notes: h.notes
    });
    setErr(''); setOpen(true);
  };
  const int = (s: string) => s ? parseInt(toEn(s)) || null : null;
  const selectedEntry = eggEntries.find(e => e.id === form.eggEntryId);
  const totalEggs = selectedEntry?.count || 0;
  const lastCandling = candlings.filter(c => c.eggEntryId === form.eggEntryId).sort((a,b) => b.stage - a.stage)[0];
  const maxHatched = lastCandling?.alive || totalEggs;
  const save = () => {
    if (!form.date.trim()) { setErr('تاریخ اجباری است'); return; }
    if (maxHatched && (parseInt(toEn(form.hatched))||0) > maxHatched) { setErr(`تعداد جوجه هچ‌شده از تعداد تخم سالم (${toFa(maxHatched)}) بیشتر است`); return; }
    const data = {
      eggEntryId: form.eggEntryId, date: form.date,
      hatched: int(form.hatched), unhatched: int(form.unhatched),
      deadInShell: int(form.deadInShell), pipped: int(form.pipped),
      other: int(form.other), notes: form.notes
    };
    if (form.id) updateHatch(form.id, data); else addHatch(data);
    setOpen(false);
  };
  const target = delId ? hatches.find(h => h.id === delId) : null;

  return (
    <PageContainer>
      {hatches.length === 0 ? (
        <Empty icon={<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><ellipse cx="12" cy="14" rx="7" ry="9"/></svg>}
          title="هچی ثبت نشده" desc="پس از پایان دوره‌ی جوجه‌کشی، نتیجه‌ی نهایی هچ را ثبت کنید."
          action={<Btn variant="primary" onClick={openNew}>+ ثبت هچ</Btn>} />
      ) : (
        <>
          {hatches.map((h, i) => {
            const entry = eggEntries.find(e => e.id === h.eggEntryId);
            const bird = entry ? birds.find(b => b.id === entry.birdId) : null;
            const isOpen = expandedId === h.id;
            const total = entry?.count || 0;
            const hr = hatchRate(h.hatched || 0, total);
            const myCandling = candlings.filter(c => c.eggEntryId === h.eggEntryId).sort((a,b) => b.stage - a.stage)[0];
            const aliveAfterCandling = myCandling?.alive || total;
            const realRate = aliveAfterCandling ? ((h.hatched || 0) / aliveAfterCandling * 100) : 0;

            return (
              <ExpandableCard key={h.id} accent="accent" index={toFa(i + 1)} iconEmoji="🐣"
                title={`${toFa(h.hatched || 0)} جوجه از ${toFa(total)} تخم`}
                subtitle={`${bird?.name || '—'} · ${toFa(h.date)}`}
                isOpen={isOpen} onToggle={() => setExpandedId(isOpen ? null : h.id)}
                badge={<Tag tone={hr >= 70 ? 'green' : hr >= 50 ? 'amber' : 'red'}>{toFa(hr.toFixed(1))}٪</Tag>}
                summary={<>
                  <span>هچ‌شده: <b style={{ color: 'var(--accent)' }}>{toFa(h.hatched || 0)}</b></span>
                  <span>هچ‌نشده: <b style={{ color: 'var(--muted)' }}>{toFa(h.unhatched || 0)}</b></span>
                  <span>نرخ: <b style={{ color: 'var(--text)' }}>{toFa(hr.toFixed(1))}٪</b></span>
                </>}
              >
                <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', fontWeight: 700, letterSpacing: '.3px' }}>📊 نتیجه هچ</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <Row l="جوجه هچ‌شده" v={toFa(h.hatched || 0)} accent />
                  <Row l="هچ‌نشده" v={toFa(h.unhatched || 0)} />
                  {h.deadInShell ? <Row l="مرده در پوسته" v={toFa(h.deadInShell)} /> : null}
                  {h.pipped ? <Row l="نوک‌زده" v={toFa(h.pipped)} /> : null}
                  {h.other ? <Row l="سایر" v={toFa(h.other)} /> : null}
                </div>

                <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', fontWeight: 700, letterSpacing: '.3px' }}>📈 نرخ‌ها</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <Row l="نرخ هچ کل" v={`${toFa(hr.toFixed(1))}٪`} accent />
                  {aliveAfterCandling !== total && <Row l="نرخ از نطفه‌دار" v={`${toFa(realRate.toFixed(1))}٪`} accent />}
                </div>

                {entry?.totalPrice && h.hatched && (
                  <>
                    <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', fontWeight: 700, letterSpacing: '.3px' }}>💰 هزینه</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <Row l="هزینه کل تخم‌ها" v={`${toFa(entry.totalPrice.toLocaleString('fa-IR'))} ت`} />
                      <Row l="💰 هزینه هر جوجه" v={`${toFa(Math.round(costPerChick(entry.totalPrice, h.hatched)).toLocaleString('fa-IR'))} ت`} accent />
                    </div>
                  </>
                )}

                {h.notes && (
                  <>
                    <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', fontWeight: 700, letterSpacing: '.3px' }}>📝 یادداشت</div>
                    <div style={{ fontSize: 'var(--fs-sm)', lineHeight: 1.7,
                       padding: '8px 10px', background: 'var(--input-bg)',
                       borderRadius: 'var(--r-sm)' }}>{h.notes}</div>
                  </>
                )}

                <div style={{ display: 'flex', gap: 6, paddingTop: 4 }}>
                  <Btn size="sm" onClick={() => openEdit(h)} style={{ flex: 1 }}>ویرایش</Btn>
                  <Btn size="sm" onClick={() => setDelId(h.id)} style={{ flex: 1 }}>حذف</Btn>
                </div>
              </ExpandableCard>
            );
          })}
          <Btn variant="primary" full onClick={openNew}>+ ثبت هچ</Btn>
        </>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={form.id ? 'ویرایش هچ' : 'ثبت نتیجه هچ'}
        footer={<BtnRow><Btn variant="primary" onClick={save}>ذخیره</Btn><Btn onClick={() => setOpen(false)}>لغو</Btn></BtnRow>}>
        <Field label="ورودی تخم" required>
          <Select value={form.eggEntryId} onChange={e => setForm({...form, eggEntryId: e.target.value})}>
            {eggEntries.map(e => {
              const bird = birds.find(b => b.id === e.birdId);
              return <option key={e.id} value={e.id}>{bird?.name || '—'} · {toFa(e.entryDate)} · {toFa(e.count || 0)} تخم</option>;
            })}
          </Select>
        </Field>
        <Field label="تاریخ هچ" required>
          <DatePicker value={form.date} onChange={v => setForm({...form, date: v})} placeholder="انتخاب تاریخ" />
        </Field>
        <Grid2>
          <Field label="جوجه هچ‌شده" required hint={maxHatched ? `حداکثر: ${toFa(maxHatched)}` : undefined}><NumField placeholder="۰" value={form.hatched} onChange={e => setForm({...form, hatched: e.target.value})} max={maxHatched || undefined} min={0} unit="عدد" /></Field>
          <Field label="هچ‌نشده"><NumField placeholder="۰" value={form.unhatched} onChange={e => setForm({...form, unhatched: e.target.value})} min={0} unit="عدد" /></Field>
        </Grid2>
        <Grid2>
          <Field label="مرده در پوسته"><NumField placeholder="۰" value={form.deadInShell} onChange={e => setForm({...form, deadInShell: e.target.value})} min={0} unit="عدد" /></Field>
          <Field label="نوک‌زده"><NumField placeholder="۰" value={form.pipped} onChange={e => setForm({...form, pipped: e.target.value})} min={0} unit="عدد" /></Field>
          <Field label="سایر"><NumField placeholder="۰" value={form.other} onChange={e => setForm({...form, other: e.target.value})} min={0} unit="عدد" /></Field>
        </Grid2>
        <Field label="یادداشت"><Input placeholder="..." value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} /></Field>
        {err && <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--danger)' }}>✕ {err}</div>}
      </Modal>

      <Modal open={!!delId} onClose={() => setDelId(null)} title="حذف هچ"
        footer={<BtnRow><Btn variant="danger" onClick={() => { if (delId) deleteHatch(delId); setDelId(null); }}>حذف کن</Btn><Btn onClick={() => setDelId(null)}>لغو</Btn></BtnRow>}>
        <div style={{ textAlign: 'center', fontSize: 'var(--fs-md)' }}>حذف این نتیجه هچ؟</div>
      </Modal>
    </PageContainer>
  );
}

function Row({ l, v, accent }: { l: string; v: string; accent?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--fs-sm)',
       padding: '6px 10px', background: accent ? 'var(--accent-soft)' : 'var(--input-bg)',
       borderRadius: 'var(--r-sm)', color: accent ? 'var(--accent)' : undefined,
       fontWeight: accent ? 700 : undefined }}>
      <span style={{ color: accent ? 'var(--accent)' : 'var(--muted)' }}>{l}:</span>
      <span style={{ fontWeight: 600, color: accent ? 'var(--accent)' : 'var(--text)' }}>{v}</span>
    </div>
  );
}
