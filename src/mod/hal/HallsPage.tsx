import { useState } from 'react';
import { useHal, type Hall, VENT_SYS_LABELS, FEEDER_LABELS, DRINKER_LABELS, LITTER_LABELS } from './store';
import { Btn, BtnRow, Empty, Field, Grid2, Grid3, Input, Modal, PageContainer, Select, Tag } from '../../shr/components/ui';
import ExpandableCard from '../../shr/components/ExpandableCard';
import { toFa, toEn } from '../../shr/utils/fa';

interface F { id?: string; name: string; code: string; length: string; width: string; height: string; capacity: string; targetTemp: string; targetHumidity: string; ventilation: string; light: string; ventilationSystem: string; feederType: string; drinkerType: string; litterType: string; address: string; builtAt: string; lastSanitizedAt: string; notes: string; }
const empty: F = { name:'', code:'', length:'', width:'', height:'', capacity:'', targetTemp:'', targetHumidity:'', ventilation:'', light:'', ventilationSystem:'tunnel', feederType:'chain', drinkerType:'nipple', litterType:'wood_shavings', address:'', builtAt:'', lastSanitizedAt:'', notes:'' };

export default function HallsPage() {
  const { halls, zones, equipment, addHall, updateHall, deleteHall } = useHal();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<F>(empty);
  const [err, setErr] = useState('');
  const [delId, setDelId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const openNew = () => { setForm(empty); setErr(''); setOpen(true); };
  const openEdit = (h: Hall) => {
    setForm({
      id: h.id, name: h.name, code: h.code,
      length: h.length ? toFa(h.length) : '', width: h.width ? toFa(h.width) : '', height: h.height ? toFa(h.height) : '',
      capacity: h.capacity ? toFa(h.capacity) : '', targetTemp: h.targetTemp ? toFa(h.targetTemp) : '', targetHumidity: h.targetHumidity ? toFa(h.targetHumidity) : '',
      ventilation: h.ventilation ? toFa(h.ventilation) : '', light: h.light ? toFa(h.light) : '',
      ventilationSystem: h.ventilationSystem || 'tunnel', feederType: h.feederType || 'chain', drinkerType: h.drinkerType || 'nipple', litterType: h.litterType || 'wood_shavings',
      address: h.address, builtAt: h.builtAt, lastSanitizedAt: h.lastSanitizedAt, notes: h.notes
    });
    setErr(''); setOpen(true);
  };
  const num = (s: string) => s ? parseFloat(toEn(s).replace('٫','.')) || null : null;
  const save = () => {
    if (!form.name.trim()) { setErr('نام سالن اجباری است'); return; }
    const data = {
      name: form.name.trim(), code: form.code.trim(),
      length: num(form.length), width: num(form.width), height: num(form.height),
      capacity: form.capacity ? parseInt(toEn(form.capacity)) || null : null,
      targetTemp: num(form.targetTemp), targetHumidity: num(form.targetHumidity),
      ventilation: num(form.ventilation), light: num(form.light),
      ventilationSystem: form.ventilationSystem, feederType: form.feederType, drinkerType: form.drinkerType, litterType: form.litterType,
      address: form.address.trim(), builtAt: form.builtAt.trim(), lastSanitizedAt: form.lastSanitizedAt.trim(), notes: form.notes.trim()
    };
    if (form.id) updateHall(form.id, data); else addHall(data);
    setOpen(false);
  };
  const target = delId ? halls.find(h => h.id === delId) : null;

  return (
    <PageContainer>
      {halls.length === 0 ? (
        <Empty icon={<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>}
          title="هنوز سالنی نساخته‌اید" desc="اولین سالن خود را بسازید. ابعاد را وارد کنید تا مساحت و حجم خودکار محاسبه شود."
          action={<Btn variant="primary" onClick={openNew}>+ افزودن سالن</Btn>} />
      ) : (
        <>
          {halls.map((h, i) => {
            const area = (h.length || 0) * (h.width || 0);
            const volume = area * (h.height || 0);
            const zoneCount = zones.filter(z => z.hallId === h.id).length;
            const equipCount = equipment.filter(e => e.hallId === h.id).length;
            const equipValue = equipment.filter(e => e.hallId === h.id).reduce((a, e) => a + ((e.count || 0) * (e.unitPrice || 0)), 0);
            const isOpen = expandedId === h.id;
            return (
              <ExpandableCard key={h.id} accent="accent" index={toFa(i + 1)} iconEmoji="🏭"
                title={h.name + (h.code ? ` · ${h.code}` : '')}
                subtitle={h.length ? `${toFa(h.length)}×${toFa(h.width || 0)}×${toFa(h.height || 0)} متر` : 'ابعاد وارد نشده'}
                isOpen={isOpen} onToggle={() => setExpandedId(isOpen ? null : h.id)}
                badge={zoneCount > 0 ? <Tag tone="blue">{toFa(zoneCount)} بخش</Tag> : undefined}
                summary={<>
                  {area > 0 && <span>مساحت: <b style={{ color: 'var(--text)' }}>{toFa(area.toFixed(1))} م²</b></span>}
                  {h.capacity && <span>ظرفیت: <b style={{ color: 'var(--text)' }}>{toFa(h.capacity)}</b></span>}
                  {equipCount > 0 && <span>تجهیز: <b style={{ color: 'var(--text)' }}>{toFa(equipCount)}</b></span>}
                </>}
              >
                <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', fontWeight: 700, letterSpacing: '.3px' }}>📐 ابعاد و ظرفیت</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <Row l="مساحت" v={`${toFa(area.toFixed(1))} م²`} />
                  <Row l="حجم" v={`${toFa(volume.toFixed(1))} م³`} />
                  <Row l="ظرفیت" v={h.capacity ? `${toFa(h.capacity)} پرنده` : '—'} />
                </div>

                <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', fontWeight: 700, letterSpacing: '.3px' }}>🌡 شرایط محیطی</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <Row l="دمای هدف" v={h.targetTemp ? `${toFa(h.targetTemp)} °C` : '—'} />
                  <Row l="رطوبت هدف" v={h.targetHumidity ? `${toFa(h.targetHumidity)} ٪` : '—'} />
                  <Row l="تهویه" v={h.ventilation ? `${toFa(h.ventilation)} m³/min` : '—'} />
                  <Row l="روشنایی" v={h.light ? `${toFa(h.light)} lux` : '—'} />
                </div>

                <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', fontWeight: 700, letterSpacing: '.3px' }}>🔧 تجهیزات ثابت</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {h.ventilationSystem && <Pill label="تهویه" value={VENT_SYS_LABELS[h.ventilationSystem]} />}
                  {h.feederType && <Pill label="دانخوری" value={FEEDER_LABELS[h.feederType]} />}
                  {h.drinkerType && <Pill label="آبخوری" value={DRINKER_LABELS[h.drinkerType]} />}
                  {h.litterType && <Pill label="بستر" value={LITTER_LABELS[h.litterType]} />}
                </div>

                {(h.builtAt || h.lastSanitizedAt || equipValue > 0) && (
                  <>
                    <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', fontWeight: 700, letterSpacing: '.3px' }}>📅 زمان‌ها و ارزش</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {h.builtAt && <Row l="تاریخ ساخت" v={toFa(h.builtAt)} />}
                      {h.lastSanitizedAt && <Row l="آخرین ضدعفونی" v={toFa(h.lastSanitizedAt)} />}
                      {equipValue > 0 && <Row l="ارزش تجهیزات" v={`${toFa(equipValue.toLocaleString('fa-IR'))} ت`} accent />}
                    </div>
                  </>
                )}

                {h.address && (
                  <>
                    <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', fontWeight: 700, letterSpacing: '.3px' }}>📍 آدرس</div>
                    <div style={{ fontSize: 'var(--fs-sm)', padding: '8px 10px', background: 'var(--input-bg)', borderRadius: 'var(--r-sm)' }}>{h.address}</div>
                  </>
                )}

                {h.notes && (
                  <>
                    <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', fontWeight: 700, letterSpacing: '.3px' }}>📝 یادداشت</div>
                    <div style={{ fontSize: 'var(--fs-sm)', lineHeight: 1.7, padding: '8px 10px', background: 'var(--input-bg)', borderRadius: 'var(--r-sm)' }}>{h.notes}</div>
                  </>
                )}

                <div style={{ display: 'flex', gap: 6, paddingTop: 4 }}>
                  <Btn size="sm" onClick={() => openEdit(h)} style={{ flex: 1 }}>ویرایش</Btn>
                  <Btn size="sm" onClick={() => setDelId(h.id)} style={{ flex: 1 }}>حذف</Btn>
                </div>
              </ExpandableCard>
            );
          })}
          <Btn variant="primary" full onClick={openNew}>+ افزودن سالن</Btn>
        </>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={form.id ? 'ویرایش سالن' : 'افزودن سالن'}
        footer={<BtnRow><Btn variant="primary" onClick={save}>ذخیره</Btn><Btn onClick={() => setOpen(false)}>لغو</Btn></BtnRow>}>
        <Field label="نام سالن" required><Input placeholder="مثلاً: سالن شمالی" value={form.name} onChange={e => setForm({...form, name: e.target.value})} /></Field>
        <Grid2>
          <Field label="کد سالن"><Input placeholder="H-01" dir="ltr" value={form.code} onChange={e => setForm({...form, code: e.target.value})} /></Field>
          <Field label="ظرفیت"><Input placeholder="۱۰۰۰" inputMode="numeric" dir="ltr" value={form.capacity} onChange={e => setForm({...form, capacity: e.target.value})} unit="پرنده" /></Field>
        </Grid2>
        <div style={{ paddingTop: 8, fontSize: 'var(--fs-sm)', fontWeight: 700, color: 'var(--muted)', borderTop: '1px dashed var(--border)' }}>ابعاد</div>
        <Grid3>
          <Field label="طول"><Input placeholder="۰" inputMode="decimal" dir="ltr" value={form.length} onChange={e => setForm({...form, length: e.target.value})} unit="m" /></Field>
          <Field label="عرض"><Input placeholder="۰" inputMode="decimal" dir="ltr" value={form.width} onChange={e => setForm({...form, width: e.target.value})} unit="m" /></Field>
          <Field label="ارتفاع"><Input placeholder="۰" inputMode="decimal" dir="ltr" value={form.height} onChange={e => setForm({...form, height: e.target.value})} unit="m" /></Field>
        </Grid3>
        <div style={{ paddingTop: 8, fontSize: 'var(--fs-sm)', fontWeight: 700, color: 'var(--muted)', borderTop: '1px dashed var(--border)' }}>شرایط</div>
        <Grid2>
          <Field label="دمای هدف"><Input placeholder="۲۲" inputMode="decimal" dir="ltr" value={form.targetTemp} onChange={e => setForm({...form, targetTemp: e.target.value})} unit="°C" /></Field>
          <Field label="رطوبت هدف"><Input placeholder="۶۰" inputMode="numeric" dir="ltr" value={form.targetHumidity} onChange={e => setForm({...form, targetHumidity: e.target.value})} unit="٪" /></Field>
        </Grid2>
        <Grid2>
          <Field label="تهویه"><Input placeholder="۱۲" inputMode="decimal" dir="ltr" value={form.ventilation} onChange={e => setForm({...form, ventilation: e.target.value})} unit="m³/min" /></Field>
          <Field label="روشنایی"><Input placeholder="۲۰" inputMode="decimal" dir="ltr" value={form.light} onChange={e => setForm({...form, light: e.target.value})} unit="lux" /></Field>
        </Grid2>
        <Grid2>
          <Field label="سیستم تهویه"><Select value={form.ventilationSystem} onChange={e => setForm({...form, ventilationSystem: e.target.value})}>{Object.entries(VENT_SYS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</Select></Field>
          <Field label="نوع بستر"><Select value={form.litterType} onChange={e => setForm({...form, litterType: e.target.value})}>{Object.entries(LITTER_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</Select></Field>
        </Grid2>
        <Grid2>
          <Field label="دانخوری"><Select value={form.feederType} onChange={e => setForm({...form, feederType: e.target.value})}>{Object.entries(FEEDER_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</Select></Field>
          <Field label="آبخوری"><Select value={form.drinkerType} onChange={e => setForm({...form, drinkerType: e.target.value})}>{Object.entries(DRINKER_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</Select></Field>
        </Grid2>
        <div style={{ paddingTop: 8, fontSize: 'var(--fs-sm)', fontWeight: 700, color: 'var(--muted)', borderTop: '1px dashed var(--border)' }}>زمان‌ها</div>
        <Grid2>
          <Field label="تاریخ ساخت"><Input placeholder="۱۴۰۰/۰۱/۰۱" value={form.builtAt} onChange={e => setForm({...form, builtAt: e.target.value})} /></Field>
          <Field label="آخرین ضدعفونی"><Input placeholder="۱۴۰۵/۰۷/۰۱" value={form.lastSanitizedAt} onChange={e => setForm({...form, lastSanitizedAt: e.target.value})} /></Field>
        </Grid2>
        <Field label="آدرس سالن"><Input placeholder="..." value={form.address} onChange={e => setForm({...form, address: e.target.value})} /></Field>
        <Field label="یادداشت"><Input placeholder="..." value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} /></Field>
        {err && <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--danger)' }}>✕ {err}</div>}
      </Modal>

      <Modal open={!!delId} onClose={() => setDelId(null)} title="حذف سالن"
        footer={<BtnRow><Btn variant="danger" onClick={() => { if (delId) deleteHall(delId); setDelId(null); }}>حذف کن</Btn><Btn onClick={() => setDelId(null)}>لغو</Btn></BtnRow>}>
        <div style={{ textAlign: 'center', fontSize: 'var(--fs-md)', lineHeight: 1.9 }}>
          حذف <b>{target?.name}</b>؟
          <br /><span style={{ color: 'var(--muted)', fontSize: 'var(--fs-base)' }}>تمام بخش‌ها و تجهیزات این سالن هم حذف می‌شوند.</span>
        </div>
      </Modal>
    </PageContainer>
  );
}

function Row({ l, v, accent }: { l: string; v: string; accent?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--fs-sm)', padding: '6px 10px', background: accent ? 'var(--accent-soft)' : 'var(--input-bg)', borderRadius: 'var(--r-sm)', color: accent ? 'var(--accent)' : undefined, fontWeight: accent ? 700 : undefined }}>
      <span style={{ color: accent ? 'var(--accent)' : 'var(--muted)' }}>{l}:</span>
      <span style={{ fontWeight: 600 }}>{v}</span>
    </div>
  );
}
function Pill({ label, value }: { label: string; value: string }) {
  return (
    <span style={{ padding: '4px 10px', background: 'var(--input-bg)', borderRadius: 6, fontSize: 'var(--fs-xs)', color: 'var(--muted)' }}>
      {label}: <b style={{ color: 'var(--text)' }}>{value}</b>
    </span>
  );
}
