/**
 * FormModal.tsx — فرم افزودن/ویرایش ثبت روزانه
 *
 * تمام JSX فرم اینجاست. DailyLogsPage فقط props می‌ده.
 */
import { useMemo } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { useFed } from '../../fed/store';
import { useWhs, UNIT_LABEL } from '../../whs/store';
import { useFlk } from '../../flk/store';
import { useBrd } from '../../brd/store';
import type { F } from '../types';
import type { Flock } from '../../flk/store';
import { DEATH_CAUSES, avgWeight, cvWeight } from '../store';
import { toFa, toEn } from '../../../shr/utils/fa';
import { FEED_SYSTEM_LABEL, WATER_SYSTEM_LABEL } from '../../../shr/utils/systemType';
import SmartSelect from '../../../shr/components/SmartSelect';
import {
  Btn, BtnRow, Field, Grid2, Grid3, Input,
  Modal, NumField, PercentField, Select, Textarea, ErrorBox,
} from '../../../shr/components/ui';
import { SectionTitle, Row } from '../helpers';
import DatePicker from '../../../shr/components/DatePicker';
import TimePicker from '../../../shr/components/TimePicker';
import { useFormat } from '../../../shr/units';
import { getAgeDays } from '../../flk/store';

export interface FormModalProps {
  open: boolean;
  onClose: () => void;
  form: F;
  setForm: Dispatch<SetStateAction<F>>;
  save: () => void;
  saving: boolean;
  err: string;
  vErrors: Record<string, string>;
  selectedFlock: Flock | undefined;
  flockAliveCount: number;
  isLayerFlock: boolean;
  isLayerType: boolean;
  isFlockMature: boolean;
  vaccineEnabled: boolean;
  medicineEnabled: boolean;
  onFlockChange: (id: string) => void;
}

export default function FormModal(props: FormModalProps) {
  const {
    open, onClose, form, setForm, save, saving, err, vErrors,
    selectedFlock, flockAliveCount, isLayerFlock, isLayerType,
    isFlockMature, vaccineEnabled, medicineEnabled, onFlockChange,
  } = props;

  const { formulas, ingredients } = useFed();
  const { items: whsItems } = useWhs();
  const { flocks } = useFlk();
  const { birds } = useBrd();
  const fmt = useFormat();

  // فیلترهای مشتق‌شده
  const feedItems     = useMemo(() => whsItems.filter(x => x.category === 'feed'), [whsItems]);
  const vaccineItems  = useMemo(() => whsItems.filter(x => x.category === 'vaccine'), [whsItems]);
  const medicineItems = useMemo(() => whsItems.filter(x => x.category === 'medicine' || x.category === 'herbal'), [whsItems]);
  const activeFlocks  = useMemo(() => flocks.filter(f => f.status === 'active' && !f.paused && !f.hidden), [flocks]);

  const num = (s: string) => s ? parseFloat(toEn(s).replace('٫','.')) || null : null;
  const int = (s: string) => s ? parseInt(toEn(s)) || null : null;

  return (
    <Modal open={open} onClose={onClose} title={form.id ? 'ویرایش ثبت روزانه' : 'ثبت روزانه جدید'}
      footer={<BtnRow><Btn variant="primary" onClick={save}>ذخیره</Btn><Btn onClick={onClose}>لغو</Btn></BtnRow>}>
      <Grid2>
        <Field label="تاریخ" required>
          <DatePicker value={form.date} onChange={v => setForm({ ...form, date: v })}  autoToday />
        </Field>
        <Field label="ساعت ورود">
          <TimePicker value={form.entryTime} onChange={v => setForm({ ...form, entryTime: v })} placeholder="انتخاب ساعت" />
        </Field>
      </Grid2>

      <Field label="گله" required>
        <SmartSelect
          value={form.flockId}
          onChange={onFlockChange}
          options={activeFlocks.map(f => ({
            value: f.id,
            label: f.name,
            subtitle: f.currentCount ? `${toFa(f.currentCount)} پرنده` : undefined,
          }))}
          placeholder="— انتخاب گله —"
          modalTitle="انتخاب گله"
        />
      </Field>

      {flockAliveCount > 0 && (
        <div style={{ padding: 'var(--pad-normal)', background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', fontSize: 'var(--fs-xs)', color: 'var(--muted)', fontWeight: 600, textAlign: 'center' }}>
          تعداد زنده گله: {toFa(flockAliveCount)} پرنده
          {form.feedMethod && ` · دانخوری — ${FEED_SYSTEM_LABEL[form.feedMethod as 'manual' | 'auto'] || '—'}`}
          {form.waterMethod && ` · آبخوری — ${WATER_SYSTEM_LABEL[form.waterMethod as 'manual' | 'nipple' | 'trough' | 'tank'] || '—'}`}
        </div>
      )}

      <SectionTitle>🌡 محیط و پرنده</SectionTitle>

      <Grid2>
        <Field label="حداقل دما" hint="۱۵-۳۰ درجه" error={vErrors.temperatureMin}>
          <NumField placeholder="۲۰" value={form.temperatureMin} onChange={e => setForm({ ...form, temperatureMin: e.target.value })} unit="°C" min={-10} max={50} />
        </Field>
        <Field label="حداکثر دما" hint="۱۵-۳۰ درجه" error={vErrors.temperatureMax}>
          <NumField placeholder="۲۵" value={form.temperatureMax} onChange={e => setForm({ ...form, temperatureMax: e.target.value })} unit="°C" min={-10} max={50} />
        </Field>
      </Grid2>

      <Grid2>
        <Field label="حداقل رطوبت" hint="۴۰-۷۰٪" error={vErrors.humidityMin}>
          <PercentField placeholder="۵۰" value={form.humidityMin} onChange={e => setForm({ ...form, humidityMin: e.target.value })} />
        </Field>
        <Field label="حداکثر رطوبت" hint="۴۰-۷۰٪" error={vErrors.humidityMax}>
          <PercentField placeholder="۷۰" value={form.humidityMax} onChange={e => setForm({ ...form, humidityMax: e.target.value })} />
        </Field>
      </Grid2>

      <Grid2>
        <Field label="تهویه">
          <Select value={form.ventilation} onChange={e => setForm({ ...form, ventilation: e.target.value })}>
            <option value="ok">مناسب</option>
            <option value="low">ضعیف</option>
            <option value="high">شدید</option>
          </Select>
        </Field>
        <Field label="بستر">
          <Select value={form.litter} onChange={e => setForm({ ...form, litter: e.target.value })}>
            <option value="dry">خشک</option>
            <option value="wet">مرطوب</option>
            <option value="clumped">کلوخه</option>
          </Select>
        </Field>
      </Grid2>

      <Grid3>
        <Field label="رفتار">
          <Select value={form.behavior} onChange={e => setForm({ ...form, behavior: e.target.value })}>
            <option value="active">فعال</option>
            <option value="lethargic">بی‌حال</option>
            <option value="excited">پرهیجان</option>
          </Select>
        </Field>
        <Field label="توزیع">
          <Select value={form.distribution} onChange={e => setForm({ ...form, distribution: e.target.value })}>
            <option value="uniform">یکنواخت</option>
            <option value="cornered">گوشه‌گیر</option>
          </Select>
        </Field>
        <Field label="صدا">
          <Select value={form.sound} onChange={e => setForm({ ...form, sound: e.target.value })}>
            <option value="normal">طبیعی</option>
            <option value="cough">سرفه</option>
            <option value="sneeze">عطسه</option>
          </Select>
        </Field>
      </Grid3>

      <Field label="ظاهر عمومی">
        <Textarea rows={2} placeholder="رنگ پر، چشم، تاج، منقار..." value={form.appearance} onChange={e => setForm({ ...form, appearance: e.target.value })} />
      </Field>

      <SectionTitle>🍽 تغذیه و آب</SectionTitle>

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
            {used > 0 && ` · بعد از مصرف — ${toFa(after)} ${UNIT_LABEL[it.unit]}`}
            {warn && ' ⚠️ زیر حد هشدار'}
          </div>
        );
      })()}

      <Grid2>
        <Field label="مقدار دان مصرفی">
          <NumField placeholder="۵۰" value={form.feedAmount} onChange={e => setForm({ ...form, feedAmount: e.target.value })} unit="kg" min={0} />
        </Field>
        <Field label="دان باقیمانده">
          <NumField placeholder="۰" value={form.feedRemaining} onChange={e => setForm({ ...form, feedRemaining: e.target.value })} unit="kg" min={0} />
        </Field>
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
          <Field label="مقدار آب مصرفی (تخمینی)">
            <NumField placeholder="۱۰۰" value={form.waterAmount} onChange={e => setForm({ ...form, waterAmount: e.target.value })} unit="L" min={0} />
          </Field>
        </>
      )}

      {isLayerType && !isFlockMature && selectedFlock && (
        <div style={{ padding: 'var(--pad-normal)', background: 'var(--warn-soft)', border: '1px dashed var(--warn)', borderRadius: 'var(--r-md)', fontSize: 'var(--fs-sm)', color: 'var(--warn)', lineHeight: 1.7, marginBottom: 8 }}>
          💡 این گله هنوز به سن تخم‌گذاری نرسیده ({fmt.int(getAgeDays(selectedFlock))} از {fmt.int(selectedFlock.layingStartDay)} روز). فرم تخم‌گذاری بعد از بلوغ فعال می‌شود.
        </div>
      )}

      {isLayerFlock && (
        <>
          <SectionTitle>🥚 تخم و وزن</SectionTitle>
          <Grid2>
            <Field label="🥚 تخم خوراکی" error={vErrors.eatingEggs}>
              <NumField placeholder="۰" value={form.eatingEggs} onChange={e => setForm({...form, eatingEggs: e.target.value})} unit="عدد" min={0} max={flockAliveCount || undefined} />
            </Field>
            <Field label="🌱 تخم نطفه‌دار" error={vErrors.fertileEggs}>
              <NumField placeholder="۰" value={form.fertileEggs} onChange={e => setForm({...form, fertileEggs: e.target.value})} unit="عدد" min={0} />
            </Field>
          </Grid2>
          <Grid2>
            <Field label="💔 شکسته" error={vErrors.brokenEggs}>
              <NumField placeholder="۰" value={form.brokenEggs} onChange={e => setForm({...form, brokenEggs: e.target.value})} unit="عدد" min={0} />
            </Field>
            <Field label="📦 سایر (نرم/کثیف)" error={vErrors.otherEggs}>
              <NumField placeholder="۰" value={form.otherEggs} onChange={e => setForm({...form, otherEggs: e.target.value})} unit="عدد" min={0} />
            </Field>
          </Grid2>
        </>
      )}

      {form.weightSamples.length > 0 && (
        <Grid2>
          <Field label="جنسیت">
            <Select value={form.weightGender} onChange={e => setForm({ ...form, weightGender: e.target.value as any })}>
              <option value="">— نامشخص —</option>
              <option value="male">نر</option>
              <option value="female">ماده</option>
              <option value="mixed">مخلوط</option>
            </Select>
          </Field>
          <Field label="خلاصه">
            <div style={{ padding: 'var(--pad-normal)', background: 'var(--input-bg)', borderRadius: 'var(--r-sm)', fontSize: 'var(--fs-xs)' }}>
              {form.weightSamples.length >= 2
                ? <>میانگین: {toFa(avgWeight(form.weightSamples.map(w => ({ id: w.id, weight: num(w.weight) || 0 }))))} kg · CV: {toFa(cvWeight(form.weightSamples.map(w => ({ id: w.id, weight: num(w.weight) || 0 }))))}٪</>
                : <>💡 حداقل ۲ نمونه اضافه کن تا میانگین محاسبه شود</>}
            </div>
          </Field>
        </Grid2>
      )}

      {form.weightSamples.map((w) => (
        <div key={w.id} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <div style={{ flex: 1 }}>
            <NumField
              placeholder="وزن (kg)"
              value={w.weight}
              onChange={e => setForm(f => ({ ...f, weightSamples: f.weightSamples.map(x => x.id === w.id ? { ...x, weight: e.target.value } : x) }))}
              unit="kg" min={0} />
          </div>
          <button type="button" onClick={() => setForm(f => ({ ...f, weightSamples: f.weightSamples.filter(x => x.id !== w.id) }))}
            style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 18, lineHeight: 1, padding: '4px 6px', flexShrink: 0 }}>✕</button>
        </div>
      ))}

      <Btn size="sm" full onClick={() => setForm(f => ({ ...f, weightSamples: [...f.weightSamples, { id: crypto.randomUUID(), weight: '' }] }))}>
        + افزودن نمونه وزن
      </Btn>

      <SectionTitle>🏥 سلامت</SectionTitle>

      {form.deaths.length > 0 && (
        <div style={{ padding: 'var(--pad-normal)', background: 'var(--warn-soft)', border: '1px solid var(--warn-border, var(--border))', borderRadius: 'var(--r-md)', fontSize: 'var(--fs-sm)', color: 'var(--warn)', fontWeight: 700, textAlign: 'center' }}>
          مجموع: {toFa(form.deaths.reduce((a, x) => a + (x.count || 0), 0))} پرنده
          {flockAliveCount ? ` از ${toFa(flockAliveCount)}` : ''}
        </div>
      )}

      {form.deaths.map((d, i) => (
        <div key={d.id} style={{ padding: 'var(--pad-normal)', background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--danger)', fontWeight: 700 }}>{d.count === 0 && !d.cause ? "رکورد جدید" : "رکورد " + toFa(i + 1)}</span>
            <button type="button" onClick={() => setForm(f => ({ ...f, deaths: f.deaths.filter(x => x.id !== d.id) }))}
              style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 18, lineHeight: 1, padding: '4px 6px', flexShrink: 0 }}>✕</button>
          </div>
          <Grid2>
            <Field label="تعداد" error={vErrors.deathsCount || vErrors.deaths}>
              <NumField placeholder="۰" value={String(d.count || '')}
                onChange={e => setForm(f => ({ ...f, deaths: f.deaths.map(x => x.id === d.id ? { ...x, count: parseInt(toEn(e.target.value)) || 0 } : x) }))}
                min={0} max={flockAliveCount || undefined} unit="پرنده" />
            </Field>
            <Field label="علت">
              <Select value={d.cause || ''} onChange={e => setForm(f => ({ ...f, deaths: f.deaths.map(x => x.id === d.id ? { ...x, cause: e.target.value } : x) }))}>
                {DEATH_CAUSES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </Select>
            </Field>
          </Grid2>
          <Field label="توضیحات">
            <Textarea rows={2} placeholder="جزئیات..." value={d.notes || ''}
              onChange={e => setForm(f => ({ ...f, deaths: f.deaths.map(x => x.id === d.id ? { ...x, notes: e.target.value } : x) }))} />
          </Field>
        </div>
      ))}

      <Btn size="sm" full onClick={() => setForm(f => ({ ...f, deaths: [...f.deaths, { id: crypto.randomUUID(), count: 0, cause: '', notes: '' }] }))}>
        + افزودن رکورد تلفات
      </Btn>

      {vaccineEnabled && (<>
        <Btn size="sm" full onClick={() => setForm(f => ({ ...f, vaccines: [...f.vaccines, { id: crypto.randomUUID(), name: '', dose: '', method: '', reaction: '', itemId: '', quantity: null, movementId: '' }] }))}>
          + افزودن واکسن
        </Btn>
        {form.vaccines.map((v, i) => (
          <div key={v.id} style={{ padding: 'var(--pad-normal)', background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--accent)', fontWeight: 700 }}>واکسن {toFa(i + 1)}</span>
              <button onClick={() => setForm(f => ({ ...f, vaccines: f.vaccines.filter(x => x.id !== v.id) }))} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 18, lineHeight: 1, padding: '4px 6px', flexShrink: 0 }}>✕</button>
            </div>
            <Grid2>
              <Input placeholder="نام" value={v.name} onChange={e => setForm(f => ({ ...f, vaccines: f.vaccines.map(x => x.id === v.id ? { ...x, name: e.target.value } : x) }))} />
              <Input placeholder="دوز" value={v.dose} onChange={e => setForm(f => ({ ...f, vaccines: f.vaccines.map(x => x.id === v.id ? { ...x, dose: e.target.value } : x) }))} />
            </Grid2>
            {vaccineItems.length > 0 && (
              <Grid2>
                <Field label="از انبار" autoFrom="انبار (مصرف کسر می‌شه)" hint="اگه انتخاب کنی، به‌طور خودکار از موجودی انبار کم می‌شه">
                  <SmartSelect
                    value={v.itemId || ''}
                    onChange={id => setForm(f => ({ ...f, vaccines: f.vaccines.map(x => x.id === v.id ? { ...x, itemId: id, quantity: id ? (x.quantity ?? 0) : null } : x) }))}
                    options={vaccineItems.map(w => ({ value: w.id, label: w.name, subtitle: `موجودی ${toFa(w.currentStock)} ${UNIT_LABEL[w.unit]}` }))}
                    placeholder="— متصل نکن —"
                    modalTitle="انتخاب از انبار"
                    autoThreshold={6}
                  />
                </Field>
                {v.itemId && (
                  <Field label="مقدار مصرفی">
                    <NumField
                      value={v.quantity !== null && v.quantity !== undefined ? String(v.quantity) : ''}
                      onChange={e => setForm(f => ({ ...f, vaccines: f.vaccines.map(x => x.id === v.id ? { ...x, quantity: parseFloat(toEn(e.target.value).replace('٫','.')) || 0 } : x) }))}
                      unit={UNIT_LABEL[vaccineItems.find(w => w.id === v.itemId)?.unit || 'pcs'] || ''}
                      min={0}
                    />
                  </Field>
                )}
              </Grid2>
            )}
          </div>
        ))}
      </>)}

      {medicineEnabled && (<>
        <Btn size="sm" full onClick={() => setForm(f => ({ ...f, medications: [...f.medications, { id: crypto.randomUUID(), name: '', dose: '', method: '', withdrawalDays: null, itemId: '', quantity: null, movementId: '' }] }))}>
          + افزودن دارو
        </Btn>
        {form.medications.map((m, i) => (
          <div key={m.id} style={{ padding: 'var(--pad-normal)', background: 'var(--input-bg)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--accent)', fontWeight: 700 }}>دارو {toFa(i + 1)}</span>
              <button onClick={() => setForm(f => ({ ...f, medications: f.medications.filter(x => x.id !== m.id) }))} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 18, lineHeight: 1, padding: '4px 6px', flexShrink: 0 }}>✕</button>
            </div>
            <Grid2>
              <Input placeholder="نام" value={m.name} onChange={e => setForm(f => ({ ...f, medications: f.medications.map(x => x.id === m.id ? { ...x, name: e.target.value } : x) }))} />
              <Input placeholder="دوز" value={m.dose} onChange={e => setForm(f => ({ ...f, medications: f.medications.map(x => x.id === m.id ? { ...x, dose: e.target.value } : x) }))} />
            </Grid2>
            {medicineItems.length > 0 && (
              <Grid2>
                <Field label="از انبار" autoFrom="انبار (مصرف کسر می‌شه)" hint="اگه انتخاب کنی، به‌طور خودکار از موجودی انبار کم می‌شه">
                  <SmartSelect
                    value={m.itemId || ''}
                    onChange={id => setForm(f => ({ ...f, medications: f.medications.map(x => x.id === m.id ? { ...x, itemId: id, quantity: id ? (x.quantity ?? 0) : null } : x) }))}
                    options={medicineItems.map(w => ({ value: w.id, label: w.name, subtitle: `موجودی ${toFa(w.currentStock)} ${UNIT_LABEL[w.unit]}` }))}
                    placeholder="— متصل نکن —"
                    modalTitle="انتخاب از انبار"
                    autoThreshold={6}
                  />
                </Field>
                {m.itemId && (
                  <Field label="مقدار مصرفی">
                    <NumField
                      value={m.quantity !== null && m.quantity !== undefined ? String(m.quantity) : ''}
                      onChange={e => setForm(f => ({ ...f, medications: f.medications.map(x => x.id === m.id ? { ...x, quantity: parseFloat(toEn(e.target.value).replace('٫','.')) || 0 } : x) }))}
                      unit={UNIT_LABEL[medicineItems.find(w => w.id === m.itemId)?.unit || 'pcs'] || ''}
                      min={0}
                    />
                  </Field>
                )}
              </Grid2>
            )}
          </div>
        ))}
      </>)}

      <SectionTitle>🔧 فعالیت‌ها</SectionTitle>

      <Btn size="sm" full onClick={() => setForm(f => ({ ...f, activities: [...f.activities, { id: crypto.randomUUID(), type: '', notes: '' }] }))}>
        + افزودن فعالیت
      </Btn>
      {form.activities.map((a) => (
        <div key={a.id} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <Input placeholder="نوع فعالیت..." value={a.type} onChange={e => setForm(f => ({ ...f, activities: f.activities.map(x => x.id === a.id ? { ...x, type: e.target.value } : x) }))} />
          <button onClick={() => setForm(f => ({ ...f, activities: f.activities.filter(x => x.id !== a.id) }))} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 18, lineHeight: 1, padding: '4px 6px', flexShrink: 0 }}>✕</button>
        </div>
      ))}

      <SectionTitle>📝 یادداشت</SectionTitle>
      <Field label="یادداشت">
        <Textarea rows={3} placeholder="..." value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
      </Field>

      <ErrorBox>{err}</ErrorBox>
    </Modal>
  );
}
