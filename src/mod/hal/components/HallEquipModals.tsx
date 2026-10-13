/**
 * HallEquipModals — سه Modal (جزئیات، افزودن، ویرایش)
 */
import { Btn, Field, Input, Modal, NumField } from '../../../shr/components/ui';
import { getCategoryLabel, getEquipLabel, getCategoryColor } from '../_typedLabels';
import type { Equipment } from '../store';
import EditableSelect from '../../../shr/components/EditableSelect';
import { toFa } from '../../../shr/utils/fa';
import { CATEGORY_LABELS, EQUIP_LABELS } from '../store';
import { getEquipUnit } from '../equipUnits';
import { EquipmentIcon, CATEGORY_COLORS } from '../../../shr/icons/equipment';

export interface HallEquipModalsProps {
  detailCat: string | null;
  setDetailCat: (v: string | null) => void;
  detailCatLabel: string;
  detailInstalled: number;
  detailNeed: number;
  detailUnit: string;
  detailNeedUnit: string;
  detailList: Equipment[];
  detailColor: string;
  openPicker: (c: string) => void;
  openEdit: (e: Equipment) => void;
  removeEquip: (id: string, name: string) => void;
  picker: boolean;
  setPicker: (v: boolean) => void;
  pickerCat: string;
  pickerType: string;
  setPickerType: (v: string) => void;
  pickerName: string;
  setPickerName: (v: string) => void;
  pickerCount: string;
  setPickerCount: (v: string) => void;
  pickerCap: string;
  setPickerCap: (v: string) => void;
  saveNewEquip: () => void;
  typesForCategory: (c: string) => string[];
  equipment: Equipment[];
  editId: string | null;
  setEditId: (v: string | null) => void;
  currentEdit: Equipment | null | undefined;
  editCount: string;
  setEditCount: (v: string) => void;
  editCap: string;
  setEditCap: (v: string) => void;
  saveEdit: () => void;
}

export default function HallEquipModals(props: HallEquipModalsProps) {
  const {
    detailCat, setDetailCat, detailCatLabel, detailInstalled, detailNeed,
    detailUnit, detailNeedUnit, detailList, detailColor,
    openPicker, openEdit, removeEquip,
    picker, setPicker, pickerCat, pickerType, setPickerType,
    pickerName, setPickerName, pickerCount, setPickerCount, pickerCap, setPickerCap,
    saveNewEquip, typesForCategory, equipment,
    editId, setEditId, currentEdit, editCount, setEditCount, editCap, setEditCap, saveEdit,
  } = props;

  return (
    <>
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
              borderRadius: 'var(--r-md)',
              marginBottom: 10,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 8,
            }}>
              <span style={{ fontSize: 'var(--fs-sm)', color: 'var(--muted)' }}>نصب‌شده:</span>
              <span style={{ fontSize: 'var(--fs-base)', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                {toFa(detailInstalled.toLocaleString('fa-IR'))} {detailUnit}
              </span>
              {detailNeed > 0 && (
                <>
                  <span style={{ fontSize: 'var(--fs-sm)', color: 'var(--muted)' }}>نیاز:</span>
                  <span style={{ fontSize: 'var(--fs-base)', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
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
                  borderRadius: 'var(--r-lg)',
                }}>
                  <span style={{
                    width: 36, height: 36, borderRadius: 'var(--r-md)',
                    background: 'var(--input-bg)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <EquipmentIcon type={e.type} size={20} weight="duotone" color={detailColor} />
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 'var(--fs-sm)', fontWeight: 700, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.name}</div>
                    <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', marginTop: 1, display: 'flex', gap: 8 }}>
                      {e.count != null && <span>× {toFa(e.count)}</span>}
                      {e.capacity != null && <span>{toFa(e.capacity)}{detailUnit === 'm³/h' ? ' m³/h' : detailUnit === 'W' ? ' W' : ''}</span>}
                    </div>
                  </div>
                  <button type="button" onClick={() => openEdit(e)} aria-label="ویرایش" style={{
                    width: 32, height: 32, borderRadius: 'var(--r-sm)',
                    background: 'var(--input-bg)', border: '1px solid var(--border)',
                    cursor: 'pointer', fontSize: 'var(--fs-base)', padding: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>✏️</button>
                  <button type="button" onClick={() => removeEquip(e.id, e.name)} aria-label="حذف" style={{
                    width: 32, height: 32, borderRadius: 'var(--r-sm)',
                    background: 'var(--input-bg)', border: '1px solid var(--border)',
                    cursor: 'pointer', fontSize: 'var(--fs-base)', padding: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>🗑️</button>
                </div>
              ))}
            </div>
          </>
        )}
      </Modal>
      <Modal
        open={picker}
        onClose={() => setPicker(false)}
        title={`افزودن ${getCategoryLabel(pickerCat)?.name || pickerCat}`}
        footer={
          <div style={{ display: 'flex', gap: 6 }}>
            <Btn variant="primary" onClick={saveNewEquip} disabled={!pickerName.trim()} style={{ flex: 1 }}>ذخیره</Btn>
            <Btn onClick={() => setPicker(false)} style={{ flex: 1 }}>لغو</Btn>
          </div>
        }
      >
        <Field label="زیرنوع" required>
          <EditableSelect
            value={pickerType}
            onChange={setPickerType}
            options={typesForCategory(pickerCat).map(k => {
              const v = getEquipLabel(k) || { name: k };
              return {
                value: k,
                label: v.name,
                icon: <EquipmentIcon type={k} size={22} weight="duotone" color={getCategoryColor(pickerCat)} />,
              };
            })}
            customKey={'hal.equip.type.' + pickerCat}
            usageCheck={(name) => equipment.filter((x: Equipment) => x.type === name).length}
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
          {(() => {
            const def = getEquipUnit(pickerType);
            if (!def.secondary) return null;
            return (
              <Field
                label={def.secondary.label}
                hint={`واحد: ${def.secondary.unit}${def.secondary.defaultValue ? ` — پیش‌فرض ${def.secondary.defaultValue}` : ''}`}
              >
                <NumField
                  placeholder={def.secondary.defaultValue ? String(def.secondary.defaultValue) : '۰'}
                  value={pickerCap}
                  onChange={e => setPickerCap(e.target.value)}
                  unit={def.secondary.unit}
                  min={0}
                />
              </Field>
            );
          })()}
        </div>
      </Modal>
      <Modal
        open={!!editId}
        onClose={() => setEditId(null)}
        title={currentEdit?.name || 'ویرایش'}
        footer={
          <div style={{ display: 'flex', gap: 6 }}>
            <Btn variant="primary" onClick={saveEdit} style={{ flex: 1 }}>ذخیره</Btn>
            <Btn onClick={() => setEditId(null)} style={{ flex: 1 }}>لغو</Btn>
          </div>
        }
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <Field label="تعداد">
            <NumField placeholder="۰" value={editCount} onChange={e => setEditCount(e.target.value)} unit="عدد" min={0} />
          </Field>
          {(() => {
            const def = currentEdit ? getEquipUnit(currentEdit.type) : null;
            if (!def?.secondary) return null;
            return (
              <Field
                label={def.secondary.label}
                hint={`واحد: ${def.secondary.unit}`}
              >
                <NumField
                  placeholder="۰"
                  value={editCap}
                  onChange={e => setEditCap(e.target.value)}
                  unit={def.secondary.unit}
                  min={0}
                />
              </Field>
            );
          })()}
        </div>
      </Modal>
    </>
  );
}
