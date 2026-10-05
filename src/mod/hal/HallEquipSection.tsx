/**
 * HallEquipSection — نمایش تجهیزات سالن به همراه نیاز گله
 *
 * ساختار:
 *   - ۲ گروه: «ضروری» و «اختیاری»
 *   - جدول مینیمال با ۴ ستون: دسته · نصب‌شده · نیاز · وضعیت
 *   - ۸ دکمه افزودن پایین
 */
import { useState } from 'react';
import { Btn, Field, Input, Modal, NumField } from '../../shr/components/ui';
import { CategoryIcon, EquipmentIcon, CATEGORY_COLORS } from '../../shr/icons/equipment';
import EditableSelect from '../../shr/components/EditableSelect';
import {
  useHal,
  CATEGORY_LABELS,
  EQUIP_LABELS,
  type Equipment,
} from './store';
import { toFa, toEn } from '../../shr/utils/fa';
import { showToast } from '../../cor/store/toast';
import { showConfirmAsync } from '../../cor/store/dialog';
import { NEED_CALCULATORS, type NeedInput } from './needs';
import type { BirdStandard } from '../set/standards/types';

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
  return TYPES_BY_CATEGORY[cat] || [];
}

/** ترتیب نمایش */
const REQUIRED_CATS: string[] = ['ventilation', 'heating', 'lighting', 'drinking', 'feeding', 'litter'];
const OPTIONAL_CATS: string[] = ['power', 'auxiliary'];
const ALL_CATS: string[] = [...REQUIRED_CATS, ...OPTIONAL_CATS];

/** واحد مقدار نصب‌شده برای هر دسته */
function unitForCategory(cat: string): string {
  if (cat === 'ventilation') return 'm³/h';
  if (cat === 'lighting') return 'W';
  if (cat === 'litter') return 'kg';
  if (cat === 'heating') return 'kW';
  return 'عدد';
}

/** محاسبه مقدار نصب‌شده برای یک دسته */
function calcInstalled(cat: string, list: Equipment[]): number {
  if (cat === 'ventilation') {
    return list.reduce((a, e) => a + ((e.count || 0) * ((e as any).capacity || 0)), 0);
  }
  if (cat === 'lighting') {
    return list.reduce((a, e) => a + ((e.count || 0) * ((e as any).capacity || 0)), 0);
  }
  if (cat === 'litter') {
    return list.reduce((a, e) => a + ((e as any).capacity || 0), 0);
  }
  if (cat === 'heating') {
    return list.reduce((a, e) => a + ((e.count || 0) * ((e as any).capacity || 0)), 0);
  }
  return list.reduce((a, e) => a + (e.count || 0), 0);
}

interface Props {
  hallId: string;
  needInput?: NeedInput;
  legacy?: {
    ventilationSystem?: string;
    feederType?: string;
    drinkerType?: string;
    litterType?: string;
  };
}

export function HallEquipSection({ hallId, needInput, legacy }: Props) {
  const { equipment, addEquip, updateEquip, deleteEquip } = useHal();

  const [picker, setPicker] = useState(false);
  const [pickerCat, setPickerCat] = useState<string>('ventilation');
  const [pickerType, setPickerType] = useState<string>('fan_tunnel');
  const [pickerCount, setPickerCount] = useState<string>('');
  const [pickerCap, setPickerCap] = useState<string>('');
  const [pickerName, setPickerName] = useState<string>('');

  const [editId, setEditId] = useState<string | null>(null);
  const [editCount, setEditCount] = useState<string>('');
  const [editCap, setEditCap] = useState<string>('');

  const [detailCat, setDetailCat] = useState<string | null>(null);

  const hallEquips = equipment.filter(e => e.hallId === hallId);

  // گروه‌بندی
  const grouped: Record<string, Equipment[]> = {};
  hallEquips.forEach(e => {
    const cat = (e as any).category || 'auxiliary';
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(e);
  });

  // نیاز هر دسته
  const needByCategory: Record<string, { value: number; unit: string } | null> = {};
  if (needInput) {
    Object.entries(NEED_CALCULATORS).forEach(([cat, calc]) => {
      try { needByCategory[cat] = calc(needInput); } catch { needByCategory[cat] = null; }
    });
  }

  // محاسبه وضعیت (فقط برای دسته‌های ضروری)
  function statusFor(cat: string): { pct: number | null; tone: 'ok' | 'warn' | 'danger' | 'over' | 'none' } {
    const installed = calcInstalled(cat, grouped[cat] || []);
    const need = needByCategory[cat]?.value || 0;
    if (installed === 0) return { pct: null, tone: 'none' };
    if (need === 0) return { pct: null, tone: 'ok' };
    const pct = (installed / need) * 100;
    if (pct < 50) return { pct, tone: 'danger' };      // خیلی کم
    if (pct < 90) return { pct, tone: 'warn' };        // کم
    if (pct <= 150) return { pct, tone: 'ok' };        // خوب
    return { pct, tone: 'over' };                       // اضافه
  }

  const openPicker = (cat: string) => {
    const types = typesForCategory(cat);
    setPickerCat(cat);
    setPickerType(types[0] || 'other');
    setPickerCount('');
    setPickerCap('');
    setPickerName('');
    setPicker(true);
  };

  const saveNewEquip = () => {
    if (!pickerName.trim()) {
      showToast('نام تجهیز اجباری است', 'error', 2000);
      return;
    }
    const name = pickerName.trim();
    const dup = hallEquips.find((x: any) => x.type === pickerType && x.name.trim() === name);
    if (dup) {
      showToast('این تجهیز قبلاً در همین سالن ثبت شده', 'error', 2500);
      return;
    }
    addEquip({
      hallId,
      kind: 'asset',
      category: pickerCat as any,
      type: pickerType,
      name,
      count: pickerCount ? parseInt(toEn(pickerCount)) || null : null,
      unit: 'pcs',
      unitPrice: null,
      purchasedAt: '',
      warranty: null,
      notes: '',
      capacity: pickerCap ? parseFloat(toEn(pickerCap).replace('٫', '.')) || null : null,
    } as any);
    setPicker(false);
    showToast('تجهیز اضافه شد', 'success', 1500);
  };

  const openEdit = (e: Equipment) => {
    setEditId(e.id);
    setEditCount(e.count ? String(e.count) : '');
    setEditCap((e as any).capacity ? String((e as any).capacity) : '');
  };

  const saveEdit = () => {
    if (!editId) return;
    updateEquip(editId, {
      count: editCount ? parseInt(toEn(editCount)) || null : null,
      capacity: editCap ? parseFloat(toEn(editCap).replace('٫', '.')) || null : null,
    } as any);
    setEditId(null);
    showToast('ذخیره شد', 'success', 1500);
  };

  const removeEquip = async (id: string, name: string) => {
    const ok = await showConfirmAsync('حذف تجهیز', '«' + name + '» از این سالن حذف شود؟', { danger: true });
    if (!ok) return;
    deleteEquip(id);
    showToast('حذف شد', 'info', 1500);
  };

  const currentEdit = editId ? hallEquips.find(e => e.id === editId) : null;
  const editCategory = currentEdit ? ((currentEdit as any).category || 'auxiliary') : '';

  /** رندر یه گروه */
  const renderGroup = (cats: string[], isRequired: boolean) => {
    const totalItems = cats.reduce((a, c) => a + (grouped[c] || []).length, 0);

    return (
      <div style={{ marginBottom: 12 }}>
        <div style={{
          fontSize: 'var(--fs-base)',
          fontWeight: 700,
          color: 'var(--text)',
          letterSpacing: '.3px',
          paddingTop: 8,
          paddingBottom: 6,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}>
          <span style={{ fontSize: '1.05em', lineHeight: 1 }}>
            {isRequired ? '🐔' : '🔧'}
          </span>
          <span>{isRequired ? 'ضروری برای پرورش' : 'اختیاری'}</span>
          {totalItems > 0 && (
            <span style={{
              fontSize: 'var(--fs-xs)',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: 6,
              background: 'var(--accent-soft)',
              color: 'var(--accent)',
              letterSpacing: 0,
              marginRight: 'auto',
            }}>{toFa(totalItems)} مورد</span>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {cats.map(cat => {
            const list = grouped[cat] || [];
            const catColor = CATEGORY_COLORS[cat] || '#475569';
            const label = (CATEGORY_LABELS as any)[cat]?.name || cat;
            const installed = calcInstalled(cat, list);
            const unit = unitForCategory(cat);
            const need = needByCategory[cat]?.value || 0;
            const needUnit = needByCategory[cat]?.unit || unit;
            const st = isRequired ? statusFor(cat) : { pct: null as number | null, tone: 'none' as const };
            const isEmpty = list.length === 0;

            return (
              <button
                key={cat}
                type="button"
                onClick={() => {
                  if (isEmpty) {
                    openPicker(cat);
                  } else {
                    setDetailCat(cat);
                  }
                }}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: isEmpty ? 'transparent' : 'var(--input-bg)',
                  border: '1px solid ' + (isEmpty ? 'var(--border)' : 'transparent'),
                  borderStyle: isEmpty ? 'dashed' : 'solid',
                  borderRadius: 10,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  fontFamily: 'inherit',
                  textAlign: 'right',
                  cursor: 'pointer',
                }}
              >
                <span style={{
                  width: 28, height: 28, borderRadius: 9,
                  background: 'var(--card-solid)',
                  border: '1px solid var(--border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <CategoryIcon category={cat} size={16} weight="duotone" color={catColor} />
                </span>

                <span style={{
                  flex: 1,
                  fontSize: 12.5,
                  fontWeight: 700,
                  color: isEmpty ? 'var(--muted)' : 'var(--text)',
                  minWidth: 0,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {label}
                  {!isEmpty && <span style={{ color: 'var(--muted)', fontWeight: 500, fontSize: 11, marginRight: 4 }}>· {toFa(list.length)}</span>}
                </span>

                {!isEmpty && (
                  <>
                    <span style={{
                      fontSize: 12,
                      fontWeight: 700,
                      fontVariantNumeric: 'tabular-nums',
                      color: 'var(--text)',
                      whiteSpace: 'nowrap',
                    }}>
                      {toFa(installed.toLocaleString('fa-IR'))}
                      <span style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 500, marginRight: 3 }}>{unit}</span>
                    </span>
                    {isRequired && need > 0 && st.pct !== null && (
                      <span style={{
                        fontSize: 11,
                        fontWeight: 800,
                        fontVariantNumeric: 'tabular-nums',
                        color: st.tone === 'ok' ? 'var(--accent)'
                             : st.tone === 'warn' ? 'var(--warn)'
                             : st.tone === 'danger' ? 'var(--danger)'
                             : st.tone === 'over' ? 'var(--info)'
                             : 'var(--muted)',
                        minWidth: 34,
                        textAlign: 'left',
                      }}>
                        {toFa(Math.round(st.pct))}٪
                      </span>
                    )}
                  </>
                )}

                {isEmpty && isRequired && need > 0 && (
                  <span style={{
                    fontSize: 10,
                    fontWeight: 600,
                    color: 'var(--muted)',
                    whiteSpace: 'nowrap',
                  }}>
                    نیاز: {toFa(need.toLocaleString('fa-IR'))} {needUnit}
                  </span>
                )}

                {isEmpty && !isRequired && (
                  <span style={{ fontSize: 10, color: 'var(--muted)' }}>— ثبت نشده</span>
                )}

                {!isEmpty && (
                  <span style={{ color: 'var(--muted)', fontSize: 14 }}>‹</span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  // لیست تجهیزات یه دسته برای نمایش در مودال
  const detailList = detailCat ? (grouped[detailCat] || []) : [];
  const detailCatLabel = detailCat ? ((CATEGORY_LABELS as any)[detailCat]?.name || detailCat) : '';
  const detailColor = detailCat ? (CATEGORY_COLORS[detailCat] || '#475569') : '#475569';
  const detailInstalled = detailCat ? calcInstalled(detailCat, detailList) : 0;
  const detailNeed = detailCat ? (needByCategory[detailCat]?.value || 0) : 0;
  const detailNeedUnit = detailCat ? (needByCategory[detailCat]?.unit || unitForCategory(detailCat)) : '';
  const detailUnit = detailCat ? unitForCategory(detailCat) : '';

  return (
    <>
      <div style={{
        marginTop: 6,
        paddingTop: 8,
        borderTop: '1px dashed var(--border)',
      }}>
        <div style={{
          fontSize: 'var(--fs-base)',
          fontWeight: 700,
          color: 'var(--text)',
          letterSpacing: '.3px',
          marginBottom: 4,
        }}>
          ⚙️ تجهیزات سالن
        </div>

        {renderGroup(REQUIRED_CATS, true)}
        {grouped['power']?.length || grouped['auxiliary']?.length ? renderGroup(OPTIONAL_CATS, false) : null}

        {/* legacy pills */}
        {legacy && (legacy.ventilationSystem || legacy.feederType || legacy.drinkerType || legacy.litterType) && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 8 }}>
            {legacy.ventilationSystem && <span style={{ fontSize: 10, color: 'var(--muted)', padding: '2px 8px', background: 'var(--input-bg)', borderRadius: 6 }}>تهویه پایه: {legacy.ventilationSystem}</span>}
            {legacy.feederType && <span style={{ fontSize: 10, color: 'var(--muted)', padding: '2px 8px', background: 'var(--input-bg)', borderRadius: 6 }}>دانخوری پایه: {legacy.feederType}</span>}
            {legacy.drinkerType && <span style={{ fontSize: 10, color: 'var(--muted)', padding: '2px 8px', background: 'var(--input-bg)', borderRadius: 6 }}>آبخوری پایه: {legacy.drinkerType}</span>}
            {legacy.litterType && <span style={{ fontSize: 10, color: 'var(--muted)', padding: '2px 8px', background: 'var(--input-bg)', borderRadius: 6 }}>بستر پایه: {legacy.litterType}</span>}
          </div>
        )}

        {/* ۸ دکمه افزودن */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr 1fr',
          gap: 4,
          marginTop: 12,
          paddingTop: 12,
          borderTop: '1px dashed var(--border)',
        }}>
          {ALL_CATS.map(cat => {
            const catColor = CATEGORY_COLORS[cat] || '#475569';
            const label = (CATEGORY_LABELS as any)[cat]?.name || cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => openPicker(cat)}
                style={{
                  padding: '8px 4px',
                  background: 'var(--input-bg)',
                  border: '1px dashed var(--border)',
                  borderRadius: 10,
                  color: 'var(--muted)',
                  fontFamily: 'inherit',
                  fontSize: 10,
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 3,
                }}
              >
                <CategoryIcon category={cat} size={16} weight="duotone" color={catColor} />
                <span>+ {label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* مودال جزئیات گروه */}
      <Modal
        open={!!detailCat}
        onClose={() => setDetailCat(null)}
        title={detailCatLabel}
        footer={
          detailCat && (
            <Btn variant="primary" full onClick={() => { const c = detailCat; setDetailCat(null); openPicker(c); }}>
              + افزودن {detailCatLabel}
            </Btn>
          )
        }
      >
        {detailCat && (
          <>
            {/* خلاصه نیاز */}
            <div style={{
              padding: '10px 12px',
              background: 'var(--input-bg)',
              borderRadius: 10,
              marginBottom: 10,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 8,
            }}>
              <span style={{ fontSize: 12, color: 'var(--muted)' }}>نصب‌شده:</span>
              <span style={{ fontSize: 13, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                {toFa(detailInstalled.toLocaleString('fa-IR'))} {detailUnit}
              </span>
              {detailNeed > 0 && (
                <>
                  <span style={{ fontSize: 12, color: 'var(--muted)' }}>نیاز:</span>
                  <span style={{ fontSize: 13, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                    {toFa(detailNeed.toLocaleString('fa-IR'))} {detailNeedUnit}
                  </span>
                </>
              )}
            </div>

            {/* لیست تجهیزات */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {detailList.map(e => (
                <div key={e.id} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '10px 12px',
                  background: 'var(--card-solid)',
                  border: '1.5px solid var(--border)',
                  borderRadius: 12,
                }}>
                  <span style={{
                    width: 36, height: 36, borderRadius: 11,
                    background: 'linear-gradient(135deg, #f0f4f8 0%, #e2e8ef 100%)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <EquipmentIcon type={e.type} size={20} weight="duotone" color={detailColor} />
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 'var(--fs-sm)', fontWeight: 700, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 1, display: 'flex', gap: 8 }}>
                      {e.count != null && <span>× {toFa(e.count)}</span>}
                      {(e as any).capacity != null && <span>{toFa((e as any).capacity)}{detailUnit === 'm³/h' ? ' m³/h' : detailUnit === 'W' ? ' W' : ''}</span>}
                    </div>
                  </div>
                  <button type="button" onClick={() => openEdit(e)} aria-label="ویرایش" style={{
                    width: 32, height: 32, borderRadius: 8,
                    background: 'var(--input-bg)', border: '1px solid var(--border)',
                    cursor: 'pointer', fontSize: 13, padding: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>✏️</button>
                  <button type="button" onClick={() => removeEquip(e.id, e.name)} aria-label="حذف" style={{
                    width: 32, height: 32, borderRadius: 8,
                    background: 'var(--input-bg)', border: '1px solid var(--border)',
                    cursor: 'pointer', fontSize: 13, padding: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>🗑️</button>
                </div>
              ))}
            </div>
          </>
        )}
      </Modal>

      {/* مودال افزودن */}
      <Modal
        open={picker}
        onClose={() => setPicker(false)}
        title={`افزودن ${(CATEGORY_LABELS as any)[pickerCat]?.name || pickerCat}`}
        footer={
          <div style={{ display: 'flex', gap: 6 }}>
            <Btn onClick={() => setPicker(false)} style={{ flex: 1 }}>لغو</Btn>
            <Btn variant="primary" onClick={saveNewEquip} disabled={!pickerName.trim()} style={{ flex: 1 }}>ذخیره</Btn>
          </div>
        }
      >
        <Field label="زیرنوع" required>
          <EditableSelect
            value={pickerType}
            onChange={setPickerType}
            options={typesForCategory(pickerCat).map(k => {
              const v = (EQUIP_LABELS as any)[k] || { name: k };
              return {
                value: k,
                label: v.name,
                icon: <EquipmentIcon type={k} size={22} weight="duotone" color={CATEGORY_COLORS[pickerCat]} />,
              };
            })}
            customKey={'hal.equip.type.' + pickerCat}
            usageCheck={(name) => equipment.filter((x: any) => x.type === name).length}
          />
        </Field>

        <Field label="نام تجهیز" required>
          <Input
            placeholder="مثلاً — فن تونلی سالن ۱"
            value={pickerName}
            onChange={e => setPickerName(e.target.value)}
          />
        </Field>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <Field label="تعداد">
            <NumField placeholder="۰" value={pickerCount} onChange={e => setPickerCount(e.target.value)} unit="عدد" min={0} />
          </Field>
          <Field label={pickerCat === 'ventilation' ? 'ظرفیت (m³/h)' : pickerCat === 'lighting' ? 'توان (W)' : 'ظرفیت'}>
            <NumField placeholder="۰" value={pickerCap} onChange={e => setPickerCap(e.target.value)} min={0} />
          </Field>
        </div>
      </Modal>

      {/* مودال ویرایش */}
      <Modal
        open={!!editId}
        onClose={() => setEditId(null)}
        title={currentEdit?.name || 'ویرایش'}
        footer={
          <div style={{ display: 'flex', gap: 6 }}>
            <Btn onClick={() => setEditId(null)} style={{ flex: 1 }}>لغو</Btn>
            <Btn variant="primary" onClick={saveEdit} style={{ flex: 1 }}>ذخیره</Btn>
          </div>
        }
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <Field label="تعداد">
            <NumField placeholder="۰" value={editCount} onChange={e => setEditCount(e.target.value)} unit="عدد" min={0} />
          </Field>
          <Field label={editCategory === 'ventilation' ? 'ظرفیت (m³/h)' : editCategory === 'lighting' ? 'توان (W)' : 'ظرفیت'}>
            <NumField placeholder="۰" value={editCap} onChange={e => setEditCap(e.target.value)} min={0} />
          </Field>
        </div>
      </Modal>
    </>
  );
}
