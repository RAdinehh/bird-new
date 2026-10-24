import { Field, Grid2, Grid3, Input, Select , NumField} from './ui';
import SmartSelect from './SmartSelect';
import { useBrd } from '../../mod/brd/store';
import { useHal } from '../../mod/hal/store';
import { useFlk, getAgeDays } from '../../mod/flk/store';
import { useEgg } from '../../mod/egg/store';
import { useWhs } from '../../mod/whs/store';
import { useInc, type HatchResult } from '../../mod/inc/store';
import { useState } from 'react';
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
  healthyCount?: number | null;
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
  source?: 'flock' | 'hatch';
  hatchId?: string;
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
  const [hatchOverride, setHatchOverride] = useState(false);
  const { birds, breeds } = useBrd();
  const { halls, zones, equipment: halEquipment = [] } = useHal();
  const { flocks } = useFlk();
  const { items: whsItems } = useWhs();
  const { productions } = useEgg();

  // 🆕 تابع auto-fill تخم (بقیه auto-fill ها inline هستن)
  // 🆕 محاسبه سن از تاریخ هچ و تاریخ فاکتور (scientifically correct)
  const computeAgeFromHatch = (hatchDateStr: string | undefined): number | null => {
    if (!hatchDateStr) return null;
    try {
      const inv = invoiceDate || formatJ(new Date(), 'yyyy/MM/dd');
      const d1 = parseJ(toEn(hatchDateStr), 'yyyy/MM/dd', new Date());
      const d2 = parseJ(toEn(inv), 'yyyy/MM/dd', new Date());
      if (isValid(d1) && isValid(d2)) return Math.max(0, differenceInCalendarDays(d2, d1));
    } catch {}
    return null;
  };

  const fillFromProduction = (productionId: string, kind: 'eating' | 'fertile') => {
    const prod = productions.find(x => x.id === productionId);
    if (!prod) return;
    const qty = kind === 'eating' ? prod.eatingCount : prod.fertileCount;
    // 🆕 اتصال مستقیم به کالای انبار (استاندارد ERP — رفع Phantom)
    const eggStock = whsItems.find(x => x.category === 'egg');

    updateItem({
      flockId: prod.flockId,
      eggDate: prod.date,
      quantity: qty,
      eggWeight: prod.avgWeight ?? item.eggWeight,
      description: item.description || (kind === 'eating' ? `تخم خوراکی - ${prod.date}` : `تخم نطفه‌دار - ${prod.date}`),
      stockItemId: eggStock?.id || '',
    });
  };
  const incDevices = useInc((s) => s.devices || []);
  const incStore = useInc();
  const allHatches: HatchResult[] = ((incStore as unknown as { hatches?: HatchResult[] }).hatches) || [];
  const availableHatches = allHatches.filter(h => h.generatedFlockId && (h.hatched || 0) > 0);

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
        category === 'herbal' ? (isPurchase ? 'نام داروی گیاهی (خرید)' : 'نام داروی گیاهی (فروش)') :
        category === 'medicine' ? (isPurchase ? 'نام دارو (خرید)' : 'نام دارو (فروش)') :
        category === 'feed' ? (isPurchase ? 'نام دان (خرید)' : 'نام دان (فروش)') :
        category === 'vaccine' ? (isPurchase ? 'نام واکسن (خرید)' : 'نام واکسن (فروش)') :
        category === 'equipment' ? (isPurchase ? 'نام تجهیز (خرید)' : 'نام تجهیز (فروش)') :
        category === 'chick' ? (isPurchase ? 'نام جوجه (خرید)' : 'نام جوجه (فروش)') :
        category === 'egg' || category === 'fertile_egg' ? (isPurchase ? 'نام تخم (خرید)' : 'نام تخم (فروش)') :
        category === 'adult' ? (isPurchase ? 'نام پرنده (خرید)' : 'نام پرنده (فروش)') :
        category === 'manure' ? 'نام کود' :
        category === 'broken' ? 'نام تخم شکسته' :
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

        {!isPurchase && (
          <Field label="منبع جوجه" hint="جوجه از گله موجود می‌آید یا از هچری">
            <Select value={item.source || 'flock'} onChange={e => {
              const ns = e.target.value as 'flock' | 'hatch';
              updateItem({ source: ns, flockId: '', hatchId: '' });
            }}>
              <option value="flock">🐔 از گله موجود</option>
              <option value="hatch">🥚 از هچری</option>
            </Select>
          </Field>
        )}

        {/* --- بخش ۱: هویت پرنده --- */}
        <Grid2>
          <Field label="نوع پرنده" required>
            <SmartSelect value={String(item.birdId || '')} onChange={v => updateItem({ birdId: v, breedId: '' })} options={birds.map(b => ({ value: b.id, label: b.name }))} placeholder="— انتخاب —" modalTitle="انتخاب پرنده" autoThreshold={6} disabled={!isPurchase && !!item.flockId} />
          </Field>
          <Field label="نژاد" required>
            <SmartSelect value={String(item.breedId || '')} onChange={v => updateItem({ breedId: v })} options={breedsForBird.map((b) => {
              const purposeMap: Record<string, string> = { layer: '🥚 تخم‌گذار', breeder: '🐣 مادر', broiler: '🍗 گوشتی', ornamental: '🌸 زینتی' };
              const purposeLabels = (b.purposes || []).map((p: string) => purposeMap[p] || p);
              return { value: b.id, label: purposeLabels.length > 0 ? `${b.name} — ${purposeLabels.join('، ')}` : b.name };
            })} placeholder="— انتخاب —" modalTitle="انتخاب نژاد" autoThreshold={6} disabled={isPurchase && !!item.existingFlockId} />
            {item.birdId && breedsForBird.length === 0 && (
              <div style={{ color: 'var(--warn)', fontSize: 11, marginTop: 4, fontWeight: 600 }}>
                ⚠️ این پرنده هنوز نژادی ندارد. ابتدا از بخش «پرنده و نژاد» نژاد تعریف کنید.
              </div>
            )}
          </Field>
        </Grid2>

        {/* ردیف ۲: تاریخ هچ + سن */}
        <Grid2>
          {isPurchase ? (
            <Field label="تاریخ هچ" required>
              <DatePicker value={String(item.hatchDate || '')} onChange={v => {
                const age = computeAgeFromHatch(v);
                updateItem({ hatchDate: v, ageDays: age });
              }} placeholder="1405/07/26" autoToday />
            </Field>
          ) : (item.flockId || item.hatchId) && !hatchOverride ? (
            <Field label="تاریخ هچ (قفل)">
              <div style={{ height: 38, display: 'flex', alignItems: 'center', background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', padding: '0 12px', color: 'var(--muted)' }}>
                {item.hatchDate ? toFa(item.hatchDate) : '—'}
                <span style={{ marginInlineStart: 'auto', fontSize: 14 }} title="قفل — از منبع انتخاب‌شده">🔒</span>
              </div>
            </Field>
          ) : (
            <Field label="تاریخ هچ" required>
              <DatePicker value={String(item.hatchDate || '')} onChange={v => {
                const age = computeAgeFromHatch(v);
                updateItem({ hatchDate: v, ageDays: age });
              }} placeholder="1405/07/26" autoToday />
            </Field>
          )}
          <Field label="سن (روز)" hint="تاریخ هچ خودکار محاسبه می‌شود">
            <Input mode="number" value={item.ageDays != null && item.ageDays >= 0 ? String(item.ageDays) : ''} onChange={e => {
              const v = Math.round(parseFaNum(e.target.value)) || null;
              if (v !== null) {
                const invDateStr = invoiceDate || formatJ(new Date(), 'yyyy/MM/dd');
                const invDate = parseJ(toEn(invDateStr), 'yyyy/MM/dd', new Date());
                const newHatch = subDays(invDate, v);
                updateItem({ ageDays: v, hatchDate: formatJ(newHatch, 'yyyy/MM/dd') });
              } else {
                updateItem({ ageDays: null });
              }
            }} unit="روز" min={0} placeholder="مثلاً ۹۰" />
          </Field>
        </Grid2>

        {/* ردیف ۳: منبع (هچ/گله) */}
        {isPurchase ? (
          <Field label="اتصال به گله موجود" hint="اتصال به گله دستی">
            <SmartSelect value={String(item.existingFlockId || '')} onChange={v => updateItem({ existingFlockId: v, flockId: v })} options={flocks.filter(f => f.status === 'active').map(f => ({ value: f.id, label: f.name }))} placeholder="— ایجاد گله جدید —" modalTitle="انتخاب گله" />
          </Field>
        ) : (item.source || 'flock') === 'hatch' ? (
          <Field label="هچ مبدأ" required hint="هچی که جوجه‌ها از آن آمده">
            <SmartSelect value={String(item.hatchId || '')} onChange={v => {
              const h = availableHatches.find(x => x.id === v);
              if (!h) return;
              const f = flocks.find(x => x.id === h.generatedFlockId);
              const age = computeAgeFromHatch(h.date);
              updateItem({ hatchId: v, source: 'hatch', flockId: h.generatedFlockId || '', birdId: f?.birdId || item.birdId, breedId: f?.breedId || item.breedId, ageDays: age, hatchDate: h.date, maleCount: h.maleCount, femaleCount: h.femaleCount, unknownCount: h.unknownCount, description: item.description || `جوجه از هچ ${h.date}` });
              setHatchOverride(false);
            }} options={availableHatches.map(h => ({ value: h.id, label: `${h.date} — ${h.hatched} جوجه` }))} placeholder="— انتخاب هچ —" modalTitle="انتخاب هچ" autoThreshold={6} />
          </Field>
        ) : (
          <Field label="گله مبدأ" required hint="گله‌ای که جوجه از آن فروخته می‌شود">
            <SmartSelect value={String(item.flockId || '')} onChange={v => {
              const f = flocks.find(x => x.id === v);
              const age = computeAgeFromHatch(f?.hatchDate);
              updateItem({ flockId: v, source: 'flock', hatchId: '', birdId: f?.birdId || item.birdId, breedId: f?.breedId || item.breedId, ageDays: age != null ? age : (f ? getAgeDays(f) : item.ageDays), hatchDate: f?.hatchDate || item.hatchDate });
              setHatchOverride(false);
            }} options={activeFlocks} placeholder="— انتخاب گله —" modalTitle="انتخاب گله" autoThreshold={6} />
          </Field>
        )}

        {/* --- بخش ۲: مکان --- */}
        {isPurchase && (
          <Grid2>
            <Field label="سالن مقصد">
              <SmartSelect value={String(item.hallId || '')} onChange={v => updateItem({ hallId: v, zoneId: '' })} options={halls.map(h => ({ value: h.id, label: h.name }))} placeholder="— سالن —" modalTitle="انتخاب سالن" autoThreshold={6} />
            </Field>
            <Field label="بخش مقصد (اختیاری)">
              <SmartSelect value={String(item.zoneId || '')} onChange={v => updateItem({ zoneId: v })} options={zones.filter(z => z.hallId === item.hallId).map(z => ({ value: z.id, label: z.name }))} placeholder="— انتخاب بخش —" disabled={!item.hallId} modalTitle="انتخاب بخش" autoThreshold={6} />
            </Field>
          </Grid2>
        )}

        {/* --- بخش ۳: مقدار --- */}
        <Grid2>
          <Field label="وزن اولیه (گرم)" hint="حداکثر ۱۰۰ گرم">
            <Input mode="number" value={item.chickWeight != null && item.chickWeight > 0 ? String(item.chickWeight) : ''} onChange={e => {
              let v = parseFaNum(e.target.value) || null;
              if (v !== null && v > 100) v = 100;
              updateItem({ chickWeight: v });
            }} unit="g" min={20} max={100} />
          </Field>
        </Grid2>

      </div>
    );
  }

  if (category === 'adult') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {nameFieldJsx}
        <SecTitle icon="🐓" title="اطلاعات پرنده بالغ" />

        {/* --- بخش ۱: هویت --- */}
        <Grid2>
          {(isPurchase || item.flockId) ? (
            <Field label="نوع پرنده" required hint={(!isPurchase && item.flockId) ? 'از گله انتخاب‌شده' : undefined}>
              <SmartSelect value={String(item.birdId || '')} onChange={v => updateItem({ birdId: v, breedId: '' })} options={birds.map(b => ({ value: b.id, label: b.name }))} placeholder="— انتخاب —" modalTitle="انتخاب پرنده" autoThreshold={6} disabled={!isPurchase && !!item.flockId} />
            </Field>
          ) : (
            <div style={{ height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', border: '1px dashed var(--border)', borderRadius: 'var(--r-md)', color: 'var(--muted)', fontSize: 'var(--fs-xs)', gap: 4 }}>
              🔒 ابتدا گله را انتخاب کنید
            </div>
          )}
          {item.birdId ? (
            <Field label="نژاد" required hint={(!isPurchase && item.flockId) ? 'از گله انتخاب‌شده' : undefined}>
              <SmartSelect value={String(item.breedId || '')} onChange={v => updateItem({ breedId: v })} options={breedsForBird.map((b) => {
                const purposeMap: Record<string, string> = { layer: '🥚 تخم‌گذار', breeder: '🐣 مادر', broiler: '🍗 گوشتی', ornamental: '🌸 زینتی' };
                const purposeLabels = (b.purposes || []).map((p: string) => purposeMap[p] || p);
                return { value: b.id, label: purposeLabels.length > 0 ? `${b.name} — ${purposeLabels.join('، ')}` : b.name };
              })} placeholder="— انتخاب —" modalTitle="انتخاب نژاد" autoThreshold={6} disabled={!isPurchase && !!item.flockId} />
            </Field>
          ) : (
            <div style={{ height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', border: '1px dashed var(--border)', borderRadius: 'var(--r-md)', color: 'var(--muted)', fontSize: 'var(--fs-xs)', gap: 4 }}>
              🔒 ابتدا پرنده را انتخاب کنید
            </div>
          )}
        </Grid2>

        <Grid2>
          {isPurchase && !item.existingFlockId ? (
            <Field label="تاریخ هچ" required>
              <DatePicker value={String(item.hatchDate || '')} onChange={v => {
                const age = computeAgeFromHatch(v);
                updateItem({ hatchDate: v, ageDays: age });
              }} placeholder="1405/07/26" autoToday />
            </Field>
          ) : item.existingFlockId ? (
            <Field label="تاریخ هچ (قفل از گله)">
              <div style={{ height: 38, display: 'flex', alignItems: 'center', background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', padding: '0 12px', color: 'var(--muted)' }}>
                {item.hatchDate ? toFa(item.hatchDate) : '—'}
                <span style={{ marginInlineStart: 'auto', fontSize: 14 }} title="قفل — از گله انتخاب‌شده">🔒</span>
              </div>
            </Field>
          ) : (
            <Field label="تاریخ هچ" required>
              <DatePicker value={String(item.hatchDate || '')} onChange={v => {
                const age = computeAgeFromHatch(v);
                updateItem({ hatchDate: v, ageDays: age });
              }} placeholder="1405/07/26" autoToday />
            </Field>
          )}
          <Field label="سن (روز)" hint="تاریخ هچ خودکار محاسبه می‌شود">
            <Input mode="number" value={item.ageDays != null && item.ageDays >= 0 ? String(item.ageDays) : ''} onChange={e => {
              const v = Math.round(parseFaNum(e.target.value)) || null;
              if (v !== null) {
                const invDateStr = invoiceDate || formatJ(new Date(), 'yyyy/MM/dd');
                const invDate = parseJ(toEn(invDateStr), 'yyyy/MM/dd', new Date());
                const newHatch = subDays(invDate, v);
                updateItem({ ageDays: v, hatchDate: formatJ(newHatch, 'yyyy/MM/dd') });
              } else {
                updateItem({ ageDays: null });
              }
            }} unit="روز" min={0} placeholder="مثلاً ۹۰" />
          </Field>
        </Grid2>

        <Grid2>
          {isPurchase ? (
            <Field label="اتصال به گله موجود" hint="اتصال به گله دستی">
              <SmartSelect value={String(item.existingFlockId || '')} onChange={v => {
                const f = flocks.find(x => x.id === v);
                if (f) {
                  updateItem({
                    existingFlockId: v,
                    flockId: v,
                    hatchDate: f.hatchDate || item.hatchDate,
                    ageDays: f ? getAgeDays(f) : item.ageDays,
                    birdId: f.birdId || item.birdId,
                    breedId: f.breedId || item.breedId
                  });
                } else {
                  updateItem({ existingFlockId: v, flockId: v });
                }
              }} options={flocks.filter(f => f.status === 'active').map(f => ({ value: f.id, label: f.name }))} placeholder="— ایجاد گله جدید —" modalTitle="انتخاب گله" />
            </Field>
          ) : (
            <Field label="گله مبدأ" required>
              <SmartSelect value={String(item.flockId || '')} onChange={v => {
                const f = flocks.find(x => x.id === v);
                updateItem({ flockId: v, birdId: f?.birdId || item.birdId, breedId: f?.breedId || item.breedId, ageDays: f ? getAgeDays(f) : item.ageDays, hatchDate: f?.hatchDate || item.hatchDate });
              }} options={activeFlocks} placeholder="— انتخاب گله —" modalTitle="انتخاب گله" autoThreshold={6} />
            </Field>
          )}
        </Grid2>

        {/* --- بخش ۲: مکان (فقط خرید) --- */}
        {isPurchase && (
          <Grid2>
            <Field label="سالن مقصد">
              <SmartSelect value={String(item.hallId || '')} onChange={v => updateItem({ hallId: v, zoneId: '' })} options={halls.map(h => ({ value: h.id, label: h.name }))} placeholder="— سالن —" modalTitle="انتخاب سالن" autoThreshold={6} />
            </Field>
            <Field label="بخش مقصد (اختیاری)">
              <SmartSelect value={String(item.zoneId || '')} onChange={v => updateItem({ zoneId: v })} options={zones.filter(z => z.hallId === item.hallId).map(z => ({ value: z.id, label: z.name }))} placeholder="— انتخاب بخش —" disabled={!item.hallId} modalTitle="انتخاب بخش" autoThreshold={6} />
            </Field>
          </Grid2>
        )}

        {/* --- بخش ۳: وزن و قیمت --- */}
        <Grid2>
          <Field label="وزن زنده کل (کیلوگرم)" hint="برای محاسبه قیمت">
            <Input mode="number" value={item.liveWeight != null && item.liveWeight > 0 ? String(item.liveWeight) : ''} onChange={e => updateItem({ liveWeight: parseFaNum(e.target.value) || null })} unit="kg" min={0} />
          </Field>
          <Field 
            label="واحد قیمت" 
            help="اگر 'هر پرنده' را انتخاب کنید، مبلغ کل = تعداد × قیمت. اگر 'هر کیلوگرم' را انتخاب کنید، مبلغ کل = وزن زنده کل × قیمت."
          >
            <Select value={String(item.priceUnit || 'perBird')} onChange={e => updateItem({ priceUnit: e.target.value })}>
              <option value="perBird">به ازای هر پرنده</option>
              <option value="perKg">به ازای هر کیلوگرم</option>
            </Select>
          </Field>
        </Grid2>

        {/* --- بخش ۴: فروش (فقط فروش) --- */}
        {!isPurchase && (
          <Grid2>
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
          </Grid2>
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
        <Field label={isPurchase ? "افزودن به انبار" : "کاهش از انبار"} hint={isPurchase ? "برای افزودن به موجودی" : "برای کاهش از موجودی"} help={isPurchase ? "اگر این کالا از قبل در انبار ثبت شده، از این لیست انتخابش کن تا موجودی به همان کالا اضافه شود (نه کالای تکراری). اگر خالی بگذاری، سیستم به‌طور خودکار یک کالای جدید در انبار می‌سازد." : "کالایی که از انبار کاهش می‌یابد. اگه انتخاب نکنی، سیستم بر اساس نام کالا جستجو می‌کند."}>
          <SmartSelect value={String(item.stockItemId || '')} onChange={v => {
              const wItem = whsItems.find(x => x.id === v);
              updateItem({
                stockItemId: v,
                unit: wItem?.unit || item.unit,
                unitPrice: wItem?.lastPrice || item.unitPrice,
                description: wItem?.name || item.description,
              });
            }} options={(whsItems || []).filter(w => w.category === 'feed').map(i => ({ value: i.id, label: `${i.name} — موجودی ${formatQty(i.currentStock, i.unit)}` }))} placeholder="— انتخاب کالای انبار —" modalTitle="انتخاب کالای انبار" autoThreshold={6} />
        </Field>
        <Grid2>
          <Field label="تاریخ انقضا">
            <DatePicker value={String(item.expiryDate || '')} onChange={v => updateItem({ expiryDate: v })} placeholder="1405/12/29" />
          </Field>
          <Field label={isPurchase ? "گله مقصد" : "گله مبدأ"} hint={isPurchase ? "هزینه به این گله متصل می‌شود" : "کالا از این گله تخصیص می‌یابد"}>
            <SmartSelect value={String(item.flockId || '')} onChange={v => {
                const f = flocks.find(x => x.id === v);
                updateItem({
                  flockId: v,
                  birdId: f?.birdId || item.birdId,
                  breedId: f?.breedId || item.breedId,
                  ageDays: f ? getAgeDays(f) : item.ageDays,
                });
              }} options={activeFlocks} placeholder="— بدون گله —" modalTitle="انتخاب گله" autoThreshold={6} />
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
        <Field label={isPurchase ? "افزودن به انبار" : "کاهش از انبار"} hint={isPurchase ? "دارو به انبار اضافه می‌شود" : "دارو از انبار کاهش می‌یابد"}>
          <SmartSelect value={String(item.stockItemId || '')} onChange={v => {
              const wItem = whsItems.find(x => x.id === v);
              updateItem({
                stockItemId: v,
                unit: wItem?.unit || item.unit,
                unitPrice: wItem?.lastPrice || item.unitPrice,
                description: wItem?.name || item.description,
              });
            }} options={(whsItems || []).filter(w => w.category === 'medicine').map(i => ({ value: i.id, label: `${i.name} — موجودی ${formatQty(i.currentStock, i.unit)}` }))} placeholder="— انتخاب کالای انبار —" modalTitle="انتخاب دارو" autoThreshold={6} />
        </Field>
        <Grid2>
          <Field label="تاریخ انقضا">
            <DatePicker value={String(item.expiryDate || '')} onChange={v => updateItem({ expiryDate: v })} placeholder="1405/12/29" />
          </Field>
          {isPurchase && (
          <Field label="دوره پرهیز (روز)" hint="بعد از مصرف، چند روز فروش محصول ممنوع">
            <Input mode="number" value={item.withdrawalDays != null && item.withdrawalDays > 0 ? String(item.withdrawalDays) : ''} onChange={e => updateItem({ withdrawalDays: Math.round(parseFaNum(e.target.value)) || null })} unit="روز" min={0} max={365} />
          </Field>
          )}
          <Field label={isPurchase ? "گله مقصد" : "گله مبدأ"} hint="هزینه به این گله متصل می‌شود" help={isPurchase ? "اگر این خرید را برای گله مشخصی انجام داده‌ای، گله را انتخاب کن تا هزینه همان لحظه در سود و زیان آن گله ثبت شود. اگر این کالا برای چند گله یا انبار عمومی خریده شده، این فیلد را خالی بگذار؛ هزینه بعداً هنگام مصرف در «ثبت روزانه» به‌طور خودکار روی گله سرشکن می‌شود." : "اگر این فروش را از گله مشخصی انجام داده‌ای، گله را انتخاب کن تا درآمد همان لحظه در سود و زیان آن گله ثبت شود."}>
            <SmartSelect value={String(item.flockId || '')} onChange={v => {
                const f = flocks.find(x => x.id === v);
                updateItem({
                  flockId: v,
                  birdId: f?.birdId || item.birdId,
                  breedId: f?.breedId || item.breedId,
                  ageDays: f ? getAgeDays(f) : item.ageDays,
                });
              }} options={activeFlocks} placeholder="— بدون گله —" modalTitle="انتخاب گله" autoThreshold={6} />
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

          {/* ردیف ۱: تجهیز موجود (تمام عرض) */}
          <Field label="تجهیز موجود" required hint="از سالن یا انبار انتخاب کنید">
            <SmartSelect
              value={String(item.equipmentId || '')}
              onChange={v => {
                const eq = (halEquipment || []).find(e => e.id === v);
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
              options={(halEquipment || []).map(e => ({
                value: e.id,
                label: `${e.name} — ${e.hallId ? 'در سالن' : 'در انبار'}${e.count ? ` (×${e.count})` : ''}`,
              }))}
              placeholder="— انتخاب تجهیز —"
              modalTitle="انتخاب تجهیز فروشی"
              autoThreshold={6}
            />
          </Field>

          {/* ردیف ۲: پیش‌نمایش (اگر انتخاب شده) */}
          {item.equipmentId && (() => {
            const eq = (halEquipment || []).find(e => e.id === item.equipmentId);
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
        <Field label={isPurchase ? "افزودن به انبار" : "کاهش از انبار"} hint={isPurchase ? "به انبار اضافه می‌شود" : "از انبار کاهش می‌یابد"}>
          <SmartSelect value={String(item.stockItemId || '')} onChange={v => {
              const wItem = whsItems.find(x => x.id === v);
              updateItem({
                stockItemId: v,
                unit: wItem?.unit || item.unit,
                unitPrice: wItem?.lastPrice || item.unitPrice,
                description: wItem?.name || item.description,
              });
            }} options={(whsItems || []).filter(w => w.category === 'herbal').map(i => ({ value: i.id, label: `${i.name} — موجودی ${formatQty(i.currentStock, i.unit)}` }))} placeholder="— انتخاب کالای انبار —" modalTitle="انتخاب داروی گیاهی" autoThreshold={6} />
        </Field>
        <Grid2>
          <Field label="تاریخ انقضا">
            <DatePicker value={String(item.expiryDate || '')} onChange={v => updateItem({ expiryDate: v })} placeholder="1405/12/29" />
          </Field>
          {isPurchase && (
          <Field label="دوره پرهیز (روز)" hint="بعد از مصرف، چند روز فروش محصول ممنوع">
            <Input mode="number" value={item.withdrawalDays != null && item.withdrawalDays > 0 ? String(item.withdrawalDays) : ''} onChange={e => updateItem({ withdrawalDays: Math.round(parseFaNum(e.target.value)) || null })} unit="روز" min={0} max={365} />
          </Field>
          )}
          <Field label={isPurchase ? "گله مقصد" : "گله مبدأ"} hint="هزینه به این گله متصل می‌شود" help={isPurchase ? "اگر این خرید را برای گله مشخصی انجام داده‌ای، گله را انتخاب کن تا هزینه همان لحظه در سود و زیان آن گله ثبت شود. اگر این کالا برای چند گله یا انبار عمومی خریده شده، این فیلد را خالی بگذار؛ هزینه بعداً هنگام مصرف در «ثبت روزانه» به‌طور خودکار روی گله سرشکن می‌شود." : "اگر این فروش را از گله مشخصی انجام داده‌ای، گله را انتخاب کن تا درآمد همان لحظه در سود و زیان آن گله ثبت شود."}>
            <SmartSelect value={String(item.flockId || '')} onChange={v => {
                const f = flocks.find(x => x.id === v);
                updateItem({
                  flockId: v,
                  birdId: f?.birdId || item.birdId,
                  breedId: f?.breedId || item.breedId,
                  ageDays: f ? getAgeDays(f) : item.ageDays,
                });
              }} options={activeFlocks} placeholder="— بدون گله —" modalTitle="انتخاب گله" autoThreshold={6} />
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
        <Field label={isPurchase ? "افزودن به انبار" : "کاهش از انبار"} hint={isPurchase ? "واکسن به انبار اضافه" : "واکسن از انبار کاهش"}>
          <SmartSelect value={String(item.stockItemId || '')} onChange={v => {
              const wItem = whsItems.find(x => x.id === v);
              updateItem({
                stockItemId: v,
                unit: wItem?.unit || item.unit,
                unitPrice: wItem?.lastPrice || item.unitPrice,
                description: wItem?.name || item.description,
              });
            }} options={(whsItems || []).filter(w => w.category === 'vaccine').map(i => ({ value: i.id, label: `${i.name} — موجودی ${formatQty(i.currentStock, i.unit)}` }))} placeholder="— انتخاب کالای انبار —" modalTitle="انتخاب واکسن" autoThreshold={6} />
        </Field>
        <Grid2>
          <Field label="تاریخ انقضا">
            <DatePicker value={String(item.expiryDate || '')} onChange={v => updateItem({ expiryDate: v })} placeholder="1405/12/29" />
          </Field>
          {isPurchase && (
          <Field label="دوره پرهیز (روز)" hint="بعد از مصرف، چند روز فروش محصول ممنوع">
            <Input mode="number" value={item.withdrawalDays != null && item.withdrawalDays > 0 ? String(item.withdrawalDays) : ''} onChange={e => updateItem({ withdrawalDays: Math.round(parseFaNum(e.target.value)) || null })} unit="روز" min={0} max={365} />
          </Field>
          )}
          <Field label={isPurchase ? "گله مقصد" : "گله مبدأ"} hint="هزینه به این گله متصل می‌شود" help={isPurchase ? "اگر این خرید را برای گله مشخصی انجام داده‌ای، گله را انتخاب کن تا هزینه همان لحظه در سود و زیان آن گله ثبت شود. اگر این کالا برای چند گله یا انبار عمومی خریده شده، این فیلد را خالی بگذار؛ هزینه بعداً هنگام مصرف در «ثبت روزانه» به‌طور خودکار روی گله سرشکن می‌شود." : "اگر این فروش را از گله مشخصی انجام داده‌ای، گله را انتخاب کن تا درآمد همان لحظه در سود و زیان آن گله ثبت شود."}>
            <SmartSelect value={String(item.flockId || '')} onChange={v => {
                const f = flocks.find(x => x.id === v);
                updateItem({
                  flockId: v,
                  birdId: f?.birdId || item.birdId,
                  breedId: f?.breedId || item.breedId,
                  ageDays: f ? getAgeDays(f) : item.ageDays,
                });
              }} options={activeFlocks} placeholder="— بدون گله —" modalTitle="انتخاب گله" autoThreshold={6} />
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
        <Field label={isPurchase ? "افزودن به انبار" : "کاهش از انبار"} hint={isPurchase ? "به موجودی اضافه" : "از موجودی کاهش"}>
          <SmartSelect
            value={String(item.stockItemId || '')}
            onChange={v => {
              const wItem = whsItems.find(x => x.id === v);
              updateItem({
                stockItemId: v,
                unit: wItem?.unit || item.unit,
                unitPrice: wItem?.lastPrice || item.unitPrice,
                description: wItem?.name || item.description,
              });
            }}
            options={manureItems.map(i => ({ value: i.id, label: `${i.name} — موجودی ${formatQty(i.currentStock, i.unit)}` }))}
            placeholder="— انتخاب کالای انبار —"
            modalTitle="انتخاب کالای کود"
            autoThreshold={6}
          />
        </Field>
        <Field label="گله مبدأ" hint="گله‌ای که کود از آن تولید شده">
          <SmartSelect value={String(item.flockId || '')} onChange={v => {
                const f = flocks.find(x => x.id === v);
                updateItem({
                  flockId: v,
                  birdId: f?.birdId || item.birdId,
                  breedId: f?.breedId || item.breedId,
                  ageDays: f ? getAgeDays(f) : item.ageDays,
                });
              }} options={activeFlocks} placeholder="— بدون گله —" modalTitle="انتخاب گله" autoThreshold={6} />
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
            <SmartSelect value={String(item.flockId || '')} onChange={v => {
                const f = flocks.find(x => x.id === v);
                updateItem({
                  flockId: v,
                  birdId: f?.birdId || item.birdId,
                  breedId: f?.breedId || item.breedId,
                  ageDays: f ? getAgeDays(f) : item.ageDays,
                });
              }} options={activeFlocks} placeholder="— بدون گله —" modalTitle="انتخاب گله" autoThreshold={6} />
          </Field>
        </Grid2>
        <Field label="تاریخ انقضا (اختیاری)">
          <DatePicker value={String(item.expiryDate || '')} onChange={v => updateItem({ expiryDate: v })} placeholder="1405/12/29" />
        </Field>
        {sellerSlot}
      </div>
    );
  }

  // ========== تخم شکسته (فقط فروش) ==========
  if (category === 'broken') {
    const brokenItems = (whsItems || []).filter(w =>
      w.category === 'broken' ||
      (w.category === 'egg' && (w.name === 'تخم مصرفی' || w.name === 'تخم شکسته'))
    );
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {nameFieldJsx}
        <SecTitle icon="💔" title="اطلاعات تخم شکسته" />

        {/* انتخاب از تولیدات تخم — شکسته */}
        <Field label="انتخاب از تولیدات تخم شکسته" hint="برای پر شدن خودکار مشخصات">
          <SmartSelect
            value=""
            onChange={v => {
              const prod = (productions || []).find(x => x.id === v);
              if (prod) {
                updateItem({
                  flockId: prod.flockId,
                  eggDate: prod.date,
                  brokenEggCount: prod.brokenCount,
                  quantity: prod.brokenCount,
                  description: item.description || `تخم شکسته - ${prod.date}`,
                });
              }
            }}
            options={(productions || []).filter(prod => (prod.brokenCount || 0) > 0).map(prod => ({
              value: prod.id,
              label: `${prod.date} — ${prod.brokenCount} عدد`
            }))}
            placeholder="— انتخاب از تولیدات —"
            modalTitle="انتخاب از تولیدات تخم شکسته"
          />
        </Field>

        {/* ردیف ۱: گله + تاریخ */}
        <Grid2>
          <Field label="گله مبدأ" required>
            <SmartSelect value={String(item.flockId || '')} onChange={v => {
                const f = flocks.find(x => x.id === v);
                updateItem({
                  flockId: v,
                  birdId: f?.birdId || item.birdId,
                  breedId: f?.breedId || item.breedId,
                  ageDays: f ? getAgeDays(f) : item.ageDays,
                });
              }} options={activeFlocks} placeholder="— انتخاب گله —" modalTitle="انتخاب گله" autoThreshold={6} />
          </Field>
          <Field label="تاریخ تولید تخم">
            <DatePicker value={String(item.eggDate || '')} onChange={v => updateItem({ eggDate: v })} placeholder="1405/07/20" autoToday />
          </Field>
        </Grid2>

        {/* ردیف ۲: تعداد شکسته + تعداد کل */}
        <Grid2>
          <Field label="تعداد شکسته" hint="اختیاری — جزئیات">
            <Input mode="number" value={item.brokenEggCount != null && item.brokenEggCount > 0 ? String(item.brokenEggCount) : ''} onChange={e => updateItem({ brokenEggCount: Math.round(parseFaNum(e.target.value)) || null })} unit="عدد" min={0} />
          </Field>

        </Grid2>

        {/* ردیف ۳: انتخاب از انبار — تمام عرض */}
        <Field label={isPurchase ? "افزودن به انبار" : "کاهش از انبار"} hint={isPurchase ? "به موجودی اضافه" : "از موجودی کاهش"}>
          <SmartSelect
            value={String(item.stockItemId || '')}
            onChange={v => {
              const wItem = whsItems.find(x => x.id === v);
              updateItem({
                stockItemId: v,
                unit: wItem?.unit || item.unit,
                unitPrice: wItem?.lastPrice || item.unitPrice,
                description: wItem?.name || item.description,
              });
            }}
            options={brokenItems.map(i => ({ value: i.id, label: `${i.name} — موجودی ${formatQty(i.currentStock, i.unit)}` }))}
            placeholder="— انتخاب کالای انبار —"
            modalTitle="انتخاب کالای تخم شکسته"
            autoThreshold={6}
          />
        </Field>

        {sellerSlot}
      </div>
    );
  }

  return null;
}
