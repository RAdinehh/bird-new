/**
 * EquipmentFormModal — فرم افزودن/ویرایش تجهیز
 */
import { useFormat } from '../../../shr/units/useFormat';

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
  activeBirdCount?: number;
  activeFlockCount?: number;
  /** 🆕 پاک کردن خطا هنگام تایپ */
  onErrorClear?: () => void;
}

export default function EquipmentFormModal(props: EquipmentFormModalProps) {
  const fmt = useFormat();
  const { open, setOpen, form, setForm, err, vErrors, halls, zones, equipment, autoFields, clearAuto, markAuto, typesForCategory, equipNeed, save, suppliers, stdForDefaults, activeBirdCount = 0, activeFlockCount = 0, onErrorClear } = props;

  const mapPrimaryUnit = (u?: string): EquipmentFormData['unit'] => {
    if (u === 'm²' || u === 'm2') return 'm2';
    if (u === 'm') return 'm';
    if (u === 'kg') return 'kg';
    if (u === 'L') return 'L';
    return 'pcs';
  };


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
              placeholder="— انتخاب —"
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
                const nextDef = getEquipUnit(nextType);
                const stdVal = stdForDefaults ? getStdDefaultForType(nextType, stdForDefaults) : null;
                const finalVal = stdVal ?? nextDef.secondary?.defaultValue ?? null;
                if (finalVal != null) markAuto('capacity'); else clearAuto('capacity');
                setForm({
                  ...form,
                  category: catEnum,
                  type: nextType,
                  unit: mapPrimaryUnit(nextDef.primary.unit),
                  capacity: finalVal != null ? String(finalVal) : '',
                  name: '',
                });
              }}
              options={Object.entries(CATEGORY_LABELS).map(([k, v]: [string, any]) => ({
                value: k,
                label: v.name,
                icon: v.icon,
              }))}
              placeholder="— انتخاب —"
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
              const patch: Record<string, any> = { type: v, unit: mapPrimaryUnit(def.primary.unit) };
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
            <Input placeholder="نام برند" value={form.brand || ''} onChange={e => setForm({...form, brand: e.target.value})} />
          </Field>
        </Grid2>

        {(suppliers && suppliers.length > 0) && (
          <Field label="تأمین‌کننده">
            <SmartSelect
              value={form.supplierId || ''}
              onChange={v => setForm({...form, supplierId: v})}
              options={suppliers.map((s: Person) => ({ value: s.id, label: s.name, subtitle: s.phone }))}
              placeholder="— انتخاب —"
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
                <Field label={def.primary.label || "تعداد"} error={vErrors.count}>
                  <NumField placeholder="۰" value={form.count} onChange={e => setForm({...form, count: e.target.value})} unit={def.primary.unit || getUnitLabel(form.unit || 'pcs')} min={1} max={5000} />
                </Field>
                {hasSec ? (
                  <Field
                    label={def.secondary!.label}
                    autoFrom={autoFields.has('capacity') && String(form.capacity) === String(def.secondary!.defaultValue) ? 'استاندارد' : undefined}
                    help={(() => {
                      const t = form.type || 'other';
                      const typeLabel = getEquipLabel(t)?.name || 'تجهیز';
                      const hintText = def.secondary?.hint;
                      const USAGE_NOTES: Record<string, string> = {
                        fan_tunnel: 'در انتهای سالن نصب می‌شود؛ سرعت باد طولی در تابستان حدود ۲ تا ۲٫۵ متر بر ثانیه ایجاد می‌کند.',
                        fan_ceiling: 'برای یکنواخت‌سازی دما و جلوگیری از تجمع گاز آمونیاک در کف سالن استفاده می‌شود.',
                        air_inlet: 'در دیوارهای جانبی نصب می‌شود تا هوای تازه بدون برخورد مستقیم به پرنده وارد سالن شود.',
                        nipple: 'بهداشتی‌ترین سیستم آب‌رسانی؛ تنظیم ارتفاع خط و فشار آب متناسب با سن گله ضروری است.',
                        cup: 'دسترسی آسان برای جوجه و نیمچه؛ نیاز به شستشوی دوره‌ای کاسه‌ها برای جلوگیری از آلودگی دارد.',
                        drinker_auto_hanging: 'تنظیم سطح آب با وزن آب داخل کاسه انجام می‌شود؛ لبه آن باید هم‌سطح پشت پرنده باشد.',
                        fountain_drinker: 'مخصوص روزهای اول جوجه‌ریزی؛ روی سطح صاف قرار گیرد تا از خیس شدن بستر جلوگیری شود.',
                        trough: 'تأمین آب پیوسته در طول سالن؛ نیازمند تمیزکاری روزانه و تراز بودن شیب ناودان است.',
                        drinker_capsule: 'مناسب جوجه‌های کم‌تعداد یا باکس‌های قرنطینه با تعویض آسان مخزن.',
                        feeder_chick_tray: 'مخصوص هفته اول تا دسترسی آسان جوجه به دان فراهم شود؛ از روز ۷ به سیستم اصلی منتقل شود.',
                        feeder_pan: 'توزیع هم‌زمان و یکنواخت دان در کل سالن و کاهش پرت دان با لبه ضدریزش بشقاب.',
                        feeder_chain: 'مناسب سالن‌های طولانی، مرغ مادر و تخم‌گذار با سرعت انتقال یکنواخت دان.',
                        feeder_tube: 'قابل تنظیم ارتفاع با رشد گله؛ برای جلوگیری از ریختن دان، سینی نباید بیش از نصف پر شود.',
                        feeder_bucket: 'مناسب سالن‌های کوچک یا تکمیل ظرفیت دان‌خوری در سنین بالا.',
                        feeder_manual: 'پرکردن دستی در نوبت‌های مشخص؛ برای جلوگیری از رقابت، فضای کافی برای همه پرنده‌ها لازم است.',
                        lamp_led: 'مصرف برق پایین، عمر بالا و نور بدون پرش؛ شدت نور را در سنین مختلف با دیمر کنترل کنید.',
                        lamp_fluorescent: 'نوردهی گسترده اما با افت نوری بیشتر در طول زمان نسبت به لامپ ال‌ای‌دی.',
                        radiant_brooder: 'گرمای موضعی مستقیم به کف سالن و بدن جوجه می‌دهد و بستر را خشک نگه می‌دارد.',
                        jet_heater: 'گرمایش سریع هوای سالن؛ مدل دودکش‌دار برای حفظ کیفیت هوا و اکسیژن سالن ایمن‌تر است.',
                        duct_heater: 'توزیع یکنواخت هوای گرم از طریق کانال در سالن‌های بزرگ با راندمان حرارتی بالا.',
                      };
                      const blocks: string[] = [];
                      if (hintText) {
                        blocks.push(`**استاندارد ${typeLabel}** ${hintText}`);
                      }
                      if (USAGE_NOTES[t]) {
                        blocks.push(`**نکته کاربردی** ${USAGE_NOTES[t]}`);
                      }
                      return blocks.length > 0 ? blocks.join('\n') : undefined;
                    })()}
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
                    <MoneyField placeholder="۰" min={10000} max={3000000000} value={form.unitPrice} onChange={e => setForm({...form, unitPrice: e.target.value})} />
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
                    const hasFlock = activeBirdCount > 0;
                    const targetBirds = hasFlock ? activeBirdCount : hallCap;
                    const basisLabel = hasFlock
                      ? (activeFlockCount > 1 ? `${fmt.count(activeFlockCount)} گله فعال (${fmt.count(activeBirdCount)} راس)` : `گله فعال (${fmt.count(activeBirdCount)} راس)`)
                      : (hallCap > 0 ? `ظرفیت سالن (${fmt.count(hallCap)} راس)` : "");
                    const l = selHall?.length || 0;
                    const w = selHall?.width || 0;
                    const h = selHall?.height || 0;
                    const hallArea = l > 0 && w > 0 ? l * w : 0;
                    const hallVol = hallArea > 0 && h > 0 ? hallArea * h : 0;

                    const bg = "var(--accent-soft)";
                    const fg = "var(--accent)";
                    const dividerColor = "var(--accent-border)";
                    const fmtInt = (n: number) => fmt.count(Math.round(n));

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
                            ? `هر ${fmt.count(Math.max(1, Math.round(1 / cpm)))} دقیقه ۱ بار`
                            : "";
                        rows.push({
                          label: "تعویض هوای سالن:",
                          value: minLabel ? `${fmtInt(cph)} بار در ساعت (${minLabel})` : `${fmtInt(cph)} بار در ساعت`,
                        });
                      }
                      const isFanType = ["fan_tunnel", "fan_ceiling", "fan"].includes(t);
                      if (isFanType) {
                        if (targetBirds > 0) {
                          if (basisLabel) rows.push({ label: "معیار سنجش:", value: basisLabel });
                          const stdCoef = stdForDefaults?.equipment?.fanM3PerKg || 4.5;
                          const targetW = stdForDefaults?.growth?.weightByAge?.[stdForDefaults.growth.weightByAge.length - 1]?.weightG || 2000;
                          const needM3h = Math.ceil(((targetBirds * targetW) / 1000) * stdCoef);
                          const diff = Math.round(totalVal - needM3h);
                          statusText = diff > 0
                            ? `کافی (مازاد ${fmt.num(diff)} m³/h)`
                            : diff === 0
                            ? `کافی (مطابق نیاز)`
                            : `کمبود ${fmt.num(Math.abs(diff))} m³/h (نیاز ${fmtInt(needM3h)})`;
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
                      if (targetBirds > 0) {
                        if (basisLabel) rows.push({ label: "معیار سنجش:", value: basisLabel });
                        const diff = Math.round(totalVal - targetBirds);
                        statusText = diff > 0
                          ? `کافی (مازاد ${fmt.num(diff)} راس)`
                          : diff === 0
                          ? `کافی (مطابق نیاز)`
                          : `کمبود ${fmt.num(Math.abs(diff))} راس (نیاز ${fmt.count(targetBirds)} راس)`;
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
                          ? `کافی (${fmt.num(wPerM2)} W/m²)`
                          : `کمبود نور (${fmt.num(wPerM2)} از ${fmt.num(stdW)} W/m²)`;
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
                        statusText = `${fmt.num(wPerM2)} W به ازای هر مترمربع`;
                      } else if (targetBirds > 0) {
                        if (basisLabel) rows.push({ label: "معیار سنجش:", value: basisLabel });
                        const wPerBird = Math.round((totalVal * 1000) / targetBirds);
                        statusText = `${fmt.num(wPerBird)} W به ازای هر راس`;
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
                    <MoneyField placeholder="۰" min={10000} max={3000000000} value={form.unitPrice} onChange={e => setForm({...form, unitPrice: e.target.value})} />
                  </Field>
                  <Field label="گارانتی" error={vErrors.warranty}><NumField placeholder="۰" value={form.warranty} onChange={e => setForm({...form, warranty: e.target.value})} unit="ماه" min={0} max={60} /></Field>
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
                  <Field label="گارانتی" error={vErrors.warranty}><NumField placeholder="۰" value={form.warranty} onChange={e => setForm({...form, warranty: e.target.value})} unit="ماه" min={0} max={60} /></Field>
                  <div />
                </Grid2>
              )}


            </>
          );
        })()}






      <ErrorBox>{err}</ErrorBox>
      </Modal>
  );
}
