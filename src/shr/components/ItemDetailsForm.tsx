import { Field, Grid2, Input, Select } from './ui';
import SmartSelect from './SmartSelect';
import { useBrd } from '../../mod/brd/store';
import { useHal } from '../../mod/hal/store';
import { useFlk } from '../../mod/flk/store';
import { useWhs } from '../../mod/whs/store';
import { parseFaNum } from '../utils/fa';
import { type PriceUnit } from '../utils/itemDetails';

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
  
  // Shared
  flockId?: string;
  hallId?: string;
  zoneId?: string;

  // Bird
  birdId?: string;
  breedId?: string;
  ageDays?: number | null;
  maleCount?: number | null;
  femaleCount?: number | null;
  unknownCount?: number | null;
  
  // Adult
  priceUnit?: string;
  liveWeight?: number | null;

  // Chick
  hatchDate?: string;
  hatcheryBatchNo?: string;
  chickWeight?: number | null;
  transportCost?: number | null;
  flockName?: string;

  // Fertile Egg
  eggBatchNo?: string;
  eggDate?: string;
  brokenEggCount?: number | null;
  sourceFarm?: string;

  // Medicine
  batchNo?: string;
  expiryDate?: string;
  storage?: string;

  // Feed
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
  bagWeight?: number | null;
  bagCount?: number | null;
  stockItemId?: string;

  // Equipment
  model?: string;
  serialNo?: string;
  warrantyMonths?: number | null;

  // Other
  costType?: string;
}

interface Props {
  category: string;
  item: ItemDetailFormData;
  updateItem: (patch: Partial<ItemDetailFormData>) => void;
  isPurchase?: boolean;
  sellerSlot?: React.ReactNode;
}

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

  // ========== دارو ==========
  if (category === 'medicine') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <Grid2>
          <Field label="شماره بچ (Batch)">
            <Input value={String(item.batchNo || '')} onChange={e => updateItem({ batchNo: e.target.value })} placeholder="مثلاً: B-123" />
          </Field>
          <Field label="تاریخ انقضا">
            <Input value={String(item.expiryDate || '')} onChange={e => updateItem({ expiryDate: e.target.value })} placeholder="1405/12/29" />
          </Field>
        </Grid2>
        <Grid2>
          <Field label="شرایط نگهداری">
            <Select value={String(item.storage || 'room')} onChange={e => updateItem({ storage: e.target.value })}>
              <option value="room">دمای اتاق</option>
              <option value="fridge">یخچال (۲ تا ۸ درجه)</option>
              <option value="freezer">فریزر (زیر صفر)</option>
            </Select>
          </Field>
          <Field label="گله مقصد" hint="هزینه به این گله متصل می‌شود">
            <SmartSelect value={String(item.flockId || '')} onChange={v => updateItem({ flockId: v })} options={activeFlocks} placeholder="— بدون گله —" modalTitle="انتخاب گله" autoThreshold={6} />
          </Field>
        </Grid2>
        {sellerSlot}
      </div>
    );
  }

  // ========== پرنده‌ای (جوجه، بالغ، تخم نطفه‌دار) ==========
  if (['chick', 'adult'].includes(category) || isEggCategory) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <Grid2>
          <Field label="نوع پرنده">
            <SmartSelect value={String(item.birdId || '')} onChange={v => updateItem({ birdId: v, breedId: '' })} options={birds.map(b => ({ value: b.id, label: b.name }))} placeholder="— انتخاب کنید —" modalTitle="انتخاب پرنده" autoThreshold={6} />
          </Field>
          <Field label="نژاد">
            <SmartSelect value={String(item.breedId || '')} onChange={v => updateItem({ breedId: v })} options={breedsForBird.map(b => ({ value: b.id, label: b.name }))} placeholder="— انتخاب کنید —" modalTitle="انتخاب نژاد" autoThreshold={6} />
          </Field>
        </Grid2>

        <Grid2>
          {isPurchase ? (
            <Field label="گله مقصد" hint="خالی = گله جدید ساخته می‌شه">
              <SmartSelect value={String(item.flockId || '')} onChange={v => updateItem({ flockId: v })} options={activeFlocks} placeholder="— گله جدید —" modalTitle="انتخاب گله" autoThreshold={6} />
            </Field>
          ) : (
            <Field label="گله مبدأ" hint="اگر فروش از گله خودت است">
              <SmartSelect value={String(item.flockId || '')} onChange={v => updateItem({ flockId: v })} options={activeFlocks} placeholder="— بدون گله —" modalTitle="انتخاب گله" autoThreshold={6} />
            </Field>
          )}
          <Field label="سن (روز)">
            <Input mode="number" value={item.ageDays !== null && item.ageDays !== undefined ? String(item.ageDays) : ''} onChange={e => updateItem({ ageDays: Math.round(parseFaNum(e.target.value)) || null })} unit="روز" min={0} />
          </Field>
        </Grid2>

        {/* جنسیت (برای جوجه و بالغ) */}
        {['adult', 'chick'].includes(category) && (
          <Grid2>
            <Field label="تعداد نر">
              <Input mode="number" value={item.maleCount !== null && item.maleCount !== undefined ? String(item.maleCount) : ''} onChange={e => updateItem({ maleCount: Math.round(parseFaNum(e.target.value)) || null })} min={0} />
            </Field>
            <Field label="تعداد ماده">
              <Input mode="number" value={item.femaleCount !== null && item.femaleCount !== undefined ? String(item.femaleCount) : ''} onChange={e => updateItem({ femaleCount: Math.round(parseFaNum(e.target.value)) || null })} min={0} />
            </Field>
            <Field label="نامعلوم (Mixed)">
              <Input mode="number" value={item.unknownCount !== null && item.unknownCount !== undefined ? String(item.unknownCount) : ''} onChange={e => updateItem({ unknownCount: Math.round(parseFaNum(e.target.value)) || null })} min={0} />
            </Field>
          </Grid2>
        )}

        {/* اختصاصی جوجه یک‌روزه */}
        {category === 'chick' && (
          <>
            <Field label="نام گله جدید" hint="اگر خالی باشد، سیستم نام خودکار می‌گذارد">
              <Input value={String(item.flockName || '')} onChange={e => updateItem({ flockName: e.target.value })} placeholder="مثلاً: گله گوشتی آذر" />
            </Field>
            <Grid2>
              <Field label="سالن مقصد">
                <SmartSelect value={String(item.hallId || '')} onChange={v => updateItem({ hallId: v, zoneId: '' })} options={halls.map(h => ({ value: h.id, label: h.name }))} placeholder="— انتخاب سالن —" modalTitle="انتخاب سالن" autoThreshold={6} />
              </Field>
              <Field label="بخش مقصد">
                <SmartSelect value={String(item.zoneId || '')} onChange={v => updateItem({ zoneId: v })} options={zones.filter(z => z.hallId === item.hallId).map(z => ({ value: z.id, label: z.name }))} placeholder={item.hallId ? "— انتخاب بخش —" : "ابتدا سالن را انتخاب کنید"} modalTitle="انتخاب بخش" autoThreshold={6} />
              </Field>
            </Grid2>
            <Grid2>
              <Field label="تاریخ هچ">
                <Input value={String(item.hatchDate || '')} onChange={e => updateItem({ hatchDate: e.target.value })} placeholder="1405/07/26" />
              </Field>
              <Field label="شماره بچ هچری">
                <Input value={String(item.hatcheryBatchNo || '')} onChange={e => updateItem({ hatcheryBatchNo: e.target.value })} placeholder="مثلاً: H-99" />
              </Field>
            </Grid2>
            <Grid2>
              <Field label="وزن اولیه جوجه (گرم)">
                <Input mode="number" value={item.chickWeight !== null && item.chickWeight !== undefined ? String(item.chickWeight) : ''} onChange={e => updateItem({ chickWeight: parseFaNum(e.target.value) || null })} unit="گرم" min={0} />
              </Field>
              <Field label="هزینه حمل اختصاصی">
                <Input mode="number" value={item.transportCost !== null && item.transportCost !== undefined ? String(item.transportCost) : ''} onChange={e => updateItem({ transportCost: parseFaNum(e.target.value) || null })} min={0} />
              </Field>
            </Grid2>
          </>
        )}

        {/* اختصاصی پرنده بالغ */}
        {category === 'adult' && (
          <Grid2>
            {sellerSlot || <div />}
            <Field label="مبنای قیمت">
              <Select value={String(item.priceUnit || 'per_unit')} onChange={e => updateItem({ priceUnit: e.target.value as PriceUnit })}>
                <option value="per_unit">هر عدد</option>
                <option value="per_kg">هر کیلو</option>
              </Select>
            </Field>
            {item.priceUnit === 'per_kg' && (
              <Field label="وزن زنده کل (کیلو)">
                <Input mode="number" value={item.liveWeight !== null && item.liveWeight !== undefined ? String(item.liveWeight) : ''} onChange={e => updateItem({ liveWeight: parseFaNum(e.target.value) || null })} unit="kg" min={0} />
              </Field>
            )}
          </Grid2>
        )}

        {/* اختصاصی تخم نطفه‌دار */}
        {isEggCategory && (
          <>
            <Grid2>
              <Field label="شماره بچ تخم">
                <Input value={String(item.eggBatchNo || '')} onChange={e => updateItem({ eggBatchNo: e.target.value })} placeholder="مثلاً: B-102" />
              </Field>
              <Field label="تاریخ تولید تخم">
                <Input value={String(item.eggDate || '')} onChange={e => updateItem({ eggDate: e.target.value })} placeholder="1405/07/20" />
              </Field>
            </Grid2>
            <Grid2>
              <Field label="تعداد شکسته">
                <Input mode="number" value={item.brokenEggCount !== null && item.brokenEggCount !== undefined ? String(item.brokenEggCount) : ''} onChange={e => updateItem({ brokenEggCount: Math.round(parseFaNum(e.target.value)) || null })} unit="عدد" min={0} />
              </Field>
              <Field label="مبدأ / مرغداری مادر">
                <Input value={String(item.sourceFarm || '')} onChange={e => updateItem({ sourceFarm: e.target.value })} placeholder="مثلاً: مرغداری آدینه" />
              </Field>
            </Grid2>
          </>
        )}

        {category !== 'adult' && sellerSlot}
      </div>
    );
  }

  // ========== تخم خوراکی (برای فروش) ==========
  if (!isPurchase && category === 'egg') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <Field label="گله مبدأ" required>
          <SmartSelect value={String(item.flockId || '')} onChange={v => updateItem({ flockId: v })} options={activeFlocks} placeholder="— انتخاب کنید —" modalTitle="انتخاب گله" autoThreshold={6} />
        </Field>
        <Grid2>
          {sellerSlot || <div />}
          <Field label="مبنای قیمت">
            <Select value={String(item.priceUnit || 'per_unit')} onChange={e => updateItem({ priceUnit: e.target.value as PriceUnit })}>
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

  // ========== دان ==========
  if (category === 'feed') {
    const totalWeight = (Number(item.bagWeight) || 0) * (Number(item.bagCount) || 0);
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <Field label="اتصال به کالای انبار" hint="برای کسر/اضافه شدن خودکار به موجودی انبار">
          <SmartSelect value={String(item.stockItemId || '')} onChange={v => updateItem({ stockItemId: v })} options={(whsItems || []).map(i => ({ value: i.id, label: i.name }))} placeholder="— انتخاب کالا —" modalTitle="انتخاب کالای انبار" autoThreshold={6} />
        </Field>
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
          <Field label="وزن هر کیسه (kg)">
            <Input mode="number" value={item.bagWeight !== null && item.bagWeight !== undefined ? String(item.bagWeight) : ''} onChange={e => updateItem({ bagWeight: parseFaNum(e.target.value) || null })} unit="kg" min={0} />
          </Field>
          <Field label="تعداد کیسه">
            <Input mode="number" value={item.bagCount !== null && item.bagCount !== undefined ? String(item.bagCount) : ''} onChange={e => updateItem({ bagCount: Math.round(parseFaNum(e.target.value)) || null })} unit="کیسه" min={0} />
          </Field>
        </Grid2>
        {totalWeight > 0 && (
          <div style={{ padding: 'var(--pad-tight)', background: 'var(--accent-soft)', borderRadius: 'var(--r-sm)', color: 'var(--accent)', fontSize: 'var(--fs-sm)', fontWeight: 600, textAlign: 'center' }}>
            وزن کل محاسبه‌شده: {totalWeight.toLocaleString('fa-IR')} کیلوگرم
          </div>
        )}
        <Grid2>
          <Field label="شماره بچ تولید">
            <Input value={String(item.batchNo || '')} onChange={e => updateItem({ batchNo: e.target.value })} placeholder="مثلاً: F-123" />
          </Field>
          <Field label="تاریخ انقضا">
            <Input value={String(item.expiryDate || '')} onChange={e => updateItem({ expiryDate: e.target.value })} placeholder="1405/12/29" />
          </Field>
        </Grid2>
        
        <div style={{ fontWeight: 700, fontSize: 'var(--fs-sm)', color: 'var(--muted)', marginTop: 4 }}>مشخصات تغذیه‌ای</div>
        <Grid2>
          <Field label="درصد پروتئین">
            <Input mode="number" value={item.protein !== null && item.protein !== undefined ? String(item.protein) : ''} onChange={e => updateItem({ protein: parseFaNum(e.target.value) || null })} unit="٪" min={0} max={100} />
          </Field>
          <Field label="انرژی (کیلوکالری)">
            <Input mode="number" value={item.energy !== null && item.energy !== undefined ? String(item.energy) : ''} onChange={e => updateItem({ energy: parseFaNum(e.target.value) || null })} unit="Kcal" min={0} />
          </Field>
        </Grid2>
        <Grid2>
          <Field label="چربی">
            <Input mode="number" value={item.fat !== null && item.fat !== undefined ? String(item.fat) : ''} onChange={e => updateItem({ fat: parseFaNum(e.target.value) || null })} unit="٪" min={0} />
          </Field>
          <Field label="فیبر">
            <Input mode="number" value={item.fiber !== null && item.fiber !== undefined ? String(item.fiber) : ''} onChange={e => updateItem({ fiber: parseFaNum(e.target.value) || null })} unit="٪" min={0} />
          </Field>
        </Grid2>
        <Grid2>
          <Field label="کلسیم">
            <Input mode="number" value={item.calcium !== null && item.calcium !== undefined ? String(item.calcium) : ''} onChange={e => updateItem({ calcium: parseFaNum(e.target.value) || null })} unit="٪" min={0} />
          </Field>
          <Field label="فسفر">
            <Input mode="number" value={item.phosphorus !== null && item.phosphorus !== undefined ? String(item.phosphorus) : ''} onChange={e => updateItem({ phosphorus: parseFaNum(e.target.value) || null })} unit="٪" min={0} />
          </Field>
        </Grid2>
        <Grid2>
          <Field label="متیونین">
            <Input mode="number" value={item.methionine !== null && item.methionine !== undefined ? String(item.methionine) : ''} onChange={e => updateItem({ methionine: parseFaNum(e.target.value) || null })} unit="٪" min={0} />
          </Field>
          <Field label="لیزین">
            <Input mode="number" value={item.lysine !== null && item.lysine !== undefined ? String(item.lysine) : ''} onChange={e => updateItem({ lysine: parseFaNum(e.target.value) || null })} unit="٪" min={0} />
          </Field>
        </Grid2>

        <Field label="گله مقصد" hint="هزینه به این گله متصل می‌شود">
          <SmartSelect value={String(item.flockId || '')} onChange={v => updateItem({ flockId: v })} options={activeFlocks} placeholder="— بدون گله —" modalTitle="انتخاب گله" autoThreshold={6} />
        </Field>
        {sellerSlot}
      </div>
    );
  }

  // ========== تجهیزات ==========
  if (category === 'equipment') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <Grid2>
          <Field label="مدل / نوع">
            <Input value={String(item.model || '')} onChange={e => updateItem({ model: e.target.value })} placeholder="مثلاً: فن تونلی ۱۲۰" />
          </Field>
          <Field label="شماره سریال">
            <Input value={String(item.serialNo || '')} onChange={e => updateItem({ serialNo: e.target.value })} placeholder="SN-123456" />
          </Field>
        </Grid2>
        <Grid2>
          <Field label="مدت گارانتی (ماه)">
            <Input mode="number" value={item.warrantyMonths !== null && item.warrantyMonths !== undefined ? String(item.warrantyMonths) : ''} onChange={e => updateItem({ warrantyMonths: Math.round(parseFaNum(e.target.value)) || null })} unit="ماه" min={0} />
          </Field>
          <Field label="سالن مقصد" hint="تجهیز در این سالن نصب می‌شود">
            <SmartSelect value={String(item.hallId || '')} onChange={v => updateItem({ hallId: v })} options={halls.map(h => ({ value: h.id, label: h.name }))} placeholder="— انتخاب سالن —" modalTitle="انتخاب سالن" autoThreshold={6} />
          </Field>
        </Grid2>
        {sellerSlot}
      </div>
    );
  }

  // ========== سایر ==========
  if (category === 'other') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <Field label="نوع هزینه" hint="دسته‌بندی هزینه برای گزارش‌های مالی">
          <Select value={String(item.costType || '')} onChange={e => updateItem({ costType: e.target.value })}>
            <option value="">— انتخاب —</option>
            <option value="transport">حمل و نقل (کرایه)</option>
            <option value="labor">دستمزد و کارگر</option>
            <option value="utilities">قبوض (آب، برق، گاز)</option>
            <option value="maintenance">تعمیرات و نگهداری</option>
            <option value="packaging">بسته‌بندی (کارتن، سبد)</option>
            <option value="other">سایر هزینه‌ها</option>
          </Select>
        </Field>
        <Field label="گله مقصد (اختیاری)" hint="برای سرشکن کردن هزینه روی گله">
          <SmartSelect value={String(item.flockId || '')} onChange={v => updateItem({ flockId: v })} options={activeFlocks} placeholder="— بدون گله —" modalTitle="انتخاب گله" autoThreshold={6} />
        </Field>
        {sellerSlot}
      </div>
    );
  }

  return null;
}
