/**
 * HallsFormModal — فرم افزودن/ویرایش سالن
 */
import { useState } from 'react';
import { useTempUnit } from '../../../shr/utils/temp';
import { Field, Grid2, Grid3, Input, Modal, BtnRow, Btn, NumField, Select, Textarea, ErrorBox } from '../../../shr/components/ui';
import SmartSelect from '../../../shr/components/SmartSelect';
import { useOverride } from '../../../shr/hooks/useOverride';
import OverrideHint from '../../../shr/components/OverrideHint';
import DependentSelect from '../../../shr/components/DependentSelect';
import DatePicker from '../../../shr/components/DatePicker';
import { toFa, toEn } from '../../../shr/utils/fa';
import { toastMsg } from '../../../cor/store/toast';

function TempFormField({ value, onChange, label, placeholder, autoFrom }: any) {
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
      <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', fontWeight: 600, textAlign: 'right', display: 'inline-flex', alignItems: 'center', gap: 4, justifyContent: 'flex-end' }}>
        {autoFrom ? (
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', display: 'inline-block' }} />
        ) : null}
        {label}
      </span>
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
          fontSize: 11,
          color: 'var(--accent)',
          background: 'var(--accent-soft)',
          border: '1px solid var(--accent-border)',
          borderRadius: 8,
          padding: '2px 8px',
          fontWeight: 700,
          alignSelf: 'flex-start',
          lineHeight: 1.6,
        }}>
          <span aria-hidden="true">✨</span>
          <span>از {autoFrom}</span>
        </div>
      ) : null}
    </div>
  );
}

export interface HallsFormModalProps {
  open: boolean;
  setOpen: (v: boolean) => void;
  form: any;
  setForm: any;
  err: string;
  vErrors: Record<string, string>;
  birds: any[];
  breeds: any[];
  breedStd: any;
  autoFields: Set<string>;
  clearAuto: (k: string) => void;
  save: () => void;
  stdCapacity?: number | null;
  stdTemp?: number | null;
  stdHumidity?: number | null;
}

export default function HallsFormModal(props: HallsFormModalProps) {
  const breedsForBird = (props.breeds || []).filter((b: any) => b.birdId === props.form.birdId);
  const { open, setOpen, form, setForm, err, vErrors, birds, breeds, breedStd, autoFields, clearAuto, save, stdCapacity, stdTemp, stdHumidity } = props;

  const capCurrent = form.capacity ? parseInt(toEn(form.capacity)) || null : null;
  const { hint: capHint } = useOverride({
    current: capCurrent, stdValue: stdCapacity ?? null,
    onReset: () => setForm((f: any) => ({ ...f, capacity: stdCapacity != null ? String(stdCapacity) : '' })),
    unit: 'پرنده', decimals: 0,
  });

  const tempCurrent = form.targetTemp ? parseFloat(toEn(form.targetTemp)) || null : null;
  const { hint: tempHint } = useOverride({
    current: tempCurrent, stdValue: stdTemp ?? null,
    onReset: () => setForm((f: any) => ({ ...f, targetTemp: stdTemp != null ? String(stdTemp) : '' })),
    unit: '°C', decimals: 1,
  });

  const humCurrent = form.targetHumidity ? parseFloat(toEn(form.targetHumidity)) || null : null;
  const { hint: humHint } = useOverride({
    current: humCurrent, stdValue: stdHumidity ?? null,
    onReset: () => setForm((f: any) => ({ ...f, targetHumidity: stdHumidity != null ? String(stdHumidity) : '' })),
    unit: '٪', decimals: 0,
  });

  return (
      <Modal open={open} onClose={() => setOpen(false)} title={form.id ? 'ویرایش سالن' : 'افزودن سالن'}
        footer={<BtnRow><Btn variant="primary" onClick={save} disabled={Object.keys(vErrors).length > 0}>ذخیره</Btn><Btn onClick={() => setOpen(false)}>لغو</Btn></BtnRow>}>
        <Field label="نام سالن" required><Input placeholder="مثلاً — سالن شمالی" value={form.name} onChange={e => setForm({...form, name: e.target.value})} /></Field>
        <Grid2>
            <Field label="پرنده">
              <SmartSelect
                value={form.birdId || ''}
                onChange={v => setForm({...form, birdId: v, breedId: ''})}
                options={birds.map((b: any) => ({ value: b.id, label: b.name }))}
                placeholder="— انتخاب پرنده —"
                modalTitle="انتخاب پرنده"
                autoThreshold={6}
              />
            </Field>
            <Field label="نژاد پرنده">
              <DependentSelect
                value={form.breedId}
                onChange={v => setForm({...form, breedId: v})}
                parentValue={form.birdId || ''}
                parentLabel="پرنده"
                options={breedsForBird.map((b: any) => ({ value: b.id, label: b.name }))}
                emptyListMessage="این پرنده هنوز نژادی ندارد — از بخش «پرنده و نژاد» اضافه کنید"
                placeholder="— انتخاب نژاد —"
                modalTitle="انتخاب نژاد"
              />
            </Field>
        </Grid2>
        <Grid2>
              <Field label="ظرفیت" autoFrom={autoFields.has("capacity") ? "استاندارد" : undefined}>
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
                        fontSize: 11,
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
                const patch: any = {};
                if (cap) patch.capacity = String(cap);
                if (env?.temp?.target != null) patch.targetTemp = String(env.temp.target);
                if (env?.humidity?.min != null) patch.targetHumidity = String(env.humidity.min);
                setForm((f: any) => ({ ...f, ...patch }));
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
                fontSize: 12,
                fontWeight: 700,
                textAlign: 'center',
              }}
            >
              ✨ پر کردن خودکار از استاندارد
            </button>
          )}
        <div style={{ paddingTop: 8, fontSize: 'var(--fs-base)', fontWeight: 700, color: 'var(--text)', letterSpacing: '.3px', borderTop: '1px dashed var(--border)' }}>ابعاد</div>
        <Grid3>
          <Field label="طول"><NumField placeholder="۰" value={form.length} onChange={e => setForm({...form, length: e.target.value})} unit="m" min={1} /></Field>
          <Field label="عرض"><NumField placeholder="۰" value={form.width} onChange={e => setForm({...form, width: e.target.value})} unit="m" min={1} /></Field>
          <Field label="ارتفاع"><NumField placeholder="۰" value={form.height} onChange={e => setForm({...form, height: e.target.value})} unit="m" min={1} /></Field>
        </Grid3>
        

        <div style={{ paddingTop: 8, fontSize: 'var(--fs-base)', fontWeight: 700, color: 'var(--text)', letterSpacing: '.3px', borderTop: '1px dashed var(--border)' }}>شرایط</div>
          <Grid2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0 }}>
            <TempFormField label="دمای هدف" placeholder="۲۲" autoFrom={autoFields.has("targetTemp") ? "استاندارد" : undefined} value={form.targetTemp} onChange={(v: string) => { setForm({...form, targetTemp: v}); clearAuto("targetTemp"); }} />
            <OverrideHint {...tempHint} />
          </div>
          <Field label="رطوبت هدف" autoFrom={autoFields.has("targetHumidity") ? "استاندارد" : undefined}>
            <NumField placeholder="۶۰" value={form.targetHumidity} onChange={e => { setForm({...form, targetHumidity: e.target.value}); clearAuto("targetHumidity"); }} unit="٪" min={-10} />
            <OverrideHint {...humHint} />
          </Field>
        </Grid2>
        <div style={{ paddingTop: 8, fontSize: 'var(--fs-base)', fontWeight: 700, color: 'var(--text)', letterSpacing: '.3px', borderTop: '1px dashed var(--border)' }}>زمان‌ها</div>
        <Grid2>
          <Field label="تاریخ ساخت"><DatePicker value={form.builtAt} onChange={v => setForm({...form, builtAt: v})} placeholder="انتخاب تاریخ" /></Field>
          <Field label="آخرین ضدعفونی"><DatePicker value={form.lastSanitizedAt} onChange={v => setForm({...form, lastSanitizedAt: v})} placeholder="انتخاب تاریخ" /></Field>
        </Grid2>
        <Field label="آدرس سالن"><Input placeholder="..." value={form.address} onChange={e => setForm({...form, address: e.target.value})} /></Field>
        <Field label="یادداشت">
            <Textarea placeholder="..." value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} />
          </Field>
        <ErrorBox>{err}</ErrorBox>
      </Modal>
  );
}