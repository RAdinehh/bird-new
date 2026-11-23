import { getGlobalFormat } from '../units/useFormat';
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
    return { value: f.id, label: f.name, subtitle: parts.join(' · ') || undefined };
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
      error={err('description')}
      onTouch={touch('description')}
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
          <Grid2>
            <Field label="منبع جوجه" hint="جوجه از گله موجود می‌آید یا از هچری">
              <SmartSelect
                value={String(item.source || 'flock')}
                modalTitle="انتخاب منبع جوجه"
                options={[
                  { value: 'flock', label: '🐔 از گله موجود' },
                  { value: 'hatch', label: '🥚 از هچری' },
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
              }} options={availableHatches.map(h => ({ value: h.id, label: `${h.date} — ${h.hatched} جوجه` }))} placeholder="— انتخاب هچ —" modalTitle="انتخاب هچ" />
            </Field>
          ) : (
            <Field label="گله مبدأ" required error={err('flockId')} onTouch={touch('flockId')}>
              <SmartSelect value={String(item.flockId || '')} onChange={v => {
                const f = flocks.find(x => x.id === v);
                const age = computeAgeFromHatch(f?.hatchDate);
                updateItem({ flockId: v, source: 'flock', hatchId: '', birdId: f?.birdId || item.birdId, breedId: f?.breedId || item.breedId, ageDays: age != null ? age : (f ? getAgeDays(f) : item.ageDays), hatchDate: f?.hatchDate || item.hatchDate });
                setHatchOverride(false);
              }} options={flocksForItem(item)} placeholder="— انتخاب گله —" modalTitle="انتخاب گله" />
            </Field>
          )}
          </Grid2>
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
          <Field label="نوع پرنده" required error={err('birdId')} onTouch={touch('birdId')}>
            <SmartSelect value={String(item.birdId || '')} error={err('birdId')} onChange={v => updateItem({ birdId: v, breedId: '' })} options={birds.map(b => ({ value: b.id, label: b.name }))} placeholder="— انتخاب —" modalTitle="انتخاب پرنده" disabled={!!item.existingFlockId || (!isPurchase && !!item.flockId)} />
          </Field>
          <Field label="نژاد" required error={err('breedId')} onTouch={touch('breedId')}>
            <SmartSelect value={String(item.breedId || '')} error={err('breedId')} onChange={v => updateItem({ breedId: v })} options={breedsForBird.map((b) => {
              const purposeMap: Record<string, string> = { layer: '🥚 تخم‌گذار', breeder: '🐣 مادر', broiler: '🍗 گوشتی', ornamental: '🌸 زینتی' };
              const purposeLabels = (b.purposes || []).map((p: string) => purposeMap[p] || p);
              return { value: b.id, label: purposeLabels.length > 0 ? `${b.name} — ${purposeLabels.join('، ')}` : b.name };
            })} placeholder="— انتخاب —" modalTitle="انتخاب نژاد" disabled={!!item.existingFlockId || (!isPurchase && !!item.flockId)} />
            {item.birdId && breedsForBird.length === 0 && (
              <div style={{ color: 'var(--warn)', fontSize: 11, marginTop: 4, fontWeight: 600 }}>
                ⚠️ این پرنده هنوز نژادی ندارد. ابتدا از بخش «پرنده و نژاد» نژاد تعریف کنید.
              </div>
            )}
          </Field>
        </Grid2>
        {hasIncompatibleBreedsOnly && (
          <AlertBox tone="warn">
            نژادی با کاربرد «{missingPurposeHint}» برای این پرنده ثبت نشده است. لطفاً نژاد جدید بسازید.
          </AlertBox>
        )}

        {/* ردیف ۲: تاریخ هچ + سن */}
        <Grid2>
          {isPurchase ? (
            <Field label="تاریخ هچ" required error={err('hatchDate')} onTouch={touch('hatchDate')} hint={category === 'chick' && (item.ageDays ?? 0) > 14 ? '💡 سن بیش از ۱۴ روز (گله دوره قبل یا نیمچه)' : undefined}>
              <DatePicker value={String(item.hatchDate || '')} onChange={v => {
                const age = computeAgeFromHatch(v);
                updateItem({ hatchDate: v, ageDays: age });
              }} placeholder="1405/07/26" />
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
              }} placeholder="1405/07/26" />
            </Field>
          )}
          {!isPurchase && (item.flockId || item.hatchId) && !hatchOverride ? (
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
              }} unit="روز" min={0} placeholder="مثلاً ۹۰" />
            </Field>
          )}
        </Grid2>

        {/* ردیف ۳: منبع (هچ/گله) */}
        {isPurchase && (
          <Field label="اتصال به گله موجود" hint="اتصال به گله دستی">
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
                  label: `${isLinked ? '🟢 ' : ''}${f.name}${meta ? ` — ${meta}` : ''}`,
                };
              })} placeholder="— ایجاد گله جدید —" modalTitle="انتخاب گله" />
          </Field>
        )}

        {/* --- بخش ۲: مکان --- */}
        {isPurchase && (
          <Grid2>
            <Field label="سالن مقصد">
              <SmartSelect value={String(item.hallId || '')} onChange={v => updateItem({ hallId: v, zoneId: '' })} options={halls.filter(h => !h.archived).map(h => ({ value: h.id, label: h.name }))} placeholder="— سالن —" modalTitle="انتخاب سالن" />
            </Field>
            <Field label="بخش مقصد (اختیاری)">
              <SmartSelect value={String(item.zoneId || '')} onChange={v => updateItem({ zoneId: v })} options={zones.filter(z => z.hallId === item.hallId && !z.archived).map(z => ({ value: z.id, label: z.name }))} placeholder="— انتخاب بخش —" disabled={!item.hallId} modalTitle="انتخاب بخش" />
            </Field>
          </Grid2>
        )}

        {/* --- بخش ۳: مقدار --- */}
        <Grid2>
          <Field label={isPurchase ? "وزن اولیه (گرم)" : "میانگین وزن (گرم)"} hint={isPurchase ? "حداکثر ۱۰۰ گرم" : undefined}>
            <Input mode="number" value={item.chickWeight != null && item.chickWeight > 0 ? String(item.chickWeight) : ''} onChange={e => {
              let v = parseFaNum(e.target.value) || null;
              if (isPurchase && v !== null && v > 100) v = 100;
              updateItem({ chickWeight: v });
            }} unit="g" min={isPurchase ? 20 : 0} max={isPurchase ? 100 : 50000} />
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
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {nameFieldJsx}
        <SecTitle icon="🐓" title="اطلاعات پرنده بالغ" />

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
                return { value: f.id, label: `${f.name} — ${b ? `${b.name} · ` : ''}${getGlobalFormat().count(f.currentCount ?? 0)} پرنده · ${getGlobalFormat().int(getAgeDays(f))} روز` };
              })}
              placeholder="— انتخاب گله —"
              modalTitle="انتخاب گله مبدأ"
            />
          </Field>
        )}

        {/* --- بخش ۱: هویت مشتق‌شده از گله --- */}
        <Grid2>
          <Field label="نوع پرنده" required error={err('birdId')} onTouch={touch('birdId')} lockedFrom={isSaleLocked ? "گله" : undefined}>
            <SmartSelect value={String(item.birdId || '')} error={err('birdId')} onChange={v => updateItem({ birdId: v, breedId: '' })} options={birds.map(b => ({ value: b.id, label: b.name }))} placeholder="— انتخاب —" modalTitle="انتخاب پرنده" disabled={isLocked} />
          </Field>
          <Field label="نژاد" required error={err('breedId')} onTouch={touch('breedId')} lockedFrom={isSaleLocked ? "گله" : undefined}>
            <SmartSelect value={String(item.breedId || '')} error={err('breedId')} onChange={v => updateItem({ breedId: v })} options={breedsForBird.map((b) => {
              const purposeMap: Record<string, string> = { layer: '🥚 تخم‌گذار', breeder: '🐣 مادر', broiler: '🍗 گوشتی', ornamental: '🌸 زینتی' };
              const purposeLabels = (b.purposes || []).map((p: string) => purposeMap[p] || p);
              return { value: b.id, label: purposeLabels.length > 0 ? `${b.name} — ${purposeLabels.join('، ')}` : b.name };
            })} placeholder="— انتخاب —" modalTitle="انتخاب نژاد" disabled={isLocked || !item.birdId} />
          </Field>
        </Grid2>
        {hasIncompatibleBreedsOnly && (
          <AlertBox tone="warn">
            نژادی با کاربرد «{missingPurposeHint}» برای این پرنده ثبت نشده است. لطفاً نژاد جدید بسازید.
          </AlertBox>
        )}

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
              }} placeholder="1405/07/26" />
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
              }} unit="روز" min={0} placeholder="مثلاً ۹۰" />
            </Field>
          )}
        </Grid2>

        {/* --- بخش ۲: اتصال به گله و مکان (فقط در خرید) --- */}
        {isPurchase && (
          <>
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
                  label: `${isLinked ? '🟢 ' : ''}${f.name}${meta ? ` — ${meta}` : ''}`,
                };
              })} placeholder="— ایجاد گله جدید —" modalTitle="انتخاب گله" />
            </Field>

            <Grid2>
              <Field label="سالن مقصد">
                <SmartSelect value={String(item.hallId || '')} onChange={v => updateItem({ hallId: v, zoneId: '' })} options={halls.filter(h => !h.archived).map(h => ({ value: h.id, label: h.name }))} placeholder="— سالن —" modalTitle="انتخاب سالن" />
              </Field>
              <Field label="بخش مقصد (اختیاری)">
                <SmartSelect value={String(item.zoneId || '')} onChange={v => updateItem({ zoneId: v })} options={zones.filter(z => z.hallId === item.hallId && !z.archived).map(z => ({ value: z.id, label: z.name }))} placeholder="— انتخاب بخش —" disabled={!item.hallId} modalTitle="انتخاب بخش" />
              </Field>
            </Grid2>
          </>
        )}

        {/* --- بخش ۳: مقدار و فروش --- */}
        <Grid2>
          <Field label="وزن زنده کل (کیلوگرم)" hint="برای محاسبه قیمت">
            <Input mode="number" value={item.liveWeight != null && item.liveWeight > 0 ? String(item.liveWeight) : ''} onChange={e => updateItem({ liveWeight: parseFaNum(e.target.value) || null })} unit="kg" min={0} placeholder="مثلاً ۱۲۰۰" />
          </Field>
          <Field label="واحد قیمت">
            <SmartSelect
              value={String(item.priceUnit || 'perBird')}
              modalTitle="انتخاب واحد قیمت"
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
          label={`انتخاب ${catLabel} از انبار یا تعریف جدید`}
          error={err('stockItemId')}
          onTouch={touch('stockItemId')}
          required={requiredField}
          hint={isNewMode ? `کالای جدید با نام زیر در انبار ساخته می‌شود` : `موجودی به این کالا در انبار اضافه می‌شود`}
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
              { value: '__new__', label: `➕ تعریف ${catLabel} جدید در انبار` },
              ...filteredWhs.map(i => ({
                value: i.id,
                label: `${i.name} — موجودی ${formatQty(i.currentStock, i.unit)}`,
              })),
            ]}
            placeholder={undefined}
            modalTitle={modalTitle}
          />
        </Field>

        {isNewMode && (
          <Field
            label={`نام ${catLabel} جدید (برای ثبت در انبار)`}
            required
            error={err('description')}
            onTouch={touch('description')}
            hint="این نام به عنوان کالای جدید در انبار ثبت و ذخیره می‌شود"
          >
            <Input
              placeholder={placeholderExample}
              value={String(item.description || '')}
              onChange={e => updateItem({ description: e.target.value })}
            />
          </Field>
        )}
      </div>
    );
  };

  // ========== دان ==========
  if (category === 'feed') {
    const feedItems = (whsItems || []).filter(w => w.category === 'feed');
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {!isPurchase && nameFieldJsx}
        <SecTitle icon="🌾" title="اطلاعات دان" />
        {isPurchase ? (
          renderPurchaseStockSelector('دان', 'انتخاب یا تعریف دان', 'مثلاً دان استارتر پلت', feedItems, false)
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
            }} options={feedItems.map(i => ({ value: i.id, label: `${i.name} — موجودی ${formatQty(i.currentStock, i.unit)}` }))} placeholder="— انتخاب کالای انبار —" modalTitle="انتخاب کالای انبار" />
          </Field>
        )}
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
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {!isPurchase && nameFieldJsx}
        <SecTitle icon="💊" title="اطلاعات دارو و واکسن" />
        {isPurchase ? (
          renderPurchaseStockSelector('دارو / واکسن', 'انتخاب یا تعریف دارو و واکسن', 'مثلاً انروفلوکساسین ۱۰٪ یا واکسن نیوکاسل', medItems, false)
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
            }} options={medItems.map(i => ({ value: i.id, label: `${i.name} — موجودی ${formatQty(i.currentStock, i.unit)}` }))} placeholder="— انتخاب از انبار —" modalTitle="انتخاب دارو یا واکسن" />
          </Field>
        )}

        {/* ردیف ۲: تاریخ انقضا + دوره پرهیز */}
        <Grid2>
          <Field label="تاریخ انقضا">
            <DatePicker value={String(item.expiryDate || '')} onChange={v => updateItem({ expiryDate: v })} placeholder="1405/12/29" />
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
            <Input value={String(item.brand || '')} onChange={e => updateItem({ brand: e.target.value })} placeholder="نام برند" />
          </Field>
          <Field label="شماره بچ (اختیاری)" hint="اگر خالی بماند، خودکار ساخته می‌شود">
            <Input value={String(item.batchNo || '')} onChange={e => updateItem({ batchNo: e.target.value })} placeholder="مثلاً A123" />
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
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {nameFieldJsx}
        <SecTitle icon="💩" title="اطلاعات کود" />
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
            options={manureItems.map(i => ({ value: i.id, label: `${i.name} — موجودی ${formatQty(i.currentStock, i.unit)}` }))}
            placeholder="— انتخاب کالای انبار —"
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
              }} options={activeFlocks} placeholder="— بدون گله —" modalTitle="انتخاب گله" />
        </Field>
        {sellerSlot}
      </div>
    );
  }


  // ========== تجهیزات ==========
  if (category === 'equipment') {
    const EQUIP_CATEGORIES = [
      { value: 'heating', label: 'گرمایشی' },
      { value: 'cooling', label: 'سرمایشی' },
      { value: 'ventilation', label: 'تهویه' },
      { value: 'feeding', label: 'تغذیه' },
      { value: 'watering', label: 'آبخوری' },
      { value: 'lighting', label: 'روشنایی' },
      { value: 'cage', label: 'قفس و تجهیزات نگهداری' },
      { value: 'other', label: 'سایر' },
    ];
    const EQUIP_TYPES = [
      { value: 'asset', label: 'دارایی ثابت (Asset)' },
      { value: 'consumable', label: 'مصرفی (Consumable)' },
    ];

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {nameFieldJsx}
        <SecTitle icon="⚙️" title="مشخصات تجهیزات" />
        <Grid2>
          <Field label="دسته تجهیزات" required error={err('equipmentCategory')} onTouch={touch('equipmentCategory')}>
            <SmartSelect value={String(item.equipmentCategory || '')} modalTitle="انتخاب دسته‌بندی تجهیز" placeholder="— انتخاب —" options={EQUIP_CATEGORIES.map((c: any) => ({ value: c.value, label: c.label }))} onChange={v => updateItem({ equipmentCategory: v, equipmentType: '' })} />
          </Field>
          <Field label="نوع تجهیز" required error={err('equipmentType')} onTouch={touch('equipmentType')}>
            <Select value={String(item.equipmentType || '')} onChange={e => updateItem({ equipmentType: e.target.value })}>
              <option value="">— انتخاب —</option>
              {EQUIP_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </Select>
          </Field>
        </Grid2>
      </div>
    );
  }

// ========== تخم (خرید) و تخم نطفه‌دار (فروش) ==========
if (category === 'egg' || category === 'fertile_egg') {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {nameFieldJsx}
      <SecTitle icon="🥚" title="اطلاعات تخم" />
      <Grid2>
        <Field label="نوع پرنده" required error={err('birdId')} onTouch={touch('birdId')}>
          <SmartSelect value={String(item.birdId || '')} error={err('birdId')} onChange={v => updateItem({ birdId: v, breedId: '' })} options={birds.map(b => ({ value: b.id, label: b.name }))} placeholder="— انتخاب —" modalTitle="انتخاب پرنده" />
        </Field>
        <Field label="نژاد" required error={err('breedId')} onTouch={touch('breedId')}>
          <SmartSelect value={String(item.breedId || '')} error={err('breedId')} onChange={v => updateItem({ breedId: v })} options={breedsForBird.map((b) => {
            const purposeMap: Record<string, string> = { layer: '🥚 تخم‌گذار', breeder: '🐣 مادر', broiler: '🍗 گوشتی', ornamental: '🌸 زینتی' };
            const purposeLabels = (b.purposes || []).map((p: string) => purposeMap[p] || p);
            return { value: b.id, label: purposeLabels.length > 0 ? `${b.name} — ${purposeLabels.join('، ')}` : b.name };
          })} placeholder="— انتخاب —" modalTitle="انتخاب نژاد" />
        </Field>
      </Grid2>
        {hasIncompatibleBreedsOnly && (
          <AlertBox tone="warn">
            نژادی با کاربرد «{missingPurposeHint}» برای این پرنده ثبت نشده است. لطفاً نژاد جدید بسازید.
          </AlertBox>
        )}
    </div>
  );
}

// ========== واکسن و داروی گیاهی ==========
if (category === 'vaccine' || category === 'herbal') {
    const subItems = (whsItems || []).filter(w => w.category === category);
    const subLabel = category === 'vaccine' ? 'واکسن' : 'داروی گیاهی';
    const subExample = category === 'vaccine' ? 'مثلاً واکسن برونشیت H120' : 'مثلاً عصاره آویشن و اکالیپتوس';
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {!isPurchase && nameFieldJsx}
        <SecTitle icon="💊" title={category === 'vaccine' ? 'اطلاعات واکسن' : 'اطلاعات داروی گیاهی'} />
        {isPurchase ? (
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
              options={subItems.map(i => ({ value: i.id, label: `${i.name} — موجودی ${formatQty(i.currentStock, i.unit)}` }))}
              placeholder="— انتخاب کالای انبار —"
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
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {nameFieldJsx}
        <SecTitle icon="📋" title="اطلاعات هزینه" />
        <Grid2>
          {isPurchase && (
          <Field label="نوع هزینه" hint="برای گزارش‌های مالی" required error={err('costType')} onTouch={touch('costType')}>
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
              }} options={activeFlocks} placeholder="— بدون گله —" modalTitle="انتخاب گله" />
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
  if (category === 'broken' && !isPurchase) {
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
          <Field label="گله مبدأ" required error={err('flockId')} onTouch={touch('flockId')}>
            <SmartSelect value={String(item.flockId || '')} onChange={v => {
                const f = flocks.find(x => x.id === v);
                updateItem({
                  flockId: v,
                  birdId: f?.birdId || item.birdId,
                  breedId: f?.breedId || item.breedId,
                  ageDays: f ? getAgeDays(f) : item.ageDays,
                });
              }} options={activeFlocks} placeholder="— انتخاب گله —" modalTitle="انتخاب گله" />
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
            options={brokenItems.map(i => ({ value: i.id, label: `${i.name} — موجودی ${formatQty(i.currentStock, i.unit)}` }))}
            placeholder="— انتخاب کالای انبار —"
            modalTitle="انتخاب کالای تخم شکسته"
          />
        </Field>

        {sellerSlot}
      </div>
    );
  }

  return null;
}
