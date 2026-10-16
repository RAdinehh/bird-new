/**
 * LogCard.tsx — کارت نمایش یک ثبت روزانه
 *
 * تمام JSX کارت اینجاست. کامپوننت خالص نمایشی با callback ها.
 */
import type { DailyLog } from '../store';
import type { Flock } from '../../flk/store';
import {
  VENTILATION_LABEL, LITTER_LABEL, BEHAVIOR_LABEL,
  DISTRIBUTION_LABEL, SOUND_LABEL, causeLabel,
  tempWarning, humidityWarning, avgWeight, sumWeight, cvWeight,
} from '../store';
import { toFa } from '../../../shr/utils/fa';
import { getEffectiveEnv } from '../../set/standards/resolve';
import { useSet } from '../../set/store';
import { getAgeDays } from '../../flk/store';
import { Btn, Tag } from '../../../shr/components/ui';
import ExpandableCard from '../../../shr/components/ExpandableCard';
import { Section, Row } from '../helpers';
import { Grid2, Grid3 } from '../../../shr/components/ui';

export interface LogCardProps {
  log: DailyLog;
  index: number;
  flock: Flock | undefined;
  birdName: string | undefined;
  isOpen: boolean;
  selectionMode: boolean;
  vaccineEnabled: boolean;
  medicineEnabled: boolean;
  ms: any;
  onToggle: () => void;
  onEdit: () => void;
  onArchive: () => void;
  onRestore: () => void;
  onDelete: () => void;
}

export default function LogCard(props: LogCardProps) {
  const {
    log: l, index: i, flock, birdName,
    isOpen, selectionMode, vaccineEnabled, medicineEnabled, ms,
    onToggle, onEdit, onArchive, onRestore, onDelete,
  } = props;

  // 🆕 خواندن محدوده استاندارد بر اساس پرنده و سن
  const customStandards = useSet((s: any) => s.customStandards) || {};
  let stdTempMin: number | null = null;
  let stdTempMax: number | null = null;
  let stdTempTarget: number | null = null;
  let stdHumMin: number | null = null;
  let stdHumMax: number | null = null;

  if (flock && birdName) {
    try {
      const age = getAgeDays(flock);
      const env = getEffectiveEnv(birdName, age, null, { customStandards });
      stdTempMin = env.temp?.min ?? null;
      stdTempMax = env.temp?.max ?? null;
      stdTempTarget = env.temp?.target ?? null;
      stdHumMin = env.humidity?.min ?? null;
      stdHumMax = env.humidity?.max ?? null;
    } catch { /* silent */ }
  }

  const tWarn = tempWarning(l.temperature, stdTempMin, stdTempMax, stdTempTarget);
  const hWarn = humidityWarning(l.humidity, stdHumMin, stdHumMax);
  const hasProblem = tWarn !== 'ok' || hWarn !== 'ok' || l.deathsCount > 0;
  const accent: any = hasProblem ? 'warn' : 'accent';

  return (
    <ExpandableCard
      id={l.id} ms={ms} accent={accent}
      index={toFa(i + 1)} iconEmoji="📋"
      title={flock?.name || '—'}
      subtitle={`${toFa(l.date)}${l.entryTime ? ` • ${toFa(l.entryTime)}` : ''}${birdName ? ` • ${birdName}` : ''}`}
      isOpen={isOpen} onToggle={onToggle}
      badge={l.deathsCount > 0 ? <Tag tone="amber">{toFa(l.deathsCount)} تلفات</Tag> : undefined}
      stats={<>
        {l.temperature !== null && <span>🌡 {toFa(l.temperature)}°</span>}
        {l.humidity !== null && <span>💧 {toFa(l.humidity)}٪</span>}
        {l.feedAmount !== null && <span>🌾 {toFa(l.feedAmount)} kg</span>}
        {l.waterAmount !== null && <span>💧 {toFa(l.waterAmount)} L</span>}
      </>}
    >
      {(tWarn !== 'ok' || hWarn !== 'ok') && (
        <div style={{ padding: 'var(--pad-normal)', background: 'var(--warn-soft)', border: '1px dashed var(--warn)', borderRadius: 'var(--r-md)', fontSize: 'var(--fs-xs)', color: 'var(--warn)', fontWeight: 700 }}>
          ⚠ {tWarn !== 'ok' ? `دما ${tWarn === 'danger' ? 'خطرناک' : 'نامناسب'}` : ''}
          {tWarn !== 'ok' && hWarn !== 'ok' ? ' • ' : ''}
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
        {l.appearance && <div style={{ fontSize: 'var(--fs-sm)', padding: 'var(--pad-normal)', background: 'var(--input-bg)', borderRadius: 'var(--r-sm)', lineHeight: 1.7 }}>{l.appearance}</div>}
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
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--fs-sm)', padding: 'var(--pad-normal)', background: 'var(--danger-soft)', color: 'var(--danger)', borderRadius: 'var(--r-sm)', fontWeight: 700 }}>
            <span>مجموع:</span>
            <span>{toFa(l.deaths.reduce((a, x) => a + (x.count || 0), 0))} پرنده</span>
          </div>
          {l.deaths.map(d => (
            <div key={d.id} style={{ fontSize: 'var(--fs-sm)', padding: 'var(--pad-normal)', background: 'var(--input-bg)', borderRadius: 'var(--r-sm)', display: 'flex', flexDirection: 'column', gap: 3 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span><b>{toFa(d.count)}</b> پرنده</span>
                <span style={{ color: 'var(--warn)', fontSize: 'var(--fs-xs)', fontWeight: 600 }}>{causeLabel(d.cause)}</span>
              </div>
              {d.notes && <span style={{ color: 'var(--muted)', fontSize: 'var(--fs-xs)' }}>{d.notes}</span>}
            </div>
          ))}
        </Section>
      )}

      {vaccineEnabled && l.vaccines.length > 0 && (
        <Section title="💉 واکسن">
          {l.vaccines.map(v => (
            <div key={v.id} style={{ fontSize: 'var(--fs-sm)', padding: 'var(--pad-normal)', background: 'var(--accent-soft)', borderRadius: 'var(--r-sm)', color: 'var(--accent)' }}>
              <b>{v.name}</b>{v.dose ? ` — دوز ${v.dose}` : ''}{v.method ? ` • ${v.method}` : ''}
            </div>
          ))}
        </Section>
      )}

      {medicineEnabled && l.medications.length > 0 && (
        <Section title="💊 دارو">
          {l.medications.map(m => (
            <div key={m.id} style={{ fontSize: 'var(--fs-sm)', padding: 'var(--pad-normal)', background: 'var(--input-bg)', borderRadius: 'var(--r-sm)', color: 'var(--text)' }}>
              <b>{m.name}</b>{m.dose ? ` — ${m.dose}` : ''}{m.withdrawalDays ? ` • منع مصرف ${toFa(m.withdrawalDays)} روز` : ''}
            </div>
          ))}
        </Section>
      )}

      {l.activities.length > 0 && (
        <Section title="🔧 فعالیت‌ها">
          {l.activities.map(a => (
            <div key={a.id} style={{ fontSize: 'var(--fs-sm)', padding: 'var(--pad-tight)', background: 'var(--input-bg)', borderRadius: 'var(--r-sm)' }}>
              <b>{a.type}</b>{a.notes ? ` — ${a.notes}` : ''}
            </div>
          ))}
        </Section>
      )}

      {l.notes && (
        <Section title="📝 یادداشت">
          <div style={{ fontSize: 'var(--fs-sm)', lineHeight: 1.7, padding: 'var(--pad-normal)', background: 'var(--input-bg)', borderRadius: 'var(--r-sm)' }}>{l.notes}</div>
        </Section>
      )}

      <div style={{ display: 'flex', gap: 6, paddingTop: 4 }}>
        {(l.status || 'active') === 'active' ? (
          <>
            <Btn size="sm" onClick={onEdit} style={{ flex: 1 }}>ویرایش</Btn>
            <Btn size="sm" onClick={onArchive} style={{ flex: 1 }}>📦 آرشیو</Btn>
          </>
        ) : (
          <>
            <Btn size="sm" variant="primary" onClick={onRestore} style={{ flex: 1 }}>♻️ بازگردانی</Btn>
            <Btn size="sm" onClick={onDelete} style={{ flex: 1 }}>حذف</Btn>
          </>
        )}
      </div>
    </ExpandableCard>
  );
}
