/**
 * HealthSection — تلفات + واکسن + دارو
 */
import { useMemo, useState } from 'react';
import { Btn, Field, Grid2, Input, NumField, Select, Textarea, AlertBox, Tag, SummaryCard } from '../../../shr/components/ui';
import { HelpIcon } from '../../../shr/components/ui/HelpIcon';
import SmartSelect from '../../../shr/components/SmartSelect';
import { UNIT_LABEL, type ItemUnit } from '../../whs/store';
import { QuantityUnitInput, type UnitOption } from '../../../shr/components/ui';
import { formatQty } from '../../../shr/utils/fa';
import { toFa, toEn } from '../../../shr/utils/fa';
import { DEATH_CAUSES, causeLabel } from '../store';
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
  const buildUnitOptions = (itemId: string | undefined, items: any[]): UnitOption[] => {
    const it = items.find(x => x.id === itemId);
    if (!it) return [];
    const opts: UnitOption[] = [{ value: it.unit, label: (UNIT_LABEL as any)[it.unit] || it.unit, factor: 1 }];
    (it.subUnits || []).forEach((su: any) => opts.push({ value: su.name, label: su.name, factor: su.factor }));
    return opts;
  };



 return (
  <>

    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
     <Btn full onClick={() => {
      const newId = crypto.randomUUID();
      setForm(f => ({ ...f, deaths: [...f.deaths, { id: newId, count: 0, cause: '', notes: '' }] }));
      setExpandedId('d-' + newId);
     }}>
      + تلفات
     </Btn>
     {vaccineEnabled && (
      <Btn full onClick={() => {
       const newId = crypto.randomUUID();
       setForm(f => ({ ...f, vaccines: [...f.vaccines, { id: newId, name: '', dose: '', method: '', reaction: '', itemId: '', quantity: null, movementId: '' }] }));
       setExpandedId('v-' + newId);
      }}>
       + واکسن
      </Btn>
     )}
     {medicineEnabled && (
      <Btn full onClick={() => {
       const newId = crypto.randomUUID();
       setForm(f => ({ ...f, medications: [...f.medications, { id: newId, name: '', dose: '', method: '', withdrawalDays: null, itemId: '', quantity: null, movementId: '' }] }));
       setExpandedId('m-' + newId);
      }}>
       + دارو
      </Btn>
     )}
    </div>


    {form.deaths.map((d, i) => (
     <div key={d.id} id={'health-death-' + d.id} style={{ padding: 'var(--pad-normal)', background: 'var(--card-solid)', border: `1px solid ${expandedId === 'd-' + d.id ? 'var(--accent)' : 'var(--border)'}`, borderRadius: 'var(--r-md)', display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 8 }}>
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
         <NumField placeholder="۰" value={d.count ? String(d.count) : ''}
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
     <div key={v.id} id={'health-vaccine-' + v.id} style={{ padding: 'var(--pad-normal)', background: 'var(--card-solid)', border: `1px solid ${expandedId === 'v-' + v.id ? 'var(--accent)' : 'var(--border)'}`, borderRadius: 'var(--r-md)', display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 8 }}>
      <div onClick={() => setExpandedId(expandedId === 'v-' + v.id ? null : 'v-' + v.id)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', cursor: expandedId === 'v-' + v.id ? 'default' : 'pointer' }}>
       <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1, minWidth: 0 }}>
       <span style={{ fontSize: 'var(--fs-base)', fontWeight: 800, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v.name || 'واکسن ' + toFa(i + 1)}</span>
       <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)' }}>{v.dose ? 'دوز: ' + toFa(v.dose) : 'بدون دوز'}{v.itemId ? ' • از انبار' : ''}</span>
      </div>
       <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><button type="button" onClick={(e) => { e.stopPropagation(); setForm(f => ({ ...f, vaccines: f.vaccines.filter(x => x.id !== v.id) })) }} style={{ background: 'var(--danger-soft)', border: '1px solid var(--danger)', color: 'var(--danger)', cursor: 'pointer', borderRadius: 'var(--r-sm)', width: 28, height: 28, padding: 0, fontFamily: 'inherit', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button></div>
      </div>
      {expandedId === 'v-' + v.id && (<>
      {vaccineItems.length > 0 && (
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
      )}
      <Grid2>
        <Field label="نام واکسن" required>
          <Input placeholder="مثلاً نیوکاسل" value={v.name} onChange={e => setForm(f => ({ ...f, vaccines: f.vaccines.map(x => x.id === v.id ? { ...x, name: e.target.value } : x) }))} />
        </Field>
        <Field label={<>دوز <HelpIcon text={"**دوز چیست؟**\nدوز، نسخه یا دستور مصرف دامپزشک است (مثلاً ۵ سی‌سی در ۱ لیتر آب).\n\n**تفاوت با مقدار مصرفی:**\n«مقدار مصرفی» کل مقداری است که از انبار کسر می‌شود (مثلاً ۵۰ سی‌سی)."} /></>}>
          <Input placeholder="مثلاً ۰.۲ سی‌سی" value={v.dose} onChange={e => setForm(f => ({ ...f, vaccines: f.vaccines.map(x => x.id === v.id ? { ...x, dose: e.target.value } : x) }))} />
        </Field>
      </Grid2>
      {(() => {
        const opts = buildUnitOptions(v.itemId, vaccineItems);
        const hasSub = opts.length > 1;
        const qtyField = v.itemId ? (
          <QuantityUnitInput
            error={showError(`vaccines.${i}.quantity`)}
            onTouch={() => markTouched(`vaccines.${i}.quantity`)}
            value={v.quantity || ''}
            onChange={val => setForm(f => ({ ...f, vaccines: f.vaccines.map(x => x.id === v.id ? { ...x, quantity: parseFloat(toEn(val).replace('٫','.')) || 0 } : x) }))}
            unit={v.unit || (vaccineItems.find(w => w.id === v.itemId)?.unit) || 'pcs'}
            onUnitChange={u => {
              const fct = opts.find((o: UnitOption) => o.value === u)?.factor || 1;
              setForm(f => ({ ...f, vaccines: f.vaccines.map(x => x.id === v.id ? { ...x, unit: u, factor: fct } : x) }));
            }}
            options={opts}
          />
        ) : null;
        const methodField = (
          <Field label="روش مصرف">
            <Select value={v.method || ''} onChange={e => setForm(f => ({ ...f, vaccines: f.vaccines.map(x => x.id === v.id ? { ...x, method: e.target.value } : x) }))}>
              <option value="">— نامشخص —</option>
              <option value="drinking_water">آشامیدنی (در آب)</option>
              <option value="feed">خوراکی (مخلوط با دان)</option>
              <option value="eye_drop">قطره چشمی / بینی</option>
              <option value="injection">تزریقی (عضلانی/زیرجلدی)</option>
              <option value="spray">اسپری</option>
              <option value="wing_web">بال زدن (Wing Web)</option>
              <option value="topical">موضعی</option>
            </Select>
          </Field>
        );
        const reactionField = (
          <Field label="واکنش">
            <Input placeholder="مثلاً بدون واکنش" value={v.reaction || ''} onChange={e => setForm(f => ({ ...f, vaccines: f.vaccines.map(x => x.id === v.id ? { ...x, reaction: e.target.value } : x) }))} />
          </Field>
        );
        if (!qtyField) return <Grid2>{methodField}{reactionField}</Grid2>;
        if (hasSub) return <>{qtyField}<Grid2>{methodField}{reactionField}</Grid2></>;
        return <><Grid2>{qtyField}{methodField}</Grid2>{reactionField}</>;
      })()}
    </>)}
     </div>
    ))}
   </>)}

   {medicineEnabled && (<>
    {form.medications.map((m, i) => {
     const selectedItem = medicineItems.find(w => w.id === m.itemId);
     const isHerbal = selectedItem?.category === 'herbal';
     
     return (
     <div key={m.id} id={'health-med-' + m.id} style={{ padding: 'var(--pad-normal)', background: 'var(--card-solid)', border: `1px solid ${expandedId === 'm-' + m.id ? 'var(--accent)' : 'var(--border)'}`, borderRadius: 'var(--r-md)', display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 8 }}>
      <div onClick={() => setExpandedId(expandedId === 'm-' + m.id ? null : 'm-' + m.id)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', cursor: expandedId === 'm-' + m.id ? 'default' : 'pointer' }}>
       <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1, minWidth: 0 }}>
       <span style={{ fontSize: 'var(--fs-base)', fontWeight: 800, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.name || 'دارو ' + toFa(i + 1)}</span>
       <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)' }}>{m.dose ? 'دوز: ' + toFa(m.dose) : 'بدون دوز'}{isHerbal ? ' • گیاهی' : m.withdrawalDays ? ' • پرهیز: ' + m.withdrawalDays + ' روز' : ''}</span>
      </div>
       <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><button type="button" onClick={(e) => { e.stopPropagation(); setForm(f => ({ ...f, medications: f.medications.filter(x => x.id !== m.id) })) }} style={{ background: 'var(--danger-soft)', border: '1px solid var(--danger)', color: 'var(--danger)', cursor: 'pointer', borderRadius: 'var(--r-sm)', width: 28, height: 28, padding: 0, fontFamily: 'inherit', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button></div>
      </div>
      {expandedId === 'm-' + m.id && (<>
      {medicineItems.length > 0 && (
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
      )}
      <Grid2>
        <Field label="نام">
          <Input placeholder="نام دارو" value={m.name} onChange={e => setForm(f => ({ ...f, medications: f.medications.map(x => x.id === m.id ? { ...x, name: e.target.value } : x) }))} />
        </Field>
        <Field label={<>دوز <HelpIcon text={"**دوز چیست؟**\nدوز، نسخه یا دستور مصرف دامپزشک است (مثلاً ۵ سی‌سی در ۱ لیتر آب).\n\n**تفاوت با مقدار مصرفی:**\n«مقدار مصرفی» کل مقداری است که از انبار کسر می‌شود (مثلاً ۵۰ سی‌سی)."} /></>}>
          <Input placeholder="دوز" value={m.dose} onChange={e => setForm(f => ({ ...f, medications: f.medications.map(x => x.id === m.id ? { ...x, dose: e.target.value } : x) }))} />
        </Field>
      </Grid2>
      {(() => {
        const opts = buildUnitOptions(m.itemId, medicineItems);
        const hasSub = opts.length > 1;
        const qtyField = m.itemId ? (
          <QuantityUnitInput
            error={showError(`medications.${i}.quantity`)}
            onTouch={() => markTouched(`medications.${i}.quantity`)}
            value={m.quantity || ''}
            onChange={val => setForm(f => ({ ...f, medications: f.medications.map(x => x.id === m.id ? { ...x, quantity: parseFloat(toEn(val).replace('٫','.')) || 0 } : x) }))}
            unit={m.unit || selectedItem?.unit || 'pcs'}
            onUnitChange={u => {
              const fct = opts.find((o: UnitOption) => o.value === u)?.factor || 1;
              setForm(f => ({ ...f, medications: f.medications.map(x => x.id === m.id ? { ...x, unit: u, factor: fct } : x) }));
            }}
            options={opts}
          />
        ) : null;
        const methodField = (
          <Field label="روش مصرف">
            <Select value={m.method || ''} onChange={e => setForm(f => ({ ...f, medications: f.medications.map(x => x.id === m.id ? { ...x, method: e.target.value } : x) }))}>
              <option value="">— نامشخص —</option>
              <option value="drinking_water">آشامیدنی (در آب)</option>
              <option value="feed">خوراکی (مخلوط با دان)</option>
              <option value="injection">تزریقی (عضلانی/زیرجلدی)</option>
              <option value="oral">دهانی (فردی/با سرنگ)</option>
              <option value="spray">اسپری</option>
              <option value="topical">موضعی</option>
            </Select>
          </Field>
        );
        const withdrawalField = !isHerbal ? (
          <Field label="دوره پرهیز (روز)" hint="چند روز بعد از مصرف، گوشت و تخم قابل فروش نیست">
            <NumField
              placeholder="مثلاً ۷"
              value={m.withdrawalDays !== null && m.withdrawalDays !== undefined ? String(m.withdrawalDays) : ''}
              onChange={e => setForm(f => ({ ...f, medications: f.medications.map(x => x.id === m.id ? { ...x, withdrawalDays: e.target.value === '' ? null : (parseInt(toEn(e.target.value)) || null) } : x) }))}
              unit="روز" min={0}
            />
          </Field>
        ) : null;
        if (!qtyField) return <Grid2>{methodField}{withdrawalField}</Grid2>;
        if (hasSub) return <>{qtyField}<Grid2>{methodField}{withdrawalField}</Grid2></>;
        return <><Grid2>{qtyField}{methodField}</Grid2>{withdrawalField}</>;
      })()}
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

    const medParts = [];
    if (medsChem > 0) medParts.push(`${toFa(medsChem)} 💊`);
    if (medsHerbal > 0) medParts.push(`${toFa(medsHerbal)} 🌿`);
    const medSummary = medParts.join(' + ');
    
    const deathCauses = form.deaths.map(d => d.cause ? causeLabel(d.cause) : '').filter(Boolean).join('، ');

    return (
      <SummaryCard tone={tone}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, textAlign: 'right', width: '100%' }} dir="rtl">
          {totalDeaths > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 700, fontSize: 'var(--fs-sm)' }}>تلفات:</span>
                <span style={{ color: exceeds ? 'var(--danger)' : 'var(--text)', fontWeight: 600, fontSize: 'var(--fs-sm)' }}>
                  {toFa(totalDeaths)} پرنده {flockAliveCount ? `از ${toFa(flockAliveCount)}` : ''} {exceeds && '⚠️'}
                </span>
              </div>
              {deathCauses && (
                <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', paddingRight: 4 }}>
                  علت: {deathCauses}
                </span>
              )}
            </div>
          )}
          
          {vaccineCount > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, borderTop: '1px dashed var(--border)', paddingTop: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 700, fontSize: 'var(--fs-sm)' }}>واکسن‌ها:</span>
                <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)' }}>{toFa(vaccineCount)} مورد</span>
              </div>
              <ul style={{ margin: 0, paddingRight: 16, fontSize: 'var(--fs-sm)', display: 'flex', flexDirection: 'column', gap: 4 }}>
                {form.vaccines.map((v, idx) => (
                  <li key={v.id || idx} style={{ wordBreak: 'break-word', listStyleType: 'disc' }}>
                    <span style={{ fontWeight: 600 }}>{v.name || 'بدون نام'}</span>
                    {v.dose && <span style={{ color: 'var(--muted)' }}> (دوز: {toFa(v.dose)})</span>}
                    {v.quantity ? <span style={{ color: 'var(--accent)' }}> [مقدار: {toFa(v.quantity)} {v.unit || ''}]</span> : null}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {medsTotal > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, borderTop: '1px dashed var(--border)', paddingTop: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 700, fontSize: 'var(--fs-sm)' }}>داروها:</span>
                <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)' }}>
                  {toFa(medsTotal)} مورد {medSummary ? `[${medSummary}]` : ''}
                </span>
              </div>
              <ul style={{ margin: 0, paddingRight: 16, fontSize: 'var(--fs-sm)', display: 'flex', flexDirection: 'column', gap: 4 }}>
                {form.medications.map((m, idx) => (
                  <li key={m.id || idx} style={{ wordBreak: 'break-word', listStyleType: 'disc' }}>
                    <span style={{ fontWeight: 600 }}>{m.name || 'بدون نام'}</span>
                    {m.dose && <span style={{ color: 'var(--muted)' }}> (دوز: {toFa(m.dose)})</span>}
                    {m.quantity ? <span style={{ color: 'var(--accent)' }}> [مقدار: {toFa(m.quantity)} {m.unit || ''}]</span> : null}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </SummaryCard>
    );
   })()}

  </>
 );
}
