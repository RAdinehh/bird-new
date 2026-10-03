/**
 * EquipmentPage — تجهیزات
 */
import { useState } from 'react';
import { useHal, type Equipment, EQUIP_LABELS, EQUIP_CAPACITY_UNIT, EQUIP_EFFICIENCY_UNIT } from './store';
import { Btn, BtnRow, Empty, Field, Grid2, Grid3, Input, Modal, MoneyField, NumField, PageContainer, Select, Tag, ErrorBox } from '../../shr/components/ui';;
import ExpandableCard from '../../shr/components/ExpandableCard';
import { toFa, toEn } from '../../shr/utils/fa';
import SmartSelect from '../../shr/components/SmartSelect';
import { showAlert } from '../../cor/store/dialog';
import { chip } from './helpers';
import { useBreedStandard } from '../../shr/hooks/useBreedStandard';
import { useFlk } from '../flk/store';
import UndoBar from '../../cor/ui/UndoBar';
import { showToast } from '../../cor/store/toast';
import { showConfirmAsync } from '../../cor/store/dialog';
import { logAction } from '../../cor/logger/auditLog';


function getCapacityHint(type: string, cap: number | null, hallVol: number | null): string {
  if (!cap || !hallVol || hallVol <= 0) return '';
  if (type === 'fan' || type === 'cooler') {
    const changesPerHour = cap / hallVol;
    const minPerChange = Math.round(60 / changesPerHour);
    if (minPerChange <= 1) return 'هر دقیقه ۱ بار تعویض هوا — مناسب گرمای شدید';
    if (minPerChange <= 3) return 'هر ' + minPerChange + ' دقیقه ۱ بار تعویض هوا — مناسب تابستان';
    if (minPerChange <= 10) return 'هر ' + minPerChange + ' دقیقه ۱ بار تعویض هوا — مناسب بهار/پاییز';
    return 'هر ' + minPerChange + ' دقیقه ۱ بار تعویض هوا — مناسب زمستان';
  }
  if (type === 'lamp') {
    const luxPerWatt = 85;
    const lux = (cap * luxPerWatt) / (hallVol / 3);
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

export default function EquipmentPage() {
  const { halls, equipment, addEquip, updateEquip, deleteEquip } = useHal();
  const breedStd = useBreedStandard();
  const { flocks } = useFlk();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ id:'', hallId:'', type:'lamp', name:'', count:'', unitPrice:'', purchasedAt:'', warranty:'', notes:'', capacity:'', efficiency:'' });
  const __selectedHall = halls.find(h => h.id === form.hallId);
  const hallVolume = __selectedHall
    ? (__selectedHall.length || 0) * (__selectedHall.width || 0) * (__selectedHall.height || 0)
    : null;
  const hallArea = __selectedHall
    ? (__selectedHall.length || 0) * (__selectedHall.width || 0)
    : 0;
  const equipNeed = calcEquipNeed(form.type, form.hallId, flocks || [], breedStd, hallArea);
  const [err, setErr] = useState('');
  const [delId, setDelId] = useState<string | null>(null);
  const [undoData, setUndoData] = useState<{ item: any } | null>(null);
  const [filter, setFilter] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

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

  const openNew = () => { setForm({ id:'', hallId: halls[0].id, type:'lamp',
     name:'', count:'', unitPrice:'', purchasedAt:'', warranty:'', notes:'', capacity:'', efficiency:'' }); setErr(''); setOpen(true); };
  const openEdit = (e: Equipment) => {
    setForm({ id: e.id, hallId: e.hallId, type: e.type, name: e.name, count: e.count ? toFa(e.count) : '',
       unitPrice: e.unitPrice ? toFa(e.unitPrice) : '', purchasedAt: e.purchasedAt,
       warranty: e.warranty ? toFa(e.warranty) : '', notes: e.notes,
       capacity: (e as any).capacity ? toFa((e as any).capacity) : '',
       efficiency: (e as any).efficiency ? toFa((e as any).efficiency) : '' });
    setErr(''); setOpen(true);
  };

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
      hallId: form.hallId, type: form.type, name: form.name.trim(),
      count: form.count ? parseInt(toEn(form.count)) || null : null,
      unitPrice: form.unitPrice ? parseFloat(toEn(form.unitPrice).replace('٫','.')) || null : null,
      purchasedAt: form.purchasedAt.trim(),
      warranty: form.warranty ? parseInt(toEn(form.warranty)) || null : null,
      notes: form.notes.trim(),
      capacity: form.capacity ? parseFloat(toEn(form.capacity).replace('٫','.')) || null : null,
      efficiency: form.efficiency ? parseFloat(toEn(form.efficiency).replace('٫','.')) || null : null,
    };
    if (form.id) updateEquip(form.id, data); else addEquip(data);
    setOpen(false);
  };

  const saveAndNext = () => {
    // بدون چک تکراری
    if (!form.name.trim()) { setErr('نام تجهیز اجباری است'); return; }
    const data = {
      hallId: form.hallId, type: form.type, name: form.name.trim(),
      count: form.count ? parseInt(toEn(form.count)) || null : null,
      unitPrice: form.unitPrice ? parseFloat(toEn(form.unitPrice).replace('٫','.')) || null : null,
      purchasedAt: form.purchasedAt.trim(),
      warranty: form.warranty ? parseInt(toEn(form.warranty)) || null : null,
      notes: form.notes.trim(),
      capacity: form.capacity ? parseFloat(toEn(form.capacity).replace('٫','.')) || null : null,
      efficiency: form.efficiency ? parseFloat(toEn(form.efficiency).replace('٫','.')) || null : null,
    };
    addEquip(data);
    showToast('ذخیره شد — تجهیز بعدی', 'success', 1500);
    // پاک کردن فقط نام و مشخصات، نگه‌داشتن سالن و نوع
    setForm(f => ({
      ...f,
      id: '', name: '', count: '', unitPrice: '', purchasedAt: '',
      warranty: '', notes: '', capacity: '', efficiency: '',
    }));
    setErr('');
  };

  const list = filter ? equipment.filter(e => e.hallId === filter) : equipment;
  const target = delId ? equipment.find(e => e.id === delId) : null;
  const totalValue = list.reduce((acc, e) => acc + ((e.count || 0) * (e.unitPrice || 0)), 0);

  return (
    <PageContainer>
      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
        <button onClick={() => setFilter('')} style={chip(!filter)}>همه</button>
        {halls.map(h => (
          <button key={h.id} onClick={() => setFilter(h.id)} style={chip(filter === h.id)}>{h.name}</button>
        ))}
      </div>

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
            const meta = EQUIP_LABELS[e.type] || { name: 'سایر', icon: '🔧' };
            const value = (e.count || 0) * (e.unitPrice || 0);
            const isOpen = expandedId === e.id;
            return (
              <ExpandableCard
                key={e.id}
                accent="accent"
                index={toFa(i + 1)}
                iconEmoji={meta.icon}
                title={e.name}
                subtitle={`${meta.name} · ${hall?.name || '—'}`}
                isOpen={isOpen}
                onToggle={() => setExpandedId(isOpen ? null : e.id)}
                badge={e.count ? <Tag tone="blue">{toFa(e.count)} عدد</Tag> : undefined}
                stats={<>
                  {e.count && <span>تعداد: <b style={{ color: 'var(--text)' }}>{toFa(e.count)}</b></span>}
                  {value > 0 && <span>ارزش: <b style={{ color: 'var(--text)' }}>{toFa(value.toLocaleString('fa-IR'))} ت</b></span>}
                  {e.warranty && <span>گارانتی: <b style={{ color: 'var(--text)' }}>{toFa(e.warranty)} ماه</b></span>}
                </>}
              >
                <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', fontWeight: 700, letterSpacing: '.3px' }}>🔧 مشخصات</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between',
                     fontSize: 'var(--fs-sm)', padding: 'var(--pad-tight)', background: 'var(--input-bg)',
                     borderRadius: 'var(--r-sm)' }}>
                    <span style={{ color: 'var(--muted)' }}>نوع:</span>
                    <span style={{ fontWeight: 600 }}>{meta.name}</span>
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
                      <span style={{ fontWeight: 600 }}>{toFa(e.count)} عدد</span>
                    </div>
                  )}
                </div>

                {(e.unitPrice || value > 0 || e.purchasedAt || e.warranty) && (
                  <>
                    <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', fontWeight: 700, letterSpacing: '.3px' }}>💰 مالی</div>
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
                    <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', fontWeight: 700, letterSpacing: '.3px' }}>📝 یادداشت</div>
                    <div style={{ fontSize: 'var(--fs-sm)', lineHeight: 1.7,
                       padding: 'var(--pad-normal)', background: 'var(--input-bg)',
                       borderRadius: 'var(--r-sm)' }}>{e.notes}</div>
                  </>
                )}

                <div style={{ display: 'flex', gap: 6, paddingTop: 4 }}>
                  <Btn size="sm" onClick={() => openEdit(e)} style={{ flex: 1 }}>ویرایش</Btn>
                  <Btn size="sm" onClick={() => setDelId(e.id)} style={{ flex: 1 }}>حذف</Btn>
                </div>
              </ExpandableCard>
            );
          })}
          <Btn variant="primary" full onClick={openNew}>+ افزودن تجهیز</Btn>
        </>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title={form.id ? 'ویرایش تجهیز' : 'افزودن تجهیز'}
        footer={<div style={{ display: "flex", gap: 6 }}><Btn onClick={() => setOpen(false)} style={{ flex: 1 }}>لغو</Btn><Btn variant="primary" onClick={save} style={{ flex: 1 }}>ذخیره</Btn>{!form.id ? <Btn variant="primary" onClick={saveAndNext} style={{ flex: 1 }}>+ بعدی</Btn> : null}</div>}>
        <Grid2>
          <Field label="نوع" required>
            <Select value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
              {Object.entries(EQUIP_LABELS).map(([k, v]) => <option key={k} value={k}>{v.icon} {v.name}</option>)}
            </Select>
          </Field>
          <Field label="سالن" required>
<SmartSelect
              value={form.hallId}
              onChange={v => setForm(f => ({ ...f, hallId: v }))}
              options={halls.map(c => ({
                value: c.id,
                label: c.name,
                subtitle: (h => h.name)(c),
              }))}
              placeholder="— انتخاب کنید —"
              modalTitle="انتخاب سالن"
              autoThreshold={6}
            />
          </Field>
        </Grid2>
        <Field label="نام تجهیز" required>
          <Input placeholder="مثلاً — لامپ LED سقفی" value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
        </Field>
        <Grid3>
          <Field label="تعداد">
            <NumField placeholder="۰" value={form.count} onChange={e => setForm({...form, count: e.target.value})} unit="عدد" min={0} />
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
          <Field label="قیمت واحد"><MoneyField placeholder="۰" value={form.unitPrice} onChange={e => setForm({...form, unitPrice: e.target.value})} /></Field>
          <Field label="گارانتی"><NumField placeholder="۶" value={form.warranty} onChange={e => setForm({...form, warranty: e.target.value})} unit="ماه" min={0} /></Field>
        </Grid3>

        {(EQUIP_CAPACITY_UNIT[form.type] && EQUIP_CAPACITY_UNIT[form.type] !== '—') || (EQUIP_EFFICIENCY_UNIT[form.type]) ? (
          <Grid2>
            {EQUIP_CAPACITY_UNIT[form.type] && EQUIP_CAPACITY_UNIT[form.type] !== '—' ? (
              <Field
                label={`ظرفیت هر واحد (${EQUIP_CAPACITY_UNIT[form.type]})`}
                hint={
                  form.type === 'fan' ? 'حجم هوایی که هر فن جابه‌جا می‌کند'
                  : form.type === 'cooler' ? 'ظرفیت سرمایشی'
                  : form.type === 'heater' ? 'توان گرمایشی'
                  : form.type === 'lamp' ? 'توان مصرفی هر لامپ'
                  : undefined
                }
              >
                <NumField
                  placeholder="۰"
                  value={form.capacity}
                  onChange={e => setForm({...form, capacity: e.target.value})}
                  unit={EQUIP_CAPACITY_UNIT[form.type]}
                  min={0}
                />
                {form.capacity && hallVolume ? (
                  <div style={{
                    fontSize: 11,
                    color: 'var(--accent)',
                    marginTop: 4,
                    lineHeight: 1.6,
                    padding: '6px 8px',
                    background: 'var(--accent-soft)',
                    borderRadius: 'var(--r-sm)',
                  }}>
                    {getCapacityHint(form.type, parseFloat(toEn(form.capacity).replace('٫','.')) || null, hallVolume)}
                  </div>
                ) : null}
              </Field>
            ) : null}
            {EQUIP_EFFICIENCY_UNIT[form.type] ? (
              <Field label={`بازدهی (${EQUIP_EFFICIENCY_UNIT[form.type]})`} hint="مثلاً LED حدود ۸۵">
                <NumField
                  placeholder="۸۵"
                  value={form.efficiency}
                  onChange={e => setForm({...form, efficiency: e.target.value})}
                  unit={EQUIP_EFFICIENCY_UNIT[form.type]}
                  min={0}
                />
              </Field>
            ) : null}
          </Grid2>
        ) : null}
        <Field label="تاریخ خرید"><Input placeholder="۱۴۰۵/۰۷/۰۴" value={form.purchasedAt} onChange={e => setForm({...form, purchasedAt: e.target.value})} /></Field>
        <Field label="یادداشت"><Input placeholder="..." value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} /></Field>
        <ErrorBox>{err}</ErrorBox>
      </Modal>

      <Modal open={!!delId} onClose={() => setDelId(null)} title="حذف تجهیز"
        footer={<BtnRow><Btn variant="danger" onClick={async () => { const idToDel = delId; if (!idToDel) return; const ok = await showConfirmAsync('تأیید حذف', 'این تجهیز حذف شود؟', { danger: true }); if (!ok) return; const item = equipment.find((x: any) => x.id === idToDel); if (item) { setUndoData({ item }); setTimeout(() => setUndoData((cur: any) => cur && cur.item.id === item.id ? null : cur), 6000); } deleteEquip(idToDel);
              logAction('delete', 'hal', 'حذف از سالن‌ها'); setDelId(null); showToast('تجهیز حذف شد', 'info', 1800); }}>حذف کن</Btn><Btn onClick={() => setDelId(null)}>لغو</Btn></BtnRow>}>
        <div style={{ textAlign: 'center', fontSize: 'var(--fs-md)' }}>حذف <b>{target?.name}</b>؟</div>
      </Modal>
    </PageContainer>
  );
}
