import { Field, Grid2, Grid3, Input, Select } from './ui';
import { parseFaNum } from '../utils/fa';
import {
  TEMPERAMENT_LABEL, PROPERTY_LABEL, FORM_LABEL, USE_METHOD_LABEL, TIME_LABEL, SALE_REASON_LABEL,
  type MedicineTemperament, type MedicineProperty, type MedicineForm, type MedicineUseMethod,
  type MedicineTime, type SaleReason, type HerbalDetails,
} from '../utils/itemDetails';
import { ToggleChip } from './itemFormHelpers';

export default function HerbalForm({ item, updateItem }: { item: any; updateItem: (p: any) => void }) {
  const h: HerbalDetails = item.herbalDetails || {
    name: '', temperament: '', properties: [], form: '',
    doseValue: null, doseUnit: 'گرم', useMethod: '', durationDays: null, times: [],
  };

  const setH = (patch: Partial<HerbalDetails>) => {
    updateItem({ herbalDetails: { ...h, ...patch } });
  };

  const toggleProp = (p: MedicineProperty) => {
    const cur = h.properties || [];
    setH({ properties: cur.includes(p) ? cur.filter(x => x !== p) : [...cur, p] });
  };

  const toggleTime = (t: MedicineTime) => {
    const cur = h.times || [];
    setH({ times: cur.includes(t) ? cur.filter(x => x !== t) : [...cur, t] });
  };

  return (
    <div style={{
      padding: '10px 12px', background: 'var(--accent-soft)',
      border: '1px dashed var(--accent-border)', borderRadius: 'var(--r-md)',
      display: 'flex', flexDirection: 'column', gap: 8,
    }}>
      <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--accent)', fontWeight: 700 }}>
        🌿 داروی سنتی (گیاهی)
      </div>

      <Field label="نام دوا" required>
        <Input value={h.name} onChange={e => setH({ name: e.target.value })} placeholder="مثلاً: گل گاوزبان" />
      </Field>

      <Grid2>
        <Field label="طبع">
          <Select value={h.temperament} onChange={e => setH({ temperament: e.target.value as MedicineTemperament })}>
            <option value="">— انتخاب کنید —</option>
            {Object.entries(TEMPERAMENT_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </Select>
        </Field>
        <Field label="نوع دوا">
          <Select value={h.form} onChange={e => setH({ form: e.target.value as MedicineForm })}>
            <option value="">— انتخاب کنید —</option>
            {Object.entries(FORM_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </Select>
        </Field>
      </Grid2>

      <Field label="خواص" hint="چند مورد قابل انتخاب">
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
          {(Object.keys(PROPERTY_LABEL) as MedicineProperty[]).map(p => (
            <ToggleChip key={p} label={PROPERTY_LABEL[p]} active={h.properties.includes(p)} onClick={() => toggleProp(p)} />
          ))}
        </div>
      </Field>

      <Grid2>
        <Field label="مقدار مصرف">
          <Input
            mode="number"
            value={h.doseValue !== null ? String(h.doseValue) : ''}
            onChange={e => setH({ doseValue: parseFaNum(e.target.value) || null })}
            unit={h.doseUnit} min={0} />
        </Field>
        <Field label="واحد">
          <Select value={h.doseUnit} onChange={e => setH({ doseUnit: e.target.value })}>
            <option value="گرم">گرم</option>
            <option value="میلی‌لیتر">میلی‌لیتر</option>
            <option value="عدد">عدد</option>
            <option value="قطره">قطره</option>
          </Select>
        </Field>
      </Grid2>

      <Grid2>
        <Field label="نحوه مصرف">
          <Select value={h.useMethod} onChange={e => setH({ useMethod: e.target.value as MedicineUseMethod })}>
            <option value="">— انتخاب کنید —</option>
            {Object.entries(USE_METHOD_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </Select>
        </Field>
        <Field label="مدت دوره (روز)">
          <Input
            mode="number"
            value={h.durationDays !== null ? String(h.durationDays) : ''}
            onChange={e => setH({ durationDays: Math.round(parseFaNum(e.target.value)) || null })}
            unit="روز" min={0} />
        </Field>
      </Grid2>

      <Field label="زمان مصرف" hint="چند مورد">
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
          {(Object.keys(TIME_LABEL) as MedicineTime[]).map(t => (
            <ToggleChip key={t} label={TIME_LABEL[t]} active={h.times.includes(t)} onClick={() => toggleTime(t)} />
          ))}
        </div>
      </Field>
    </div>
  );
}

// ============ داروی شیمیایی ============
