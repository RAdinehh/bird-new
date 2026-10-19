/**
 * FeedSection — تغذیه و آب
 */
import { useMemo } from 'react';
import { Field, Grid2, NumField } from '../../../shr/components/ui';
import SmartSelect from '../../../shr/components/SmartSelect';
import { UNIT_LABEL } from '../../whs/store';
import { toFa, toEn } from '../../../shr/utils/fa';
import { WATER_SYSTEM_LABEL } from '../../../shr/utils/systemType';
import { useFed } from '../../fed/store';
import { useWhs } from '../../whs/store';
import type { F } from '../types';
import { FieldHint } from '../../../shr/intelligence';
import { useFlk } from '../../flk/store';
import { parseNumericValue } from '../../../shr/intelligence/useAnomalyHint';

interface Props {
  form: F;
  setForm: React.Dispatch<React.SetStateAction<F>>;
  vErrors: Record<string, string>;
}

export default function FeedSection({ form, setForm, vErrors }: Props) {
  const { formulas, ingredients } = useFed();
  const { items: whsItems } = useWhs();
  const feedItems = useMemo(() => whsItems.filter(x => x.category === 'feed'), [whsItems]);
  const num = (s: string) => s ? parseFloat(toEn(s).replace('٫','.')) || null : null;
  const int = (s: string) => s ? parseInt(toEn(s)) || null : null;

  // context برای هوشمندسازی
  const { flocks } = useFlk();
  const selectedFlock = flocks.find(f => f.id === form.flockId);
  const flockSize = selectedFlock?.currentCount || selectedFlock?.initialCount || 0;
  const feedAmtNum = parseNumericValue(form.feedAmount);

  return (
    <>

      <Field label="منبع دان مصرفی" hint="از جیره‌ها یا دان تکی انبار">
        <SmartSelect
          value={form.feedSourceType && form.feedSourceId
            ? (form.feedSourceType === 'formula' ? 'f:' : 'i:') + form.feedSourceId
            : ''}
          onChange={val => {
            if (val.startsWith('f:')) {
              const id = val.slice(2);
              const f = formulas.find(x => x.id === id);
              setForm(prev => ({ ...prev, feedSourceType: 'formula', feedSourceId: id, feedType: f?.name || '' }));
            } else if (val.startsWith('i:')) {
              const id = val.slice(2);
              const it = feedItems.find(x => x.id === id);
              setForm(prev => ({ ...prev, feedSourceType: 'item', feedSourceId: id, feedType: it?.name || '' }));
            } else {
              setForm(prev => ({ ...prev, feedSourceType: '', feedSourceId: '', feedType: '' }));
            }
          }}
          options={[
            ...formulas.map(f => ({
              value: 'f:' + f.id,
              label: f.name,
              subtitle: `${f.lines.length} ماده`,
              group: 'formula',
            })),
            ...feedItems.map(it => ({
              value: 'i:' + it.id,
              label: it.name,
              subtitle: `موجودی ${toFa(it.currentStock)} ${UNIT_LABEL[it.unit]}`,
              group: 'item',
            })),
          ]}
          groupLabels={{ formula: '📋 جیره‌ها', item: '🌾 دان تکی' }}
          groupIcons={{ formula: '📋', item: '🌾' }}
          placeholder="— انتخاب کنید —"
          modalTitle="انتخاب منبع دان"
          autoThreshold={6}
        />
      </Field>

      {form.feedSourceType === 'formula' && form.feedSourceId && (() => {
        const f = formulas.find(x => x.id === form.feedSourceId);
        if (!f) return null;
        const used = num(form.feedAmount) || 0;
        return (
          <div style={{ padding: 'var(--pad-normal)', background: 'var(--input-bg)', border: '1px dashed var(--border)', borderRadius: 'var(--r-md)', display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ fontSize: 'var(--fs-base)', color: 'var(--text)', fontWeight: 700, letterSpacing: '.3px', marginBottom: 4 }}>مواد اولیه این جیره:</div>
            {f.lines.length === 0 && <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--warn)' }}>⚠️ این جیره خطی ندارد</div>}
            {f.lines.map(line => {
              const ing = ingredients.find(i => i.id === line.ingredientId);
              if (!ing) return null;
              const stockItem = whsItems.find(x => x.id === ing.stockItemId);
              const need = used > 0 ? (line.percent / 100) * used : 0;
              const after = stockItem ? stockItem.currentStock - need : 0;
              const warn = stockItem && after < 0;
              return (
                <div key={line.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--fs-sm)', gap: 8 }}>
                  <span style={{ flex: 1 }}>• {ing.name} <span style={{ color: 'var(--muted)', fontSize: 'var(--fs-xs)' }}>({toFa(line.percent)}٪)</span></span>
                  <span style={{ direction: 'ltr', color: warn ? 'var(--danger)' : undefined, fontWeight: warn ? 700 : 600 }}>
                    {need > 0 ? `${toFa(need.toFixed(1))} kg` : '—'}
                    {stockItem && <span style={{ color: warn ? 'var(--danger)' : 'var(--muted)', fontSize: 'var(--fs-xs)', marginRight: 4 }}> [{toFa(stockItem.currentStock)}]</span>}
                  </span>
                </div>
              );
            })}
          </div>
        );
      })()}

      {form.feedSourceType === 'item' && form.feedSourceId && (() => {
        const it = feedItems.find(x => x.id === form.feedSourceId);
        if (!it) return null;
        const used = num(form.feedAmount) || 0;
        const after = it.currentStock - used;
        const warn = after < it.minStock;
        return (
          <div style={{ padding: 'var(--pad-normal)', background: warn ? 'var(--warn-soft)' : 'var(--accent-soft)', border: `1px solid ${warn ? 'var(--warn)' : 'var(--accent-border)'}`, borderRadius: 'var(--r-md)', fontSize: 'var(--fs-xs)', color: warn ? 'var(--warn)' : 'var(--accent)', fontWeight: 600 }}>
            موجودی فعلی: {toFa(it.currentStock)} {UNIT_LABEL[it.unit]}
            {used > 0 && ` • بعد از مصرف — ${toFa(after)} ${UNIT_LABEL[it.unit]}`}
            {warn && ' ⚠️ زیر حد هشدار'}
          </div>
        );
      })()}

      <Grid2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0, minWidth: 0 }}>
          <Field label="مقدار دان مصرفی">
            <NumField placeholder="۵۰" value={form.feedAmount} onChange={e => setForm({ ...form, feedAmount: e.target.value })} unit="kg" min={0} />
          </Field>
          <FieldHint fieldPath="dlg.feedAmount" value={form.feedAmount} context={{ flockSize }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0, minWidth: 0 }}>
          <Field label="دان باقیمانده">
            <NumField placeholder="۰" value={form.feedRemaining} onChange={e => setForm({ ...form, feedRemaining: e.target.value })} unit="kg" min={0} />
          </Field>
          <FieldHint fieldPath="dlg.feedRemaining" value={form.feedRemaining} context={{ feedAmount: feedAmtNum ?? undefined, flockSize }} />
        </div>
      </Grid2>

      {form.waterMethod === 'manual' && (
        <>
          <div style={{ padding: 'var(--pad-normal)', background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', fontSize: 'var(--fs-xs)', color: 'var(--muted)', fontWeight: 600 }}>
            💡 حالت دستی: تعداد بار × حجم هر بار
          </div>
          <Grid2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0, minWidth: 0 }}>
              <Field label="تعداد بار">
                <NumField placeholder="۵" value={form.waterFillCount} onChange={e => setForm({ ...form, waterFillCount: e.target.value })} unit="بار" min={0} />
              </Field>
              <FieldHint fieldPath="dlg.waterFillCount" value={form.waterFillCount} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0, minWidth: 0 }}>
              <Field label="حجم هر بار">
                <NumField placeholder="۲۰" value={form.waterFillVolume} onChange={e => setForm({ ...form, waterFillVolume: e.target.value })} unit="L" min={0} />
              </Field>
              <FieldHint fieldPath="dlg.waterFillVolume" value={form.waterFillVolume} />
            </div>
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0, minWidth: 0 }}>
            <Field label="مقدار آب مصرفی (تخمینی)">
              <NumField placeholder="۱۰۰" value={form.waterAmount} onChange={e => setForm({ ...form, waterAmount: e.target.value })} unit="L" min={0} />
            </Field>
            <FieldHint fieldPath="dlg.waterAmount" value={form.waterAmount} context={{ flockSize }} />
          </div>
        </>
      )}

    </>
  );
}
