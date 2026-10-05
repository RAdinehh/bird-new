/**
 * HallEquipSection — انتخاب تجهیزات برای یک سالن
 * کاربر از تجهیزات موجود انتخاب می‌کند (نه ثبت جدید)
 * + محاسبات هوشمند نیاز گله
 */
import { useState } from 'react';
import { Btn, Field, Input, Modal, NumField } from '../../shr/components/ui';
import { CategoryIcon, EquipmentIcon, CATEGORY_COLORS } from '../../shr/icons/equipment';
import EditableSelect from '../../shr/components/EditableSelect';
import {
  useHal,
  CATEGORY_LABELS,
  EQUIP_LABELS,
  UNIT_LABELS_EQ,
  type Equipment,
} from './store';
import { toFa, toEn } from '../../shr/utils/fa';
import { showToast } from '../../cor/store/toast';
import { showConfirmAsync } from '../../cor/store/dialog';
import { useCustomOptions } from '../../shr/store/customOptions';

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

const ORDER: string[] = [
  'ventilation', 'heating', 'lighting',
  'drinking', 'feeding',
  'litter', 'power', 'auxiliary',
];

interface Props {
  hallId: string;
  legacy?: {
    ventilationSystem?: string;
    feederType?: string;
    drinkerType?: string;
    litterType?: string;
  };
}

export function HallEquipSection({ hallId, legacy }: Props) {
  const { equipment, addEquip, updateEquip, deleteEquip } = useHal();
  const { options: customOpts } = useCustomOptions();

  const [expanded, setExpanded] = useState(true);
  const [picker, setPicker] = useState(false);
  const [pickerCat, setPickerCat] = useState<string>('ventilation');
  const [pickerType, setPickerType] = useState<string>('fan_tunnel');
  const [pickerCount, setPickerCount] = useState<string>('');
  const [pickerCap, setPickerCap] = useState<string>('');
  const [pickerName, setPickerName] = useState<string>('');

  const [editId, setEditId] = useState<string | null>(null);
  const [editCount, setEditCount] = useState<string>('');
  const [editCap, setEditCap] = useState<string>('');

  const hallEquips = equipment.filter(e => e.hallId === hallId);

  // گروه‌بندی بر اساس دسته
  const grouped: Record<string, Equipment[]> = {};
  hallEquips.forEach(e => {
    const cat = (e as any).category || 'auxiliary';
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(e);
  });

  // محاسبه مجموع هر دسته
  const totals: Record<string, number> = {};
  Object.entries(grouped).forEach(([cat, list]) => {
    if (cat === 'ventilation') {
      totals[cat] = list.reduce((a, e) => a + ((e.count || 0) * ((e as any).capacity || 0)), 0);
    } else {
      totals[cat] = list.reduce((a, e) => a + (e.count || 0), 0);
    }
  });

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
    // چک تکراری
    const dup = hallEquips.find((x: any) =>
      x.type === pickerType && x.name.trim() === name
    );
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
    const ok = await showConfirmAsync('حذف تجهیز', `«${name}» از این سالن حذف شود؟`, { danger: true });
    if (!ok) return;
    deleteEquip(id);
    showToast('حذف شد', 'info', 1500);
  };

  const currentEdit = editId ? hallEquips.find(e => e.id === editId) : null;
  const editCategory = currentEdit ? ((currentEdit as any).category || 'auxiliary') : '';

  return (
    <>
      <div style={{
        marginTop: 6,
        paddingTop: 8,
        paddingBottom: 6,
        borderTop: '1px dashed var(--border)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <span style={{
          fontSize: 'var(--fs-base)',
          fontWeight: 700,
          color: 'var(--text)',
        }}>⚙️ تجهیزات سالن</span>
        <span style={{
          fontSize: 11,
          color: hallEquips.length > 0 ? 'var(--accent)' : 'var(--muted)',
          fontWeight: 700,
          background: hallEquips.length > 0 ? 'var(--accent-soft)' : 'transparent',
          padding: hallEquips.length > 0 ? '2px 8px' : '0',
          borderRadius: 8,
        }}>{hallEquips.length > 0 ? toFa(hallEquips.length) + ' مورد' : 'خالی'}</span>
      </div>

      {/* سیستم‌های پایه سالن (legacy) */}
      {legacy && (legacy.ventilationSystem || legacy.feederType || legacy.drinkerType || legacy.litterType) && (
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 4,
          marginTop: 4,
        }}>
          {legacy.ventilationSystem && (
            <span style={{
              fontSize: 10, color: 'var(--muted)', fontWeight: 600,
              padding: '3px 8px', background: 'var(--input-bg)',
              borderRadius: 8, border: '1px solid var(--border)',
            }}>تهویه پایه: {legacy.ventilationSystem}</span>
          )}
          {legacy.feederType && (
            <span style={{
              fontSize: 10, color: 'var(--muted)', fontWeight: 600,
              padding: '3px 8px', background: 'var(--input-bg)',
              borderRadius: 8, border: '1px solid var(--border)',
            }}>دانخوری پایه: {legacy.feederType}</span>
          )}
          {legacy.drinkerType && (
            <span style={{
              fontSize: 10, color: 'var(--muted)', fontWeight: 600,
              padding: '3px 8px', background: 'var(--input-bg)',
              borderRadius: 8, border: '1px solid var(--border)',
            }}>آبخوری پایه: {legacy.drinkerType}</span>
          )}
          {legacy.litterType && (
            <span style={{
              fontSize: 10, color: 'var(--muted)', fontWeight: 600,
              padding: '3px 8px', background: 'var(--input-bg)',
              borderRadius: 8, border: '1px solid var(--border)',
            }}>بستر پایه: {legacy.litterType}</span>
          )}
        </div>
      )}

      {/* دکمه افزودن — Grid2 از دسته‌ها */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 1fr 1fr',
        gap: 4,
        marginTop: 4,
      }}>
        {ORDER.map(cat => {
          const catColor = CATEGORY_COLORS[cat] || '#475569';
          const label = (CATEGORY_LABELS as any)[cat]?.name || cat;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => openPicker(cat)}
              style={{
                padding: '6px 4px',
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
                gap: 2,
              }}
            >
              <CategoryIcon category={cat} size={16} weight="duotone" color={catColor} />
              <span>+ {label}</span>
            </button>
          );
        })}
      </div>

      {/* هدر لیست تجهیزات (کلیک‌پذیر) */}
      <button
        type="button"
        onClick={() => setExpanded(x => !x)}
        style={{
          marginTop: 8,
          width: '100%',
          padding: '8px 10px',
          background: 'var(--card-solid)',
          border: '1px solid var(--border)',
          borderRadius: 10,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'pointer',
          fontFamily: 'inherit',
          textAlign: 'right',
        }}
      >
        <span style={{
          fontSize: 'var(--fs-sm)',
          fontWeight: 700,
          color: 'var(--text)',
        }}>📋 لیست تجهیزات</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{
            fontSize: 11,
            color: hallEquips.length > 0 ? 'var(--accent)' : 'var(--muted)',
            fontWeight: 700,
          }}>{hallEquips.length > 0 ? toFa(hallEquips.length) + ' مورد' : 'خالی'}</span>
          <span style={{
            color: 'var(--muted)',
            fontSize: 11,
            transition: 'transform 180ms',
            transform: expanded ? 'rotate(180deg)' : 'rotate(0)',
            display: 'inline-block',
          }}>▼</span>
        </span>
      </button>

      {expanded && (<>
      {/* گروه‌ها */}
      {ORDER.map(cat => {
        const list = grouped[cat] || [];
        if (list.length === 0) return null;
        const catColor = CATEGORY_COLORS[cat] || '#475569';
        const label = (CATEGORY_LABELS as any)[cat]?.name || cat;
        return (
          <div key={cat} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 'var(--fs-xs)',
              color: 'var(--muted)',
              fontWeight: 700,
              paddingRight: 4,
            }}>
              <CategoryIcon category={cat} size={14} weight="duotone" color={catColor} />
              <span>{label}</span>
              <span style={{ opacity: 0.6 }}>({toFa(list.length)})</span>
              {totals[cat] > 0 && (
                <span style={{
                  marginRight: 'auto',
                  color: catColor,
                  fontWeight: 700,
                }}>
                  {cat === 'ventilation'
                    ? `${toFa(totals[cat].toLocaleString('fa-IR'))} m³/h`
                    : toFa(totals[cat].toLocaleString('fa-IR'))}
                </span>
              )}
            </div>

            {list.map(e => {
              const eqMeta = (EQUIP_LABELS as any)[e.type];
              const capUnit = cat === 'ventilation' ? ' m³/h'
                            : cat === 'lighting' ? ' W'
                            : '';
              return (
                <div key={e.id} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '8px 10px',
                  background: 'var(--card-solid)',
                  border: '1.5px solid var(--border)',
                  borderRadius: 12,
                  boxShadow: '0 1px 2px rgba(15,23,42,.04)',
                }}>
                  <div style={{
                    width: 34, height: 34, borderRadius: 10,
                    background: 'linear-gradient(135deg, #f0f4f8 0%, #e2e8ef 100%)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <EquipmentIcon type={e.type} size={20} weight="duotone" color={catColor} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: 'var(--fs-sm)',
                      fontWeight: 700,
                      color: 'var(--text)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>{e.name}</div>
                    <div style={{
                      fontSize: 11,
                      color: 'var(--muted)',
                      marginTop: 1,
                      display: 'flex',
                      gap: 8,
                    }}>
                      {e.count != null && <span>× {toFa(e.count)}</span>}
                      {(e as any).capacity != null && (
                        <span>{toFa((e as any).capacity)}{capUnit}</span>
                      )}
                      {eqMeta && <span style={{ opacity: 0.7 }}>{eqMeta.name}</span>}
                    </div>
                  </div>
                  <button type="button" onClick={() => openEdit(e)} aria-label="ویرایش" style={{
                    width: 30, height: 30, borderRadius: 8,
                    background: 'var(--input-bg)', border: '1px solid var(--border)',
                    cursor: 'pointer', fontSize: 13, padding: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>✏️</button>
                  <button type="button" onClick={() => removeEquip(e.id, e.name)} aria-label="حذف" style={{
                    width: 30, height: 30, borderRadius: 8,
                    background: 'var(--input-bg)', border: '1px solid var(--border)',
                    cursor: 'pointer', fontSize: 13, padding: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>🗑️</button>
                </div>
              );
            })}
          </div>
        );
      })}

      {hallEquips.length === 0 && (
        <div style={{
          padding: '14px 12px',
          background: 'var(--input-bg)',
          border: '1px dashed var(--border)',
          borderRadius: 12,
          fontSize: 12,
          color: 'var(--muted)',
          textAlign: 'center',
        }}>
          هنوز تجهیزی برای این سالن انتخاب نشده
        </div>
      )}


      </>)}
      {/* مودال انتخاب زیرنوع و افزودن */}
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
            <NumField
              placeholder="۰"
              value={pickerCount}
              onChange={e => setPickerCount(e.target.value)}
              unit="عدد"
              min={0}
            />
          </Field>
          <Field label={pickerCat === 'ventilation' ? 'ظرفیت (m³/h)' : pickerCat === 'lighting' ? 'توان (W)' : 'ظرفیت'}>
            <NumField
              placeholder="۰"
              value={pickerCap}
              onChange={e => setPickerCap(e.target.value)}
              min={0}
            />
          </Field>
        </div>
      </Modal>

      {/* مودال ویرایش سریع */}
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
            <NumField
              placeholder="۰"
              value={editCount}
              onChange={e => setEditCount(e.target.value)}
              unit="عدد"
              min={0}
            />
          </Field>
          <Field label={editCategory === 'ventilation' ? 'ظرفیت (m³/h)' : editCategory === 'lighting' ? 'توان (W)' : 'ظرفیت'}>
            <NumField
              placeholder="۰"
              value={editCap}
              onChange={e => setEditCap(e.target.value)}
              min={0}
            />
          </Field>
        </div>
      </Modal>
    </>
  );
}
