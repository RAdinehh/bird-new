import { createElement } from "react";
/**
 * LogCard.tsx — کارت نمایش یک ثبت روزانه
 *
 * تمام JSX کارت اینجاست. کامپوننت خالص نمایشی با callback ها.
 */
import { useFormat, getGlobalFormat } from '../../../shr/units/useFormat';

import type { DailyLog } from '../store';
import type { Flock } from '../../flk/store';
import {
  VENTILATION_LABEL, LITTER_LABEL, BEHAVIOR_LABEL,
  DISTRIBUTION_LABEL, SOUND_LABEL, causeLabel,
  avgWeight, sumWeight, cvWeight,
} from '../store';
import { calculateEnvironmentWarnings } from '../../../shr/calc';
import { toFa } from '../../../shr/utils/fa';
import { format as formatJ, parse as parseJ, differenceInCalendarDays } from 'date-fns-jalali';
import { getEffectiveEnv, getMortalityRange } from '../../set/standards/resolve';
import { useSet } from '../../set/store';
import { getAgeDays } from '../../flk/store';
import { Btn, Tag } from '../../../shr/components/ui';
import { BadgeOverflow, type BadgeItem } from '../../../shr/components/ui/BadgeOverflow';
import ExpandableCard from '../../../shr/components/ExpandableCard';
import { LogSection, Row, LogGroup, LogSubSection, LogItem } from '../helpers';
import EntityLink from '../../../shr/components/EntityLink';
import { VET_METHOD_LABEL } from '../../../shr/constants/vetMethods';
import { GENDER_LABEL, formatWeightGrams, cvText } from '../../../shr/utils/weightHelpers';
import { calculateWeightMetrics } from '../../../shr/calc';
import { applyCorrections, getSafeHealthArrays } from '../api/applyCorrections';
import { showConfirmAsync } from '../../../cor/store/dialog';
import { Grid2, Grid3 } from '../../../shr/components/ui';
import { CardActions } from '../../../shr/components/ui';
import { ACTION_PRESETS } from '../../../shr/constants/cardActions';
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
  feedWaste: 'دان هدر رفته',
  waterAmount: 'آب مصرفی',
  waterFillCount: 'دفعات آب',
  waterFillVolume: 'حجم هر نوبت',
  deathsCount: 'تلفات',
  eatingEggs: 'تخم خوراکی',
  fertileEggs: 'تخم نطفه‌دار',
  brokenEggs: 'تخم شکسته',
  otherEggs: 'تخم سایر',
  weightGender: 'جنسیت وزن',
};

export default function LogCard(props: LogCardProps) {
  const fmt = useFormat();
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

  let mortalityStd: any = null;
  if (flock && birdName) {
      try {
        const age = getAgeDays(flock);
        const env = getEffectiveEnv(birdName, age, null, { customStandards });
        stdTempMin = env.temp?.min ?? null;
        stdTempMax = env.temp?.max ?? null;
        stdTempTarget = env.temp?.target ?? null;
        stdHumMin = env.humidity?.min ?? null;
        stdHumMax = env.humidity?.max ?? null;
        mortalityStd = getMortalityRange(birdName, l.birdAgeDays ?? age, { customStandards });
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
  const baseCount = (flock?.currentCount || 0) + (l.deathsCount || 0);
  const mortalityPct = baseCount > 0 ? ((l.deathsCount || 0) / baseCount) * 100 : 0;
  const isMortalityHigh = l.deathsCount > 0 && mortalityStd && mortalityPct > mortalityStd.maxPct;

  const hasProblem = tIsBad || hIsBad || isMortalityHigh;
  const accent: any = hasProblem ? 'warn' : 'accent';

  // 🆕 محاسبه روزهای گذشته از تاریخ لاگ (منطق ۳ روز)
  const daysSinceLog = (() => {
    try {
      const logDate = parseJ(l.date, 'yyyy/MM/dd', new Date());
      const today = new Date();
      return differenceInCalendarDays(today, logDate);
    } catch {
      return 0;
    }
  })();
  const isEditLocked = daysSinceLog > 3;


  // 🆕 BadgeOverflow badges
  const allBadges: BadgeItem[] = [];
  if (hasCorrections) allBadges.push({ key: 'corrections', node: <Tag tone="blue">اصلاح‌شده</Tag> });
  if (l.deathsCount > 0) {
    allBadges.push({ key: 'deaths', node: <Tag tone={isMortalityHigh ? "amber" : "blue"}>{fmt.count(l.deathsCount)} تلفات</Tag> });
  }

  return (
    <ExpandableCard
      id={l.id} ms={ms} accent={accent}
      index={fmt.count(i + 1)} iconEmoji="📋"
      title={flock?.name || '—'}
      subtitle={`${fmt.date(l.date)}${l.entryTime ? ` • ${fmt.code(l.entryTime)}` : ''}${l.birdAgeDays !== null && l.birdAgeDays > 0 ? ` • ${fmt.num(l.birdAgeDays)} روز` : ''}${birdName ? ` • ${birdName}` : ''}`}
      isOpen={isOpen} onToggle={onToggle}
      badge={<BadgeOverflow badges={allBadges} max={2} modalTitle={`برچسب‌های «${flock?.name || 'لاگ'}»`} />}
      stats={<>
        {l.temperature !== null && <span>🌡 {fmt.num(l.temperature)}°</span>}
        {l.humidity !== null && <span>💧 {fmt.num(l.humidity)}٪</span>}
        {l.feedDelivered !== null && <span>🌾 {fmt.num(l.feedDelivered)} کیلوگرم</span>}
        {l.waterAmount !== null && <span>💧 {fmt.num(l.waterAmount)} لیتر</span>}
      </>}
    >
      {flock ? <Row l="گله" v={createElement(EntityLink, { type: "flock", id: flock.id, label: flock.name })} /> : null}
      <LogSection title="🌡 محیط">
        <Grid2>
          {l.temperature !== null && <Row l="دما" v={`${fmt.num(l.temperature)} °C`} warn={tIsBad} />}
          {l.humidity !== null && <Row l="رطوبت" v={`${fmt.num(l.humidity)} ٪`} warn={hIsBad} />}
          {(l.temperatureMin !== null || l.temperatureMax !== null) && (
            <Row l="بازه دما" v={`${l.temperatureMin !== null ? fmt.num(l.temperatureMin) : '—'} تا ${l.temperatureMax !== null ? fmt.num(l.temperatureMax) : '—'} °C`} warn={tempMismatch} />
          )}
          {(l.humidityMin !== null || l.humidityMax !== null) && (
            <Row l="بازه رطوبت" v={`${l.humidityMin !== null ? fmt.num(l.humidityMin) : '—'} تا ${l.humidityMax !== null ? fmt.num(l.humidityMax) : '—'} ٪`} warn={humMismatch} />
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
            {l.feedDelivered !== null && <Row l="دان داده‌شده" v={`${fmt.num(l.feedDelivered)} کیلوگرم`} />}
            {l.feedConsumed !== null && l.feedConsumed !== undefined && l.feedConsumed !== l.feedDelivered && (
              <Row l="دان مصرف‌شده" v={`${fmt.num(l.feedConsumed)} کیلوگرم`} />
            )}
            {l.feedConsumed !== null && l.feedConsumed > 0 && flock && (flock.currentCount || 0) > 0 && (() => {
              const g = (l.feedConsumed * 1000) / (flock.currentCount || 1);
              const isWarn = g < 5 || g > 300;
              return <Row l="دان/پرنده" v={`${fmt.code(g.toFixed(1))} گرم`} warn={isWarn} />;
            })()}
            {l.feedRemaining !== null && <Row l="باقیمانده" v={`${fmt.num(l.feedRemaining)} کیلوگرم`} />}
            {l.waterAmount !== null && <Row l="آب" v={`${fmt.num(l.waterAmount)} لیتر`} />}
            {l.waterFillCount !== null && l.waterFillVolume !== null && (
              <Row l="روش آب" v={`${fmt.num(l.waterFillCount)} بار × ${fmt.num(l.waterFillVolume)} لیتر`} />
            )}
            {(() => {
              const effectiveFeed = (l.feedConsumed && l.feedConsumed > 0) ? l.feedConsumed : l.feedDelivered;
              if (!l.waterAmount || !effectiveFeed || effectiveFeed <= 0) return null;
              return <Row l="نسبت آب/دان" v={fmt.code((l.waterAmount / effectiveFeed).toFixed(2))} />;
            })()}
          </Grid2>
        </LogSection>
      )}

      {((l.eatingEggs || 0) + (l.fertileEggs || 0) + (l.brokenEggs || 0) + (l.otherEggs || 0)) > 0 && (
        <LogSection title="🥚 تخم">
          <Grid2>
            {l.eatingEggs ? <Row l="خوراکی" v={fmt.count(l.eatingEggs)} /> : null}
            {l.fertileEggs ? <Row l="نطفه‌دار" v={fmt.count(l.fertileEggs)} /> : null}
          </Grid2>
          <Grid2>
            {l.brokenEggs ? <Row l="شکسته" v={fmt.count(l.brokenEggs)} /> : null}
            {l.otherEggs ? <Row l="سایر" v={fmt.count(l.otherEggs)} /> : null}
          </Grid2>
          <Row l="مجموع" v={fmt.num((l.eatingEggs||0)+(l.fertileEggs||0)+(l.brokenEggs||0)+(l.otherEggs||0))} />
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
              <Row l="تعداد نمونه" v={fmt.count(weights.length)} />
              <Row l="میانگین" v={formatWeightGrams(avg)} />
            </Grid2>
            <Grid2>
              {l.weightGender ? (
                <Row l="جنسیت" v={GENDER_LABEL[l.weightGender] || l.weightGender} />
              ) : <div />}
              <Row l="ضریب تغییرات" v={`${fmt.num(cv)}٪`} />
            </Grid2>
            <div style={{ fontSize: 'var(--fs-xs)', color: cvLbl.color, fontWeight: 600, paddingRight: 4, marginTop: 2 }}>
              {cvLbl.text}
            </div>
            {metrics && metrics.hasData && (
              <Row l="یکنواختی" v={`${fmt.num(metrics.uniformityPct)}٪`} accent={metrics.uniformityPct >= 80} />
            )}
          </LogSection>
        );
      })()}

      {(() => {
        const { deaths, vaccines, medications } = getSafeHealthArrays(l);
        const hasDeaths = deaths.length > 0;
        const hasVaccines = vaccineEnabled && vaccines.length > 0;
        const hasMeds = medicineEnabled && medications.length > 0;
        if (!hasDeaths && !hasVaccines && !hasMeds) return null;
        return (
          <LogSection title="🏥 سلامت">
            {hasDeaths && (
              <Grid2>
                {deaths.map(d => (
                  <Row key={d.id} l="تلفات" v={`${fmt.num(d.count)} پرنده`} warn={isMortalityHigh} />
                ))}
              </Grid2>
            )}

            {hasVaccines && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: hasDeaths ? 8 : 0 }}>
                {vaccines.map(v => {
                  const methodLabel = v.method ? (VET_METHOD_LABEL[v.method] || v.method) : null;
                  const detail = [
                    v.name || 'بدون نام',
                    v.dose ? `دوز ${fmt.code(v.dose)}` : null,
                    methodLabel,
                    v.quantity ? `مقدار ${fmt.num(v.quantity)} ${v.unit || ''}` : null,
                  ].filter(Boolean).join(' • ');
                  return <Row key={v.id} l="واکسن" v={detail} />;
                })}
              </div>
            )}

            {hasMeds && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: (hasDeaths || hasVaccines) ? 8 : 0 }}>
                {medications.map(m => {
                  const methodLabel = m.method ? (VET_METHOD_LABEL[m.method] || m.method) : null;
                  const detail = [
                    m.name || 'بدون نام',
                    m.dose ? `دوز ${fmt.code(m.dose)}` : null,
                    methodLabel,
                    m.quantity ? `مقدار ${fmt.num(m.quantity)} ${m.unit || ''}` : null,
                    m.withdrawalDays ? `پرهیز ${fmt.num(m.withdrawalDays)} روز` : null,
                  ].filter(Boolean).join(' • ');
                  return <Row key={m.id} l="دارو" v={detail} />;
                })}
              </div>
            )}
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
          {(rawLog.corrections || []).map(corr => {
              const changeKeys = Object.keys(corr.changes);
              const pairedKeys = new Set<string>();
              const groupedChanges: string[][] = [];
              const PAIRS: [string, string][] = [
                ['temperatureMin', 'temperatureMax'],
                ['humidityMin', 'humidityMax'],
                ['eatingEggs', 'fertileEggs'],
                ['brokenEggs', 'otherEggs'],
                ['feedRemaining', 'feedWaste'],
                ['waterFillCount', 'waterFillVolume'],
              ];

              for (const [a, b] of PAIRS) {
                const sel = [a, b].filter(k => changeKeys.includes(k));
                if (sel.length > 0) {
                  groupedChanges.push(sel);
                  sel.forEach(k => pairedKeys.add(k));
                }
              }
              for (const k of changeKeys) {
                if (!pairedKeys.has(k)) groupedChanges.push([k]);
              }

              return (
                <div
                  key={corr.id}
                  style={{
                    padding: 'var(--pad-tight)',
                    background: 'var(--card)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--r-sm)',
                    opacity: corr.revoked ? 0.6 : 1,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6,
                    marginBottom: 8,
                  }}
                >
                  {/* Header */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 8,
                    borderBottom: '1px dashed var(--border)',
                    paddingBottom: 6,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, textDecoration: corr.revoked ? 'line-through' : 'none' }}>
                      <span style={{
                        fontFamily: 'monospace',
                        fontWeight: 700,
                        fontSize: 'var(--fs-xs)',
                        color: 'var(--muted)',
                      }}>{fmt.code(corr.timestamp)}</span>
                      <span style={{ color: 'var(--muted)', fontSize: 'var(--fs-xs)' }}>({corr.reason})</span>
                    </div>
                    {corr.revoked ? (
                      <span style={{
                        background: 'var(--danger-soft)',
                        color: 'var(--danger)',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: 'var(--r-sm)',
                        fontSize: 'var(--fs-2xs, 10px)',
                      }}>لغو شده</span>
                    ) : (
                      <button
                        type="button"
                        onClick={async (e) => {
                          e.stopPropagation();
                          const ok = await showConfirmAsync(
                            'لغو اصلاح',
                            `اصلاح ${fmt.code(corr.timestamp)} لغو شود؟ (مقادیر به حالت قبل برمی‌گردند)`
                          );
                          if (ok) onRevokeCorrection(corr.id);
                        }}
                        style={{
                          padding: '2px 8px',
                          background: 'transparent',
                          border: '1px solid var(--border)',
                          borderRadius: 'var(--r-sm)',
                          fontSize: 'var(--fs-2xs, 10px)',
                          color: 'var(--muted)',
                          cursor: 'pointer',
                          fontFamily: 'inherit',
                        }}
                      >↩️ لغو</button>
                    )}
                  </div>

                  {/* Body */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {groupedChanges.map((group, gIdx) => {
                      const content = group.map(k => {
                          const oldVal = (rawLog as any)[k];
                          const newVal = (corr.changes as any)[k];
                          const label = FIELD_LABEL[k] || k;

                          const formatFieldVal = (v: any) => {
                            if (v === null || v === undefined || v === '') return '—';
                            if (k === 'weightGender') {
                              const opts: any = { '': 'نامشخص', 'male': 'نر', 'female': 'ماده', 'mixed': 'مخلوط' };
                              return opts[v] || v;
                            }
                            return fmt.code(String(v));
                          };

                          return (
                            <Row
                              key={k}
                              l={
                                <span style={{
                                  fontSize: 'var(--fs-sm)',
                                  color: corr.revoked ? 'var(--muted)' : 'var(--text)',
                                  textDecoration: corr.revoked ? 'line-through' : 'none',
                                  wordBreak: 'break-word',
                                }}>
                                  {label}
                                </span>
                              }
                              v={
                                <span style={{ fontSize: 'var(--fs-sm)', display: 'flex', alignItems: 'center', gap: 4, textDecoration: corr.revoked ? 'line-through' : 'none', flexWrap: 'wrap' }}>
                                  {/* مقدار جدید (سبز) سمت راست */}
                                  <span style={{ color: corr.revoked ? 'var(--muted)' : 'var(--accent)', fontWeight: 700 }}>{formatFieldVal(newVal)}</span>
                                  {/* فلش به سمت مقدار جدید */}
                                  <span style={{ color: 'var(--muted)', fontSize: 'var(--fs-xs)' }}>→</span>
                                  {/* مقدار قبلی (قرمز) سمت چپ */}
                                  <span style={{ color: corr.revoked ? 'var(--muted)' : 'var(--danger)' }}>{formatFieldVal(oldVal)}</span>
                                </span>
                              }
                            />
                          );
                      });
                      if (group.length > 1) {
                        return <Grid2 key={gIdx}>{content}</Grid2>;
                      }
                      return <div key={gIdx} style={{ display: 'flex', flexDirection: 'column' }}>{content}</div>;
                    })}
                  </div>
                </div>
              );
            })}
        </LogSection>
      )}

      <CardActions actions={[
        { ...ACTION_PRESETS.EDIT, onClick: onEdit, hidden: (l.status || 'active') !== 'active', disabled: isEditLocked },
        { ...ACTION_PRESETS.CORRECT, onClick: onCorrect, hidden: (l.status || 'active') !== 'active' },
        { ...ACTION_PRESETS.HISTORY, onClick: () => onHistory?.(), hidden: onHistory === undefined },
        { ...ACTION_PRESETS.RESTORE, onClick: onRestore, hidden: (l.status || 'active') === 'active' },
        { ...ACTION_PRESETS.DELETE, onClick: onDelete, hidden: (l.status || 'active') === 'active' },
      ]} />
    </ExpandableCard>
  );
}
