import { Field, Grid2, Grid3, Input, Select } from './ui';
import { parseFaNum } from '../utils/fa';
import {
  TEMPERAMENT_LABEL, PROPERTY_LABEL, FORM_LABEL, USE_METHOD_LABEL, TIME_LABEL,
  type MedicineTemperament, type MedicineProperty, type MedicineForm, type MedicineUseMethod,
  type MedicineTime, type ChemicalDetails,
} from '../utils/itemDetails';
import { ToggleChip } from './itemFormHelpers';

export default function ChemicalForm({ item, updateItem }: { item: any; updateItem: (p: any) => void }) {
  const c: ChemicalDetails = item.chemicalDetails || {
    name: '', activeIngredient: '', strength: '', form: '',
    doseValue: null, doseUnit: 'میلی‌لیتر', useMethod: '', withdrawalDays: null,
  };

  const setC = (patch: Partial<ChemicalDetails>) => {
    updateItem({ chemicalDetails: { ...c, ...patch } });
  };

  return (
    <div style={{
      padding: '10px 12px', background: 'var(--info-soft)',
      border: '1px dashed var(--info)', borderRadius: 'var(--r-md)',
      display: 'flex', flexDirection: 'column', gap: 8,
    }}>
      <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--info)', fontWeight: 700 }}>
        💊 داروی شیمیایی
      </div>

      <Grid2>
        <Field label="نام دارو" required>
          <Input value={c.name} onChange={e => setC({ name: e.target.value })} placeholder="مثلاً: انروفلوکساسین" />
        </Field>
        <Field label="ماده مؤثره" required>
          <Input value={c.activeIngredient} onChange={e => setC({ activeIngredient: e.target.value })} placeholder="مثلاً: Enrofloxacin" />
        </Field>
      </Grid2>

      <Grid2>
        <Field label="قدرت">
          <Input value={c.strength} onChange={e => setC({ strength: e.target.value })} placeholder="مثلاً: ۱۰٪" />
        </Field>
        <Field label="شکل دارویی">
          <Select value={c.form} onChange={e => setC({ form: e.target.value })}>
            <option value="">— انتخاب کنید —</option>
            <option value="محلول تزریقی">محلول تزریقی</option>
            <option value="پودر محلول">پودر محلول</option>
            <option value="قرص">قرص</option>
            <option value="کپسول">کپسول</option>
            <option value="سوسپانسیون">سوسپانسیون</option>
          </Select>
        </Field>
      </Grid2>

      <Grid3>
        <Field label="دوز">
          <Input
            mode="number"
            value={c.doseValue !== null ? String(c.doseValue) : ''}
            onChange={e => setC({ doseValue: parseFaNum(e.target.value) || null })}
            unit={c.doseUnit} min={0} />
        </Field>
        <Field label="واحد">
          <Select value={c.doseUnit} onChange={e => setC({ doseUnit: e.target.value })}>
            <option value="میلی‌لیتر">میلی‌لیتر</option>
            <option value="میلی‌گرم">میلی‌گرم</option>
            <option value="گرم">گرم</option>
          </Select>
        </Field>
        <Field label="روش مصرف">
          <Select value={c.useMethod} onChange={e => setC({ useMethod: e.target.value })}>
            <option value="">— انتخاب —</option>
            <option value="تزریقی">تزریقی</option>
            <option value="خوراکی">خوراکی</option>
            <option value="مخلوط در آب">مخلوط در آب</option>
            <option value="مخلوط در دان">مخلوط در دان</option>
          </Select>
        </Field>
      </Grid3>

      <Field label="دوره منع مصرف (روز)" hint="پس از مصرف، تخم/گوشت قابل استفاده نیست">
        <Input
          mode="number"
          value={c.withdrawalDays !== null ? String(c.withdrawalDays) : ''}
          onChange={e => setC({ withdrawalDays: Math.round(parseFaNum(e.target.value)) || null })}
          unit="روز" min={0} />
      </Field>
    </div>
  );
}

// ============ واکسن ============
