/**
 * HealthSection — تلفات + واکسن + دارو
 */
import { useMemo, useState } from 'react';
import { Btn, Field, Grid2, Input, NumField, Select, Textarea, AlertBox, Tag, SummaryCard } from '../../../shr/components/ui';
import { HelpIcon } from '../../../shr/components/ui/HelpIcon';
import SmartSelect from '../../../shr/components/SmartSelect';
import { UNIT_LABEL } from '../../whs/store';
import { formatQty } from '../../../shr/utils/fa';
import { toFa, toEn } from '../../../shr/utils/fa';
import { DEATH_CAUSES } from '../store';
import { useWhs } from '../../whs/store';
import { useFlk } from '../../flk/store';
import type { F } from '../types';
import { FieldHint } from '../../../shr/intelligence/FieldHint';

interface Props {
  form: F;
  setForm: React.Dispatch<React.SetStateAction<F>>;
  vErrors: Record<string, string>;
  flockAliveCount: number;
  vaccineEnabled: boolean;
  medicineEnabled: boolean;
  showError: (field: string) => string | undefined;
  markTouched: (field: string) => void;
}

export default function HealthSection({ form, setForm, vErrors, flockAliveCount, vaccineEnabled, medicineEnabled, showError, markTouched }: Props) {
  const { items: whsItems } = useWhs();
  const flock = useFlk(s => s.flocks.find(f => f.id === form.flockId));
  const isSexed = !!flock?.genderSplitAt;
  const vaccineItems = useMemo(() => whsItems.filter(x => x.category === 'vaccine'), [whsItems]);
  const medicineItems = useMemo(() => whsItems.filter(x => x.category === 'medicine' || x.category === 'herbal'), [whsItems]);
  const chemicalItems = useMemo(() => medicineItems.filter(x => x.category === 'medicine'), [medicineItems]);
  const herbalItems = useMemo(() => medicineItems.filter(x => x.category === 'herbal'), [medicineItems]);
  const causeOptions = useMemo(() => DEATH_CAUSES.map(([v, l]) => ({ value: v, label: l })), []);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Btn size="sm" full onClick={() => {
            const newId = crypto.randomUUID();
            setForm(f => ({ ...f, deaths: [...f.deaths, { id: newId, count: 0, cause: '', notes: '' }] }));
            setExpandedId('d-' + newId);
          }}>
            + تلفات
          </Btn>
          {vaccineEnabled && (
            <Btn size="sm" full onClick={() => {
              const newId = crypto.randomUUID();
              setForm(f => ({ ...f, vaccines: [...f.vaccines, { id: newId, name: '', dose: '', method: '', reaction: '', itemId: '', quantity: null, movementId: '' }] }));
              setExpandedId('v-' + newId);
            }}>
              + واکسن
            </Btn>
          )}
          {medicineEnabled && (
            <Btn size="sm" full onClick={() => {
              const newId = crypto.randomUUID();
              setForm(f => ({ ...f, medications: [...f.medications, { id: newId, name: '', dose: '', method: '', withdrawalDays: null, itemId: '', quantity: null, movementId: '' }] }));
              setExpandedId('m-' + newId);
            }}>
              + دارو
            </Btn>
          )}
        </div>


        {form.deaths.map((d, i) => (
          <div key={d.id} style={{ padding: 'var(--pad-normal)', background: 'var(--card-solid)', border: `1px solid ${expandedId === 'd-' + d.id ? 'var(--accent)' : 'var(--border)'}`, borderRadius: 'var(--r-md)', display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 8 }}>
            <div onClick={() => setExpandedId(expandedId === 'd-' + d.id ? null : 'd-' + d.id)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', cursor: expandedId === 'd-' + d.id ? 'default' : 'pointer' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1, minWidth: 0 }}>
              <span style={{ fontSize: 'var(--fs-base)', fontWeight: 800, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.count === 0 && !d.cause ? "رکورد جدید" : "رکورد " + toFa(i + 1)}</span>
              <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)' }}>{(d.count ?? 0) > 0 ? `${toFa(d.count ?? 0)} پرنده` : 'بدون داده'}{d.cause ? ' • ' + (causeOptions.find(o => o.value === d.cause)?.label || '') : ''}</span>
            </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                
                <button type="button" onClick={(e) => { e.stopPropagation(); setForm(f => ({ ...f, deaths: f.deaths.filter(x => x.id !== d.id) })) }}
                  style={{ background: 'var(--danger-soft)', border: '1px solid var(--danger)', color: 'var(--danger)', cursor: 'pointer', borderRadius: 'var(--r-sm)', width: 28, height: 28, padding: 0, fontFamily: 'inherit', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
              </div>
            </div>
            {expandedId === 'd-' + d.id && (<>
            <Grid2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0, minWidth: 0 }}>
                <Field label="تعداد" error={showError('deathsCount') || showError('deaths')} onTouch={() => markTouched('deathsCount')}>
                  <NumField placeholder="اگر تلفات نبود، 0 وارد کنید" value={String(d.count ?? '')}
                    onChange={e => setForm(f => ({ ...f, deaths: f.deaths.map(x => x.id === d.id ? { ...x, count: parseInt(toEn(e.target.value)) || 0 } : x) }))}
                    min={0} max={flockAliveCount || undefined} unit="پرنده" />
                </Field>
                <FieldHint fieldPath="dlg.deathsCount" value={d.count ?? 0} context={{ currentCount: flockAliveCount }} />
              </div>
              <Field label="علت">
                <SmartSelect
                  value={d.cause || ''}
                  onChange={val => setForm(f => ({ ...f, deaths: f.deaths.map(x => x.id === d.id ? { ...x, cause: val } : x) }))}
                  options={causeOptions}
                  placeholder="— انتخاب کنید —"
                  modalTitle="علت تلفات"
                />
              </Field>
            </Grid2>
            {isSexed && (
              <Field label="جنسیت تلفات">
                <Select value={d.sex || 'unknown'} onChange={e => setForm(f => ({ ...f, deaths: f.deaths.map(x => x.id === d.id ? { ...x, sex: e.target.value as 'male' | 'female' | 'unknown' } : x) }))}>
                  <option value="male">نر</option>
                  <option value="female">ماده</option>
                  <option value="unknown">نامشخص</option>
                </Select>
              </Field>
            )}
            <Field label="توضیحات">
              <Textarea rows={2} placeholder="جزئیات..." value={d.notes || ''}
                onChange={e => setForm(f => ({ ...f, deaths: f.deaths.map(x => x.id === d.id ? { ...x, notes: e.target.value } : x) }))} />
            </Field>
            </>)}
          </div>
        ))}

      {vaccineEnabled && (<>
        {form.vaccines.map((v, i) => (
          <div key={v.id} style={{ padding: 'var(--pad-normal)', background: 'var(--card-solid)', border: `1px solid ${expandedId === 'v-' + v.id ? 'var(--accent)' : 'var(--border)'}`, borderRadius: 'var(--r-md)', display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 8 }}>
            <div onClick={() => setExpandedId(expandedId === 'v-' + v.id ? null : 'v-' + v.id)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', cursor: expandedId === 'v-' + v.id ? 'default' : 'pointer' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1, minWidth: 0 }}>
              <span style={{ fontSize: 'var(--fs-base)', fontWeight: 800, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v.name || 'واکسن ' + toFa(i + 1)}</span>
              <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)' }}>{v.dose ? 'دوز: ' + v.dose : 'بدون دوز'}{v.itemId ? ' • از انبار' : ''}</span>
            </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><button type="button" onClick={(e) => { e.stopPropagation(); setForm(f => ({ ...f, vaccines: f.vaccines.filter(x => x.id !== v.id) })) }} style={{ background: 'var(--danger-soft)', border: '1px solid var(--danger)', color: 'var(--danger)', cursor: 'pointer', borderRadius: 'var(--r-sm)', width: 28, height: 28, padding: 0, fontFamily: 'inherit', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button></div>
            </div>
            {expandedId === 'v-' + v.id && (<>
            <Grid2>
              <Input placeholder="نام" value={v.name} onChange={e => setForm(f => ({ ...f, vaccines: f.vaccines.map(x => x.id === v.id ? { ...x, name: e.target.value } : x) }))} />
              <Input placeholder="دوز" value={v.dose} onChange={e => setForm(f => ({ ...f, vaccines: f.vaccines.map(x => x.id === v.id ? { ...x, dose: e.target.value } : x) }))} />
            </Grid2>
            {vaccineItems.length > 0 && (
              <Grid2>
                <Field label={<>از انبار <Tag tone="blue">{toFa(vaccineItems.length)} نوع</Tag></>} autoFrom="انبار (مصرف کسر می‌شه)">
                  <SmartSelect
                    value={v.itemId || ''}
                    onChange={id => setForm(f => ({ ...f, vaccines: f.vaccines.map(x => x.id === v.id ? { ...x, itemId: id, quantity: id ? (x.quantity ?? 0) : null } : x) }))}
                    options={vaccineItems.map(w => ({ value: w.id, label: w.name, subtitle: `موجودی ${formatQty(w.currentStock, w.unit)}` }))}
                    placeholder="— متصل نکن —"
                    modalTitle="انتخاب از انبار"
                    autoThreshold={6}
                  />
                </Field>
                {v.itemId && (
                  <Field label="مقدار مصرفی" error={showError(`vaccines.${i}.quantity`)} onTouch={() => markTouched(`vaccines.${i}.quantity`)}>
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
            </>)}
          </div>
        ))}
      </>)}

      {medicineEnabled && (<>
        {form.medications.map((m, i) => {
          const selectedItem = medicineItems.find(w => w.id === m.itemId);
          const isHerbal = selectedItem?.category === 'herbal';
          
          return (
          <div key={m.id} style={{ padding: 'var(--pad-normal)', background: 'var(--card-solid)', border: `1px solid ${expandedId === 'm-' + m.id ? 'var(--accent)' : 'var(--border)'}`, borderRadius: 'var(--r-md)', display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 8 }}>
            <div onClick={() => setExpandedId(expandedId === 'm-' + m.id ? null : 'm-' + m.id)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', cursor: expandedId === 'm-' + m.id ? 'default' : 'pointer' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1, minWidth: 0 }}>
              <span style={{ fontSize: 'var(--fs-base)', fontWeight: 800, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.name || 'دارو ' + toFa(i + 1)}</span>
              <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)' }}>{m.dose ? 'دوز: ' + m.dose : 'بدون دوز'}{isHerbal ? ' • گیاهی' : m.withdrawalDays ? ' • پرهیز: ' + m.withdrawalDays + ' روز' : ''}</span>
            </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><button type="button" onClick={(e) => { e.stopPropagation(); setForm(f => ({ ...f, medications: f.medications.filter(x => x.id !== m.id) })) }} style={{ background: 'var(--danger-soft)', border: '1px solid var(--danger)', color: 'var(--danger)', cursor: 'pointer', borderRadius: 'var(--r-sm)', width: 28, height: 28, padding: 0, fontFamily: 'inherit', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button></div>
            </div>
            {expandedId === 'm-' + m.id && (<>
            
            {medicineItems.length > 0 && (
              <Grid2>
                <Field label={<>از انبار <Tag tone="red">{toFa(chemicalItems.length)} 💊</Tag> <Tag tone="green">{toFa(herbalItems.length)} 🌿</Tag></>} autoFrom="انبار (مصرف کسر می‌شه)">
                  <SmartSelect
                    value={m.itemId || ''}
                    onChange={id => setForm(f => ({ 
                      ...f, 
                      medications: f.medications.map(x => {
                        if (x.id !== m.id) return x;
                        const newItem = medicineItems.find(w => w.id === id);
                        return { 
                          ...x, 
                          itemId: id, 
                          quantity: id ? (x.quantity ?? 0) : null,
                          name: newItem ? newItem.name : x.name,
                          withdrawalDays: newItem ? newItem.withdrawalDays : x.withdrawalDays
                        };
                      }) 
                    }))}
                    options={medicineItems.map(w => ({ value: w.id, label: w.name, subtitle: `موجودی ${formatQty(w.currentStock, w.unit)}`, group: w.category === 'herbal' ? 'herbal' : 'chemical' }))}
                    groupLabels={{ chemical: '💊 شیمیایی', herbal: '🌿 گیاهی' }}
                    groupIcons={{ chemical: '💊', herbal: '🌿' }}
                    placeholder="— متصل نکن —"
                    modalTitle="انتخاب از انبار"
                    autoThreshold={6}
                  />
                </Field>
                {m.itemId && (
                  <Field label="مقدار مصرفی" error={showError(`medications.${i}.quantity`)} onTouch={() => markTouched(`medications.${i}.quantity`)}>
                    <NumField
                      value={m.quantity !== null && m.quantity !== undefined ? String(m.quantity) : ''}
                      onChange={e => setForm(f => ({ ...f, medications: f.medications.map(x => x.id === m.id ? { ...x, quantity: parseFloat(toEn(e.target.value).replace('٫','.')) || 0 } : x) }))}
                      unit={UNIT_LABEL[selectedItem?.unit || 'pcs'] || ''}
                      min={0}
                    />
                  </Field>
                )}
              </Grid2>
            )}
            
            <Grid2>
              <Field label="نام">
                <Input placeholder="نام دارو" value={m.name} onChange={e => setForm(f => ({ ...f, medications: f.medications.map(x => x.id === m.id ? { ...x, name: e.target.value } : x) }))} />
              </Field>
              <Field label="دوز">
                <Input placeholder="دوز" value={m.dose} onChange={e => setForm(f => ({ ...f, medications: f.medications.map(x => x.id === m.id ? { ...x, dose: e.target.value } : x) }))} />
              </Field>
            </Grid2>

            {!isHerbal && (
              <Field label="دوره پرهیز (روز)" hint="چند روز بعد از مصرف، گوشت و تخم قابل فروش نیست">
                <NumField
                  placeholder="مثلاً ۷"
                  value={m.withdrawalDays !== null && m.withdrawalDays !== undefined ? String(m.withdrawalDays) : ''}
                  onChange={e => setForm(f => ({ ...f, medications: f.medications.map(x => x.id === m.id ? { ...x, withdrawalDays: e.target.value === '' ? null : (parseInt(toEn(e.target.value)) || null) } : x) }))}
                  unit="روز" min={0}
                />
              </Field>
            )}
            </>)}
          </div>
          );
        })}
      </>)}

      {(form.deaths.length > 0 || form.vaccines.length > 0 || form.medications.length > 0) && (() => {
        const totalDeaths = form.deaths.reduce((a, x) => a + (x.count || 0), 0);
        const exceeds = flockAliveCount > 0 && totalDeaths > flockAliveCount;
        const vaccineCount = form.vaccines.length;
        const medsTotal = form.medications.length;
        const medsHerbal = form.medications.filter(m => medicineItems.find(w => w.id === m.itemId)?.category === 'herbal').length;
        const medsChem = medsTotal - medsHerbal;
        const tone = exceeds ? 'danger' : (totalDeaths > 0 ? 'warn' : 'accent');

        return (
          <SummaryCard tone={tone}>
            {totalDeaths > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>تلفات:</span>
                <b style={{ color: exceeds ? 'var(--danger)' : 'var(--text)' }}>
                  {toFa(totalDeaths)} پرنده{flockAliveCount ? ` از ${toFa(flockAliveCount)}` : ''}{exceeds && ' ⚠️'}
                </b>
              </div>
            )}
            {vaccineCount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>واکسن:</span>
                <b style={{ color: 'var(--text)' }}>{toFa(vaccineCount)} مورد</b>
              </div>
            )}
            {medsTotal > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>دارو:</span>
                <b style={{ color: 'var(--text)' }}>
                  {toFa(medsTotal)} مورد{medsHerbal > 0 ? ` (${toFa(medsChem)} 💊 + ${toFa(medsHerbal)} 🌿)` : ''}
                </b>
              </div>
            )}
          </SummaryCard>
        );
      })()}

    </>
  );
}
