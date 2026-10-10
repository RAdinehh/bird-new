/**
 * EquipmentFormModal — فرم افزودن/ویرایش تجهیز
 */
import { Btn, Field, Grid2, Input, Modal, MoneyField, NumField, Select, ErrorBox } from '../../../shr/components/ui';
import DatePicker from '../../../shr/components/DatePicker';
import SmartSelect from '../../../shr/components/SmartSelect';
import { STATUS_LABELS, type EquipmentStatus } from '../store';
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
  suppliers?: any[];
}

export default function EquipmentFormModal(props: EquipmentFormModalProps) {
  const { open, setOpen, form, setForm, vErrors, halls, equipment, autoFields, clearAuto, markAuto, categoriesForKind, typesForCategory, equipNeed, save, suppliers } = props;

  return (
      <Modal open={open} onClose={() => setOpen(false)} title={form.id ? 'ویرایش تجهیز' : 'افزودن تجهیز'}
        footer={<div style={{ display: "flex", gap: 6 }}><Btn variant="primary" onClick={save} disabled={Object.keys(vErrors).length > 0} style={{ flex: 1 }}>ذخیره</Btn><Btn onClick={() => setOpen(false)} style={{ flex: 1 }}>لغو</Btn></div>}>
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
          <Field label="نوع دارایی" required>
            <Select value={form.kind || 'asset'} onChange={e => {
              const newKind = e.target.value;
              const allowedCats = categoriesForKind(newKind);
              const nextCat = allowedCats.includes(form.category) ? form.category : allowedCats[0];
              const allowedTypes = typesForCategory(nextCat);
              const nextType = allowedTypes.includes(form.type) ? form.type : (allowedTypes[0] || 'other');
              setForm({ ...form, kind: newKind, category: nextCat, type: nextType, capacity: '' });
            }}>
              {Object.entries(KIND_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v.icon} {v.name}</option>
              ))}
            </Select>
          </Field>
        </Grid2>

        <Grid2>
          <Field label="دسته" required>
            <Select value={form.category || 'auxiliary'} onChange={e => {
              const cat = e.target.value;
              const allowed = typesForCategory(cat);
              const nextType = allowed.includes(form.type) ? form.type : (allowed[0] || 'other');
              setForm({...form, category: cat, type: nextType, capacity: ''});
            }}>
              {categoriesForKind(form.kind || 'asset').map(k => {
                const v = (CATEGORY_LABELS as any)[k];
                if (!v) return null;
                return <option key={k} value={k}>{v.icon} {v.name}</option>;
              })}
            </Select>
          </Field>
          <EditableSelect
            label="زیرنوع"
            required
            value={form.type}
            onChange={v => {
              const def = getEquipUnit(v);
              const patch: any = { type: v };
              if (def.secondary?.defaultValue) {
                patch.capacity = String(def.secondary.defaultValue);
              } else {
                patch.capacity = '';
              }
              setForm({ ...form, ...patch });
              if (def.secondary?.defaultValue) markAuto('capacity');
              else clearAuto('capacity');
            }}
            options={typesForCategory(form.category || 'auxiliary').map(k => {
              const v = (EQUIP_LABELS as any)[k] || { name: k };
              const catColor = CATEGORY_COLORS[form.category || 'auxiliary'] || 'var(--cat-auxiliary)';
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
          <Field label="برند" hint="مثلاً — پارس، ستاره، آکو">
            <Input placeholder="پارس" value={form.brand || ''} onChange={e => setForm({...form, brand: e.target.value})} />
          </Field>
        </Grid2>

        {(suppliers && suppliers.length > 0) && (
          <Field label="تأمین‌کننده" hint="فروشنده‌ی این تجهیز">
            <SmartSelect
              value={form.supplierId || ''}
              onChange={v => setForm({...form, supplierId: v})}
              options={suppliers.map((s: any) => ({ value: s.id, label: s.name, subtitle: s.phone }))}
              placeholder="— انتخاب کنید —"
              modalTitle="انتخاب تأمین‌کننده"
              autoThreshold={6}
            />
          </Field>
        )}

        {(() => {
          const def = getEquipUnit(form.type || 'other');
          const hasSec = !!def.secondary;
          return (
            <>
              <Grid2>
                <Field label="تعداد">
                  <NumField placeholder="۰" value={form.count} onChange={e => setForm({...form, count: e.target.value})} unit={(UNIT_LABELS_EQ as any)[form.unit || 'pcs'] || 'عدد'} min={0} />
                </Field>
                {hasSec ? (
                  <Field
                    label={def.secondary!.label}
                    autoFrom={autoFields.has('capacity') && String(form.capacity) === String(def.secondary!.defaultValue) ? 'پیش‌فرض' : undefined}
                    hint={def.secondary!.defaultValue ? `پیش‌فرض: ${def.secondary!.defaultValue} ${def.secondary!.unit}` : undefined}
                  >
                    <NumField
                      placeholder={def.secondary!.defaultValue ? String(def.secondary!.defaultValue) : '۰'}
                      value={form.capacity}
                      onChange={e => {
                        setForm({ ...form, capacity: e.target.value });
                        clearAuto('capacity');
                      }}
                      unit={def.secondary!.unit}
                      min={0}
                    />
                  </Field>
                ) : (
                  <Field label={(() => {
                    if (def.baseUnit === 'kg') return 'قیمت هر kg';
                    return 'قیمت هر عدد';
                  })()}>
                    <MoneyField placeholder="۰" value={form.unitPrice} onChange={e => setForm({...form, unitPrice: e.target.value})} />
                  </Field>
                )}
              </Grid2>

              {hasSec && (
                <Grid2>
                  <Field label={(() => {
                    if (def.baseUnit === 'kg') return 'قیمت هر kg';
                    return 'قیمت هر عدد';
                  })()}>
                    <MoneyField placeholder="۰" value={form.unitPrice} onChange={e => setForm({...form, unitPrice: e.target.value})} />
                  </Field>
                  <Field label="گارانتی"><NumField placeholder="۶" value={form.warranty} onChange={e => setForm({...form, warranty: e.target.value})} unit="ماه" min={0} /></Field>
                </Grid2>
              )}

              {!hasSec && (
                <Grid2>
                  <Field label="وضعیت">
                    <Select value={form.status || 'active'} onChange={e => setForm({...form, status: e.target.value})}>
                      {Object.entries(STATUS_LABELS).map(([k, v]) => (
                        <option key={k} value={k}>{v.icon} {v.name}</option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="گارانتی"><NumField placeholder="۶" value={form.warranty} onChange={e => setForm({...form, warranty: e.target.value})} unit="ماه" min={0} /></Field>
                </Grid2>
              )}

              {hasSec && (
                <>
                  <Field label="وضعیت">
                    <Select value={form.status || 'active'} onChange={e => setForm({...form, status: e.target.value})}>
                      {Object.entries(STATUS_LABELS).map(([k, v]) => (
                        <option key={k} value={k}>{v.icon} {v.name}</option>
                      ))}
                    </Select>
                  </Field>
                </>
              )}
            </>
          );
        })()}

        {equipNeed ? (
          <div style={{
            fontSize: 11,
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

        <Field label="تاریخ خرید">
          <DatePicker value={form.purchasedAt} onChange={v => setForm({...form, purchasedAt: v})} placeholder="انتخاب تاریخ" />
        </Field>

      </Modal>
  );
}
