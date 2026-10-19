import { Field, Grid2, Input, Select } from './ui';
import SmartSelect from './SmartSelect';
import { useBrd } from '../../mod/brd/store';
import { useHal } from '../../mod/hal/store';
import { useFlk } from '../../mod/flk/store';
import { useWhs } from '../../mod/whs/store';
import { parseFaNum } from '../utils/fa';
import { type PriceUnit } from '../utils/itemDetails';
import DatePicker from './DatePicker';

export interface ItemDetailFormData {
  id?: string;
  description?: string;
  unit?: string;
  quantity?: number;
  unitPrice?: number;
  total?: number;
  discountType?: string;
  discountValue?: number;
  shipping?: number;
  itemPartyId?: string;
  
  flockId?: string;
  hallId?: string;
  zoneId?: string;

  birdId?: string;
  breedId?: string;
  ageDays?: number | null;
  maleCount?: number | null;
  femaleCount?: number | null;
  unknownCount?: number | null;
  
  priceUnit?: string;
  liveWeight?: number | null;

  hatchDate?: string;
  hatcheryBatchNo?: string;
  chickWeight?: number | null;
  transportCost?: number | null;
  flockName?: string;

  eggBatchNo?: string;
  eggDate?: string;
  brokenEggCount?: number | null;
  nonIncubableCount?: number | null;
  sourceFarm?: string;

  expiryDate?: string;
  storage?: string;

  feedType?: string;
  brand?: string;
  protein?: number | null;
  energy?: number | null;
  fat?: number | null;
  fiber?: number | null;
  calcium?: number | null;
  phosphorus?: number | null;
  methionine?: number | null;
  lysine?: number | null;
  stockItemId?: string;

  model?: string;
  serialNo?: string;
  warrantyMonths?: number | null;

  costType?: string;
}

interface Props {
  category: string;
  item: ItemDetailFormData;
  updateItem: (patch: Partial<ItemDetailFormData>) => void;
  isPurchase?: boolean;
  sellerSlot?: React.ReactNode;
}

const SecTitle = ({ icon, title }: { icon: string; title: string }) => (
  <div style={{ paddingTop: 12, fontSize: 'var(--fs-base)', fontWeight: 700, color: 'var(--text)', letterSpacing: '.3px', borderTop: '1px dashed var(--border)', marginBottom: 4 }}>
    {icon} {title}
  </div>
);

export default function ItemDetailsForm({ category, item, updateItem, isPurchase = false, sellerSlot }: Props) {
  const { birds, breeds } = useBrd();
  const { halls, zones } = useHal();
  const { flocks } = useFlk();
  const { items: whsItems } = useWhs();

  const breedsForBird = birds.filter(b => b.id === item.birdId).length
    ? breeds.filter(b => b.birdId === item.birdId)
    : breeds;

  const activeFlocks = flocks.filter(f => f.status === 'active').map(f => ({ value: f.id, label: f.name }));
  const isEggCategory = isPurchase ? category === 'egg' : category === 'fertile_egg';

  // ========== جوجه یک‌روزه (Chick) ==========
  if (category === 'chick') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        
        <SecTitle icon="🧬" title="هویت و نژاد" />
        <Grid2>
          <Field label="نوع پرنده">
            <SmartSelect value={String(item.birdId || '')} onChange={v => {
              const bBreeds = breeds.filter(b => b.birdId === v);
              updateItem({ birdId: v, breedId: bBreeds.length === 1 ? bBreeds[0].id : '' });
            }} options={birds.map(b => ({ value: b.id, label: b.name }))} placeholder="— انتخاب —" modalTitle="انتخاب پرنده" autoThreshold={6} />
          </Field>
          <Field label="نژاد">
            <SmartSelect value={String(item.breedId || '')} onChange={v => updateItem({ breedId: v })} options={breedsForBird.map(b => ({ value: b.id, label: b.name }))} placeholder="— انتخاب —" modalTitle="انتخاب نژاد" autoThreshold={6} />
          </Field>
        </Grid2>

        <SecTitle icon="📄" title="اسناد و تامین‌کننده" />
        <Grid2>
          <Field label="نام گله / بچ جدید" hint="خالی = نام خودکار">
            <Input value={String(item.flockName || '')} onChange={e => updateItem({ flockName: e.target.value })} placeholder="مثلاً: گله آذر" />
          </Field>
          <Field label="بچ هچری">
            <Input value={String(item.hatcheryBatchNo || '')} onChange={e => updateItem({ hatcheryBatchNo: e.target.value })} placeholder="H-99" />
          </Field>
        </Grid2>

        <SecTitle icon="🔢" title="تعداد و تخصیص مکان" />
        <Grid2>
          <Field label="سالن مقصد">
            <SmartSelect value={String(item.hallId || '')} onChange={v => updateItem({ hallId: v, zoneId: '' })} options={halls.map(h => ({ value: h.id, label: h.name }))} placeholder="— سالن —" modalTitle="انتخاب سالن" autoThreshold={6} />
          </Field>
          <Field label="بخش مقصد">
            <SmartSelect value={String(item.zoneId || '')} onChange={v => updateItem({ zoneId: v })} options={zones.filter(z => z.hallId === item.hallId).map(z => ({ value: z.id, label: z.name }))} placeholder={item.hallId ? "— بخش —" : "اول سالن"} modalTitle="انتخاب بخش" autoThreshold={6} />
          </Field>
        </Grid2>
        <Grid2>
          <Field label="گله مقصد (موجود)">
            <SmartSelect value={String(item.flockId || '')} onChange={v => updateItem({ flockId: v })} options={activeFlocks} placeholder="— بدون گله (جدید) —" modalTitle="انتخاب گله" autoThreshold={6} />
          </Field>
          <Field label="تاریخ هچ">
            <DatePicker value={String(item.hatchDate || '')} onChange={v => updateItem({ hatchDate: v })} placeholder="1405/07/26" autoToday />
          </Field>
        </Grid2>
        <Grid2>
          <Field label="سن (روز)">
            <Input mode="number" value={item.ageDays !== null && item.ageDays !== undefined ? String(item.ageDays) : ''} onChange={e => updateItem({ ageDays: Math.round(parseFaNum(e.target.value)) || null })} unit="روز" min={0} />
          </Field>
          <Field label="وزن اولیه (گرم)">
            <Input mode="number" value={item.chickWeight !== null && item.chickWeight !== undefined ? String(item.chickWeight) : ''} onChange={e => updateItem({ chickWeight: parseFaNum(e.target.value) || null })} unit="g" min={0} />
          </Field>
        </Grid2>
        <Grid2>
          <Field label="تعداد نر">
            <Input mode="number" value={item.maleCount !== null && item.maleCount !== undefined ? String(item.maleCount) : ''} onChange={e => updateItem({ maleCount: Math.round(parseFaNum(e.target.value)) || null })} min={0} />
          </Field>
          <Field label="تعداد ماده">
            <Input mode="number" value={item.femaleCount !== null && item.femaleCount !== undefined ? String(item.femaleCount) : ''} onChange={e => updateItem({ femaleCount: Math.round(parseFaNum(e.target.value)) || null })} min={0} />
          </Field>
        </Grid2>

        <SecTitle icon="💰" title="هزینه و مالی" />
        <Grid2>
          <Field label="هزینه حمل اختصاصی">
            <Input mode="number" value={item.transportCost !== null && item.transportCost !== undefined ? String(item.transportCost) : ''} onChange={e => updateItem({ transportCost: parseFaNum(e.target.value) || null })} unit="ت" min={0} />
          </Field>
          <div />
        </Grid2>
        {sellerSlot}
      </div>
    );
  }

  // ========== تخم نطفه‌دار (Fertile Egg) ==========
  if (isEggCategory) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <SecTitle icon="🧬" title="هویت و نژاد" />
        <Grid2>
          <Field label="نوع پرنده">
            <SmartSelect value={String(item.birdId || '')} onChange={v => {
              const bBreeds = breeds.filter(b => b.birdId === v);
              updateItem({ birdId: v, breedId: bBreeds.length === 1 ? bBreeds[0].id : '' });
            }} options={birds.map(b => ({ value: b.id, label: b.name }))} placeholder="— انتخاب —" modalTitle="انتخاب پرنده" autoThreshold={6} />
          </Field>
          <Field label="نژاد">
            <SmartSelect value={String(item.breedId || '')} onChange={v => updateItem({ breedId: v })} options={breedsForBird.map(b => ({ value: b.id, label: b.name }))} placeholder="— انتخاب —" modalTitle="انتخاب نژاد" autoThreshold={6} />
          </Field>
        </Grid2>

        <SecTitle icon="📄" title="اسناد و تامین‌کننده" />
        <Grid2>
          <Field label="شماره بچ تخم">
            <Input value={String(item.eggBatchNo || '')} onChange={e => updateItem({ eggBatchNo: e.target.value })} placeholder="B-102" />
          </Field>
          <Field label="مبدأ / مرغداری مادر" hint="برای ردیابی">
            <Input value={String(item.sourceFarm || '')} onChange={e => updateItem({ sourceFarm: e.target.value })} placeholder="آدینه" />
          </Field>

        </Grid2>

        <SecTitle icon="🔢" title="تعداد و تخصیص مکان" />
        <Grid2>
          <Field label="گله مقصد (موجود)">
            <SmartSelect value={String(item.flockId || '')} onChange={v => updateItem({ flockId: v })} options={activeFlocks} placeholder="— بدون گله —" modalTitle="انتخاب گله" autoThreshold={6} />
          </Field>
          <Field label="تاریخ تولید تخم">
            <DatePicker value={String(item.eggDate || '')} onChange={v => updateItem({ eggDate: v })} placeholder="1405/07/20" autoToday />
          </Field>
        </Grid2>
        <Grid2>
          <Field label="تعداد شکسته">
            <Input mode="number" value={item.brokenEggCount !== null && item.brokenEggCount !== undefined ? String(item.brokenEggCount) : ''} onChange={e => updateItem({ brokenEggCount: Math.round(parseFaNum(e.target.value)) || null })} unit="عدد" min={0} />
          </Field>
          <Field label="غیرقابل جوجه">
            <Input mode="number" value={item.nonIncubableCount !== null && item.nonIncubableCount !== undefined ? String(item.nonIncubableCount) : ''} onChange={e => updateItem({ nonIncubableCount: Math.round(parseFaNum(e.target.value)) || null })} unit="عدد" min={0} />
          </Field>
        </Grid2>

        <SecTitle icon="💰" title="هزینه و مالی" />
        {sellerSlot}
      </div>
    );
  }

  // ========== پرنده بالغ (Adult) ==========
  if (category === 'adult') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <SecTitle icon="🧬" title="هویت و نژاد" />
        <Grid2>
          <Field label="نوع پرنده">
            <SmartSelect value={String(item.birdId || '')} onChange={v => {
              const bBreeds = breeds.filter(b => b.birdId === v);
              updateItem({ birdId: v, breedId: bBreeds.length === 1 ? bBreeds[0].id : '' });
            }} options={birds.map(b => ({ value: b.id, label: b.name }))} placeholder="— انتخاب —" modalTitle="انتخاب پرنده" autoThreshold={6} />
          </Field>
          <Field label="نژاد">
            <SmartSelect value={String(item.breedId || '')} onChange={v => updateItem({ breedId: v })} options={breedsForBird.map(b => ({ value: b.id, label: b.name }))} placeholder="— انتخاب —" modalTitle="انتخاب نژاد" autoThreshold={6} />
          </Field>
        </Grid2>

        <SecTitle icon="🔢" title="تعداد و تخصیص مکان" />
        <Grid2>
          <Field label="گله مقصد (موجود)">
            <SmartSelect value={String(item.flockId || '')} onChange={v => updateItem({ flockId: v })} options={activeFlocks} placeholder="— بدون گله —" modalTitle="انتخاب گله" autoThreshold={6} />
          </Field>
          <Field label="سن (روز)">
            <Input mode="number" value={item.ageDays !== null && item.ageDays !== undefined ? String(item.ageDays) : ''} onChange={e => updateItem({ ageDays: Math.round(parseFaNum(e.target.value)) || null })} unit="روز" min={0} />
          </Field>
        </Grid2>
        <Grid2>
          <Field label="تعداد نر">
            <Input mode="number" value={item.maleCount !== null && item.maleCount !== undefined ? String(item.maleCount) : ''} onChange={e => updateItem({ maleCount: Math.round(parseFaNum(e.target.value)) || null })} min={0} />
          </Field>
          <Field label="تعداد ماده">
            <Input mode="number" value={item.femaleCount !== null && item.femaleCount !== undefined ? String(item.femaleCount) : ''} onChange={e => updateItem({ femaleCount: Math.round(parseFaNum(e.target.value)) || null })} min={0} />
          </Field>
        </Grid2>
        

        {sellerSlot}
      </div>
    );
  }

  // ========== دان (Feed) ==========
  if (category === 'feed') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <SecTitle icon="🏷" title="هویت کالا" />
        <Grid2>
          <Field label="اتصال به انبار" hint="برای موجودی">
            <SmartSelect value={String(item.stockItemId || '')} onChange={v => updateItem({ stockItemId: v })} options={(whsItems || []).map(i => ({ value: i.id, label: i.name }))} placeholder="— کالا —" modalTitle="انتخاب کالای انبار" autoThreshold={6} />
          </Field>

        </Grid2>


        <SecTitle icon="📅" title="انبار و ردیابی" />
        <Field label="تاریخ انقضا">
          <DatePicker value={String(item.expiryDate || '')} onChange={v => updateItem({ expiryDate: v })} placeholder="1405/12/29" />
        </Field>



        <SecTitle icon="💰" title="هزینه و مالی" />
        <Field label="گله مقصد" hint="هزینه به این گله متصل می‌شود">
          <SmartSelect value={String(item.flockId || '')} onChange={v => updateItem({ flockId: v })} options={activeFlocks} placeholder="— بدون گله —" modalTitle="انتخاب گله" autoThreshold={6} />
        </Field>
        {sellerSlot}
      </div>
    );
  }

  // ========== دارو (Medicine) ==========
  if (category === 'medicine') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <SecTitle icon="📦" title="اطلاعات انبار" />
        <Field label="تاریخ انقضا">
          <DatePicker value={String(item.expiryDate || '')} onChange={v => updateItem({ expiryDate: v })} placeholder="1405/12/29" />
        </Field>


        <SecTitle icon="💰" title="هزینه و مالی" />
        <Field label="گله مقصد" hint="هزینه به این گله متصل می‌شود">
          <SmartSelect value={String(item.flockId || '')} onChange={v => updateItem({ flockId: v })} options={activeFlocks} placeholder="— بدون گله —" modalTitle="انتخاب گله" autoThreshold={6} />
        </Field>
        {sellerSlot}
      </div>
    );
  }

  // ========== تجهیزات (Equipment) ==========
  if (category === 'equipment') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <SecTitle icon="⚙️" title="مشخصات فنی" />
        <Grid2>
          <Field label="مدل / نوع">
            <Input value={String(item.model || '')} onChange={e => updateItem({ model: e.target.value })} placeholder="فن تونلی ۱۲۰" />
          </Field>
          <Field label="شماره سریال">
            <Input value={String(item.serialNo || '')} onChange={e => updateItem({ serialNo: e.target.value })} placeholder="SN-123456" />
          </Field>
        </Grid2>
        <Grid2>
          <Field label="مدت گارانتی (ماه)">
            <Input mode="number" value={item.warrantyMonths !== null && item.warrantyMonths !== undefined ? String(item.warrantyMonths) : ''} onChange={e => updateItem({ warrantyMonths: Math.round(parseFaNum(e.target.value)) || null })} unit="ماه" min={0} />
          </Field>
          <div />
        </Grid2>

        <SecTitle icon="📍" title="مکان و مقصد" />
        <Field label="سالن مقصد" hint="محل نصب تجهیز">
          <SmartSelect value={String(item.hallId || '')} onChange={v => updateItem({ hallId: v })} options={halls.map(h => ({ value: h.id, label: h.name }))} placeholder="— سالن —" modalTitle="انتخاب سالن" autoThreshold={6} />
        </Field>

        <SecTitle icon="💰" title="هزینه و مالی" />
        {sellerSlot}
      </div>
    );
  }

  // ========== سایر (Other) ==========
  if (category === 'other') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <SecTitle icon="📋" title="نوع هزینه" />
        <Grid2>
          <Field label="نوع هزینه" hint="برای گزارش‌های مالی">
            <Select value={String(item.costType || '')} onChange={e => updateItem({ costType: e.target.value })}>
              <option value="">— انتخاب —</option>
              <option value="transport">حمل و نقل</option>
              <option value="labor">دستمزد</option>
              <option value="utilities">قبوض</option>
              <option value="maintenance">تعمیرات</option>
              <option value="packaging">بسته‌بندی</option>
              <option value="other">سایر</option>
            </Select>
          </Field>
          <Field label="گله مقصد (اختیاری)" hint="سرشکن هزینه">
            <SmartSelect value={String(item.flockId || '')} onChange={v => updateItem({ flockId: v })} options={activeFlocks} placeholder="— بدون گله —" modalTitle="انتخاب گله" autoThreshold={6} />
          </Field>
        </Grid2>
        <SecTitle icon="💰" title="هزینه و مالی" />
        {sellerSlot}
      </div>
    );
  }

  return null;
}
