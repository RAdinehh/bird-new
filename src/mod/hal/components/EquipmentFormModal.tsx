/**
 * EquipmentFormModal — فرم افزودن/ویرایش تجهیز
 */
import { Btn, ErrorBox, Field, Grid2, Input, Modal, MoneyField, NumField, Select } from '../../../shr/components/ui';
import { getUnitLabel, getEquipLabel } from '../_typedLabels';
import { getPlaceholderForType } from '../_equipHelpers';
import type { BirdStandard } from '../../set/standards/types';
import type { EquipmentFormData } from '../useEquipmentForm';
import type { Hall, Zone, Equipment, EquipmentCategory } from '../store';
import type { Person } from '../../ctc/store';
import DatePicker from '../../../shr/components/DatePicker';
import SmartSelect from '../../../shr/components/SmartSelect';
import DependentSelect from '../../../shr/components/DependentSelect';
import { STATUS_LABELS, type EquipmentStatus } from '../store';
import EditableSelect from '../../../shr/components/EditableSelect';
import { toEn } from '../../../shr/utils/fa';
import { CATEGORY_LABELS, UNIT_LABELS_EQ, EQUIP_LABELS } from '../store';
import { getEquipUnit } from '../equipUnits';
import { getStdDefaultForType } from '../api/equipmentCalc';

export interface EquipmentFormModalProps {
  open: boolean;
  setOpen: (v: boolean) => void;
  form: EquipmentFormData;
  setForm: React.Dispatch<React.SetStateAction<EquipmentFormData>>;
  err: string;
  vErrors: Record<string, string>;
  halls: Hall[];
  zones: Zone[];
  equipment: Equipment[];
  autoFields: Set<string>;
  clearAuto: (k: string) => void;
  markAuto: (k: string) => void;
  categoriesForKind?: (k: string) => string[];  // اختیاری — سازگاری
  typesForCategory: (c: string) => string[];
  equipNeed: { need: number; unit?: string; desc?: string } | null | undefined;
  save: () => void;
  suppliers?: Person[];
  stdForDefaults?: BirdStandard | null;
  /** 🆕 پاک کردن خطا هنگام تایپ */
  onErrorClear?: () => void;
}

export default function EquipmentFormModal(props: EquipmentFormModalProps) {
  const { open, setOpen, form, setForm, err, vErrors, halls, zones, equipment, autoFields, clearAuto, markAuto, typesForCategory, equipNeed, save, suppliers, stdForDefaults, onErrorClear } = props;

  return (
      <Modal open={open} onClose={() => setOpen(false)} title={form.id ? 'ویرایش تجهیز' : 'افزودن تجهیز'}
        footer={<div style={{ display: "flex", gap: 'var(--sp-2)' }}><Btn variant="primary" onClick={save} style={{ flex: 1 }}>ذخیره</Btn><Btn onClick={() => setOpen(false)} style={{ flex: 1 }}>لغو</Btn></div>}>
        <div style={{ fontSize: 'var(--fs-base)', fontWeight: 700, color: 'var(--text)', letterSpacing: '.3px', marginBottom: 8 }}>📍 محل نصب</div>
        <Grid2>
          <Field label="سالن" required error={vErrors.hallId}>
            <SmartSelect
              value={form.hallId}
              onChange={v => setForm((f) => ({ ...f, hallId: v, zoneId: '' }))}
              options={halls.map(c => ({ value: c.id, label: c.name }))}
              placeholder="— انتخاب کنید —"
              modalTitle="انتخاب سالن"
              autoThreshold={6}
            />
          </Field>
          <Field label="بخش (اختیاری)">
            <DependentSelect
              value={form.zoneId || ''}
              onChange={v => setForm((f) => ({ ...f, zoneId: v }))}
              parentValue={form.hallId}
              parentLabel="سالن"
              options={zones.filter((z: Zone) => z.hallId === form.hallId).map((z: Zone) => ({ value: z.id, label: z.name }))}
              emptyListMessage="این سالن هنوز بخشی ندارد — از تب «بخش‌ها» اضافه کنید"
              emptyMode="select"
              placeholder="— بدون بخش —"
              modalTitle="انتخاب بخش"
              autoThreshold={6}
            />
          </Field>

        </Grid2>

        <div style={{ paddingTop: 8, fontSize: 'var(--fs-base)', fontWeight: 700, color: 'var(--text)', letterSpacing: '.3px', borderTop: '1px dashed var(--border)', marginBottom: 8, marginTop: 8 }}>🏷 هویت</div>
        <Grid2>
          <Field label="دسته" required error={vErrors.category}>
            <SmartSelect
              value={form.category || 'auxiliary'}
              onChange={(cat: string) => {
                const catEnum = cat as EquipmentCategory;
                const allowed = typesForCategory(cat);
                const nextType = allowed.includes(form.type) ? form.type : (allowed[0] || 'other');
                setForm({...form, category: catEnum, type: nextType, capacity: '', name: ''});
              }}
              options={Object.entries(CATEGORY_LABELS).map(([k, v]: [string, any]) => ({
                value: k,
                label: v.name,
                icon: v.icon,
              }))}
              placeholder="— انتخاب دسته —"
              modalTitle="انتخاب دسته"
              autoThreshold={6}
            />
          </Field>
          <EditableSelect
            label="زیرنوع"
            error={vErrors.type}
            required
            value={form.type}
            onChange={v => {
              const def = getEquipUnit(v);
              const patch: Record<string, string | undefined> = { type: v };
              // 🆕 اول از std نژاد، بعد از defaultValue
              const stdVal = stdForDefaults ? getStdDefaultForType(v, stdForDefaults) : null;
              const finalVal = stdVal ?? def.secondary?.defaultValue ?? null;
              if (finalVal != null) {
                patch.capacity = String(finalVal);
                markAuto('capacity');
              } else {
                patch.capacity = '';
                clearAuto('capacity');
              }
              setForm({ ...form, ...patch });
            }}
            options={typesForCategory(form.category || 'auxiliary').map(k => {
              const v = getEquipLabel(k) || { name: k };
              return {
                value: k,
                label: v.name,
                equipType: k,
                category: form.category || 'auxiliary',
              };
            })}
            customKey={'hal.equip.type.' + (form.category || 'auxiliary')}
            usageCheck={(name) => equipment.filter((x: Equipment) => x.type === name).length}
          />
        </Grid2>

        <Grid2>
          <Field label="نام تجهیز" required error={vErrors.name}>
            <Input placeholder={getPlaceholderForType(form.type)} value={form.name} onChange={e => { onErrorClear?.(); setForm({...form, name: e.target.value}); }} />
          </Field>
          <Field label="برند">
            <Input placeholder="پارس" value={form.brand || ''} onChange={e => setForm({...form, brand: e.target.value})} />
          </Field>
        </Grid2>

        {(suppliers && suppliers.length > 0) && (
          <Field label="تأمین‌کننده">
            <SmartSelect
              value={form.supplierId || ''}
              onChange={v => setForm({...form, supplierId: v})}
              options={suppliers.map((s: Person) => ({ value: s.id, label: s.name, subtitle: s.phone }))}
              placeholder="— انتخاب کنید —"
              modalTitle="انتخاب تأمین‌کننده"
              autoThreshold={6}
            />
          </Field>
        )}

        <div style={{ paddingTop: 8, fontSize: 'var(--fs-base)', fontWeight: 700, color: 'var(--text)', letterSpacing: '.3px', borderTop: '1px dashed var(--border)', marginBottom: 8, marginTop: 8 }}>📊 مشخصات فنی</div>
        {(() => {
          const def = getEquipUnit(form.type || 'other');
          const hasSec = !!def.secondary;
          return (
            <>
              <Grid2>
                <Field label="تعداد" error={vErrors.count}>
                  <NumField placeholder="۵" value={form.count} onChange={e => setForm({...form, count: e.target.value})} unit={getUnitLabel(form.unit || 'pcs')} min={1} max={5000} />
                </Field>
                {hasSec ? (
                  <Field
                    label={def.secondary!.label}
                    autoFrom={autoFields.has('capacity') && String(form.capacity) === String(def.secondary!.defaultValue) ? 'استاندارد' : undefined}
                    hint={def.secondary!.hint || undefined}
                    error={vErrors.capacity}
                  >
                    <NumField
                      placeholder={def.secondary!.defaultValue ? String(def.secondary!.defaultValue) : '۰'}
                      max={100000}
                      value={form.capacity}
                      onChange={e => {
                        setForm({ ...form, capacity: e.target.value });
                        clearAuto('capacity');
                      }}
                      unit={def.secondary!.unit}
                      min={1}
                    />
                  </Field>
                ) : (
                  <Field label={(() => {
                    if (def.baseUnit === 'kg') return 'قیمت هر kg';
                    return 'قیمت هر عدد';
                  })()} hint="۱۰٬۰۰۰ تا ۳ میلیارد تومان" error={vErrors.unitPrice}>
                    <MoneyField placeholder="۱۰٬۰۰۰" min={10000} max={3000000000} value={form.unitPrice} onChange={e => setForm({...form, unitPrice: e.target.value})} />
                  </Field>
                )}
              </Grid2>

              {hasSec && (
                <Grid2>
                  <Field label={(() => {
                    if (def.baseUnit === 'kg') return 'قیمت هر kg';
                    return 'قیمت هر عدد';
                  })()} hint="۱۰٬۰۰۰ تا ۳ میلیارد تومان" error={vErrors.unitPrice}>
                    <MoneyField placeholder="۱۰٬۰۰۰" min={10000} max={3000000000} value={form.unitPrice} onChange={e => setForm({...form, unitPrice: e.target.value})} />
                  </Field>
                  <Field label="گارانتی" error={vErrors.warranty}><NumField placeholder="۶" value={form.warranty} onChange={e => setForm({...form, warranty: e.target.value})} unit="ماه" min={0} max={60} /></Field>
                </Grid2>
              )}

              <div style={{ paddingTop: 8, fontSize: 'var(--fs-base)', fontWeight: 700, color: 'var(--text)', letterSpacing: '.3px', borderTop: '1px dashed var(--border)', marginBottom: 8, marginTop: 8 }}>💰 مالی و وضعیت</div>
              <Grid2>
                <Field label="وضعیت">
                  <Select value={form.status || 'active'} onChange={e => setForm({...form, status: e.target.value as EquipmentStatus })}>
                    {Object.entries(STATUS_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>{v.icon} {v.name}</option>
                    ))}
                  </Select>
                </Field>
                <Field label="تاریخ خرید">
                  <DatePicker value={form.purchasedAt} onChange={v => setForm({...form, purchasedAt: v})} placeholder="انتخاب تاریخ" />
                </Field>
              </Grid2>
              {!hasSec && (
                <Grid2>
                  <Field label="گارانتی" error={vErrors.warranty}><NumField placeholder="۶" value={form.warranty} onChange={e => setForm({...form, warranty: e.target.value})} unit="ماه" min={0} max={60} /></Field>
                  <div />
                </Grid2>
              )}


            </>
          );
        })()}

        {equipNeed ? (
          <div style={{
            fontSize: 'var(--fs-xs)',
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
              return '⚠ کم داره — نیاز ' + equipNeed.need + ' ' + equipNeed.unit + ' • فعلی ' + pct + '٪';
            })()}
          </div>
        ) : null}




      <ErrorBox>{err}</ErrorBox>
      </Modal>
  );
}
