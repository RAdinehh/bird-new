/**
 * FeedSection — تغذیه و آب
 * IDEA-25: پشتیبانی چند منبع دان (backward-compatible)
 */
import { useMemo } from 'react';
import { Field, Grid2, NumField, Btn } from '../../../shr/components/ui';
import SmartSelect from '../../../shr/components/SmartSelect';
import { UNIT_LABEL } from '../../whs/store';
import { toFa, toEn } from '../../../shr/utils/fa';
import { WATER_SYSTEM_LABEL } from '../../../shr/utils/systemType';
import { useFed } from '../../fed/store';
import { useWhs } from '../../whs/store';
import type { F } from '../types';
import type { FeedSource } from '../store';
import { useFlk } from '../../flk/store';

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
  const { items: whsItems } = useWhs();
  const feedItems = useMemo(() => whsItems.filter(x => x.category === 'feed'), [whsItems]);
  const num = (s: string) => s ? parseFloat(toEn(s).replace('٫','.')) || null : null;
  const int = (s: string) => s ? parseInt(toEn(s)) || null : null;

  const { flocks } = useFlk();
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
    syncSources([...sources, { id: crypto.randomUUID(), type: 'item', refId: '', quantity: 0 }]);
  };

  return (
    <>
      <div style={{ fontSize: 'var(--fs-base)', color: 'var(--text)', fontWeight: 700, letterSpacing: '.3px', marginBottom: 6 }}>
        🌾 منابع دان مصرفی
      </div>

      {sources.length === 0 && (
        <div style={{ padding: 'var(--pad-normal)', background: 'var(--input-bg)', border: '1px dashed var(--border)', borderRadius: 'var(--r-md)', fontSize: 'var(--fs-sm)', color: 'var(--muted)', textAlign: 'center' }}>
          هنوز منبعی اضافه نشده — از دکمه پایین اضافه کنید
        </div>
      )}

      {sources.map((src, idx) => {
        const f = src.type === 'formula' ? formulas.find(x => x.id === src.refId) : null;
        const it = src.type === 'item' ? feedItems.find(x => x.id === src.refId) : null;
        return (
          <div key={src.id} style={{ padding: 'var(--pad-normal)', background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px 32px', gap: 6, alignItems: 'end' }}>
              <Field label={idx === 0 ? 'منبع' : `منبع ${toFa(idx + 1)}`}>
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
              <Field label="مقدار">
                <NumField placeholder="۵۰" value={src.quantity > 0 ? String(src.quantity) : ''} onChange={e => updateSource(idx, { quantity: parseFloat(toEn(e.target.value)) || 0 })} unit="kg" min={0} />
              </Field>
              <button
                type="button"
                onClick={() => removeSource(idx)}
                aria-label="حذف منبع"
                style={{ width: 32, height: 36, background: 'var(--danger-soft)', border: '1px solid var(--danger)', borderRadius: 'var(--r-md)', color: 'var(--danger)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 16 }}
              >✕</button>
            </div>

            {f && (
              <div style={{ padding: 8, background: 'var(--input-bg)', borderRadius: 'var(--r-sm)', display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', fontWeight: 700 }}>مواد اولیه جیره:</div>
                {f.lines.length === 0 && <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--warn)' }}>⚠️ این جیره خطی ندارد</div>}
                {f.lines.map(line => {
                  const ing = ingredients.find(i => i.id === line.ingredientId);
                  if (!ing) return null;
                  const stockItem = whsItems.find(x => x.id === ing.stockItemId);
                  const need = src.quantity > 0 ? (line.percent / 100) * src.quantity : 0;
                  const after = stockItem ? stockItem.currentStock - need : 0;
                  const warn = stockItem && after < 0;
                  return (
                    <div key={line.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--fs-xs)' }}>
                      <span>• {ing.name} <span style={{ color: 'var(--muted)' }}>({toFa(line.percent)}٪)</span></span>
                      <span style={{ direction: 'ltr', color: warn ? 'var(--danger)' : undefined, fontWeight: warn ? 700 : 600 }}>
                        {need > 0 ? `${toFa(need.toFixed(1))} kg` : '—'}
                        {stockItem && <span style={{ color: warn ? 'var(--danger)' : 'var(--muted)', marginRight: 4 }}> [{toFa(stockItem.currentStock)}]</span>}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            {it && (
              <div style={{ padding: 6, background: it.currentStock - src.quantity < it.minStock ? 'var(--warn-soft)' : 'var(--accent-soft)', borderRadius: 'var(--r-sm)', fontSize: 'var(--fs-xs)', color: it.currentStock - src.quantity < it.minStock ? 'var(--warn)' : 'var(--accent)' }}>
                موجودی: {toFa(it.currentStock)} {UNIT_LABEL[it.unit]}
                {src.quantity > 0 && ` • بعد از مصرف: ${toFa(it.currentStock - src.quantity)} ${UNIT_LABEL[it.unit]}`}
              </div>
            )}
          </div>
        );
      })}

      <Btn size="sm" variant="outline" onClick={addSource} style={{ width: '100%' }}>
        + افزودن منبع دیگر
      </Btn>

      {sources.length > 1 && (
        <div style={{ padding: 'var(--pad-normal)', background: 'var(--accent-soft)', border: '1px solid var(--accent-border)', borderRadius: 'var(--r-md)', fontSize: 'var(--fs-sm)', color: 'var(--accent)', fontWeight: 700, textAlign: 'center' }}>
          مجموع مصرف: {toFa(totalFeed.toFixed(1))} کیلوگرم
        </div>
      )}

      <Grid2>
        <Field label="دان باقی‌مانده">
          <NumField placeholder="۰" value={form.feedRemaining} onChange={e => setForm({ ...form, feedRemaining: e.target.value })} unit="kg" min={0} />
        </Field>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0, minWidth: 0 }}>
          <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', paddingBottom: 4 }}>دان مصرف‌شده به ازای هر پرنده</span>
          <div style={{ height: 44, padding: '0 12px', background: feedPerBirdG > 0 ? 'var(--info-soft)' : 'var(--input-bg)', border: `1px solid ${feedPerBirdG > 0 ? 'var(--info)' : 'var(--border)'}`, borderRadius: 'var(--r-sm)', display: 'flex', alignItems: 'center', fontFamily: 'monospace', fontWeight: 700, color: feedPerBirdG > 0 ? 'var(--info)' : 'var(--muted)' }}>
            {feedPerBirdG > 0 ? `${toFa(feedPerBirdG.toFixed(1))} گرم` : (totalFeed > 0 && remainingNum === totalFeed ? 'مصرف صفر' : '—')}
          </div>
        </div>
      </Grid2>

      {form.waterMethod === 'manual' && (
        <>
          <div style={{ padding: 'var(--pad-normal)', background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', fontSize: 'var(--fs-xs)', color: 'var(--muted)', fontWeight: 600 }}>
            💡 حالت دستی: تعداد بار × حجم هر بار
          </div>
          <Grid2>
            <Field label="تعداد بار">
              <NumField placeholder="۵" value={form.waterFillCount} onChange={e => setForm({ ...form, waterFillCount: e.target.value })} unit="بار" min={0} />
            </Field>
            <Field label="حجم هر بار">
              <NumField placeholder="۲۰" value={form.waterFillVolume} onChange={e => setForm({ ...form, waterFillVolume: e.target.value })} unit="L" min={0} />
            </Field>
          </Grid2>
          {(form.waterFillCount && form.waterFillVolume) && (
            <div style={{ padding: 'var(--pad-normal)', background: 'var(--accent-soft)', border: '1px solid var(--accent-border)', borderRadius: 'var(--r-md)', fontSize: 'var(--fs-sm)', color: 'var(--accent)', fontWeight: 700, textAlign: 'center' }}>
              مجموع آب مصرفی: {toFa((int(form.waterFillCount) || 0) * (num(form.waterFillVolume) || 0))} لیتر
            </div>
          )}
        </>
      )}

      {form.waterMethod !== 'manual' && form.waterMethod !== '' && (
        <>
          <div style={{ padding: 'var(--pad-normal)', background: 'var(--warn-soft)', border: '1px dashed var(--warn)', borderRadius: 'var(--r-md)', fontSize: 'var(--fs-xs)', color: 'var(--warn)', fontWeight: 600 }}>
            ⚠️ سیستم {WATER_SYSTEM_LABEL[form.waterMethod as 'nipple' | 'trough' | 'tank']} — فعلاً فقط دستی پیاده شده
          </div>
          <Field label="مقدار آب مصرفی (تخمینی)" required={isWaterAuto}>
            <NumField placeholder="۱۰۰" value={form.waterAmount} onChange={e => setForm({ ...form, waterAmount: e.target.value })} unit="L" min={0} />
          </Field>
        </>
      )}
    </>
  );
}
