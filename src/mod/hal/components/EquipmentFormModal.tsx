/**
 * EquipmentFormModal — فرم افزودن/ویرایش تجهیز
 */
import { Btn, Field, Grid2, Input, Modal, MoneyField, NumField, Select, ErrorBox } from '../../../shr/components/ui';
import DatePicker from '../../../shr/components/DatePicker';
import SmartSelect from '../../../shr/components/SmartSelect';
import EditableSelect from '../../../shr/components/EditableSelect';
import { toFa, toEn } from '../../../shr/utils/fa';
import { CATEGORY_LABELS, KIND_LABELS, UNIT_LABELS_EQ, EQUIP_LABELS } from '../store';
import { getEquipUnit } from '../equipUnits';
import { EquipmentIcon, CATEGORY_COLORS } from '../../../shr/icons/equipment';

export interface EquipmentFormModalProps {
  open: boolean;
  setOpen: (v: boolean) => void;
  form: any;
  setForm: any;
  err: string;
  vErrors: Record<string, string>;
  halls: any[];
  equipment: any[];
  autoFields: Set<string>;
  clearAuto: (k: string) => void;
  markAuto: (k: string) => void;
  categoriesForKind: (k: string) => string[];
  typesForCategory: (c: string) => string[];
  equipNeed: any;
  save: () => void;
}

export default function EquipmentFormModal(props: EquipmentFormModalProps) {
  const { open, setOpen, form, setForm, vErrors, halls, equipment, autoFields, clearAuto, markAuto, categoriesForKind, typesForCategory, equipNeed, save } = props;

  return (
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
            <DatePicker value={form.purchasedAt} onChange={v => setForm({...form, purchasedAt: v})} placeholder="انتخاب تاریخ" />
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
  );
}
