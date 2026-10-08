import { Field, Grid2, Grid3, Input, Select } from './ui';
import { parseFaNum } from '../utils/fa';
import { type VaccineDetails } from '../utils/itemDetails';

export default function VaccineForm({ item, updateItem }: { item: any; updateItem: (p: any) => void }) {
  const v: VaccineDetails = item.vaccineDetails || {
    name: '', targetDisease: '', injectMethod: '',
    targetAge: null, doseValue: null, doseUnit: 'میلی‌لیتر', immunityMonths: null,
  };

  const setV = (patch: Partial<VaccineDetails>) => {
    updateItem({ vaccineDetails: { ...v, ...patch } });
  };

  return (
    <div style={{
      padding: '10px 12px', background: 'var(--purple-soft)',
      border: '1px dashed var(--purple)', borderRadius: 'var(--r-md)',
      display: 'flex', flexDirection: 'column', gap: 8,
    }}>
      <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--purple)', fontWeight: 700 }}>
        💉 واکسن
      </div>

      <Grid2>
        <Field label="نام واکسن" required>
          <Input value={v.name} onChange={e => setV({ name: e.target.value })} placeholder="مثلاً: نیوکاسل" />
        </Field>
        <Field label="بیماری هدف">
          <Input value={v.targetDisease} onChange={e => setV({ targetDisease: e.target.value })} placeholder="مثلاً: Newcastle" />
        </Field>
      </Grid2>

      <Grid2>
        <Field label="روش تزریق">
          <Select value={v.injectMethod} onChange={e => setV({ injectMethod: e.target.value })}>
            <option value="">— انتخاب —</option>
            <option value="زیرجلدی">زیرجلدی</option>
            <option value="عضلانی">عضلانی</option>
            <option value="قطره چشمی">قطره چشمی</option>
            <option value="قطره بینی">قطره بینی</option>
            <option value="آب آشامیدنی">آب آشامیدنی</option>
            <option value="اسپری">اسپری</option>
          </Select>
        </Field>
        <Field label="سن تجویز (روز)">
          <Input
            mode="number"
            value={v.targetAge !== null ? String(v.targetAge) : ''}
            onChange={e => setV({ targetAge: Math.round(parseFaNum(e.target.value)) || null })}
            unit="روز" min={0} />
        </Field>
      </Grid2>

      <Grid3>
        <Field label="دوز">
          <Input
            mode="number"
            value={v.doseValue !== null ? String(v.doseValue) : ''}
            onChange={e => setV({ doseValue: parseFaNum(e.target.value) || null })}
            unit={v.doseUnit} min={0} />
        </Field>
        <Field label="واحد">
          <Select value={v.doseUnit} onChange={e => setV({ doseUnit: e.target.value })}>
            <option value="میلی‌لیتر">میلی‌لیتر</option>
            <option value="قطره">قطره</option>
            <option value="دوز">دوز</option>
          </Select>
        </Field>
        <Field label="دوره ایمنی (ماه)">
          <Input
            mode="number"
            value={v.immunityMonths !== null ? String(v.immunityMonths) : ''}
            onChange={e => setV({ immunityMonths: Math.round(parseFaNum(e.target.value)) || null })}
            unit="ماه" min={0} />
        </Field>
      </Grid3>
    </div>
  );
}

