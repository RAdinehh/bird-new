/**
 * FeedSection — تغذیه و آب
 * IDEA-25: پشتیبانی چند منبع دان (backward-compatible)
 */
import { useMemo, useState } from 'react';
import { Field, Grid2, NumField, Btn, Select, Sheet, AlertBox, Tag, SummaryCard } from '../../../shr/components/ui';
import { HelpIcon } from '../../../shr/components/ui/HelpIcon';
import SmartSelect from '../../../shr/components/SmartSelect';
import { UNIT_LABEL } from '../../whs/store';
import { toFa, toEn } from '../../../shr/utils/fa';
import { WATER_SYSTEM_LABEL } from '../../../shr/utils/systemType';
import { useFed } from '../../fed/store';
import { useWhs } from '../../whs/store';
import type { F } from '../types';
import type { FeedSource } from '../store';
import { useFlk, getAgeDays } from '../../flk/store';
import { useBrd } from '../../brd/store';
import { FieldHint } from '../../../shr/intelligence/FieldHint';
import { getStandardFor, findInRange } from '../../set/standards/resolve';

interface Props {
  form: F;
  setForm: React.Dispatch<React.SetStateAction<F>>;
  vErrors: Record<string, string>;
  showError: (field: string) => string | undefined;
  markTouched: (field: string) => void;
}

export default function FeedSection({ form, setForm }: Props) {
  const { formulas, ingredients } = useFed();
  const isFeedAuto = ['semi_auto', 'auto_sensor', 'auto_chain'].includes(form.feedMethod || '');
  const isWaterAuto = ['nipple', 'trough', 'tank'].includes(form.waterMethod || '');
  const [hallSheetOpen, setHallSheetOpen] = useState(false);
  const [expandedSourceId, setExpandedSourceId] = useState<string | null>(null);
  const FEED_METHOD_OPTIONS = [
    { value: 'scoop', label: 'قیفی (سطل)' },
    { value: 'bag', label: 'کیسه‌ای' },
    { value: 'semi_auto', label: 'نیمه‌اتومات' },
    { value: 'auto_sensor', label: 'اتومات با سنسور' },
    { value: 'auto_chain', label: 'اتومات زنجیری' },
  ];
  const WATER_METHOD_OPTIONS = [
    { value: 'manual', label: 'دستی (سطل/مخزن)' },
    { value: 'nipple', label: 'نیپل اتومات' },
    { value: 'trough', label: 'کانالی' },
    { value: 'tank', label: 'مخزن اتومات' },
  ];
  const [editFeedMethod, setEditFeedMethod] = useState(false);
  const [editWaterMethod, setEditWaterMethod] = useState(false);
  const { items: whsItems } = useWhs();
  const feedItems = useMemo(() => whsItems.filter(x => x.category === 'feed'), [whsItems]);
  const num = (s: string) => s ? parseFloat(toEn(s).replace('٫','.')) || null : null;
  const int = (s: string) => s ? parseInt(toEn(s)) || null : null;

  const { flocks } = useFlk();
  const { breeds } = useBrd();
  const selectedFlock = flocks.find(f => f.id === form.flockId);
  const flockSize = selectedFlock?.currentCount || selectedFlock?.initialCount || 0;

  const sources: FeedSource[] = form.feedSources && form.feedSources.length > 0
    ? form.feedSources
    : (form.feedSourceId
      ? [{ id: 'legacy', type: (form.feedSourceType || 'item') as 'formula' | 'item', refId: form.feedSourceId, quantity: num(form.feedDelivered) || 0 }]
      : []);

  const totalFeed = sources.reduce((s, x) => s + (x.quantity || 0), 0);
  const remainingNum = num(form.feedRemaining) || 0;
  const consumedFeed = Math.max(0, totalFeed - remainingNum);
  const feedPerBirdG = flockSize > 0 && consumedFeed > 0 ? (consumedFeed * 1000) / flockSize : 0;

  // 🆕 استاندارد نژاد → انتظار دان/پرنده
  let expectedPerBirdG: number | null = null;
  try {
    const breedObj = breeds.find((b: any) => b.id === selectedFlock?.breedId);
    const bName = breedObj?.name || (selectedFlock as any)?.breedLabel || '';
    if (bName) {
      const std = getStandardFor(bName);
      if (std) {
        const ag = selectedFlock ? getAgeDays(selectedFlock) : 0;
        const rng = findInRange(std.feed, ag);
        expectedPerBirdG = rng?.feedG ?? null;
      }
    }
  } catch { /* silent */ }

  


  // debug info برای نمایش موقت در UI

  const syncSources = (newSources: FeedSource[]) => {
    const total = newSources.reduce((s, x) => s + (x.quantity || 0), 0);
    const first = newSources[0];
    setForm(prev => ({
      ...prev,
      feedSources: newSources,
      feedSourceType: first?.type || '',
      feedSourceId: first?.refId || '',
      feedDelivered: total > 0 ? String(total) : '',
    }));
  };

  const updateSource = (idx: number, patch: Partial<FeedSource>) => {
    syncSources(sources.map((s, i) => i === idx ? { ...s, ...patch } : s));
  };
  const removeSource = (idx: number) => {
    syncSources(sources.filter((_, i) => i !== idx));
  };
  const addSource = () => {
    const newId = crypto.randomUUID();
    syncSources([...sources, { id: newId, type: 'item', refId: '', quantity: 0 }]);
    setExpandedSourceId(newId);
  };

  // ─── محاسبه وضعیت کارت خلاصه ───
  let cardHasShortage = false;
  sources.forEach(src => {
    if (src.type === 'formula') {
      const f = formulas.find(x => x.id === src.refId);
      if (f) {
        f.lines.forEach(line => {
          const ing = ingredients.find(i => i.id === line.ingredientId);
          if (ing) {
            const stockItem = whsItems.find(x => x.id === ing.stockItemId);
            const need = src.quantity > 0 ? (line.percent / 100) * src.quantity : 0;
            if (stockItem && stockItem.currentStock - need < 0) cardHasShortage = true;
          }
        });
      }
    } else if (src.type === 'item') {
      const it = feedItems.find(x => x.id === src.refId);
      if (it && Number(it.currentStock) - Number(src.quantity) < 0) cardHasShortage = true;
    }
  });
  const dailyNeedKg = expectedPerBirdG && flockSize > 0
    ? (expectedPerBirdG * flockSize) / 1000
    : 0;
  const totalAvailable = totalFeed + (Number(form.feedRemaining) || 0);
  const daysAvailable = dailyNeedKg > 0 ? totalAvailable / dailyNeedKg : 0;
  const formatDays = (d: number) => {
    if (d <= 0) return '۰ ساعت';
    if (d < 1) return `${toFa(Math.round(d * 24))} ساعت`;
    const wd = Math.floor(d);
    const rh = Math.round((d - wd) * 24);
    if (rh === 0) return `${toFa(wd)} روز`;
    if (rh === 24) return `${toFa(wd + 1)} روز`;
    return `${toFa(wd)} روز و ${toFa(rh)} ساعت`;
  };
  const isUnderfed = daysAvailable > 0 && daysAvailable < 0.8;
  const finalSummaryTone = cardHasShortage ? 'danger' : isUnderfed ? 'warn' : 'accent';

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', marginBottom: 8, fontSize: 'var(--fs-sm)', gap: 8 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <span>🍽️ {FEED_METHOD_OPTIONS.find(o => o.value === form.feedMethod)?.label || '—'}</span>
          <span style={{ color: 'var(--muted)' }}>•</span>
          <span>💧 {WATER_METHOD_OPTIONS.find(o => o.value === form.waterMethod)?.label || '—'}</span>
          {(form.feedMethodSource === 'manual' || form.waterMethodSource === 'manual') && (
            <span style={{ padding: '1px 6px', background: 'var(--warn-soft)', color: 'var(--warn)', borderRadius: 4, fontSize: 'var(--fs-2xs)', fontWeight: 700 }}>تغییر موقت</span>
          )}
        </span>
        <button type="button" onClick={() => setHallSheetOpen(true)} style={{ padding: '4px 10px', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', color: 'var(--muted)', fontFamily: 'inherit', fontSize: 'var(--fs-xs)', fontWeight: 600, cursor: 'pointer', flexShrink: 0 }}>
          تغییر
        </button>
      </div>

      <Sheet open={hallSheetOpen} onClose={() => setHallSheetOpen(false)} title="تنظیم سیستم سالن">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Field label="دانخوری">
            <Select value={form.feedMethod || ''} onChange={e => setForm(f => ({ ...f, feedMethod: e.target.value as 'scoop' | 'bag' | 'semi_auto' | 'auto_sensor' | 'auto_chain' | '', feedMethodSource: 'manual' }))}>
              <option value="">—</option>
              {FEED_METHOD_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </Select>
          </Field>
          <Field label="آبخوری">
            <Select value={form.waterMethod || ''} onChange={e => setForm(f => ({ ...f, waterMethod: e.target.value as 'manual' | 'nipple' | 'trough' | 'tank' | '', waterMethodSource: 'manual' }))}>
              <option value="">—</option>
              {WATER_METHOD_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </Select>
          </Field>
          {(form.feedMethodSource === 'manual' || form.waterMethodSource === 'manual') && (
            <Btn variant="outline" onClick={() => setForm(f => ({ ...f, feedMethod: (f.feedMethodFromHall || '') as any, waterMethod: (f.waterMethodFromHall || '') as any, feedMethodSource: 'hall', waterMethodSource: 'hall' }))}>
              ↺ بازگشت به سالن
            </Btn>
          )}
          <Btn variant="primary" onClick={() => setHallSheetOpen(false)}>تایید</Btn>
        </div>
      </Sheet>

      <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 'var(--fs-base)', color: 'var(--text)', fontWeight: 700, letterSpacing: '.3px', marginBottom: 6 }}>
        🌾 منابع دان مصرفی
        
      </div>

      {formulas.length === 0 && feedItems.length === 0 && (
        <AlertBox tone="warn" variant="dashed" size="xs" icon={false}>⚠️ هنوز هیچ جیره‌ای نساخته‌اید و دان تکی هم تعریف نکرده‌اید. ابتدا از بخش «تغذیه» یک جیره بسازید، سپس به اینجا برگردید.</AlertBox>
      )}

      {sources.map((src, idx) => {
        const f = src.type === 'formula' ? formulas.find(x => x.id === src.refId) : null;
        const it = src.type === 'item' ? feedItems.find(x => x.id === src.refId) : null;
        const isExpanded = expandedSourceId === src.id;
        const title = f?.name || it?.name || 'منبع جدید';
        const subtitle = f ? 'جیره آماده' : it ? 'دان تکی' : 'هنوز منبعی انتخاب نشده';
        const unitLabel = UNIT_LABEL['kg'] || 'کیلوگرم';

        return (
          <div key={src.id} style={{ padding: 'var(--pad-normal)', background: 'var(--card-solid)', border: `1px solid ${isExpanded ? 'var(--accent)' : 'var(--border)'}`, borderRadius: 'var(--r-md)', display: 'flex', flexDirection: 'column', gap: 8 }}>
            
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', cursor: isExpanded ? 'default' : 'pointer' }} onClick={() => setExpandedSourceId(isExpanded ? null : src.id)}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1, minWidth: 0 }}>
                <span style={{ fontSize: 'var(--fs-base)', fontWeight: 800, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</span>
                <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)' }}>{subtitle}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                {src.quantity > 0 && (
                  <span style={{ fontSize: 'var(--fs-sm)', fontWeight: 800, color: `var(--${finalSummaryTone})` }}>{toFa(src.quantity)} {unitLabel}</span>
                )}
                <button type="button" onClick={(e) => { e.stopPropagation(); removeSource(idx); }} aria-label="حذف منبع" style={{ background: 'var(--danger-soft)', border: '1px solid var(--danger)', color: 'var(--danger)', cursor: 'pointer', borderRadius: 'var(--r-sm)', width: 28, height: 28, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'inherit', fontWeight: 700 }}>✕</button>
              </div>
            </div>

            {/* Body */}
            {isExpanded && (
              <>
                <Grid2>
                  <Field label={<>انتخاب منبع <HelpIcon text="**منطق انتخاب منبع:** شما می‌توانید در یک وعده، هم از **جیره آماده** و هم از **دان تکی** (مثل ذرت یا کنجاله) استفاده کنید. اگر جیره انتخاب کنید، سیستم به‌طور خودکار مواد اولیه آن جیره را بر اساس درصدهایش از انبار کسر می‌کند. اگر دان تکی انتخاب کنید، فقط همان آیتم از انبار کم می‌شود." /></>}>
                    <SmartSelect
                      value={src.refId ? (src.type === 'formula' ? 'f:' : 'i:') + src.refId : ''}
                      onChange={val => {
                        if (val.startsWith('f:')) updateSource(idx, { type: 'formula', refId: val.slice(2) });
                        else if (val.startsWith('i:')) updateSource(idx, { type: 'item', refId: val.slice(2) });
                        else updateSource(idx, { type: 'item', refId: '' });
                      }}
                      options={[
                        ...formulas.map(f => ({ value: 'f:' + f.id, label: f.name, subtitle: `${toFa(f.lines.length)} ماده`, group: 'formula' })),
                        ...feedItems.map(it => ({ value: 'i:' + it.id, label: it.name, subtitle: `موجودی ${toFa(it.currentStock)} ${UNIT_LABEL[it.unit]}`, group: 'item' })),
                      ]}
                      groupLabels={{ formula: '📋 جیره‌ها', item: '🌾 دان تکی' }}
                      groupIcons={{ formula: '📋', item: '🌾' }}
                      placeholder="انتخاب..."
                      modalTitle="انتخاب منبع"
                      autoThreshold={6}
                    />
                  </Field>
                  <Field label="مقدار (kg)">
                    <NumField placeholder="۵۰" value={src.quantity > 0 ? String(src.quantity) : ''} onChange={e => updateSource(idx, { quantity: parseFloat(toEn(e.target.value)) || 0 })} unit="kg" min={0} />
                  </Field>
                </Grid2>

                {f && (
                  <div style={{ padding: 8, background: 'var(--input-bg)', borderRadius: 'var(--r-sm)', display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', fontWeight: 700, marginBottom: 2 }}>مواد اولیه جیره:</div>
                    {f.lines.length === 0 && <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--warn)' }}>⚠️ این جیره خطی ندارد</div>}
                    {f.lines.map((line, lineIdx) => {
                      const ing = ingredients.find(i => i.id === line.ingredientId);
                      if (!ing) return null;
                      const stockItem = whsItems.find(x => x.id === ing.stockItemId);
                      const need = src.quantity > 0 ? (line.percent / 100) * src.quantity : 0;
                      const after = stockItem ? stockItem.currentStock - need : 0;
                      const unavailable = stockItem && after < 0;
                      const unitLabelIng = UNIT_LABEL[stockItem?.unit || 'kg'] || 'کیلوگرم';
                      const isLast = lineIdx === f.lines.length - 1;

                      return (
                        <div key={line.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 'var(--fs-xs)', padding: '6px 0', borderBottom: isLast ? 'none' : '1px dashed var(--border)' }}>
                          <span style={{ color: 'var(--text)' }}>
                            • {ing.name} <span style={{ color: 'var(--muted)' }}>({toFa(line.percent)}٪)</span>
                          </span>
                          <span style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                            {stockItem && (
                              <span style={{ padding: '2px 6px', borderRadius: 'var(--r-sm)', background: unavailable ? 'var(--danger-soft)' : 'var(--input-bg)', color: unavailable ? 'var(--danger)' : 'var(--muted)', border: unavailable ? '1px solid var(--danger-border)' : '1px solid var(--border)', fontSize: 'var(--fs-2xs)', fontWeight: 700 }}>
                                موجودی: {toFa(stockItem.currentStock)}
                              </span>
                            )}
                            <span style={{ color: unavailable ? 'var(--danger)' : 'var(--text)', fontWeight: 700 }}>
                              {need > 0 ? `${toFa(need.toFixed(1))} ${unitLabelIng}` : '—'}
                            </span>
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {it && (() => {
                  const remaining = it.currentStock - src.quantity;
                  const warn = remaining < it.minStock;
                  const unitLabelIng = UNIT_LABEL[it.unit] || '';
                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: '8px 12px', background: 'var(--input-bg)', borderRadius: 'var(--r-sm)', border: '1px solid var(--border)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--fs-xs)' }}>
                        <span style={{ color: 'var(--muted)' }}>موجودی انبار:</span>
                        <span style={{ fontWeight: 700, color: 'var(--text)' }}>{toFa(it.currentStock)} {unitLabelIng}</span>
                      </div>
                      {src.quantity > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--fs-xs)' }}>
                          <span style={{ color: 'var(--muted)' }}>مانده پس از مصرف:</span>
                          <span style={{ fontWeight: 700, color: warn ? 'var(--danger)' : 'var(--accent)' }}>
                            {toFa(remaining)} {unitLabelIng}
                          </span>
                        </div>
                      )}
                      {warn && (
                        <div style={{ fontSize: 'var(--fs-2xs)', color: 'var(--warn)', marginTop: 2 }}>
                          ⚠️ موجودی کافی نیست
                        </div>
                      )}
                    </div>
                  );
                })()}
              </>
            )}
          </div>
        );
      })}

      {(formulas.length > 0 || feedItems.length > 0) && (
        <Btn size="sm" variant="outline" onClick={addSource} style={{ width: '100%' }}>
          + افزودن منبع دیگر
        </Btn>
      )}



      <Grid2>
        <Field label={<>دان باقی‌مانده <HelpIcon text="**دان باقی‌مانده:** مقداری از دانی که در دانخوری سالن باقی مانده و پرنده‌ها آن را نخورده‌اند. با وارد کردن این عدد، سیستم مصرف واقعی دان را دقیق‌تر محاسبه می‌کند." /></>}>
          <NumField placeholder="۰" value={form.feedRemaining} onChange={e => setForm({ ...form, feedRemaining: e.target.value })} unit="kg" min={0} />
        </Field>
        <Field label={<>هدر رفته <HelpIcon text="**هدر رفته:** مقداری از دانی که در مسیر یا دانخوری ریخته شده، یا فاسد شده و توسط پرنده مصرف نشده است. این مقدار از مجموع مصرف کسر می‌شود." /></>}>
          <NumField placeholder="۰" value={form.feedWaste} onChange={e => setForm({ ...form, feedWaste: e.target.value })} unit="kg" min={0} />
        </Field>
      </Grid2>

      {sources.length > 0 && (
        <SummaryCard tone={finalSummaryTone}>
          <span>مجموع مصرف: <b style={{ color: 'var(--text)' }}>{toFa(totalFeed.toFixed(1))} کیلوگرم</b></span>
          {dailyNeedKg > 0 && (
            <span>نیاز روزانه: <b style={{ color: 'var(--text)' }}>{toFa(dailyNeedKg.toFixed(1))} کیلوگرم</b></span>
          )}
          {daysAvailable > 0 && (
            <span>دوام دانخوری: <b style={{ color: isUnderfed ? 'var(--warn)' : 'var(--text)' }}>{isUnderfed ? `⚠️ ${formatDays(daysAvailable)}` : formatDays(daysAvailable)}</b></span>
          )}
          <span>مصرف هر پرنده: <b style={{ color: 'var(--text)' }}>{feedPerBirdG > 0 ? `${toFa(feedPerBirdG.toFixed(1))} گرم` : '—'}</b></span>
        </SummaryCard>
      )}

      {form.waterMethod === 'manual' && (
        <>
          <Grid2>
            <Field label="دفعات آبدهی">
              <NumField placeholder="۵" value={form.waterFillCount} onChange={e => setForm({ ...form, waterFillCount: e.target.value })} unit="نوبت" min={0} />
            </Field>
            <Field label="مقدار هر نوبت">
              <NumField placeholder="۲۰" value={form.waterFillVolume} onChange={e => setForm({ ...form, waterFillVolume: e.target.value })} unit="L" min={0} />
            </Field>
          </Grid2>
          {(form.waterFillCount && form.waterFillVolume) && (
            <SummaryCard tone="info">
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
                <span>مجموع آب مصرفی:</span>
                <span>{toFa((int(form.waterFillCount) || 0) * (num(form.waterFillVolume) || 0))} لیتر</span>
              </div>
            </SummaryCard>
          )}
        </>
      )}

      {form.waterMethod !== 'manual' && form.waterMethod !== '' && (
        <>
          <div style={{ padding: 'var(--pad-normal)', background: 'var(--info-soft)', border: '1px solid var(--info)', borderRadius: 'var(--r-md)', fontSize: 'var(--fs-xs)', color: 'var(--info)', fontWeight: 600 }}>
            💡 سیستم {WATER_SYSTEM_LABEL[form.waterMethod as 'nipple' | 'trough' | 'tank']} — مقدار تخمینی روزانه را وارد کنید
          </div>
          <Field label="مقدار آب مصرفی (تخمینی)" required={isWaterAuto}>
            <NumField placeholder="۱۰۰" value={form.waterAmount} onChange={e => setForm({ ...form, waterAmount: e.target.value })} unit="L" min={0} />
          </Field>
          <FieldHint fieldPath="dlg.waterAmount" value={form.waterAmount} context={{ flockSize: flockSize || undefined }} />
          {form.waterAmount && (
            <SummaryCard tone="info">
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
                <span>مجموع آب مصرفی:</span>
                <span>{toFa(int(form.waterAmount) || 0)} لیتر</span>
              </div>
            </SummaryCard>
          )}
        </>
      )}
    </>
  );
}
