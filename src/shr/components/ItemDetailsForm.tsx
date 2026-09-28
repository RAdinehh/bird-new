import { Field, Grid2, Grid3, Input, Select } from './ui';
import DatePicker from './DatePicker';
import SmartSelect from './SmartSelect';
import { useBrd } from '../../mod/brd/store';
import { useFlk } from '../../mod/flk/store';
import { toFa } from '../utils/fa';
import {
  MEDICINE_TYPE_LABEL, TEMPERAMENT_LABEL, PROPERTY_LABEL, FORM_LABEL,
  USE_METHOD_LABEL, TIME_LABEL, PRICE_UNIT_LABEL, SOURCE_TYPE_LABEL,
  SALE_REASON_LABEL,
  type HerbalDetails, type ChemicalDetails, type VaccineDetails,
  type MedicineType, type MedicineTemperament, type MedicineProperty,
  type MedicineForm, type MedicineUseMethod, type MedicineTime,
  type PriceUnit, type SourceType, type SaleReason,
} from '../utils/itemDetails';

interface Props {
  category: string;
  item: any;
  updateItem: (patch: any) => void;
}

// ============ helper ============
function getField(item: any, key: string, def: any = '') {
  return item[key] !== undefined ? item[key] : def;
}

// ============ Chip toggle ============
function ToggleChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: '5px 10px', fontSize: 'var(--fs-xs)',
        background: active ? 'var(--accent-soft)' : 'var(--btn-bg)',
        border: `1px solid ${active ? 'var(--accent-border)' : 'var(--border)'}`,
        borderRadius: 'var(--r-sm)',
        color: active ? 'var(--accent)' : 'var(--muted)',
        fontWeight: active ? 700 : 500, cursor: 'pointer',
        fontFamily: 'inherit', whiteSpace: 'nowrap',
      }}
    >
      {label}
    </button>
  );
}

// ============ داروی گیاهی ============
function HerbalForm({ item, updateItem }: { item: any; updateItem: (p: any) => void }) {
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
            onChange={e => setH({ doseValue: parseFloat(e.target.value) || null })}
            unit={h.doseUnit}
          />
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
            onChange={e => setH({ durationDays: parseInt(e.target.value) || null })}
            unit="روز"
          />
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
function ChemicalForm({ item, updateItem }: { item: any; updateItem: (p: any) => void }) {
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
            onChange={e => setC({ doseValue: parseFloat(e.target.value) || null })}
            unit={c.doseUnit}
          />
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
          onChange={e => setC({ withdrawalDays: parseInt(e.target.value) || null })}
          unit="روز"
        />
      </Field>
    </div>
  );
}

// ============ واکسن ============
function VaccineForm({ item, updateItem }: { item: any; updateItem: (p: any) => void }) {
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
            onChange={e => setV({ targetAge: parseInt(e.target.value) || null })}
            unit="روز"
          />
        </Field>
      </Grid2>

      <Grid3>
        <Field label="دوز">
          <Input
            mode="number"
            value={v.doseValue !== null ? String(v.doseValue) : ''}
            onChange={e => setV({ doseValue: parseFloat(e.target.value) || null })}
            unit={v.doseUnit}
          />
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
            onChange={e => setV({ immunityMonths: parseInt(e.target.value) || null })}
            unit="ماه"
          />
        </Field>
      </Grid3>
    </div>
  );
}

// ============ Main Component ==========
export default function ItemDetailsForm({ category, item, updateItem }: Props) {
  const { birds, breeds } = useBrd();
  const { flocks } = useFlk();

  // دسته‌های پرنده‌ای (خرید: chick, adult, fertile_egg — فروش: chick, adult, fertile_egg)
  const birdCategories = ['chick', 'adult', 'fertile_egg'];
  // دسته‌های تخم
  const eggCategories = ['egg'];
  // دسته دارو
  const medicineCategories = ['medicine'];
  // تجهیزات
  const equipmentCategories = ['equipment'];

  const setField = (key: string, val: any) => updateItem({ [key]: val });

  const breedsForBird = birds.filter(b => b.id === item.birdId).length
    ? breeds.filter(b => b.birdId === item.birdId)
    : breeds;

  // ========== دارو ==========
  if (medicineCategories.includes(category)) {
    const mType = (item.medicineType || '') as MedicineType;
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <Field label="نوع دارو" required>
          <div style={{ display: 'flex', gap: 6 }}>
            {(['herbal', 'chemical', 'vaccine'] as MedicineType[]).map(mt => (
              <ToggleChip
                key={mt}
                label={MEDICINE_TYPE_LABEL[mt]}
                active={mType === mt}
                onClick={() => setField('medicineType', mt)}
              />
            ))}
          </div>
        </Field>

        {mType === 'herbal' && <HerbalForm item={item} updateItem={updateItem} />}
        {mType === 'chemical' && <ChemicalForm item={item} updateItem={updateItem} />}
        {mType === 'vaccine' && <VaccineForm item={item} updateItem={updateItem} />}
      </div>
    );
  }

  // ========== پرنده‌ای (جوجه، بالغ، تخم نطفه‌دار) ==========
  if (birdCategories.includes(category)) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <Grid2>
          <Field label="نوع پرنده">
            <SmartSelect
              value={item.birdId || ''}
              onChange={v => updateItem({ birdId: v, breedId: '' })}
              options={birds.map(b => ({ value: b.id, label: b.name }))}
              placeholder="— انتخاب کنید —"
              modalTitle="انتخاب پرنده"
              autoThreshold={6}
            />
          </Field>
          <Field label="نژاد">
            <SmartSelect
              value={item.breedId || ''}
              onChange={v => updateItem({ breedId: v })}
              options={breedsForBird.map(b => ({ value: b.id, label: b.name }))}
              placeholder="— انتخاب کنید —"
              modalTitle="انتخاب نژاد"
              autoThreshold={6}
            />
          </Field>
        </Grid2>

        <Grid2>
          <Field label="گله مبدأ" hint="اگر فروش از گله خودت است">
            <SmartSelect
              value={item.flockId || ''}
              onChange={v => updateItem({ flockId: v })}
              options={flocks.map(f => ({ value: f.id, label: f.name }))}
              placeholder="— بدون گله —"
              modalTitle="انتخاب گله"
              autoThreshold={6}
            />
          </Field>
          <Field label="سن (روز)">
            <Input
              mode="number"
              value={item.ageDays !== null && item.ageDays !== undefined ? String(item.ageDays) : ''}
              onChange={e => updateItem({ ageDays: parseInt(e.target.value) || null })}
              unit="روز"
            />
          </Field>
        </Grid2>

        {/* جنسیت — فقط برای پرنده بالغ */}
        {category === 'adult' && (
          <Grid3>
            <Field label="تعداد نر">
              <Input mode="number" value={item.maleCount !== null && item.maleCount !== undefined ? String(item.maleCount) : ''} onChange={e => updateItem({ maleCount: parseInt(e.target.value) || null })} />
            </Field>
            <Field label="تعداد ماده">
              <Input mode="number" value={item.femaleCount !== null && item.femaleCount !== undefined ? String(item.femaleCount) : ''} onChange={e => updateItem({ femaleCount: parseInt(e.target.value) || null })} />
            </Field>
            <Field label="نامعلوم">
              <Input mode="number" value={item.unknownCount !== null && item.unknownCount !== undefined ? String(item.unknownCount) : ''} onChange={e => updateItem({ unknownCount: parseInt(e.target.value) || null })} />
            </Field>
          </Grid3>
        )}

        {/* قیمت بر اساس عدد یا وزن — فقط برای بالغ */}
        {category === 'adult' && (
          <Grid2>
            <Field label="مبنای قیمت">
              <Select value={item.priceUnit || 'per_unit'} onChange={e => updateItem({ priceUnit: e.target.value as PriceUnit })}>
                <option value="per_unit">هر عدد</option>
                <option value="per_kg">هر کیلو</option>
              </Select>
            </Field>
            {item.priceUnit === 'per_kg' && (
              <Field label="وزن زنده (کیلو)">
                <Input mode="number" value={item.liveWeight !== null && item.liveWeight !== undefined ? String(item.liveWeight) : ''} onChange={e => updateItem({ liveWeight: parseFloat(e.target.value) || null })} unit="kg" />
              </Field>
            )}
          </Grid2>
        )}
      </div>
    );
  }

  // ========== تخم خوراکی ==========
  if (eggCategories.includes(category)) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <Field label="گله مبدأ" required>
          <SmartSelect
            value={item.flockId || ''}
            onChange={v => updateItem({ flockId: v })}
            options={flocks.map(f => ({ value: f.id, label: f.name }))}
            placeholder="— انتخاب کنید —"
            modalTitle="انتخاب گله"
            autoThreshold={6}
          />
        </Field>

        <Grid2>
          <Field label="مبنای قیمت">
            <Select value={item.priceUnit || 'per_unit'} onChange={e => updateItem({ priceUnit: e.target.value as PriceUnit })}>
              <option value="per_unit">هر عدد</option>
              <option value="per_kg">هر کیلو</option>
            </Select>
          </Field>
          {item.priceUnit === 'per_kg' && (
            <Field label="وزن کل (کیلو)">
              <Input mode="number" value={item.liveWeight !== null && item.liveWeight !== undefined ? String(item.liveWeight) : ''} onChange={e => updateItem({ liveWeight: parseFloat(e.target.value) || null })} unit="kg" />
            </Field>
          )}
        </Grid2>
      </div>
    );
  }

  // ========== تجهیزات ==========
  if (equipmentCategories.includes(category)) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <Grid2>
          <Field label="مدل">
            <Input value={item.model || ''} onChange={e => updateItem({ model: e.target.value })} placeholder="مثلاً: XY-200" />
          </Field>
          <Field label="مدت گارانتی (ماه)">
            <Input
              mode="number"
              value={item.warrantyMonths !== null && item.warrantyMonths !== undefined ? String(item.warrantyMonths) : ''}
              onChange={e => updateItem({ warrantyMonths: parseInt(e.target.value) || null })}
              unit="ماه"
            />
          </Field>
        </Grid2>
      </div>
    );
  }

  return null;
}
