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

interface EntryData {
  alive: string;
  infertile: string;
  dead: string;
  broken: string;
  infertileReason: string;
  deadReason: string;
  notes: string;
}

const emptyData = (): EntryData => ({ alive: '', infertile: '', dead: '', broken: '', infertileReason: '', deadReason: '', notes: '' });

function todayJalali(): string {
  const d = new Date();
  return d.getFullYear() + '/' + String(d.getMonth() + 1).padStart(2, '0') + '/' + String(d.getDate()).padStart(2, '0');
}

export default function CandlingsPage({ initialEntry = '', onGoTo }: { initialEntry?: string; onGoTo?: (t: any) => void } = {}) {
  const { devices, eggEntries, candlings, addCandling, updateCandling, deleteCandling } = useInc();
  const { birds } = useBrd();

  const [open, setOpen] = useState(false);
  const [modalDevice, setModalDevice] = useState('');
  const [modalDay, setModalDay] = useState('');
  const [modalDate, setModalDate] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [entriesData, setEntriesData] = useState<Record<string, EntryData>>({});
  const [err, setErr] = useState('');
  const [delId, setDelId] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    if (initialEntry) {
      const entry = eggEntries.find(e => e.id === initialEntry);
      if (entry) {
        setModalDevice(entry.deviceId);
        setSelectedIds(new Set([initialEntry]));
        setEntriesData({ [initialEntry]: emptyData() });
        // پیشنهاد روز: آخرین کندلینگ + ۳ روز
        const stages = candlings.filter(c => c.eggEntryId === initialEntry).map(c => c.stage);
        const nextDay = stages.length > 0 ? Math.max(...stages) + 3 : 7;
        setModalDay(String(nextDay));
        setModalDate(todayJalali());
        setOpen(true);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialEntry]);

  const nextDayFor = (eggEntryId: string): number => {
    const stages = candlings.filter(c => c.eggEntryId === eggEntryId).map(c => c.stage);
    if (stages.length === 0) return 7;
    return Math.max(...stages) + 3;
  };

  const openNew = (preEntryId?: string) => {
    if (eggEntries.length === 0) { showAlert('اول یک ورودی تخم ثبت کنید'); return; }
    const initialDev = preEntryId
      ? eggEntries.find(e => e.id === preEntryId)?.deviceId || devices[0]?.id || ''
      : devices[0]?.id || '';
    setModalDevice(initialDev);
    setSelectedIds(preEntryId ? new Set([preEntryId]) : new Set());
    const data: Record<string, EntryData> = {};
    if (preEntryId) data[preEntryId] = emptyData();
    setEntriesData(data);
    setModalDay(preEntryId ? String(nextDayFor(preEntryId)) : '7');
    setModalDate(todayJalali());
    setEditingId(null);
    setErr('');
    setOpen(true);
  };

  const availableEntries = useMemo(() => {
    return eggEntries
      .filter(e => !modalDevice || e.deviceId === modalDevice)
      .filter(e => e.status !== 'failed')
      .sort((a, b) => String(b.entryDate).localeCompare(String(a.entryDate)));
  }, [eggEntries, modalDevice]);

  const toggleEntry = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        setEntriesData(d => { const nd = { ...d }; delete nd[id]; return nd; });
      } else {
        next.add(id);
        setEntriesData(d => ({ ...d, [id]: emptyData() }));
      }
      return next;
    });
  };

  const updateEntryData = (id: string, patch: Partial<EntryData>) => {
    setEntriesData(d => ({ ...d, [id]: { ...(d[id] || emptyData()), ...patch } }));
  };

  const save = () => {
    if (!modalDate.trim()) { setErr('تاریخ اجباری است'); return; }
    if (!modalDay.trim()) { setErr('روز انکوباسیون اجباری است'); return; }
    const dayNum = parseInt(toEn(modalDay)) || 0;
    if (dayNum <= 0 || dayNum > 30) { setErr('روز باید بین ۱ تا ۳۰ باشد'); return; }
    if (selectedIds.size === 0) { setErr('حداقل یک ورودی انتخاب کنید'); return; }

    let saved = 0;
    let hasError = false;

    if (editingId) {
      const d = entriesData[editingId] || emptyData();
      const sum = (parseInt(toEn(d.alive))||0) + (parseInt(toEn(d.infertile))||0) + (parseInt(toEn(d.dead))||0) + (parseInt(toEn(d.broken))||0);
      if (sum === 0) { setErr('حداقل یک مقدار وارد کنید'); return; }
      updateCandling(editingId, {
        stage: dayNum,
        date: modalDate,
        alive: parseInt(toEn(d.alive)) || null,
        infertile: parseInt(toEn(d.infertile)) || null,
        dead: parseInt(toEn(d.dead)) || null,
        broken: parseInt(toEn(d.broken)) || null,
        infertileReason: d.infertileReason,
        deadReason: d.deadReason,
        notes: d.notes,
      });
      setOpen(false);
      return;
    }

    Array.from(selectedIds).forEach(id => {
      const entry = eggEntries.find(e => e.id === id);
      if (!entry) return;
      const d = entriesData[id] || emptyData();
      const sum = (parseInt(toEn(d.alive))||0) + (parseInt(toEn(d.infertile))||0) + (parseInt(toEn(d.dead))||0) + (parseInt(toEn(d.broken))||0);
      if (sum === 0) { hasError = true; return; }
      if (entry.count && sum > entry.count) { hasError = true; return; }
      addCandling({
        eggEntryId: id,
        stage: dayNum,
        date: modalDate,
        alive: parseInt(toEn(d.alive)) || null,
        infertile: parseInt(toEn(d.infertile)) || null,
        dead: parseInt(toEn(d.dead)) || null,
        broken: parseInt(toEn(d.broken)) || null,
        infertileReason: d.infertileReason,
        deadReason: d.deadReason,
        notes: d.notes,
      });
      saved++;
    });

    if (hasError && saved === 0) { setErr('هیچ کندلینگی ذخیره نشد — مقادیر را چک کنید'); return; }
    setOpen(false);
    showAlert(toFa(saved) + ' کندلینگ ثبت شد', '✅ موفق');
  };

  const openEdit = (c: Candling) => {
    setEditingId(c.id);
    setModalDevice('');
    setSelectedIds(new Set([c.eggEntryId]));
    setEntriesData({
      [c.eggEntryId]: {
        alive: c.alive ? toFa(c.alive) : '',
        infertile: c.infertile ? toFa(c.infertile) : '',
        dead: c.dead ? toFa(c.dead) : '',
        broken: c.broken ? toFa(c.broken) : '',
        infertileReason: c.infertileReason,
        deadReason: c.deadReason,
        notes: c.notes,
      }
    });
    setModalDay(String(c.stage));
    setModalDate(c.date);
    setErr('');
    setOpen(true);
  };

  const target = delId ? candlings.find(c => c.id === delId) : null;

  // ═══ گروه‌بندی + تجمیع ═══
  const grouped = useMemo(() => {
    const byEntry: Record<string, Candling[]> = {};
    candlings.forEach(c => {
      if (!byEntry[c.eggEntryId]) byEntry[c.eggEntryId] = [];
      byEntry[c.eggEntryId].push(c);
    });
    return Object.entries(byEntry).map(([entryId, list]) => {
      // تجمیع
      const agg = list.reduce((acc, c) => ({
        alive: acc.alive + (c.alive || 0),
        infertile: acc.infertile + (c.infertile || 0),
        dead: acc.dead + (c.dead || 0),
        broken: acc.broken + (c.broken || 0),
      }), { alive: 0, infertile: 0, dead: 0, broken: 0 });
      return { entryId, list: list.sort((a, b) => a.stage - b.stage), agg };
    }).filter(({ entryId, list }) => {
      if (!q.trim()) return true;
      const t = q.trim().toLowerCase();
      const entry = eggEntries.find(e => e.id === entryId);
      const bird = entry ? birds.find(b => b.id === entry.birdId) : null;
      const dev = entry ? devices.find(d => d.id === entry.deviceId) : null;
      const haystack = [bird?.name, dev?.name, entry?.entryDate].filter(Boolean).join(' ').toLowerCase();
      return haystack.includes(t);
    }).sort(({ entryId: a }, { entryId: b }) => {
      const ea = eggEntries.find(e => e.id === a);
      const eb = eggEntries.find(e => e.id === b);
      return String(eb?.entryDate || '').localeCompare(String(ea?.entryDate || ''));
    });
  }, [candlings, eggEntries, birds, devices, q]);

  const dataFor = (id: string): EntryData => entriesData[id] || emptyData();

  return (
    <PageContainer>
      {candlings.length > 0 && (
        <Input value={q} onChange={e => setQ(e.target.value)} placeholder="🔍 جستجو (نام پرنده، دستگاه، تاریخ...)" />
      )}

      {candlings.length === 0 ? (
        <Empty icon={<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>}
          title="کندلینگی ثبت نشده"
          desc="کندلینگ در روزهای دلخواه انجام می‌شود."
          action={<Btn variant="primary" onClick={() => openNew()}>+ ثبت کندلینگ</Btn>} />
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {grouped.map(({ entryId, list, agg }) => {
              const entry = eggEntries.find(e => e.id === entryId);
              const bird = entry ? birds.find(b => b.id === entry.birdId) : null;
              const dev = entry ? devices.find(d => d.id === entry.deviceId) : null;
              const entryTotal = entry?.count || 0;
              const aggFertilePercent = entryTotal > 0 ? (agg.alive / entryTotal * 100) : 0;

              return (
                <div key={entryId} style={{
                  background: 'var(--card)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--r-lg)',
                  padding: '10px 12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                  position: 'relative',
                  overflow: 'hidden',
                }}>
                  <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, width: 4, background: 'var(--accent)' }} />

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <span style={{ fontSize: 'var(--fs-sm)', fontWeight: 700 }}>
                      🔍 {bird?.name || '—'}
                    </span>
                    <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)' }}>
                      {dev?.name || '—'} · {toFa(entryTotal)} تخم
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 'var(--fs-xs)' }}>
                    <span style={{ color: 'var(--muted)' }}>{toFa(entry?.entryDate || '—')}</span>
                    {aggFertilePercent > 0 && (
                      <Tag tone="green">{toFa(aggFertilePercent.toFixed(0))}٪ نطفه</Tag>
                    )}
                  </div>

                  {/* مراحل */}
                  <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap', paddingTop: 4, borderTop: '1px dashed var(--border)' }}>
                    {list.map(c => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => openEdit(c)}
                        title={'روز ' + toFa(c.stage) + ' · ' + toFa(c.date)}
                        style={{
                          padding: '4px 8px',
                          background: 'var(--accent-soft)',
                          border: '1px solid var(--accent-border)',
                          borderRadius: 'var(--r-sm)',
                          fontSize: 'var(--fs-xs)',
                          fontWeight: 700,
                          color: 'var(--accent)',
                          cursor: 'pointer',
                          fontFamily: 'inherit',
                        }}
                      >
                        ✓ روز {toFa(c.stage)}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => openNew(entryId)}
                      style={{
                        padding: '4px 8px',
                        background: 'var(--input-bg)',
                        border: '1px dashed var(--border)',
                        borderRadius: 'var(--r-sm)',
                        fontSize: 'var(--fs-xs)',
                        fontWeight: 700,
                        color: 'var(--muted)',
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                      }}
                    >
                      + کندلینگ
                    </button>
                  </div>

                  {/* تجمیع */}
                  <div style={{
                    marginTop: 4,
                    padding: '6px 8px',
                    background: 'var(--input-bg)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--r-sm)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2,
                    fontSize: 'var(--fs-xs)',
                  }}>
                    <div style={{ fontWeight: 700, color: 'var(--muted)', marginBottom: 2 }}>📊 تجمیع ({toFa(list.length)} کندلینگ)</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--accent)', fontWeight: 700 }}>سالم: {toFa(agg.alive)}</span>
                      <span style={{ color: 'var(--warn)', fontWeight: 700 }}>بی‌نطفه: {toFa(agg.infertile)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--danger)', fontWeight: 700 }}>مرده: {toFa(agg.dead)}</span>
                      <span style={{ color: 'var(--muted)', fontWeight: 700 }}>شکسته: {toFa(agg.broken)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <Btn variant="primary" full onClick={() => openNew()}>+ ثبت کندلینگ</Btn>
        </>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={editingId ? '✏️ ویرایش کندلینگ' : '🔍 ثبت کندلینگ'}
        footer={<BtnRow><Btn variant="primary" onClick={save}>ذخیره ({toFa(editingId ? 1 : selectedIds.size)})</Btn><Btn onClick={() => setOpen(false)}>لغو</Btn></BtnRow>}>

        <SectionTitle>📅 زمان‌بندی</SectionTitle>
        <Grid2>
          <Field label="روز انکوباسیون" required hint="مثلاً ۷، ۱۰، ۱۵">
            <NumField value={modalDay} onChange={e => setModalDay(e.target.value)} unit="روز" min={1} max={30} autoClamp />
          </Field>
          <Field label="تاریخ" required>
            <DatePicker value={modalDate} onChange={v => setModalDate(v)} placeholder="انتخاب" />
          </Field>
        </Grid2>

        <SectionTitle>📦 انتخاب ورودی‌ها</SectionTitle>
        <Field label="فیلتر دستگاه">
          <Select value={modalDevice} onChange={e => { setModalDevice(e.target.value); setSelectedIds(new Set()); setEntriesData({}); }}>
            <option value="">— همه دستگاه‌ها —</option>
            {devices.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </Select>
        </Field>

        {availableEntries.length === 0 ? (
          <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--muted)', padding: 10, textAlign: 'center', background: 'var(--input-bg)', borderRadius: 'var(--r-md)' }}>
            ورودی‌ای برای این دستگاه نیست
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {availableEntries.map(e => {
              const bird = birds.find(b => b.id === e.birdId);
              const isSelected = selectedIds.has(e.id);
              const d = dataFor(e.id);
              const sum = (parseInt(toEn(d.alive))||0) + (parseInt(toEn(d.infertile))||0) + (parseInt(toEn(d.dead))||0) + (parseInt(toEn(d.broken))||0);
              const remaining = (e.count || 0) - sum;
              const existingCandlings = candlings.filter(c => c.eggEntryId === e.id);
              const alreadyAgg = existingCandlings.reduce((acc, c) => ({
                alive: acc.alive + (c.alive || 0),
                infertile: acc.infertile + (c.infertile || 0),
                dead: acc.dead + (c.dead || 0),
                broken: acc.broken + (c.broken || 0),
              }), { alive: 0, infertile: 0, dead: 0, broken: 0 });

              return (
                <div key={e.id} style={{
                  border: '1px solid ' + (isSelected ? 'var(--accent-border)' : 'var(--border)'),
                  background: isSelected ? 'var(--accent-soft)' : 'var(--card)',
                  borderRadius: 'var(--r-md)',
                  padding: 10,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleEntry(e.id)}
                      style={{ width: 18, height: 18, accentColor: 'var(--accent)' }}
                    />
                    <span style={{ flex: 1, fontSize: 'var(--fs-sm)', fontWeight: 700 }}>
                      {bird?.name || '—'} · {toFa(e.count || 0)} تخم
                    </span>
                    <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)' }}>{toFa(e.entryDate)}</span>
                  </label>

                  {existingCandlings.length > 0 && (
                    <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', padding: '4px 8px', background: 'var(--input-bg)', borderRadius: 'var(--r-sm)' }}>
                      تجمیع قبلی: سالم {toFa(alreadyAgg.alive)} · بی‌نطفه {toFa(alreadyAgg.infertile)} · مرده {toFa(alreadyAgg.dead)}
                    </div>
                  )}

                  {isSelected && (
                    <>
                      <Grid2>
                        <Field label="سالم"><NumField placeholder="۰" value={d.alive} onChange={ev => updateEntryData(e.id, { alive: ev.target.value })} max={e.count || 0} min={0} unit="عدد" autoClamp /></Field>
                        <Field label="بی‌نطفه"><NumField placeholder="۰" value={d.infertile} onChange={ev => updateEntryData(e.id, { infertile: ev.target.value })} max={e.count || 0} min={0} unit="عدد" autoClamp /></Field>
                      </Grid2>
                      <Grid2>
                        <Field label="مرده"><NumField placeholder="۰" value={d.dead} onChange={ev => updateEntryData(e.id, { dead: ev.target.value })} max={e.count || 0} min={0} unit="عدد" autoClamp /></Field>
                        <Field label="شکسته"><NumField placeholder="۰" value={d.broken} onChange={ev => updateEntryData(e.id, { broken: ev.target.value })} max={e.count || 0} min={0} unit="عدد" autoClamp /></Field>
                      </Grid2>

                      <div style={{
                        padding: '6px 10px',
                        background: remaining < 0 ? 'var(--danger-soft)' : remaining === 0 ? 'var(--accent-soft)' : 'var(--input-bg)',
                        border: '1px solid ' + (remaining < 0 ? 'var(--danger)' : remaining === 0 ? 'var(--accent-border)' : 'var(--border)'),
                        borderRadius: 'var(--r-sm)',
                        fontSize: 'var(--fs-xs)',
                        color: remaining < 0 ? 'var(--danger)' : remaining === 0 ? 'var(--accent)' : 'var(--text)',
                        fontWeight: 700,
                        textAlign: 'center',
                      }}>
                        این کندلینگ: {toFa(sum)} از {toFa(e.count || 0)}
                        {remaining > 0 && ' · باقی: ' + toFa(remaining)}
                        {remaining < 0 && ' — بیشتر!'}
                        {remaining === 0 && ' ✅'}
                      </div>

                      <Grid2>
                        <Field label="دلیل بی‌نطفه">
                          <Select value={d.infertileReason} onChange={ev => updateEntryData(e.id, { infertileReason: ev.target.value })}>
                            {INFERTILE_REASONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                          </Select>
                        </Field>
                        <Field label="دلیل مرگ">
                          <Select value={d.deadReason} onChange={ev => updateEntryData(e.id, { deadReason: ev.target.value })}>
                            {DEAD_REASONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                          </Select>
                        </Field>
                      </Grid2>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {err && <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--danger)', textAlign: 'center' }}>✕ {err}</div>}
      </Modal>

      <Modal open={!!delId} onClose={() => setDelId(null)} title="حذف کندلینگ"
        footer={<BtnRow><Btn variant="danger" onClick={() => { if (delId) deleteCandling(delId); setDelId(null); }}>حذف کن</Btn><Btn onClick={() => setDelId(null)}>لغو</Btn></BtnRow>}>
        <div style={{ textAlign: 'center', fontSize: 'var(--fs-md)' }}>حذف کندلینگ روز {toFa(target?.stage || 0)}؟</div>
      </Modal>
    </PageContainer>
  );
}
