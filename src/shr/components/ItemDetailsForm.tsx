import { AppIconKey } from '../icons/AppIcons';
import { FIELD_META } from '../constants/fieldMeta';
import { getGlobalFormat } from '../units/useFormat';
import { getOtherCostConfig } from '../units/uom';
import { Field, LockedValue, AlertBox, Grid2, Grid3, Input, Select, NumField } from './ui';
import { isBreedAllowedForCategory, getRequiredPurposeHint } from '../../mod/brd/categoryBreedRules';
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
import { isFieldRequired } from '../validation/fieldRegistry';

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
  batchNo?: string;
  model?: string;
  warrantyMonths?: number | null;
  costType?: string;
  billId?: string;
  paymentId?: string;
  subscriptionNo?: string;
  refNo?: string;
  periodLabel?: string;
  stockItemId?: string;
  itemId?: string;
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
  showError?: (path: string) => string | undefined;
  markTouched?: (path: string) => void;
  invoiceDate?: string;
  sellerSlot?: React.ReactNode;
itemIndex?: number;
  quantityField?: React.ReactNode;
}

const SecTitle = ({ icon, title }: { icon: string; title: string }) => (
  <div style={{ paddingTop: 12, fontSize: 'var(--fs-sm)', fontWeight: 700, color: 'var(--text)', letterSpacing: '.3px', borderTop: '1px dashed var(--border)', marginBottom: 8 }}>
    {icon} {title}
  </div>
);

export default function ItemDetailsForm({ category, item, updateItem, isPurchase = false, invoiceDate, sellerSlot, showError, markTouched, itemIndex = 0, quantityField }: Props) {
  const [hatchOverride, setHatchOverride] = useState(false);
  const err = (field: string) => {
    const kind = isPurchase ? 'purchase' : 'sale';
    if (!isFieldRequired(category, field, kind, item)) return undefined;
    return showError?.(`items.${itemIndex}.${field}`);
  };
  const touch = (field: string) => () => {
    const kind = isPurchase ? 'purchase' : 'sale';
    if (!isFieldRequired(category, field, kind, item)) return;
    markTouched?.(`items.${itemIndex}.${field}`);
  };
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
      const inv = formatJ(new Date(), 'yyyy/MM/dd');
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

  const allBreedsForBird = item.birdId ? breeds.filter(b => b.birdId === item.birdId) : [];
  const breedsForBird = allBreedsForBird.filter(b => isBreedAllowedForCategory(b, category, isPurchase));
  const missingPurposeHint = getRequiredPurposeHint(category, isPurchase);
  const hasIncompatibleBreedsOnly = Boolean(item.birdId && allBreedsForBird.length > 0 && breedsForBird.length === 0 && missingPurposeHint);

  const activeFlocks = flocks.filter(f => f.status === 'active').map(f => {
    const parts: string[] = [];
    if (typeof f.currentCount === 'number') parts.push('🐔 ' + getGlobalFormat().count(f.currentCount) + ' پرنده');
    const age = getAgeDays(f);
    if (age != null && age > 0) parts.push(getGlobalFormat().day(age) + ' روز');
    return { value: f.id, label: f.name, subtitle: parts.join(' · ') || undefined, icon: 'flock' };
  });

  // 🎯 فیلتر آبشاری گله‌ها: فقط گله‌هایی که با پرنده/نژاد انتخاب‌شده مطابقت دارند
  const flocksForItem = (it: ItemDetailFormData) => {
    return activeFlocks.filter(opt => {
      const flock = flocks.find((f: any) => f.id === opt.value);
      if (!flock) return false;
      if (it.birdId && flock.birdId !== it.birdId) return false;
      if (it.breedId && flock.breedId !== it.breedId) return false;
      const flockBreed = breeds.find(b => b.id === flock.breedId);
      if (flockBreed && !isBreedAllowedForCategory(flockBreed, category, isPurchase)) return false;
      return true;
    });
  };
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
            category === 'chick' ? 'نام جوجه' :
            category === 'egg' || category === 'fertile_egg' ? 'نام تخم' :
            category === 'adult' ? 'نام پرنده' :
            category === 'manure' ? 'نام کود' :
            category === 'broken' ? 'نام تخم شکسته' : 'نام کالا'
      }
      required
      error={err('description')}
      onTouch={touch('description')}
    >
      <Input
        placeholder={
          category === 'feed' ? 'ذرت، سویا، کنجاله' :
          category === 'medicine' ? 'آنتی‌بیوتیک، ویتامین' :
          category === 'herbal' ? 'نام' :
          category === 'vaccine' ? 'نیوکاسل، برونشیت' :
          category === 'equipment' ? 'آبخوری نیپل، هیتر گازی' :
          category === 'chick' ? 'نام' :
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
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>        <SecTitle icon="hatch" title="اطلاعات جوجه یک‌روزه" />
        {!isPurchase && (
          <Grid2>
            <Field label="منبع جوجه" hint="جوجه از گله موجود می‌آید یا از هچری">
              <SmartSelect
                value={String(item.source || 'flock')}
                modalTitle="انتخاب منبع جوجه"
                options={[
                  { value: 'flock', label: 'از گله موجود' },
                  { value: 'hatch', label: 'از هچری' },
                ]}
                onChange={v => {
                  const ns = v as 'flock' | 'hatch';
                  updateItem({ source: ns, flockId: '', hatchId: '' });
                }}
              />
            </Field>
          {(item.source || 'flock') === 'hatch' ? (
            <Field label="هچ مبدأ" required error={err('hatchId')} onTouch={touch('hatchId')} hint="هچی که جوجه‌ها از آن آمده">
              <SmartSelect value={String(item.hatchId || '')} onChange={v => {
                const h = availableHatches.find(x => x.id === v);
                if (!h) return;
                const f = flocks.find(x => x.id === h.generatedFlockId);
                const age = computeAgeFromHatch(h.date);
                updateItem({ hatchId: v, source: 'hatch', flockId: h.generatedFlockId || '', birdId: f?.birdId || item.birdId, breedId: f?.breedId || item.breedId, ageDays: age, hatchDate: h.date, maleCount: h.maleCount, femaleCount: h.femaleCount, unknownCount: h.unknownCount, description: item.description || `جوجه از هچ ${h.date}` });
                setHatchOverride(false);
              }} options={availableHatches.map(h => ({ value: h.id, label: getGlobalFormat().date(h.date), subtitle: `${getGlobalFormat().count(h.hatched)} جوجه`, icon: '🐣' }))} placeholder={FIELD_META.hatch.origin.placeholder} modalTitle={FIELD_META.hatch.origin.modalTitle} />
            </Field>
          ) : (
            <Field label="گله مبدأ" required error={err('flockId')} onTouch={touch('flockId')}>
              <SmartSelect value={String(item.flockId || '')} onChange={v => {
                const f = flocks.find(x => x.id === v);
                const age = computeAgeFromHatch(f?.hatchDate);
                updateItem({ flockId: v, source: 'flock', hatchId: '', birdId: f?.birdId || item.birdId, breedId: f?.breedId || item.breedId, ageDays: age != null ? age : (f ? getAgeDays(f) : item.ageDays), hatchDate: f?.hatchDate || item.hatchDate });
                setHatchOverride(false);
              }} options={flocksForItem(item)} placeholder={FIELD_META.flock.origin.placeholder} modalTitle="انتخاب گله مبدأ" />
            </Field>
          )}
          </Grid2>
        )}
          {hasIncompatibleBreedsOnly && (
          <AlertBox tone="warn">
            نژادی با کاربرد «{missingPurposeHint}» برای این پرنده ثبت نشده است. لطفاً نژاد جدید بسازید.
          </AlertBox>
        )}
        {!isPurchase && (item.source || 'flock') === 'hatch' && availableHatches.length === 0 && (
          <div style={{ fontSize: 'var(--fs-xs)', marginTop: 4, fontWeight: 600, color: 'var(--danger)' }}>
            ابتدا از بخش «جوجه‌کشی» یک هچ بسازید
          </div>
        )}
        {!isPurchase && (item.source || 'flock') !== 'hatch' && (activeFlocks.length === 0 || ((item.birdId || item.breedId) && flocksForItem(item).length === 0)) && (
          <div style={{ fontSize: 'var(--fs-xs)', marginTop: 4, fontWeight: 600, color: 'var(--danger)' }}>
            ابتدا از بخش «گله» یک گله بسازید
          </div>
        )}

        {/* --- بخش ۱: هویت پرنده --- */}
        <Grid2>
          <Field label={FIELD_META.bird.label} required error={err('birdId')} onTouch={touch('birdId')}>
            <SmartSelect value={String(item.birdId || '')} error={err('birdId')} onChange={v => updateItem({ birdId: v, breedId: '' })} options={birds.map((b: any) => ({ value: b.id, label: b.name, icon: b.icon || ((b.name || '').includes('اردک') ? '🦆' : (b.name || '').includes('بوقلمون') ? '🦃' : (b.name || '').includes('بلدرچین') ? '🐦' : (b.name || '').includes('غاز') ? '🦢' : '🐔') }))} placeholder="— انتخاب —" modalTitle={FIELD_META.bird.modalTitle} disabled={!!item.existingFlockId || (!isPurchase && !!item.flockId)} />
          </Field>
          <Field label={FIELD_META.breed.label} required error={err('breedId')} onTouch={touch('breedId')}>
            <SmartSelect value={String(item.breedId || '')} error={err('breedId')} onChange={v => updateItem({ breedId: v })} options={breedsForBird.map((b) => {
              const purposeMap: Record<string, string> = { layer: '🥚 تخم‌گذار', breeder: '🐣 مادر', broiler: '🍗 گوشتی', ornamental: '🌸 زینتی' };
              const purposeLabels = (b.purposes || []).map((p: string) => purposeMap[p] || p);
              return { value: b.id, label: b.name, subtitle: purposeLabels.length > 0 ? purposeLabels.join('، ') : undefined };
            })} placeholder="— انتخاب —" modalTitle={FIELD_META.breed.modalTitle} disabled={!!item.existingFlockId || (!isPurchase && !!item.flockId)} />
            {item.birdId && breedsForBird.length === 0 && (
              <div style={{ color: 'var(--warn)', fontSize: 11, marginTop: 4, fontWeight: 600 }}>
                ⚠️ برای این پرنده هنوز نژادی ثبت نشده است. ابتدا از بخش «پرنده و نژاد» نژاد تعریف کنید.
              </div>
            )}
          </Field>
        </Grid2>
        

        {nameFieldJsx}

          {/* ردیف ۲: تاریخ هچ + سن */}
        <Grid2>
          {isPurchase ? (
            <Field label="تاریخ هچ" required error={err('hatchDate')} onTouch={touch('hatchDate')} hint={category === 'chick' && (item.ageDays ?? 0) > 14 ? '💡 سن بیش از ۱۴ روز است (گله دوره قبل یا نیمچه)' : undefined}>
              <DatePicker value={String(item.hatchDate || '')} onChange={v => {
                const age = computeAgeFromHatch(v);
                updateItem({ hatchDate: v, ageDays: age });
              }} placeholder="انتخاب تاریخ" />
            </Field>
          ) : (item.flockId || item.hatchId) && !hatchOverride ? (
            <Field label="تاریخ هچ" locked>
              <LockedValue value={item.hatchDate ? getGlobalFormat().date(item.hatchDate) : '—'} />
            </Field>
          ) : (
            <Field label="تاریخ هچ" required error={err('hatchDate')} onTouch={touch('hatchDate')}>
              <DatePicker value={String(item.hatchDate || '')} onChange={v => {
                const age = computeAgeFromHatch(v);
                updateItem({ hatchDate: v, ageDays: age });
              }} placeholder="انتخاب تاریخ" />
            </Field>
          )}
          {!isPurchase && (item.flockId || item.hatchId) && !hatchOverride ? (
            <Field label="سن (روز)" locked>
              <LockedValue value={item.ageDays != null && item.ageDays >= 0 ? `${getGlobalFormat().int(item.ageDays)} روز` : '—'} />
            </Field>
          ) : (
            <Field label="سن (روز)" hint={isPurchase ? "با وارد کردن سن، تاریخ هچ خودکار محاسبه می‌شود" : undefined}>
              <Input mode="number" value={item.ageDays != null && item.ageDays >= 0 ? String(item.ageDays) : ''} onChange={e => {
                const rawStr = e.target.value.trim();
                const parsed = rawStr === '' ? NaN : Math.round(parseFaNum(rawStr));
                const v = !isNaN(parsed) && parsed >= 0 ? parsed : null;
                if (v !== null) {
                  const invDateStr = formatJ(new Date(), 'yyyy/MM/dd');
                  const invDate = parseJ(invDateStr, 'yyyy/MM/dd', new Date());
                  const newHatch = subDays(invDate, v);
                  updateItem({ ageDays: v, hatchDate: formatJ(newHatch, 'yyyy/MM/dd') });
                } else {
                  updateItem({ ageDays: null });
                }
              }} unit="روز" min={0} placeholder="۰" />
            </Field>
          )}
        </Grid2>

        {/* ردیف ۳: منبع (هچ/گله) */}
        {isPurchase && (
          <Field label="گله موجود" hint="اختیاری — در صورت خالی ماندن، گله جدید ساخته می‌شود">
            <SmartSelect value={String(item.existingFlockId || '')} onChange={v => {
                const f = flocks.find(x => x.id === v);
                if (f) {
                  updateItem({
                    existingFlockId: v,
                    flockId: v,
                    hatchDate: f.hatchDate || item.hatchDate,
                    ageDays: getAgeDays(f),
                    birdId: f.birdId || item.birdId,
                    breedId: f.breedId || item.breedId,
                    hallId: item.hallId || f.hallId || '',
                    zoneId: item.hallId ? item.zoneId : (f.zoneId || ''),
                  });
                } else {
                  updateItem({ existingFlockId: '', flockId: '' });
                }
              }} options={flocks.filter(f => f.status === 'active').map(f => {
                const hallName = halls.find(h => h.id === f.hallId)?.name;
                const countStr = typeof f.currentCount === 'number' ? `${getGlobalFormat().count(f.currentCount)} پرنده` : '';
                const meta = [countStr, hallName].filter(Boolean).join(' • ');
                const isLinked = Boolean(item.flockId && item.flockId === f.id);
                return {
                  value: f.id,
                  label: `${isLinked ? '🟢 ' : ''}${f.name}`,
                  subtitle: meta || undefined,
                  icon: 'flock',
                };
              })} placeholder="— ایجاد گله جدید —" modalTitle="انتخاب گله" />
          </Field>
        )}

        {/* --- بخش ۲: مکان --- */}
        {isPurchase && (
          <Grid2>
            <Field label="سالن مقصد">
              <SmartSelect value={String(item.hallId || '')} onChange={v => updateItem({ hallId: v, zoneId: '' })} options={halls.filter(h => !h.archived).map(h => ({ value: h.id, label: h.name, icon: 'hall' }))} placeholder="— انتخاب —" modalTitle="انتخاب سالن مقصد" />
            </Field>
            <Field label="بخش مقصد">
              <SmartSelect value={String(item.zoneId || '')} onChange={v => updateItem({ zoneId: v })} options={zones.filter(z => z.hallId === item.hallId && !z.archived).map(z => ({ value: z.id, label: z.name, icon: 'zone' }))} placeholder="— انتخاب —" disabled={!item.hallId} modalTitle="انتخاب بخش مقصد" />
            </Field>
          </Grid2>
        )}

        {/* --- بخش ۳: مقدار --- */}
        <Grid2>
          <Field label={isPurchase ? "وزن اولیه (گرم)" : "میانگین وزن (گرم)"} hint={isPurchase ? "بازه استاندارد ۲۰ تا ۱۰۰ گرم" : "میانگین وزن هر قطعه به گرم"}>
            <Input mode="number" value={item.chickWeight != null && item.chickWeight > 0 ? toFa(item.chickWeight) : ''} onChange={e => {
              let v = parseFaNum(e.target.value) || null;
              if (isPurchase && v !== null && v > 100) v = 100;
              updateItem({ chickWeight: v });
            }} unit="گرم" min={isPurchase ? 20 : 0} max={isPurchase ? 100 : 50000} />
          </Field>
          {quantityField}
        </Grid2>

      </div>
    );
  }

  if (category === 'adult') {
    const isSaleLocked = !isPurchase && !!item.flockId;
    const isLocked = !!item.existingFlockId || isSaleLocked;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>        <SecTitle icon="chicken" title="اطلاعات پرنده بالغ" />
        {/* در حالت فروش: گله مبدأ بالاترین اولویت سلسله‌مراتبی را دارد */}
        {!isPurchase && (
          <Field label="گله مبدأ" required error={err('flockId')} onTouch={touch('flockId')}>
            <SmartSelect
              value={String(item.flockId || '')}
              error={err('flockId')}
              onChange={v => {
                const f = flocks.find(x => x.id === v);
                const age = f ? getAgeDays(f) : item.ageDays;
                updateItem({
                  flockId: v,
                  birdId: f?.birdId || item.birdId,
                  breedId: f?.breedId || item.breedId,
                  ageDays: age,
                  hatchDate: f?.hatchDate || item.hatchDate,
                });
              }}
              options={flocks.filter(f => f.status === 'active' && (f.currentCount ?? 0) > 0).map(f => {
                const b = birds.find(x => x.id === f.birdId);
                return { value: f.id, label: f.name, subtitle: `${b ? `${b.name} · ` : ''}${getGlobalFormat().count(f.currentCount ?? 0)} پرنده · ${getGlobalFormat().int(getAgeDays(f))} روز` };
              })}
              placeholder={FIELD_META.flock.origin.placeholder}
              modalTitle="انتخاب گله مبدأ"
            />
          </Field>
        )}

        {/* --- بخش ۱: هویت مشتق‌شده از گله --- */}
        <Grid2>
          <Field label={FIELD_META.bird.label} required error={err('birdId')} onTouch={touch('birdId')} lockedFrom={isSaleLocked ? "گله" : undefined}>
            <SmartSelect value={String(item.birdId || '')} error={err('birdId')} onChange={v => updateItem({ birdId: v, breedId: '' })} options={birds.map((b: any) => ({ value: b.id, label: b.name, icon: b.icon || ((b.name || '').includes('اردک') ? '🦆' : (b.name || '').includes('بوقلمون') ? '🦃' : (b.name || '').includes('بلدرچین') ? '🐦' : (b.name || '').includes('غاز') ? '🦢' : '🐔') }))} placeholder="— انتخاب —" modalTitle={FIELD_META.bird.modalTitle} disabled={isLocked} />
          </Field>
          <Field label={FIELD_META.breed.label} required error={err('breedId')} onTouch={touch('breedId')} lockedFrom={isSaleLocked ? "گله" : undefined}>
            <SmartSelect value={String(item.breedId || '')} error={err('breedId')} onChange={v => updateItem({ breedId: v })} options={breedsForBird.map((b) => {
              const purposeMap: Record<string, string> = { layer: '🥚 تخم‌گذار', breeder: '🐣 مادر', broiler: '🍗 گوشتی', ornamental: '🌸 زینتی' };
              const purposeLabels = (b.purposes || []).map((p: string) => purposeMap[p] || p);
              return { value: b.id, label: b.name, subtitle: purposeLabels.length > 0 ? purposeLabels.join('، ') : undefined };
            })} placeholder="— انتخاب —" modalTitle={FIELD_META.breed.modalTitle} disabled={isLocked || !item.birdId} />
          </Field>
        </Grid2>
        {hasIncompatibleBreedsOnly && (
          <AlertBox tone="warn">
            نژادی با کاربرد «{missingPurposeHint}» برای این پرنده ثبت نشده است. لطفاً نژاد جدید بسازید.
          </AlertBox>
        )}
        {nameFieldJsx}

        <Grid2>
          {isLocked ? (
            <Field label="تاریخ هچ" locked>
              <LockedValue value={item.hatchDate ? getGlobalFormat().date(item.hatchDate) : '—'} />
            </Field>
          ) : (
            <Field label="تاریخ هچ" required error={err('hatchDate')} onTouch={touch('hatchDate')}>
              <DatePicker value={String(item.hatchDate || '')} onChange={v => {
                const age = computeAgeFromHatch(v);
                updateItem({ hatchDate: v, ageDays: age });
              }} placeholder="انتخاب تاریخ" />
            </Field>
          )}
          {isLocked ? (
            <Field label="سن (روز)" locked>
              <LockedValue value={item.ageDays != null && item.ageDays >= 0 ? `${getGlobalFormat().int(item.ageDays)} روز` : '—'} />
            </Field>
          ) : (
            <Field label="سن (روز)" hint={isPurchase ? "تاریخ هچ خودکار محاسبه می‌شود" : undefined}>
              <Input mode="number" value={item.ageDays != null && item.ageDays >= 0 ? String(item.ageDays) : ''} onChange={e => {
                const rawStr = e.target.value.trim();
                const parsed = rawStr === '' ? NaN : Math.round(parseFaNum(rawStr));
                const v = !isNaN(parsed) && parsed >= 0 ? parsed : null;
                if (v !== null) {
                  const invDateStr = formatJ(new Date(), 'yyyy/MM/dd');
                  const invDate = parseJ(invDateStr, 'yyyy/MM/dd', new Date());
                  const newHatch = subDays(invDate, v);
                  updateItem({ ageDays: v, hatchDate: formatJ(newHatch, 'yyyy/MM/dd') });
                } else {
                  updateItem({ ageDays: null });
                }
              }} unit="روز" min={0} placeholder="۰" />
            </Field>
          )}
        </Grid2>

        {/* --- بخش ۲: اتصال به گله و مکان (فقط در خرید) --- */}
        {isPurchase && (
          <>
            <Field label="گله موجود" hint="اتصال به گله دستی">
              <SmartSelect value={String(item.existingFlockId || '')} onChange={v => {
                const f = flocks.find(x => x.id === v);
                if (f) {
                  updateItem({
                    existingFlockId: v,
                    flockId: v,
                    hatchDate: f.hatchDate || item.hatchDate,
                    ageDays: f ? getAgeDays(f) : item.ageDays,
                    birdId: f.birdId || item.birdId,
                    breedId: f.breedId || item.breedId,
                    hallId: item.hallId || f.hallId || '',
                    zoneId: item.hallId ? item.zoneId : (f.zoneId || ''),
                  });
                } else {
                  updateItem({ existingFlockId: v, flockId: v });
                }
              }} options={flocks.filter(f => f.status === 'active').map(f => {
                const hallName = halls.find(h => h.id === f.hallId)?.name;
                const countStr = typeof f.currentCount === 'number' ? `${getGlobalFormat().count(f.currentCount)} پرنده` : '';
                const meta = [countStr, hallName].filter(Boolean).join(' • ');
                const isLinked = Boolean(item.flockId && item.flockId === f.id);
                return {
                  value: f.id,
                  label: `${isLinked ? '🟢 ' : ''}${f.name}`,
                  subtitle: meta || undefined,
                  icon: 'flock',
                };
              })} placeholder="— ایجاد گله جدید —" modalTitle="انتخاب گله مبدأ" />
            </Field>

            <Grid2>
              <Field label="سالن مقصد">
                <SmartSelect value={String(item.hallId || '')} onChange={v => updateItem({ hallId: v, zoneId: '' })} options={halls.filter(h => !h.archived).map(h => ({ value: h.id, label: h.name, icon: 'hall' }))} placeholder="— انتخاب —" modalTitle="انتخاب سالن مقصد" />
              </Field>
              <Field label="بخش مقصد">
                <SmartSelect value={String(item.zoneId || '')} onChange={v => updateItem({ zoneId: v })} options={zones.filter(z => z.hallId === item.hallId && !z.archived).map(z => ({ value: z.id, label: z.name, icon: 'zone' }))} placeholder="— انتخاب —" disabled={!item.hallId} modalTitle="انتخاب بخش مقصد" />
              </Field>
            </Grid2>
          </>
        )}

        {/* --- بخش ۳: مقدار و فروش --- */}
        <Grid2>
          <Field label="وزن زنده (کیلوگرم)" hint="برای محاسبه قیمت">
            <Input mode="number" value={item.liveWeight != null && item.liveWeight > 0 ? String(item.liveWeight) : ''} onChange={e => updateItem({ liveWeight: parseFaNum(e.target.value) || null })} unit="کیلوگرم" min={0} placeholder="۰" />
          </Field>
          <Field label="قیمت بر حسب">
            <SmartSelect
              value={String(item.priceUnit || 'perBird')}
              modalTitle="انتخاب مبنای قیمت"
              options={[
                { value: 'perBird', label: 'به ازای هر پرنده' },
                { value: 'perKg', label: 'به ازای هر کیلوگرم' },
              ]}
              onChange={v => updateItem({ priceUnit: v })}
            />
          </Field>
        </Grid2>

        {/* --- بخش ۴: فروش (فقط فروش) --- */}
        {!isPurchase && (
          <Grid2>
            <Field label="دلیل فروش" error={err('saleReason')} onTouch={touch('saleReason')}>
              <SmartSelect
                value={String(item.saleReason || '')}
                modalTitle="انتخاب دلیل فروش"
                placeholder="— انتخاب —"
                options={[
                  { value: 'culling', label: 'حذف از گله (کالینگ)' },
                  { value: 'sick', label: 'بیماری' },
                  { value: 'old_age', label: 'سن بالا' },
                  { value: 'surplus', label: 'مازاد' },
                  { value: 'breeding_stock', label: 'فروش مولد' },
                  { value: 'other', label: 'سایر' },
                ]}
                onChange={v => updateItem({ saleReason: v })}
              />
            </Field>
          </Grid2>
        )}

        {sellerSlot}
      </div>
    );
  }

  
  const renderPurchaseStockSelector = (
    catLabel: string,
    modalTitle: string,
    placeholderExample: string,
    filteredWhs: any[],
    requiredField = false
  ) => {
    const selectedId = String(item.stockItemId || '');
    const isNewMode = !selectedId;
    const selectValue = selectedId || '__new__';

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <Field
          label="کالای انبار"
          error={err('stockItemId')}
          onTouch={touch('stockItemId')}
          required={requiredField}
          hint={isNewMode ? `نام قلم جدید را در فیلد نام وارد کنید` : `موجودی به این کالا در انبار اضافه می‌شود`}
        >
          <SmartSelect
            value={selectValue}
            onChange={v => {
              if (v === '__new__') {
                const prevW = whsItems.find(x => x.id === selectedId);
                updateItem({
                  stockItemId: '',
                  itemId: '',
                  description: prevW && item.description === prevW.name ? '' : item.description,
                });
                return;
              }
              const wItem = whsItems.find(x => x.id === v);
              updateItem({
                stockItemId: v,
                itemId: v,
                unit: wItem?.unit || item.unit,
                unitPrice: wItem?.lastPrice || item.unitPrice,
                description: wItem?.name || item.description,
              });
            }}
            options={[
              { value: '__new__', label: `تعریف ${catLabel} جدید در انبار` },
              ...filteredWhs.map(i => ({
                value: i.id,
                label: i.name, subtitle: `موجودی ${formatQty(i.currentStock, i.unit)}`,
              })),
            ]}
            placeholder={undefined}
            modalTitle={modalTitle}
          />
        </Field>

        
      </div>
    );
  };

  // ========== دان ==========
  if (category === 'feed') {
    const feedItems = (whsItems || []).filter(w => w.category === 'feed');
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>        <SecTitle icon="feed" title="اطلاعات دان" />
        {nameFieldJsx}        {isPurchase ? (
          renderPurchaseStockSelector('دان', 'انتخاب یا تعریف دان', 'ذرت، کنجاله سویا', feedItems, false)
        ) : (
          <Field label="کاهش از انبار" error={err('stockItemId')} onTouch={touch('stockItemId')} hint="برای کاهش از موجودی">
            <SmartSelect value={String(item.stockItemId || '')} onChange={v => {
              const wItem = whsItems.find(x => x.id === v);
              updateItem({
                stockItemId: v,
                itemId: v,
                unit: wItem?.unit || item.unit,
                unitPrice: wItem?.lastPrice || item.unitPrice,
                description: wItem?.name || item.description,
              });
            }} options={feedItems.map(i => ({ value: i.id, label: i.name, subtitle: `موجودی ${formatQty(i.currentStock, i.unit)}`, icon: '📦' }))} placeholder="— انتخاب —" modalTitle="انتخاب کالای انبار" />
          </Field>
        )}
        <Grid2>
          <Field label="تاریخ انقضا">
            <DatePicker value={String(item.expiryDate || '')} onChange={v => updateItem({ expiryDate: v })} placeholder="انتخاب تاریخ" />
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
              }} options={activeFlocks} placeholder="— بدون گله —" modalTitle="انتخاب گله" />
          </Field>
        </Grid2>
        {sellerSlot}
      </div>
    );
  }

  // ========== دارو ==========
  if (category === 'medicine') {
    const medItems = (whsItems || []).filter(w => w.category === 'medicine' || w.category === 'vaccine');
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>        <SecTitle icon="meds" title="اطلاعات دارو و واکسن" />
        {nameFieldJsx}        {isPurchase ? (
          renderPurchaseStockSelector('دارو / واکسن', 'انتخاب یا تعریف دارو و واکسن', 'انروفلوکساسین، تایلوزین', medItems, false)
        ) : (
          <Field label="کاهش از انبار" error={err('stockItemId')} onTouch={touch('stockItemId')} required hint="دارو/واکسن از انبار کاهش می‌یابد">
            <SmartSelect value={String(item.stockItemId || '')} onChange={v => {
              const wItem = whsItems.find(x => x.id === v);
              updateItem({
                stockItemId: v,
                itemId: v,
                unit: wItem?.unit || item.unit,
                unitPrice: wItem?.lastPrice || item.unitPrice,
                description: wItem?.name || item.description,
              });
            }} options={medItems.map(i => ({ value: i.id, label: i.name, subtitle: `موجودی ${formatQty(i.currentStock, i.unit)}`, icon: '📦' }))} placeholder="— انتخاب —" modalTitle="انتخاب دارو یا واکسن" />
          </Field>
        )}

        {/* ردیف ۲: تاریخ انقضا + دوره پرهیز */}
        <Grid2>
          <Field label="تاریخ انقضا">
            <DatePicker value={String(item.expiryDate || '')} onChange={v => updateItem({ expiryDate: v })} placeholder="انتخاب تاریخ" />
          </Field>
          {isPurchase && (
            <Field label="دوره پرهیز (روز)" hint="بعد از مصرف، چند روز فروش محصول ممنوع">
              <Input mode="number" value={item.withdrawalDays != null && item.withdrawalDays > 0 ? String(item.withdrawalDays) : ''} onChange={e => updateItem({ withdrawalDays: Math.round(parseFaNum(e.target.value)) || null })} unit="روز" min={0} max={365} />
            </Field>
          )}
        </Grid2>

        {/* ردیف ۳: برند + شماره بچ */}
        <Grid2>
          <Field label="برند / سازنده">
            <Input value={String(item.brand || '')} onChange={e => updateItem({ brand: e.target.value })} placeholder="برند" />
          </Field>
          <Field label="شماره بچ" hint="اگر خالی بماند، خودکار ساخته می‌شود">
            <Input value={String(item.batchNo || '')} onChange={e => updateItem({ batchNo: e.target.value })} placeholder="شماره" />
          </Field>
        </Grid2>

        {/* ردیف ۴: گله مقصد (اختیاری) */}
        <Field label={isPurchase ? "گله مقصد" : "گله مبدأ"} hint="هزینه به این گله متصل می‌شود" help={isPurchase ? "اگر این خرید را برای گله مشخصی انجام داده‌ای، گله را انتخاب کن تا هزینه همان لحظه در سود و زیان آن گله ثبت شود. اگر این کالا برای چند گله یا انبار عمومی خریده شده، این فیلد را خالی بگذار؛ هزینه بعداً هنگام مصرف در «ثبت روزانه» به‌طور خودکار روی گله سرشکن می‌شود." : "اگر این فروش را از گله مشخصی انجام داده‌ای، گله را انتخاب کن تا درآمد همان لحظه در سود و زیان آن گله ثبت شود."}>
          <SmartSelect value={String(item.flockId || '')} onChange={v => {
            const f = flocks.find(x => x.id === v);
            updateItem({ flockId: v, birdId: f?.birdId || item.birdId, breedId: f?.breedId || item.breedId, ageDays: f ? getAgeDays(f) : item.ageDays });
          }} options={activeFlocks} placeholder="— بدون گله —" modalTitle="انتخاب گله" />
        </Field>

        {sellerSlot}
      </div>
    );
  }

  if (category === 'manure' && !isPurchase) {
    const manureItems = (whsItems || []).filter(w => w.category === 'manure');
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>        <SecTitle icon="manure" title="اطلاعات کود" />
      {nameFieldJsx}        <Field label={isPurchase ? "افزودن به انبار" : "کاهش از انبار"} error={err('stockItemId')} onTouch={touch('stockItemId')} required={!isPurchase} hint={isPurchase ? "به موجودی اضافه" : "از موجودی کاهش"}>
          <SmartSelect
            value={String(item.stockItemId || '')}
            onChange={v => {
              const wItem = whsItems.find(x => x.id === v);
              updateItem({
                stockItemId: v,
                  itemId: v,
                  unit: wItem?.unit || item.unit,
                unitPrice: wItem?.lastPrice || item.unitPrice,
                description: wItem?.name || item.description,
              });
            }}
            options={manureItems.map(i => ({ value: i.id, label: i.name, subtitle: `موجودی ${formatQty(i.currentStock, i.unit)}`, icon: '📦' }))}
            placeholder="— انتخاب —"
            modalTitle="انتخاب کالای کود"
          />
        </Field>
        <Field label="گله مبدأ" required error={err('flockId')} onTouch={touch('flockId')} hint="گله‌ای که کود از آن تولید شده">
          <SmartSelect value={String(item.flockId || '')} onChange={v => {
                const f = flocks.find(x => x.id === v);
                updateItem({
                  flockId: v,
                  birdId: f?.birdId || item.birdId,
                  breedId: f?.breedId || item.breedId,
                  ageDays: f ? getAgeDays(f) : item.ageDays,
                });
              }} options={activeFlocks} placeholder={FIELD_META.flock.origin.placeholder} modalTitle="انتخاب گله مبدأ" />
        </Field>
        {sellerSlot}
      </div>
    );
  }


  // ========== تجهیزات ==========
  if (category === 'equipment') {
    const EQUIP_CATEGORIES = [
      { value: 'heating', label: 'گرمایش و مادر مصنوعی' },
      { value: 'cooling', label: 'سرمایش و مه‌پاش' },
      { value: 'ventilation', label: 'تهویه و هواکش' },
      { value: 'feeding', label: 'دانخوری' },
      { value: 'drinking', label: 'آبخوری' },
      { value: 'lighting', label: 'روشنایی و دیمر' },
      { value: 'cleaning', label: 'دستگاه و لوازم شست‌وشو' },
      { value: 'weighing', label: 'ترازو و باسکول' },
      { value: 'power', label: 'برق و ژنراتور' },
      { value: 'cage', label: 'قفس و تجهیزات نگهداری' },
      { value: 'other', label: 'سایر تجهیزات' },
    ];
    const EQUIP_KINDS = [
      { value: 'asset', label: 'تجهیز دائمی (سرمایه‌ای)' },
      { value: 'consumable', label: 'تجهیز مصرفی (ورود به انبار)' },
    ];

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>        <SecTitle icon="⚙️" title="مشخصات تجهیزات" />        {nameFieldJsx}
        <Grid2>
          <Field label="دسته تجهیزات" required error={err('equipmentCategory')} onTouch={touch('equipmentCategory')}>
            <SmartSelect
              value={String(item.equipmentCategory || '')}
              modalTitle="انتخاب دسته تجهیزات"
              placeholder="— انتخاب —"
              options={EQUIP_CATEGORIES}
              onChange={v => updateItem({ equipmentCategory: v, equipmentType: '' })}
            />
          </Field>
          <Field label="نوع تجهیز" required error={err('equipmentKind')} onTouch={touch('equipmentKind')}>
            <SmartSelect
              value={String(item.equipmentKind || item.equipmentType || '')}
              modalTitle="انتخاب نوع تجهیز"
              placeholder="— انتخاب —"
              options={EQUIP_KINDS}
              disabled={!item.equipmentCategory}
              onChange={v => updateItem({ equipmentKind: v, equipmentType: v })}
            />
          </Field>
        </Grid2>
      </div>
    );
  }

  // ========== تخم (خرید) و تخم نطفه‌دار (فروش) ==========
if (category === 'egg' || category === 'fertile_egg') {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>      <SecTitle icon="egg" title="اطلاعات تخم" />
      <Grid2>
        <Field label={FIELD_META.bird.label} required error={err('birdId')} onTouch={touch('birdId')}>
          <SmartSelect value={String(item.birdId || '')} error={err('birdId')} onChange={v => updateItem({ birdId: v, breedId: '' })} options={birds.map((b: any) => ({ value: b.id, label: b.name, icon: b.icon || ((b.name || '').includes('اردک') ? '🦆' : (b.name || '').includes('بوقلمون') ? '🦃' : (b.name || '').includes('بلدرچین') ? '🐦' : (b.name || '').includes('غاز') ? '🦢' : '🐔') }))} placeholder="— انتخاب —" modalTitle={FIELD_META.bird.modalTitle} />
        </Field>
        <Field label={FIELD_META.breed.label} required error={err('breedId')} onTouch={touch('breedId')}>
          <SmartSelect value={String(item.breedId || '')} error={err('breedId')} onChange={v => updateItem({ breedId: v })} options={breedsForBird.map((b) => {
            const purposeMap: Record<string, string> = { layer: '🥚 تخم‌گذار', breeder: '🐣 مادر', broiler: '🍗 گوشتی', ornamental: '🌸 زینتی' };
            const purposeLabels = (b.purposes || []).map((p: string) => purposeMap[p] || p);
            return { value: b.id, label: b.name, subtitle: purposeLabels.length > 0 ? purposeLabels.join('، ') : undefined };
          })} placeholder="— انتخاب —"
            disabled={!item.birdId} modalTitle={FIELD_META.breed.modalTitle} />
        </Field>
      </Grid2>
        {hasIncompatibleBreedsOnly && (
          <AlertBox tone="warn">
            نژادی با کاربرد «{missingPurposeHint}» برای این پرنده ثبت نشده است. لطفاً نژاد جدید بسازید.
          </AlertBox>
        )}
        {nameFieldJsx}
    </div>
  );
}

// ========== واکسن و داروی گیاهی ==========
if (category === 'vaccine' || category === 'herbal') {
    const subItems = (whsItems || []).filter(w => w.category === category);
    const subLabel = category === 'vaccine' ? 'واکسن' : 'داروی گیاهی';
    const subExample = category === 'vaccine' ? 'واکسن نیوکاسل، برونشیت' : 'عرقیات، سیر';
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>        <SecTitle icon="meds" title={category === 'vaccine' ? 'اطلاعات واکسن' : 'اطلاعات داروی گیاهی'} />
      {nameFieldJsx}        {isPurchase ? (
          renderPurchaseStockSelector(subLabel, `انتخاب یا تعریف ${subLabel}`, subExample, subItems, false)
        ) : (
          <Field
            label="کاهش از انبار"
            required
            error={err('stockItemId')}
            onTouch={touch('stockItemId')}
            hint="از موجودی کاهش می‌یابد"
          >
            <SmartSelect
              value={String(item.stockItemId || '')}
              error={err('stockItemId')}
              onChange={v => {
                const wItem = whsItems.find(x => x.id === v);
                updateItem({
                  stockItemId: v,
                  itemId: v,
                  unit: wItem?.unit || item.unit,
                  unitPrice: wItem?.lastPrice || item.unitPrice,
                  description: wItem?.name || item.description,
                });
              }}
              options={subItems.map(i => ({ value: i.id, label: i.name, subtitle: `موجودی ${formatQty(i.currentStock, i.unit)}`, icon: '📦' }))}
              placeholder="— انتخاب —"
              modalTitle={category === 'vaccine' ? 'انتخاب واکسن' : 'انتخاب داروی گیاهی'}
            />
          </Field>
        )}
      {sellerSlot}
    </div>
  );
}

  // ========== سایر ==========
  if (category === 'other') {
    const COST_TYPES = [
      { value: 'fuel', label: 'سوخت و گرمایش', icon: '⛽' },
      { value: 'bedding', label: 'بستر و پوشال', icon: '🌾' },
      { value: 'biosecurity', label: 'مواد ضدعفونی و بهداشتی', icon: '🧴' },
      { value: 'vet_lab', label: 'دامپزشکی و آزمایشگاه', icon: '🩺' },
      { value: 'labor', label: 'دستمزد و کارگر', icon: '👷' },
      { value: 'utilities', label: 'قبوض آب، برق، گاز', icon: '⚡' },
      { value: 'transport', label: 'حمل و نقل', icon: '🚚' },
      { value: 'maintenance', label: 'تعمیرات و نگهداری', icon: '🔧' },
      { value: 'packaging', label: 'بسته‌بندی', icon: '📦' },
      { value: 'rent', label: 'اجاره سالن و انبار', icon: '🏠' },
      { value: 'other', label: 'سایر هزینه‌ها', icon: '📋' },
    ];
    const ct = String(item.costType || '');
    const otherCfg = getOtherCostConfig(ct);
    const hasExpiry = (ct === 'biosecurity' && item.unit !== 'flat' && item.unit !== 'service') || (ct === 'other' && item.unit !== 'flat');
    const refLabels: Record<string, { label: string; placeholder: string }> = {
      fuel:        { label: 'شماره حواله / سهمیه', placeholder: 'اختیاری' },
      transport:   { label: 'شماره بارنامه / باسکول', placeholder: 'اختیاری' },
      bedding:     { label: 'شماره قبض باسکول', placeholder: 'اختیاری' },
      rent:        { label: 'شماره قرارداد', placeholder: 'اختیاری' },
      vet_lab:     { label: 'شماره جواب آزمایش / نسخه', placeholder: 'اختیاری' },
    };
    const showPeriod = ['utilities', 'labor', 'rent'].includes(ct);

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>        <SecTitle icon="📋" title={ct ? otherCfg.sectionTitle : 'مشخصات قلم'} />        <Grid2>
          {isPurchase && (
            <Field label="زیرمجموعه" help={"**سوخت و گرمایش** گازوئیل، گاز و کپسول (هزینه جاری)\n**بستر و پوشال** پوشال، کلش و خاک‌اره (ورود به انبار)\n**ضدعفونی و شست‌وشو** مواد ضدعفونی (ورود به انبار) یا شست‌وشوی مقطوع سالن\n**دامپزشکی و آزمایشگاه** ویزیت دامپزشک، کالبدگشایی و آزمایش‌ها\n**دستمزد و کارگر** کارگر روزمزد، ماهانه یا کنتراتی\n**قبوض آب، برق، گاز** قبوض دوره‌ای با ثبت مبلغ کل\n**حمل و نقل** کرایه بار (دربستی، تنی یا کیلومتری)\n**تعمیرات و نگهداری** تعمیر تجهیزات و تأسیسات سالن\n**بسته‌بندی** شانه، کارتن، کیسه و رول (ورود به انبار)\n**اجاره سالن و انبار** اجاره ماهانه یا روزانه\n**سایر هزینه‌ها** سایر اقلام و هزینه‌های متفرقه فارم"} required error={err('costType')} onTouch={touch('costType')}>
              <SmartSelect
                value={ct}
                modalTitle="انتخاب زیرمجموعه"
                placeholder="— انتخاب —"
                options={COST_TYPES}
                onChange={v => {
                  const cfg = getOtherCostConfig(v);
                  updateItem({
                    costType: v,
                    unit: cfg.defaultUnit,
                    priceUnit: cfg.defaultUnit,
                    ...(!cfg.showShipping ? { shipping: 0 } : {}),
                    ...(cfg.isFlat ? { quantity: 1 } : {}),
                  });
                }}
              />
            </Field>
          )}
          <Field label="گله مقصد" hint="سرشکن هزینه روی گله">
            <SmartSelect value={String(item.flockId || '')} onChange={v => {
              const f = flocks.find(x => x.id === v);
              updateItem({
                flockId: v,
                birdId: f?.birdId || item.birdId,
                breedId: f?.breedId || item.breedId,
                ageDays: f ? getAgeDays(f) : item.ageDays,
              });
            }} options={activeFlocks} placeholder="— بدون گله (سربار کل) —" modalTitle="انتخاب گله" />
          </Field>
        </Grid2>
            {nameFieldJsx}        {ct === 'utilities' && (
          <>
            <Grid2>
              <Field label="شناسه قبض">
                <Input value={String(item.billId || '')} onChange={e => updateItem({ billId: e.target.value })} placeholder="شناسه" />
              </Field>
              <Field label="شناسه پرداخت">
                <Input value={String(item.paymentId || '')} onChange={e => updateItem({ paymentId: e.target.value })} placeholder="شناسه" />
              </Field>
            </Grid2>
            <Grid2>
              <Field label="شماره اشتراک">
                <Input value={String(item.subscriptionNo || '')} onChange={e => updateItem({ subscriptionNo: e.target.value })} placeholder="اختیاری" />
              </Field>
              <Field label="دوره قبض">
                <Input value={String(item.periodLabel || '')} onChange={e => updateItem({ periodLabel: e.target.value })} placeholder="دوره" />
              </Field>
            </Grid2>
          </>
        )}

        {ct === 'maintenance' && (
          <Field label="سالن مرتبط">
            <SmartSelect
              value={String(item.hallId || '')}
              onChange={v => updateItem({ hallId: v })}
              options={halls.map(h => ({ value: h.id, label: h.name }))}
              placeholder={FIELD_META.hall.relatedOptional.placeholder}
              modalTitle="انتخاب سالن"
            />
          </Field>
        )}

        {(refLabels[ct] || (showPeriod && ct !== 'utilities')) && (
          <Grid2>
            {refLabels[ct] && (
              <Field label={refLabels[ct].label}>
                <Input value={String(item.refNo || '')} onChange={e => updateItem({ refNo: e.target.value })} placeholder={refLabels[ct].placeholder} />
              </Field>
            )}
            {showPeriod && ct !== 'utilities' && (
              <Field label={ct === 'rent' ? 'دوره اجاره' : 'دوره کارکرد'}>
                <Input value={String(item.periodLabel || '')} onChange={e => updateItem({ periodLabel: e.target.value })} placeholder="نام دوره" />
              </Field>
            )}
          </Grid2>
        )}

        {hasExpiry && (
          <Field label="تاریخ انقضا">
            <DatePicker value={String(item.expiryDate || '')} onChange={v => updateItem({ expiryDate: v })} placeholder="انتخاب تاریخ" />
          </Field>
        )}
        {sellerSlot}
      </div>
    );
  }

  // ========== تخم شکسته (فقط فروش) ==========
  if (category === 'broken' && !isPurchase) {
    const brokenItems = (whsItems || []).filter(w =>
      w.category === 'broken' ||
      (w.category === 'egg' && (w.name === 'تخم مصرفی' || w.name === 'تخم شکسته'))
    );
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>        <SecTitle icon="broken_egg" title="اطلاعات تخم شکسته" />
        {/* انتخاب از تولیدات تخم — شکسته */}
        <Field label="تولیدات تخم شکسته" hint="برای پر شدن خودکار مشخصات">
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
              label: prod.date, subtitle: `${prod.brokenCount} عدد`
            }))}
            placeholder="— انتخاب از تولیدات —"
            modalTitle="انتخاب از تولیدات تخم شکسته"
          />
        </Field>

        {/* ردیف ۱: گله + تاریخ */}
        <Grid2>
          <Field label="گله مبدأ" required error={err('flockId')} onTouch={touch('flockId')}>
            <SmartSelect value={String(item.flockId || '')} onChange={v => {
                const f = flocks.find(x => x.id === v);
                updateItem({
                  flockId: v,
                  birdId: f?.birdId || item.birdId,
                  breedId: f?.breedId || item.breedId,
                  ageDays: f ? getAgeDays(f) : item.ageDays,
                });
              }} options={activeFlocks} placeholder={FIELD_META.flock.origin.placeholder} modalTitle="انتخاب گله مبدأ" />
          </Field>
          <Field label="تاریخ تولید تخم">
            <DatePicker value={String(item.eggDate || '')} onChange={v => updateItem({ eggDate: v })} placeholder="انتخاب تاریخ" autoToday />
          </Field>
        </Grid2>
        {nameFieldJsx}

        {/* ردیف ۲: تعداد شکسته + تعداد کل */}
        <Grid2>
          <Field label="تعداد شکسته" hint="اختیاری — جزئیات">
            <Input mode="number" value={item.brokenEggCount != null && item.brokenEggCount > 0 ? String(item.brokenEggCount) : ''} onChange={e => updateItem({ brokenEggCount: Math.round(parseFaNum(e.target.value)) || null })} unit="عدد" min={0} />
          </Field>

        </Grid2>

        {/* ردیف ۳: انتخاب از انبار — تمام عرض */}
        <Field label={isPurchase ? "افزودن به انبار" : "کاهش از انبار"} error={err('stockItemId')} onTouch={touch('stockItemId')} required={!isPurchase} hint={isPurchase ? "به موجودی اضافه" : "از موجودی کاهش"}>
          <SmartSelect
            value={String(item.stockItemId || '')}
            onChange={v => {
              const wItem = whsItems.find(x => x.id === v);
              updateItem({
                stockItemId: v,
                  itemId: v,
                  unit: wItem?.unit || item.unit,
                unitPrice: wItem?.lastPrice || item.unitPrice,
                description: wItem?.name || item.description,
              });
            }}
            options={brokenItems.map(i => ({ value: i.id, label: i.name, subtitle: `موجودی ${formatQty(i.currentStock, i.unit)}`, icon: '📦' }))}
            placeholder="— انتخاب —"
            modalTitle="انتخاب کالای تخم شکسته"
          />
        </Field>

        {sellerSlot}
      </div>
    );
  }

  return null;
}
