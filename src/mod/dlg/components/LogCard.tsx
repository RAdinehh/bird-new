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
  avgWeight, sumWeight, cvWeight,
} from '../store';
import { calculateEnvironmentWarnings } from '../../../shr/calc';
import { toFa } from '../../../shr/utils/fa';
import { getEffectiveEnv } from '../../set/standards/resolve';
import { useSet } from '../../set/store';
import { getAgeDays } from '../../flk/store';
import { Btn, Tag } from '../../../shr/components/ui';
import { BadgeOverflow, type BadgeItem } from '../../../shr/components/ui/BadgeOverflow';
import ExpandableCard from '../../../shr/components/ExpandableCard';
import { LogSection, Row, LogGroup, LogSubSection, LogItem } from '../helpers';
import { VET_METHOD_LABEL } from '../../../shr/constants/vetMethods';
import { GENDER_LABEL, formatWeightGrams, cvText } from '../../../shr/utils/weightHelpers';
import { calculateWeightMetrics } from '../../../shr/calc';
import { applyCorrections } from '../api/applyCorrections';
import { showConfirmAsync } from '../../../cor/store/dialog';
import { Grid2, Grid3 } from '../../../shr/components/ui';
import { CardActions } from '../../../shr/components/ui';
import type { ReactNode } from 'react';

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
  onCorrect: () => void;
  onHistory?: () => void;
  onRevokeCorrection: (correctionId: string) => void;
}

const FIELD_LABEL: Record<string, string> = {
  temperature: 'دما',
  temperatureMin: 'حداقل دما',
  temperatureMax: 'حداکثر دما',
  humidity: 'رطوبت',
  humidityMin: 'حداقل رطوبت',
  humidityMax: 'حداکثر رطوبت',
  feedDelivered: 'دان داده‌شده',
  feedRemaining: 'دان باقی‌مانده',
  feedConsumed: 'دان مصرفی',
  waterAmount: 'آب مصرفی',
  deathsCount: 'تلفات',
  eatingEggs: 'تخم خوراکی',
  fertileEggs: 'تخم نطفه‌دار',
  brokenEggs: 'تخم شکسته',
  otherEggs: 'تخم سایر',
};

export default function LogCard(props: LogCardProps) {
  const {
    log: rawLog, index: i, flock, birdName,
    isOpen, selectionMode, vaccineEnabled, medicineEnabled, ms,
    onToggle, onEdit, onArchive, onRestore, onDelete, onCorrect, onRevokeCorrection, onHistory,
  } = props;

  // 🆕 مقدار effective = با corrections اعمال‌شده
  const l = applyCorrections(rawLog);
  const hasCorrections = (rawLog.corrections || []).some(c => !c.revoked);
  const hasAnyCorrections = (rawLog.corrections || []).length > 0;

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

  // 🆕 BUG-2 fix: اولویت بازه کاربر بر استاندارد نژاد
  const effTempMin = l.temperatureMin ?? stdTempMin;
  const effTempMax = l.temperatureMax ?? stdTempMax;
  const effHumMin = l.humidityMin ?? stdHumMin;
  const effHumMax = l.humidityMax ?? stdHumMax;

  const envWarn = calculateEnvironmentWarnings({
    tempC: l.temperature,
    tempMin: effTempMin,
    tempMax: effTempMax,
    tempTarget: stdTempTarget,
    humidityPct: l.humidity,
    humidityMin: effHumMin,
    humidityMax: effHumMax,
  });

  // 🆕 BUG-2: هشدار تناقض بازه کاربر با استاندارد نژاد
  const humMismatch = l.humidityMin !== null && l.humidityMax !== null && stdHumMin !== null && stdHumMax !== null
    && (l.humidityMin < stdHumMin - 10 || l.humidityMax > stdHumMax + 10);
  const tempMismatch = l.temperatureMin !== null && l.temperatureMax !== null && stdTempMin !== null && stdTempMax !== null
    && (l.temperatureMin < stdTempMin - 3 || l.temperatureMax > stdTempMax + 3);
  const tWarn = envWarn.tempTone;
  const hWarn = envWarn.humidityTone;
  const tIsBad = tWarn === 'warn' || tWarn === 'danger';
  const hIsBad = hWarn === 'warn' || hWarn === 'danger';
  const hasProblem = tIsBad || hIsBad || l.deathsCount > 0;
  const accent: any = hasProblem ? 'warn' : 'accent';

  // 🆕 BadgeOverflow badges
  const allBadges: BadgeItem[] = [];
  if (hasCorrections) allBadges.push({ key: 'corrections', node: <Tag tone="blue">اصلاح‌شده</Tag> });
  if (l.deathsCount > 0) allBadges.push({ key: 'deaths', node: <Tag tone="amber">{toFa(l.deathsCount)} تلفات</Tag> });

  return (
    <ExpandableCard
      id={l.id} ms={ms} accent={accent}
      index={toFa(i + 1)} iconEmoji="📋"
      title={flock?.name || '—'}
      subtitle={`${toFa(l.date)}${l.entryTime ? ` • ${toFa(l.entryTime)}` : ''}${l.birdAgeDays !== null && l.birdAgeDays > 0 ? ` • ${toFa(l.birdAgeDays)} روز` : ''}${birdName ? ` • ${birdName}` : ''}`}
      isOpen={isOpen} onToggle={onToggle}
      badge={<BadgeOverflow badges={allBadges} max={2} modalTitle={`برچسب‌های «${flock?.name || 'لاگ'}»`} />}
      stats={<>
        {l.temperature !== null && <span>🌡 {toFa(l.temperature)}°</span>}
        {l.humidity !== null && <span>💧 {toFa(l.humidity)}٪</span>}
        {l.feedDelivered !== null && <span>🌾 {toFa(l.feedDelivered)} کیلوگرم</span>}
        {l.waterAmount !== null && <span>💧 {toFa(l.waterAmount)} لیتر</span>}
      </>}
    >
      <LogSection title="🌡 محیط">
        <Grid2>
          {l.temperature !== null && <Row l="دما" v={`${toFa(l.temperature)} °C`} warn={tIsBad} />}
          {l.humidity !== null && <Row l="رطوبت" v={`${toFa(l.humidity)} ٪`} warn={hIsBad} />}
          {(l.temperatureMin !== null || l.temperatureMax !== null) && (
            <Row l="بازه دما" v={`${l.temperatureMin !== null ? toFa(l.temperatureMin) : '—'} تا ${l.temperatureMax !== null ? toFa(l.temperatureMax) : '—'} °C`} warn={tempMismatch} />
          )}
          {(l.humidityMin !== null || l.humidityMax !== null) && (
            <Row l="بازه رطوبت" v={`${l.humidityMin !== null ? toFa(l.humidityMin) : '—'} تا ${l.humidityMax !== null ? toFa(l.humidityMax) : '—'} ٪`} warn={humMismatch} />
          )}
          {l.ventilation !== 'ok' && <Row l="تهویه" v={VENTILATION_LABEL[l.ventilation] || '—'} />}
          {l.litter !== 'dry' && <Row l="بستر" v={LITTER_LABEL[l.litter] || '—'} />}
        </Grid2>
      </LogSection>

      {(l.behavior !== 'active' || l.distribution !== 'uniform' || l.sound !== 'normal' || l.appearance) && (
        <LogSection title="🐔 مشاهده پرنده">
          <Grid3>
            {l.behavior !== 'active' && <Row l="رفتار" v={BEHAVIOR_LABEL[l.behavior] || '—'} />}
            {l.distribution !== 'uniform' && <Row l="توزیع" v={DISTRIBUTION_LABEL[l.distribution] || '—'} />}
            {l.sound !== 'normal' && <Row l="صدا" v={SOUND_LABEL[l.sound] || '—'} />}
          </Grid3>
          {l.appearance && <div style={{ fontSize: 'var(--fs-sm)', padding: 'var(--pad-normal)', background: 'var(--input-bg)', borderRadius: 'var(--r-sm)', lineHeight: 1.7 }}>{l.appearance}</div>}
        </LogSection>
      )}

      {(l.feedDelivered !== null || l.waterAmount !== null) && (
        <LogSection title="🌾 تغذیه و آب">
          <Grid2>
            {l.feedType && <Row l="جیره/دان" v={l.feedType} />}
            {l.feedDelivered !== null && <Row l="دان داده‌شده" v={`${toFa(l.feedDelivered)} کیلوگرم`} />}
            {l.feedConsumed !== null && l.feedConsumed !== undefined && l.feedConsumed !== l.feedDelivered && (
              <Row l="دان مصرف‌شده" v={`${toFa(l.feedConsumed)} کیلوگرم`} />
            )}
            {l.feedConsumed !== null && l.feedConsumed > 0 && flock && (flock.currentCount || 0) > 0 && (() => {
              const g = (l.feedConsumed * 1000) / (flock.currentCount || 1);
              const isWarn = g < 5 || g > 300;
              return <Row l="دان/پرنده" v={`${toFa(g.toFixed(1))} گرم`} warn={isWarn} />;
            })()}
            {l.feedRemaining !== null && <Row l="باقیمانده" v={`${toFa(l.feedRemaining)} کیلوگرم`} />}
            {l.waterAmount !== null && <Row l="آب" v={`${toFa(l.waterAmount)} لیتر`} />}
            {l.waterFillCount !== null && l.waterFillVolume !== null && (
              <Row l="روش آب" v={`${toFa(l.waterFillCount)} بار × ${toFa(l.waterFillVolume)} لیتر`} />
            )}
            {(() => {
              const effectiveFeed = (l.feedConsumed && l.feedConsumed > 0) ? l.feedConsumed : l.feedDelivered;
              if (!l.waterAmount || !effectiveFeed || effectiveFeed <= 0) return null;
              return <Row l="نسبت آب/دان" v={toFa((l.waterAmount / effectiveFeed).toFixed(2))} />;
            })()}
          </Grid2>
        </LogSection>
      )}

      {((l.eatingEggs || 0) + (l.fertileEggs || 0) + (l.brokenEggs || 0) + (l.otherEggs || 0)) > 0 && (
        <LogSection title="🥚 تخم">
          <Grid2>
            {l.eatingEggs ? <Row l="خوراکی" v={toFa(l.eatingEggs)} /> : null}
            {l.fertileEggs ? <Row l="نطفه‌دار" v={toFa(l.fertileEggs)} /> : null}
          </Grid2>
          <Grid2>
            {l.brokenEggs ? <Row l="شکسته" v={toFa(l.brokenEggs)} /> : null}
            {l.otherEggs ? <Row l="سایر" v={toFa(l.otherEggs)} /> : null}
          </Grid2>
          <Row l="مجموع" v={toFa((l.eatingEggs||0)+(l.fertileEggs||0)+(l.brokenEggs||0)+(l.otherEggs||0))} />
        </LogSection>
      )}

      {l.weightSamples && l.weightSamples.length > 0 && (() => {
        const parseW = (s: string | number): number => {
          const str = String(s).replace(/[۰-۹]/g, d => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d))).replace('٫', '.');
          return parseFloat(str) || 0;
        };
        const weights = l.weightSamples.map(w => parseW(w.weight)).filter(w => w > 0);
        if (weights.length === 0) return null;
        const hasThree = weights.length >= 3;
        const metrics = hasThree ? calculateWeightMetrics({
          samples: weights.map((w, i) => ({ id: String(i), weight: w })),
          previousAvgWeightG: null,
          ageDays: l.birdAgeDays ?? 0,
          standardWeightG: null,
        }) : null;
        const avg = metrics && metrics.hasData ? metrics.avgWeightG : (weights.reduce((a, b) => a + b, 0) / weights.length);
        const cv = metrics && metrics.hasData ? metrics.cvPct : cvWeight(l.weightSamples);
        const cvLbl = cvText(cv);
        return (
          <LogSection title="⚖️ وزن‌کشی">
            <Grid2>
              <Row l="تعداد نمونه" v={toFa(weights.length)} />
              <Row l="میانگین" v={formatWeightGrams(avg)} />
            </Grid2>
            <Grid2>
              {l.weightGender ? (
                <Row l="جنسیت" v={GENDER_LABEL[l.weightGender] || l.weightGender} />
              ) : <div />}
              <Row l="ضریب تغییرات" v={`${toFa(cv)}٪`} />
            </Grid2>
            <div style={{ fontSize: 'var(--fs-xs)', color: cvLbl.color, fontWeight: 600, paddingRight: 4, marginTop: 2 }}>
              {cvLbl.text}
            </div>
            {metrics && metrics.hasData && (
              <Row l="یکنواختی" v={`${toFa(metrics.uniformityPct)}٪`} accent={metrics.uniformityPct >= 80} />
            )}
          </LogSection>
        );
      })()}

      {(() => {
        const hasDeaths = l.deaths && l.deaths.length > 0;
        const hasVaccines = vaccineEnabled && l.vaccines.length > 0;
        const hasMeds = medicineEnabled && l.medications.length > 0;
        if (!hasDeaths && !hasVaccines && !hasMeds) return null;
        return (
          <LogSection title="🏥 سلامت">
            <Grid2>
              {l.deaths.map(d => (
                <Row
                  key={d.id}
                  l="تلفات"
                  v={`${toFa(d.count)} پرنده${d.cause ? ` (${causeLabel(d.cause)})` : ''}`}
                  warn={true}
                />
              ))}
              {l.vaccines.map(v => {
                const methodLabel = v.method ? (VET_METHOD_LABEL[v.method] || v.method) : null;
                const detail = [
                  v.dose ? `دوز ${toFa(v.dose)}` : null,
                  v.quantity ? `${toFa(v.quantity)} ${v.unit || ''}` : null,
                  methodLabel,
                ].filter(Boolean).join(' • ') || '—';
                return <Row key={v.id} l={`واکسن: ${v.name || 'بدون نام'}`} v={detail} />;
              })}
              {l.medications.map(m => {
                const methodLabel = m.method ? (VET_METHOD_LABEL[m.method] || m.method) : null;
                const detail = [
                  m.dose ? `دوز ${toFa(m.dose)}` : null,
                  m.quantity ? `${toFa(m.quantity)} ${m.unit || ''}` : null,
                  methodLabel,
                  m.withdrawalDays ? `پرهیز ${toFa(m.withdrawalDays)} روز` : null,
                ].filter(Boolean).join(' • ') || '—';
                return <Row key={m.id} l={`دارو: ${m.name || 'بدون نام'}`} v={detail} />;
              })}
            </Grid2>
          </LogSection>
        );
      })()}

      {l.notes && (
        <LogSection title="📝 یادداشت">
          <div style={{ fontSize: 'var(--fs-sm)', lineHeight: 1.7, padding: 'var(--pad-normal)', background: 'var(--input-bg)', borderRadius: 'var(--r-sm)' }}>{l.notes}</div>
        </LogSection>
      )}

      {hasAnyCorrections && (
        <LogSection title="📝 تاریخچه اصلاحات">
          {(rawLog.corrections || []).map(corr => (
            <div
              key={corr.id}
              style={{
                fontSize: 'var(--fs-xs)',
                padding: 'var(--pad-tight)',
                background: corr.revoked ? 'var(--input-bg)' : 'var(--warn-soft)',
                border: `1px solid ${corr.revoked ? 'var(--border)' : 'var(--warn)'}`,
                borderRadius: 'var(--r-sm)',
                opacity: corr.revoked ? 0.6 : 1,
                display: 'flex',
                flexWrap: 'wrap',
                gap: 6,
                alignItems: 'baseline',
              }}
            >
              <span style={{
                fontFamily: 'monospace',
                fontWeight: 700,
                color: 'var(--muted)',
              }}>{toFa(corr.timestamp)}</span>
              <span style={{ color: 'var(--text)', fontWeight: 600 }}>
                {Object.keys(corr.changes).map(k => {
                  const oldVal = (rawLog as any)[k];
                  const newVal = (corr.changes as any)[k];
                  return `${FIELD_LABEL[k] || k}: ${oldVal ?? '—'} → ${newVal ?? '—'}`;
                }).join(' • ')}
              </span>
              <span style={{ color: 'var(--muted)' }}>({corr.reason})</span>
              {corr.revoked ? (
                <span style={{
                  background: 'var(--danger-soft)',
                  color: 'var(--danger)',
                  fontWeight: 700,
                  padding: '1px 6px',
                  borderRadius: 3,
                }}>لغو شده</span>
              ) : (
                <button
                  type="button"
                  onClick={async (e) => {
                    e.stopPropagation();
                    const ok = await showConfirmAsync(
                      'لغو اصلاح',
                      `اصلاح ${toFa(corr.timestamp)} لغو شود؟ (مقادیر به حالت قبل برمی‌گردند)`
                    );
                    if (ok) onRevokeCorrection(corr.id);
                  }}
                  style={{
                    padding: '1px 6px',
                    background: 'transparent',
                    border: '1px solid var(--border)',
                    borderRadius: 3,
                    fontSize: 10,
                    color: 'var(--muted)',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}
                >↩️ لغو</button>
              )}
            </div>
          ))}
        </LogSection>
      )}

      <CardActions actions={[
        { label: 'ویرایش', onClick: onEdit, variant: 'outline', hidden: (l.status || 'active') !== 'active' },
        { label: 'اصلاح', onClick: onCorrect, variant: 'outline', hidden: (l.status || 'active') !== 'active' },
        { label: 'تاریخچه', onClick: () => onHistory?.(), variant: 'outline', hidden: onHistory === undefined },
        { label: 'بازگردانی', onClick: onRestore, variant: 'outline', hidden: (l.status || 'active') === 'active' },
        { label: 'حذف', onClick: onDelete, variant: 'danger-outline', hidden: (l.status || 'active') === 'active' },
      ]} />
    </ExpandableCard>
  );
}
