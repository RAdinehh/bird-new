import { Field, Grid2, Grid3, Input, Select , NumField} from './ui';
import SmartSelect from './SmartSelect';
import { useBrd } from '../../mod/brd/store';
import { useHal } from '../../mod/hal/store';
import { useFlk } from '../../mod/flk/store';
import { useWhs } from '../../mod/whs/store';
import { useInc } from '../../mod/inc/store';
import { parseFaNum, toEn, toFa, formatQty } from '../utils/fa';
import { differenceInCalendarDays, parse as parseJ, format as formatJ, subDays, isValid } from 'date-fns-jalali';
import DatePicker from './DatePicker';
import { typesForCategory } from '../../mod/hal/_equipHelpers';
import { kindForType } from '../../mod/hal/api/equipmentCalc';
import { getEquipLabel } from '../../mod/hal/_typedLabels';
import { HELP } from '../help/helpTexts';

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
  chickWeight?: number | null;
  transportCost?: number | null;
  flockName?: string;
  eggDate?: string;
  brokenEggCount?: number | null;
  nonIncubableCount?: number | null;
  expiryDate?: string;
  model?: string;
  warrantyMonths?: number | null;
  costType?: string;
  stockItemId?: string;
  existingFlockId?: string;
  deviceId?: string;
  equipmentCategory?: string;
  equipmentKind?: string;
  equipmentType?: string;
  equipmentStatus?: string;
  brand?: string;
  // 🆕 فیلدهای فروش
  liveWeight?: number | null;
  priceUnit?: string;
  saleReason?: string;
  eggWeight?: number | null;
  eggTypes?: any[];
  withdrawalDays?: number | null;
  equipmentId?: string;
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
  const { halls, zones, equipment: halEquipment = [] } = useHal();
  const { flocks } = useFlk();
  const { items: whsItems } = useWhs();
  const incDevices = useInc((s: any) => s.devices || []) as any[];

  const breedsForBird = birds.filter(b => b.id === item.birdId).length
    ? breeds.filter(b => b.birdId === item.birdId)
    : breeds;

  const activeFlocks = flocks.filter(f => f.status === 'active').map(f => ({ value: f.id, label: f.name }));
  const birdObj = birds.find(b => b.id === item.birdId);
  const breedObj = breeds.find(b => b.id === item.breedId);
    const isEggCategory = isPurchase ? category === 'egg' : category === 'fertile_egg';

  const nameFieldJsx = (
    <Field
      label={
        category === 'herbal' ? 'نام داروی گیاهی' :
        category === 'medicine' ? 'نام دارو' :
        category === 'feed' ? 'نام دان' :
        category === 'vaccine' ? 'نام واکسن' :
        category === 'equipment' ? 'نام تجهیز' :
        category === 'chick' ? 'نام گله / جوجه' :
        category === 'egg' || category === 'fertile_egg' ? 'نام تخم' :
        category === 'adult' ? 'نام پرنده' :
        category === 'manure' ? 'نام کود' :
        'نام کالا / شرح'
      }
      required
    >
      <Input
        placeholder={
          category === 'feed' ? 'ذرت، سویا، کنجاله' :
          category === 'medicine' ? 'آنتی‌بیوتیک، ویتامین' :
          category === 'herbal' ? 'آویشن، پودر سیر' :
          category === 'vaccine' ? 'نیوکاسل، برونشیت' :
          category === 'equipment' ? 'فن تونلی ۱۲۰' :
          category === 'chick' ? 'جوجه گوشتی راس' :
          category === 'egg' || category === 'fertile_egg' ? 'تخم نطفه‌دار' :
          category === 'adult' ? 'مرغ مادر' :
          category === 'manure' ? 'کود مرغی' :
          'نام کالا یا شرح'
        }
        value={String(item.description || '')}
        onChange={e => updateItem({ description: e.target.value })}
      />
    </Field>
  );


  // ========== جوجه یک‌روزه ==========
  if (category === 'chick') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {nameFieldJsx}
        <SecTitle icon="🧬" title="اطلاعات گله" />
              <Grid2>
                {isPurchase && (
                  <Field label="اتصال به گله موجود" hint="اتصال به گله دستی">
                    <SmartSelect value={String(item.existingFlockId || '')} onChange={v => updateItem({ existingFlockId: v, flockId: v })} options={flocks.filter(f => f.status === 'active').map(f => ({ value: f.id, label: f.name }))} placeholder="— ایجاد گله جدید —" modalTitle="انتخاب گله" />
                  </Field>
                )}

              </Grid2>
              <Grid2>
                <Field label="نوع پرنده" required>
                  <SmartSelect value={String(item.birdId || '')} onChange={v => updateItem({ birdId: v, breedId: '' })} options={birds.map(b => ({ value: b.id, label: b.name }))} placeholder="— انتخاب —" modalTitle="انتخاب پرنده" autoThreshold={6} />
                </Field>
                <Field label="نژاد" required>
                  <SmartSelect value={String(item.breedId || '')} onChange={v => updateItem({ breedId: v })} options={breedsForBird.map(b => ({ value: b.id, label: b.name }))} placeholder="— انتخاب —" modalTitle="انتخاب نژاد" autoThreshold={6} disabled={!!item.existingFlockId} />
                </Field>
              </Grid2>
        {isPurchase ? (
        <Grid2>
          <Field label="سالن مقصد">
            <SmartSelect value={String(item.hallId || '')} onChange={v => updateItem({ hallId: v, zoneId: '' })} options={halls.map(h => ({ value: h.id, label: h.name }))} placeholder="— سالن —" modalTitle="انتخاب سالن" autoThreshold={6} />
          </Field>
          <Field label="بخش مقصد (اختیاری)">
            <SmartSelect value={String(item.zoneId || '')} onChange={v => updateItem({ zoneId: v })} options={zones.filter(z => z.hallId === item.hallId).map(z => ({ value: z.id, label: z.name }))} placeholder="— انتخاب بخش —" disabled={!item.hallId} modalTitle="انتخاب بخش" autoThreshold={6} />
          </Field>
        </Grid2>
        ) : (
          <Field label="گله مبدأ" required hint="گله‌ای که جوجه از آن فروخته می‌شود">
            <SmartSelect value={String(item.flockId || '')} onChange={v => updateItem({ flockId: v })} options={activeFlocks} placeholder="— انتخاب گله —" modalTitle="انتخاب گله" autoThreshold={6} />
          </Field>
        )}
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
            <Input mode="number" value={item.ageDays != null && item.ageDays > 0 ? String(item.ageDays) : ''} onChange={e => {
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
          <Field label={isPurchase ? "تعداد کل (خریداری شده)" : "تعداد"} hint="از بخش اقلام بالا">
            <Input disabled value={item.quantity && item.quantity > 0 ? toFa(String(item.quantity)) : ''} unit="عدد" placeholder="از بخش اقلام بالا" style={{ background: 'var(--bg)', color: 'var(--muted)' }} />
          </Field>
          {isPurchase && (
          <Field label="وزن اولیه (گرم)" hint="حداکثر ۱۰۰ گرم">
            <Input mode="number" value={item.chickWeight != null && item.chickWeight > 0 ? String(item.chickWeight) : ''} onChange={e => {
              let v = parseFaNum(e.target.value) || null;
              if (v !== null && v > 100) v = 100;
              updateItem({ chickWeight: v });
            }} unit="g" min={20} max={100} />
          </Field>
          )}
        </Grid2>

        <div style={{ display: (item.quantity || 0) > 0 ? 'contents' : 'none' }}>
<Grid3>
          <Field label="نر">
            <Input mode="number" value={item.maleCount != null && item.maleCount > 0 ? String(item.maleCount) : ''} onChange={e => {
              let v = Math.round(parseFaNum(e.target.value)) || null;
              if (v !== null && v > (item.quantity || 0)) v = item.quantity || 0;
              updateItem({ maleCount: v });
            }} min={0} max={item.quantity || undefined} />
          </Field>
          <Field label="ماده">
            <Input mode="number" value={item.femaleCount != null && item.femaleCount > 0 ? String(item.femaleCount) : ''} onChange={e => {
              let v = Math.round(parseFaNum(e.target.value)) || null;
              if (v !== null && v > (item.quantity || 0)) v = item.quantity || 0;
              updateItem({ femaleCount: v });
            }} min={0} max={item.quantity || undefined} />
          </Field>
          <Field label="نامشخص" hint="برای جنسیت مخلوط">
            <Input mode="number" value={item.unknownCount != null && item.unknownCount > 0 ? String(item.unknownCount) : ''} onChange={e => {
              let v = Math.round(parseFaNum(e.target.value)) || null;
              if (v !== null && v > (item.quantity || 0)) v = item.quantity || 0;
              updateItem({ unknownCount: v });
            }} min={0} max={item.quantity || undefined} />
          </Field>
        </Grid3>
</div>
        
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
        
        {!isPurchase && (
          <Field label="دلیل فروش">
            <Select value={String(item.saleReason || '')} onChange={e => updateItem({ saleReason: e.target.value })}>
              <option value="">— انتخاب —</option>
              <option value="culling">حذف از گله (کالینگ)</option>
              <option value="sick">بیماری</option>
              <option value="old_age">سن بالا</option>
              <option value="surplus">مازاد</option>
              <option value="breeding_stock">فروش مولد</option>
              <option value="other">سایر</option>
            </Select>
          </Field>
        )}

        {sellerSlot}
      </div>
    );
  }

  // ========== تخم خوراکی (فقط فروش) ==========
  if (!isPurchase && category === 'egg') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {nameFieldJsx}
        <SecTitle icon="🥚" title="اطلاعات تخم خوراکی" />
        <Grid2>
          <Field label="گله مبدأ" required>
            <SmartSelect value={String(item.flockId || '')} onChange={v => updateItem({ flockId: v })} options={activeFlocks} placeholder="— انتخاب گله —" modalTitle="انتخاب گله" autoThreshold={6} />
          </Field>
          <Field label="تاریخ تولید تخم">
            <DatePicker value={String(item.eggDate || '')} onChange={v => updateItem({ eggDate: v })} placeholder="1405/07/20" autoToday />
          </Field>
        </Grid2>
        <Grid2>
          <Field label="وزن تخم (گرم)" hint="اختیاری — برای گریدبندی">
            <Input mode="number" value={item.eggWeight != null && item.eggWeight > 0 ? String(item.eggWeight) : ''} onChange={e => updateItem({ eggWeight: parseFaNum(e.target.value) || null })} unit="g" min={0} max={100} />
          </Field>
          <Field label="تعداد کل">
            <Input disabled value={item.quantity && item.quantity > 0 ? toFa(String(item.quantity)) : ''} unit="عدد" placeholder="از بخش اقلام بالا" style={{ background: 'var(--bg)', color: 'var(--muted)' }} />
          </Field>
        </Grid2>
        {sellerSlot}
      </div>
    );
  }

  // ========== تخم نطفه‌دار ==========
  if (isEggCategory) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {nameFieldJsx}
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
          <Field label="تاریخ تولید تخم" required>
            <DatePicker value={String(item.eggDate || '')} onChange={v => updateItem({ eggDate: v })} placeholder="1405/07/20" autoToday />
          </Field>
          <Field label="دستگاه جوجه‌کشی" hint="برای ثبت خودکار در جوجه‌کشی">
            <SmartSelect value={String(item.deviceId || '')} onChange={v => updateItem({ deviceId: v })} options={incDevices.map((d: any) => ({ value: d.id, label: d.name }))} placeholder="— بدون دستگاه —" modalTitle="انتخاب دستگاه" autoThreshold={6} />
          </Field>
        </Grid2>
        <Grid2>
          <Field label="تعداد شکسته">
            <Input mode="number" value={item.brokenEggCount != null && item.brokenEggCount > 0 ? String(item.brokenEggCount) : ''} onChange={e => updateItem({ brokenEggCount: Math.round(parseFaNum(e.target.value)) || null })} unit="عدد" min={0} max={item.quantity || undefined} />
          </Field>
          <Field label="غیرقابل جوجه">
            <Input mode="number" value={item.nonIncubableCount != null && item.nonIncubableCount > 0 ? String(item.nonIncubableCount) : ''} onChange={e => updateItem({ nonIncubableCount: Math.round(parseFaNum(e.target.value)) || null })} unit="عدد" min={0} max={item.quantity || undefined} />
          </Field>
        </Grid2>
        {(() => {
          const q = item.quantity || 0;
          const broken = item.brokenEggCount || 0;
          const nonInc = item.nonIncubableCount || 0;
          const healthy = Math.max(0, q - broken - nonInc);
          if (q > 0 && (broken > 0 || nonInc > 0)) {
            return (
              <div style={{ color: 'var(--accent)', fontSize: 'var(--fs-xs)', fontWeight: 600, padding: '6px 10px', background: 'var(--accent-soft)', borderRadius: 'var(--r-sm)', marginTop: 4 }}>
                ✅ تعداد قابل جوجه: {toFa(healthy)} عدد (از {toFa(q)} تخم)
              </div>
            );
          }
          return null;
        })()}
        {sellerSlot}
      </div>
    );
  }

  // ========== پرنده بالغ ==========
  if (category === 'adult') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {nameFieldJsx}
        <SecTitle icon="🐓" title="اطلاعات پرنده بالغ" />
        {isPurchase && (
          <Field label="اتصال به گله موجود" hint="اتصال به گله دستی">
            <SmartSelect
              value={String(item.existingFlockId || '')}
              onChange={v => updateItem({ existingFlockId: v, flockId: v })}
              options={flocks.filter(f => f.status === 'active').map(f => ({ value: f.id, label: f.name }))}
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
          <Field label={isPurchase ? "گله مقصد (موجود)" : "گله مبدأ"} required={!isPurchase}>
            <SmartSelect value={String(item.flockId || '')} onChange={v => updateItem({ flockId: v })} options={activeFlocks} placeholder="— انتخاب گله —" modalTitle="انتخاب گله" autoThreshold={6} />
          </Field>
          <Field label="سن (روز)">
            <Input mode="number" value={item.ageDays != null && item.ageDays > 0 ? String(item.ageDays) : ''} onChange={e => updateItem({ ageDays: Math.round(parseFaNum(e.target.value)) || null })} unit="روز" min={0} />
          </Field>
        </Grid2>
        <Grid2>
          <Field label="تعداد نر">
            <Input mode="number" value={item.maleCount != null && item.maleCount > 0 ? String(item.maleCount) : ''} onChange={e => updateItem({ maleCount: Math.round(parseFaNum(e.target.value)) || null })} min={0} />
          </Field>
          <Field label="تعداد ماده">
            <Input mode="number" value={item.femaleCount != null && item.femaleCount > 0 ? String(item.femaleCount) : ''} onChange={e => updateItem({ femaleCount: Math.round(parseFaNum(e.target.value)) || null })} min={0} />
          </Field>
        </Grid2>

        {!isPurchase && (
          <Grid2>
            <Field label="وزن زنده کل (کیلوگرم)" hint="اختیاری">
              <Input mode="number" value={item.liveWeight != null && item.liveWeight > 0 ? String(item.liveWeight) : ''} onChange={e => updateItem({ liveWeight: parseFaNum(e.target.value) || null })} unit="kg" min={0} />
            </Field>
            <Field label="واحد قیمت">
              <Select value={String(item.priceUnit || 'perBird')} onChange={e => updateItem({ priceUnit: e.target.value })}>
                <option value="perBird">به ازای هر پرنده</option>
                <option value="perKg">به ازای هر کیلوگرم</option>
              </Select>
            </Field>
          </Grid2>
        )}

        {!isPurchase && (
          <Field label="دلیل فروش">
            <Select value={String(item.saleReason || '')} onChange={e => updateItem({ saleReason: e.target.value })}>
              <option value="">— انتخاب —</option>
              <option value="culling">حذف از گله (کالینگ)</option>
              <option value="sick">بیماری</option>
              <option value="old_age">سن بالا</option>
              <option value="surplus">مازاد</option>
              <option value="breeding_stock">فروش مولد</option>
              <option value="other">سایر</option>
            </Select>
          </Field>
        )}

        {sellerSlot}
      </div>
    );
  }

  // ========== دان ==========
  if (category === 'feed') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {nameFieldJsx}
        <SecTitle icon="🌾" title="اطلاعات دان" />
        <Field label="اتصال به انبار" hint="برای موجودی و ثبت خودکار" help="اگر این کالا از قبل در انبار ثبت شده، از این لیست انتخابش کن تا موجودی به همان کالا اضافه شود (نه کالای تکراری). اگر خالی بگذاری، سیستم به‌طور خودکار یک کالای جدید در انبار می‌سازد.">
          <SmartSelect value={String(item.stockItemId || '')} onChange={v => updateItem({ stockItemId: v })} options={(whsItems || []).filter(w => w.category === 'feed').map(i => ({ value: i.id, label: `${i.name} — موجودی ${formatQty(i.currentStock, i.unit)}` }))} placeholder="— انتخاب کالای انبار —" modalTitle="انتخاب کالای انبار" autoThreshold={6} />
        </Field>
        <Grid2>
          <Field label="تاریخ انقضا">
            <DatePicker value={String(item.expiryDate || '')} onChange={v => updateItem({ expiryDate: v })} placeholder="1405/12/29" />
          </Field>
          <Field label={isPurchase ? "گله مقصد" : "گله مبدأ"} hint="هزینه به این گله متصل می‌شود" help="اگر این خرید را برای گله مشخصی انجام داده‌ای، گله را انتخاب کن تا هزینه همان لحظه در سود و زیان آن گله ثبت شود. اگر این کالا برای چند گله یا انبار عمومی خریده شده، این فیلد را خالی بگذار؛ هزینه بعداً هنگام مصرف در «ثبت روزانه» به‌طور خودکار روی گله سرشکن می‌شود.">
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
        {nameFieldJsx}
        <SecTitle icon="💊" title="اطلاعات دارو" />
        <Field label="اتصال به انبار" hint="کالای medicine موجود">
          <SmartSelect value={String(item.stockItemId || '')} onChange={v => updateItem({ stockItemId: v })} options={(whsItems || []).filter(w => w.category === 'medicine').map(i => ({ value: i.id, label: `${i.name} — موجودی ${formatQty(i.currentStock, i.unit)}` }))} placeholder="— انتخاب کالای انبار —" modalTitle="انتخاب medicine" autoThreshold={6} />
        </Field>
        <Grid2>
          <Field label="تاریخ انقضا">
            <DatePicker value={String(item.expiryDate || '')} onChange={v => updateItem({ expiryDate: v })} placeholder="1405/12/29" />
          </Field>
          <Field label="دوره پرهیز (روز)" hint="بعد از مصرف، چند روز فروش محصول ممنوع">
            <Input mode="number" value={item.withdrawalDays != null && item.withdrawalDays > 0 ? String(item.withdrawalDays) : ''} onChange={e => updateItem({ withdrawalDays: Math.round(parseFaNum(e.target.value)) || null })} unit="روز" min={0} max={365} />
          </Field>
          <Field label={isPurchase ? "گله مقصد" : "گله مبدأ"} hint="هزینه به این گله متصل می‌شود" help="اگر این خرید را برای گله مشخصی انجام داده‌ای، گله را انتخاب کن تا هزینه همان لحظه در سود و زیان آن گله ثبت شود. اگر این کالا برای چند گله یا انبار عمومی خریده شده، این فیلد را خالی بگذار؛ هزینه بعداً هنگام مصرف در «ثبت روزانه» به‌طور خودکار روی گله سرشکن می‌شود.">
            <SmartSelect value={String(item.flockId || '')} onChange={v => updateItem({ flockId: v })} options={activeFlocks} placeholder="— بدون گله —" modalTitle="انتخاب گله" autoThreshold={6} />
          </Field>
        </Grid2>
        {sellerSlot}
      </div>
    );
  }

  // ========== تجهیزات ==========
  if (category === 'equipment') {
    if (!isPurchase) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {nameFieldJsx}
          <SecTitle icon="⚙️" title="انتخاب تجهیز فروشی" />
          <Field label="تجهیز موجود" required hint="از سالن یا انبار انتخاب کنید">
            <SmartSelect
              value={String(item.equipmentId || '')}
              onChange={v => {
                const eq = (halEquipment || []).find((e: any) => e.id === v);
                if (eq) {
                  updateItem({
                    equipmentId: v,
                    hallId: eq.hallId || '',
                    equipmentCategory: eq.category || '',
                    equipmentType: eq.type || '',
                    equipmentKind: 'asset',
                    description: eq.name || '',
                    brand: eq.brand || '',
                  });
                } else {
                  updateItem({ equipmentId: v });
                }
              }}
              options={(halEquipment || []).map((e: any) => ({
                value: e.id,
                label: `${e.name} — ${e.hallId ? 'در سالن' : 'در انبار'}${e.count ? ` (×${e.count})` : ''}`,
              }))}
              placeholder="— انتخاب تجهیز —"
              modalTitle="انتخاب تجهیز فروشی"
              autoThreshold={6}
            />
          </Field>
          {item.equipmentId && (() => {
            const eq = (halEquipment || []).find((e: any) => e.id === item.equipmentId);
            if (!eq) return null;
            return (
              <div style={{ padding: '10px 12px', background: 'var(--accent-soft)', border: '1px dashed var(--accent)', borderRadius: 'var(--r-md)', fontSize: 'var(--fs-sm)', display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div><b>نام:</b> {eq.name}</div>
                <div><b>دسته:</b> {eq.category || '—'}</div>
                <div><b>تعداد موجود:</b> {eq.count || 0}</div>
                <div><b>قیمت خرید:</b> {eq.unitPrice ? toFa(String(eq.unitPrice)) + ' تومان' : '—'}</div>
              </div>
            );
          })()}
          {sellerSlot}
        </div>
      );
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {nameFieldJsx}
        <SecTitle icon="⚙️" title="اطلاعات تجهیز" />
        <Grid2>
          <Field label="دسته تجهیزات" required>
            <SmartSelect
              value={String(item.equipmentCategory || '')}
              onChange={(v: string) => {
                if (!v) return;
                const nextType = (typesForCategory(v) as string[])[0] || '';
                const defaultKind = nextType ? kindForType(nextType) : 'asset';
                updateItem({ equipmentCategory: v, equipmentType: nextType, equipmentKind: defaultKind });
              }}
              options={[
                { value: 'cooling', label: '❄️ سرمایشی' },
                { value: 'heating', label: '🔥 گرمایشی' },
                { value: 'ventilation', label: '💨 تهویه' },
                { value: 'feeding', label: '🌾 دانخوری' },
                { value: 'drinking', label: '💧 آبخوری' },
                { value: 'lighting', label: '💡 روشنایی' },
                { value: 'litter', label: '🛏️ بستر' },
                { value: 'power', label: '⚡ برق' },
                { value: 'auxiliary', label: '🔌 جانبی' },
                { value: 'water_treatment', label: '💦 تصفیه آب' },
                { value: 'safety', label: '🚨 ایمنی' },
                { value: 'cleaning', label: '🧹 نظافت' },
                { value: 'hand_tools', label: '🔧 ابزار دستی' },
                { value: 'weighing', label: '⚖️ توزین' },
              ]}
              placeholder="— انتخاب —"
              modalTitle="انتخاب دسته تجهیزات"
              autoThreshold={4}
            />
          </Field>
          <Field label="نوع" required>
            <Select value={String(item.equipmentKind || 'asset')} onChange={e => updateItem({ equipmentKind: e.target.value })}>
              <option value="asset">🏗️ دارایی (نصب در سالن)</option>
              <option value="consumable">📦 مصرفی (نگهداری در انبار)</option>
            </Select>
          </Field>
        </Grid2>
        <Grid2>
          <Field label="نوع تجهیز" required hint={!item.equipmentCategory ? 'اول دسته را انتخاب کنید' : undefined}>
            <SmartSelect
              value={String(item.equipmentType || '')}
              onChange={(v: string) => {
                if (!v) return;
                updateItem({ equipmentType: v, equipmentKind: kindForType(v) });
              }}
              options={(typesForCategory(String(item.equipmentCategory || '')) as string[]).map((t: string) => {
                const lbl = getEquipLabel(t);
                return { value: t, label: lbl?.name || t };
              })}
              placeholder={item.equipmentCategory ? '— انتخاب —' : 'اول دسته را انتخاب کنید'}
              modalTitle="انتخاب نوع تجهیز"
              autoThreshold={4}
              disabled={!item.equipmentCategory}
            />
          </Field>
          <Field label="وضعیت تجهیز">
            <Select value={String(item.equipmentStatus || 'new')} onChange={e => updateItem({ equipmentStatus: e.target.value })}>
              <option value="new">نو (دست اول)</option>
              <option value="used">کارکرده (دست دوم)</option>
              <option value="broken">خراب / نیاز به تعمیر</option>
            </Select>
          </Field>
        </Grid2>
        <Grid2>
          <Field label="سالن مقصد (اختیاری)" hint="قابل تغییر بعداً در سالن">
            <SmartSelect value={String(item.hallId || '')} onChange={v => updateItem({ hallId: v, zoneId: '' })} options={halls.map(h => ({ value: h.id, label: h.name }))} placeholder="— سالن —" modalTitle="انتخاب سالن" autoThreshold={6} />
          </Field>
          <Field label="بخش مقصد (اختیاری)">
            <SmartSelect value={String(item.zoneId || '')} onChange={v => updateItem({ zoneId: v })} options={zones.filter(z => z.hallId === item.hallId).map(z => ({ value: z.id, label: z.name }))} placeholder="— انتخاب بخش —" disabled={!item.hallId} modalTitle="انتخاب بخش" autoThreshold={6} />
          </Field>
        </Grid2>
        
                <Grid2>
          <Field label="برند / سازنده">
            <Input value={String(item.brand || '')} onChange={e => updateItem({ brand: e.target.value })} placeholder="پارس، آکو" />
          </Field>
          <Field label="گارانتی (ماه)" hint="تعداد ماه گارانتی">
            <NumField
              placeholder="۱۲"
              value={item.warrantyMonths != null && item.warrantyMonths > 0 ? String(item.warrantyMonths) : ''}
              onChange={e => updateItem({ warrantyMonths: parseFloat(toEn(e.target.value).replace('٫','.')) || null })}
              unit="ماه"
              min={0}
              max={120}
            />
          </Field>
        </Grid2>

        {sellerSlot}
      </div>
    );
  }

  // ========== داروی گیاهی ==========
  if (category === 'herbal') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {nameFieldJsx}
        <SecTitle icon="🌿" title="اطلاعات داروی گیاهی" />
        <Field label="اتصال به انبار" hint="کالای herbal موجود">
          <SmartSelect value={String(item.stockItemId || '')} onChange={v => updateItem({ stockItemId: v })} options={(whsItems || []).filter(w => w.category === 'herbal').map(i => ({ value: i.id, label: `${i.name} — موجودی ${formatQty(i.currentStock, i.unit)}` }))} placeholder="— انتخاب کالای انبار —" modalTitle="انتخاب herbal" autoThreshold={6} />
        </Field>
        <Grid2>
          <Field label="تاریخ انقضا">
            <DatePicker value={String(item.expiryDate || '')} onChange={v => updateItem({ expiryDate: v })} placeholder="1405/12/29" />
          </Field>
          <Field label="دوره پرهیز (روز)" hint="بعد از مصرف، چند روز فروش محصول ممنوع">
            <Input mode="number" value={item.withdrawalDays != null && item.withdrawalDays > 0 ? String(item.withdrawalDays) : ''} onChange={e => updateItem({ withdrawalDays: Math.round(parseFaNum(e.target.value)) || null })} unit="روز" min={0} max={365} />
          </Field>
          <Field label={isPurchase ? "گله مقصد" : "گله مبدأ"} hint="هزینه به این گله متصل می‌شود" help="اگر این خرید را برای گله مشخصی انجام داده‌ای، گله را انتخاب کن تا هزینه همان لحظه در سود و زیان آن گله ثبت شود. اگر این کالا برای چند گله یا انبار عمومی خریده شده، این فیلد را خالی بگذار؛ هزینه بعداً هنگام مصرف در «ثبت روزانه» به‌طور خودکار روی گله سرشکن می‌شود.">
            <SmartSelect value={String(item.flockId || '')} onChange={v => updateItem({ flockId: v })} options={activeFlocks} placeholder="— بدون گله —" modalTitle="انتخاب گله" autoThreshold={6} />
          </Field>
        </Grid2>
        
        {sellerSlot}
      </div>
    );
  }

  // ========== واکسن ==========
  if (category === 'vaccine') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {nameFieldJsx}
        <SecTitle icon="💉" title="اطلاعات واکسن" />
        <Field label="اتصال به انبار" hint="کالای vaccine موجود">
          <SmartSelect value={String(item.stockItemId || '')} onChange={v => updateItem({ stockItemId: v })} options={(whsItems || []).filter(w => w.category === 'vaccine').map(i => ({ value: i.id, label: `${i.name} — موجودی ${formatQty(i.currentStock, i.unit)}` }))} placeholder="— انتخاب کالای انبار —" modalTitle="انتخاب vaccine" autoThreshold={6} />
        </Field>
        <Grid2>
          <Field label="تاریخ انقضا">
            <DatePicker value={String(item.expiryDate || '')} onChange={v => updateItem({ expiryDate: v })} placeholder="1405/12/29" />
          </Field>
          <Field label="دوره پرهیز (روز)" hint="بعد از مصرف، چند روز فروش محصول ممنوع">
            <Input mode="number" value={item.withdrawalDays != null && item.withdrawalDays > 0 ? String(item.withdrawalDays) : ''} onChange={e => updateItem({ withdrawalDays: Math.round(parseFaNum(e.target.value)) || null })} unit="روز" min={0} max={365} />
          </Field>
          <Field label={isPurchase ? "گله مقصد" : "گله مبدأ"} hint="هزینه به این گله متصل می‌شود" help="اگر این خرید را برای گله مشخصی انجام داده‌ای، گله را انتخاب کن تا هزینه همان لحظه در سود و زیان آن گله ثبت شود. اگر این کالا برای چند گله یا انبار عمومی خریده شده، این فیلد را خالی بگذار؛ هزینه بعداً هنگام مصرف در «ثبت روزانه» به‌طور خودکار روی گله سرشکن می‌شود.">
            <SmartSelect value={String(item.flockId || '')} onChange={v => updateItem({ flockId: v })} options={activeFlocks} placeholder="— بدون گله —" modalTitle="انتخاب گله" autoThreshold={6} />
          </Field>
        </Grid2>
        <Grid2>
          <Field label="برند / سازنده">
            <Input value={String(item.brand || '')} onChange={e => updateItem({ brand: e.target.value })} placeholder="نام برند" />
          </Field>
        </Grid2>
        {sellerSlot}
      </div>
    );
  }

  // ========== کود ==========
  if (category === 'manure' && !isPurchase) {
    const manureItems = (whsItems || []).filter(w => w.category === 'manure');
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {nameFieldJsx}
        <SecTitle icon="💩" title="اطلاعات کود" />
        <Field label="اتصال به انبار" hint="کالای کود موجود در انبار">
          <SmartSelect
            value={String(item.stockItemId || '')}
            onChange={v => updateItem({ stockItemId: v })}
            options={manureItems.map(i => ({ value: i.id, label: `${i.name} — موجودی ${formatQty(i.currentStock, i.unit)}` }))}
            placeholder="— انتخاب کالای انبار —"
            modalTitle="انتخاب کالای کود"
            autoThreshold={6}
          />
        </Field>
        <Field label="گله مبدأ" hint="گله‌ای که کود از آن تولید شده">
          <SmartSelect value={String(item.flockId || '')} onChange={v => updateItem({ flockId: v })} options={activeFlocks} placeholder="— بدون گله —" modalTitle="انتخاب گله" autoThreshold={6} />
        </Field>
        {sellerSlot}
      </div>
    );
  }

  // ========== سایر ==========
  if (category === 'other') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {nameFieldJsx}
        <SecTitle icon="📋" title="اطلاعات هزینه" />
        <Grid2>
          {isPurchase && (
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
          )}
          <Field label="گله مقصد (اختیاری)" hint="سرشکن هزینه">
            <SmartSelect value={String(item.flockId || '')} onChange={v => updateItem({ flockId: v })} options={activeFlocks} placeholder="— بدون گله —" modalTitle="انتخاب گله" autoThreshold={6} />
          </Field>
        </Grid2>
        <Grid2>
          <Field label="برند / سازنده">
            <Input value={String(item.brand || '')} onChange={e => updateItem({ brand: e.target.value })} placeholder="نام برند" />
          </Field>
          <Field label="تاریخ انقضا (اختیاری)">
            <DatePicker value={String(item.expiryDate || '')} onChange={v => updateItem({ expiryDate: v })} placeholder="1405/12/29" />
          </Field>
        </Grid2>
        {sellerSlot}
      </div>
    );
  }

  // ========== تخم شکسته (فقط فروش) ==========
  if (category === 'broken') {
    const brokenItems = (whsItems || []).filter((w: any) => w.category === 'broken');
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {nameFieldJsx}
        <SecTitle icon="💔" title="اطلاعات تخم شکسته" />
        <Field label="اتصال به انبار" hint="کالای تخم شکسته موجود">
          <SmartSelect
            value={String(item.stockItemId || '')}
            onChange={v => updateItem({ stockItemId: v })}
            options={brokenItems.map((i: any) => ({ value: i.id, label: `${i.name} — موجودی ${formatQty(i.currentStock, i.unit)}` }))}
            placeholder="— انتخاب کالای انبار —"
            modalTitle="انتخاب کالای تخم شکسته"
            autoThreshold={6}
          />
        </Field>
        <Grid2>
          <Field label="گله مبدأ" required>
            <SmartSelect value={String(item.flockId || '')} onChange={v => updateItem({ flockId: v })} options={activeFlocks} placeholder="— انتخاب گله —" modalTitle="انتخاب گله" autoThreshold={6} />
          </Field>
          <Field label="تاریخ تولید تخم">
            <DatePicker value={String(item.eggDate || '')} onChange={v => updateItem({ eggDate: v })} placeholder="1405/07/20" autoToday />
          </Field>
        </Grid2>
        <Grid2>
          <Field label="تعداد شکسته" hint="اختیاری — جزئیات بیشتر">
            <Input mode="number" value={item.brokenEggCount != null && item.brokenEggCount > 0 ? String(item.brokenEggCount) : ''} onChange={e => updateItem({ brokenEggCount: Math.round(parseFaNum(e.target.value)) || null })} unit="عدد" min={0} />
          </Field>
          <Field label="تعداد کل">
            <Input disabled value={item.quantity && item.quantity > 0 ? toFa(String(item.quantity)) : ''} unit="عدد" placeholder="از بخش اقلام بالا" style={{ background: 'var(--bg)', color: 'var(--muted)' }} />
          </Field>
        </Grid2>
        {sellerSlot}
      </div>
    );
  }

  return null;
}
