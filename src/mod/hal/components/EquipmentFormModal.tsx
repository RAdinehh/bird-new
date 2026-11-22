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
import { toEn, toFa } from '../../../shr/utils/fa';
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

                  {(() => {
                    const t = form.type || "";
                    const secVal = Math.max(0, parseFloat(toEn(form.capacity || "")) || 0);
                    if (secVal <= 0) return null;

                    const priVal = Math.max(1, parseFloat(toEn(form.count || "")) || 1);
                    const totalVal = def.calc(priVal, secVal);
                    if (totalVal <= 0) return null;

                    const selHall = halls.find((h: Hall) => h.id === form.hallId);
                    const hallCap = selHall?.capacity || 0;
                    const l = selHall?.length || 0;
                    const w = selHall?.width || 0;
                    const h = selHall?.height || 0;
                    const hallArea = l > 0 && w > 0 ? l * w : 0;
                    const hallVol = hallArea > 0 && h > 0 ? hallArea * h : 0;

                    const bg = "var(--accent-soft)";
                    const fg = "var(--accent)";
                    const dividerColor = "var(--accent-border)";
                    const fmtInt = (n: number) => toFa(Math.round(n));

                    const rowStyle: React.CSSProperties = {
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 12,
                      fontSize: "var(--fs-sm)",
                      lineHeight: 1.6,
                    };

                    const isAirFlow = ["fan_tunnel", "fan_ceiling", "fan", "air_inlet", "swamp_cooler", "cooler"].includes(t);
                    const isBirdCap = def.baseUnit === "راس";
                    const isLamp = ["lamp_led", "lamp_fluorescent", "lamp"].includes(t);
                    const isHeating = ["radiant_brooder", "jet_heater", "duct_heater", "heater"].includes(t);

                    if (!isAirFlow && !isBirdCap && !isLamp && !isHeating) return null;

                    const rows: { label: string; value: string }[] = [];
                    let statusText = "";

                    const priStr = fmtInt(priVal);
                    const secStr = fmtInt(secVal);
                    const totStr = fmtInt(totalVal);

                    if (isAirFlow) {
                      rows.push({
                        label: "مجموع هوادهی:",
                        value: `${priStr} × ${secStr} = ${totStr} m³/h`,
                      });
                      let minLabel = "";
                      if (hallVol > 0) {
                        const cph = totalVal / hallVol;
                        const cpm = cph / 60;
                        minLabel = cpm >= 1
                          ? `${fmtInt(cpm)} بار در دقیقه`
                          : cpm > 0
                            ? `هر ${toFa(Math.max(1, Math.round(1 / cpm)))} دقیقه ۱ بار`
                            : "";
                        rows.push({
                          label: "تعویض هوای سالن:",
                          value: minLabel ? `${fmtInt(cph)} بار در ساعت (${minLabel})` : `${fmtInt(cph)} بار در ساعت`,
                        });
                      }
                      const isFanType = ["fan_tunnel", "fan_ceiling", "fan"].includes(t);
                      if (isFanType) {
                        if (hallCap > 0) {
                          const stdCoef = stdForDefaults?.equipment?.fanM3PerKg || 4.5;
                          const targetW = stdForDefaults?.growth?.weightByAge?.[stdForDefaults.growth.weightByAge.length - 1]?.weightG || 2000;
                          const needM3h = Math.ceil(((hallCap * targetW) / 1000) * stdCoef);
                          const diff = Math.round(totalVal - needM3h);
                          statusText = diff >= 0
                            ? `کافی (نیاز ${fmtInt(needM3h)} m³/h | +${toFa(diff)})`
                            : `کم داره (نیاز ${fmtInt(needM3h)} m³/h | -${toFa(Math.abs(diff))})`;
                        } else {
                          statusText = `${totStr} m³/h ثبت شد`;
                        }
                      } else {
                        statusText = hallVol > 0
                          ? (minLabel || `${totStr} m³/h`)
                          : `${totStr} m³/h ثبت شد`;
                      }
                    } else if (isBirdCap) {
                      rows.push({
                        label: "ظرفیت پوشش کل:",
                        value: `${priStr} × ${secStr} = ${totStr} راس`,
                      });
                      if (hallCap > 0) {
                        const diff = Math.round(totalVal - hallCap);
                        statusText = diff >= 0
                          ? `کافی (${totStr} در برابر ${toFa(hallCap)} راس | +${toFa(diff)})`
                          : `کم داره (${totStr} در برابر ${toFa(hallCap)} راس | -${toFa(Math.abs(diff))})`;
                      } else {
                        statusText = `${totStr} راس پوشش`;
                      }
                    } else if (isLamp) {
                      rows.push({
                        label: "مجموع توان:",
                        value: `${priStr} × ${secStr} = ${totStr} W`,
                      });
                      if (hallArea > 0) {
                        const wPerM2 = Math.round(totalVal / hallArea);
                        const stdW = stdForDefaults?.equipment?.lampWattPerM2 || 3;
                        statusText = wPerM2 >= stdW
                          ? `کافی (${totStr} ÷ ${fmtInt(hallArea)} = ${toFa(wPerM2)} W/m²)`
                          : `کم داره (${totStr} ÷ ${fmtInt(hallArea)} = ${toFa(wPerM2)} W/m²)`;
                      } else {
                        statusText = `${totStr} W کل توان`;
                      }
                    } else if (isHeating) {
                      rows.push({
                        label: "مجموع توان گرمایشی:",
                        value: `${priStr} × ${secStr} = ${totStr} kW`,
                      });
                      if (hallArea > 0) {
                        const wPerM2 = Math.round((totalVal * 1000) / hallArea);
                        statusText = `${fmtInt(totalVal * 1000)} W ÷ ${fmtInt(hallArea)} m² = ${toFa(wPerM2)} W/m²`;
                      } else if (hallCap > 0) {
                        const wPerBird = Math.round((totalVal * 1000) / hallCap);
                        statusText = `${fmtInt(totalVal * 1000)} W ÷ ${toFa(hallCap)} راس = ${toFa(wPerBird)} W/راس`;
                      } else {
                        statusText = `${totStr} kW کل توان`;
                      }
                    }

                    return (
                      <div style={{
                        marginTop: 8,
                        marginBottom: 8,
                        padding: "10px 12px",
                        borderRadius: "var(--r-md)",
                        background: bg,
                        color: fg,
                        display: "flex",
                        flexDirection: "column",
                        gap: 4,
                      }}>
                        {rows.map((r, idx) => (
                          <div key={idx} style={rowStyle}>
                            <span>{r.label}</span>
                            <span style={{ fontWeight: 700 }}>{r.value}</span>
                          </div>
                        ))}
                        <div style={{
                          ...rowStyle,
                          marginTop: 4,
                          paddingTop: 6,
                          borderTop: `1px solid ${dividerColor}`,
                          fontWeight: 700,
                        }}>
                          <span>وضعیت:</span>
                          <span>{statusText}</span>
                        </div>
                      </div>
                    );
                  })()}

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
