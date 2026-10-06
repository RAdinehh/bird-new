/**
 * HallsPage — سالن‌ها
 */
import { useState, useMemo, useEffect } from 'react';
import { useFab } from '../../shr/hooks/useFab';
import { useValidation } from '../../shr/validation/useValidation';
import { createHallSchema } from '../../shr/validation/rules/hal';
import { useHal, type Hall } from './store';
import { useBrd } from '../brd/store';
import { useBreedStandard } from '../../shr/hooks/useBreedStandard';
import { useFlk, getAgeDays } from '../flk/store';
import { Btn, BtnRow, Empty, Field, Grid2, Grid3, Input, Modal, NumField, PageContainer, Select, Tag, ErrorBox , Textarea } from '../../shr/components/ui';
import DatePicker from '../../shr/components/DatePicker';
import ExpandableCard from '../../shr/components/ExpandableCard';
import { useMultiSelect } from '../../shr/multiSelect/useMultiSelect';
import MultiSelectBar from '../../shr/multiSelect/MultiSelectBar';
import HelpBanner from '../../shr/components/HelpBanner';
import { isFanLike, isLampLike, LITTER_KG_PER_M2 } from './helpers';
import { HallEquipSection } from './HallEquipSection';
import { toFa, toEn } from '../../shr/utils/fa';
import { useTempUnit, toUserTemp, tempLabel } from '../../shr/utils/temp';
import { useFormat } from '../../shr/units';
import { showAlert } from '../../cor/store/dialog';
import { Row, RowWithStatus } from './helpers';
import UndoBar from '../../cor/ui/UndoBar';
import { showToast } from '../../cor/store/toast';
import { showConfirmAsync } from '../../cor/store/dialog';
import { logAction } from '../../cor/logger/auditLog';


interface F {
  id?: string;
  name: string; code: string;
  length: string; width: string; height: string;
  capacity: string; targetTemp: string; targetHumidity: string;
  ventilation: string; light: string;
  ventilationSystem: string; feederType: string; drinkerType: string; litterType: string;
  address: string; builtAt: string; lastSanitizedAt: string; notes: string; breedId: string;
}
const empty: F = {
  name:'', code:'', length:'', width:'', height:'',
  capacity:'', targetTemp:'', targetHumidity:'', ventilation:'', light:'',
  ventilationSystem:'', feederType:'', drinkerType:'', litterType:'',
 
  
  address:'', builtAt:'', lastSanitizedAt:'', notes:'', breedId:'',
};

function TempFormField({ value, onChange, label, placeholder, autoFrom }: any) {
  const tempUnit = useTempUnit();
  const [local, setLocal] = useState<string>('');
  const [editing, setEditing] = useState(false);

  const celsius = (() => {
    if (value === '' || value == null) return null;
    const en = String(value).replace(/[۰-۹]/g, (d: string) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d))).replace(/[٫،]/g, '.');
    const n = parseFloat(en);
    return isNaN(n) ? null : n;
  })();

  const displayVal = celsius == null ? '' : (
    tempUnit === 'c' ? String(celsius) : String(Math.round((celsius * 9 / 5 + 32) * 10) / 10)
  );

  const shown = editing ? local : displayVal;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let v = e.target.value;
    v = v.replace(/[۰-۹]/g, (d: string) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)));
    v = v.replace(/[٫،]/g, '.');
    v = v.replace(/[^\d.-]/g, '');
    setLocal(v);
    if (v === '' || v === '-' || v === '.') { onChange(''); return; }
    const n = parseFloat(v);
    if (isNaN(n)) return;
    const c = tempUnit === 'c' ? n : (n - 32) * 5 / 9;
    onChange(String(Math.round(c * 10) / 10));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
      <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', fontWeight: 600, textAlign: 'right', display: 'inline-flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end' }}>
        {autoFrom ? (
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', display: 'inline-block' }} />
        ) : null}
        {label}
      </span>
      <div style={{
        width: '100%', minWidth: 0, height: 38,
        background: autoFrom ? 'var(--accent-soft)' : 'var(--input-bg)',
        border: '1px solid ' + (autoFrom ? 'var(--accent-border)' : 'var(--border)'),
        borderRadius: 'var(--r-md)',
        padding: '0 12px',
        display: 'flex', alignItems: 'center', gap: 8,
        overflow: 'hidden',
      }}>
        <input
          type="text"
          inputMode="decimal"
          value={shown}
          onChange={handleChange}
          onFocus={() => { setEditing(true); setLocal(displayVal); }}
          onBlur={() => setEditing(false)}
          placeholder={placeholder}
          dir="ltr"
          style={{
            flex: '1 1 0%', width: '100%', minWidth: 0,
            background: 'none', border: 'none', outline: 'none',
            color: 'var(--text)', fontFamily: 'inherit',
            fontSize: 'var(--fs-base)', fontWeight: 600,
            textAlign: 'right',
          }}
        />
        <span style={{ fontSize: 'var(--fs-sm)', color: 'var(--dim)', flexShrink: 0 }}>
          {tempUnit === 'c' ? '°C' : '°F'}
        </span>
      </div>
      {autoFrom ? (
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          fontSize: 11,
          color: 'var(--accent)',
          background: 'var(--accent-soft)',
          border: '1px solid var(--accent-border)',
          borderRadius: 8,
          padding: '2px 8px',
          fontWeight: 700,
          alignSelf: 'flex-start',
          lineHeight: 1.6,
        }}>
          <span aria-hidden="true">✨</span>
          <span>از {autoFrom}</span>
        </div>
      ) : null}
    </div>
  );
}


/** محاسبه ظرفیت پیشنهادی بر اساس مساحت و نژاد */
function calcSuggestedCapacity(length: number | null, width: number | null, densityMax: number | null): number | null {
  if (!length || !width || !densityMax) return null;
  const area = length * width;
  return Math.floor(area * densityMax);
}

export default function HallsPage({ active = true }: { active?: boolean } = {}) {
  const { halls: _hallsRaw, zones, equipment, addHall, updateHall, deleteHall } = useHal();
  const breedStd = useBreedStandard();
  const { flocks } = useFlk();
  const { breeds } = useBrd();
  const [open, setOpen] = useState(false);
  const [autoFields, setAutoFields] = useState<Set<string>>(new Set());
  const [form, setForm] = useState<F>(empty);
  const [err, setErr] = useState('');
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

  // ─── Multi-Select ───
  const ms = useMultiSelect({
    items: halls,
    getId: (h: any) => h.id,
    onDelete: async (ids: string[]) => {
      let totalZones = 0;
      let totalEquip = 0;
      let hasFlocks = 0;
      for (const id of ids) {
        totalZones += zones.filter(z => z.hallId === id).length;
        totalEquip += equipment.filter(e => e.hallId === id).length;
        try {
          const flk = JSON.parse(localStorage.getItem('pm-flk') || '{}');
          const flocks = flk.state?.flocks || flk.flocks || [];
          if (flocks.some((f: any) => f.hallId === id && f.status === 'active')) hasFlocks++;
        } catch { /* silent */ }
      }
      let msg = toFa(ids.length) + ' سالن حذف شوند؟';
      if (totalZones > 0 || totalEquip > 0) {
        msg += '\n\n';
        if (totalZones > 0) msg += '• ' + toFa(totalZones) + ' بخش\n';
        if (totalEquip > 0) msg += '• ' + toFa(totalEquip) + ' تجهیز\n';
        msg += 'هم حذف می‌شوند.';
      }
      if (hasFlocks > 0) {
        msg += '\n\n⚠️ ' + toFa(hasFlocks) + ' سالن گله فعال دارن.';
      }
      const ok = await showConfirmAsync('حذف گروهی', msg, { danger: true });
      if (!ok) return;
      const backups: any[] = [];
      for (const id of ids) {
        const item = halls.find(h => h.id === id);
        if (!item) continue;
        backups.push(item);
        try { deleteHall(id); } catch {}
      }
      if (backups.length > 0) {
        setUndoData({ item: backups });
        setTimeout(() => setUndoData((cur: any) => cur && Array.isArray(cur.item) && cur.item.length === backups.length ? null : cur), 8000);
      }
      showToast(toFa(backups.length) + ' سالن حذف شد', 'success', 2500);
    },
  });

  useEffect(() => {
    if (ms.selectionMode) setExpandedId(null);
  }, [ms.selectionMode]);


  const setFromStd = (fields: Record<string, string>) => {
    setForm((f: any) => ({ ...f, ...fields }));
    setAutoFields(new Set(Object.keys(fields)));
  };

  const clearAuto = (key: string) => {
    if (autoFields.has(key)) {
      const next = new Set(autoFields);
      next.delete(key);
      setAutoFields(next);
    }
  };

  const openNew = () => {
    setAutoFields(new Set()); setForm(empty); setErr(''); setOpen(true); };
  const openEdit = (h: Hall) => {
    setAutoFields(new Set());
    setForm({
      id: h.id, name: h.name, code: h.code,
      length: h.length ? toFa(h.length) : '', width: h.width ? toFa(h.width) : '', height: h.height ? toFa(h.height) : '',
      capacity: h.capacity ? toFa(h.capacity) : '', targetTemp: h.targetTemp ? toFa(h.targetTemp) : '',
         targetHumidity: h.targetHumidity ? toFa(h.targetHumidity) : '',
        
      ventilation: h.ventilation ? toFa(h.ventilation) : '', light: h.light ? toFa(h.light) : '',
      ventilationSystem: h.ventilationSystem || '',
      feederType: h.feederType || '',
      drinkerType: h.drinkerType || '',
      litterType: h.litterType || '',
      address: h.address, builtAt: h.builtAt, lastSanitizedAt: h.lastSanitizedAt, notes: h.notes,
      breedId: (h as any).breedId || ''
      });
    setErr(''); setOpen(true);
  };
  useFab(active ? { label: 'افزودن سالن', onClick: openNew } : null);
  const num = (s: string) => s ? parseFloat(toEn(s).replace('٫','.')) || null : null;

  // ═══ اعتبارسنجی زنده ═══
  const { errors: vErrors } = useValidation(
    createHallSchema(),
    {
      name: form.name || '',
      code: (form.code || '').trim() || (form.name || '').trim().toLowerCase().replace(/\s+/g, '-') || 'hall',
      length: num(form.length),
      width: num(form.width),
      height: num(form.height),
      capacity: num(form.capacity),
      targetTemp: num(form.targetTemp),
      targetHumidity: num(form.targetHumidity),
      ventilation: num(form.ventilation),
      light: num(form.light),
      ventilationSystem: form.ventilationSystem || '',
      feederType: form.feederType || '',
      drinkerType: form.drinkerType || '',
      litterType: form.litterType || '',
      address: form.address || '',
      builtAt: form.builtAt || '',
      lastSanitizedAt: form.lastSanitizedAt || '',
      notes: form.notes || '',
      birdId: '',
      breedId: form.breedId || '',
    },
  );
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
      ventilationSystem: form.ventilationSystem || '',
      feederType: form.feederType || '',
      drinkerType: form.drinkerType || '',
      litterType: form.litterType || '',
      address: form.address.trim(), builtAt: form.builtAt.trim(), lastSanitizedAt: form.lastSanitizedAt.trim(), notes: form.notes.trim(),
      breedId: form.breedId || undefined,
    };
    if (form.id) updateHall(form.id, data); else addHall(data);
    setOpen(false);
  };

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
      <HelpBanner
        id="hal-halls-intro"
        icon="🏭"
        title="سالن‌ها"
        description="سالن‌های مرغداری را اینجا تعریف کنید. برای هر سالن ابعاد، ظرفیت، شرایط محیطی و تجهیزات ثبت کنید. برای انتخاب چندتایی، روی یک کارت نگه دارید."
        tone="info"
      />

      {!ms.selectionMode && halls.length > 1 && (
        <div style={{ fontSize: '10px', color: 'var(--dim)', textAlign: 'center', paddingBottom: 2 }}>
          برای انتخاب چندتایی، روی یک کارت نگه دارید
        </div>
      )}

      {ms.selectionMode && halls.length > 1 && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
          <button type="button"
            onClick={ms.selectedIds.size === halls.length ? ms.clearSelection : ms.selectAll}
            style={{ padding: '4px 10px', background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', color: 'var(--muted)', fontFamily: 'inherit', fontSize: '10px', fontWeight: 600, cursor: 'pointer' }}>
            {ms.selectedIds.size === halls.length ? 'لغو انتخاب همه' : 'انتخاب همه'}
          </button>
        </div>
      )}

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
            const totalAirflow = hallEquips.filter(e => isFanLike(e.type)).reduce((a, e) => a + ((e.count || 0) * ((e as any).capacity || 0)), 0);
            const totalLightW = hallEquips.filter(e => isLampLike(e.type)).reduce((a, e) => a + ((e.count || 0) * ((e as any).capacity || 0)), 0);

            // ─── محاسبات هوشمند ───
            // ۱. تعویض هوا (m³/h ÷ m³ = بار در ساعت)
            const airChanges = volume > 0 && totalAirflow > 0 ? totalAirflow / volume : 0;
            const airStatus: 'good' | 'low' | 'none' = airChanges === 0 ? 'none' : airChanges >= 15 ? 'good' : 'low';
            const airAdvice = airChanges === 0
              ? 'فنی ثبت نشده'
              : airChanges >= 30 ? 'مناسب تابستان'
              : airChanges >= 15 ? 'مناسب'
              : airChanges >= 8 ? 'ضعیف — احتمال گرمی'
              : 'بسیار ضعیف — خطر';
            const airIcon = airChanges === 0 ? '—'
              : airChanges >= 30 ? '❄️'
              : airChanges >= 15 ? '✅'
              : airChanges >= 8 ? '⚠️'
              : '🔥';

            // ۲. روشنایی (lux = lumen ÷ مساحت)
            const lampEfficiency = 100; // lm/W پیش‌فرض
            const totalLumens = totalLightW * lampEfficiency;
            const lux = area > 0 && totalLumens > 0 ? totalLumens / area : 0;
            const lightStatus: 'good' | 'low' | 'none' = lux === 0 ? 'none' : lux >= 20 ? 'good' : lux >= 10 ? 'low' : 'low';
            const lightAdvice = lux === 0
              ? 'لامپی ثبت نشده'
              : lux >= 30 ? 'روشنایی قوی'
              : lux >= 20 ? 'مناسب تخم‌گذار'
              : lux >= 10 ? 'مناسب پرورش'
              : 'کم — احتمال افت تولید';
            const lightIcon = lux === 0 ? '—'
              : lux >= 30 ? '☀️'
              : lux >= 20 ? '🥚'
              : lux >= 10 ? '🐣'
              : '🌙';

            // ۳. ظرفیت واقعی از ابعاد
            const realCapacity = area > 0 && h.breedId
              ? Math.floor(area * 9)  // ۹ پرنده/m² پیش‌فرض تخم‌گذار
              : null;

            // ۴. بستر
            const litterKey = h.litterType && h.litterType !== 'none' ? h.litterType : null;
            const litterNeed = area > 0 && litterKey
              ? area * (LITTER_KG_PER_M2[litterKey] || 0)
              : 0;
            const hallFlocks = (flocks || []).filter((f: any) => f.hallId === h.id && f.status === 'active');
            const totalBirds = hallFlocks.reduce((sum: number, f: any) => sum + (f.currentCount || f.initialCount || 0), 0);
            // سن و نژاد برای محاسبه نیاز
            const activeFlock = hallFlocks[0];
            const flockAgeDays = activeFlock ? getAgeDays(activeFlock) : 0;
            const flockBreedId = activeFlock?.breedId || h.breedId || null;
            const flockStandard = flockBreedId ? breedStd.byBreedId(flockBreedId) : null;
            const isOpen = !ms.selectionMode && expandedId === h.id;
            return (
              <ExpandableCard key={h.id} id={h.id} ms={ms} accent="accent" index={fmt.int(i + 1)} iconEmoji="🏭"
                title={h.name + (h.code ? ` · ${h.code}` : '')}
                subtitle={h.length ? `${toFa(h.length)}×${toFa(h.width || 0)}×${toFa(h.height || 0)} متر` : 'ابعاد وارد نشده'}
                isOpen={isOpen} onToggle={() => setExpandedId(isOpen ? null : h.id)}
                badge={<>{zoneCount > 0 ? <Tag tone="blue">{fmt.int(zoneCount)} بخش</Tag> : null}{hallFlocks.length > 0 ? <Tag tone="green">{fmt.int(hallFlocks.length)} گله</Tag> : null}</>}
                stats={<>
                  {area > 0 && <span>مساحت: <b style={{ color: 'var(--text)' }}>{toFa(area.toFixed(1))} م²</b></span>}
                  {h.capacity && <span>ظرفیت: <b style={{ color: 'var(--text)' }}>{fmt.int(h.capacity)}</b></span>}
                  {equipCount > 0 && <span>تجهیز: <b style={{ color: 'var(--text)' }}>{fmt.int(equipCount)}</b></span>}
                    {totalBirds > 0 && <span>پرنده: <b style={{ color: 'var(--text)' }}>{fmt.int(totalBirds)}</b></span>}
                </>}
              >
                <div style={{ fontSize: 'var(--fs-base)', color: 'var(--text)', fontWeight: 700, letterSpacing: '.3px' }}><span style={{ fontSize: '1.05em', lineHeight: 1, display: 'inline-block', marginLeft: 4 }}>📐</span> ابعاد و ظرفیت</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <Row l="مساحت" v={`${toFa(area.toFixed(1))} م²`} />
                  <Row l="حجم" v={`${toFa(volume.toFixed(1))} م³`} />
                  <Row l="ظرفیت" v={h.capacity ? `${fmt.int(h.capacity)} پرنده` : '—'} />
                </div>

                {hallFlocks.length > 0 && (
                  <>
                    <div style={{ fontSize: 'var(--fs-base)', color: 'var(--text)', fontWeight: 700, letterSpacing: '.3px' }}>
                      <span style={{ fontSize: '1.05em', lineHeight: 1, display: 'inline-block', marginLeft: 4 }}>🐔</span> گله‌های فعال ({fmt.int(hallFlocks.length)})
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {hallFlocks.map((fl: any) => (
                        <Row
                          key={fl.id}
                          l={fl.name}
                          v={`${fmt.int(fl.currentCount || fl.initialCount || 0)} پرنده`}
                        />
                      ))}
                      <Row l="جمع کل" v={`${fmt.int(totalBirds)} پرنده`} accent />
                    </div>
                  </>
                )}

                <div style={{ fontSize: 'var(--fs-base)', color: 'var(--text)', fontWeight: 700, letterSpacing: '.3px' }}><span style={{ fontSize: '1.05em', lineHeight: 1, display: 'inline-block', marginLeft: 4 }}>🌡</span> شرایط محیطی</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <Row l="دمای هدف" v={h.targetTemp != null ? fmt.temp(h.targetTemp) : '—'} />
                  <Row l="رطوبت هدف" v={h.targetHumidity ? `${fmt.num(h.targetHumidity, { decimals: 0 })}٪` : '—'} />
                  <RowWithStatus
                    l="تهویه"
                    v={totalAirflow > 0 ? `${fmt.int(airChanges)} بار تعویض هوا در ساعت` : 'ثبت نشده'}
                    icon={totalAirflow > 0 ? airIcon : undefined}
                    hint={totalAirflow > 0 ? airAdvice : undefined}
                  />
                  <RowWithStatus
                    l="روشنایی"
                    v={totalLightW > 0 ? `${fmt.int(lux)} لوکس` : 'ثبت نشده'}
                    icon={totalLightW > 0 ? lightIcon : undefined}
                    hint={totalLightW > 0 ? lightAdvice : undefined}
                  />


                  {(h as any).systemNotes && (
                    <>
                      <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', fontWeight: 700, paddingTop: 4 }}>📝 یادداشت سیستم‌ها</div>
                      <div style={{ fontSize: 'var(--fs-sm)', lineHeight: 1.7, padding: 'var(--pad-tight)', background: 'var(--input-bg)', borderRadius: 'var(--r-sm)' }}>{(h as any).systemNotes}</div>
                    </>
                  )}
                  {realCapacity && !h.capacity && (
                    <Row l="ظرفیت پیشنهادی" v={`~${fmt.int(realCapacity)} پرنده (از مساحت)`} accent />
                  )}

                </div>

                <HallEquipSection
                  hallId={h.id}
                  needInput={{
                    birdCount: totalBirds,
                    ageDays: flockAgeDays,
                    areaM2: area,
                    volumeM3: volume,
                    standard: flockStandard,
                  }}
                  legacy={{
                    ventilationSystem: h.ventilationSystem,
                    feederType: h.feederType,
                    drinkerType: h.drinkerType,
                    litterType: h.litterType,
                  }}
                />

                {(h.builtAt || h.lastSanitizedAt || equipValue > 0) && (
                  <>
                    <div style={{ fontSize: 'var(--fs-base)', color: 'var(--text)', fontWeight: 700, letterSpacing: '.3px' }}><span style={{ fontSize: '1.05em', lineHeight: 1, display: 'inline-block', marginLeft: 4 }}>📅</span> زمان‌ها و ارزش</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {h.builtAt && <Row l="تاریخ ساخت" v={toFa(h.builtAt)} />}
                      {h.lastSanitizedAt && <Row l="آخرین ضدعفونی" v={toFa(h.lastSanitizedAt)} />}
                      {equipValue > 0 && <Row l="ارزش تجهیزات" v={fmt.money(equipValue)} accent />}
                    </div>
                  </>
                )}

                {h.address && (
                  <>
                    <div style={{ fontSize: 'var(--fs-base)', color: 'var(--text)', fontWeight: 700, letterSpacing: '.3px' }}>📍 آدرس</div>
                    <div style={{ fontSize: 'var(--fs-sm)', padding: 'var(--pad-normal)',
                       background: 'var(--input-bg)', borderRadius: 'var(--r-sm)' }}>{h.address}</div>
                  </>
                )}

                {h.notes && (
                  <>
                    <div style={{ fontSize: 'var(--fs-base)', color: 'var(--text)', fontWeight: 700, letterSpacing: '.3px' }}><span style={{ fontSize: '1.05em', lineHeight: 1, display: 'inline-block', marginLeft: 4 }}>📝</span> یادداشت</div>
                    <div style={{ fontSize: 'var(--fs-sm)', lineHeight: 1.7,
                       padding: 'var(--pad-normal)', background: 'var(--input-bg)',
                       borderRadius: 'var(--r-sm)' }}>{h.notes}</div>
                  </>
                )}

                <div style={{ display: 'flex', gap: 6, paddingTop: 4 }}>
                  <Btn size="sm" onClick={() => openEdit(h)} style={{ flex: 1 }}>ویرایش</Btn>
                  <Btn size="sm" onClick={async () => {
                    const idToDel = h.id; const ok = await showConfirmAsync('تأیید حذف', 'این سالن حذف شود؟', { danger: true }); if (!ok) return; const item = halls.find((x: any) => x.id === idToDel); if (item) { setUndoData({ item }); setTimeout(() => setUndoData((cur: any) => cur && cur.item.id === item.id ? null : cur), 6000); } deleteHall(idToDel);
                    logAction('delete', 'hal', 'حذف از سالن‌ها');  showToast('سالن حذف شد', 'info', 1800);
                    }} style={{ flex: 1 }}>حذف</Btn>
                </div>
              </ExpandableCard>
            );
          })}
          
        </>
      )}

      <MultiSelectBar ms={ms} deleteLabel="حذف" />

      {ms.selectionMode && <div style={{ height: 90 }} />}

      <Modal open={open} onClose={() => setOpen(false)} title={form.id ? 'ویرایش سالن' : 'افزودن سالن'}
        footer={<BtnRow><Btn variant="primary" onClick={save} disabled={Object.keys(vErrors).length > 0}>ذخیره</Btn><Btn onClick={() => setOpen(false)}>لغو</Btn></BtnRow>}>
        <Field label="نام سالن" required><Input placeholder="مثلاً — سالن شمالی" value={form.name} onChange={e => setForm({...form, name: e.target.value})} /></Field>
        <Grid2>
            <Field label="نژاد پرنده">
              <Select value={form.breedId} onChange={e => setForm({...form, breedId: e.target.value})}>
                <option value="">— انتخاب —</option>
                {breeds.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
              </Select>
            </Field>
            <Field label="ظرفیت" autoFrom={autoFields.has("capacity") ? "استاندارد" : undefined}>
              <NumField placeholder="۱۰۰۰" value={form.capacity} onChange={e => { setForm({...form, capacity: e.target.value}); clearAuto("capacity"); }} unit="پرنده" min={0} />
              {(() => {
                if (!form.breedId) return null;
                const std = breedStd.byBreedId(form.breedId);
                const density = std?.space?.densityMax;
                const L = parseFloat(toEn(form.length)) || 0;
                const W = parseFloat(toEn(form.width)) || 0;
                const area = L * W;
                if (area > 0 && density) {
                  const cap = Math.floor(area * density);
                  return (
                    <div
                      dir="ltr"
                      style={{
                        marginTop: 4,
                        fontSize: 11,
                        color: 'var(--muted)',
                        textAlign: 'center',
                        fontVariantNumeric: 'tabular-nums',
                        fontWeight: 600,
                      }}
                    >
                      {toFa(area)} × {toFa(density)} = {toFa(cap)}
                    </div>
                  );
                }
                return null;
              })()}
            </Field>
          </Grid2>
          {form.breedId && (
            <button
              type="button"
              onClick={() => {
                const std = breedStd.byBreedId(form.breedId);
                if (!std) return;
                const area = (parseFloat(toEn(form.length)) || 0) * (parseFloat(toEn(form.width)) || 0);
                const density = std.space?.densityMax;
                const cap = area > 0 && density ? Math.floor(area * density) : null;
                const env = std.env?.[0];
                const patch: any = {};
                if (cap) patch.capacity = String(cap);
                if (env?.temp?.target != null) patch.targetTemp = String(env.temp.target);
                if (env?.humidity?.min != null) patch.targetHumidity = String(env.humidity.min);
                setForm(f => ({ ...f, ...patch }));
                showToast('مقادیر از استاندارد پر شد', 'success', 1500);
              }}
              style={{
                marginTop: 6,
                width: '100%',
                padding: '8px',
                background: 'var(--accent-soft)',
                border: '1px solid var(--accent-border)',
                borderRadius: 'var(--r-md)',
                color: 'var(--accent)',
                cursor: 'pointer',
                fontFamily: 'inherit',
                fontSize: 12,
                fontWeight: 700,
                textAlign: 'center',
              }}
            >
              ✨ پر کردن خودکار از استاندارد
            </button>
          )}
        <div style={{ paddingTop: 8, fontSize: 'var(--fs-base)', fontWeight: 700, color: 'var(--text)', letterSpacing: '.3px', borderTop: '1px dashed var(--border)' }}>ابعاد</div>
        <Grid3>
          <Field label="طول"><NumField placeholder="۰" value={form.length} onChange={e => setForm({...form, length: e.target.value})} unit="m" min={1} /></Field>
          <Field label="عرض"><NumField placeholder="۰" value={form.width} onChange={e => setForm({...form, width: e.target.value})} unit="m" min={1} /></Field>
          <Field label="ارتفاع"><NumField placeholder="۰" value={form.height} onChange={e => setForm({...form, height: e.target.value})} unit="m" min={1} /></Field>
        </Grid3>
        

        <div style={{ paddingTop: 8, fontSize: 'var(--fs-base)', fontWeight: 700, color: 'var(--text)', letterSpacing: '.3px', borderTop: '1px dashed var(--border)' }}>شرایط</div>
          <Grid2>
          <TempFormField label="دمای هدف" placeholder="۲۲" autoFrom={autoFields.has("targetTemp") ? "استاندارد" : undefined} value={form.targetTemp} onChange={(v: string) => { setForm({...form, targetTemp: v}); clearAuto("targetTemp"); }} />
          <Field label="رطوبت هدف" autoFrom={autoFields.has("targetHumidity") ? "استاندارد" : undefined}><NumField placeholder="۶۰" value={form.targetHumidity} onChange={e => { setForm({...form, targetHumidity: e.target.value}); clearAuto("targetHumidity"); }} unit="٪" min={-10} /></Field>
        </Grid2>
        <div style={{ paddingTop: 8, fontSize: 'var(--fs-base)', fontWeight: 700, color: 'var(--text)', letterSpacing: '.3px', borderTop: '1px dashed var(--border)' }}>زمان‌ها</div>
        <Grid2>
          <Field label="تاریخ ساخت"><DatePicker value={form.builtAt} onChange={v => setForm({...form, builtAt: v})} placeholder="انتخاب تاریخ" /></Field>
          <Field label="آخرین ضدعفونی"><DatePicker value={form.lastSanitizedAt} onChange={v => setForm({...form, lastSanitizedAt: v})} placeholder="انتخاب تاریخ" /></Field>
        </Grid2>
        <Field label="آدرس سالن"><Input placeholder="..." value={form.address} onChange={e => setForm({...form, address: e.target.value})} /></Field>
        <Field label="یادداشت">
            <Textarea placeholder="..." value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} />
          </Field>
        <ErrorBox>{err}</ErrorBox>
      </Modal>
    </PageContainer>
  );
}
