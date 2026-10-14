/**
 * HallsFormModal — فرم افزودن/ویرایش سالن
 */
import { useState } from 'react';
import { type HallFormData } from '../_hallsHelpers';
import type { Bird, Breed } from '../../brd/store';
import type { Person } from '../../ctc/store';
import { useTempUnit } from '../../../shr/utils/temp';
import { Field, Grid2, Grid3, Input, Modal, BtnRow, Btn, NumField, Select, Textarea, ErrorBox } from '../../../shr/components/ui';
import SmartSelect from '../../../shr/components/SmartSelect';
import { useOverride } from '../../../shr/hooks/useOverride';
import OverrideHint from '../../../shr/components/OverrideHint';
import DependentSelect from '../../../shr/components/DependentSelect';
import DatePicker from '../../../shr/components/DatePicker';
import { toFa, toEn } from '../../../shr/utils/fa';
import { toastMsg } from '../../../cor/store/toast';
import { VENT_SYS_LABELS, FEEDER_LABELS, DRINKER_LABELS, LITTER_LABELS } from '../_labels';

interface TempFormFieldProps {
  value: string;
  onChange: (v: string) => void;
  label?: string;
  placeholder?: string;
  autoFrom?: string;
  error?: string;
  noLabel?: boolean;
}
function TempFormField({ value, onChange, label, placeholder, autoFrom, error, noLabel }: TempFormFieldProps) {
  const tempUnit = useTempUnit();
  const [local, setLocal] = useState<string>('');
  const [editing, setEditing] = useState(false);

  const celsius = (() => {
    if (value === '' || value == null) return null;
    const en = String(value).replace(/[۰-۹]/g, (d: string) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d))).replace(/[٫،]/g, '.');
    const n = parseFloat(en);
    return isNaN(n) ? null : n;
  })();

  const displayVal = celsius == null ? '' : (
    tempUnit === 'c' ? String(celsius) : String(Math.round((celsius * 9 / 5 + 32) * 10) / 10)
  );

  const shown = editing ? local : displayVal;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let v = e.target.value;
    v = v.replace(/[۰-۹]/g, (d: string) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)));
    v = v.replace(/[٫،]/g, '.');
    v = v.replace(/[^\d.-]/g, '');
    setLocal(v);
    if (v === '' || v === '-' || v === '.') { onChange(''); return; }
    const n = parseFloat(v);
    if (isNaN(n)) return;
    const c = tempUnit === 'c' ? n : (n - 32) * 5 / 9;
    onChange(String(Math.round(c * 10) / 10));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
      {!noLabel && (
      <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', fontWeight: 600, textAlign: 'right', display: 'inline-flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end' }}>
        {autoFrom ? (
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', display: 'inline-block' }} />
        ) : null}
        {label}
      </span>
      )}
      <div style={{
        width: '100%', minWidth: 0, height: 38,
        background: autoFrom ? 'var(--accent-soft)' : 'var(--input-bg)',
        border: '1px solid ' + (autoFrom ? 'var(--accent-border)' : 'var(--border)'),
        borderRadius: 'var(--r-md)',
        padding: '0 12px',
        display: 'flex', alignItems: 'center', gap: 8,
        overflow: 'hidden',
      }}>
        <input
          type="text"
          inputMode="decimal"
          value={shown}
          onChange={handleChange}
          onFocus={() => { setEditing(true); setLocal(displayVal); }}
          onBlur={() => setEditing(false)}
          placeholder={placeholder}
          dir="ltr"
          style={{
            flex: '1 1 0%', width: '100%', minWidth: 0,
            background: 'none', border: 'none', outline: 'none',
            color: 'var(--text)', fontFamily: 'inherit',
            fontSize: 'var(--fs-base)', fontWeight: 600,
            textAlign: 'right',
          }}
        />
        <span style={{ fontSize: 'var(--fs-sm)', color: 'var(--dim)', flexShrink: 0 }}>
          {tempUnit === 'c' ? '°C' : '°F'}
        </span>
      </div>
      {autoFrom ? (
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          fontSize: 'var(--fs-xs)',
          color: 'var(--accent)',
          background: 'var(--accent-soft)',
          border: '1px solid var(--accent-border)',
          borderRadius: 'var(--r-sm)',
          padding: '2px 8px',
          fontWeight: 700,
          alignSelf: 'flex-start',
          lineHeight: 1.6,
        }}>
          <span aria-hidden="true">✨</span>
          <span>از {autoFrom}</span>
        </div>
      ) : null}
      {error ? (
        <div style={{
          fontSize: 'var(--fs-xs)',
          color: 'var(--danger)',
          fontWeight: 600,
          paddingRight: 2,
          lineHeight: 1.5,
          display: 'flex',
          alignItems: 'center',
          gap: 4,
        }}>
          <span aria-hidden="true">⚠️</span>
          <span>{error}</span>
        </div>
      ) : null}
    </div>
  );
}

export interface HallsFormModalProps {
  open: boolean;
  setOpen: (v: boolean) => void;
  form: HallFormData;
  setForm: React.Dispatch<React.SetStateAction<HallFormData>>;
  err: string;
  vErrors: Record<string, string>;
  birds: Bird[];
  breeds: Breed[];
  breedStd: ReturnType<typeof import('../../../shr/hooks/useBreedStandard').useBreedStandard>;
  autoFields: Set<string>;
  clearAuto: (k: string) => void;
  save: () => void;
  stdCapacity?: number | null;
  stdTemp?: number | null;
  stdHumidity?: number | null;
  workers?: Person[];
  /** 🆕 پاک کردن خطا هنگام تایپ */
  onErrorClear?: () => void;
}

export default function HallsFormModal(props: HallsFormModalProps) {
  const breedsForBird = (props.breeds || []).filter((b: Breed) => b.birdId === props.form.birdId);
  const { open, setOpen, form, setForm, err, vErrors, birds, breeds, breedStd, autoFields, clearAuto, save, stdCapacity, stdTemp, stdHumidity, workers, onErrorClear } = props;

  const capCurrent = form.capacity ? parseInt(toEn(form.capacity)) || null : null;
  const { hint: capHint } = useOverride({
    current: capCurrent, stdValue: stdCapacity ?? null,
    onReset: () => setForm((f) => ({ ...f, capacity: stdCapacity != null ? String(stdCapacity) : '' })),
    unit: 'پرنده', decimals: 0,
  });

  const tempCurrent = form.targetTemp ? parseFloat(toEn(form.targetTemp)) || null : null;
  const { hint: tempHint } = useOverride({
    current: tempCurrent, stdValue: stdTemp ?? null,
    onReset: () => setForm((f) => ({ ...f, targetTemp: stdTemp != null ? String(stdTemp) : '' })),
    unit: '°C', decimals: 1,
  });

  const humCurrent = form.targetHumidity ? parseFloat(toEn(form.targetHumidity)) || null : null;
  const { hint: humHint } = useOverride({
    current: humCurrent, stdValue: stdHumidity ?? null,
    onReset: () => setForm((f) => ({ ...f, targetHumidity: stdHumidity != null ? String(stdHumidity) : '' })),
    unit: '٪', decimals: 0,
  });

  return (
      <Modal open={open} onClose={() => setOpen(false)} title={form.id ? 'ویرایش سالن' : 'افزودن سالن'}
        footer={<BtnRow><Btn variant="primary" onClick={save} disabled={Object.keys(vErrors).length > 0}>ذخیره</Btn><Btn onClick={() => setOpen(false)}>لغو</Btn></BtnRow>}>
        <div style={{ fontSize: 'var(--fs-base)', fontWeight: 700, color: 'var(--text)', letterSpacing: '.3px', marginBottom: 8 }}>🏷 هویت و مدیریت</div>
        <Grid2>
          <Field label="نام سالن" required error={vErrors.name} hint="نامی که سالن رو با اون می‌شناسی"><Input placeholder="مثلاً — سالن شمالی" value={form.name} onChange={e => { onErrorClear?.(); setForm({...form, name: e.target.value}); }} /></Field>
          <Field label="کد سالن" hint="شناسه داخلی — اگه خالی بمونه، خودکار از نام ساخته می‌شه">
            <Input placeholder="مثلاً — hall-north" dir="ltr" value={form.code} onChange={e => setForm({...form, code: e.target.value})} />
          </Field>
        </Grid2>

        <Field label="وضعیت سالن">
          <Select value={form.status || 'empty'} onChange={e => setForm({...form, status: e.target.value})}>
            <option value="active">🟢 فعال</option>
            <option value="empty">⚪ خالی</option>
            <option value="sanitizing">🟡 در حال ضدعفونی</option>
            <option value="maintenance">🔴 تعمیر</option>
            <option value="inactive">⚫ غیرفعال</option>
          </Select>
        </Field>

        {(workers && workers.length > 0) && (
          <Field label="مسئول سالن" hint="کارگر مسئول این سالن">
            <SmartSelect
              value={form.responsibleId || ''}
              onChange={v => setForm({...form, responsibleId: v})}
              options={workers.map((w: Person) => ({ value: w.id, label: w.name, subtitle: w.phone }))}
              placeholder="— انتخاب کنید —"
              modalTitle="انتخاب مسئول"
              autoThreshold={6}
            />
          </Field>
        )}
        <Grid2>
            <Field label="پرنده" hint="پرنده‌ای که در این سالن نگهداری می‌شه">
              <SmartSelect
                value={form.birdId || ''}
                onChange={v => setForm({...form, birdId: v, breedId: ''})}
                options={birds.map((b: Bird) => ({ value: b.id, label: b.name }))}
                placeholder="— انتخاب پرنده —"
                modalTitle="انتخاب پرنده"
                autoThreshold={6}
              />
            </Field>
            <Field label="نژاد پرنده" hint="نژاد پرنده (از سالن یا والد)">
              <DependentSelect
                value={form.breedId}
                onChange={v => setForm({...form, breedId: v})}
                parentValue={form.birdId || ''}
                parentLabel="پرنده"
                options={breedsForBird.map((b: Breed) => ({ value: b.id, label: b.name }))}
                emptyListMessage="این پرنده هنوز نژادی ندارد — از بخش «پرنده و نژاد» اضافه کنید"
                placeholder="— انتخاب نژاد —"
                modalTitle="انتخاب نژاد"
              />
            </Field>
        </Grid2>
        <div style={{ paddingTop: 8, fontSize: 'var(--fs-base)', fontWeight: 700, color: 'var(--text)', letterSpacing: '.3px', borderTop: '1px dashed var(--border)' }}>📐 ابعاد و ظرفیت</div>
        <Grid3>
          <Field label="طول" error={vErrors.length}><NumField placeholder="۰" value={form.length} onChange={e => setForm({...form, length: e.target.value})} unit="m" min={1} max={500} autoClamp /></Field>
          <Field label="عرض" error={vErrors.width}><NumField placeholder="۰" value={form.width} onChange={e => setForm({...form, width: e.target.value})} unit="m" min={1} max={200} autoClamp /></Field>
          <Field label="ارتفاع" error={vErrors.height}><NumField placeholder="۰" value={form.height} onChange={e => setForm({...form, height: e.target.value})} unit="m" min={1} max={20} autoClamp /></Field>
        </Grid3>
        <Grid2>
              <Field label="ظرفیت" autoFrom={autoFields.has("capacity") ? "استاندارد" : undefined} error={vErrors.capacity}>
                <NumField placeholder="۱۰۰۰" value={form.capacity} onChange={e => { setForm({...form, capacity: e.target.value}); clearAuto("capacity"); }} unit="پرنده" min={0} />
              </Field>
              {(() => {
                const std = form.breedId ? breedStd.byBreedId(form.breedId) : null;
                const density = std?.space?.densityMax;
                const L = parseFloat(toEn(form.length)) || 0;
                const W = parseFloat(toEn(form.width)) || 0;
                const area = L * W;
                if (!(area > 0 && density)) return <div />;
                const cap = Math.floor(area * density);
                return (
                  <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                    <div
                      dir="ltr"
                      style={{
                        width: '100%',
                        padding: '0 10px',
                        height: 38,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'var(--input-bg)',
                        border: '1px dashed var(--border)',
                        borderRadius: 'var(--r-md)',
                        fontSize: 'var(--fs-xs)',
                        color: 'var(--muted)',
                        fontVariantNumeric: 'tabular-nums',
                        fontWeight: 600,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {toFa(area)} × {toFa(density)} = {toFa(cap)}
                    </div>
                  </div>
                );
              })()}
            </Grid2>
            <OverrideHint {...capHint} />
          {form.breedId && (
            <button
              type="button"
              onClick={() => {
                const std = breedStd.byBreedId(form.breedId);
                if (!std) return;
                const area = (parseFloat(toEn(form.length)) || 0) * (parseFloat(toEn(form.width)) || 0);
                const density = std.space?.densityMax;
                const cap = area > 0 && density ? Math.floor(area * density) : null;
                const env = std.env?.[0];
                const patch: Partial<HallFormData> = {};
                if (cap) patch.capacity = String(cap);
                if (env?.temp?.target != null) patch.targetTemp = String(env.temp.target);
                if (env?.humidity?.min != null) patch.targetHumidity = String(env.humidity.min);
                setForm((f) => ({ ...f, ...patch }));
                toastMsg.info('مقادیر از استاندارد پر شد')
              }}
              style={{
                marginTop: 6,
                width: '100%',
                padding: '8px',
                background: 'var(--accent-soft)',
                border: '1px solid var(--accent-border)',
                borderRadius: 'var(--r-md)',
                color: 'var(--accent)',
                cursor: 'pointer',
                fontFamily: 'inherit',
                fontSize: 'var(--fs-sm)',
                fontWeight: 700,
                textAlign: 'center',
              }}
            >
              ✨ پر کردن خودکار از استاندارد
            </button>
          )}
        

        <div style={{ paddingTop: 8, fontSize: 'var(--fs-base)', fontWeight: 700, color: 'var(--text)', letterSpacing: '.3px', borderTop: '1px dashed var(--border)' }}>⚙️ سیستم‌ها</div>
        <Grid2>
          <Field label="تهویه" hint="حجم تبادل هوا در ساعت">
            <NumField placeholder="۰" value={form.ventilation} onChange={e => setForm({...form, ventilation: e.target.value})} unit="m³/h" min={0} max={100000} autoClamp />
          </Field>
          <Field label="روشنایی" hint="شدت نور">
            <NumField placeholder="۰" value={form.light} onChange={e => setForm({...form, light: e.target.value})} unit="lux" min={0} max={500} autoClamp />
          </Field>
        </Grid2>
        <Grid2>
          <Field label="سیستم تهویه">
            <Select value={form.ventilationSystem || ''} onChange={e => setForm({...form, ventilationSystem: e.target.value})}>
              <option value="">—</option>
              {Object.entries(VENT_SYS_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </Select>
          </Field>
          <Field label="نوع بستر">
            <Select value={form.litterType || ''} onChange={e => setForm({...form, litterType: e.target.value})}>
              <option value="">—</option>
              {Object.entries(LITTER_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </Select>
          </Field>
        </Grid2>
        <Grid2>
          <Field label="نوع دانخوری">
            <Select value={form.feederType || ''} onChange={e => setForm({...form, feederType: e.target.value})}>
              <option value="">—</option>
              {Object.entries(FEEDER_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </Select>
          </Field>
          <Field label="نوع آبخوری">
            <Select value={form.drinkerType || ''} onChange={e => setForm({...form, drinkerType: e.target.value})}>
              <option value="">—</option>
              {Object.entries(DRINKER_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </Select>
          </Field>
        </Grid2>

        <div style={{ paddingTop: 8, fontSize: 'var(--fs-base)', fontWeight: 700, color: 'var(--text)', letterSpacing: '.3px', borderTop: '1px dashed var(--border)' }}>🌡 شرایط محیطی</div>
          <Grid2>
          <Field label="دمای هدف" autoFrom={autoFields.has("targetTemp") ? "استاندارد" : undefined} error={vErrors.targetTemp}>
            <TempFormField noLabel placeholder="۲۲" value={form.targetTemp} onChange={(v: string) => { setForm({...form, targetTemp: v}); clearAuto("targetTemp"); }} />
            <OverrideHint {...tempHint} />
          </Field>
          <Field label="رطوبت هدف" autoFrom={autoFields.has("targetHumidity") ? "استاندارد" : undefined} error={vErrors.targetHumidity}>
            <NumField placeholder="۶۰" value={form.targetHumidity} onChange={e => { setForm({...form, targetHumidity: e.target.value}); clearAuto("targetHumidity"); }} unit="٪" min={0} max={100} autoClamp />
            <OverrideHint {...humHint} />
          </Field>
        </Grid2>
        <div style={{ paddingTop: 8, fontSize: 'var(--fs-base)', fontWeight: 700, color: 'var(--text)', letterSpacing: '.3px', borderTop: '1px dashed var(--border)' }}>📅 زمان‌ها و ضدعفونی</div>
        <Grid2>
          <Field label="تاریخ ساخت"><DatePicker value={form.builtAt} onChange={v => setForm({...form, builtAt: v})} placeholder="انتخاب تاریخ" /></Field>
          <Field label="آخرین ضدعفونی"><DatePicker value={form.lastSanitizedAt} onChange={v => setForm({...form, lastSanitizedAt: v})} placeholder="انتخاب تاریخ" /></Field>
        </Grid2>
        <Field label="یادداشت ضدعفونی" hint="روش یا ماده‌ی ضدعفونی (دستی)">
          <Input placeholder="مثلاً — سرکه سیب ۵٪، همه دیوارها" value={form.sanitizeNotes || ''} onChange={e => setForm({...form, sanitizeNotes: e.target.value})} />
        </Field>
        <div style={{ paddingTop: 8, fontSize: 'var(--fs-base)', fontWeight: 700, color: 'var(--text)', letterSpacing: '.3px', borderTop: '1px dashed var(--border)', marginTop: 4 }}>📝 یادداشت و آدرس</div>
        <Field label="آدرس سالن" hint="آدرس یا موقعیت مکانی"><Input placeholder="..." value={form.address} onChange={e => setForm({...form, address: e.target.value})} /></Field>
        <Field label="یادداشت" hint="توضیحات اختیاری">
            <Textarea placeholder="..." value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} />
          </Field>
        <ErrorBox>{err}</ErrorBox>
      </Modal>
  );
}