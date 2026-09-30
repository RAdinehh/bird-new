import { useState, useEffect, useMemo } from 'react';
import { useInc, hatchRate, costPerChick, type HatchResult } from './store';
import { useBrd } from '../brd/store';
import { useFlk } from '../flk/store';
import { useHal } from '../hal/store';
import { useCtc } from '../ctc/store';
import { useTra } from '../tra/store';
import { useNavigate } from 'react-router-dom';
import { Btn, BtnRow, Empty, Field, Grid2, Input, Modal, MoneyField, NumField, PageContainer, SectionTitle, Select, Tag } from '../../shr/components/ui';
import ExpandableCard from '../../shr/components/ExpandableCard';
import DatePicker from '../../shr/components/DatePicker';
import { toFa, toEn } from '../../shr/utils/fa';
import { showAlert } from '../../cor/store/dialog';

const emptyRow = () => ({ hatched:'', unhatched:'', deadInShell:'', pipped:'', other:'', gradeA:'', gradeB:'', maleCount:'', femaleCount:'', unknownCount:'', avgWeight:'', notes:'' });

export default function HatchesPage({ initialEntry = '', onGoTo }: { initialEntry?: string; onGoTo?: (t: any) => void } = {}) {
  const { devices, eggEntries, hatches, candlings, addHatch, updateHatch, deleteHatch } = useInc();
  const { birds } = useBrd();
  const { add: addFlock, remove: removeFlock } = useFlk();
  const { halls, zones } = useHal();
  const { contacts } = useCtc();
  const { addInvoice, deleteInvoice } = useTra();
  const nav = useNavigate();

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formDate, setFormDate] = useState('');
  const [formEntryId, setFormEntryId] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [entriesData, setEntriesData] = useState<Record<string, any>>({});
  const [err, setErr] = useState('');
  const [delId, setDelId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const [deviceFilter, setDeviceFilter] = useState('');

  const [flockModal, setFlockModal] = useState<{ hatchId: string; count: number } | null>(null);
  const [flockForm, setFlockForm] = useState({ name:'', type:'layer', hallId:'', zoneId:'' });
  const [sellModal, setSellModal] = useState<{ hatchId: string; count: number } | null>(null);
  const [sellForm, setSellForm] = useState({ buyerId:'', count:'', unitPrice:'', date:'' });

  const int = (s: string) => s ? parseInt(toEn(s)) || null : null;
  const num = (s: string) => s ? parseFloat(toEn(s).replace('٫', '.')) || null : null;
  const todayJ = () => { const d = new Date(); return d.getFullYear() + '/' + String(d.getMonth()+1).padStart(2,'0') + '/' + String(d.getDate()).padStart(2,'0'); };

  const dataFor = (id: string) => entriesData[id] || emptyRow();
  const updateData = (id: string, patch: any) => setEntriesData(d => ({ ...d, [id]: { ...(d[id] || emptyRow()), ...patch } }));

  const toggleEntry = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); setEntriesData(d => { const nd = { ...d }; delete nd[id]; return nd; }); }
      else { next.add(id); setEntriesData(d => ({ ...d, [id]: emptyRow() })); }
      return next;
    });
  };

  const openNew = (preId?: string) => {
    if (eggEntries.length === 0) { showAlert('اول یک ورودی تخم بسازید'); return; }
    setEditingId(null);
    setFormDate(todayJ());
    setFormEntryId(preId || eggEntries[0].id);
    const data: Record<string, any> = {};
    if (preId) data[preId] = emptyRow();
    setEntriesData(data);
    setSelectedIds(preId ? new Set([preId]) : new Set());
    setErr(''); setOpen(true);
  };

  const openEdit = (h: HatchResult) => {
    setEditingId(h.id);
    setFormDate(h.date);
    setFormEntryId(h.eggEntryId);
    setSelectedIds(new Set([h.eggEntryId]));
    setEntriesData({ [h.eggEntryId]: {
      hatched: h.hatched ? toFa(h.hatched) : '', unhatched: h.unhatched ? toFa(h.unhatched) : '',
      deadInShell: h.deadInShell ? toFa(h.deadInShell) : '', pipped: h.pipped ? toFa(h.pipped) : '',
      other: h.other ? toFa(h.other) : '', gradeA: h.gradeA ? toFa(h.gradeA) : '', gradeB: h.gradeB ? toFa(h.gradeB) : '',
      maleCount: h.maleCount ? toFa(h.maleCount) : '', femaleCount: h.femaleCount ? toFa(h.femaleCount) : '',
      unknownCount: h.unknownCount ? toFa(h.unknownCount) : '', avgWeight: h.avgWeight ? toFa(h.avgWeight) : '', notes: h.notes
    }});
    setErr(''); setOpen(true);
  };

  const save = () => {
    if (!formDate.trim()) { setErr('تاریخ اجباری است'); return; }
    if (editingId) {
      const d = dataFor(formEntryId);
      updateHatch(editingId, {
        date: formDate,
        hatched: int(d.hatched), unhatched: int(d.unhatched),
        deadInShell: int(d.deadInShell), pipped: int(d.pipped), other: int(d.other),
        gradeA: int(d.gradeA), gradeB: int(d.gradeB),
        maleCount: int(d.maleCount), femaleCount: int(d.femaleCount), unknownCount: int(d.unknownCount),
        avgWeight: num(d.avgWeight), notes: d.notes || ''
      } as any);
      setOpen(false); return;
    }
    if (selectedIds.size === 0) { setErr('حداقل یک ورودی انتخاب کنید'); return; }
    let saved = 0;
    Array.from(selectedIds).forEach(id => {
      const d = dataFor(id);
      addHatch({
        eggEntryId: id, date: formDate,
        hatched: int(d.hatched), unhatched: int(d.unhatched),
        deadInShell: int(d.deadInShell), pipped: int(d.pipped), other: int(d.other),
        gradeA: int(d.gradeA), gradeB: int(d.gradeB),
        maleCount: int(d.maleCount), femaleCount: int(d.femaleCount), unknownCount: int(d.unknownCount),
        avgWeight: num(d.avgWeight), notes: d.notes || ''
      } as any);
      saved++;
    });
    setOpen(false);
    showAlert(toFa(saved) + ' نتیجه هچ ثبت شد', '✅ موفق');
  };

  const doDelete = (id: string) => {
    const h = hatches.find(x => x.id === id) as any;
    if (!h) return;
    if (h.generatedFlockId && confirm('این هچ یک گله ساخته. گله هم حذف شود؟')) { try { removeFlock(h.generatedFlockId); } catch {} }
    if (h.generatedInvoiceId && confirm('این هچ یک فاکتور ساخته. فاکتور هم حذف شود؟')) { try { deleteInvoice(h.generatedInvoiceId); } catch {} }
    deleteHatch(id); setDelId(null);
  };

  const createFlock = () => {
    if (!flockModal) return;
    if (!flockForm.name.trim()) { showAlert('نام گله اجباری است'); return; }
    const h = hatches.find(x => x.id === flockModal.hatchId); if (!h) return;
    const entry = eggEntries.find(e => e.id === h.eggEntryId);
    const bird = entry ? birds.find(b => b.id === entry.birdId) : null;
    if (!bird) { showAlert('پرنده پیدا نشد'); return; }
    addFlock({
      name: flockForm.name.trim(), type: flockForm.type as any,
      birdId: bird.id, breedId: entry?.breedId || '',
      hallId: flockForm.hallId, zoneId: flockForm.zoneId,
      initialCount: flockModal.count, currentCount: flockModal.count,
      maleCount: h.maleCount || null, femaleCount: h.femaleCount || null,
      layingStartDay: 140, vaccineScheduleId: '',
      hatchDate: todayJ(), purchaseDate: '', startDate: todayJ(), endDate: '', source: 'hatch',
      purchasePrice: null, deliveryCost: null, otherCosts: null,
      status: 'active', notes: 'از هچ ' + toFa(h.date),
    } as any);
    setFlockModal(null);
    showAlert('گله ساخته شد', '✅ موفق');
    setTimeout(() => nav('/flk'), 500);
  };

  const doSell = () => {
    if (!sellModal) return;
    if (!sellForm.buyerId) { showAlert('خریدار اجباری است'); return; }
    const count = parseInt(toEn(sellForm.count)) || 0;
    const unitPrice = parseFloat(toEn(sellForm.unitPrice).replace('٫','.')) || 0;
    if (count <= 0 || unitPrice <= 0) { showAlert('مقادیر باید بیشتر از صفر'); return; }
    const h = hatches.find(x => x.id === sellModal.hatchId);
    const invId = addInvoice({
      type: 'sale', date: sellForm.date || h?.date || '',
      partyId: sellForm.buyerId, category: 'chick',
      items: [{ id: 'chick-' + Date.now(), name: 'جوجه یک‌روزه', quantity: count, unit: 'عدد', unitPrice, total: count * unitPrice }],
      total: count * unitPrice, payments: [], dueDate: sellForm.date || h?.date || '',
      relatedFlockId: '', relatedEntryId: h?.eggEntryId || '', notes: 'فروش جوجه'
    } as any);
    if (h && invId) updateHatch(h.id, { generatedInvoiceId: invId } as any);
    setSellModal(null);
    showAlert('فاکتور ثبت شد', '✅ موفق');
  };

  const filtered = useMemo(() => hatches.filter(h => {
    const entry = eggEntries.find(e => e.id === h.eggEntryId);
    if (deviceFilter && entry?.deviceId !== deviceFilter) return false;
    if (q.trim()) {
      const t = q.trim().toLowerCase();
      const bird = entry ? birds.find(b => b.id === entry.birdId) : null;
      const dev = entry ? devices.find(d => d.id === entry.deviceId) : null;
      if (![bird?.name, dev?.name, h.date, h.notes].filter(Boolean).join(' ').toLowerCase().includes(t)) return false;
    }
    return true;
  }).sort((a, b) => String(b.date).localeCompare(String(a.date))), [hatches, eggEntries, deviceFilter, q, birds, devices]);

  const target = delId ? hatches.find(h => h.id === delId) : null;
  const availableEntries = eggEntries.filter(e => !deviceFilter || e.deviceId === deviceFilter).sort((a, b) => String(b.entryDate).localeCompare(String(a.entryDate)));

  return (
    <PageContainer>
      {hatches.length > 0 && (
        <>
          <Input value={q} onChange={e => setQ(e.target.value)} placeholder="🔍 جستجو..." />
          <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
            <button onClick={() => setDeviceFilter('')} style={chip(!deviceFilter)}>همه</button>
            {devices.map(d => <button key={d.id} onClick={() => setDeviceFilter(deviceFilter === d.id ? '' : d.id)} style={chip(deviceFilter === d.id)}>{d.name}</button>)}
          </div>
        </>
      )}

      {filtered.length === 0 ? (
        <Empty icon={<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><ellipse cx="12" cy="14" rx="7" ry="9"/></svg>}
          title="هچی ثبت نشده" desc="نتیجه‌ی نهایی را ثبت کنید."
          action={<Btn variant="primary" onClick={() => openNew()}>+ ثبت هچ</Btn>} />
      ) : (
        <>
          {filtered.map((h, i) => {
            const entry = eggEntries.find(e => e.id === h.eggEntryId);
            const bird = entry ? birds.find(b => b.id === entry.birdId) : null;
            const dev = entry ? devices.find(d => d.id === entry.deviceId) : null;
            const isOpen = expandedId === h.id;
            const total = entry?.count || 0;
            const hr = hatchRate(h.hatched || 0, total);
            const myCand = candlings.filter(c => c.eggEntryId === h.eggEntryId).sort((a,b) => b.stage - a.stage)[0];
            const aliveAfter = myCand?.alive || total;
            const realRate = aliveAfter ? ((h.hatched || 0) / aliveAfter * 100) : 0;
            const tone = hr >= 70 ? 'green' : hr >= 50 ? 'amber' : 'red';
            const sumH = (h.hatched||0) + (h.unhatched||0) + (h.deadInShell||0) + (h.pipped||0) + (h.other||0);
            const isComplete = total > 0 && sumH >= total;
            return (
              <ExpandableCard key={h.id} accent="accent" index={toFa(i + 1)} iconEmoji="🐣"
                title={toFa(h.hatched || 0) + ' جوجه · ' + (bird?.name || '—')}
                subtitle={(dev?.name || '—') + ' · ' + toFa(h.date)}
                isOpen={isOpen} onToggle={() => setExpandedId(isOpen ? null : h.id)}
                badge={<Tag tone={tone}>{toFa(hr.toFixed(1))}٪</Tag>}
                summary={<><span>🐣 {toFa(h.hatched || 0)}</span><span>🥚 {toFa(total)}</span><span>📊 {toFa(hr.toFixed(0))}٪</span></>}
              >
                {isComplete && <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--accent)', fontWeight: 700, padding: '6px 10px', background: 'var(--accent-soft)', border: '1px solid var(--accent-border)', borderRadius: 'var(--r-sm)', textAlign: 'center' }}>✅ تکمیل — همه تخم‌ها شمارش شدن</div>}

                {total > 0 && (h.hatched || 0) > 0 && (
                  <>
                    <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', fontWeight: 700 }}>📊 توزیع</div>
                    <div style={{ display: 'flex', height: 8, borderRadius: 4, overflow: 'hidden', background: 'var(--input-bg)' }}>
                      {(h.hatched||0) > 0 && <div style={{ width: ((h.hatched||0)/total*100)+'%', background: 'var(--accent)' }} />}
                      {(h.deadInShell||0) > 0 && <div style={{ width: ((h.deadInShell||0)/total*100)+'%', background: 'var(--danger)' }} />}
                      {(h.pipped||0) > 0 && <div style={{ width: ((h.pipped||0)/total*100)+'%', background: 'var(--warn)' }} />}
                      {(h.unhatched||0) > 0 && <div style={{ width: ((h.unhatched||0)/total*100)+'%', background: 'var(--muted)' }} />}
                    </div>
                  </>
                )}

                <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', fontWeight: 700 }}>📊 نتیجه هچ</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <Row l="جوجه هچ‌شده" v={toFa(h.hatched || 0)} />
                  <Row l="هچ‌نشده" v={toFa(h.unhatched || 0)} />
                  {h.deadInShell ? <Row l="مرده در پوسته" v={toFa(h.deadInShell)} /> : null}
                  {h.pipped ? <Row l="نوک‌زده" v={toFa(h.pipped)} /> : null}
                  {h.other ? <Row l="سایر" v={toFa(h.other)} /> : null}
                </div>

                {(h.gradeA || h.gradeB) && (
                  <>
                    <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', fontWeight: 700 }}>🏅 تفکیک کیفی</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {h.gradeA ? <Row l="درجه A" v={toFa(h.gradeA)} /> : null}
                      {h.gradeB ? <Row l="درجه B" v={toFa(h.gradeB)} /> : null}
                    </div>
                  </>
                )}

                {(h.maleCount || h.femaleCount || h.unknownCount) && (
                  <>
                    <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', fontWeight: 700 }}>⚖️ جنسیت</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {h.maleCount ? <Row l="♂ نر" v={toFa(h.maleCount)} /> : null}
                      {h.femaleCount ? <Row l="♀ ماده" v={toFa(h.femaleCount)} /> : null}
                      {h.unknownCount ? <Row l="? نامعلوم" v={toFa(h.unknownCount)} /> : null}
                    </div>
                  </>
                )}

                {h.avgWeight ? <><div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', fontWeight: 700 }}>⚖️ وزن</div><Row l="وزن متوسط" v={toFa(h.avgWeight) + ' گرم'} /></> : null}

                <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', fontWeight: 700 }}>📈 نرخ‌ها</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <Row l="نرخ هچ کل" v={toFa(hr.toFixed(1)) + '٪'} />
                  {aliveAfter !== total && <Row l="نرخ از نطفه‌دار" v={toFa(realRate.toFixed(1)) + '٪'} />}
                </div>

                {entry?.totalPrice && h.hatched ? (
                  <>
                    <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', fontWeight: 700 }}>💰 هزینه</div>
                    <Row l="💰 هزینه هر جوجه" v={toFa(Math.round(costPerChick(entry.totalPrice, h.hatched)).toLocaleString('fa-IR')) + ' ت'} />
                  </>
                ) : null}

                {h.notes && (
                  <>
                    <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', fontWeight: 700 }}>📝 یادداشت</div>
                    <div style={{ fontSize: 'var(--fs-sm)', lineHeight: 1.7, padding: '8px 10px', background: 'var(--input-bg)', borderRadius: 'var(--r-sm)' }}>{h.notes}</div>
                  </>
                )}

                {isComplete && (h.hatched || 0) > 0 && (
                  <div style={{ padding: 10, background: 'var(--input-bg)', border: '1px dashed var(--border)', borderRadius: 'var(--r-md)', display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', fontWeight: 700, textAlign: 'center' }}>مرحله بعد:</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                      <Btn size="sm" onClick={() => { setFlockModal({ hatchId: h.id, count: h.hatched || 0 }); setFlockForm({ name: 'گله ' + (bird?.name || '') + ' ' + toFa(new Date().getFullYear()), type: 'layer', hallId: '', zoneId: '' }); }}>🐔 گله</Btn>
                      <Btn size="sm" onClick={() => { setSellModal({ hatchId: h.id, count: h.hatched || 0 }); setSellForm({ buyerId:'', count: String(h.hatched || 0), unitPrice:'', date: h.date }); }}>📥 فروش</Btn>
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', gap: 6, paddingTop: 4 }}>
                  <Btn size="sm" onClick={() => openEdit(h)} style={{ flex: 1 }}>ویرایش</Btn>
                  <Btn size="sm" onClick={() => setDelId(h.id)} style={{ flex: 1 }}>حذف</Btn>
                </div>
              </ExpandableCard>
            );
          })}
          <Btn variant="primary" full onClick={() => openNew()}>+ ثبت هچ</Btn>
        </>
      )}

      {/* ═══ Modal ثبت/ویرایش ═══ */}
      <Modal open={open} onClose={() => setOpen(false)} title={editingId ? '✏️ ویرایش هچ' : '🐣 ثبت هچ'}
        footer={<BtnRow><Btn variant="primary" onClick={save}>ذخیره ({toFa(editingId ? 1 : selectedIds.size)})</Btn><Btn onClick={() => setOpen(false)}>لغو</Btn></BtnRow>}>

        <SectionTitle>📦 انتخاب ورودی‌ها</SectionTitle>

        {editingId ? (
          <Field label="ورودی تخم" required>
            <Select value={formEntryId} onChange={e => setFormEntryId(e.target.value)}>
              {eggEntries.map(e => {
                const bird = birds.find(b => b.id === e.birdId);
                const dev = devices.find(d => d.id === e.deviceId);
                return <option key={e.id} value={e.id}>{bird?.name || '—'} · {toFa(e.entryDate)} · {toFa(e.count || 0)} تخم · {dev?.name || ''}</option>;
              })}
            </Select>
          </Field>
        ) : (
          <>
            <Field label="فیلتر دستگاه" hint={selectedIds.size > 0 ? toFa(selectedIds.size) + ' انتخاب‌شده' : undefined}>
              <Select value={deviceFilter} onChange={e => setDeviceFilter(e.target.value)}>
                <option value="">— همه دستگاه‌ها —</option>
                {devices.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </Select>
            </Field>

            {availableEntries.length === 0 ? (
              <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--muted)', padding: 10, textAlign: 'center', background: 'var(--input-bg)', borderRadius: 'var(--r-md)' }}>ورودی‌ای نیست</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {availableEntries.map(e => {
                  const bird = birds.find(b => b.id === e.birdId);
                  const dev = devices.find(d => d.id === e.deviceId);
                  const isSel = selectedIds.has(e.id);
                  const d = dataFor(e.id);
                  const myCand = candlings.filter(c => c.eggEntryId === e.id).sort((a,b) => b.stage - a.stage)[0];
                  const aliveAfter = myCand?.alive || e.count || 0;
                  const sumE = (parseInt(toEn(d.hatched))||0) + (parseInt(toEn(d.unhatched))||0) + (parseInt(toEn(d.deadInShell))||0) + (parseInt(toEn(d.pipped))||0) + (parseInt(toEn(d.other))||0);
                  const rem = (e.count || 0) - sumE;
                  return (
                    <div key={e.id} style={{ border: '1px solid ' + (isSel ? 'var(--accent-border)' : 'var(--border)'), background: isSel ? 'var(--accent-soft)' : 'var(--card)', borderRadius: 'var(--r-md)', padding: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                        <input type="checkbox" checked={isSel} onChange={() => toggleEntry(e.id)} style={{ width: 18, height: 18, accentColor: 'var(--accent)' }} />
                        <span style={{ flex: 1, fontSize: 'var(--fs-sm)', fontWeight: 700 }}>{bird?.name || '—'} · {toFa(e.count || 0)} تخم</span>
                        <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)' }}>{dev?.name || ''}</span>
                      </label>

                      {myCand && <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', padding: '4px 8px', background: 'var(--input-bg)', borderRadius: 'var(--r-sm)' }}>پس از کندلینگ روز {toFa(myCand.stage)}: نطفه‌دار {toFa(aliveAfter)}</div>}

                      {isSel && (
                        <>
                          <Grid2>
                            <Field label="جوجه هچ‌شده" required hint={'حداکثر: ' + toFa(aliveAfter)}>
                              <NumField value={d.hatched} onChange={ev => updateData(e.id, { hatched: ev.target.value })} max={aliveAfter} min={0} unit="عدد" />
                            </Field>
                            <Field label="هچ‌نشده"><NumField value={d.unhatched} onChange={ev => updateData(e.id, { unhatched: ev.target.value })} min={0} unit="عدد" /></Field>
                          </Grid2>
                          <Grid2>
                            <Field label="مرده در پوسته"><NumField value={d.deadInShell} onChange={ev => updateData(e.id, { deadInShell: ev.target.value })} min={0} unit="عدد" /></Field>
                            <Field label="نوک‌زده"><NumField value={d.pipped} onChange={ev => updateData(e.id, { pipped: ev.target.value })} min={0} unit="عدد" /></Field>
                          </Grid2>
                          <Grid2>
                            <Field label="سایر"><NumField value={d.other} onChange={ev => updateData(e.id, { other: ev.target.value })} min={0} unit="عدد" /></Field>
                            <Field label="وزن متوسط"><NumField value={d.avgWeight} onChange={ev => updateData(e.id, { avgWeight: ev.target.value })} min={0} unit="گرم" /></Field>
                          </Grid2>
                          <Grid2>
                            <Field label="درجه A"><NumField value={d.gradeA} onChange={ev => updateData(e.id, { gradeA: ev.target.value })} min={0} unit="عدد" /></Field>
                            <Field label="درجه B"><NumField value={d.gradeB} onChange={ev => updateData(e.id, { gradeB: ev.target.value })} min={0} unit="عدد" /></Field>
                          </Grid2>
                          <Grid2>
                            <Field label="♂ نر"><NumField value={d.maleCount} onChange={ev => updateData(e.id, { maleCount: ev.target.value })} min={0} unit="عدد" /></Field>
                            <Field label="♀ ماده"><NumField value={d.femaleCount} onChange={ev => updateData(e.id, { femaleCount: ev.target.value })} min={0} unit="عدد" /></Field>
                          </Grid2>
                          <Field label="? نامعلوم"><NumField value={d.unknownCount} onChange={ev => updateData(e.id, { unknownCount: ev.target.value })} min={0} unit="عدد" /></Field>
                          <Field label="یادداشت"><Input value={d.notes || ''} onChange={ev => updateData(e.id, { notes: ev.target.value })} placeholder="..." /></Field>
                          <div style={{ padding: '6px 10px', background: rem < 0 ? 'var(--danger-soft)' : rem === 0 ? 'var(--accent-soft)' : 'var(--input-bg)', border: '1px solid ' + (rem < 0 ? 'var(--danger)' : rem === 0 ? 'var(--accent-border)' : 'var(--border)'), borderRadius: 'var(--r-sm)', fontSize: 'var(--fs-xs)', color: rem < 0 ? 'var(--danger)' : rem === 0 ? 'var(--accent)' : 'var(--text)', fontWeight: 700, textAlign: 'center' }}>
                            این هچ: {toFa(sumE)} از {toFa(e.count || 0)}{rem > 0 && ' · باقی: ' + toFa(rem)}{rem < 0 && ' — بیشتر!'}{rem === 0 && ' ✅'}
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {editingId && (
          <>
            <SectionTitle>📊 نتیجه</SectionTitle>
            <Grid2>
              <Field label="جوجه هچ‌شده" required><NumField value={dataFor(formEntryId).hatched} onChange={ev => updateData(formEntryId, { hatched: ev.target.value })} min={0} unit="عدد" /></Field>
              <Field label="هچ‌نشده"><NumField value={dataFor(formEntryId).unhatched} onChange={ev => updateData(formEntryId, { unhatched: ev.target.value })} min={0} unit="عدد" /></Field>
            </Grid2>
            <Grid2>
              <Field label="مرده در پوسته"><NumField value={dataFor(formEntryId).deadInShell} onChange={ev => updateData(formEntryId, { deadInShell: ev.target.value })} min={0} unit="عدد" /></Field>
              <Field label="نوک‌زده"><NumField value={dataFor(formEntryId).pipped} onChange={ev => updateData(formEntryId, { pipped: ev.target.value })} min={0} unit="عدد" /></Field>
            </Grid2>
            <Grid2>
              <Field label="سایر"><NumField value={dataFor(formEntryId).other} onChange={ev => updateData(formEntryId, { other: ev.target.value })} min={0} unit="عدد" /></Field>
              <Field label="وزن متوسط"><NumField value={dataFor(formEntryId).avgWeight} onChange={ev => updateData(formEntryId, { avgWeight: ev.target.value })} min={0} unit="گرم" /></Field>
            </Grid2>
            <Grid2>
              <Field label="درجه A"><NumField value={dataFor(formEntryId).gradeA} onChange={ev => updateData(formEntryId, { gradeA: ev.target.value })} min={0} unit="عدد" /></Field>
              <Field label="درجه B"><NumField value={dataFor(formEntryId).gradeB} onChange={ev => updateData(formEntryId, { gradeB: ev.target.value })} min={0} unit="عدد" /></Field>
            </Grid2>
            <Grid2>
              <Field label="♂ نر"><NumField value={dataFor(formEntryId).maleCount} onChange={ev => updateData(formEntryId, { maleCount: ev.target.value })} min={0} unit="عدد" /></Field>
              <Field label="♀ ماده"><NumField value={dataFor(formEntryId).femaleCount} onChange={ev => updateData(formEntryId, { femaleCount: ev.target.value })} min={0} unit="عدد" /></Field>
            </Grid2>
            <Field label="? نامعلوم"><NumField value={dataFor(formEntryId).unknownCount} onChange={ev => updateData(formEntryId, { unknownCount: ev.target.value })} min={0} unit="عدد" /></Field>
            <Field label="یادداشت"><Input value={dataFor(formEntryId).notes || ''} onChange={ev => updateData(formEntryId, { notes: ev.target.value })} placeholder="..." /></Field>
          </>
        )}

        <SectionTitle>📅 تاریخ هچ</SectionTitle>
        <Field label="تاریخ" required>
          <DatePicker value={formDate} onChange={v => setFormDate(v)} placeholder="انتخاب تاریخ" />
        </Field>

        {err && <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--danger)', textAlign: 'center' }}>✕ {err}</div>}
      </Modal>

      {/* ═══ Modal گله ═══ */}
      <Modal open={!!flockModal} onClose={() => setFlockModal(null)} title="🐔 ساخت گله جدید"
        footer={<BtnRow><Btn variant="primary" onClick={createFlock}>ساخت گله</Btn><Btn onClick={() => setFlockModal(null)}>لغو</Btn></BtnRow>}>
        <Field label="نام گله" required>
          <Input placeholder="مثلاً: گله بهار ۱۴۰۵" value={flockForm.name} onChange={e => setFlockForm({...flockForm, name: e.target.value})} />
        </Field>
        <Grid2>
          <Field label="نوع" required>
            <Select value={flockForm.type} onChange={e => setFlockForm({...flockForm, type: e.target.value})}>
              <option value="layer">تخم‌گذار</option>
              <option value="broiler">گوشتی</option>
              <option value="breeder">مادر</option>
            </Select>
          </Field>
          <Field label="تعداد">
            <Input value={String(flockModal?.count || 0)} readOnly dir="ltr" unit="پرنده" />
          </Field>
        </Grid2>
        <Grid2>
          <Field label="سالن">
            <Select value={flockForm.hallId} onChange={e => setFlockForm({...flockForm, hallId: e.target.value, zoneId: ''})}>
              <option value="">—</option>
              {halls.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
            </Select>
          </Field>
          <Field label="بخش">
            <Select value={flockForm.zoneId} onChange={e => setFlockForm({...flockForm, zoneId: e.target.value})}>
              <option value="">—</option>
              {zones.filter(z => !flockForm.hallId || z.hallId === flockForm.hallId).map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
            </Select>
          </Field>
        </Grid2>
      </Modal>

      {/* ═══ Modal فروش ═══ */}
      <Modal open={!!sellModal} onClose={() => setSellModal(null)} title="📥 ثبت فروش جوجه"
        footer={<BtnRow><Btn variant="primary" onClick={doSell}>ثبت فاکتور</Btn><Btn onClick={() => setSellModal(null)}>لغو</Btn></BtnRow>}>
        <Field label="خریدار" required>
          {contacts.length === 0 ? (
            <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--muted)', padding: 10, textAlign: 'center' }}>مخاطبی نیست</div>
          ) : (
            <Select value={sellForm.buyerId} onChange={e => setSellForm({...sellForm, buyerId: e.target.value})}>
              <option value="">— انتخاب خریدار —</option>
              {contacts.filter((c: any) => (c.roles || []).includes('customer')).map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
          )}
        </Field>
        <Grid2>
          <Field label="تعداد" required><NumField value={sellForm.count} onChange={e => setSellForm({...sellForm, count: e.target.value})} max={sellModal?.count} min={0} unit="عدد" /></Field>
          <Field label="قیمت هر جوجه" required><MoneyField value={sellForm.unitPrice} onChange={e => setSellForm({...sellForm, unitPrice: e.target.value})} /></Field>
        </Grid2>
        <Field label="تاریخ"><DatePicker value={sellForm.date} onChange={v => setSellForm({...sellForm, date: v})} /></Field>
        {(() => {
          const cnt = parseInt(toEn(sellForm.count)) || 0;
          const up = parseFloat(toEn(sellForm.unitPrice).replace('٫','.')) || 0;
          const total = cnt * up;
          if (total > 0) return <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--accent-soft)', color: 'var(--accent)', borderRadius: 'var(--r-sm)', fontWeight: 700 }}><span>💰 جمع کل:</span><span>{toFa(total.toLocaleString('fa-IR'))} ت</span></div>;
          return null;
        })()}
      </Modal>

      {/* ═══ Modal حذف ═══ */}
      <Modal open={!!delId} onClose={() => setDelId(null)} title="حذف هچ"
        footer={<BtnRow><Btn variant="danger" onClick={() => delId && doDelete(delId)}>حذف کن</Btn><Btn onClick={() => setDelId(null)}>لغو</Btn></BtnRow>}>
        <div style={{ textAlign: 'center', fontSize: 'var(--fs-md)', lineHeight: 1.9 }}>
          حذف <b>{toFa(target?.hatched || 0)} جوجه</b>؟
        </div>
      </Modal>
    </PageContainer>
  );
}

function Row({ l, v }: { l: string; v: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--fs-sm)', padding: '6px 10px', background: 'var(--input-bg)', borderRadius: 'var(--r-sm)' }}>
      <span style={{ color: 'var(--muted)' }}>{l}:</span>
      <span style={{ fontWeight: 600, color: 'var(--text)' }}>{v}</span>
    </div>
  );
}

function chip(active: boolean): React.CSSProperties {
  return {
    padding: '6px 11px', fontSize: 'var(--fs-sm)',
    background: active ? 'var(--accent-soft)' : 'var(--btn-bg)',
    border: '1px solid ' + (active ? 'var(--accent-border)' : 'var(--border)'),
    borderRadius: 'var(--r-sm)',
    color: active ? 'var(--accent)' : 'var(--muted)',
    fontWeight: active ? 600 : 500, cursor: 'pointer',
    fontFamily: 'inherit', whiteSpace: 'nowrap'
  };
}
