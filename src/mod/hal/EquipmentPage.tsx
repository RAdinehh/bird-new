/**
 * EquipmentPage — تجهیزات
 */
import { useState, useRef } from 'react';
import { useValidation } from '../../shr/validation/useValidation';
import { EquipmentSchema } from '../../shr/validation/rules/hal';
import { useHal, type Equipment, type EquipmentKind, type EquipmentCategory, type EquipmentUnit, EQUIP_LABELS, EQUIP_CAPACITY_UNIT, EQUIP_EFFICIENCY_UNIT, CATEGORY_LABELS, KIND_LABELS, UNIT_LABELS_EQ } from './store';
import { Btn, BtnRow, Empty, Field, Grid2, Grid3, Input, Modal, MoneyField, NumField, PageContainer, Select, Tag, ErrorBox } from '../../shr/components/ui';;
import ExpandableCard from '../../shr/components/ExpandableCard';
import HelpBanner from '../../shr/components/HelpBanner';
import { toFa, toEn } from '../../shr/utils/fa';
import SmartSelect from '../../shr/components/SmartSelect';
import { showAlert } from '../../cor/store/dialog';
import { chip } from './helpers';
import EditableSelect from '../../shr/components/EditableSelect';
import { EquipmentIcon, CATEGORY_COLORS } from '../../shr/icons/equipment';
import { useCustomOptions } from '../../shr/store/customOptions';
import { useBreedStandard } from '../../shr/hooks/useBreedStandard';
import { useFlk } from '../flk/store';
import UndoBar from '../../cor/ui/UndoBar';
import { useMultiSelect } from '../../shr/multiSelect/useMultiSelect';
import MultiSelectBar from '../../shr/multiSelect/MultiSelectBar';
import { showToast } from '../../cor/store/toast';
import { showConfirmAsync } from '../../cor/store/dialog';
import { logAction } from '../../cor/logger/auditLog';
import { getEquipUnit } from './equipUnits';



/** دسته‌های مجاز برای هر نوع دارایی */
const CATEGORIES_BY_KIND: Record<string, string[]> = {
  asset:      ['ventilation', 'heating', 'lighting', 'drinking', 'feeding', 'power', 'auxiliary'],
  consumable: ['litter', 'feeding', 'drinking'],
  system:     ['ventilation', 'heating', 'lighting', 'power', 'auxiliary'],
};

function categoriesForKind(kind: string): string[] {
  return CATEGORIES_BY_KIND[kind] || Object.keys(CATEGORY_LABELS);
}

const TYPES_BY_CATEGORY: Record<string, string[]> = {
  ventilation: ['fan_tunnel', 'fan_ceiling', 'air_inlet', 'cooling_pad'],
  feeding:     ['feeder_manual', 'feeder_pan', 'feeder_chain', 'feeder_tube', 'feeder_bucket'],
  drinking:    ['nipple', 'cup', 'trough', 'fountain_drinker'],
  heating:     ['radiant_brooder', 'jet_heater', 'duct_heater'],
  lighting:    ['lamp_led', 'lamp_fluorescent', 'dimmer'],
  litter:      ['litter_wood_shavings', 'litter_roll', 'litter_sand'],
  power:       ['generator', 'electrical_panel', 'cable'],
  auxiliary:   ['camera', 'sensor', 'scale'],
};

function typesForCategory(cat: string): string[] {
  const list = TYPES_BY_CATEGORY[cat];
  return (list && list.length > 0) ? list : [];
}

function getCapacityHint(type: string, cap: number | null, hallVol: number | null, count: number = 1, eff: number | null = null): string {
  if (!cap || !hallVol || hallVol <= 0) return '';
  if (type === 'fan' || type === 'cooler') {
    const totalCap = cap * count;
    const changesPerHour = totalCap / hallVol;
    const minPerChange = Math.round(60 / changesPerHour);
    if (minPerChange <= 1) return 'هر دقیقه ۱ بار تعویض هوا — مناسب گرمای شدید';
    if (minPerChange <= 3) return 'هر ' + minPerChange + ' دقیقه ۱ بار تعویض هوا — مناسب تابستان';
    if (minPerChange <= 10) return 'هر ' + minPerChange + ' دقیقه ۱ بار تعویض هوا — مناسب بهار/پاییز';
    return 'هر ' + minPerChange + ' دقیقه ۱ بار تعویض هوا — مناسب زمستان';
  }
  if (type === 'lamp') {
    const luxPerWatt = eff || 85;
    const totalLumens = cap * count * luxPerWatt;
    const area = hallVol / 3;
    const lux = totalLumens / area;
    if (lux >= 20) return '~' + Math.round(lux) + ' لوکس — مناسب تخم‌گذار';
    if (lux >= 10) return '~' + Math.round(lux) + ' لوکس — مناسب پرورش';
    return '~' + Math.round(lux) + ' لوکس — نور کم';
  }
  return '';
}


/** محاسبه نیاز تجهیزات بر اساس گله فعال سالن و استاندارد نژاد */
function calcEquipNeed(
  type: string,
  hallId: string,
  flocks: any[],
  breedStd: any,
  hallArea: number,
): { need: number; unit: string; desc: string } | null {
  // گله فعال این سالن
  const flock = flocks.find((f: any) => f.hallId === hallId && f.status === 'active');
  if (!flock) return null;

  const std = breedStd.byBreedId(flock.breedId);
  if (!std || !std.equipment) return null;

  const count = flock.currentCount || 0;
  if (count <= 0) return null;

  if (type === 'feeder') {
    const eq = std.equipment.feeder;
    if (eq.panBirdsPerUnit) {
      const need = Math.ceil(count / eq.panBirdsPerUnit);
      return { need, unit: 'عدد', desc: count + ' پرنده ÷ ' + eq.panBirdsPerUnit + ' پرنده/واحد' };
    }
    if (eq.chainCmPerBird) {
      const meters = Math.ceil((count * eq.chainCmPerBird) / 100);
      return { need: meters, unit: 'متر', desc: count + ' پرنده × ' + eq.chainCmPerBird + ' سانتی‌متر' };
    }
  }

  if (type === 'drinker') {
    const eq = std.equipment.drinker;
    if (eq.nippleBirdsPerUnit) {
      const need = Math.ceil(count / eq.nippleBirdsPerUnit);
      return { need, unit: 'عدد', desc: count + ' پرنده ÷ ' + eq.nippleBirdsPerUnit + ' پرنده/نوپل' };
    }
    if (eq.cupBirdsPerUnit) {
      const need = Math.ceil(count / eq.cupBirdsPerUnit);
      return { need, unit: 'عدد', desc: count + ' پرنده ÷ ' + eq.cupBirdsPerUnit + ' پرنده/کاپ' };
    }
  }

  if (type === 'lamp' && hallArea > 0) {
    const w = std.equipment.lampWattPerM2 || 3;
    const totalW = Math.ceil(hallArea * w);
    return { need: totalW, unit: 'W', desc: hallArea + ' m² × ' + w + ' W/m²' };
  }

  if (type === 'fan') {
    const kg = std.equipment.fanM3PerKg || 4.5;
    // وزن هدف از growth یا فرض ۲ کیلوگرم
    const targetW = std.growth?.weightByAge?.[std.growth.weightByAge.length - 1]?.weightG || 2000;
    const totalKg = (count * targetW) / 1000;
    const need = Math.ceil(totalKg * kg);
    return { need, unit: 'm³/h', desc: 'وزن کل ' + Math.round(totalKg) + ' kg × ' + kg };
  }

  return null;
}

function calcEquipValue(e: any): number {
  const count = e.count || 0;
  const price = e.unitPrice || 0;
  if (!count || !price) return 0;
  const def = getEquipUnit(e.type || 'other');
  if (def.baseUnit === 'kg') {
    const base = def.calc(count, (e as any).capacity || 0);
    return Math.round(base * price);
  }
  return count * price;
}

export default function EquipmentPage() {
  const { halls, equipment, addEquip, updateEquip, deleteEquip } = useHal();
  const breedStd = useBreedStandard();
  const { flocks } = useFlk();
  const { options: allCustomOpts } = useCustomOptions();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>({ id:'', hallId:'', kind:'asset', category:'ventilation', type:'', name:'', count:'', unit:'pcs', unitPrice:'', purchasedAt:'', warranty:'', notes:'', capacity:'', efficiency:'', consumeRate:'' });
  const __selectedHall = halls.find(h => h.id === form.hallId);
  const hallVolume = __selectedHall
    ? (__selectedHall.length || 0) * (__selectedHall.width || 0) * (__selectedHall.height || 0)
    : null;
  const hallArea = __selectedHall
    ? (__selectedHall.length || 0) * (__selectedHall.width || 0)
    : 0;
  const equipNeed = calcEquipNeed(form.type, form.hallId, flocks || [], breedStd, hallArea);
  const [err, setErr] = useState('');
  const [autoFields, setAutoFields] = useState<Set<string>>(new Set());
  const [undoData, setUndoData] = useState<{ item: any } | null>(null);
  const [filter, setFilter] = useState('');
  const [filterKind, setFilterKind] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);




  const markAuto = (field: string) => {
    setAutoFields(prev => {
      const next = new Set(prev);
      next.add(field);
      return next;
    });
  };

  const clearAuto = (field: string) => {
    if (autoFields.has(field)) {
      setAutoFields(prev => {
        const next = new Set(prev);
        next.delete(field);
        return next;
      });
    }
  };

  const openNew = () => {
    const firstCat = categoriesForKind('asset')[0] || 'ventilation';
    setForm({ id:'', hallId: halls[0].id, kind:'asset', category: firstCat, type:'',
      name:'', count:'', unit:'pcs', unitPrice:'', purchasedAt:'',
      warranty:'', notes:'', capacity:'', efficiency:'', consumeRate:'' });
    setErr(''); setOpen(true);
  };

  const openEdit = (e: Equipment) => {
    setAutoFields(new Set());
    setForm({
      id: e.id, hallId: e.hallId,
      kind: (e as any).kind || 'asset',
      category: (e as any).category || 'lighting',
      unit: (e as any).unit || 'pcs',
      type: e.type, name: e.name,
      count: e.count ? toFa(e.count) : '',
      unitPrice: e.unitPrice ? toFa(e.unitPrice) : '',
      purchasedAt: e.purchasedAt,
      warranty: e.warranty ? toFa(e.warranty) : '',
      notes: e.notes,
      capacity: (e as any).capacity ? toFa((e as any).capacity) : '',
      efficiency: (e as any).efficiency ? toFa((e as any).efficiency) : '',
      consumeRate: (e as any).consumeRate || '',
    });
    setErr(''); setOpen(true);
  };

  // ═══ اعتبارسنجی زنده ═══
  const num = (s: string) => s ? parseFloat(toEn(s).replace('٫','.')) || 0 : 0;
  const int = (s: string) => s ? parseInt(toEn(s)) || 0 : 0;
  const { errors: vErrors } = useValidation(
    EquipmentSchema,
    {
      hallId: form.hallId || '',
      kind: form.kind || 'asset',
      category: form.category || 'auxiliary',
      type: form.type || '',
      name: form.name || '',
      count: form.count ? parseInt(toEn(form.count)) || 0 : 0,
      unit: form.unit || 'pcs',
      unitPrice: form.unitPrice ? parseFloat(toEn(form.unitPrice).replace('٫','.')) || 0 : 0,
      purchasedAt: form.purchasedAt || '',
      warranty: form.warranty ? parseInt(toEn(form.warranty)) || 0 : 0,
      capacity: form.capacity ? parseFloat(toEn(form.capacity).replace('٫','.')) || 0 : 0,
      efficiency: form.efficiency ? parseFloat(toEn(form.efficiency).replace('٫','.')) || 0 : 0,
      consumeRate: form.consumeRate || undefined,
      sourceInvoiceId: '',
      warehouseItemId: '',
      notes: form.notes || '',
    },
  );

  if (halls.length === 0) {
  const undoDelete = () => {
    const item = undoData;
    if (!item) return;
    try {
      addEquip(item.item);
      showToast('تجهیز بازگردانی شد', 'success', 2000);
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
        <Empty
          icon={<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>}
          title="اول یک سالن بسازید"
          desc="تجهیزات داخل سالن قرار می‌گیرند. اول از تب «سالن‌ها» استفاده کنید."
        />
      </PageContainer>
    );
  }

  const save = async () => {

    // 🔒 جلوگیری قاطع از نام تکراری تجهیزات
    if (!form.id) {
      const _trimmed = form.name.trim();
      const _dup = equipment.find((x: any) => x.hallId === form.hallId && x.name.trim() === _trimmed);
      if (_dup) {
        showAlert(
          `تجهیزاتای با نام «${_dup.name}» قبلاً ثبت شده. لطفاً نام دیگری انتخاب کنید یا همان را ویرایش کنید.`,
          '❌ نام تکراری'
        );
        return;
      }
    }

    if (!form.name.trim()) { setErr('نام تجهیز اجباری است'); return; }
    const data = {
      hallId: form.hallId,
      kind: form.kind || 'asset',
      category: form.category || 'auxiliary',
      type: form.type,
      name: form.name.trim(),
      count: form.count ? parseInt(toEn(form.count)) || null : null,
      unit: form.unit || 'pcs',
      unitPrice: form.unitPrice ? parseFloat(toEn(form.unitPrice).replace('٫','.')) || null : null,
      purchasedAt: form.purchasedAt.trim(),
      warranty: form.warranty ? parseInt(toEn(form.warranty)) || null : null,
      notes: form.notes.trim(),
      capacity: form.capacity ? parseFloat(toEn(form.capacity).replace('٫','.')) || null : null,
      efficiency: form.efficiency ? parseFloat(toEn(form.efficiency).replace('٫','.')) || null : null,
      consumeRate: form.consumeRate || undefined,
    };
    if (form.id) updateEquip(form.id, data); else addEquip(data);
    setOpen(false);
  };

  const saveAndNext = () => {
    // بدون چک تکراری
    if (!form.name.trim()) { setErr('نام تجهیز اجباری است'); return; }
    const data = {
      hallId: form.hallId,
      kind: form.kind || 'asset',
      category: form.category || 'auxiliary',
      type: form.type,
      name: form.name.trim(),
      count: form.count ? parseInt(toEn(form.count)) || null : null,
      unit: form.unit || 'pcs',
      unitPrice: form.unitPrice ? parseFloat(toEn(form.unitPrice).replace('٫','.')) || null : null,
      purchasedAt: form.purchasedAt.trim(),
      warranty: form.warranty ? parseInt(toEn(form.warranty)) || null : null,
      notes: form.notes.trim(),
      capacity: form.capacity ? parseFloat(toEn(form.capacity).replace('٫','.')) || null : null,
      efficiency: form.efficiency ? parseFloat(toEn(form.efficiency).replace('٫','.')) || null : null,
      consumeRate: form.consumeRate || undefined,
    };
    addEquip(data);
    showToast('ذخیره شد — تجهیز بعدی', 'success', 1500);
    // پاک کردن فقط نام و مشخصات، نگه‌داشتن سالن و نوع
    setForm((f: any) => ({
      ...f,
      id: '', name: '', count: '', unitPrice: '', purchasedAt: '',
      warranty: '', notes: '', capacity: '', efficiency: '',
    }));
    setErr('');
  };

  const list = equipment.filter(e => (!filter || e.hallId === filter) && (!filterKind || ((e as any).kind || 'asset') === filterKind));

  // ─── Multi-Select ───
  const ms = useMultiSelect({
    items: list,
    getId: (e: any) => e.id,
    onDelete: async (ids) => {
      const ok = await showConfirmAsync('حذف گروهی', toFa(ids.length) + ' تجهیز حذف شوند؟', { danger: true });
      if (!ok) return;
      const backups: any[] = [];
      for (const id of ids) {
        const item = equipment.find(x => x.id === id);
        if (!item) continue;
        backups.push(item);
        try { deleteEquip(id); } catch {}
      }
      if (backups.length > 0) {
        setUndoData({ item: backups });
        setTimeout(() => setUndoData((cur: any) => cur && Array.isArray(cur.item) && cur.item.length === backups.length ? null : cur), 8000);
      }
      showToast(toFa(backups.length) + ' تجهیز حذف شد', 'success', 2500);
      logAction('delete', 'hal', 'حذف گروهی تجهیزات: ' + backups.length);
    },
    onArchive: async (ids) => {
      showToast(toFa(ids.length) + ' تجهیز آرشیو شد', 'success', 2500);
    },
  });
  const totalValue = list.reduce((acc, e) => acc + calcEquipValue(e), 0);

  return (
    <PageContainer>
      <HelpBanner
        id="hal-equip-intro"
        icon="⚙️"
        title="مدیریت تجهیزات"
        description="تجهیزات هر سالن (فن، لامپ، آبخوری، دانخوری، بستر و...) را اینجا ثبت کنید. با انتخاب نوع دارایی و دسته، زیرنوع‌های مربوطه نمایش داده می‌شوند."
        tone="info"
      />

      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
        <button onClick={() => setFilterKind('')} style={chip(!filterKind)}>همه انواع</button>
        {Object.entries(KIND_LABELS).map(([k, v]: any) => (
          <button key={k} onClick={() => setFilterKind(k)} style={chip(filterKind === k)}>{v.icon} {v.name}</button>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
        <button onClick={() => setFilter('')} style={chip(!filter)}>همه سالن‌ها</button>
        {halls.map(h => (
          <button key={h.id} onClick={() => setFilter(h.id)} style={chip(filter === h.id)}>{h.name}</button>
        ))}
      </div>

      {!ms.selectionMode && list.length > 1 && (
        <div style={{ fontSize: '10px', color: 'var(--dim)', textAlign: 'center', paddingBottom: 2 }}>
          برای انتخاب چندتایی، روی یک کارت نگه دارید
        </div>
      )}

      {ms.selectionMode && list.length > 1 && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
          <button
            type="button"
            onClick={ms.selectedIds.size === list.length ? ms.clearSelection : ms.selectAll}
            style={{
              padding: '4px 10px',
              background: 'var(--input-bg)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--r-sm)',
              color: 'var(--muted)',
              fontFamily: 'inherit',
              fontSize: '10px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {ms.selectedIds.size === list.length ? 'لغو انتخاب همه' : 'انتخاب همه'}
          </button>
        </div>
      )}

      {list.length > 0 && (
        <div style={{
          padding: 'var(--pad-comfy)', background: 'var(--accent-soft)',
          border: '1px solid var(--accent-border)', borderRadius: 'var(--r-md)',
          fontSize: 'var(--fs-base)', color: 'var(--accent)', fontWeight: 600,
          display: 'flex', justifyContent: 'space-between'
        }}>
          <span>ارزش کل تجهیزات:</span>
          <span>{toFa(totalValue.toLocaleString('fa-IR'))} تومان</span>
        </div>
      )}

      {list.length === 0 ? (
        <Empty
          icon={<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>}
          title="تجهیزی ثبت نشده"
          desc="لامپ، فن، هیتر، آبخوری، دانخوری، دوربین و سنسور را اضافه کنید."
          action={<Btn variant="primary" onClick={openNew}>+ افزودن تجهیز</Btn>}
        />
      ) : (
        <>
          {list.map((e, i) => {
            const hall = halls.find(h => h.id === e.hallId);
            const _cm = (allCustomOpts as any[]).find(o => o.key.startsWith('hal.equip.type.') && o.name === e.type);
            const _isDeleted = _cm ? _cm.hidden === true : false;
            const meta = EQUIP_LABELS[e.type] || (_cm ? { name: _cm.name, icon: _cm.icon } : { name: 'سایر', icon: '🔧' });
            const value = calcEquipValue(e);
            const isOpen = expandedId === e.id;
            return (
              <ExpandableCard
                key={e.id}
                id={e.id}
                ms={ms}
                accent="accent"
                index={toFa(i + 1)}
                iconEmoji={meta.icon}
                title={e.name}
                subtitle={`${meta.name}${_isDeleted ? ' · حذف‌شده' : ''} · ${hall?.name || '—'}`}
                isOpen={isOpen}
                onToggle={() => setExpandedId(isOpen ? null : e.id)}
                badge={e.count ? <Tag tone="blue">{toFa(e.count)} {(UNIT_LABELS_EQ as any)[(e as any).unit || 'pcs'] || 'عدد'}</Tag> : undefined}
                stats={<>
                  {e.count && <span>تعداد: <b style={{ color: 'var(--text)' }}>{toFa(e.count)} {(UNIT_LABELS_EQ as any)[(e as any).unit || 'pcs'] || 'عدد'}</b></span>}
                  {value > 0 && <span>ارزش: <b style={{ color: 'var(--text)' }}>{toFa(value.toLocaleString('fa-IR'))} ت</b></span>}
                  {e.warranty && <span>گارانتی: <b style={{ color: 'var(--text)' }}>{toFa(e.warranty)} ماه</b></span>}
                </>}
              >
                <div style={{ fontSize: 'var(--fs-base)', color: 'var(--text)', fontWeight: 700, letterSpacing: '.3px' }}><span style={{ fontSize: '1.05em', lineHeight: 1, display: 'inline-block', marginLeft: 4 }}>🔧</span> مشخصات</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between',
                     fontSize: 'var(--fs-sm)', padding: 'var(--pad-tight)', background: 'var(--input-bg)',
                     borderRadius: 'var(--r-sm)' }}>
                    <span style={{ color: 'var(--muted)' }}>نوع:</span>
                    <span style={{ fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      {meta.name}
                      {_isDeleted && (
                        <span style={{
                          fontSize: 10, fontWeight: 700,
                          padding: '2px 7px', borderRadius: 6,
                          background: 'rgba(217,119,6,.14)', color: 'var(--warn)',
                          letterSpacing: '.3px',
                        }}>حذف‌شده</span>
                      )}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between',
                     fontSize: 'var(--fs-sm)', padding: 'var(--pad-tight)', background: 'var(--input-bg)',
                     borderRadius: 'var(--r-sm)' }}>
                    <span style={{ color: 'var(--muted)' }}>نوع دارایی:</span>
                    <span style={{ fontWeight: 600 }}>{(KIND_LABELS as any)[(e as any).kind || 'asset']?.icon} {(KIND_LABELS as any)[(e as any).kind || 'asset']?.name}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between',
                     fontSize: 'var(--fs-sm)', padding: 'var(--pad-tight)', background: 'var(--input-bg)',
                     borderRadius: 'var(--r-sm)' }}>
                    <span style={{ color: 'var(--muted)' }}>دسته:</span>
                    <span style={{ fontWeight: 600 }}>{(CATEGORY_LABELS as any)[(e as any).category || 'auxiliary']?.icon} {(CATEGORY_LABELS as any)[(e as any).category || 'auxiliary']?.name}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between',
                     fontSize: 'var(--fs-sm)', padding: 'var(--pad-tight)', background: 'var(--input-bg)',
                     borderRadius: 'var(--r-sm)' }}>
                    <span style={{ color: 'var(--muted)' }}>سالن:</span>
                    <span style={{ fontWeight: 600 }}>{hall?.name || '—'}</span>
                  </div>
                  {e.count && (
                    <div style={{ display: 'flex', justifyContent: 'space-between',
                       fontSize: 'var(--fs-sm)', padding: 'var(--pad-tight)', background: 'var(--input-bg)',
                       borderRadius: 'var(--r-sm)' }}>
                      <span style={{ color: 'var(--muted)' }}>تعداد:</span>
                      <span style={{ fontWeight: 600 }}>{toFa(e.count)} {(UNIT_LABELS_EQ as any)[(e as any).unit || 'pcs'] || 'عدد'}</span>
                    </div>
                  )}
                </div>

                {(e.unitPrice || value > 0 || e.purchasedAt || e.warranty) && (
                  <>
                    <div style={{ fontSize: 'var(--fs-base)', color: 'var(--text)', fontWeight: 700, letterSpacing: '.3px' }}><span style={{ fontSize: '1.05em', lineHeight: 1, display: 'inline-block', marginLeft: 4 }}>💰</span> مالی</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {e.unitPrice && (
                        <div style={{ display: 'flex', justifyContent: 'space-between',
                           fontSize: 'var(--fs-sm)', padding: 'var(--pad-tight)',
                           background: 'var(--input-bg)', borderRadius: 'var(--r-sm)' }}>
                          <span style={{ color: 'var(--muted)' }}>قیمت واحد:</span>
                          <span style={{ fontWeight: 600 }}>{toFa(e.unitPrice.toLocaleString('fa-IR'))} ت</span>
                        </div>
                      )}
                      {value > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between',
                           fontSize: 'var(--fs-sm)', padding: 'var(--pad-tight)',
                           background: 'var(--accent-soft)', color: 'var(--accent)',
                           borderRadius: 'var(--r-sm)', fontWeight: 700 }}>
                          <span>ارزش کل:</span>
                          <span>{toFa(value.toLocaleString('fa-IR'))} ت</span>
                        </div>
                      )}
                      {e.purchasedAt && (
                        <div style={{ display: 'flex', justifyContent: 'space-between',
                           fontSize: 'var(--fs-sm)', padding: 'var(--pad-tight)',
                           background: 'var(--input-bg)', borderRadius: 'var(--r-sm)' }}>
                          <span style={{ color: 'var(--muted)' }}>تاریخ خرید:</span>
                          <span style={{ fontWeight: 600 }}>{toFa(e.purchasedAt)}</span>
                        </div>
                      )}
                      {e.warranty && (
                        <div style={{ display: 'flex', justifyContent: 'space-between',
                           fontSize: 'var(--fs-sm)', padding: 'var(--pad-tight)',
                           background: 'var(--input-bg)', borderRadius: 'var(--r-sm)' }}>
                          <span style={{ color: 'var(--muted)' }}>گارانتی:</span>
                          <span style={{ fontWeight: 600 }}>{toFa(e.warranty)} ماه</span>
                        </div>
                      )}
                    </div>
                  </>
                )}

                {e.notes && (
                  <>
                    <div style={{ fontSize: 'var(--fs-base)', color: 'var(--text)', fontWeight: 700, letterSpacing: '.3px' }}><span style={{ fontSize: '1.05em', lineHeight: 1, display: 'inline-block', marginLeft: 4 }}>📝</span> یادداشت</div>
                    <div style={{ fontSize: 'var(--fs-sm)', lineHeight: 1.7,
                       padding: 'var(--pad-normal)', background: 'var(--input-bg)',
                       borderRadius: 'var(--r-sm)' }}>{e.notes}</div>
                  </>
                )}

                <div style={{ display: 'flex', gap: 6, paddingTop: 4 }}>
                  {e.unitPrice && e.unitPrice > 0 && (
                    <Btn
                      size="sm"
                      variant="primary"
                      onClick={() => {
                        const params = new URLSearchParams({
                          _tra: 'equip',
                          equipmentId: e.id,
                          name: e.name,
                          type: e.type || 'other',
                          qty: String(e.count || 1),
                          price: String(e.unitPrice || 0),
                          hallId: e.hallId,
                        });
                        window.location.href = '/tra?' + params.toString();
                      }}
                      style={{ flex: 1 }}
                    >
                      💰 ثبت فاکتور
                    </Btn>
                  )}
                  <Btn size="sm" onClick={() => openEdit(e)} style={{ flex: 1 }}>ویرایش</Btn>
                  <Btn size="sm" onClick={async () => {
                    const idToDel = e.id; const ok = await showConfirmAsync('تأیید حذف', 'این تجهیز حذف شود؟', { danger: true }); if (!ok) return; const item = equipment.find((x: any) => x.id === idToDel); if (item) { setUndoData({ item }); setTimeout(() => setUndoData((cur: any) => cur && cur.item.id === item.id ? null : cur), 6000); } deleteEquip(idToDel);
                    logAction('delete', 'hal', 'حذف از سالن‌ها');  showToast('تجهیز حذف شد', 'info', 1800);
                    }} style={{ flex: 1 }}>حذف</Btn>
                </div>
              </ExpandableCard>
            );
          })}
          <Btn variant="primary" full onClick={openNew}>+ افزودن تجهیز</Btn>
        </>
      )}

      {/* نوار شناور Multi-Select */}
      <MultiSelectBar ms={ms} deleteLabel="حذف" archiveLabel="آرشیو" />

      {/* فاصله‌ی پایین برای نوار شناور */}
      {ms.selectionMode && <div style={{ height: 90 }} />}

      <Modal open={open} onClose={() => setOpen(false)} title={form.id ? 'ویرایش تجهیز' : 'افزودن تجهیز'}
        footer={<div style={{ display: "flex", gap: 6 }}><Btn variant="primary" onClick={save} disabled={Object.keys(vErrors).length > 0} style={{ flex: 1 }}>ذخیره</Btn><Btn onClick={() => setOpen(false)} style={{ flex: 1 }}>لغو</Btn></div>}>
        <Grid2>
          <Field label="نوع دارایی" required>
            <Select value={form.kind || 'asset'} onChange={e => {
              const newKind = e.target.value;
              const allowedCats = categoriesForKind(newKind);
              const nextCat = allowedCats.includes(form.category) ? form.category : allowedCats[0];
              const allowedTypes = typesForCategory(nextCat);
              const nextType = allowedTypes.includes(form.type) ? form.type : (allowedTypes[0] || 'other');
              setForm({ ...form, kind: newKind, category: nextCat, type: nextType });
            }}>
              {Object.entries(KIND_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v.icon} {v.name}</option>
              ))}
            </Select>
          </Field>
          <Field label="دسته" required>
            <Select value={form.category || 'auxiliary'} onChange={e => {
              const cat = e.target.value;
              const allowed = typesForCategory(cat);
              const nextType = allowed.includes(form.type) ? form.type : (allowed[0] || 'other');
              setForm({...form, category: cat, type: nextType});
            }}>
              {categoriesForKind(form.kind || 'asset').map(k => {
                const v = (CATEGORY_LABELS as any)[k];
                if (!v) return null;
                return <option key={k} value={k}>{v.icon} {v.name}</option>;
              })}
            </Select>
          </Field>
        </Grid2>

        <Grid2>
          <Field label="سالن" required>
            <SmartSelect
              value={form.hallId}
              onChange={v => setForm((f: any) => ({ ...f, hallId: v }))}
              options={halls.map(c => ({ value: c.id, label: c.name }))}
              placeholder="— انتخاب کنید —"
              modalTitle="انتخاب سالن"
              autoThreshold={6}
            />
          </Field>
          <EditableSelect
            label="زیرنوع"
            required
            value={form.type}
            onChange={v => {
              const def = getEquipUnit(v);
              const patch: any = { type: v };
              if (def.secondary?.defaultValue && !form.capacity) {
                patch.capacity = String(def.secondary.defaultValue);
              }
              setForm({ ...form, ...patch });
              if (def.secondary?.defaultValue) markAuto('capacity');
            }}
            options={typesForCategory(form.category || 'auxiliary').map(k => {
              const v = (EQUIP_LABELS as any)[k] || { name: k };
              const catColor = CATEGORY_COLORS[form.category || 'auxiliary'] || '#475569';
              return {
                value: k,
                label: v.name,
                icon: <EquipmentIcon type={k} size={22} weight="duotone" color={catColor} />,
              };
            })}
            customKey={'hal.equip.type.' + (form.category || 'auxiliary')}
            usageCheck={(name) => equipment.filter((x: any) => x.type === name).length}
          />
        </Grid2>

        <Grid2>
          <Field label="نام تجهیز" required>
            <Input placeholder="مثلاً — لامپ LED سقفی" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
          </Field>
          <Field label="تاریخ خرید">
            <Input placeholder="۱۴۰۵/۰۷/۰۴" value={form.purchasedAt} onChange={e => setForm({...form, purchasedAt: e.target.value})} />
          </Field>
        </Grid2>

        <Grid2>
          <Field label="تعداد">
            <NumField placeholder="۰" value={form.count} onChange={e => setForm({...form, count: e.target.value})} unit={(UNIT_LABELS_EQ as any)[form.unit || 'pcs'] || 'عدد'} min={0} />
            {equipNeed ? (
              <div style={{
                fontSize: 11,
                marginTop: 4,
                lineHeight: 1.6,
                padding: '6px 8px',
                borderRadius: 'var(--r-sm)',
                background: (parseInt(toEn(form.count)) || 0) >= equipNeed.need ? 'var(--accent-soft)' : 'var(--danger-soft)',
                color: (parseInt(toEn(form.count)) || 0) >= equipNeed.need ? 'var(--accent)' : 'var(--danger)',
              }}>
                {(() => {
                  const have = parseInt(toEn(form.count)) || 0;
                  if (have >= equipNeed.need) {
                    return '✓ کافیه — نیاز ' + equipNeed.need + ' ' + equipNeed.unit + ' (' + equipNeed.desc + ')';
                  }
                  const pct = equipNeed.need > 0 ? Math.round((have / equipNeed.need) * 100) : 0;
                  return '⚠ کم داره — نیاز ' + equipNeed.need + ' ' + equipNeed.unit + ' · فعلی ' + pct + '٪';
                })()}
              </div>
            ) : null}
          </Field>

        </Grid2>

        <Grid2>
          <Field label={(() => {
            const def = getEquipUnit(form.type || 'other');
            if (def.baseUnit === 'kg') return 'قیمت هر kg';
            return 'قیمت هر عدد';
          })()}>
            <MoneyField placeholder="۰" value={form.unitPrice} onChange={e => setForm({...form, unitPrice: e.target.value})} />
          </Field>
          <Field label="گارانتی"><NumField placeholder="۶" value={form.warranty} onChange={e => setForm({...form, warranty: e.target.value})} unit="ماه" min={0} /></Field>
        </Grid2>

        {(() => {
          const def = getEquipUnit(form.type);
          if (!def.secondary) return null;
          return (
            <Field
              label={def.secondary.label}
              autoFrom={autoFields.has('capacity') && String(form.capacity) === String(def.secondary.defaultValue) ? 'پیش‌فرض' : undefined}
              hint={`واحد: ${def.secondary.unit}${def.secondary.defaultValue ? ` — پیش‌فرض ${def.secondary.defaultValue}` : ''}`}
            >
              <NumField
                placeholder={def.secondary.defaultValue ? String(def.secondary.defaultValue) : '۰'}
                value={form.capacity}
                onChange={e => {
                  setForm({ ...form, capacity: e.target.value });
                  clearAuto('capacity');
                }}
                unit={def.secondary.unit}
                min={0}
              />
            </Field>
          );
        })()}

      </Modal>
    </PageContainer>
  );
}
