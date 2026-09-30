import { useState, useEffect, useMemo } from 'react';
import { useInc, type Candling } from './store';
import { useBrd } from '../brd/store';
import { Btn, BtnRow, Empty, Field, Grid2, Input, Modal, NumField, PageContainer, SectionTitle, Select, Tag } from '../../shr/components/ui';
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

const STAGE_LABEL: Record<number, string> = { 1: 'مرحله ۱ (روز ۷)', 2: 'مرحله ۲ (روز ۱۲)', 3: 'مرحله ۳ (روز ۱۸)' };

export default function CandlingsPage({ initialEntry = '', onGoTo }: { initialEntry?: string; onGoTo?: (t: any) => void } = {}) {
  const { devices, eggEntries, candlings, addCandling, updateCandling, deleteCandling } = useInc();
  const { birds } = useBrd();

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ id:'', eggEntryId:'', stage:'1', date:'', alive:'', infertile:'', dead:'', broken:'', infertileReason:'', deadReason:'', notes:'' });
  const [err, setErr] = useState('');
  const [delId, setDelId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const [modalDeviceFilter, setModalDeviceFilter] = useState('');
  const [modalBirdFilter, setModalBirdFilter] = useState('');

  useEffect(() => {
    if (initialEntry) {
      const exists = eggEntries.find(e => e.id === initialEntry);
      if (exists) {
        const stages = candlings.filter(c => c.eggEntryId === initialEntry).map(c => c.stage);
        const nextStage = stages.includes(1) ? (stages.includes(2) ? 3 : 2) : 1;
        setForm(f => ({ ...f, eggEntryId: initialEntry, stage: String(nextStage) }));
        setOpen(true);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialEntry]);

  const nextStageFor = (eggEntryId: string): 1|2|3 => {
    const stages = candlings.filter(c => c.eggEntryId === eggEntryId).map(c => c.stage);
    if (stages.includes(1) && stages.includes(2)) return 3;
    if (stages.includes(1)) return 2;
    return 1;
  };

  const openNew = (preEntryId?: string) => {
    if (eggEntries.length === 0) { showAlert('اول یک ورودی تخم ثبت کنید'); return; }
    const targetId = preEntryId || eggEntries[0].id;
    const nextStage = nextStageFor(targetId);
    setForm({ id:'', eggEntryId: targetId, stage: String(nextStage), date:'', alive:'', infertile:'', dead:'', broken:'', infertileReason:'', deadReason:'', notes:'' });
    setErr('');
    setOpen(true);
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
  const remaining = totalCount - sum;

  const save = () => {
    if (!form.date.trim()) { setErr('تاریخ اجباری است'); return; }
    if (sum === 0) { setErr('حداقل یک مقدار وارد کنید'); return; }
    if (totalCount && sum > totalCount) { setErr('جمع (' + toFa(sum) + ') از کل تخم‌ها (' + toFa(totalCount) + ') بیشتر است'); return; }
    const data = {
      eggEntryId: form.eggEntryId,
      stage: parseInt(form.stage) as 1|2|3,
      date: form.date,
      alive: int(form.alive), infertile: int(form.infertile),
      dead: int(form.dead), broken: int(form.broken),
      infertileReason: form.infertileReason, deadReason: form.deadReason,
      notes: form.notes
    };
    if (form.id) updateCandling(form.id, data);
    else addCandling(data);
    setOpen(false);
    const isStage3 = parseInt(form.stage) === 3;
    if (!form.id && isStage3 && onGoTo && confirm('کندلینگ مرحله ۳ ثبت شد.\n\nبرو به هچ؟')) {
      setTimeout(() => onGoTo('hatches'), 100);
    } else if (!form.id && onGoTo && nextStageFor(form.eggEntryId) <= 3 && candlings.filter(c => c.eggEntryId === form.eggEntryId).length < 2) {
      const next = parseInt(form.stage) === 1 ? 'مرحله ۲' : 'مرحله ۳';
      if (confirm('کندلینگ ثبت شد.\n\nیادآور: ' + next + ' رو در روز مناسب ثبت کن')) {
        // هیچ کاری
      }
    }
  };

  // ═══ ورودی‌های فیلترشده برای Modal ═══
  const filteredEntries = useMemo(() => {
    return eggEntries.filter(e => {
      if (modalDeviceFilter && e.deviceId !== modalDeviceFilter) return false;
      if (modalBirdFilter && e.birdId !== modalBirdFilter) return false;
      return true;
    }).sort((a, b) => String(b.entryDate).localeCompare(String(a.entryDate)));
  }, [eggEntries, modalDeviceFilter, modalBirdFilter]);

  const availableBirds = useMemo(() => {
    const ids = new Set<string>();
    eggEntries.forEach(e => {
      if (modalDeviceFilter && e.deviceId !== modalDeviceFilter) return;
      ids.add(e.birdId);
    });
    return Array.from(ids).map(id => birds.find(b => b.id === id)).filter(Boolean);
  }, [eggEntries, modalDeviceFilter, birds]);

  const target = delId ? candlings.find(c => c.id === delId) : null;

  // ═══ گروه‌بندی بر اساس ورودی تخم ═══
  const grouped = useMemo(() => {
    const byEntry: Record<string, Candling[]> = {};
    candlings.forEach(c => {
      if (!byEntry[c.eggEntryId]) byEntry[c.eggEntryId] = [];
      byEntry[c.eggEntryId].push(c);
    });
    // فیلتر جستجو
    return Object.entries(byEntry).filter(([entryId, list]) => {
      if (!q.trim()) return true;
      const t = q.trim().toLowerCase();
      const entry = eggEntries.find(e => e.id === entryId);
      const bird = entry ? birds.find(b => b.id === entry.birdId) : null;
      const haystack = [bird?.name, entry?.entryDate, String(list.length)].filter(Boolean).join(' ').toLowerCase();
      return haystack.includes(t);
    }).sort(([a], [b]) => {
      const ea = eggEntries.find(e => e.id === a);
      const eb = eggEntries.find(e => e.id === b);
      return String(eb?.entryDate || '').localeCompare(String(ea?.entryDate || ''));
    });
  }, [candlings, eggEntries, birds, q]);

  return (
    <PageContainer>
      {candlings.length > 0 && (
        <Input value={q} onChange={e => setQ(e.target.value)} placeholder="🔍 جستجو (نام پرنده، تاریخ...)" />
      )}

      {candlings.length === 0 ? (
        <Empty icon={<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>}
          title="کندلینگی ثبت نشده"
          desc="کندلینگ در روزهای ۷، ۱۲ و ۱۸ انجام می‌شود."
          action={<Btn onClick={() => openNew()}>+ ثبت کندلینگ</Btn>} />
      ) : (
        <>
          {grouped.map(([entryId, list]) => {
            const entry = eggEntries.find(e => e.id === entryId);
            const bird = entry ? birds.find(b => b.id === entry.birdId) : null;
            const entryTotal = entry?.count || 0;
            const latestCandling = list.slice().sort((a, b) => b.stage - a.stage)[0];
            const fertilePercent = entryTotal > 0 && latestCandling?.alive ? (latestCandling.alive / entryTotal) * 100 : 0;

            return (
              <div key={entryId} style={{
                background: 'var(--card)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--r-lg)',
                padding: '12px 14px',
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 8, borderBottom: '1px dashed var(--border)' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0, flex: 1 }}>
                    <span style={{ fontSize: 'var(--fs-sm)', fontWeight: 700 }}>
                      🔍 {bird?.name || '—'} · {toFa(entryTotal)} تخم
                    </span>
                    <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)' }}>
                      ورود: {toFa(entry?.entryDate || '—')} · {toFa(list.length)} مرحله
                    </span>
                  </div>
                  {fertilePercent > 0 && (
                    <span style={{ fontSize: 'var(--fs-xs)', fontWeight: 700, color: 'var(--text)' }}>
                      {toFa(fertilePercent.toFixed(1))}٪ نطفه‌داری
                    </span>
                  )}
                </div>

                {/* مراحل */}
                {list.sort((a, b) => a.stage - b.stage).map(c => {
                  const isOpen = expandedId === c.id;
                  const total = (c.alive || 0) + (c.infertile || 0) + (c.dead || 0) + (c.broken || 0);
                  const ratio = entryTotal > 0 ? Math.round((c.alive || 0) / entryTotal * 100) : 0;
                  return (
                    <ExpandableCard key={c.id} accent="dim" index={toFa(c.stage)} iconEmoji="🥚"
                      title={'مرحله ' + toFa(c.stage)}
                      subtitle={toFa(c.date)}
                      isOpen={isOpen} onToggle={() => setExpandedId(isOpen ? null : c.id)}
                      badge={<Tag tone="gray">{toFa(ratio)}٪ سالم</Tag>}
                      summary={<>
                        <span>سالم: <b>{toFa(c.alive || 0)}</b></span>
                        <span>بی‌نطفه: <b>{toFa(c.infertile || 0)}</b></span>
                        <span>مرده: <b>{toFa(c.dead || 0)}</b></span>
                      </>}
                    >
                      <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', fontWeight: 700 }}>📊 نتیجه</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <Row l="سالم" v={toFa(c.alive || 0)} />
                        <Row l="بی‌نطفه" v={toFa(c.infertile || 0)} />
                        <Row l="مرده" v={toFa(c.dead || 0)} />
                        <Row l="شکسته" v={toFa(c.broken || 0)} />
                        <Row l="جمع" v={toFa(total)} bold />
                        <Row l="نرخ نطفه‌داری" v={toFa(ratio) + '٪'} />
                      </div>

                      {(c.infertileReason || c.deadReason) && (
                        <>
                          <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', fontWeight: 700 }}>🔎 دلایل</div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            {c.infertileReason && <Row l="بی‌نطفه" v={INFERTILE_REASONS.find(x => x[0] === c.infertileReason)?.[1] || '—'} />}
                            {c.deadReason && <Row l="مرده" v={DEAD_REASONS.find(x => x[0] === c.deadReason)?.[1] || '—'} />}
                          </div>
                        </>
                      )}

                      {c.notes && (
                        <>
                          <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', fontWeight: 700 }}>📝 یادداشت</div>
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

                {/* دکمه افزودن مرحله بعد */}
                {list.length < 3 && (
                  <Btn size="sm" full onClick={() => openNew(entryId)}>
                    + افزودن مرحله {toFa(list.length + 1)}
                  </Btn>
                )}
              </div>
            );
          })}
          <Btn full onClick={() => openNew()}>+ ثبت کندلینگ</Btn>
        </>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={form.id ? '✏️ ویرایش کندلینگ' : '🔍 ثبت کندلینگ'}
        footer={<BtnRow><Btn onClick={save}>ذخیره</Btn><Btn onClick={() => setOpen(false)}>لغو</Btn></BtnRow>}>

        <SectionTitle>📦 ورودی تخم</SectionTitle>
        {eggEntries.length === 0 ? (
          <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--muted)', padding: 10, textAlign: 'center' }}>ورودی تخمی نیست</div>
        ) : (
          <>
            <Field label="دستگاه" hint="فیلتر">
              <Select value={modalDeviceFilter} onChange={e => { setModalDeviceFilter(e.target.value); setModalBirdFilter(''); }}>
                <option value="">— همه دستگاه‌ها —</option>
                {devices.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </Select>
            </Field>

            {modalDeviceFilter && availableBirds.length > 1 && (
              <Field label="پرنده" hint="فیلتر">
                <Select value={modalBirdFilter} onChange={e => setModalBirdFilter(e.target.value)}>
                  <option value="">— همه پرنده‌ها —</option>
                  {availableBirds.map(b => b && <option key={b.id} value={b.id}>{b.name}</option>)}
                </Select>
              </Field>
            )}

            <Field label="انتخاب ورودی" required>
              {filteredEntries.length === 0 ? (
                <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--muted)', padding: 10, textAlign: 'center', background: 'var(--input-bg)', borderRadius: 'var(--r-md)' }}>
                  ورودی مطابق فیلتر نیست
                </div>
              ) : (
                <Select value={form.eggEntryId} onChange={e => {
                  const nextStage = nextStageFor(e.target.value);
                  setForm({...form, eggEntryId: e.target.value, stage: String(nextStage)});
                }}>
                  {filteredEntries.map(e => {
                    const bird = birds.find(b => b.id === e.birdId);
                    const dev = devices.find(d => d.id === e.deviceId);
                    const stages = candlings.filter(c => c.eggEntryId === e.id).length;
                    return <option key={e.id} value={e.id}>{bird?.name || '—'} · {toFa(e.entryDate)} · {toFa(e.count || 0)} تخم · {dev?.name || ''}{stages > 0 ? ' (' + toFa(stages) + ' مرحله)' : ''}</option>;
                  })}
                </Select>
              )}
            </Field>

            {selectedEntry && (
              <div style={{ padding: '10px 12px', background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', display: 'flex', flexDirection: 'column', gap: 4 }}>
                <Row l="پرنده" v={birds.find(b => b.id === selectedEntry.birdId)?.name || '—'} />
                <Row l="تعداد کل" v={toFa(totalCount) + ' تخم'} />
                <Row l="تاریخ ورود" v={toFa(selectedEntry.entryDate)} />
                <Row l="هچ پیش‌بینی" v={toFa(selectedEntry.expectedHatchDate || '—')} />
              </div>
            )}
          </>
        )}

        <SectionTitle>📅 زمان‌بندی</SectionTitle>
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

        <SectionTitle>📊 نتیجه کندلینگ</SectionTitle>
        {totalCount > 0 && (
          <div style={{
            padding: '8px 12px',
            background: remaining < 0 ? 'var(--danger-soft)' : remaining === 0 ? 'var(--accent-soft)' : 'var(--input-bg)',
            border: '1px solid ' + (remaining < 0 ? 'var(--danger)' : remaining === 0 ? 'var(--accent-border)' : 'var(--border)'),
            borderRadius: 'var(--r-md)',
            fontSize: 'var(--fs-sm)',
            color: remaining < 0 ? 'var(--danger)' : remaining === 0 ? 'var(--accent)' : 'var(--text)',
            fontWeight: 700,
            textAlign: 'center',
          }}>
            مجموع: {toFa(sum)} از {toFa(totalCount)}
            {remaining > 0 && ' · باقی: ' + toFa(remaining)}
            {remaining < 0 && ' — بیشتر از حد مجاز!'}
            {remaining === 0 && ' ✅ کامل'}
          </div>
        )}
        <Grid2>
          <Field label="سالم"><NumField placeholder="۰" value={form.alive} onChange={e => setForm({...form, alive: e.target.value})} max={totalCount} min={0} unit="عدد" autoClamp /></Field>
          <Field label="بی‌نطفه"><NumField placeholder="۰" value={form.infertile} onChange={e => setForm({...form, infertile: e.target.value})} max={totalCount} min={0} unit="عدد" autoClamp /></Field>
        </Grid2>
        <Grid2>
          <Field label="مرده"><NumField placeholder="۰" value={form.dead} onChange={e => setForm({...form, dead: e.target.value})} max={totalCount} min={0} unit="عدد" autoClamp /></Field>
          <Field label="شکسته"><NumField placeholder="۰" value={form.broken} onChange={e => setForm({...form, broken: e.target.value})} max={totalCount} min={0} unit="عدد" autoClamp /></Field>
        </Grid2>

        <SectionTitle>🔎 دلایل</SectionTitle>
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

        <SectionTitle>📝 یادداشت</SectionTitle>
        <Input placeholder="..." value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} />

        {err && <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--danger)', textAlign: 'center' }}>✕ {err}</div>}
      </Modal>

      <Modal open={!!delId} onClose={() => setDelId(null)} title="حذف کندلینگ"
        footer={<BtnRow><Btn variant="danger" onClick={() => { if (delId) deleteCandling(delId); setDelId(null); }}>حذف کن</Btn><Btn onClick={() => setDelId(null)}>لغو</Btn></BtnRow>}>
        <div style={{ textAlign: 'center', fontSize: 'var(--fs-md)' }}>حذف مرحله {toFa(target?.stage || 0)}؟</div>
      </Modal>
    </PageContainer>
  );
}

function Row({ l, v, bold }: { l: string; v: string; bold?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--fs-sm)', padding: '6px 10px', background: 'var(--input-bg)', borderRadius: 'var(--r-sm)', fontWeight: bold ? 700 : 500 }}>
      <span style={{ color: 'var(--muted)' }}>{l}:</span>
      <span style={{ fontWeight: 600, color: 'var(--text)' }}>{v}</span>
    </div>
  );
}
