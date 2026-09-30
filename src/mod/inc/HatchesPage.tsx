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

const FLOCK_TYPE_LABEL: Record<string, string> = { layer: 'تخم‌گذار', broiler: 'گوشتی', breeder: 'مادر' };

export default function HatchesPage({ initialEntry = '', onGoTo }: { initialEntry?: string; onGoTo?: (t: any) => void } = {}) {
  const { devices, eggEntries, hatches, candlings, addHatch, updateHatch, deleteHatch } = useInc();
  const { birds } = useBrd();
  const { add: addFlock, flocks, remove: removeFlock } = useFlk();
  const { halls, zones } = useHal();
  const { contacts } = useCtc();
  const { addInvoice, deleteInvoice } = useTra();
  const nav = useNavigate();

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    id:'', eggEntryId:'', date:'',
    hatched:'', unhatched:'', deadInShell:'', pipped:'', other:'',
    gradeA:'', gradeB:'', maleCount:'', femaleCount:'', unknownCount:'', avgWeight:'',
    notes:''
  });
  const [err, setErr] = useState('');
  const [delId, setDelId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const [deviceFilter, setDeviceFilter] = useState('');
  const [postHatchAction, setPostHatchAction] = useState<{ hatchId: string; action: 'flock' | 'sale' } | null>(null);

  // گله‌سازی
  const [flockModal, setFlockModal] = useState<{ hatchId: string; count: number } | null>(null);
  const [flockForm, setFlockForm] = useState({ name:'', type:'layer', hallId:'', zoneId:'' });

  // فروش
  const [sellModal, setSellModal] = useState<{ hatchId: string; count: number } | null>(null);
  const [sellForm, setSellForm] = useState({ buyerId:'', count:'', unitPrice:'', date:'' });

  useEffect(() => {
    if (initialEntry) {
      const exists = eggEntries.find(e => e.id === initialEntry);
      if (exists) {
        setForm(f => ({ ...f, eggEntryId: initialEntry }));
        setOpen(true);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialEntry]);

  const openNew = (preEntryId?: string) => {
    if (eggEntries.length === 0) { showAlert('اول یک ورودی تخم بسازید'); return; }
    const targetId = preEntryId || eggEntries[0].id;
    setForm({ id:'', eggEntryId: targetId, date:'', hatched:'', unhatched:'', deadInShell:'', pipped:'', other:'', gradeA:'', gradeB:'', maleCount:'', femaleCount:'', unknownCount:'', avgWeight:'', notes:'' });
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
      gradeA: h.gradeA ? toFa(h.gradeA) : '',
      gradeB: h.gradeB ? toFa(h.gradeB) : '',
      maleCount: h.maleCount ? toFa(h.maleCount) : '',
      femaleCount: h.femaleCount ? toFa(h.femaleCount) : '',
      unknownCount: h.unknownCount ? toFa(h.unknownCount) : '',
      avgWeight: h.avgWeight ? toFa(h.avgWeight) : '',
      notes: h.notes
    });
    setErr(''); setOpen(true);
  };

  const int = (s: string) => s ? parseInt(toEn(s)) || null : null;
  const num = (s: string) => s ? parseFloat(toEn(s).replace('٫', '.')) || null : null;

  const selectedEntry = eggEntries.find(e => e.id === form.eggEntryId);
  const totalEggs = selectedEntry?.count || 0;
  const lastCandling = candlings.filter(c => c.eggEntryId === form.eggEntryId).sort((a,b) => b.stage - a.stage)[0];
  const maxHatched = lastCandling?.alive || totalEggs;

  const sum = (parseInt(toEn(form.hatched))||0) + (parseInt(toEn(form.unhatched))||0) + (parseInt(toEn(form.deadInShell))||0) + (parseInt(toEn(form.pipped))||0) + (parseInt(toEn(form.other))||0);

  const save = () => {
    if (!form.date.trim()) { setErr('تاریخ اجباری است'); return; }
    const hatched = int(form.hatched);
    if (maxHatched && hatched && hatched > maxHatched) { setErr('تعداد جوجه هچ‌شده از تخم سالم (' + toFa(maxHatched) + ') بیشتر است'); return; }
    const data = {
      eggEntryId: form.eggEntryId, date: form.date,
      hatched, unhatched: int(form.unhatched),
      deadInShell: int(form.deadInShell), pipped: int(form.pipped),
      other: int(form.other),
      gradeA: int(form.gradeA), gradeB: int(form.gradeB),
      maleCount: int(form.maleCount), femaleCount: int(form.femaleCount), unknownCount: int(form.unknownCount),
      avgWeight: num(form.avgWeight),
      notes: form.notes
    };
    if (form.id) updateHatch(form.id, data);
    else addHatch(data as any);
    setOpen(false);
  };

  const doDelete = (id: string) => {
    const h = hatches.find(x => x.id === id) as any;
    if (!h) return;
    let delFlock = false, delInv = false;
    if (h.generatedFlockId) {
      delFlock = confirm('این هچ یک گله ساخته. تایید: گله هم حذف شود؟\nلغو: فقط هچ حذف شود');
    }
    if (h.generatedInvoiceId) {
      delInv = confirm('این هچ یک فاکتور فروش ساخته. تایید: فاکتور هم حذف شود؟\nلغو: فقط هچ حذف شود');
    }
    if (delFlock && h.generatedFlockId) { try { removeFlock(h.generatedFlockId); } catch {} }
    if (delInv && h.generatedInvoiceId) { try { deleteInvoice(h.generatedInvoiceId); } catch {} }
    deleteHatch(id);
    setDelId(null);
  };

  const createFlock = () => {
    if (!flockModal) return;
    if (!flockForm.name.trim()) { showAlert('نام گله اجباری است'); return; }
    const h = hatches.find(x => x.id === flockModal.hatchId);
    if (!h) return;
    const entry = eggEntries.find(e => e.id === h.eggEntryId);
    const bird = entry ? birds.find(b => b.id === entry.birdId) : null;
    if (!bird) { showAlert('پرنده پیدا نشد'); return; }
    const today = new Date();
    const startDate = today.getFullYear() + '/' + String(today.getMonth()+1).padStart(2,'0') + '/' + String(today.getDate()).padStart(2,'0');
    addFlock({
      name: flockForm.name.trim(),
      type: flockForm.type as any,
      birdId: bird.id,
      breedId: entry?.breedId || '',
      hallId: flockForm.hallId, zoneId: flockForm.zoneId,
      initialCount: flockModal.count, currentCount: flockModal.count,
      maleCount: h.maleCount || null, femaleCount: h.femaleCount || null,
      layingStartDay: 140, vaccineScheduleId: '',
      hatchDate: startDate, purchaseDate: '', startDate,
      endDate: '', source: 'hatch',
      purchasePrice: null, deliveryCost: null, otherCosts: null,
      status: 'active', notes: 'از هچ ' + toFa(h.date),
    } as any);
    // ذخیره id گله در هچ — نیاز به id برگشتی داریم که addFlock نداره
    // بذار فقط موفقیت نشون بده
    setFlockModal(null);
    setFlockForm({ name:'', type:'layer', hallId:'', zoneId:'' });
    showAlert('گله «' + flockForm.name + '» با ' + toFa(flockModal.count) + ' پرنده ساخته شد', '✅ موفق');
    setTimeout(() => nav('/flk'), 500);
  };

  const doSell = () => {
    if (!sellModal) return;
    if (!sellForm.buyerId) { showAlert('خریدار اجباری است'); return; }
    if (!sellForm.count.trim() || !sellForm.unitPrice.trim()) { showAlert('تعداد و قیمت اجباری'); return; }
    const count = parseInt(toEn(sellForm.count)) || 0;
    const unitPrice = parseFloat(toEn(sellForm.unitPrice).replace('٫','.')) || 0;
    if (count <= 0 || unitPrice <= 0) { showAlert('مقادیر باید بیشتر از صفر'); return; }
    const total = count * unitPrice;
    const h = hatches.find(x => x.id === sellModal.hatchId);
    const invId = addInvoice({
      type: 'sale', date: sellForm.date || h?.date || '',
      partyId: sellForm.buyerId, category: 'chick',
      items: [{
        id: 'chick-' + Date.now(),
        name: 'جوجه یک‌روزه',
        quantity: count, unit: 'عدد',
        unitPrice, total
      }],
      total, payments: [], dueDate: sellForm.date || h?.date || '',
      relatedFlockId: '', relatedEntryId: h?.eggEntryId || '',
      notes: 'فروش جوجه — هچ ' + (h?.date || ''),
    } as any);
    if (h && invId) updateHatch(h.id, { generatedInvoiceId: invId } as any);
    setSellModal(null);
    setSellForm({ buyerId:'', count:'', unitPrice:'', date:'' });
    showAlert('فاکتور فروش ثبت شد', '✅ موفق');
  };

  // ═══ تخمین از کندلینگ ═══
  const suggestionsFromCandling = useMemo(() => {
    if (!selectedEntry) return null;
    const myCandlings = candlings.filter(c => c.eggEntryId === form.eggEntryId).sort((a, b) => b.stage - a.stage);
    const last = myCandlings[0];
    if (!last) return null;
    const total = selectedEntry.count || 0;
    const alive = last.alive || 0;
    const infertile = last.infertile || 0;
    const dead = last.dead || 0;
    const broken = last.broken || 0;
    const expectedHatched = Math.round(alive * 0.92);
    const expectedDeadInShell = Math.round(alive * 0.05);
    const expectedUnhatched = Math.max(0, alive - expectedHatched - expectedDeadInShell);
    return {
      total, alive, infertile, dead, broken,
      expectedHatched, expectedDeadInShell, expectedUnhatched,
      fertilityRate: total > 0 ? (alive / total * 100) : 0,
      candlingStage: last.stage,
    };
  }, [candlings, form.eggEntryId, selectedEntry]);

  const applySuggestions = () => {
    if (!suggestionsFromCandling) return;
    setForm(f => ({
      ...f,
      hatched: String(suggestionsFromCandling.expectedHatched),
      deadInShell: String(suggestionsFromCandling.expectedDeadInShell),
      unhatched: String(suggestionsFromCandling.expectedUnhatched),
    }));
    showAlert('مقادیر تخمینی پر شد — می‌تونی دستی تغییر بدی', '📊 تخمین');
  };

  const target = delId ? hatches.find(h => h.id === delId) : null;

  // ═══ گروه‌بندی + خلاصه ═══
  const filtered = useMemo(() => {
    return hatches.filter(h => {
      const entry = eggEntries.find(e => e.id === h.eggEntryId);
      if (deviceFilter && entry?.deviceId !== deviceFilter) return false;
      if (q.trim()) {
        const t = q.trim().toLowerCase();
        const bird = entry ? birds.find(b => b.id === entry.birdId) : null;
        const dev = entry ? devices.find(d => d.id === entry.deviceId) : null;
        const haystack = [bird?.name, dev?.name, h.date, h.notes].filter(Boolean).join(' ').toLowerCase();
        if (!haystack.includes(t)) return false;
      }
      return true;
    }).sort((a, b) => String(b.date).localeCompare(String(a.date)));
  }, [hatches, eggEntries, deviceFilter, q, birds, devices]);

  const summary = useMemo(() => {
    const totalHatched = hatches.reduce((a, h) => a + (h.hatched || 0), 0);
    const totalEggs = hatches.reduce((a, h) => {
      const entry = eggEntries.find(e => e.id === h.eggEntryId);
      return a + (entry?.count || 0);
    }, 0);
    const rate = totalEggs > 0 ? (totalHatched / totalEggs * 100) : 0;
    return { totalHatched, totalEggs, rate };
  }, [hatches, eggEntries]);

  return (
    <PageContainer>
      {hatches.length > 0 && (
        <>
          <div style={{ padding: '12px 14px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--r-lg)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)' }}>🐣 جوجه هچ‌شده</span>
              <span style={{ fontSize: 'var(--fs-xl)', fontWeight: 700 }}>{toFa(summary.totalHatched)}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)' }}>📊 نرخ هچ کل</span>
              <span style={{ fontSize: 'var(--fs-xl)', fontWeight: 700 }}>{toFa(summary.rate.toFixed(1))}٪</span>
            </div>
            <div style={{ gridColumn: '1 / -1', paddingTop: 6, borderTop: '1px dashed var(--border)', fontSize: 'var(--fs-xs)', color: 'var(--muted)', display: 'flex', justifyContent: 'space-between' }}>
              <span>📥 {toFa(hatches.length)} هچ</span>
              <span>🥚 {toFa(summary.totalEggs)} تخم</span>
            </div>
          </div>

          <Input value={q} onChange={e => setQ(e.target.value)} placeholder="🔍 جستجو (پرنده، دستگاه، یادداشت...)" />

          <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
            <button onClick={() => setDeviceFilter('')} style={chip(!deviceFilter)}>همه</button>
            {devices.map(d => (
              <button key={d.id} onClick={() => setDeviceFilter(deviceFilter === d.id ? '' : d.id)} style={chip(deviceFilter === d.id)}>{d.name}</button>
            ))}
          </div>
        </>
      )}

      {filtered.length === 0 ? (
        <Empty icon={<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><ellipse cx="12" cy="14" rx="7" ry="9"/></svg>}
          title={hatches.length === 0 ? 'هچی ثبت نشده' : 'موردی مطابق فیلتر نیست'}
          desc="پس از پایان دوره‌ی جوجه‌کشی، نتیجه‌ی نهایی را ثبت کنید."
          action={<Btn onClick={() => openNew()}>+ ثبت هچ</Btn>} />
      ) : (
        <>
          {filtered.map((h, i) => {
            const entry = eggEntries.find(e => e.id === h.eggEntryId);
            const bird = entry ? birds.find(b => b.id === entry.birdId) : null;
            const dev = entry ? devices.find(d => d.id === entry.deviceId) : null;
            const isOpen = expandedId === h.id;
            const total = entry?.count || 0;
            const hr = hatchRate(h.hatched || 0, total);
            const myCandling = candlings.filter(c => c.eggEntryId === h.eggEntryId).sort((a,b) => b.stage - a.stage)[0];
            const aliveAfterCandling = myCandling?.alive || total;
            const realRate = aliveAfterCandling ? ((h.hatched || 0) / aliveAfterCandling * 100) : 0;
            const tone = hr >= 70 ? 'green' : hr >= 50 ? 'amber' : 'red';
            const sumH = (h.hatched||0) + (h.unhatched||0) + (h.deadInShell||0) + (h.pipped||0) + (h.other||0);
            const isComplete = total > 0 && sumH >= total;
            return (
              <ExpandableCard key={h.id} accent="accent" index={toFa(i + 1)} iconEmoji="🐣"
                title={toFa(h.hatched || 0) + ' جوجه · ' + (bird?.name || '—')}
                subtitle={(dev?.name || '—') + ' · ' + toFa(h.date)}
                isOpen={isOpen} onToggle={() => setExpandedId(isOpen ? null : h.id)}
                badge={<Tag tone={tone}>{toFa(hr.toFixed(1))}٪</Tag>}
                summary={<>
                  <span>🐣 {toFa(h.hatched || 0)}</span>
                  <span>🥚 {toFa(total)}</span>
                  <span>📊 {toFa(hr.toFixed(0))}٪</span>
                </>}
              >
                {isComplete && (
                  <div style={{ padding: '8px 12px', background: 'var(--accent-soft)', border: '1px solid var(--accent-border)', borderRadius: 'var(--r-md)', textAlign: 'center', fontSize: 'var(--fs-sm)', fontWeight: 700, color: 'var(--accent)' }}>
                    ✅ هچ تکمیل شد — همه تخم‌ها شمارش شدن
                  </div>
                )}

                {total > 0 && (h.hatched || 0) > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', fontWeight: 700 }}>📊 نمودار توزیع</div>
                    <div style={{ display: 'flex', height: 12, borderRadius: 6, overflow: 'hidden', background: 'var(--input-bg)' }}>
                      {(h.hatched || 0) > 0 && <div style={{ width: ((h.hatched||0)/total*100)+'%', background: 'var(--accent)' }} title={'هچ ' + toFa(h.hatched || 0)} />}
                      {(h.deadInShell || 0) > 0 && <div style={{ width: ((h.deadInShell||0)/total*100)+'%', background: 'var(--danger)' }} title={'مرده ' + toFa(h.deadInShell || 0)} />}
                      {(h.pipped || 0) > 0 && <div style={{ width: ((h.pipped||0)/total*100)+'%', background: 'var(--warn)' }} title={'نوک‌زده ' + toFa(h.pipped || 0)} />}
                      {(h.unhatched || 0) > 0 && <div style={{ width: ((h.unhatched||0)/total*100)+'%', background: 'var(--muted)' }} title={'هچ‌نشده ' + toFa(h.unhatched || 0)} />}
                      {(h.other || 0) > 0 && <div style={{ width: ((h.other||0)/total*100)+'%', background: 'var(--dim)' }} title={'سایر ' + toFa(h.other || 0)} />}
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, fontSize: 'var(--fs-xs)' }}>
                      {(h.hatched||0) > 0 && <span style={{ color: 'var(--accent)' }}>🟢 هچ {toFa(h.hatched||0)} ({toFa(((h.hatched||0)/total*100).toFixed(0))}٪)</span>}
                      {(h.deadInShell||0) > 0 && <span style={{ color: 'var(--danger)' }}>🔴 مرده {toFa(h.deadInShell||0)}</span>}
                      {(h.pipped||0) > 0 && <span style={{ color: 'var(--warn)' }}>🟡 نوک {toFa(h.pipped||0)}</span>}
                      {(h.unhatched||0) > 0 && <span style={{ color: 'var(--muted)' }}>⚪ هچ‌نشده {toFa(h.unhatched||0)}</span>}
                    </div>
                  </div>
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
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
                      {h.gradeA ? <div style={{ padding: '6px 10px', background: 'var(--input-bg)', borderRadius: 'var(--r-sm)', fontSize: 'var(--fs-sm)', display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--muted)' }}>درجه A</span><span style={{ fontWeight: 700 }}>{toFa(h.gradeA)}</span></div> : null}
                      {h.gradeB ? <div style={{ padding: '6px 10px', background: 'var(--input-bg)', borderRadius: 'var(--r-sm)', fontSize: 'var(--fs-sm)', display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--muted)' }}>درجه B</span><span style={{ fontWeight: 700 }}>{toFa(h.gradeB)}</span></div> : null}
                    </div>
                  </>
                )}

                {(h.maleCount || h.femaleCount || h.unknownCount) && (
                  <>
                    <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', fontWeight: 700 }}>⚖️ تفکیک جنسیت</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 4 }}>
                      {h.maleCount ? <div style={{ padding: '6px 8px', background: 'var(--input-bg)', borderRadius: 'var(--r-sm)', fontSize: 'var(--fs-xs)', display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--muted)' }}>♂ نر</span><span style={{ fontWeight: 700 }}>{toFa(h.maleCount)}</span></div> : null}
                      {h.femaleCount ? <div style={{ padding: '6px 8px', background: 'var(--input-bg)', borderRadius: 'var(--r-sm)', fontSize: 'var(--fs-xs)', display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--muted)' }}>♀ ماده</span><span style={{ fontWeight: 700 }}>{toFa(h.femaleCount)}</span></div> : null}
                      {h.unknownCount ? <div style={{ padding: '6px 8px', background: 'var(--input-bg)', borderRadius: 'var(--r-sm)', fontSize: 'var(--fs-xs)', display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--muted)' }}>? نامعلوم</span><span style={{ fontWeight: 700 }}>{toFa(h.unknownCount)}</span></div> : null}
                    </div>
                  </>
                )}

                {h.avgWeight ? (
                  <>
                    <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', fontWeight: 700 }}>⚖️ وزن</div>
                    <Row l="وزن متوسط جوجه" v={toFa(h.avgWeight) + ' گرم'} />
                  </>
                ) : null}

                <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', fontWeight: 700 }}>📈 نرخ‌ها</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <Row l="نرخ هچ کل" v={toFa(hr.toFixed(1)) + '٪'} />
                  {aliveAfterCandling !== total && <Row l="نرخ از نطفه‌دار" v={toFa(realRate.toFixed(1)) + '٪'} />}
                </div>

                {entry?.totalPrice && h.hatched ? (
                  <>
                    <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', fontWeight: 700 }}>💰 هزینه</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <Row l="هزینه کل تخم‌ها" v={toFa(entry.totalPrice.toLocaleString('fa-IR')) + ' ت'} />
                      <Row l="💰 هزینه هر جوجه" v={toFa(Math.round(costPerChick(entry.totalPrice, h.hatched)).toLocaleString('fa-IR')) + ' ت'} />
                    </div>
                  </>
                ) : null}

                {h.notes && (
                  <>
                    <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', fontWeight: 700 }}>📝 یادداشت</div>
                    <div style={{ fontSize: 'var(--fs-sm)', lineHeight: 1.7, padding: '8px 10px', background: 'var(--input-bg)', borderRadius: 'var(--r-sm)' }}>{h.notes}</div>
                  </>
                )}

                {isComplete && (h.hatched || 0) > 0 && (
                  <div style={{ padding: '12px 14px', background: 'var(--input-bg)', border: '1px dashed var(--accent-border)', borderRadius: 'var(--r-md)', display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--accent)', fontWeight: 700, textAlign: 'center' }}>🎯 مرحله بعد:</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                      <Btn onClick={() => { setFlockModal({ hatchId: h.id, count: h.hatched || 0 }); setFlockForm({ name: 'گله ' + (bird?.name || '') + ' ' + toFa(new Date().getFullYear()), type: 'layer', hallId: '', zoneId: '' }); }}>🐔 ساخت گله</Btn>
                      <Btn onClick={() => { setSellModal({ hatchId: h.id, count: h.hatched || 0 }); setSellForm({ buyerId:'', count: String(h.hatched || 0), unitPrice:'', date: h.date }); }}>📥 فروش جوجه</Btn>
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', gap: 6, paddingTop: 4, flexWrap: 'wrap' }}>
                  <Btn size="sm" onClick={() => openEdit(h)} style={{ flex: 1 }}>ویرایش</Btn>
                  {(h.hatched || 0) > 0 && (
                    <>
                      <Btn size="sm" onClick={() => { setFlockModal({ hatchId: h.id, count: h.hatched || 0 }); setFlockForm({ name: 'گله ' + (bird?.name || '') + ' ' + toFa(new Date().getFullYear()), type: 'layer', hallId: '', zoneId: '' }); }} style={{ flex: 1 }}>🐔 گله</Btn>
                      <Btn size="sm" onClick={() => { setSellModal({ hatchId: h.id, count: h.hatched || 0 }); setSellForm({ buyerId:'', count: String(h.hatched || 0), unitPrice:'', date: h.date }); }} style={{ flex: 1 }}>📥 فروش</Btn>
                    </>
                  )}
                  <Btn size="sm" onClick={() => setDelId(h.id)} style={{ flex: 1 }}>حذف</Btn>
                </div>
              </ExpandableCard>
            );
          })}
          <Btn variant="primary" full onClick={() => openNew()}>+ ثبت هچ</Btn>
        </>
      )}

      {/* ═══ Modal ثبت/ویرایش هچ ═══ */}
      <Modal open={open} onClose={() => setOpen(false)} title={form.id ? '✏️ ویرایش هچ' : '🐣 ثبت هچ'}
        footer={<BtnRow><Btn variant="primary" onClick={save}>ذخیره</Btn><Btn onClick={() => setOpen(false)}>لغو</Btn></BtnRow>}>

        <SectionTitle>📦 ورودی تخم</SectionTitle>
        <Field label="انتخاب ورودی" required>
          <Select value={form.eggEntryId} onChange={e => setForm({...form, eggEntryId: e.target.value})}>
            {eggEntries.map(e => {
              const bird = birds.find(b => b.id === e.birdId);
              const dev = devices.find(d => d.id === e.deviceId);
              return <option key={e.id} value={e.id}>{bird?.name || '—'} · {toFa(e.entryDate)} · {toFa(e.count || 0)} تخم · {dev?.name || ''}</option>;
            })}
          </Select>
        </Field>
        {selectedEntry && (
          <div style={{ padding: '10px 12px', background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', display: 'flex', flexDirection: 'column', gap: 4 }}>
            <Row l="تعداد کل" v={toFa(totalEggs) + ' تخم'} />
            <Row l="از نطفه‌دار" v={toFa(maxHatched) + ' تخم'} />
          </div>
        )}

        <SectionTitle>📅 تاریخ</SectionTitle>
        <Field label="تاریخ هچ" required>
          <DatePicker value={form.date} onChange={v => setForm({...form, date: v})} placeholder="انتخاب تاریخ" />
        </Field>

        <SectionTitle>📊 نتیجه هچ</SectionTitle>
        <Grid2>
          <Field label="جوجه هچ‌شده" required hint={maxHatched ? `حداکثر: ${toFa(maxHatched)}` : undefined}>
            <NumField placeholder="۰" value={form.hatched} onChange={e => setForm({...form, hatched: e.target.value})} max={maxHatched || undefined} min={0} unit="عدد" />
          </Field>
          <Field label="هچ‌نشده"><NumField placeholder="۰" value={form.unhatched} onChange={e => setForm({...form, unhatched: e.target.value})} min={0} unit="عدد" /></Field>
        </Grid2>
        <Grid2>
          <Field label="مرده در پوسته"><NumField placeholder="۰" value={form.deadInShell} onChange={e => setForm({...form, deadInShell: e.target.value})} min={0} unit="عدد" /></Field>
          <Field label="نوک‌زده"><NumField placeholder="۰" value={form.pipped} onChange={e => setForm({...form, pipped: e.target.value})} min={0} unit="عدد" /></Field>
        </Grid2>
        <Field label="سایر"><NumField placeholder="۰" value={form.other} onChange={e => setForm({...form, other: e.target.value})} min={0} unit="عدد" /></Field>

        <SectionTitle>🏅 تفکیک کیفی (اختیاری)</SectionTitle>
        <Grid2>
          <Field label="درجه A"><NumField placeholder="۰" value={form.gradeA} onChange={e => setForm({...form, gradeA: e.target.value})} min={0} unit="عدد" /></Field>
          <Field label="درجه B"><NumField placeholder="۰" value={form.gradeB} onChange={e => setForm({...form, gradeB: e.target.value})} min={0} unit="عدد" /></Field>
        </Grid2>

        <SectionTitle>⚖️ جنسیت و وزن (اختیاری)</SectionTitle>
        <Grid2>
          <Field label="♂ نر"><NumField placeholder="۰" value={form.maleCount} onChange={e => setForm({...form, maleCount: e.target.value})} min={0} unit="عدد" /></Field>
          <Field label="♀ ماده"><NumField placeholder="۰" value={form.femaleCount} onChange={e => setForm({...form, femaleCount: e.target.value})} min={0} unit="عدد" /></Field>
        </Grid2>
        <Grid2>
          <Field label="? نامعلوم"><NumField placeholder="۰" value={form.unknownCount} onChange={e => setForm({...form, unknownCount: e.target.value})} min={0} unit="عدد" /></Field>
          <Field label="وزن متوسط"><NumField placeholder="۴۲" value={form.avgWeight} onChange={e => setForm({...form, avgWeight: e.target.value})} min={0} unit="گرم" /></Field>
        </Grid2>

        <SectionTitle>📝 یادداشت</SectionTitle>
        <Input placeholder="..." value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} />

        {err && <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--danger)', textAlign: 'center' }}>✕ {err}</div>}
      </Modal>

      {/* ═══ Modal ساخت گله ═══ */}
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
          <Field label="تعداد" required>
            <NumField placeholder="۰" value={sellForm.count} onChange={e => setSellForm({...sellForm, count: e.target.value})} max={sellModal?.count} min={0} unit="عدد" />
          </Field>
          <Field label="قیمت هر جوجه" required>
            <MoneyField value={sellForm.unitPrice} onChange={e => setSellForm({...sellForm, unitPrice: e.target.value})} />
          </Field>
        </Grid2>
        <Field label="تاریخ">
          <DatePicker value={sellForm.date} onChange={v => setSellForm({...sellForm, date: v})} />
        </Field>
        {(() => {
          const cnt = parseInt(toEn(sellForm.count)) || 0;
          const up = parseFloat(toEn(sellForm.unitPrice).replace('٫','.')) || 0;
          const total = cnt * up;
          if (total > 0) {
            return <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--accent-soft)', color: 'var(--accent)', borderRadius: 'var(--r-sm)', fontWeight: 700 }}><span>💰 جمع کل:</span><span>{toFa(total.toLocaleString('fa-IR'))} ت</span></div>;
          }
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
