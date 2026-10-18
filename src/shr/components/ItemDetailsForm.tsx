import { Field, Grid2, Grid3, Input, Select } from './ui';
import SmartSelect from './SmartSelect';
import { useBrd } from '../../mod/brd/store';
import { useFlk } from '../../mod/flk/store';
import { parseFaNum } from '../utils/fa';
import {
  MEDICINE_TYPE_LABEL,
  type MedicineType,
  type PriceUnit,
} from '../utils/itemDetails';
import { ToggleChip } from './itemFormHelpers';
import HerbalForm from './HerbalForm';
import ChemicalForm from './ChemicalForm';
import VaccineForm from './VaccineForm';

interface Props {
  category: string;
  item: any;
  updateItem: (patch: any) => void;
  isPurchase?: boolean;   // true = خرید، false/undefined = فروش
  sellerSlot?: React.ReactNode;   // فیلد فروشنده — در adult با مبنای قیمت ادغام می‌شود
}


export default function ItemDetailsForm({ category, item, updateItem, isPurchase = false, sellerSlot }: Props) {
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
        {sellerSlot}
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
          {isPurchase ? (
            <Field label="گله مقصد" hint="خالی = گله جدید ساخته می‌شه">
              <SmartSelect
                value={item.flockId || ''}
                onChange={v => updateItem({ flockId: v })}
                options={flocks.filter(f => f.status === 'active').map(f => ({ value: f.id, label: f.name }))}
                placeholder="— گله جدید —"
                modalTitle="انتخاب گله"
                autoThreshold={6}
              />
            </Field>
          ) : (
            <Field label="گله مبدأ" hint="اگر فروش از گله خودت است">
              <SmartSelect
                value={item.flockId || ''}
                onChange={v => updateItem({ flockId: v })}
                options={flocks.filter(f => f.status === 'active').map(f => ({ value: f.id, label: f.name }))}
                placeholder="— بدون گله —"
                modalTitle="انتخاب گله"
                autoThreshold={6}
              />
            </Field>
          )}
          <Field label="سن (روز)">
            <Input
              mode="number"
              value={item.ageDays !== null && item.ageDays !== undefined ? String(item.ageDays) : ''}
              onChange={e => updateItem({ ageDays: Math.round(parseFaNum(e.target.value)) || null })}
              unit="روز" min={0} />
          </Field>
        </Grid2>

        {/* جنسیت — فقط برای پرنده بالغ */}
        {category === 'adult' && (
          <Grid2>
            <Field label="تعداد نر">
              <Input mode="number" value={item.maleCount !== null && item.maleCount !== undefined ? String(item.maleCount) : ''} onChange={e => updateItem({ maleCount: Math.round(parseFaNum(e.target.value)) || null })} min={0} />
            </Field>
            <Field label="تعداد ماده">
              <Input mode="number" value={item.femaleCount !== null && item.femaleCount !== undefined ? String(item.femaleCount) : ''} onChange={e => updateItem({ femaleCount: Math.round(parseFaNum(e.target.value)) || null })} min={0} />
            </Field>
            <Field label="نامعلوم">
              <Input mode="number" value={item.unknownCount !== null && item.unknownCount !== undefined ? String(item.unknownCount) : ''} onChange={e => updateItem({ unknownCount: Math.round(parseFaNum(e.target.value)) || null })} min={0} />
            </Field>
          </Grid2>
        )}

        {/* فروشنده + مبنای قیمت — فقط برای بالغ */}
        {category === 'adult' && (
          <>
            <Grid2>
              {sellerSlot || <div />}
              <Field label="مبنای قیمت">
                <Select value={item.priceUnit || 'per_unit'} onChange={e => updateItem({ priceUnit: e.target.value as PriceUnit })}>
                  <option value="per_unit">هر عدد</option>
                  <option value="per_kg">هر کیلو</option>
                </Select>
              </Field>
            </Grid2>
            {item.priceUnit === 'per_kg' && (
              <Field label="وزن زنده (کیلو)">
                <Input mode="number" value={item.liveWeight !== null && item.liveWeight !== undefined ? String(item.liveWeight) : ''} onChange={e => updateItem({ liveWeight: parseFaNum(e.target.value) || null })} unit="kg" min={0} />
              </Field>
            )}
          </>
        )}
        {category !== 'adult' && sellerSlot}
      </div>
    );
  }

  // ========== تخم خوراکی ==========
  if (eggCategories.includes(category)) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {!isPurchase && (
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
        )}

        <Grid2>
          {sellerSlot || <div />}
          <Field label="مبنای قیمت">
            <Select value={item.priceUnit || 'per_unit'} onChange={e => updateItem({ priceUnit: e.target.value as PriceUnit })}>
              <option value="per_unit">هر عدد</option>
              <option value="per_kg">هر کیلو</option>
            </Select>
          </Field>
        </Grid2>
        {item.priceUnit === 'per_kg' && (
          <Field label="وزن کل (کیلو)">
            <Input mode="number" value={item.liveWeight !== null && item.liveWeight !== undefined ? String(item.liveWeight) : ''} onChange={e => updateItem({ liveWeight: parseFaNum(e.target.value) || null })} unit="kg" min={0} />
          </Field>
        )}
      </div>
    );
  }

  // ========== دان و مواد اولیه ==========
  if (category === 'feed') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <Grid2>
          <Field label="نوع دان">
            <Select value={String(item.feedType || '')} onChange={e => updateItem({ feedType: e.target.value })}>
              <option value="">— انتخاب —</option>
              <option value="starter">آغازین (Starter)</option>
              <option value="grower">میانی (Grower)</option>
              <option value="finisher">پایانی (Finisher)</option>
            </Select>
          </Field>
          <Field label="نام تجاری / برند">
            <Input value={String(item.brand || '')} onChange={e => updateItem({ brand: e.target.value })} placeholder="مثلاً: پیشگامان" />
          </Field>
        </Grid2>
        <Grid2>
          <Field label="درصد پروتئین">
            <Input mode="number" value={item.protein !== null && item.protein !== undefined ? String(item.protein) : ''} onChange={e => updateItem({ protein: parseFaNum(e.target.value) || null })} unit="٪" min={0} max={100} />
          </Field>
          <Field label="انرژی (کیلوکالری)">
            <Input mode="number" value={item.energy !== null && item.energy !== undefined ? String(item.energy) : ''} onChange={e => updateItem({ energy: parseFaNum(e.target.value) || null })} unit="Kcal" min={0} />
          </Field>
        </Grid2>
        <Grid2>
          <Field label="وزن هر کیسه (kg)">
            <Input mode="number" value={item.bagWeight !== null && item.bagWeight !== undefined ? String(item.bagWeight) : ''} onChange={e => updateItem({ bagWeight: parseFaNum(e.target.value) || null })} unit="kg" min={0} />
          </Field>
          <Field label="تعداد کیسه">
            <Input mode="number" value={item.bagCount !== null && item.bagCount !== undefined ? String(item.bagCount) : ''} onChange={e => updateItem({ bagCount: Math.round(parseFaNum(e.target.value)) || null })} unit="کیسه" min={0} />
          </Field>
        </Grid2>
        <Grid2>
          <Field label="شماره بچ تولید">
            <Input value={String(item.batchNo || '')} onChange={e => updateItem({ batchNo: e.target.value })} placeholder="مثلاً: F-123" />
          </Field>
          <Field label="تاریخ انقضا">
            <Input value={String(item.expiryDate || '')} onChange={e => updateItem({ expiryDate: e.target.value })} placeholder="1405/12/29" />
          </Field>
        </Grid2>
        <Field label="گله مقصد" hint="هزینه به این گله متصل می‌شود">
          <SmartSelect value={String(item.flockId || '')} onChange={v => updateItem({ flockId: v })} options={flocks.filter(f => f.status === 'active').map(f => ({ value: f.id, label: f.name }))} placeholder="— بدون گله —" modalTitle="انتخاب گله" autoThreshold={6} />
        </Field>
        {sellerSlot}
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
              onChange={e => updateItem({ warrantyMonths: Math.round(parseFaNum(e.target.value)) || null })}
              unit="ماه" min={0} />
          </Field>
        </Grid2>
        {sellerSlot}
      </div>
    );
  }

  return null;
}
