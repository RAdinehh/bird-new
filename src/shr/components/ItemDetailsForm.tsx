import { Field, Grid2, Grid3, Input, Select } from './ui';
import SmartSelect from './SmartSelect';
import { useBrd } from '../../mod/brd/store';
import { useHal } from '../../mod/hal/store';
import { useFlk } from '../../mod/flk/store';
import { useWhs } from '../../mod/whs/store';
import { useInc } from '../../mod/inc/store';
import { parseFaNum, toEn } from '../utils/fa';
import { differenceInCalendarDays, parse as parseJ, format as formatJ, subDays, isValid } from 'date-fns-jalali';
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
  model?: string;
  serialNo?: string;
  warrantyMonths?: number | null;
  costType?: string;
  stockItemId?: string;
  existingFlockId?: string;
  deviceId?: string;
}

interface Props {
  category: string;
  item: ItemDetailFormData;
  updateItem: (patch: Partial<ItemDetailFormData>) => void;
  isPurchase?: boolean;
  invoiceDate?: string;
  sellerSlot?: React.ReactNode;
}

const SecTitle = ({ icon, title }: { icon: string; title: string }) => (
  <div style={{ paddingTop: 12, fontSize: 'var(--fs-sm)', fontWeight: 700, color: 'var(--text)', letterSpacing: '.3px', borderTop: '1px dashed var(--border)', marginBottom: 8 }}>
    {icon} {title}
  </div>
);

export default function ItemDetailsForm({ category, item, updateItem, isPurchase = false, invoiceDate, sellerSlot }: Props) {
  const { birds, breeds } = useBrd();
  const { halls, zones } = useHal();
  const { flocks } = useFlk();
  const { items: whsItems } = useWhs();
  const incDevices = useInc((s: any) => s.devices || []) as any[];

  const breedsForBird = birds.filter(b => b.id === item.birdId).length
    ? breeds.filter(b => b.birdId === item.birdId)
    : breeds;

  const activeFlocks = flocks.filter(f => f.status === 'active').map(f => ({ value: f.id, label: f.name }));
  const birdObj = birds.find(b => b.id === item.birdId);
  const breedObj = breeds.find(b => b.id === item.breedId);
  const autoFlockName = `گله ${breedObj?.name || birdObj?.name || '...'} — ${invoiceDate || '...'}`;
  const isEggCategory = isPurchase ? category === 'egg' : category === 'fertile_egg';

  // ========== جوجه یک‌روزه ==========
  if (category === 'chick') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <SecTitle icon="🧬" title="اطلاعات گله" />
        {isPurchase && (
          <Field label="اتصال به گله موجود" hint="اگر قبلاً گله را دستی ساخته‌اید">
            <SmartSelect
              value={String(item.existingFlockId || '')}
              onChange={v => updateItem({ existingFlockId: v, flockId: v })}
              options={flocks.filter(f => f.status === 'active' && !f.sourceInvoiceId).map(f => ({ value: f.id, label: f.name }))}
              placeholder="— ایجاد گله جدید —"
              modalTitle="انتخاب گله"
            />
          </Field>
        )}
        <Grid2>
          <Field label="نوع پرنده" required>
            <SmartSelect value={String(item.birdId || '')} onChange={v => updateItem({ birdId: v, breedId: '' })} options={birds.map(b => ({ value: b.id, label: b.name }))} placeholder="— انتخاب —" modalTitle="انتخاب پرنده" autoThreshold={6} />
          </Field>
          <Field label="نژاد" required>
            <SmartSelect value={String(item.breedId || '')} onChange={v => updateItem({ breedId: v })} options={breedsForBird.map(b => ({ value: b.id, label: b.name }))} placeholder="— انتخاب —" modalTitle="انتخاب نژاد" autoThreshold={6} />
          </Field>
        </Grid2>
        <Grid2>
          <Field label="نام گله (اختیاری)" hint={`در صورت خالی بودن، "${autoFlockName}" انتخاب می‌شود`}>
            <Input value={String(item.flockName || '')} onChange={e => updateItem({ flockName: e.target.value })} placeholder={autoFlockName} />
          </Field>
          <Field label="بچ هچری (اختیاری)" hint="اگر فروشنده شماره بچ داده است وارد کنید">
            <Input value={String(item.hatcheryBatchNo || '')} onChange={e => updateItem({ hatcheryBatchNo: e.target.value })} placeholder="H-99" />
          </Field>
        </Grid2>
        <Grid2>
          <Field label="سالن مقصد">
            <SmartSelect value={String(item.hallId || '')} onChange={v => updateItem({ hallId: v, zoneId: '' })} options={halls.map(h => ({ value: h.id, label: h.name }))} placeholder="— سالن —" modalTitle="انتخاب سالن" autoThreshold={6} />
          </Field>
          <Field label="بخش مقصد">
            <SmartSelect value={String(item.zoneId || '')} onChange={v => updateItem({ zoneId: v })} options={zones.filter(z => z.hallId === item.hallId).map(z => ({ value: z.id, label: z.name }))} placeholder={item.hallId ? "— بخش —" : "اول سالن"} modalTitle="انتخاب بخش" autoThreshold={6} />
          </Field>
        </Grid2>
        <Grid2>
          <Field label="تاریخ هچ" required>
            <DatePicker value={String(item.hatchDate || '')} onChange={v => {
              let age = null;
              if (v && invoiceDate) {
                try {
                  const d1 = parseJ(toEn(v), 'yyyy/MM/dd', new Date());
                  const d2 = parseJ(toEn(invoiceDate), 'yyyy/MM/dd', new Date());
                  if (isValid(d1) && isValid(d2)) age = Math.max(0, differenceInCalendarDays(d2, d1));
                } catch {}
              }
              updateItem({ hatchDate: v, ageDays: age });
            }} placeholder="1405/07/26" autoToday />
          </Field>
          <Field label="سن (روز)" hint="با تغییر سن، تاریخ هچ محاسبه می‌شود">
            <Input mode="number" value={item.ageDays !== null && item.ageDays !== undefined ? String(item.ageDays) : ''} onChange={e => {
              let age = Math.round(parseFaNum(e.target.value)) || null;
              if (age !== null && age > 150) age = 150;
              let hDate = item.hatchDate;
              if (age !== null && invoiceDate) {
                try {
                  const d2 = parseJ(toEn(invoiceDate), 'yyyy/MM/dd', new Date());
                  if (isValid(d2)) hDate = formatJ(subDays(d2, age), 'yyyy/MM/dd');
                } catch {}
              }
              updateItem({ ageDays: age, hatchDate: hDate });
            }} unit="روز" min={0} max={150} />
          </Field>
        </Grid2>
        
        <Grid2>
          <Field label="تعداد کل (خریداری شده)" hint="از بخش اقلام بالا">
            <Input disabled value={item.quantity || 0} unit="عدد" style={{ background: 'var(--bg)', color: 'var(--muted)' }} />
          </Field>
          <Field label="وزن اولیه (گرم)" hint="حداکثر ۱۰۰ گرم">
            <Input mode="number" value={item.chickWeight !== null && item.chickWeight !== undefined ? String(item.chickWeight) : ''} onChange={e => {
              let v = parseFaNum(e.target.value) || null;
              if (v !== null && v > 100) v = 100;
              updateItem({ chickWeight: v });
            }} unit="g" min={20} max={100} />
          </Field>
        </Grid2>

        <Grid3>
          <Field label="تعداد نر (اختیاری)">
            <Input mode="number" value={item.maleCount !== null && item.maleCount !== undefined ? String(item.maleCount) : ''} onChange={e => {
              let v = Math.round(parseFaNum(e.target.value)) || null;
              if (v !== null && v > (item.quantity || 0)) v = item.quantity || 0;
              updateItem({ maleCount: v });
            }} min={0} max={item.quantity || undefined} />
          </Field>
          <Field label="تعداد ماده (اختیاری)">
            <Input mode="number" value={item.femaleCount !== null && item.femaleCount !== undefined ? String(item.femaleCount) : ''} onChange={e => {
              let v = Math.round(parseFaNum(e.target.value)) || null;
              if (v !== null && v > (item.quantity || 0)) v = item.quantity || 0;
              updateItem({ femaleCount: v });
            }} min={0} max={item.quantity || undefined} />
          </Field>
          <Field label="نامشخص (اختیاری)" hint="برای مخلوط">
            <Input mode="number" value={item.unknownCount !== null && item.unknownCount !== undefined ? String(item.unknownCount) : ''} onChange={e => {
              let v = Math.round(parseFaNum(e.target.value)) || null;
              if (v !== null && v > (item.quantity || 0)) v = item.quantity || 0;
              updateItem({ unknownCount: v });
            }} min={0} max={item.quantity || undefined} />
          </Field>
        </Grid3>
        
        {(() => {
          const q = item.quantity || 0;
          if (!q) return null;
          
          const hasMale = item.maleCount !== null && item.maleCount !== undefined;
          const hasFemale = item.femaleCount !== null && item.femaleCount !== undefined;
          const hasUnknown = item.unknownCount !== null && item.unknownCount !== undefined;
          const hasAny = hasMale || hasFemale || hasUnknown;
          
          if (!hasAny) return null; 

          const sum = (item.maleCount || 0) + (item.femaleCount || 0) + (item.unknownCount || 0);
          if (sum === 0) return null;

          const diff = q - sum;
          if (diff === 0) return (
            <div style={{ color: 'var(--accent)', fontSize: 'var(--fs-xs)', fontWeight: 600, padding: '6px 10px', background: 'var(--accent-soft)', borderRadius: 'var(--r-sm)' }}>
              ✅ مجموع نر + ماده + نامشخص با تعداد کل برابر است.
            </div>
          );
          if (diff < 0) return (
            <div style={{ color: 'var(--danger)', fontSize: 'var(--fs-xs)', fontWeight: 600, padding: '6px 10px', background: 'var(--danger-soft)', borderRadius: 'var(--r-sm)' }}>
              ⚠️ مجموع نر + ماده + نامشخص ({sum}) از تعداد کل ({q}) بیشتر است. لطفاً اصلاح کنید.
            </div>
          );
          return (
            <div style={{ color: 'var(--warn)', fontSize: 'var(--fs-xs)', fontWeight: 600, padding: '6px 10px', background: 'var(--warn-soft)', borderRadius: 'var(--r-sm)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>⚠️ مجموع وارد شده ({sum}) با تعداد کل ({q}) برابر نیست. ({diff} عدد مانده)</span>
              <button type="button" onClick={() => updateItem({ unknownCount: (item.unknownCount || 0) + diff })} style={{ background: 'var(--warn)', color: '#fff', border: 'none', borderRadius: '4px', padding: '2px 8px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700 }}>پر کردن نامشخص</button>
            </div>
          );
        })()}
        
        {sellerSlot}
      </div>
    );
  }

  // ========== تخم نطفه‌دار ==========
  if (isEggCategory) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <SecTitle icon="🥚" title="اطلاعات تخم نطفه‌دار" />
        <Grid2>
          <Field label="نوع پرنده" required>
            <SmartSelect value={String(item.birdId || '')} onChange={v => updateItem({ birdId: v, breedId: '' })} options={birds.map(b => ({ value: b.id, label: b.name }))} placeholder="— انتخاب —" modalTitle="انتخاب پرنده" autoThreshold={6} />
          </Field>
          <Field label="نژاد" required>
            <SmartSelect value={String(item.breedId || '')} onChange={v => updateItem({ breedId: v })} options={breedsForBird.map(b => ({ value: b.id, label: b.name }))} placeholder="— انتخاب —" modalTitle="انتخاب نژاد" autoThreshold={6} />
          </Field>
        </Grid2>
        <Grid2>
          <Field label="شماره بچ تخم" required>
            <Input value={String(item.eggBatchNo || '')} onChange={e => updateItem({ eggBatchNo: e.target.value })} placeholder="B-102" />
          </Field>
          <Field label="مبدأ / مرغداری مادر" hint="برای ردیابی">
            <Input value={String(item.sourceFarm || '')} onChange={e => updateItem({ sourceFarm: e.target.value })} placeholder="آدینه" />
          </Field>
        </Grid2>
        <Grid2>
          <Field label="تاریخ تولید تخم" required>
            <DatePicker value={String(item.eggDate || '')} onChange={v => updateItem({ eggDate: v })} placeholder="1405/07/20" autoToday />
          </Field>
          <Field label="دستگاه جوجه‌کشی" hint="برای ثبت خودکار در جوجه‌کشی">
            <SmartSelect value={String(item.deviceId || '')} onChange={v => updateItem({ deviceId: v })} options={incDevices.map((d: any) => ({ value: d.id, label: d.name }))} placeholder="— بدون دستگاه —" modalTitle="انتخاب دستگاه" autoThreshold={6} />
          </Field>
        </Grid2>
        <Grid2>
          <Field label="تعداد شکسته">
            <Input mode="number" value={item.brokenEggCount !== null && item.brokenEggCount !== undefined ? String(item.brokenEggCount) : ''} onChange={e => updateItem({ brokenEggCount: Math.round(parseFaNum(e.target.value)) || null })} unit="عدد" min={0} max={item.quantity || undefined} />
          </Field>
          <Field label="غیرقابل جوجه">
            <Input mode="number" value={item.nonIncubableCount !== null && item.nonIncubableCount !== undefined ? String(item.nonIncubableCount) : ''} onChange={e => updateItem({ nonIncubableCount: Math.round(parseFaNum(e.target.value)) || null })} unit="عدد" min={0} max={item.quantity || undefined} />
          </Field>
        </Grid2>
        {sellerSlot}
      </div>
    );
  }

  // ========== پرنده بالغ ==========
  if (category === 'adult') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <SecTitle icon="🐓" title="اطلاعات پرنده بالغ" />
        {isPurchase && (
          <Field label="اتصال به گله موجود" hint="اگر قبلاً گله را دستی ساخته‌اید">
            <SmartSelect
              value={String(item.existingFlockId || '')}
              onChange={v => updateItem({ existingFlockId: v, flockId: v })}
              options={flocks.filter(f => f.status === 'active' && !f.sourceInvoiceId).map(f => ({ value: f.id, label: f.name }))}
              placeholder="— ایجاد گله جدید —"
              modalTitle="انتخاب گله"
            />
          </Field>
        )}
        <Grid2>
          <Field label="نوع پرنده" required>
            <SmartSelect value={String(item.birdId || '')} onChange={v => updateItem({ birdId: v, breedId: '' })} options={birds.map(b => ({ value: b.id, label: b.name }))} placeholder="— انتخاب —" modalTitle="انتخاب پرنده" autoThreshold={6} />
          </Field>
          <Field label="نژاد" required>
            <SmartSelect value={String(item.breedId || '')} onChange={v => updateItem({ breedId: v })} options={breedsForBird.map(b => ({ value: b.id, label: b.name }))} placeholder="— انتخاب —" modalTitle="انتخاب نژاد" autoThreshold={6} />
          </Field>
        </Grid2>
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

  // ========== دان ==========
  if (category === 'feed') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <SecTitle icon="🌾" title="اطلاعات دان" />
        <Field label="اتصال به انبار" hint="برای موجودی و ثبت خودکار">
          <SmartSelect value={String(item.stockItemId || '')} onChange={v => updateItem({ stockItemId: v })} options={(whsItems || []).map(i => ({ value: i.id, label: i.name }))} placeholder="— انتخاب کالای انبار —" modalTitle="انتخاب کالای انبار" autoThreshold={6} />
        </Field>
        <Grid2>
          <Field label="تاریخ انقضا">
            <DatePicker value={String(item.expiryDate || '')} onChange={v => updateItem({ expiryDate: v })} placeholder="1405/12/29" />
          </Field>
          <Field label="گله مقصد" hint="هزینه به این گله متصل می‌شود">
            <SmartSelect value={String(item.flockId || '')} onChange={v => updateItem({ flockId: v })} options={activeFlocks} placeholder="— بدون گله —" modalTitle="انتخاب گله" autoThreshold={6} />
          </Field>
        </Grid2>
        {sellerSlot}
      </div>
    );
  }

  // ========== دارو ==========
  if (category === 'medicine') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <SecTitle icon="💊" title="اطلاعات دارو" />
        <Grid2>
          <Field label="تاریخ انقضا">
            <DatePicker value={String(item.expiryDate || '')} onChange={v => updateItem({ expiryDate: v })} placeholder="1405/12/29" />
          </Field>
          <Field label="گله مقصد" hint="هزینه به این گله متصل می‌شود">
            <SmartSelect value={String(item.flockId || '')} onChange={v => updateItem({ flockId: v })} options={activeFlocks} placeholder="— بدون گله —" modalTitle="انتخاب گله" autoThreshold={6} />
          </Field>
        </Grid2>
        {sellerSlot}
      </div>
    );
  }

  // ========== تجهیزات ==========
  if (category === 'equipment') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <SecTitle icon="⚙️" title="اطلاعات تجهیز" />
        <Grid2>
          <Field label="مدل / نوع" required>
            <Input value={String(item.model || '')} onChange={e => updateItem({ model: e.target.value })} placeholder="فن تونلی ۱۲۰" />
          </Field>
          <Field label="شماره سریال">
            <Input value={String(item.serialNo || '')} onChange={e => updateItem({ serialNo: e.target.value })} placeholder="SN-123456" />
          </Field>
        </Grid2>
        <Grid2>
          <Field label="گارانتی (ماه)">
            <Input mode="number" value={item.warrantyMonths !== null && item.warrantyMonths !== undefined ? String(item.warrantyMonths) : ''} onChange={e => updateItem({ warrantyMonths: Math.round(parseFaNum(e.target.value)) || null })} unit="ماه" min={0} max={60} />
          </Field>
          <Field label="سالن مقصد" hint="محل نصب تجهیز">
            <SmartSelect value={String(item.hallId || '')} onChange={v => updateItem({ hallId: v })} options={halls.map(h => ({ value: h.id, label: h.name }))} placeholder="— سالن —" modalTitle="انتخاب سالن" autoThreshold={6} />
          </Field>
        </Grid2>
        {sellerSlot}
      </div>
    );
  }

  // ========== سایر ==========
  if (category === 'other') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <SecTitle icon="📋" title="اطلاعات هزینه" />
        <Grid2>
          <Field label="نوع هزینه" hint="برای گزارش‌های مالی" required>
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
        {sellerSlot}
      </div>
    );
  }

  return null;
}
