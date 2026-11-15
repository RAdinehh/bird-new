/**
 * HealthSection — تلفات + واکسن + دارو
 */
import { useMemo, useState } from 'react';
import { Btn, Field, Grid2, Input, NumField, Select, Textarea, AlertBox, Tag, SummaryCard, SummarySection, SummaryRow, Chip } from '../../../shr/components/ui';
import ExpandableCard from '../../../shr/components/ExpandableCard';
import { HelpIcon } from '../../../shr/components/ui/HelpIcon';
import SmartSelect from '../../../shr/components/SmartSelect';
import { UNIT_LABEL, type ItemUnit } from '../../whs/store';
import { QuantityUnitInput, type UnitOption } from '../../../shr/components/ui';
import { formatQty } from '../../../shr/utils/fa';
import { toFa, toEn } from '../../../shr/utils/fa';
import { DEATH_CAUSES, causeLabel, getTotalFeedKg } from '../store';
import { useWhs } from '../../whs/store';
import { useFlk } from '../../flk/store';
import type { F } from '../types';
import { FieldHint } from '../../../shr/intelligence/FieldHint';
import { calculateHealthDose } from '../../../shr/calc/formulas/health';
import { VET_METHOD_OPTIONS } from '../../../shr/constants/vetMethods';
import type { HealthRoute } from '../../../shr/calc/types';

function getDoseUnit(u: string | undefined): string {
  if (!u) return 'ml';
  const lu = u.toLowerCase();
  if (lu === 'vial') return 'دوز';
  if (lu === 'ml' || lu === 'l') return 'ml';
  if (lu === 'g' || lu === 'kg') return 'g';
  return u;
}

function getDoseUnitForMethod(method: string | undefined, baseUnit: string | undefined): string | undefined {
  const u = getDoseUnit(baseUnit);
  if (!method) return u;  // ← fallback: اگر روش مصرف انتخاب نشده، واحد پایه را نشان بده
  if (method === 'drinking_water') return `${u}/L`;
  if (method === 'feed') return `${u}/kg`;
  if (method === 'injection' || method === 'oral') return `${u}/پرنده`;
  return u;
}

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

function getAllowedMethods(item: any): typeof VET_METHOD_OPTIONS {
  if (!item) return VET_METHOD_OPTIONS;
  const raw: string[] = item.usageTypes || (item.usageType ? [item.usageType] : []);
  if (raw.length === 0) return VET_METHOD_OPTIONS;
  const normalize = (k: string) => k === 'water' ? 'drinking_water' : k === 'injectable' ? 'injection' : k;
  const normalized = raw.map(normalize);
  return VET_METHOD_OPTIONS.filter(o => normalized.includes(o.value));
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
      setTimeout(() => { const el = document.querySelector(`[data-focus-id="health-death-${newId}"]`); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 150);
     }}>
      + تلفات
     </Btn>
     {vaccineEnabled && (
      <Btn full onClick={() => {
       const newId = crypto.randomUUID();
       setForm(f => ({ ...f, vaccines: [...f.vaccines, { id: newId, name: '', dose: '', method: '', reaction: '', itemId: '', quantity: null, movementId: '' }] }));
       setExpandedId('v-' + newId); setTimeout(() => { const el = document.querySelector(`[data-focus-id="health-vaccine-${newId}"]`); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 150);
      }}>
       + واکسن
      </Btn>
     )}
     {medicineEnabled && (
      <Btn full onClick={() => {
       const newId = crypto.randomUUID();
       setForm(f => ({ ...f, medications: [...f.medications, { id: newId, name: '', dose: '', method: '', withdrawalDays: null, itemId: '', quantity: null, movementId: '' }] }));
       setExpandedId('m-' + newId); setTimeout(() => { const el = document.querySelector(`[data-focus-id="health-med-${newId}"]`); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 150);
      }}>
       + دارو
      </Btn>
     )}
    </div>


    {form.deaths.map((d, i) => (
     <ExpandableCard
     key={d.id}
     data-focus-id={'health-death-' + d.id}
     variant="inner"
     accent="accent"
     title={d.count === 0 && !d.cause ? 'رکورد جدید' : 'رکورد ' + toFa(i + 1)}
     subtitle={`${(d.count ?? 0) > 0 ? `${toFa(d.count ?? 0)} پرنده` : 'بدون داده'}${d.cause ? ' • ' + (causeOptions.find(o => o.value === d.cause)?.label || '') : ''}`}
     isOpen={expandedId === 'd-' + d.id}
     onToggle={() => setExpandedId(expandedId === 'd-' + d.id ? null : 'd-' + d.id)}
     onDelete={() => setForm(f => ({ ...f, deaths: f.deaths.filter(x => x.id !== d.id) }))}
    >
      
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
     </ExpandableCard>
    ))}

   {vaccineEnabled && (<>
    {form.vaccines.map((v, i) => (
     <ExpandableCard
     key={v.id}
     data-focus-id={'health-vaccine-' + v.id}
     variant="inner"
     accent="accent"
     title={v.name || 'واکسن ' + toFa(i + 1)}
     subtitle={`${v.dose ? 'دوز: ' + toFa(v.dose) : 'بدون دوز'}${v.itemId ? ' • از انبار' : ''}`}
     isOpen={expandedId === 'v-' + v.id}
     onToggle={() => setExpandedId(expandedId === 'v-' + v.id ? null : 'v-' + v.id)}
     onDelete={() => setForm(f => ({ ...f, vaccines: f.vaccines.filter(x => x.id !== v.id) }))}
    >
      
      {expandedId === 'v-' + v.id && (<>
      {vaccineItems.length > 0 && (
        <Field label={<>از انبار <Tag tone="blue">{toFa(vaccineItems.length)} نوع</Tag></>} autoFrom="انبار (مصرف کسر می‌شه)">
          <SmartSelect
            value={v.itemId || ''}
            onChange={id => setForm(f => ({
          ...f,
          vaccines: f.vaccines.map(x => {
            if (x.id !== v.id) return x;
            const newItem = vaccineItems.find(w => w.id === id);
            const autoDose = newItem?.usageTypes?.includes('water') ? newItem.dosePerLiter : newItem?.usageTypes?.includes('feed') ? newItem.dosePerKgFeed : newItem?.dosePerBird;
            const doseUnit = newItem?.usageTypes?.includes('water') ? `${getDoseUnit(newItem?.unit)}/L` : newItem?.usageTypes?.includes('feed') ? `${getDoseUnit(newItem?.unit)}/kg` : `${getDoseUnit(newItem?.unit)}/پرنده`;
            return { ...x, itemId: id, quantity: id ? (x.quantity ?? 0) : null, unit: newItem?.unit || x.unit, name: newItem ? newItem.name : x.name, dose: autoDose ? String(autoDose) : x.dose };
          })
        }))}
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
          <Input
            placeholder="مثلاً ۰.۵"
            value={v.dose}
            onChange={e => setForm(f => ({ ...f, vaccines: f.vaccines.map(x => x.id === v.id ? { ...x, dose: e.target.value } : x) }))}
            unit={getDoseUnitForMethod(v.method, vaccineItems.find(w => w.id === v.itemId)?.unit)}
          />
        </Field>
      </Grid2>
      {(() => {
        const opts = buildUnitOptions(v.itemId, vaccineItems);
        const hasSub = opts.length > 1;
        const vaccineItemCalc = vaccineItems.find(w => w.id === v.itemId);
        const vCalc = vaccineItemCalc ? calculateHealthDose({
          route: ((v.method === 'drinking_water' ? 'water' : v.method === 'injection' ? 'injectable' : v.method) || '') as HealthRoute,
          waterAmountL: parseFloat(toEn(form.waterAmount)) || 0,
          aliveCount: flockAliveCount || 0,
          dosePerBirdMl: vaccineItemCalc.dosePerBird ?? null,
          dosePerLiter: vaccineItemCalc.dosePerLiter ?? null,
          feedAmountKg: getTotalFeedKg(form),
          dosePerKgFeed: vaccineItemCalc.dosePerKgFeed ?? null,
        }) : null;
        const qtyField = v.itemId ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          
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
          {vCalc?.hasData && (
            <FieldHint
              fieldPath="dlg.dose"
              value={v.quantity || ''}
              context={{
                expected: vCalc.requiredMl ?? undefined,
                expectedLabel: 'نیاز محاسبه‌شده',
                expectedSource: 'context',
                flockSize: flockAliveCount,
              }}
            />
          )}
          </div>

        ) : null;
        const doseField = (
          <Field label={<>دوز <HelpIcon text={"**دوز چیست؟**\\nدوز، نسخه یا دستور مصرف دامپزشک است (مثلاً ۵ سی‌سی در ۱ لیتر آب).\\n\\n**تفاوت با مقدار مصرفی:**\\n«مقدار مصرفی» کل مقداری است که از انبار کسر می‌شود (مثلاً ۵۰ سی‌سی)."} /></>}>
            <Input
              placeholder="مثلاً ۰.۵"
              value={v.dose}
              onChange={e => setForm(f => ({ ...f, vaccines: f.vaccines.map(x => x.id === v.id ? { ...x, dose: e.target.value } : x) }))}
              unit={getDoseUnitForMethod(v.method, vaccineItems.find(w => w.id === v.itemId)?.unit)}
            />
          </Field>
        );
        const reactionField = (
          <Field label="واکنش">
            <Input placeholder="مثلاً بدون واکنش" value={v.reaction || ''} onChange={e => setForm(f => ({ ...f, vaccines: f.vaccines.map(x => x.id === v.id ? { ...x, reaction: e.target.value } : x) }))} />
          </Field>
        );
        const vCalcMsg = vCalc ? (
          <div style={{ fontSize: 'var(--fs-xs)', color: vCalc.hasData ? 'var(--accent)' : 'var(--muted)', fontWeight: 600, marginTop: 8, textAlign: 'center' }}>
            {vCalc.hasData ? `💡 نیاز محاسبه‌شده: ${toFa(vCalc.requiredMl ?? 0)} میلی‌لیتر (${vCalc.reason})` : !v.method ? 'ℹ️ لطفاً برای محاسبه خودکار، روش مصرف را انتخاب کنید.' : `ℹ️ ${vCalc.reason}`}
          </div>
        ) : null;

        if (!qtyField) return <><Grid2>{doseField}{reactionField}</Grid2>{vCalcMsg}</>;
        if (hasSub) return <>{qtyField}<Grid2>{doseField}{reactionField}</Grid2>{vCalcMsg}</>;
        return <><Grid2>{qtyField}{doseField}</Grid2>{reactionField}{vCalcMsg}</>;
      })()}
    </>)}
     </ExpandableCard>
    ))}
   </>)}

   {medicineEnabled && (<>
    {form.medications.map((m, i) => {
     const selectedItem = medicineItems.find(w => w.id === m.itemId);
     const isHerbal = selectedItem?.category === 'herbal';
     
     return (
     <ExpandableCard
     key={m.id}
     data-focus-id={'health-med-' + m.id}
     variant="inner"
     accent="accent"
     title={m.name || 'دارو ' + toFa(i + 1)}
     subtitle={`${m.dose ? 'دوز: ' + toFa(m.dose) : 'بدون دوز'}${isHerbal ? ' • گیاهی' : m.withdrawalDays ? ' • پرهیز: ' + m.withdrawalDays + ' روز' : ''}`}
     isOpen={expandedId === 'm-' + m.id}
     onToggle={() => setExpandedId(expandedId === 'm-' + m.id ? null : 'm-' + m.id)}
     onDelete={() => setForm(f => ({ ...f, medications: f.medications.filter(x => x.id !== m.id) }))}
    >
      
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
                const autoDose = newItem?.usageTypes?.includes('water') ? newItem.dosePerLiter : newItem?.usageTypes?.includes('feed') ? newItem.dosePerKgFeed : newItem?.dosePerBird;
                const doseUnit = newItem?.usageTypes?.includes('water') ? `${getDoseUnit(newItem?.unit)}/L` : newItem?.usageTypes?.includes('feed') ? `${getDoseUnit(newItem?.unit)}/kg` : `${getDoseUnit(newItem?.unit)}/پرنده`;
                return {
                  ...x,
                  itemId: id,
                  quantity: id ? (x.quantity ?? 0) : null,
                  unit: newItem?.unit || x.unit,
                  name: newItem ? newItem.name : x.name,
                  dose: autoDose ? String(autoDose) : x.dose,
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
          <Input
            placeholder="مثلاً ۰.۵"
            value={m.dose}
            onChange={e => setForm(f => ({ ...f, medications: f.medications.map(x => x.id === m.id ? { ...x, dose: e.target.value } : x) }))}
            unit={getDoseUnitForMethod(m.method, medicineItems.find(w => w.id === m.itemId)?.unit)}
          />
        </Field>
      </Grid2>
      {(() => {
        const opts = buildUnitOptions(m.itemId, medicineItems);
        const hasSub = opts.length > 1;
        const medItemCalc = medicineItems.find(w => w.id === m.itemId);
        const mCalc = medItemCalc ? calculateHealthDose({
          route: ((m.method === 'drinking_water' ? 'water' : m.method === 'injection' ? 'injectable' : m.method) || '') as HealthRoute,
          waterAmountL: parseFloat(toEn(form.waterAmount)) || 0,
          aliveCount: flockAliveCount || 0,
          dosePerBirdMl: medItemCalc.dosePerBird ?? null,
          dosePerLiter: medItemCalc.dosePerLiter ?? null,
          feedAmountKg: getTotalFeedKg(form),
          dosePerKgFeed: medItemCalc.dosePerKgFeed ?? null,
        }) : null;
        const qtyField = m.itemId ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          
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
          {mCalc?.hasData && (
            <FieldHint
              fieldPath="dlg.dose"
              value={m.quantity || ''}
              context={{
                expected: mCalc.requiredMl ?? undefined,
                expectedLabel: 'نیاز محاسبه‌شده',
                expectedSource: 'context',
                flockSize: flockAliveCount,
              }}
            />
          )}
          </div>

        ) : null;
        const doseField = (
          <Field label={<>دوز <HelpIcon text={"**دوز چیست؟**\\nدوز، نسخه یا دستور مصرف دامپزشک است (مثلاً ۵ سی‌سی در ۱ لیتر آب).\\n\\n**تفاوت با مقدار مصرفی:**\\n«مقدار مصرفی» کل مقداری است که از انبار کسر می‌شود (مثلاً ۵۰ سی‌سی)."} /></>}>
            <Input
              placeholder="مثلاً ۰.۵"
              value={m.dose}
              onChange={e => setForm(f => ({ ...f, medications: f.medications.map(x => x.id === m.id ? { ...x, dose: e.target.value } : x) }))}
              unit={getDoseUnitForMethod(m.method, medicineItems.find(w => w.id === m.itemId)?.unit)}
            />
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
        const mCalcMsg = mCalc ? (
          <div style={{ fontSize: 'var(--fs-xs)', color: mCalc.hasData ? 'var(--accent)' : 'var(--muted)', fontWeight: 600, marginTop: 8, textAlign: 'center' }}>
            {mCalc.hasData ? `💡 نیاز محاسبه‌شده: ${toFa(mCalc.requiredMl ?? 0)} میلی‌لیتر (${mCalc.reason})` : !m.method ? 'ℹ️ لطفاً برای محاسبه خودکار، روش مصرف را انتخاب کنید.' : `ℹ️ ${mCalc.reason}`}
          </div>
        ) : null;

        if (!qtyField) return <><Grid2>{doseField}{withdrawalField}</Grid2>{mCalcMsg}</>;
        if (hasSub) return <>{qtyField}<Grid2>{doseField}{withdrawalField}</Grid2>{mCalcMsg}</>;
        return <><Grid2>{qtyField}{doseField}</Grid2>{withdrawalField}{mCalcMsg}</>;
      })()}
    </>)}
     </ExpandableCard>
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

    const medParts = [];
    if (medsChem > 0) medParts.push(`${toFa(medsChem)} 💊`);
    if (medsHerbal > 0) medParts.push(`${toFa(medsHerbal)} 🌿`);
    const medSummary = medParts.join(' + ');
    
    const deathCauses = form.deaths.map(d => d.cause ? causeLabel(d.cause) : '').filter(Boolean).join('، ');

    return (
      <SummaryCard>
        <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'right', width: '100%' }} dir="rtl">
          {totalDeaths > 0 && (
            <SummarySection
              title="تلفات:"
              meta={
                <>
                  <span style={{ color: exceeds ? 'var(--danger)' : 'var(--warn)', fontWeight: 700 }}>
                    {toFa(totalDeaths)} پرنده
                  </span>
                  {flockAliveCount ? ` از ${toFa(flockAliveCount)}` : ''} {exceeds && '⚠️'}
                </>
              }
              first={true}
            >
              <SummaryRow label="علت" value={deathCauses || 'نامشخص'} />
            </SummarySection>
          )}

          {vaccineCount > 0 && (
            <SummarySection title="واکسن‌ها:" meta={`${toFa(vaccineCount)} مورد`} first={totalDeaths === 0}>
              {form.vaccines.map((v, idx) => (
                <SummaryRow
                  key={v.id || idx}
                  label={v.name || 'بدون نام'}
                  value={v.dose ? `دوز: ${toFa(v.dose)}` : ''}
                  detail={v.quantity ? `مقدار: ${toFa(v.quantity)} ${v.unit || ''}` : ''}
                />
              ))}
            </SummarySection>
          )}

          {medsTotal > 0 && (
            <SummarySection title="داروها:" meta={`${toFa(medsTotal)} مورد`} first={totalDeaths === 0 && vaccineCount === 0}>
              {form.medications.map((m, idx) => (
                <SummaryRow
                  key={m.id || idx}
                  label={m.name || 'بدون نام'}
                  value={m.dose ? `دوز: ${toFa(m.dose)}` : ''}
                  detail={m.quantity ? `مقدار: ${toFa(m.quantity)} ${m.unit || ''}` : ''}
                />
              ))}
            </SummarySection>
          )}
        </div>
      </SummaryCard>
    );
   })()}

  </>
 );
}
