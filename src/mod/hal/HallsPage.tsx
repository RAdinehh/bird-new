/**
 * HallsPage — سالن‌ها
 */
import { useState, useMemo } from 'react';
import { useHal, type Hall, VENT_SYS_LABELS, FEEDER_LABELS, DRINKER_LABELS, LITTER_LABELS, EQUIP_LABELS } from './store';
import { useBrd } from '../brd/store';
import { useBreedStandard } from '../../shr/hooks/useBreedStandard';
import { Btn, BtnRow, Empty, Field, Grid2, Grid3, Input, Modal, NumField, PageContainer, Select, Tag, ErrorBox } from '../../shr/components/ui';
import ExpandableCard from '../../shr/components/ExpandableCard';
import { toFa, toEn } from '../../shr/utils/fa';
import { useTempUnit, toUserTemp, tempLabel } from '../../shr/utils/temp';
import { useFormat } from '../../shr/units';
import { showAlert } from '../../cor/store/dialog';
import { Row, Pill } from './helpers';
import UndoBar from '../../cor/ui/UndoBar';
import { showToast } from '../../cor/store/toast';
import { showConfirmAsync } from '../../cor/store/dialog';
import { logAction } from '../../cor/logger/auditLog';

interface F { id?: string; name: string; code: string; length: string; width: string; height: string; capacity: string; targetTemp: string; targetHumidity: string; ventilation: string; light: string; ventilationSystem: string; feederType: string; drinkerType: string; litterType: string; address: string; builtAt: string; lastSanitizedAt: string; notes: string; breedId: string; }
const empty: F = { name:'', code:'', length:'', width:'', height:'', capacity:'', targetTemp:'', targetHumidity:'', ventilation:'', light:'', ventilationSystem:'tunnel', feederType:'chain', drinkerType:'nipple', litterType:'wood_shavings', address:'', builtAt:'', lastSanitizedAt:'', notes:'', breedId:'' };

function TempFormField({ value, onChange, label, placeholder }: any) {
  const tempUnit = useTempUnit();
  const fmt = useFormat();
  const celsius = (() => {
    if (!value) return null;
    const en = String(value).replace(/[۰-۹]/g, (d: string) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d))).replace(/[٫،]/g, '.');
    const n = parseFloat(en);
    return isNaN(n) ? null : n;
  })();
  const displayed = celsius == null ? null : (
    tempUnit === 'c' ? celsius : Math.round((celsius * 9 / 5 + 32) * 10) / 10
  );
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let v = e.target.value;
    v = v.replace(/[۰-۹]/g, (d: string) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)));
    v = v.replace(/[٫،]/g, '.');
    v = v.replace(/[^\d.-]/g, '');
    if (v === '' || v === '-' || v === '.') { onChange(''); return; }
    const n = parseFloat(v);
    if (isNaN(n)) return;
    const c = tempUnit === 'c' ? n : (n - 32) * 5 / 9;
    onChange(String(Math.round(c * 10) / 10));
  };
  return (
    <Field label={label}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <input
          type="text"
          inputMode="decimal"
          value={displayed == null ? '' : String(displayed)}
          onChange={handleChange}
          placeholder={placeholder}
          onFocus={(e) => e.target.select()}
          style={{
            flex: 1, height: 38, padding: '0 12px',
            background: 'var(--input-bg)', border: '1px solid var(--border)',
            borderRadius: 'var(--r-md)', color: 'var(--text)',
            fontFamily: 'inherit', fontSize: 'var(--fs-base)', fontWeight: 600,
            textAlign: 'right', outline: 'none',
            fontVariantNumeric: 'tabular-nums', direction: 'ltr', minWidth: 0,
          }}
        />
        <span style={{ fontSize: 'var(--fs-sm)', color: 'var(--muted)', flexShrink: 0, minWidth: 30, textAlign: 'left' }}>
          {tempUnit === 'c' ? '°C' : '°F'}
        </span>
      </div>
    </Field>
  );
}


/** محاسبه ظرفیت پیشنهادی بر اساس مساحت و نژاد */
function calcSuggestedCapacity(length: number | null, width: number | null, densityMax: number | null): number | null {
  if (!length || !width || !densityMax) return null;
  const area = length * width;
  return Math.floor(area * densityMax);
}

export default function HallsPage() {
  const { halls: _hallsRaw, zones, equipment, addHall, updateHall, deleteHall } = useHal();
  const breedStd = useBreedStandard();
  const { breeds } = useBrd();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<F>(empty);
  const [err, setErr] = useState('');
  const [delId, setDelId] = useState<string | null>(null);
  const [undoData, setUndoData] = useState<{ item: any } | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const tempUnit = useTempUnit();
  const __breedStd = form.breedId ? breedStd.byBreedId(form.breedId) : null;
  const __suggestedCap = calcSuggestedCapacity(
    parseFloat(toEn(form.length)) || null,
    parseFloat(toEn(form.width)) || null,
    __breedStd?.space?.densityMax ?? null,
  );
  const fmt = useFormat();

  const halls = useMemo(() => {
    const seen = new Set<string>();
    return _hallsRaw.filter(h => {
      const k = (h.name || '').trim().toLowerCase();
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
  }, [_hallsRaw]);

  const openNew = () => { setForm(empty); setErr(''); setOpen(true); };
  const openEdit = (h: Hall) => {
    setForm({
      id: h.id, name: h.name, code: h.code,
      length: h.length ? toFa(h.length) : '', width: h.width ? toFa(h.width) : '', height: h.height ? toFa(h.height) : '',
      capacity: h.capacity ? toFa(h.capacity) : '', targetTemp: h.targetTemp ? toFa(h.targetTemp) : '',
         targetHumidity: h.targetHumidity ? toFa(h.targetHumidity) : '',
        
      ventilation: h.ventilation ? toFa(h.ventilation) : '', light: h.light ? toFa(h.light) : '',
      ventilationSystem: h.ventilationSystem ||
        'tunnel', feederType: h.feederType ||
        'chain', drinkerType: h.drinkerType ||
        'nipple', litterType: h.litterType ||
        'wood_shavings',
      address: h.address, builtAt: h.builtAt, lastSanitizedAt: h.lastSanitizedAt, notes: h.notes,
        breedId: (h as any).breedId || ''
      });
    setErr(''); setOpen(true);
  };
  const num = (s: string) => s ? parseFloat(toEn(s).replace('٫','.')) || null : null;
  const save = () => {
    // 🔒 جلوگیری قاطع از نام تکراری سالن
    if (!form.id) {
      const _trimmed = form.name.trim();
      const _dup = halls.find((x: any) => x.name.trim() === _trimmed);
      if (_dup) {
        showAlert(
          `سالنای با نام «${_dup.name}» قبلاً ثبت شده. لطفاً نام دیگری انتخاب کنید یا همان را ویرایش کنید.`,
          '❌ نام تکراری'
        );
        return;
      }
    }

    if (!form.name.trim()) { setErr('نام سالن اجباری است'); return; }
    const data = {
      name: form.name.trim(), code: form.code.trim(),
      length: num(form.length), width: num(form.width), height: num(form.height),
      capacity: form.capacity ? parseInt(toEn(form.capacity)) || null : null,
      targetTemp: num(form.targetTemp), targetHumidity: num(form.targetHumidity),
      ventilation: num(form.ventilation), light: num(form.light),
      ventilationSystem: form.ventilationSystem, feederType: form.feederType, drinkerType: form.drinkerType, litterType: form.litterType,
      address: form.address.trim(), builtAt: form.builtAt.trim(), lastSanitizedAt: form.lastSanitizedAt.trim(), notes: form.notes.trim(),
      breedId: form.breedId || undefined,
    };
    if (form.id) updateHall(form.id, data); else addHall(data);
    setOpen(false);
  };
  const target = delId ? halls.find(h => h.id === delId) : null;

  const undoDelete = () => {
    const item = undoData;
    if (!item) return;
    try {
      addHall(item.item);
      showToast('سالن بازگردانی شد', 'success', 2000);
    } catch (err) {
      showToast('بازگردانی ناموفق', 'error', 2000);
    }
    setUndoData(null);
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
            const hallEquips = equipment.filter(e => e.hallId === h.id);
            const totalAirflow = hallEquips.filter(e => e.type === 'fan' || e.type === 'cooler').reduce((a, e) => a + ((e.count || 0) * ((e as any).capacity || 0)), 0);
            const totalLightW = hallEquips.filter(e => e.type === 'lamp').reduce((a, e) => a + ((e.count || 0) * ((e as any).capacity || 0)), 0);
            const isOpen = expandedId === h.id;
            return (
              <ExpandableCard key={h.id} accent="accent" index={fmt.int(i + 1)} iconEmoji="🏭"
                title={h.name + (h.code ? ` · ${h.code}` : '')}
                subtitle={h.length ? `${toFa(h.length)}×${toFa(h.width || 0)}×${toFa(h.height || 0)} متر` : 'ابعاد وارد نشده'}
                isOpen={isOpen} onToggle={() => setExpandedId(isOpen ? null : h.id)}
                badge={zoneCount > 0 ? <Tag tone="blue">{fmt.int(zoneCount)} بخش</Tag> : undefined}
                stats={<>
                  {area > 0 && <span>مساحت: <b style={{ color: 'var(--text)' }}>{toFa(area.toFixed(1))} م²</b></span>}
                  {h.capacity && <span>ظرفیت: <b style={{ color: 'var(--text)' }}>{fmt.int(h.capacity)}</b></span>}
                  {equipCount > 0 && <span>تجهیز: <b style={{ color: 'var(--text)' }}>{fmt.int(equipCount)}</b></span>}
                </>}
              >
                <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', fontWeight: 700, letterSpacing: '.3px' }}>📐 ابعاد و ظرفیت</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <Row l="مساحت" v={`${toFa(area.toFixed(1))} م²`} />
                  <Row l="حجم" v={`${toFa(volume.toFixed(1))} م³`} />
                  <Row l="ظرفیت" v={h.capacity ? `${fmt.int(h.capacity)} پرنده` : '—'} />
                </div>

                <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', fontWeight: 700, letterSpacing: '.3px' }}>🌡 شرایط محیطی</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <Row l="دمای هدف" v={h.targetTemp != null ? fmt.temp(h.targetTemp) : '—'} />
                  <Row l="رطوبت هدف" v={h.targetHumidity ? `${fmt.num(h.targetHumidity, { decimals: 0 })}٪` : '—'} />
                  <Row l="تهویه خودکار" v={totalAirflow > 0 ? `${fmt.num(totalAirflow)} m³/h` : '— تجهیز ثبت نشده'} />
                  <Row l="روشنایی نصب‌شده" v={totalLightW > 0 ? `${fmt.num(totalLightW)} W` : '— تجهیز ثبت نشده'} />
                  {hallEquips.length > 0 && (
                    <Row
                      l="تجهیزات نصب‌شده"
                      v={(() => {
                        const counts: Record<string, number> = {};
                        hallEquips.forEach(e => {
                          counts[e.type] = (counts[e.type] || 0) + (e.count || 0);
                        });
                        return Object.entries(counts)
                          .map(([t, c]) => `${EQUIP_LABELS[t]?.icon || '🔧'} ${fmt.int(c)}`)
                          .join(' · ');
                      })()}
                    />
                  )}
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
                      {equipValue > 0 && <Row l="ارزش تجهیزات" v={fmt.money(equipValue)} accent />}
                    </div>
                  </>
                )}

                {h.address && (
                  <>
                    <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', fontWeight: 700, letterSpacing: '.3px' }}>📍 آدرس</div>
                    <div style={{ fontSize: 'var(--fs-sm)', padding: 'var(--pad-normal)',
                       background: 'var(--input-bg)', borderRadius: 'var(--r-sm)' }}>{h.address}</div>
                  </>
                )}

                {h.notes && (
                  <>
                    <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', fontWeight: 700, letterSpacing: '.3px' }}>📝 یادداشت</div>
                    <div style={{ fontSize: 'var(--fs-sm)', lineHeight: 1.7,
                       padding: 'var(--pad-normal)', background: 'var(--input-bg)',
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
          <Btn variant="primary" full onClick={openNew}>+ افزودن سالن</Btn>
        </>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={form.id ? 'ویرایش سالن' : 'افزودن سالن'}
        footer={<BtnRow><Btn variant="primary" onClick={save}>ذخیره</Btn><Btn onClick={() => setOpen(false)}>لغو</Btn></BtnRow>}>
        <Field label="نام سالن" required><Input placeholder="مثلاً — سالن شمالی" value={form.name} onChange={e => setForm({...form, name: e.target.value})} /></Field>
        <Grid2>
            <Field label="نژاد پرنده">
              <Select value={form.breedId} onChange={e => setForm({...form, breedId: e.target.value})}>
                <option value="">— انتخاب —</option>
                {breeds.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </Select>
            </Field>
            <Field label="ظرفیت">
              <NumField placeholder="۱۰۰۰" value={form.capacity} onChange={e => setForm({...form, capacity: e.target.value})} unit="پرنده" min={0} />
            </Field>
          </Grid2>
          {form.breedId && (
            <Btn
              size="sm"
              full
              onClick={() => {
                const std = breedStd.byBreedId(form.breedId);
                if (!std) return;
                const area = (parseFloat(toEn(form.length)) || 0) * (parseFloat(toEn(form.width)) || 0);
                const cap = area > 0 && std.space?.densityMax ? Math.floor(area * std.space.densityMax) : null;
                const env = std.env?.[0];
                const patch: any = {};
                if (cap) patch.capacity = String(cap);
                if (env?.temp?.target != null) patch.targetTemp = String(env.temp.target);
                if (env?.humidity?.min != null) patch.targetHumidity = String(env.humidity.min);
                setForm(f => ({ ...f, ...patch }));
                showToast('مقادیر از استاندارد پر شد', 'success', 1500);
              }}
            >
              ✨ پر کردن خودکار از استاندارد
            </Btn>
          )}
        <div style={{ paddingTop: 8, fontSize: 'var(--fs-sm)', fontWeight: 700,
           color: 'var(--muted)', borderTop: '1px dashed var(--border)' }}>ابعاد</div>
        <Grid3>
          <Field label="طول"><NumField placeholder="۰" value={form.length} onChange={e => setForm({...form, length: e.target.value})} unit="m" min={1} /></Field>
          <Field label="عرض"><NumField placeholder="۰" value={form.width} onChange={e => setForm({...form, width: e.target.value})} unit="m" min={1} /></Field>
          <Field label="ارتفاع"><NumField placeholder="۰" value={form.height} onChange={e => setForm({...form, height: e.target.value})} unit="m" min={1} /></Field>
        </Grid3>
        <div style={{ paddingTop: 8, fontSize: 'var(--fs-sm)', fontWeight: 700,
           color: 'var(--muted)', borderTop: '1px dashed var(--border)' }}>شرایط</div>
          <Grid2>
          <TempFormField label="دمای هدف" placeholder="۲۲" value={form.targetTemp} onChange={(v: string) => setForm({...form, targetTemp: v})} />
          <Field label="رطوبت هدف"><NumField placeholder="۶۰" value={form.targetHumidity} onChange={e => setForm({...form, targetHumidity: e.target.value})} unit="٪" min={-10} /></Field>
        </Grid2>
        <div style={{ paddingTop: 8, fontSize: 'var(--fs-sm)', fontWeight: 700,
           color: 'var(--muted)', borderTop: '1px dashed var(--border)' }}>زمان‌ها</div>
        <Grid2>
          <Field label="تاریخ ساخت"><Input placeholder="۱۴۰۰/۰۱/۰۱" value={form.builtAt} onChange={e => setForm({...form, builtAt: e.target.value})} /></Field>
          <Field label="آخرین ضدعفونی"><Input placeholder="۱۴۰۵/۰۷/۰۱" value={form.lastSanitizedAt} onChange={e => setForm({...form, lastSanitizedAt: e.target.value})} /></Field>
        </Grid2>
        <Field label="آدرس سالن"><Input placeholder="..." value={form.address} onChange={e => setForm({...form, address: e.target.value})} /></Field>
        <Field label="یادداشت"><Input placeholder="..." value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} /></Field>
        <ErrorBox>{err}</ErrorBox>
      </Modal>

      <Modal open={!!delId} onClose={() => setDelId(null)} title="حذف سالن"
        footer={<BtnRow><Btn variant="danger" onClick={async () => { const idToDel = delId; if (!idToDel) return; const ok = await showConfirmAsync('تأیید حذف', 'این سالن حذف شود؟', { danger: true }); if (!ok) return; const item = halls.find((x: any) => x.id === idToDel); if (item) { setUndoData({ item }); setTimeout(() => setUndoData((cur: any) => cur && cur.item.id === item.id ? null : cur), 6000); } deleteHall(idToDel);
              logAction('delete', 'hal', 'حذف از سالن‌ها'); setDelId(null); showToast('سالن حذف شد', 'info', 1800); }}>حذف کن</Btn><Btn onClick={() => setDelId(null)}>لغو</Btn></BtnRow>}>
        <div style={{ textAlign: 'center', fontSize: 'var(--fs-md)', lineHeight: 1.9 }}>
          حذف <b>{target?.name}</b>؟
          <br /><span style={{ color: 'var(--muted)', fontSize: 'var(--fs-base)' }}>تمام بخش‌ها و تجهیزات این سالن هم حذف می‌شوند.</span>
        </div>
      </Modal>
    </PageContainer>
  );
}
