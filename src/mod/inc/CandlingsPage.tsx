/**
 * CandlingsPage — کندلینگ با Multi-select و تجمیع
 */
import { useState, useEffect, useMemo } from 'react';
import { useInc, type Candling } from './store';
import { useBrd } from '../brd/store';
import { Btn, BtnRow, Empty, Field, Grid2, Input, Modal, NumField, PageContainer, SectionTitle, Select, Tag, ErrorBox } from '../../shr/components/ui';
import ExpandableCard, { InfoItem, StatBox, Dot } from '../../shr/components/ExpandableCard';
import DatePicker from '../../shr/components/DatePicker';
import { toFa, toEn } from '../../shr/utils/fa';
import { showAlert, showConfirmAsync } from '../../cor/store/dialog';
import { todayJalali } from './helpers';

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



// مبنا: تعداد تخم موجود برای این مرحله (از مرحله قبل یا کل ورودی)
function calcAvailableBase(entryId: string, currentStage: number, excludeCandlingId: string | null, allCandlings: any[], entryTotal: number): { base: number; source: string } {
  // همه کندلینگ‌های این ورودی (به جز خودمون اگه ویرایش می‌کنیم)
  const myCandlings = allCandlings
    .filter(c => c.eggEntryId === entryId)
    .filter(c => !excludeCandlingId || c.id !== excludeCandlingId)
    .sort((a, b) => a.stage - b.stage);

  // اگه مرحله اوله، یا هیچ کندلینگ قبلی نیست
  const prevs = myCandlings.filter(c => c.stage < currentStage);
  if (prevs.length === 0) {
    return { base: entryTotal, source: 'کل ورودی' };
  }
  const prev = prevs[prevs.length - 1];
  return { base: prev.alive || 0, source: 'مرحله ' + prev.stage };
}

export default function CandlingsPage({ initialEntry = '', onGoTo }: { initialEntry?: string; onGoTo?: (t: any, payload?: { entry?: string }) => void } = {}) {
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
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [undoData, setUndoData] = useState<{ candling: any } | null>(null);

  useEffect(() => {
    if (initialEntry) {
      const entry = eggEntries.find(e => e.id === initialEntry);
      if (entry) {
        setModalDevice(entry.deviceId);
        setSelectedIds(new Set([initialEntry]));
        setEntriesData({ [initialEntry]: emptyData() });
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

  const undoDeleteCandling = () => {
    if (!undoData) return;
    try { addCandling(undoData.candling); } catch {}
    setUndoData(null);
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
      const entry = eggEntries.find(e => e.id === editingId);
      const baseInfo = calcAvailableBase(editingId, dayNum, editingId, candlings, entry?.count || 0);
      const d = entriesData[editingId] || emptyData();
      const _inf = parseInt(toEn(d.infertile)) || 0;
      const _dead = parseInt(toEn(d.dead)) || 0;
      const _brk = parseInt(toEn(d.broken)) || 0;
      const _alive = Math.max(0, (baseInfo.base || 0) - _inf - _dead - _brk);
      if (_inf + _dead + _brk === 0 && _alive === 0) { setErr('حداقل یک مقدار وارد کنید'); return; }
      if (_inf + _dead + _brk > baseInfo.base) { setErr('مجموع بیشتر از مبنا'); return; }
      updateCandling(editingId, {
        stage: dayNum, date: modalDate,
        alive: _alive,
        infertile: _inf,
        dead: _dead,
        broken: _brk,
        infertileReason: d.infertileReason,
        deadReason: d.deadReason,
        notes: d.notes,
      });
      setOpen(false);
      setEditingId(null);
      setEntriesData({});
      return;
    }

    Array.from(selectedIds).forEach(id => {
      const entry = eggEntries.find(e => e.id === id);
      if (!entry) return;
      const d = entriesData[id] || emptyData();
      const _inf = parseInt(toEn(d.infertile)) || 0;
      const _dead = parseInt(toEn(d.dead)) || 0;
      const _brk = parseInt(toEn(d.broken)) || 0;
      const baseInfo = calcAvailableBase(id, dayNum, null, candlings, entry.count || 0);
      const _alive = Math.max(0, (baseInfo.base || 0) - _inf - _dead - _brk);
      const sum = _inf + _dead + _brk;
      if (sum === 0) { hasError = true; return; }
      if (baseInfo.base && (_inf + _dead + _brk) > baseInfo.base) { hasError = true; return; }
      addCandling({
        eggEntryId: id, stage: dayNum, date: modalDate,
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

    if (hasError && saved === 0) { setErr('هیچ کندلینگی ذخیره نشد'); return; }
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

  // ═══ گروه‌بندی + تجمیع + درصد ═══
  const grouped = useMemo(() => {
    const byEntry: Record<string, Candling[]> = {};
    candlings.forEach(c => {
      if (!byEntry[c.eggEntryId]) byEntry[c.eggEntryId] = [];
      byEntry[c.eggEntryId].push(c);
    });
    return Object.entries(byEntry).map(([entryId, list]) => {
      const agg = list.reduce((acc, c) => ({
        alive: acc.alive + (c.alive || 0),
        infertile: acc.infertile + (c.infertile || 0),
        dead: acc.dead + (c.dead || 0),
        broken: acc.broken + (c.broken || 0),
      }), { alive: 0, infertile: 0, dead: 0, broken: 0 });
      const total = agg.alive + agg.infertile + agg.dead + agg.broken;
      const entry = eggEntries.find(e => e.id === entryId);
      const entryTotal = entry?.count || 0;
      const fertilePercent = total > 0 ? (agg.alive / total * 100) : 0;
      const lossPercent = entryTotal > 0 ? ((total - agg.alive) / entryTotal * 100) : 0;
      const deadPercent = total > 0 ? ((agg.dead + agg.infertile) / total * 100) : 0;
      return { entryId, list: list.sort((a, b) => a.stage - b.stage), agg, total, entryTotal, fertilePercent, lossPercent, deadPercent };
    }).filter(({ entryId }) => {
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

  // ═══ خلاصه کل ═══
  const summary = useMemo(() => {
    const totalEntries = eggEntries.filter(e => e.status !== 'failed').length;
    const totalCandlings = candlings.length;

    // برای هر کندلینگ، از baseinfo مربوطه alive رو محاسبه کن
    const allData = candlings.map(c => {
      const entry = eggEntries.find(e => e.id === c.eggEntryId);
      const entryTotal = entry?.count || 0;
      const baseInfo = calcAvailableBase(c.eggEntryId, c.stage, c.id, candlings, entryTotal);
      const inf = c.infertile || 0;
      const dead = c.dead || 0;
      const brk = c.broken || 0;
      const alive = Math.max(0, (baseInfo.base || 0) - inf - dead - brk);
      return { alive, inf, dead, brk };
    });

    const totalAlive = allData.reduce((a, x) => a + x.alive, 0);
    const totalInfertile = allData.reduce((a, x) => a + x.inf, 0);
    const totalDead = allData.reduce((a, x) => a + x.dead, 0);
    const totalBroken = allData.reduce((a, x) => a + x.brk, 0);
    const grandTotal = totalAlive + totalInfertile + totalDead + totalBroken;
    const fertilePercent = grandTotal > 0 ? (totalAlive / grandTotal * 100) : 0;
    const lossPercent = grandTotal > 0 ? ((totalInfertile + totalDead + totalBroken) / grandTotal * 100) : 0;
    return { totalEntries, totalCandlings, totalAlive, totalInfertile, totalDead, totalBroken, fertilePercent, lossPercent };
  }, [eggEntries, candlings]);

  const dataFor = (id: string): EntryData => entriesData[id] || emptyData();

  return (
    <PageContainer>
      {undoData && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '10px 14px', marginBottom: 8,
          background: 'var(--warn-soft)',
          border: '1px solid var(--warn)',
          borderRadius: 'var(--r-md)',
          fontSize: 'var(--fs-sm)',
        }}>
          <span>کندلینگ حذف شد</span>
          <button type="button" onClick={undoDeleteCandling} style={{
            background: 'none', border: 'none',
            color: 'var(--warn)', fontWeight: 700, cursor: 'pointer',
            fontFamily: 'inherit', fontSize: 'var(--fs-sm)', padding: '4px 10px',
          }}>بازگردانی</button>
        </div>
      )}
      {/* ═══ خلاصه کل ═══ */}
      {summary.totalCandlings > 0 && (
        <div style={{
          padding: '10px 12px',
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--r-md)',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 6,
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)' }}>🧬 نطفه‌داری کل</span>
            <span style={{ fontSize: 'var(--fs-lg)', fontWeight: 700, color: 'var(--accent)' }}>{toFa(summary.fertilePercent.toFixed(1))}٪</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)' }}>📉 تلفات کل</span>
            <span style={{ fontSize: 'var(--fs-lg)', fontWeight: 700, color: summary.lossPercent > 50 ? 'var(--danger)' : summary.lossPercent > 20 ? 'var(--warn)' : 'var(--muted)' }}>{toFa(summary.lossPercent.toFixed(1))}٪</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', gridColumn: '1 / -1', paddingTop: 6, borderTop: '1px dashed var(--border)', fontSize: 'var(--fs-xs)', color: 'var(--muted)' }}>
            <span>📥 {toFa(summary.totalEntries)} ورودی</span>
            <span>🔍 {toFa(summary.totalCandlings)} کندلینگ</span>
            <span>✅ {toFa(summary.totalAlive)} سالم</span>
          </div>
        </div>
      )}

      {candlings.length > 0 && (
        <Input value={q} onChange={e => setQ(e.target.value)} placeholder="🔍 جستجو (نام پرنده، دستگاه، تاریخ...)" aria-label="جستجو در کندلینگ‌ها" />
      )}

      {candlings.length === 0 ? (
        <Empty icon={<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>}
          title="کندلینگی ثبت نشده"
          desc="کندلینگ در روزهای دلخواه انجام می‌شود."
          action={<Btn variant="primary" onClick={() => openNew()}>+ ثبت کندلینگ</Btn>} />
      ) : (
        <>
          {grouped.map(({ entryId, list, agg, total, entryTotal, fertilePercent, lossPercent, deadPercent }, i) => {
            const entry = eggEntries.find(e => e.id === entryId);
            const bird = entry ? birds.find(b => b.id === entry.birdId) : null;
            const dev = entry ? devices.find(d => d.id === entry.deviceId) : null;
            const isOpen = expandedId === entryId;
            const lossTone = lossPercent > 20 ? 'danger' : lossPercent > 10 ? 'warn' : 'green';

            return (
              <ExpandableCard key={entryId} accent="accent" index={toFa(i + 1)} iconEmoji="🔍"
                title={bird?.name || '—'}
                subtitle={(dev?.name || '—') + ' · ' + toFa(entryTotal) + ' تخم · ' + toFa(entry?.entryDate || '—')}
                isOpen={isOpen} onToggle={() => setExpandedId(isOpen ? null : entryId)}
                badge={<Tag tone={lossTone}>تلفات {toFa(lossPercent.toFixed(0))}٪</Tag>}
                stats={<>
                  <StatBox icon="🧬" label="نطفه" value={toFa(Math.round(fertilePercent)) + '٪'} tone="accent" />
                  <Dot />
                  <StatBox icon="📊" label="کندلینگ" value={toFa(list.length)} />
                </>}
              >
                {/* ═══ دکمه‌های روز ═══ */}
                <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', fontWeight: 700 }}>📅 کندلینگ‌های این ورودی</div>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {list.map((c, idx) => (
                    <div key={c.id} style={{ position: 'relative' }}>
                      <button
                        type="button"
                        onClick={() => openEdit(c)}
                        title={toFa(c.date)}
                        style={{
                          padding: '6px 12px 6px 28px',
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
                      <button
                        type="button"
                        onClick={async () => {
                          const subsequent = list.filter(x => x.stage > c.stage);
                          const msg = subsequent.length > 0
                            ? 'این کندلینگ و ' + toFa(subsequent.length) + ' کندلینگ بعدی حذف می‌شوند.\n\nادامه؟'
                            : 'این کندلینگ حذف شود؟';
                          if (await showConfirmAsync('تأیید', msg)) {
                            deleteCandling(c.id);
                            subsequent.forEach(s => deleteCandling(s.id));
                          }
                        }}
                        title="بازگردانی و حذف بعدی‌ها"
                        style={{
                          position: 'absolute',
                          top: '50%',
                          left: 4,
                          transform: 'translateY(-50%)',
                          background: 'var(--danger-soft)',
                          border: '1px solid var(--danger)',
                          color: 'var(--danger)',
                          cursor: 'pointer',
                          fontSize: 12,
                          lineHeight: 1,
                          padding: '2px 4px',
                          borderRadius: 'var(--r-sm)',
                          fontWeight: 700,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          minWidth: 16,
                          height: 36,
                        }}
                      >✕</button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => openNew(entryId)}
                    style={{
                      padding: 'var(--pad-tight)',
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
                    + کندلینگ جدید
                  </button>
                </div>

                {/* ═══ تجمیع با درصد ═══ */}
                <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', fontWeight: 700 }}>📊 تجمیع ({toFa(list.length)} کندلینگ)</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--fs-sm)', padding: 'var(--pad-normal)', background: 'var(--input-bg)', borderRadius: 'var(--r-sm)' }}>
                    <span style={{ color: 'var(--muted)' }}>🧬 نطفه‌داری</span>
                    <span style={{ fontWeight: 700, color: 'var(--accent)' }}>{toFa(fertilePercent.toFixed(1))}٪</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--fs-sm)', padding: 'var(--pad-normal)', background: 'var(--input-bg)', borderRadius: 'var(--r-sm)' }}>
                    <span style={{ color: 'var(--muted)' }}>📉 تلفات کل</span>
                    <span style={{ fontWeight: 700, color: lossPercent > 10 ? 'var(--danger)' : 'var(--text)' }}>{toFa(lossPercent.toFixed(1))}٪</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
                    <div style={{ padding: 'var(--pad-tight)', background: 'var(--input-bg)', borderRadius: 'var(--r-sm)', fontSize: 'var(--fs-xs)', display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--muted)' }}>✅ سالم</span>
                      <span style={{ fontWeight: 700 }}>{toFa(agg.alive)}</span>
                    </div>
                    <div style={{ padding: 'var(--pad-tight)', background: 'var(--input-bg)', borderRadius: 'var(--r-sm)', fontSize: 'var(--fs-xs)', display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--muted)' }}>⚪ بی‌نطفه</span>
                      <span style={{ fontWeight: 700 }}>{toFa(agg.infertile)}</span>
                    </div>
                    <div style={{ padding: 'var(--pad-tight)', background: 'var(--input-bg)', borderRadius: 'var(--r-sm)', fontSize: 'var(--fs-xs)', display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--muted)' }}>💀 مرده</span>
                      <span style={{ fontWeight: 700 }}>{toFa(agg.dead)}</span>
                    </div>
                    <div style={{ padding: 'var(--pad-tight)', background: 'var(--input-bg)', borderRadius: 'var(--r-sm)', fontSize: 'var(--fs-xs)', display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--muted)' }}>🥚 شکسته</span>
                      <span style={{ fontWeight: 700 }}>{toFa(agg.broken)}</span>
                    </div>
                  </div>
                </div>

                {/* ═══ نوار پیشرفت بصری ═══ */}
                {total > 0 && (
                  <div style={{ display: 'flex', height: 36, borderRadius: 4, overflow: 'hidden', background: 'var(--input-bg)' }}>
                    <div style={{ width: (agg.alive / total * 100) + '%', background: 'var(--accent)' }} />
                    <div style={{ width: (agg.infertile / total * 100) + '%', background: 'var(--warn)' }} />
                    <div style={{ width: (agg.dead / total * 100) + '%', background: 'var(--danger)' }} />
                    <div style={{ width: (agg.broken / total * 100) + '%', background: 'var(--muted)' }} />
                  </div>
                )}
              </ExpandableCard>
            );
          })}
          <Btn variant="primary" full onClick={() => openNew()}>+ ثبت کندلینگ</Btn>
        </>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={editingId ? '✏️ ویرایش کندلینگ' : '🔍 ثبت کندلینگ'}
        footer={<BtnRow><Btn variant="primary" onClick={save}>ذخیره ({toFa(editingId ? 1 : selectedIds.size)})</Btn><Btn onClick={() => setOpen(false)}>لغو</Btn></BtnRow>}>

        <SectionTitle>📅 زمان‌بندی</SectionTitle>
        <Grid2>
          <Field label="روز انکوباسیون" required hint="۷، ۱۰، ۱۵...">
            <NumField value={modalDay} onChange={e => setModalDay(e.target.value)} unit="روز" min={1} max={30} autoClamp />
          </Field>
          <Field label="تاریخ" required>
            <DatePicker value={modalDate} onChange={v => setModalDate(v)} placeholder="انتخاب"  autoToday />
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
              const sum = (parseInt(toEn(d.infertile))||0) + (parseInt(toEn(d.dead))||0) + (parseInt(toEn(d.broken))||0);
              const dayNum = parseInt(toEn(modalDay)) || 0;
              const baseInfo = calcAvailableBase(e.id, dayNum, null, candlings, e.count || 0);
              const remaining = baseInfo.base - sum;
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
                    <input type="checkbox" checked={isSelected} onChange={() => toggleEntry(e.id)} aria-label="انتخاب این ورودی" style={{ width: 20, height: 20, accentColor: 'var(--accent)', cursor: 'pointer', flexShrink: 0 }} />
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

                  {/* مبنا */}
                  <div style={{
                    fontSize: 'var(--fs-xs)',
                    padding: 'var(--pad-tight)',
                    background: 'var(--accent-soft)',
                    border: '1px solid var(--accent-border)',
                    borderRadius: 'var(--r-sm)',
                    color: 'var(--accent)',
                    fontWeight: 700,
                    display: 'flex',
                    justifyContent: 'space-between',
                  }}>
                    <span>🎯 مبنای این کندلینگ:</span>
                    <span>{toFa(baseInfo.base)} تخم ({baseInfo.source})</span>
                  </div>

                  {isSelected && (
                    <>
                      <Grid2>
                        <Field label="بی‌نطفه"><NumField placeholder="۰" value={d.infertile} onChange={ev => updateEntryData(e.id, { infertile: ev.target.value })} max={e.count || 0} min={0} unit="عدد" autoClamp /></Field>
                        <Field label="سالم" hint="خودکار">
                          {(() => {
                            const _inf = parseInt(toEn(d.infertile)) || 0;
                            const _dead = parseInt(toEn(d.dead)) || 0;
                            const _brk = parseInt(toEn(d.broken)) || 0;
                            const _base = baseInfo.base || 0;
                            const _alive = Math.max(0, _base - _inf - _dead - _brk);
                            const _over = (_inf + _dead + _brk) > _base;
                            return (
                              <div style={{
                                height: 38, display: "flex", alignItems: "center", justifyContent: "flex-end",
                                padding: "0 12px",
                                background: _over ? "var(--danger-soft)" : "var(--accent-soft)",
                                border: "1px solid " + (_over ? "var(--danger)" : "var(--accent-border)"),
                                borderRadius: "var(--r-md)",
                                fontSize: "var(--fs-base)", fontWeight: 700,
                                color: _over ? "var(--danger)" : "var(--accent)",
                              }}>{toFa(_alive)} عدد</div>
                            );
                          })()}
                        </Field>
                      </Grid2>
                      <Grid2>
                        <Field label="مرده"><NumField placeholder="۰" value={d.dead} onChange={ev => updateEntryData(e.id, { dead: ev.target.value })} max={e.count || 0} min={0} unit="عدد" autoClamp /></Field>
                        <Field label="شکسته"><NumField placeholder="۰" value={d.broken} onChange={ev => updateEntryData(e.id, { broken: ev.target.value })} max={e.count || 0} min={0} unit="عدد" autoClamp /></Field>
                      </Grid2>

                      <div style={{
                        padding: 'var(--pad-tight)',
                        background: remaining < 0 ? 'var(--danger-soft)' : remaining === 0 ? 'var(--accent-soft)' : 'var(--input-bg)',
                        border: '1px solid ' + (remaining < 0 ? 'var(--danger)' : remaining === 0 ? 'var(--accent-border)' : 'var(--border)'),
                        borderRadius: 'var(--r-sm)',
                        fontSize: 'var(--fs-xs)',
                        color: remaining < 0 ? 'var(--danger)' : remaining === 0 ? 'var(--accent)' : 'var(--text)',
                        fontWeight: 700,
                        textAlign: 'center',
                      }}>
                        مجموع تلفات: {toFa(sum)} از {toFa(baseInfo.base)}
                        {remaining > 0 && ' · باقی — ' + toFa(remaining)}
                        {remaining < 0 && ' — بیشتر از مبنای مرحله قبل!'}
                        {remaining === 0 && ' ✅ کامل'}
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

        <ErrorBox>{err}</ErrorBox>
      </Modal>

      <Modal open={!!delId} onClose={() => setDelId(null)} title="حذف کندلینگ"
        footer={<BtnRow><Btn variant="danger" onClick={() => {
          if (!delId) return;
          const item = candlings.find((x: any) => x.id === delId);
          if (item) {
            setUndoData({ candling: item });
            setTimeout(() => setUndoData(cur => cur && cur.candling.id === item.id ? null : cur), 6000);
          }
          deleteCandling(delId);
          setDelId(null);
        }}>حذف کن</Btn><Btn onClick={() => setDelId(null)}>لغو</Btn></BtnRow>}>
        <div style={{ textAlign: 'center', fontSize: 'var(--fs-md)' }}>حذف کندلینگ روز {toFa(target?.stage || 0)}؟</div>
      </Modal>
    </PageContainer>
  );
}
