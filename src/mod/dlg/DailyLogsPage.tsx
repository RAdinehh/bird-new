import { useState, useMemo } from 'react';
import { useDlg, type DailyLog, type Death, type Vaccine, type Medication, type Activity, VENTILATION_LABEL, LITTER_LABEL, BEHAVIOR_LABEL, DISTRIBUTION_LABEL, SOUND_LABEL, DEATH_CAUSES, causeLabel, tempWarning, humidityWarning, waterFeedRatio, mortalityRate, avgWeight, sumWeight, cvWeight, totalWater } from './store';
import { useFlk } from '../flk/store';
import { useWhs, UNIT_LABEL } from '../whs/store';
import { useBrd } from '../brd/store';
import { useFed } from '../fed/store';
import { useHal } from '../hal/store';
import { feedSystemFromHall, waterSystemFromHall, FEED_SYSTEM_LABEL, WATER_SYSTEM_LABEL } from '../../shr/utils/systemType';
import SmartSelect from '../../shr/components/SmartSelect';
import { Btn, BtnRow, Empty, Field, Grid2, Grid3, Input, Modal, PageContainer, Select, Tag } from '../../shr/components/ui';
import ExpandableCard from '../../shr/components/ExpandableCard';
import DatePicker from '../../shr/components/DatePicker';
import TimePicker from '../../shr/components/TimePicker';
import { toFa, toEn } from '../../shr/utils/fa';
import { showAlert } from '../../cor/store/dialog';

interface F {
  id?: string;
  flockId: string; date: string; entryTime: string;
  temperature: string; temperatureMin: string; temperatureMax: string;
  humidity: string; humidityMin: string; humidityMax: string;
  ventilation: string; litter: string;
  behavior: string; distribution: string; appearance: string; sound: string;
  feedType: string; feedAmount: string; feedRemaining: string;
  feedSourceType: 'formula' | 'item' | ''; feedSourceId: string; feedMovementIds: string[];
  feedMethod: 'manual' | 'auto' | '';
  waterMethod: 'manual' | 'nipple' | 'trough' | 'tank' | '';
  waterAmount: string; waterFillCount: string; waterFillVolume: string;
  weightSamples: { id: string; weight: string }[];
  weightGender: '' | 'male' | 'female' | 'mixed';
  deaths: Death[];
  vaccines: Vaccine[]; medications: Medication[]; activities: Activity[];
  notes: string;
}

const newLog = (flockId = ''): F => ({
  flockId, date: '', entryTime: '',
  temperature: '', temperatureMin: '', temperatureMax: '',
  humidity: '', humidityMin: '', humidityMax: '',
  ventilation: 'ok', litter: 'dry',
  behavior: 'active', distribution: 'uniform', appearance: '', sound: 'normal',
  feedType: '', feedAmount: '', feedRemaining: '',
  feedSourceType: '', feedSourceId: '', feedMovementIds: [], feedMethod: '',
  waterMethod: '', waterAmount: '', waterFillCount: '', waterFillVolume: '',
  weightSamples: [], weightGender: '',
  deaths: [], vaccines: [], medications: [], activities: [],
  notes: ''
});

type TabId = 'today' | 'history';

export default function DailyLogsPage() {
  const { logs, add, update, remove } = useDlg();
  const { flocks } = useFlk();
  const { birds, breeds } = useBrd();
  const { items: whsItems, addMovement, deleteMovement } = useWhs();
  const { formulas, ingredients } = useFed();
  const { halls } = useHal();

  const feedItems = whsItems.filter(x => x.category === 'feed');

  const [tab, setTab] = useState<TabId>('today');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<F>(newLog());
  const [err, setErr] = useState('');
  const [delId, setDelId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const activeFlocks = flocks.filter(f => f.status === 'active');
  const today = new Date();
  const todayStr = `${today.getFullYear()}/${String(today.getMonth()+1).padStart(2,'0')}/${String(today.getDate()).padStart(2,'0')}`;

  const todaysLogs = useMemo(() => logs.filter(l => l.date === todayStr), [logs, todayStr]);
  const historicalLogs = useMemo(() => logs.filter(l => l.date !== todayStr).sort((a, b) => b.date.localeCompare(a.date)), [logs, todayStr]);

  const tabs: { id: TabId; label: string }[] = [
    { id: 'today', label: 'امروز' },
    { id: 'history', label: 'تاریخچه' }
  ];

  const detectSystems = (flockId: string) => {
    const flock = activeFlocks.find(f => f.id === flockId);
    const hall = halls.find(h => h.id === flock?.hallId);
    return {
      feedMethod: feedSystemFromHall(hall?.feederType || ''),
      waterMethod: waterSystemFromHall(hall?.drinkerType || '')
    };
  };

  const openNew = () => {
    if (activeFlocks.length === 0) { showAlert('اول یک گله بسازید'); return; }
    const flock = activeFlocks[0];
    const sys = detectSystems(flock.id);
    setForm({ ...newLog(flock.id), date: todayStr, ...sys });
    setErr(''); setOpen(true);
  };

  const openEdit = (l: DailyLog) => {
    setForm({
      id: l.id, flockId: l.flockId, date: l.date, entryTime: l.entryTime,
      temperature: l.temperature ? toFa(l.temperature) : '',
      temperatureMin: l.temperatureMin ? toFa(l.temperatureMin) : '',
      temperatureMax: l.temperatureMax ? toFa(l.temperatureMax) : '',
      humidity: l.humidity ? toFa(l.humidity) : '',
      humidityMin: l.humidityMin ? toFa(l.humidityMin) : '',
      humidityMax: l.humidityMax ? toFa(l.humidityMax) : '',
      ventilation: l.ventilation, litter: l.litter,
      behavior: l.behavior, distribution: l.distribution,
      appearance: l.appearance, sound: l.sound,
      feedType: l.feedType,
      feedAmount: l.feedAmount !== null ? toFa(l.feedAmount) : '',
      feedRemaining: l.feedRemaining !== null ? toFa(l.feedRemaining) : '',
      feedSourceType: l.feedSourceType || '',
      feedSourceId: l.feedSourceId || '',
      feedMovementIds: l.feedMovementIds || [],
      feedMethod: l.feedMethod || '',
      waterMethod: l.waterMethod || '',
      waterAmount: l.waterAmount !== null ? toFa(l.waterAmount) : '',
      waterFillCount: l.waterFillCount !== null ? toFa(l.waterFillCount) : '',
      waterFillVolume: l.waterFillVolume !== null ? toFa(l.waterFillVolume) : '',
      weightSamples: (l.weightSamples || []).map(w => ({ id: w.id, weight: toFa(w.weight) })),
      weightGender: l.weightGender || '',
      deaths: l.deaths || [], vaccines: l.vaccines || [],
      medications: l.medications || [], activities: l.activities || [],
      notes: l.notes
    });
    setErr(''); setOpen(true);
  };

  const selectedFlock = activeFlocks.find(f => f.id === form.flockId);
  const flockAliveCount = selectedFlock?.currentCount || selectedFlock?.initialCount || 0;
  const num = (s: string) => s ? parseFloat(toEn(s).replace('٫','.')) || null : null;
  const int = (s: string) => s ? parseInt(toEn(s)) || null : null;

  const onFlockChange = (flockId: string) => {
    const sys = detectSystems(flockId);
    setForm(f => ({ ...f, flockId, feedMethod: sys.feedMethod, waterMethod: sys.waterMethod }));
  };

  const save = () => {
    if (!form.flockId) { setErr('گله اجباری است'); return; }
    if (!form.date.trim()) { setErr('تاریخ اجباری است'); return; }
    const dCount = form.deaths.reduce((a, x) => a + (x.count || 0), 0);
    if (flockAliveCount && dCount > flockAliveCount) {
      setErr(`مجموع تلفات (${toFa(dCount)}) از تعداد زنده گله (${toFa(flockAliveCount)}) بیشتر است`);
      return;
    }

    const feedAmt = num(form.feedAmount);
    const newMovementIds: string[] = [];

    if (form.feedMovementIds.length > 0) {
      form.feedMovementIds.forEach(id => deleteMovement(id));
    }

    if (form.feedSourceId && feedAmt && feedAmt > 0) {
      if (form.feedSourceType === 'formula') {
        const formula = formulas.find(f => f.id === form.feedSourceId);
        if (formula) {
          formula.lines.forEach(line => {
            const ing = ingredients.find(i => i.id === line.ingredientId);
            if (!ing || !ing.stockItemId) return;
            const qty = (line.percent / 100) * feedAmt;
            const mid = addMovement({
              itemId: ing.stockItemId, type: 'out',
              quantity: Math.round(qty * 1000) / 1000,
              unitPrice: 0, reason: 'consumption',
              date: form.date, partyId: '',
              notes: `ثبت روزانه — جیره ${formula.name}`
            });
            if (mid) newMovementIds.push(mid);
          });
        }
      } else if (form.feedSourceType === 'item') {
        const mid = addMovement({
          itemId: form.feedSourceId, type: 'out',
          quantity: feedAmt, unitPrice: 0, reason: 'consumption',
          date: form.date, partyId: '',
          notes: `ثبت روزانه — ${selectedFlock?.name || ''}`
        });
        if (mid) newMovementIds.push(mid);
      }
    }

    const calcWater = form.waterMethod === 'manual'
      ? totalWater(int(form.waterFillCount), num(form.waterFillVolume)) ?? num(form.waterAmount)
      : num(form.waterAmount);

    // محاسبه خودکار میانگین از min/max
    const tMin = num(form.temperatureMin);
    const tMax = num(form.temperatureMax);
    const hMin = num(form.humidityMin);
    const hMax = num(form.humidityMax);
    const calcTemp = (tMin !== null && tMax !== null)
      ? Math.round(((tMin + tMax) / 2) * 10) / 10
      : num(form.temperature);
    const calcHumidity = (hMin !== null && hMax !== null)
      ? Math.round(((hMin + hMax) / 2) * 10) / 10
      : num(form.humidity);

    const data: Omit<DailyLog, 'id'> = {
      flockId: form.flockId, date: form.date, entryTime: form.entryTime,
      temperature: calcTemp,
      temperatureMin: tMin,
      temperatureMax: tMax,
      humidity: calcHumidity,
      humidityMin: hMin,
      humidityMax: hMax,
      ventilation: form.ventilation, litter: form.litter,
      behavior: form.behavior, distribution: form.distribution,
      appearance: form.appearance.trim(), sound: form.sound,
      feedType: form.feedType.trim(), feedAmount: feedAmt,
      feedRemaining: num(form.feedRemaining),
      feedSourceType: form.feedSourceType,
      feedSourceId: form.feedSourceId,
      feedMovementIds: newMovementIds,
      feedMethod: form.feedMethod,
      waterMethod: form.waterMethod,
      waterAmount: calcWater,
      waterFillCount: int(form.waterFillCount),
      waterFillVolume: num(form.waterFillVolume),
      weightSamples: form.weightSamples
        .map(w => ({ id: w.id, weight: parseFloat(toEn(w.weight).replace('٫','.')) || 0 }))
        .filter(w => w.weight > 0),
      weightGender: form.weightGender,
      deathsCount: dCount, deaths: form.deaths,
      vaccines: form.vaccines, medications: form.medications,
      activities: form.activities, notes: form.notes.trim()
    };
    if (form.id) update(form.id, data); else add(data);
    setOpen(false);
  };

  const renderLogCard = (l: DailyLog, i: number) => {
    const flock = flocks.find(f => f.id === l.flockId);
    const bird = flock ? birds.find(b => b.id === flock.birdId) : null;
    const breed = flock ? breeds.find(b => b.id === flock.breedId) : null;
    const isOpen = expandedId === l.id;
    const tWarn = tempWarning(l.temperature);
    const hWarn = humidityWarning(l.humidity);
    const hasProblem = tWarn !== 'ok' || hWarn !== 'ok' || l.deathsCount > 0;
    const accent: any = hasProblem ? 'warn' : 'accent';
    return (
      <ExpandableCard key={l.id} accent={accent} index={toFa(i + 1)} iconEmoji="📋"
        title={flock?.name || '—'}
        subtitle={`${toFa(l.date)}${l.entryTime ? ` · ${toFa(l.entryTime)}` : ''}${bird ? ` · ${bird.name}` : ''}`}
        isOpen={isOpen} onToggle={() => setExpandedId(isOpen ? null : l.id)}
        badge={l.deathsCount > 0 ? <Tag tone="amber">{toFa(l.deathsCount)} تلفات</Tag> : undefined}
        summary={<>
          {l.temperature !== null && <span>🌡 {toFa(l.temperature)}°</span>}
          {l.humidity !== null && <span>💧 {toFa(l.humidity)}٪</span>}
          {l.feedAmount !== null && <span>🌾 {toFa(l.feedAmount)} kg</span>}
          {l.waterAmount !== null && <span>💧 {toFa(l.waterAmount)} L</span>}
        </>}
      >
        {(tWarn !== 'ok' || hWarn !== 'ok') && (
          <div style={{ padding: '8px 12px', background: 'var(--warn-soft)', border: '1px dashed var(--warn)', borderRadius: 'var(--r-md)', fontSize: 'var(--fs-xs)', color: 'var(--warn)', fontWeight: 700 }}>
            ⚠ {tWarn !== 'ok' ? `دما ${tWarn === 'danger' ? 'خطرناک' : 'نامناسب'}` : ''}
            {tWarn !== 'ok' && hWarn !== 'ok' ? ' · ' : ''}
            {hWarn !== 'ok' ? `رطوبت ${hWarn === 'danger' ? 'خطرناک' : 'نامناسب'}` : ''}
          </div>
        )}

        <Section title="🌡 محیط">
          <Grid2>
            {l.temperature !== null && <Row l="دما" v={`${toFa(l.temperature)} °C`} warn={tWarn !== 'ok'} />}
            {l.humidity !== null && <Row l="رطوبت" v={`${toFa(l.humidity)} ٪`} warn={hWarn !== 'ok'} />}
          </Grid2>
          {(l.temperatureMin !== null || l.temperatureMax !== null) && (
            <Row l="بازه دما" v={`${l.temperatureMin !== null ? toFa(l.temperatureMin) : '—'} تا ${l.temperatureMax !== null ? toFa(l.temperatureMax) : '—'} °C`} />
          )}
          {(l.humidityMin !== null || l.humidityMax !== null) && (
            <Row l="بازه رطوبت" v={`${l.humidityMin !== null ? toFa(l.humidityMin) : '—'} تا ${l.humidityMax !== null ? toFa(l.humidityMax) : '—'} ٪`} />
          )}
          <Grid2>
            <Row l="تهویه" v={VENTILATION_LABEL[l.ventilation] || '—'} />
            <Row l="بستر" v={LITTER_LABEL[l.litter] || '—'} />
          </Grid2>
        </Section>

        <Section title="🐔 مشاهده پرنده">
          <Grid3>
            <Row l="رفتار" v={BEHAVIOR_LABEL[l.behavior] || '—'} />
            <Row l="توزیع" v={DISTRIBUTION_LABEL[l.distribution] || '—'} />
            <Row l="صدا" v={SOUND_LABEL[l.sound] || '—'} />
          </Grid3>
          {l.appearance && <div style={{ fontSize: 'var(--fs-sm)', padding: '8px 10px', background: 'var(--input-bg)', borderRadius: 'var(--r-sm)', lineHeight: 1.7 }}>{l.appearance}</div>}
        </Section>

        {(l.feedAmount !== null || l.waterAmount !== null) && (
          <Section title="🌾 تغذیه و آب">
            {l.feedType && <Row l="جیره/دان" v={l.feedType} />}
            {l.feedAmount !== null && <Row l="دان مصرفی" v={`${toFa(l.feedAmount)} kg`} />}
            {l.feedRemaining !== null && <Row l="باقیمانده" v={`${toFa(l.feedRemaining)} kg`} />}
            {l.waterAmount !== null && <Row l="آب" v={`${toFa(l.waterAmount)} L`} />}
            {l.waterFillCount !== null && l.waterFillVolume !== null && (
              <Row l="روش آب" v={`${toFa(l.waterFillCount)} بار × ${toFa(l.waterFillVolume)} L`} />
            )}
            {l.waterAmount && l.feedAmount && (
              <Row l="نسبت آب/دان" v={toFa((l.waterAmount / l.feedAmount).toFixed(2))} />
            )}
          </Section>
        )}

        {l.weightSamples && l.weightSamples.length > 0 && (
          <Section title="⚖️ وزن‌کشی">
            <Grid2>
              <Row l="تعداد نمونه" v={toFa(l.weightSamples.length)} />
              <Row l="میانگین" v={`${toFa(avgWeight(l.weightSamples))} kg`} />
            </Grid2>
            <Grid2>
              <Row l="مجموع" v={`${toFa(sumWeight(l.weightSamples))} kg`} />
              <Row l="ضریب تغییرات" v={`${toFa(cvWeight(l.weightSamples))}٪`} />
            </Grid2>
          </Section>
        )}

        {l.deaths && l.deaths.length > 0 && (
          <Section title="💀 تلفات">
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--fs-sm)', padding: '8px 10px', background: 'var(--danger-soft)', color: 'var(--danger)', borderRadius: 'var(--r-sm)', fontWeight: 700 }}>
              <span>مجموع:</span>
              <span>{toFa(l.deaths.reduce((a, x) => a + (x.count || 0), 0))} پرنده</span>
            </div>
            {l.deaths.map(d => (
              <div key={d.id} style={{ fontSize: 'var(--fs-sm)', padding: '8px 10px', background: 'var(--input-bg)', borderRadius: 'var(--r-sm)', display: 'flex', flexDirection: 'column', gap: 3 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span><b>{toFa(d.count)}</b> پرنده</span>
                  <span style={{ color: 'var(--warn)', fontSize: 'var(--fs-xs)', fontWeight: 600 }}>{causeLabel(d.cause)}</span>
                </div>
                {d.notes && <span style={{ color: 'var(--muted)', fontSize: 'var(--fs-xs)' }}>{d.notes}</span>}
              </div>
            ))}
          </Section>
        )}

        {l.vaccines.length > 0 && (
          <Section title="💉 واکسن">
            {l.vaccines.map(v => (
              <div key={v.id} style={{ fontSize: 'var(--fs-sm)', padding: '8px 10px', background: 'var(--accent-soft)', borderRadius: 'var(--r-sm)', color: 'var(--accent)' }}>
                <b>{v.name}</b>{v.dose ? ` — دوز ${v.dose}` : ''}{v.method ? ` · ${v.method}` : ''}
              </div>
            ))}
          </Section>
        )}

        {l.medications.length > 0 && (
          <Section title="💊 دارو">
            {l.medications.map(m => (
              <div key={m.id} style={{ fontSize: 'var(--fs-sm)', padding: '8px 10px', background: 'var(--info-soft)', borderRadius: 'var(--r-sm)', color: 'var(--info)' }}>
                <b>{m.name}</b>{m.dose ? ` — ${m.dose}` : ''}{m.withdrawalDays ? ` · منع مصرف ${toFa(m.withdrawalDays)} روز` : ''}
              </div>
            ))}
          </Section>
        )}

        {l.activities.length > 0 && (
          <Section title="🔧 فعالیت‌ها">
            {l.activities.map(a => (
              <div key={a.id} style={{ fontSize: 'var(--fs-sm)', padding: '6px 10px', background: 'var(--input-bg)', borderRadius: 'var(--r-sm)' }}>
                <b>{a.type}</b>{a.notes ? ` — ${a.notes}` : ''}
              </div>
            ))}
          </Section>
        )}

        {l.notes && (
          <Section title="📝 یادداشت">
            <div style={{ fontSize: 'var(--fs-sm)', lineHeight: 1.7, padding: '8px 10px', background: 'var(--input-bg)', borderRadius: 'var(--r-sm)' }}>{l.notes}</div>
          </Section>
        )}

        <div style={{ display: 'flex', gap: 6, paddingTop: 4 }}>
          <Btn size="sm" onClick={() => openEdit(l)} style={{ flex: 1 }}>ویرایش</Btn>
          <Btn size="sm" onClick={() => setDelId(l.id)} style={{ flex: 1 }}>حذف</Btn>
        </div>
      </ExpandableCard>
    );
  };

  const currentList = tab === 'today' ? todaysLogs : historicalLogs;

  return (
    <div>
      <div style={{
        display: 'flex', gap: 0, borderBottom: '1px solid var(--border)',
        padding: '0 12px', background: 'var(--header-bg)',
        position: 'sticky', top: 52, zIndex: 11
      }}>
        {tabs.map(t => (
          <div key={t.id} onClick={() => setTab(t.id)} style={{
            padding: '11px 14px', fontSize: 'var(--fs-base)', fontWeight: 600,
            color: tab === t.id ? 'var(--accent)' : 'var(--muted)',
            cursor: 'pointer', position: 'relative',
            display: 'flex', alignItems: 'center', gap: 5
          }}>
            {t.label}
            <span style={{
              fontSize: 10,
              background: tab === t.id ? 'var(--accent-soft)' : 'var(--input-bg)',
              color: tab === t.id ? 'var(--accent)' : 'var(--muted)',
              padding: '1px 5px', borderRadius: 8, fontWeight: 700
            }}>
              {toFa(t.id === 'today' ? todaysLogs.length : logs.length - todaysLogs.length)}
            </span>
            {tab === t.id && <div style={{ position: 'absolute', bottom: 0, right: 14, left: 14, height: 2.5, background: 'var(--accent)', borderRadius: '3px 3px 0 0' }} />}
          </div>
        ))}
      </div>

      <PageContainer>
        {currentList.length === 0 ? (
          <Empty
            icon={<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>}
            title={tab === 'today' ? 'امروز ثبتی ندارید' : 'تاریخچه خالی است'}
            desc={tab === 'today' ? 'اولین ثبت امروز را انجام دهید.' : 'پس از ثبت اولین روز، اینجا نمایش داده می‌شود.'}
            action={<Btn variant="primary" onClick={openNew}>+ ثبت امروز</Btn>}
          />
        ) : (
          <>
            {currentList.map((l, i) => renderLogCard(l, i))}
            <Btn variant="primary" full onClick={openNew}>+ ثبت روز جدید</Btn>
          </>
        )}

        <Modal open={open} onClose={() => setOpen(false)} title={form.id ? 'ویرایش ثبت روزانه' : 'ثبت روزانه جدید'}
          footer={<BtnRow><Btn variant="primary" onClick={save}>ذخیره</Btn><Btn onClick={() => setOpen(false)}>لغو</Btn></BtnRow>}>
<Grid2>
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
            <Field label="ساعت ورود">
              <TimePicker value={form.entryTime} onChange={v => setForm({ ...form, entryTime: v })} placeholder="انتخاب ساعت" />
            </Field>
          </Grid2>

          <Field label="تاریخ" required>
            <DatePicker value={form.date} onChange={v => setForm({ ...form, date: v })} />
          </Field>

          {flockAliveCount > 0 && (
            <div style={{ padding: '8px 12px', background: 'var(--info-soft)', border: '1px solid var(--info)', borderRadius: 'var(--r-md)', fontSize: 'var(--fs-xs)', color: 'var(--info)', fontWeight: 600, textAlign: 'center' }}>
              تعداد زنده گله: {toFa(flockAliveCount)} پرنده
              {form.feedMethod && ` · دانخوری: ${FEED_SYSTEM_LABEL[form.feedMethod as 'manual' | 'auto'] || '—'}`}
              {form.waterMethod && ` · آبخوری: ${WATER_SYSTEM_LABEL[form.waterMethod as 'manual' | 'nipple' | 'trough' | 'tank'] || '—'}`}
            </div>
          )}

          <SectionTitle>🌡 شرایط محیطی</SectionTitle>

          <Grid2>
            <Field label="حداقل دما">
              <Input placeholder="۲۰" inputMode="decimal" dir="ltr" value={form.temperatureMin} onChange={e => setForm({ ...form, temperatureMin: e.target.value })} unit="°C" />
            </Field>
            <Field label="حداکثر دما">
              <Input placeholder="۲۵" inputMode="decimal" dir="ltr" value={form.temperatureMax} onChange={e => setForm({ ...form, temperatureMax: e.target.value })} unit="°C" />
            </Field>
          </Grid2>

          <Grid2>
            <Field label="حداقل رطوبت">
              <Input placeholder="۵۰" inputMode="numeric" dir="ltr" value={form.humidityMin} onChange={e => setForm({ ...form, humidityMin: e.target.value })} unit="٪" />
            </Field>
            <Field label="حداکثر رطوبت">
              <Input placeholder="۷۰" inputMode="numeric" dir="ltr" value={form.humidityMax} onChange={e => setForm({ ...form, humidityMax: e.target.value })} unit="٪" />
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

          <SectionTitle>🐔 مشاهده پرنده</SectionTitle>

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
            <Input placeholder="رنگ پر، چشم، تاج، منقار..." value={form.appearance} onChange={e => setForm({ ...form, appearance: e.target.value })} />
          </Field>

          <SectionTitle>🌾 تغذیه</SectionTitle>

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
              <div style={{ padding: '10px 12px', background: 'var(--input-bg)', border: '1px dashed var(--border)', borderRadius: 'var(--r-md)', display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', fontWeight: 700, marginBottom: 4 }}>مواد اولیه این جیره:</div>
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
              <div style={{ padding: '8px 12px', background: warn ? 'var(--warn-soft)' : 'var(--info-soft)', border: `1px solid ${warn ? 'var(--warn)' : 'var(--info)'}`, borderRadius: 'var(--r-md)', fontSize: 'var(--fs-xs)', color: warn ? 'var(--warn)' : 'var(--info)', fontWeight: 600 }}>
                موجودی فعلی: {toFa(it.currentStock)} {UNIT_LABEL[it.unit]}
                {used > 0 && ` · بعد از مصرف: ${toFa(after)} ${UNIT_LABEL[it.unit]}`}
                {warn && ' ⚠️ زیر حد هشدار'}
              </div>
            );
          })()}

          <Grid2>
            <Field label="مقدار دان مصرفی">
              <Input placeholder="۵۰" inputMode="decimal" dir="ltr" value={form.feedAmount} onChange={e => setForm({ ...form, feedAmount: e.target.value })} unit="kg" />
            </Field>
            <Field label="دان باقیمانده">
              <Input placeholder="۰" inputMode="decimal" dir="ltr" value={form.feedRemaining} onChange={e => setForm({ ...form, feedRemaining: e.target.value })} unit="kg" />
            </Field>
          </Grid2>

          <SectionTitle>💧 آب</SectionTitle>

          {form.waterMethod === 'manual' && (
            <>
              <div style={{ padding: '8px 12px', background: 'var(--info-soft)', border: '1px solid var(--info)', borderRadius: 'var(--r-md)', fontSize: 'var(--fs-xs)', color: 'var(--info)', fontWeight: 600 }}>
                💡 حالت دستی: تعداد بار × حجم هر بار
              </div>
              <Grid2>
                <Field label="تعداد بار">
                  <Input placeholder="۵" inputMode="numeric" dir="ltr" value={form.waterFillCount} onChange={e => setForm({ ...form, waterFillCount: e.target.value })} unit="بار" />
                </Field>
                <Field label="حجم هر بار">
                  <Input placeholder="۲۰" inputMode="decimal" dir="ltr" value={form.waterFillVolume} onChange={e => setForm({ ...form, waterFillVolume: e.target.value })} unit="L" />
                </Field>
              </Grid2>
              {(form.waterFillCount && form.waterFillVolume) && (
                <div style={{ padding: '8px 12px', background: 'var(--accent-soft)', border: '1px solid var(--accent-border)', borderRadius: 'var(--r-md)', fontSize: 'var(--fs-sm)', color: 'var(--accent)', fontWeight: 700, textAlign: 'center' }}>
                  مجموع آب مصرفی: {toFa((int(form.waterFillCount) || 0) * (num(form.waterFillVolume) || 0))} لیتر
                </div>
              )}
            </>
          )}

          {form.waterMethod !== 'manual' && form.waterMethod !== '' && (
            <>
              <div style={{ padding: '8px 12px', background: 'var(--warn-soft)', border: '1px dashed var(--warn)', borderRadius: 'var(--r-md)', fontSize: 'var(--fs-xs)', color: 'var(--warn)', fontWeight: 600 }}>
                ⚠️ سیستم {WATER_SYSTEM_LABEL[form.waterMethod as 'nipple' | 'trough' | 'tank']} — فعلاً فقط دستی پیاده شده
              </div>
              <Field label="مقدار آب مصرفی (تخمینی)">
                <Input placeholder="۱۰۰" inputMode="decimal" dir="ltr" value={form.waterAmount} onChange={e => setForm({ ...form, waterAmount: e.target.value })} unit="L" />
              </Field>
            </>
          )}

          <SectionTitle>⚖️ وزن‌کشی (اختیاری)</SectionTitle>

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
                <div style={{ padding: '8px 12px', background: 'var(--input-bg)', borderRadius: 'var(--r-sm)', fontSize: 'var(--fs-xs)' }}>
                  میانگین: {toFa(avgWeight(form.weightSamples.map(w => ({ id: w.id, weight: num(w.weight) || 0 }))))} kg · CV: {toFa(cvWeight(form.weightSamples.map(w => ({ id: w.id, weight: num(w.weight) || 0 }))))}٪
                </div>
              </Field>
            </Grid2>
          )}

          {form.weightSamples.map((w, i) => (
            <div key={w.id} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <div style={{ flex: 1 }}>
                <Input
                  placeholder={`نمونه ${toFa(i + 1)}`}
                  inputMode="decimal"
                  dir="ltr"
                  value={w.weight}
                  onChange={e => setForm(f => ({ ...f, weightSamples: f.weightSamples.map(x => x.id === w.id ? { ...x, weight: e.target.value } : x) }))}
                  unit="kg"
                />
              </div>
              <button type="button" onClick={() => setForm(f => ({ ...f, weightSamples: f.weightSamples.filter(x => x.id !== w.id) }))}
                style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', color: 'var(--danger)', cursor: 'pointer', fontFamily: 'inherit', width: 38, height: 38, flexShrink: 0 }}>✕</button>
            </div>
          ))}

          <Btn size="sm" full onClick={() => setForm(f => ({ ...f, weightSamples: [...f.weightSamples, { id: crypto.randomUUID(), weight: '' }] }))}>
            + افزودن نمونه وزن
          </Btn>

          <SectionTitle>💀 تلفات</SectionTitle>

          {form.deaths.length > 0 && (
            <div style={{ padding: '8px 12px', background: 'var(--danger-soft)', border: '1px solid var(--danger)', borderRadius: 'var(--r-md)', fontSize: 'var(--fs-sm)', color: 'var(--danger)', fontWeight: 700, textAlign: 'center' }}>
              مجموع: {toFa(form.deaths.reduce((a, x) => a + (x.count || 0), 0))} پرنده
              {flockAliveCount ? ` از ${toFa(flockAliveCount)}` : ''}
            </div>
          )}

          {form.deaths.map((d, i) => (
            <div key={d.id} style={{ padding: '10px 12px', background: 'var(--danger-soft)', border: '1px solid var(--danger)', borderRadius: 'var(--r-md)', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--danger)', fontWeight: 700 }}>رکورد {toFa(i + 1)}</span>
                <button type="button" onClick={() => setForm(f => ({ ...f, deaths: f.deaths.filter(x => x.id !== d.id) }))}
                  style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 14 }}>✕</button>
              </div>
              <Grid2>
                <Field label="تعداد">
                  <Input placeholder="۰" inputMode="numeric" dir="ltr" value={String(d.count || '')}
                    onChange={e => setForm(f => ({ ...f, deaths: f.deaths.map(x => x.id === d.id ? { ...x, count: parseInt(toEn(e.target.value)) || 0 } : x) }))}
                    min={0} max={flockAliveCount || undefined} />
                </Field>
                <Field label="علت">
                  <Select value={d.cause || ''} onChange={e => setForm(f => ({ ...f, deaths: f.deaths.map(x => x.id === d.id ? { ...x, cause: e.target.value } : x) }))}>
                    {DEATH_CAUSES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </Select>
                </Field>
              </Grid2>
              <Field label="توضیحات">
                <Input placeholder="جزئیات..." value={d.notes || ''}
                  onChange={e => setForm(f => ({ ...f, deaths: f.deaths.map(x => x.id === d.id ? { ...x, notes: e.target.value } : x) }))} />
              </Field>
            </div>
          ))}

          <Btn size="sm" full onClick={() => setForm(f => ({ ...f, deaths: [...f.deaths, { id: crypto.randomUUID(), count: 0, cause: '', notes: '' }] }))}>
            + افزودن رکورد تلفات
          </Btn>

          <SectionTitle>💉 واکسن و دارو</SectionTitle>

          <Btn size="sm" full onClick={() => setForm(f => ({ ...f, vaccines: [...f.vaccines, { id: crypto.randomUUID(), name: '', dose: '', method: '', reaction: '' }] }))}>
            + افزودن واکسن
          </Btn>
          {form.vaccines.map((v, i) => (
            <div key={v.id} style={{ padding: '10px 12px', background: 'var(--accent-soft)', border: '1px solid var(--accent-border)', borderRadius: 'var(--r-md)', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--accent)', fontWeight: 700 }}>واکسن {toFa(i + 1)}</span>
                <button onClick={() => setForm(f => ({ ...f, vaccines: f.vaccines.filter(x => x.id !== v.id) }))} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontFamily: 'inherit' }}>✕</button>
              </div>
              <Grid2>
                <Input placeholder="نام" value={v.name} onChange={e => setForm(f => ({ ...f, vaccines: f.vaccines.map(x => x.id === v.id ? { ...x, name: e.target.value } : x) }))} />
                <Input placeholder="دوز" value={v.dose} onChange={e => setForm(f => ({ ...f, vaccines: f.vaccines.map(x => x.id === v.id ? { ...x, dose: e.target.value } : x) }))} />
              </Grid2>
            </div>
          ))}

          <Btn size="sm" full onClick={() => setForm(f => ({ ...f, medications: [...f.medications, { id: crypto.randomUUID(), name: '', dose: '', method: '', withdrawalDays: null }] }))}>
            + افزودن دارو
          </Btn>
          {form.medications.map((m, i) => (
            <div key={m.id} style={{ padding: '10px 12px', background: 'var(--info-soft)', border: '1px solid var(--info)', borderRadius: 'var(--r-md)', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--info)', fontWeight: 700 }}>دارو {toFa(i + 1)}</span>
                <button onClick={() => setForm(f => ({ ...f, medications: f.medications.filter(x => x.id !== m.id) }))} style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontFamily: 'inherit' }}>✕</button>
              </div>
              <Grid2>
                <Input placeholder="نام" value={m.name} onChange={e => setForm(f => ({ ...f, medications: f.medications.map(x => x.id === m.id ? { ...x, name: e.target.value } : x) }))} />
                <Input placeholder="دوز" value={m.dose} onChange={e => setForm(f => ({ ...f, medications: f.medications.map(x => x.id === m.id ? { ...x, dose: e.target.value } : x) }))} />
              </Grid2>
            </div>
          ))}

          <SectionTitle>🔧 فعالیت‌ها</SectionTitle>

          <Btn size="sm" full onClick={() => setForm(f => ({ ...f, activities: [...f.activities, { id: crypto.randomUUID(), type: '', notes: '' }] }))}>
            + افزودن فعالیت
          </Btn>
          {form.activities.map((a, i) => (
            <div key={a.id} style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <Input placeholder="نوع فعالیت..." value={a.type} onChange={e => setForm(f => ({ ...f, activities: f.activities.map(x => x.id === a.id ? { ...x, type: e.target.value } : x) }))} />
              <button onClick={() => setForm(f => ({ ...f, activities: f.activities.filter(x => x.id !== a.id) }))} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 'var(--r-md)', color: 'var(--danger)', cursor: 'pointer', fontFamily: 'inherit', width: 38, height: 38, flexShrink: 0 }}>✕</button>
            </div>
          ))}

          <SectionTitle>📝 یادداشت</SectionTitle>
          <Field label="یادداشت">
            <Input placeholder="..." value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
          </Field>

          {err && <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--danger)' }}>✕ {err}</div>}
        </Modal>

        <Modal open={!!delId} onClose={() => setDelId(null)} title="حذف ثبت روزانه"
          footer={<BtnRow><Btn variant="danger" onClick={() => {
            if (delId) {
              const log = logs.find(l => l.id === delId);
              if (log?.feedMovementIds) log.feedMovementIds.forEach(id => deleteMovement(id));
              remove(delId);
            }
            setDelId(null);
          }}>حذف کن</Btn><Btn onClick={() => setDelId(null)}>لغو</Btn></BtnRow>}>
          <div style={{ textAlign: 'center', fontSize: 'var(--fs-md)' }}>حذف این ثبت؟</div>
        </Modal>
      </PageContainer>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <>
      <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--muted)', fontWeight: 700, letterSpacing: '.3px' }}>{title}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>{children}</div>
    </>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ paddingTop: 10, marginTop: 4, borderTop: '1px dashed var(--border)', fontSize: 'var(--fs-sm)', fontWeight: 700, color: 'var(--muted)' }}>{children}</div>
  );
}

function Row({ l, v, warn }: { l: string; v: string; warn?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--fs-sm)', padding: '6px 10px', background: warn ? 'var(--warn-soft)' : 'var(--input-bg)', borderRadius: 'var(--r-sm)', color: warn ? 'var(--warn)' : undefined, fontWeight: warn ? 700 : undefined }}>
      <span style={{ color: warn ? 'var(--warn)' : 'var(--muted)' }}>{l}:</span>
      <span style={{ fontWeight: 600, color: warn ? 'var(--warn)' : 'var(--text)' }}>{v}</span>
    </div>
  );
}
