/**
 * HealthSection — تلفات + واکسن + دارو
 */
import { useMemo } from 'react';
import { Btn, Field, Grid2, Input, NumField, Select, Textarea } from '../../../shr/components/ui';
import SmartSelect from '../../../shr/components/SmartSelect';
import { UNIT_LABEL } from '../../whs/store';
import { toFa, toEn } from '../../../shr/utils/fa';
import { DEATH_CAUSES } from '../store';
import { useWhs } from '../../whs/store';
import type { F } from '../types';
import { FieldHint } from '../../../shr/intelligence';

interface Props {
  form: F;
  setForm: React.Dispatch<React.SetStateAction<F>>;
  vErrors: Record<string, string>;
  flockAliveCount: number;
  vaccineEnabled: boolean;
  medicineEnabled: boolean;
}

export default function HealthSection({ form, setForm, vErrors, flockAliveCount, vaccineEnabled, medicineEnabled }: Props) {
  const { items: whsItems } = useWhs();
  const vaccineItems = useMemo(() => whsItems.filter(x => x.category === 'vaccine'), [whsItems]);
  const medicineItems = useMemo(() => whsItems.filter(x => x.category === 'medicine' || x.category === 'herbal'), [whsItems]);

  return (
    <>

      {form.deaths.length > 0 && (() => {
        const total = form.deaths.reduce((a, x) => a + (x.count || 0), 0);
        const exceeds = flockAliveCount > 0 && total > flockAliveCount;
        return (
          <div style={{ padding: 'var(--pad-normal)', background: exceeds ? 'var(--danger-soft)' : 'var(--warn-soft)', border: `1px solid ${exceeds ? 'var(--danger)' : 'var(--warn-border, var(--border))'}`, borderRadius: 'var(--r-md)', fontSize: 'var(--fs-sm)', color: exceeds ? 'var(--danger)' : 'var(--warn)', fontWeight: 700, textAlign: 'center' }}>
            مجموع: {toFa(total)} پرنده
            {flockAliveCount ? ` از ${toFa(flockAliveCount)}` : ''}
            {exceeds && ' ⚠️ بیشتر از موجودی گله'}
          </div>
        );
      })()}

      {form.deaths.map((d, i) => (
        <div key={d.id} style={{ padding: 'var(--pad-normal)', background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--danger)', fontWeight: 700 }}>{d.count === 0 && !d.cause ? "رکورد جدید" : "رکورد " + toFa(i + 1)}</span>
            <button type="button" onClick={() => setForm(f => ({ ...f, deaths: f.deaths.filter(x => x.id !== d.id) }))}
              style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 18, lineHeight: 1, padding: '4px 6px', flexShrink: 0 }}>✕</button>
          </div>
          <Grid2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0, minWidth: 0 }}>
              <Field label="تعداد" error={vErrors.deathsCount || vErrors.deaths}>
                <NumField placeholder="۰" value={String(d.count || '')}
                  onChange={e => setForm(f => ({ ...f, deaths: f.deaths.map(x => x.id === d.id ? { ...x, count: parseInt(toEn(e.target.value)) || 0 } : x) }))}
                  min={0} max={flockAliveCount || undefined} unit="پرنده" />
              </Field>
              <FieldHint fieldPath="dlg.deathsCount" value={d.count} context={{ currentCount: flockAliveCount }} />
            </div>
            <Field label="علت">
              <Select value={d.cause || ''} onChange={e => setForm(f => ({ ...f, deaths: f.deaths.map(x => x.id === d.id ? { ...x, cause: e.target.value } : x) }))}>
                {DEATH_CAUSES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </Select>
            </Field>
          </Grid2>
          <Field label="توضیحات">
            <Textarea rows={2} placeholder="جزئیات..." value={d.notes || ''}
              onChange={e => setForm(f => ({ ...f, deaths: f.deaths.map(x => x.id === d.id ? { ...x, notes: e.target.value } : x) }))} />
          </Field>
        </div>
      ))}

      <Btn size="sm" full onClick={() => setForm(f => ({ ...f, deaths: [...f.deaths, { id: crypto.randomUUID(), count: 0, cause: '', notes: '' }] }))}>
        + افزودن رکورد تلفات
      </Btn>

      {vaccineEnabled && (<>
        <Btn size="sm" full onClick={() => setForm(f => ({ ...f, vaccines: [...f.vaccines, { id: crypto.randomUUID(), name: '', dose: '', method: '', reaction: '', itemId: '', quantity: null, movementId: '' }] }))}>
          + افزودن واکسن
        </Btn>
        {form.vaccines.map((v, i) => (
          <div key={v.id} style={{ padding: 'var(--pad-normal)', background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--accent)', fontWeight: 700 }}>واکسن {toFa(i + 1)}</span>
              <button onClick={() => setForm(f => ({ ...f, vaccines: f.vaccines.filter(x => x.id !== v.id) }))} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 18, lineHeight: 1, padding: '4px 6px', flexShrink: 0 }}>✕</button>
            </div>
            <Grid2>
              <Input placeholder="نام" value={v.name} onChange={e => setForm(f => ({ ...f, vaccines: f.vaccines.map(x => x.id === v.id ? { ...x, name: e.target.value } : x) }))} />
              <Input placeholder="دوز" value={v.dose} onChange={e => setForm(f => ({ ...f, vaccines: f.vaccines.map(x => x.id === v.id ? { ...x, dose: e.target.value } : x) }))} />
            </Grid2>
            {vaccineItems.length > 0 && (
              <Grid2>
                <Field label="از انبار" autoFrom="انبار (مصرف کسر می‌شه)" hint="اگه انتخاب کنی، به‌طور خودکار از موجودی انبار کم می‌شه">
                  <SmartSelect
                    value={v.itemId || ''}
                    onChange={id => setForm(f => ({ ...f, vaccines: f.vaccines.map(x => x.id === v.id ? { ...x, itemId: id, quantity: id ? (x.quantity ?? 0) : null } : x) }))}
                    options={vaccineItems.map(w => ({ value: w.id, label: w.name, subtitle: `موجودی ${toFa(w.currentStock)} ${UNIT_LABEL[w.unit]}` }))}
                    placeholder="— متصل نکن —"
                    modalTitle="انتخاب از انبار"
                    autoThreshold={6}
                  />
                </Field>
                {v.itemId && (
                  <Field label="مقدار مصرفی">
                    <NumField
                      value={v.quantity !== null && v.quantity !== undefined ? String(v.quantity) : ''}
                      onChange={e => setForm(f => ({ ...f, vaccines: f.vaccines.map(x => x.id === v.id ? { ...x, quantity: parseFloat(toEn(e.target.value).replace('٫','.')) || 0 } : x) }))}
                      unit={UNIT_LABEL[vaccineItems.find(w => w.id === v.itemId)?.unit || 'pcs'] || ''}
                      min={0}
                    />
                  </Field>
                )}
              </Grid2>
            )}
          </div>
        ))}
      </>)}

      {medicineEnabled && (<>
        <Btn size="sm" full onClick={() => setForm(f => ({ ...f, medications: [...f.medications, { id: crypto.randomUUID(), name: '', dose: '', method: '', withdrawalDays: null, itemId: '', quantity: null, movementId: '' }] }))}>
          + افزودن دارو
        </Btn>
        {form.medications.map((m, i) => (
          <div key={m.id} style={{ padding: 'var(--pad-normal)', background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--accent)', fontWeight: 700 }}>دارو {toFa(i + 1)}</span>
              <button onClick={() => setForm(f => ({ ...f, medications: f.medications.filter(x => x.id !== m.id) }))} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 18, lineHeight: 1, padding: '4px 6px', flexShrink: 0 }}>✕</button>
            </div>
            <Grid2>
              <Input placeholder="نام" value={m.name} onChange={e => setForm(f => ({ ...f, medications: f.medications.map(x => x.id === m.id ? { ...x, name: e.target.value } : x) }))} />
              <Input placeholder="دوز" value={m.dose} onChange={e => setForm(f => ({ ...f, medications: f.medications.map(x => x.id === m.id ? { ...x, dose: e.target.value } : x) }))} />
            </Grid2>

            <Field label="دوره پرهیز (روز)" hint="چند روز بعد از مصرف، گوشت و تخم قابل فروش نیست">
              <NumField
                placeholder="مثلاً ۷"
                value={m.withdrawalDays !== null && m.withdrawalDays !== undefined ? String(m.withdrawalDays) : ''}
                onChange={e => setForm(f => ({ ...f, medications: f.medications.map(x => x.id === m.id ? { ...x, withdrawalDays: e.target.value === '' ? null : (parseInt(toEn(e.target.value)) || null) } : x) }))}
                unit="روز" min={0}
              />
            </Field>
            {medicineItems.length > 0 && (
              <Grid2>
                <Field label="از انبار" autoFrom="انبار (مصرف کسر می‌شه)" hint="اگه انتخاب کنی، به‌طور خودکار از موجودی انبار کم می‌شه">
                  <SmartSelect
                    value={m.itemId || ''}
                    onChange={id => setForm(f => ({ ...f, medications: f.medications.map(x => x.id === m.id ? { ...x, itemId: id, quantity: id ? (x.quantity ?? 0) : null } : x) }))}
                    options={medicineItems.map(w => ({ value: w.id, label: w.name, subtitle: `موجودی ${toFa(w.currentStock)} ${UNIT_LABEL[w.unit]}` }))}
                    placeholder="— متصل نکن —"
                    modalTitle="انتخاب از انبار"
                    autoThreshold={6}
                  />
                </Field>
                {m.itemId && (
                  <Field label="مقدار مصرفی">
                    <NumField
                      value={m.quantity !== null && m.quantity !== undefined ? String(m.quantity) : ''}
                      onChange={e => setForm(f => ({ ...f, medications: f.medications.map(x => x.id === m.id ? { ...x, quantity: parseFloat(toEn(e.target.value).replace('٫','.')) || 0 } : x) }))}
                      unit={UNIT_LABEL[medicineItems.find(w => w.id === m.itemId)?.unit || 'pcs'] || ''}
                      min={0}
                    />
                  </Field>
                )}
              </Grid2>
            )}
          </div>
        ))}
      </>)}

    </>
  );
}
